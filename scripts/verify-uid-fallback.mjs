import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {queryHsr} from './hsr-proxy.mjs';
import {convertEnkaCharacter} from './hsr-enka.mjs';

const uid = '100000999';
const parsed = {player:{uid,nickname:'test',level:70,world_level:6,signature:'',space_info:{achievement_count:100}},
    characters:[{id:'1409',name:'히아킨',level:80,rank:0,attributes:[],additions:[],relics:[]}]};
const pearl = {avatarId:1503,level:80,promotion:6,
    equipment:{tid:21064,level:80,promotion:6,rank:5},
    skillTreeList:[{pointId:1503201,level:1}],
    relicList:[{tid:61331,type:1,level:15,mainAffixId:1,subAffixList:[{affixId:7,cnt:3,step:3}]}]};
const enka = {detailInfo:{uid:Number(uid),nickname:'test',level:70,worldLevel:6,recordInfo:{achievementCount:100},
    avatarDetailList:[{avatarId:1409,level:80,promotion:6},pearl]}};
const context = vm.createContext({document:{addEventListener(){}}});
vm.runInContext(await fs.readFile(new URL('../assets/js/uid-api.js',import.meta.url),'utf8'), context);
const validate = body => context.HonkaiUid.validateSnapshot(context.HonkaiUid.normalize(body,uid));
const originalFetch = globalThis.fetch;
let parsedStatus = 200, enkaStatus = 200, enkaBody = enka, calls = [];
try {
    globalThis.fetch = async url => {
        calls.push(url);
        if (url === `https://api.mihomo.me/sr_info_parsed/${uid}?lang=kr`) return new Response(JSON.stringify(parsed),{status:parsedStatus});
        assert.equal(url,`https://enka.network/api/hsr/uid/${uid}`);
        return new Response(JSON.stringify(enkaBody),{status:enkaStatus});
    };
    assert.equal((await queryHsr('../secret')).status,400);
    assert.equal(calls.length,0);
    let result = await queryHsr(uid), body = await result.json();
    assert.equal(result.status,200);
    assert.equal(result.headers.get('Cache-Control'),'no-store');
    assert.deepEqual(body.characters.map(c=>c.id),['1409','1503']);
    assert.deepEqual(body.characters[0],parsed.characters[0],'Existing parsed builds must be preserved');
    const c = validate(body).characters[1];
    assert.equal(c.name,'펄');assert.equal(c.rank,0);assert.equal(c.lightCone.rank,5);
    assert.equal(c.lightCone.id,'21064');assert.match(c.lightCone.name,/슈룸/);
    assert.equal(c.relics[0].id,'61331');assert.equal(c.relics[0].rarity,5);
    assert.equal(c.relics[0].main.display,'705');
    assert.equal(c.relics[0].sub[0].display,'6');
    assert.ok(Math.abs(c.stats.find(s=>s.field==='spd').value - 105.9) < 1e-6);
    assert.equal(c.stats.find(s=>s.field==='elation_dmg').display,'20.0%');
    // Resolved affixes and locally calculated affixes must agree.
    const flat = convertEnkaCharacter({...pearl,relicList:[{...pearl.relicList[0],_flat:{props:[
        {type:'HPDelta',value:705.6},{type:'SpeedDelta',value:6.9}]}}]});
    assert.ok(Math.abs(flat.attributes.find(s=>s.field==='hp').value - c.stats.find(s=>s.field==='hp').value)<1e-6);
    assert.deepEqual(flat.attributes.find(s=>s.field==='spd'),body.characters[1].attributes.find(s=>s.field==='spd'));

    enkaBody = {...enka,detailInfo:{...enka.detailInfo,avatarDetailList:[pearl,pearl]}};
    body = await (await queryHsr(uid)).json();assert.equal(body.characters.filter(c=>c.id==='1503').length,1);
    parsedStatus = 500;
    body = await (await queryHsr(uid)).json();assert.equal(validate(body).characters[0].id,'1503');
    parsedStatus = 200;enkaStatus = 503;
    body = await (await queryHsr(uid)).json();assert.deepEqual(body,parsed);
    enkaStatus = 200;enkaBody = {...enka,detailInfo:{...enka.detailInfo,uid:100000998}};
    body = await (await queryHsr(uid)).json();assert.deepEqual(body,parsed,'Wrong-UID supplement must be rejected');
    enkaBody = {...enka,detailInfo:{...enka.detailInfo,avatarDetailList:[{...pearl,equipment:{...pearl.equipment,rank:6}}]}};
    body = await (await queryHsr(uid)).json();assert.deepEqual(body,parsed,'Malformed supplement must not corrupt a good profile');
    parsedStatus = 429;enkaStatus = 503;
    assert.equal((await queryHsr(uid)).status,429);
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: omitted Pearl recovery, stats/equipment conversion, zero eidolons, duplicate prevention, full Enka fallback, upstream failure isolation and UID validation.');
