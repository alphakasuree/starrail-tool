# Spring Boot + MySQL 계정 백엔드

> **현재 기본 사이트는 서버 없는 아이디 접속 + localStorage 방식입니다.** 아래 계정·배포 구성은 향후 재사용을 위해 보관한 백엔드 설명입니다. 현재 프런트는 `baseUrl: ''`이며 이 API를 사용하지 않습니다. 정적 화면만 실행하는 방법은 루트 README를 참고하세요. 기존 DB 데이터는 보관되며 현재 화면으로 자동 이전하거나 표시 이름으로 병합하지 않습니다. 백엔드 재활성화 시 계정 화면과 서버 연결도 함께 복원해야 합니다.

Java 17, Spring Boot 3.5.16, Spring Security, JPA, Flyway, MySQL 8.4를 사용합니다. 워프 기록·천장·보유 목록·유물 세팅·저장 파티를 계정별 DB에 보관하며, 같은 로그인 아이디와 비밀번호로 다른 기기에서 불러올 수 있습니다.

## 로컬 실행

이 PC에는 `tmp/runtime/`에 MySQL 8.4.9, Maven 3.9.11, Node.js 22.20.0 실행 파일이 준비되어 있습니다. Java 17이 필요합니다. 프로젝트 루트에서:

```powershell
# 종료 후 테스트·빌드·실행 (실행 중인 JAR는 Windows에서 교체할 수 없습니다)
powershell -NoProfile -ExecutionPolicy Bypass -File backend/stop-local.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File backend/start-local.ps1 -Build

# 이미 빌드했다면 시작만
powershell -NoProfile -ExecutionPolicy Bypass -File backend/start-local.ps1

# 종료
powershell -NoProfile -ExecutionPolicy Bypass -File backend/stop-local.ps1
```

- 웹: `http://localhost:5500` (회원가입/로그인 화면)
- API 상태: `http://localhost:8080/api/health`
- MySQL: `127.0.0.1:3306`

세 프로세스 모두 loopback에만 바인딩합니다. 시작 스크립트는 HTTP 개발용으로 `SESSION_COOKIE_SECURE=false`, `SESSION_COOKIE_SAME_SITE=Lax`를 프로세스에 설정합니다. `localhost`와 `127.0.0.1`은 쿠키가 서로 공유되지 않으므로 웹과 API의 호스트 이름을 맞춥니다. 프런트 설정은 이를 자동으로 처리합니다.

첫 실행 시 서로 다른 임의 DB 비밀번호를 `backend/.env`에 생성합니다. DB 파일은 **`tmp/runtime/mysql-data/`**에 저장되므로 삭제하지 마세요. `.env`도 함께 보관하세요. Windows MySQL의 한글·공백 경로 문제를 피하기 위해 TEMP에 runtime을 가리키는 junction을 만들며 실제 데이터는 프로젝트 안에 남습니다. 재부팅 후에는 시작 명령을 다시 실행합니다.

로그는 `tmp/runtime/mysql-error.log`, `api.log`, `api-error.log`, `frontend.log`에 있습니다. 로컬 웹 서버는 `index.html`, `assets/`, 공개 참고 PDF만 제공하며 `.env`, `backend/`, `tmp/`는 제공하지 않습니다.

새 PC에서 실행 파일을 준비하려면:

```powershell
New-Item -ItemType Directory -Force tmp/runtime | Out-Null
Invoke-WebRequest https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.9-winx64.zip -OutFile tmp/runtime/mysql.zip -UseBasicParsing
Invoke-WebRequest https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/apache-maven-3.9.11-bin.zip -OutFile tmp/runtime/maven.zip -UseBasicParsing
Invoke-WebRequest https://nodejs.org/dist/v22.20.0/win-x64/node.exe -OutFile tmp/runtime/node.exe -UseBasicParsing
Expand-Archive tmp/runtime/mysql.zip -DestinationPath tmp/runtime
Expand-Archive tmp/runtime/maven.zip -DestinationPath tmp/runtime
powershell -NoProfile -ExecutionPolicy Bypass -File backend/start-local.ps1 -Build
```

## 회원가입, 세션, 기존 데이터 이전

로그인 아이디는 영문 소문자·숫자·`_.-`의 3~30자이며 대소문자를 구분하지 않고 DB UNIQUE 제약으로 중복을 방지합니다. 표시 이름은 별도의 1~30자입니다. 같은 표시 이름의 계정을 합치지 않습니다. 비밀번호는 10자 이상·UTF-8 72바이트 이하이며 Spring Security bcrypt(cost 12)로 해시합니다. 계정 생성/로그인 응답에 비밀번호·해시·세션 토큰을 넣지 않습니다.

