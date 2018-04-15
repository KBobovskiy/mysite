var request = require('request');
var fs = require('fs');
var HTMLParser = require('fast-html-parser');
const debug = require("./debug");

const debugOn = true;
var mysql = require('mysql');
const mysql_Host = "localhost";
const mysql_User = "node";
const mysql_Password = "321654";
const requestTimeout = 31000; // миллисекунды


var apiClient = 'api_client=Badj-0.002';
var apiClientValue = 'Badj-0.002';

var csrftoken='JguoToqJzNzrwdPWTxtirsQ6v2AB410F7yKeyTi1qm3CL5cPew4oGcIFTtnkHMLe';//; expires=Sat, 09-Mar-2019 15:58:28 GMT; HttpOnly; Max-Age=31449600; Path=/',
var sessionid='g4rpav872lt5fzqk85376azl7qq1qmgf';// expires=Sat, 24-Mar-2018 15:58:28 GMT; HttpOnly; Max-Age=1209600; Path=/' ]

var arrCookie = fs.readFileSync('cookie.sav', "utf8");
arrCookie = arrCookie.split(';')
var i = 0;
while (i<arrCookie.length) {
  var keyAndValue = arrCookie[i].split('=');
  var key = keyAndValue[0].replace(/\s+/g,'');
  var value = keyAndValue[1].replace(/\s+/g,'');
  if (key == 'csrftoken') {
    csrftoken = value;
  }
  if (key == 'sessionid') {
    sessionid = value;
  }
  i++;
}

var requestData = {
  //"username":"myUsername",
  //"password":"myPassword"
  "api_version" : "1.0",
  //"csrfmiddlewaretoken" : "wxiefxk7i6kvUeyi4jU2xO0B96RwvJc",
  "api_client" : "Badj-0.01"
  }

var cookie = '';

var url_GET_api_info = 'http://the-tale.org/api/info?api_version=1.0&'+apiClient;

// вывод отладочной информации
function debugPrint(message, dontPrint) {
  if (debugOn === true && !dontPrint) {
    console.log(message);
  }
}

function printCookie(cookie) {
  console.log('cookie: '+cookie);
}

function saveHeadersToFile(headers) {

  var currentDate = new Date();
  currentDate = currentDate.toISOString();

  fs.appendFile('headers_data.txt', '\n'+currentDate+'\n', function (err) { if (err) throw err; console.log('Saved headers (date - time)!'); });
  fs.appendFile('headers_data.txt', headers.date+'\n', function (err) { if (err) throw err; console.log('Saved headers!'); });
  var i = 0;
  while (i < headers['set-cookie'].length) {
    fs.appendFile('headers_data.txt', headers['set-cookie'][i]+'\n', function (err) { if (err) throw err; console.log('Saved headers!'); });
    i++;
  }
}

function saveBodyToFile(body) {

  var currentDate = new Date();
  currentDate = currentDate.toISOString();

  fs.appendFile('headers_data.txt', '\n'+currentDate+'\n', function (err) { if (err) throw err; console.log('Saved headers (date - time)!'); });
  fs.appendFile('headers_data.txt', body+'\n', function (err) { if (err) throw err; console.log('Saved headers!'); });
}

function saveGameInfoToFile(gameInfo) {

  var currentDate = new Date();
  currentDate = currentDate.toISOString();

  fs.appendFile('game_body.txt', '\n'+currentDate+'\n', function (err) { if (err) throw err; console.log('Saved game body (date - time)!'); });
  fs.appendFile('game_body.txt', gameInfo+'\n', function (err) { if (err) throw err; console.log('Saved game body!'); });
}

function saveCookieStringToFile()  {
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrftoken;
  fs.writeFile('cookie.sav', cookieString, function (err) { if (err) throw err; console.log('Saved cookie string!'); });
}


function request_template(err, res, cookie) {
    if(err){
        console.log("it did not work: " + err)
    }
        debug.printRequestStatus(res);
        //console.log("heres the cookie: "+res.headers['set-cookie']) //returns cookie in correct format
        cookie = res.headers['set-cookie']
        //console.log(cookie);
        printCookie(cookie);

        //requesting data
        /*
        request({
          url: 'http://the-tale.org/accounts/third-party/tokens/api/request-authorisation',
          method: "GET",
          header: {
            'set-cookie': cookie
          }
        },function(err,response){
            console.log(res.headers) // one of the headers says user is not authorised

        }
        )
        */
}

