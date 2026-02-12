/**
 * timer.js
 * 시선 유지 시간을 측정하고 UI에 표시하는 클래스입니다.
 */

export class Timer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.timerElement = document.getElementById('timer');
        this.animationFrameId = null;
    }

    /**
     * 타이머를 시작하거나 재개합니다.
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = performance.now() - this.elapsedTime;
            this.update();
        }
    }

    /**
     * 타이머를 일시 정지합니다.
     */
    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    /**
     * 타이머를 초기화합니다.
     */
    reset() {
        this.stop();
        this.elapsedTime = 0;
        this.render(0);
    }

    /**
     * 매 프레임마다 시간을 업데이트하고 렌더링합니다.
     */
    update() {
        if (this.isRunning) {
            const now = performance.now();
            this.elapsedTime = now - this.startTime;
            this.render(this.elapsedTime);
            this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        }
    }

    /**
     * 시간을 HH:MM:SS.ms 형식으로 변환하여 UI에 표시합니다.
     * @param {number} ms - 밀리초 단위 시간
     */
    render(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10); // 두 자리까지만 표시

        const formattedTime =
            `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}.${this.pad(milliseconds)}`;

        if (this.timerElement) {
            this.timerElement.textContent = formattedTime;
        }
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }

    /**
     * 현재 누적 시간을 반환합니다.
     */
    getTime() {
        return this.elapsedTime;
    }
}
