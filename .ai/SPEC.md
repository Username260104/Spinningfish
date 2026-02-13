# SPEC.md : Watch Spinning Fish

> **Project Name:** Watch Spinning Fish
> **Version:** 0.1.0
> **Objective:** 웹캠 기반의 시선 추적 기술을 활용하여 사용자가 화면 중앙의 특정 객체(Target Object)를 응시하는 지속 시간을 측정하고 데이터를 기록한다.

## 1. 개요 (Overview)

본 애플리케이션은 MediaPipe Face Mesh의 Iris Tracking 모델을 사용하여 사용자의 시선(Gaze)이 화면 중앙의 특정 좌표 범위 내에 머무르는지를 실시간으로 판별한다. 시선이 유지되는 동안 타이머가 누적되며, 이 기록을 서버에 저장하여 사용자 간 순위를 표시한다.

---

## 2. 기능 요구사항 (Functional Requirements)

### 2.1. 시선 감지 및 판별 (Gaze Detection)

* **입력:** 사용자의 웹캠 비디오 스트림.
* **처리:**
* MediaPipe Face Mesh를 로드하여 안면 랜드마크(468개) 및 홍채(Iris) 랜드마크를 추출한다.
* **눈 개폐 여부 판단:** 양쪽 눈의 EAR(Eye Aspect Ratio)을 계산하여 눈을 뜨고 있는지 확인한다. (Threshold 값 설정 필요)
* **시선 좌표 계산:** 홍채 중심점이 눈 윤곽 랜드마크 내에서 중앙에 위치하는지, 혹은 화면의 중앙 영역(Bounding Box)을 향하는지 벡터를 계산한다.


* **출력:** `isGazing` (Boolean) 값을 매 프레임마다 갱신한다.

### 2.2. 타이머 시스템 (Timer System)

* **작동 로직:**
* `isGazing`이 `true`일 경우: 타이머가 밀리초(ms) 단위로 증가한다.
* `isGazing`이 `false`일 경우: 타이머가 즉시 정지한다.


* **표시 형식:** `HH:MM:SS.ms` (예: 00:01:23.45)
* **위치:** 화면 우측 상단 고정 (Sticky/Fixed Position).

### 2.3. 미디어 제어 (Media Control)

* **대상 객체:** 화면 중앙의 3D 모델 또는 GIF (Spinning Fish).
* **배경 오디오:** 지정된 BGM (Funky Town).
* **상태 동기화:**
* **Active (응시 중):** 객체 애니메이션 재생, 오디오 재생.
* **Inactive (비응시):** 객체 애니메이션 정지, 오디오 음소거 또는 일시 정지.


* **시각적 피드백:** 비응시 상태 전환 시 화면 테두리 색상 변경 또는 불투명도 조절을 통해 사용자에게 상태 변화를 알린다.

### 2.4. 랭킹 시스템 (Leaderboard)

* **데이터 기록:** 세션 종료 시(사용자 종료 버튼 클릭 또는 브라우저 이탈 시) 최종 누적 시간을 서버로 전송한다.
* **데이터 조회:** 서버에 저장된 기록을 시간 순(내림차순)으로 정렬하여 상위 N명의 리스트를 호출한다.
* **표시 정보:** 순위, 닉네임, 누적 시간.

---

## 3. 기술 스택 (Tech Stack)

### Frontend

* **Language:** HTML5, CSS3, JavaScript (ES6+)
* **Computer Vision:** `@mediapipe/face_mesh`, `@mediapipe/camera_utils`
* **Rendering:** Canvas API (Video Processing), DOM Manipulation (Timer/UI)

### Backend

* **BaaS:** Google Firebase
* **Database:** Cloud Firestore (NoSQL)
* **Hosting:** Firebase Hosting

---

## 4. 데이터 구조 (Data Schema)

### Firestore Collection: `records`

각 문서는 단일 사용자의 최고 기록 또는 세션 기록을 저장한다.

| Field Name | Type | Description |
| --- | --- | --- |
| `uid` | String | 사용자 고유 식별자 (Auto ID) |
| `nickname` | String | 사용자 입력 닉네임 |
| `duration` | Number | 누적 응시 시간 (Milliseconds) |
| `timestamp` | Timestamp | 기록 생성 시간 (Server Time) |
| `device_type` | String | 접속 기기 정보 (Desktop/Mobile) |

---

## 5. UI/UX 레이아웃 (Layout Specification)

### 5.1. 초기 화면 (Start Screen)

* 카메라 권한 요청 버튼.
* 서비스 이용 안내 텍스트.

### 5.2. 메인 화면 (Main Screen)

* **Background:** `#000000` (검정색 단색).
* **Center Object:** 화면 정중앙 배치, 반응형 크기 조절.
* **Timer:** 우측 상단 배치, 고대비 색상 사용 (가독성 확보).
* **Real-time Feedback:** 시선 이탈 시 화면에 시각적 오버레이(Overlay) 표시.

### 5.3. 결과 화면 (Result Modal)

* 최종 기록 표시.
* 닉네임 입력 필드 (`input[type="text"]`).
* '기록 저장' 및 '다시 하기' 버튼.
* 실시간 랭킹 리스트 테이블.

---

## 6. 제약 사항 (Constraints & Exceptions)

1. **조명 환경:** 웹캠 기반 추적의 특성상, 저조도 환경에서는 인식률이 저하될 수 있음을 사용자에게 고지해야 한다.
2. **프라이버시:** 카메라는 실시간 좌표 추출 목적으로만 사용되며, 영상 데이터는 서버로 전송되거나 저장되지 않음을 명시한다.
3. **치팅 방지 (Anti-Cheating):** (Optional) 사진이나 동영상을 카메라에 비추는 행위를 방지하기 위해 눈 깜빡임(Blink Detection)을 주기적으로 감지하는 로직을 포함할 수 있다.