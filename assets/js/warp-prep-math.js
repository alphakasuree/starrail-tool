(() => {
    'use strict';
    const COST = 160;
    function fiveProbability(pity, banner) {
        if (pity >= banner.maxPity - 1) return 1;
        return Math.min(1, Math.max(0, banner.base5 + (pity >= banner.softPity ? banner.softStep * (pity - banner.softPity + 1) : 0)));
    }
    function validate(input) {
        for (const [key, max] of [['jade', 100000000], ['tickets', 1000000], ['pity', 89], ['copies', 7]]) {
            if (!Number.isInteger(input[key]) || input[key] < (key === 'copies' ? 1 : 0) || input[key] > max) throw new Error('성옥·티켓·천장은 범위 안의 정수로, 목표 획득 수는 1~7로 입력해주세요.');
        }
        if (typeof input.guaranteed !== 'boolean') throw new Error('픽업 확정 여부를 확인해주세요.');
    }
    function analyze(input, banner) {
        validate(input);
        if (input.pity >= banner.maxPity) throw new Error(`천장은 0~${banner.maxPity - 1}회로 입력해주세요.`);
        const budget = input.tickets + Math.floor(input.jade / COST);
        const worst = banner.maxPity * (2 * input.copies - (input.guaranteed ? 1 : 0)) - input.pity;
        // Probability mass over (copies acquired, guarantee, pity), excluding completed goals.
        const width = banner.maxPity;
        let states = new Float64Array(input.copies * 2 * width);
        states[(input.guaranteed ? width : 0) + input.pity] = 1;
        const cdf = [0];
        let completed = 0, expected = 0;
        for (let pull = 1; pull <= worst; pull++) {
            const next = new Float64Array(states.length);
            let success = 0;
            for (let copies = 0; copies < input.copies; copies++) {
                for (let guarantee = 0; guarantee < 2; guarantee++) {
                    for (let pity = 0; pity < width; pity++) {
                        const index = (copies * 2 + guarantee) * width + pity;
                        const mass = states[index];
                        if (!mass) continue;
                        const five = fiveProbability(pity, banner);
                        if (pity + 1 < width) next[index + 1] += mass * (1 - five);
                        const up = guarantee ? 1 : banner.rateUp;
                        if (copies + 1 === input.copies) success += mass * five * up;
                        else next[(copies + 1) * 2 * width] += mass * five * up;
                        next[copies * 2 * width + width] += mass * five * (1 - up);
                    }
                }
            }
            completed += success;
            expected += pull * success;
            cdf.push(Math.min(1, completed));
            states = next;
        }
        cdf[worst] = 1;
        const quantile = probability => cdf.findIndex(value => value >= probability);
        const shortage = pulls => Math.max(0, (pulls - input.tickets) * COST - input.jade);
        return {budget, worst, cdf, expected, probability: cdf[Math.min(budget, worst)], quantile, shortage};
    }
    function trial(input, banner, random = Math.random) {
        let pity = input.pity, guaranteed = input.guaranteed, copies = 0, pulls = 0;
        while (copies < input.copies) {
            pulls++;
            if (random() < fiveProbability(pity, banner)) {
                pity = 0;
                if (guaranteed || random() < banner.rateUp) { copies++; guaranteed = false; }
                else guaranteed = true;
            } else pity++;
        }
        return pulls;
    }
    function neededCopies(kind, current, target) {
        const character = kind === 'character';
        if (!character && kind !== 'lightcone') throw new Error('목표 종류를 확인해주세요.');
        const min = character ? -1 : 0, max = character ? 6 : 5;
        if (!Number.isInteger(current) || !Number.isInteger(target) || current < min || current > max || target < (character ? 0 : 1) || target > max) throw new Error('현재·목표 돌파 또는 중첩을 확인해주세요.');
        if (target < current) throw new Error('목표 돌파·중첩은 현재보다 낮게 설정할 수 없습니다.');
        return target - current;
    }
    function preparePlan(input, configs) {
        validate({...input, pity: 0, copies: 1, guaranteed: false});
        if (!Array.isArray(input.goals) || !input.goals.length || input.goals.length > 12) throw new Error('목표를 1~12개 추가해주세요.');
        const seen = new Set();
        const used = new Set();
        const goals = input.goals.map(goal => {
            const copies = neededCopies(goal.kind, goal.current, goal.target);
            const group = goal.kind + (goal.collaboration ? 'Collaboration' : '');
            const config = configs[goal.kind];
            const state = input.states[group];
            const identity = `${goal.kind}:${goal.id}`;
            if (!goal.id || seen.has(identity)) throw new Error('같은 목표가 중복되었습니다. 기존 목표의 돌파·중첩을 수정해주세요.');
            seen.add(identity);
            if (copies && (!state || !Number.isInteger(state.pity) || state.pity < 0 || state.pity >= config.maxPity || typeof state.guaranteed !== 'boolean')) throw new Error(`${goal.kind === 'character' ? '캐릭터' : '광추'} 천장·확정 상태를 확인해주세요.`);
            const first = !used.has(group);
            if (copies) used.add(group);
            return {...goal, group, copies, pity: copies && first ? state.pity : 0, guaranteed: Boolean(copies && first && state.guaranteed)};
        });
        return {goals, budget: input.tickets + Math.floor(input.jade / COST), shortage: pulls => Math.max(0, (pulls - input.tickets) * COST - input.jade)};
    }
    function convolve(left, right) {
        const out = new Float64Array(left.length + right.length - 1);
        for (let i = 0; i < left.length; i++) {
            if (!left[i]) continue;
            for (let j = 0; j < right.length; j++) if (right[j]) out[i + j] += left[i] * right[j];
        }
        return out;
    }
    function cumulative(pmf) {
        let sum = 0;
        const cdf = Array.from(pmf, value => { sum += value; return Math.min(1, sum); });
        cdf[cdf.length - 1] = 1;
        return cdf;
    }
    function analyzePlan(input, configs) {
        const plan = preparePlan(input, configs);
        let pmf = new Float64Array([1]), worst = 0, expected = 0;
        const rows = plan.goals.map(goal => {
            const result = goal.copies ? analyze({...input, ...goal}, configs[goal.kind]) : {cdf: [1], worst: 0, expected: 0};
            const distribution = Float64Array.from(result.cdf, (value, i) => Math.max(0, value - (result.cdf[i - 1] || 0)));
            pmf = convolve(pmf, distribution);
            worst += result.worst;
            expected += result.expected;
            const cdf = cumulative(pmf);
            return {...goal, worst: result.worst, expected: result.expected, cumulativeWorst: worst, probability: cdf[Math.min(plan.budget, worst)]};
        });
        const cdf = cumulative(pmf);
        return {...plan, rows, worst, expected, cdf, probability: cdf[Math.min(plan.budget, worst)], quantile: probability => cdf.findIndex(value => value >= probability)};
    }
    function trialPlan(plan, configs, random = Math.random) {
        let total = 0;
        const completions = plan.goals.map(goal => {
            if (goal.copies) total += trial(goal, configs[goal.kind], random);
            return total;
        });
        return {total, completions};
    }
    globalThis.WarpPrepMath = {COST, fiveProbability, analyze, trial, neededCopies, preparePlan, analyzePlan, trialPlan};
})();
