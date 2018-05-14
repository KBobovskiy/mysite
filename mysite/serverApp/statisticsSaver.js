/**
* Service for saving game statistic information
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

const logAction = "Statistic saver";

let accountIndex = 0;

function saveStatistics(accountIndex){
	login.getLoginStatusAsync(accountIndex)
	.then( (LoginStatus) => {
		if (LoginStatus === true) {
			gameApi.getPlacesListAsync(accountIndex, logAction)
			.then( (placesList) => {
				if (placesList) {
					if (placesList.status == 'ok') {
						try {
							for (let i=0; i<placesList.places.length;i++){
								debug.debugPrint("placesList.places["+i+"] = " + placesList.places[i].name +" " + new Date());    
								let place = placesList.places[i];
								if (place) {
									DBCon.savePlace(place);
									gameApi.getPlaceInfoAsync(accountIndex, logAction, place.id).then (function (placeInfo) {
										if (placeInfo.status == "ok") {
											DBCon.savePlaceInfoDemographics(placeInfo.place.id, placeInfo.place.updated_at, placeInfo.place.demographics);
										}
									})

								}
                            }
						} catch (error) {
							debug.debugPrint("Can not save placesList in mySQL, error: " + error +" " + new Date());
						}
					} else {
						let logInfoMsg = "Account index: " + accountIndex + " Request api/placesList: error. " + placesList.error;
						DBCon.insertLogInfo(logAction, logInfoMsg);
						debug.debugPrint(logInfoMsg+ " " + new Date());
					}
				}
			}).catch((err) => {
				debug.debugPrint(logAction + "getplacesListAsync error: "+ err);
				DBCon.insertLogInfo(logAction, "getplacesListAsync: "+logAction + "error: "+ err);
			});
		} else {
			DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " is not login. Try log in The tale");
			login.login(accountIndex);
		}
	}).catch ((err) => {
		debug.debugPrint(logAction + "error! "+ err);
		DBCon.insertLogInfo(logAction, "getLoginStatusAsync: "+logAction + "error! "+ err);
	});
    //setTimeout(saveStatistics(accountIndex), 600000);
}

saveStatistics(accountIndex);