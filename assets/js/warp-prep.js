(() => {
    'use strict';
    const get = id => document.getElementById(id), math = globalThis.WarpPrepMath;
    const number = value => Math.round(value).toLocaleString('ko-KR');
    const percent = value => `${(value * 100).toFixed(1)}%`;
    const groups = [
        {key: 'character', kind: 'character', name: '이벤트 캐릭터'},
        {key: 'lightcone', kind: 'lightcone', name: '이벤트 광추'},
        {key: 'characterCollaboration', kind: 'character', name: '콜라보 캐릭터'},
        {key: 'lightconeCollaboration', kind: 'lightcone', name: '콜라보 광추'}
    ];
    let previousFocus, run = 0, goals = [];
    const choiceFor = goal => pickupChoices[goal.kind].find(choice => choice.id === goal.id);
    const stage = (kind, value) => kind === 'character' ? (value === -1 ? '미보유' : value === 0 ? '명함 (0돌)' : `${value}돌`) : (value === 0 ? '미보유' : `${value}중첩`);
    const description = goal => `${stage(goal.kind, goal.current)} → ${stage(goal.kind, goal.target)}`;
    get('prep-states').innerHTML = groups.map(group => `<fieldset id="prep-state-${group.key}" class="prep-state"><legend>${group.name}</legend><label for="prep-pity-${group.key}">현재 ★5 천장 (0~${banners[group.kind].maxPity - 1})</label><input id="prep-pity-${group.key}" type="number" min="0" max="${banners[group.kind].maxPity - 1}" step="1" value="0" required><label class="prep-check"><input id="prep-guaranteed-${group.key}" type="checkbox"><span>다음 ★5 픽업 확정</span></label></fieldset>`).join('');
    function read() {
        return {jade: get('prep-jade').valueAsNumber + (globalThis.HonkaiForecast?.jade() || 0), tickets: get('prep-tickets').valueAsNumber,
            goals: goals.map(goal => ({...goal})),
            states: Object.fromEntries(groups.map(group => [group.key, {pity: get(`prep-pity-${group.key}`).valueAsNumber, guaranteed: get(`prep-guaranteed-${group.key}`).checked}]))};
    }
    function invalidate() {
        run++; get('prep-result').hidden = true;
        get('prep-simulation').textContent = '계획이 변경되었습니다. 전체 계산을 눌러 다시 확인하세요.';
        get('prep-error').textContent = ''; get('prep-submit').disabled = false;
    }
    function renderSearch() {
        const kind = get('prep-kind').value;
        const query = get('prep-search').value.toLocaleLowerCase().replace(/\s/g, '');
        const matches = pickupChoices[kind].filter(choice => [choice.featured.name, choice.featured.pathName, choice.featured.elementName].some(value => String(value || '').toLocaleLowerCase().replace(/\s/g, '').includes(query)));
        get('prep-search-count').textContent = `${kind === 'character' ? '캐릭터' : '광추'} ${matches.length}개 · 선택하면 목표에 추가됩니다`;
        get('prep-search-results').innerHTML = matches.length ? matches.map(choice => {
            const added = goals.some(goal => goal.kind === kind && goal.id === choice.id);
            return `<button type="button" data-add="${escapeHTML(choice.id)}" class="prep-search-choice" ${added ? 'disabled' : ''}><img src="${escapeHTML(choice.featured.image)}" alt="" loading="lazy"><span><strong>${escapeHTML(choice.featured.name)}</strong><small>${escapeHTML(choice.featured.pathName || '')}${choice.collaboration ? ' · 콜라보' : ''}</small></span><span>${added ? '추가됨' : '+ 추가'}</span></button>`;
        }).join('') : '<p class="prep-muted">검색 결과가 없습니다. 이름 또는 운명의 길을 확인해주세요.</p>';
    }
    function options(goal, field) {
        const min = goal.kind === 'character' ? -1 : 0, max = goal.kind === 'character' ? 6 : 5;
        const start = field === 'current' ? min : (goal.kind === 'character' ? 0 : 1);
        return Array.from({length: max - start + 1}, (_, i) => {
            const value = start + i;
            return `<option value="${value}" ${goal[field] === value ? 'selected' : ''} ${field === 'target' && value < goal.current ? 'disabled' : ''}>${stage(goal.kind, value)}</option>`;
        }).join('');
    }
    function renderGoals() {
        get('prep-goals').innerHTML = goals.length ? goals.map((goal, index) => {
            const choice = choiceFor(goal), copies = math.neededCopies(goal.kind, goal.current, goal.target);
            return `<article class="prep-goal"><div class="prep-goal-header"><img src="${escapeHTML(choice.featured.image)}" alt=""><div><small>순서 ${index + 1} · ${goal.kind === 'character' ? '캐릭터' : '광추'}${goal.collaboration ? ' · 콜라보' : ''}</small><h3>${escapeHTML(choice.featured.name)}</h3></div></div><div class="prep-fields"><div><label for="prep-current-${index}">현재 ${goal.kind === 'character' ? '돌파' : '중첩'}</label><select id="prep-current-${index}" data-index="${index}" data-field="current">${options(goal, 'current')}</select></div><div><label for="prep-target-${index}">목표 ${goal.kind === 'character' ? '돌파' : '중첩'}</label><select id="prep-target-${index}" data-index="${index}" data-field="target">${options(goal, 'target')}</select></div></div><div class="prep-goal-footer"><strong>${copies ? `추가 ${copies}장 필요` : '이미 목표 달성 · 추가 0장'}</strong><div><button type="button" data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''} aria-label="${index + 1}번 목표 위로">↑</button><button type="button" data-action="down" data-index="${index}" ${index === goals.length - 1 ? 'disabled' : ''} aria-label="${index + 1}번 목표 아래로">↓</button><button type="button" data-action="remove" data-index="${index}" aria-label="${escapeHTML(choice.featured.name)} 목표 삭제">삭제</button></div></div></article>`;
        }).join('') : '<p class="prep-muted">왼쪽 검색 목록에서 캐릭터나 광추를 추가하세요.</p>';
        const copies = goals.reduce((sum, goal) => sum + math.neededCopies(goal.kind, goal.current, goal.target), 0);
        get('prep-plan-summary').textContent = `목표 ${goals.length} / 12개 · 총 추가 ${copies}장`;
        for (const group of groups) {
            const matching = goals.filter(goal => goal.kind === group.kind && Boolean(goal.collaboration) === group.key.endsWith('Collaboration'));
            const used = matching.some(goal => math.neededCopies(goal.kind, goal.current, goal.target) > 0);
            const visible = !group.key.endsWith('Collaboration') || matching.length > 0;
            get(`prep-state-${group.key}`).hidden = !visible;
            get(`prep-pity-${group.key}`).disabled = !used;
            get(`prep-guaranteed-${group.key}`).disabled = !used;
        }
    }
    function addGoal(kind, id) {
        if (goals.length >= 12) { get('prep-error').textContent = '목표는 최대 12개입니다. 기존 목표를 정리해주세요.'; return; }
        if (goals.some(goal => goal.kind === kind && goal.id === id)) return;
        const choice = pickupChoices[kind].find(entry => entry.id === id);
        if (!choice) return;
        goals.push({kind, id, collaboration: Boolean(choice.collaboration), current: kind === 'character' ? -1 : 0, target: kind === 'character' ? 0 : 1});
        invalidate(); renderGoals(); renderSearch();
        get(`prep-current-${goals.length - 1}`).focus();
    }
    function render(input, result) {
        const rows = [.5, .75, .9, .95, 1].map(probability => {
            const pulls = probability === 1 ? result.worst : result.quantile(probability);
            return `<tr><td>${probability === 1 ? '천장 보장' : percent(probability)}</td><td>${number(pulls)}회</td><td>${number(pulls * math.COST)}</td><td>${number(result.shortage(pulls))}</td></tr>`;
        }).join('');
        const milestones = [...new Set([0, result.budget, ...[.25, .5, .75, 1].map(f => Math.ceil(result.worst * f))])].sort((a, b) => a - b);
        get('prep-result').innerHTML = `<p class="prep-eyebrow">${goals.length}개 목표 · 추가 ${goals.reduce((sum, goal) => sum + math.neededCopies(goal.kind, goal.current, goal.target), 0)}장</p><h2>모든 목표를 달성할 확률</h2><p class="prep-hero">${percent(result.probability)}</p><p class="prep-muted">보유 재화로 ${number(result.budget)}회 가능 · 전용 티켓 ${number(input.tickets)}장 + 성옥 ${number(input.jade)}개<br>성옥을 워프로 바꾼 뒤 잔여 ${number(input.jade % math.COST)}개</p><div class="prep-metrics"><div><small>전체 목표 보장까지 최대</small><strong>${number(result.worst)}회</strong></div><div><small>전체 보장에 부족한 성옥</small><strong>${number(result.shortage(result.worst))}개</strong></div></div>
            <details class="prep-detail" open><summary>순서별 목표 완료 가능성</summary><div class="prep-table-wrap"><table class="prep-table"><thead><tr><th scope="col">목표</th><th scope="col">추가</th><th scope="col">누적 확률</th><th scope="col">누적 최대</th></tr></thead><tbody>${result.rows.map((row, index) => `<tr><td>${index + 1}. ${escapeHTML(choiceFor(row).featured.name)}<small>${description(row)}</small></td><td>${row.copies}장</td><td>${percent(row.probability)}</td><td>${number(row.cumulativeWorst)}회</td></tr>`).join('')}</tbody></table></div><p class="prep-muted">누적 확률 = 보유 재화로 앞선 목표와 해당 목표를 모두 완료할 확률. 우선순위를 바꾸면 각 목표의 완료 가능성이 달라집니다. 이미 보유한 목표는 추가 워프를 소모하지 않습니다.</p>
            </details><details class="prep-detail"><summary>확률별 필요 재화 보기</summary><div class="prep-table-wrap"><table class="prep-table"><thead><tr><th scope="col">목표 확률</th><th scope="col">필요 워프</th><th scope="col">총 성옥 환산</th><th scope="col">부족 성옥</th></tr></thead><tbody>${rows}</tbody></table></div><p class="prep-muted">전체 목표까지 모델상 평균 ${result.expected.toFixed(1)}회. 부족 성옥은 보유 티켓·성옥을 모두 반영합니다.</p></details><details class="prep-detail"><summary>워프 수에 따른 확률 그래프</summary><div class="prep-curve">${milestones.map(pulls => `<div class="prep-bar-row"><span>${number(pulls)}회</span><div class="prep-bar"><span style="width:${result.cdf[Math.min(pulls, result.worst)] * 100}%"></span></div><span>${percent(result.cdf[Math.min(pulls, result.worst)])}</span></div>`).join('')}</div></details>`;
        get('prep-result').hidden = false;
        get('prep-output').scrollIntoView({block: 'start', behavior: 'instant'});

    }
    async function simulate(result, token) {
        const total = 10000, samples = [], counts = result.rows.map(() => 0);
        let successes = 0, sum = 0;
        for (let start = 0; start < total; start += 100) {
            if (token !== run) return;
            for (let i = 0; i < 100; i++) {
                const trial = math.trialPlan(result, banners);
                samples.push(trial.total); sum += trial.total;
                if (trial.total <= result.budget) successes++;
                trial.completions.forEach((pulls, index) => { if (pulls <= result.budget) counts[index]++; });
            }
            get('prep-simulation').textContent = `가상 추첨 중… ${number(start + 100)} / ${number(total)}번`;
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (token !== run) return;
        samples.sort((a, b) => a - b);
        const rate = successes / total, z = 1.96, denominator = 1 + z * z / total;
        const center = (rate + z * z / (2 * total)) / denominator;
        const margin = z * Math.sqrt(rate * (1 - rate) / total + z * z / (4 * total * total)) / denominator;
        get('prep-simulation').innerHTML = `<details class="prep-detail"><summary>10,000번 전체 계획 가상 추첨 결과 보기</summary><p class="prep-hero">${percent(rate)}</p><p class="prep-muted">모든 목표 완료 ${number(successes)} / ${number(total)}번<br>확률의 95% 신뢰구간 ${percent(Math.max(0, center - margin))} ~ ${percent(Math.min(1, center + margin))}<br>전체 목표까지 평균 ${(sum / total).toFixed(1)}회 · 중앙값 ${number(samples[4999])}회 · 90%가 ${number(samples[8999])}회 이내 완료</p><div class="prep-curve">${result.rows.map((row, index) => `<div class="prep-sim-row"><span>${index + 1}. ${escapeHTML(choiceFor(row).featured.name)}</span><strong>${percent(counts[index] / total)}</strong></div>`).join('')}</div><p class="prep-muted">목표별 수치는 앞선 목표까지 완료한 누적 성공률입니다. 매 실험은 입력한 배너별 상태와 같은 보유 재화에서 다시 시작합니다. 실제 기록·보유 목록에는 반영되지 않습니다.</p></details>`;
        get('prep-submit').disabled = false;
    }
    get('prep-search').addEventListener('input', renderSearch);
    get('prep-kind').addEventListener('change', renderSearch);
    get('prep-search-results').addEventListener('click', event => {
        const button = event.target.closest('button[data-add]');
        if (button && !button.disabled) addGoal(get('prep-kind').value, button.dataset.add);
    });
    get('prep-goals').addEventListener('change', event => {
        const {index, field} = event.target.dataset;
        if (!['current', 'target'].includes(field) || !goals[index]) return;
        goals[index][field] = Number(event.target.value);
        if (goals[index].current > goals[index].target) goals[index].target = goals[index].current;
        invalidate(); renderGoals(); get(`prep-${field}-${index}`).focus();
    });
    get('prep-goals').addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) return;
        const index = Number(button.dataset.index), action = button.dataset.action;
        if (!goals[index]) return;
        if (action === 'remove') goals.splice(index, 1);
        else {
            const destination = index + (action === 'up' ? -1 : 1);
            if (!goals[destination]) return;
            [goals[index], goals[destination]] = [goals[destination], goals[index]];
        }
        invalidate(); renderGoals(); renderSearch();
        if (goals.length) get(`prep-current-${Math.min(index, goals.length - 1)}`).focus();
        else get('prep-search').focus();
    });
    get('prep-form').addEventListener('input', event => { if (!['prep-search', 'prep-kind'].includes(event.target.id)) invalidate(); });
    get('prep-form').addEventListener('submit', async event => {
        event.preventDefault(); const token = ++run; get('prep-error').textContent = '';
        try {
            const input = read(); get('prep-submit').disabled = true;
            get('prep-simulation').textContent = '전체 목표의 확률 분포를 계산하고 있습니다…';
            await new Promise(resolve => setTimeout(resolve, 0));
            if (token !== run) return;
            const result = math.analyzePlan(input, banners);
            render(input, result); await simulate(result, token);
        } catch (error) {
            if (token !== run) return;
            get('prep-error').textContent = error.message; get('prep-result').hidden = true;
            get('prep-simulation').textContent = '입력값을 확인하고 다시 계산해주세요.'; get('prep-submit').disabled = false;
        }
    });
    get('prep-import').addEventListener('click', () => {
        for (const group of groups) {
            get(`prep-pity-${group.key}`).value = bannerStates[group.key].pity5;
            get(`prep-guaranteed-${group.key}`).checked = bannerStates[group.key].guaranteed5;
        }
        invalidate(); get('prep-simulation').textContent = '이 사이트의 캐릭터·광추·콜라보 천장과 확정을 불러왔습니다. 실제 게임의 상태는 직접 입력해주세요.';
    });
    globalThis.openWarpPrep = () => {
        if (isWarping) return;
        previousFocus = document.activeElement;
        if (!goals.length) addGoal('character', selectedPickups.character);
        invalidate(); renderGoals(); renderSearch();
        get('lobby-screen').style.display = 'none'; get('prep-screen').hidden = false;
        get('prep-screen').scrollTop = 0; get('prep-search').focus();
    };
    globalThis.closeWarpPrep = () => {
        invalidate(); get('prep-screen').hidden = true;
        get('lobby-screen').style.display = 'flex'; get('lobby-screen').style.opacity = '1'; previousFocus?.focus();
    };
    get('prep-back').addEventListener('click', globalThis.closeWarpPrep);
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !get('prep-screen').hidden) globalThis.closeWarpPrep(); });
    globalThis.addEventListener('honkai-profile-login', () => {
        get('prep-jade').value = 0; get('prep-tickets').value = 0; goals = [];
        get('prep-search').value = ''; get('prep-kind').value = 'character';
        for (const group of groups) { get(`prep-pity-${group.key}`).value = 0; get(`prep-guaranteed-${group.key}`).checked = false; }
        invalidate(); renderGoals(); renderSearch();
        if (!get('prep-screen').hidden) globalThis.closeWarpPrep();
    });
    renderGoals(); renderSearch();
    globalThis.WarpPrepUI = Object.freeze({
        plan: () => ({goals:goals.map(g=>({...g})),states:read().states}),
        apply(plan) {
            if (!plan || !Array.isArray(plan.goals) || plan.goals.length>12 || !plan.states) throw new Error('공유 뽑기 계획 형식이 올바르지 않습니다.');
            const next=plan.goals.map(goal=>{
                const choice=pickupChoices[goal.kind]?.find(c=>c.id===goal.id);
                if (!choice || !Number.isInteger(goal.current) || !Number.isInteger(goal.target)) throw new Error('공유 목표를 확인하세요.');
                math.neededCopies(goal.kind,goal.current,goal.target);
                return {kind:goal.kind,id:goal.id,current:goal.current,target:goal.target,collaboration:Boolean(choice.collaboration)};
            });
            if(new Set(next.map(g=>`${g.kind}:${g.id}`)).size!==next.length) throw new Error('중복 목표입니다.');
            for(const group of groups) {
                const state=plan.states[group.key];
                if(!state || !Number.isInteger(state.pity) || state.pity<0 || state.pity>=banners[group.kind].maxPity || typeof state.guaranteed!=='boolean') throw new Error('공유 천장 정보를 확인하세요.');
            }
            goals=next;
            for(const group of groups) {get(`prep-pity-${group.key}`).value=plan.states[group.key].pity;get(`prep-guaranteed-${group.key}`).checked=plan.states[group.key].guaranteed;}
            invalidate();renderGoals();renderSearch();
        }
    });
})();
