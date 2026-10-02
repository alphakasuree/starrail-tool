(() => {
    'use strict';
    const get=id=>document.getElementById(id), math=globalThis.HonkaiPlannerMath;
    const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function insert(target,html) {target.insertAdjacentHTML('beforeend',html);}
    insert(get('prep-resources'),`<details class="tool-card" id="forecast-card"><summary>패치까지 확보할 재화</summary><p>기간 동안 매일 수령하는 것으로 계산합니다. 이벤트·기타 보상은 직접 예상치를 입력하세요. 월정액 구매 시 지급되는 재화는 기타에 별도로 입력합니다.</p><div class="tool-fields"><label>남은 날짜 (일)<input id="forecast-days" type="number" min="0" max="365" step="1" value="35"></label><label>월정액 수령 가능 일수<input id="forecast-monthly-days" type="number" min="0" max="365" step="1" value="30"></label><label>이벤트 예상 성옥<input id="forecast-events" type="number" min="0" max="1000000" step="1" value="0"></label><label>기타 예상 성옥<input id="forecast-other" type="number" min="0" max="1000000" step="1" value="0"></label></div><div class="tool-fields"><label><input id="forecast-daily" type="checkbox"> 일일 훈련 60 성옥/일</label><label><input id="forecast-monthly" type="checkbox"> 월정액 90 성옥/일</label><label><input id="forecast-use" type="checkbox"> 예상 재화를 확률 계산에 포함</label></div><p id="forecast-total" class="tool-status" role="status"></p></details>`);
    function forecast() {return math.forecast({days:get('forecast-days').value,monthlyDays:get('forecast-monthly-days').value,events:get('forecast-events').value,other:get('forecast-other').value,daily:get('forecast-daily').checked,monthly:get('forecast-monthly').checked});}
    function forecastView() {
        try {const jade=forecast();get('forecast-total').textContent=`예상 추가 ${jade.toLocaleString('ko-KR')} 성옥 · ${get('forecast-use').checked ? '계산에 포함' : '계산에서 제외'} · 총 ${Math.floor((Number(get('prep-jade').value)+(get('forecast-use').checked ? jade : 0))/160)+Number(get('prep-tickets').value)}회 가능`;}
        catch(error) {get('forecast-total').textContent=error.message;}
    }
    globalThis.HonkaiForecast={jade:()=>get('forecast-use').checked ? forecast() : 0};
    get('prep-form').addEventListener('input',forecastView);forecastView();
    insert(get('relic-workspace-compare'),`<section class="tool-card relic-workspace-card"><div class="relic-tool-heading"><span class="relic-eyebrow">COMPARE</span><h2>어떤 세팅이 더 나을까?</h2><p>같은 캐릭터의 두 세팅을 선택해 변화량을 확인하세요.</p></div><div class="tool-fields">${['a','b'].map(side=>`<div class="relic-compare-slot"><label>세팅 ${side.toUpperCase()}<select id="compare-${side}"></select></label><button id="compare-capture-${side}" type="button">분석 화면의 입력 가져오기</button></div>`).join('')}</div><p class="relic-tool-caption">총점은 A의 목표와 가중치를 기준으로 비교합니다.</p><button id="compare-run" type="button" class="relic-tool-primary">두 세팅 비교하기 →</button><div id="compare-result" class="tool-overflow" role="status"></div></section>`);
    insert(get('relic-workspace-speed'),`<section class="tool-card relic-workspace-card" id="speed-card"><div class="relic-tool-heading"><span class="relic-eyebrow">SPEED</span><h2>다음 행동까지, 얼마나 필요할까?</h2><p>캐릭터의 전체 속도를 입력하면 다음 목표까지 필요한 수치를 보여드립니다.</p></div><div class="tool-fields"><label>현재 전체 속도<input id="speed-current" type="number" min="1" max="500" step="any" value="134"></label><label>추가 사이클 (0 = 첫 사이클)<input id="speed-cycles" type="number" min="0" max="20" step="1" value="0"></label></div><details class="relic-advanced"><summary>파티 지원 효과 반영</summary><p>지원 캐릭터를 선택하고 실제 스킬·성혼·광추 효과를 입력하세요.</p><div class="tool-fields"><label>캐릭터 기본 속도<input id="speed-base" type="number" min="1" max="300" step="any" value="100"></label><label>지원 캐릭터<select id="speed-support"><option value="">직접 입력</option>${characterCatalog.filter(c=>['1101','1306','1313','1303','1309','1202'].includes(c.id)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><label>지속 속도 버프 (%)<input id="speed-buff" type="number" min="0" max="200" step="any" value="0"></label><label>지속 속도 버프 (고정)<input id="speed-flat" type="number" min="0" max="200" step="any" value="0"></label><label>시작 시 1회 행동 게이지 증가 (%)<input id="speed-advance" type="number" min="0" max="100" step="any" value="0"></label></div><p class="relic-tool-caption">속도 버프는 전 구간 유지, 행동 당김은 시작 시 1회로 계산합니다. 반복 행동 당김·소환물·웨이브 전환은 포함하지 않습니다.</p></details><p class="relic-tool-caption">혼돈의 기억 기준 · 첫 사이클 150 AV, 이후 사이클당 100 AV</p><div id="speed-result" class="tool-metrics" role="status"></div></section>`);
    const views=['analysis','compare','speed'];
    function showRelicView(view) {
        for(const name of views) {get(`relic-workspace-${name}`).hidden=name!==view;get(`relic-view-${name}`).ariaPressed=String(name===view);}
        get('relic-screen').scrollTop=0;
    }
    for(const view of views) get(`relic-view-${view}`).addEventListener('click',()=>showRelicView(view));
    showRelicView('analysis');
    let captured={a:null,b:null}, setups=[];
    function compareOptions() {
        try {setups=JSON.parse(HonkaiProfileStorage.getItem('relic') || '[]');if(!Array.isArray(setups)) throw new Error();}
        catch {setups=[];}
        for(const side of ['a','b']) {
            const select=get(`compare-${side}`), selected=select.value;
            select.innerHTML=`<option value="capture">${captured[side] ? '담아둔 현재 입력' : '현재 입력을 먼저 담으세요'}</option>`+setups.map((s,i)=>`<option value="${i}">${esc(s.name)} · ${esc(characterCatalog.find(c=>c.id===s.characterId)?.name || s.characterId)}</option>`).join('');
            if([...select.options].some(o=>o.value===selected)) select.value=selected;
        }
    }
    for(const side of ['a','b']) get(`compare-capture-${side}`).addEventListener('click',()=>{captured[side]=RelicPlannerUI.capture();compareOptions();get(`compare-${side}`).value='capture';get('compare-result').textContent=`${side.toUpperCase()}에 현재 입력을 담았습니다.`;});
    get('compare-run').addEventListener('click',()=>{
        try {
            const pick=side=>get(`compare-${side}`).value==='capture' ? captured[side] : setups[Number(get(`compare-${side}`).value)];
            const a=pick('a'),b=pick('b');if(!a||!b) throw new Error('A와 B를 선택하거나 현재 입력을 담으세요.');
            if(a.characterId!==b.characterId||a.mode!==b.mode) throw new Error('같은 캐릭터와 평가 방식의 세팅을 선택하세요.');
            const values=s=>Object.fromEntries((s.mode==='build' ? s.targets.map(t=>[t.id,t.current]) : s.rows.map(r=>[r.id,r.value])).map(([id,v])=>[id,v==='' ? null : Number(v)]));
            const av=values(a),bv=values(b), scoring=s=>s.mode==='build' ? RelicScoring.calculateBuild(a.targets.map(t=>({...t,current:values(s)[t.id]??''}))).score : RelicScoring.calculate(s.rows,a.weights).score;
            if(a.mode==='build' && a.targets.some(t=>av[t.id]===null||bv[t.id]==null)) throw new Error('A의 비교 대상 능력치에 A/B 수치를 모두 입력하세요.');
            const as=scoring(a),bs=scoring(b),fmt=v=>Number(v).toFixed(1),delta=(x,y)=>{const d=y-x;return `<span class="${d>=0 ? 'comparison-positive' : 'comparison-negative'}">${d>0?'+':''}${fmt(d)}</span>`;};
            get('compare-result').innerHTML=`<table class="tool-table"><thead><tr><th>능력치</th><th>A</th><th>B</th><th>B − A</th></tr></thead><tbody>${RelicScoring.stats.filter(s=>Object.hasOwn(av,s.id)||Object.hasOwn(bv,s.id)).map(s=>{const x=av[s.id]??(a.mode==='item'?0:null),y=bv[s.id]??(b.mode==='item'?0:null);return `<tr><th>${s.name} ${s.unit}</th><td>${x===null?'—':fmt(x)}</td><td>${y===null?'—':fmt(y)}</td><td>${x===null||y===null?'—':delta(x,y)}</td></tr>`;}).join('')}<tr><th>총점 (A 기준)</th><td>${fmt(as)}</td><td>${fmt(bs)}</td><td>${delta(as,bs)}</td></tr></tbody></table><p>양수는 수치 증가입니다. 속도 튜닝과 상한 조건은 증가가 항상 유리하지 않습니다.</p>`;
        } catch(error) {get('compare-result').textContent=error.message;}
    });
    get('relic-save').addEventListener('click',()=>setTimeout(compareOptions,0));get('relic-delete').addEventListener('click',()=>setTimeout(compareOptions,0));
    function speedView() {
        try {const r=math.speed({speed:get('speed-current').value,base:get('speed-base').value,buff:get('speed-buff').value,flat:get('speed-flat').value,advance:get('speed-advance').value,cycles:get('speed-cycles').value});
            get('speed-result').innerHTML=`<div class="tool-metric"><small>버프 후 속도</small><strong>${r.effective.toFixed(2)}</strong><small>기본 행동 간격 ${r.av.toFixed(2)} AV</small></div><div class="tool-metric"><small>${r.horizon} AV 동안</small><strong>${r.actions}회 행동</strong><small>첫 행동 ${r.firstAV.toFixed(2)} AV</small></div><div class="tool-metric"><small>다음 ${r.actions+1}회 목표</small><strong>+${(Math.ceil(r.needed*100)/100).toFixed(2)} 속도</strong><small>필요 전투 속도 ≥ ${r.target.toFixed(3)} · 경계에서 소수점 여유 권장</small></div>`;
        } catch(error) {get('speed-result').textContent=error.message;}
    }
    get('speed-card').addEventListener('input',speedView);speedView();compareOptions();
    ['honkai-profile-login','honkai-documents-changed'].forEach(event=>globalThis.addEventListener(event,()=>{captured={a:null,b:null};get('compare-result').textContent='';compareOptions();}));
    globalThis.addEventListener('honkai-profile-login',()=>{for(const id of ['forecast-daily','forecast-monthly','forecast-use']) get(id).checked=false;forecastView();});

    // Serialize only allowlisted plan fields; never read storage or account here.
    const groups=['character','lightcone','characterCollaboration','lightconeCollaboration'];
    function pack(kind) {
        if(kind==='warp') {const p=WarpPrepUI.plan();return [1,'w',p.goals.map(g=>[g.kind==='character'?0:1,g.id,g.current,g.target]),groups.map(g=>[p.states[g].pity,p.states[g].guaranteed?1:0])];}
        const p=RelicPlannerUI.goals();return [1,'r',p.characterId,p.targets.map(t=>[t.id,t.value,t.endValue,t.mode])];
    }
    async function encode(value) {
        let bytes=new TextEncoder().encode(JSON.stringify(value)),codec='j';
        if(globalThis.CompressionStream) {bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());codec='z';}
        return codec+btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    }
    async function decode(hash) {
        if(hash.length>12000||!/^#[zrj]?/.test(hash)) throw new Error('공유 링크가 너무 길거나 올바르지 않습니다.');
        const text=hash.replace(/^#plan=/,'');if(!/^[zj][A-Za-z0-9_-]+$/.test(text)) throw new Error('공유 링크 형식을 확인하세요.');
        const bytes=Uint8Array.from(atob(text.slice(1).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
        let stream=new Blob([bytes]).stream();if(text[0]==='z') {if(!globalThis.DecompressionStream) throw new Error('이 브라우저는 압축 링크를 지원하지 않습니다.');stream=stream.pipeThrough(new DecompressionStream('deflate'));}
        const reader=stream.getReader(),chunks=[];let size=0;
        while(true) {const {done,value}=await reader.read();if(done) break;size+=value.length;if(size>32768) {await reader.cancel();throw new Error('공유 데이터가 너무 큽니다.');} chunks.push(value);}
        const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}
        const p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
        if(!Array.isArray(p)||p[0]!==1||!['w','r'].includes(p[1])) throw new Error('지원하지 않는 공유 계획입니다.');
        return p;
    }
    for(const kind of ['warp','relic']) {
        const target=kind==='warp' ? get('prep-screen').querySelector('.prep-shell') : get('relic-share-slot');
        insert(target,`<section class="tool-card ${kind==='relic'?'relic-share-card':''}">${kind==='relic'?'<details><summary>유물 목표 공유</summary>':'<h2>뽑기 계획 공유</h2>'}<p>${kind==='warp'?'선택한 목표·현재 돌파/중첩·천장/확정 정보':'선택한 캐릭터·목표 수치·조건'}만 링크에 담습니다. 프로필·보유 목록·재화·기록·입력 능력치는 포함하지 않습니다.</p><button id="share-${kind}" type="button">계획 공유 링크 만들기</button><input id="share-link-${kind}" class="tool-share-link" readonly aria-label="${kind==='warp'?'뽑기':'유물'} 공유 링크" hidden><p id="share-status-${kind}" class="tool-status" role="status"></p>${kind==='relic'?'</details>':''}</section>`);
        get(`share-${kind}`).addEventListener('click',async()=>{
            try {const link=new URL(location.href);link.hash=`plan=${await encode(pack(kind))}`;link.search='';get(`share-link-${kind}`).value=link.href;get(`share-link-${kind}`).hidden=false;
                try {await navigator.clipboard.writeText(link.href);get(`share-status-${kind}`).textContent='링크를 복사했습니다.';} catch {get(`share-link-${kind}`).select();get(`share-status-${kind}`).textContent='링크를 선택했습니다. 복사해서 공유하세요.';}
            } catch(error) {get(`share-status-${kind}`).textContent=error.message;}
        });
    }
    insert(get('lobby-screen'),'<section id="shared-plan" class="tool-card" hidden><h2>공유받은 계획</h2><p id="shared-plan-info"></p><button id="shared-plan-apply" type="button">계산기에 열기</button><p id="shared-plan-error" role="status"></p></section>');
    let incoming=null;
    async function readLink() {if(!location.hash.startsWith('#plan=')) return;get('shared-plan').hidden=false;get('shared-plan-error').textContent='';get('shared-plan-apply').disabled=false;incoming=null;try {incoming=await decode(location.hash);get('shared-plan-info').textContent=incoming[1]==='w' ? `뽑기 목표 ${incoming[2]?.length || 0}개 · 열기 전 실제 계정과 비교하세요.` : '유물 목표 · 현재 능력치는 직접 입력하세요.';} catch(error) {incoming=null;get('shared-plan-error').textContent=error.message;get('shared-plan-apply').disabled=true;}}
    get('shared-plan-apply').addEventListener('click',()=>{try {
        if(!incoming) throw new Error('올바른 공유 계획이 없습니다.');
        if(incoming[1]==='w') {WarpPrepUI.apply({goals:incoming[2].map(g=>({kind:g[0]===0?'character':g[0]===1?'lightcone':'invalid',id:g[1],current:g[2],target:g[3]})),states:Object.fromEntries(groups.map((group,i)=>{const s=incoming[3][i];if(![0,1].includes(s[1])) throw new Error('확정 정보가 올바르지 않습니다.');return [group,{pity:s[0],guaranteed:s[1]===1}];}))});openWarpPrep();}
        else {showRelicView('analysis');RelicPlannerUI.applyGoals({characterId:incoming[2],targets:incoming[3].map(t=>({id:t[0],value:t[1],endValue:t[2],mode:t[3]}))});openRelicCalculator();}
        get('shared-plan-error').textContent='계산기에 열었습니다. 저장하려면 직접 저장 버튼을 누르세요.';
    } catch(error) {get('shared-plan-error').textContent=error.message;}});
    readLink();globalThis.addEventListener('hashchange',readLink);
    globalThis.HonkaiPlanCodec=Object.freeze({encode,decode,pack});
})();
