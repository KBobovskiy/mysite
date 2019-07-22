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
const global_UrlDorf2 = 'https://ts2.travian.ru/dorf2.php';
const global_UrlDorf3 = 'https://ts2.travian.ru/dorf3.php';

var fs = require('fs')

puppeteer.defaultArgs({ headless: false });

async function start(loginInfo) {

  if (login_info.showBrowser === undefined) {
    Debug.debugPrint("login_info.showBrowser === undefined");
    DBCon.insertLogInfo('Travian', 'showBrowser is undefined', 'showBrowser is undefined');
    return;
  }

  let errMsg = 'Starting';
  DBCon.insertLogInfo('Travian', errMsg, errMsg);
  var now = new Date();
  var h = now.getHours();
  Debug.debugPrint('Current hour = ' + h);
  if (h < 6) {
    var sleepTime = Math.floor(Common.getRandomMS(957, 3333));
    let errMsg = 'It is not working time, sleep for ' + (sleepTime / 1000) + ' sec';
    DBCon.insertLogInfo('Travian', errMsg, errMsg);
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

  /** Need to set market order for selling resourses for crop */
  //Need to scraping https://ts2.travian.ru/dorf3.php?s=2 page
  //await CheckFreeTraders(page);

  // return;

  //
  //
  //
  // lets start scraping Dorf1 page

  if (login_info.scrapDorf1 === true) {

    var arrayWithDorf1PageInfo = await Scraper.ScrapingAllVillagesDorf1(page, accountId);
    Debug.debugPrint("SaveDorf1Page: array length = " + arrayWithDorf1PageInfo.length);
    var Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
    if (!Dorf1PageInfo) {
      Debug.debugPrint("SaveDorf1Page: " + Dorf1PageInfo.villageId);
      await Saver.SaveDorf1Page(Dorf1PageInfo, accountId);
    }
    while (Dorf1PageInfo) {
      Debug.debugPrint("SaveDorf1Page: " + Dorf1PageInfo.villageId);
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
    Debug.debugPrint('arrayWithDorf2PageInfo.length: ' + arrayWithDorf2PageInfo.length);
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
    var maxLoopIndex = 50 + Math.floor(Math.random() * 20);
    Debug.debugPrint("Check villages for building houses, maxLoopIndex = " + maxLoopIndex);
    for (loopIndex = 0; loopIndex < maxLoopIndex; loopIndex++) {

      // if (loopIndex % 2 === 0) {
      //   /** Check and start holiday in guildhalls */
      //   await StartHolidays(page, accountId);
      // }

      var villagesId = await Reader.GetAllVillagesId(accountId);
      for (var vIndex = 0; vIndex < villagesId.length; vIndex++) {
        var vill_ID = villagesId[vIndex];
        // if (vill_ID != 26398) {
        //   continue;
        // }
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
      Debug.debugPrint("Now:" + dt + ", sleep for " + waitTime + " sec, (" + loopIndex + " < " + maxLoopIndex + ") till: " + new Date(dt.setSeconds(dt.getSeconds() + waitTime)));
      await sleep(waitTime * 1000);
    }
  }

  var sleepTime = Math.floor(Common.getRandomMS(957, 3333));
  DBCon.insertLogInfo('Travian', 'Stop, sleep before exit for ' + (sleepTime / 1000) + ' sec', 'Stop, sleep before exit for ' + (sleepTime / 1000) + ' sec');
  if (!login_info.showBrowser) {
    await browser.close();
  }
  await sleep(sleepTime);
}

/** Starting holiday n villages */
async function StartHolidays(page, accountId) {
  var villageWithGuildHalls = await Reader.GetVillagesWithGuildHallsWhereCanStartHoliday(accountId);
  if (!villageWithGuildHalls || villageWithGuildHalls.length === 0) {
    var msg = "There are no villages where can start small holiday";
    DBCon.insertLogInfo('Travian', msg, msg);
    return;
  }
  var now = (new Date()).toJSON().replace('T', ' ');
  for (var i = 0; i < villageWithGuildHalls.length; i++) {
    var row = villageWithGuildHalls[i];
    //console.log("now = " + now);

    if (row.EndOfHoliday <= now) {

      var msg = "Village: " + row.VillageId + " Can start holiday: " + row.EndOfHoliday + " <=" + now;
      DBCon.insertLogInfo('Travian', msg, msg);
      //console.log('Can start holiday: ' + row.EndOfHoliday + "<=" + now);

      await GotoPage(page, row.Href, 1, 2);
      await GotoPage(page, row.HouseHref, 1, 2);
      var queryTime = await page.evaluate(() => {

        function GetString(strValue) {
          //Debug.debuGetStringgPrint(strValue);
          strValue = strValue.replace(/[^a-zA-Zа-яА-Я,.0-9:-\|\/]/g, ' ');
          //Debug.debugPrint(strValue);
          strValue = strValue.replace(/ +/g, '');
          //Debug.debugPrint(strValue);
          strValue = strValue.trim();
          //Debug.debugPrint(strValue);
          return strValue;
        }

        const tdSelector = '#build > table > tbody > tr > td.dur > span';
        var selection = document.querySelector(tdSelector);
        if (selection && selection.textContent) {
          return GetString(selection.textContent);
        }
        return '';
      });
      if (queryTime !== '') {
        var endOfHoliday = new Date();
        var arr = queryTime.split(':');
        console.log(endOfHoliday.toJSON());
        console.log(arr);
        if (arr[0]) {
          endOfHoliday = new Date(endOfHoliday.setHours(endOfHoliday.getHours() + 3 + parseInt(arr[0])));
        }
        console.log(endOfHoliday.toJSON());
        if (arr[1]) {
          endOfHoliday = new Date(endOfHoliday.setMinutes(endOfHoliday.getMinutes() + parseInt(arr[1])));
        }
        console.log(endOfHoliday.toJSON());
        if (arr[2]) {
          endOfHoliday = new Date(endOfHoliday.setSeconds(endOfHoliday.getSeconds() + parseInt(arr[2])));
        }
        console.log(endOfHoliday.toJSON());
        endOfHoliday = endOfHoliday.toJSON().replace('T', ' ');
        endOfHoliday = endOfHoliday.replace('Z', '').trim();
        endOfHoliday = endOfHoliday.substring(0, 19);
        console.log(row.AccountId);
        console.log(row.VillageId);
        console.log(endOfHoliday);
        Saver.SaveEndOfHoliday(row.AccountId, row.VillageId, endOfHoliday);
      } else {
        TryingStartHoliday(page, row.VillageId);
      }
    }
  }
}

async function GetButtonStartHolidayCoordinate(page) {
  var coord = await page.evaluate(() => {
    return $('#build > div.build_details.researches > div > div.information > div.contractLink > button').offset();
  });

  await sleep(Common.getRandomMS(1.7, 3.5));
  if (!coord) {
    coord = { top: 1, left: 1 };
  }
  return coord;
}

/** Start small holiday */
async function TryingStartHoliday(page, villageId) {

  var buttonCoord = await GetButtonStartHolidayCoordinate(page);
  if (buttonCoord && buttonCoord.top > 100) {
    await page.mouse.click(buttonCoord.left + 50, buttonCoord.top + 10);
    var msg = "Starting holiday in village (mouse click): " + villageId;
    DBCon.insertLogInfo('Travian', msg, msg);
  }
}

async function GetAllVillagesStoreTable(page) {
  await GotoPage(page, global_UrlDorf3 + '?s=2');
  var arrayWithStore = await page.evaluate(() => {

    function GetString(strValue) {
      //Debug.debuGetStringgPrint(strValue);
      strValue = strValue.replace(/[^a-zA-Zа-яА-Я,.0-9:-\|\/]/g, ' ');
      //Debug.debugPrint(strValue);
      strValue = strValue.replace(/ +/g, '');
      //Debug.debugPrint(strValue);
      strValue = strValue.trim();
      //Debug.debugPrint(strValue);
      return strValue;
    }

    const tableSelector = '#ressources > tbody';
    var selection = document.querySelector(tableSelector);
    if (selection === null) {
      return 'error #20190219 Can not find element with selector: ' + tableSelector;
    }

    var table = [];

    for (var i = 0; i < selection.children.length; i++) {
      var villRes = {};
      var tRow = selection.children[i];
      if (tRow.children[0] && tRow.children[0].children[0]) {
        var column0 = GetString(tRow.children[0].textContent);
        var column1 = 'https://ts2.travian.ru' + tRow.children[0].children[0].getAttribute('href');
        var column2 = GetString(tRow.children[1].textContent);
        var column3 = GetString(tRow.children[2].textContent);
        var column4 = GetString(tRow.children[3].textContent);
        var column5 = GetString(tRow.children[4].textContent);
        var column6 = GetString(tRow.children[5].textContent);
        var pos = column6.indexOf('/');
        if (pos > 0) {
          column6 = column6.substring(0, pos - 1);
        }
        villRes = {
          name: column0,
          href: column1,
          wood: column2,
          clay: column3,
          iron: column4,
          crop: column5,
          traders: column6
        };
        table.push(villRes);
      }
    }
    return table;
  });
  return arrayWithStore;
}

async function CheckFreeTraders(page) {
  const capital = 'B02';

  var villStore = await GetAllVillagesStoreTable(page);
  console.log(JSON.stringify(villStore));
  if (!villStore) {
    return;
  }
  var borderLine = 12000;
  for (var i = 0; i < villStore.length; i++) {
    var vill = villStore[i];
    if (!vill || vill.name === capital) {
      continue;
    }
    if (+vill.traders > 0) {
      if (+vill.wood > borderLine
        || +vill.clay > borderLine
        || +vill.iron > borderLine
        || +vill.crop > borderLine) {
        console.log('Can send trader in village: ' + vill.name);
      }
    }
  }

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

async function GetButtonStartBuildingText(page) {

  var buttonText = await page.evaluate(() => {
    //const buttonSelection = '#build > div.roundedCornersBox.big > div.upgradeButtonsContainer.section2Enabled > div.section1';
    //const buttonSelection2 = '#build .upgradeButtonsContainer > div.section1';

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

async function GetButtonStartBuildingCoordinate(page) {
  var coord = await page.evaluate(() => {
    return $('.upgradeButtonsContainer .section1 button').offset();
  });

  await sleep(Common.getRandomMS(1.7, 3.5));
  if (!coord) {
    coord = { top: 1, left: 1 };
  }
  return coord;
}

async function TryToStartBuilding(page, gotoBuildingUrl, accountId, rows) {

  await GotoPage(page, gotoBuildingUrl, 0.3, 2);

  var buttonReady = await GetButtonStartBuildingText(page);
  var buttonCoord = await GetButtonStartBuildingCoordinate(page);

  var msg = "Button start building text = " + buttonReady + " " + JSON.stringify(buttonCoord);
  Debug.debugPrint(msg);
  DBCon.insertLogInfo('Travian', msg, msg);

  await page.screenshot({ path: 'ts2.travian.png' });

  var result = false;
  if (buttonReady === "Улучшитьдоуровня1") {
    await page.mouse.click(buttonCoord.left + 50, buttonCoord.top + 10);
    result = true;
  } else if (buttonReady.indexOf("Улучшитьдо") >= 0) {
    await page.mouse.click(buttonCoord.left + 50, buttonCoord.top + 10);
    result = true;
  } else if (buttonReady.indexOf("Построитьсархитектором") >= 0) {
    Debug.debugPrint("Button for building is not ready or building completed!");
    await GotoPage(page, global_UrlDorf1, 3, 5);
  }

  if (rows === 'town') {
    var msg = "ScrapDorf2Page after click trying button start building";
    DBCon.insertLogInfo('Travian', msg, msg);
    var dorf2PageInfo = await Scraper.ScrapDorf2Page(page, global_UrlDorf2);
    Saver.SaveDorf2Page(dorf2PageInfo, accountId);
  }
  else {
    var msg = "ScrapDorf1Page after click trying button start building";
    DBCon.insertLogInfo('Travian', msg, msg);
    var dorf1PageInfo = await Scraper.ScrapDorf1Page(page, global_UrlDorf1);
    Saver.SaveDorf1Page(dorf1PageInfo, accountId);
  }

  return result;
}

/** */
async function RunBulidingInTown(page, rows, accountId, villageId) {
  var result = false;
  if (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    var msg = "Village id: " + villageId + ". Random select to build: " + rows[i].Name + " " + rows[i].Level;
    DBCon.insertLogInfo('Travian', msg, msg);
    var gotoBuildingUrl = rows[i].Href; // Building href
    if (gotoBuildingUrl) {
      await GotoPage(page, global_UrlDorf2 + '?newdid=' + villageId + '&', 0.5, 1); // Goto village page
      result = await TryToStartBuilding(page, gotoBuildingUrl, accountId, 'town'); // Goto building page
    }
  }
  return result;
}

/** Start building house in town if it posible */
async function BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) {
  var rows = await Reader.getTownHousesWhatWeCanBuildInVillageFromDB(accountId, villageId, housesIsRow, housesLevel);
  if (rows && rows.length > 0) {
    Debug.debugPrint("-- " + housesIsRow + " " + housesLevel + " JSON: " + JSON.stringify(rows));
    await RunBulidingInTown(page, rows, accountId, villageId);
    //!!! Always stop query !!! 
    return true;
  };
  return false;
}

/** Starting building process*/
async function StartBuildInVillage(page, accountId, villageId) {
  Debug.debugPrint("------------------------------------------------------");
  Debug.debugPrint("--  StartBuildInVillage: " + villageId);
  var msg = "Village id: " + villageId + ". Try to start build in village";
  DBCon.insertLogInfo('Travian', msg, msg);


  var housesIsRow = "";
  var housesLevel = "";

  //------------------------------------------------------------------------------
  // g15 - Main Building
  housesIsRow = "'g15'";
  housesLevel = "'5'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  'g10' - Store
  'g11' - Barn
  */
  housesIsRow = "'g10','g11'";
  housesLevel = "'3'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  Resources fields
  */
  housesIsRow = "Resources fields";
  housesLevel = "'4'";
  var rows = await Reader.getResourcesFieldsWhatWeCanBuildInVillageFromDB(accountId, villageId, housesLevel);
  if (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    var msg = "Village id: " + villageId + ".   Random select to build: " + rows[i].Name + " " + rows[i].Level;
    DBCon.insertLogInfo('Travian', msg, msg);
    var gotoBuildingUrl = rows[i].Href; // Building href
    if (gotoBuildingUrl) {
      await GotoPage(page, global_UrlDorf1 + '?newdid=' + villageId + '&', 0.5, 1); // Goto village page
      await TryToStartBuilding(page, gotoBuildingUrl, accountId, rows); // Goto building page
    }
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  //------------------------------------------------------------------------------
  // g15 - Main Building
  housesIsRow = "'g15'";
  housesLevel = "'7'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  'g13' - Kuznitza
  'g19' - Kazarma
  'g20' - Konushnya
  'g22' - Akademiya*/
  housesIsRow = "'g13','g19','g20','g22'";
  housesLevel = "'3'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  'g10' - Store
  'g11' - Barn
  */
  housesIsRow = "'g10','g11'";
  housesLevel = "'7'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  Resources fields
  */
  housesIsRow = "Resources fields";
  housesLevel = "'6'";
  var rows = await Reader.getResourcesFieldsWhatWeCanBuildInVillageFromDB(accountId, villageId, "'6'");
  if (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    DBCon.insertLogInfo('Travian', "Случайным способом выбрали строить: " + rows[i].Name + " " + rows[i].Level);
    var gotoBuildingUrl = rows[i].Href; // Building href
    if (gotoBuildingUrl) {
      await GotoPage(page, global_UrlDorf1 + '?newdid=' + villageId + '&', 0.5, 1); // Goto village page
      await TryToStartBuilding(page, gotoBuildingUrl, accountId, rows); // Goto building page
    }
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  //------------------------------------------------------------------------------
  // g15 - Main Building
  housesIsRow = "'g15'";
  housesLevel = "'15'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  'g10' - Store
  'g11' - Barn
  */
  housesIsRow = "'g10','g11'";
  housesLevel = "'12'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  'g5-9' - factory, mill, baker
  */
  housesIsRow = "'g5','g6','g7','g8','g9'";
  housesLevel = "'5'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }


  /*------------------------------------------------------------------------------
  Resources fields
  */
  housesIsRow = "Resources fields";
  housesLevel = "'8'";
  var rows = await Reader.getResourcesFieldsWhatWeCanBuildInVillageFromDB(accountId, villageId, housesLevel);
  if (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    DBCon.insertLogInfo('Travian', "Случайным способом выбрали строить: " + rows[i].Name + " " + rows[i].Level);
    var gotoBuildingUrl = rows[i].Href; // Building href
    if (gotoBuildingUrl) {
      await GotoPage(page, global_UrlDorf1 + '?newdid=' + villageId + '&', 0.5, 1); // Goto village page
      await TryToStartBuilding(page, gotoBuildingUrl, accountId, rows); // Goto building page
    }
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  'g10' - Store
  'g11' - Barn
  */
  housesIsRow = "'g10','g11'";
  housesLevel = "'16'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }


  //------------------------------------------------------------------------------
  // g15 - Main Building
  housesIsRow = "'g15'";
  housesLevel = "'20'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  /*------------------------------------------------------------------------------
  Resources fields
  */
  housesIsRow = "Resources fields";
  housesLevel = "'10'";
  var rows = await Reader.getResourcesFieldsWhatWeCanBuildInVillageFromDB(accountId, villageId, housesLevel);
  if (rows.length > 0) {
    var i = Math.round(Math.random() * Math.min(rows.length - 1, 5));
    DBCon.insertLogInfo('Travian', "Случайным способом выбрали строить: " + rows[i].Name + " " + rows[i].Level);
    var gotoBuildingUrl = rows[i].Href; // Building href
    if (gotoBuildingUrl) {
      await GotoPage(page, global_UrlDorf1 + '?newdid=' + villageId + '&', 0.5, 1); // Goto village page
      await TryToStartBuilding(page, gotoBuildingUrl, accountId, rows); // Goto building page
    }
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }

  //------------------------------------------------------------------------------
  // g36 - Kapkan
  housesIsRow = "'g36'";
  housesLevel = "'20'";
  if (await BuildingTownHouseWasStarted(page, accountId, villageId, housesIsRow, housesLevel) === true) {
    return;
  } else {
    var msg = "Village id: " + villageId + ". Do not need to build " + housesIsRow + " lvl < " + housesLevel;
    DBCon.insertLogInfo('Travian', msg, msg);
  }
}


/** Loging into the game, return 1 if we in the game */
async function LoginToTravian(page, loginInfo) {

  var msg = "Try to login into game.";
  DBCon.insertLogInfo('Travian', msg, msg);

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
  var msg = "Goto: " + pageUrl + " with waiting " + waitTime + " milisec.";
  Debug.debugPrint(msg);
  DBCon.insertLogInfo('Travian', msg, msg);
  await sleep(waitTime);
  await page.screenshot({ path: 'before_goto_url.png' });
  try {
    await page.goto(pageUrl);
    await page.screenshot({ path: 'after_goto_url.png' });
  } catch (ex) {
    page = null;
  }
  await sleep(300);
}

try {
  start(login_info);
}
catch (err) {
  Debug.debugPrint("Fatal Error. Exiting...");
  return;
};

