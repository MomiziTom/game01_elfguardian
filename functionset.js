const browser_IE = 1;
const browser_Edge = 2;
const browser_Chrome = 3;
const browser_Safari = 4;
const browser_Firefox = 5;
const browser_Opera = 6;

const device_PC = 1;
const device_smartPhone = 2;


let browser;
let device;
const userAgent = window.navigator.userAgent;
let SE_firefox;		// ブラウザがfirefoxの際無音にならないようにするために使用
console.log(userAgent);

if(userAgent.indexOf('MSIE') != -1 || userAgent.indexOf('Trident') != -1) {
	browser = browser_IE;
} else if(userAgent.indexOf('Edg') != -1 || userAgent.indexOf('Edge') != -1) {
	browser = browser_Edge;
} else if(userAgent.indexOf('Chrome') != -1) {
	browser = browser_Chrome;
} else if(userAgent.indexOf('Safari') != -1) {
	browser = browser_Safari;
} else if(userAgent.indexOf('Firefox') != -1) {
	browser = browser_Firefox;
} else if(userAgent.indexOf('Opera') != -1) {
	browser = browser_Opera;
} else {
	browser = 0;
}

if(userAgent.indexOf('Windows') != -1 || userAgent.indexOf('Macintosh') != -1 ){
	device = device_PC;
}else{
	device = device_smartPhone;
}

let canvasW = 800;
let canvasH = 600;
let fps = 60;

const gravity = 2;
const arrowimgW = 96;
const arrowimgH = 96;
const invalidArea = -10000;
const uiTileSize = 16;		// ステータス画像セットのタイル１枚分の一辺の長さ
const mapChipSize = 16;		// マップチップの一辺の長さ
const mapChipDiv = 4;		// マップチップのU方向の分割数
// 勝利条件の数値列挙
const victory_defeatEnemy = 0;
const victory_timePass = 1;
const victory_special = 2;

// 敵の動きに関する数値列挙
const enemyMove_str = 0;		// 等速直線運動
const enemyMove_strQuadra = 1;	// 二次関数直線のように加速する直線運動
const enemyMove_jump = 2;		// sin波を絶対値化させたジャンプ運動
const enemyMove_sinWave = 3;	// sin波運動

// 敵がプレイヤー(あるいは標的)を狙って動くか、あるいは追尾するかの数値列挙
const aim_off = 0;
const aim_on = 1;
const aim_homing = 2;

const stunTime = 30;	// ダメージを食らって硬直する時間 秒ではなくフレーム数

// メッセージ表示速度
const messageSpeed_veryFast = 1;
const messageSpeed_fast = 2;
const messageSpeed_normal = 3;
const messageSpeed_slow = 4;
const messageSpeed_verySlow = 5;

let clicknow = false;
let clickup = false;
let stageNum = 0;
let enemyNum = 0;		// 敵の数 これが0になるタイミングで次のフェーズに移行したりゲームクリアにしたりする


function angleCorrect(ang) {
	if ((ang * 180 / Math.PI) >= 175 && (ang * 180 / Math.PI) <= 180) {
		ang -= (355 * Math.PI / 180);
	}
	return ang;
}

// 座標クラス
class Point {
	constructor(_x, _y) {
		this.x = _x;
		this.y = _y;
	}

	// 引数の位置へ向かうベクトルを求める
	getVecPoint(p) {
		return new Vec(p.x - this.x, p.y - this.y);
	}

	//数値を再設定
	setPoint(_x, _y) {
		this.x = _x;
		this.y = _y;
	}

}

// ベクトルクラス
class Vec {
	constructor(_x, _y) {
		this.x = _x;
		this.y = _y;
	}

	// ベクトル同士の内積を求める
	dotVec(v) {
		return this.x * v.x + this.y * v.y;
	}

	// ベクトル同士の外積を求める
	crossVec(v) {
		return this.x * v.y - this.y * v.x;
	}

	// ベクトルの長さを求める
	getLength() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	//数値を再設定
	setVec(_x, _y) {
		this.x = _x;
		this.y = _y;
	}

	// Y軸方向に重力を加算
	plusGravity() {
		this.y += gravity;
	}

	dividedBy(n){
		let x = this.x / n;
		let y = this.y / n;
		return new Vec(x,y);
	}

}

// 線分クラス
class Line {
	constructor(_start_p, _end_p) {
		this.start_p = _start_p;
		this.end_p = _end_p;
		// ベクトルを設定
		this.v = new Vec(
			this.end_p.x - this.start_p.x,
			this.end_p.y - this.start_p.y
		);
	}

	//数値を再設定
	setLine(_start_p, _end_p) {
		this.start_p = _start_p;
		this.end_p = _end_p;
		// ベクトルを設定
		this.v = new Vec(
			this.end_p.x - this.start_p.x,
			this.end_p.y - this.start_p.y
		);
	}

	//ベクトルの角度を求める
	getAngle() {
		return Math.atan2(this.v.y, this.v.x);
	}

	// 現在の始点を現在の終点で更新
	startToEnd() {
		this.start_p = new Point(this.end_p.x, this.end_p.y);
	}

	// 終点を引数ベクトル分移動
	moveEnd(v) {
		this.end_p.x += v.x;
		this.end_p.y += v.y;
		this.v.x = this.end_p.x - this.start_p.x;
		this.v.y = this.end_p.y - this.start_p.y;
	}

}

// 円クラス
class Circle {
	constructor(_p, _r) {
		this.p = _p;
		this.r = _r;
	}
}

// 円と線分の衝突判定処理
// return true:衝突している false:衝突していない
function circleColLine(circleP, lineAB) {

	let vecAP = lineAB.start_p.getVecPoint(circleP.p);
	let vecBP = lineAB.end_p.getVecPoint(circleP.p);

	// 線分AX、PXの長さを求める
	let dotAX = lineAB.v.dotVec(vecAP) / lineAB.v.getLength();
	let crossPX = lineAB.v.crossVec(vecAP) / lineAB.v.getLength();

	// 基本は線分PXの長さを設定
	let distance = Math.abs(crossPX);
	if (dotAX < 0) {
		// 例外１：線分AXと逆方向に最短座標がある場合 -> 線分APの長さを設定
		distance = vecAP.getLength();
	} else if (dotAX > lineAB.v.getLength()) {
		// 例外２：線分ABよりも先に最短座標がある場合 -> 線分BPの長さを設定
		distance = vecBP.getLength();
	}
	// ④ 最短距離が円の半径より小さければ衝突と判定
	return distance < circleP.r;
}

// animationクラスのプロパティを設定しておくプリセット用クラス
class animePreset {
	constructor(_imgTagId, _u, _v, _frequency) {
		this.imgTagId = _imgTagId;
		this.u = _u;
		this.v = _v;
		this.frequency = _frequency;
	}
}

