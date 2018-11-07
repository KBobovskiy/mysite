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

    DBCon.insertLogInfo('Travian', "Найдено вохможных строек: " + rows.length);
    return rows;
}

module.exports.GetAllVillagesHref = GetAllVillagesHref;
module.exports.getWhatWeCanBuildFromDB = getWhatWeCanBuildFromDB;