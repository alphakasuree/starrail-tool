// User-provided source: 붕스 세팅정리의 사본 - 세팅.pdf; 붕괴 : 스타레일 세팅 4.6V; 수정: 네이드, ode
const relicReferenceExtraCharacters = [{"id": "reference-aha", "name": "에이언즈★아하", "pathName": "환락", "elementName": "표 기준", "path": "Elation", "image": "assets/images/relic-aha.png"}];
const relicBuildReference = {
  "1102": {
    "name": "제레",
    "page": 1,
    "pageStart": 1,
    "role": "단일 딜러",
    "useful": "치확,치피 / 공격력 / 속도",
    "rawTargets": "공 3200 / ⁴⁾ 공 3600 / 공 2700 / ⁴⁾ 공 3100",
    "rawCrit": "³⁾ 80 / 160 / 100 / 140",
    "notes": "¹⁾ 마을 속도 131.3 이상일 때 전광 풀버프 가능 / ²⁾ 스파클 조합 필수 / ³⁾ 선데이 조합 시 치확 80%까지 / ⁴⁾ A/S 이후 공구체 우세",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3200.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1201": {
    "name": "청작",
    "page": 1,
    "pageStart": 1,
    "role": "확산 딜러",
    "useful": "치확,치피 / 공격력 / 속도",
    "rawTargets": "공 3000 / 속도 미만 ¹⁾ 95",
    "rawCrit": "100 / 150 / ¹⁾ 68 / 200",
    "notes": "¹⁾ 시인셋 기준",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 150.0,
        "mode": "min"
      }
    ]
  },
  "1006": {
    "name": "은랑",
    "page": 1,
    "pageStart": 1,
    "role": "디버퍼",
    "useful": "속도, 효과명중",
    "rawTargets": "효명 67% / 속도 166.7 + / 효명 67% / 속도 최대한",
    "rawCrit": "",
    "notes": "¹⁾ 매셋 착용 시 필살기 가동률을 위해 권장",
    "weights": {
      "spd": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "ehr",
        "value": 67.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 166.7,
        "mode": "min"
      }
    ]
  },
  "1208": {
    "name": "부현",
    "page": 1,
    "pageStart": 1,
    "role": "탱커 / (데미지 분담)",
    "useful": "HP / 속도 / 효과저항 / 방어력",
    "rawTargets": "HP 8000 / 속도 133.4 +",
    "rawCrit": "",
    "notes": "¹⁾ 아케론 등 디버프 필요 조합에서 사용",
    "weights": {
      "spd": 1,
      "hp": 1,
      "def": 1,
      "res": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 8000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "1110": {
    "name": "링스",
    "page": 1,
    "pageStart": 1,
    "role": "힐러",
    "useful": "HP / 속도 / 방어력",
    "rawTargets": "HP 5000 / 속도 160 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "hp": 1,
      "def": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 5000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1214": {
    "name": "설의",
    "page": 1,
    "pageStart": 1,
    "role": "확산 딜러 / (격파) / 확산 딜러 / (치명타)",
    "useful": "²⁾ 치확,치피 / 공격력 / 속도 / 격파특수효과",
    "rawTargets": "격특 200% / 속도 145",
    "rawCrit": "",
    "notes": "¹⁾ 달리아 조합 시 / ²⁾ 순수 격특딜러로 사용 시 치명타 유기",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "break",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 145.0,
        "mode": "min"
      }
    ]
  },
  "1306": {
    "name": "스파클",
    "page": 1,
    "pageStart": 1,
    "role": "서포터 / (행동게이지)",
    "useful": "속도 / 치명타 피해",
    "rawTargets": "속도 133.4 + / 속도 167.4 +",
    "rawCrit": "치피 200",
    "notes": "¹⁾ 167.4속 3행동 세팅 시 댄댄 필수 / ²⁾ 1돌 매 전광 사용 시 속도 이상 + 168.3",
    "weights": {
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 200.0,
        "mode": "min"
      }
    ]
  },
  "1314": {
    "name": "제이드",
    "page": 1,
    "pageStart": 1,
    "role": "광역 딜러 / (추가공격)",
    "useful": "치확,치피 / 공격력",
    "rawTargets": "공 3200",
    "rawCrit": "²⁾ 100 / 80",
    "notes": "¹⁾ 시인 착용 시 속도 부옵션 0개 필수 / ²⁾ 특성으로 치피 자버프 가능. 120%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3200.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 80.0,
        "mode": "min"
      }
    ]
  },
  "1403": {
    "name": "트리비",
    "page": 1,
    "pageStart": 1,
    "role": "서포터 / 디버퍼 / (추가공격)",
    "useful": "치확, 치피 / HP / 속도 / 치확, 치피, HP",
    "rawTargets": "속도 미만 95 / HP 6000 / ¹⁾ 속도 134.7 / 속도 ²⁾ 140.7",
    "rawCrit": "68 / 200 / 80 / 120",
    "notes": "¹⁾ 매+댄댄 기준 필살기 2회 3행동 / ²⁾ 매+바커+댄댄 기준 필살기 1회 3행동",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 95.0,
        "mode": "lt"
      },
      {
        "id": "flatHp",
        "value": 6000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 68.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 200.0,
        "mode": "min"
      }
    ]
  },
  "1407": {
    "name": "카스토리스",
    "page": 1,
    "pageStart": 1,
    "role": "광역 딜러",
    "useful": "치확, 치피 / HP",
    "rawTargets": "HP 9000 / ²⁾ HP 8000",
    "rawCrit": "68 / 180 / 100 / 120",
    "notes": "¹⁾ 4기억 2222 파티 고점빌드 / ²⁾ 히아킨 1돌 이상일 시 고려",
    "weights": {
      "cr": 1,
      "cd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 9000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 68.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 180.0,
        "mode": "min"
      }
    ]
  },
  "1406": {
    "name": "사이퍼",
    "page": 1,
    "pageStart": 1,
    "role": "디버퍼 / (추가공격)",
    "useful": "속도 / 치확,치피 / 공격력, 효명",
    "rawTargets": "속도 ²⁾ 170 +",
    "rawCrit": "50 / 100",
    "notes": "¹⁾ 전광, 땀방울 착용 시 / ²⁾ 종결은 200 이상",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 170.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 50.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1015": {
    "name": "아처",
    "page": 1,
    "pageStart": 1,
    "role": "단일 딜러",
    "useful": "치피 치확, / 공격력",
    "rawTargets": "공 3000",
    "rawCrit": "100 / 100",
    "notes": "스파클 전광 치확 10 / 린 포함 시 아처 1돌 효율 감소",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1508": {
    "name": "토오사카 린",
    "page": 1,
    "pageStart": 1,
    "role": "연계 딜러 / (아처) / 서포터 / (아처)",
    "useful": "치확, 치피 / 속도 / 공격력",
    "rawTargets": "공 2500 / 속도 134 + / 속도 158 + / 참조 *기타",
    "rawCrit": "100 / 120 / 치확 100",
    "notes": "스파클 전광 치확 10 / 본인 속도 버프 20.4 / 매댄댄바커공 속도 158+ 스파클 사용 / 스파클 - 린 - 스파클 - 린...이 되도록 속도 세팅",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 134.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1513": {
    "name": "어벤츄린•웨이브",
    "page": 1,
    "pageStart": 1,
    "role": "환락 딜러",
    "useful": "치확, 치피 / 속도",
    "rawTargets": "속도 170 +",
    "rawCrit": "100 / 100",
    "notes": "점술가 중복 불가능 주의",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 170.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "reference-aha": {
    "name": "에이언즈★아하",
    "page": 1,
    "pageStart": 1,
    "role": "환락",
    "useful": "속도 / 치확 / 치피",
    "rawTargets": "속도 200",
    "rawCrit": "치확 100",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1211": {
    "name": "백로",
    "page": 1,
    "pageStart": 1,
    "role": "힐러 / (부활)",
    "useful": "HP / 효과저항 / 속도 / 방어력",
    "rawTargets": "HP 6000 / 속도 160 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "hp": 1,
      "def": 1,
      "res": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 6000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1103": {
    "name": "서벌",
    "page": 2,
    "pageStart": 1,
    "role": "광역 딜러 / 필살기 발사대 / (더 헤르타)",
    "useful": "치확,치피 / 공격력,속도 / 속도 / 효과명중",
    "rawTargets": "공 2200 / ¹⁾ 속도 166.7+ / 효명 108.4%",
    "rawCrit": "70 / 140",
    "notes": "¹⁾ 매셋 기준",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 166.7,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 70.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 140.0,
        "mode": "min"
      }
    ]
  },
  "1202": {
    "name": "정운",
    "page": 2,
    "pageStart": 2,
    "role": "서포터 / (에너지 충전)",
    "useful": "공격력 / 속도",
    "rawTargets": "¹⁾ 공 2875 / 속도 134 +",
    "rawCrit": "",
    "notes": "¹⁾ 정운 6돌 기준",
    "weights": {
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2875.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 134.0,
        "mode": "min"
      }
    ]
  },
  "1204": {
    "name": "경원",
    "page": 2,
    "pageStart": 2,
    "role": "바운스 딜러 / (소환수)",
    "useful": "치확,치피 / 공격력 / 속도",
    "rawTargets": "¹⁾ 공 3000 / 속도 133.4 +",
    "rawCrit": "²⁾ 70 / 160",
    "notes": "¹⁾ 번구체 기준. 공구체는 3500 / ²⁾ 선데이 치확 20%, 경원 추가능력 10%로 30% 확보",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 70.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1005": {
    "name": "카프카",
    "page": 2,
    "pageStart": 2,
    "role": "지속딜 트리거",
    "useful": "효과명중 속도, / 공격력 / 공격력 / 속도, 효과명중",
    "rawTargets": "속도 166.7 + / 효명 75% / 속도 160 + / 효명 75%",
    "rawCrit": "",
    "notes": "¹⁾ 4돌 이상 권장 / 대부분의 경우 매 초임시 세팅이 우위 ²⁾ +",
    "weights": {
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 166.7,
        "mode": "min"
      },
      {
        "id": "ehr",
        "value": 75.0,
        "mode": "min"
      }
    ]
  },
  "1008": {
    "name": "아를란",
    "page": 2,
    "pageStart": 2,
    "role": "확산 딜러",
    "useful": "치확,치피 / 공격력 / 방어력,HP",
    "rawTargets": "¹⁾ 공 3000 / 속도 133.4 +",
    "rawCrit": "80 / 110",
    "notes": "¹⁾ 번구체 기준. 공구체는 3500",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1,
      "hp": 1,
      "def": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 110.0,
        "mode": "min"
      }
    ]
  },
  "1308": {
    "name": "아케론",
    "page": 2,
    "pageStart": 2,
    "role": "광역 딜러",
    "useful": "치확,치피 / 공격력 / 속도",
    "rawTargets": "²⁾ 공 3400 / 속도 133.4 + / ²⁾ 공 4300",
    "rawCrit": "³⁾ 84 / 160",
    "notes": "¹⁾ 천야 블레이드 2돌 이상 / ²⁾ 공구체 기준. 번구체는 600 낮게 / 선구자 이즈모 기준 ³⁾ + / 전투 내에서 얻는 치확: 1돌 18%, 이즈모 12%, 선구자 4%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3400.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 84.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1223": {
    "name": "맥택",
    "page": 2,
    "pageStart": 2,
    "role": "단일 딜러 / (추가 공격)",
    "useful": "치확,치피 / 공격력 / 속도",
    "rawTargets": "¹⁾ 공 2700",
    "rawCrit": "100 / 100",
    "notes": "¹⁾ 번구체 기준. 공구체는 3000",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2700.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1402": {
    "name": "아글라이아",
    "page": 2,
    "pageStart": 2,
    "role": "확산 딜러",
    "useful": "치확 / 속도 / 치피",
    "rawTargets": "¹⁾ 속도 159 + / ²⁾ 속도 x",
    "rawCrit": "³⁾ 치확 100",
    "notes": "¹⁾ 키레네 x, 134속 선데이 기준 아아선아 사이클 속도컷 / ²⁾ 키레네가 있는 경우 속도 유기 가능 / ³⁾ 공퍼, 치피 과다로 치확 100%가 1순위 목표 / *수로빈 본섭 적용 후 변경 예정",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 159.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1504": {
    "name": "애쉬베일",
    "page": 2,
    "pageStart": 2,
    "role": "단일 딜러 / (추가공격) / 서포터 / (수벤츄린)",
    "useful": "치확, 치피 / 공격력 / 속도",
    "rawTargets": "공 3400 / 속도 134+ / 속도 168",
    "rawCrit": "100 / 120 / 치확 100",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3400.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 134.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "8009": {
    "name": "개척자•환락",
    "page": 2,
    "pageStart": 2,
    "role": "환락 서포터",
    "useful": "속도 / 치확",
    "rawTargets": "공 (전투) 2200 / 속도 160 + / 속도 157 / (매+바커공)",
    "rawCrit": "치확 85",
    "notes": "효광 전광 점술가 치확 치확10, 18 / 중복 불가능 **점술가 주의**",
    "weights": {
      "cr": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 85.0,
        "mode": "min"
      }
    ]
  },
  "8010": {
    "name": "개척자•환락",
    "page": 2,
    "pageStart": 2,
    "role": "환락 서포터",
    "useful": "속도 / 치확",
    "rawTargets": "공 (전투) 2200 / 속도 160 + / 속도 157 / (매+바커공)",
    "rawCrit": "치확 85",
    "notes": "효광 전광 점술가 치확 치확10, 18 / 중복 불가능 **점술가 주의**",
    "weights": {
      "cr": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 85.0,
        "mode": "min"
      }
    ]
  },
  "1509": {
    "name": "길가메시",
    "page": 2,
    "pageStart": 2,
    "role": "연계 딜러 / (세이버)",
    "useful": "치확, 치피 / 공격력 / 속도",
    "rawTargets": "공 2800 / 속도 134 +",
    "rawCrit": "100 / 100",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2800.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 134.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1013": {
    "name": "헤르타",
    "page": 2,
    "pageStart": 2,
    "role": "광역 딜러 / (추가공격)",
    "useful": "치확,치피 / 공격력",
    "rawTargets": "공 2500",
    "rawCrit": "¹⁾ 85 / 140",
    "notes": "¹⁾ 2돌 치확 15% / 이즈모 사용 시 -12%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2500.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 85.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 140.0,
        "mode": "min"
      }
    ]
  },
  "1001": {
    "name": "Mar.7•보존",
    "page": 2,
    "pageStart": 2,
    "role": "탱커 / (보호막)",
    "useful": "방어력 / 효과명중 / 속도",
    "rawTargets": "방 3000",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "def": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "flatDef",
        "value": 3000.0,
        "mode": "min"
      }
    ]
  },
  "1106": {
    "name": "페라",
    "page": 2,
    "pageStart": 2,
    "role": "디버퍼 / (방깎)",
    "useful": "효과명중 / 속도 / 공격력",
    "rawTargets": "효명 66.7% / 속도 133.4 + / 효명 66.7% / 속도 133.4 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "1104": {
    "name": "게파드",
    "page": 2,
    "pageStart": 2,
    "role": "탱커 / (보호막)",
    "useful": "방어력 / 효과 명중 / 속도",
    "rawTargets": "방 3000 / ¹⁾ 효명 66.7%",
    "rawCrit": "",
    "notes": "기준 ¹⁾ 1돌 / 명함은 요구치가 너무 높기 때문에(156.4%) / 적당히 챙기고 유기",
    "weights": {
      "spd": 1,
      "def": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "flatDef",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      }
    ]
  },
  "1209": {
    "name": "연경",
    "page": 2,
    "pageStart": 2,
    "role": "단일 딜러",
    "useful": "치피 치확, / 공격력 / 속도",
    "rawTargets": "공 3000",
    "rawCrit": "80 / 160",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1212": {
    "name": "경류",
    "page": 2,
    "pageStart": 2,
    "role": "확산 딜러",
    "useful": "치확, HP / 속도, 치피",
    "rawTargets": "속도 ¹⁾ 133.4 + / ²⁾ HP 8000",
    "rawCrit": "³⁾ 50 / 150",
    "notes": "선데이 사용 선데이보다 조금 빠르게 세팅 ¹⁾ 시. / ²⁾ 얼구체 사용 시 7000 / ³⁾ 선데이 사용 시 치확 30%까지만 / 치피보다 효율이 높음 HP",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "flatHp",
        "value": 8000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 50.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 150.0,
        "mode": "min"
      }
    ]
  },
  "1303": {
    "name": "완•매",
    "page": 3,
    "pageStart": 2,
    "role": "서포터 / (격파) / 서포터 / (범용)",
    "useful": "격파 특수효과",
    "rawTargets": "속도 ²⁾ 120 + / 격특 최대한 / ²⁾ 속도 120 + / 격특 ³⁾ 160%",
    "rawCrit": "",
    "notes": "격파 파티에서는 비추천 ¹⁾ / ²⁾ 바커공 사용 시 이상. 6돌 미만은 저속 권장 120 / ³⁾ 추가능력으로 20% 받으면 180%로 가피증 버프 최대치",
    "weights": {
      "break": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 120.0,
        "mode": "min"
      },
      {
        "id": "break",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1312": {
    "name": "미샤",
    "page": 3,
    "pageStart": 3,
    "role": "바운스 딜러",
    "useful": "속도 / 치피 치확, / 공격력",
    "rawTargets": "공 2400",
    "rawCrit": "100 / 80",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2400.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 80.0,
        "mode": "min"
      }
    ]
  },
  "1401": {
    "name": "더 헤르타",
    "page": 3,
    "pageStart": 3,
    "role": "광역 딜러",
    "useful": "속도 / 치확 / 공격력,치피",
    "rawTargets": "속도 133.4 + / 공 ²⁾ 3000",
    "rawCrit": "88 / 120",
    "notes": "¹⁾ 2돌 이상 / 얼구체 기준 ²⁾",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 88.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "8007": {
    "name": "개척자•기억",
    "page": 3,
    "pageStart": 3,
    "role": "서포터 / (행동게이지) / 서브딜러",
    "useful": "속도 / 치피",
    "rawTargets": "²⁾ 속도 최대한 / ¹⁾ HP 5000",
    "rawCrit": "치피 200",
    "notes": "¹⁾ 카스토리스 조합 한정 / ²⁾ 133.4, 143, 160, 166.7 등 / 본인 상황과 여력에 맞는 세팅 사용",
    "weights": {
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 5000.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "8008": {
    "name": "개척자•기억",
    "page": 3,
    "pageStart": 3,
    "role": "서포터 / (행동게이지) / 서브딜러",
    "useful": "속도 / 치피",
    "rawTargets": "²⁾ 속도 최대한 / ¹⁾ HP 5000",
    "rawCrit": "치피 200",
    "notes": "¹⁾ 카스토리스 조합 한정 / ²⁾ 133.4, 143, 160, 166.7 등 / 본인 상황과 여력에 맞는 세팅 사용",
    "weights": {
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 5000.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "1413": {
    "name": "에버나이트",
    "page": 3,
    "pageStart": 3,
    "role": "서포터 / 서브 딜러 / ¹⁾ 메인 딜러",
    "useful": "치확, HP / 치피, 속도 / 치확, 치피 HP,",
    "rawTargets": "HP 5500 / 속도 120 + / ²⁾ HP 6500",
    "rawCrit": "65 / 180",
    "notes": "¹⁾ 2돌 이상 권장 / ²⁾ 구체 주옵만 체퍼인 기준",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 5500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 120.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 65.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 180.0,
        "mode": "min"
      }
    ]
  },
  "1415": {
    "name": "키레네",
    "page": 3,
    "pageStart": 3,
    "role": "서포터 / 서브 딜러 / 메인 딜러 ¹⁾",
    "useful": "치확, 속도 / HP / 치피",
    "rawTargets": "속도 200 + / ³⁾ HP 6500 / 속도 180 +",
    "rawCrit": "치확 50",
    "notes": "무조건 속도 180 + 먼저 맞추기 / ¹⁾ 6돌 권장, 최소 2돌 ²⁾ 속도 6% 붙은 모든 장신구 가능 / ³⁾ 치피갑 기준. 체갑은 + 1000 / ⁴⁾ 주로 비기억 파티에서 매+바커 행동수 늘리는 세팅",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "flatHp",
        "value": 6500.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 50.0,
        "mode": "min"
      }
    ]
  },
  "1503": {
    "name": "펄",
    "page": 3,
    "pageStart": 3,
    "role": "환락 힐러",
    "useful": "속도 / 방어력",
    "rawTargets": "방 2400 + / 속도 168 +",
    "rawCrit": "",
    "notes": "속도 우선 / 환락도 보너스 방어력 최소 2400, 최대 6000 까지",
    "weights": {
      "spd": 1,
      "def": 1
    },
    "targets": [
      {
        "id": "flatDef",
        "value": 2400.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 168.0,
        "mode": "min"
      }
    ]
  },
  "8001": {
    "name": "개척자•파멸",
    "page": 3,
    "pageStart": 3,
    "role": "확산 딜러",
    "useful": "치확, 치피 / 공격력 / 속도",
    "rawTargets": "공 3000",
    "rawCrit": "80 / 120",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "8002": {
    "name": "개척자•파멸",
    "page": 3,
    "pageStart": 3,
    "role": "확산 딜러",
    "useful": "치확, 치피 / 공격력 / 속도",
    "rawTargets": "공 3000",
    "rawCrit": "80 / 120",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1105": {
    "name": "나타샤",
    "page": 3,
    "pageStart": 3,
    "role": "힐러",
    "useful": "HP / 속도",
    "rawTargets": "HP 6000 / 속도 133.4 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 6000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "1206": {
    "name": "소상",
    "page": 3,
    "pageStart": 3,
    "role": "단일 딜러",
    "useful": "치확, 치피 / 공격력 / 속도",
    "rawTargets": "공 3000",
    "rawCrit": "80 / 120",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1107": {
    "name": "클라라",
    "page": 3,
    "pageStart": 3,
    "role": "반격 딜러",
    "useful": "치피 치확, / 공격력",
    "rawTargets": "공 ¹⁾ 3400",
    "rawCrit": "80 / 120 / ¹⁾ 68 / 120",
    "notes": "* 어그로 보존 캐릭터와 조합 금지 / ¹⁾ 물리구체 기준 / ²⁾ 시인셋 기준",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3400.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1111": {
    "name": "루카",
    "page": 3,
    "pageStart": 3,
    "role": "단일 딜러 / (격파)",
    "useful": "격파특수효과 / 속도 / 효과명중",
    "rawTargets": "격특 200% / 효명 66.7% / 속도 145 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "break": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "break",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 145.0,
        "mode": "min"
      }
    ]
  },
  "1302": {
    "name": "아젠티",
    "page": 3,
    "pageStart": 3,
    "role": "광역 딜러 / 필살기 발사대 / (더 헤르타)",
    "useful": "치확, 치피 / 속도, 공격력 / 속도",
    "rawTargets": "공 3600 / 속도 166.7 +",
    "rawCrit": "75 / 150",
    "notes": "승격 치확 25%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3600.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 166.7,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 75.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 150.0,
        "mode": "min"
      }
    ]
  },
  "1215": {
    "name": "한아",
    "page": 3,
    "pageStart": 3,
    "role": "서포터 / (스킬포인트)",
    "useful": "속도 / HP",
    "rawTargets": "속도 160 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1309": {
    "name": "로빈",
    "page": 3,
    "pageStart": 3,
    "role": "서포터 / (행동게이지)",
    "useful": "공격력 / 속도",
    "rawTargets": "공 4500 / ²⁾ 속도 117 + / ³⁾ 속도 120",
    "rawCrit": "",
    "notes": "¹⁾ 히아킨, 곽향 등 / 선턴으로 아군 대상 스킬 2회 발동 가능 캐릭터와 조합 / ²⁾ 1돌 이하 오토로 돌릴 경우. 딜러 속도 134 기준 / 바커공 기준 ³⁾",
    "weights": {
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 4500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 117.0,
        "mode": "min"
      }
    ]
  },
  "1315": {
    "name": "부트힐",
    "page": 3,
    "pageStart": 3,
    "role": "단일 딜러 / (격파)",
    "useful": "속도 / 격파특수효과",
    "rawTargets": "³⁾ 속도 167.1 +",
    "rawCrit": "",
    "notes": "달리아 필수 ¹⁾ / ²⁾ 3서폿 사용 시 체퍼, 방퍼도 고려 / ³⁾ 전광 + 달리아 1라 3행동 속도컷",
    "weights": {
      "spd": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 167.1,
        "mode": "min"
      }
    ]
  },
  "1221": {
    "name": "운리",
    "page": 3,
    "pageStart": 3,
    "role": "확산 딜러 / (반격, 추공)",
    "useful": "치확, 치피 / 공격력",
    "rawTargets": "공 2900",
    "rawCrit": "¹⁾ 100 / 120",
    "notes": "¹⁾ 치확 최우선으로 세팅 100%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2900.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1408": {
    "name": "파이논",
    "page": 4,
    "pageStart": 4,
    "role": "광역 딜러",
    "useful": "치확, 치피 / 공격력",
    "rawTargets": "공 ²⁾ 3000",
    "rawCrit": "³⁾ 100 / 140",
    "notes": "물리구체 공구체는 ²⁾ 기준. + 500 / ³⁾ 치확 세팅 시 고려사항 / 선데이 20% / 스파클전광 10% / 키레네 16%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 140.0,
        "mode": "min"
      }
    ]
  },
  "1410": {
    "name": "히실렌스",
    "page": 4,
    "pageStart": 4,
    "role": "지속 딜러",
    "useful": "공격력 / 속도 / 효과명중",
    "rawTargets": "효명 120% / ¹⁾ 공 2400",
    "rawCrit": "²⁾ 속도 168 + / ³⁾ 속도 128.5 +",
    "notes": "¹⁾ 전투 내 공격력 3600 + (중요) / 히실 전광옵 받은 카프카보다 빠르게 ²⁾ / ³⁾ 전광 기준. 없으면 133.4 +",
    "weights": {
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "ehr",
        "value": 120.0,
        "mode": "min"
      },
      {
        "id": "flatAtk",
        "value": 2400.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 168,
        "mode": "min"
      }
    ]
  },
  "1414": {
    "name": "단항•등황",
    "page": 4,
    "pageStart": 4,
    "role": "탱커 / (보호막) / 지속딜 탱커",
    "useful": "속도 / 공격력 / 속도, 공격력 / 효과명중",
    "rawTargets": "속도 133.4 + / 공 ²⁾ 4000 / ³⁾ 효명 75% / 속도 155 +",
    "rawCrit": "",
    "notes": "¹⁾ 파이논 파티 기준 / 전광 공속공에 공훈광추는 ²⁾ + 기준. 2700 / ³⁾ 카프카 사용 기준",
    "weights": {
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "flatAtk",
        "value": 4000.0,
        "mode": "min"
      }
    ]
  },
  "1502": {
    "name": "효광",
    "page": 4,
    "pageStart": 4,
    "role": "환락 서포터",
    "useful": "속도 / 치확",
    "rawTargets": "속도 200 +",
    "rawCrit": "치확 100",
    "notes": "효광 전광 점술가 치확 치확10, 18 / 시 속도 2돌 -12 / 속도 우선 200",
    "weights": {
      "cr": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1505": {
    "name": "에바네시아",
    "page": 4,
    "pageStart": 4,
    "role": "환락 딜러",
    "useful": "치확, 치피 / 속도",
    "rawTargets": "속도 아하+0.1 / (속신)",
    "rawCrit": "70 / 240",
    "notes": "효광 전광 치확10 / 속신일 경우 아하타임 속도보다 높게 세팅 / 기준 에바 (효광200, 매커공환척157 속도143)",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "cr",
        "value": 70.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 240.0,
        "mode": "min"
      }
    ]
  },
  "1109": {
    "name": "후크",
    "page": 4,
    "pageStart": 4,
    "role": "확산 딜러",
    "useful": "치확, 치피 / 공격력 / 속도",
    "rawTargets": "공 3000",
    "rawCrit": "80 / 110",
    "notes": "",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 110.0,
        "mode": "min"
      }
    ]
  },
  "8003": {
    "name": "개척자•보존",
    "page": 4,
    "pageStart": 4,
    "role": "탱커 / (보호막)",
    "useful": "방어력 / 속도 / 효과명중 ¹⁾ / HP",
    "rawTargets": "방 4000",
    "rawCrit": "",
    "notes": "¹⁾ 벨로보그 장신구 착용 시",
    "weights": {
      "spd": 1,
      "hp": 1,
      "def": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "flatDef",
        "value": 4000.0,
        "mode": "min"
      }
    ]
  },
  "8004": {
    "name": "개척자•보존",
    "page": 4,
    "pageStart": 4,
    "role": "탱커 / (보호막)",
    "useful": "방어력 / 속도 / 효과명중 ¹⁾ / HP",
    "rawTargets": "방 4000",
    "rawCrit": "",
    "notes": "¹⁾ 벨로보그 장신구 착용 시",
    "weights": {
      "spd": 1,
      "hp": 1,
      "def": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "flatDef",
        "value": 4000.0,
        "mode": "min"
      }
    ]
  },
  "1009": {
    "name": "아스타",
    "page": 4,
    "pageStart": 4,
    "role": "서포터 / (속도)",
    "useful": "속도",
    "rawTargets": "속도 160 +",
    "rawCrit": "",
    "notes": "¹⁾ 키레네, 은랑 lv.999 등 속도 기반 캐릭터 서포터로 사용",
    "weights": {
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1003": {
    "name": "히메코",
    "page": 4,
    "pageStart": 4,
    "role": "광역 딜러 / (추가공격) / 광역 딜러 / (격파)",
    "useful": "치확, 치피 / 공격력 / 격특 / 속도",
    "rawTargets": "¹⁾ 공 3300 / 속도 133.4 + / ³⁾ 격특 200",
    "rawCrit": "²⁾ 85 / 110",
    "notes": "¹⁾ 공신, 화염구체, 공매듭 기준 / ²⁾ 행적 치확 15%, 이즈모 치확 12% / 전투 내 격특 목표 ³⁾ 250%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3300.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 85.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 110.0,
        "mode": "min"
      }
    ]
  },
  "1112": {
    "name": "토파즈&복순이",
    "page": 4,
    "pageStart": 4,
    "role": "단일 딜러 / 디버퍼 / (추가공격)",
    "useful": "치피 치확, / 공격력 / 속도",
    "rawTargets": "¹⁾ 공 2500 / 속도 133.4 +",
    "rawCrit": "¹⁾ 100 / 130",
    "notes": "¹⁾ 속신, 화염구체, 공매듭 기준",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 130.0,
        "mode": "min"
      }
    ]
  },
  "1210": {
    "name": "계네빈",
    "page": 4,
    "pageStart": 4,
    "role": "지속 딜러",
    "useful": "공격력 / 속도 / 효과명중",
    "rawTargets": "효명 ¹⁾ 66.7% / 공 3000 / 속도 160 +",
    "rawCrit": "",
    "notes": "¹⁾ 1돌 이상 시 42.9%",
    "weights": {
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      },
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1301": {
    "name": "갤러거",
    "page": 4,
    "pageStart": 4,
    "role": "힐러",
    "useful": "격파특수효과 / 속도 / HP",
    "rawTargets": "¹⁾ 격특 150% / 속도 145 +",
    "rawCrit": "",
    "notes": "¹⁾ 격특 150% 이후로는 힐량에 영향을 주는 스탯이 없음",
    "weights": {
      "spd": 1,
      "hp": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "break",
        "value": 150.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 145.0,
        "mode": "min"
      }
    ]
  },
  "1310": {
    "name": "반디",
    "page": 4,
    "pageStart": 4,
    "role": "확산 딜러 / (격파)",
    "useful": "속도 / 격파특수효과 / 공격력",
    "rawTargets": "속도 ¹⁾ ²⁾ / 최대 178 / ³⁾ 격특 200% / 공 2200",
    "rawCrit": "",
    "notes": "달리아 조합에서 궁 종료 후 즉시 재변신 가능한 최대 속도컷 178. / 망귀인 2돌옵, 댄댄은 별도 계산 필요 / ²⁾ 파이논 전광 착용 시 최대 177.4로 줄어듬 / ³⁾ 전투 내 격특 목표 250%",
    "weights": {
      "spd": 1,
      "atk": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "break",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "flatAtk",
        "value": 2200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 178,
        "mode": "max"
      }
    ]
  },
  "1218": {
    "name": "초구",
    "page": 4,
    "pageStart": 4,
    "role": "디버퍼",
    "useful": "속도 / 효과명중",
    "rawTargets": "¹⁾ 속도 166.7 + / ²⁾ 효명 177.8%",
    "rawCrit": "",
    "notes": "¹⁾ 매셋 기준 / ²⁾ 아케론 조합 기준. 다른 조합 사용시 66.7%",
    "weights": {
      "spd": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 166.7,
        "mode": "min"
      },
      {
        "id": "ehr",
        "value": 177.8,
        "mode": "min"
      }
    ]
  },
  "1222": {
    "name": "영사",
    "page": 4,
    "pageStart": 4,
    "role": "힐러 / (격파)",
    "useful": "격파특수효과 / 속도 / 공격력",
    "rawTargets": "격특 ²⁾ 200% / 속도 160 + / ¹⁾ 속도 166.7 +",
    "rawCrit": "",
    "notes": "¹⁾ 적 다수 환경에서 필살기 가동률 올리는 빌드 / ²⁾ 전투 중 수치",
    "weights": {
      "spd": 1,
      "atk": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "break",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1225": {
    "name": "망귀인",
    "page": 4,
    "pageStart": 4,
    "role": "서포터 / (격파)",
    "useful": "속도 / 효과명중 / 격파특수효과",
    "rawTargets": "속도 160 + / 효명 66.7% / 격특 ³⁾ 220%",
    "rawCrit": "",
    "notes": "¹⁾ 중복 적용 x / ²⁾ 2돌 권장. 괴도셋은 허구 한정 / 전투 중 수치 ³⁾",
    "weights": {
      "spd": 1,
      "break": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      },
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      },
      {
        "id": "break",
        "value": 220.0,
        "mode": "min"
      }
    ]
  },
  "1321": {
    "name": "달리아",
    "page": 4,
    "pageStart": 4,
    "role": "서포터 / (격파)",
    "useful": "속도 / 격파특수효과",
    "rawTargets": "속도 160 + / 격특 150% / 속도 166.7",
    "rawCrit": "",
    "notes": "¹⁾ 중복 적용 x. 땀방울 착용 시 효명 66.7% 목표 / ²⁾ 2돌 이상일 경우 고려 가능",
    "weights": {
      "spd": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      },
      {
        "id": "break",
        "value": 150.0,
        "mode": "min"
      }
    ]
  },
  "1501": {
    "name": "스파키",
    "page": 5,
    "pageStart": 5,
    "role": "환락 딜러 / 환락 서포터 / (웃포 수급)",
    "useful": "치확, 공격력 / 치피, 속도 / 속도 / 치확, 공격력",
    "rawTargets": "공 (전투) 3600 / 속도 아하+0.1 / 속도 178 +",
    "rawCrit": "100 / 140 / 치확 최대한",
    "notes": "효광 전광 치확10 / 2돌 미만 아하타임 속도보다 높게 세팅 / 최소 권장 : 은랑2 + 스파키2 + 아하2 / 돌파 안돼있을 경우 해당세팅 필요X",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3600.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 140.0,
        "mode": "min"
      }
    ]
  },
  "1507": {
    "name": "천야•블레이드",
    "page": 5,
    "pageStart": 5,
    "role": "서브딜러 / 서포터",
    "useful": "치확, 치피 / HP, 속도",
    "rawTargets": "속도 141 + / HP 6000 / 속도 168",
    "rawCrit": "80 / 120 / 치확 80",
    "notes": "전광보다 2돌까지 돌파 우선 / 사이퍼 전광 사용 시 속도 170 +",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 141.0,
        "mode": "min"
      },
      {
        "id": "flatHp",
        "value": 6000.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1510": {
    "name": "히메코•노바",
    "page": 5,
    "pageStart": 5,
    "role": "판결 / (선데이, 등황) / 섬멸 / (웰트, 37)",
    "useful": "치확, 공격력 / 치피 / 속도",
    "rawTargets": "공 3500 / 공 3300 / 속도 134 +",
    "rawCrit": "치확 100",
    "notes": "선데이 치확 20",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 134.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1101": {
    "name": "브로냐",
    "page": 5,
    "pageStart": 5,
    "role": "서포터 / (행동게이지)",
    "useful": "속도 / 치명타 피해",
    "rawTargets": "¹⁾ 속도 133.3 + / 속도 167.4 +",
    "rawCrit": "치피 200 / 치피 최대한",
    "notes": "¹⁾ 딜러 속도보다 느리게",
    "weights": {
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.3,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 200.0,
        "mode": "min"
      }
    ]
  },
  "1108": {
    "name": "삼포",
    "page": 5,
    "pageStart": 5,
    "role": "지속 딜러",
    "useful": "효과명중 / 공격력",
    "rawTargets": "공 2500 / 속도 133.4 + / 효명 66.7%",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      }
    ]
  },
  "1002": {
    "name": "단항",
    "page": 5,
    "pageStart": 5,
    "role": "단일 딜러",
    "useful": "치확, 치피 / 속도 / 공격력",
    "rawTargets": "공 2400",
    "rawCrit": "80 / 120",
    "notes": "단일 버프형 화합과 조합 *",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2400.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1205": {
    "name": "블레이드",
    "page": 5,
    "pageStart": 5,
    "role": "확산 딜러",
    "useful": "치확, 치피 / HP / 속도",
    "rawTargets": "HP 7000 / ¹⁾ 속도 133.4",
    "rawCrit": "²⁾ 80 / 140",
    "notes": "* 도발 및 실드 캐릭터와 조합 금지 / ¹⁾ 선데이, 브로냐보다 속도 빠르게 / ²⁾ 선데이 사용 기준. 2돌일 경우 65%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 7000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 140.0,
        "mode": "min"
      }
    ]
  },
  "1217": {
    "name": "곽향",
    "page": 5,
    "pageStart": 5,
    "role": "힐러 / (에너지 충전)",
    "useful": "효과저항 / HP / 속도",
    "rawTargets": "HP 6000 / 속도 160+",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "hp": 1,
      "res": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 6000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1307": {
    "name": "블랙스완",
    "page": 5,
    "pageStart": 5,
    "role": "지속 딜러",
    "useful": "효과명중 / 공격력 / 속도",
    "rawTargets": "효명 ¹⁾ 156.5% / ²⁾ 공격력 2400 / 속도 133.4+",
    "rawCrit": "",
    "notes": "¹⁾ 효명 최소 120% / ²⁾ 전투 내 공격력 3600 + (중요)",
    "weights": {
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "ehr",
        "value": 156.5,
        "mode": "min"
      },
      {
        "id": "flatAtk",
        "value": 2400.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "1220": {
    "name": "비소",
    "page": 5,
    "pageStart": 5,
    "role": "단일 딜러 / (추가 공격)",
    "useful": "치피 치확, / 공격력 / 속도",
    "rawTargets": "¹⁾ 공 3000 / ²⁾ 속도 133.4 +",
    "rawCrit": "100 / 120",
    "notes": "¹⁾ 공신, 바람구체 기준 / ²⁾ 용맹셋 기준. 매셋은 속도 중요도 낮음",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1405": {
    "name": "아낙사",
    "page": 5,
    "pageStart": 5,
    "role": "바운스 딜러 / 서브 딜러",
    "useful": "치확, 치피 / 공격력 / 치피 치확, / 속도, 공격력",
    "rawTargets": "속도 ¹⁾ 133.4 / 속도 166.7 +",
    "rawCrit": "²⁾ 치확 100",
    "notes": "¹⁾ 케리드라 기용 시 - 20, 키레네 기용 시 속도 불필요 / ²⁾ 선데이 20%, 이즈모 12%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      }
    ]
  },
  "1409": {
    "name": "히아킨",
    "page": 5,
    "pageStart": 5,
    "role": "힐러 / 서브딜러",
    "useful": "속도 / HP / 치피",
    "rawTargets": "속도 ²⁾ 200 + / HP 5000",
    "rawCrit": "³⁾ 치피 80",
    "notes": "은랑 등 속도가 중요한 딜러와 조합 시 ¹⁾ LV.999 / ²⁾ 여전사셋 착용 시 193.4 이상 / ³⁾ 속도 부옵이 최우선",
    "weights": {
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "flatHp",
        "value": 5000.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 80.0,
        "mode": "min"
      }
    ]
  },
  "1014": {
    "name": "세이버",
    "page": 5,
    "pageStart": 5,
    "role": "광역 딜러",
    "useful": "치확, 치피 / 공격력, 속도",
    "rawTargets": "공 2200 / 속도 134 +",
    "rawCrit": "80 / 160",
    "notes": "특성 치확 20%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2200.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 134.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 160.0,
        "mode": "min"
      }
    ]
  },
  "1412": {
    "name": "케리드라",
    "page": 5,
    "pageStart": 5,
    "role": "서포터 / (전투스킬)",
    "useful": "공격력 / 속도 / 치피",
    "rawTargets": "²⁾ 공 4000 / 속도 113.4+",
    "rawCrit": "",
    "notes": "¹⁾ 파이논 조합 기준 / ²⁾ 추가능력 치피 전환 상한 4000",
    "weights": {
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 4000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 113.4,
        "mode": "min"
      }
    ]
  },
  "1512": {
    "name": "로빈•서머레토",
    "page": 5,
    "pageStart": 5,
    "role": "서포터 / (공격력) / 서포터 / (비공격력)",
    "useful": "속도 / HP / 치확, 치피 / 공격력(필요 시)",
    "rawTargets": "HP 8000 / HP 6500 / 속도 160 +",
    "rawCrit": "치확 50",
    "notes": "파이논 등 세길, 뉴네추, 노메코, / 필살기를 한번 더 사용가능 할 경우 에충매듭 / 기억, 환락 딜러 등 / 로빈의 공격력이 딜러보다 높도록 세팅",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 8000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 50.0,
        "mode": "min"
      }
    ]
  },
  "1004": {
    "name": "웰트",
    "page": 5,
    "pageStart": 5,
    "role": "디버퍼 / 바운스 딜러",
    "useful": "속도,효명 / 치확,치피 / 속도,공격력,효명",
    "rawTargets": "¹⁾ 효명 66.7% / 속도 166.7 + / 공 2500 / 속도 133.4 +",
    "rawCrit": "²⁾ 100 / 100",
    "notes": "¹⁾ 딜러로 사용 시 80% / ²⁾ 선데이 20%, 이즈모 12%, 6돌 30%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "ehr": 1
    },
    "targets": [
      {
        "id": "ehr",
        "value": 66.7,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 166.7,
        "mode": "min"
      }
    ]
  },
  "1207": {
    "name": "어공",
    "page": 6,
    "pageStart": 5,
    "role": "서포터 / (치명타)",
    "useful": "속도 / 공격력,치확,치피 / HP / 효과저항",
    "rawTargets": "",
    "rawCrit": "",
    "notes": "딜러 속도 +1",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "hp": 1,
      "res": 1
    },
    "targets": []
  },
  "1203": {
    "name": "나찰",
    "page": 6,
    "pageStart": 6,
    "role": "힐러",
    "useful": "속도 / 공격력 / HP",
    "rawTargets": "¹⁾ 속도 135 +",
    "rawCrit": "",
    "notes": "¹⁾ 거목셋 속도 최소 135. 목표 160 이상",
    "weights": {
      "spd": 1,
      "atk": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 135.0,
        "mode": "min"
      }
    ]
  },
  "1213": {
    "name": "음월",
    "page": 6,
    "pageStart": 6,
    "role": "확산 딜러",
    "useful": "치확, 치피 / 공격력",
    "rawTargets": "공 3300",
    "rawCrit": "¹⁾ 100 / 130",
    "notes": "¹⁾ 선데이 20%, 스파클전광 10%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3300.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 100.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 130.0,
        "mode": "min"
      }
    ]
  },
  "1305": {
    "name": "레이시오",
    "page": 6,
    "pageStart": 6,
    "role": "단일 딜러 / (추가 공격)",
    "useful": "치확,치피 / 속도 / 공격력",
    "rawTargets": "공 3500",
    "rawCrit": "¹⁾ 87.5 / 130",
    "notes": "¹⁾ 귀납 치확 최대 12.5, 치피 30",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 3500.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 87.5,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 130.0,
        "mode": "min"
      }
    ]
  },
  "1304": {
    "name": "어벤츄린",
    "page": 6,
    "pageStart": 6,
    "role": "탱커 / (보호막)",
    "useful": "방어력 / 속도",
    "rawTargets": "방 4500 / 속도 133.4 +",
    "rawCrit": "",
    "notes": "",
    "weights": {
      "spd": 1,
      "def": 1
    },
    "targets": [
      {
        "id": "flatDef",
        "value": 4500.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      }
    ]
  },
  "8005": {
    "name": "개척자•화합",
    "page": 6,
    "pageStart": 6,
    "role": "서포터 / (격파)",
    "useful": "격파특수효과 / 속도",
    "rawTargets": "격특 최대한 / ¹⁾ 속도 145 +",
    "rawCrit": "",
    "notes": "¹⁾ 탈리아셋 기준",
    "weights": {
      "spd": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 145.0,
        "mode": "min"
      }
    ]
  },
  "8006": {
    "name": "개척자•화합",
    "page": 6,
    "pageStart": 6,
    "role": "서포터 / (격파)",
    "useful": "격파특수효과 / 속도",
    "rawTargets": "격특 최대한 / ¹⁾ 속도 145 +",
    "rawCrit": "",
    "notes": "¹⁾ 탈리아셋 기준",
    "weights": {
      "spd": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 145.0,
        "mode": "min"
      }
    ]
  },
  "1224": {
    "name": "Mar.7•수렵",
    "page": 6,
    "pageStart": 6,
    "role": "서포터 / (히메코 노바) / 격파 딜러",
    "useful": "치확, 치피 / 공격력, 속도 / 속도 / 격파특수효과",
    "rawTargets": "속도 160 + / 속도 168 + / 격특 최대한",
    "rawCrit": "80 / 120",
    "notes": "달리아 필수 / 삼달척완 쌀먹조합용",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "atk": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 160.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 80.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 120.0,
        "mode": "min"
      }
    ]
  },
  "1317": {
    "name": "라파",
    "page": 6,
    "pageStart": 6,
    "role": "광역 딜러 / (격파)",
    "useful": "속도 / 공격력 / 격파특수효과",
    "rawTargets": "공 2800 / 속도 168 + / 격특 최대한",
    "rawCrit": "",
    "notes": "전광 기준 ¹⁾",
    "weights": {
      "spd": 1,
      "atk": 1,
      "break": 1
    },
    "targets": [
      {
        "id": "flatAtk",
        "value": 2800.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 168.0,
        "mode": "min"
      }
    ]
  },
  "1313": {
    "name": "선데이",
    "page": 6,
    "pageStart": 6,
    "role": "서포터 / (행동게이지)",
    "useful": "속도 / 치명타 피해",
    "rawTargets": "¹⁾ 속도 133.4 + / 속도 167.4 +",
    "rawCrit": "치피 200",
    "notes": "¹⁾ 딜러보다 느리게",
    "weights": {
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 200.0,
        "mode": "min"
      }
    ]
  },
  "1404": {
    "name": "마이데이",
    "page": 6,
    "pageStart": 6,
    "role": "확산 딜러 / 광역 딜러 / (1돌)",
    "useful": "치확, HP / 속도 / 치피",
    "rawTargets": "¹⁾ HP 8000 / ²⁾ 속도 133.4 +",
    "rawCrit": "³⁾ 52 / 150",
    "notes": "¹⁾ HP 최소컷 8000 / ²⁾ 키레네 조합 시 우선도 낮음 / ³⁾ 제자 16%, 선데이 20%",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1,
      "hp": 1
    },
    "targets": [
      {
        "id": "flatHp",
        "value": 8000.0,
        "mode": "min"
      },
      {
        "id": "spd",
        "value": 133.4,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 52.0,
        "mode": "min"
      },
      {
        "id": "cd",
        "value": 150.0,
        "mode": "min"
      }
    ]
  },
  "1506": {
    "name": "은랑 LV.999",
    "page": 6,
    "pageStart": 6,
    "role": "환락 딜러",
    "useful": "치확 / 속도 / 치피",
    "rawTargets": "속도 200 +",
    "rawCrit": "치확 84 +",
    "notes": "곽1 or 앰포히아킨 활용해서 속도높이기 / 속도 이후에는 치피올리기 230 / 속도 최대 260 / 효광전광 치확 10",
    "weights": {
      "cr": 1,
      "cd": 1,
      "spd": 1
    },
    "targets": [
      {
        "id": "spd",
        "value": 200.0,
        "mode": "min"
      },
      {
        "id": "cr",
        "value": 84.0,
        "mode": "min"
      }
    ]
  }
};
