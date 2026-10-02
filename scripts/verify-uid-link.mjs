import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {queryHsr} from './hsr-proxy.mjs';
import worker from './hsr-worker.mjs';
const fixture = (uid='100000999') => ({player:{uid,nickname:'<개척자>',level:70,world_level:6,signature:'별의 여정',space_info:{achievement_count:500}},characters:[
    {id:'1308',name:'아케론',rank:2,level:80,light_cone:{id:'23024',name:'장착 광추',rank:3,level:80},attributes:[{name:'공격력',field:'atk',value:1000,percent:false,display:'1000'},{name:'치명타 확률',field:'crit_rate',value:.05,percent:true,display:'5%'}],additions:[{field:'atk',value:200},{field:'crit_rate',value:.6}],relics:[{name:'머리',level:15,main_affix:{name:'HP',field:'hp',value:705,display:'705',percent:false},sub_affix:[]}]}
]});
const saved = new Map(), elements = new Map(), listeners = new Map(), events = [];
const get = id => {
    if (!elements.has(id)) elements.set(id,{value:'',hidden:false,disabled:false,textContent:'',innerHTML:'',focus(){},addEventListener(type,fn){listeners.set(`${id}:${type}`,fn);}});
    return elements.get(id);
};
let response = fixture(), status = 200, calls = 0, networkError = false, blocked = false;
response.characters[0].name = '<아케론>';
const context = vm.createContext({Blob,AbortController,setTimeout,clearTimeout,
    document:{getElementById:get,addEventListener(type,fn){const key=`document:${type}`;listeners.set(key,[...(listeners.get(key)||[]),fn]);}},
    Event:class {constructor(type){this.type=type;}},
    addEventListener(type,fn){listeners.set(type,[...(listeners.get(type)||[]),fn]);},
    dispatchEvent(event){events.push(event.type);for(const fn of listeners.get(event.type)||[])fn(event);},
    localStorage:{getItem:k=>saved.get(k)??null,setItem(k,v){if(blocked)throw new Error('저장 공간 부족');saved.set(k,String(v));},removeItem:k=>saved.delete(k)},
    location:{reload(){}},
    async fetch(url,opts){calls++;assert.equal(url,'/api/hsr/100000999');assert.equal(opts.credentials,'omit');if(networkError)throw new TypeError('offline');return {ok:status===200,status,json:async()=>response};}
});
for (const name of ['characters','backend-config','uid-api','profile-storage','account-tools','save-format']) vm.runInContext(await fs.readFile(new URL(`../assets/js/${name}.js`,import.meta.url),'utf8'),context);
for (const fn of listeners.get('document:DOMContentLoaded')) fn();
const login = async (uid, mode='uid') => {get('profile-login-mode').value=mode;get('profile-login-id').value=uid;await listeners.get('profile-login-form:submit')({preventDefault(){}});};
await login('test-account'); assert.equal(calls,0);assert.equal(context.HonkaiProfileStorage.id,null);
context.location.protocol='file:';
await login('100000999');assert.equal(calls,0);assert.match(get('profile-login-error').textContent,/파일 직접/);
context.location.protocol='http:';
const key = section=>`honkai-id-v1:100000999:${section}`;
const originalAccount={version:1,characters:{'1001':{owned:true,e:1,s:0},'1308':{owned:false,e:0,s:1}},createdAt:Date.now(),lastExportAt:null};
saved.set(key('account'),JSON.stringify(originalAccount));saved.set(key('warp'),'original warp');
await login('100000999');
assert.equal(context.HonkaiProfileStorage.id,'100000999');assert.equal(get('profile-login-screen').hidden,true);assert.equal(get('app-content').inert,false);
assert.equal(context.HonkaiAccount.get('1308').owned,true);assert.equal(context.HonkaiAccount.get('1308').e,2);assert.equal(context.HonkaiAccount.get('1308').s,1);
assert.equal(context.HonkaiAccount.get('1001').e,1);assert.equal(saved.get(key('warp')),'original warp');
assert.equal(get('uid-profile-panel').hidden,false);assert.match(get('uid-showcase').innerHTML,/&lt;/);assert.match(get('uid-showcase').innerHTML,/1,200/);assert.match(get('uid-showcase').innerHTML,/65.0%/);assert.match(get('uid-showcase').innerHTML,/장착 광추/);assert.match(get('uid-showcase').innerHTML,/머리/);
assert.throws(()=>context.HonkaiProfileStorage.renameProfile('other'));
const backup = context.HonkaiSaveFormat.create('100000999',{warp:null,relic:null,teams:null,account:saved.get(key('account'))});
const roundTrip = context.HonkaiSaveFormat.toRaw(context.HonkaiSaveFormat.parse(JSON.stringify(backup)));
assert.equal(JSON.parse(roundTrip.account).uidProfile.characters[0].lightCone.rank,3);
assert.equal(JSON.parse(roundTrip.account).uidProfile.characters[0].relics.length,1);
const accountBefore=saved.get(key('account'));status=429;
await listeners.get('uid-refresh:click')();assert.equal(saved.get(key('account')),accountBefore);assert.match(get('uid-sync-status').textContent,/이전 조회/);assert.equal(get('uid-refresh').disabled,false);
status=200;response=fixture();response.characters[0].rank=3;
await listeners.get('uid-refresh:click')();assert.equal(context.HonkaiAccount.get('1308').e,3);
const before=saved.get(key('account'));status=404;await login('100000999');assert.equal(context.HonkaiProfileStorage.id,null);assert.equal(saved.get(key('account')),before);assert.match(get('profile-login-error').textContent,/찾을 수/);
status=200;networkError=true;await login('100000999');assert.equal(saved.get(key('account')),before);assert.match(get('profile-login-error').textContent,/연결할 수/);networkError=false;
response=fixture('100000998');await login('100000999');assert.equal(saved.get(key('account')),before);assert.equal(context.HonkaiProfileStorage.id,null);
response=fixture();blocked=true;await login('100000999');assert.equal(saved.get(key('account')),before);assert.equal(context.HonkaiProfileStorage.id,null);blocked=false;
const normalized=context.HonkaiUid.normalize(fixture(),'100000999');normalized.characters=[];assert.doesNotThrow(()=>context.HonkaiUid.validateSnapshot(normalized));
normalized.nickname=1;assert.throws(()=>context.HonkaiUid.validateSnapshot(normalized));
await login('old-profile','local');assert.equal(context.HonkaiProfileStorage.id,'old-profile');assert.equal(get('uid-profile-panel').hidden,true);
const realFetch=globalThis.fetch;
try {
    let upstreamCalls=0;
    globalThis.fetch=async(url,options)=>{upstreamCalls++;assert.equal(url,'https://api.mihomo.me/sr_info_parsed/100000999?lang=kr');assert.match(options.headers['User-Agent'],/Honkai/);return new Response(JSON.stringify(fixture()));};
    assert.equal((await queryHsr('../secret')).status,400);assert.equal(upstreamCalls,0);
    assert.equal((await queryHsr('100000999')).status,200);
    const request=new Request('https://relay.example/api/hsr/100000999',{headers:{Origin:'https://site.example'}});
    assert.equal((await worker.fetch(request,{})).status,403);
    assert.equal((await worker.fetch(request,{ALLOWED_ORIGIN:'https://other.example'})).status,403);
    const result=await worker.fetch(request,{ALLOWED_ORIGIN:'https://site.example'});assert.equal(result.status,200);assert.equal(result.headers.get('Access-Control-Allow-Origin'),'https://site.example');
    globalThis.fetch=async()=>new Response('{}',{status:429});assert.equal((await queryHsr('100000999')).status,429);
    globalThis.fetch=async()=>new Response('invalid json');assert.equal((await queryHsr('100000999')).status,502);
} finally {globalThis.fetch=realFetch;}
console.log('PASS: UID login, validation, public profile/equipment/stats, ownership merge, manual signature S preservation, escaping, refresh, failed lookup/storage preservation, legacy entry, fixed-host relay and Worker origin restrictions.');
