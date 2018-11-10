// Async module

const DBCon = require("../serverApp/DBConnection.js");
const CommonFunc = require("./CommonFunc.js");


/** Save all information from Dorf1 page */
async function SaveDorf1Page(dorf1PageInfo, accountId, ) {

  SaveVillageList(dorf1PageInfo.villageList, accountId);

  SaveVillageStorages(dorf1PageInfo.storageInfo, accountId, dorf1PageInfo.villageId);

  SaveVillageResourses(dorf1PageInfo.villageFields, accountId, dorf1PageInfo.villageId);

  SaveVillageProdactionInfo(dorf1PageInfo.prodactionInfo, accountId, dorf1PageInfo.villageId);

  SaveVillageBuildingHouses(dorf1PageInfo.buildingHouses, accountId, dorf1PageInfo.villageId);

}

/** Save current building houses with time of the end of finishing the construction */
async function SaveVillageBuildingHouses(buildingHouses, accountId, villageId) {
  console.log("Building houses in village: " + villageId);
  console.log(buildingHouses);
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

module.exports.SaveDorf1Page = SaveDorf1Page;
module.exports.SaveVillageList = SaveVillageList;
module.exports.SaveVillageResourses = SaveVillageResourses;
module.exports.SaveVillageStorages = SaveVillageStorages;
module.exports.SaveVillageProdactionInfo = SaveVillageProdactionInfo;
module.exports.SaveVillageBuildingHouses = SaveVillageBuildingHouses;