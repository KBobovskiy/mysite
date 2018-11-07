const Debug = require("../serverApp/debug.js");

/** Returns random number in miliseconds for sleeping */
function getRandomMS(min, max) {
  return (Math.random() * (max - min) + min) * 1000;
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