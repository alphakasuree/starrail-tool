# 스타레일 워프 시뮬레이터

HTML, CSS, Vanilla JavaScript로 구성된 GitHub Pages 정적 사이트입니다. 진입점은 `index.html`입니다.

## 폴더 구조

```text
index.html                 사이트 진입점
assets/js/                 기능 코드와 실행용 카탈로그
assets/css/                기능별 스타일
assets/data/               카탈로그 원본 JSON
assets/images/             공통 이미지
assets/characters/         캐릭터 미리보기
assets/character-art/      캐릭터 전체 일러스트
assets/lightcones/         광추 미리보기
assets/lightcone-art/      광추 전체 일러스트
assets/paths/              운명의 길 아이콘 및 출처
assets/audio/              BGM, 음성 및 출처
docs/                      데이터 출처와 기능 설명
docs/references/           참고 PDF
scripts/                   리소스 및 워프 표시 회귀 검증
```

문서는 [캐릭터](docs/characters-README.md), [광추](docs/light-cones-README.md), [배너](docs/WARP-BANNERS.md), [음악](docs/WARP-MUSIC.md)을 참고하세요.

JS·CSS 경로를 이동하면 `index.html` 참조도 함께 수정하세요. JS 안의 이미지 경로는 JS 파일 위치가 아닌 `index.html`을 기준으로 해석됩니다. GitHub Pages에서는 파일명 대소문자가 정확히 일치해야 합니다.

## 워프 이미지와 애니메이션

- 윈도우 애니메이션 효과 및 ‘움직임 줄이기’ 설정과 관계없이 동일한 연출과 재생 시간을 유지합니다. CSS에서 결과 카드 기본 상태를 투명하게 만들지 마세요.
- 봉인된 신호 화면은 클릭 또는 터치해야 다음 단계로 진행됩니다.
- 전체 일러스트 로딩 오류 또는 8초 지연 시 작은 미리보기로 대체합니다. 미리보기도 실패하면 결과 이름과 안내 문구가 남습니다.
- 10회 추첨은 큰 일러스트 열 장을 한꺼번에 미리 불러오지 않습니다.
- 연출 초기화가 실패하면 결과 화면으로 넘어갑니다.

기기별 문제를 확인할 때는 기기/브라우저 버전, 움직임 줄이기 설정, 멈춘 화면, 개발자 도구 오류를 기록하세요. 새 버전 배포 후 브라우저가 예전 HTML을 보관하고 있다면 새로고침이 필요합니다.

## 검증

Node.js가 설치된 환경에서:

```sh
node scripts/verify.mjs
```

JS 구문, 로컬 리소스 경로와 대소문자, 카탈로그 일러스트, 이미지 대체 로직을 확인합니다. 실제 모바일 브라우저의 시각 검증은 별도로 필요합니다.

현재 기록은 브라우저의 프로필별 localStorage에 저장됩니다. 백엔드 마이그레이션은 아직 적용하지 않았습니다.
