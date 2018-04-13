/**
* Use to Scraping market history from https://the-tale.org/shop/market-history
* @module Scraping_Market_History
*   see @module login_info
*   see @module debug
*/
const request = require('request');
const mysql = require('mysql');
const HTMLParser = require('fast-html-parser');
const login_info = require("./login_info");
const login = require('./login');
const debug = require("./debug");

/*
*   const block
*/
const debugOn = debug.debugOn;
const mysql_Host = login_info.mysql_Host;
const mysql_User = login_info.mysql_User;
const mysql_Password = login_info.mysql_Password;

const apiClient = login_info.apiClient;
const apiClientValue = login_info.apiClientValue;

var accontIndex = 0;

let cookies = login.loadCookieSync(accontIndex);

var csrftoken = cookies.csrftoken;
var sessionid = cookies.sessionid;

function requestShop(err, res) {
  if(err){
    debug.debugPrint("requestShop: it did not work: " + err)
  } else {
    //debug.debugPrint(res.request.headers);
    //debug.debugPrint(res.headers);
    //debug.printRequestStatus(res);
    if (err == null) {
      debug.debugPrint('path = ' + res.req.path);

      var con = mysql.createConnection({ host: mysql_Host, user: mysql_User, password: mysql_Password });
      con.connect(function(err) {
        if (err) {throw err};
        //debug.debugPrint("Connected!");
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
              debug.debugPrint('rows.childNodes = '+rows.childNodes.length + ' first date: ' + cardDealDate);
            }

            let queryString = "INSERT INTO thetale.market_history VALUES ("
              +"'"+cardDealDate+"','"+cardName+"',"+cardPrice+",1,'"+card_description+"','"+card_class+"')";
            debug.debugPrint(queryString,1);
            try {
              con.query(queryString, function (err, result, fields) { /*if (err) throw err; debug.debugPrint(result);*/ });
            }
            catch (err) {
              debug.debugPrint(err);
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
  debug.debugPrint(cookieString);
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

debug.debugPrint('EoF');
