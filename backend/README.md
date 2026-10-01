# Spring Boot 워프 백엔드

Java 17, Spring Boot 3.5.16, Spring Data JPA, Spring Security, Flyway, MySQL 8.4로 구성됩니다. 프론트엔드 화면과 워프 연출을 유지하고, 서버가 추첨·천장·기록을 관리합니다.

## 시작하기

Docker Desktop이 설치된 환경에서는 이 폴더에서:

```powershell
Copy-Item .env.example .env
# .env의 DB 비밀번호 두 개를 서로 다른 임의 값으로 수정
docker compose up --build -d
```

로컬 API는 `http://localhost:8080`입니다. MySQL은 외부 포트를 공개하지 않으며 데이터는 `mysql-data` 볼륨에 남습니다. DB 생성 시 utf8mb4가 기본인 MySQL 8.4를 사용합니다. Flyway가 스키마와 현재 카탈로그를 자동으로 적용합니다. 기존 데이터를 지우는 볼륨 삭제 명령은 실행하지 마세요.

이미 MySQL이 있고 Docker 없이 실행하려면 `honkai` DB를 utf8mb4로 만들고 Java 17 및 Maven을 설치한 뒤 다음을 실행합니다.

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/honkai?connectionTimeZone=UTC'
$env:DB_USERNAME = 'honkai'
$env:DB_PASSWORD = '실제 DB 비밀번호'
$env:FRONTEND_ORIGINS = 'http://localhost:5500,http://127.0.0.1:5500'
mvn test
mvn spring-boot:run
```

## 프론트엔드 연결

`assets/js/backend-config.js`의 `baseUrl`을 서버 주소로 설정합니다. 로컬 테스트는 `http://localhost:8080`, GitHub Pages 배포는 별도로 배포한 HTTPS 서버 주소를 사용하세요. `baseUrl`에는 `/api`를 붙이지 않습니다. 빈 문자열이면 기존 localStorage 모드로 동작합니다. 서버가 켜진 모드에서 통신 실패 시 로컬 추첨으로 전환하지 않습니다.

GitHub Pages는 Java 프로세스나 MySQL을 실행하지 못하므로 서버 호스팅이 별도로 필요합니다. 운영 API는 HTTPS 역방향 프록시 또는 호스팅 플랫폼에 연결하고 `FRONTEND_ORIGINS=https://alphakasuree.github.io`처럼 정확한 Origin을 지정합니다. 저장소 경로 `/starrail-tool/`은 Origin에 포함하지 않습니다. 예제 Compose의 API 포트는 로컬에서만 접근할 수 있게 바인딩되어 있습니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/health` | 실행 상태 |
| POST | `/api/profiles` | 새 브라우저 프로필과 비밀 토큰 생성 |
| GET | `/api/warp/progress` | 천장, 기록, 선택 배너, 보유 목록 |
| POST | `/api/warp/pull` | 서버에서 1회 또는 10회 추첨 |
| PUT | `/api/warp/selection` | 선택한 캐릭터·광추 배너 저장 |

프로필 생성 요청은 `{ "displayName": "친구1" }`입니다. 응답의 `token`은 최초 한 번 전달되며, 이후 보호된 API에 `Authorization: Bearer <token>`으로 전송합니다. DB에는 토큰 원문 대신 SHA-256 해시를 저장합니다. CORS가 인증을 대신하지 않습니다.

추첨 요청:

```json
{
  "requestId": "4fe3925d-bd06-4a3e-9664-2bb84d9c5ccd",
  "bannerKey": "character:1503",
  "count": 10,
  "expectedRevision": 0
}
```

`bannerKey`는 종류와 픽업 ID를 결합합니다. 콜라보는 배너 마스터에 따라 별도 천장 그룹으로 처리합니다. 아이템, 확률, 시간, 최종 천장은 클라이언트가 지정하지 않습니다. 사용자 행 잠금으로 동시 추첨을 직렬화하고 기록과 천장을 한 트랜잭션으로 저장합니다. UUID와 요청 내용이 같으면 이미 저장된 결과를 반환합니다. 버전이 오래됐거나 같은 UUID의 내용이 다르면 409입니다.

## 현재 범위와 데이터 보관

- 같은 표시 아이디라도 다른 브라우저에서 새로 생성하면 별도 프로필입니다. 동일 브라우저·Origin에서는 아이디별 토큰을 저장해 다시 접속합니다.
- 이 방식은 익명 브라우저 프로필입니다. 로그인 화면을 유지하기 위한 초기 연결이며 이메일/비밀번호 로그인이나 계정 복구는 제공하지 않습니다. 토큰은 180일 후 만료됩니다. 토큰 유실·만료 시 이름만으로 기록을 복구할 수 없습니다. 장기 운영 및 기기 간 계정 연동 전에는 인증/갱신/복구 기능을 추가하세요.
- 서버 모드에서는 토큰과 미확인 요청의 UUID만 브라우저에 보관합니다. 확정된 워프 기록·천장·보유 목록은 DB가 원본입니다. 미확인 요청은 같은 UUID로 재전송하며 새로고침 시 먼저 확인합니다.
- 기존 localStorage 기록은 삭제하거나 자동으로 DB에 업로드하지 않습니다. 서버 모드의 워프 기록은 별도로 시작합니다. 기존 기록 가져오기는 별도 기능입니다.
- 유물 세팅·저장 파티는 기존 localStorage 방식을 유지합니다. 이번 서버 연결 범위는 워프입니다.
- 현재 `/progress`는 기존 화면과 호환되도록 전체 기록을 반환합니다. 장기 운영에서 기록이 늘어나면 페이지 API와 화면의 페이지 로딩을 함께 추가해야 합니다.
- DB 스키마/시드: `src/main/resources/db/migration/`. V2에는 현재 카탈로그 268개, 배너 116개가 포함됩니다. 배포 후 이미 적용된 SQL 파일을 수정하지 말고 V3 이상의 마이그레이션을 추가하세요. 새 카탈로그 배포는 서버와 프론트엔드를 함께 갱신해야 합니다.
- 카탈로그 대조용 SQL은 저장소 루트에서 `node scripts/generate-backend-catalog.mjs`로 `tmp/catalog.sql`에 생성할 수 있습니다. 이 전체 INSERT를 기존 DB에 그대로 적용하지 말고, 변경분을 별도 마이그레이션으로 작성하세요.
- 공개 운영에서는 프로필 생성 및 추첨에 요청 제한을 적용하세요. DB 비밀번호와 토큰을 저장소에 커밋하지 마세요.

## 검증

```sh
mvn test
mvn package
```

테스트 DB는 H2의 MySQL 호환 모드입니다. 실제 마이그레이션 SQL, 인증/CORS, 중복 요청, 동시 요청, 천장 규칙을 검사합니다. 실제 MySQL 환경의 배포 검증은 별도로 필요합니다.

Spring 공식 문서: [Spring Data JPA 잠금](https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html), [Spring MVC CORS](https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html).
