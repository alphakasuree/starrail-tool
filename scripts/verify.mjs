import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFile(path.join(root, name), 'utf8');
const html = await read('index.html');
const jsNames = (await fs.readdir(path.join(root, 'assets/js')))
    .filter(name => name.endsWith('.js'));
const codeFiles = ['index.html', ...jsNames.map(name => `assets/js/${name}`),
    ...(await fs.readdir(path.join(root, 'assets/css'))).map(name => `assets/css/${name}`)];
const references = new Set();
for (const name of codeFiles) {
    const source = await read(name);
    if (name.endsWith('.js')) new vm.Script(source, { filename: name });
    for (const match of source.matchAll(/(?:assets|docs\/references)\/[A-Za-z0-9_./-]+\.(?:js|css|png|mp3|wav|ogg|pdf)/g)) {
        references.add(match[0]);
    }
}
for (const [index, match] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries()) {
    if (!/\bsrc\s*=/.test(match[1])) new vm.Script(match[2], { filename: `inline-${index}.js` });
}

const catalogsContext = vm.createContext({});
for (const name of ['characters.js', 'light-cones.js']) {
    vm.runInContext(await read(`assets/js/${name}`), catalogsContext);
}
const items = vm.runInContext('[...characterCatalog, ...lightConeCatalog]', catalogsContext);
for (const item of items) {
    references.add(item.image);
    if (item.type === 'character') references.add(`assets/character-art/${item.id}.png`);
    else if (item.rarity >= 4) references.add(`assets/lightcone-art/${item.id}.png`);
}
// Compare directory entries explicitly: Windows accepts casing that Pages rejects.
const directories = new Map();
for (const reference of references) {
    let directory = root;
    for (const part of reference.split('/')) {
        if (!directories.has(directory)) directories.set(directory, await fs.readdir(directory));
        assert(directories.get(directory).includes(part), `Missing or case-mismatched asset: ${reference}`);
        directory = path.join(directory, part);
    }
}

// Regression: OS animation preferences must not change the site's presentation.
assert.match(html, /#single-card-container\s+\.illustration\s*\{\s*opacity:\s*1\s*;/);
const css = await read('assets/css/warp-cinematic.css');
assert.match(css, /\.warp-reveal-enter\s*\{\s*animation:\s*warp-reveal-enter/);
for (const name of codeFiles) {
    assert.doesNotMatch(await read(name), /prefers-reduced-motion|motion-reduce:|motion-safe:/, `OS-dependent animation in ${name}`);
}

const timers = new Map();
let timerId = 0, preloadCount = 0;
const artworkContext = vm.createContext({
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    Image: class { constructor() { preloadCount++; } }
});
vm.runInContext(await read('assets/js/warp-artwork.js'), artworkContext);
const artwork = artworkContext.WarpArtwork;
const image = () => ({ dataset: {}, src: '', onload: null, onerror: null });
const item = { portrait: 'full.png', image: 'preview.png', rarity: 5 };

const success = image(), successStatus = { textContent: '' };
artwork.setSource(success, item, { status: successStatus });
assert.equal(success.src, 'full.png');
success.onload();
assert.equal(success.dataset.artwork, 'loaded');
assert.equal(successStatus.textContent, '');
assert.equal(timers.size, 0);

const failed = image(), failedStatus = { textContent: '' };
artwork.setSource(failed, item, { status: failedStatus });
failed.onerror();
assert.equal(failed.src, 'preview.png');
failed.onload();
assert.equal(failed.dataset.artwork, 'preview');
assert.match(failedStatus.textContent, /미리보기/);
assert.equal(timers.size, 0);

const delayed = image();
artwork.setSource(delayed, item);
[...timers.values()][0]();
assert.equal(delayed.src, 'preview.png');
delayed.onerror();
assert.equal(delayed.dataset.artwork, 'unavailable');
assert.equal(timers.size, 0);

const replaced = image();
artwork.setSource(replaced, item);
artwork.setSource(replaced, { portrait: 'new.png', image: 'new-preview.png' });
assert.equal(timers.size, 1);
replaced.onload();
assert.equal(replaced.src, 'new.png');
assert.equal(timers.size, 0);

artwork.preload(Array.from({ length: 10 }, () => item));
assert.equal(preloadCount, 1);
console.log(`PASS: JS syntax, ${references.size} asset paths, ${items.length} catalog entries, OS-independent animations, artwork fallback and preload checks.`);
