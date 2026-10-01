import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../assets/js/profile-storage.js', import.meta.url), 'utf8');
const config = await fs.readFile(new URL('../assets/js/backend-config.js', import.meta.url), 'utf8');
const saved = new Map();
const key = (id, section) => `honkai-id-v1:${encodeURIComponent(id)}:${section}`;
saved.set(key('oldid', 'warp'), JSON.stringify({ pity: 37, history: ['old draw'] }));
function browser({ blocked = false } = {}) {
    const elements = new Map();
    const listeners = new Map();
    let logins = 0, reloads = 0;
    const get = id => {
        if (!elements.has(id)) elements.set(id, { value: '', textContent: '', hidden: false, inert: true,
            focus() {}, addEventListener(type, fn) { listeners.set(`${id}:${type}`, fn); } });
        return elements.get(id);
    };
    const context = vm.createContext({
        Event: class { constructor(type) { this.type = type; } },
        document: { getElementById: get, addEventListener(type, fn) { listeners.set(type, fn); } },
        localStorage: { getItem: key => saved.get(key) ?? null, setItem(key, value) {
            if (blocked) throw new Error('storage unavailable');
            saved.set(key, String(value));
        } },
        dispatchEvent(event) { assert.equal(event.type, 'honkai-profile-login'); logins++; },
        location: { reload() { reloads++; } },
        fetch() { throw new Error('ID entry must not call the backend'); }
    });
    vm.runInContext(config, context);
    assert.equal(context.HonkaiBackendConfig.baseUrl, '');
    vm.runInContext(source, context);
    listeners.get('DOMContentLoaded')();
    return { context, get, login(id) {
        get('profile-login-id').value = id;
        listeners.get('profile-login-form:submit')({ preventDefault() {} });
    }, change() { listeners.get('profile-change:click')(); },
    get logins() { return logins; }, get reloads() { return reloads; } };
}
const a = browser();
assert.equal(a.context.HonkaiProfileStorage.getItem('warp'), null);
assert.throws(() => a.context.HonkaiProfileStorage.setItem('warp', '{}'));
a.login('  OLDID  ');
assert.equal(a.context.HonkaiProfileStorage.id, 'oldid');
assert.equal(JSON.parse(a.context.HonkaiProfileStorage.getItem('warp')).pity, 37);
assert.equal(a.logins, 1);
assert.equal(a.get('app-content').inert, false);
assert.equal(a.get('profile-login-screen').hidden, true);
for (const section of ['warp', 'relic', 'teams']) a.context.HonkaiProfileStorage.setItem(section, JSON.stringify({ section, owner: 'oldid' }));
assert.throws(() => a.context.HonkaiProfileStorage.setItem('invalid', '{}'));
a.context.isWarping = true;
a.change(); assert.equal(a.reloads, 0);
a.context.isWarping = false;
a.change(); assert.equal(a.reloads, 1);
const b = browser(); b.login('another');
for (const section of ['warp', 'relic', 'teams']) assert.equal(b.context.HonkaiProfileStorage.getItem(section), null);
b.context.HonkaiProfileStorage.setItem('teams', '["other party"]');
const c = browser(); c.login('oldid');
for (const section of ['warp', 'relic', 'teams']) assert.equal(JSON.parse(c.context.HonkaiProfileStorage.getItem(section)).owner, 'oldid');
const invalid = browser();
for (const id of ['', 'has space', '../a', 'a'.repeat(31)]) {
    invalid.login(id); assert.equal(invalid.context.HonkaiProfileStorage.id, null); assert.ok(invalid.get('profile-login-error').textContent);
}
const korean = browser(); korean.login('사용자_1'); assert.equal(korean.context.HonkaiProfileStorage.id, '사용자_1');
const denied = browser({ blocked: true }); denied.login('oldid');
assert.equal(denied.context.HonkaiProfileStorage.id, null);
assert.equal(denied.logins, 0);
assert.ok(denied.get('profile-login-error').textContent);
assert.equal(JSON.parse(saved.get(key('oldid', 'warp'))).owner, 'oldid');
console.log('PASS: no-server ID entry, normalization, validation, old saves, three-section persistence, ID isolation, reload, draw guard and storage failure.');
