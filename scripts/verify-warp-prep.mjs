import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(await fs.readFile(new URL('../assets/js/warp-prep-math.js', import.meta.url), 'utf8'), context);
const math = context.WarpPrepMath;
const banner = {maxPity: 90, softPity: 73, softStep: .06, base5: .006, rateUp: .5};
const input = {jade: 0, tickets: 0, pity: 0, copies: 1, guaranteed: false};
assert.equal(math.fiveProbability(72, banner), .006);
assert.equal(math.fiveProbability(73, banner), .066);
assert.equal(math.fiveProbability(89, banner), 1);
const base = math.analyze(input, banner);
assert.equal(base.worst, 180);
assert.equal(base.probability, 0);
assert.equal(base.shortage(180), 28800);
assert.equal(base.cdf[180], 1);
assert(Math.abs(base.cdf[1] - .003) < 1e-12);
for (let n = 1; n < base.cdf.length; n++) assert(base.cdf[n] >= base.cdf[n - 1]);
const guaranteed = math.analyze({...input, pity: 89, guaranteed: true, jade: 159}, banner);
assert.equal(guaranteed.worst, 1);
assert.equal(guaranteed.shortage(1), 1);
assert.equal(guaranteed.probability, 0);
assert.equal(math.analyze({...input, pity: 89, guaranteed: true, jade: 160}, banner).probability, 1);
const fifty = math.analyze({...input, pity: 89, tickets: 1}, banner);
assert.equal(fifty.probability, .5);
assert.equal(fifty.worst, 91);
assert.equal(math.analyze({...input, tickets: 180}, banner).probability, 1);
const seven = math.analyze({...input, copies: 7, pity: 89, guaranteed: true}, banner);
assert.equal(seven.worst, 1081);
assert.equal(seven.cdf.at(-1), 1);
assert.equal(math.trial({...input, pity: 89, guaranteed: true}, banner, () => .999999), 1);
assert.equal(math.trial(input, banner, () => .999999), 180);
assert.equal(math.trial({...input, copies: 7}, banner, () => .999999), 1260);
assert.equal(math.trial({...input, copies: 7}, banner, () => 0), 7);
for (const patch of [{pity: 90}, {pity: -1}, {jade: NaN}, {tickets: 1.5}, {copies: 0}, {copies: 8}, {jade: Infinity}]) {
    assert.throws(() => math.analyze({...input, ...patch}, banner));
}
// Seeded Monte Carlo compared to the independent probability distribution.
let seed = 42;
const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
let successes = 0, sum = 0;
for (let i = 0; i < 30000; i++) {
    const pulls = math.trial(input, banner, random);
    if (pulls <= 100) successes++;
    sum += pulls;
}
assert(Math.abs(successes / 30000 - base.cdf[100]) < .015);
assert(Math.abs(sum / 30000 - base.expected) < 1);
console.log('PASS: resource conversion, pity boundaries, guarantees, multiple copies, validation and seeded Monte Carlo agreement.');

