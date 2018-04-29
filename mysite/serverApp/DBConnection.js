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

/**
 * insert hero stats info in DB
 * * @param {object} heroInfo 
 */
function saveHeroInfo(heroInfo) {
    if (heroInfo.id) {
        let queryString = "INSERT INTO `thetale`.`heroes_info` (\
            `account_id`, `turn_number`, `name`, `gender`, `race`\
            , `health`, `max_health`, `level`, `money`, `alive` \
            , `experience`, `experience_to_level`, `max_bag_size`, `power_physical`, `power_magic` \
            , `move_speed`, `loot_items_count`, `initiative`, `energy`\
            , `in_pvp_queue`, `mode`, `enemy`)\
             VALUES ("+heroInfo.id+", "+heroInfo.turnNumber+", '"+heroInfo.name+"', '"+heroInfo.gender+"', '"+heroInfo.race+"'\
             , "+heroInfo.health+", "+heroInfo.max_health+", "+heroInfo.level+", "+heroInfo.money+", "+heroInfo.alive+"\
             , "+heroInfo.experience+", "+heroInfo.experience_to_level+", "+heroInfo.max_bag_size+", "+heroInfo.physical_power+", "+heroInfo.magic_power+"\
             , "+heroInfo.move_speed+", "+heroInfo.loot_items_count+", "+heroInfo.initiative+", "+heroInfo.energy+"\
             , "+heroInfo.in_pvp_queue+", '', '');";
        debug.debugPrint(queryString, 1);
        var con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
        con.connect(function (err) {
            if (err) { throw err };
        });
        try {
            con.query(queryString, function (err, result, fields) {
                if (result.affectedRows !== 1 && result.serverStatus !== 2) {
                    debug.debugPrint(queryString, 0);
                    debug.debugPrint(result, 0);
                }
                con.end();
                con = null;
            });
        }
        catch (err) {
            debug.debugPrint('saveHeroInfo() error: ' + err);
            con.end();
            con = null;
        }
    } else {
        debug.debugPrint('saveHeroInfo() there are nothing to insert into DB!', 0);
    }
}

/**
 * insert Turn info in DB
 * * @param {object} turnInfo
 */
function saveTurnInfo(turnInfo){

    if (turnInfo.number) {
        var con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
        con.connect(function (err) {
            if (err) { throw err };
        });
        let queryString = "INSERT INTO `thetale`.`turns` (`number`, `verbose_date`, `verbose_time`) VALUES ('"+turnInfo.number+"', '"+turnInfo.verbose_date+"', '"+turnInfo.verbose_time+"');";
        debug.debugPrint(queryString, 1);
        try {
            con.query(queryString, function (err, result, fields) {
                if (result.affectedRows !== 1 && result.serverStatus !== 2) {
                    debug.debugPrint(queryString, 0);
                    debug.debugPrint(result, 0);
                }
                con.end();
                con = null;
            });
        }
        catch (err) {
            debug.debugPrint('saveTurnInfo() error: ' + err);
            con.end();
            con = null;
        }
    } else {debug.debugPrint('saveTurnInfo() there are nothing to insert into DB!', 0);}
}


module.exports.insertLogInfo = insertLogInfo;
module.exports.saveTurnInfo = saveTurnInfo;
module.exports.saveHeroInfo = saveHeroInfo;