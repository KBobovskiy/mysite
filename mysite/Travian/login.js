const puppeteer = require('puppeteer');
const login_info = require("./login_info");
var sleep = require('sleep-promise');

puppeteer.defaultArgs({headless:false});

async function start(loginInfo) {
  var minSleepTimeInSec = 5;
  var maxSleepTimeInSec = 15;
  const browser = await puppeteer.launch({headless:false});
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080})
  await page.goto('https://tx3.travian.ru/');
  let login = loginInfo.account.login;
  let password = loginInfo.account.password;
  await page.evaluate((login, password) => {
    const loginInputSelector = '#content > div.outerLoginBox > div.innerLoginBox > form > table > tbody > tr.account > td:nth-child(2) > input';
    const passwordInputSelector = '#content > div.outerLoginBox > div.innerLoginBox > form > table > tbody > tr.pass > td:nth-child(2) > input';
    
    document.querySelector(loginInputSelector).value = login;
    document.querySelector(passwordInputSelector).value = password;
    //document.querySelector(lowResolutionCheckBoxSelector).value = 1;

  },login,password);
  const lowResolutionCheckBoxSelector = '#lowRes';
  let lowResolution = await page.evaluate(() => {
    const lowResolutionCheckBoxSelector = '#lowRes';
    return document.querySelector(lowResolutionCheckBoxSelector).value;
  });
  //if (!lowResolution) {
    await page.click(lowResolutionCheckBoxSelector);
  //}
  await sleep(getRandomMS(minSleepTimeInSec,maxSleepTimeInSec));
  await page.mouse.click(856, 378);

  var dorf1PageInfo = await ScrapDorf1Page(page);
  
  
  console.log(dorf1PageInfo);
  
  await page.screenshot({path: 'tx3.travian.png'});


  //await browser.close();
}

