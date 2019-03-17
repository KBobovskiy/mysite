// Async module

const DBCon = require("../serverApp/DBConnection.js");
const CommonFunc = require("./CommonFunc.js");
const Debug = require("../serverApp/debug.js");

/** Save all information from Dorf1 page */
async function SaveDorf1Page(dorf1PageInfo, accountId, ) {

  SaveVillageList(dorf1PageInfo.villageList, accountId);

  SaveVillageStorages(dorf1PageInfo.storageInfo, accountId, dorf1PageInfo.villageId);

  SaveVillageResourses(dorf1PageInfo.villageFields, accountId, dorf1PageInfo.villageId);

  SaveVillageProdactionInfo(dorf1PageInfo.prodactionInfo, accountId, dorf1PageInfo.villageId);

  SaveVillageBuildingHouses(dorf1PageInfo.buildingHouses, accountId, dorf1PageInfo.villageId);

}

/** Save all information from Dorf2 page */
async function SaveDorf2Page(dorf2PageInfo, accountId, ) {

  SaveVillageList(dorf2PageInfo.villageList, accountId);

  //SaveVillageStorages(dorf2PageInfo.storageInfo, accountId, dorf2PageInfo.villageId);

  SaveVillageResourses(dorf2PageInfo.villageFields, accountId, dorf2PageInfo.villageId);

  SaveVillageTownHousesInfo(dorf2PageInfo.villageHouses, accountId, dorf2PageInfo.villageId);

  SaveVillageBuildingHouses(dorf2PageInfo.buildingHouses, accountId, dorf2PageInfo.villageId);

}

/** Save village town houses information */
async function SaveVillageTownHousesInfo(villageHouses, accountId, villageId) {
  Debug.debugPrint("Town houses in village: " + villageId);
  //Debug.debugPrint(villageHouses);
  if (villageHouses && accountId && villageId) {

    villageHouses.forEach(house => {
      //Debug.debugPrint(house);
      DBCon.insertQuery("INSERT INTO`thetale`.`tr_VillageTownHouse`(`AccountId`, `VillageId`, `PositionId`, `Code`, `Href`, `Level`) \
      VALUES('" + accountId + "', '" + villageId.trim() + "', '" + house.id + "', '" + house.code + "', '" + house.href + "', '" + house.level + "'); "
        , "Travian");
    });
  }
}

/** Save current building houses with time of the end of finishing the construction */
async function SaveVillageBuildingHouses(buildingHouses, accountId, villageId) {
  Debug.debugPrint("Building houses in village: " + villageId);
  Debug.debugPrint(buildingHouses);
  if (buildingHouses && accountId && villageId) {

    buildingHouses.forEach(building => {
      var now = new Date(new Date() + 60 * 60 * 3 * 1000);
      var datePart = '' + now.getFullYear() + '-' + CommonFunc.NumberWithLeadingZero(now.getMonth() + 1, 2) + '-' + CommonFunc.NumberWithLeadingZero(now.getDate(), 2);
      DateTimeNow = datePart + ' ' + CommonFunc.NumberWithLeadingZero(now.getHours(), 2) + ':' + CommonFunc.NumberWithLeadingZero(now.getMinutes(), 2) + ':' + CommonFunc.NumberWithLeadingZero(now.getSeconds(), 2);
      DateTimeEnd = datePart + ' ' + building.endOfConstructionTime + ':59';
      if (DateTimeNow > DateTimeEnd) {
        now = new Date() + 23 * 60 * 60 * 1000;
        var now = new Date();
        now.setDate(now.getDate() + 1);
        DateTimeEnd = '' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + building.endOfConstructionTime + ':59';
      }
      //Debug.debugPrint(DateTimeNow + ' => ' + DateTimeEnd);
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
  Debug.debugPrint("dorf1PageInfo.villageId = " + villageId + " store: " + storageInfo);
  if (storageInfo && villageId && accountId) {
    DBCon.insertQuery("INSERT INTO`thetale`.`tr_VillageStore`(`AccountId`, `VillageId`, `Warehouse`, `Granary`, `FreeCorp`, `Wood`, `Clay`, `Iron`, `Crop`) VALUES('" + accountId + "','" + villageId.trim() + "', '" + storageInfo.warehouse + "', '" + storageInfo.granary + "', '" + storageInfo.freeCrop + "', '" + storageInfo.wood + "', '" + storageInfo.clay + "', '" + storageInfo.iron + "', '" + storageInfo.crop + "');"
      , "Travian");
  }
}

/** Save resourses fields into DB */
async function SaveVillageResourses(villageFields, accountId, villageId) {

  if (!villageId || !villageFields) {
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

/** Save reports list */
async function SaveDefenseReport(report, accountId) {
  if (!report) {
    return;
  }
  DBCon.insertQuery(
    "INSERT INTO`thetale`.`tr_Reports` (`id`, `AccountId`, `DateTime`, `Players`, `Description`, `Href`)\
        VALUES ('"+ report.id + "', '" + accountId + "', '" + report.dateTime + "', '" + report.players + "', '" + report.description + "','" + report.href + "')\
        ON DUPLICATE KEY UPDATE `DateTime` = '" + report.dateTime + "',`Players`='" + report.players + "',\
        `Description`='"+ report.description + "', `Href`='" + report.href + "'; ", 'Travian');

}

/** Save reports info */
async function SaveReportInfo(reportInfo, accountId) {
  if (!reportInfo) {
    return;
  }
  DBCon.insertQuery(
    "INSERT INTO`thetale`.`tr_Reports` (`id`, `AccountId`, `DateTime`, `Players`, `Description`, `Href`)\
        VALUES ('"+ report.id + "', '" + accountId + "', '" + report.dateTime + "', '" + report.players + "', '" + report.description + "','" + report.href + "')\
        ON DUPLICATE KEY UPDATE `DateTime` = '" + report.dateTime + "',`Players`='" + report.players + "',\
        `Description`='"+ report.description + "', `Href`='" + report.href + "'; ", 'Travian');

}

/** Save reports info */
async function SaveEndOfHoliday(accountId, villageId, dateTimeString) {
  if (!dateTimeString) {
    return;
  }
  DBCon.insertQuery(
    "INSERT INTO `thetale`.`tr_HolidayInVillages` (`Account_Id`, `VillageId`, `EndOfHoliday`)\
     VALUES('" + accountId + "', '" + villageId + "', '" + dateTimeString + "');");
}



module.exports.SaveDorf1Page = SaveDorf1Page;
module.exports.SaveDorf2Page = SaveDorf2Page;
module.exports.SaveVillageList = SaveVillageList;
module.exports.SaveVillageResourses = SaveVillageResourses;
module.exports.SaveVillageStorages = SaveVillageStorages;
module.exports.SaveVillageProdactionInfo = SaveVillageProdactionInfo;
module.exports.SaveVillageBuildingHouses = SaveVillageBuildingHouses;
module.exports.SaveDefenseReport = SaveDefenseReport;
module.exports.SaveReportInfo = SaveReportInfo;
module.exports.SaveEndOfHoliday = SaveEndOfHoliday;