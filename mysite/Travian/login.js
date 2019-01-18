const puppeteer = require('puppeteer');
const login_info = require("./login_info");
const DBCon = require("../serverApp/DBConnection.js");
const Debug = require("../serverApp/debug.js");
const sleep = require('sleep-promise');

const Scraper = require("./TravianScraper");
const Saver = require("./TravianSaver");
const Reader = require("./TravianDBReader.js");
const Common = require("./CommonFunc.js");

const global_UrlDorf1 = 'https://ts2.travian.ru/dorf1.php';
const gotoUrlDorf2 = 'https://ts2.travian.ru/dorf2.php';

var fs = require('fs')

puppeteer.defaultArgs({ headless: false });

async function start(loginInfo) {

  if (login_info.showBrowser === undefined) {
    Debug.debugPrint("login_info.showBrowser === undefined");
    DBCon.insertLogInfo('Travian', 'showBrowser is undefined');
    return;
  }

  let errMsg = 'Starting';
  DBCon.insertLogInfo('Travian', errMsg);
  var now = new Date();
  var h = now.getHours();
  Debug.debugPrint('Current hour = ' + h);
  if (h < 6) {
    var sleepTime = Math.floor(Common.getRandomMS(957, 3333));
    let errMsg = 'It is not working time, sleep for ' + (sleepTime / 1000) + ' sec';
    DBCon.insertLogInfo('Travian', errMsg);
    await sleep(sleepTime);
    return;
  }

  var accountId = 1;



  if (login_info.showBrowser) {
    var browser = await puppeteer.launch({ headless: false });
  } else {
    var browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })

  await LoginToTravian(page, loginInfo);

  // Let's testing, can we play or not
  var pageUrl = 'https://ts2.travian.ru/dorf1.php';
  await GotoPage(page, pageUrl, 1, 2.5);
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
  // lets start scraping Dorf1 page

  if (login_info.scrapDorf1 === true) {

    var arrayWithDorf1PageInfo = await Scraper.ScrapingAllVillagesDorf1(page, accountId);
    var Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
    if (!Dorf1PageInfo) {
      var dorf1PageInfo = await Scraper.ScrapDorf1Page(page, 'https://ts2.travian.ru/dorf1.php');
      console.log(dorf1PageInfo.villageName);
      console.log(dorf1PageInfo.villageId);
      console.log(dorf1PageInfo.villageList);
      await Saver.SaveDorf1Page(dorf1PageInfo, accountId);
    }
    while (Dorf1PageInfo) {
      await Saver.SaveDorf1Page(Dorf1PageInfo, accountId);
      Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
      await sleep(1000);
    }
  }

  //
  //
  //
  // lets start scraping Dorf2 page
  if (login_info.scrapDorf2 === true) {

    var arrayWithDorf2PageInfo = await Scraper.ScrapingAllVillagesDorf2(page, accountId);
    var Dorf2PageInfo = arrayWithDorf2PageInfo.pop();
    while (Dorf2PageInfo) {
      await Saver.SaveDorf2Page(Dorf2PageInfo, accountId);
      Dorf2PageInfo = arrayWithDorf2PageInfo.pop();
      await sleep(1000);
    }
  }


  // Scraping reports
  if (login_info.scrapReports === true) {

    /*
    var savedReportsId = await Reader.getLastDeffenseReports(accountId);
    var arrayWithDeffenseReports = await Scraper.ScrapingAllDefenseReport(page, accountId, savedReportsId);
    Debug.debugPrint('arrayWithDeffenseReports: ' + arrayWithDeffenseReports.length);
    Debug.debugPrint(arrayWithDeffenseReports);
    var defReport = arrayWithDeffenseReports.pop();
    while (defReport) {
      await Saver.SaveDefenseReport(defReport, accountId);
      defReport = arrayWithDeffenseReports.pop();
      await sleep(1000);
    }
*/
  }


  //
  //
  //
  //
  //
  // Scraping Reports
  // if (login_info.scrapReports === true) {

  /*
  var savedReportsIdWithoutDetails = await Reader.getLastReportsWithoutDetails(accountId);
  savedReportsIdWithoutDetails.length = 3;
  var arrayWithDeffenseReports = await Scraper.ScrapingReportsDetail(page, accountId, savedReportsIdWithoutDetails);
  Debug.debugPrint('arrayWithDeffenseReports: ' + arrayWithDeffenseReports.length);
  Debug.debugPrint(arrayWithDeffenseReports);
  var reportInfo = arrayWithDeffenseReports.pop();
  while (reportInfo) {
    await Saver.SaveReportInfo(defReport, accountId);
    reportInfo = arrayWithDeffenseReports.pop();
    await sleep(1000);
  }
*/
  // }


  // Building houses

  if (login_info.runBuilding === true) {
    var loopIndex = 0;
    var maxLoopIndex = 20 + Math.floor(Math.random() * 20);
    Debug.debugPrint("Check villages for building houses, maxLoopIndex = " + maxLoopIndex);
    for (loopIndex = 0; loopIndex < maxLoopIndex; loopIndex++) {

      var villagesId = await Reader.GetAllVillagesId(accountId);
      for (var vIndex = 0; vIndex < villagesId.length; vIndex++) {
        var vill_ID = villagesId[vIndex];
        Debug.debugPrint("Check village id = " + vill_ID);

        // Last 2 buliding from query
        var buildingQuery = await Reader.GetBuildingQuery(accountId, vill_ID, 2);
        buildingQuery.sort((a, b) => {
          if (a.id <= b.id) return 1;
          return -1;
        })
        Debug.debugPrint("Check village id = " + vill_ID + " building query length = " + buildingQuery.length);
        if (buildingQuery.length >= 0) {
          var canStartBuild = false;

          for (var i = 0; i < buildingQuery.length; i++) {
            var last = buildingQuery[i];
            if (last && last.EndOfBuilding) {
              var now = new Date();
              Debug.debugPrint("Village Id = " + vill_ID + ", last.EndOfBuilding < now  = " + last.EndOfBuilding + " < " + now + " = " + (last.EndOfBuilding < now));
              if (last.EndOfBuilding < now) {
                canStartBuild = true;
                break;
              }
            }
          }

          if (buildingQuery.length === 0) {
            canStartBuild = true;
          }

          Debug.debugPrint("Village Id = " + vill_ID + ", canStartBuild = " + canStartBuild);
          if (canStartBuild === true) {
            await StartBuildInVillage(page, accountId, vill_ID);
          }
        }
      }

      var minSleepTimeInSec = 180;
      var maxSleepTimeInSec = 360;
      var waitTime = Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec) / 1000;
      var dt = new Date();
      Debug.debugPrint("Now:" + dt + ", sleep for " + waitTime + " sec, till: " + new Date(dt.setSeconds(dt.getSeconds() + waitTime)));
      await sleep(waitTime * 1000);
    }
  }


  //await page.screenshot({ path: 'ts2.travian.png' });



  var sleepTime = Math.floor(Common.getRandomMS(957, 3333));
  DBCon.insertLogInfo('Travian', 'Stop, sleep for ' + (sleepTime / 1000) + ' sec');
  if (!login_info.showBrowser) {
    await browser.close();
  }
  await sleep(sleepTime);
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

