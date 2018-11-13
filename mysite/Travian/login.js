const puppeteer = require('puppeteer');
const login_info = require("./login_info");
const DBCon = require("../serverApp/DBConnection.js");
const Debug = require("../serverApp/debug.js");
const sleep = require('sleep-promise');

const Scraper = require("./TravianScraper");
const Saver = require("./TravianSaver");
const Reader = require("./TravianDBReader.js");
const Common = require("./CommonFunc.js");

var fs = require('fs')


puppeteer.defaultArgs({ headless: false });

async function start(loginInfo) {

  let errMsg = 'Starting';
  DBCon.insertLogInfo('Travian', errMsg);
  var accountId = 1;

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })

  await LoginToTravian(page, loginInfo);

  // Let's testing, can we play or not
  var pageUrl = 'https://tx3.travian.ru/dorf1.php';
  await sleep(Common.getRandomMS(1, 2.5));
  Debug.debugPrint("Goto: " + pageUrl);
  await page.goto(pageUrl);
  var result = await page.evaluate(() => {
    const warehouseSelector = '#stockBarWarehouse';
    //Debug.debugPrint("typeof = " + typeof document.querySelector(warehouseSelector));
    return !(typeof document.querySelector(warehouseSelector) === 'undeined');
  });
  //Debug.debugPrint('result=' + result);
  if (!result) { return; }

  //
  //
  //
  /*
    var arrayWithDorf1PageInfo = await Scraper.ScrapingAllVillagesDorf1(page, accountId);
    var Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
    while (Dorf1PageInfo) {
      await Saver.SaveDorf1Page(Dorf1PageInfo, accountId);
      Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
      await sleep(1000);
    }
  */

  //
  //
  //

  // lets start scraping Dorf2 page
  var arrayWithDorf2PageInfo = await Scraper.ScrapingAllVillagesDorf2(page, accountId);
  var Dorf2PageInfo = arrayWithDorf2PageInfo.pop();
  while (Dorf2PageInfo) {
    await Saver.SaveDorf2Page(Dorf2PageInfo, accountId);
    Dorf2PageInfo = arrayWithDorf2PageInfo.pop();
    await sleep(1000);
  }
  //console.log(arrayWithDorf2PageInfo);

  /*
    var i = 0;
    while (i < 100) {
      await StartAllBuildings(page, accountId);
      i++;
      var minSleepTimeInSec = 180;
      var maxSleepTimeInSec = 360;
      var waitTime = Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec) / 1000;
      Debug.debugPrint("sleep for " + waitTime + "sec");
      await sleep(waitTime * 1000);
    }
  
  */
  await page.screenshot({ path: 'tx3.travian.png' });

  DBCon.insertLogInfo('Travian', 'Stop');
  //await browser.close();
}

function GetString(strValue) {
  //Debug.debugPrint(strValue);
  strValue = strValue.replace(/[^a-zA-Zа-яА-Я ,.0-9:-]+/g, ' ');
  //Debug.debugPrint(strValue);
  strValue = strValue.replace(/ +/g, ' ');
  //Debug.debugPrint(strValue);
  strValue = strValue.trim();
  //Debug.debugPrint(strValue);
  return strValue;
}

function GetNumber(strValue, parseToInt) {
  strValue = strValue.replace(/[^0-9-]/g, '');
  strValue = strValue.trim();
  Debug.debugPrint(strValue);
  if (parseToInt) {
    return parseInt(strValue);
  }
  return strValue;
}

function GetTime(strValue) {
  //Debug.debugPrint(strValue);
  strValue = strValue.match(/[0-9]+:[0-9]+:[0-9]+/);
  if (strValue.length = 1) {
    //Debug.debugPrint(strValue[0]);
    return strValue[0];
  }
  return '';
}

function GetFullID(acc, vill, posId) {
  var id = acc + '#' + vill + '#' + posId;
  id = id.replace(/[^0-9#]/g, '');
  return id;
}


function RemoveVillageById(arr, villageId) {
  Debug.debugPrint("Удаляем деревню: " + villageId);
  var i = arr.length
  var newArr = [];
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i].VillageId != villageId) {
      newArr.push(arr[i]);
    }
  }
  Debug.debugPrint(arr);
  return newArr;
}

