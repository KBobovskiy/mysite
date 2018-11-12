// Async module

const sleep = require('sleep-promise');
const TravianDBReader = require("./TravianDBReader.js");
const Common = require("./CommonFunc.js");
const Debug = require("../serverApp/debug.js");

/** Scraping all information from Dorf1 for all villages */
async function ScrapingAllVillagesDorf1(page, accountId) {
  var villagesHrefs = await TravianDBReader.GetAllVillagesHref(accountId);
  var result = [];
  for (let i = 0; i < villagesHrefs.length; i++) {
    await sleep(Common.getRandomMS(4, 8));
    // scraping information from current dorf1 page
    var dorf1PageInfo = await ScrapDorf1Page(page, villagesHrefs[i]);
    result.push(dorf1PageInfo);
  }
  return result;
}

/** Scraping all information from Dorf2 for all villages */
async function ScrapingAllVillagesDorf2(page, accountId) {
  var villagesHrefs = await TravianDBReader.GetAllVillagesHref(accountId);
  var result = [];
  for (let i = 0; i < villagesHrefs.length; i++) {
    await sleep(Common.getRandomMS(4, 8));
    // scraping information from current dorf1 page
    var dorf2PageInfo = await ScrapDorf2Page(page, villagesHrefs[i]);
    result.push(dorf2PageInfo);
    break;
  }
  return result;
}


