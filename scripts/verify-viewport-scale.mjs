import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const read = name => fs.readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const html = await read('index.html');
assert.equal([...html.matchAll(/src="assets\/js\/viewport-scale.js(?:\?[^"\s]*)?"/g)].length, 1);
assert.match(html, /href="assets\/css\/viewport-scale.css(?:\?[^"\s]*)?"/);
const properties = new Map(), listeners = new Map(), frames = new Map();
const root = {dataset: {}, style: {
    setProperty(name, value) {properties.set(name, value);},
    removeProperty(name) {properties.delete(name);}
}};
let frameId = 0;
const media = {matches: true, addEventListener(type, callback) {listeners.set(`media:${type}`, callback);}};
const context = vm.createContext({
    document: {documentElement: root}, innerWidth: 2560, innerHeight: 1440,
    matchMedia() {return media;}, addEventListener(type, callback) {listeners.set(type, callback);},
    requestAnimationFrame(callback) {frames.set(++frameId, callback); return frameId;}
});
vm.runInContext(await read('assets/js/viewport-scale.js'), context);
assert.equal(properties.get('--ui-scale'), '1');
function resize(width, height, desktop = true) {
    context.innerWidth = width; context.innerHeight = height; media.matches = desktop;
    listeners.get('resize')(); listeners.get('media:change')();
    assert.equal(frames.size, 1, 'Resize events should coalesce into one frame');
    const callback = [...frames.values()][0]; frames.clear(); callback();
}
for (const [width, height, expected] of [[1920, 1080, .75], [3840, 2160, 1.5], [1280, 720, .5], [1920, 950, 950 / 1440], [3440, 1440, 1]]) {
    resize(width, height);
    const scale = Number(properties.get('--ui-scale'));
    assert.equal(scale, expected);
    const canvasWidth = parseFloat(properties.get('--ui-vw')) * 100;
    const canvasHeight = parseFloat(properties.get('--ui-vh')) * 100;
    const left = parseFloat(properties.get('--ui-left')), top = parseFloat(properties.get('--ui-top'));
    assert.equal(left, 0); assert.equal(top, 0);
    assert(Math.abs(canvasWidth * scale - width) < 1e-6, 'Canvas must fill the viewport width without side bars');
    assert(Math.abs(canvasHeight * scale - height) < 1e-6, 'Canvas must fill the viewport height without cropping');
}
resize(390, 844, false);
assert.equal(root.dataset.scaledViewport, undefined);
assert.equal(properties.size, 0, 'Mobile must restore responsive viewport units');
resize(2560, 1440);
assert.equal(root.dataset.scaledViewport, 'true');
assert.equal(properties.get('--ui-scale'), '1');
const css = await read('assets/css/viewport-scale.css');
assert.match(css, /dialog:modal/);
assert.match(css, /transform-origin: top left/);
assert.match(css, /width: calc\(100vw \/ var\(--ui-scale\)\)/);
assert.doesNotMatch(css, /left: var\(--ui-left\)|top: var\(--ui-top\)/,
    'Cached centering offsets must never create side bars');
for (const name of ['app', 'profile-storage', 'relic-calculator', 'team-builder', 'warp-prep', 'warp-cinematic']) {
    assert.doesNotMatch(await read(`assets/css/${name}.css`), /\d+(?:\.\d+)?(?:dvh|vw|vh)\b/,
        `Viewport sizes in ${name} must use the same logical design size`);
}
console.log('PASS: uniform QHD/FHD/4K scaling, full viewport coverage, ultrawide fitting, resize coalescing, mobile reset and modal scaling.');
