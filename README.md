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

- 기본 연출은 유지하며, 운영체제의 움직임 줄이기 설정에서는 워프 이동 연출을 생략하고 결과를 표시합니다.
- 봉인된 신호 화면은 클릭 또는 터치해야 다음 단계로 진행됩니다.
- 전체 일러스트 로딩 오류 또는 8초 지연 시 작은 미리보기로 대체합니다. 미리보기도 실패하면 결과 이름과 안내 문구가 남습니다.
- 10회 추첨은 큰 일러스트 열 장을 한꺼번에 미리 불러오지 않습니다.
- 연출 초기화가 실패하면 결과 화면으로 넘어갑니다.

기기별 문제를 확인할 때는 기기/브라우저 버전, 움직임 줄이기 설정, 멈춘 화면, 개발자 도구 오류를 기록하세요. 새 버전 배포 후 브라우저가 예전 HTML을 보관하고 있다면 새로고침이 필요합니다.

## 검증

로비 상단의 **세이브 내보내기·가져오기**에서 기록·천장·보유 목록·저장한 유물 세팅·파티를 JSON 파일로 옮길 수 있습니다. 다른 기기에서 아이디로 접속한 뒤 파일을 가져오면 해당 아이디에 적용됩니다. 자세한 범위와 파일 형식은 [세이브 이동 안내](docs/SAVE-TRANSFER.md)를 참고하세요.

Node.js가 설치된 환경에서:

```sh
node scripts/verify.mjs
node scripts/verify-local-profile.mjs
node scripts/verify-warp-prep.mjs
node scripts/verify-save-transfer.mjs
```

JS 구문, 로컬 리소스 경로와 대소문자, 카탈로그 일러스트, 이미지 대체 로직과 아이디별 로컬 저장을 확인합니다. 실제 모바일 브라우저의 시각 검증은 별도로 필요합니다.

기본 사이트는 서버 없이 실행됩니다. 회원가입·비밀번호 없이 저장용 아이디를 입력하면 워프 기록·천장·보유 목록·유물 세팅·저장 파티를 이 브라우저의 아이디별 localStorage에 보관합니다. 아이디는 1~30자의 한글·영문·숫자·밑줄·점·하이픈이며 영문 대소문자를 구분하지 않습니다. 같은 브라우저·같은 사이트 주소·같은 아이디로 다시 불러올 수 있고 다른 기기·브라우저와는 자동 연동되지 않습니다. 브라우저 사이트 데이터를 지우면 로컬 기록도 지워지므로 보관에 주의하세요. 기존 브라우저 저장 데이터는 초기화하지 않습니다.

`assets/js/backend-config.js`는 기본적으로 `baseUrl: ''`이며 API를 호출하지 않습니다. `backend/`의 Spring Boot + MySQL 계정 코드와 DB 파일은 향후 사용을 위해 보관합니다. 현재 아이디 접속 화면에서는 DB 계정 데이터를 불러오지 않으며, 백엔드를 다시 사용하려면 계정 화면과 서버 연결을 함께 복원해야 합니다. 이전 구성은 [백엔드 안내](backend/README.md)에 있습니다.

로컬 화면만 실행하려면 프로젝트 루트에서 `node scripts/serve-local.mjs`를 실행하고 `http://localhost:5500`에 접속하세요. 이 PC의 독립 실행 파일을 사용하려면 `tmp/runtime/node.exe scripts/serve-local.mjs`로 실행합니다. 정적 호스팅에서도 Java/MySQL 없이 사용할 수 있습니다.

API 통신 검증:

```sh
node scripts/verify-warp-api.mjs
```

## 정적 빌드와 배포

PC 화면은 QHD(2560×1440)의 구성을 기준으로 자동 배율을 적용합니다. FHD(1920×1080)는 75%, 4K(3840×2160)는 150%이며 브라우저의 실제 표시 영역에 맞춰 조절합니다. 비율이 다른 창에서도 UI는 같은 배율로 조절하고 캔버스의 가로·세로 공간을 확장해 브라우저 전체를 채웁니다. 좌우 검은 여백을 만들거나 전체 UI를 가로로 늘리지 않습니다. 배너·세이브 모달에도 같은 배율을 적용합니다. 가로 1024px 미만의 작은 창에서는 기존 반응형 화면을 사용합니다. PC 창의 높이가 낮아져도 자동 축소를 유지하며, 워프 화면의 일러스트는 상단 메뉴와 하단 버튼 사이에 전체가 들어오도록 표시합니다. 기준 해상도는 `assets/js/viewport-scale.js`의 `reference`에서 변경할 수 있습니다.

Tailwind v3.4.17을 개발 시 빌드하며, 실행 중에는 로컬 assets/css/tailwind.css만 불러옵니다. 기존 스타일을 유지하기 위해 v3를 고정했습니다.

npm ci, npm test, npm run build 순으로 실행합니다. GitHub Pages의 Source를 **GitHub Actions**로 설정하면 main push 시 .github/workflows/pages.yml이 dist/만 배포합니다. 이 폴더에는 index.html, assets와 기능에서 사용하는 참고 PDF만 포함됩니다. backend, scripts, tmp, 설정 파일은 포함하지 않습니다. 저장소 폴더를 직접 배포하는 기존 Pages 방식은 Actions 방식으로 전환해야 합니다.

## 저장과 보안

프로필은 비밀번호 없는 브라우저 저장 슬롯입니다. 기존 이름과 저장 키를 유지합니다. 가져오기는 512KB까지, 새 저장은 프로필 영역 합계 512K 문자까지 허용합니다. 복구 사본과 JSON 이스케이프를 포함한 번들은 1536K 문자까지이며 브라우저 전체 할당량이 작으면 더 일찍 실패할 수 있습니다. 실패한 쓰기는 기존 값을 유지합니다. 기존 큰 저장은 그대로 읽을 수 있고 크기 제한 없이 내보낼 수 있습니다. 큰 백업은 현재 가져오기 한도에 맞게 정리해야 가져올 수 있습니다. 세이브 관리에서 복구 사본 삭제와 현재 프로필 삭제를 지원하며 이름 입력으로 삭제를 확인합니다.

CSP는 외부 스크립트, 인라인 스크립트와 HTML 이벤트 속성 실행을 차단합니다. 동적 스타일과 기존 style 속성을 유지하기 위해 style-src에는 unsafe-inline을 허용하며 Google Fonts 두 호스트만 허용합니다. 기본 connect-src는 self입니다. 백엔드를 다시 연결할 때에는 서버 주소에 맞는 CSP 변경도 필요합니다. meta CSP에는 frame-ancestors를 적용할 수 없으므로 프레임 임베딩을 차단해야 하는 호스팅에서는 HTTP 응답 헤더를 별도로 설정하세요.
