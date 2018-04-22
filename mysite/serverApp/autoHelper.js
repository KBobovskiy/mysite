const request = require('request');
const login_info = require("./login_info");
const login = require('./login');
const debug = require("./debug");
const DBCon = require("./DBConnection");

const logAction = "Auto help";

let accontIndex = 0;

/**
*	Return Hero state and status from JSON string (/game/api/info)
*/
function getGameInfoFromJSONString(stringJSON) {
	
	let gameInfo = JSON.parse(stringJSON);

	let gameInfoResult = {};

	let hero = {};
	let companion = {}; // объект с данными о спутнике героя
	let action = {}; // объект с данными о текущем действии героя
	let turn ={};

	let i = 0;
  
	gameInfoResult.status = gameInfo.status;
	let data = gameInfo.data; //object+
  
	//object data
	let account = data.account; //object+
	let game_state = data.game_state;
	let map_version = data.map_version;
	let mode = data.mode;
	let enemy = debug.isNULL(data.enemy,'');

	if (debug.isNULL(account)) {
		return undefined;
	}
  
	//object account
	hero.energy = account.energy;
	let account_hero = account.hero; //object+
	hero.id = account.id;
	hero.in_pvp_queue = 0+account.in_pvp_queue;
	let is_old = account.is_old;
	let is_own = account.is_own;
	let last_visit = account.last_visit;
  
	//object turn
	turn.number = data.turn.number;
	turn.verbose_date = data.turn.verbose_date;
	turn.verbose_time = data.turn.verbose_time;

	let account_hero_action = account_hero.action; //object+
	let base = account_hero.base; //object+
	let account_hero_companion = account_hero.companion; //object+
	let diary = account_hero.diary;
	let equipment = account_hero.equipment; //object array+
	let habits = account_hero.habits; //object+
	let id = account_hero.id;
	let messages = account_hero.messages; //object array+
	let might = account_hero.might; //object+
	let patch_turn = account_hero.patch_turn;
	let permissions = account_hero.permissions; //object+
	let position = account_hero.position; //object+
	let quests = account_hero.quests; //object+
	let secondary = account_hero.secondary; //object+
	let sprite = account_hero.sprite;
	let ui_caching_started_at = account_hero.ui_caching_started_at;
  
	//object action
	action.data = account_hero_action.data; //object ???
	action.description = account_hero_action.description;
	action.info_link = debug.isNULL(account_hero_action.info_link, '');
	action.is_boss = debug.isNULL(+account_hero_action.is_boss,0);
	action.percents = Math.round(account_hero_action.percents*100);
	action.type = account_hero_action.type;
  
	//object bag
	let bag = account_hero.bag; //object
  
	//object base
	hero.alive = 0+base.alive;
	hero.destiny_points = base.destiny_points;
	hero.experience = base.experience;
	hero.experience_to_level = base.experience_to_level;
	hero.gender = base.gender;
	hero.health = base.health;
	hero.level = base.level;
	hero.max_health = base.max_health;
	hero.money = base.money;
	hero.name = base.name;
	hero.race = base.race;
  
	//object companion
	companion.coherence = account_hero_companion.coherence;
	companion.experience = account_hero_companion.experience;
	companion.experience_to_level = account_hero_companion.experience_to_level;
	companion.health = account_hero_companion.health;
	companion.max_health = account_hero_companion.max_health;
	companion.name = account_hero_companion.name;
	companion.real_coherence = account_hero_companion.real_coherence;
	companion.type = account_hero_companion.type;
  
	/*
	//object equipment array
	let item_equipment = equipment[i]; //object+
  
	//object item_equipment
	let effect = item_equipment.effect;
	let equipped = item_equipment.equipped;
	let item_equipment_id = item_equipment.id;
	let integrity = item_equipment.integrity; //object array +
	let name = item_equipment.name;
	let power = item_equipment.power; //object array +
	let preference_rating = item_equipment.preference_rating;
	let rarity = item_equipment.rarity;
	let special_effect = item_equipment.special_effect;
	let type = item_equipment.type;
	*/

	//object integrity array
	//let arr_integrity = integrity[i];
  
	//object power array
	//let arr_power = power[i];
  
	//object honor
	//hero.honor_raw = habits.honor.raw;
	//hero.honor_verbose = habits.honor.verbose;
  
	//object peacefulness
	//hero.peacefulness_raw = habits.peacefulness.raw;
	//hero.peacefulness_verbose = habits.peacefulness.verbose;
  
	//object messages array
	//let message = messages[i]; //object array
  
	//object message array
	//let arr_message0 = messages[0];
	//let arr_message1 = messages[1];
	//let arr_message2 = messages[2];
	//let arr_message3 = messages[3];
	//let message_battle = messages[4]; //object+
  
	/*
	//object message_battle
	// При разборе чужого героя этих данных нет message_battle = undefined
	if (message_battle) {
		let attacker = message_battle.attacker;
		let attacker_weapon = message_battle['attacker.weapon'];
		let damage = message_battle.damage;
		let date = message_battle.date;
		let defender = message_battle.defender;
		let defender_weapon = message_battle['defender.weapon'];
		let time = message_battle.time;
	}
	*/
	//object might
	hero.might_crit_chance = might.crit_chance;
	hero.might_politics_power = might.politics_power;
	hero.might_pvp_effectiveness_bonus = might.pvp_effectiveness_bonus;
	hero.might_value = might.value;
  
	//object permissions
	let can_participate_in_pvp = permissions.can_participate_in_pvp;
	let can_repair_building = permissions.can_repair_building;
  
	//object position
	hero.dx = Math.round(position.dx,3);
	hero.dy = Math.round(position.dy,3);
	hero.x = Math.round(position.x,3);
	hero.y = Math.round(position.y,3);
  
	/*

	//object quests
	let arr_quests = quests.quests; //object array+
  
	//object arr_quests
	let quest = arr_quests[i]; //object array+
	
	//object quest
	let line = quest.line[i]; //object +
  
	//object line
	let action1 = line.action;
	let actors = line.actors; //object array
	let choice = line.choice;
	let choice_alternatives = line.choice_alternatives; //object array
	let experience = line.experience;
	let name = line.name;
	let power = line.power;
	let type = line.type;
	let uid = line.uid;

	*/
  
	//object secondary
	hero.initiative = secondary.initiative;
	hero.loot_items_count = secondary.loot_items_count;
	hero.max_bag_size = secondary.max_bag_size;
	hero.move_speed = secondary.move_speed;
	hero.physical_power = secondary.power[0];
	hero.magic_power = secondary.power[1];
	hero.sprite = secondary.sprite;
	hero.ui_caching_started_at = secondary.ui_caching_started_at;
  
	hero.action = action;
  
  /* Герои: тип действия
  значение	описание
  0	герой бездельничает
  1	герой выполненяет задание
  2	герой путешествует между городами
  3	герой сражается 1x1 с монстром
  4	герой воскресает
  5	герой в городе
  6	герой лечится
  7	герой экипируется
  8	герой торгует
  9	герой путешествует около города
  10	герой восстановливает энергию Хранителю
  11	техническое действие для особых действий героя в заданиях
  12	техническое прокси-действие для взаимодействия героев
  13	герой сражается 1x1 с другим героем
  14	техническое действие для тестов
  15	герой ухаживает за спутником
  16	действия героя сразу после иницииации (новый герой создан для нового игрока)
  */
  
	gameInfoResult.hero = hero;
	gameInfoResult.turn = turn;
	gameInfoResult.companion = companion;

	return gameInfoResult;
}

