/**
 * faceMesh.js
 * MediaPipe Face Mesh 모델을 로드하고 설정을 관리하는 클래스입니다.
 */

export class FaceMeshManager {
    constructor(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.canvasCtx = canvasElement.getContext('2d');
        this.faceMesh = null;
        this.onResultsCallback = null;
    }

    /**
     * Face Mesh 모델을 초기화합니다.
     */
    async init() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true, // Iris Tracking을 위해 필수 (478개 랜드마크)
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults(this.onResults.bind(this));
    }

    /**
     * 결과 처리 콜백을 설정합니다.
     * @param {Function} callback - (results) => void
     */
    setOnResults(callback) {
        this.onResultsCallback = callback;
    }

    /**
     * MediaPipe로부터 결과를 받았을 때 호출되는 내부 메서드입니다.
     */
    onResults(results) {
        // 1. 디버그 캔버스 그리기 (선택 사항)
        this.drawDebug(results);

        // 2. 외부 콜백 호출 (GazeTracker 등으로 전달)
        if (this.onResultsCallback) {
            this.onResultsCallback(results);
        }
    }

    /**
     * 디버깅을 위해 얼굴 멘쉬를 캔버스에 그립니다.
     */
    drawDebug(results) {
        if (!this.canvasElement) return;

        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(
            results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                drawConnectors(this.canvasCtx, landmarks, FACEMESH_TESSELATION,
                    { color: '#C0C0C070', lineWidth: 1 });
                drawConnectors(this.canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
                drawConnectors(this.canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
                drawConnectors(this.canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });
                drawConnectors(this.canvasCtx, landmarks, FACEMESH_LEFT_IRIS, { color: '#30FF30' });
            }
        }
        this.canvasCtx.restore();
    }

    /**
     * 비디오 프레임을 캡처하여 Face Mesh 모델로 보냅니다.
     * requestAnimationFrame 루프 내에서 호출되어야 합니다.
     */
    async send() {
        if (this.videoElement && !this.videoElement.paused && !this.videoElement.ended) {
            await this.faceMesh.send({ image: this.videoElement });
        }
    }
}
