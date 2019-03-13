const DBCon = require("../serverApp/DBConnection.js");
const Debug = require("../serverApp/debug.js");
const Common = require("./CommonFunc.js");

/** Returns array with villages hrefs */
async function GetAllVillagesHref(accountId) {
  var rows = await DBCon.selectQuery("SELECT distinct href FROM thetale.tr_Villages where AccountId = " + accountId, "Travian");
  var hrefs = [];
  while (rows.length > 0) {
    let href = rows.pop();
    hrefs.push(href.href);
  }
  Debug.debugPrint(hrefs);
  return hrefs;
}

/** Returns array with villages id */
async function GetAllVillagesId(accountId) {
  var rows = await DBCon.selectQuery("SELECT distinct id FROM thetale.tr_Villages where AccountId = " + accountId, "Travian");
  var result = [];
  while (rows.length > 0) {
    let elem = rows.pop();
    result.push(elem.id);
  }
  Debug.debugPrint(result);
  return result;
}


/** Returns array with building query last N elements */
async function GetBuildingQuery(accountId, villageId, limitRow) {
  var query =
    "SELECT DISTINCT EndOfBuilding\
    FROM thetale.tr_VillageBuilding\
    where AccountId = '"+ accountId + "' and VillageId = '" + villageId + "'\
    order by EndOfBuilding desc limit "+ limitRow + ";"

  //Debug.debugPrint(query);

  var rows = await DBCon.selectQuery(query, "Travian");
  var result = [];
  while (rows.length > 0) {
    let elem = rows.pop();
    //Debug.debugPrint(elem.EndOfBuilding.toString());
    //elem.EndOfBuilding = ConvertStringUTCToDateTime(elem.EndOfBuilding);
    //elem.Date = ConvertStringUTCToDateTime(elem.Date);
    result.push(elem);
  }

  //Debug.debugPrint(rows);
  //Debug.debugPrint(result);
  return result;
}

function ConvertStringUTCToDateTime(stringDateTime) {
  var result = "" + stringDateTime;
  Debug.debugPrint(result);
  result = result.substring(0, stringDateTime.length - 5);
  Debug.debugPrint(result);
  result = result.replace('T', ' ');
  Debug.debugPrint(result);
  result = result.replace('-', '');
  result = result.replace('-', '');
  result = result.replace('-', '');
  Debug.debugPrint(result);
  result = new Date(result);
  Debug.debugPrint(result);
  return result;
}

/**
 * Returns array with Resourse fields buildings needed to upgrade in village
 */
async function getResourcesFieldsWhatWeCanBuildInVillageFromDB(accountId, villageId, maxLevel) {
  var query =
    "SELECT\
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
      and VillageId = "+ villageId + "\
      group by AccountId, VillageId, PositionId\
  ) IdList ON IdList.id = VillRes.id\
  WHERE VillRes.Level < "+ maxLevel + "\
  order by VillRes.Level;";

  //Debug.debugPrint(query);
  var rows = await DBCon.selectQuery(query, "Travian");

  DBCon.insertLogInfo('Travian', "Can start build houses in village " + villageId + ": " + rows.length);
  return rows;
}

/**
 * Returns array with Resourse fields buildings needed to upgrade in village
 */