/**
*	Send POST request for use Godness help
*/
function useHelp(accountIndex) {
	let ApiURL = 'https://the-tale.org/game/abilities/help/api/use?api_version=1.0&'+login_info.apiClient;
	let csrftoken = login_info.accounts[accountIndex].csrftoken;
	let cookieString = "sessionid="+login_info.accounts[accountIndex].sessionid+"; csrftoken="+csrftoken;
	request({
		method: "POST",
		headers: {'Cookie': cookieString, 'referer': 'https://the-tale.org/'},
		url: ApiURL,
		form: {'csrfmiddlewaretoken':csrftoken}
	},(err, res) => {
		if(err){
			DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " Request /game/abilities/help/api/use: it did not work: " + err);
			debug.debugPrint("Account index: " + accountIndex + " Request /game/abilities/help/api/use: it did not work: " + err);
		} else {
			if (err === null) {
				DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " Request /game/abilities/help/api/use - Success");
				debug.debugPrint("Account index: " + accountIndex + " Request /game/abilities/help/api/use - Success");
			}
		}
	});
}


function autoHelp(accountIndex) {
	login.getLoginStatusAsync(accountIndex).then( (LoginStatus) => {
		if (LoginStatus === true) {
			let ApiURL = 'http://the-tale.org/game/api/info?api_version=1.9&'+login_info.apiClient;
			let csrftoken = login_info.accounts[accountIndex].csrftoken;
			let cookieString = "sessionid="+login_info.accounts[accountIndex].sessionid+"; csrftoken="+csrftoken;

			request({
				method: "GET",
				headers: { 'Cookie': cookieString},
				url: ApiURL,
				form: {'csrfmiddlewaretoken':csrftoken}
			},(err, res) => {
				if(err){
					DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " Request api/GameInfo: it did not work: " + err);
					debug.debugPrint("Account index: " + accountIndex + " Request api/GameInfo: it did not work: " + err);
				} else {
					//debug.printRequestStatus(res);
					if (err === null) {
						let gameInfo = getGameInfoFromJSONString(res.body);
						if (gameInfo) {
							if (gameInfo.hero.action.type === 0 || gameInfo.hero.action.type === 4 ) {
								useHelp(accountIndex);
							} if (gameInfo.hero.action.type === 3 && gameInfo.hero.health < 300  && gameInfo.hero.energy > 40) {
								useHelp(accountIndex);
							} else {
								let logInfoMsg = "Account index: " + accountIndex + " Request api/GameInfo: do not need help {action.type:"+gameInfo.hero.action.type+"/health:"+gameInfo.hero.health+"/energy:"+gameInfo.hero.energy+"}";
								DBCon.insertLogInfo(logAction, logInfoMsg);
								debug.debugPrint(logInfoMsg+ " " + new Date());
							}
						}
					}
				}
			})
		} else {
			DBCon.insertLogInfo(logAction, "Account index: " + accountIndex + " is not login. Try log in The tale");
			login.login(accountIndex);
		}
	}).catch ((err) => {
		debug.debugPrint(logAction + "error! "+ err);
		DBCon.insertLogInfo(logAction, "getLoginStatusAsync: "+logAction + "error! "+ err);
	});
	setTimeout(function () {autoHelp(accountIndex)}, 60000);
}

autoHelp(accontIndex);