/**
* Common informarion about accounts
* @module login_info
*/
var fs = require('fs');

const debugOn = true;

const mysql_Host = "localhost";
const mysql_User = "node";
const mysql_Password = "321654";

const apiClient = 'api_client=Badj-0.002';
const apiClientValue = 'Badj-0.002';

// вывод отладочной информации
function debugPrint(message, dontPrint) {
  if (debugOn === true && !dontPrint) {
    console.log(message);
  }
}

// Получить объект с данными из строки с кукаки
function getCookieFromString(strCokkie) {
  strCokkie = fs.readFileSync('cookie.sav', "utf8");
  var result = {};
  var arrCookie = strCokkie.split(';')
  var i = 0;
  while (i<arrCookie.length) {
    var keyAndValue = arrCookie[i].split('=');
    var key = keyAndValue[0].replace(/\s+/g,'');
    var value = keyAndValue[1].replace(/\s+/g,'');
    if (key == 'csrftoken') {
      result.csrftoken = value;
    }
    if (key == 'sessionid') {
      result.sessionid = value;
    }
    i++;
  }
  return result;
}
;
function saveCookieStringToFile(cookieString)  {
  debugPrint(cookieString);
  fs.writeFileSync('cookie.sav', cookieString, function (err) { if (err) throw err; debugPrint('Saved cookie string!'); });

}

module.exports.mysql_Host = mysql_Host;
module.exports.mysql_User = mysql_User;
module.exports.mysql_Password = mysql_Password;
module.exports.apiClient = apiClient;
module.exports.apiClientValue = apiClientValue;
module.exports.getCookieFromString = getCookieFromString;
module.exports.saveCookieStringToFile  = saveCookieStringToFile;
