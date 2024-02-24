const gState_title = 0;
const gState_intermission = 1;
const gState_battle = 2;

const battle_win = 1;
const battle_elfLost = 2;
const battle_forestLost = 3;

let gameState = gState_intermission;

let elapsedTime = 0;	// 経過時間変数
let waveTime = 0;		// ウェーブ中での経過時間変数
let wave = 0;			// 現在の敵の出現ウェーブ

let testangle=0;
let testU;
let testV;
let gameover = false;
let battle_WinOrLost = 0;
let battleAfterTime = 0;
let InputOk = true;
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

// ゲーム操作受付、計算処理部分
function update(){
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
		function () {
			if(InputOk){
				clicknow = true;
				if(SE_array[pickSE(SE_pushEnter)]){
					if(SE_set[pickSE(SE_pushEnter)][sound_soundOn]){
						SE_array[pickSE(SE_pushEnter)].playFromStart();
						SE_set[pickSE(SE_pushEnter)][sound_soundOn] = false;
					}
				}
			}
		}
	);
	document.getElementById("field").addEventListener(
		"mouseup",
		function () {
			clicknow = false;
			if(InputOk){
				clickup = true;
				if (circleColCircle(mouseP, 1, archerCircle.p, archerCircle.r)) {
					if(SE_set[pickSE(SE_reload)][sound_soundOn]){
						if(SE_array[pickSE(SE_reload)]){
							SE_array[pickSE(SE_reload)].playFromStart();
							SE_set[pickSE(SE_reload)][sound_soundOn] = false;
						}
					}
				}else {
					if(SE_set[pickSE(SE_arrowShoot)][sound_soundOn]){
						if(SE_array[pickSE(SE_arrowShoot)]){
							SE_array[pickSE(SE_arrowShoot)].playFromStart();
							if(arrowRemain > 0){
								SE_array[pickSE(SE_arrowFly)].playFromStart();
							}
							SE_set[pickSE(SE_arrowShoot)][sound_soundOn] = false;
						}
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
				for(let i = 0 ; i < SE_set.length ; i ++){
					SE_array.push(new soundMake(
						SE_set[i][sound_idTag],
						SE_set[i][sound_isLoop],
						SE_set[i][sound_volume],
						SE_set[i][sound_mute],
						SE_set[i][sound_loopTiming],
						SE_set[i][sound_loopBackTime]
						)
					)
					if(SE_array[i].sound.loop){
						SE_array[i].playFromStart();
					}
					console.log(i + SE_array[i].idTag + " loaded");
				}
				if(browser == browser_Firefox){	// 無音対策
					SE_firefox = document.getElementById("SE_firefox");
					SE_firefox.loop = true;
					SE_firefox.volume = 0.0000001;
					SE_firefox.play();
				}
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
		SE_set[pickSE(SE_arrowShoot)][sound_soundOn] = false;
		SE_set[pickSE(SE_reload)][sound_soundOn] = false;
		if(SE_array[pickSE(SE_arrowShoot)]){
			SE_array[pickSE(SE_arrowShoot)].muteChange(true);
			SE_array[pickSE(SE_arrowFly)].muteChange(true);
		}
		if(SE_array[pickSE(SE_arrowHit)]){
			SE_array[pickSE(SE_arrowHit)].muteChange(true);
		}
		if(SE_array[pickSE(SE_defeatEnemy)]){
			SE_array[pickSE(SE_defeatEnemy)].muteChange(true);
		}
		if(SE_array[pickSE(SE_damageElf)]){
			SE_array[pickSE(SE_damageElf)].muteChange(true);
		}
		if(SE_array[pickSE(SE_damageForest)]){
			SE_array[pickSE(SE_damageForest)].muteChange(true);
		}

	}else if(gameState == gState_battle){
		
		SE_set[pickSE(SE_arrowShoot)][sound_soundOn] = true;
		SE_set[pickSE(SE_reload)][sound_soundOn] = true;
		if(SE_array[pickSE(SE_arrowShoot)]){
			SE_array[pickSE(SE_arrowShoot)].muteChange(false);
			SE_array[pickSE(SE_arrowFly)].muteChange(false);
		}

		soundRegardlessInput();
		if(battle_WinOrLost == 0){
			if(gameover == true){
				uiDisp.elfForestShakeReset();
				elfHp = 5;
				forestHp = 15;
				elapsedTime = 0;
				battle_WinOrLost = 0;
				battleAfterTime = 0;
				arrowRemain = arrowUsage;	// 射れる矢の数
				waveTime = 0;
				useArrowIndex = 0;
				arrowArray.splice(0);
				enemyNum = 0;
				for(let i = 0 ; i < arrowObject ; i++){
					arrowArray.push(new arrow());
				}
				enemySet(stageNum);
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
			++waveTime;	
		}
		++elapsedTime; // 経過時間変数を増加
		if(battle_WinOrLost != 0){
			stageNum = elapsedTime % 2;
			InputOk = false;
			if(++battleAfterTime == fps * 3){
				InputOk = true;
				gameover = true;
				battle_WinOrLost = 0;
				gameState = gState_intermission
			}
		}
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
			battle_WinOrLost = battle_elfLost;
		}
		else if (forestHp <= 0) {
			battle_WinOrLost = battle_forestLost;
		}
		else if (enemyNum <= 0) {
			battle_WinOrLost = battle_win;
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
