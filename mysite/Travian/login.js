const puppeteer = require('puppeteer');
const login_info = require("./login_info");
const DBCon = require("../serverApp/DBConnection.js");
const Debug = require("../serverApp/debug.js");
const sleep = require('sleep-promise');

const Scraper = require("TravianScraper");
const Saver = require("TravianSaver");

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
  await sleep(getRandomMS(1, 2.5));
  console.log("Goto: " + pageUrl);
  await page.goto(pageUrl);
  var result = await page.evaluate(() => {
    const warehouseSelector = '#stockBarWarehouse';
    //console.log("typeof = " + typeof document.querySelector(warehouseSelector));
    return !(typeof document.querySelector(warehouseSelector) === 'undeined');
  });
  //console.log('result=' + result);
  if (!result) { return; }

  //
  //
  //
  var arrayWithDorf1PageInfo = await Scraper.ScrapingAllVillagesDorf1(page, accountId);
  var Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
  while (Dorf1PageInfo) {
    await Saver.SaveDorf1Page(dorf1PageInfo, accountId);
    Dorf1PageInfo = arrayWithDorf1PageInfo.pop();
    await sleep(1000);
  }

  //
  //
  //

  var i = 0;
  while (i < 100) {
    await StartAllBuildings(page, accountId);
    i++;
    var minSleepTimeInSec = 180;
    var maxSleepTimeInSec = 360;
    var waitTime = getRandomMS(minSleepTimeInSec, maxSleepTimeInSec) / 1000;
    console.log("sleep for " + waitTime + "sec");
    await sleep(waitTime * 1000);
  }

  await page.screenshot({ path: 'tx3.travian.png' });

  DBCon.insertLogInfo('Travian', 'Stop');
  //await browser.close();
}

function GetString(strValue) {
  //console.log(strValue);
  strValue = strValue.replace(/[^a-zA-Zа-яА-Я ,.0-9:-]+/g, ' ');
  //console.log(strValue);
  strValue = strValue.replace(/ +/g, ' ');
  //console.log(strValue);
  strValue = strValue.trim();
  //console.log(strValue);
  return strValue;
}

function GetNumber(strValue, parseToInt) {
  strValue = strValue.replace(/[^0-9-]/g, '');
  strValue = strValue.trim();
  console.log(strValue);
  if (parseToInt) {
    return parseInt(strValue);
  }
  return strValue;
}

function GetTime(strValue) {
  //console.log(strValue);
  strValue = strValue.match(/[0-9]+:[0-9]+:[0-9]+/);
  if (strValue.length = 1) {
    //console.log(strValue[0]);
    return strValue[0];
  }
  return '';
}

