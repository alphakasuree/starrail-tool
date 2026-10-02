(() => {
    'use strict';
    const labels={crit:'치명타',atk:'공격력',hp:'HP',damage:'피해 지원',advance:'행동 지원',energy:'에너지',speed:'속도',sp:'스킬 포인트',break:'격파',superbreak:'슈퍼 격파',dot:'지속 피해',fua:'추가 공격',summon:'소환수',memory:'기억 정령',elation:'환락',ultimate:'필살기',debuff:'디버프',skill:'전투 스킬',aoe:'광역',heal:'회복',shield:'보호',spHungry:'SP 소비 주의'};
    Object.assign(labels,{efficiency:'격파 효율',resPen:'저항 관통'});
    class SynergyCharacter {
        constructor(character, reference, metadata, data) {
            Object.assign(this,character);
            this.entityId = /^80\d\d$/.test(this.id) ? 'trailblazer' : ['1001','1224'].includes(this.id) ? 'march7' : this.id;
            this.roles = (metadata?.roles || (/딜러|지속딜|판결|섬멸/.test(reference?.role || '') ? 'main' : '')).split(' ').filter(Boolean);
            this.tags = new Set(metadata?.tags || []);
            for (const [tag,ids] of Object.entries(data.mainTags)) if (ids.includes(this.id)) this.tags.add(tag);
            if (this.roles.includes('main') && !this.tags.has('dot') && !this.tags.has('break')) this.tags.add('crit');
            this.buffs = metadata?.buffs || {};
            this.reason = metadata?.reason || '메인 딜러의 유효 능력치에 맞춰 지원 역할을 찾습니다.';
            this.sp = metadata?.sp || 0;
            this.reference = reference;
            this.guide = data.guides[this.id];
        }
        needs() {
            const n={damage:2,crit:3,atk:2,advance:2,energy:1,speed:1,sp:1,debuff:1};
            if (this.tags.has('hp')) Object.assign(n,{atk:0,hp:3,heal:1});
            if (this.tags.has('break')) Object.assign(n,{crit:0,damage:0,atk:.5,break:5,superbreak:4,efficiency:4,resPen:2,debuff:2});
            if (this.tags.has('dot')) Object.assign(n,{crit:0,atk:3,dot:5,debuff:2,advance:.5});
            if (this.tags.has('fua')) n.fua=4;
            if (this.tags.has('summon')) n.summon=5;
            if (this.tags.has('memory')) n.memory=5;
            if (this.tags.has('elation')) Object.assign(n,{elation:6,sp:2,energy:.5});
            if (this.tags.has('skill')) n.skill=4;
            if (this.tags.has('spHungry')) n.sp=2;
            if (['1308','1220','1407'].includes(this.id)) n.energy=0;
            if (this.id==='1308') Object.assign(n,{debuff:5,ultimate:4});
            if (this.id==='1505') Object.assign(n,{atk:0,energy:5});
            if (this.id==='1402') n.energy=4;
            return n;
        }
        compatibility(member) {
            const needs=this.needs();
            const matches=Object.entries(member.buffs).filter(([tag])=>needs[tag]>0).map(([tag,value])=>({tag,points:value*needs[tag]*2})).sort((a,b)=>b.points-a.points);
            let score=matches.reduce((sum,m)=>sum+m.points,0)+(this.guide?.partners[member.id] || 0);
            if(this.id==='1504' && member.id==='1309') score-=60;
            if (member.roles.includes('sustain')) score+=20;
            return {score,matches,reason:member.reason,guidePartner:!!this.guide?.partners[member.id]};
        }
    }
    function createModels(catalog, references, data) {return catalog.map(c=>new SynergyCharacter(c,references[c.id],data.units[c.id],data));}
    function presetTeams(models,main,options) {
        if(typeof teamMetaPresets==='undefined') return [];
        const owned=options.owned || new Set();
        return teamMetaPresets.recipes.filter(r=>r.main===main.id && (!r.requiresE2 || options.acheronE2) && (!r.noSustain || options.offensive!==false)).flatMap(recipe=>{
            const members=recipe.slots.map((slot,i)=>(Array.isArray(slot) ? slot : [slot]).map(id=>models.find(c=>c.id===id)).find(c=>c && (!options.ownedOnly || owned.has(c.id)) && (i===0 || !options.fourStarOnly || c.rarity===4)));
            if(members.some(c=>!c) || new Set(members.map(c=>c.entityId)).size!==4) return [];
            if(main.id==='1308' && members.slice(1).filter(c=>c.pathName==='공허').length<(options.acheronE2 ? 1 : 2)) return [];
            if(main.id==='1401' && !members.slice(1).some(c=>c.pathName==='지식')) return [];
            return [{members,details:members.slice(1).map(c=>({member:c,...main.compatibility(c)})),score:null,warnings:recipe.notes.slice(),recipe,evidence:'guide-synthesis'}];
        });
    }
    function mergeRecommendations(curated,inferred) {
        const seen=new Set();
        return [...curated,...inferred].filter(t=>{
            const key=[t.members[0].entityId,...t.members.slice(1).map(c=>c.entityId).sort()].join(':');
            if(seen.has(key)) return false;seen.add(key);return true;
        }).slice(0,3);
    }
    function recommend(models, mainId, options={}) {
        const main=models.find(c=>c.id===mainId && c.roles.includes('main'));
        if (!main) return {teams:[],message:'메인 딜러를 선택하세요.'};
        const owned=options.owned || new Set();
        if (options.ownedOnly && !owned.has(main.id)) return {teams:[],message:'선택한 메인 딜러를 아직 획득하지 않았습니다. 보유 필터를 해제하거나 다른 딜러를 선택하세요.'};
        const curated=presetTeams(models,main,options);
        const available=models.filter(c=>c.entityId!==main.entityId && (!options.ownedOnly || owned.has(c.id)) && (!options.fourStarOnly || c.rarity===4));
        const assists=available.filter(c=>c.roles.includes('support') && (!c.roles.includes('main') || c.tags.has('dot') && main.tags.has('dot') || c.tags.has('fua') && main.tags.has('fua') || c.tags.has('elation') && main.tags.has('elation') || c.tags.has('memory') && main.tags.has('memory') || main.id==='1401' && c.pathName==='지식' || main.id==='1015' && c.id==='1508' || c.pathName==='공허' && main.id==='1308'));
        const sustains=available.filter(c=>c.roles.includes('sustain') && (!main.tags.has('hp') || c.buffs.heal));
        if (!sustains.length || assists.length<2) return {teams:curated.slice(0,3),message:curated.length ? '' : '필터 조건에 맞는 공략 조합과 지원·생존 캐릭터가 부족합니다. 보유·4성 필터를 조정하세요.'};
        const teams=[];
        for(let i=0;i<assists.length;i++) for(let j=i+1;j<assists.length;j++) for(const sustain of sustains) {
            const members=[main,assists[i],assists[j],sustain];
            if(new Set(members.map(c=>c.entityId)).size!==4) continue;
            const peers=members.slice(1);
            if(peers.some(c=>c.id==='1507') && !sustain.buffs.heal) continue;
            if(main.id==='1308' && peers.filter(c=>c.pathName==='공허').length<(options.acheronE2 ? 1 : 2)) continue;
            if(main.id==='1401' && !peers.some(c=>c.pathName==='지식')) continue;
            if(main.id==='1410' && !peers.some(c=>c.id==='1005')) continue;
            if(main.id==='1005' && !peers.some(c=>c.tags.has('dot'))) continue;
            const details=peers.map(c=>({member:c,...main.compatibility(c)}));
            let score=details.reduce((sum,d)=>sum+d.score,0);
            const warnings=[];
            if(main.tags.has('elation')) {
                const elation=members.filter(c=>c.pathName==='환락').length;
                score+=elation*12;
                if(sustain.id==='1503' && elation<4) warnings.push('환락 4명 조건을 충족하지 않아 펄의 추가 턴 효과를 전부 활용하지 못합니다.');
            }
            if(main.tags.has('break') && !peers.some(c=>c.buffs.superbreak) && ['1310','1317'].includes(main.id)) {score-=60;warnings.push('슈퍼 격파 지원이 없어 주력 격파 운용이 제한됩니다.');}
            if(main.tags.has('fua') && peers.some(c=>c.buffs.fua)) score+=12;
            const sp=peers.reduce((sum,c)=>sum+c.sp,0)-(main.tags.has('spHungry') ? 2 : 1);
            if(sp<0) {score-=12;warnings.push('스킬 포인트 소비가 겹칠 수 있습니다. 기본 공격과 스킬 순서를 조정하세요.');}
            if(main.id==='1308') warnings.push(options.acheronE2 ? '아케론 2돌 이상 · 공허 동료 1명 조건으로 추천했습니다.' : '아케론 0~1돌 · 공허 동료 2명 조건을 반영했습니다.');
            if(main.id==='1305') warnings.push('레이시오의 추가 공격 조건을 위해 적에게 디버프 3개 이상을 유지하세요.');
            if(peers.some(c=>['1101','1313','1207'].includes(c.id))) warnings.push('행동 지원 버프를 활용하도록 딜러와 지원 캐릭터의 속도를 맞추세요.');
            if(main.id==='1501' && sustain.id==='1503') warnings.push('펄의 필살기 대상과 추가 턴의 SP 소비를 확인하세요.');
            teams.push({members,details,score:Math.round(score),warnings,evidence:'heuristic'});
        }
        teams.sort((a,b)=>b.score-a.score || a.members.map(c=>c.id).join().localeCompare(b.members.map(c=>c.id).join()));
        const selected=[];
        const keys=new Set();
        // Prefer alternatives with different support pairs rather than only changing the sustain.
        for(const team of teams) {
            const key=team.members.slice(1,3).map(c=>c.id).sort().join(':');
            if(keys.has(key)) continue;
            keys.add(key);selected.push(team);if(selected.length===3) break;
        }
        for(const team of teams) {if(selected.length===3) break;if(!selected.includes(team)) selected.push(team);}
        const combined=mergeRecommendations(curated,selected);
        return {teams:combined,message:combined.length ? '' : main.id==='1410' ? '히실렌스의 핵심 동료인 카프카가 필터에 포함되어 있지 않습니다.' : '현재 필터로는 딜러의 핵심 편성 조건을 충족할 수 없습니다. 필터를 조정하세요.'};
    }
    globalThis.TeamSynergy=Object.freeze({SynergyCharacter,createModels,recommend,presetTeams,labels});
    if(typeof document==='undefined') return;
    const get=id=>document.getElementById(id);
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const models=createModels(characterCatalog,relicBuildReference,teamSynergyData);
    const mains=models.filter(c=>c.roles.includes('main'));
    let currentTeams=[],savedTeams=[],previousFocus=null;
    const owned=()=>globalThis.HonkaiAccount?.owned() || new Set();
    function fillMains() {
        const normalize=v=>v.toLocaleLowerCase().replace(/[\s.•·()]/g,'');
        const query=normalize(get('team-search').value);
        const selected=get('team-main').value;
        const matches=mains.filter(c=>normalize(`${c.name} ${c.pathName} ${c.id==='1224' ? '삼칠이' : ''}`).includes(query));
        get('team-main').innerHTML=matches.length ? matches.map(c=>`<option value="${c.id}">${escape(c.name)} · ${escape(c.pathName)}</option>`).join('') : '<option value="">검색 결과가 없습니다</option>';
        get('team-main').disabled=!matches.length;
        if(matches.some(c=>c.id===selected)) get('team-main').value=selected;
        get('team-search-count').textContent=`메인 딜러 ${matches.length}명`;
        render();
    }
    function memberCard(c,index) {
        const role=index===0 ? '메인 딜러' : c.roles.includes('sustain') ? '힐러 / 탱커' : c.roles.includes('main') ? '연계 / 서브 딜러' : '서포터';
        const investment=globalThis.HonkaiAccount?.get(c.id);
        return `<div class="team-member"><img src="${escape(c.image)}" alt="${escape(c.name)}" loading="lazy"><small>${role}</small><strong>${escape(c.name)}</strong><span>${escape(c.pathName)} · ${escape(c.elementName)}</span><b class="${owned().has(c.id) ? 'owned' : ''}">${owned().has(c.id) ? `E${investment.e} · ${investment.s ? `전용 S${investment.s}` : '전용 미보유'}` : '미보유'}</b></div>`;
    }
    function render() {
        const main=models.find(c=>c.id===get('team-main').value);
        const accountMain=globalThis.HonkaiAccount?.get(main?.id);
        if(accountMain?.owned) {get('team-acheron-e2').checked=accountMain.e>=2;get('team-acheron-e2').disabled=true;}
        else get('team-acheron-e2').disabled=false;
        get('team-e2-setting').hidden=main?.id!=='1308';
        get('team-main-info').innerHTML=main ? `<img src="${escape(main.image)}" alt="${escape(main.name)}"><div><h2>${escape(main.name)}</h2><p>${[...main.tags].filter(t=>labels[t]).map(t=>`<span>${labels[t]}</span>`).join('')}</p><small>${teamMetaPresets.recipes.some(r=>r.main===main.id) ? '공략 기반 핵심 편성 우선 · 조건 함께 확인' : '고점 자료 미등록 · 호환성 추정만 제공'}</small></div>` : '';
        const result=recommend(models,main?.id,{owned:owned(),ownedOnly:get('team-owned-only').checked,fourStarOnly:get('team-four-star').checked,acheronE2:get('team-acheron-e2').checked,offensive:get('team-offensive').checked});
        currentTeams=result.teams;
        for(const team of currentTeams) {
            if(team.members.some(c=>c.id==='1308')) for(const id of ['1409','1406']) {
                if(team.members.some(c=>c.id===id) && !globalThis.HonkaiAccount?.get(id).s) team.warnings.push(`${models.find(c=>c.id===id).name}: 전용 광추 미보유 · 광추에 의존하는 디버프 지원은 적용할 수 없습니다.`);
            }
        }
        get('team-results').innerHTML=currentTeams.length ? currentTeams.map((team,i)=>`<article class="team-recommendation"><header><div><small>RECOMMENDATION 0${i+1}</small><h3>${team.recipe ? escape(team.recipe.title) : '호환성 추정 대안'}</h3></div><span>${team.recipe ? `공략 기반<b>${team.recipe.noSustain ? '무생존 고점 후보' : '핵심 편성 후보'}</b>` : `추정 점수<b>${team.score}</b>`}</span></header><div class="team-members">${team.members.map(memberCard).join('')}</div><p class="team-evidence">${team.recipe ? '공략의 개별 시너지 설명을 바탕으로 재구성한 후보입니다. 같은 성혼·광추·적 조건에서 측정한 DPS 순위는 아닙니다.' : '보유·필터 조건에 맞춰 계산한 추정 대안입니다. 검증된 고점 편성으로 취급하지 않습니다.'}</p><div class="team-reasons">${team.details.map(d=>`<p><strong>${escape(d.member.name)}</strong> ${escape(d.reason)}<small>${d.matches.slice(0,3).map(m=>labels[m.tag]).join(' · ')}${d.guidePartner && team.recipe ? ' · 공략 시너지 동료' : ''}</small></p>`).join('')}</div>${team.warnings.length ? `<div class="team-notes">${team.warnings.map(w=>`<p>ⓘ ${escape(w)}</p>`).join('')}</div>` : ''}<footer>${team.recipe ? `<div class="team-source-links">${team.recipe.sourceKeys.map(key=>{const source=teamMetaPresets.sources[key];return `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a><small>확인 ${source.checkedAt}${source.updatedAt ? ` · 원문 갱신 ${source.updatedAt}` : ''}</small>`;}).join('')}</div>` : '<a href="docs/references/relic-setting-reference.pdf" target="_blank" rel="noopener noreferrer">세팅 표 / 추정 기준 ↗</a>'}<button type="button" id="team-save-${i}">이 파티 저장 +</button></footer></article>`).join('') : `<p class="team-empty" role="status">${escape(result.message)}</p>`;
        currentTeams.forEach((team,i)=>get(`team-save-${i}`).addEventListener('click',()=>saveTeam(team)));
    }
    function renderSaved() {
        get('team-saved').innerHTML=savedTeams.length ? savedTeams.map((s,i)=>`<button type="button" id="team-saved-${i}"><strong>${escape(s.ids.map(id=>models.find(c=>c.id===id)?.name || '').join(' / '))}</strong><small>${escape(new Date(s.savedAt).toLocaleString('ko-KR'))} · 눌러서 보기</small></button>`).join('') : '<p class="team-muted">저장한 파티가 없습니다.</p>';
        savedTeams.forEach((s,i)=>get(`team-saved-${i}`).addEventListener('click',()=>{
            get('team-search').value='';get('team-owned-only').checked=s.ownedOnly;get('team-four-star').checked=s.fourStarOnly;get('team-acheron-e2').checked=s.acheronE2;get('team-offensive').checked=s.offensive;
            fillMains();get('team-main').value=s.ids[0];render();
            get('team-saved-preview').innerHTML=`<h3>저장한 파티</h3><div class="team-members">${s.ids.map((id,j)=>memberCard(models.find(c=>c.id===id),j)).join('')}</div><p class="team-muted">저장 당시 편성입니다. 위 추천은 현재 보유 상태와 필터로 다시 계산했습니다.</p>`;
            get('team-status').textContent='저장한 파티를 불러왔습니다.';
        }));
    }
    async function saveTeam(team) {
        if(!HonkaiProfileStorage.id) return;
        const record={ids:team.members.map(c=>c.id),savedAt:Date.now(),ownedOnly:get('team-owned-only').checked,fourStarOnly:get('team-four-star').checked,acheronE2:get('team-acheron-e2').checked,offensive:get('team-offensive').checked};
        const next=[...savedTeams.filter(s=>s.ids.join(':')!==record.ids.join(':')),record];
        try {await HonkaiProfileStorage.setItem('teams',JSON.stringify(next));savedTeams=next;renderSaved();get('team-status').textContent=`${HonkaiProfileStorage.id} 아이디에 파티를 저장했습니다. 이 브라우저에 보관됩니다.`;}
        catch (error) {get('team-status').textContent=`파티를 저장하지 못했습니다. ${error.message}`;}
    }
    ['honkai-profile-login','honkai-documents-changed'].forEach(event=>globalThis.addEventListener(event,()=>{
        savedTeams=[];
        try {
            const stored=JSON.parse(HonkaiProfileStorage.getItem('teams') || '[]');
            if(!Array.isArray(stored)) throw new Error();
            savedTeams=stored.filter(s=>s && Array.isArray(s.ids) && s.ids.length===4 && s.ids.every(id=>models.some(c=>c.id===id)) && new Set(s.ids.map(id=>models.find(c=>c.id===id).entityId)).size===4 && mains.some(c=>c.id===s.ids[0]) && Number.isFinite(s.savedAt)).map(s=>({...s,ownedOnly:!!s.ownedOnly,fourStarOnly:!!s.fourStarOnly,acheronE2:!!s.acheronE2,offensive:!!s.offensive}));
            get('team-status').textContent='';
        } catch {get('team-status').textContent='저장한 파티 데이터를 읽을 수 없습니다.';}
        renderSaved();
    }));
    get('team-search').addEventListener('input',()=>{get('team-saved-preview').innerHTML='';fillMains();});
    ['team-main','team-owned-only','team-four-star','team-acheron-e2','team-offensive'].forEach(id=>get(id).addEventListener('change',()=>{get('team-saved-preview').innerHTML='';render();}));
    fillMains();get('team-main').value='1310';render();renderSaved();
    globalThis.addEventListener('honkai-account-changed',render);
    globalThis.openTeamBuilder=()=>{
        if(isWarping || !HonkaiProfileStorage.id) return;
        previousFocus=document.activeElement;
        get('lobby-screen').style.display='none';get('team-screen').hidden=false;get('team-screen').scrollTop=0;render();get('team-search').focus();
    };
    globalThis.closeTeamBuilder=()=>{get('team-screen').hidden=true;get('lobby-screen').style.display='flex';get('lobby-screen').style.opacity='1';previousFocus?.focus();};
    get('team-back').addEventListener('click',globalThis.closeTeamBuilder);
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && !get('team-screen').hidden) globalThis.closeTeamBuilder();});
})();
