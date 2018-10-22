/**
* Functions for working with MySQL DB
*
*   see @module login_info
*   see @module debug
*/

const login_info = require("./login_info");
const mysql = require('mysql');
const debug = require("./debug");
const util = require('util');

/**
 * Send insert into DB
 * 
 * @param {string} queryString 
 * @param {string} logAction 
 */
function insertQuery(queryString, logAction) {
    if (!queryString) {
        return;
    }
    var con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
    con.connect(function (err) {
        if (err) { throw err };
    });
    debug.debugPrint(queryString, 0);
    try {
        con.query(queryString, function (err, result, fields) {
            if (result && result.affectedRows !== 1 && result.serverStatus !== 2) {
                debug.debugPrint(queryString, 0);
                debug.debugPrint(result, 0);
            } else if (!debug.isNULL(err)) {
                debug.debugPrint(err, 0);
            }
        });
    }
    catch (err) {
        debug.debugPrint(logAction + ' error: ' + err);
    }
    finally {
        con.end();
        con = null;
    }
}

/** Send SELECT to DB */
async function selectQuery(queryString, logAction) {
    if (!queryString) {
        return;
    }
    var con = mysql.createConnection({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });
    const query = util.promisify(con.query).bind(con);
    var row = await (async () => {
        try {
            const rows = await query(queryString);
            return rows;
        } finally {
            con.end();
            con = null;
        }
    })();
    return row;
}

/** Insert into thetale.logs log info
 * @param {string} logAction 
 * @param {string} logInfo 
 */
function insertLogInfo(logAction, logInfo) {
    let queryString = "INSERT INTO thetale.logs (`action`, `info`) VALUES ('" + logAction + "','" + logInfo + "')";
    insertQuery(queryString, 'insertLogInfo()');
}

/** insert hero stats info in DB
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
             VALUES ("+ heroInfo.id + ", " + heroInfo.turnNumber + ", '" + heroInfo.name + "', '" + heroInfo.gender + "', '" + heroInfo.race + "'\
             , "+ heroInfo.health + ", " + heroInfo.max_health + ", " + heroInfo.level + ", " + heroInfo.money + ", " + heroInfo.alive + "\
             , "+ heroInfo.experience + ", " + heroInfo.experience_to_level + ", " + heroInfo.max_bag_size + ", " + heroInfo.physical_power + ", " + heroInfo.magic_power + "\
             , "+ heroInfo.move_speed + ", " + heroInfo.loot_items_count + ", " + heroInfo.initiative + ", " + heroInfo.energy + "\
             , "+ heroInfo.in_pvp_queue + ", '', '');";
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
            });
        }
        catch (err) {
            debug.debugPrint('saveHeroInfo() error: ' + err);
        }
        finally {
            con.end();
            con = null;
        }
    } else {
        debug.debugPrint('saveHeroInfo() there are nothing to insert into DB!', 0);
    }
}

/** insert Turn info in DB
 * * @param {object} turnInfo
 */
function saveTurnInfo(turnInfo) {
    let logAction = 'saveTurnInfo()';
    if (turnInfo.number) {
        let queryString = "INSERT INTO `thetale`.`turns` (`number`, `verbose_date`, `verbose_time`) VALUES ('" + turnInfo.number + "', '" + turnInfo.verbose_date + "', '" + turnInfo.verbose_time + "');";
        insertQuery(queryString, logAction);
    } else {
        debug.debugPrint(logAction + ' there are nothing to insert into DB!', 0);
    }
}



/**	Insert hero position on the map to DB
 * 
 * @param {object.account_id, object.turnNumber, object.x, object.y, object.dx, object.dy} position
 */
function saveHeroPosition(position) {
    let logAction = 'saveHeroPosition()';
    if (position) {
        let queryString = "INSERT INTO `thetale`.`positions` (`account_id`, `turn_number`, `x`, `y`, `dx`, `dy`) VALUES ('" + position.account_id + "','" + position.turnNumber + "','" + position.x + "', '" + position.y + "', '" + position.dx + "', '" + position.dy + "');";
        insertQuery(queryString, logAction);
    } else {
        debug.debugPrint(logAction + ' there are nothing to insert into DB!', 0);
    }
}


/**	Insert place short information to DB
 * 
 * @param {object.id, object.name, object.x, object.y, object.size, object.specialization, object.frontier} place
 */
function savePlace(place) {
    let logAction = 'savePlace()';
    if (place) {
        let queryString = "INSERT INTO `thetale`.`places` (`id`, `name`, `size`, `specialization`, `frontier`, `x`, `y`) VALUES ('" + place.id + "', '" + place.name + "', '" + place.size + "', '" + place.specialization + "', '" + (0 + place.frontier) + "', '" + place.x + "', '" + place.y + "');"
        insertQuery(queryString, logAction);
    } else {
        debug.debugPrint(logAction + ' there are nothing to insert into DB!', 0);
    }
}


/**	Insert place's demographics information to DB
 * 
 * @param {object.id, object.name, object.x, object.y, object.size, object.specialization, object.frontier} place
 */
function savePlaceInfoDemographics(placeId, updated_at, demographics) {
    let logAction = 'savePlaceInfoDemographics()';
    if (placeId && demographics) {
        var queryString = "";
        var roundTo = 5;
        for (let i = 0; i < demographics.length; i++) {
            let demogr = demographics[i];
            queryString = "INSERT INTO `thetale`.`demographics` (`place_id`, `updated_at`, `race`, `percents`, `persons`, `delta`) VALUES ('" + placeId + "', '" + updated_at + "', '" + demogr.race + "', '" + debug.round(demogr.percents, roundTo) + "', '" + debug.round(demogr.persons, roundTo) + "', '" + debug.round(demogr.delta, roundTo) + "');"
            insertQuery(queryString, logAction);
        }
    } else {
        debug.debugPrint(logAction + ' there are nothing to insert into DB!', 0);
    }
}


module.exports.insertLogInfo = insertLogInfo;
module.exports.insertQuery = insertQuery;
module.exports.saveTurnInfo = saveTurnInfo;
module.exports.saveHeroInfo = saveHeroInfo;
module.exports.saveHeroPosition = saveHeroPosition;
module.exports.savePlace = savePlace;
module.exports.savePlaceInfoDemographics = savePlaceInfoDemographics;
module.exports.selectQuery = selectQuery;