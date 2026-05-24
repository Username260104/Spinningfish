/**
 * camera.js
 * 웹캠 비디오 스트림을 관리하는 클래스입니다.
 */

export class CameraManager {
    constructor() {
        this.videoElement = document.querySelector('.input_video');
        this.stream = null;
    }

    /**
     * 웹캠 스트림을 요청하고 비디오 요소에 연결합니다.
     * @returns {Promise<void>}
     */
    async start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser API navigator.mediaDevices.getUserMedia not available");
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1280,
                    height: 720,
                    facingMode: 'user'
                },
                audio: false
            });

            this.stream = stream;
            this.videoElement.srcObject = stream;

            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });
        } catch (error) {
            console.error("Error accessing camera:", error);
            throw error;
        }
    }

    /**
     * 스트림을 정지합니다.
     */
    stop() {
        const streams = new Set();

        if (this.stream) {
            streams.add(this.stream);
        }

        if (this.videoElement && this.videoElement.srcObject) {
            streams.add(this.videoElement.srcObject);
        }

        streams.forEach((stream) => {
            if (stream && typeof stream.getTracks === 'function') {
                stream.getTracks().forEach(track => track.stop());
            }
        });

        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.srcObject = null;
            this.videoElement.onloadedmetadata = null;
        }

        this.stream = null;
    }

    /**
     * 비디오 요소를 반환합니다 (MediaPipe 입력용).
     */
    getVideoElement() {
        return this.videoElement;
    }
}
