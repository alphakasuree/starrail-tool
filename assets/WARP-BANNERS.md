# 한정 5성 워프 선택

워프 화면 위의 캐릭터/광추 탭에서 종류를 고르고 현재 픽업 버튼을 누르면 이미지 카드 선택창이 열린다. 이름 또는 배너명으로 검색할 수 있고, 이미지 카드를 누르면 픽업을 변경한다. 현재 선택에는 ‘선택 중’ 표시가 붙는다. 로비의 캐릭터·광추 카드도 선택한 픽업의 이미지, 배너명, 정보로 갱신되며 프로필에 저장된 선택을 불러올 때도 함께 갱신된다.

캐릭터 58종과 광추 58종이며, 펄과 Fate 콜라보 4종도 포함한다. 기간 종료된 배너도 시뮬레이터에서 선택할 수 있다. 상시 5성과 헤르타 상점 광추는 한정 픽업 대상이 아니다.

배너명과 최초 출시 당시 4성 픽업은 [Astravoy 배너 이력](https://astravoy.net/banners/history)의 이벤트 이름과 아이템 ID를 사용했다. 각 한정 5성의 대표 배너를 연결했다. 로비·선택창·워프 화면·기록의 배너명은 한국어로 표시하고 원래 영문명은 데이터의 `originalTitle`에 보존한다. 기존 저장 기록도 배너 ID로 현재 한국어명을 찾아 표시한다. 일반 광추는 실제 이벤트 형식인 ‘세월의 응고•광추명’, 콜라보 광추는 별도의 이벤트 이름을 사용한다. 데이터는 `warp-banner-data.js`에 있으며 실행 중 외부 요청은 필요하지 않다.

펄은 HoYoverse 한국어 4.6 버전 공지(ann_id 1437)에서 ‘창해에서 맺은 진주’, ‘세월의 응고•내일에 바치는 색채’와 픽업 명단을 확인했다. 캐릭터 4성은 청작/설의/미샤, 광추 4성은 수술 후의 대화/행성과의 만남/끝없는 춤이다. [공식 한국어 게임 공지 API](https://sg-hkrpg-api.hoyoverse.com/common/hkrpg_global/announcement/api/getAnnContent?game=hkrpg&game_biz=hkrpg_global&lang=ko-kr&bundle_id=hkrpg_global&channel_id=1&level=70&platform=pc&region=prod_official_asia&uid=0)는 현행 공지만 제공하므로 이후 버전에는 해당 공지가 사라질 수 있다.

콜라보 이름·천장 분리·4성 픽업 없음은 [공식 콜라보 공지 보관본](https://github.com/KQM-git/HSRNews/blob/master/archive/1148.md), 신규 콜라보 광추명은 [공식 4.4 공지 보관본](https://github.com/KQM-git/HSRNews/blob/master/archive/1333.md)을 참고했다. 린/길가메시 캐릭터 이벤트 이름은 [4.4 방송 정리](https://melanatedmedia2.wordpress.com/2026/07/05/honkai-star-rail-version-4-4-livestream-recap-in-ravages-does-the-whistle-sound/)와 [린 배너 안내](https://www.hsrzone.com/characters/rin-tohsaka-hsr-build-4-4/)에서 교차 확인했다.

캐릭터 이벤트끼리, 광추 이벤트끼리 천장·확정 상태와 기록을 공유한다. 콜라보 캐릭터/광추는 각각 별도 그룹으로 저장하며 4성 확률 UP을 적용하지 않는다. 선택한 픽업과 천장은 현재 프로필에 저장되며 이전 저장 데이터도 읽는다. 연출 중에는 배너 변경을 잠근다.

확률과 비픽업 5성은 기존 시뮬레이터 규칙(캐릭터 90회/50%, 광추 80회/75%, 상시 7종)을 사용한다. 게임의 사용자 설정 비픽업 풀, 성혼 초과 보상, 콜라보 누적 워프 보상은 구현하지 않는다.

한국어 이벤트 이름은 캐릭터별 [배너 다국어 표](https://honkai-star-rail.fandom.com/wiki/Butterfly_on_Swordtip), [한국어 이벤트 목록](https://namu.moe/w/붕괴:%20스타레일/워프/캐릭터%20이벤트%20워프), [나찰 출시 공지 보도](https://www.inven.co.kr/webzine/news/?news=286188) 등을 대조했다. 공식 한국어 이벤트명을 확인하지 못한 콜라보 광추 두 개는 실제 영문명 Kaleidic Coruscation / Age of Gods Golden Gate를 각각 ‘만화경의 광휘’ / ‘신대의 황금문’으로 번역했다. 이 둘은 `titleSource: translation-of-original`로 구분하며 공식 한국어명으로 확정한 표기가 아니다.
