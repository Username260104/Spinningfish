/**
 * main.js
 * 애플리케이션의 진입점(Entry Point)입니다.
 * 주요 모듈들을 초기화하고 전반적인 흐름을 관리합니다.
 */

import { CameraManager } from './camera.js';
import { FaceMeshManager } from './vision/faceMesh.js';
import { GazeTracker } from './vision/gazeTracker.js';
import { Timer } from './game/timer.js';
import { InteractionManager } from './game/interaction.js';
import { RankingManager } from './data/ranking.js';

class App {
    constructor() {
        this.cameraManager = new CameraManager();
        this.faceMeshManager = null;
        this.gazeTracker = null;
        this.timer = new Timer();
        this.interactionManager = new InteractionManager();
        this.rankingManager = new RankingManager();
        this.isGameRunning = false;
        this.init();
    }

    async init() {
        // DOM 요소 참조
        const startBtn = document.getElementById('start-btn');
        const startPrompt = document.getElementById('start-prompt');
        const targetObject = document.getElementById('target-object');
        const outputCanvas = document.querySelector('.output_canvas');

        // 캔버스 크기 초기화 (비디오 로드 후 재설정됨)
        outputCanvas.width = 640;
        outputCanvas.height = 480;

        // 이벤트 리스너 등록
        startBtn.addEventListener('click', async () => {
            this.isGameRunning = true; // 게임 시작 상태 설정
            try {
                // 1. 카메라 권한 요청 및 스트림 시작
                await this.cameraManager.start();
                const videoElement = this.cameraManager.getVideoElement();

                // 비디오 해상도 변경(회전 등) 감지하여 캔버스 크기 동기화
                const adjustCanvasSize = () => {
                    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                        outputCanvas.width = videoElement.videoWidth;
                        outputCanvas.height = videoElement.videoHeight;
                        console.log(`Canvas resized: ${outputCanvas.width}x${outputCanvas.height}`);
                    }
                };

                videoElement.addEventListener('loadedmetadata', adjustCanvasSize);
                videoElement.addEventListener('resize', adjustCanvasSize);

                // 이미 로드된 경우를 대비해 즉시 확인
                adjustCanvasSize();

                // 2. Face Mesh 초기화
                this.faceMeshManager = new FaceMeshManager(videoElement, outputCanvas);
                await this.faceMeshManager.init();

                // 3. Gaze Tracker 초기화
                this.gazeTracker = new GazeTracker();
                this.gazeTracker.setOnGazeChange(this.handleGazeChange.bind(this));

                // Face Mesh 결과 수신 시 Gaze Tracker 업데이트
                this.faceMeshManager.setOnResults((results) => {
                    this.gazeTracker.update(results);
                });

                // 4. UI 전환
                startPrompt.classList.add('hidden');
                targetObject.classList.remove('hidden');

                // 5. 트래킹 루프 시작 (CameraUtils 사용)
                const camera = new Camera(videoElement, {
                    onFrame: async () => {
                        await this.faceMeshManager.send();
                    },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // 전면 카메라 우선
                });
                camera.start();

                console.log("Camera started, tracker initialized.");

            } catch (error) {
                console.error("Initialization failed:", error);
                alert("카메라 사용 권한이 필요합니다.");
            }
        });

        // 랭킹 및 게임 종료 관련 DOM 요소
        // const stopBtn = document.getElementById('stop-btn'); // 사용 안함
        const rankingModal = document.getElementById('ranking-modal');
        const rankingList = document.getElementById('ranking-list');
        const nicknameInput = document.getElementById('nickname-input');
        const saveBtn = document.getElementById('save-btn');
        const restartBtn = document.getElementById('restart-btn');

        /* STOP 버튼 로직 제거 (자동 종료로 대체)
        stopBtn.addEventListener('click', () => {
             // ...
        });
        */

        // SAVE 버튼 클릭 시 기록 저장
        saveBtn.addEventListener('click', () => {
            const nickname = nicknameInput.value.trim() || 'Anonymous';
            const duration = this.timer.elapsedTime;

            this.rankingManager.addRecord(nickname, duration);
            this.rankingManager.render(rankingList);

            saveBtn.disabled = true;
            saveBtn.textContent = 'SAVED';
            nicknameInput.disabled = true;
        });

        // RETRY 버튼 클릭 시 재시작
        restartBtn.addEventListener('click', () => {
            window.location.reload();
        });

        // 게임 종료 함수 (메서드로 분리)
        this.gameOver = () => {
            if (!this.isGameRunning) return;
            this.isGameRunning = false;

            console.log("Game Over triggered");

            // 1. 게임 루프/인터랙션 정지
            this.interactionManager.deactivate();
            this.timer.stop();
            targetObject.classList.add('hidden');
            // stopBtn.classList.add('hidden');

            // 2. 랭킹 모달 표시
            rankingModal.classList.remove('hidden');
            this.rankingManager.render(rankingList);

            // 3. 입력창 포커스
            nicknameInput.value = '';
            nicknameInput.focus();
        };
    }

    /**
     * 시선 상태 변경 핸들러
     */
    handleGazeChange(isGazing, isBlinking) {
        if (!this.isGameRunning) return;

        // 응시 중이거나 눈을 깜빡이는 경우 활성화 (깜빡임 시 일시정지 방지)
        const isActive = isGazing || isBlinking;

        // 시선 이탈 시 즉시 게임 종료
        if (!isActive) {
            this.gameOver();
            return;
        }

        // 인터랙션 업데이트 (음악, 애니메이션, 화면 효과)
        this.interactionManager.updateState(isActive);

        // 타이머 업데이트 (항상 실행)
        this.timer.start();
    }

}

// 앱 실행
window.onload = () => {
    new App();
};
