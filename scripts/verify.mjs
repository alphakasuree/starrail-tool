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
const fourStarCones = items.filter(item => item.type === 'lightcone' && item.rarity === 4);
assert.equal(fourStarCones.length, 73);
assert.equal(fourStarCones.filter(item => item.warpEligible).length, 31);
assert(fourStarCones.every(item => item.acquisition !== 'unknown'), 'Every four-star cone needs an acquisition category');
for (const id of ['21021', '21028', '21050', '21052', '21064', '21065', '22000', '22008']) {
    assert.equal(fourStarCones.find(item => item.id === id)?.warpEligible, false, `${id} cannot drop from warp`);
}
const appSource = await read('assets/js/app.js');
const poolContext = vm.createContext({HonkaiImages: {applyToCatalog() {}}});
for (const name of ['characters.js', 'light-cones.js']) vm.runInContext(await read(`assets/js/${name}`), poolContext);
vm.runInContext(appSource.slice(0, appSource.indexOf('        banners.character.title')), poolContext);
const warpCones = vm.runInContext('[...banners.character.pool4, ...banners.lightcone.pool4, ...banners.lightcone.pool4Up].filter(item => item.type === "lightcone")', poolContext);
assert(warpCones.every(item => item.warpEligible === true), 'Non-warp cones must never enter either banner');
assert.equal(new Set(warpCones.map(item => item.id)).size, 31);
const fiveStarCones = items.filter(item => item.type === 'lightcone' && item.rarity === 5);
assert.equal(fiveStarCones.length, 72);
assert(fiveStarCones.every(item => item.acquisition !== 'unknown'));
assert.equal(fiveStarCones.filter(item => item.acquisition === 'standard').length, 7);
assert.equal(fiveStarCones.filter(item => item.acquisition === 'herta').length, 7);
assert.equal(fiveStarCones.filter(item => item.acquisition === 'collaboration').length, 4);
assert(fiveStarCones.filter(item => item.acquisition === 'herta').every(item => !item.warpEligible));
const standardConeIds = vm.runInContext('banners.lightcone.pool5.map(item => item.id)', poolContext);
assert.deepEqual(Array.from(standardConeIds).sort(), ['23000','23002','23003','23004','23005','23012','23013']);
// Exercise collection rendering, including limited/shop labels and five-star styling.
vm.runInContext('function escapeHTML(value) { return String(value); }\n' + appSource.slice(appSource.indexOf('        function generateGridHTML('), appSource.indexOf('        function renderCollection(')), poolContext);
const fiveStarGrid = vm.runInContext('generateGridHTML(5, "lightcone")', poolContext);
for (const label of ['상시 워프', '한정 픽업', '콜라보 한정 픽업', '헤르타 상점', '워프 획득 불가']) assert(fiveStarGrid.includes(label));
assert(fiveStarGrid.includes('rarity-5') && fiveStarGrid.includes('text-yellow-400'));
assert.equal((fiveStarGrid.match(/class="collection-entry"/g) || []).length, 72);
for (const item of items) {
    references.add(item.image);
    if (item.type === 'character') references.add(`assets/character-art/${item.id}.png`);
    else if (item.rarity >= 4) references.add(`assets/lightcone-art/${item.id}.png`);
}
// Every WebP listed in the manifest must exist next to its PNG fallback.
vm.runInContext(await read('assets/js/webp-manifest.js'), catalogsContext);
for (const [folder, ids] of Object.entries(catalogsContext.HonkaiWebpManifest)) {
    for (const id of ids) references.add(`assets/${folder}/${id}.webp`).add(`assets/${folder}/${id}.png`);
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

// Default presentation stays intact; reduced motion has an explicit accessible path.
assert.match(await read('assets/css/app.css'), /#single-card-container\s+\.illustration\s*\{\s*opacity:\s*1\s*;/);
const css = await read('assets/css/warp-cinematic.css');
assert.match(css, /\.warp-reveal-enter\s*\{\s*animation:\s*warp-reveal-enter/);
assert.match(await read('assets/css/accessibility.css'), /prefers-reduced-motion/);
assert.match(await read('assets/js/warp-cinematic.js'), /prefers-reduced-motion/);
assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>|\son[a-z]+\s*=|cdn\.tailwindcss/);
assert.match(html, /script-src 'self'/);

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

// WebP errors retry the same stage as PNG before falling back to the preview.
const webpContext = vm.createContext({ HonkaiWebpManifest: { 'character-art': ['1001'], characters: ['1001'] }, document: { addEventListener() {} } });
vm.runInContext(await read('assets/js/webp-images.js'), webpContext);
const webpImages = webpContext.HonkaiImages;
assert.equal(webpImages.toWebp('assets/character-art/1001.png'), 'assets/character-art/1001.webp');
assert.equal(webpImages.toWebp('assets/character-art/9999.png'), 'assets/character-art/9999.png');
assert.equal(webpImages.toWebp('assets/images/misha.png'), 'assets/images/misha.png');
artworkContext.HonkaiImages = webpImages;
const webpItem = { portrait: 'assets/character-art/1001.webp', image: 'assets/characters/1001.webp', rarity: 5 };
const webpImage = () => Object.assign(image(), { getAttribute() { return this.src; } });
const webpFailed = webpImage();
artwork.setSource(webpFailed, webpItem);
webpFailed.onerror({ type: 'error' });
assert.equal(webpFailed.src, 'assets/character-art/1001.png');
webpFailed.onerror({ type: 'error' });
assert.equal(webpFailed.src, 'assets/characters/1001.webp');
webpFailed.onerror({ type: 'error' });
assert.equal(webpFailed.src, 'assets/characters/1001.png');
webpFailed.onload();
assert.equal(webpFailed.dataset.artwork, 'preview');
assert.equal(timers.size, 0);
const webpDelayed = webpImage();
artwork.setSource(webpDelayed, webpItem);
[...timers.values()][0]();
assert.equal(webpDelayed.src, 'assets/characters/1001.webp', 'A slow WebP goes straight to the preview stage');
webpDelayed.onload();
delete artworkContext.HonkaiImages;

artwork.preload(Array.from({ length: 10 }, () => item));
assert.equal(preloadCount, 1);
console.log(`PASS: JS syntax, ${references.size} asset paths, ${items.length} catalog entries, default and reduced-motion support, artwork fallback and preload checks.`);
