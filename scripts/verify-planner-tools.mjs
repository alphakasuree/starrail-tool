import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {Blob} from 'node:buffer';
import {CompressionStream,DecompressionStream} from 'node:stream/web';
const read=name=>fs.readFile(new URL(`../assets/js/${name}`,import.meta.url),'utf8');
const elements=new Map(),events=new Map(),saved=new Map();
function get(id) {
    if(!elements.has(id)) elements.set(id,{value:'',checked:false,hidden:false,disabled:false,textContent:'',_html:'',options:[],
        get innerHTML(){return this._html;},set innerHTML(html){this._html=html;this.options=[...html.matchAll(/<option value="([^"]*)"/g)].map(m=>({value:m[1]}));},
        addEventListener(type,fn){const key=`${id}:${type}`;events.set(key,[...(events.get(key)||[]),fn]);},
        insertAdjacentHTML(position,html){for(const m of html.matchAll(/<(input|select|button|section|p|div)[^>]*id="([^"]+)"([^>]*)>/g)){const el=get(m[2]);el.value=m[3].match(/value="([^"]*)"/)?.[1]||'';}},
        querySelector(){return get('shell');},close(){this.open=false;},showModal(){this.open=true;},focus(){},select(){},click(){for(const fn of events.get(`${id}:click`)||[])fn();}});
    return elements.get(id);
}
const emit=async(id,type,event={})=>{for(const fn of events.get(`${id}:${type}`)||[])await fn(event);};
const storedPlan={goals:[{kind:'character',id:'1308',current:-1,target:2}],states:Object.fromEntries(['character','lightcone','characterCollaboration','lightconeCollaboration'].map(g=>[g,{pity:0,guaranteed:false}]))};
let openedWarp=0,openedRelic=0,applied;
let current={characterId:'1308',mode:'item',rows:[{id:'cr',value:3.2},{id:'cd',value:6.4},{id:'spd',value:2},{id:'atk',value:4}],targets:[],weights:{cr:1,cd:1,spd:1,atk:1}};
const context=vm.createContext({Blob,CompressionStream,DecompressionStream,TextEncoder,TextDecoder,Uint8Array,URL,
    // A bounded Response adapter keeps this test independent of fetch/network.
    Response:class{constructor(stream){this.stream=stream;}async arrayBuffer(){const r=this.stream.getReader(),chunks=[];let n=0;for(;;){const v=await r.read();if(v.done)break;chunks.push(v.value);n+=v.value.length;}const out=new Uint8Array(n);let i=0;for(const v of chunks){out.set(v,i);i+=v.length;}return out.buffer;}},
    btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
    Event:class{constructor(type){this.type=type;}},
    document:{getElementById:get,addEventListener(type,fn){events.set(type,[fn]);}},
    localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)},
    addEventListener(type,fn){events.set(type,[...(events.get(type)||[]),fn]);},dispatchEvent(e){for(const fn of events.get(e.type)||[])fn(e);},
    location:{href:'https://example.com/tool/',hash:'',reload(){}},navigator:{clipboard:{writeText:async()=>{}}},setTimeout:fn=>fn(),
    WarpPrepUI:{plan:()=>storedPlan,apply:p=>applied=p},RelicPlannerUI:{capture:()=>JSON.parse(JSON.stringify(current)),goals:()=>({characterId:'1308',targets:[{id:'cr',value:50,endValue:55,mode:'min'}]}),applyGoals:p=>applied=p},
    openWarpPrep(){openedWarp++;},openRelicCalculator(){openedRelic++;}
});
for(const name of ['characters.js','profile-storage.js','account-tools.js','planner-math.js','relic-calculator.js']) {
    // Scoring runs without document; the actual relic UI is tested by its existing suite.
    if(name==='relic-calculator.js'){const doc=context.document;delete context.document;vm.runInContext(await read(name),context);context.document=doc;}
    else vm.runInContext(await read(name),context);
}
events.get('DOMContentLoaded')[0]();get('profile-login-mode').value='local';get('profile-login-id').value='test-account';await emit('profile-login-form','submit',{preventDefault(){}});
await emit('collection-render-area','change',{target:{dataset:{id:'1308',field:'owned'},checked:true}});
await emit('collection-render-area','change',{target:{dataset:{id:'1308',field:'e'},value:'2'}});
await emit('collection-render-area','change',{target:{dataset:{id:'1308',field:'s'},value:'3'}});
assert.equal(context.HonkaiAccount.get('1308').e,2);assert.equal(context.HonkaiAccount.get('1308').s,3);assert(context.HonkaiAccount.owned().has('1308'));
// The collection uses manual account data, including after simulated pulls.
const appSource=await read('app.js');
context.escapeHTML=s=>String(s);context.collectionItems=vm.runInContext('characterCatalog',context);
get('collection-rarity').value='all';
vm.runInContext('let currentTab="character";'+appSource.slice(appSource.indexOf('        function generateGridHTML('),appSource.indexOf('        // 앱 초기 구동')),context);
context.renderCollection();
assert.match(get('collection-render-area').innerHTML,/data-field="owned"/);
assert.match(get('collection-render-area').innerHTML,/value="2" selected/);
get('collection-owned-filter').checked=true;await emit('collection-owned-filter','change');
assert.match(get('collection-count').textContent,/1명 보유 · 1 \//);
get('collection-search').value='없는 캐릭터';context.renderCollection();assert.match(get('collection-render-area').innerHTML,/검색 결과가 없습니다/);
get('collection-search').value='';get('collection-owned-filter').checked=false;
context.banners={character:{featured:context.collectionItems.find(c=>c.id==='1310'),rateUp:1,pool4Up:[]}};
context.getWarpProbabilities=()=>({five:1,four:0});context.saveWarpProgress=()=>{};
vm.runInContext('let activeBanner="character",activeStateKey="character",pity5=0,pity4=0,guaranteed5=true,guaranteed4=false;let warpHistory={character:[]};'+appSource.slice(appSource.indexOf('        function pullSingle()'),appSource.indexOf('        function updateUI()')),context);
const accountBeforePull=JSON.stringify([...context.HonkaiAccount.owned()]);
context.pullSingle();context.renderCollection();
assert.equal(context.HonkaiAccount.get('1310').owned,false);
assert.equal(JSON.stringify([...context.HonkaiAccount.owned()]),accountBeforePull);
assert.equal(vm.runInContext('warpHistory.character.length',context),1);
vm.runInContext(await read('light-cones.js'),context);
context.collectionItems=vm.runInContext('[...characterCatalog,...lightConeCatalog]',context);
vm.runInContext('currentTab="lightcone"',context);context.renderCollection();assert.equal(get('collection-owned-label').hidden,true);
assert.doesNotMatch(get('collection-render-area').innerHTML,/col-item locked|data-field="owned"/);
vm.runInContext('currentTab="character"',context);
const storage=context.HonkaiProfileStorage;
const before=storage.snapshot();storage.renameProfile('새이름');assert.equal(storage.id,'새이름');assert.deepEqual(storage.snapshot(),before);assert.equal(saved.get('honkai-id-v1:test-account:account'),undefined);
assert.throws(()=>storage.renameProfile('../bad'));
saved.set('honkai-id-v1:existing:ready','1');assert.throws(()=>storage.renameProfile('existing'));
const account=JSON.parse(storage.getItem('account'));account.lastExportAt=Date.now()-31*86400000;storage.setItem('account',JSON.stringify(account));context.dispatchEvent(new context.Event('honkai-documents-changed'));assert.equal(get('backup-reminder').hidden,false);
context.HonkaiAccount.markExport();assert.equal(get('backup-reminder').hidden,true);
vm.runInContext(await read('save-format.js'),context);
const exported=context.HonkaiSaveFormat.create(storage.id,storage.snapshot());assert.equal(context.HonkaiSaveFormat.summary(exported).account,1);
const accountRoundTrip=context.HonkaiSaveFormat.toRaw(context.HonkaiSaveFormat.parse(JSON.stringify(exported)));
assert.equal(JSON.parse(accountRoundTrip.account).characters['1308'].s,3);
const badAccount=JSON.parse(JSON.stringify(exported));badAccount.sections.account.characters['1308'].s=6;assert.throws(()=>context.HonkaiSaveFormat.validate(badAccount));
storage.importSections({warp:null,relic:null,teams:null},storage.snapshot());assert.equal(storage.getItem('account'),null);storage.restorePrevious();assert.equal(JSON.parse(storage.getItem('account')).characters['1308'].e,2);
const math=context.HonkaiPlannerMath;
assert.equal(math.forecast({days:35,monthlyDays:30,daily:true,monthly:true,events:1000,other:0}),5800);
assert.equal(math.forecast({days:10,monthlyDays:30,daily:false,monthly:true,events:0,other:0}),900);
assert.throws(()=>math.forecast({days:-1,monthlyDays:0,events:0,other:0}));
assert.equal(math.speed({speed:134,base:100,buff:0,flat:0,advance:0,cycles:0}).actions,2);
const next=math.speed({speed:133,base:100,buff:0,flat:0,advance:0,cycles:0});assert.equal(next.actions,1);assert(Math.abs(next.needed-1/3)<1e-8);
assert.equal(math.speed({speed:134,base:100,buff:0,flat:0,advance:100,cycles:0}).actions,3);
assert.equal(math.speed({speed:120,base:100,buff:10,flat:4,advance:0,cycles:0}).effective,134);
get('prep-jade').value='12000';get('prep-tickets').value='10';vm.runInContext(await read('planner-tools.js'),context);
assert.equal(get('relic-workspace-analysis').hidden,false);
assert.equal(get('relic-workspace-compare').hidden,true);
await emit('relic-view-speed','click');assert.equal(get('relic-workspace-analysis').hidden,true);assert.equal(get('relic-workspace-speed').hidden,false);
get('speed-current').value='143.5';await emit('relic-view-compare','click');await emit('relic-view-speed','click');assert.equal(get('speed-current').value,'143.5');
await emit('relic-view-analysis','click');assert.equal(get('relic-view-analysis').ariaPressed,'true');assert.equal(get('relic-workspace-speed').hidden,true);
get('forecast-daily').checked=true;get('forecast-monthly').checked=true;get('forecast-use').checked=true;assert.equal(context.HonkaiForecast.jade(),4800);
await emit('compare-capture-a','click');current.rows[1].value=12.8;await emit('compare-capture-b','click');await emit('compare-run','click');assert.match(get('compare-result').innerHTML,/B − A/);assert.match(get('compare-result').innerHTML,/\+6.4/);
current.characterId='1310';await emit('compare-capture-b','click');await emit('compare-run','click');assert.match(get('compare-result').textContent,/같은 캐릭터/);
const codec=context.HonkaiPlanCodec,packed=codec.pack('warp');const encoded=await codec.encode(packed);assert.equal(encoded[0],'z');assert.deepEqual(JSON.parse(JSON.stringify(await codec.decode('#plan='+encoded))),JSON.parse(JSON.stringify(packed)));
assert(!JSON.stringify(packed).includes('새이름'));assert(!JSON.stringify(packed).includes('12000'));assert(!JSON.stringify(codec.pack('relic')).includes('current'));
await assert.rejects(codec.decode('#plan=z'+'x'.repeat(13000)));
await assert.rejects(codec.decode('#plan=j'+Buffer.from(JSON.stringify([9,'w'])).toString('base64url')));
context.location.hash='#plan='+encoded;context.dispatchEvent(new context.Event('hashchange'));
await new Promise(resolve=>setTimeout(resolve,20));await emit('shared-plan-apply','click');assert.equal(openedWarp,1);assert.equal(applied.goals[0].target,2);
console.log('PASS: real account ownership/E/S, profile rename and collisions, backup age, forecast limits, speed boundaries/advance/buffs, fair A/B scoring, compressed link round-trip, privacy allowlist, invalid links and explicit shared plan opening.');
const swEvents=new Map(),cached=[],puts=[],deleted=[];let claims=0,network=0;
const cache={async addAll(requests){cached.push(...requests.map(r=>r.url));},async match(){return {cached:true};},async put(...args){puts.push(args);}};
const scope='https://example.com/project/';
const swContext=vm.createContext({URL,Request:class{constructor(url){this.url=String(url);}},
    self:{registration:{scope},clients:{async claim(){claims++;}},addEventListener(type,fn){swEvents.set(type,fn);}},
    caches:{async open(){return cache;},async keys(){return ['honkai-tools-_project_-old','honkai-tools-_other_-old'];},async delete(name){deleted.push(name);}},
    async fetch(){network++;return {ok:true,clone(){return this;}};}
});
vm.runInContext(await fs.readFile(new URL('../sw.js',import.meta.url),'utf8'),swContext);
let pending;swEvents.get('install')({waitUntil(p){pending=p;}});await pending;assert(cached.length>250);assert(cached.every(url=>url.startsWith(scope)));
for(const url of cached) await fs.access(new URL('../'+url.slice(scope.length),import.meta.url));
swEvents.get('activate')({waitUntil(p){pending=p;}});await pending;assert.equal(claims,1);assert.deepEqual(deleted,['honkai-tools-_project_-old']);
swEvents.get('fetch')({request:{method:'GET',url:scope+'?plan=ignored',mode:'navigate'},respondWith(p){pending=p;}});assert.equal((await pending).cached,true);
let intercepted=false;swEvents.get('fetch')({request:{method:'GET',url:scope+'api/private',mode:'cors'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
assert.equal(network,0);assert.equal(puts.length,0);
console.log('PASS: PWA shell asset existence, subpath installation, scope-isolated cache cleanup, offline navigation and API exclusion.');
