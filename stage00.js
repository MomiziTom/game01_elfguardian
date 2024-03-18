const numberAnimePreset = new animePreset("numberimg", 4, 4, 16);
const arrowAnimePreset = new animePreset("arrowimg", 9, 4, 8);
const shalalaAnimePreset = new animePreset("shalalaimg", 4, 5, 16);
const louyaAnimePreset = new animePreset("louyaimg", 4, 5, 4);

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

const BGM_storyBeginning = "BGM_storyBeginning";
const BGM_battle = "BGM_battle";
const SE_message = "SE_message";
const SE_pushEnter = "SE_pushEnter";
const SE_arrowShoot = "SE_arrowShoot";
const SE_arrowFly = "SE_arrowFly";
const SE_reload = "SE_reload";
const SE_arrowHit = "SE_arrowHit";
const SE_defeatEnemy = "SE_defeatEnemy";
const SE_damageElf = "SE_damageElf";
const SE_damageForest = "SE_damageForest";
const SE_battleEnd ="SE_battleEnd";
const SE_win ="SE_win";
const SE_lose ="SE_lose";
const SE_gameStart ="SE_gameStart";
const SE_ready = "SE_ready";
const SE_battleStart = "SE_battleStart";

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

const goblin = new enemyTypePreset(
	30,
	2,
	enemyMove_str,
	numberAnimePreset,
	2,	//2
	80,
	10,
	0,
	true,
	aim_off
);

const goblinJump = new enemyTypePreset(
	30,
	2,
	enemyMove_jump,
	numberAnimePreset,
	1.5,	//1.5
	80,
	5,
	0,
	true,
	aim_off
);

const goblinAim = new enemyTypePreset(
	30,
	2,
	enemyMove_strQuadra,
	numberAnimePreset,
	0.5,
	0.05,
	10,
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
	shalala = new animation(shalalaAnimePreset, 200 , 350);
	louya = new animation(louyaAnimePreset, canvasW + 100 , 350);
	louya.setTileV(3);
	louya.setUseVRange(2);
});

const scene1 = [
	(ctx) => {
		shalala.setTileV(0);
		shalala.setXY(200, 350);
		if(sceneStartSwitch == false){
			louya.setX(canvasW + 100);
			sceneStartSwitch = true;
		}
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.setSpeaker("シャララの妹ルーヤ");
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"お姉ちゃーーん！！！！");
		louya.point.x > 500 ? [
			louya.point.x -=4,
			louya.setTileV(3),
			louya.setFrequency(4)
		] : [
			louya.setTileV(0),
			louya.setFrequency(16),
			louya.setUseVRange(1)
		];
	},
	(ctx) => {
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.setSpeaker("ルーヤ");
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"大変大変！！　　　　　　　　　　　　　　　　　　　　　　　　　\n遠くから悪いゴブリンの群れがいっぱいやってきたよ！！");
		louya.point.x = 500 + Math.random() * 16-8;
		louya.setTileV(0);
		louya.setFrequency(16)
		louya.setUseVRange(1)
},
	(ctx) => {
		louya.point.x = 500 + Math.random() * 16-8;
		louya.point.y = 350 + Math.random() * 16-8;
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"多分ゴブリンたちはお姉ちゃんが手に持っている　　　　　　　　　　\n「エルフギア」を狙ってやってきたんだよ！！");
	},
	(ctx) => {
		louya.point.x = 500;
		louya.point.y = 350;
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"エルフギアは矢をいくらでも放つことができる\nエルフの秘伝の武器だよ！　　　　　　　　　　　　　　　　　　　　　\n矢筒に入った矢が空になっても\n「リロード」をすれば矢が無限に補充されるんだ！！　　　　　　　　　　　　　　\nすごいよね・・・！！");
	},
	(ctx) => {
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"それ以外にもこの森にはエルフの宝がたくさんあるんだ！！　　　　　　　　　　　　　　\nゴブリンたちに侵攻されたら・・・　　　　　　　　　　　　　　　\nこの森と私たちエルフはめちゃくちゃにされちゃうよ！！");
	},
	(ctx) => {
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"私も魔法で森に結界を張るけど　　　　　　　　　\nお姉ちゃんの身体ほど丈夫な結界じゃないから\nすぐに壊されちゃうよ！！");
	},
	(ctx) => {
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, true, true,
		"お願いお姉ちゃん！！　　　　　　　　　　　　　　　　　　　\nその「エルフギア」を使ってゴブリンたちを退治して\nこの森を守って！！！");
	},
	() => {
		uiDisp.setSpeaker("");
		uiDisp.messageClear();
		eventTimeLine = 0;
		gameState = gState_battle;
		sceneStartSwitch = false;
	},
];

const scene2 = [
	(ctx) => {
		shalala.setTileV(0);
		shalala.setXY(200, 350);
		if(sceneStartSwitch == false){
			louya.point.x = canvasW + 100;
			sceneStartSwitch = true;
		}
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.setSpeaker("シャララの妹ルーヤ");
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"お姉ちゃーーん！！！！");
		louya.point.x > 500 ? [
			louya.point.x -=4,
			louya.setTileV(3),
			louya.setFrequency(4)
		] : [
			louya.setTileV(0),
			louya.setFrequency(16),
			louya.setUseVRange(1)
		];
	},
	(ctx) => {
		louya.point.x = 500 + Math.random() * 16-8;
		louya.setTileV(0);
		louya.setFrequency(16)
		louya.setUseVRange(1)
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.setSpeaker("ルーヤ");
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"や、やばいよぉぉーーー！！　　　　　　　　　　　　　　　　　　　　　　　　　\n殺意高めのハーピーたちがお姉ちゃんめがけて飛んできてるよ！！");
	},
	(ctx) => {
		louya.point.x = 500 + Math.random() * 16-8;
		louya.point.y = 350 + Math.random() * 16-8;
		shalala.animationDisplay(ctx);
		louya.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, false, true,
		"ハーピーたちはゴブリンと違って真っすぐお姉ちゃんに向かってくるよ！！　　　　　　　　　　\n森を狙われないけど撃ち落さないとお姉ちゃんはひとたまりもないよ！！");
	},
	(ctx) => {
		louya.point.x = 500;
		louya.point.y = 350;
		louya.animationDisplay(ctx);
		shalala.animationDisplay(ctx);
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, true, true,
		"お姉ちゃん気を付けて！！　　　　　　　　　　　　　　　　　　　\nハーピーたちにやられないよう「エルフギア」で撃ち落として！！！");
	},
	() => {
		uiDisp.setSpeaker("");
		uiDisp.messageClear();
		eventTimeLine = 0;
		gameState = gState_battle;
		sceneStartSwitch = false;
	},

]

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