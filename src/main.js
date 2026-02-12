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

class App {
    constructor() {
        this.cameraManager = new CameraManager();
        this.faceMeshManager = null;
        this.gazeTracker = null;
        this.timer = new Timer();
        this.interactionManager = new InteractionManager();
        this.init();
    }

    async init() {
        // DOM 요소 참조
        const startBtn = document.getElementById('start-btn');
        const startPrompt = document.getElementById('start-prompt');
        const targetObject = document.getElementById('target-object');
        const outputCanvas = document.querySelector('.output_canvas');

        // 캔버스 크기 설정 (화면 비율에 맞춤, 여기서는 4:3 고정)
        outputCanvas.width = 640;
        outputCanvas.height = 480;

        // 이벤트 리스너 등록
        startBtn.addEventListener('click', async () => {
            try {
                // 1. 카메라 권한 요청 및 스트림 시작
                await this.cameraManager.start();
                const videoElement = this.cameraManager.getVideoElement();

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
                    width: 1280,
                    height: 720
                });
                camera.start();

                console.log("Camera started, tracker initialized.");

            } catch (error) {
                console.error("Initialization failed:", error);
                alert("카메라 사용 권한이 필요합니다.");
            }
        });
    }

    /**
     * 시선 상태 변경 핸들러
     */
    handleGazeChange(isGazing, isBlinking) {
        // 눈을 감지 않고 응시 중일 때만 활성화
        const isActive = isGazing && !isBlinking;

        // 인터랙션 업데이트 (음악, 애니메이션, 화면 효과)
        this.interactionManager.updateState(isActive);

        // 타이머 업데이트
        if (isActive) {
            this.timer.start();
        } else {
            this.timer.stop();
        }

        // 디버깅용 타이머 색상 변경 (InteractionManager가 화면 효과를 담당하므로 여기서는 보조)
        const timerElement = document.getElementById('timer-container');
        if (isActive) {
            timerElement.style.color = '#ff00ff'; // Neon Pink
        } else {
            timerElement.style.color = '#555'; // Dimmed
        }
    }
}

// 앱 실행
window.onload = () => {
    new App();
};
