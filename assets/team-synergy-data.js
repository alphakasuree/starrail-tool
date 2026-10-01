// Guide snapshot checked 2026-10-01. Scores are app heuristics, not damage simulations.
const teamSynergyData = (() => {
    const units = {};
    const set = (ids, roles, tags, buffs, reason, sp=0) => ids.split(' ').forEach(id=>units[id]={roles,tags,buffs,reason,sp});
    set('1101','support',['crit'],{crit:2,advance:3},'행동을 당겨 메인 딜러의 공격 기회를 늘립니다.',-1);
    set('1202','support',['crit'],{atk:2,energy:3,damage:1},'공격력 지원과 에너지 충전으로 필살기 회전을 돕습니다.',1);
    set('1009','support',[],{atk:1,speed:3},'공격력·속도 지원으로 파티의 행동 빈도를 높입니다.');
    set('1207','support',['crit'],{atk:1,crit:2},'치명타 지원을 활용하려면 행동 순서 조정이 필요합니다.',-1);
    set('1215','support',[],{atk:1,speed:2,sp:3},'스킬 포인트와 속도를 보완합니다.',1);
    set('1306','support',['crit'],{crit:3,advance:2,sp:4},'치명타 피해·행동 지원과 스킬 포인트 공급을 함께 제공합니다.',1);
    set('1313','support',['summon','crit'],{crit:3,advance:3,energy:2,summon:4},'소환수와 딜러의 행동을 지원합니다.');
    set('1303','support',['break'],{break:4,efficiency:4,resPen:3,damage:1,speed:1},'격파 효율과 격파 구간을 지원합니다.',1);
    set('1225','support',['break'],{break:4,superbreak:3,debuff:1},'격파·슈퍼 격파를 강화하는 지원 슬롯입니다.',1);
    set('1321','support',['break'],{break:4,superbreak:4,sp:2},'격파 전에도 슈퍼 격파를 활용하도록 돕습니다.',1);
    set('8005 8006','support',['break'],{break:2,superbreak:4},'슈퍼 격파와 격파 특수효과를 지원합니다.');
    set('1309','support',['fua','crit'],{atk:3,crit:2,advance:2,fua:4},'추가 공격 파티의 공격 빈도와 전체 화력을 지원합니다.');
    set('1403','support',['fua','hp'],{damage:3,debuff:1,fua:1},'파티 전체 피해 지원과 추가 공격을 함께 제공합니다.',1);
    set('1412','support',['skill','crit'],{skill:4,crit:2},'전투 스킬 중심 딜러를 지원합니다.');
    set('1106 1006','support',[],{debuff:3,damage:2},'방어력 감소 등 디버프로 딜러의 피해를 지원합니다.',1);
    set('1218','support',['ultimate','dot'],{debuff:4,ultimate:4,dot:1},'디버프와 필살기 피해 지원을 연결합니다.');
    set('1004','support main',[],{debuff:3,damage:1},'디버프와 행동 지연으로 공격·생존을 보완합니다.');
    set('1406','support',['fua'],{debuff:3,damage:3,fua:2},'피해 증폭과 추가 공격을 함께 활용합니다.',1);
    set('1507','support',[],{debuff:4,ultimate:4,damage:3},'디버프 적용과 필살기 피해 지원을 연결합니다.');
    set('1413','support main',['memory','hp','summon'],{memory:4,summon:3,crit:3,damage:2},'기억 정령의 피해와 HP 변동 시너지를 지원합니다.');
    set('1415','support main',['memory','hp','summon'],{memory:4,summon:3,damage:3},'기억 정령과 기억 파티의 공격을 지원합니다.');
    set('8007 8008','support',['memory','summon'],{crit:2,advance:2,memory:3,damage:2},'기억 정령을 포함한 파티에 행동·추가 피해 지원을 제공합니다.');
    set('1502','support',['elation'],{elation:4,damage:2},'환락 파티의 아하 타임과 웃음 포인트 운용을 지원합니다.');
    set('8009 8010','support',['elation'],{elation:3,sp:1},'환락 딜러의 환락 스킬과 자원 운용을 지원합니다.');
    set('1512','support',[],{atk:3,damage:2},'첨부 표의 공격력·비공격력 지원 빌드를 기준으로 배치합니다.');
    set('1508','support main',['linked'],{damage:2,crit:1},'첨부 표의 아처 연계 지원 슬롯입니다.');
    set('1105 1211','sustain',[],{heal:3},'회복으로 파티의 생존을 담당합니다.',1);
    set('1110','sustain',['hp'],{heal:3,hp:2},'회복과 HP 지원을 제공합니다.',1);
    set('1203','sustain',[],{heal:4,sp:3},'회복과 스킬 포인트 운용을 보완합니다.',1);
    set('1217','sustain',['dot'],{heal:4,energy:3,atk:2},'회복·에너지·공격력 지원을 함께 제공합니다.');
    set('1222','sustain',['break','fua'],{heal:4,break:3,fua:1},'회복과 격파 피해 지원을 함께 제공합니다.');
    set('1301','sustain',['break'],{heal:3,break:2,sp:4,debuff:1},'회복·격파 지원과 스킬 포인트 공급을 보완합니다.',1);
    set('1409','sustain',['memory','hp','summon'],{heal:5,hp:3,memory:3},'파티 HP 회복과 HP 지원으로 기억 파티를 돕습니다.');
    set('1503','sustain',['elation'],{heal:4,elation:4,advance:1},'회복·피해 감소를 담당하며 환락 동료 수에 따라 지원이 강화됩니다.',1);
    set('1304','sustain',['fua'],{shield:4,fua:3,crit:1},'보호막과 추가 공격으로 생존·공격 빈도를 보완합니다.',1);
    set('1414','sustain',['fua','dot'],{shield:4,atk:3,fua:2},'보호막·공격력 지원과 추가 공격을 제공합니다.',1);
    set('1208','sustain',['crit'],{shield:3,crit:1},'피해 분담과 치명타 확률 지원으로 파티를 보호합니다.',1);
    set('1104 1001 8003 8004','sustain',[],{shield:3},'보호막으로 파티를 보호합니다.',1);
    set('1112 1223 1224 1504','support main',['fua','crit'],{fua:4,crit:1},'추가 공격을 활용하는 서브 딜러 슬롯입니다.',1);
    set('1504','support main',['fua','crit'],{fua:4,crit:4,debuff:3},'방어력 감소·추가 공격 치명타 피해와 높은 공격 빈도를 연결합니다. 같은 미끼 대상의 스킬은 SP를 환급합니다.');
    set('1005','support main',['dot'],{dot:5,atk:2},'지속 피해를 발동시키는 핵심 트리거입니다.');
    set('1307 1410 1108 1210 1111','support main',['dot'],{dot:3,debuff:1},'지속 피해를 중첩하고 발동시키는 동료 슬롯입니다.');
    set('1501 1505 1506 1513','support main',['elation','crit'],{elation:3,crit:1},'환락 자원을 공유하는 딜러 슬롯입니다.',-1);
    set('1003 1013 1314 1405','support main',['aoe','crit'],{aoe:3},'다수 적을 공격하는 지식 동료 슬롯입니다.');
    const sources = {
        firefly:'https://www.prydwen.gg/star-rail/characters/firefly',
        acheron:'https://www.prydwen.gg/star-rail/characters/acheron',
        feixiao:'https://www.prydwen.gg/star-rail/characters/feixiao',
        castorice:'https://www.prydwen.gg/star-rail/characters/castorice',
        hysilens:'https://www.prydwen.gg/star-rail/characters/hysilens',
        sparxie:'https://www.prydwen.gg/star-rail/characters/sparxie',
        pearl:'https://www.prydwen.gg/star-rail/characters/pearl'
    };
    // Explicit partner preferences take priority over general tag matching.
    const guides = {
        '1310':{source:'firefly',partners:{'1321':35,'1303':30,'1225':22,'8005':20,'8006':20,'1222':35,'1301':20}},
        '1308':{source:'acheron',partners:{'1507':40,'1406':30,'1218':30,'1004':18,'1006':18,'1106':12}},
        '1220':{source:'feixiao',partners:{'1309':35,'1504':38,'1414':26,'1304':24,'1112':25,'1223':19,'1224':18,'1406':20}},
        '1407':{source:'castorice',partners:{'1409':40,'1413':35,'1415':34,'1403':22,'8007':20,'8008':20,'1507':18}},
        '1410':{source:'hysilens',partners:{'1005':50,'1307':30,'1217':15,'1414':20}},
        '1501':{source:'sparxie',partners:{'1502':35,'1506':35,'1503':40,'8009':22,'8010':22,'1306':25}},
        '1506':{source:'pearl',partners:{'1503':40,'1502':32,'1501':30,'8009':20,'8010':20}},
        '1505':{source:'pearl',partners:{'1503':35,'1502':25,'8009':20,'8010':20}}
    };
    const mainTags = {
        break:['1310','1315','1317','1214'], dot:['1005','1307','1410','1108','1210','1111'],
        fua:['1220','1305','1112','1223','1224','1107','1221','1314','1003','1013','1504'],
        hp:['1205','1404','1407'], summon:['1204','1402','1407'], memory:['1402','1407','1413','1415'],
        elation:['1501','1505','1506','1513'], skill:['1408','1014'], spHungry:['1213','1201','1015','1501','1310']
    };
    return {units,guides,mainTags,sources,checkedAt:'2026-10-01'};
})();