function requestAuthorisation(err, res, cookie) {
    if(err){
        console.log("it did not work: " + err)
    }
        debug.printRequestStatus(res);
        cookie = res.headers['set-cookie'];
        console.log(res.headers); // one of the headers says user is not authorised

        //requesting data
        /*
        request({
          url: 'http://the-tale.org/accounts/third-party/tokens/api/request-authorisation',
          method: "GET",
          header: {
            'set-cookie': cookie
          }
        },function(err,response){
            console.log(res.headers) // one of the headers says user is not authorised

        }
        )
        */
}

function requestAPIVersion(err, res, cookie) {
  if(err){
      console.log("it did not work: " + err)
  }
    debug.printRequestStatus(res);
    if (false) {
      // Reqest for authorisation Application to control access
      cookie = res.headers['set-cookie'];
      var cookieString = res.headers['set-cookie'][0].split(";")[0];
      var csrfmiddlewaretoken = cookieString.split("=")[1];
      var authorisationURL = 'http://the-tale.org/accounts/third-party/tokens/api/request-authorisation?api_version=1.0&'+apiClient;
      // request({
      //   method: "POST",
      //   headers: { 'Cookie': cookieString},
      //   url: authorisationURL,
      //   form: {'application_name':apiClientValue, 'application_info':'App_info', 'application_description':'App_decription', 'csrfmiddlewaretoken':csrfmiddlewaretoken}
      // },requestAuthorisation);
    } else {
      // var csrfmiddlewaretoken = csrftoken;
      // var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
      // var authorisationStateURL = 'http://the-tale.org/accounts/third-party/tokens/api/authorisation-state?api_version=1.0&'+apiClient;
      // request({
      //   method: "GET",
      //   headers: { 'Cookie': cookieString},
      //   url: authorisationStateURL
      // },requestAuthorisationState);
    }
}

function requestAuthorisationState(err, res) {
  if(err){
      console.log("AuthorisationState: it did not work: " + err)
  } else {
    debug.printRequestStatus(res);
    console.log(res.headers);
    var cookie = res.headers['set-cookie'];
    var csrfmiddlewaretoken = csrftoken;
    var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
    saveHeadersToFile(res.headers);
  }
}

function requestLogin(err, res) {
  if(err){
      console.log("requestLogin: it did not work: " + err)
  } else {
    debug.printRequestStatus(res);
    console.log(res.headers);
    var cookie = res.headers['set-cookie'];
    for (var i = 0; i<cookie.length; i++) {
      cook = cookie[i];
      cook = cook.split(';');
      cook = cook[0].split('=');
      if (cook[0] == 'sessionid') {
        sessionid = cook[1];
      } else if (cook[0] == 'csrftoken'){
        csrftoken = cook[1];
      }
    }

    var csrfmiddlewaretoken = csrftoken;
    var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
    saveHeadersToFile(res.headers);
    saveCookieStringToFile();

    // var marketURL = 'http://the-tale.org/shop/';
    // request({
    //   method: "GET",
    //   headers: { 'Cookie': cookieString},
    //   url: marketURL
    // },requestMarket);
  }
}

function requestMarket(err, res) {
  if(err){
      console.log("requestMarket: it did not work: " + err)
  } else {
    debug.printRequestStatus(res);
    console.log(res.headers);
    saveBodyToFile(res.body);
  }
}

function requestGameInfo(err, res) {
  if(err){
      console.log("requestGameInfo: it did not work: " + err)
  } else {
    debug.printRequestStatus(res);
    console.log(res.headers);
    if (err == null) {
      saveGameInfoToFile(res.body);
    }
  }
}

function requestHelp(err, res) {
  if(err){
      console.log("requestHelp: it did not work: " + err)
  } else {
    debug.printRequestStatus(res);
    console.log(res.headers);
    if (err == null) {
      console.log(res.body);
    }
  }
}

