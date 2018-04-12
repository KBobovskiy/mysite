/**
* Common informarion about accounts
* @module login_info
*/

var csrftoken = 'JguoToqJzNzrwdPWTxtirsQ6v2AB410F7yKeyTi1qm3CL5cPew4oGcIFTtnkHMLe';
var sessionid = 'g4rpav872lt5fzqk85376azl7qq1qmgf';

const mysql_Host = "127.0.0.1";
const mysql_User = "user";
const mysql_Password = "password";

const apiClient = 'api_client=Example-1.001';
const apiClientValue = 'Example-1.001';

const accounts = [];
var account = {};
account.id = 1;
account.accountId = 1;
account.login = 'login@gmail.com';
account.password = 'password';
account.sessionid = '';
account.csrftoken = '';
accounts.push(account);


module.exports.mysql_Host = mysql_Host;
module.exports.mysql_User = mysql_User;
module.exports.mysql_Password = mysql_Password;
module.exports.apiClient = apiClient;
module.exports.apiClientValue = apiClientValue;
module.exports.csrftoken = csrftoken;
module.exports.sessionid = sessionid;
module.exports.accounts = accounts;