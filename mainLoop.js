const gState_title = 0;
const gState_intermission = 1;
const gState_battle = 2;

let gameState = gState_intermission;

let elapsedTime = 0;	// 経過時間変数
let waveTime = 0;		// ウェーブ中での経過時間変数
let wave = 0;			// 現在の敵の出現ウェーブ

let testangle=0;
let testU;
let testV;
let gameover = false;
let mouseP = new Point(0,0);
let archerCircle = new Circle(new Point(80,300), 30);
let arrowUsage = 15;		// 一度のリロードで補充される矢の数
let arrowRemain = arrowUsage;	// 射れる矢の数
let arrowObject = 40;	// 画面上に表示できる矢の最大数。これ以上の数の矢を放つと一番最初に放たれた矢から順に再計算、再表示される
let useArrowIndex = 0;	// 次に発射されるarrowArrayのインデックス番号。0～arrowObjectの値をとる

let elfHp = 5;
let forestHp = 15;
let alpha = 0.3;
let aimCircle = 30;
let reticleOn = false;
let clicknow = false;
let clickup = false;
let charge = 0;
let chargevalue = 0;

let arrowArray = new Array();
let enemyArray = new Array();

let SEVolume1 = 0.05;	// 通常音量
let SEVolume2 = 0.1;	// 元音源が小さい時用
let SEVolume3 = 0.03;	// 小さめの音にしたい用
// ゲーム操作受付、計算処理部分
function update(){
	document.getElementById("field").addEventListener(
		"mousemove",
		function (event) {
			mouseP.setPoint(event.offsetX, event.offsetY);
		}
	);
	document.getElementById("field").addEventListener(
		"mousedown",
		function () {
			clicknow = true;
			if(SE_pushEnter){
				if(pushEnterSoundOn){
					SE_pushEnter.playFromStart();
					pushEnterSoundOn = false;
				}
			}
		}
	);
	document.getElementById("field").addEventListener(
		"mouseup",
		function () {
			clicknow = false;
			clickup = true;
			if (circleColCircle(mouseP, 1, archerCircle.p, archerCircle.r)) {
				if(reloadSoundOn){
					if(SE_reload){
						SE_reload.playFromStart();
						reloadSoundOn = false;
					}
				}
			}else {
				if(arrowShootSoundOn){
					if(SE_arrowShoot){
						SE_arrowShoot.playFromStart();
						if(arrowRemain > 0){
							SE_arrowFly.playFromStart();
						}
						arrowShootSoundOn = false;
					}
				}
			}
		}
	);
	document.getElementById("field").addEventListener(
		"mouseenter",
		function () {
			document.body.style.cursor = "none";
			reticleOn = true;
		}
	);
	document.getElementById("field").addEventListener(
		"mouseleave",
		function () {
			document.body.style.cursor = "default";
			reticleOn = false;
		}
	);
	document.body.addEventListener(
		"click",
		function(){
			if(audioswitch == false){
				SE_message = new soundMake("SE_message",true,SEVolume1,true,0,0);
				SE_message.playFromStart();
				SE_pushEnter = new soundMake("SE_pushEnter",false,SEVolume1,false,0,0);
				SE_arrowShoot = new soundMake("SE_arrowShoot",false,SEVolume1,false,0,0);
				SE_arrowFly = new soundMake("SE_arrowFly",false,SEVolume1,false,0,0);
				SE_reload = new soundMake("SE_reload",false,SEVolume2,false,0,0);
				SE_arrowHit = new soundMake("SE_arrowHit",true,SEVolume1,true,0,0);
				SE_arrowHit.playFromStart();
				SE_defeatEnemy = new soundMake("SE_defeatEnemy",true,SEVolume1,true,0,0);
				SE_defeatEnemy.playFromStart();
				SE_damageElf = new soundMake("SE_damageElf",true,SEVolume2,true,0,0);
				SE_damageElf.playFromStart();
				SE_damageForest = new soundMake("SE_damageForest",true,SEVolume2,true,0,0);
				SE_damageForest.playFromStart();
				audioswitch = true;
			}	
		}
	)
	
	//操作受付---------->
	
	//計算部----------<
	if (clickup == true) {
		if(gameState == gState_title){

		}else if(gameState == gState_intermission){

		}else if(gameState == gState_battle){
	
			if (circleColCircle(mouseP, 1, archerCircle.p, archerCircle.r)) {
				arrowRemain = arrowUsage;
			}else {
				if (arrowRemain > 0) {
					arrowArray[useArrowIndex++].shoot(mouseP, archerCircle.p, charge);
					useArrowIndex %= arrowObject;
					--arrowRemain;
				}
			}

			charge = 0;
			chargevalue = 0;
			alpha = 0.3;
			aimCircle = 30;
		}
		uiDisp.messageClickedSwitch(false);
		clickup = false;
	}

	if(gameState == gState_title){

	}else if(gameState == gState_intermission){
		arrowShootSoundOn = false;
		reloadSoundOn = false;
		if(SE_arrowShoot){
			SE_arrowShoot.muteChange(true);
			SE_arrowFly.muteChange(true);
		}
		if(SE_arrowHit){
			SE_arrowHit.muteChange(true);
		}
		if(SE_defeatEnemy){
			SE_defeatEnemy.muteChange(true);
		}
		if(SE_damageElf){
			SE_damageElf.muteChange(true);
		}
		if(SE_damageForest){
			SE_damageForest.muteChange(true);
		}

	}else if(gameState == gState_battle){
		arrowShootSoundOn = true;
		reloadSoundOn = true;
		if(SE_arrowShoot){
			SE_arrowShoot.muteChange(false);
			SE_arrowFly.muteChange(false);
		}
		if(arrowHitSoundOn){
			if( SE_arrowHit.sound.currentTime < arrowHitPlayTime){
				if(SE_arrowHit){
					SE_arrowHit.muteChange(true);
					arrowHitSoundOn = false;
				}
			}
			arrowHitPlayTime = SE_arrowHit.sound.currentTime;
		}
		if(defeatEnemySoundOn){
			if( SE_defeatEnemy.sound.currentTime < defeatEnemyPlayTime){
				if(SE_defeatEnemy){
					SE_defeatEnemy.muteChange(true);
					defeatEnemySoundOn = false;
				}
			}
			defeatEnemyPlayTime = SE_defeatEnemy.sound.currentTime;
		}
		if(damageElfSoundOn){
			if( SE_damageElf.sound.currentTime < damageElfPlayTime){
				if(SE_damageElf){
					SE_damageElf.muteChange(true);
					damageElfSoundOn = false;
				}
			}
			damageElfPlayTime = SE_damageElf.sound.currentTime;
		}
		if(damageForestSoundOn){
			if( SE_damageForest.sound.currentTime < damageForestPlayTime){
				if(SE_damageForest){
					SE_damageForest.muteChange(true);
					damageForestSoundOn = false;
				}
			}
			damageForestPlayTime = SE_damageForest.sound.currentTime;
		}

		if(gameover == true){
			uiDisp.elfForestShakeReset();
			elfHp = 5;
			forestHp = 15;
			elapsedTime = 0;
			arrowRemain = arrowUsage;	// 射れる矢の数
			waveTime = 0;
			useArrowIndex = 0;
			arrowArray.splice(0);
			enemyNum = 0;
			for(let i = 0 ; i < arrowObject ; i++){
				arrowArray.push(new arrow());
			}
			enemyArray.splice(0);
			for(let i = 0 ; i < 18 ; i++){
				enemyArray.push(new enemyCircle( canvasW + 50 , 472 - 30 - (i * 30) % 120, i * 140, 0, goblinJump));
				enemyArray.push(new enemyCircle( canvasW + 50 , 472 - 60 - (i * 30) % 120, i * 140 + 40, 0, goblin));
			}
			gameover = false;
		}
		if (clicknow == true) {
			++chargevalue;
			charge = chargevalue * chargevalue * 0.1;
			if (charge >= 300) {
				charge = 300;
			}
			//照準の不透明度、大きさの変化<
			alpha = charge / 400;
			aimCircle = charge / 10;
			//照準の不透明度、大きさの変化>
		}
	
		for (let i = 0; i < arrowArray.length; i++) {
			arrowArray[i].move();
		}
	
		for (let i = 0; i < arrowArray.length; i++) {
			for (let j = 0; j < enemyArray.length; j++) {
				if (enemyArray[j].appearOrNot()) {
					if (circleColLine(enemyArray[j].circle, arrowArray[i].trajectoryLine)) {
						if (enemyArray[j].aliveOrDeath() == false) {
							if (arrowArray[i].shotornot == true) {
								if (arrowArray[i].hitornot == false) {
									enemyArray[j].hitArrow();
									arrowArray[i].hitObject(enemyArray[j].circle, j);
								}
							}
						}
					}
				}
			}
			if (arrowArray[i].trajectoryLine.end_p.y > canvasH * 2) {
				if (arrowArray[i].hitEnemy == false) {
					arrowArray[i].vanish();
				}
			}
			if (arrowArray[i].hitEnemy == true) {
				if (enemyArray[arrowArray[i].whoHit].aliveOrDeath()) {
					arrowArray[i].vanish();
				}
			}
		}
	
		for (let i = 0; i < enemyArray.length; i++) {
			enemyArray[i].move(archerCircle);
			if (enemyArray[i].aliveOrDeath() == false) {
				enemyArray[i].attack();
			}
		}
		++elapsedTime; // 経過時間変数を増加
		++waveTime;	
	}
	document.getElementById("timetag").textContent = (`${elapsedTime}  ${(Math.floor(elapsedTime / fps))} `);

}

