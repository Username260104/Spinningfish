/**
 * trackingSession.js
 * 카메라, Face Mesh, 시선 분석, MediaPipe 프레임 루프를 하나의 세션으로 관리합니다.
 */

import { CameraManager } from '../camera.js';
import { FACE_MESH_DEBUG } from '../config.js';
import { FaceMeshManager } from './faceMesh.js';
import { GazeTracker } from './gazeTracker.js';

export class TrackingSession {
    constructor(outputCanvas, debugOptions = FACE_MESH_DEBUG) {
        this.outputCanvas = outputCanvas;
        this.debugOptions = debugOptions;
        this.cameraManager = new CameraManager();
        this.faceMeshManager = null;
        this.gazeTracker = null;
        this.mediaPipeCamera = null;
        this.onGazeChangeCallback = null;
        this.canvasResizeTarget = null;
        this.canvasResizeHandler = null;
        this.outputCanvas.hidden = !this.debugOptions.enabled;
    }

    onGazeChange(callback) {
        this.onGazeChangeCallback = callback;
    }

    async start({ onReady } = {}) {
        await this.cameraManager.start();
        const videoElement = this.cameraManager.getVideoElement();

        this.startCanvasSizeSync(videoElement);

        this.faceMeshManager = new FaceMeshManager(videoElement, this.outputCanvas, this.debugOptions);
        await this.faceMeshManager.init();

        this.gazeTracker = new GazeTracker();
        this.gazeTracker.setOnGazeChange((isGazing, isBlinking) => {
            if (this.onGazeChangeCallback) {
                this.onGazeChangeCallback(isGazing, isBlinking);
            }
        });

        this.faceMeshManager.setOnResults((results) => {
            this.gazeTracker.update(results);
        });

        this.mediaPipeCamera = new Camera(videoElement, {
            onFrame: async () => {
                await this.faceMeshManager.send();
            },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        });

        if (onReady) {
            onReady();
        }

        await this.mediaPipeCamera.start();
    }

    stop() {
        if (this.mediaPipeCamera && typeof this.mediaPipeCamera.stop === 'function') {
            try {
                this.mediaPipeCamera.stop();
            } catch (error) {
                console.warn("Failed to stop MediaPipe camera:", error);
            }
        }

        this.mediaPipeCamera = null;
        this.faceMeshManager = null;
        this.gazeTracker = null;
        this.stopCanvasSizeSync();
        this.cameraManager.stop();
    }

    startCanvasSizeSync(videoElement) {
        this.stopCanvasSizeSync();

        const adjustCanvasSize = () => {
            if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                this.outputCanvas.width = videoElement.videoWidth;
                this.outputCanvas.height = videoElement.videoHeight;
                console.log(`Canvas resized: ${this.outputCanvas.width}x${this.outputCanvas.height}`);
            }
        };

        this.canvasResizeTarget = videoElement;
        this.canvasResizeHandler = adjustCanvasSize;
        videoElement.addEventListener('loadedmetadata', adjustCanvasSize);
        videoElement.addEventListener('resize', adjustCanvasSize);
        adjustCanvasSize();
    }

    stopCanvasSizeSync() {
        if (!this.canvasResizeTarget || !this.canvasResizeHandler) return;

        this.canvasResizeTarget.removeEventListener('loadedmetadata', this.canvasResizeHandler);
        this.canvasResizeTarget.removeEventListener('resize', this.canvasResizeHandler);
        this.canvasResizeTarget = null;
        this.canvasResizeHandler = null;
    }
}
