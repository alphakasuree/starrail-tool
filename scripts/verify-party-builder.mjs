import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const files=['characters','relic-reference','team-synergy-data','team-meta-presets','save-format','team-builder'];
const sources=await Promise.all(files.map(name=>fs.readFile(new URL(`../assets/js/${name}.js`,import.meta.url),'utf8')));
function browser(initial=[]) {
    const elements=new Map(), events=new Map();
    const profiles=new Map([['first',JSON.stringify(initial)]]);
    let id='first', denied=false, confirmed=true;
    function get(key) {
        if(!elements.has(key)) elements.set(key,{value:'',checked:false,hidden:false,disabled:false,style:{},textContent:'',innerHTML:'',attrs:{},listeners:{},
            addEventListener(type,fn) {this.listeners[type]=fn;},setAttribute(key,value) {this.attrs[key]=value;},focus() {}});
        return elements.get(key);
    }
    const context=vm.createContext({document:{getElementById:get,activeElement:{focus(){}},addEventListener(type,fn){events.set(type,fn);}},
        isWarping:false,confirm:()=>confirmed,addEventListener(type,fn){events.set(type,fn);},
        HonkaiProfileStorage:{get id(){return id;},getItem(){return profiles.get(id)||null;},setItem(section,value){assert.equal(section,'teams');if(denied)throw Error('quota');profiles.set(id,value);}}});
    sources.forEach(source=>vm.runInContext(source,context));
    const action=(key,type='click')=>{assert(!get(key).disabled,`${key} should be enabled`);get(key).listeners[type]({preventDefault(){}});};
    const input=(key,value)=>{get(key).value=value;action(key,'input');};
    const login=next=>{id=next;events.get('honkai-profile-login')();};
    login('first');
    return {get,action,input,login,context,events,profiles,records:()=>JSON.parse(profiles.get(id)||'[]'),deny(value){denied=value;},confirm(value){confirmed=value;}};
}
const legacy={ids:['1310','1303','8005','1409'],savedAt:1790899200000,ownedOnly:true};
const b=browser([legacy]);
b.context.confirm=()=>{throw Error('Party confirmations must stay inside the page');};
assert.equal(b.get('party-count').textContent,'1');
b.context.openTeamBuilder();
assert.equal(b.get('team-free-workspace').hidden,false);
assert.equal(b.get('team-recommend-workspace').hidden,true);
b.action('party-card-0');
assert(b.get('party-slots').innerHTML.includes('반디'));
b.action('party-new');
b.action('party-slot-0');b.action('party-choice-1101'); // Support can be the first slot.
b.action('party-slot-2');
assert.match(b.get('party-candidates').innerHTML,/id="party-choice-1101" disabled/);
b.action('party-choice-1002');
b.input('party-name','시험 <파티>');b.input('party-note','첫 줄\n대체 캐릭터: 삼칠이');
b.action('party-form','submit');
assert.equal(b.records().length,2);
assert.deepEqual(b.records()[0],legacy,'Saving a free party must preserve legacy records');
assert.deepEqual(b.records()[1].ids,['1101',null,'1002',null]);
assert.equal(b.records()[1].note,'첫 줄\n대체 캐릭터: 삼칠이');
assert(b.get('party-list').innerHTML.includes('시험 &lt;파티&gt;'));
b.input('party-name','수정한 파티');b.action('party-form','submit');
assert.equal(b.records().length,2,'Editing must replace only the selected party');
assert.equal(b.records()[1].name,'수정한 파티');
b.action('party-copy');
assert.equal(b.records().length,3);assert.equal(b.records()[2].name,'수정한 파티 복사본');
b.action('party-remove-0');b.action('party-form','submit');
assert.equal(b.records()[2].ids[0],null);assert.equal(b.records()[1].ids[0],'1101','Copies must have independent slots');
b.confirm(false);b.action('party-delete');assert.equal(b.records().length,3);
assert.equal(b.get('party-delete-confirmation').hidden,false);
assert.match(b.get('party-delete-message').textContent,/복사본/);
b.action('party-delete-cancel');assert.equal(b.records().length,3);
assert.equal(b.get('party-delete-confirmation').hidden,true);
b.action('party-delete');b.events.get('keydown')({key:'Escape',preventDefault(){}});
assert.equal(b.get('party-delete-confirmation').hidden,true);assert.equal(b.records().length,3);
b.action('party-delete');b.action('party-delete-confirm');assert.equal(b.records().length,2);
assert.equal(b.get('party-delete-confirmation').hidden,true);
b.input('party-name','버리지 않을 메모');b.confirm(false);b.action('party-card-0');
assert.equal(b.get('party-discard-confirmation').hidden,false);
b.action('party-discard-cancel');
assert.equal(b.get('party-discard-confirmation').hidden,true);
assert.equal(b.get('party-name').value,'버리지 않을 메모','Cancelling selection must preserve unsaved work');
b.action('party-card-0');b.events.get('keydown')({key:'Escape',preventDefault(){}});
assert.equal(b.get('party-discard-confirmation').hidden,true);
assert.equal(b.get('party-name').value,'버리지 않을 메모');
b.deny(true);const before=JSON.stringify(b.records());b.action('party-form','submit');
assert.equal(JSON.stringify(b.records()),before);assert.match(b.get('party-status').textContent,/저장하지 못했습니다/);
assert.equal(b.get('party-name').value,'버리지 않을 메모');
b.deny(false);b.action('party-card-0');b.action('party-discard-confirm');
assert.equal(b.get('party-name').value,'');assert.equal(b.get('party-discard-confirmation').hidden,true);
assert.equal(JSON.stringify(b.records()),before,'Discard must not change saved parties');
b.input('party-note','새 파티 전환 시험');b.action('party-new');b.action('party-discard-confirm');
assert.equal(b.get('party-note').value,'');assert.equal(b.get('party-copy').disabled,true);
b.deny(false);b.confirm(true);b.login('second');
assert.equal(b.get('party-count').textContent,'0');assert.equal(b.get('party-name').value,'');
b.action('party-form','submit');assert.deepEqual(b.records()[0].ids,[null,null,null,null]);
b.login('first');assert.equal(b.get('party-count').textContent,'2');
b.action('party-card-1');assert.equal(b.get('party-name').value,'수정한 파티');
const fresh=browser(b.records());fresh.action('party-card-1');
assert.equal(fresh.get('party-note').value,'첫 줄\n대체 캐릭터: 삼칠이','Reload must restore notes and slot positions');
fresh.action('party-slot-0');fresh.input('party-search','없는이름');assert.match(fresh.get('party-candidates').innerHTML,/검색 결과가 없습니다/);
fresh.events.get('keydown')({key:'Escape',preventDefault(){}});assert.equal(fresh.get('party-picker').hidden,true);
fresh.action('team-mode-recommend');assert.equal(fresh.get('team-recommend-workspace').hidden,false);
fresh.action('team-saved-1');assert.equal(fresh.get('team-free-workspace').hidden,false);
const format=b.context.HonkaiSaveFormat;
const raw={warp:null,relic:null,teams:JSON.stringify(b.records())};
assert.equal(JSON.stringify(format.toRaw(format.parse(JSON.stringify(format.create('test',raw))))),JSON.stringify(raw));
for(const record of [
    {mode:'free',ids:['1101','1101',null,null],savedAt:1},
    {ids:['1101',null,null,null],savedAt:1},
    {mode:'free',ids:[null,null,null,null],savedAt:1,name:'x'.repeat(61)},
    {mode:'free',ids:[null,null,null,null],savedAt:1,note:'x'.repeat(1001)}
]) assert.throws(()=>format.create('test',{warp:null,relic:null,teams:JSON.stringify([record])}));
console.log('PASS: free slots, duplicate guard, legacy preservation, editing, copies, deletion, discard cancellation, quota failure, profile isolation, reload, search, mode switching and save-transfer round-trip.');
