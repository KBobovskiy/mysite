const Debug = require("../serverApp/debug.js");

/** Returns random number in miliseconds for sleeping */
function getRandomMS(min, max) {
  return (Math.random() * (max - min) + min) * 1000;
}

function NumberWithLeadingZero(number, stringLength) {
  var str = "" + number;
  if (stringLength > 0) {

    var str = "0";
    for (var i = 2; i <= stringLength; i++) {
      str = str + "0";
    }
    str = str + number;
    str = str.slice(-stringLength);
  }
  return str;
}

function getNow() {
  var nowDateTime = new Date();
  nowDateTime.setHours(nowDateTime.getHours() + 3);
  nowDateTime = nowDateTime.toISOString();
  nowDateTime = nowDateTime.slice(0, 19).replace('T', ' ');
  Debug.debugPrint("Date time = " + nowDateTime);
  return nowDateTime;
}

module.exports.getRandomMS = getRandomMS;
module.exports.getNow = getNow;
module.exports.NumberWithLeadingZero = NumberWithLeadingZero;