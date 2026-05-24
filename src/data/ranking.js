/**
 * ranking.js
 * 랭킹 시스템을 관리합니다. 
 * 현재는 LocalStorage를 사용하여 Mocking 처리되어 있습니다.
 * 추후 Firebase로 교체될 예정입니다.
 */

import { formatDuration } from '../utils/timeFormatter.js';

const STORAGE_KEY = 'void_gaze_ranking';

export class RankingManager {
    constructor() {
        this.records = this.loadRecords();
    }

    /**
     * 로컬 스토리지에서 기록을 불러옵니다.
     */
    loadRecords() {
        const data = localStorage.getItem(STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Failed to parse ranking data:", e);
            return [];
        }
    }

    /**
     * 새로운 기록을 저장하고 랭킹을 갱신합니다.
     * @param {string} nickname - 사용자 닉네임
     * @param {number} duration - 시선 유지 시간 (ms)
     */
    addRecord(nickname, duration) {
        const newRecord = {
            nickname: nickname || "Anonymous",
            duration: duration,
            timestamp: new Date().toISOString()
        };

        this.records.push(newRecord);

        // 내림차순 정렬 (오래 버틴 순)
        this.records.sort((a, b) => b.duration - a.duration);

        // 상위 10등까지만 유지
        this.records = this.records.slice(0, 10);

        this.saveRecords();
        return this.records;
    }

    /**
     * 기록을 로컬 스토리지에 저장합니다.
     */
    saveRecords() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    }

    /**
     * 현재 랭킹 리스트를 반환합니다.
     */
    getRanking() {
        return this.records;
    }

    /**
     * 랭킹 데이터를 HTML 엘리먼트로 렌더링합니다.
     * @param {HTMLElement} container - 리스트가 들어갈 `<ul>` 또는 `<table>` 요소
     */
    render(container) {
        container.replaceChildren();

        if (this.records.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'empty';
            emptyItem.textContent = '기록이 없습니다.';
            container.appendChild(emptyItem);
            return;
        }

        this.records.forEach((record, index) => {
            const li = document.createElement('li');
            const rank = document.createElement('span');
            const name = document.createElement('span');
            const score = document.createElement('span');

            li.className = 'rank-item';
            rank.className = 'rank';
            name.className = 'name';
            score.className = 'score';

            rank.textContent = `#${index + 1}`;
            name.textContent = record.nickname;
            score.textContent = formatDuration(record.duration);

            li.append(rank, name, score);
            container.appendChild(li);
        });
    }
}
