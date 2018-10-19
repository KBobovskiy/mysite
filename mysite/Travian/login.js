const puppeteer = require('puppeteer');
const login_info = require("./login_info");
const DBCon = require("../serverApp/DBConnection.js");
const sleep = require('sleep-promise');
const Promise = require('bluebird');
var fs = require('fs')


puppeteer.defaultArgs({ headless: false });

async function start(loginInfo) {

  let errMsg = 'Starting';
  DBCon.insertLogInfo('Travian', errMsg);


  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })

  await LoginToTravian(page, loginInfo);

  // Let's testing, can we play or not
  var pageUrl = 'https://tx3.travian.ru/dorf1.php';
  await sleep(getRandomMS(1, 2.5));
  await page.goto(pageUrl);
  var result = await page.evaluate(() => {
    const warehouseSelector = '#stockBarWarehouse';
    //console.log("typeof = " + typeof document.querySelector(warehouseSelector));
    return !(typeof document.querySelector(warehouseSelector) === 'undeined');
  });
  //console.log('result=' + result);
  if (!result) { return; }

  // scraping information from current dorf1 page
  var pageUrl = 'https://tx3.travian.ru/dorf1.php';
  var dorf1PageInfo = await ScrapDorf1Page(page, pageUrl);

  SaveDorf1Page(dorf1PageInfo);

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

async function SaveDorf1Page(dorf1PageInfo) {

  var accountId = 1;

  SaveVillageList(dorf1PageInfo.villageList, accountId);

  SaveVillageStorages(dorf1PageInfo.storageInfo, accountId, dorf1PageInfo.villageId);

  SaveVillageResourses(dorf1PageInfo.villageFields, accountId, dorf1PageInfo.villageId);

  SaveVillageProdactionInfo(dorf1PageInfo.prodactionInfo, accountId, dorf1PageInfo.villageId);

  SaveVillageBuildingHouses(dorf1PageInfo.buildingHouses, accountId, dorf1PageInfo.villageId);

}

/** Save current building houses with time of the end of finishing the construction */
async function SaveVillageBuildingHouses(buildingHouses, accountId, villageId) {
  //console.log(buildingHouses);
  if (buildingHouses && accountId && villageId) {

    buildingHouses.forEach(building => {
      //console.log(building);
      var now = new Date(new Date() + 60 * 60 * 3 * 1000);

      DateTimeNow = '' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
      DateTimeEnd = '' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + building.endOfConstructionTime + ':59';
      if (DateTimeNow > DateTimeEnd) {
        now = new Date() + 23 * 60 * 60 * 1000;
        var now = new Date();
        now.setDate(now.getDate() + 1);
        DateTimeEnd = '' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + building.endOfConstructionTime + ':59';
      }
      //console.log(DateTimeNow + ' => ' + DateTimeEnd);
      DBCon.insertQuery("INSERT INTO`thetale`.`tr_VillageBuilding`(`AccountId`, `VillageId`, `Name`, `EndOfBuilding`, `Level`) VALUES('" + accountId + "', '" + villageId.trim() + "', '" + building.name + "', '" + DateTimeEnd + "', '" + building.level + "');"
        , "Travian");
    });
  }
}

/** Save village resourses prodaction per hour */
async function SaveVillageProdactionInfo(prodactionInfo, accountId, villageId) {
  if (prodactionInfo && villageId && accountId) {
    DBCon.insertQuery("INSERT INTO`thetale`.`tr_VillageProdaction`(`AccountId`, `VillageId`, `Wood`, `Clay`, `Iron`, `Crop`) VALUES('" + accountId + "', '" + villageId.trim() + "', '" + prodactionInfo.wood + "', '" + prodactionInfo.clay + "', '" + prodactionInfo.iron + "', '" + prodactionInfo.crop + "');"
      , "Travian");
  }
}

/** Save village store capacity and stocks */
async function SaveVillageStorages(storageInfo, accountId, villageId) {
  console.log("dorf1PageInfo.villageId = " + villageId + " store: " + storageInfo);
  if (storageInfo && villageId && accountId) {
    DBCon.insertQuery("INSERT INTO`thetale`.`tr_VillageStore`(`AccountId`, `VillageId`, `Warehouse`, `Granary`, `FreeCorp`, `Wood`, `Clay`, `Iron`, `Crop`) VALUES('" + accountId + "','" + villageId.trim() + "', '" + storageInfo.warehouse + "', '" + storageInfo.granary + "', '" + storageInfo.freeCrop + "', '" + storageInfo.wood + "', '" + storageInfo.clay + "', '" + storageInfo.iron + "', '" + storageInfo.crop + "');"
      , "Travian");
  }
}