// 敵のプリセット enemyCircleクラスのコンストラクターに渡す
class enemyTypePreset {
	constructor(
		_r,				// 数値 当たり判定の半径
		_hp,			// 数値 HP
		_moveType,		// 定数 敵の動きの種類
		_animePreset,	// animePresetクラスのオブジェクト
		_moveSpeed,		// 数値 敵が動くスピード
		_magniOrAmpli,	// 数値 二次関数加速直線の倍率 またはジャンプとサイン波の振幅 直線では無効
		_waveFrequency,	// 数値 ジャンプとサイン波の波の周波数 直線と二次関数加速直線では無効
		_angle,			// ラジアンではなく度数
		_stunornot,		// bool値 trueで攻撃を受けた時にスタンする
		_aimPlayer		// 定数 プレイヤーめがけて移動するか否か
	) {
		this.r = _r;							// 当たり判定の半径
		this.hp = _hp;
		this.animePreset = new animePreset(		// 表示するグラフィックのプリセット
			_animePreset.imgTagId,
			_animePreset.u,
			_animePreset.v,
			_animePreset.frequency);
		this.moveType = _moveType;				// 敵の動きの種類 値は4種類の定数type_...によって決めること
		this.moveSpeed = _moveSpeed;	        // 敵が動くスピード
		this.magniOrAmpli = _magniOrAmpli;	    // 二次関数加速直線の倍率 またはジャンプとサイン波の振幅 直線では無効
		this.waveFrequency = _waveFrequency;	// ジャンプとサイン波の波の周波数 直線と二次関数加速直線では無効
		this.angle = _angle;				// 軌道線の角度を決める 値は度数
		this.stunornot = _stunornot;		// bool値 trueで攻撃を受けた時にスタンする
		this.aimPlayer = _aimPlayer;		// プレイヤーめがけて移動するか否か 値は3種類の定数aim_...によって決めること
	}
}

// 画像を読み込んでタイルアニメーションを作るクラス
class animation {
	constructor(_animePreset, _x, _y) {
		this.imgTagId = _animePreset.imgTagId;
		let img = document.getElementById(_animePreset.imgTagId);
		this.picSizeX = img.width;
		this.picSizeY = img.height;
		this.divisionU = _animePreset.u;			//画像の横方向の分割数
		this.divisionV = _animePreset.v;			//画像の縦方向の分割数
		this.tileSizeU = img.width / _animePreset.u;
		this.tileSizeV = img.height / _animePreset.v;
		this.point = new Point(_x, _y);
		this.frequency = _animePreset.frequency;	// コマが更新されるまでの時間
		this.untilUpdate = 0;			// コマが更新されるまでの時間を計測する変数　frequency == untilUpdateになったときコマを更新してこの値は0になる
		this.alpha = 1.0;
		this.nowU = 0;					// 現在表示中のU側インデックス
		this.nowV = 0;					// 現在表示中のV側インデックス
		this.useVRange = 1;				// アニメーションタイルのV方向の使用マス数
		this.nowVRange = 0;
		this.animateornot = true;		// タイルアニメーションさせるか否か
		this.revDirectionU = false;		// 本来はU方向を右に進んでアニメーションさせるところを左方向に進ませてアニメーションさせるか否か
		this.zoom = 2;					// 基本ドット絵は2倍で表示する 1にすると原寸で表示される
	}

	changePreset(_animePreset) {
		this.imgTagId = _animePreset.imgTagId;
		let img = document.getElementById(_animePreset.imgTagId);
		this.picSizeX = img.width;
		this.picSizeY = img.height;
		this.divisionU = _animePreset.u;
		this.divisionV = _animePreset.v;
		this.tileSizeU = img.width / _animePreset.u;
		this.tileSizeV = img.height / _animePreset.v;
		this.frequency = _animePreset.frequency;
	}
	// 変えたくない値にはnullを設定すること
	setValue(_x, _y, _frequency, _untilUpdate, _nowU, _nowV, _alpha) {
		if (_x != null) {
			this.point.x = _x;
		}
		if (_y != null) {
			this.point.y = _y;
		}
		if (_frequency != null) {
			this.frequency = _frequency;
		}
		if (_untilUpdate != null) {
			this.untilUpdate = _untilUpdate;
		}
		if (_nowU != null) {
			this.nowU = _nowU;
		}
		if (_nowV != null) {
			this.nowV = _nowV;
		}
		if (_alpha != null) {
			this.alpha = _alpha;
		}
	}

	setX(_x){
		this.point.x = _x;
	}

	setY(_y){
		this.point.y = _y;
	}

	setXY(_x, _y){
		this.point.x = _x;
		this.point.y = _y;
	}

	setFrequency(_frequency){
		this.frequency = _frequency;
	}

	setTileU(_nowU) {
		this.nowU = _nowU;
	}

	setTileV(_nowV) {
		this.nowV = _nowV;
	}

	setTileUV(_nowU, _nowV) {
		this.nowU = _nowU;
		this.nowV = _nowV;
	}

	setUseVRange(_num){
		this.nowVRange = 0;
		this.useVRange = _num;
	}
	setAlpha(_alpha) {
		this.alpha = _alpha;
	}
	setDispPoint(_p) {
		this.point = new Point(_p.x, _p.y);
	}

	// 変えたくない値にはnullを設定すること
	animateAndRevDirectSet(_animateornot, _revDirectionU) {
		if (_animateornot != null) {
			this.animateornot = _animateornot;
		}
		if (_revDirectionU != null) {
			this.revDirectionU = _revDirectionU;
		}
	}

	animationDisplay(ctx) {
		let img = document.getElementById(this.imgTagId);
		ctx.globalAlpha = this.alpha;
		ctx.drawImage(
			img,
			this.nowU * this.tileSizeU,
			(this.nowV + this.nowVRange) * this.tileSizeV,
			this.tileSizeU,
			this.tileSizeV,
			this.point.x - (this.tileSizeU / 2) * this.zoom,
			this.point.y - (this.tileSizeV / 2) * this.zoom,
			this.tileSizeU * this.zoom,
			this.tileSizeV * this.zoom,
		);
		ctx.globalAlpha = 1.0;
		if (this.animateornot == true) {
			++this.untilUpdate;
			if (this.revDirectionU == false) {
				this.nowU += Math.floor(this.untilUpdate / this.frequency);
				if(this.nowU >= this.divisionU){
					this.nowU = 0;
					this.nowVRange++;
					this.nowVRange %= this.useVRange;
				}
			} else {
				this.nowU -= Math.floor(this.untilUpdate / this.frequency);
				if (this.nowU < 0) {
					this.nowU = this.divisionU - 1;
					this.nowVRange++;
					this.nowVRange %= this.useVRange;
				}
			}
			this.untilUpdate %= this.frequency;
		}
	}
}

// 矢クラス
class arrow {
	static num = 0;

	constructor() {
		this.speed = new Vec(0, 0);
		this.shotornot = false;
		this.hitornot = false;
		this.startP = new Point(invalidArea, invalidArea);
		this.trajectoryLine = new Line(this.startP, this.startP);
		this.angle = 0;
		this.imgangleU = 0;
		this.imgangleV = 0;
		this.animation = new animation(arrowAnimePreset, invalidArea, invalidArea);
		this.hitEnemy = false;
		this.whoHit = -1;
	}

