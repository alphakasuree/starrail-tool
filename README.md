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
scripts/                   로컬 실행, 저장·리소스·API 검증
backend/                   향후 사용할 Spring Boot + MySQL 코드
tmp/runtime/               이 PC의 실행 도구·DB·설정 (Git 제외)
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
node scripts/verify-local-profile.mjs
```

JS 구문, 로컬 리소스 경로와 대소문자, 카탈로그 일러스트, 이미지 대체 로직과 아이디별 로컬 저장을 확인합니다. 실제 모바일 브라우저의 시각 검증은 별도로 필요합니다.

기본 사이트는 서버 없이 실행됩니다. 회원가입·비밀번호 없이 저장용 아이디를 입력하면 워프 기록·천장·보유 목록·유물 세팅·저장 파티를 이 브라우저의 아이디별 localStorage에 보관합니다. 아이디는 1~30자의 한글·영문·숫자·밑줄·점·하이픈이며 영문 대소문자를 구분하지 않습니다. 같은 브라우저·같은 사이트 주소·같은 아이디로 다시 불러올 수 있고 다른 기기·브라우저와는 자동 연동되지 않습니다. 브라우저 사이트 데이터를 지우면 로컬 기록도 지워지므로 보관에 주의하세요. 기존 브라우저 저장 데이터는 초기화하지 않습니다.

`assets/js/backend-config.js`는 기본적으로 `baseUrl: ''`이며 API를 호출하지 않습니다. `backend/`의 Spring Boot + MySQL 계정 코드와 DB 파일은 향후 사용을 위해 보관합니다. 현재 아이디 접속 화면에서는 DB 계정 데이터를 불러오지 않으며, 백엔드를 다시 사용하려면 계정 화면과 서버 연결을 함께 복원해야 합니다. 이전 구성은 [백엔드 안내](backend/README.md)에 있습니다.

로컬 화면만 실행하려면 프로젝트 루트에서 `node scripts/serve-local.mjs`를 실행하고 `http://localhost:5500`에 접속하세요. 이 PC의 독립 실행 파일을 사용하려면 `tmp/runtime/node.exe scripts/serve-local.mjs`로 실행합니다. 정적 호스팅에서도 Java/MySQL 없이 사용할 수 있습니다.

API 통신 검증:

```sh
node scripts/verify-warp-api.mjs
```
