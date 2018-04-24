//const login = require('./login');
//login.login(0);

const login = require('./login');
const gameApi = require('./gameApi');


// use that function somewhere
login.getLoginStatusAsync(0).then(function (loginStatus) {
    if (loginStatus === true) {
        console.log("we are login!");
        gameApi.getGameInfoAsync(0, "Test: game info").then ( (gameInfo) => {
            console.log(gameInfo.status);
            console.log(gameInfo.hero.health);
        }).catch((err)=>{console.log("error!", err);})
    }
}).catch(function (err) {
    console.log("error!", err);
});