	shoot(p, op, pow) {
		this.startP = new Point(op.x, op.y);
		this.angle = Math.atan2((p.y - op.y), (p.x - op.x));
		this.speed.setVec((pow * Math.cos(this.angle)), (pow * Math.sin(this.angle)));
		this.trajectoryLine = new Line(this.startP, this.startP);
		let UVangle = angleCorrect(this.angle);
		this.imgangleU = Math.floor((UVangle * 180 / Math.PI + 185) / 10 % 9);
		this.imgangleV = Math.floor((UVangle * 180 / Math.PI + 185) / 90);
		this.shotornot = true;
		this.hitornot = false;
	}

	move() {
		if (this.shotornot == true) {
			if (this.hitornot == false) {
				this.trajectoryLine.startToEnd();
				this.trajectoryLine.moveEnd(this.speed);
				this.speed.plusGravity();
				this.angle = this.trajectoryLine.getAngle();//マイナスラジアンで上向き。右方向水平で0ラジアン。プラスラジアンで下向き。左方向水平でπ(3.1415...)
				let UVangle = angleCorrect(this.angle);
				this.imgangleU = Math.floor((UVangle * 180 / Math.PI + 185) / 10 % 9);
				this.imgangleV = Math.floor((UVangle * 180 / Math.PI + 185) / 90);
			}
		}
	}

	hitObject(circle, _whoHit) {
		this.hitornot = true;
		this.whoHit = _whoHit;
		this.hitEnemy = false;
		if (_whoHit != -1) {
			this.hitEnemy = true;
		}


		this.trajectoryLine.end_p = circle.p;
		this.angle = this.trajectoryLine.getAngle();
		this.trajectoryLine.start_p = circle.p;
		let UVangle = angleCorrect(this.angle);
		this.imgangleU = Math.floor((UVangle * 180 / Math.PI + 185) / 10 % 9);
		this.imgangleV = Math.floor((UVangle * 180 / Math.PI + 185) / 90);

	}

	vanish() {
		this.hitornot = true;
		this.whoHit = -1;
		this.hitEnemy = false;


		this.trajectoryLine.end_p = new Point(invalidArea, invalidArea);
		this.trajectoryLine.startToEnd();
		this.angle = 0;
		let UVangle = angleCorrect(this.angle);
		this.imgangleU = Math.floor((UVangle * 180 / Math.PI + 185) / 10 % 9);
		this.imgangleV = Math.floor((UVangle * 180 / Math.PI + 185) / 90);

	}


	shotReset() {
		this.shotornot = false;
		this.startP.setPoint(invalidArea, invalidArea);
		this.angle = 0;
		this.speed.setVec(0, 0);
		this.trajectoryLine = new Line(this.startP, this.startP);
		this.hitornot = false;
		this.hitEnemy = false;
		this.whoHit = -1;
	}

	display(ctx) {
		let arrowimg = document.getElementById(this.animation.imgTagId);
		ctx.drawImage(
			arrowimg,
			this.imgangleU * 48,
			this.imgangleV * 48,
			48,
			48,
			this.trajectoryLine.end_p.x - arrowimgW / 2,
			this.trajectoryLine.end_p.y - arrowimgH / 2,
			arrowimgW,
			arrowimgH
		);
	}
}

// 円形当たり判定敵クラス
class enemyCircle {
	constructor(_x, _y, _appearTime, _appearWave, _enemyTypePreset) {
		this.circle = new Circle(new Point(_x, _y), _enemyTypePreset.r);
		this.originP = new Point(_x, _y)
		this.dead = false;
		this.animation = new animation(
			_enemyTypePreset.animePreset,
			this.circle.x,
			this.circle.y);
		this.hp = _enemyTypePreset.hp;
		this.appearTime = _appearTime;	// そのウェーブ中にこの敵が出現する時間
		this.appearWave = _appearWave;	// 敵の集団での襲ってくるタイミング 第1ウェーブは0 第2ウェーブは1 第NウェーブはN-1
		this.enemyTypePreset = new enemyTypePreset(
			_enemyTypePreset.r,
			_enemyTypePreset.hp,
			_enemyTypePreset.moveType,
			_enemyTypePreset.animePreset,
			_enemyTypePreset.moveSpeed,
			_enemyTypePreset.magniOrAmpli,
			_enemyTypePreset.waveFrequency,
			_enemyTypePreset.angle,
			_enemyTypePreset.stunornot,
			_enemyTypePreset.aimPlayer);
		this.operateTime = 0;	// 移動する線、曲線に沿って移動した分の経過時間
		this.stunWait = stunTime;
		this.aimSwitch = false;
		++enemyNum;
	}

	move(_targetCircle) {    // _targetCircleは目標に向かう場合のみ有効
		// プレイヤーに向かってくる場合は角度が設定される
		if (this.enemyTypePreset.aimPlayer == aim_on) {
			if (this.aimSwitch == false) {
				this.enemyTypePreset.angle = -(Math.atan2((this.originP.y - _targetCircle.p.y), (this.originP.x - _targetCircle.p.x)) / Math.PI) * 180;
				this.aimSwitch = true;
			}
		}
		// ホーミングの場合常にプレイヤーに向かって角度が修正される
		if (this.enemyTypePreset.aimPlayer == aim_homing) {
			this.enemyTypePreset.angle = -(Math.atan2((this.originP.y - _targetCircle.p.y), (this.originP.x - _targetCircle.p.x)) / Math.PI) * 180;
		}

		if (this.stunWait++ >= stunTime) {
			if (this.appearTime < elapsedTime && this.appearWave == wave) {
				++this.operateTime;
				this.circle.p.x = this.originP.x;
				this.circle.p.y = this.originP.y;
				let x = (this.operateTime) * this.enemyTypePreset.moveSpeed;
				let y = this.enemyTypePreset.magniOrAmpli * Math.sin((this.operateTime) * this.enemyTypePreset.waveFrequency * Math.PI / 180)
				if (this.enemyTypePreset.moveType == enemyMove_str) {
					this.circle.p.x -= (this.operateTime) * this.enemyTypePreset.moveSpeed * Math.cos(-this.enemyTypePreset.angle * Math.PI / 180);
					this.circle.p.y -= (this.operateTime) * this.enemyTypePreset.moveSpeed * Math.sin(-this.enemyTypePreset.angle * Math.PI / 180);
				}
				if (this.enemyTypePreset.moveType == enemyMove_strQuadra) {
					this.circle.p.x -= this.enemyTypePreset.magniOrAmpli * ((this.operateTime) ** 2) * (this.enemyTypePreset.moveSpeed * Math.cos(-this.enemyTypePreset.angle * Math.PI / 180));
					this.circle.p.y -= this.enemyTypePreset.magniOrAmpli * ((this.operateTime) ** 2) * (this.enemyTypePreset.moveSpeed * Math.sin(-this.enemyTypePreset.angle * Math.PI / 180));
				}
				if (this.enemyTypePreset.moveType == enemyMove_jump) {
					y = Math.abs(y);
					this.circle.p.x -= x * Math.cos(-this.enemyTypePreset.angle * Math.PI / 180) - y * Math.sin(-this.enemyTypePreset.angle * Math.PI / 180);
					this.circle.p.y -= x * Math.sin(-this.enemyTypePreset.angle * Math.PI / 180) + y * Math.cos(-this.enemyTypePreset.angle * Math.PI / 180);
				}
				if (this.enemyTypePreset.moveType == enemyMove_sinWave) {
					this.circle.p.x -= x * Math.cos(-this.enemyTypePreset.angle * Math.PI / 180) - y * Math.sin(-this.enemyTypePreset.angle * Math.PI / 180);
					this.circle.p.y -= x * Math.sin(-this.enemyTypePreset.angle * Math.PI / 180) + y * Math.cos(-this.enemyTypePreset.angle * Math.PI / 180);
				}
			}
		}
	}