/** Save resourses fields into DB */
async function SaveVillageResourses(villageFields, accountId, villageId) {

  if (!villageId) {
    return;
  }
  for (let i = 0; i < villageFields.length; i++) {
    var currentField = villageFields[i];
    DBCon.insertQuery(
      "INSERT INTO`thetale`.`tr_VillageResources` (`AccountId`, `VillageId`, `Name`, `Href`, `PositionId`, `Level`)\
      VALUES ('"+ accountId + "', '" + villageId + "', '" + currentField.name + "', '" + currentField.href + "', '" + currentField.positionId + "','" + currentField.level + "')\
      ON DUPLICATE KEY UPDATE `Name` = '" + currentField.name + "', `Level` = '" + currentField.level + "'; ", 'Travian');
  }
}

/** Save village list into DB */
async function SaveVillageList(villageList, accountId) {
  if (!villageList) {
    return;
  }
  for (let i = 0; i < villageList.length; i++) {
    var currentVillage = villageList[i];
    DBCon.insertQuery(
      "INSERT INTO`thetale`.`tr_Villages` (`id`, `AccountId`, `Name`, `Coordinate`, `Coordinate_X`, `Coordinate_Y`,`Href`)\
      VALUES ('"+ currentVillage.id + "', '" + accountId + "', '" + currentVillage.name + "', '" + currentVillage.coordinats + "', '" + currentVillage.coordinatX + "','" + currentVillage.coordinatY + "', '" + currentVillage.href + "')\
      ON DUPLICATE KEY UPDATE `Name` = '" + currentVillage.name + "'; ", 'Travian');
  }
}