세션은 임의 256비트 토큰의 SHA-256 해시를 DB에 저장하고 원문은 HttpOnly 쿠키에만 전달합니다. 기본 유효 시간은 12시간, 절대 수명은 로그인 후 30일입니다. 갱신은 유효한 세션만 허용하고 토큰을 교체하며 절대 만료 시각을 연장하지 않습니다. 프런트는 만료 5분 전에 갱신합니다. 만료되면 다시 로그인하며, 로그아웃은 현재 브라우저 세션을 DB에서 폐기하고 쿠키를 지웁니다. 다른 기기의 로그인은 유지됩니다. 여러 탭의 갱신이 동시에 발생하면 교체 전 쿠키를 보낸 탭은 재로그인/새로고침이 필요할 수 있습니다.

계정 토큰·비밀번호를 localStorage, URL, 로그에 쓰지 않습니다. DTO의 문자열 출력은 마스킹하고, 요청 상세·인증 관련 디버그 로그와 Hibernate 바인딩 로그를 억제합니다. 비밀을 포함하는 request/response body, Cookie, Authorization, Set-Cookie를 프록시나 APM에서 별도로 기록하지 마세요.

POST/PUT은 `X-Honkai-Client: web` 헤더와 명시적인 Origin 허용 목록으로 CSRF를 방어합니다. 쿠키 인증 CORS는 `allowCredentials=true`이며 와일드카드 Origin을 사용하지 않습니다. 브라우저의 `X-Honkai-Account` 헤더는 탭의 계정과 쿠키의 계정이 일치하는지 검사하는 값이며 권한 근거가 아닙니다. 모든 데이터 조회·변경의 소유자는 서버가 검증한 세션 principal로 결정합니다. 요청에 다른 계정 ID를 넣어도 소유자가 바뀌지 않습니다.

로그인 실패는 DB에서 아이디별 5회, 접속 IP별 20회/15분으로 제한하며 이후 15분간 HTTP 429를 반환합니다. 없는 아이디도 bcrypt 검증을 수행하고 비밀번호 오류와 같은 401 메시지를 반환합니다. IP는 애플리케이션의 실제 `remoteAddr`를 사용합니다. 기본적으로 임의 `X-Forwarded-For`를 신뢰하지 않습니다.

기존 데이터를 옮기는 절차:

1. 예전에 사용하던 **같은 브라우저·Origin**에서 회원가입을 선택합니다.
2. 회원가입의 **기존 익명 프로필 전환**에서 프로필을 선택합니다. 브라우저에 보관된 유효한 기존 bearer 토큰을 서버가 검증합니다. 같은 DB 프로필을 계정으로 전환하므로 워프 기록·천장·보유 목록이 유지됩니다. 전환 후 그 프로필의 모든 익명 토큰은 폐기합니다.
3. 로그인 후 로비의 **이 브라우저의 유물·파티 가져오기**에서 원본 프로필을 선택하고 가져오기를 누릅니다. 자동 가져오기/삭제를 하지 않습니다.

가져오기는 계정별로 payload 해시를 기록하며 같은 요청을 다시 보내도 중복 반영하지 않습니다. 유물은 저장 항목 ID, 파티는 순서가 있는 네 캐릭터 ID로도 중복을 방지합니다. 기존 서버 항목을 덮어쓰지 않습니다. 같은 가져오기 데이터가 삭제 뒤 다시 제출되어도 동일 영수증이 있으면 재생성하지 않습니다. 유물·파티 각각 200개, 각 문서 최대 256KB를 허용하고 구조·숫자·캐릭터 ID를 검증합니다. 저장은 `expectedRevision`을 비교해 오래된 기기의 덮어쓰기를 409로 거절합니다.

이전 코드의 localStorage 초기화/전체 프로필 삭제 로직을 제거했습니다. 기존 localStorage 원본과 익명 세션 항목을 보관합니다. 이미 과거 초기화 코드로 삭제된 데이터나 토큰이 유실·만료된 익명 프로필은 표시 이름만으로 복구할 수 없습니다. 서버 토큰이 없는 로컬 워프 기록은 검증 가능한 서버 기록으로 자동 병합하지 않습니다. 유물·파티는 사용자가 선택한 로컬 데이터만 가져옵니다.

## API

모든 요청 본문은 JSON입니다. 계정 세션 쿠키의 이름은 `honkai_session`, Path는 `/api`이며 Domain을 지정하지 않습니다. 프런트는 `credentials: 'include'`로 요청합니다.