	hitArrow() {
		if (this.appearTime < elapsedTime) {
			--this.hp;
			if (this.hp <= 0) {
				soundStartRegardlessInput(SE_defeatEnemy);
				this.dead = true;
				--enemyNum;
			}
			if (this.enemyTypePreset.stunornot == true) {
				soundStartRegardlessInput(SE_arrowHit);
				this.stunWait = 0;
			}
		}
	}

	attack() {
		if (circleColCircle(this.circle.p, this.circle.r, archerCircle.p, archerCircle.r)) {
			--elfHp;
			uiDisp.elfshakeornot = true;
			this.hp = 0;
			this.dead = true;
			--enemyNum;
			soundStartRegardlessInput(SE_damageElf);
	} else if (this.circle.p.x + this.circle.r < 0) {
			--forestHp;
			uiDisp.forestshakeornot = true;
			this.hp = 0;
			this.dead = true;
			--enemyNum;
			soundStartRegardlessInput(SE_damageForest);

		}
	}

	appearOrNot() {
		return this.appearTime < elapsedTime;
	}

	aliveOrDeath() {
		return this.dead;
	}

	display(ctx) {
		if (this.appearTime < elapsedTime) {
			if (this.dead == false) {
				this.animation.setDispPoint(this.circle.p);
				this.animation.animationDisplay(ctx);
			}
		}
	}
}

// 座標と座標(円と円)が接しているか確認する関数　座標_pを中心とした円を半径_rで形成
function circleColCircle(_p1, _r1, _p2, _r2) {
	let x = _p1.x - _p2.x;
	let y = _p1.y - _p2.y;
	let r = Math.sqrt(x * x + y * y);

	return r <= _r1 + _r2;
}