/**Scraping storage capacity and current resourses in it */
async function ScrapDorf1Page(page) {
  var minSleepTimeInSec = 5;
  var maxSleepTimeInSec = 15;
  await sleep(getRandomMS(minSleepTimeInSec,maxSleepTimeInSec));
  await page.goto('https://tx3.travian.ru/dorf1.php');

  var storageInfo = await page.evaluate(()=>{
    const warehouseSelector = '#stockBarWarehouse';
    const granarySelector = '#stockBarGranary';
    const Selector = '#stockBarFreeCrop';
    const woodSelector = '#l1';
    const claySelector = '#l2';
    const ironSelector = '#l3';
    const cropSelector = '#l4';
    var result = {};
    result.warehouse = document.querySelector(warehouseSelector).textContent.replace('.','').trim();
    result.granary = document.querySelector(granarySelector).textContent.replace('.','').trim();
    result.wood = document.querySelector(woodSelector).textContent.replace('.','').trim();
    result.clay = document.querySelector(claySelector).textContent.replace('.','').trim();
    result.iron = document.querySelector(ironSelector).textContent.replace('.','').trim();
    result.crop = document.querySelector(cropSelector).textContent.replace('.','').trim();
    result.freeCrop = document.querySelector(Selector).textContent.replace('.','').trim();
    //console.log(result);
    return result;
});
  if (!storageInfo){
    storageInfo = {};
    storageInfo.warehouse = 0;
    storageInfo.granary = 0;
    storageInfo.wood = 0;
    storageInfo.clay = 0;
    storageInfo.iron = 0;
    storageInfo.crop = 0;
    storageInfo.freeCrop = 0;
  }

  
  var prodactionInfo = await page.evaluate(()=>{
    const woodSelector = '#production > tbody > tr:nth-child(1) > td.num';
    const claySelector = '#production > tbody > tr:nth-child(2) > td.num';
    const ironSelector = '#production > tbody > tr:nth-child(3) > td.num';
    const cropSelector = '#production > tbody > tr:nth-child(4) > td.num';
    var result = {};
    result.wood = document.querySelector(woodSelector).textContent.replace('.','').trim();
    //console.log(document.querySelector(woodSelector).textContent);
    //console.log(document.querySelector(woodSelector));
    result.clay = document.querySelector(claySelector).textContent.replace('.','').trim();
    result.iron = document.querySelector(ironSelector).textContent.replace('.','').trim();
    result.crop = document.querySelector(cropSelector).textContent.replace('.','').trim();
    //console.log(result);
    return result;
});
  if (!prodactionInfo){
    prodactionInfo={};
    prodactionInfo.wood = 0;
    prodactionInfo.clay = 0;
    prodactionInfo.iron = 0;
    prodactionInfo.crop = 0;
  }

  
  var villageName = await page.evaluate(()=>{
    const villageNameSelector = '#villageNameField';
    return document.querySelector(villageNameSelector).textContent.replace('.','').trim();
  });

  
  var villageList = await page.evaluate(()=>{
    var villageLinkTemplateSelector = '#sidebarBoxVillagelist > div.sidebarBoxInnerBox > div.innerBox.content > ul > li:nth-child(villageNumber) > a';
    var villageNameTemplateSelector = '#sidebarBoxVillagelist > div.sidebarBoxInnerBox > div.innerBox.content > ul > li:nth-child(villageNumber) > a > div';
    var i = 1;
    var villageList = new Array;
    while (i>0) {
      var linkSelector = villageLinkTemplateSelector.replace('villageNumber',i);
      var villageLink = $(linkSelector).attr('href');

      var nameSelector = villageNameTemplateSelector.replace('villageNumber',i);
      var villageName = document.querySelector(nameSelector).textContent.trim();

      console.log(villageLink);
      console.log(villageName);
      villageList.push({villageLink:villageLink,villageName:villageName,coordinats:''});
      i++;
    }
    return villageList;
  })

  var villageFields = await page.evaluate(()=>{
    var villageFieldsTemplateSelector = '#rx > area:nth-child(fieldNumber)'; 
    var i = 1;
    var fieldsList = new Array;
    while (i<= 18) {
      var fieldSelector = villageFieldsTemplateSelector.replace('villageNumber',i);
      var villageLink = $(fieldSelector).attr('alt').trim();
	  var fieldLvl = villageLink.replace(/[^0-9]+/g, '');
	  var fieldName = villageLink.replace(/[0-9]+/g, '');
	  
	  fieldsList.push({	id : i,
						level : fieldLvl,
						name : fieldName
						});

      console.log(fieldName);
      console.log(fieldLvl);
	  console.log('********');
      i++;
    }
    return fieldsList;
  })

  var buildingHouses = await page.evaluate(()=>{
    var buildingHouseNameTemplateSelector = '#content > div.boxes.buildingList > div.boxes-contents.cf > ul > li > div.name'; 
	var buildingHouseLevelTemplateSelector = '#content > div.boxes.buildingList > div.boxes-contents.cf > ul > li > div.name > span.lvl'; 
	var buildingHouseDurationTemplateSelector = '#content > div.boxes.buildingList > div.boxes-contents.cf > ul > li > div.buildDuration'; 
	
    var buildingHousesList = new Array;
	
	var name = $(buildingHouseNameTemplateSelector).textContent.trim();
	var level = $(buildingHouseLevelTemplateSelector).textContent.trim();
	var duration = $(buildingHouseDurationTemplateSelector).textContent.trim();
	
	console.log(name);
	console.log(level);
	console.log(duration);
	console.log('********');
	
    buildingHousesList.push({name:name, level: level, duration: duration});
	return buildingHousesList;
  })
  
  //console.log(storageInfo);
  return {
      storageInfo:storageInfo,
      prodactionInfo:prodactionInfo,
      villageName:villageName,
      villageList:villageList
    };
}

/** Returns random number in miliseconds for sleeping */
function getRandomMS(min, max)
{
  return Math.random()* 1000 * (max - min) + min;
}

function ToInt(str) {
  let s = ''+str;
  s.replace('.','');
  return parseInt(s);
}

start(login_info);