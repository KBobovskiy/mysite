const request = require('request');
const login_info = require("./login_info");
const login = require('./login');
const debug = require("./debug");
const DBCon = require("./DBConnection");

const apiClient = login_info.apiClient;
const apiClientValue = login_info.apiClientValue;
const logAction = 'Auto help';

let accontIndex = 0;

function checkHeroState(accontIndex) {
    let cookies = login.loadCookieSync(accontIndex);

    var csrftoken = cookies.csrftoken;
    var sessionid = cookies.sessionid;
    var cookieString = 'sessionid=' + sessionid + '; csrftoken=' + csrftoken;
    debug.debugPrint(cookieString, 0);
}

checkHeroState(accontIndex);