| 메서드 | 경로 | 역할 |
| --- | --- | --- |
| POST | `/api/auth/register` | `{loginId, displayName, password}`로 새 계정 |
| POST | `/api/auth/login` | `{loginId, password}`로 로그인 |
| GET | `/api/auth/me` | 현재 계정과 만료 시각 |
| POST | `/api/auth/refresh` | 현재 세션 갱신/교체 |
| POST | `/api/auth/logout` | 현재 세션 폐기 |
| POST | `/api/auth/upgrade` | register 본문 + 기존 `Authorization: Bearer ...`로 전환 |
| GET | `/api/account/documents` | 유물·파티 문서와 각 revision |
| PUT | `/api/account/documents/relic` | `{entries: [...], expectedRevision}` |
| PUT | `/api/account/documents/teams` | `{entries: [...], expectedRevision}` |
| POST | `/api/account/import` | `{relic: [...], teams: [...]}` 가져오기 |
| GET | `/api/warp/progress` | 계정의 천장·기록·보유·선택 픽업 |
| POST | `/api/warp/pull` | 서버에서 1회/10회 추첨 |
| PUT | `/api/warp/selection` | 선택 픽업 저장 |
| GET | `/api/health` | 프로세스 상태 |

새 익명 프로필 생성 `/api/profiles`는 410을 반환합니다. 기존 유효한 익명 토큰은 전환 전까지 자기 워프 데이터에만 접근할 수 있습니다. 계정 유물·파티 API는 익명 토큰을 허용하지 않습니다.

추첨 요청은 `{requestId: UUID, bannerKey: 'character:1503', count: 10, expectedRevision: 0}` 형식입니다. 확률·시간·결과는 서버가 결정합니다. 프로필 행 잠금으로 동시 추첨을 직렬화하고 같은 UUID/내용은 저장된 결과를 반환합니다. 다른 내용으로 UUID를 재사용하거나 상태 버전이 오래되면 409입니다. 프런트는 미확인 추첨 UUID를 계정별로 브라우저에 보관하고 재접속 때 같은 요청으로 결과를 확인합니다.

## 마이그레이션과 테스트

V1/V2는 수정하지 않았습니다. **V3__accounts.sql**은 로그인 아이디·bcrypt 해시, 계정 세션, 유물·파티 문서, 가져오기 영수증, 로그인 제한 테이블을 추가합니다. 기존 익명 프로필의 계정 컬럼은 NULL로 유지됩니다. 카탈로그는 아이템 268개·배너 116개입니다. 적용된 SQL은 수정하지 말고 새 V4 이상을 추가하세요.

프로젝트 루트에서:

```powershell
tmp/runtime/node.exe scripts/verify.mjs
tmp/runtime/node.exe scripts/verify-warp-api.mjs

# 기본 H2 MySQL 호환 DB: backend 폴더에서 mvn test
# 실제 MySQL: 별도 honkai_account_test DB를 생성하고 전체 테스트
powershell -NoProfile -ExecutionPolicy Bypass -File backend/test-mysql.ps1

# 실행 중인 API와 독립 쿠키 저장소를 이용한 HTTP 검증
tmp/runtime/node.exe scripts/smoke-backend.mjs
# DB/API 종료·재시작 후 비밀번호 로그인과 모든 데이터 유지 검증
tmp/runtime/node.exe scripts/smoke-backend.mjs --resume
```

현재 Java 테스트 22개는 계정 연동·격리, bcrypt, 아이디 중복, 잘못된 비밀번호, 아이디/IP 실패 제한, 세션 만료/절대 만료/갱신/로그아웃, 유효·만료된 익명 프로필 전환, 중복 가져오기, 입력/CSRF 검증, 저장 버전 충돌, 동시 추첨과 UUID 중복, 기존 추첨 규칙을 검사합니다. 실제 MySQL 테스트는 기존 서비스 DB 대신 `honkai_account_test`를 사용하며 테스트 계정만 추가합니다.

HTTP 검증은 테스트 계정을 생성하고 재시작 비교용 무작위 테스트 비밀번호와 스냅샷을 **Git에서 제외된** `tmp/runtime/account-smoke.json`에 보관합니다. 사용자 비밀번호를 사용하지 않으며 콘솔에 출력하지 않습니다. 연결된 브라우저가 없어 시각적 UI 자동 검증은 수행하지 못했습니다. 공개 전 실제 Chrome/Safari/모바일에서 회원가입·가져오기·쿠키 동작을 확인하세요.

## 공개 배포 구성 (아직 배포하지 않음)

권장 구성은 **같은 HTTPS Origin의 정적 사이트 + `/api` 역방향 프록시 + 비공개 MySQL**입니다. GitHub Pages 자체에서 Java/MySQL을 실행할 수 없으므로 별도의 서버가 필요합니다. 서버에 Docker Compose 또는 Java 17/MySQL을 준비하고 DNS와 80/443 포트를 설정하세요.

