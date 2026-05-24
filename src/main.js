/**
 * main.js
 * 애플리케이션의 진입점(Entry Point)입니다.
 * 주요 모듈들을 초기화하고 전반적인 흐름을 관리합니다.
 */

import { Timer } from './game/timer.js';
import { InteractionManager } from './game/interaction.js';
import { GameView } from './game/view.js';
import { RankingManager } from './data/ranking.js';
import { TrackingSession } from './vision/trackingSession.js';

const APP_STATES = {
    IDLE: 'idle',
    STARTING: 'starting',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    SAVED: 'saved'
};

class App {
    constructor() {
        this.timer = new Timer();
        this.interactionManager = new InteractionManager();
        this.view = new GameView();
        this.trackingSession = new TrackingSession(this.view.outputCanvas);
        this.rankingManager = new RankingManager();
        this.state = APP_STATES.IDLE;
        this.init();
    }

    async init() {
        // 이벤트 리스너 등록
        this.view.onStart(() => {
            this.startGame();
        });

        this.trackingSession.onGazeChange(this.handleGazeChange.bind(this));

        // SAVE 버튼 클릭 시 기록 저장
        this.view.onSave(() => {
            if (this.state !== APP_STATES.GAME_OVER) return;

            const nickname = this.view.getNickname();
            const duration = this.timer.elapsedTime;

            this.rankingManager.addRecord(nickname, duration);
            this.rankingManager.render(this.view.rankingList);

            this.view.showSaved();
            this.setState(APP_STATES.SAVED);
        });

        // RETRY 버튼 클릭 시 재시작
        this.view.onRetry(() => {
            window.location.reload();
        });
    }

    setState(nextState) {
        this.state = nextState;
    }

    async startGame() {
        if (this.state !== APP_STATES.IDLE) return;

        this.setState(APP_STATES.STARTING);
        this.view.showStarting();

        try {
            await this.trackingSession.start({
                onReady: () => {
                    this.view.showPlaying();
                    this.setState(APP_STATES.PLAYING);
                }
            });

            console.log("Camera started, tracker initialized.");
        } catch (error) {
            console.error("Initialization failed:", error);
            this.trackingSession.stop();
            this.view.showStart();
            this.setState(APP_STATES.IDLE);
            alert("카메라 사용 권한이 필요합니다.");
        }
    }

    gameOver() {
        if (this.state !== APP_STATES.PLAYING) return;
        this.setState(APP_STATES.GAME_OVER);

        console.log("Game Over triggered");

        // 1. 게임 루프/인터랙션 정지
        this.interactionManager.deactivate();
        this.timer.stop();
        this.trackingSession.stop();

        // 2. 랭킹 모달 표시
        this.view.showRanking();
        this.rankingManager.render(this.view.rankingList);
    }

    /**
     * 시선 상태 변경 핸들러
     */
    handleGazeChange(isGazing, isBlinking) {
        if (this.state !== APP_STATES.PLAYING) return;

        // 응시 중이거나 눈을 깜빡이는 경우 활성화 (깜빡임 시 일시정지 방지)
        const isActive = isGazing || isBlinking;

        // 시선 이탈 시 즉시 게임 종료
        if (!isActive) {
            this.gameOver();
            return;
        }

        // 인터랙션 업데이트 (음악, 애니메이션, 화면 효과)
        this.interactionManager.updateState(isActive);
        this.view.setGazeLost(false);

        // 타이머 업데이트 (항상 실행)
        this.timer.start();
    }

}

// 앱 실행
window.onload = () => {
    new App();
};