async function GetButtonStartBuildingText(page) {

  var buttonText = await page.evaluate(() => {
    const buttonSelection = '#build > div.roundedCornersBox.big > div.upgradeButtonsContainer.section2Enabled > div.section1';
    const buttonSelection2 = '#build .upgradeButtonsContainer > div.section1';

    const contentContainer = '.build';
    var innerText = "";

    var selection = document.querySelector('#build');
    if (selection === null) {
      return 'error #1 Can not find element with selector: ' + contentContainer;
    }
    var innerText = selection.textContent;
    if (innerText) {
      innerText = innerText.replace(/[^а-яА-Я]+/g, '');
      if (innerText.indexOf('зданиеотстроенополностью') >= 0) {
        return 'зданиеотстроенополностью';;
      }
      if (innerText.indexOf('Улучшитьдоуровня1') >= 0) {
        return 'Улучшитьдоуровня1';;
      }
      if (innerText.indexOf('Улучшитьдо') >= 0) {
        return 'Улучшитьдо';;
      }
      if (innerText.indexOf('Построитьсархитектором') >= 0) {
        return 'Построитьсархитектором';;
      }
    }

    return innerText;

  });

  await sleep(Common.getRandomMS(1.7, 3.5));

  return buttonText;
}

async function TryToStartBuilding(page, gotoBuildingUrl, accountId, rows) {

  await GotoPage(page, gotoBuildingUrl, 0.3, 2);

  var buttonReady = await GetButtonStartBuildingText(page);

  Debug.debugPrint("Button start building text = " + buttonReady);

  if (buttonReady === "Улучшитьдоуровня1") {
    await page.mouse.click(807, 515);
    await page.mouse.click(946, 515);
  } else if (buttonReady.indexOf("Улучшитьдо") >= 0) {
    await page.mouse.click(807, 515);
    await page.mouse.click(946, 515);
  } else if (buttonReady.indexOf("Построитьсархитектором") >= 0) {
    Debug.debugPrint("Button for building is not ready or building complite!");
    await GotoPage(page, global_UrlDorf1, 3, 5);
  }

  DBCon.insertLogInfo('Travian', "ScrapDorf1Page after click trying button start building");
  var dorf1PageInfo = await Scraper.ScrapDorf1Page(page, global_UrlDorf1);
  Saver.SaveDorf1Page(dorf1PageInfo, accountId);
}


