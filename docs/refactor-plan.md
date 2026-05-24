# Spinningfish 리팩토링 계획

## 목적

이 문서는 Spinningfish의 사용자 흐름, 코드 흐름, 구조적 위험, 단계별 리팩토링 계획과 구현 상태를 기록한다.

2026-05-24 기준으로 1-4단계 리팩토링 구현은 완료되었다.

## 현재 사용자 흐름

1. 사용자가 앱을 열면 타이머, 물고기 영역, `WATCH FISH` 시작 액션이 보인다.
2. 사용자가 `WATCH FISH`를 클릭한다.
3. 앱이 카메라 권한을 요청하고 얼굴/시선 추적을 시작한다.
4. 물고기가 보이고, 시선이 감지되면 음악과 영상이 재생되며 타이머가 시작된다.
5. 시선이 이탈하면 게임이 즉시 종료된다.
6. 물고기가 숨겨지고 랭킹 등록 모달이 나타난다.
7. 사용자가 닉네임을 입력하고 기록을 저장한다.
8. 사용자는 `RETRY`로 앱을 다시 시작할 수 있다.

## 현재 코드 흐름

### 앱 부트스트랩

- `index.html`은 앱 셸, 타이머, 물고기 영상, 랭킹 모달, 디버그 캔버스, 숨겨진 카메라 비디오 요소를 정의한다.
- `src/main.js`는 `window.onload`에서 `App` 인스턴스를 생성하고 명시적인 앱 상태를 전이한다.
- `src/game/view.js`는 시작/플레이/랭킹/저장 화면 상태와 오버레이 클래스를 관리한다.

### 추적 파이프라인

- `src/vision/trackingSession.js`는 카메라, MediaPipe CameraUtils 루프, Face Mesh, 시선 추적을 하나의 세션으로 관리한다.
- `src/camera.js`는 웹캠 권한을 요청하고 스트림을 `.input_video`에 연결하거나 종료한다.
- `src/vision/faceMesh.js`는 MediaPipe Face Mesh를 초기화하고 결과를 콜백으로 전달한다.
- `src/vision/gazeTracker.js`는 Face Mesh 랜드마크를 시선/깜빡임 상태로 변환한다.
- `src/config.js`는 Face Mesh 디버그 표시 여부와 렌더링 색상을 정의한다.

### 게임 피드백

- `src/game/interaction.js`는 물고기 재생, 배경 음악, 일시정지 상태를 제어한다.
- `src/game/timer.js`는 경과 시간을 측정하고 타이머 UI를 렌더링한다.
- `src/data/ranking.js`는 기록을 `localStorage`에 저장하고, 정렬한 뒤 랭킹 항목을 렌더링한다.
- `src/utils/timeFormatter.js`는 타이머와 랭킹에서 사용하는 시간 표시 형식을 제공한다.

## 초기 이슈와 해결 상태

### 상태 관리

- 해결됨: `src/main.js`는 `idle`, `starting`, `playing`, `gameOver`, `saved` 상태를 명시적으로 사용한다.
- 해결됨: `starting` 또는 `playing` 상태에서는 시작 액션이 무시된다.
- 해결됨: 카메라/추적 초기화가 실패하면 상태와 화면이 `idle`로 복구된다.

### 리소스 생명주기

- 해결됨: MediaPipe `Camera` 객체는 `TrackingSession`이 소유한다.
- 해결됨: 게임 종료 시 `TrackingSession.stop()`이 프레임 루프, 디버그 캔버스 동기화, 카메라 스트림을 정리한다.
- 해결됨: `CameraManager.stop()`은 저장된 스트림과 비디오 요소의 현재 스트림을 모두 종료한다.

### UI 결합도

- 해결됨: DOM 표시 상태는 `GameView`로 분리되었다.
- 해결됨: 랭킹 모달과 시선 이탈 오버레이 상태는 `GameView`가 관리한다.
- 해결됨: 사용하지 않는 `stop-btn` 마크업과 스타일은 제거되었다.

### 랭킹 렌더링 안전성

- 해결됨: 랭킹 항목은 `document.createElement()`와 `textContent` 기반으로 렌더링한다.

### 비전 처리와 디버그 렌더링 결합

- 해결됨: 추적 세션 준비는 `TrackingSession`으로 분리되었다.
- 해결됨: 디버그 표시 여부와 색상은 `src/config.js`에서 설정한다.

### 시간 포맷 중복

- 해결됨: `src/utils/timeFormatter.js`의 `formatDuration()`을 타이머와 랭킹이 함께 사용한다.

## 목표 구조

### `App`

최상위 조율만 담당한다.

