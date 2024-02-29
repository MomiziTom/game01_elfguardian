let numberAnimePreset = new animePreset("numberimg", 4, 4, 16);
let arrowAnimePreset = new animePreset("arrowimg", 9, 4, 8);

let nowPlayingBGM = "";
let SEVolume1 = 0.05;	// 通常音量
let SEVolume2 = 0.1;	// 元音源が小さい時用
let SEVolume3 = 0.03;	// 小さめの音にしたい用

if(browser == browser_Firefox){
	SEVolume1 *= 3;
	SEVolume2 *= 3;
	SEVolume3 *= 3;
}
const sound_idTag = 0;
const sound_isLoop = 1;
const sound_volume = 2;
const sound_mute = 3;
const sound_loopTiming = 4;
const sound_loopBackTime = 5;
const sound_soundOn = 6;
const sound_playTime = 7;

let BGM_storyBeginning = "BGM_storyBeginning";
let BGM_battle = "BGM_battle";
let SE_message = "SE_message";
let SE_pushEnter = "SE_pushEnter";
let SE_arrowShoot = "SE_arrowShoot";
let SE_arrowFly = "SE_arrowFly";
let SE_reload = "SE_reload";
let SE_arrowHit = "SE_arrowHit";
let SE_defeatEnemy = "SE_defeatEnemy";
let SE_damageElf = "SE_damageElf";
let SE_damageForest = "SE_damageForest";
let SE_battleEnd ="SE_battleEnd";
let SE_win ="SE_win";
let SE_lose ="SE_lose";
let SE_gameStart ="SE_gameStart";
let SE_ready = "SE_ready";
let SE_battleStart = "SE_battleStart";

let sound_set =[	// _idTag, _isLoop, _volume, _mute, _loopTiming, _loopBackTime, SoundOnSwitch(※これがtrueのとき音声を再生できる), playTime(※currentTimeではない。ループ管理に使用)
	["BGM_storyBeginning",true,SEVolume1,true,85.358,85.358,false,0],
	["BGM_battle",true,SEVolume1,true,89.536,(89.536-6.049),false,0],
	["SE_message",true,SEVolume1,true,0,0,false,0],
	["SE_pushEnter",false,SEVolume1,false,0,0,false,0],
	["SE_arrowShoot",true,SEVolume1,true,0,0,false,0],
	["SE_arrowFly",true,SEVolume1,true,0,0,false,0],
	["SE_reload",true,SEVolume2,true,0,0,false,0],
	["SE_arrowHit",true,SEVolume1,true,0,0,false,0],
	["SE_defeatEnemy",true,SEVolume1,true,0,0,false,0],
	["SE_damageElf",true,SEVolume2,true,0,0,false,0],
	["SE_damageForest",true,SEVolume2,true,0,0,false,0],
	["SE_battleEnd",true,SEVolume2,true,0,0,false,0],
	["SE_win",true,SEVolume1,true,0,0,false,0],
	["SE_lose",true,SEVolume1,true,0,0,false,0],
	["SE_gameStart",false,0.0001,false,0,0,false,0],// ゲーム開始時はミュート解除目的なので音量を極小にしておく
	["SE_ready",true,SEVolume1,true,0,0,false,0],
	["SE_battleStart",true,SEVolume1,true,0,0,false,0],
];

function pickSE(_idTag){
	for(let i = 0 ; i < sound_set.length ; i++){
		if(sound_set[i][sound_idTag] === _idTag){
			return i;
		}
	}
}

let sound_array = [];

let audioswitch = false;

let goblin = new enemyTypePreset(
	30,
	2,
	enemyMove_str,
	numberAnimePreset,
	2,
	80,
	10,
	0,
	true,
	aim_off
);

let goblinJump = new enemyTypePreset(
	30,
	2,
	enemyMove_jump,
	numberAnimePreset,
	1.5,
	80,
	5,
	0,
	true,
	aim_off
);

let goblinAim = new enemyTypePreset(
	30,
	2,
	enemyMove_str,
	numberAnimePreset,
	1.5,
	80,
	5,
	0,
	true,
	aim_homing
);

/* ローカルでテストする際に使う設定　サーバー上にアップロードする際は消すこと*/
let stage00 = [
	[3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,0,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,0,0,5,5,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,4,4,5,5,4,5,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,4,4,5,5,4,5,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,4,4,5,5,4,5,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,4,4,5,5,4,5,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,4,4,5,5,4,5,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
	[5,5,4,4,5,5,4,5,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
];

let stage01 = [
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
	[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
];
let shalala;
let louya;
window.addEventListener("load", function(){
	shalala = new animation(arrowAnimePreset, 200 , 350);
	louya = new animation(numberAnimePreset, canvasW + 100 , 350);
});


let testmessage = [
	"\t",
	"お姉ちゃーーん！！！！\r\f\t\v",
	"大変大変！！　　　　　　　　　　　　　　　　　　　　　　　　　\r\f\t\n遠くから悪いゴブリンの群れがいっぱいやってきたよ！！\r\f\t",
	"多分ゴブリンたちはお姉ちゃんが手に持っている　　　　　　　　　　\n「エルフギア」を狙ってやってきたんだよ！！",
	"エルフギアは矢をいくらでも放つことができる\nエルフの秘伝の武器だよ！　　　　　　　　　　　　　　　　　　　　　\n矢筒に入った矢が空になっても\n「リロード」をすれば矢が無限に補充されるんだ！！　　　　　　　　　　　　　　\nすごいよね・・・！！",
	"それ以外にもこの森にはエルフの宝がたくさんあるんだ！！　　　　　　　　　　　　　　\nゴブリンたちに侵攻されたら・・・　　　　　　　　　　　　　　　\nこの森と私たちエルフはめちゃくちゃにされちゃうよ！！",
	"お願いお姉ちゃん！！　　　　　　　　　　　　　　　　　　　\nその「エルフギア」を使ってゴブリンたちを退治して\nこの森を守って！！！"
];

/*let testmessage = [
	"これはテストメッセージです",
	"そしてこれはなんと！\n二行にわたるテストメッセージです！",
	"そしてお次は！\n三行にわたるメッセージを表示します！\nすごいですね！",
	"これにてテストはおわりです！"];
*/

/* web上にアップロードした際に使う設定　テスト段階では不使用
let mapData = [];

let xhr = new XMLHttpRequest();
xhr.open("get", "stage00.csv", true);
xhr.send(null);
xhr.onload = function(){
	let csvMap = xhr.responseText;

	let lines = csvMap.split("\n");

	for(let i = 0 ; i < lines.length ; i++){
		let wordSet = lines[i].split(",");
		mapData.push(wordSet);
	}
}


console.log(mapData);
*/