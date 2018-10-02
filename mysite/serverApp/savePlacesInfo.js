const login = require('./login');
const gameApi = require('./gameApi');
var accountIndex = 0;

login.getLoginStatusAsync(accountIndex).then(function (loginStatus) {
	var logAction = 'Save places info';
    if (loginStatus === true) {
        gameApi.getPlacesListAsync(accountIndex,logAction).then( function (placesList) {
			if (placesList.status = 'ok'){
				for (let i=0;placesList.places.length;i++) {
					gameApi.getPlaceInfoAsync(accountIndex, logAction, placeId).then( function (place) {
						
					}).catch(function (err) {
						let errMsg = "getPlaceInfoAsync("+placeId+") error: " + err;
						DBCon.insertLogInfo(logAction, errMsg);
					})
				}
			}
		}).catch(function (err) {
				let errMsg = "getPlacesListAsync() error: "+err;
				DBCon.insertLogInfo(logAction, errMsg);
			}
		}
}).catch(function (err) {
	let errMsg = "getLoginStatusAsync() error!"+err;
	DBCon.insertLogInfo(logAction, errMsg);
});