const cone = {maxPity: 80, softPity: 63, softStep: .07, base5: .008, rateUp: .75};
const configs = {character: banner, lightcone: cone};
const states = {
    character: {pity: 89, guaranteed: true}, lightcone: {pity: 79, guaranteed: true},
    characterCollaboration: {pity: 89, guaranteed: true}, lightconeCollaboration: {pity: 79, guaranteed: true}
};
const goal = (kind, id, current, target, collaboration = false) => ({kind, id, current, target, collaboration});
const planInput = {jade: 0, tickets: 1, states, goals: [goal('character', 'a', 1, 2), goal('lightcone', 'cone', 1, 2), goal('character', 'b', -1, 0)]};
assert.equal(math.neededCopies('character', -1, 0), 1);
assert.equal(math.neededCopies('character', 0, 2), 2);
assert.equal(math.neededCopies('character', 1, 2), 1);
assert.equal(math.neededCopies('character', -1, 6), 7);
assert.equal(math.neededCopies('lightcone', 0, 1), 1);
assert.equal(math.neededCopies('lightcone', 1, 5), 4);
assert.equal(math.neededCopies('character', 2, 2), 0);
assert.throws(() => math.neededCopies('character', 2, 1));
assert.throws(() => math.neededCopies('lightcone', 0, 6));
assert.equal(math.analyze({...input, pity: 79, tickets: 1}, cone).probability, .75);
assert.throws(() => math.analyze({...input, pity: 80}, cone));
const mixed = math.analyzePlan(planInput, configs);
assert.equal(mixed.worst, 182);
assert.equal(mixed.goals[0].pity, 89);
assert.equal(mixed.goals[1].pity, 79);
assert.equal(mixed.goals[2].pity, 0);
assert.equal(mixed.goals[2].guaranteed, false);
assert.equal(mixed.rows[0].probability, 1);
assert.equal(mixed.rows[1].probability, 0);
assert.equal(mixed.probability, 0);
assert.equal(math.trialPlan(mixed, configs, () => .999999).total, 182);
assert.deepEqual(Array.from(math.trialPlan(mixed, configs, () => .999999).completions), [1, 2, 182]);
const separate = math.analyzePlan({...planInput, goals: [goal('character', 'a', -1, 0), goal('character', 'collab', -1, 0, true)]}, configs);
assert.equal(separate.worst, 2);
const complete = math.analyzePlan({...planInput, tickets: 0, goals: [goal('character', 'a', 2, 2), goal('lightcone', 'cone', 5, 5)]}, configs);
assert.equal(complete.worst, 0);
assert.equal(complete.probability, 1);
assert.equal(complete.quantile(.95), 0);
assert.equal(math.trialPlan(complete, configs).total, 0);
assert.equal(math.analyzePlan({...planInput, tickets: 0, states: {}, goals: [goal('character', 'a', 2, 2)]}, configs).probability, 1);
const skip = math.analyzePlan({...planInput, goals: [goal('character', 'a', 2, 2), goal('character', 'b', 1, 2)]}, configs);
assert.equal(skip.worst, 1); // Already-completed rows must not consume the starting state.
assert.throws(() => math.analyzePlan({...planInput, goals: []}, configs));
assert.throws(() => math.analyzePlan({...planInput, goals: [goal('character', 'a', -1, 0), goal('character', 'a', 0, 2)]}, configs));
assert.throws(() => math.analyzePlan({...planInput, states: {...states, lightcone: {pity: 80, guaranteed: true}}}, configs));
const reordered = math.analyzePlan({...planInput, goals: [...planInput.goals].reverse()}, configs);
assert.equal(reordered.worst, mixed.worst);
assert(Math.abs(reordered.expected - mixed.expected) < 1e-8);
assert(reordered.rows[0].probability > 0);
const monte = math.analyzePlan({...planInput, tickets: 150, states: {...states, character: {pity: 35, guaranteed: false}, lightcone: {pity: 20, guaranteed: false}}}, configs);
let planSuccesses = 0, planTotal = 0;
for (let i = 0; i < 30000; i++) {
    const trial = math.trialPlan(monte, configs, random);
    if (trial.total <= monte.budget) planSuccesses++;
    planTotal += trial.total;
}
assert(Math.abs(planSuccesses / 30000 - monte.probability) < .015);
assert(Math.abs(planTotal / 30000 - monte.expected) < 1.5);
console.log('PASS: owned progression, light cone rates, shared and collaboration pity, zero-copy goals, priorities and mixed-plan Monte Carlo agreement.');