/** Get informtion about store capacity and stocks */
async function ScrapingStoreInfo(page) {

  var storageInfo = await page.evaluate(() => {

    function GetNumber(strValue, parseToInt) {
      strValue = strValue.replace(/[^0-9-]/g, '');
      strValue = strValue.trim();
      //Debug.debugPrint(strValue);
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
    result.warehouse = 0;
    result.granary = 0;
    result.wood = 0;
    result.clay = 0;
    result.iron = 0;
    result.crop = 0;
    result.freeCrop = 0;
    if (document.querySelector(warehouseSelector)) {
      result.warehouse = GetNumber(document.querySelector(warehouseSelector).textContent, true);
      result.granary = GetNumber(document.querySelector(granarySelector).textContent, true);
      result.wood = GetNumber(document.querySelector(woodSelector).textContent, true);
      result.clay = GetNumber(document.querySelector(claySelector).textContent, true);
      result.iron = GetNumber(document.querySelector(ironSelector).textContent, true);
      result.crop = GetNumber(document.querySelector(cropSelector).textContent, true);
      result.freeCrop = GetNumber(document.querySelector(Selector).textContent, true);
    }
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

/** Get information about prodaction per hour */
async function ScrapingProdactionInfo(page) {

  var prodactionInfo = await page.evaluate(() => {

    function GetNumber(strValue, parseToInt) {
      strValue = strValue.replace(/[^0-9-]/g, '');
      strValue = strValue.trim();
      //Debug.debugPrint(strValue);
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
    result.wood = 0;
    result.clay = 0;
    result.iron = 0;
    result.crop = 0;
    if (document.querySelector(woodSelector)) {
      result.wood = GetNumber(document.querySelector(woodSelector).textContent, true);
      result.clay = GetNumber(document.querySelector(claySelector).textContent, true);
      result.iron = GetNumber(document.querySelector(ironSelector).textContent, true);
      result.crop = GetNumber(document.querySelector(cropSelector).textContent, true);
    }
    return result;
  });
  if (!prodactionInfo) {
    prodactionInfo = {
      wood: 0, clay: 0, iron: 0, crop: 0
    }
  }
  return prodactionInfo;
}

/** Get array with villages informaation */
async function ScrapingVillageList(page) {

  var villageList = await page.evaluate(() => {

    function GetString(strValue) {
      //Debug.debugPrint(strValue);
      strValue = strValue.replace(/[^a-zA-Zа-яА-Я ,.0-9:-\|]/g, ' ');
      //Debug.debugPrint(strValue);
      strValue = strValue.replace(/ +/g, ' ');
      //Debug.debugPrint(strValue);
      strValue = strValue.trim();
      //Debug.debugPrint(strValue);
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


/** Get array with resourses fields information */
async function ScrapingFieldsInfo(page) {
  var villageFields = await page.evaluate(() => {

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
      //Debug.debugPrint(strValue);
      if (parseToInt) {
        return parseInt(strValue);
      }
      return strValue;
    }

    var fieldsList = new Array;
    var villageFieldsTemplateSelector = '#rx';

    var allFields = $(villageFieldsTemplateSelector);
    if (allFields && allFields[0]) {
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
          //Debug.debugPrint(idPos);
          var id = fieldLink.slice(idPos + 3);
        }

        if (fieldLink.indexOf('dorf2.php') > 0) {
          //Debug.debugPrint(fieldLink);
          continue;
        }
        fieldsList.push({ name: fieldName, level: fieldLvl, positionId: id, href: fieldLink });
      };
    };

    return fieldsList;
  })
  return villageFields;
}

/**Scraping storage capacity and current resourses in it */
async function ScrapDorf1Page(page, gotoUrl, withOutGoto) {

  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 7;
  await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  if (!withOutGoto) {
    Debug.debugPrint("Goto: " + gotoUrl);
    await page.goto(gotoUrl);
  }

  var villageName = await page.evaluate(() => {
    const villageNameSelector = '#villageNameField';
    var res = document.querySelector(villageNameSelector);
    if (res && res.textContent) {
      return res.textContent.replace('.', '').trim();
    }
    return "Error";
  });

  Debug.debugPrint("ScrapingStoreInfo(page)");
  var storageInfo = await ScrapingStoreInfo(page);

  Debug.debugPrint("ScrapingProdactionInfo(page)");
  var prodactionInfo = await ScrapingProdactionInfo(page);

  Debug.debugPrint("ScrapingVillageList(page)");
  var villageList = await ScrapingVillageList(page);

  Debug.debugPrint("ScrapingFieldsInfo(page)");
  var villageFields = await ScrapingFieldsInfo(page);

  //Debug.debugPrint("villageName='" + villageName + "'");
  var villageId = 0;
  for (let i = 0; i < villageList.length; i++) {
    //Debug.debugPrint("villageList[i].name = '" + villageList[i].name + "'");
    if (villageName == villageList[i].name) {
      villageId = villageList[i].id;
    }
  }

  Debug.debugPrint("ScrapingBuildingHouses(page)");
  var buildingHouses = await ScrapingBuildingHouses(page);


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

async function ScrapingBuildingHouses(page) {

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
        //Debug.debugPrint(nameText);

        levelText = level[0].innerText;
        levelText = levelText.replace('Уровень', '').trim();
        //Debug.debugPrint(levelText);

        var endTimeConstruction = duration[0].innerText;
        var pos = endTimeConstruction.indexOf('Готово в');
        endTimeConstruction = endTimeConstruction.slice(pos + 8).trim();
        //Debug.debugPrint(endTimeConstruction);

        buildingHousesList.push({ name: nameText, level: levelText, endOfConstructionTime: endTimeConstruction });
      }
    }
    return buildingHousesList;
  })
  if (!buildingHouses) {
    buildingHouses = {};
  }
  return buildingHouses;
}


async function ScrapingTownHousesInfo(page) {
  var townHouses = await page.evaluate(() => {

    function GetString(strValue) {
      //Debug.debuGetStringgPrint(strValue);
      strValue = strValue.replace(/[^a-zA-Zа-яА-Я ,.0-9:-\|]/g, ' ');
      //Debug.debugPrint(strValue);
      strValue = strValue.replace(/ +/g, ' ');
      //Debug.debugPrint(strValue);
      strValue = strValue.trim();
      //Debug.debugPrint(strValue);
      return strValue;
    }

    var buildingHouseNameTemplateSelector = "#village_map > div.buildingSlot.a";
    var townHousesList = new Array;
    for (var i = 19; i < 40; i++) {
      var name = $(buildingHouseNameTemplateSelector + i);

      if (name.length > 0) {
        nameText = name[0].className;
        nameText = nameText.replace('buildingSlot', '');
        nameText = nameText.replace('a' + i, '');
        nameText = nameText.replace('aid' + i, '');
        nameText = GetString(nameText).trim();

        levelText = GetString(name[0].innerText);

        townHousesList.push({
          id: i
          , name: nameText
          , level: levelText
        });
      }
    }

    return townHousesList;
  })
  console.log(townHouses);
  if (!townHouses) {
    townHouses = new Array;
  }
  return townHouses;
}


/**Scraping storage capacity and current resourses in it */
async function ScrapDorf2Page(page, gotoUrl, withOutGoto) {

  var minSleepTimeInSec = 3;
  var maxSleepTimeInSec = 7;
  await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  gotoUrl = gotoUrl.replace('orf1.', 'orf2.');
  if (!withOutGoto) {
    Debug.debugPrint("Goto: " + gotoUrl);
    await page.goto(gotoUrl);
  }

  var villageName = await page.evaluate(() => {
    const villageNameSelector = '#villageNameField';
    var res = document.querySelector(villageNameSelector);
    if (res && res.textContent) {
      return res.textContent.replace('.', '').trim();
    }
    return "Error";
  });

  Debug.debugPrint("ScrapingStoreInfo(page)");
  var storageInfo = await ScrapingStoreInfo(page);

  Debug.debugPrint("ScrapingVillageList(page)");
  var villageList = await ScrapingVillageList(page);

  Debug.debugPrint("ScrapingTownHousesInfo(page)");
  var villageHouses = await ScrapingTownHousesInfo(page);

  Debug.debugPrint("villageName='" + villageName + "'");
  var villageId = 0;
  for (let i = 0; i < villageList.length; i++) {
    //Debug.debugPrint("villageList[i].name = '" + villageList[i].name + "'");
    if (villageName == villageList[i].name) {
      villageId = villageList[i].id;
    }
  }

  Debug.debugPrint("ScrapingBuildingHouses(page)");
  var buildingHouses = await ScrapingBuildingHouses(page);


  return {
    storageInfo: storageInfo,
    villageName: villageName,
    villageId: villageId,
    villageList: villageList,
    villageHouses: villageHouses,
    buildingHouses: buildingHouses
  };
}


module.exports.ScrapingAllVillagesDorf1 = ScrapingAllVillagesDorf1;
module.exports.ScrapingAllVillagesDorf2 = ScrapingAllVillagesDorf2;
module.exports.ScrapingStoreInfo = ScrapingStoreInfo;
module.exports.ScrapingProdactionInfo = ScrapingProdactionInfo;
module.exports.ScrapingVillageList = ScrapingVillageList;
module.exports.ScrapingFieldsInfo = ScrapingFieldsInfo;
module.exports.ScrapDorf1Page = ScrapDorf1Page;
module.exports.ScrapingBuildingHouses = ScrapingBuildingHouses;