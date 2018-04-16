/**
* Function load/save cookie and login the game
*
*   see @module login_info
*   see @module debug
*/

const login_info = require("./login_info");
const SyncMySql = require('sync-mysql');
const request = require('request');
const debug = require("./debug");
const Promise = require('bluebird');
const requestPromise = Promise.promisifyAll(require('request'));
/**
* Load cookie to mySQL db (Sync)
*/
function loadCookieSync(accountIndex){
    let id = login_info.accounts[accountIndex].id;
    let account_id = login_info.accounts[accountIndex].accountId;
    let result = {};
    result.csrftoken = '';
    result.sessionid = '';
    if (login_info.accounts[accountIndex].sessionid && login_info.accounts[accountIndex].csrftoken) {
        result.sessionid = login_info.accounts[accountIndex].sessionid;
        result.csrftoken = login_info.accounts[accountIndex].csrftoken;
        return result;
    }
    
    let connection = new SyncMySql({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });

    let queryString = "SELECT sessionid, csrftoken FROM thetale.accounts WHERE id=" + id + " and account_id=" + account_id;
    debug.debugPrint(queryString, 1);
    const queryResult = connection.query(queryString);
    if (queryResult.length == 1) {
        result.csrftoken = queryResult[0].csrftoken;
        result.sessionid = queryResult[0].sessionid;
        login_info.accounts[accountIndex].sessionid = result.sessionid;
        login_info.accounts[accountIndex].csrftoken = result.csrftoken;
    }
    connection = undefined;
    return result;
}

/**
* Save cookie to mySQL db (Sync)
*/
function saveCookieSync(accountIndex, cookieString) {
    let id = login_info.accounts[accountIndex].id;
    let account_id = login_info.accounts[accountIndex].accountId;
    let arrCookie = cookieString.split(';')
    let cookieValue = {};
    while (arrCookie.length) {
        let cookie = arrCookie.pop();
        cookie = cookie.split('=');
        if (cookie.length == 2) {
            cookieValue[cookie[0].trim()] = cookie[1].trim();
        }
    }

    debug.debugPrint(cookieString, 1);

    if (cookieValue.sessionid && cookieValue.csrftoken) {
        let connection = new SyncMySql({ host: login_info.mysql_Host, user: login_info.mysql_User, password: login_info.mysql_Password });

        let queryString = "UPDATE thetale.accounts SET sessionid='" + cookieValue.sessionid + "', csrftoken='" + cookieValue.csrftoken + "' WHERE id=" + id + " and account_id=" + account_id;
        debug.debugPrint(queryString, 1);
        try {
            queryresult = connection.query(queryString);
        }
        catch (err) {
            debug.debugPrint(err);
            return false;
        }
        connection = undefined;
        return true;
    }
    return false;
}

/**
*  login on the site The-tale.org
*/
function login(accountIndex) {
    var account_login = login_info.accounts[accountIndex].login;
    var account_password = login_info.accounts[accountIndex].password;
    var account_id = login_info.accounts[accountIndex].id;
    var account_accountId = login_info.accounts[accountIndex].accountId;
    let cookieString = 'sessionid=' + login_info.sessionid + '; csrftoken=' + login_info.csrftoken;
    let loginURL = 'https://the-tale.org/accounts/auth/api/login?api_version=1.0&' + login_info.apiClient;
    request({
        method: "POST",
        headers: {
            'Cookie': cookieString,
            'referer': 'https://the-tale.org/'
        },
        url: loginURL,
        form: { 'email': account_login, 'password': account_password, 'csrfmiddlewaretoken': login_info.csrftoken }
    },  (err, res) => {
            if (err) {
                debug.debugPrint("requestLogin: it did not work: " + err)
            } else {
                debug.printRequestStatus(res);
                debug.debugPrint(res.request.headers);
                let cookie = res.headers['set-cookie'];
                if (cookie) {
                    for (let i = 0; i < cookie.length; i++) {
                        cook = cookie[i];
                        cook = cook.split(';');
                        cook = cook[0].split('=');
                        if (cook[0] == 'sessionid') {
                            sessionid = cook[1];
                        } else if (cook[0] == 'csrftoken') {
                            csrftoken = cook[1];
                        }
                    }
                }
                let cookieString = 'sessionid=' + sessionid + '; csrftoken=' + csrftoken;
                login_info.accounts[accountIndex].sessionid = sessionid;
                login_info.accounts[accountIndex].csrftoken = csrftoken;
                debug.debugPrint(cookieString,0);
                saveCookieSync(accountIndex, cookieString);
            }
        }
    );
}


async function getLoginStatusAsync(accountIndex) {
    if (accountIndex === undefined) { debug.debugPrint("getLoginStatusAsync(accountIndex) - error accountIndex is not set!"); return false; }
    let cookies = loadCookieSync(accountIndex);
    var cookieString = 'sessionid=' + cookies.sessionid + '; csrftoken=' + cookies.csrftoken;
    let apiURL = 'https://the-tale.org/accounts/messages/api/new-messages-number?api_version=0.1&' + login_info.apiClient;
    let res = await requestPromise.getAsync({
        method: "GET",
        headers: {
            'Cookie': cookieString,
            referer: 'https://the-tale.org/'
        },
        url: apiURL
        , form: { 'csrfmiddlewaretoken': cookies.csrftoken }
    });

    return res.body[0] == '{';
}

module.exports.loadCookieSync = loadCookieSync;
module.exports.saveCookieSync = saveCookieSync;
module.exports.login = login;
module.exports.getLoginStatusAsync = getLoginStatusAsync;