//const login = require('./login');
//login.login(0);

const login = require('./login');
const gameApi = require('./gameApi');
const autoHelper = require('./autoHelper');


// use that function somewhere
login.getLoginStatusAsync(0).then(function (loginStatus) {
    if (loginStatus === true) {
        console.log("we are login!");
        autoHelper.autoHelp(0);
    }
}).catch(function (err) {
    console.log("error!", err);
});