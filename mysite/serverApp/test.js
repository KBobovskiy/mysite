//const login = require('./login');
//login.login(0);

const login = require('./login');
const gameApi = require('./gameApi');



// use that function somewhere
login.getLoginStatusAsync(0).then(function (loginStatus) {
    if (loginStatus === true) {
        console.log("we are login!");
        gameApi.getPlacesListAsync(0,'Testing get places list').then( function (placesList) {
        if (placesList.status = 'ok'){
            console.info('get info about ' + placesList.places.length+ ' towns');
            console.info('town 7 name is ' + placesList.places[7].name);
            let placeId = placesList.places[7].id;
            console.info('town 7 id is ' + placeId);
            gameApi.getPlaceInfoAsync(0, 'Testing get place info', placeId).then (function (placeInfo) {
                let a = 2;
                a=a+9;
            })
        }
    });}
}).catch(function (err) {
    console.log("error!", err);
});