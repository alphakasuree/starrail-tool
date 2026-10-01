(() => {
    'use strict';
    // Highest 5-star roll: base + 2 * step, from StarRailRes/relic_sub_affixes.json.
    const stats = [
        { id: 'cr', name: '치명타 확률', unit: '%', roll: 3.24 },
        { id: 'cd', name: '치명타 피해', unit: '%', roll: 6.48 },
        { id: 'spd', name: '속도', unit: '', roll: 2.6 },
        { id: 'atk', name: '공격력', unit: '%', roll: 4.32 },
        { id: 'hp', name: 'HP', unit: '%', roll: 4.32 },
        { id: 'def', name: '방어력', unit: '%', roll: 5.4 },
        { id: 'break', name: '격파 특수효과', unit: '%', roll: 6.48 },
        { id: 'ehr', name: '효과 명중', unit: '%', roll: 4.32 },
        { id: 'res', name: '효과 저항', unit: '%', roll: 4.32 },
        { id: 'flatAtk', name: '공격력 (고정)', unit: '', roll: 21.16876 },
        { id: 'flatHp', name: 'HP (고정)', unit: '', roll: 42.33752 },
        { id: 'flatDef', name: '방어력 (고정)', unit: '', roll: 21.16876 }
    ];
    const profiles = {
        crit: { name: '공격력 · 치명타 딜러', weights: {cr: 1, cd: 1, spd: .85, atk: .5, flatAtk: .1} },
        hpCrit: { name: 'HP · 치명타 딜러', weights: {cr: 1, cd: 1, hp: .75, spd: .7, flatHp: .15} },
        defCrit: { name: '방어력 · 치명타 딜러', weights: {cr: 1, cd: 1, def: .75, spd: .7, flatDef: .15} },
        dot: { name: '지속 피해 · 효과 명중', weights: {atk: 1, spd: 1, ehr: .85, flatAtk: .2, res: .1} },
        break: { name: '격파 · 속도', weights: {break: 1, spd: 1, atk: .35, res: .25, hp: .15, def: .15} },
        support: { name: '속도 · 지원', weights: {spd: 1, res: .65, hp: .5, def: .5, flatHp: .1, flatDef: .1} },
        critSupport: { name: '치명타 피해 · 지원', weights: {spd: 1, cd: 1, res: .5, hp: .4, def: .3} },
        atkSupport: { name: '공격력 · 지원', weights: {spd: 1, atk: 1, res: .65, hp: .35, def: .3, flatAtk: .15} },
        atkHeal: { name: '공격력 · 회복', weights: {spd: 1, atk: 1, res: .65, hp: .3, def: .3, flatAtk: .15} },
        defSupport: { name: '방어력 · 지원', weights: {spd: 1, def: 1, res: .65, hp: .35, flatDef: .2} },
        hpSupport: { name: 'HP · 회복 / 지원', weights: {spd: 1, hp: 1, res: .65, def: .3, flatHp: .2} },
        debuff: { name: '효과 명중 · 지원', weights: {spd: 1, ehr: 1, res: .5, hp: .35, def: .3} }
    };
    const characterProfiles = {
        '1004': 'crit', '1005': 'dot', '1006': 'debuff', '1101': 'critSupport',
        '1103': 'crit', '1106': 'debuff', '1107': 'crit', '1108': 'dot',
        '1202': 'atkSupport', '1203': 'atkHeal', '1205': 'hpCrit', '1206': 'crit',
        '1208': 'hpSupport', '1209': 'crit', '1211': 'hpSupport', '1212': 'crit',
        '1213': 'crit', '1214': 'break', '1303': 'break', '1304': 'defCrit',
        '1308': 'crit', '1310': 'break', '1314': 'crit', '1315': 'break',
        '8001': 'crit', '8002': 'crit', '8003': 'defSupport', '8004': 'defSupport',
        '8005': 'break', '8006': 'break', '8007': 'critSupport', '8008': 'critSupport', '1503': 'defSupport'
    };
    const pathProfiles = {Knight: 'defSupport', Priest: 'hpSupport', Shaman: 'support', Warlock: 'dot'};
    const ranks = [
        {min: 90, name: 'SSS', color: '#ffe4a3', message: '종결급 유물! 오래 함께할 한 조각입니다.'},
        {min: 80, name: 'SS', color: '#dfbdff', message: '매우 우수합니다. 유효 옵션이 탄탄해요.'},
        {min: 70, name: 'S', color: '#a5dfef', message: '좋은 유물입니다. 충분히 활약할 수 있어요.'},
        {min: 55, name: 'A', color: '#a8f4d0', message: '준수합니다. 다음 업그레이드 전까지 사용해보세요.'},
        {min: 35, name: 'B', color: '#a5b8f2', message: '일부 유효 옵션이 있습니다. 더 좋은 유물을 노려보세요.'},
        {min: 0, name: 'C', color: '#9cabbc', message: '선택한 빌드에는 유효 옵션이 부족합니다.'}
    ];

    function calculate(rows, weights) {
        const validWeights = {};
        for (const stat of stats) {
            const weight = Number(weights[stat.id] ?? 0);
            if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error('가중치는 0~1 사이로 입력해주세요.');
            validWeights[stat.id] = weight;
        }
        const best = Object.values(validWeights).sort((a, b) => b - a);
        const ceiling = best.slice(0, 4).reduce((sum, n) => sum + n, 0) + 5 * best[0];
        if (!ceiling) throw new Error('유효 옵션의 가중치를 하나 이상 설정해주세요.');
        if (rows.length > 4) throw new Error('부옵션은 최대 4줄까지 입력할 수 있습니다.');
        const used = new Set();
        const contributions = [];
        let rolls = 0, cv = 0, effective = 0;
        for (const row of rows) {
            const stat = stats.find(s => s.id === row.id);
            if (!stat) throw new Error('부옵션 종류를 확인해주세요.');
            const value = Number(row.value);
            if (!Number.isFinite(value) || value < 0) throw new Error('부옵션 수치는 0 이상의 숫자로 입력해주세요.');
            if (!value) continue;
            if (used.has(row.id)) throw new Error('같은 부옵션을 두 번 입력할 수 없습니다.');
            used.add(row.id);
            if (value > stat.roll * 6 + .11) throw new Error(`${stat.name} 수치가 5성 유물 한 개의 최대 범위를 넘었습니다.`);
            const units = value / stat.roll;
            rolls += units;
            const weighted = units * validWeights[row.id];
            effective += weighted;
            if (row.id === 'cr') cv += value * 2;
            if (row.id === 'cd') cv += value;
            contributions.push({stat, value, weight: validWeights[row.id], weighted, points: weighted / ceiling * 100});
        }
        if (!used.size) throw new Error('부옵션 수치를 하나 이상 입력해주세요.');
        if (rolls > 9.08) throw new Error('수치 합이 5성 +15 유물 한 개의 범위를 넘었습니다. 주옵션이나 캐릭터 전체 수치를 넣지 않았는지 확인해주세요.');
        const score = Math.min(100, Math.round(effective / ceiling * 1000) / 10);
        return {score, rank: ranks.find(rank => score >= rank.min), cv, effective, contributions};
    }
    const buildRanks = [{min:100,name:'SSS'}, {min:95,name:'SS'}, {min:85,name:'S'}, {min:70,name:'A'}, {min:50,name:'B'}, {min:0,name:'C'}].map((rank, i) => ({...rank, color:ranks[i].color}));
    function endgameGoal(target) {
        const goal = Number(target.value);
        if (target.mode !== 'min') return goal;
        if (target.id === 'cr') return Math.min(100, goal + 5);
        if (['flatAtk','flatHp','flatDef','cd','break'].includes(target.id)) return Math.round(goal * 1.15 * 10) / 10;
        // Speed tuning and hit/resistance requirements must keep the build's conditions.
        return goal;
    }
    function calculateBuild(targets) {
        if (!targets.length) throw new Error('표에 숫자 목표가 없습니다. 원문을 참고해 비교 목표를 추가해주세요.');
        const used = new Set();
        const contributions = targets.map(target => {
            const stat = stats.find(s => s.id === target.id);
            if (!stat || used.has(target.id)) throw new Error('비교 목표의 종류가 중복되었거나 올바르지 않습니다.');
            used.add(target.id);
            const value = Number(target.current), goal = Number(target.value), endGoal = Number(target.endValue ?? target.value);
            if (target.current === '' || target.current == null || !Number.isFinite(value) || value < 0) throw new Error(`${stat.name} 현재 수치를 입력해주세요.`);
            if (['spd','flatAtk','flatHp','flatDef'].includes(target.id) && value <= 0) throw new Error(`${stat.name} 현재 수치는 0보다 커야 합니다.`);
            if (!Number.isFinite(goal) || goal <= 0) throw new Error(`${stat.name} 목표 수치는 0보다 커야 합니다.`);
            if (!['min','max','lt'].includes(target.mode)) throw new Error('비교 조건을 확인해주세요.');
            if (target.endValue === '' || !Number.isFinite(endGoal) || endGoal <= 0) throw new Error(`${stat.name} 종결 목표를 입력해주세요.`);
            if (target.mode === 'min' ? endGoal < goal : endGoal > goal) throw new Error(`${stat.name} 종결 목표는 준종결보다 엄격하거나 같아야 합니다.`);
            if (target.id === 'cr' && Math.max(value, goal, endGoal) > 100) throw new Error('치명타 확률은 100% 이내로 입력해주세요.');
            const met = target.mode === 'min' ? value >= goal : target.mode === 'lt' ? value < goal : value <= goal;
            const endMet = target.mode === 'min' ? value >= endGoal : target.mode === 'lt' ? value < endGoal : value <= endGoal;
            const progressive = endGoal !== goal;
            const progress = !progressive ? 0 : Math.max(0, Math.min(1, target.mode === 'min' ? (value-goal)/(endGoal-goal) : (goal-value)/(goal-endGoal)));
            const ratio = Math.min(1, target.mode === 'min' ? value / goal : value === 0 ? 1 : goal / value);
            return {stat, value, goal, endGoal, mode:target.mode, met, endMet, progressive, progress, ratio, points:ratio / targets.length * 85};
        });
        const fulfilled = contributions.filter(c => c.met).length;
        const allMet = fulfilled === targets.length;
        const improving = contributions.filter(c=>c.progressive);
        const endFulfilled = contributions.filter(c=>c.endMet).length;
        const allEnd = improving.length > 0 && endFulfilled === targets.length;
        const raw = allMet ? 85 + (improving.length ? 15 * improving.reduce((sum,c)=>sum+c.progress,0)/improving.length : 0) : contributions.reduce((sum,c)=>sum+c.points,0);
        const score = allEnd ? 100 : Math.min(allMet ? 99.9 : 84.9, Math.round(raw*10)/10);
        return {score, rank:buildRanks.find(r=>score>=r.min), contributions, fulfilled, endFulfilled, allEnd, hasEndGoals:improving.length>0, total:targets.length};
    }
    globalThis.RelicScoring = Object.freeze({calculate, calculateBuild, endgameGoal, stats, profiles, ranks, buildRanks});
    if (typeof document === 'undefined') return;

    const get = id => document.getElementById(id);
    const calculatorCharacters = [...characterCatalog, ...relicReferenceExtraCharacters];
    let mode = 'build';
    let buildTargets = [];
    let buildGoalsEdited = false;
    let animation = 0;
    let previousFocus = null;
    const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
    const saveKey = 'relic';
    let savedSetups = [];
    let storageError = '';
    function readSavedSetups() {
        savedSetups=[];storageError='';
        try {
        const stored = HonkaiProfileStorage.getItem(saveKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) throw new Error();
            savedSetups = parsed.filter(s=>s && typeof s.id==='string' && typeof s.characterId==='string' && typeof s.name==='string');
        }
        } catch { storageError = '저장 데이터를 읽을 수 없습니다. 브라우저의 저장 허용 설정을 확인하세요.'; }
    }
    globalThis.addEventListener('honkai-profile-login',()=>{
        readSavedSetups();
        get('relic-save-name').value='';
        const latest = savedSetups.slice().reverse().find(s=>calculatorCharacters.some(c=>c.id===s.characterId));
        if (latest) get('relic-character-select').value=latest.characterId;
        changeCharacter();
        changeMode('build');
        if (latest) {get('relic-saved-select').value=latest.id;loadSetup();}
    });
    function refreshSavedSetups(selectedId) {
        const entries = savedSetups.filter(s=>s.characterId===get('relic-character-select').value);
        get('relic-saved-select').innerHTML = entries.length ? entries.map(s=>`<option value="${escape(s.id)}">${escape(s.name)} · ${s.mode==='item' ? '유물' : '세팅'} · ${escape(new Date(s.savedAt).toLocaleString('ko-KR'))}</option>`).join('') : '<option value="">저장된 세팅이 없습니다</option>';
        if (selectedId) get('relic-saved-select').value = selectedId;
        get('relic-load').disabled = !entries.length;
        get('relic-delete').disabled = !entries.length || Boolean(storageError);
        get('relic-save-status').textContent = storageError || `${entries.length}개 저장됨 · ${HonkaiProfileStorage.id || '접속 전'} 아이디 / 이 브라우저에 보관됩니다.`;
    }
    function saveSetup() {
        if (!HonkaiProfileStorage.id) {get('relic-save-status').textContent='아이디를 입력하고 접속하세요.';return;}
        if (!get('relic-character-select').value) {get('relic-save-status').textContent='캐릭터를 먼저 선택하세요.';return;}
        if (storageError) {get('relic-save-status').textContent=storageError;return;}
        const character = calculatorCharacters.find(c=>c.id===get('relic-character-select').value);
        const setup = {
            id:globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name:get('relic-save-name').value.trim().slice(0,60) || `${character.name} ${mode==='build' ? '세팅' : '유물'}`,
            characterId:character.id, mode, savedAt:Date.now(), buildGoalsEdited,
            targets:readBuildTargets(), profile:get('relic-profile-select').value,
            rows:Array.from({length:4},(_,i)=>({id:get(`relic-stat-${i}`).value,value:get(`relic-value-${i}`).value})),
            weights:Object.fromEntries(stats.map(s=>[s.id,get(`relic-weight-${s.id}`).value]))
        };
        try {
            const next = [...savedSetups,setup];
            HonkaiProfileStorage.setItem(saveKey,JSON.stringify(next));
            savedSetups=next;refreshSavedSetups(setup.id);
            get('relic-save-status').textContent=`‘${setup.name}’ 저장 완료. 입력 중인 수치와 목표도 함께 저장했습니다.`;
        } catch {get('relic-save-status').textContent='저장하지 못했습니다. 브라우저 저장 공간과 저장 허용 설정을 확인하세요.';}
    }
    function deleteSetup() {
        if (!HonkaiProfileStorage.id || storageError) return;
        const index = savedSetups.findIndex(s=>s.id===get('relic-saved-select').value && s.characterId===get('relic-character-select').value);
        if (index < 0) return;
        const setup = savedSetups[index];
        try {
            const next = savedSetups.filter((_,i)=>i!==index);
            HonkaiProfileStorage.setItem(saveKey,JSON.stringify(next));
            savedSetups=next;refreshSavedSetups();
            get('relic-save-status').textContent=`‘${setup.name}’ 삭제 완료.`;
        } catch {get('relic-save-status').textContent='삭제하지 못했습니다. 브라우저 저장 허용 설정을 확인하세요.';}
    }
    function loadSetup() {
        const setup = savedSetups.find(s=>s.id===get('relic-saved-select').value && s.characterId===get('relic-character-select').value);
        if (!setup) return;
        try {
            const numeric = value => value==='' || (typeof value==='string' || typeof value==='number') && Number.isFinite(Number(value)) && Number(value)>=0;
            if (!['build','item'].includes(setup.mode) || !Array.isArray(setup.targets) || !Array.isArray(setup.rows) || setup.rows.length!==4 || !setup.weights || !['pdf',...Object.keys(profiles)].includes(setup.profile)) throw new Error();
            const used = new Set();
            const targets = setup.targets.map(t=>{
                if (!t || !stats.some(s=>s.id===t.id) || used.has(t.id) || !['min','max','lt'].includes(t.mode) || ![t.value,t.endValue,t.current].every(numeric)) throw new Error();
                used.add(t.id);return {id:t.id,value:t.value,endValue:t.endValue,current:t.current,mode:t.mode};
            });
            if (!setup.rows.every(r=>r && stats.some(s=>s.id===r.id) && numeric(r.value)) || !stats.every(s=>numeric(setup.weights[s.id]) && Number(setup.weights[s.id])<=1)) throw new Error();
            buildTargets=targets;buildGoalsEdited=Boolean(setup.buildGoalsEdited);renderBuildTargets();
            get('relic-profile-select').value=setup.profile;
            stats.forEach(s=>get(`relic-weight-${s.id}`).value=setup.weights[s.id]);
            setup.rows.forEach((r,i)=>{get(`relic-stat-${i}`).value=r.id;get(`relic-value-${i}`).value=r.value;updateUnit(i);});
            get('relic-profile-note').textContent='저장한 가중치를 불러왔습니다.';
            get('relic-save-name').value=setup.name;
            changeMode(setup.mode);
            get('relic-save-status').textContent=`‘${setup.name}’ 불러오기 완료. 분석 버튼으로 다시 평가하세요.`;
        } catch {get('relic-save-status').textContent='이 세팅의 저장 데이터가 올바르지 않아 불러올 수 없습니다.';}
    }
    function clearResult() {
        cancelAnimationFrame(animation);
        get('relic-rank').textContent = '—';
        get('relic-score').textContent = '0.0';
        get('relic-announcement').textContent = mode === 'build' ? '현재 능력치를 입력하면 목표 달성률이 나옵니다.' : '부옵션을 입력하면 등급이 나옵니다.';
        get('relic-cv').textContent = '—';
        get('relic-effective').textContent = '—';
        get('relic-breakdown').innerHTML = '<p class="relic-muted">각 옵션이 점수에 얼마나 기여하는지 확인할 수 있습니다.</p>';
        get('relic-result').style.setProperty('--rank-color', '#91a4b8');
        get('relic-result').style.setProperty('--score-angle', '0deg');
        get('relic-error').hidden = true;
    }
    function applyProfile() {
        const reference = relicBuildReference[get('relic-character-select').value];
        const isReference = get('relic-profile-select').value === 'pdf';
        const profile = isReference ? {weights: reference?.weights || {}} : profiles[get('relic-profile-select').value];
        for (const stat of stats) get(`relic-weight-${stat.id}`).value = profile.weights[stat.id] || 0;
        get('relic-profile-note').textContent = isReference ? '첨부 표의 유효 옵션 = 1, 그 외 = 0. 표에 숫자 가중치는 없으므로 동등하게 반영합니다. 여러 빌드가 있는 행은 옵션을 합쳐 표시합니다.' : '직접 선택한 기존 빌드 프리셋입니다. 첨부 표의 기준을 사용하려면 ‘첨부 준종결 표’를 선택하세요.';
        clearResult();
    }
    function changeCharacter() {
        const character = calculatorCharacters.find(c => c.id === get('relic-character-select').value);
        if (!character) return;
        get('relic-character-image').src = character.image;
        get('relic-character-image').alt = character.name;
        get('relic-character-meta').textContent = `${character.pathName} · ${character.elementName}`;
        const reference = relicBuildReference[character.id];
        get('relic-profile-select').value = reference ? 'pdf' : characterProfiles[character.id] || pathProfiles[character.path] || 'crit';
        applyProfile();
        buildTargets = (reference?.targets || []).map(target => ({...target,endValue:endgameGoal(target),current:''}));
        buildGoalsEdited = false;
        renderBuildTargets();
        refreshSavedSetups();
        get('relic-reference-content').innerHTML = reference ? `<p><strong>붕괴 : 스타레일 세팅 4.6V · PDF ${reference.pageStart === reference.page ? reference.page : `${reference.pageStart}~${reference.page}`}쪽</strong></p><p><strong>유효 옵션</strong><br>${escape(reference.useful)}</p><p><strong>표의 목표 수치 / 다른 세팅</strong><br>${escape(reference.rawTargets || '숫자 목표 없음')}<br>${escape(reference.rawCrit)}</p><p><strong>조합·성혼·광추 조건</strong><br>${escape(reference.notes || '별도 주석 없음')}</p>` : '<p>첨부 표에 이 캐릭터의 기준이 없습니다.</p>';
    }
    function readBuildTargets() {
        return buildTargets.map((target,i) => ({id:target.id, value:get(`relic-goal-${i}`).value, endValue:get(`relic-endgoal-${i}`).value, current:get(`relic-current-${i}`).value, mode:get(`relic-condition-${i}`).value}));
    }
    function renderBuildTargets() {
        get('relic-build-targets').innerHTML = buildTargets.length ? buildTargets.map((target,i) => {
            const stat = stats.find(s=>s.id===target.id);
            const label = stat.name.replace(' (고정)', '') + stat.unit;
            return `<div class="relic-target-row"><span>${escape(label)}</span><input id="relic-current-${i}" type="number" min="0" step="any" inputmode="decimal" value="${escape(target.current ?? '')}" aria-label="${escape(label)} 현재 수치" placeholder="현재"><input id="relic-goal-${i}" type="number" min="0.01" step="any" inputmode="decimal" value="${escape(target.value)}" aria-label="${escape(label)} 목표 수치"><input id="relic-endgoal-${i}" type="number" min="0.01" step="any" inputmode="decimal" value="${escape(target.endValue ?? target.value)}" aria-label="${escape(label)} 종결 목표"><select id="relic-condition-${i}" aria-label="${escape(label)} 비교 조건"><option value="min">이상</option><option value="max">이하</option><option value="lt">미만</option></select><button type="button" id="relic-remove-${i}" aria-label="${escape(label)} 목표 제외">×</button></div>`;
        }).join('') : '<p class="relic-muted">숫자로 정해진 목표가 없습니다. 원문을 참고해 필요한 목표를 추가하세요.</p>';
        buildTargets.forEach((target,i) => {
            get(`relic-condition-${i}`).value = target.mode;
            get(`relic-current-${i}`).addEventListener('input',clearResult);
            for (const id of [`relic-goal-${i}`,`relic-endgoal-${i}`,`relic-condition-${i}`]) get(id).addEventListener('input',()=>{buildGoalsEdited=true;clearResult();});
            get(`relic-remove-${i}`).addEventListener('click',()=>{buildTargets=readBuildTargets();buildTargets.splice(i,1);buildGoalsEdited=true;renderBuildTargets();clearResult();});
        });
    }
    function changeMode(nextMode) {
        mode = nextMode;
        get('relic-form-heading').textContent = mode === 'build' ? '세팅 분석' : '유물 분석';
        get('relic-analysis-chip').textContent = mode === 'build' ? '첨부 표 / 4.6V' : '★5 / +15 기준';
        get('relic-build-inputs').hidden = mode !== 'build';
        get('relic-item-inputs').hidden = mode !== 'item';
        get('relic-mode-build').setAttribute('aria-selected',String(mode==='build'));
        get('relic-mode-item').setAttribute('aria-selected',String(mode==='item'));
        get('relic-metric-label-one').textContent = mode==='build' ? '준종결 목표 충족' : '치명타 가치 (CV)';
        get('relic-metric-label-two').textContent = mode==='build' ? '종결 목표 충족' : '가중 유효 횟수';
        get('relic-analyze-button').innerHTML = `${mode==='build' ? '종결까지 세팅 분석' : '유물 점수 분석'} <span>→</span>`;
        get('relic-rank-scale').innerHTML = (mode==='build' ? buildRanks : ranks).map(r=>`<span>${r.name}<b>${r.min}${r.min===100 ? '' : '+'}</b></span>`).join('');
        clearResult();
    }
    function updateUnit(index) {
        const stat = stats.find(s => s.id === get(`relic-stat-${index}`).value);
        get(`relic-unit-${index}`).textContent = stat.unit;
        get(`relic-value-${index}`).setAttribute('aria-label', `${index + 1}번째 ${stat.name} 수치 ${stat.unit}`);
        clearResult();
    }
    function analyze(event) {
        event?.preventDefault();
        const rows = Array.from({length: 4}, (_, i) => ({id: get(`relic-stat-${i}`).value, value: get(`relic-value-${i}`).value}));
        const weights = Object.fromEntries(stats.map(stat => [stat.id, get(`relic-weight-${stat.id}`).value]));
        clearResult();
        try {
            if (!get('relic-character-select').value) throw new Error('검색 결과에서 캐릭터를 선택해주세요.');
            const result = mode==='build' ? calculateBuild(readBuildTargets()) : calculate(rows, weights);
            const panel = get('relic-result');
            panel.style.setProperty('--rank-color', result.rank.color);
            panel.style.setProperty('--score-angle', `${result.score * 3.6}deg`);
            get('relic-rank').textContent = result.rank.name;
            get('relic-cv').textContent = mode==='build' ? `${result.fulfilled} / ${result.total}` : result.cv.toFixed(1);
            get('relic-effective').textContent = mode==='build' ? `${result.endFulfilled} / ${result.total}` : result.effective.toFixed(2);
            get('relic-announcement').textContent = mode==='build' ? `${result.rank.name} · ${result.score.toFixed(1)}점. ${result.allEnd ? '설정한 종결 목표를 모두 충족했습니다!' : result.fulfilled===result.total ? result.hasEndGoals ? '준종결 달성! 종결까지 남은 수치를 확인하세요.' : '준종결 조건 달성! 더 엄격한 종결 목표를 직접 설정하세요.' : '준종결까지 부족한 수치를 확인하세요.'} ${buildGoalsEdited ? '사용자 조정' : '표의 준종결 + 계산기 제안 종결'} 목표 기준입니다.` : `${result.rank.name} · ${result.score.toFixed(1)}점. ${result.rank.message}`;
            get('relic-breakdown').innerHTML = result.contributions.map(c => mode==='build' ? `<div class="relic-contribution"><div><span>${escape(c.stat.name.replace(' (고정)',''))} ${c.value}${c.stat.unit}<br><small>준종결 ${c.goal}${c.stat.unit} / 종결 ${c.endGoal}${c.stat.unit} ${c.mode==='min' ? '이상' : c.mode==='lt' ? '미만' : '이하'}</small></span><span>${c.endMet && c.progressive ? '종결 ✓' : c.met ? c.progressive ? c.mode==='min' ? `종결까지 ${(c.endGoal-c.value).toFixed(1)}${c.stat.unit}` : '준종결 ✓' : '조건 충족 ✓' : c.mode==='min' ? `${(c.goal-c.value).toFixed(1)}${c.stat.unit} 부족` : '상한 초과'}</span></div><div class="relic-bar"><span style="width:${c.met ? 85+15*c.progress : c.ratio*85}%"></span></div></div>` : `<div class="relic-contribution"><div><span>${escape(c.stat.name)} ${c.value}${c.stat.unit} <small>× ${c.weight}</small></span><span>+${c.points.toFixed(1)}점</span></div><div class="relic-bar"><span style="width:${Math.min(100, c.points)}%"></span></div></div>`).join('');
            panel.classList.remove('relic-impact');
            void panel.offsetWidth;
            panel.classList.add('relic-impact');
            const start = performance.now();
            const tick = now => {
                const t = Math.min(1, (now - start) / 600);
                get('relic-score').textContent = (result.score * (1 - (1 - t) ** 3)).toFixed(1);
                if (t < 1) animation = requestAnimationFrame(tick);
            };
            animation = requestAnimationFrame(tick);
            if (matchMedia('(max-width: 760px)').matches) panel.scrollIntoView({behavior: 'smooth', block: 'start'});
        } catch (error) {
            get('relic-error').textContent = error.message;
            get('relic-error').hidden = false;
        }
    }
    get('relic-character-select').innerHTML = calculatorCharacters.map(c => `<option value="${c.id}">${escape(c.name)} · ${escape(c.pathName)}</option>`).join('');
    get('relic-character-search-count').textContent = `${calculatorCharacters.length}개 캐릭터 / 모습`;
    get('relic-character-search').addEventListener('input', () => {
        const normalize = value => value.toLocaleLowerCase().replace(/[\s.•·()]/g, '');
        const query = normalize(get('relic-character-search').value);
        const current = get('relic-character-select').value;
        const matches = calculatorCharacters.filter(c => normalize(`${c.name} ${c.pathName} ${c.name === 'Mar. 7th' ? '삼칠이 March 7th' : ''}`).includes(query));
        const select = get('relic-character-select');
        select.disabled = !matches.length;
        select.innerHTML = matches.length ? matches.map(c => `<option value="${c.id}">${escape(c.name)} · ${escape(c.pathName)}</option>`).join('') : '<option value="">검색 결과가 없습니다</option>';
        get('relic-character-search-count').textContent = `검색 결과 ${matches.length}개`;
        if (matches.length) {
            select.value = matches.some(c => c.id === current) ? current : matches[0].id;
            changeCharacter();
        } else { clearResult(); get('relic-profile-note').textContent = '캐릭터 이름을 다시 검색해주세요.'; }
    });
    get('relic-profile-select').innerHTML = '<option value="pdf">첨부 준종결 표 · 유효 옵션 기준</option>' + Object.entries(profiles).map(([id, profile]) => `<option value="${id}">${profile.name}</option>`).join('');
    get('relic-stat-rows').innerHTML = Array.from({length: 4}, (_, i) => `<div class="relic-stat-row"><select id="relic-stat-${i}" aria-label="${i + 1}번째 부옵션 종류">${stats.map(s => `<option value="${s.id}">${s.name}${s.unit ? ' (%)' : ''}</option>`).join('')}</select><input id="relic-value-${i}" type="number" min="0" step="any" value="0" inputmode="decimal"><span id="relic-unit-${i}"></span></div>`).join('');
    get('relic-weights').innerHTML = stats.map(s => `<div><label for="relic-weight-${s.id}">${s.name}${s.unit}</label><input id="relic-weight-${s.id}" type="number" min="0" max="1" step="0.05" inputmode="decimal"></div>`).join('');
    for (let i = 0; i < 4; i++) {
        get(`relic-stat-${i}`).value = ['cr', 'cd', 'spd', 'atk'][i];
        updateUnit(i);
        get(`relic-stat-${i}`).addEventListener('change', () => updateUnit(i));
        get(`relic-value-${i}`).addEventListener('input', clearResult);
    }
    stats.forEach(s => get(`relic-weight-${s.id}`).addEventListener('input', () => {clearResult(); get('relic-profile-note').textContent = '직접 조정한 가중치로 평가합니다.';}));
    get('relic-character-select').addEventListener('change', changeCharacter);
    get('relic-profile-select').addEventListener('change', applyProfile);
    get('relic-form').addEventListener('submit', analyze);
    get('relic-reset').addEventListener('click', () => {for (let i = 0; i < 4; i++) get(`relic-value-${i}`).value = 0; buildTargets.forEach((_,i)=>{get(`relic-current-${i}`).value='';}); clearResult();});
    get('relic-example').addEventListener('click', () => {
        const best = stats.slice().sort((a,b) => Number(get(`relic-weight-${b.id}`).value) - Number(get(`relic-weight-${a.id}`).value)).slice(0,4);
        best.forEach((s,i) => {get(`relic-stat-${i}`).value = s.id; updateUnit(i); get(`relic-value-${i}`).value = (s.roll * (i === 0 ? 6 : 1)).toFixed(1);});
        analyze();
    });
    get('relic-character-select').value = '1503';
    get('relic-target-add-select').innerHTML = stats.filter(s=>!['atk','hp','def'].includes(s.id)).map(s=>`<option value="${s.id}">${escape(s.name.replace(' (고정)',''))}${s.unit}</option>`).join('');
    get('relic-target-add').addEventListener('click',()=>{
        const id = get('relic-target-add-select').value;
        if (buildTargets.some(t=>t.id===id)) {get('relic-error').textContent='이미 추가한 목표입니다.';get('relic-error').hidden=false;return;}
        buildTargets=readBuildTargets();buildTargets.push({id,value:'',endValue:'',current:'',mode:'min'});buildGoalsEdited=true;renderBuildTargets();clearResult();
    });
    get('relic-build-example').addEventListener('click',()=>{buildTargets.forEach((_,i)=>{const goal=Number(get(`relic-goal-${i}`).value);get(`relic-current-${i}`).value=get(`relic-condition-${i}`).value==='lt' ? Math.max(.1,goal-.1) : goal;});analyze();});
    get('relic-mode-build').addEventListener('click',()=>changeMode('build'));
    get('relic-mode-item').addEventListener('click',()=>changeMode('item'));
    get('relic-save').addEventListener('click',saveSetup);
    get('relic-load').addEventListener('click',loadSetup);
    get('relic-delete').addEventListener('click',deleteSetup);
    changeCharacter();
    changeMode('build');
    globalThis.openRelicCalculator = () => {
        if (isWarping) return;
        previousFocus = document.activeElement;
        get('lobby-screen').style.display = 'none';
        get('relic-screen').hidden = false;
        get('relic-screen').scrollTop = 0;
        get('relic-character-search').focus();
    };
    globalThis.closeRelicCalculator = () => {
        cancelAnimationFrame(animation);
        get('relic-screen').hidden = true;
        get('lobby-screen').style.display = 'flex';
        get('lobby-screen').style.opacity = '1';
        previousFocus?.focus();
    };
    document.addEventListener('keydown', event => {if (event.key === 'Escape' && !get('relic-screen').hidden) globalThis.closeRelicCalculator();});
})();
