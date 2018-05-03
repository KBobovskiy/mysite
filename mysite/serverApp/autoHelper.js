/**
* Service for use keeper help
*
*   see @module login_info
*   see @module debug
*   see @module DBConnection
*   see @module gameApi
*/

const login = require('./login');
const debug = require("./debug");
const DBCon = require("./DBConnection");
const gameApi = require("./gameApi");

const logAction = "Auto help";

let accontIndex = 0;

/**
 * save GameInfo into mySQL db
 */
function saveGameInfo(gameInfo) {
	DBCon.saveTurnInfo(gameInfo.turn);
	DBCon.saveHeroInfo(gameInfo.hero);
}

/**
 * Service for checking hero status and use keeper help
 * @param {int} accountIndex 
 */
function autoHelp(accountIndex) {
	login.getLoginStatusAsync(accountIndex)
	.then( (LoginStatus) => {
		if (LoginStatus === true) {
			gameApi.getGameInfoAsync(accountIndex, logAction)
			.then( (gameInfo) => {
				if (gameInfo) {
					if (gameInfo.status == 'ok') {
						if (gameInfo.hero.action.type === 0 || gameInfo.hero.action.type === 4 ) {
							let logInfoMsg = "Account index: " + accountIndex + " Request api/GameInfo: Use help {action.type:"+gameInfo.hero.action.type+"/health:"+gameInfo.hero.health+"/energy:"+gameInfo.hero.energy+"}";
							DBCon.insertLogInfo(logAction, logInfoMsg);
							debug.debugPrint(logInfoMsg+ " " + new Date());
							gameApi.useHelp(accountIndex, logAction);
						/*}  if (gameInfo.hero.action.type === 3 && gameInfo.hero.health < 600  && gameInfo.hero.energy > 40) {
							let logInfoMsg = "Account index: " + accountIndex + " Request api/GameInfo: Use help {action.type:"+gameInfo.hero.action.type+"/health:"+gameInfo.hero.health+"/energy:"+gameInfo.hero.energy+"}";
							DBCon.insertLogInfo(logAction, logInfoMsg);
							debug.debugPrint(logInfoMsg+ " " + new Date());
							gameApi.useHelp(accountIndex, logAction);
						*/
						}  if (gameInfo.hero.action.type === 3 && gameInfo.hero.health < 200 ) { // hero use card to kill enemy. 
							let logInfoMsg = "Account index: " + accountIndex + " Use Hand of Death {action.type:"+gameInfo.hero.action.type+"/health:"+gameInfo.hero.health+"/energy:"+gameInfo.hero.energy+"}";
							DBCon.insertLogInfo(logAction, logInfoMsg);
							debug.debugPrint(logInfoMsg+ " " + new Date());
							gameApi.useCardHandOfDeath(accountIndex, logAction);
						} else {
							let logInfoMsg = "Account index: " + accountIndex + " Request api/GameInfo: do not need help {action.type:"+gameInfo.hero.action.type+"/health:"+gameInfo.hero.health+"/energy:"+gameInfo.hero.energy+"}";
							DBCon.insertLogInfo(logAction, logInfoMsg);
							debug.debugPrint(logInfoMsg+ " " + new Date());
						}
						try {
							saveGameInfo(gameInfo);
						} catch (error) {
							debug.debugPrint("Can not save gameInfo in mySQL, error: " + error +" " + new Date());
						}
					} else {
						let logInfoMsg = "Account index: " + accountIndex + " Request api/GameInfo: error. " + gameInfo.error;
						DBCon.insertLogInfo(logAction, logInfoMsg);
						debug.debugPrint(logInfoMsg+ " " + new Date());
					}
				}
			}).catch((err) => {
				debug.debugPrint(logAction + "getGameInfoAsync error: "+ err);
				DBCon.insertLogInfo(logAction, "getGameInfoAsync: "+logAction + "error: "+ err);
			});
		} else {
			DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " is not login. Try log in The tale");
			login.login(accountIndex);
		}
	}).catch ((err) => {
		debug.debugPrint(logAction + "error! "+ err);
		DBCon.insertLogInfo(logAction, "getLoginStatusAsync: "+logAction + "error! "+ err);
	});
	setTimeout(function () {autoHelp(accountIndex)}, 60000);
}

autoHelp(accontIndex);