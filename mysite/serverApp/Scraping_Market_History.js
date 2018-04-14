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
const DBCon = require("./DBConnection");

/*
*   const block
*/
const debugOn = debug.debugOn;

const apiClient = login_info.apiClient;
const apiClientValue = login_info.apiClientValue;
const logAction = 'Market scraping';

var accontIndex = 0;

let cookies = login.loadCookieSync(accontIndex);

var csrftoken = cookies.csrftoken;
var sessionid = cookies.sessionid;
var cookieString = 'sessionid=' + sessionid + '; csrftoken=' + csrftoken;
debug.debugPrint(cookieString);

function requestShop(err, res) {
  if (err) {
    debug.debugPrint("requestShop: it did not work: " + err)
    DBCon.insertLogInfo(logAction, "requestShop: it did not work: " + err);
  } else {
    //debug.debugPrint(res.request.headers);
    //debug.debugPrint(res.headers);
    //debug.printRequestStatus(res);
    if (err == null) {
      debug.debugPrint('path = ' + res.req.path, 1);

      var con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
      con.connect(function (err) {
        if (err) { throw err };
        //debug.debugPrint("Connected!");
      });

      var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
      var root = HTMLParser.parse(res.body);
      var table = root.querySelector('.table');
      if (table) {
        var rows = table.childNodes[3];

        for (var trIndx = 0; trIndx < rows.childNodes.length; trIndx++) {
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
              cardDealDate = cardDealDate.replace('"', '');
            }
            cardDealDate = parseInt(cardDealDate); //data-timestamp
            cardDealDate = new Date(cardDealDate * 1000 - tzoffset);
            cardDealDate = cardDealDate.toISOString().slice(0, 19);

            if (trIndx == 1) {
              debug.debugPrint('Row numbers = ' + rows.childNodes.length + ' first date: ' + cardDealDate);
              DBCon.insertLogInfo(logAction, 'Row numbers = ' + rows.childNodes.length + ' first date: ' + cardDealDate);
            }

            let queryString = "INSERT INTO thetale.market_history VALUES ("
              + "'" + cardDealDate + "','" + cardName + "'," + cardPrice + ",1,'" + card_description + "','" + card_class + "')";
            debug.debugPrint(queryString, 1);
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
  var apiURL = 'https://the-tale.org/shop/market-history?page=' + pageNumber;
  debug.debugPrint('Scraping: ' + (new Date()) + ' ' + apiURL);
  DBCon.insertLogInfo(logAction, 'Scraping: ' + (new Date()) + " " + apiURL);
  request({
    method: "GET",
    headers: {
      'Cookie': cookieString,
      referer: 'https://the-tale.org/'
    },
    url: apiURL
    , form: { 'csrfmiddlewaretoken': csrftoken }
  }, requestShop);

  if (pageNumber === 1) {
    setTimeout(function () { getMarketHistoryFromPage(pageNumber); }, 300000);
  }
}


let apiURL = 'https://the-tale.org/accounts/messages/api/new-messages-number?api_version=0.1&' + login_info.apiClient;
request({
  method: "GET",
  headers: {
    'Cookie': cookieString,
    referer: 'https://the-tale.org/'
  },
  url: apiURL
  , form: { 'csrfmiddlewaretoken': csrftoken }
}, (err, res) => {
  if (err) {
    debug.debugPrint("requestLogin: it did not work: " + err)
  } else {
    //debug.printRequestStatus(res);
    if (res.body[0] == '{') { // we are login in the game, lets scraping market history
      let i = 1;
      while (i>0){
        getMarketHistoryFromPage(i);
        i--;
      }
    } else { // something wrong, we need to login
      login.login(accontIndex);
    }
  }
});
