# Spinningfish 리팩토링 계획

## 목적

이 문서는 Spinningfish의 현재 사용자 흐름, 코드 흐름, 구조적 위험, 단계별 리팩토링 계획을 기록한다.

구현 작업은 이 문서화 체크포인트를 커밋하고 원격 저장소에 푸시한 뒤 시작한다.

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
- `src/main.js`는 `window.onload`에서 `App` 인스턴스를 생성한다.
- `App.init()`은 DOM 이벤트 연결, 카메라/추적 시작, 시선 상태 처리, 랭킹 UI 표시를 모두 조율한다.

### 추적 파이프라인

- `src/camera.js`는 웹캠 권한을 요청하고 스트림을 `.input_video`에 연결한다.
- `src/vision/faceMesh.js`는 MediaPipe Face Mesh를 초기화하고 결과를 콜백으로 전달한다.
- `src/vision/gazeTracker.js`는 Face Mesh 랜드마크를 시선/깜빡임 상태로 변환한다.

### 게임 피드백

- `src/game/interaction.js`는 물고기 재생, 배경 음악, 일시정지 상태, 시선 이탈 오버레이를 제어한다.
- `src/game/timer.js`는 경과 시간을 측정하고 타이머 UI를 렌더링한다.
- `src/data/ranking.js`는 기록을 `localStorage`에 저장하고, 정렬한 뒤 랭킹 항목을 렌더링한다.

## 현재 이슈와 위험

### 상태 관리

- `src/main.js`는 `isGameRunning` 하나로 주요 상태를 표현한다.
- 이 방식은 `idle`, `starting`, `playing`, `gameOver`, `saved`를 명확히 구분하지 못한다.
- 카메라 초기화가 실패하면 `isGameRunning = true` 이후 상태가 복구되지 않을 수 있다.
- 시작 버튼 중복 클릭도 명시적인 `starting` 상태로 막고 있지 않다.

### 리소스 생명주기

- MediaPipe `Camera` 객체가 `src/main.js` 안의 지역 변수로 만들어진다.
- 이 객체를 저장하지 않기 때문에 게임 종료 시 추적 루프를 멈출 수 없다.
- `CameraManager.stop()`은 존재하지만 현재 게임 종료 경로에서 호출되지 않는다.
- 랭킹 모달이 떠도 웹캠 스트림과 추적 루프가 계속 돌 가능성이 있다.

### UI 결합도

- `src/main.js`가 여러 DOM 클래스와 값을 직접 변경한다.
- UI 상태, 게임 상태, 추적 준비, 랭킹 액션이 한 파일에 섞여 있다.
- 이런 구조에서는 모달과 오버레이가 겹치는 문제처럼 화면 상태 버그가 다시 생기기 쉽다.

### 랭킹 렌더링 안전성

- `src/data/ranking.js`는 `record.nickname`을 `innerHTML` 템플릿으로 렌더링한다.
- 사용자 입력 또는 `localStorage` 조작 데이터는 `textContent` 기반으로 렌더링해야 HTML 삽입 위험을 줄일 수 있다.

### 비전 처리와 디버그 렌더링 결합

- `src/vision/faceMesh.js`가 모델 초기화, 결과 콜백, 디버그 캔버스 렌더링을 함께 담당한다.
- 디버그 색상과 렌더링 관심사가 추적 파이프라인 내부에 섞여 있다.
- 눈 색상 같은 디버그 표시 변경이 추적 코드 변경으로 이어진다.

### 시간 포맷 중복

- `src/game/timer.js`와 `src/data/ranking.js`가 각각 시간 포맷을 구현한다.
- 둘의 표시 형식은 연관되어 있지만 별도로 유지되고 있다.

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

- `isGameRunning`을 명시적인 앱 상태로 교체한다.
- `starting` 또는 `playing` 상태에서 시작 버튼 중복 클릭을 막는다.
- 카메라/추적 초기화 실패 시 상태를 `idle`로 되돌린다.
- 게임 종료 시 카메라 스트림과 MediaPipe CameraUtils 루프를 멈춘다.
- 랭킹 닉네임을 `textContent` 기반으로 렌더링한다.

### 2단계: UI 경계 분리

- `src/main.js`의 DOM 참조와 클래스 변경을 `GameView`로 옮긴다.
- 랭킹 모달 표시를 `GameView` 또는 `RankingView`로 분리한다.
- 오버레이 상태를 미디어 재생 상태가 아니라 화면 상태에 묶는다.
- 사용하지 않는 `stop-btn` 마크업과 관련 주석을 제거한다.

### 3단계: 추적 경계 분리

- 카메라, MediaPipe CameraUtils, Face Mesh, GazeTracker 준비 과정을 `TrackingSession`으로 추출한다.
- `TrackingSession`은 하나의 시선 변경 이벤트만 외부에 노출한다.
- 디버그 렌더링 설정을 `FaceMeshManager` 외부로 분리한다.
- 디버그 캔버스 표시 여부를 설정값으로 제어한다.

### 4단계: 공통 유틸과 정리

- 공통 시간 포맷터를 추출한다.
- 계속 쓰이지 않는다면 `InteractionManager.overlay` 같은 미사용 속성을 제거한다.
- 현재 동작과 맞지 않는 오래된 주석을 정리한다.
- 로컬 실행 방법과 카메라 권한 요구사항을 README에 짧게 추가한다.

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

## 구현 전 체크포인트

1. 이 문서와 현재 UI/동작 수정 사항을 함께 커밋한다.
2. 커밋을 `origin/master`에 푸시한다.
3. 이후 1단계 리팩토링 구현을 시작한다.
