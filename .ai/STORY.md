# STORY.md : 변경 이력 (Changelog)

## v0.1.1 (2026-02-13)
- **Rename**: 프로젝트 명칭 변경 ("See spinning fish" -> "Watch Spinning Fish").
    - `index.html` 타이틀 수정.
    - `SPEC.md` 프로젝트 명 업데이트.
    - 시작 버튼 텍스트 변경 (`SEE FISH` -> `WATCH FISH`).
    - 시선 추적 민감도 완화 (Threshold 0.4~0.6 -> 0.3~0.7).
    - 물고기 크기 20% 확대 (Max 360px -> 432px).

## v0.1.0 (2026-02-13)
- **Initial Release**: Spinning FishGaze Tracker 기본 기능 구현.
    - 웹캠 기반 실시간 얼굴 인식 및 시선 추적 (MediaPipe Face Mesh).
    - 중앙 응시 시 타이머 작동 및 물고기 회전 애니메이션 재생.
    - 오디오 피드백 (Funky Town BGM) 연동.
    - 눈 깜빡임 감지 (EAR 알고리즘) 적용.
    - LocalStorage 기반 Mock 랭킹 시스템 구현.
    - GitHub 리포지토리 생성 및 초기 코드 푸시.
    - 화면 중앙 객체를 Spinning Fish GIF에서 `Fish.mp4` 비디오로 교체 (CSS 애니메이션 제거 및 비디오 제어 로직 추가).
    - UI 디자인 수정: 배경색 흰색 변경, 비디오 크기 축소 (200px), 비디오 클리핑(원형 마스크) 제거.
    - 시각적 피드백 개선: 시선 이탈 시 붉은색 대신 검은색 틴트 적용, 오버레이 순서(z-index) 조정하여 비디오도 함께 어두워지도록 수정.
    - 전체 디자인 심플화(Minimalist Redesign): 네온/사이버펑크 스타일 제거, 모노톤(Black & White) 컬러 팔레트 적용, `Inter` 폰트 교체, UI 요소 간소화.
    - 프로젝트 명칭 변경: "The Gaze of Void" -> "**See spinning fish**".
    - 반응형/모바일 최적화: `style.css`에 미디어 쿼리 추가, 유동적 단위(%, vw/vh) 적용, `main.js`에 동적 캔버스 리사이징 및 모바일 카메라 설정 추가.
    - 페이지 제목 제거: `index.html`에서 `h1` 태그 삭제 및 관련 스타일 제거.
    - 카메라 비율 수정: `main.js`에서 캔버스가 비디오 해상도를 따르도록 변경하고, `style.css`에서 비율을 유지(`height: auto`)하도록 수정. 추가로 `resize` 이벤트를 감지하여 화면 회전 등 동적인 해상도 변화에도 대응하도록 개선.
    - 비디오 틴트 수정: 시선 이탈 시 비디오에만 이중으로 어둡게 적용되던 문제 해결.
    - 물고기 크기 확대: `style.css`에서 `#target-object`의 너비 및 최대 너비를 20% 증가 (`200px` 기준 -> `360px` max).
    - 디자인 정리: 카메라 화면(`output_canvas`) 테두리 제거 및 타이머 텍스트 색상 변경(네온 핑크/회색) 로직 제거.
    - 랭킹 시스템 연동: `src/main.js`에 `RankingManager`를 연결하여 게임 종료(`STOP`) 시 랭킹 모달이 뜨고, 기록을 저장(`local storage`)하거나 재시작할 수 있도록 구현.
    - 즉시 종료 모드: `STOP` 버튼을 삭제하고, 시선 이탈 시 게임이 즉시 종료되도록 변경.
    - 눈 깜빡임 허용: 눈을 깜빡이는 순간에도 게임이 일시정지되지 않고 타이머가 계속 흐르도록 로직 수정 (`isActive = isGazing || isBlinking`).
