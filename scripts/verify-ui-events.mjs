import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const read = name => fs.readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const html = await read('index.html');
const interactions = await read('assets/css/interactions.css');
const fullscreenFeedback = interactions.match(/:is\(#single-reveal-screen, \.warp-signal-open\)\s*\{([^}]+)\}/);
assert(fullscreenFeedback, 'Fullscreen reveal targets need an override for shared button feedback');
assert.match(fullscreenFeedback[1], /scale:\s*none\s*;/,
    'Pressing the reveal surface must not shrink the scene background');
assert.match(fullscreenFeedback[1], /translate:\s*none\s*;/,
    'Hovering the reveal surface must not shift the scene background');
assert.doesNotMatch(fullscreenFeedback[1], /\btransform\s*:/,
    'Interaction feedback must preserve the viewport scaling transform');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(match => match[1]);
assert.equal(scripts.filter(src => src === 'assets/js/ui-events.js').length, 1,
    'HTML must load the delegated event handlers exactly once');
assert(scripts.indexOf('assets/js/ui-events.js') > scripts.indexOf('assets/js/app.js'),
    'Event handlers must load after application functions');
assert(html.indexOf('src="assets/js/ui-events.js"') > html.indexOf('id="single-reveal-screen"'),
    'Keyboard handlers must load after their DOM controls');
const uiSource = await read('assets/js/ui-events.js');
for (const match of html.matchAll(/\bdata-(?:click|change|input)-action="([^"]+)"/g)) {
    assert(uiSource.includes(`'${match[1]}':`), `Missing UI action: ${match[1]}`);
}
const listeners = new Map(), calls = [], elements = new Map();
const element = id => {
    if (!elements.has(id)) elements.set(id, {
        dataset: {}, disabled: false, inert: false, value: '', attrs: {},
        addEventListener(type, callback) { listeners.set(`${id}:${type}`, callback); },
        setAttribute(name, value) { this.attrs[name] = value; },
        closest(selector) { return selector === '[inert]' ? (this.inert ? this : null) : this; },
        focus() { calls.push(['focus', id]); },
        click() { listeners.get('click')({target: this}); }
    });
    return elements.get(id);
};
const tabs = [element('tab-character'), element('tab-lightcone')];
const tablist = { querySelectorAll() {return tabs;}, addEventListener(type, callback) {listeners.set(`tabs:${type}`, callback);} };
const functions = ['goToWarpScreen', 'openWarpPrep', 'openCollection', 'openRelicCalculator', 'openTeamBuilder',
    'goToLobby', 'selectBanner', 'openBannerPicker', 'closeBannerPicker', 'openWarpDetails', 'doWarp', 'nextReveal',
    'resetToWarp', 'switchTab', 'renderCollection', 'closeCollection', 'closeWarpDetails', 'selectWarpDetailsTab',
    'closeArtViewer', 'handleSkip', 'closeRelicCalculator', 'renderBannerChoices', 'changeHistoryPage', 'choosePickup', 'openCollectionItem'];
const context = vm.createContext({document: {
    addEventListener(type, callback) {listeners.set(type, callback);}, getElementById: element,
    querySelectorAll() {return [tablist];}
}, ...Object.fromEntries(functions.map(name => [name, (...args) => calls.push([name, ...args])]))});
vm.runInContext(uiSource, context);

// Both static controls and markup created after startup use the same safe routing.
const pull = element('pull'); pull.dataset.clickAction = 'ui-14';
listeners.get('click')({target: pull}); assert.deepEqual(calls.pop(), ['doWarp', 10]);
pull.disabled = true; const before = calls.length;
listeners.get('click')({target: pull}); assert.equal(calls.length, before);
pull.disabled = false; pull.inert = true;
listeners.get('click')({target: pull}); assert.equal(calls.length, before);
const choice = element('dynamic-choice'); choice.dataset = {action: 'choose-pickup', id: "quote'<>"};
listeners.get('click')({target: choice}); assert.deepEqual(calls.pop(), ['choosePickup', "quote'<>"]);
const search = element('search'); search.dataset.inputAction = 'banner-search'; search.value = 'test';
listeners.get('input')({target: search}); assert.deepEqual(calls.pop(), ['renderBannerChoices', 'test']);
choice.dataset.action = '__proto__'; listeners.get('click')({target: choice}); assert.equal(calls.length, before);

tabs[0].dataset.clickAction = 'ui-17'; tabs[1].dataset.clickAction = 'ui-18';
listeners.get('tabs:keydown')({target: tabs[0], key: 'ArrowRight', preventDefault() {}});
assert.deepEqual(calls.splice(-2), [['focus', 'tab-lightcone'], ['switchTab', 'lightcone']]);
const reveal = element('single-reveal-screen');
listeners.get('single-reveal-screen:keydown')({target: reveal, currentTarget: reveal, key: ' ', preventDefault() {}});
assert.deepEqual(calls.pop(), ['nextReveal']);
console.log('PASS: delegated static and dynamic controls, input search, inert/disabled guards, tab arrows and keyboard reveal.');

const timers = new Map(); let serial = 0, reveals = 0;
const anim = {style: {display: 'flex'}};
const motion = vm.createContext({
    document: {getElementById(id) {assert.equal(id, 'anim-screen'); return anim;}},
    matchMedia: () => ({matches: true}), cancelAnimationFrame() {}, removeEventListener() {},
    setTimeout(callback) {timers.set(++serial, callback); return serial;},
    clearTimeout(id) {timers.delete(id);}
});
vm.runInContext(await read('assets/js/warp-cinematic.js'), motion);
motion.WarpCinematic.start({onComplete() {reveals++;}});
[...timers.values()][0](); timers.clear();
assert.equal(reveals, 1); assert.equal(anim.style.display, 'none');
motion.WarpCinematic.start({onComplete() {reveals++;}}); motion.WarpCinematic.stop();
assert.equal(timers.size, 0); assert.equal(reveals, 1);
vm.runInContext(await read('assets/js/warp-path-reveal.js'), motion);
motion.WarpPathReveal.show({item: {path: 'Knight'}, onReveal() {reveals++;}});
assert.equal(reveals, 2); assert.equal(timers.size, 0);
console.log('PASS: reduced motion reveals results without canvas or path animation; skip cancels pending reveal.');
