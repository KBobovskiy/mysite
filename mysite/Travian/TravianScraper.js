// Async module

// TODO
// 1. https://ts2.travian.ru/allianz.php?s=3&filter=32&own=0
// 2. https://ts2.travian.ru/allianz.php?s=3&filter=31&own=0
// 3. https://ts2.travian.ru/berichte.php?id=113549&aid=49



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
    Debug.debugPrint('---------------------------');
    Debug.debugPrint('ScrapingAllVillagesDorf2: i=' + i + " villagesHrefs.length=" + villagesHrefs.length);
    Debug.debugPrint('---------------------------');
    await sleep(Common.getRandomMS(4, 8));
    // scraping information from current dorf1 page
    var dorf2PageInfo = await ScrapDorf2Page(page, villagesHrefs[i]);
    result.push(dorf2PageInfo);
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

    if (allVillage && allVillage[0]) {
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
        var href = 'https://ts2.travian.ru/build.php?id=' + i;
        levelText = GetString(name[0].innerText);
        if (!levelText) {
          levelText = '0';
        }

        townHousesList.push({
          id: i
          , code: nameText
          , level: levelText
          , href: href
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


/** Scraping defense report */
async function ScrapingAllDefenseReport(page, accountId, lastReportsId) {

  Debug.debugPrint("ScrapingAllDefenseReport(page, accountId, lastReportsId)");

  const gotoUrl = 'https://ts2.travian.ru/allianz.php?s=3&filter=32&own=0';

  var minSleepTimeInSec = 2;
  var maxSleepTimeInSec = 4;
  await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
  Debug.debugPrint("Goto: " + gotoUrl);
  await page.goto(gotoUrl);

  var reportsIds = await page.evaluate(() => {

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
    const descriptionSelector = '#offs > tbody > tr:nth-child(rowNumber) > td.sub > a > img'; //attr alt + class
    const playersAdnIdSelector = '#offs > tbody > tr:nth-child(rowNumber) > td.sub > div > a';
    const dateTimeAdnIdSelector = '#offs > tbody > tr:nth-child(rowNumber) > td.dat';
    var reportsIds = [];
    for (var i = 1; i <= 20; i++) {
      var rowData = {
        players: '',
        description: '',
        id: '',
        href: '',
        dateTime: ''
      };
      var description = '';
      var descr = document.querySelector(descriptionSelector.replace('rowNumber', i));
      if (descr) {
        description = GetString(descr.getAttribute('alt')).trim();
      }
      var dtTime = document.querySelector(dateTimeAdnIdSelector.replace('rowNumber', i));
      if (dtTime && dtTime.textContent) {
        dateTime = GetString(dtTime.textContent).trim();
        dateTimeOriginal = dateTime;
        //вчера, 02:26
        //02.12.18, 12:42
        var today = new Date();
        var arr = dateTime.split(',');
        if (arr[0] === 'сегодня') {
          var year = today.getFullYear();
          var month = today.getMonth();
          var day = today.getDate();
        } else if (arr[0] === 'вчера') {
          today.setDate(today.getDate() - 1);
          var year = today.getFullYear();
          var month = today.getMonth();
          var day = today.getDate();
        } else {
          dateTime = dateTime.split(',');
          var arrDt = dateTime[0].split('.');
          var year = '20' + arrDt[2];
          var month = arrDt[1];
          var day = arrDt[0];
        }
        dateTime = '' + year + '-' + month + '-' + day + ' ' + arr[1].trim() + ':00';
      }
      var playersElem = document.querySelector(playersAdnIdSelector.replace('rowNumber', i));
      if (playersElem && playersElem.textContent) {
        players = GetString(playersElem.textContent).trim();
      }
      var href = '';
      var id = 0;
      if (playersElem) {
        href = playersElem.href;
        var arr = href.split('?id=');
        if (arr.length) {
          id = arr[1].split('&')[0];
        }
      }
      if (id && href) {
        rowData.id = id;
        rowData.dateTime = dateTime;
        rowData.dateTimeOriginal = dateTimeOriginal;
        rowData.description = description;
        rowData.players = players;
        rowData.href = href;
        reportsIds.push(rowData);
      }
      else {
        break;
      }
    }
    return reportsIds;
  });

  return reportsIds;
}


/** Scraping war reports information */
async function ScrapingReportsDetail(page, accountId, reports) {

  Debug.debugPrint("ScrapingReportsDetail()");
  Debug.debugPrint("reports.length = " + reports.length);
  Debug.debugPrint(reports);
  var reportsInfo = [];

  for (var i = 0; i < reports.length; i++) {
    var report = reports[i];
    var gotoUrl = report.Href;

    var minSleepTimeInSec = 2;
    var maxSleepTimeInSec = 4;
    await sleep(Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec));
    Debug.debugPrint("Goto: " + gotoUrl);
    await page.goto(gotoUrl);

    var reportInfo = await page.evaluate(() => {

      function GetString(strValue) {
        //Debug.debuGetStringgPrint(strValue);
        strValue = strValue.replace(/[^a-zA-Zа-яА-Я ,.0-9:-\|\/]/g, ' ');
        //Debug.debugPrint(strValue);
        strValue = strValue.replace(/ +/g, ' ');
        //Debug.debugPrint(strValue);
        strValue = strValue.trim();
        //Debug.debugPrint(strValue);
        return strValue;
      }

      function GetDateTime(dateTimeAdnIdSelector) {
        var dtTime = document.querySelector(dateTimeAdnIdSelector);
        var dateTime = '';
        if (dtTime && dtTime.textContent) {
          dateTime = GetString(dtTime.textContent).trim();
          dateTimeOriginal = dateTime;
          //вчера, 02:26
          //02.12.18, 12:42
          var today = new Date();
          var arr = dateTime.split(',');
          if (arr[0] === 'сегодня') {
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = today.getDate();
          } else if (arr[0] === 'вчера') {
            today.setDate(today.getDate() - 1);
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = today.getDate();
          } else {
            dateTime = dateTime.split(',');
            var arrDt = dateTime[0].split('.');
            var year = '20' + arrDt[2];
            var month = arrDt[1];
            var day = arrDt[0];
          }
          dateTime = '' + year + '-' + month + '-' + day + ' ' + arr[1].trim();
        }
        return dateTime;
      }

      function GetStringValue(elemSelector) {
        var elem = document.querySelector(elemSelector);
        var valueStr = '';
        if (elem && elem.textContent) {
          valueStr = GetString(typeElem.textContent);
        }
        valueStr = valueStr.trim();
        return valueStr;
      }

      function GetElementStringValue(elemSelector) {
        var elem = document.querySelector(elemSelector);
        var strValue = '';
        if (elem && elem.textContent) {
          strValue = GetString(elem.textContent).trim();
        }
        return strValue;
      }

      function GetElementHrefStringValue(elemSelector) {
        var elem = document.querySelector(elemSelector);
        if (elem && elem.href) {
          return elem.href;
        }
        return '';
      }


      const playersSelector = '#reportWrapper > div.header > div.subject > div.header.text'; //    Thailand атакует Астана
      const typeSelector = '#reportWrapper > div.body > div.role.attacker > div.header > h2'; // нападение
      const dateTimeAdnIdSelector = '#reportWrapper > div.header > div.time > div.header.text'; //    11.12.18, 05: 46: 14
      const attackerSelector = '#reportWrapper > div.body > div.role.attacker > div.troopHeadline'; //[CRB] happyday из деревни Thailand
      const attackerSelectorPlayerHref = '#reportWrapper > div.body > div.role.attacker > div.troopHeadline > a'
      const attackerSelectorVillageHref = '#reportWrapper > div.body > div.role.attacker > div.troopHeadline > a.village'
      //<div class="troopHeadline"><span class="inline-block">[<a href="allianz.php?aid=190" title="">CRB</a>]</span> <a class="player" href="spieler.php?uid=3916">happyday</a> из деревни <a class="village" href="karte.php?d=65221">Thailand</a> </div>
      const attackerArmySelector = '#attacker'; //войска атакующего
      // < table id = "attacker" class="attacker" cellpadding = "0" cellspacing = "0" > <tbody class="units"><tr><th class="coords"></th><td class="uniticon"><img src="img/x.gif" class="unit u11" alt="Дубинщик"></td><td class="uniticon"><img src="img/x.gif" class="unit u12" alt="Копьеносец"></td><td class="uniticon"><img src="img/x.gif" class="unit u13" alt="Топорщик"></td><td class="uniticon"><img src="img/x.gif" class="unit u14" alt="Скаут"></td><td class="uniticon"><img src="img/x.gif" class="unit u15" alt="Паладин"></td><td class="uniticon"><img src="img/x.gif" class="unit u16" alt="Тевтонская конница"></td><td class="uniticon"><img src="img/x.gif" class="unit u17" alt="Стенобитное орудие"></td><td class="uniticon"><img src="img/x.gif" class="unit u18" alt="Катапульта"></td><td class="uniticon"><img src="img/x.gif" class="unit u19" alt="Вождь"></td><td class="uniticon"><img src="img/x.gif" class="unit u20" alt="Поселенец"></td><td class="uniticon last"><img src="img/x.gif" class="unit uhero" alt="Герой"></td></tr></tbody><tbody class="units"><tr><th><i class="troopCount"> </i></th><td class="unit">100</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody><tbody class="units last"><tr><th><i class="troopDead"> </i></th><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody></table>
      const informationSelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody.infos > tr'; //Информация	Вы освободили 15 своих солдат. Но смогли спасти 11
      //const lootSelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody.goods > tr'; //Добыча	    869    935    733    944 Награбленное‭‭ 3481‬/‭6000‬‬
      const lootWoodSelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody > tr > td > div.res > div > div:nth-child(1)';
      const lootClaySelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody > tr > td > div.res > div > div:nth-child(2)';
      const lootIronSelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody > tr > td > div.res > div > div:nth-child(3)';
      const lootCropSelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody > tr > td > div.res > div > div:nth-child(4)';
      const lootTotalSelector = '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody > tr > td > div.carry';
      const defenderSelector = '#reportWrapper > div.body > div.role.defender > div.troopHeadline';
      const defenderSelectorPlayerHref = '#reportWrapper > div.body > div.role.defender > div.troopHeadline > a';
      const defenderSelectorVillageHref = '#reportWrapper > div.body > div.role.defender > div.troopHeadline > a.village';
      //< div class="troopHeadline" > <span class="inline-block">[<a href="allianz.php?aid=49" title="">Crusader</a>]</span> <a class="player" href="spieler.php?uid=423">АКА</a> из деревни < a class="village" href = "karte.php?d=65222" > Астана</a > </div >
      const defenderArmySelector = '#defender';
      //<table id="defender" class="defender" cellpadding="0" cellspacing="0"><tbody class="units"><tr><th class="coords"></th><td class="uniticon"><img src="img/x.gif" class="unit u21" alt="Фаланга"></td><td class="uniticon"><img src="img/x.gif" class="unit u22" alt="Мечник"></td><td class="uniticon"><img src="img/x.gif" class="unit u23" alt="Следопыт"></td><td class="uniticon"><img src="img/x.gif" class="unit u24" alt="Тевтатский гром"></td><td class="uniticon"><img src="img/x.gif" class="unit u25" alt="Друид-всадник"></td><td class="uniticon"><img src="img/x.gif" class="unit u26" alt="Эдуйская конница"></td><td class="uniticon"><img src="img/x.gif" class="unit u27" alt="Таран"></td><td class="uniticon"><img src="img/x.gif" class="unit u28" alt="Требушет"></td><td class="uniticon"><img src="img/x.gif" class="unit u29" alt="Предводитель"></td><td class="uniticon"><img src="img/x.gif" class="unit u30" alt="Поселенец"></td><td class="uniticon last"><img src="img/x.gif" class="unit uhero" alt="Герой"></td></tr></tbody><tbody class="units"><tr><th><i class="troopCount"> </i></th><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody><tbody class="units last"><tr><th><i class="troopDead"> </i></th><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody></table>
      const armyAttacker = '#attacker > tbody:nth-child(2) > tr > td:nth-child(XXX)';
      const armyAttackerDead = '#attacker > tbody.units.last > tr > td:nth-child(XXX)';
      const armyDefender = '#defender > tbody:nth-child(2) > tr > td:nth-child(XXX)';
      const armyDefenderDead = '#defender > tbody.units.last > tr > td:nth-child(XXX)';

      var rowData = {
        id: '',
        DateTime: '',
        Type: '',
        Players: '',
        Attacker: '',
        AttackerPlayerHref: '',
        AttackerVillageHref: '',
        Information: '',
        LootTotal: '',
        Loot: '',
        Looted: '',
        LootMax: '',
        LootFull: '',
        Defender: '',
        DefenderPlayerHref: '',
        DefenderVillageHref: '',
        ArmyAttaker: '',
        ArmyAttakerDead: '',
        ArmyDefender: '',
        ArmyDefenderDead: ''
      };

      var dtTime = GetDateTime(dateTimeAdnIdSelector);
      var type = GetElementStringValue(typeSelector);
      var players = GetElementStringValue(playersSelector);
      var attacker = GetElementStringValue(attackerSelector);
      var attackerHref = GetElementHrefStringValue(attackerSelectorVillageHref);
      var attackerPlayerHref = GetElementHrefStringValue(attackerSelectorPlayerHref);

      var defender = GetElementStringValue(defenderSelector);
      var defenderHref = GetElementHrefStringValue(defenderSelectorVillageHref);
      var defenderPlayerHref = GetElementHrefStringValue(defenderSelectorPlayerHref);
      var loot = GetElementStringValue(lootWoodSelector) + '/'
        + GetElementStringValue(lootClaySelector) + '/'
        + GetElementStringValue(lootIronSelector) + '/'
        + GetElementStringValue(lootCropSelector);
      var lootTotal = GetElementStringValue(lootTotalSelector);
      var lootArr = lootTotal.split('/');
      var looted = lootArr[0];
      if (!looted) looted = '0';
      looted.trim();
      var lootMax = lootArr[1];
      if (!lootMax) lootMax = '0';
      lootMax.trim();
      var information = GetElementStringValue(informationSelector);

      var arrAttackerArmy = [];
      var arrAttackerArmyDead = [];
      for (var i = 2; i <= 12; i++) {
        var army = GetElementStringValue(armyAttacker.replace('XXX', i));
        var armyDead = GetElementStringValue(armyAttackerDead.replace('XXX', i));
        arrAttackerArmy.push(army);
        arrAttackerArmyDead.push(armyDead);
      }

      var arrDefenderArmy = [];
      var arrDefenderArmyDead = [];
      for (var i = 2; i <= 12; i++) {
        var army = GetElementStringValue(armyDefender.replace('XXX', i));
        var armyDead = GetElementStringValue(armyDefenderDead.replace('XXX', i));
        arrDefenderArmy.push(army);
        arrDefenderArmyDead.push(armyDead);
      }

      rowData.DateTime = dtTime;
      rowData.Type = type;
      rowData.Players = players;
      rowData.Information = information;
      rowData.Loot = loot;
      rowData.Looted = looted;
      rowData.LootTotal = lootTotal;
      rowData.LootMax = lootMax;
      rowData.LootFull = lootMax === looted ? true : false;
      rowData.Attacker = attacker;
      rowData.AttackerPlayerHref = attackerPlayerHref;
      rowData.AttackerVillageHref = attackerHref;
      rowData.Defender = defender;
      rowData.DefenderPlayerHref = defenderPlayerHref;
      rowData.DefenderVillageHref = defenderHref;
      rowData.ArmyAttaker = arrAttackerArmy.join('/');
      rowData.ArmyAttakerDead = arrAttackerArmyDead.join('/');
      rowData.ArmyDefender = arrDefenderArmy.join('/');
      rowData.ArmyDefenderDead = arrDefenderArmyDead.join('/');
      return rowData;
    });
    reportInfo.Href = gotoUrl;
    reportInfo.id = report.id;
    reportsInfo.push(reportInfo);
  }
  return reportsInfo;
}


module.exports.ScrapingAllVillagesDorf1 = ScrapingAllVillagesDorf1;
module.exports.ScrapingAllVillagesDorf2 = ScrapingAllVillagesDorf2;
module.exports.ScrapingStoreInfo = ScrapingStoreInfo;
module.exports.ScrapingProdactionInfo = ScrapingProdactionInfo;
module.exports.ScrapingVillageList = ScrapingVillageList;
module.exports.ScrapingFieldsInfo = ScrapingFieldsInfo;
module.exports.ScrapDorf1Page = ScrapDorf1Page;
module.exports.ScrapingBuildingHouses = ScrapingBuildingHouses;
module.exports.ScrapingAllDefenseReport = ScrapingAllDefenseReport;
module.exports.ScrapingReportsDetail = ScrapingReportsDetail;