`backend/.env.example`을 `.env`로 복사하고 DB 비밀번호를 서로 다른 긴 임의 값으로 설정합니다. `.env`는 커밋하지 않습니다. Docker를 쓰면 backend 폴더에서 `docker compose up --build -d`를 실행합니다. MySQL 포트는 호스트에 공개하지 않고 API는 `127.0.0.1:8080`에 바인딩됩니다. 로컬 HTTP Compose 개발에만 `SESSION_COOKIE_SECURE=false`를 지정합니다.

| 환경변수 | 운영 값 / 의미 |
| --- | --- |
| `MYSQL_DATABASE`, `MYSQL_USER` | DB/최소 권한 애플리케이션 계정 |
| `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` | 서로 다른 임의 비밀번호; 비밀 저장소 또는 미추적 `.env` |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Compose 밖에서 실행할 때 JDBC 연결 값 |
| `FRONTEND_ORIGINS` | 정확한 `https://example.com`; 경로 없이 Origin만, 쉼표로 구분 |
| `SESSION_COOKIE_SECURE` | **true** |
| `SESSION_COOKIE_SAME_SITE` | 같은 사이트는 **Lax** 또는 Strict; 다른 사이트는 None + Secure 필요 |
| `SESSION_HOURS` | 12 (유효 세션 시간) |
| `SESSION_ABSOLUTE_DAYS` | 30 (로그인 후 절대 수명) |
| `SERVER_ADDRESS`, `PORT` | 직접 Java 실행 시 `127.0.0.1`, `8080` |

`assets/js/backend-config.js`의 운영 `baseUrl`은 `https://example.com` 또는 같은 Origin인 `globalThis.location.origin`으로 설정하며 `/api`는 붙이지 않습니다. 값이 비어 있는 외부 사이트에서는 계정 로그인할 수 없습니다. 통신 실패 시 로컬 추첨/로컬 저장으로 바꾸지 않습니다.

예시 Caddyfile (도메인/경로를 실제 값으로 변경):

```caddyfile
example.com {
    handle /api/* {
        reverse_proxy 127.0.0.1:8080
    }
    @public path / /index.html /assets/* /docs/references/*.pdf
    handle @public {
        root * /srv/honkai/public
        file_server
    }
    respond 404
}
```

`/srv/honkai/public`에는 index, assets, 공개 PDF만 복사합니다. 저장소 루트 전체를 정적 공개하지 않습니다. Caddy의 자동 HTTPS는 실제 도메인 DNS와 접근 가능한 80/443이 필요합니다. 프록시와 애플리케이션 사이의 8080/DB는 외부에서 차단합니다. 운영에서 Cookie/Authorization/body를 기록하는 프록시·APM 설정을 사용하지 않습니다. 기본 프록시 접근 로그도 query string을 남기지 않도록 별도로 설정하세요.

리버스 프록시 환경에서 현재 앱 IP 제한은 프록시 IP 기준으로 합산됩니다. 실제 클라이언트 IP별 제한이 필요하면 프록시에서 추가 제한을 적용하거나 **프록시만 신뢰하도록** Tomcat RemoteIpValve/신뢰 CIDR을 구성하고, 외부가 직접 백엔드에 접근하지 못하게 해야 합니다. 무조건 `X-Forwarded-For` 첫 값을 사용하지 마세요.

GitHub Pages와 다른 사이트의 API를 조합하면 `SameSite=None; Secure`와 정확한 CORS가 필요하지만 브라우저의 제3자 쿠키 차단으로 로그인이 실패할 수 있습니다. 같은 Origin 배포를 권장합니다.

공개 전 남은 작업: 실제 호스팅·도메인·TLS 인증서, 프록시 요청 제한/신뢰 IP, DB 백업과 복구 검증, 마이그레이션 전 백업, 비밀 주입, 프로세스 재시작/상태 감시, 실제 브라우저 검증. `/api/health`는 프로세스 응답이며 DB 연결을 매번 점검하지 않습니다. 장기 운영에서는 만료 세션·로그인 제한 버킷·가져오기 영수증의 보관/정리 정책과 워프 기록 페이지네이션이 필요합니다.

이번 범위에는 이메일 인증, 비밀번호 변경/재설정·계정 복구, 계정 삭제, 모든 기기 로그아웃, MFA가 없습니다. 가입/추첨 전체 트래픽 제한과 CAPTCHA도 별도 운영 작업입니다. 유물·파티는 로그인/새로고침/명시적 동기화 시 불러오며 실시간 push 동기화는 제공하지 않습니다.

근거 문서: [Spring Security 비밀번호 저장](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html), [OWASP API custom-header CSRF 방어](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [OWASP 세션 관리](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Caddy 자동 HTTPS](https://caddyserver.com/docs/automatic-https).
