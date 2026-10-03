// Game icons: https://github.com/Mar-7th/StarRailRes (HoYoverse / COGNOSPHERE).
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
async function index(name) {
    const response = await fetch(`${base}index_new/kr/${name}.json`);
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    return response.json();
}
const [characters, ranks, relics, elements, paths] = await Promise.all(
    ['characters', 'character_ranks', 'relics', 'elements', 'paths'].map(index));
const catalog = vm.runInNewContext(`${await fs.readFile(path.join(root, 'assets/js/characters.js'), 'utf8')}\ncharacterCatalog`);
const assets = {characters:{}, relics:{}, elements:{}, paths:{}};
const downloads = new Map();
function icon(source, group) {
    if (!source) return null;
    const target = `assets/spec-icons/${group}/${path.posix.basename(source)}`;
    downloads.set(target, source);
    return target;
}
for (const c of catalog) {
    assets.characters[c.id] = (characters[c.id]?.ranks || []).map(id => ({
        name:ranks[id]?.name || '', icon:icon(ranks[id]?.icon, 'eidolons')
    }));
}
for (const [id, r] of Object.entries(relics)) assets.relics[id] = {
    name:r.name, rarity:r.rarity, setId:r.set_id, slot:r.type, icon:icon(r.icon, 'relics')
};
for (const [id, e] of Object.entries(elements)) assets.elements[id] = icon(e.icon, 'elements');
for (const [id, p] of Object.entries(paths)) assets.paths[id] = icon(p.icon, 'paths');
const queue = [...downloads];
let complete = 0;
await Promise.all(Array.from({length:12}, async () => {
    while (queue.length) {
        const [target, source] = queue.shift();
        await fs.mkdir(path.dirname(path.join(root, target)), {recursive:true});
        try { await fs.access(path.join(root, target)); }
        catch {
            let error;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const response = await fetch(base + source);
                    if (!response.ok) throw new Error(`${source}: ${response.status}`);
                    await fs.writeFile(path.join(root, target), Buffer.from(await response.arrayBuffer()));
                    error = null; break;
                } catch (failure) { error = failure; }
            }
            if (error) throw error;
        }
        complete++;
    }
}));
await fs.writeFile(path.join(root, 'assets/js/spec-assets.js'),
    `// Game icons: https://github.com/Mar-7th/StarRailRes\nconst HonkaiSpecAssets = ${JSON.stringify(assets)};\n`);
console.log(`Spec assets: ${complete} local icons, ${catalog.length} characters, ${Object.keys(relics).length} relic variants.`);
