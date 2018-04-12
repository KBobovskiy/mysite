/**
* Use to Scraping market history from https://the-tale.org/shop/market-history
* @module Scraping_Market_History
*/
const request = require('request');
const mysql = require('mysql');
const HTMLParser = require('fast-html-parser');
const login_info = require("./login_info");

/*
*   const block
*/
const debugOn = login_info.debugOn;
const mysql_Host = login_info.mysql_Host;
const mysql_User = login_info.mysql_User;
const mysql_Password = login_info.mysql_Password;

const apiClient = login_info.apiClient;
const apiClientValue = login_info.apiClientValue;

let cookies = login_info.getCookieFromString('');

var csrftoken = cookies.csrftoken;
var sessionid = cookies.sessionid;

// вывод отладочной информации
function debugPrint(message, dontPrint) {
  if (debugOn === true && !dontPrint) {
    console.log(message);
  }
}


function requestShop(err, res) {
  if(err){
      console.log("requestShop: it did not work: " + err)
  } else {
    //console.log(res.request.headers);
    //console.log(res.headers);
    //login_info.printRequestStatus(res);
    if (err == null) {
      console.log('path = ' + res.req.path);

      var con = mysql.createConnection({ host: mysql_Host, user: mysql_User, password: mysql_Password });
      con.connect(function(err) {
        if (err) {throw err};
        //console.log("Connected!");
      });

      var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
      var root = HTMLParser.parse(res.body);
      var table = root.querySelector('.table');
      if (table) {
        var rows = table.childNodes[3];

        for (var trIndx = 0; trIndx<rows.childNodes.length; trIndx++) {
          var row = rows.childNodes[trIndx];
          if (row.tagName) {
            var cardName = row.childNodes[1].childNodes[1].childNodes[0].rawText.trim();
            var cardPrice = row.childNodes[3].childNodes[0].rawText.trim();
            var card_description = row.childNodes[1].childNodes[1].rawAttrs.split('title')[1].split('"')[1];
            var card_class = row.childNodes[1].childNodes[1].classNames[0];
            var cardDealDate = row.childNodes[5].childNodes[0].rawAttrs.trim();
            cardDealDate = cardDealDate.split('data-timestamp=');
            cardDealDate = cardDealDate[1];
            while (cardDealDate.includes('"')) {
              cardDealDate = cardDealDate.replace('"','');
            }
            cardDealDate = parseInt(cardDealDate); //data-timestamp
            cardDealDate = new Date(cardDealDate*1000 - tzoffset);
            cardDealDate = cardDealDate.toISOString().slice(0, 19);

            if (trIndx == 1) {
                console.log('rows.childNodes = '+rows.childNodes.length + ' first date: ' + cardDealDate);
            }

            let queryString = "INSERT INTO thetale.market_history VALUES ("
              +"'"+cardDealDate+"','"+cardName+"',"+cardPrice+",1,'"+card_description+"','"+card_class+"')";
            debugPrint(queryString,1);
            try {
              con.query(queryString, function (err, result, fields) { /*if (err) throw err; console.info(result);*/ });
            }
            catch (err) {
              console.info(err);
            }
          }
        }
      }
      con.end();
      con = null;
    }
  }
}

function getMarketHistoryFromPage(pageNumber) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  debugPrint(cookieString);
  var apiURL = 'https://the-tale.org/shop/market-history?page='+pageNumber;
  request({
    method: "GET",
    headers: {
      'Cookie': cookieString,
      referer: 'https://the-tale.org/'
      },
    url: apiURL
    ,form: {'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestShop);
  if (pageNumber<3) {setTimeout(function() {getMarketHistoryFromPage(pageNumber+1);},2000);}
}

setTimeout(function() {getMarketHistoryFromPage(1);},2000);

console.log('EoF');
