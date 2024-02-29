const gState_title = 0;
const gState_intermission = 1;
const gState_battle = 2;

const battle_win = 1;
const battle_elfLost = 2;
const battle_forestLost = 3;

let gameState = gState_title;

let elapsedTime = 0;	// 経過時間変数
let waveTime = 0;		// ウェーブ中での経過時間変数
let wave = 0;			// 現在の敵の出現ウェーブ

let testangle=0;
let testU;
let testV;
let gameClicked = 0;
let gameover = false;
let battleWinOrLost = 0;
let battleBeforeTime = 0;
let battleStart = false;
let battleAfterTime = 0;
let InputOk = true;
let mouseP = new Point(0,0);
let archerCircle = new Circle(new Point(80,300), 30);
let arrowUsage = 15;		// 一度のリロードで補充される矢の数
let arrowRemain = arrowUsage;	// 射れる矢の数
let arrowObject = 40;	// 画面上に表示できる矢の最大数。これ以上の数の矢を放つと一番最初に放たれた矢から順に再計算、再表示される
let useArrowIndex = 0;	// 次に発射されるarrowArrayのインデックス番号。0～arrowObjectの値をとる

let elfMaxHp = 5;
let elfHp = elfMaxHp;
let forestMaxHp = 2;
let forestHp = forestMaxHp;
let alpha = 0.3;
let aimCircle = 30;
let reticleOn = false;
let clicknow = false;
let clickup = false;
let charge = 0;
let chargevalue = 0;

let arrowArray = new Array();
let enemyArray = new Array();
const battleBeforeUntilEnd = 1.25 * fps;
const battleAfterUntilEnd = 5 * fps;
// ゲーム操作受付、計算処理部分
function update(){
	//計算部----------<
	if (clickup == true) {
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
			charge = 0;
			chargevalue = 0;
			alpha = 0.3;
			aimCircle = 30;
		}

		uiDisp.clickupCheck();
		clickup = false;
	}

	if(gameState == gState_title){
		if (clicknow) {
			if(gameClicked > 0){
				sound_array[pickSE(SE_gameStart)].sound.volume = SEVolume1;
				gameClicked++;
			}
		}
		if(gameClicked >= 2){
			elapsedTime++;
		}
		if(elapsedTime > fps * 1.5){
			elapsedTime = 0;
			gameClicked = 0;
			soundStartRegardlessInput(BGM_storyBeginning);
			gameState = gState_intermission;
		}
	}else if(gameState == gState_intermission){

	}else if(gameState == gState_battle){
		if(gameover == true){
			uiDisp.elfForestShakeReset();
			elfHp = elfMaxHp;
			forestHp = forestMaxHp;
			elapsedTime = 0;
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
		if(battleBeforeTime++>battleBeforeUntilEnd){
			battleStart =true;
		};
		if(!battleStart){
			stopNowplayingBGM();
			soundStartRegardlessInput(BGM_battle);
		}
		if(battleStart){
			if(battleWinOrLost == 0){
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
				if (elfHp <= 0) {
					battleWinOrLost = battle_elfLost;
				}
				else if (forestHp <= 0) {
					battleWinOrLost = battle_forestLost;
				}
				else if (enemyNum <= 0) {
					battleWinOrLost = battle_win;
				}		
				if(battleWinOrLost != 0){
					stopNowplayingBGM();
					soundStartRegardlessInput(SE_battleEnd);
				}
				++waveTime;	
				++elapsedTime; // 経過時間変数を増加
			}
		}
		if(battleWinOrLost != 0){
			stageNum = elapsedTime % 2;
			InputOk = false;
			if(battleAfterTime++ == battleAfterUntilEnd){
				uiDisp.finishTimerReset();
				battleBeforeTime = 0;
				battleStart = false;
				InputOk = true;
				gameover = true;
				battleWinOrLost = 0;
				soundStartRegardlessInput(BGM_storyBeginning);
				gameState = gState_intermission
			}
		}
	}
	soundControlRegardlessInput();
	//document.getElementById("timetag").textContent = (`${elapsedTime}  ${(Math.floor(elapsedTime / fps))} `);
}

let testswitch = false;
let phazeChange = false;

// ゲーム画面描画関数
function displayDraw(){
	let ctx = field.getContext("2d");
	ctx.clearRect(0, 0, canvasW, canvasH);	//描画領域クリア
	ctx.imageSmoothingEnabled = false;	//アンチエイリアスをオフ
	drawMap(stage01, ctx, "backgroundimg");

	if(gameState == gState_title){

	}else if(gameState == gState_intermission){
		uiDisp.messageDisplay(ctx, 0, 440, canvasW, 162, testmessage);
		switch(uiDisp.messageLinePick){
			case 1:
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
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:
				louya.point.x = 500;
				louya.setTileV(1);
				shalala.animationDisplay(ctx);
				louya.animationDisplay(ctx);
				phazeChange = true;
				break;
		}
	}else if(gameState == gState_battle){
		if(!battleStart){
			uiDisp.readyDisp(ctx);
		}else{
			uiDisp.startDisp(ctx);
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
		if(gameover != true){
			for (i = 0; i < arrowArray.length; i++) {
				if (arrowArray[i].shotornot == true) {
					arrowArray[i].display(ctx);
				}
			}
		}
		for (i = 0; i < enemyArray.length; i++) {
			enemyArray[i].display(ctx);
		}
	
		// 戦闘画面領域表示
		ctx.lineWidth = 2;  //照準表示の大きさ
		ctx.strokeRect(0, 0, canvasW, 472);
	
		uiDisp.statusDisplay(ctx);
		if(battleWinOrLost != 0){
			uiDisp.finishDisp(ctx,battleWinOrLost);
		}

		//描画領域---------------------------------------------------------->
	
		//document.getElementById("mousepointtag").textContent = (`${mouseP.x}  ${mouseP.y}  ${testU}  ${testV}  ${(Math.floor((testangle / Math.PI * 180) * 10)) / 100}`);
		//document.getElementById("arrowtag").textContent = (`${arrowRemain} / ${arrowUsage}  ${useArrowIndex}`);
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
