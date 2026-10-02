import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const read = name => fs.readFile(new URL(`../assets/js/${name}`, import.meta.url), 'utf8');
const [storageSource, formatSource, uiSource] = await Promise.all(['profile-storage.js', 'save-format.js', 'save-transfer.js'].map(read));
const formatContext = vm.createContext({});
vm.runInContext(formatSource, formatContext);
const format = formatContext.HonkaiSaveFormat;
const groupNames = ['character', 'lightcone', 'characterCollaboration', 'lightconeCollaboration'];
const statIds = ['cr', 'cd', 'spd', 'atk', 'hp', 'def', 'break', 'ehr', 'res', 'flatAtk', 'flatHp', 'flatDef'];
const warp = {
    version: 1, bannerStates: Object.fromEntries(groupNames.map(group => [group, {pity5: 37, pity4: 4, guaranteed5: true, guaranteed4: false}])),
    selectedPickups: {character: '1503', lightcone: '23055'},
    history: Object.fromEntries(groupNames.map(group => [group, [{name: '펄', rarity: 5, type: 'character', featured: true, time: '2026-10-02T00:00:00Z'}]])), inventory: {'character:1503': 1}
};
const relic = [{id: 'setting1', characterId: '1503', name: '펄 세팅', mode: 'build', savedAt: 1790899200000, profile: 'pdf', buildGoalsEdited: true,
    targets: [{id: 'cr', value: '50', endValue: '55', current: '' , mode: 'min'}],
    rows: statIds.slice(0, 4).map(id => ({id, value: ''})), weights: Object.fromEntries(statIds.map(id => [id, '.5']))}];
const teams = [{ids: ['1503', '1004', '1101', '1202'], savedAt: 1790899200000, offensive: false}];
const raw = {warp: JSON.stringify(warp), relic: JSON.stringify(relic), teams: JSON.stringify(teams)};
const save = format.create('원래아이디', raw, '2026-10-02T01:00:00Z');
const serialized = JSON.stringify(save);
assert.equal(JSON.stringify(format.toRaw(format.parse(serialized))), JSON.stringify(raw));
assert.equal(format.summary(save).history, 4);
assert.equal(format.summary(save).relic, 1);
assert.equal(format.parse('\uFEFF' + serialized).profileId, '원래아이디');
assert.equal(format.create('empty', {warp: null, relic: null, teams: null}).sections.warp, null);
assert.throws(() => format.parse('{broken'));
for (const mutate of [s => s.version = 99, s => delete s.sections.teams, s => s.sections.warp.bannerStates.lightcone.pity5 = 80,
    s => s.sections.warp.history.character[0].time = 'bad', s => s.sections.relic[0].rows = [],
    s => s.sections.relic[0].weights.cr = 2, s => s.sections.teams[0].ids = ['a'], s => s.sections.warp.inventory.a = -1]) {
    const altered = JSON.parse(serialized); mutate(altered); assert.throws(() => format.parse(JSON.stringify(altered)));
}
assert.throws(() => format.parse(serialized.replace('"format":', '"__proto__":{"polluted":true},"format":')));
assert.throws(() => format.parse('x'.repeat(format.MAX_BYTES + 1)));
console.log('PASS: save round-trip, complete metadata and sections, BOM, empty saves, corrupt files, version, schema and unsafe-key rejection.');

function browser() {
    const stored = new Map(), elements = new Map(), callbacks = new Map(), notifications = [], downloads = [], revoked = [];
    let denied = false;
    const key = (id, section) => `honkai-id-v1:${encodeURIComponent(id)}:${section}`;
    const get = id => {
        if (!elements.has(id)) elements.set(id, {value: '', textContent: '', innerHTML: '', hidden: false, checked: false, disabled: false, files: [], open: false,
            focus() {}, addEventListener(type, callback) {callbacks.set(`${id}:${type}`, callback);},
            showModal() {this.open = true;}, close() {this.open = false; callbacks.get(`${id}:close`)?.();}});
        return elements.get(id);
    };
    const context = vm.createContext({
        Blob, isWarping: false, HonkaiWarpApi: {enabled: false},
        Event: class {constructor(type) {this.type = type;}},
        document: {getElementById: get, activeElement: {focus() {}}, body: {append() {}},
            createElement() {return {click() {downloads.push(this.download);}, remove() {}};},
            addEventListener(type, callback) {callbacks.set(type, callback);}},
        URL: {createObjectURL() {return 'blob:save';}, revokeObjectURL(url) {revoked.push(url);}},
        setTimeout(callback) {callback();},
        localStorage: {removeItem: key => stored.delete(key), getItem: key => stored.get(key) ?? null, setItem(key, value) {if (denied) throw new Error('quota exceeded'); stored.set(key, String(value));}},
        addEventListener() {}, dispatchEvent(event) {notifications.push(event.type);}, location: {reload() {}},
        fetch() {throw new Error('Save transfer must not call a backend');}
    });
    vm.runInContext(storageSource, context); vm.runInContext(formatSource, context);
    callbacks.get('DOMContentLoaded')(); vm.runInContext(uiSource, context);
    const action = (id, event = 'click') => callbacks.get(`${id}:${event}`)();
    const login = id => {get('profile-login-id').value = id; callbacks.get('profile-login-form:submit')({preventDefault() {}});};
    get('profile-login-mode').value = 'local'; login('destination');
    return {context, stored, get, action, login, key, notifications, downloads, revoked, deny(value) {denied = value;}};
}
const b = browser(), storage = b.context.HonkaiProfileStorage;
for (const [section, value] of Object.entries(raw)) storage.setItem(section, value);
const original = JSON.stringify(storage.snapshot());
b.stored.set(b.key('other', 'warp'), 'untouched');
const empty = {warp: null, relic: '[]', teams: '[]'};
b.deny(true);
assert.throws(() => storage.importSections(empty));
assert.equal(JSON.stringify(storage.snapshot()), original);
b.deny(false);
storage.importSections(empty, storage.snapshot());
assert.equal(storage.getItem('warp'), null);
assert.equal(JSON.stringify(storage.getPrevious().sections), original);
storage.setItem('teams', '[{"updated":true}]');
assert.equal(storage.getItem('teams'), '[{"updated":true}]');
storage.restorePrevious();
assert.equal(JSON.stringify(storage.snapshot()), original);
assert.equal(storage.getPrevious(), null);
assert.equal(b.stored.get(b.key('other', 'warp')), 'untouched');
assert.throws(() => storage.importSections(empty, {warp: null, relic: null, teams: null}));
console.log('PASS: atomic replacement, quota failure leaves all sections unchanged, updates after import, persistent recovery and ID isolation.');