let testswitch = false;
let phazeChange = false;
// ゲーム画面描画関数
function displayDraw(){
	let field = document.getElementById("field");
	field.width = canvasW;
	field.height = canvasH;
	let ctx = field.getContext("2d");
	ctx.imageSmoothingEnabled = false;	//アンチエイリアスをオフ
	ctx.clearRect(0, 0, canvasW, canvasH);	//描画領域クリア
	drawMap(stage01, ctx, "backgroundimg");

	if(gameState == gState_title){

	}else if(gameState == gState_intermission){
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, testmessage);
		switch(uiDisp.messageLinePick){
			case 0:
				if(phazeChange == true){
					gameState = gState_battle;
					phazeChange = false;
					testswitch = false;
					break;
				}
				if(testswitch == false){
					louya.point.x = canvasW + 100;
					testswitch = true;
				}
				louya.point.x > 500 ? louya.point.x -=4 : louya.setTileV(1);
				shalala.animationDisplay(ctx);
				louya.animationDisplay(ctx);
				break;
			case 1:
			case 2:
			case 3:
			case 4:
			case 5:
				louya.point.x = 500;
				louya.setTileV(1);
				shalala.animationDisplay(ctx);
				louya.animationDisplay(ctx);
				phazeChange = true;
				break;
		}
	}else if(gameState == gState_battle){
	if(gameover == true){

	}
		// あとで消す<
		testangle = Math.atan2((mouseP.y - archerCircle.p.y), (mouseP.x - archerCircle.p.x));
		testangle = angleCorrect(testangle);
		testU = Math.floor((testangle * 180 / Math.PI + 185) / 10 % 9);
		testV = Math.floor((testangle * 180 / Math.PI + 185) / 90);
		ctx.drawImage(
			arrowimg,
			testU * 48,
			testV * 48,
			48,
			48,
			archerCircle.p.x - 48,
			archerCircle.p.y - 48,
			96,
			96
		);
		// あとで消す>
	
		for (i = 0; i < arrowArray.length; i++) {
			if (arrowArray[i].shotornot == true) {
				arrowArray[i].display(ctx);
			}
		}
		for (i = 0; i < enemyArray.length; i++) {
			enemyArray[i].display(ctx);
		}
	
		// 戦闘画面領域表示
		ctx.lineWidth = 2;  //照準表示の大きさ
		ctx.strokeRect(0, 0, canvasW, 472);
	
		uiDisp.statusDisplay(ctx);
		//描画領域---------------------------------------------------------->
	
		document.getElementById("mousepointtag").textContent = (`${mouseP.x}  ${mouseP.y}  ${testU}  ${testV}  ${(Math.floor((testangle / Math.PI * 180) * 10)) / 100}`);
		document.getElementById("arrowtag").textContent = (`${arrowRemain} / ${arrowUsage}  ${useArrowIndex}`);
		if (elfHp <= 0) {
			document.getElementById("mousepointtag").textContent = ("ゲームオーバー！");
			document.getElementById("arrowtag").textContent = ("くっ！やられた！");
			gameover = true;
			document.body.style.cursor = "default";
			gameState = gState_intermission
		}
		else if (forestHp <= 0) {
			document.getElementById("mousepointtag").textContent = ("ゲームオーバー！");
			document.getElementById("arrowtag").textContent = ("エルフの森は焼かれてしまった！！");
			gameover = true;
			document.body.style.cursor = "default";
			gameState = gState_intermission
		}
		else if (enemyNum <= 0) {
			document.getElementById("mousepointtag").textContent = ("ゲームクリアー！");
			document.getElementById("arrowtag").textContent = ("エルフの森は守られた！");
			gameover = true;
			document.body.style.cursor = "default";
			gameState = gState_intermission
		}
	}

	//照準表示描画<
	if(reticleOn == true){
		ctx.strokeStyle = "#000000";
		ctx.globalAlpha = alpha;    //照準表示の不透明度
		ctx.lineWidth = aimCircle;  //照準表示の大きさ
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(mouseP.x, mouseP.y);
		ctx.lineTo(mouseP.x, mouseP.y);
		ctx.stroke();
		ctx.globalAlpha = 1.0;
	}
	//照準表示描画>
	
	
}