async function StartBuilding(page, rows, accountId) {
  while (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    DBCon.insertLogInfo('Travian', "Случайным способом выбрали строить: " + rows[i].Name + " " + rows[i].Level + " " + rows[i].VillageId);
    var gotoUrl = rows[i].VillageHref;
    var villageId = rows[i].VillageId;

    if (gotoUrl) {
      var minSleepTimeInSec = 0.3;
      var maxSleepTimeInSec = 2;
      await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
      Debug.debugPrint("Goto: " + gotoUrl);
      await page.goto(gotoUrl);
      gotoUrl = rows[i].Href;
      if (gotoUrl) {
        await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
        Debug.debugPrint("Goto: " + gotoUrl);
        await page.goto(gotoUrl);

        var buttonReady = await page.evaluate(() => {
          const buttonSelection = '#build > div.roundedCornersBox.big > div.upgradeButtonsContainer.section2Enabled > div.section1';
          const buttonSelection2 = '#build > div.roundedCornersBox.big > div.upgradeButtonsContainer > div.section1';
          const contentContainer = '#contentOuterContainer > div.contentContainer';
          var innerText = "";

          var selection = document.querySelector(contentContainer);
          if (!selection) {
            return false;
          }
          if (selection && selection.textContent) {
            innerText = selection.textContent;
            innerText = innerText.replace(/[^а-яА-Я]+/g, '');
            if (innerText.indexOf('зданиеотстроенополностью') >= 0) {
              return false;
            }
          }

          var selection = document.querySelector(buttonSelection);
          if (!selection) {
            selection = document.querySelector(buttonSelection2);
            if (!selection) {
              return false;
            }
          }
          if (selection.innerText) {
            innerText = selection.innerText.replace(/[^а-яА-Я0-9]+/g, '');
            //Debug.debugPrint(innerText);
            if (innerText === "Улучшитьдоуровня1") {
              //Debug.debugPrint("Улучшить готово до уровня 1");
              return 1;
            } else if (innerText.indexOf("Улучшитьдо") >= 0) {
              //Debug.debugPrint("Улучшить готово");
              return true;
            } else if (innerText.indexOf("Построитьсархитектором") >= 0) {
              //Debug.debugPrint("Архитектор");
              return false;
            }
          }
          return false;
        });
        Debug.debugPrint("buttonReady=" + buttonReady);
        if (buttonReady === 1) {
          await page.mouse.click(946, 462);
        } else if (buttonReady) {
          await page.mouse.click(814, 462);
        } else {
          Debug.debugPrint("Button for building is not ready or building complite!");
          // return to dorf1 page
          var pageUrl = 'https://tx3.travian.ru/dorf1.php';
          Debug.debugPrint("Goto: " + pageUrl);
          await page.goto(pageUrl);
          await sleep(Common.getRandomMS(3, 5));

          //await page.goto(pageUrl);
        }
        Debug.debugPrint("ScrapDorf1Page after click trying button start building");
        var gotoUrl = 'https://tx3.travian.ru/dorf1.php';
        var dorf1PageInfo = await Scraper.ScrapDorf1Page(page, gotoUrl);
        Saver.SaveDorf1Page(dorf1PageInfo, accountId);
        var j = rows.length;
        for (var j = rows.length - 1; j >= 0; j--) {
          if (rows[j].VillageId == villageId) {
            //Debug.debugPrint("Delete by index: " + j);
            rows.splice(j, 1);
          }
        }
        Debug.debugPrint(rows);
      }
    }
  }

}

/** Starting building in free village */
async function StartAllBuildings(page, accountId) {
  var rows = await Reader.getWhatWeCanBuildFromDB(accountId);
  Debug.debugPrint("getWhatWeCanBuildFromDB return: " + rows.length + " rows");
  Debug.debugPrint(rows);
  //
  //
  //
  //
  //
  await StartBuilding(page, rows, accountId);
  //
  //
  //
  //
  //
}



/** Loging into the game, return 1 if we in the game */
async function LoginToTravian(page, loginInfo) {
  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 7;
  var pageUrl = 'https://tx3.travian.ru/';
  Debug.debugPrint("Goto: " + pageUrl);
  await page.goto(pageUrl);
  let login = loginInfo.account.login;
  let password = loginInfo.account.password;
  await page.evaluate((login, password) => {
    const loginInputSelector = '#content > div.outerLoginBox > div.innerLoginBox > form > table > tbody > tr.account > td:nth-child(2) > input';
    const passwordInputSelector = '#content > div.outerLoginBox > div.innerLoginBox > form > table > tbody > tr.pass > td:nth-child(2) > input';
    document.querySelector(loginInputSelector).value = login;
    document.querySelector(passwordInputSelector).value = password;
  }, login, password);
  const lowResolutionCheckBoxSelector = '#lowRes';

  await page.click(lowResolutionCheckBoxSelector);
  await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  await page.mouse.click(856, 378);
  await sleep(Common.getRandomMS(minSleepTimeInSec / 2, maxSleepTimeInSec / 2));
  return 1;
}



start(login_info);


