/**
 * view.js
 * 게임 화면의 DOM 상태 전환과 사용자 입력을 관리합니다.
 */

export class GameView {
    constructor() {
        this.startBtn = document.getElementById('start-btn');
        this.startPrompt = document.getElementById('start-prompt');
        this.targetObject = document.getElementById('target-object');
        this.outputCanvas = document.querySelector('.output_canvas');
        this.rankingModal = document.getElementById('ranking-modal');
        this.rankingList = document.getElementById('ranking-list');
        this.nicknameInput = document.getElementById('nickname-input');
        this.saveBtn = document.getElementById('save-btn');
        this.restartBtn = document.getElementById('restart-btn');

        this.outputCanvas.width = 640;
        this.outputCanvas.height = 480;
    }

    onStart(callback) {
        this.startBtn.addEventListener('click', callback);
    }

    onSave(callback) {
        this.saveBtn.addEventListener('click', callback);
    }

    onRetry(callback) {
        this.restartBtn.addEventListener('click', callback);
    }

    showStart() {
        this.startBtn.disabled = false;
        this.startPrompt.classList.remove('hidden');
        this.targetObject.classList.add('hidden');
        this.rankingModal.classList.add('hidden');
        this.setGazeLost(false);
    }

    showStarting() {
        this.startBtn.disabled = true;
    }

    showPlaying() {
        this.startPrompt.classList.add('hidden');
        this.targetObject.classList.remove('hidden');
        this.rankingModal.classList.add('hidden');
        this.setGazeLost(false);
    }

    showRanking() {
        this.targetObject.classList.add('hidden');
        this.rankingModal.classList.remove('hidden');
        this.nicknameInput.value = '';
        this.nicknameInput.disabled = false;
        this.saveBtn.disabled = false;
        this.saveBtn.textContent = 'SAVE RECORD';
        this.setGazeLost(false);
        this.nicknameInput.focus();
    }

    showSaved() {
        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'SAVED';
        this.nicknameInput.disabled = true;
    }

    setGazeLost(isLost) {
        document.body.classList.toggle('gaze-lost', isLost);
    }

    getNickname() {
        return this.nicknameInput.value.trim() || 'Anonymous';
    }
}
