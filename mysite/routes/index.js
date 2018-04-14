var express = require('express');
var router = express.Router();

router.get('/*', function(req, res, next){ 
  res.setHeader('Last-Modified', (new Date()).toUTCString());
  next(); 
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Сказка. The-tale.org'});
});

/* GET market history page. */
router.get('/markethistory', function(req, res, next) {
    getCardListAndRenderPage(req, res, next);
  });
  
router.get('/getCardHistory?*', function(req, res, next) {
  let getURL = decodeURI(req.url);
  getURL = getURL.split('=')[1];
  //console.info('req.url = '+getURL);
  let mysql = require('mysql');
  let login_info = require("../serverApp/login_info");
  let con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
  con.connect(function(err) {
    if (err) {throw err};
    //console.log("Connected!");
  });

  var queryString = "SELECT date_time date, price FROM thetale.market_history where card_name='"+getURL+"'  order by date desc";
  //console.info(queryString);
  try {
    con.query(queryString, (err, result, fields) => {
      if (err) throw err;
      //console.info(result);
      let answerData = JSON.stringify(result);
      //console.info(answerData);
      res.send(answerData);
    });
    con.end();
    con = undefined;
   }
  catch (err) {
    console.info(err);
    res.send('');
  }
});

function getCardListAndRenderPage(req, res, next) {
  let mysql = require('mysql');
  let login_info = require("../serverApp/login_info");
  let cards = ["can't get card list"];
  let LastPrice = "Последняя цена:";
  var queryString = "SELECT distinct card_name FROM thetale.market_history order by card_name";
  //console.info(queryString);
  let con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
  con.connect(function(err) {
    if (err) {throw err};
    //console.log("Connected!");
  });

  try {
    con.query(queryString, (err, result, fields) => {
      if (err) throw err;
      //console.info(result);
      let cards = [];
      result.forEach((item, index) => {
        cards.push(item.card_name);
      });
      //console.info(cards);
      res.render('market_history', { titlen: 'Market history', cards: cards, LastPrice:LastPrice});
    });
    con.end();
    con = undefined;
   }
  catch (err) {
    console.info(err);
    res.render('market_history', { titlen: 'Market history', cards: cards});
  }
}

module.exports = router;
