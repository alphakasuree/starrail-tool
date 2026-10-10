import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../assets/js/lobby-theme.js', import.meta.url), 'utf8');
const values = new Map(), listeners = {};
const shared = new Map();
let pixels, fail = false, observer;
const art = {src: 'first', currentSrc: '', complete: true, naturalWidth: 100, dataset: {}, addEventListener(name, cb) { listeners[name] = cb; }};
const lobby = {classList: {contains: () => true}, style: {setProperty: (k, v) => values.set(k, v), removeProperty: k => values.delete(k)}};
const document = {
    documentElement: {style: {setProperty: (k, v) => shared.set(k, v), removeProperty: k => shared.delete(k)}},
    getElementById: id => id === 'lobby-screen' ? lobby : art,
    createElement: () => ({getContext: () => ({drawImage() {}, getImageData() {if (fail) throw new Error('blocked'); return {data: pixels};}})})
};
function sample(rgb, alpha = 255) { pixels = new Uint8ClampedArray(Array.from({length: 64}, () => [...rgb, alpha]).flat()); }
function rgb(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map(n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); });
}
function lum(c) { return c.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0); }
function fromCss(css) { const m = css.match(/hsl\((\d+) (\d+)% (\d+)%\)/); assert(m); return rgb(+m[1], +m[2] / 100, +m[3] / 100); }
sample([30, 90, 220]);
vm.runInNewContext(source, {document, MutationObserver: class {constructor(cb) { observer = cb; } observe() {} }});
const blue = values.get('--terminal-bg');
assert.deepEqual(shared, values, 'Dialogs and screens receive the same palette as the lobby');
assert.match(blue, /hsl\(2\d\d /);
for (let hue = 0; hue < 360; hue += 5) {
    art.src = `hue-${hue}`;
    sample(rgb(hue, .8, .5).map(v => Math.round(v * 255)));
    listeners.load();
    assert.deepEqual(shared, values);
    for (const key of ['--terminal-bg', '--terminal-surface']) {
        const contrast = (lum([208 / 255, 217 / 255, 213 / 255]) + .05) / (lum(fromCss(values.get(key))) + .05);
        assert(contrast >= 4.5, `${key} hue ${hue}: ${contrast}`);
    }
    const action = (lum(fromCss(values.get('--terminal-action'))) + .05) / (lum([30 / 255, 39 / 255, 43 / 255]) + .05);
    assert(action >= 4.5, `button hue ${hue}`);
}
art.src = 'pending'; art.complete = false;
const previous = values.get('--terminal-bg');
observer(); assert.equal(values.get('--terminal-bg'), previous);
art.complete = true; sample([200, 30, 70]); listeners.load();
assert.notEqual(values.get('--terminal-bg'), previous);
art.src = 'transparent'; sample([255, 0, 0], 0); listeners.load(); assert.equal(values.size, 0);
art.src = 'grayscale'; sample([180, 180, 180]); listeners.load(); assert.equal(values.size, 0);
art.src = 'broken-canvas'; fail = true; listeners.load(); assert.equal(values.size, 0); fail = false;
art.src = 'recovered'; sample([20, 180, 120]); listeners.load(); assert.equal(values.size, 5);
art.dataset.artwork = 'unavailable'; observer(); assert.equal(values.size, 0);
assert.equal(shared.size, 0, 'A failed image resets the shared theme too');
assert.doesNotThrow(() => vm.runInNewContext(source, {document: {getElementById: () => null}}));
console.log('PASS: character color changes, 72 hues with readable surfaces/buttons, pending loads, transparent/grayscale art, canvas failures, recovery and missing lobby.');