function requestShop(err, res) {
  if(err){
      console.log("requestShop: it did not work: " + err)
  } else {
    //debug.printRequestStatus(res);
    //console.log(res.headers);
    if (err == null) {
      console.log(res.req.path);

      var con = mysql.createConnection({ host: mysql_Host, user: mysql_User, password: mysql_Password });
      con.connect(function(err) {
        if (err) {throw err};
        //console.log("Connected!");
      });



      var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
      var root = HTMLParser.parse(res.body);
      var table = root.querySelector('.table');
      var rows = table.childNodes[3];
      console.log(rows.childNodes.length);

      for (var trIndx = 0; trIndx<rows.childNodes.length; trIndx++) {
        var row = rows.childNodes[trIndx];
        if (row.tagName) {
          var cardName = row.childNodes[1].childNodes[1].childNodes[0].rawText.trim();
          var cardPrice = row.childNodes[3].childNodes[0].rawText.trim();
          var cardDealDate = row.childNodes[5].childNodes[0].rawAttrs.trim();
          cardDealDate = cardDealDate.split('data-timestamp=');
          cardDealDate = cardDealDate[1];
          while (cardDealDate.includes('"')) {
            cardDealDate = cardDealDate.replace('"','');
          }
          cardDealDate = parseInt(cardDealDate); //data-timestamp
          cardDealDate = new Date(cardDealDate*1000 - tzoffset);
          cardDealDate = cardDealDate.toISOString().slice(0, 19);

          var card_description = row.childNodes[1].childNodes[1].rawAttrs.split('title')[1].split('"')[1];
          var card_class = row.childNodes[1].childNodes[1].classNames[0];
          //console.log("" + cardName + " цена: " + cardPrice + " дата: " +


          //var querySelect = "select * from thetale.market_history where date_time = '"+cardDealDate+"' and card_name = '"+cardName+"'";
          var queryString = "INSERT INTO thetale.market_history VALUES ("
            +"'"+cardDealDate+"','"+cardName+"',"+cardPrice+",1,'"+card_description+"','"+card_class+"')";
          debugPrint(queryString);
          try {
            con.query(queryString, function (err, result, fields) { /*if (err) throw err; console.log(result);*/ });
          }
          catch (err) {
            console.log(err);
          }
        }
      }

      con.end();
      con = null;

    }
  }
}



//request post request
if (false) {
  request({
    url: url_GET_api_info,
    method: "GET",
    json: requestData}
    , requestAPIVersion);
}


// request authorisation for Application
if (false) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  var authorisationURL = 'http://the-tale.org/accounts/third-party/tokens/api/request-authorisation?api_version=1.0&'+apiClient;
  request({
    method: "POST",
    headers: { 'Cookie': cookieString},
    url: authorisationURL,
    form: {'application_name':apiClientValue, 'application_info':'App_info', 'application_description':'App_decription', 'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestAuthorisation);

}

//authorisation state
if (false) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  var authorisationStateURL = 'http://the-tale.org/accounts/third-party/tokens/api/authorisation-state?api_version=1.0&'+apiClient;
  request({
    method: "GET",
    headers: { 'Cookie': cookieString},
    url: authorisationStateURL
  },requestAuthorisationState);
}

// login
if (false) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  var loginURL = 'http://the-tale.org/accounts/auth/api/login?api_version=1.0&'+apiClient;
  request({
    method: "POST",
    headers: { 'Cookie': cookieString},
    url: loginURL,
    form: {'email':'kbobovskiy@yandex.ru', 'password':'password', 'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestLogin);
}

// game/hero info
if (false) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  console.log("cookieString: " + cookieString);
  var gameInfoURL = 'http://the-tale.org/game/api/info?api_version=1.9&'+apiClient;
  request({
    method: "GET",
    headers: { 'Cookie': cookieString},
    url: gameInfoURL,
    form: {'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestGameInfo);
}

// game help
if (false) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  //console.log("cookieString: " + cookieString);
  var helpAPIURL = 'http://the-tale.org/game/abilities/help/api/use?api_version=1.0&'+apiClient;
  request({
    method: "POST",
    headers: { 'Cookie': cookieString},
    url: helpAPIURL,
    form: {'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestHelp);
}

// game shop
if (false) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  //console.log("cookieString: " + cookieString);
  var HistoryURL = 'http://the-tale.org/shop/market-history?page=2';
  request({
    method: "GET",
    headers: { 'Cookie': cookieString},
    url: HistoryURL,
    form: {'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestShop);
}

function getMarketHistoryFromPage(pageNumber) {
  var csrfmiddlewaretoken = csrftoken;
  var cookieString = 'sessionid='+sessionid+'; csrftoken='+csrfmiddlewaretoken;
  var HistoryURL = 'http://the-tale.org/shop/market-history?page='+pageNumber;
  request({
    method: "GET",
    headers: { 'Cookie': cookieString},
    url: HistoryURL,
    form: {'csrfmiddlewaretoken':csrfmiddlewaretoken}
  },requestShop);
  if (pageNumber<3) {setTimeout(function() {getMarketHistoryFromPage(pageNumber+1);},2000);}
}

setTimeout(function() {getMarketHistoryFromPage(1);},2000);

console.log('EoF');

// var mysql = require('mysql');
//
// var con = mysql.createConnection({
//   host: "localhost",
//   user: "node",
//   password: "321654"
// });
//
// con.connect(function(err) {
//   if (err) {throw err};
//   console.log("Connected!");
// });

// con.query("SELECT * FROM thetale.heroes", function (err, result, fields) {
//   if (err) throw err;
//   console.log(result);
// });

//console.log('finish');
