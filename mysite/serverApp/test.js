//const login = require('./login');
//login.login(0);

const login = require('./login');
const gameApi = require('./gameApi');


// use that function somewhere
login.getLoginStatusAsync(0).then(function (loginStatus) {
    if (loginStatus === true) {
        console.log("we are login!");
        gameApi.useCardHandOfDeath(0, "Test: use card");
    }
}).catch(function (err) {
    console.log("error!", err);
});