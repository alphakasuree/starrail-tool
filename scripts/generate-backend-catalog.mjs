import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({});
for (const name of ['characters.js', 'light-cones.js', 'warp-banner-data.js']) {
    vm.runInContext(await fs.readFile(path.join(root, 'assets/js', name), 'utf8'), context);
}
const catalog = vm.runInContext('[...characterCatalog, ...lightConeCatalog]', context);
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const legacy = vm.runInContext(html.match(/const db = \[[\s\S]*?\n        \];/)[0] + '\ndb', vm.createContext({}));
const coneByName = new Map(catalog.filter(item => item.type === 'lightcone').map(item => [item.name, item]));
const db = legacy.map(item => {
    // The current client uses FIRST character name match and LAST cone name match.
    const entry = item.type === 'character'
        ? catalog.find(entry => entry.type === 'character' && entry.name === item.name)
        : coneByName.get(item.name);
    if (!entry) throw new Error(`Unresolved item: ${item.name}`);
    return { ...entry, isUp: !!item.isUp };
});
const key = item => `${item.type}:${item.id}`;
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const row = values => `(${values.join(',')})`;
const bool = value => value ? 'TRUE' : 'FALSE';
const itemRows = catalog.map(item => row([quote(key(item)), quote(item.id), quote(item.type), quote(item.name), item.rarity]));
const bannerRows = [], poolRows = [];
for (const type of ['character', 'lightcone']) {
    for (const banner of context.WarpBannerCatalog[type === 'character' ? 'characters' : 'lightcones']) {
        const featured = catalog.find(item => item.type === type && item.id === banner.id);
        if (!featured) throw new Error(`Missing featured item: ${banner.id}`);
        const bannerKey = `${type}:${banner.id}`;
        let up4 = (banner.up4 || []).map(id => catalog.find(item => item.type === type && item.id === id && item.rarity === 4)).filter(Boolean);
        if (!up4.length) up4 = type === 'character' ? db.filter(item => item.rarity === 4 && item.isUp)
            : ['21000', '21001', '21002'].map(id => catalog.find(item => item.type === 'lightcone' && item.id === id));
        if (banner.collaboration) up4 = [];
        const standard = type === 'character' ? ['1003', '1004', '1101', '1104', '1107', '1209', '1211']
            : ['23000', '23002', '23003', '23004', '23005', '23012', '23013'];
        const pool = new Map();
        for (const item of [...db.filter(item => item.rarity <= 4), ...standard.map(id => catalog.find(item => item.type === type && item.id === id))]) {
            pool.set(key(item), { item, featured: false });
        }
        for (const item of [...up4, featured]) pool.set(key(item), { item, featured: true });
        bannerRows.push(row([quote(bannerKey), quote(banner.title), quote(type + (banner.collaboration ? 'Collaboration' : '')),
            quote(key(featured)), bool(!banner.collaboration), 'TRUE']));
        for (const entry of pool.values()) poolRows.push(row([quote(bannerKey), quote(key(entry.item)), bool(entry.featured)]));
    }
}
const insert = (table, columns, rows) => Array.from({ length: Math.ceil(rows.length / 100) }, (_, index) =>
    `INSERT INTO ${table} (${columns}) VALUES\n${rows.slice(index * 100, index * 100 + 100).join(',\n')};`).join('\n');
const sql = '-- Generated from current frontend catalogs. Keep this migration immutable after deployment.\n' + [
    insert('warp_item', 'item_key,catalog_id,item_type,name,rarity', itemRows),
    insert('warp_banner', 'banner_key,title,pity_group,featured_item_key,featured_four,enabled', bannerRows),
    insert('warp_banner_pool', 'banner_key,item_key,featured', poolRows)
].join('\n') + '\n';
const output = path.resolve(root, 'tmp/catalog.sql');
const relative = path.relative(root, output);
if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output must stay in the workspace');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, sql);
console.log(`Generated ${itemRows.length} items, ${bannerRows.length} banners, ${poolRows.length} pool entries -> ${output}`);
