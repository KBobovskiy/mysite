// Async module

const sleep = require('sleep-promise');

/** Scraping all information from Dorf1 for all villages and save it into DB */
async function ScrapingAllVillagesDorf1(page, accountId) {
    var villagesHrefs = await GetAllVillagesHref(accountId);
    var result = [];
    for (let i = 0; i < villagesHrefs.length; i++) {
      await sleep(getRandomMS(4, 8));
      // scraping information from current dorf1 page
      var dorf1PageInfo = await ScrapDorf1Page(page, villagesHrefs[i]);
      result.push(dorf1PageInfo);
    }
    return result;
  }


/** Get informtion about store capacity and stocks */
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
  

/** Get array with resourses fields information */
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
            //console.log(idPos);
            var id = fieldLink.slice(idPos + 3);
          }
  
          if (fieldLink.indexOf('dorf2.php') > 0) {
            //console.log(fieldLink);
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
    await sleep(getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
    if (!withOutGoto) {
      console.log("Goto: " + gotoUrl);
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
  
    console.log("ScrapingStoreInfo(page)");
    var storageInfo = await ScrapingStoreInfo(page);
  
    console.log("ScrapingProdactionInfo(page)");
    var prodactionInfo = await ScrapingProdactionInfo(page);
  
    console.log("ScrapingVillageList(page)");
    var villageList = await ScrapingVillageList(page);
  
    console.log("ScrapingFieldsInfo(page)");
    var villageFields = await ScrapingFieldsInfo(page);
  
    //console.log("villageName='" + villageName + "'");
    var villageId = 0;
    for (let i = 0; i < villageList.length; i++) {
      //console.log("villageList[i].name = '" + villageList[i].name + "'");
      if (villageName == villageList[i].name) {
        villageId = villageList[i].id;
      }
    }
  
    console.log("ScrapingBuildingHouses(page)");
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
    if (!buildingHouses) {
      buildingHouses = {};
    }
    return buildingHouses;
  }
  
/** Returns random number in miliseconds for sleeping */
function getRandomMS(min, max) {
    return (Math.random() * (max - min) + min) * 1000;
  }
        
    
module.exports.ScrapingAllVillagesDorf1 = ScrapingAllVillagesDorf1;
module.exports.ScrapingStoreInfo = ScrapingStoreInfo;
module.exports.ScrapingProdactionInfo = ScrapingProdactionInfo;
module.exports.ScrapingVillageList = ScrapingVillageList;
module.exports.ScrapingFieldsInfo = ScrapingFieldsInfo;
module.exports.ScrapDorf1Page = ScrapDorf1Page;
module.exports.ScrapingBuildingHouses = ScrapingBuildingHouses;