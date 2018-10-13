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

  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 10;
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })
  await page.goto('https://tx3.travian.ru/');
  let login = loginInfo.account.login;
  let password = loginInfo.account.password;
  await page.evaluate((login, password) => {
    const loginInputSelector = '#content > div.outerLoginBox > div.innerLoginBox > form > table > tbody > tr.account > td:nth-child(2) > input';
    const passwordInputSelector = '#content > div.outerLoginBox > div.innerLoginBox > form > table > tbody > tr.pass > td:nth-child(2) > input';

    document.querySelector(loginInputSelector).value = login;
    document.querySelector(passwordInputSelector).value = password;
    //document.querySelector(lowResolutionCheckBoxSelector).value = 1;

  }, login, password);
  const lowResolutionCheckBoxSelector = '#lowRes';
  let lowResolution = await page.evaluate(() => {
    const lowResolutionCheckBoxSelector = '#lowRes';
    return document.querySelector(lowResolutionCheckBoxSelector).value;
  });
  //if (!lowResolution) {
  await page.click(lowResolutionCheckBoxSelector);
  //}
  await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  await page.mouse.click(856, 378);

  var dorf1PageInfo = await ScrapDorf1Page(page);

  console.log(dorf1PageInfo);

  /** Saving data into DB */
  if (dorf1PageInfo.villageList) {

    for (i = 0; i < dorf1PageInfo.villageList.length; i++) {
      var currentVillage = dorf1PageInfo.villageList[i];
      DBCon.insertQuery(
        "INSERT INTO`thetale`.`tr_Villages` (`id`, `AccountId`, `Name`, `Coordinate`, `Coordinate_X`, `Coordinate_Y`,`Href`)\
        VALUES ('"+ currentVillage.id + "', '1', '" + currentVillage.name + "', '" + currentVillage.coordinats + "', '" + currentVillage.coordinatX + "','" + currentVillage.coordinatY + "', '" + currentVillage.href + "'); ", 'Travian');

    }
  }

  if (dorf1PageInfo.storageInfo) {
    var store = dorf1PageInfo.storageInfo;

    DBCon.insertQuery(
      "INSERT INTO`thetale`.`tr_VillageStore`\
        (`VillageId`, `Warehouse`, `Granary`, `FreeCorp`, `Wood`, `Clay`, `Iron`, `Crop`)\
      VALUES\
        ("+ store.villageId + ", " + store.warehouse + ", " + store.granary + ", " + store.freeCrop + ", "
      + store.wood + ", " + store.clay + ", " + store.iron + ", " + store.crop + ")"
    );
  }

  await page.screenshot({ path: 'tx3.travian.png' });

  DBCon.insertLogInfo('Travian', 'Stop');
  //await browser.close();
}

/**Scraping storage capacity and current resourses in it */
async function ScrapDorf1Page(page) {

  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 10;
  await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  await page.goto('https://tx3.travian.ru/dorf1.php');


  var storageInfo = await page.evaluate(() => {

    const warehouseSelector = '#stockBarWarehouse';
    const granarySelector = '#stockBarGranary';
    const Selector = '#stockBarFreeCrop';
    const woodSelector = '#l1';
    const claySelector = '#l2';
    const ironSelector = '#l3';
    const cropSelector = '#l4';
    var result = {};
    result.warehouse = parseInt(document.querySelector(warehouseSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    result.granary = parseInt(document.querySelector(granarySelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    result.wood = parseInt(document.querySelector(woodSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    result.clay = parseInt(document.querySelector(claySelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    result.iron = parseInt(document.querySelector(ironSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    result.crop = parseInt(document.querySelector(cropSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    result.freeCrop = parseInt(document.querySelector(Selector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    //console.log(result);
    return result;
  });
  if (!storageInfo) {
    storageInfo = {};
    storageInfo.warehouse = 0;
    storageInfo.granary = 0;
    storageInfo.wood = 0;
    storageInfo.clay = 0;
    storageInfo.iron = 0;
    storageInfo.crop = 0;
    storageInfo.freeCrop = 0;
  }


  var prodactionInfo = await page.evaluate(() => {

    const woodSelector = '#production > tbody > tr:nth-child(1) > td.num';
    const claySelector = '#production > tbody > tr:nth-child(2) > td.num';
    const ironSelector = '#production > tbody > tr:nth-child(3) > td.num';
    const cropSelector = '#production > tbody > tr:nth-child(4) > td.num';
    var result = {};
    result.wood = parseInt(document.querySelector(woodSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''), 10);
    //console.log(document.querySelector(woodSelector).textContent);
    //console.log(document.querySelector(woodSelector));
    result.clay = parseInt(document.querySelector(claySelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''), 10);
    result.iron = parseInt(document.querySelector(ironSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''), 10);
    result.crop = parseInt(document.querySelector(cropSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''), 10);
    console.log(document.querySelector(cropSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, ''));
    console.log(parseInt(document.querySelector(cropSelector).textContent.replace('.', '').trim().replace(/[^-0-9]+/g, '')));
    console.log(result);
    return result;
  });
  if (!prodactionInfo) {
    prodactionInfo = {};
    prodactionInfo.wood = 0;
    prodactionInfo.clay = 0;
    prodactionInfo.iron = 0;
    prodactionInfo.crop = 0;
  }


  var villageName = await page.evaluate(() => {

    const villageNameSelector = '#villageNameField';
    return document.querySelector(villageNameSelector).textContent.replace('.', '').trim();
  });


  var villageList = await page.evaluate(() => {

    var villagesListTemplateSelector = '#sidebarBoxVillagelist > div.sidebarBoxInnerBox > div.innerBox.content > ul';
    var villageList = new Array;

    var allVillage = $(villagesListTemplateSelector);

    for (var i = 0; i < allVillage[0].children.length; i++) {
      var name = allVillage[0].children[i].innerText.trim();
      var href = allVillage[0].children[i].children[0].href;
      name = name.split('\n');
      var coordinates = name[2];
      coordinates = coordinates.replace('(', '').replace(')', '');
      coordinates = coordinates.split('|')

      var id = null;
      var pos = href.indexOf('newdid=');
      if (pos > 0) {
        id = href.slice(pos + 7);
        id = id.replace(/[^0-9]+/g, '');
      }
      villageList.push({ id: id, href: href, name: name[0], coordinats: coordinates[0] + '|' + coordinates[1], coordinatX: coordinates[0], coordinatY: coordinates[1] });
    }
    return villageList;
  })


  var villageFields = await page.evaluate(() => {

    var fieldsList = new Array;
    var villageFieldsTemplateSelector = '#rx';

    var allFields = $(villageFieldsTemplateSelector);
    for (var i = 0; i < allFields[0].children.length; i++) {

      var fieldName = allFields[0].children[i].getAttribute('alt');
      var fieldLvl = fieldName.replace(/[^0-9]+/g, '');
      var fieldName = fieldName.replace(/[0-9]+/g, '');
      var fieldName = fieldName.replace('Уровень', '');
      fieldName = fieldName.trim();

      var fieldLink = allFields[0].children[i].href;
      var idPos = fieldLink.indexOf('id=');
      if (idPos > 0) {
        console.log(idPos);
        var id = fieldLink.slice(idPos + 3);
      }

      if (fieldLink.indexOf('dorf2.php') > 0) {
        console.log(fieldLink);
        continue;
      }
      fieldsList.push({ name: fieldName, level: fieldLvl, id: id, link: fieldLink });
    };

    return fieldsList;
  })


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