function GetFullID(acc, vill, posId) {
  var id = acc + '#' + vill + '#' + posId;
  id = id.replace(/[^0-9#]/g, '');
  return id;
}

async function getWhatWeCanBuildFromDB(accountId) {
  var query =
    "SELECT\
    AllRes.AccountId\
      , AllRes.VillageId\
      , AllRes.Name\
      , AllRes.Level\
      , AllRes.Href\
      , AllRes.PositionId\
      , Villages.Name VillageName\
      , Villages.Href VillageHref\
    FROM\
          (\
          SELECT\
      VillRes.AccountId\
          , VillRes.VillageId\
          , VillRes.Name\
          , VillRes.Href\
          , VillRes.Level\
          , VillRes.PositionId\
    FROM thetale.tr_VillageResources VillRes\
    INNER JOIN(\
            SELECT max(id) id\
            , AccountId\
            , VillageId\
            , PositionId\
      FROM thetale.tr_VillageResources\
      WHERE AccountId = "+ accountId + "\
      group by AccountId, VillageId, PositionId\
          ) IdList ON IdList.id = VillRes.id\
    WHERE VillRes.Level < 10\
          ) AllRes\
    INNER JOIN thetale.tr_Villages Villages\
    ON Villages.AccountId = AllRes.AccountId and Villages.id = AllRes.VillageId\
    LEFT JOIN (\
      SELECT\
        AccountId\
        ,VillageId\
        ,EndOfBuilding\
      FROM thetale.tr_VillageBuilding as VillBuilding\
      WHERE\
        VillBuilding.AccountId = "+ accountId + "\
        and VillBuilding.id in (\
          SELECT  \
            max(id) id\
          FROM thetale.tr_VillageBuilding as VillBuildingForMaxId\
          WHERE\
            AccountId = "+ accountId + "\
          GROUP BY\
            AccountId, VillageId)\
      ) as VillBuilding\
      ON VillBuilding.AccountId = AllRes.AccountId and VillBuilding.VillageId = AllRes.VillageId\
    WHERE (VillBuilding.EndOfBuilding <= '" + getNow() + "' OR VillBuilding.EndOfBuilding is null)\
    ORDER BY AllRes.Level;"
  console.log(query);
  var rows = await DBCon.selectQuery(query, "Travian");

  DBCon.insertLogInfo('Travian', "Найдено вохможных строек: " + rows.length);
  return rows;
}

function RemoveVillageById(arr, villageId) {
  console.log("Удаляем деревню: " + villageId);
  var i = arr.length
  var newArr = [];
  for (var i = arr.length - 1; i >= 0; i--) {
    if (arr[i].VillageId != villageId) {
      newArr.push(arr[i]);
    }
  }
  console.log(arr);
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
      await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
      console.log("Goto: " + gotoUrl);
      await page.goto(gotoUrl);
      gotoUrl = rows[i].Href;
      if (gotoUrl) {
        await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
        console.log("Goto: " + gotoUrl);
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
            console.log(innerText);
            if (innerText === "Улучшитьдоуровня1") {
              console.log("Улучшить готово до уровня 1");
              return 1;
            } else if (innerText.indexOf("Улучшитьдо") >= 0) {
              console.log("Улучшить готово");
              return true;
            } else if (innerText.indexOf("Построитьсархитектором") >= 0) {
              console.log("Архитектор");
              return false;
            }
          }
          return false;
        });
        console.log("buttonReady=" + buttonReady);
        if (buttonReady === 1) {
          await page.mouse.click(946, 462);
        } else if (buttonReady) {
          await page.mouse.click(814, 462);
        } else {
          console.log("Button for building is not ready or building complite!");
          // return to dorf1 page
          var pageUrl = 'https://tx3.travian.ru/dorf1.php';
          console.log("Goto: " + pageUrl);
          await page.goto(pageUrl);
          await sleep(getRandomMS(3, 5));

          //await page.goto(pageUrl);
        }
        console.log("ScrapDorf1Page after click trying button start building");
        var gotoUrl = 'https://tx3.travian.ru/dorf1.php';
        var dorf1PageInfo = await ScrapDorf1Page(page, gotoUrl);
        SaveDorf1Page(dorf1PageInfo, accountId);
        var j = rows.length;
        for (var j = rows.length - 1; j >= 0; j--) {
          if (rows[j].VillageId == villageId) {
            //console.log("Delete by index: " + j);
            rows.splice(j, 1);
          }
        }
        console.log(rows);
      }
    }
  }

}

/** Starting building in free village */
async function StartAllBuildings(page, accountId) {
  var rows = await getWhatWeCanBuildFromDB(accountId);
  console.log("getWhatWeCanBuildFromDB return: " + rows.length + " rows");
  console.log(rows);
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

/** Returns array with villages hrefs */
async function GetAllVillagesHref(accountId) {
  var rows = await DBCon.selectQuery("SELECT distinct href FROM thetale.tr_Villages where AccountId = " + accountId, "Travian");
  var hrefs = [];
  while (rows.length > 0) {
    let href = rows.pop();
    hrefs.push(href.href);
  }
  console.log(hrefs);
  return hrefs;
}



/** Returns array with villages hrefs
 * 
 */
async function GetAllVillagesHref() {
  var rows = await DBCon.selectQuery("SELECT distinct href FROM thetale.tr_Villages where AccountId = 1", "Travian");
  var hrefs = [];
  while (rows.length > 0) {
    let href = rows.pop();
    hrefs.push(href.href);
  }
  console.log(hrefs);
  return hrefs;
}


/** Loging into the game, return 1 if we in the game */
async function LoginToTravian(page, loginInfo) {
  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 7;
  var pageUrl = 'https://tx3.travian.ru/';
  console.log("Goto: " + pageUrl);
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
  await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  await page.mouse.click(856, 378);
  await sleep(getRandomMS(minSleepTimeInSec / 2, maxSleepTimeInSec / 2));
  return 1;
}


/** Returns random number in miliseconds for sleeping */
function getRandomMS(min, max) {
  return (Math.random() * (max - min) + min) * 1000;
}

function getNow() {
  var nowDateTime = new Date();
  nowDateTime.setHours(nowDateTime.getHours() + 3);
  nowDateTime = nowDateTime.toISOString();
  nowDateTime = nowDateTime.slice(0, 19).replace('T', ' ');
  console.log("Date time = " + nowDateTime);
  return nowDateTime;
}

start(login_info);