/** Loging into the game, return 1 if we in the game */
async function LoginToTravian(page, loginInfo) {
  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 7;
  await page.goto('https://tx3.travian.ru/');
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

async function ScrapingStoreInfo(page) {

  var storageInfo = await page.evaluate(() => {

    function GetNumber(strValue, parseToInt) {
      strValue = strValue.replace(/[^0-9-]/g, '');
      strValue = strValue.trim();
      console.log(strValue);
      if (parseToInt) {
        return parseInt(strValue);
      }
      return strValue;
    }

    const warehouseSelector = '#stockBarWarehouse';
    const granarySelector = '#stockBarGranary';
    const Selector = '#stockBarFreeCrop';
    const woodSelector = '#l1';
    const claySelector = '#l2';
    const ironSelector = '#l3';
    const cropSelector = '#l4';
    var result = {};
    result.warehouse = GetNumber(document.querySelector(warehouseSelector).textContent, true);
    result.granary = GetNumber(document.querySelector(granarySelector).textContent, true);
    result.wood = GetNumber(document.querySelector(woodSelector).textContent, true);
    result.clay = GetNumber(document.querySelector(claySelector).textContent, true);
    result.iron = GetNumber(document.querySelector(ironSelector).textContent, true);
    result.crop = GetNumber(document.querySelector(cropSelector).textContent, true);
    result.freeCrop = GetNumber(document.querySelector(Selector).textContent, true);
    return result;
  });
  if (!storageInfo) {
    storageInfo = {
      warehouse: 0, granary: 0, wood: 0, clay: 0, iron: 0, crop: 0, freeCrop: 0
    }
    return storageInfo;
  }
  return storageInfo;
}

async function ScrapingProdactionInfo(page) {

  var prodactionInfo = await page.evaluate(() => {

    function GetNumber(strValue, parseToInt) {
      strValue = strValue.replace(/[^0-9-]/g, '');
      strValue = strValue.trim();
      console.log(strValue);
      if (parseToInt) {
        return parseInt(strValue);
      }
      return strValue;
    }

    const woodSelector = '#production > tbody > tr:nth-child(1) > td.num';
    const claySelector = '#production > tbody > tr:nth-child(2) > td.num';
    const ironSelector = '#production > tbody > tr:nth-child(3) > td.num';
    const cropSelector = '#production > tbody > tr:nth-child(4) > td.num';
    var result = {};
    result.wood = GetNumber(document.querySelector(woodSelector).textContent, true);
    result.clay = GetNumber(document.querySelector(claySelector).textContent, true);
    result.iron = GetNumber(document.querySelector(ironSelector).textContent, true);
    result.crop = GetNumber(document.querySelector(cropSelector).textContent, true);
    return result;
  });
  if (!prodactionInfo) {
    prodactionInfo = {
      wood: 0, clay: 0, iron: 0, crop: 0
    }
  }
  return prodactionInfo;
}

async function ScrapingVillageList(page) {

  var villageList = await page.evaluate(() => {

    function GetString(strValue) {
      //console.log(strValue);
      strValue = strValue.replace(/[^a-zA-Zа-яА-Я ,.0-9:-\|]/g, ' ');
      //console.log(strValue);
      strValue = strValue.replace(/ +/g, ' ');
      //console.log(strValue);
      strValue = strValue.trim();
      //console.log(strValue);
      return strValue;
    }
    var villagesListTemplateSelector = '#sidebarBoxVillagelist > div.sidebarBoxInnerBox > div.innerBox.content > ul';
    var villageList = new Array;

    var allVillage = $(villagesListTemplateSelector);

    for (var i = 0; i < allVillage[0].children.length; i++) {
      var name = allVillage[0].children[i].innerText.trim();
      var href = allVillage[0].children[i].children[0].href;
      name = name.split('\n');
      name[0] = GetString(name[0]);
      var coordinates = name[2];
      coordinates = coordinates.replace('(', '').replace(')', '');
      coordinates = coordinates.split('|')

      var id = null;
      var pos = href.indexOf('newdid=');
      if (pos > 0) {
        id = href.slice(pos + 7);
        id = id.replace(/[^0-9]+/g, '');
      }
      villageList.push({ id: id, href: href, name: name[0], coordinats: coordinates[0] + '|' + coordinates[1], coordinatX: coordinates[0].trim(), coordinatY: coordinates[1].trim() });
    }
    return villageList;
  });
  return villageList;
}

async function ScrapingFieldsInfo(page) {
  var villageFields = await page.evaluate(() => {

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

    var fieldsList = new Array;
    var villageFieldsTemplateSelector = '#rx';

    var allFields = $(villageFieldsTemplateSelector);
    for (var i = 0; i < allFields[0].children.length; i++) {

      var fieldName = GetString(allFields[0].children[i].getAttribute('alt'));
      var fieldLvl = GetNumber(fieldName);
      var fieldName = fieldName.replace(/[0-9]+/g, '');
      var fieldName = fieldName.replace('Уровень', '');
      fieldName = fieldName.trim();
      fieldName = fieldName.replace(/[^a-z*A-Z*а-я*А-Я*0-9* ]+/g, '');

      var fieldLink = allFields[0].children[i].href;
      var idPos = fieldLink.indexOf('id=');
      if (idPos > 0) {
        //console.log(idPos);
        var id = fieldLink.slice(idPos + 3);
      }

      if (fieldLink.indexOf('dorf2.php') > 0) {
        //console.log(fieldLink);
        continue;
      }
      fieldsList.push({ name: fieldName, level: fieldLvl, positionId: id, href: fieldLink });
    };

    return fieldsList;
  })
  return villageFields;
}

/**Scraping storage capacity and current resourses in it */
async function ScrapDorf1Page(page, gotoUrl) {

  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 10;
  await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  await page.goto(gotoUrl);

  var villageName = await page.evaluate(() => {
    const villageNameSelector = '#villageNameField';
    return document.querySelector(villageNameSelector).textContent.replace('.', '').trim();
  });

  var storageInfo = await ScrapingStoreInfo(page);

  var prodactionInfo = await ScrapingProdactionInfo(page);

  var villageList = await ScrapingVillageList(page);

  var villageFields = await ScrapingFieldsInfo(page);

  //console.log("villageName='" + villageName + "'");
  var villageId = 0;
  for (let i = 0; i < villageList.length; i++) {
    //console.log("villageList[i].name = '" + villageList[i].name + "'");
    if (villageName == villageList[i].name) {
      villageId = villageList[i].id;
    }
  }
  //console.log("villageId='" + villageId + "'");


  var buildingHouses = await page.evaluate(() => {

    var buildingHouseNameTemplateSelector = '#content > div.boxes.buildingList > div.boxes-contents.cf > ul > li:nth-child(buldingIndex) > div.name';
    var buildingHouseLevelTemplateSelector = '#content > div.boxes.buildingList > div.boxes-contents.cf > ul > li:nth-child(buldingIndex) > div.name > span';
    var buildingHouseDurationTemplateSelector = '#content > div.boxes.buildingList > div.boxes-contents.cf > ul > li:nth-child(buldingIndex) > div.buildDuration';

    var buildingHousesList = new Array;
    for (var i = 1; i < 3; i++) {
      var name = $(buildingHouseNameTemplateSelector.replace('buldingIndex', i));
      var level = $(buildingHouseLevelTemplateSelector.replace('buldingIndex', i));
      var duration = $(buildingHouseDurationTemplateSelector.replace('buldingIndex', i));

      if (name.length > 0) {

        nameText = name[0].innerText
        nameText = nameText.replace(level[0].innerText, '');
        //console.log(nameText);

        levelText = level[0].innerText;
        levelText = levelText.replace('Уровень', '').trim();
        //console.log(levelText);

        var endTimeConstruction = duration[0].innerText;
        var pos = endTimeConstruction.indexOf('Готово в');
        endTimeConstruction = endTimeConstruction.slice(pos + 8).trim();
        //console.log(endTimeConstruction);

        buildingHousesList.push({ name: nameText, level: levelText, endOfConstructionTime: endTimeConstruction });
      }
    }
    return buildingHousesList;
  })

  return {
    storageInfo: storageInfo,
    prodactionInfo: prodactionInfo,
    villageName: villageName,
    villageId: villageId,
    villageList: villageList,
    villageFields: villageFields,
    buildingHouses: buildingHouses
  };
}

/** Returns random number in miliseconds for sleeping */
function getRandomMS(min, max) {
  return Math.random() * 1000 * (max - min) + min;
}

start(login_info);
