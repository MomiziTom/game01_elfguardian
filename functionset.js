const browser_IE = 1;
const browser_Edge = 2;
const browser_Chrome = 3;
const browser_Safari = 4;
const browser_Firefox = 5;
const browser_Opera = 6;

let browser;
let userAgent = window.navigator.userAgent;
let SE_firefox;
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


let canvasW = 800;
let canvasH = 600;

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
			this.point.x = Object.assign(_x);
		}
		if (_y != null) {
			this.point.y = Object.assign(_y);
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

	setAlpha(_alpha) {
		this.alpha = _alpha;
	}
	setDispPoint(_p) {
		this.point = _p;
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
			this.nowV * this.tileSizeV,
			this.tileSizeU,
			this.tileSizeV,
			this.point.x - (this.tileSizeU / 2) * this.zoom,
			this.point.y - (this.tileSizeV / 2) * this.zoom,
			this.tileSizeU * this.zoom,
			this.tileSizeV * this.zoom,
		);
		ctx.globalAlpha = 1.0;
		if (this.animateornot == true) {
			if (this.revDirectionU == false) {
				++this.untilUpdate;
				this.nowU += Math.floor(this.untilUpdate / this.frequency);
				this.nowU %= this.divisionU;
				this.untilUpdate %= this.frequency;
			} else {
				++this.untilUpdate;
				this.nowU -= Math.floor(this.untilUpdate / this.frequency);
				if (this.nowU < 0) {
					this.nowU = this.divisionU - 1;
				}
				this.untilUpdate %= this.frequency;
			}
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
				if(SE_array[pickSE(SE_defeatEnemy)]){
					SE_array[pickSE(SE_defeatEnemy)].currentChange(0);
					SE_array[pickSE(SE_defeatEnemy)].muteChange(false);
					SE_set[pickSE(SE_defeatEnemy)][sound_soundOn] = true;
					SE_set[pickSE(SE_defeatEnemy)][sound_playTime] = SE_array[pickSE(SE_defeatEnemy)].sound.currentTime;
				}
				this.dead = true;
				--enemyNum;
			}
			if (this.enemyTypePreset.stunornot == true) {
				if(SE_array[pickSE(SE_arrowHit)]){
					SE_array[pickSE(SE_arrowHit)].currentChange(0);
					SE_array[pickSE(SE_arrowHit)].muteChange(false);
					SE_set[pickSE(SE_arrowHit)][sound_soundOn] = true;
					SE_set[pickSE(SE_arrowHit)][sound_playTime] = SE_array[pickSE(SE_arrowHit)].sound.currentTime;
				}
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
			if(SE_array[pickSE(SE_damageElf)]){
				SE_array[pickSE(SE_damageElf)].currentChange(0);
				SE_array[pickSE(SE_damageElf)].muteChange(false);
				SE_set[pickSE(SE_damageElf)][sound_soundOn] = true;
				SE_set[pickSE(SE_damageElf)][sound_playTime] = SE_array[pickSE(SE_damageElf)].sound.currentTime;
			}
	} else if (this.circle.p.x + this.circle.r < 0) {
			--forestHp;
			uiDisp.forestshakeornot = true;
			this.hp = 0;
			this.dead = true;
			--enemyNum;
			if(SE_array[pickSE(SE_damageForest)]){
				SE_array[pickSE(SE_damageForest)].currentChange(0);
				SE_array[pickSE(SE_damageForest)].muteChange(false);
				SE_set[pickSE(SE_damageForest)][sound_soundOn] = true;
				SE_set[pickSE(SE_damageForest)][sound_playTime] = SE_array[pickSE(SE_damageForest)].sound.currentTime;
			}
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
	cursorSwitchFreq: 6,
	messageSpeed: messageSpeed_slow,
	messageAllEnd: false,
	textReceiver: "",
	fontSize: 22,
	lineHeight: 1.1,
	messageFinish: false,
	messageRowPick: 0,
	messageLinePick: 0,
	messageClicked: false,
	messageDisplay: function (ctx, x, y, w, h, message) {
		let img = document.getElementById("statusicon");

		// メッセージウィンドウ
		ctx.globalAlpha = this.widowAlpha;
		ctx.drawImage(
			img,
			uiTileSize * 3,
			uiTileSize * 0,
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
			uiTileSize * 1,
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
			uiTileSize * 1,
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
			uiTileSize * 1.5,
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
			uiTileSize * 1.5,
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
			uiTileSize * 1,
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
			uiTileSize * 1,
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
			uiTileSize * 1.5,
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
			uiTileSize * 1.5,
			uiTileSize / 2,
			uiTileSize / 2,
			x + uiTileSize,
			y + h - uiTileSize,
			w - 2 * uiTileSize,
			uiTileSize,
		);

		// メッセージ送り待ちカーソル
		if(this.messageFinish){
			ctx.drawImage(
				img,
				uiTileSize * 2 + (uiTileSize / 2 * Math.floor((this.innerTimer % (this.cursorSwitchFreq * 4)) / this.cursorSwitchFreq)),
				this.messageAllEnd ? uiTileSize * 2.5 : uiTileSize * 2,
				uiTileSize / 2,
				uiTileSize / 2,
				this.messageAllEnd ? x + w * 0.8 : x + ( w / 2 ) - ( uiTileSize / 2 ),
				y + h - uiTileSize,
				uiTileSize,
				uiTileSize,
			);
		}

		// ウィンドウ内に表示するテキスト
		// サウンドに関して　メッセージ送り音は文字が一文字表示されるごとに鳴らす必要があるのでインスタンスから鳴らすが
		// 　　　　　　　　　決定音(pushEnter)はクリック側に制御があるので鳴らす許可のブール値を変えるだけでいい
		if(this.messageLinePick < message.length){
			if(!this.messageFinish){
				if(this.messageClicked == false){
					if(clicknow){
						this.textReceiver = "";
						for(let i = 0 ; i < message[this.messageLinePick].length ;i++){
							this.textReceiver += (message[this.messageLinePick].charAt(i));
						}
						if(this.messageLinePick >= message.length - 1){
							this.messageAllEnd = true;
						}
						if(SE_array[pickSE(SE_message)]){
							SE_array[pickSE(SE_message)].muteChange(true);
						}
						SE_set[pickSE(SE_pushEnter)][sound_soundOn] = true;
						this.messageClicked = true;
						this.messageFinish = true;
					}
				}
				if(!this.messageFinish){
					SE_set[pickSE(SE_pushEnter)][sound_soundOn] = false;
					if(this.innerTimer % this.messageSpeed == 0 ){
						if(this.messageRowPick != message[this.messageLinePick].length){
							if(SE_array[pickSE(SE_message)]){
								SE_array[pickSE(SE_message)].muteChange(true);
							}					
							if(message[this.messageLinePick].charAt(this.messageRowPick) != "　"){
								if(SE_array[pickSE(SE_message)]){
									SE_array[pickSE(SE_message)].currentChange(0);
									SE_array[pickSE(SE_message)].muteChange(false);
								}
							}
							if(message[this.messageLinePick].charAt(this.messageRowPick) == "\r"){
								console.log("test1");
							}
							if(message[this.messageLinePick].charAt(this.messageRowPick) == "\f"){
								console.log("test2");
							}
							this.textReceiver += (message[this.messageLinePick].charAt(this.messageRowPick));
							this.messageRowPick++;
						}else{
							if(SE_array[pickSE(SE_message)]){
								SE_array[pickSE(SE_message)].muteChange(true);
							}
						if(this.messageLinePick >= message.length - 1){
								this.messageAllEnd = true;
							}
							SE_set[pickSE(SE_pushEnter)][sound_soundOn] = true;
							this.messageFinish = true;
						}
					}
				}
			}else{
				if(this.messageClicked == false){
					if(clicknow){
						this.messageLinePick++;
						this.messageRowPick = 0;
						this.messageFinish = false;
						this.textReceiver = "";
						if(this.messageLinePick >= message.length){
							this.messageAllEnd = false;
							this.messageLinePick = 0;
						}
						if(SE_array[pickSE(SE_message)]){
							SE_array[pickSE(SE_message)].muteChange(true);
						}
						this.messageClicked = true;
					}
				}
			}
		}
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
		this.innerTimer++;
	},
	messageClickedSwitch: function(_bool){
		this.messageClicked = _bool;
	}
	// メッセージを画面に表示
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

function soundRegardlessInput(){
	for(let i = 0 ; i < SE_array.length ; i++){
		if(SE_array[i].sound.loop){
			if(SE_set[i][sound_soundOn]){
				if( SE_array[i].sound.currentTime < SE_set[i][sound_playTime]){
					if(SE_array[i]){
						SE_array[i].muteChange(true);
						SE_set[i][sound_soundOn] = false;
					}
				}
				SE_set[i][sound_playTime] = SE_array[i].sound.currentTime;
			}	
		}
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
			enemyArray.push(new enemyCircle( canvasW + 50 , (i * 60) % canvasH, i * 60 + 40, 0, goblinAim));
		}
	}
}
