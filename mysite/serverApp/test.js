//const login = require('./login');
//login.login(0);

const login = require('./login');




// use that function somewhere
login.getLoginStatusAsync(0).then(function (loginStatus) {
    if (loginStatus === true) {
        console.log("we are login!");
    }
}).catch(function (err) {
    console.log("error!", err);
});