// パラメーター表示オブジェクト　主人公の耐久値、矢の残り弾数などの表示
let uiDisp = {
	// 戦闘画面のHPは矢の数の表示
	elfShakeTime: 0,
	elfshakeornot: false,
	forestShakeTime: 0,
	forestshakeornot: false,
	shakeMaxTime: 30,
	shakeFrequency: 80,
	statusDisplay: function (ctx) {
		if (this.elfshakeornot == true) {
			++this.elfShakeTime;
			if (this.elfShakeTime >= this.shakeMaxTime) {
				this.elfShakeTime = 0;
				this.elfshakeornot = false;
			}
		}
		if (this.forestshakeornot == true) {
			++this.forestShakeTime;
			if (this.forestShakeTime >= this.shakeMaxTime) {
				this.forestShakeTime = 0;
				this.forestshakeornot = false;
			}
		}

		let img = document.getElementById("statusicon");

		// 矢の残弾表示
		ctx.drawImage(
			img,
			uiTileSize * 0,
			uiTileSize * 0,
			uiTileSize,
			uiTileSize,
			uiTileSize * 2,
			uiTileSize + 5 * Math.sin((this.forestShakeTime) * this.shakeFrequency * Math.PI / 180),
			uiTileSize * 2,
			uiTileSize * 2
		);
		for (let i = 0; i < arrowRemain; i++) {
			ctx.drawImage(
				img,
				uiTileSize * 1,
				uiTileSize * 0,
				uiTileSize,
				uiTileSize,
				(uiTileSize * 2) + ((i + 1) * uiTileSize * 2),
				uiTileSize + 5 * Math.sin((this.forestShakeTime) * this.shakeFrequency * Math.PI / 180),
				uiTileSize * 2,
				uiTileSize * 2
			);
		}

		// エルフの体力表示
		ctx.drawImage(
			img,
			uiTileSize * 0,
			uiTileSize * 1,
			uiTileSize,
			uiTileSize,
			uiTileSize + 128,
			canvasH - uiTileSize * 4 - 8 + 5 * Math.sin((this.forestShakeTime) * this.shakeFrequency * Math.PI / 180),
			uiTileSize * 2,
			uiTileSize * 2
		);
		for (let i = 0; i < elfHp; i++) {
			ctx.drawImage(
				img,
				uiTileSize * 1,
				uiTileSize * 1,
				uiTileSize,
				uiTileSize,
				uiTileSize + 128 + ((i + 1) * uiTileSize * 2),
				canvasH - uiTileSize * 4 - 8 + 5 * Math.sin((this.forestShakeTime) * this.shakeFrequency * Math.PI / 180),
				uiTileSize * 2,
				uiTileSize * 2
			);
		}
 

		// 森の耐久値表示
		ctx.drawImage(
			img,
			uiTileSize * 0,
			uiTileSize * 2,
			uiTileSize,
			uiTileSize,
			uiTileSize + 128,
			canvasH - uiTileSize * 2 - 8 + 5 * Math.sin((this.forestShakeTime) * this.shakeFrequency * Math.PI / 180),
			uiTileSize * 2,
			uiTileSize * 2
		);
		for (let i = 0; i < forestHp; i++) {
			ctx.drawImage(
				img,
				uiTileSize * 1,
				uiTileSize * 2,
				uiTileSize,
				uiTileSize,
				uiTileSize + 128 + ((i + 1) * uiTileSize * 2),
				canvasH - uiTileSize * 2 - 8 + 5 * Math.sin((this.forestShakeTime) * this.shakeFrequency * Math.PI / 180),
				uiTileSize * 2,
				uiTileSize * 2
			);
		}

		// エルフ顔表示
		img = document.getElementById("elffaceimg");
		ctx.drawImage(img, 5 * Math.sin((this.elfShakeTime) * this.shakeFrequency * Math.PI / 180), canvasH - 128 - 8, 128, 128);
	},
	elfForestShakeReset: function(){
		this.elfShakeTime = 0;
		this.forestShakeTime = 0;
		this.elfshakeornot = false;
		this.forestshakeornot = false;
	},

	// メッセージウィンドウ表示
	widowAlpha: 0.8,
	innerTimer: 0,
	cursorSwitchFreq: 6,	// メッセージ送り待ち中に表示されるカーソルのアニメーションの切り替わるフレーム数
	messageSpeed: messageSpeed_slow,
	message: "",
	textReceiver: "",
	whoSpeak: "",
	setSpeaker: function(_name){
		this.whoSpeak = _name;
	},
	fontSize: 22,
	lineHeight: 1.1,
	eventResumeDependOnMeesage: false,
	messageFinish: false,
	messageCharPicker: 0,
	messageOnClick: false,
	clickupChecker: false,
	messageDisplay: function (ctx, x, y, w, h, messageEndCursorSwitch, _eventResumeDependOnMeesage, _message) {
		this.message = _message;
		this.eventResumeDependOnMeesage = _eventResumeDependOnMeesage;
		let img = document.getElementById("statusicon");

		// メッセージウィンドウ
		ctx.globalAlpha = this.widowAlpha;
		ctx.drawImage(
			img,
			uiTileSize * 2,
			uiTileSize * 2,
			uiTileSize,
			uiTileSize,
			x + 2,
			y + 2,
			w - 4,
			h - 4
		);
		ctx.globalAlpha = 1.0;
		ctx.drawImage(
			img,
			uiTileSize * 2,
			uiTileSize * 0,
			uiTileSize / 2,
			uiTileSize / 2,
			x,
			y,
			uiTileSize,
			uiTileSize
		);
		ctx.drawImage(
			img,
			uiTileSize * 2.5,
			uiTileSize * 0,
			uiTileSize / 2,
			uiTileSize / 2,
			x + w - uiTileSize,
			y,
			uiTileSize,
			uiTileSize
		);
		ctx.drawImage(
			img,
			uiTileSize * 2,
			uiTileSize * 0.5,
			uiTileSize / 2,
			uiTileSize / 2,
			x,
			y + h - uiTileSize,
			uiTileSize,
			uiTileSize
		);
		ctx.drawImage(
			img,
			uiTileSize * 2.5,
			uiTileSize * 0.5,
			uiTileSize / 2,
			uiTileSize / 2,
			x + w - uiTileSize,
			y + h - uiTileSize,
			uiTileSize,
			uiTileSize
		);

		ctx.drawImage(
			img,
			uiTileSize * 3,
			uiTileSize * 0,
			uiTileSize / 2,
			uiTileSize / 2,
			x,
			y + uiTileSize,
			uiTileSize,
			h - 2 * uiTileSize,
		);
		ctx.drawImage(
			img,
			uiTileSize * 3.5,
			uiTileSize * 0,
			uiTileSize / 2,
			uiTileSize / 2,
			x + w - uiTileSize,
			y + uiTileSize,
			uiTileSize,
			h - 2 * uiTileSize,
		);
		ctx.drawImage(
			img,
			uiTileSize * 3.5,
			uiTileSize * 0.5,
			uiTileSize / 2,
			uiTileSize / 2,
			x + uiTileSize,
			y,
			w - 2 * uiTileSize,
			uiTileSize,
		);
		ctx.drawImage(
			img,
			uiTileSize * 3,
			uiTileSize * 0.5,
			uiTileSize / 2,
			uiTileSize / 2,
			x + uiTileSize,
			y + h - uiTileSize,
			w - 2 * uiTileSize,
			uiTileSize,
		);

		// 発話者が有効の場合発話者を表示
		if(this.whoSpeak !=""){
			let spk_x = x ;
			let spk_y = y - this.fontSize * 2 + uiTileSize;
			ctx.drawImage(
				img,
				uiTileSize * 2,
				uiTileSize * 2,
				uiTileSize,
				uiTileSize,
				spk_x + 2,
				spk_y + 2,
				(this.whoSpeak.length + 1) * this.fontSize - 4,
				this.fontSize * 2 - 4
			);
			ctx.globalAlpha = 1.0;
			ctx.drawImage(
				img,
				uiTileSize * 2,
				uiTileSize * 0,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x,
				spk_y,
				uiTileSize,
				uiTileSize
			);
			ctx.drawImage(
				img,
				uiTileSize * 2.5,
				uiTileSize * 0,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x + (this.whoSpeak.length + 1) * this.fontSize - uiTileSize,
				spk_y,
				uiTileSize,
				uiTileSize
			);
			ctx.drawImage(
				img,
				uiTileSize * 2,
				uiTileSize * 0.5,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x,
				spk_y + this.fontSize * 2 - uiTileSize,
				uiTileSize,
				uiTileSize
			);
			ctx.drawImage(
				img,
				uiTileSize * 2.5,
				uiTileSize * 0.5,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x + (this.whoSpeak.length + 1) * this.fontSize - uiTileSize,
				spk_y + this.fontSize * 2 - uiTileSize,
				uiTileSize,
				uiTileSize
			);
	
			ctx.drawImage(
				img,
				uiTileSize * 3,
				uiTileSize * 0,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x,
				spk_y + uiTileSize,
				uiTileSize,
				this.fontSize * 2 - 2 * uiTileSize,
			);
			ctx.drawImage(
				img,
				uiTileSize * 3.5,
				uiTileSize * 0,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x + (this.whoSpeak.length + 1) * this.fontSize - uiTileSize,
				spk_y + uiTileSize,
				uiTileSize,
				this.fontSize * 2 - 2 * uiTileSize,
			);
			ctx.drawImage(
				img,
				uiTileSize * 3.5,
				uiTileSize * 0.5,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x + uiTileSize,
				spk_y,
				(this.whoSpeak.length + 1) * this.fontSize - 2 * uiTileSize,
				uiTileSize,
			);
			ctx.drawImage(
				img,
				uiTileSize * 3,
				uiTileSize * 0.5,
				uiTileSize / 2,
				uiTileSize / 2,
				spk_x + uiTileSize,
				spk_y + this.fontSize * 2  - uiTileSize,
				(this.whoSpeak.length + 1) * this.fontSize - 2 * uiTileSize,
				uiTileSize,
			);
			ctx.font="bold " + this.fontSize +"px serif";
			ctx.textBaseline="top";
			ctx.fillStyle = "white";
			ctx.fillText(
				this.whoSpeak,
				spk_x + uiTileSize / 1.5,
				spk_y + this.fontSize * 0.4,
			);
			ctx.fillStyle = "black";						

		}
		// メッセージ送り待ちカーソル
		if(this.messageFinish){
			ctx.drawImage(
				img,
				uiTileSize * 2 + (uiTileSize / 2 * Math.floor((this.innerTimer % (this.cursorSwitchFreq * 4)) / this.cursorSwitchFreq)),
				messageEndCursorSwitch ? uiTileSize * 1.5 : uiTileSize * 1,
				uiTileSize / 2,
				uiTileSize / 2,
				messageEndCursorSwitch ? x + w * 0.8 : x + ( w / 2 ) - ( uiTileSize / 2 ),
				y + h - uiTileSize,
				uiTileSize,
				uiTileSize,
			);
		}

		// テキストを画面に表示する処理
		for(let lines = this.textReceiver.split("\n"), i = 0 , l = lines.length; i < l ; i++){
			let line = lines[i];
			let addY = this.fontSize;
			if ( i ) addY += this.fontSize * this.lineHeight * i ;
			ctx.font="bold " + this.fontSize +"px serif";
			ctx.textBaseline="top";
			ctx.fillStyle = "white";
			ctx.fillText(
				line,
				x + uiTileSize,
				y + addY,
			);
			ctx.fillStyle = "black";						
		}
	},
	
	// テキストの制御
	messageController: function(){
		if(this.message != ""){
			if(this.clickupChecker){
				this.messageOnClick =false;
				this.clickupChecker =false;
			}		
			// ウィンドウ内に表示するテキスト
			// サウンドに関して　メッセージ送り音は文字が一文字表示されるごとに鳴らす必要があるのでインスタンスから鳴らすが
			// 　　　　　　　　　決定音(pushEnter)はクリック側に制御があるので鳴らす許可のブール値を変えるだけでいい
			if(!this.messageFinish){
				if(!this.messageOnClick){
					if(clicknow){
						this.textReceiver = "";
						this.textReceiver = (this.message.slice(0));
						soundStartRegardlessInput(SE_message)
						sound_set[pickSE(SE_pushEnter)][sound_soundOn] = true;
						this.messageOnClick = true;
						this.messageFinish = true;
					}
				}
				if(!this.messageFinish){
					sound_set[pickSE(SE_pushEnter)][sound_soundOn] = false;
					if(this.innerTimer % this.messageSpeed == 0 ){
						if(this.messageCharPicker != this.message.length){
							if(this.message.charAt(this.messageCharPicker) != "　"){
								soundStartRegardlessInput(SE_message)
							}
							/*if(message.charAt(this.messageCharPicker) == "\t"){
								console.log("test1 t");
							}
							if(message.charAt(this.messageCharPicker) == "\v"){
								console.log("test2 v");
							}
							if(message.charAt(this.messageCharPicker) == "\r"){
								console.log("test3 r");
							}
							if(message.charAt(this.messageCharPicker) == "\f"){
								console.log("test4 f");
							}*/
							this.textReceiver = (this.message.slice(0,this.messageCharPicker));
							this.messageCharPicker++;
						}else{
							sound_set[pickSE(SE_pushEnter)][sound_soundOn] = true;
							this.messageFinish = true;
						}
					}
				}
			}else{
				if(this.messageOnClick == false){
					if(clicknow){
						this.messageCharPicker = 0;
						eventResumeOk = true;
						this.message = "";
						this.textReceiver = "";
						this.innerTimer = 0;
						this.messageFinish = false;
						this.messageOnClick = true;
					}
				}
			}
			this.innerTimer++;
		}else{
			sound_set[pickSE(SE_pushEnter)][sound_soundOn] = false;

		}
	},
	clickupCheck: function(){
		this.clickupChecker = true;
	},
	messageClear: function(){
		this.message = "";
	},
	
	// バトル開始の合図(ready...)を画面に表示
	readyTimer: 0,
	startTimer: 0,
	readyDisp: function(ctx){
		if(this.readyTimer == 0){
			soundStartRegardlessInput(SE_ready);
		}
		this.startTimer = 0;
		this.readyTimer++;
		let img = document.getElementById("statusicon");
		let coefficient = 3.0 - this.readyTimer / (fps * 0.3);
		if(coefficient < 1.0){
			coefficient = 1.0
		}
		ctx.globalAlpha = this.readyTimer / (fps * 0.3);
		ctx.drawImage(
			img,
			uiTileSize * 0,
			uiTileSize * 4,
			uiTileSize * 4,
			uiTileSize,
			canvasW / 2 - (uiTileSize * 4 * coefficient),
			canvasH / 2 - (uiTileSize * coefficient),
			(uiTileSize * 8) * coefficient,
			(uiTileSize * 2) * coefficient
		);
		ctx.globalAlpha = 1.0;
	},
	startDisp: function(ctx){
		if(this.startTimer == 0){
			soundStartRegardlessInput(SE_battleStart);
		}
		this.readyTimer = 0;
		this.startTimer++;
		let img = document.getElementById("statusicon");
		let coefficient = 1.0 + this.startTimer / (fps * 0.05);
		ctx.globalAlpha = 1.0 - this.startTimer / (fps * 0.25);
		if(this.startTimer / (fps * 0.25) > 1.0){
			ctx.globalAlpha =0;
		}
		ctx.drawImage(
			img,
			uiTileSize * 0,
			uiTileSize * 5,
			uiTileSize * 4,
			uiTileSize,
			canvasW / 2 - (uiTileSize * 4 * coefficient),
			canvasH / 2 - (uiTileSize * coefficient),
			(uiTileSize * 8) * coefficient,
			(uiTileSize * 2) * coefficient
		);
		ctx.globalAlpha = 1.0;

	},

	// バトル終了の合図(Finish!)を画面に表示
	finishTimer: 0,
	winLoseSE: false,
	finishDisp: function(ctx, _winOrLose){
		this.finishTimer++;
		let coefficient1;
		let coefficient2;
		let changeTime1 = fps * 1.3;
		let changeTime2 = changeTime1 + fps * 3.2;
		let img = document.getElementById("statusicon");
		if(this.finishTimer < changeTime1){
			coefficient1 = 3.0 - this.finishTimer / (fps * 0.05);
			if(coefficient1 < 1.0){
				coefficient1 = 1.0
			}
			ctx.globalAlpha = this.finishTimer / (fps * 0.25);
		}
		if(this.finishTimer >= changeTime1){
			coefficient1 = 1.0 + (this.finishTimer - changeTime1) / (fps * 0.05);
			ctx.globalAlpha = 1.0 - (this.finishTimer - changeTime1) / (fps * 0.25);
			if((this.finishTimer - changeTime1) / (fps * 0.25) > 1.0){
				ctx.globalAlpha =0;
				this.winLoseStart = true;
			}		
		}
			ctx.drawImage(
			img,
			uiTileSize * 0,
			uiTileSize * 6,
			uiTileSize * 4,
			uiTileSize,
			canvasW / 2 - (uiTileSize * 4 * coefficient1),
			canvasH / 2 - (uiTileSize * coefficient1),
			(uiTileSize * 8) * coefficient1,
			(uiTileSize * 2) * coefficient1
		);
		ctx.globalAlpha = 1.0;

		if(this.finishTimer >= changeTime1){
			if(!this.winLoseSE){
				if(_winOrLose == battle_win){
					soundStartRegardlessInput(SE_win);
				}else{
					soundStartRegardlessInput(SE_lose);
				}
				this.winLoseSE = true;
			}
			if(this.finishTimer < changeTime2){
				coefficient2 = 3.0 - this.finishTimer / (fps * 0.05);
				if(coefficient2 < 1.0){
					coefficient2 = 1.0
				}
				ctx.globalAlpha = (this.finishTimer - changeTime1) / (fps * 0.25);
			}
			if(this.finishTimer >= changeTime2){
				coefficient2 = 1.0 + (this.finishTimer - changeTime2) / (fps * 0.05);
				ctx.globalAlpha = 1.0 - (this.finishTimer - changeTime2) / (fps * 0.25);
				if((this.finishTimer - changeTime2) / (fps * 0.25) > 1.0){
					ctx.globalAlpha =0;
					this.winLoseStart = true;
				}		
			}
			let selectV1 = 0;
			let selectV2 = 0;
			selectV1 = _winOrLose == battle_win ? 7 : 8;
			ctx.drawImage(
				img,
				uiTileSize * 0,
				uiTileSize * selectV1,
				uiTileSize * 4,
				uiTileSize,
				canvasW / 2 - (uiTileSize * 2 * 4 * coefficient2),
				canvasH / 2 - (uiTileSize * 2 * coefficient2),
				(uiTileSize * 2 * 8) * coefficient2,
				(uiTileSize * 2 * 2) * coefficient2
			);
			if(_winOrLose != battle_win){
				selectV2 = _winOrLose == battle_elfLost ? 9 : 9.5;
				ctx.drawImage(
					img,
					uiTileSize * 0,
					uiTileSize * selectV2,
					uiTileSize * 4,
					uiTileSize / 2,
					canvasW / 2 - (uiTileSize * 2 * 4 * coefficient2),
					canvasH / 2 + (uiTileSize * 2 * coefficient2),
					(uiTileSize * 2 * 8) * coefficient2,
					(uiTileSize * 2) * coefficient2
				);
			}
	
		}
		ctx.globalAlpha = 1.0;

	},
	finishTimerReset: function(){
		this.finishTimer = 0;
		this.winLoseSE = false;
	},

	/*
	drawTrajectorySpeed: new Vec(0, 0),
	drawTrajectoryStartP: new Point(invalidArea, invalidArea),
	drawTrajectoryLine: new Line(this.drawTrajectoryStartP, this.drawTrajectoryStartP),
	drawTrajectoryAngle: 0,
	*/

	drawTrajectory: function(p, op, pow, ctx) {
		let drawTrajectoryStartP = new Point(op.x, op.y);
		let drawTrajectoryAngle = Math.atan2((p.y - op.y), (p.x - op.x));
		let drawTrajectoryCoefficient = Math.round(pow / 100);
		if(drawTrajectoryCoefficient == 0){
			drawTrajectoryCoefficient = 1;
		}
		let speedX = (pow * Math.cos(drawTrajectoryAngle));
		let speedY = (pow * Math.sin(drawTrajectoryAngle));
		let drawTrajectoryLine = new Line(drawTrajectoryStartP, drawTrajectoryStartP);
		ctx.lineWidth = 8;
		ctx.globalAlpha = 0.1;
		ctx.beginPath();
		ctx.moveTo(op.x, op.y);
		ctx.lineTo(op.x, op.y);
		for(let i = 0 ; i < 100 ; i++){
			ctx.stroke();
			ctx.globalAlpha += 0.01;
			let speed = new Vec(speedX , speedY);
			ctx.lineWidth = 4;
			for(let j = 1 ; j < drawTrajectoryCoefficient ; j++){
				ctx.globalAlpha += 0.01;
				ctx.beginPath();
				ctx.moveTo(
					drawTrajectoryLine.start_p.x + speedX * ((j) / drawTrajectoryCoefficient),
					drawTrajectoryLine.start_p.y + speedY * ((j) / drawTrajectoryCoefficient)
				);
				ctx.lineTo(
					drawTrajectoryLine.start_p.x + speedX * ((j) / drawTrajectoryCoefficient),
					drawTrajectoryLine.start_p.y + speedY * ((j) / drawTrajectoryCoefficient)
				);
				ctx.stroke();
			}
			drawTrajectoryLine.startToEnd();
			drawTrajectoryLine.moveEnd(speed);
			speedY = speedY + gravity;
			ctx.lineWidth = 8;
			ctx.beginPath();
			ctx.moveTo(drawTrajectoryLine.end_p.x, drawTrajectoryLine.end_p.y);
			ctx.lineTo(drawTrajectoryLine.end_p.x, drawTrajectoryLine.end_p.y);
		}
		ctx.globalAlpha = 1.0;
	},

}