b.action('profile-save-open');
assert.equal(b.get('save-dialog').open, true);
b.action('save-export');
assert.match(b.downloads[0], /^honkai-save-destination-.*\.json$/);
assert.deepEqual(b.revoked, ['blob:save']);
b.get('save-file').files = [{name: 'other-device.json', size: serialized.length, text: async () => serialized}];
await b.action('save-file', 'change');
assert.equal(b.get('save-preview').hidden, false);
assert.match(b.get('save-file-info').textContent, /原|원래아이디/);
assert.equal(b.get('save-import').disabled, true);
b.get('save-replace-check').checked = true; b.action('save-replace-check', 'change');
assert.equal(b.get('save-import').disabled, false);
b.context.isWarping = true; b.action('save-import');
assert.match(b.get('save-error').textContent, /추첨/);
b.context.isWarping = false;
storage.setItem('teams', '[]');
b.action('save-import');
assert.match(b.get('save-error').textContent, /변경/);
await b.action('save-file', 'change');
b.get('save-replace-check').checked = true; b.action('save-replace-check', 'change');
b.action('save-import');
assert.equal(storage.id, 'destination');
assert.equal(storage.getItem('teams'), raw.teams);
assert.equal(b.get('save-preview').hidden, true);
assert.equal(b.get('save-undo-panel').hidden, false);
assert.deepEqual(b.notifications.slice(-2), ['honkai-save-imported', 'honkai-documents-changed']);
b.action('save-undo');
assert.equal(storage.getItem('teams'), '[]');
assert.equal(b.get('save-undo-panel').hidden, true);
let readLarge = false;
b.get('save-file').files = [{size: format.MAX_BYTES + 1, text: async () => {readLarge = true; return serialized;}}];
await b.action('save-file', 'change');
assert.equal(readLarge, false);
assert.match(b.get('save-error').textContent, /512KB/);
b.get('save-file').files = [{size: 10, text: async () => '{broken'}];
await b.action('save-file', 'change');
assert.equal(b.get('save-preview').hidden, true);
assert.equal(b.get('save-import').disabled, true);
let finishRead;
b.get('save-file').files = [{size: 10, text: () => new Promise(resolve => {finishRead = resolve;})}];
const reading = b.action('save-file', 'change');
b.action('save-close'); finishRead(serialized); await reading;
assert.equal(b.get('save-preview').hidden, true);
console.log('PASS: download, preview, explicit replacement, draw guard, changed-save guard, live update events, undo, oversized and corrupt files, and cancellation.');

// Limits are checked before mutation, including multi-byte input.
assert.throws(() => format.parse('한'.repeat(Math.floor(format.MAX_BYTES / 3) + 1)), /512KB/);
const stable = JSON.stringify(storage.snapshot());
assert.throws(() => storage.setItem('warp', 'x'.repeat(512 * 1024 + 1)), /한도/);
assert.equal(JSON.stringify(storage.snapshot()), stable);
assert.throws(() => storage.importSections({warp: 'x'.repeat(512 * 1024 + 1), relic: null, teams: null}), /한도/);
assert.equal(JSON.stringify(storage.snapshot()), stable);
storage.importSections(empty);
storage.clearPrevious();
assert.equal(storage.getPrevious(), null);
assert.equal(storage.getItem('teams'), '[]');
storage.deleteProfile();
assert.equal(storage.id, null);
assert.equal(b.stored.get(b.key('other', 'warp')), 'untouched');
for (const section of ['warp', 'relic', 'teams', 'save-bundle', 'ready']) assert.equal(b.stored.has(b.key('destination', section)), false);
console.log('PASS: byte and profile limits preserve saves, recovery cleanup and deletion remain scoped to the active profile.');
