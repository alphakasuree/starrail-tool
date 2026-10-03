# 명함 게임 아이콘

출처: [Mar-7th/StarRailRes](https://github.com/Mar-7th/StarRailRes).
게임 이미지 원저작자: HoYoverse / COGNOSPHERE.

`scripts/sync-spec-assets.mjs`로 캐릭터별 성혼 6단계, 속성, 운명의 길,
유물 이미지를 내려받고 `assets/js/spec-assets.js`의 대응 목록을 갱신한다.
이미지는 로컬에서 읽어 명함 PNG에도 포함한다. 유물은 UID 응답의 ID를
우선 사용하고, 이전 저장 데이터는 한국어 유물 이름으로 찾는다.
