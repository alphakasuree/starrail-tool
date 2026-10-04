# 키레네 무료 API 대화

방문자는 UID 또는 로컬 프로필로 입장한 뒤 오른쪽 아래 **키레네에게 이야기하기**에서 별도 설치 없이 대화합니다. UID·프로필 입력 화면에서는 대화 버튼을 숨기고 요청도 막습니다. 답변은 Gemini 3.1 Flash-Lite가 만들고, 방문자 PC는 일반 웹페이지 표시만 처리합니다. 기존 Ollama, 모델 다운로드와 로컬 AI 실행 스크립트는 제거했습니다.

## 무료 설정 및 실제 연결

1. [Google AI Studio](https://aistudio.google.com/api-keys)에서 **결제가 연결되지 않은 Free Tier 프로젝트**를 만들고 Gemini API 키를 발급합니다. 프로젝트의 실제 등급과 사용 가능 모델·한도를 확인합니다. 유료 전환이나 결제 계정 연결을 하지 않습니다.
2. GitHub 저장소 **Settings → Secrets and variables → Actions → Secrets**에 `GEMINI_API_KEY`를 등록하면 자동 배포가 Cloudflare Worker의 Secret으로 전달합니다. 기존 UID 중계 서버의 Cloudflare Worker에서 **Settings → Variables and Secrets**에 직접 Secret으로 등록할 수도 있습니다. GitHub에 키를 등록하지 않은 경우 자동 배포는 기존 Worker Secret을 유지합니다. 소스, 브라우저 설정이나 대화창에 키를 넣지 않습니다.
3. Google 프로젝트가 Free Tier이며 결제가 연결되지 않았음을 확인한 후 GitHub 저장소 **Settings → Secrets and variables → Actions → Variables**에 `GEMINI_FREE_TIER_CONFIRMED=1`을 추가합니다. 이 값이 없거나 `1`이 아니면 서버는 AI 요청을 보내지 않습니다.
4. 기존 [UID 배포 안내](UID-LINK.md)에 따라 Cloudflare **Workers Free** 계정으로 GitHub Actions 배포를 실행합니다. 기존 Worker에 SQLite Durable Object `ChatQuota`가 함께 생성되어 사이트 전체의 한도 소진 상태를 보관합니다. 이미 다른 중계 주소를 `UID_API_BASE_URL`로 지정한 경우 해당 서버에도 동일한 챗봇 코드와 설정을 배포해야 합니다.
5. 공개 사이트에 입장하여 키레네 대화창을 엽니다. 연결은 자동 확인하며 정상 상태의 연결 안내나 확인 버튼은 표시하지 않습니다. 등록되지 않은 키/설정과 한도 소진은 필요한 오류 안내를 표시합니다. 키는 배포된 정적 파일에 포함되지 않습니다.

**코드가 API 키만 보고 Google 프로젝트의 결제 연결 여부를 검증할 수는 없습니다.** 확인 값은 운영자의 확인을 의미합니다. 실제 과금 방지는 결제가 연결되지 않은 Google Free Tier 프로젝트와 Cloudflare Workers Free 계정으로 보장해야 합니다. 결제를 연결하면 같은 API가 유료로 처리될 수 있으므로 연결하지 않습니다. 무료 정책이 바뀌면 모델 제공 여부와 계정 등급을 다시 확인해야 합니다.

## 한도와 재개

- 방문자 모두가 Google 프로젝트의 무료 한도를 공유합니다. 개인별 무료 한도가 아닙니다.
- 고정 모델 하나만 호출하며 다른 키·모델로 전환하거나 자동 재전송하지 않습니다. 동시에 한 요청을 처리하며 사이트 전체에 6초의 최소 요청 간격을 둡니다.
- 제공자 429 응답에서 일일 한도 소진을 확인하면 다음 미국 태평양 시간 자정까지 차단합니다. 서머타임을 반영하며 한국에서는 보통 오후 4시/5시입니다. 분당 한도는 제공자가 알려 준 대기 시간(최소 60초)을 적용합니다. 한도 종류를 알 수 없으면 보수적으로 일일 차단합니다.
- 차단 상태는 Durable Object 저장소에 기록되어 새로고침이나 서버 재시작으로 사라지지 않습니다. 대화창을 열어 둔 경우 대기 만료 후 상태를 다시 조회해 보내기를 활성화합니다. 실제 Google 한도가 아직 남아 있지 않으면 다시 차단합니다.
- 무료 호출량은 Google AI Studio의 해당 프로젝트 한도를 따릅니다. 무제한 이용이나 특정 횟수를 보장하지 않습니다. Cloudflare 자체 무료 한도 소진도 일시 서비스 중단을 일으킬 수 있습니다.

## 대화와 개인정보

키레네를 바탕으로 한 팬 AI 역할극으로 전문 상담을 대신하지 않습니다. 대화는 브라우저 메모리에만 보관하고 닫기, Escape, 새로고침 시 지웁니다. 답변을 기다리는 동안 키레네 쪽 말풍선에 점 세 개가 움직이고, 답변이 도착하면 같은 말풍선에서 글자가 천천히 나타납니다. 긴 답변의 표시 시간은 최대 20초이며 동작 줄이기 설정에서는 즉시 표시합니다. 창을 닫거나 입력 화면으로 돌아가면 요청과 표시 효과를 중단합니다. 최근 최대 3쌍과 새 메시지, 합계 6,000자만 Google에 전달합니다. UID·프로필·세이브 데이터는 보내지 않습니다. 사이트와 Durable Object에는 대화 내용이나 API 응답을 저장하지 않습니다. Google 무료 API에서는 입력과 출력이 서비스 개선에 사용될 수 있으므로 민감한 개인정보는 입력하지 않습니다.

## 개발 및 검증

로컬 미리보기에는 프로젝트 루트의 `.env.chat`에 `GEMINI_API_KEY`, `GEMINI_FREE_TIER_CONFIRMED=1`을 설정하고 **스타레일 실행.cmd**를 실행합니다. `.env.chat.example`은 값 없는 양식입니다. `.env.chat`은 Git·정적 배포·웹 서버의 공개 파일에서 제외되며 Node 서버만 읽습니다. 이미 켜진 서버에 키를 추가하거나 변경했다면 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-web.ps1 -NoBrowser -Restart`로 다시 시작합니다. Node 환경에 같은 변수가 이미 있으면 환경 변수를 우선합니다. 로컬 미리보기의 차단 상태는 서버 메모리에만 유지되며 공개 배포는 Durable Object로 유지합니다.

`node scripts/verify-character-chat.mjs`는 제공자를 모의하여 차단·재개·재시작·서머타임·오류와 요청 제한을 검증하며 실제 API 호출이나 요금은 발생하지 않습니다. 실제 답변 품질과 공개 배포 연결은 운영자의 키 설정 후 확인해야 합니다.

공식 근거: [모델](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [무료 등급 및 결제](https://ai.google.dev/gemini-api/docs/billing), [사용 한도와 초기화](https://ai.google.dev/gemini-api/docs/rate-limits), [무료 API 데이터 사용 정책](https://ai.google.dev/gemini-api/docs/pricing), [Cloudflare 무료 Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/).