// CSVデータからマップを生成する関数
function drawMap(csv, ctx, imgTag){
	let img = document.getElementById(imgTag);
	for(let i = 0 ; i < csv.length ; i++){
		for(let j = 0 ; j < csv[i].length ; j++){
			ctx.drawImage(
				img,
				mapChipSize * (csv[i][j] % mapChipDiv),
				mapChipSize * (Math.floor(csv[i][j] / mapChipDiv )),
				mapChipSize,
				mapChipSize,
				j * mapChipSize * 2,
				i * mapChipSize * 2,
				mapChipSize * 2,
				mapChipSize * 2
			);

		}
	}
}

// ユーザーアクションを機に起動するサウンドクラス
class soundMake{
	constructor(_idTag, _isLoop, _volume, _mute, _loopTiming, _loopBackTime){
		this.sound = document.getElementById(_idTag);
		this.idTag = _idTag;
		this.sound.loop = _isLoop;
		this.sound.volume = _volume;
		this.sound.muted = _mute;
		this.loopTiming = _loopTiming;
		this.loopBackTime = _loopBackTime;
	}
	playFromStart(){
		this.sound.currentTime = 0;
		this.sound.play();
	}
	playResume(){
		this.sound.play();
	}
	stop(){
		this.sound.onpause();
	}
	stopToStart(){
		this.sound.onpause();
		this.sound.currentTime = 0;
	}
	loopBack(){
		if(this.sound.currentTime > this.loopTiming){
			this.sound.currentTime -= this.loopBackTime;
		}
	}
	currentChange(_time){
		this.sound.currentTime = _time;
	}
	muteChange(_bool){
		this.sound.muted = _bool;
	}
}

