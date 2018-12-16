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
      await Saver.SaveDeffenseReport(defReport, accountId);
      defReport = arrayWithDeffenseReports.pop();
      await sleep(1000);
    }
*/

    /*
    '#reportWrapper > div.header > div.subject > div.header.text'//    Thailand атакует Астана
    '#reportWrapper > div.header > div.time > div.header.text'//    11.12.18, 05: 46: 14
    '#reportWrapper > div.body > div.role.attacker > div.header > h2'// нападение
    '#reportWrapper > div.body > div.role.attacker > div.troopHeadline' //[CRB] happyday из деревни Thailand
    //<div class="troopHeadline"><span class="inline-block">[<a href="allianz.php?aid=190" title="">CRB</a>]</span> <a class="player" href="spieler.php?uid=3916">happyday</a> из деревни <a class="village" href="karte.php?d=65221">Thailand</a> </div>
    '#attacker' //войска атакующего
    // < table id = "attacker" class="attacker" cellpadding = "0" cellspacing = "0" > <tbody class="units"><tr><th class="coords"></th><td class="uniticon"><img src="img/x.gif" class="unit u11" alt="Дубинщик"></td><td class="uniticon"><img src="img/x.gif" class="unit u12" alt="Копьеносец"></td><td class="uniticon"><img src="img/x.gif" class="unit u13" alt="Топорщик"></td><td class="uniticon"><img src="img/x.gif" class="unit u14" alt="Скаут"></td><td class="uniticon"><img src="img/x.gif" class="unit u15" alt="Паладин"></td><td class="uniticon"><img src="img/x.gif" class="unit u16" alt="Тевтонская конница"></td><td class="uniticon"><img src="img/x.gif" class="unit u17" alt="Стенобитное орудие"></td><td class="uniticon"><img src="img/x.gif" class="unit u18" alt="Катапульта"></td><td class="uniticon"><img src="img/x.gif" class="unit u19" alt="Вождь"></td><td class="uniticon"><img src="img/x.gif" class="unit u20" alt="Поселенец"></td><td class="uniticon last"><img src="img/x.gif" class="unit uhero" alt="Герой"></td></tr></tbody><tbody class="units"><tr><th><i class="troopCount"> </i></th><td class="unit">100</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody><tbody class="units last"><tr><th><i class="troopDead"> </i></th><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody></table>
  
    '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody.infos > tr' //Информация	Вы освободили 15 своих солдат. Но смогли спасти 11
    '#reportWrapper > div.body > div.role.attacker > table.additionalInformation > tbody.goods > tr' //Добыча	    869    935    733    944 Награбленное‭‭ 3481‬/‭6000‬‬
  
    '#reportWrapper > div.body > div.role.defender > div.troopHeadline'
    //< div class="troopHeadline" > <span class="inline-block">[<a href="allianz.php?aid=49" title="">Crusader</a>]</span> <a class="player" href="spieler.php?uid=423">АКА</a> из деревни < a class="village" href = "karte.php?d=65222" > Астана</a > </div >
    '#defender'
    //<table id="defender" class="defender" cellpadding="0" cellspacing="0"><tbody class="units"><tr><th class="coords"></th><td class="uniticon"><img src="img/x.gif" class="unit u21" alt="Фаланга"></td><td class="uniticon"><img src="img/x.gif" class="unit u22" alt="Мечник"></td><td class="uniticon"><img src="img/x.gif" class="unit u23" alt="Следопыт"></td><td class="uniticon"><img src="img/x.gif" class="unit u24" alt="Тевтатский гром"></td><td class="uniticon"><img src="img/x.gif" class="unit u25" alt="Друид-всадник"></td><td class="uniticon"><img src="img/x.gif" class="unit u26" alt="Эдуйская конница"></td><td class="uniticon"><img src="img/x.gif" class="unit u27" alt="Таран"></td><td class="uniticon"><img src="img/x.gif" class="unit u28" alt="Требушет"></td><td class="uniticon"><img src="img/x.gif" class="unit u29" alt="Предводитель"></td><td class="uniticon"><img src="img/x.gif" class="unit u30" alt="Поселенец"></td><td class="uniticon last"><img src="img/x.gif" class="unit uhero" alt="Герой"></td></tr></tbody><tbody class="units"><tr><th><i class="troopCount"> </i></th><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody><tbody class="units last"><tr><th><i class="troopDead"> </i></th><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none">0</td><td class="unit none last">0</td></tr></tbody></table>
    */
  }


  //
  //
  //
  //
  //
  // Scraping Reports
  // if (login_info.scrapReports === true) {
  var savedReportsIdWithoutDetails = await Reader.getLastReportsWithoutDetails(accountId);
  var arrayWithDeffenseReports = await Scraper.ScrapingReportsDetail(page, accountId, savedReportsIdWithoutDetails);
  Debug.debugPrint('arrayWithDeffenseReports: ' + arrayWithDeffenseReports.length);
  Debug.debugPrint(arrayWithDeffenseReports);
  // }


  // Building houses

  if (login_info.runBuilding === true) {
    var i = 0;
    while (i < 100) {
      await StartAllBuildings(page, accountId);
      i++;
      var minSleepTimeInSec = 180;
      var maxSleepTimeInSec = 360;
      var waitTime = Common.getRandomMS(minSleepTimeInSec, maxSleepTimeInSec) / 1000;
      Debug.debugPrint("Now:" + new Date() + ", sleep for " + waitTime + "sec");
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
          await page.mouse.click(946, 515);
        } else if (buttonReady) {
          await page.mouse.click(814, 515);
        } else {
          Debug.debugPrint("Button for building is not ready or building complite!");
          // return to dorf1 page
          var pageUrl = 'https://ts2.travian.ru/dorf1.php';
          Debug.debugPrint("Goto: " + pageUrl);
          await page.goto(pageUrl);
          await sleep(Common.getRandomMS(3, 5));

          //await page.goto(pageUrl);
        }
        DBCon.insertLogInfo('Travian', "ScrapDorf1Page after click trying button start building");
        var gotoUrl = 'https://ts2.travian.ru/dorf1.php';
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
  var pageUrl = 'https://ts2.travian.ru/';
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

