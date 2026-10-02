# 스타레일 UID 연동

첫 화면에서 게임 UID(9~10자리 숫자)를 입력하면 공개 프로필을 조회합니다. 게임 프로필에서 캐릭터 전시와 상세 정보 공개를 설정하세요. `내 계정 · 캐릭터 관리`에서 닉네임, 개척·균형 레벨, 전시 캐릭터의 성혼, 장착 광추, 능력치와 유물을 확인하고 다시 조회할 수 있습니다.

조회된 캐릭터의 보유·성혼은 도감과 파티 추천에 반영됩니다. 전시하지 않은 캐릭터와 수동 입력은 유지합니다. 파티 추천의 전용 광추 S는 장착 광추와 뜻이 다르므로 자동 변경하지 않습니다. 전체 보유 목록, 재화, 실제 워프 기록·천장은 UID 공개 조회로 가져올 수 없습니다. UID는 계정 소유 인증이 아니며 다른 기기와 사이트 저장 데이터가 자동 동기화되지 않습니다.

UID별 기존 세이브는 유지하며 공개 프로필은 account 영역에 저장하여 백업·복구에 포함합니다. 기존 이름으로 저장한 데이터는 접속 방식의 `기존 로컬 프로필 열기`에서 열 수 있습니다. UID 연동 세이브의 이름은 바꿀 수 없습니다. 조회 실패 시 기존 저장 데이터를 덮어쓰지 않습니다.

## 로컬 실행

Windows에서는 프로젝트 폴더의 **스타레일 실행.cmd**를 더블 클릭하세요. UID 중계 서버를 숨김 실행하고 `http://localhost:5510`을 브라우저로 엽니다. 이미 실행된 서버는 재사용합니다. 로그는 `tmp/web/`에 저장됩니다. HTML을 `file://`로 직접 열어서는 UID 조회를 사용할 수 없습니다. 파일 화면과 웹 서버 화면의 브라우저 저장 공간은 다르므로 기존 파일 화면의 로컬 세이브는 백업 파일로 옮겨 주세요.

```powershell
node scripts/serve-local.mjs
# 이 PC의 Node 실행 파일을 사용할 경우
./tmp/runtime/node.exe scripts/serve-local.mjs
```

`http://localhost:5500`에서 실행하세요. 서버가 이미 실행 중이면 새 코드로 다시 시작해야 합니다. `/api/hsr/{uid}`가 [MiHoMo 공개 프로필 API](https://march7th.xyz/en/api/parsed.html)에 요청합니다. 브라우저에서 직접 API를 호출하면 CORS에 막히므로 중계 서버가 필요합니다. UID만 전송하며 비밀번호·HoYoLAB 쿠키는 사용하지 않습니다.

## GitHub Pages 자동 배포 — 최초 한 번 설정

GitHub Pages 사이트와 UID 중계 Worker를 `.github/workflows/pages.yml`에서 함께 배포합니다. `main`에 푸시하면 테스트 → Worker 배포 → 연결·CORS 검사 → Worker 주소·CSP가 반영된 사이트 빌드 → Pages 배포 순서로 실행됩니다. HTML과 API 주소를 직접 수정할 필요가 없습니다. Worker 인증 정보가 없거나 연결 검사가 실패하면 Pages 배포를 중단해 잘못된 주소의 사이트가 올라가지 않게 합니다.

1. [Cloudflare](https://dash.cloudflare.com/sign-up)에 가입하고 **Workers Free** 플랜을 사용합니다. Workers & Pages에서 `workers.dev` 서브도메인을 설정하세요. Worker 코드는 GitHub Actions가 생성·배포하므로 직접 복사하지 않아도 됩니다.
2. Cloudflare 계정의 **Account ID**를 확인합니다. Zone ID와 다릅니다.
3. [API 토큰 생성](https://dash.cloudflare.com/profile/api-tokens)에서 **Edit Cloudflare Workers** 템플릿을 선택하고 해당 계정에 한정해 토큰을 생성합니다. 생성 방법은 [공식 안내](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)를 참고하세요.
4. [GitHub 저장소 Secrets](https://github.com/alphakasuree/starrail-tool/settings/secrets/actions)에 아래 두 Repository secrets를 등록합니다. 토큰을 소스 코드나 채팅에 넣지 마세요.

| Secret 이름 | 값 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 생성한 API 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

5. GitHub 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정합니다.
6. 변경 코드를 `main`에 푸시하거나 **Actions → Deploy static site → Run workflow**를 실행합니다. 배포 완료 후 Pages에서 실제 UID로 접속합니다.

기본 Worker 이름은 `starrail-tool-uid`, 허용 사이트 origin은 `https://alphakasuree.github.io`입니다. GitHub 저장소의 owner/repo에서 자동 계산하므로 다른 저장소에서도 사용할 수 있습니다. 커스텀 도메인을 쓰면 Repository variable `UID_SITE_ORIGIN`에 `https://your-domain.example`처럼 origin만 등록하세요. Worker 이름을 변경하려면 variable `UID_WORKER_NAME`을 사용합니다.

### 비용과 컴퓨터 사용

UID 중계는 Cloudflare 서버에서 실행되며 본인 PC를 켜 둘 필요가 없습니다. **Workers Free**는 하루 100,000 요청까지 제공합니다. 무료 요청 한도를 넘으면 요청이 제한됩니다. 이 구성은 유료 플랜 전환, 도메인 구매, 유료 데이터베이스를 요구하지 않습니다. 가입 시 무료 플랜을 유지하세요. 요금 기준은 [Cloudflare 공식 문서](https://developers.cloudflare.com/workers/platform/pricing/)를 참고하세요. GitHub Actions는 일반 `ubuntu-latest` GitHub 호스팅 러너를 사용합니다. 공개 저장소와 Pages의 일반 러너 사용은 [GitHub 안내](https://docs.github.com/en/billing/concepts/product-billing/github-actions)에 따라 무료입니다.

### 이미 중계 서버가 있는 경우

Cloudflare 자동 배포 대신 Repository variable `UID_API_BASE_URL`에 `https://your-worker.workers.dev/api/hsr`를 등록하면 기존 중계를 사용합니다. 이 경우 두 Cloudflare Secrets는 없어도 됩니다. 해당 중계는 `/api/hsr/health`에 `{ "service": "honkai-uid-relay" }`를 반환하고 실제 사이트 origin에 대한 CORS를 허용해야 합니다. 제공된 `scripts/hsr-worker.mjs`가 이 동작을 구현합니다.

### 로컬에서 배포 결과만 만들기

```powershell
$env:UID_API_BASE_URL = 'https://YOUR-WORKER.workers.dev/api/hsr'
npm run build
```

API 주소·CSP는 `dist/`에만 반영됩니다. 소스의 로컬 서버 설정은 유지합니다. 서비스 워커 캐시도 배포 주소를 포함한 최종 파일로 생성됩니다.

Worker는 지정한 사이트 origin만 허용하며 임의 URL을 중계하지 않습니다. 외부 서비스가 점검 중이거나 요청 제한을 적용하면 UID 조회가 실패할 수 있습니다. 연동 서버 없는 정적 배포에서는 기존 로컬 프로필을 사용할 수 있습니다.