function soundStartRegardlessInput(_idTag){
	let SE = pickSE(_idTag);
	if(sound_array[SE]){
		sound_array[SE].currentChange(0);
		sound_array[SE].muteChange(false);
		sound_set[SE][sound_soundOn] = true;
		sound_set[SE][sound_playTime] = sound_array[SE].sound.currentTime;
		if(sound_array[SE].idTag.slice(0, 1) == "B"){
			nowPlayingBGM = sound_array[SE].idTag;
		}
	}

}
function soundControlRegardlessInput(){
	for(let i = 0 ; i < sound_array.length ; i++){
		if(sound_array[i].sound.loop){
			if(sound_set[i][sound_soundOn]){
				if(sound_array[i]){
					if(sound_array[i].idTag.slice(0, 1) == "S"){
						if( sound_array[i].sound.currentTime < sound_set[i][sound_playTime]){
							sound_array[i].muteChange(true);
							sound_set[i][sound_soundOn] = false;
						}
						sound_set[i][sound_playTime] = sound_array[i].sound.currentTime;
					}else if(sound_array[i].idTag.slice(0, 1) == "B"){
						sound_array[i].loopBack();
					}
				}
			}	
		}
	}
}
function stopNowplayingBGM(){
	if(nowPlayingBGM != ""){
		sound_array[pickSE(nowPlayingBGM)].muteChange(true);
		sound_set[pickSE(nowPlayingBGM)][sound_soundOn] = false;
		nowPlayingBGM = "";
		}
}

