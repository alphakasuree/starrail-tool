import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../assets/js/profile-storage.js', import.meta.url), 'utf8');
const config = await fs.readFile(new URL('../assets/js/backend-config.js', import.meta.url), 'utf8');
const saved = new Map();
const lastProfileKey = 'honkai-last-profile-v1';
const key = (id, section) => `honkai-id-v1:${encodeURIComponent(id)}:${section}`;
saved.set(key('oldid', 'warp'), JSON.stringify({ pity: 37, history: ['old draw'] }));
function browser({ blocked = false, resume = false, readBlocked = false } = {}) {
    if (!resume) saved.set(lastProfileKey, 'null');
    const elements = new Map();
    const listeners = new Map();
    let logins = 0, reloads = 0, lookups = 0;
    const get = id => {
        if (!elements.has(id)) elements.set(id, { value: '', textContent: '', hidden: false, inert: true,
            focus() {}, addEventListener(type, fn) { listeners.set(`${id}:${type}`, fn); } });
        return elements.get(id);
    };
    const context = vm.createContext({
        Event: class { constructor(type) { this.type = type; } },
        document: { getElementById: get, addEventListener(type, fn) { listeners.set(type, fn); } },
        localStorage: { get length() {return saved.size;}, key: i => [...saved.keys()][i] ?? null,
            getItem: key => {if(readBlocked)throw new Error('storage unavailable');return saved.get(key) ?? null;}, setItem(key, value) {
            if (blocked) throw new Error('storage unavailable');
            saved.set(key, String(value));
        }, removeItem: key => saved.delete(key) },
        HonkaiUid: {validUid:id=>/^[1-9][0-9]{8,9}$/.test(id),
            async lookup(uid){lookups++;return {uid,nickname:'개척자',level:70};},
            validateSnapshot(p){if(!p || typeof p.uid!=='string' || typeof p.nickname!=='string')throw new Error('bad snapshot');return p;}},
        HonkaiAccount: {importUid(p){saved.set(key(p.uid,'account'),JSON.stringify({uidProfile:p}));}},
        dispatchEvent(event) { if(event.type==='honkai-profile-login') logins++; },
        location: { reload() { reloads++; } },
        fetch() { throw new Error('ID entry must not call the backend'); }
    });
    vm.runInContext(config, context);
    assert.equal(context.HonkaiBackendConfig.baseUrl, '');
    vm.runInContext(source, context);
    listeners.get('DOMContentLoaded')();
    get('profile-login-mode').value = 'local';
    return { context, get, login(id) {
        get('profile-login-id').value = id;
        return listeners.get('profile-login-form:submit')({ preventDefault() {} });
    }, mode(value) {
        get('profile-login-mode').value = value;
        listeners.get('profile-login-mode:change')();
    }, change() { listeners.get('profile-change:click')(); },
    get logins() { return logins; }, get reloads() { return reloads; }, get lookups() {return lookups;} };
}
const a = browser();
a.mode('uid');
assert.match(a.get('profile-login-title').textContent, /UID/);
assert.match(a.get('profile-login-description').textContent, /공개.*불러와/);
assert.equal(a.get('profile-login-id').inputMode, 'numeric');
assert.equal(a.get('profile-login-id').maxLength, 10);
assert.match(a.get('profile-login-input-help').textContent, /9~10자리/);
a.get('profile-login-id').value = '100000999';
a.get('profile-login-error').textContent = '이전 오류';
a.mode('local');
assert.equal(a.get('profile-login-id').value, '');
assert.equal(a.get('profile-login-error').textContent, '');
assert.equal(a.get('profile-login-title').textContent, '로컬 프로필로 시작');
assert.match(a.get('profile-login-description').textContent, /같은 이름.*열고.*새 프로필/);
assert.match(a.get('profile-login-id').placeholder, /새 이름/);
assert.equal(a.get('profile-login-id').inputMode, 'text');
assert.equal(a.get('profile-login-id').maxLength, 30);
assert.match(a.get('profile-login-input-help').textContent, /1~30자/);
assert.equal(a.get('profile-submit').textContent, '로컬 프로필로 시작 →');
assert.equal(a.lookups, 0, 'Switching entry modes must not look up a UID');
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
assert.equal(b.context.HonkaiProfileStorage.id, 'another');
assert.equal(b.context.HonkaiProfileStorage.linkedUid, false);
assert.equal(b.logins, 1);
assert.equal(b.lookups, 0, 'New local profiles must not look up a UID');
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
// Reload restores the last successful entry, including its isolated sections.
const manual = browser(); manual.login('oldid');
const restored = browser({resume:true});
assert.equal(restored.context.HonkaiProfileStorage.id,'oldid');
assert.equal(restored.logins,1);assert.equal(restored.get('profile-login-screen').hidden,true);
assert.equal(JSON.parse(restored.context.HonkaiProfileStorage.getItem('warp')).owner,'oldid');
assert.equal(restored.lookups,0);
restored.change();
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,null,'Explicit profile change must stay on entry');
manual.login('oldid');manual.context.HonkaiProfileStorage.renameProfile('renamed');
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,'renamed');
manual.context.HonkaiProfileStorage.deleteProfile();
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,null,'Deleted profile must not be restored');
const uidLogin = browser();uidLogin.mode('local');uidLogin.mode('uid');
assert.equal(uidLogin.get('profile-login-title').textContent, '게임 UID 연동');
assert.equal(uidLogin.get('profile-login-label').textContent, '붕괴: 스타레일 UID');
assert.equal(uidLogin.get('profile-submit').textContent, 'UID 조회하고 연동 →');
await uidLogin.login('100000999');
assert.equal(uidLogin.lookups,1);
const uidReload = browser({resume:true});
assert.equal(uidReload.context.HonkaiProfileStorage.id,'100000999');assert.equal(uidReload.context.HonkaiProfileStorage.linkedUid,true);
assert.equal(uidReload.lookups,0);assert.match(uidReload.get('profile-current-id').textContent,/개척자.*UID 100000999/);
assert.throws(()=>uidReload.context.HonkaiProfileStorage.renameProfile('other'));
saved.set(lastProfileKey,JSON.stringify({version:1,id:'missing',linkedUid:false}));
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,null);
saved.set(lastProfileKey,'{broken');
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,null);
saved.set(lastProfileKey,JSON.stringify({version:1,id:'100000999',linkedUid:true}));
saved.set(key('100000999','account'),'{broken');
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,null);
assert.equal(browser({resume:true,readBlocked:true}).context.HonkaiProfileStorage.id,null);
// Legacy migration chooses a sole saved profile, but never chooses between IDs.
saved.clear();saved.set(key('legacy','warp'),'{"pity":12}');
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,'legacy');
saved.delete(lastProfileKey);saved.set(key('second','ready'),'1');
assert.equal(browser({resume:true}).context.HonkaiProfileStorage.id,null);
console.log('PASS: local/UID reload restoration without lookup, legacy migration, profile change, rename/delete, corrupt/missing/blocked storage, ID isolation and draw guard.');
