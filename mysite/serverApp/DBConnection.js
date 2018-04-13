/**
* Functions for working with MySQL DB
*
*   see @module login_info
*   see @module debug
*/

const login_info = require("./login_info");
const mysql = require('mysql');
const debug = require("./debug");

/**
 * Insert into thetale.logs log info
 * @param {string} logAction 
 * @param {string} logInfo 
 */
function insertLogInfo(logAction, logInfo) {
    var con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
    con.connect(function (err) {
        if (err) { throw err };
    });
    let queryString = "INSERT INTO thetale.logs (`action`, `info`) VALUES ('"+logAction+"','"+logInfo+"')";
    debug.debugPrint(queryString, 1);
    try {
        con.query(queryString, function (err, result, fields) {
            con.end();
            con = null;
        });
    }
    catch (err) {
        debug.debugPrint(err);
        con.end();
        con = null;
    }
}

module.exports.insertLogInfo = insertLogInfo;