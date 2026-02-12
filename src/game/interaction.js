/**
 * interaction.js
 * 시선 상태에 따른 시각적, 청각적 피드백을 관리합니다.
 */

export class InteractionManager {
    constructor() {
        this.fishImage = document.getElementById('fish-image');
        this.overlay = document.getElementById('overlay');
        this.bgm = new Audio('https://ia800501.us.archive.org/11/items/LippsInc.-Funkytown/Lipps%20Inc.%20-%20Funkytown.mp3'); // Funky Town (Archive.org)

        this.bgm.loop = true;
        this.bgm.volume = 0.5;

        this.isPlaying = false;
    }

    /**
     * 응시 상태에 따라 인터랙션을 업데이트합니다.
     * @param {boolean} isGazing - 시선 유지 여부
     */
    updateState(isGazing) {
        if (isGazing) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    /**
     * 활성 상태 (응시 중): 음악 재생, 애니메이션 시작, 화면 밝게
     */
    activate() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.bgm.play().catch(e => console.warn("Audio play blocked:", e));
            this.fishImage.parentElement.classList.remove('paused');
            document.body.classList.remove('gaze-lost');
        }
    }

    /**
     * 비활성 상태 (시선 이탈): 음악 정지, 애니메이션 정지, 화면 어둡게/붉게
     */
    deactivate() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.bgm.pause();
            this.fishImage.parentElement.classList.add('paused');
            document.body.classList.add('gaze-lost');
        }
    }
}