async function getTownHousesWhatWeCanBuildInVillageFromDB(accountId, villageId, housesCodes, level) {
  var query =
    "SELECT\
        TownHouses.AccountId\
        ,TownHouses.VillageId\
        ,TownHouses.Code Name\
        ,TownHouses.Href\
        ,TownHouses.Level\
        ,TownHouses.PositionId\
      FROM thetale.tr_VillageTownHouse TownHouses\
      INNER JOIN(\
        SELECT max(id) id\
        ,AccountId\
        ,VillageId\
        ,PositionId\
      FROM thetale.tr_VillageTownHouse\
      WHERE AccountId = "+ accountId + "\
        and VillageId = "+ villageId + "\
        and Code in ("+ housesCodes + ")\
      group by AccountId, VillageId, PositionId\
      ) IdList ON IdList.id = TownHouses.id\
      WHERE TownHouses.Level < "+ level + "; ";

  //Debug.debugPrint(query);
  var rows = await DBCon.selectQuery(query, "Travian");

  if (rows.length > 0) {
    DBCon.insertLogInfo('Travian', "Can start build houses " + housesCodes.replace(/\'/g, '') + " level < " + level.replace(/\'/g, '') + " in town " + villageId + ": " + rows.length);
  }
  return rows;
}

/**
 * Returns array with buildings needed to upgrade
 */
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
    WHERE (VillBuilding.EndOfBuilding <= '" + Common.getNow() + "' OR VillBuilding.EndOfBuilding is null)\
    ORDER BY AllRes.Level;"
  //Debug.debugPrint(query);
  var rows = await DBCon.selectQuery(query, "Travian");

  DBCon.insertLogInfo('Travian', "Can start build houses: " + rows.length);
  return rows;
}

/*Returns last 30 defense reports id. It is only stub yet*/
async function getLastDeffenseReports(accountId) {
  var query = "Not implementeed yet!";
  Debug.debugPrint(query);

  //var rows = await DBCon.selectQuery(query, "Travian");
  //DBCon.insertLogInfo('Travian', "Get deffense reports from DB: " + rows.length);
  var rows = [0, 1, 2, 3];
  return rows;
}

/*Returns last 10 reports href. It is only stub yet*/
async function getLastReportsWithoutDetails(accountId) {
  var query =
    "SELECT reports.Href, reports.id FROM thetale.tr_Reports reports\
    left join thetale.tr_ReportsDetails details\
    on reports.id = details.id and reports.AccountId = details.AccountId\
    where reports.AccountId = "+ accountId + "\
    order by reports.id desc\
    LIMIT 10;";
  var rows = await DBCon.selectQuery(query, "Travian");
  DBCon.insertLogInfo('Travian', "Get first reports without details from DB: " + rows.length);
  return rows;
}

async function GetVillagesWithGuildHallsWhereCanStartHoliday(accountId) {
  var query =
    "SELECT distinct Guildhalls.AccountId, Guildhalls.VillageId, Guildhalls.Href as HouseHref, Villages.Href as Href, ifnull(GoingHolidays.EndOfHoliday, '2019-01-01 00:00:00') EndOfHoliday\
      FROM thetale.tr_VillageTownHouse  Guildhalls\
      left join thetale.tr_Villages Villages\
        on Guildhalls.AccountId = Villages.AccountId and Guildhalls.VillageId = Villages.id\
      Left join (select Account_Id,VillageId,max(EndOfHoliday) EndOfHoliday from thetale.tr_HolidayInVillages group by Account_Id,VillageId) GoingHolidays\
        on GoingHolidays.Account_Id = Guildhalls.AccountId and GoingHolidays.VillageId = Guildhalls.VillageId\
      where   Guildhalls.AccountId = '"+ accountId + "'\
      and Guildhalls.Code = 'g24';"

  var rows = await DBCon.selectQuery(query, "Travian");
  DBCon.insertLogInfo('Travian', "Get all villages with guildhall, count: " + rows.length);
  return rows;
}


module.exports.GetAllVillagesHref = GetAllVillagesHref;
module.exports.getWhatWeCanBuildFromDB = getWhatWeCanBuildFromDB;
module.exports.getResourcesFieldsWhatWeCanBuildInVillageFromDB = getResourcesFieldsWhatWeCanBuildInVillageFromDB;
module.exports.getTownHousesWhatWeCanBuildInVillageFromDB = getTownHousesWhatWeCanBuildInVillageFromDB;
module.exports.getLastDeffenseReports = getLastDeffenseReports;
module.exports.getLastReportsWithoutDetails = getLastReportsWithoutDetails;
module.exports.GetBuildingQuery = GetBuildingQuery;
module.exports.GetAllVillagesId = GetAllVillagesId;
module.exports.GetVillagesWithGuildHallsWhereCanStartHoliday = GetVillagesWithGuildHallsWhereCanStartHoliday;