async function StartBuildInVillage(page, accountId, villageId) {
  Debug.debugPrint("------------------------------------------------------");
  Debug.debugPrint("--  StartBuildInVillage: " + villageId);

  var rows = await Reader.getWhatWeCanBuildInVillageFromDB(accountId, villageId);

  if (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    DBCon.insertLogInfo('Travian', "Случайным способом выбрали строить: " + rows[i].Name + " " + rows[i].Level);
    var gotoBuildingUrl = rows[i].Href; // Building href
    if (gotoBuildingUrl) {
      await GotoPage(page, global_UrlDorf1 + '?newdid=' + villageId + '&', 0.5, 1); // Goto village page
      await TryToStartBuilding(page, gotoBuildingUrl, accountId, rows); // Goto building page
    }
  }
}

/** OLD VERSION */
/*
async function StartBuilding(page, rows, accountId) {
  while (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    DBCon.insertLogInfo('Travian', "Случайным способом выбрали строить: " + rows[i].Name + " " + rows[i].Level + " " + rows[i].VillageId);
    var gotoUrl = rows[i].VillageHref;
    var villageId = rows[i].VillageId;

    if (gotoUrl) {
      await TryToStartBuilding(page, gotoUrl, accountId, rows);
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
*/

/** OLD VERSION */
/*
async function StartAllBuildings(page, accountId) {
  var rows = await Reader.getWhatWeCanBuildFromDB(accountId);
  Debug.debugPrint("------------------------------------------------------");
  Debug.debugPrint("--  --  --  --  --  --  --  --  --  --  --  --  --  --");
  Debug.debugPrint("------------------------------------------------------");
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
*/



/** Loging into the game, return 1 if we in the game */
async function LoginToTravian(page, loginInfo) {

  await GotoPage(page, 'https://ts2.travian.ru/', 2.5, 6);
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
  await sleep(Common.getRandomMS(2, 5));
  await page.mouse.click(856, 378);
  await sleep(Common.getRandomMS(1, 3));
  return 1;
}

async function GotoPage(page, pageUrl, timeoutMin = 1, timeoutMax = 5) {
  var waitTime = Common.getRandomMS(timeoutMin, timeoutMax);
  Debug.debugPrint("Goto: " + pageUrl + " with waiting " + waitTime + " milisec.");
  await sleep(waitTime);
  await page.goto(pageUrl);
  await sleep(300);
}

start(login_info);

