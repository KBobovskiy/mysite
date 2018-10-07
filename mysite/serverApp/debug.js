/**
 *  helping debug code
 *  see @module login_info
 */

const debugOn = true;

/**
 * Print message if debugOn = true and dontPrint = false
 * @param {string} message 
 * @param {boolean} dontPrint 
 */
function debugPrint(message, dontPrint) {
    if (debugOn === true && !dontPrint) {
        console.info(message);
    }
}

function printRequestStatus(response) {
    console.info(response.statusCode);
    answerBody = response.body; //JSON object
    //var answerBody = JSON.parse(response.body.data);
    if (typeof (answerBody) == 'string') {
        console.info(answerBody);
    } else {
        console.info(answerBody.status);
        if (answerBody.status == 'error') {
            console.info(answerBody.error);
        }
        else {
            console.info(response.body.data);
        }
    }
}

function isNULL(isNull) {
    return isNull === null;
}

function round(val, roundToAfterDot) {
    let pow10 = Math.pow(10, roundToAfterDot);
    return Math.round(val * pow10) / pow10;
}

module.exports.debugPrint = debugPrint;
module.exports.printRequestStatus = printRequestStatus;
module.exports.isNULL = isNULL;
module.exports.round = round;