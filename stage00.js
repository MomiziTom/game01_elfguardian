let numberAnimePreset = new animePreset("numberimg", 4, 4, 16);
let arrowAnimePreset = new animePreset("arrowimg", 9, 4, 8);
let SE_message = "SE_message";
let SE_pushEnter = "SE_pushEnter";
let SE_arrowShoot = "SE_arrowShoot";
let SE_arrowFly = "SE_arrowFly";
let SE_reload = "SE_reload";
let SE_arrowHit = "SE_arrowHit";
let SE_defeatEnemy = "SE_defeatEnemy";
let SE_damageElf = "SE_damageElf";
let SE_damageForest = "SE_damageForest";

let SEVolume1 = 0.05;	// 通常音量
let SEVolume2 = 0.1;	// 元音源が小さい時用
let SEVolume3 = 0.03;	// 小さめの音にしたい用

const sound_idTag = 0;
const sound_isLoop = 1;
const sound_volume = 2;
const sound_mute = 3;
const sound_loopTiming = 4;
const sound_loopBackTime = 5;
const sound_soundOn = 6;
const sound_playTime = 7;

let SE_set =[	// _idTag, _isLoop, _volume, _mute, _loopTiming, _loopBackTime, SoundOnSwitch, playTime
	["SE_message",true,SEVolume1,true,0,0,false,0],
	["SE_pushEnter",false,SEVolume1,false,0,0,false,0],
	["SE_arrowShoot",false,SEVolume1,false,0,0,false,0],
	["SE_arrowFly",false,SEVolume1,false,0,0,false,0],
	["SE_reload",false,SEVolume2,false,0,0,false,0],
	["SE_arrowHit",true,SEVolume1,true,0,0,false,0],
	["SE_defeatEnemy",true,SEVolume1,true,0,0,false,0],
	["SE_damageElf",true,SEVolume2,true,0,0,false,0],
	["SE_damageForest",true,SEVolume2,true,0,0,false,0],
];

function pickSE(_idTag){
	for(let i = 0 ; i < SE_set.length ; i++){
		if(SE_set[i][sound_idTag] === _idTag){
			return i;
		}
	}
}

let SE_array = [];

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
	"お姉ちゃーーん！！！！\f\r",
	"大変大変！！　　　　　　　　　　　　　　　　　　　　　　　　　\f\r\n遠くから悪いゴブリンの群れがいっぱいやってきたよ！！\f\r",
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