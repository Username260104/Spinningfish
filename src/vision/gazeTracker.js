/**
 * gazeTracker.js
 * Face Mesh 결과를 분석하여 시선(Gaze)과 눈 깜빡임(Blink) 상태를 판별합니다.
 */

// MediaPipe Face Mesh Landmark Indices
const LANDMARKS = {
    LEFT_EYE: [33, 160, 158, 133, 153, 144], // Top: 160, 158; Bottom: 153, 144; Left: 33; Right: 133
    RIGHT_EYE: [362, 385, 387, 263, 373, 380], // Top: 385, 387; Bottom: 373, 380; Left: 362; Right: 263
    LEFT_IRIS_CENTER: 468,
    RIGHT_IRIS_CENTER: 473
};

export class GazeTracker {
    constructor() {
        this.EAR_THRESHOLD = 0.25; // 눈 감음 임계값 (개인차 있음)
        this.GAZE_THRESHOLD = 0.05; // 중앙 응시 허용 오차 (normalized coordinates)
        this.isGazing = false;
        this.isBlinking = false;
        this.onGazeChangeCallback = null;
    }

    /**
     * 상태 변경 콜백 설정
     * @param {Function} callback - (isGazing, isBlinking) => void
     */
    setOnGazeChange(callback) {
        this.onGazeChangeCallback = callback;
    }

    /**
     * Face Mesh 결과를 업데이트하고 상태를 계산합니다.
     * @param {Object} results - MediaPipe Face Mesh results
     */
    update(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            this.setGazeState(false, false);
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // 1. 눈 깜빡임 감지 (EAR)
        const leftEAR = this.calculateEAR(landmarks, LANDMARKS.LEFT_EYE);
        const rightEAR = this.calculateEAR(landmarks, LANDMARKS.RIGHT_EYE);
        const avgEAR = (leftEAR + rightEAR) / 2;

        const isBlinking = avgEAR < this.EAR_THRESHOLD;

        // 2. 시선 감지 (Iris Position)
        // 눈을 감았으면 시선 감지 안 함
        let isGazing = false;
        if (!isBlinking) {
            isGazing = this.checkGazeDirection(landmarks);
        }

        this.setGazeState(isGazing, isBlinking);
    }

    /**
     * 상태를 업데이트하고 변경 시 콜백을 호출합니다.
     */
    setGazeState(isGazing, isBlinking) {
        if (this.isGazing !== isGazing || this.isBlinking !== isBlinking) {
            this.isGazing = isGazing;
            this.isBlinking = isBlinking;
            if (this.onGazeChangeCallback) {
                this.onGazeChangeCallback(isGazing, isBlinking);
            }
        }
    }

    /**
     * EAR(Eye Aspect Ratio)을 계산합니다.
     * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
     * Indices: P1(Left), P2(Top1), P3(Top2), P4(Right), P5(Bottom2), P6(Bottom1)
     */
    calculateEAR(landmarks, indices) {
        const p1 = landmarks[indices[0]];
        const p2 = landmarks[indices[1]];
        const p3 = landmarks[indices[2]];
        const p4 = landmarks[indices[3]];
        const p5 = landmarks[indices[4]];
        const p6 = landmarks[indices[5]];

        const vertical1 = this.calculateDistance(p2, p6);
        const vertical2 = this.calculateDistance(p3, p5);
        const horizontal = this.calculateDistance(p1, p4);

        return (vertical1 + vertical2) / (2 * horizontal);
    }

    /**
     * 두 점 사이의 유클리드 거리를 계산합니다.
     */
    calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    /**
     * 시선이 중앙(카메라/화면)을 향하는지 확인합니다.
     * 간단한 로직: 홍채 중심이 눈의 가로 축 중심에 가까운지 확인.
     * 더 정밀한 로직은 3D Head Pose와 Iris Vector를 사용해야 하지만,
     * 여기서는 2D 랜드마크 기반의 상대적 위치로 추정합니다.
     */
    checkGazeDirection(landmarks) {
        // 왼쪽 눈 판별
        const leftEyeLeft = landmarks[LANDMARKS.LEFT_EYE[0]];
        const leftEyeRight = landmarks[LANDMARKS.LEFT_EYE[3]];
        const leftIris = landmarks[LANDMARKS.LEFT_IRIS_CENTER];

        // 오른쪽 눈 판별
        const rightEyeLeft = landmarks[LANDMARKS.RIGHT_EYE[0]];
        const rightEyeRight = landmarks[LANDMARKS.RIGHT_EYE[3]];
        const rightIris = landmarks[LANDMARKS.RIGHT_IRIS_CENTER];

        const leftRatio = this.getIrisHorizontalRatio(leftEyeLeft, leftEyeRight, leftIris);
        const rightRatio = this.getIrisHorizontalRatio(rightEyeLeft, rightEyeRight, rightIris);

        // 중앙 응시 비율 (0.5에 가까울수록 중앙)
        // 좌우 반전(미러링) 고려 시 로직 확인 필요 (현재 미러링 상태임)
        // 미러 모드에서는 사용자의 오른쪽이 화면의 오른쪽

        // Threshold: 0.5 기준 +/- 0.1 ~ 0.15 범위 내면 중앙으로 간주
        const CENTER_MIN = 0.40;
        const CENTER_MAX = 0.60;

        const leftOk = leftRatio >= CENTER_MIN && leftRatio <= CENTER_MAX;
        const rightOk = rightRatio >= CENTER_MIN && rightRatio <= CENTER_MAX;

        return leftOk && rightOk;
    }

    /**
     * 눈의 좌우 끝점 대비 홍채의 수평 위치 비율을 반환합니다.
     * 0.0 (왼쪽 끝) ~ 1.0 (오른쪽 끝). 중앙은 0.5
     */
    getIrisHorizontalRatio(inner, outer, iris) {
        const eyeWidth = this.calculateDistance(inner, outer);
        const distFromInner = this.calculateDistance(inner, iris);
        return distFromInner / eyeWidth;
    }
}
