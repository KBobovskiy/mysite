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
  Debug.debugPrint(query);
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


module.exports.GetAllVillagesHref = GetAllVillagesHref;
module.exports.getWhatWeCanBuildFromDB = getWhatWeCanBuildFromDB;
module.exports.getLastDeffenseReports = getLastDeffenseReports;
module.exports.getLastReportsWithoutDetails = getLastReportsWithoutDetails;