function enemySet(_stageNum){
	enemyArray.splice(0);
	if(_stageNum == 0){
		for(let i = 0 ; i < 10 ; i++){
			enemyArray.push(new enemyCircle( canvasW + 50 , 472 - 30 - (i * 30) % 120, i * 140, 0, goblinJump));
			enemyArray.push(new enemyCircle( canvasW + 50 , 472 - 60 - (i * 30) % 120, i * 140 + 40, 0, goblin));
		}
	}
	if(_stageNum == 1){
		for(let i = 0 ; i < 10 ; i++){
			enemyArray.push(new enemyCircle( canvasW + 50 , (i * 60) % canvasH, i * 60 + 40, 0, harpyAim));
		}
	}
}

// 初期化処理。addEventListener等マウス操作入力の開始など
function Initialization(){
	sound_set[pickSE(SE_gameStart)][sound_soundOn] = true;
	document.oncontextmenu = () => {
		return false;
	};
	if(device == device_PC){
		// パソコン用設定
		document.getElementById("field").addEventListener(
			"mousemove",
			function (event) {
				if(InputOk){
					mouseP.setPoint(event.offsetX, event.offsetY);
				}
			}
		);
		document.getElementById("field").addEventListener(
			"mousedown",
			function (event) {
				if(InputOk){
					if(event.button == 0 ){
						console.log("click!")
						clicknow = true;
						if(sound_array[pickSE(SE_pushEnter)]){
							if(sound_set[pickSE(SE_pushEnter)][sound_soundOn]){
								sound_array[pickSE(SE_pushEnter)].playFromStart();
								sound_set[pickSE(SE_pushEnter)][sound_soundOn] = false;
							}
						}
	
					}
				}else{
					clicknow = false;
				}
			}
		);
		document.getElementById("field").addEventListener(
			"mouseup",
			function (event) {
				if(event.button == 0 ){
					clicknow = false;
					if(InputOk){
						clickup = true;
					}
				}
			}
		);
		document.getElementById("field").addEventListener(
			"mouseenter",
			function () {
				if(InputOk){
					document.body.style.cursor = "crosshair";
					reticleOn = true;
				}
			}
		);
		document.getElementById("field").addEventListener(
			"mouseleave",
			function () {
				if(InputOk){
					document.body.style.cursor = "default";
					reticleOn = false;
				}
			}
		);
	}else if(device == device_smartPhone){
		// スマホ用設定
		document.getElementById("field").addEventListener(
			"touchstart",
			function (event) {
				if(InputOk){
					let touchObject = event.changedTouches[0] ;
					let clientRect = document.getElementById("field").getBoundingClientRect();
					mouseP.setPoint(touchObject.clientX - clientRect.left, touchObject.clientY - clientRect.top);

					reticleOn = true;
					console.log("touch!")
					clicknow = true;
					if(sound_array[pickSE(SE_pushEnter)]){
						if(sound_set[pickSE(SE_pushEnter)][sound_soundOn]){
							sound_array[pickSE(SE_pushEnter)].playFromStart();
							sound_set[pickSE(SE_pushEnter)][sound_soundOn] = false;
						}
					}

				}
			}
		);
		document.getElementById("field").addEventListener(
			"touchmove",
			function (event) {
				if(InputOk){
					event.preventDefault();
					let touchObject = event.changedTouches[0] ;
					let clientRect = document.getElementById("field").getBoundingClientRect();
					mouseP.setPoint(touchObject.clientX - clientRect.left, touchObject.clientY - clientRect.top);
				}
			}
		);
		document.getElementById("field").addEventListener(
			"touchend",
			function () {
				clicknow = false;
				if(InputOk){
					clickup = true;

					reticleOn = false;

				}
			}
		);

	}

	document.body.addEventListener(
		"click",
		function(){
			if(InputOk){
				if(audioswitch == false){
					for(let i = 0 ; i < sound_set.length ; i ++){
						sound_array.push(new soundMake(
							sound_set[i][sound_idTag],
							sound_set[i][sound_isLoop],
							sound_set[i][sound_volume],
							sound_set[i][sound_mute],
							sound_set[i][sound_loopTiming],
							sound_set[i][sound_loopBackTime]
							)
						)
						if(sound_array[i].sound.loop){
							sound_array[i].playFromStart();
						}
						console.log(i + sound_array[i].idTag + " loaded");
					}
					if(browser == browser_Firefox){	// 無音対策
						SE_firefox = document.getElementById("SE_firefox");
						SE_firefox.loop = true;
						SE_firefox.volume = 0.0000001;
						SE_firefox.play();
					}
					console.log("sound loaded");
					audioswitch = true;
				}
				if(sound_set[pickSE(SE_gameStart)][sound_soundOn]){
					if(sound_array[pickSE(SE_gameStart)]){
						sound_array[pickSE(SE_gameStart)].playFromStart();
						sound_set[pickSE(SE_gameStart)][sound_soundOn] = false;
					}
				}
			}
		}
	)

}

function clickOnBehavior(){
	aimNow = false;
	if (clicknow) {
		if(gameState == gState_title){
			if(gameClicked > 0){
				if(sound_array[pickSE(SE_gameStart)]){
					sound_array[pickSE(SE_gameStart)].sound.volume = SEVolume1;
					gameClicked++;
				}
			}
		}else if(gameState == gState_intermission){
			if(eventResumeOk){
				eventTimeLine++;
				eventResumeOk = false;
			}

		}else if(gameState == gState_battle){
			if(battleStart){
				if(battleWinOrLost == 0){
					aimNow = true;
					++chargevalue;
					charge = chargevalue * chargevalue * 0.1 + chargeDefaultValue;
					if (charge >= chargeMaxValue) {
						charge = chargeMaxValue;
					}
					//照準の不透明度、大きさの変化<
					alpha = charge / 400;
					aimCircle = charge / 10;
					//照準の不透明度、大きさの変化>
				}
			}
		}else if(gameState == gState_afterBattle){

		}
	}
}

function clickUpBehavior(){
	if (clickup) {
		if(gameState == gState_title){
			if(gameClicked <= 0){
				gameClicked++;
				sound_set[pickSE(SE_gameStart)][sound_soundOn] = true;
			}
		}else if(gameState == gState_intermission){

		}else if(gameState == gState_battle){
			if(battleStart){
				if (circleColCircle(mouseP, 1, archerCircle.p, archerCircle.r)) {
					soundStartRegardlessInput(SE_reload);
					arrowRemain = arrowUsage;
				}else {
					soundStartRegardlessInput(SE_arrowShoot);
					if (arrowRemain > 0) {
						soundStartRegardlessInput(SE_arrowFly);
						arrowArray[useArrowIndex++].shoot(mouseP, archerCircle.p, charge);
						useArrowIndex %= arrowObject;
						--arrowRemain;
					}
				}
			}
			charge = chargeDefaultValue;
			chargevalue = 0;
			alpha = 0.3;
			aimCircle = 30;
		}else if(gameState == gState_afterBattle){

		}
		uiDisp.clickupCheck();
		clickup = false;
	}
}