- 의존성을 생성한다.
- 게임 상태 전이를 관리한다.
- 모듈 간 이벤트를 연결한다.

### `GameState`

명시적인 상태를 정의한다.

- `idle`
- `starting`
- `playing`
- `gameOver`
- `saved`

예상 상태 전이:

- `idle -> starting`: 사용자가 시작 버튼을 클릭한다.
- `starting -> playing`: 카메라와 추적 초기화가 성공한다.
- `starting -> idle`: 초기화가 실패한다.
- `playing -> gameOver`: 시선이 이탈한다.
- `gameOver -> saved`: 기록 저장이 완료된다.

### `TrackingSession`

카메라, MediaPipe CameraUtils 루프, Face Mesh, 시선 추적을 하나의 세션으로 관리한다.

- `start()`
- `stop()`
- `onGazeChange(callback)`

### `GameView`

DOM 표시 상태를 담당한다.

- `showStart()`
- `showPlaying()`
- `showRanking()`
- `setGazeLost(isLost)`
- `setSaved()`

### `RankingManager`

랭킹 데이터만 담당한다.

- 기록 불러오기
- 기록 추가
- 정렬과 상위 기록 유지
- 기록 저장

렌더링은 `RankingView`로 분리하거나, 최소한 `RankingManager.render()` 내부에서 안전한 DOM API를 사용한다.

### `TimeFormatter`

타이머와 랭킹이 같은 기준으로 시간을 표시하도록 공통 포맷터를 둔다.

## 리팩토링 단계

### 1단계: 안전성과 상태

- 완료: `isGameRunning`을 명시적인 앱 상태로 교체했다.
- 완료: `starting` 또는 `playing` 상태에서 시작 버튼 중복 클릭을 막는다.
- 완료: 카메라/추적 초기화 실패 시 상태를 `idle`로 되돌린다.
- 완료: 게임 종료 시 카메라 스트림과 MediaPipe CameraUtils 루프를 멈춘다.
- 완료: 랭킹 닉네임을 `textContent` 기반으로 렌더링한다.

### 2단계: UI 경계 분리

- 완료: `src/main.js`의 DOM 참조와 클래스 변경을 `GameView`로 옮겼다.
- 완료: 랭킹 모달 표시를 `GameView`로 분리했다.
- 완료: 오버레이 상태를 미디어 재생 상태가 아니라 화면 상태에 묶었다.
- 완료: 사용하지 않는 `stop-btn` 마크업과 관련 주석을 제거했다.

### 3단계: 추적 경계 분리

- 완료: 카메라, MediaPipe CameraUtils, Face Mesh, GazeTracker 준비 과정을 `TrackingSession`으로 추출했다.
- 완료: `TrackingSession`은 하나의 시선 변경 이벤트만 외부에 노출한다.
- 완료: 디버그 렌더링 설정을 `FaceMeshManager` 외부로 분리했다.
- 완료: 디버그 캔버스 표시 여부를 설정값으로 제어한다.

### 4단계: 공통 유틸과 정리

- 완료: 공통 시간 포맷터를 추출했다.
- 완료: `InteractionManager.overlay` 같은 미사용 속성을 제거했다.
- 완료: 현재 동작과 맞지 않는 오래된 주석을 정리했다.
- 완료: 로컬 실행 방법과 카메라 권한 요구사항을 README에 짧게 추가했다.

## 검증 계획

수동 확인:

- 앱이 `http://127.0.0.1:4173`에서 열린다.
- `WATCH FISH`는 하나의 추적 세션만 시작한다.
- 카메라 권한 거부 시 앱이 시작 화면으로 돌아온다.
- 시작 후 물고기가 표시된다.
- 타이머는 실제 플레이 중에만 시작된다.
- 시선 이탈은 게임을 한 번만 종료한다.
- 랭킹 모달은 시선 이탈 오버레이에 의해 어두워지지 않는다.
- 닉네임 저장 후 랭킹이 갱신되고 중복 저장이 막힌다.
- `RETRY` 후 앱이 깨끗한 초기 상태로 돌아온다.

코드 확인:

- 사용자 제어 데이터가 들어가는 `innerHTML` 사용 여부를 검색한다.
- 사용하지 않는 DOM 요소와 오래된 주석을 검색한다.
- 장시간 실행되는 카메라/미디어 리소스에 모두 종료 경로가 있는지 확인한다.

## 구현 체크포인트

1. 문서화 체크포인트 커밋과 원격 푸시는 완료되었다.
2. 1-4단계 리팩토링 구현은 완료되었다.
3. 남은 작업은 브라우저에서 실제 카메라 권한, 시선 감지, 랭킹 저장 플로우를 수동 검증하는 것이다.
