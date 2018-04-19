const request = require('request');
const login_info = require("./login_info");
const login = require('./login');
const debug = require("./debug");
const DBCon = require("./DBConnection");

const logAction = 'Auto help';

let accontIndex = 0;

/**
*	Return Hero state and status from JSON string (/game/api/info)
*/
function getHeroInfoFromJSONString(stringJSON) {
	let hero = {};
	hero.health = 1;
	hero.energy = 1;
	hero.actionType = 1;
	return hero;
}

/**
*	Send POST request for use Godness help
*/
function useHelp(accountIndex) {
	let ApiURL = 'http://the-tale.org/game/abilities/help/api/use?api_version=1.0&'+login_info.apiClient;
	let csrftoken = login_info.accounts[accountIndex].csrftoken;
	request({
		method: "POST",
		headers: {'Cookie': login_info.accounts[accountIndex].cookieString},
		url: helpAPIURL,
		form: {'csrfmiddlewaretoken':csrftoken}
	},(err, res) => {
		if(err){
			DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " Request /game/abilities/help/api/use: it did not work: " + err);
			debug.debugPrint("Account index: " + accountIndex + " Request /game/abilities/help/api/use: it did not work: " + err);
		} else {
			if (err === null) {
				DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " Request /game/abilities/help/api/use - Success");
				debug.debugPrint("Account index: " + accountIndex + " Request /game/abilities/help/api/use - Success");
			}
		}
	});
}


function autoHelp(accontIndex) {
	if (login.getLoginStatusAsync(accountIndex) === true) {
		let ApiURL = 'http://the-tale.org/game/api/info?api_version=1.9&'+login_info.apiClient;
		let csrftoken = login_info.accounts[accountIndex].csrftoken;

		request({
			method: "GET",
			headers: { 'Cookie': login_info.accounts[accountIndex].cookieString},
			url: ApiURL,
			form: {'csrfmiddlewaretoken':csrftoken}
		},(err, res) => {
		  if(err){
			DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " Request api/GameInfo: it did not work: " + err);
			debug.debugPrint("Account index: " + accountIndex + " Request api/GameInfo: it did not work: " + err);
		  } else {
			//debug.printRequestStatus(res);
			if (err === null) {
				let heroInfo = getHeroInfoFromJSONString(res.body);
				
				if (heroInfo.actionType === 0 && heroInfo.actionType === 4 )
					useHelp(accountIndex);
			}
		  }
		});
	} else {
		DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " is not login. Try log in The tale");
		login.login(accountIndex);
	}
}

autoHelp(accontIndex);