// Exercise UI handlers, including cancellation, without changing real saved profiles.
const elements = new Map();
function element(id) {
    if (!elements.has(id)) elements.set(id, {
        value: '0', get valueAsNumber() {return Number(this.value);}, hidden: true, style: {}, checked: false, disabled: false,
        textContent: '', innerHTML: '', handlers: {},
        addEventListener(type, callback) { this.handlers[type] = callback; },
        append() {}, focus() {}
    });
    return elements.get(id);
}
element('prep-kind').value = 'character';
element('prep-search').value = '';
const choice = {id: 'test', featured: {name: '테스트 캐릭터', image: '', pathName: '파멸'}};
const second = {id: 'second', featured: {name: '두 번째 캐릭터', image: '', pathName: '보존'}};
const collabChoice = {id: 'collab', collaboration: true, featured: {name: '콜라보 캐릭터', image: '', pathName: '파멸'}};
const coneChoice = {id: 'cone', featured: {name: '테스트 전용 광추', image: '', pathName: '파멸'}};
const uiContext = vm.createContext({
    WarpPrepMath: math, setTimeout, pickupChoices: {character: [choice, second, collabChoice], lightcone: [coneChoice]},
    banners: configs, selectedPickups: {character: 'test'}, isWarping: false,
    bannerStates: Object.fromEntries(Object.entries(states).map(([key, state]) => [key, {pity5: state.pity, guaranteed5: state.guaranteed}])), escapeHTML: text => text,
    addEventListener() {},
    document: {getElementById: element, createElement: () => element('option'), addEventListener() {}, activeElement: {focus() {}}}
});
vm.runInContext(await fs.readFile(new URL('../assets/js/warp-prep.js', import.meta.url), 'utf8'), uiContext);
uiContext.openWarpPrep();
assert.equal(element('prep-screen').hidden, false);
assert.equal(element('lobby-screen').style.display, 'none');
element('prep-import').handlers.click();
assert.equal(element('prep-pity-character').value, 89);
assert.equal(element('prep-guaranteed-character').checked, true);
assert.equal(element('prep-pity-lightcone').value, 79);
const changeGoal = (index, field, value) => element('prep-goals').handlers.change({target: {dataset: {index, field}, value}});
changeGoal('0', 'current', '1');
changeGoal('0', 'target', '2');
assert.match(element('prep-goals').innerHTML, /추가 1장 필요/);
const clickAdd = id => element('prep-search-results').handlers.click({target: {closest: () => ({disabled: false, dataset: {add: id}})}});
clickAdd('second');
clickAdd('second');
assert.match(element('prep-plan-summary').textContent, /목표 2/); // Duplicate add is ignored.
element('prep-kind').value = 'lightcone';
element('prep-kind').handlers.change();
clickAdd('cone');
assert.match(element('prep-plan-summary').textContent, /목표 3/);
assert.match(element('prep-plan-summary').textContent, /총 추가 3장/);
element('prep-search').value = '없는이름';
element('prep-search').handlers.input();
assert.match(element('prep-search-results').innerHTML, /검색 결과가 없습니다/);
element('prep-search').value = '파멸';
element('prep-search').handlers.input();
assert.match(element('prep-search-results').innerHTML, /테스트 전용 광추/);
element('prep-tickets').value = 10000;
await element('prep-form').handlers.submit({preventDefault() {}});
assert.match(element('prep-result').innerHTML, /100\.0%/);
assert.match(element('prep-result').innerHTML, /테스트 전용 광추/);
assert.match(element('prep-simulation').innerHTML, /10,000번 전체 계획 가상 추첨/);
assert.equal(element('prep-submit').disabled, false);
const clickAction = (index, action) => element('prep-goals').handlers.click({target: {closest: () => ({disabled: false, dataset: {index, action}})}});
clickAction('2', 'up');
assert(element('prep-goals').innerHTML.indexOf('테스트 전용 광추') < element('prep-goals').innerHTML.indexOf('두 번째 캐릭터'));
clickAction('1', 'remove');
assert.match(element('prep-plan-summary').textContent, /목표 2/);
element('prep-kind').value = 'character';
clickAdd('collab');
assert.equal(element('prep-state-characterCollaboration').hidden, false);
assert.equal(element('prep-pity-characterCollaboration').disabled, false);
clickAction('2', 'remove');
assert.equal(element('prep-state-characterCollaboration').hidden, true);
const pending = element('prep-form').handlers.submit({preventDefault() {}});
element('prep-form').handlers.input({target: {id: 'prep-jade'}});
await pending;
assert.equal(element('prep-result').hidden, true);
assert.match(element('prep-simulation').textContent, /계획이 변경/);
uiContext.closeWarpPrep();
assert.equal(element('prep-screen').hidden, true);
assert.equal(element('lobby-screen').style.display, 'flex');
console.log('PASS: calculator entry, search, mixed goals, current and target progression, state import, result rendering, 10,000 trials, cancellation and return to lobby.');
