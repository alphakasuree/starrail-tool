import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const base = process.env.API_BASE_URL || 'http://127.0.0.1:8080';
const stateFile = new URL('../tmp/runtime/account-smoke.json', import.meta.url);
class Browser {
    cookie = '';
    async call(route, { method = 'GET', body, headers = {} } = {}) {
        const response = await fetch(base + '/api' + route, { method, headers: {
            ...(this.cookie ? { Cookie: this.cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(method !== 'GET' ? { 'X-Honkai-Client': 'web' } : {}), ...headers
        }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const cookie = response.headers.get('set-cookie');
        if (cookie) { assert.match(cookie, /HttpOnly/); assert.match(cookie, /Path=\/api/); this.cookie = cookie.split(';')[0]; }
        const payload = response.status === 204 ? null : await response.json().catch(() => null);
        return { status: response.status, payload };
    }
    async ok(route, options) {
        const result = await this.call(route, options);
        // Error details intentionally omit request credentials.
        assert.ok(result.status < 400, `${route}: HTTP ${result.status}`);
        return result.payload;
    }
}
const team = { ids: ['1310', '1301', '1303', '1306'], savedAt: Date.now(), ownedOnly: false, fourStarOnly: false, acheronE2: false, offensive: false };
const relic = { id: randomUUID(), name: 'MySQL 세팅 확인', characterId: '1503', mode: 'build', savedAt: Date.now(), buildGoalsEdited: false, targets: [], profile: 'pdf',
    rows: ['cr', 'cd', 'spd', 'atk'].map(id => ({ id, value: '0' })), weights: Object.fromEntries(['cr', 'cd', 'spd', 'atk', 'hp', 'def', 'break', 'ehr', 'res', 'flatAtk', 'flatHp', 'flatDef'].map(id => [id, '0'])) };
const a = new Browser(), b = new Browser(), other = new Browser();
assert.equal((await a.ok('/health')).status, 'ok');
assert.equal((await a.call('/warp/progress')).status, 401);
let saved;
if (process.argv.includes('--resume')) {
    saved = JSON.parse(await readFile(stateFile, 'utf8'));
    await a.ok('/auth/login', { method: 'POST', body: { loginId: saved.loginId, password: saved.password } });
    assert.deepEqual(await a.ok('/warp/progress'), saved.progress);
    assert.deepEqual(await a.ok('/account/documents'), saved.documents);
    await a.ok('/auth/logout', { method: 'POST' });
    console.log('PASS: account login, warp history/pity/inventory and relic/team documents survived a full DB/API restart.');
} else {
    const loginId = 'smoke' + randomUUID().replaceAll('-', '').slice(0, 20), password = 'T!' + randomUUID();
    let account;
    try {
        const old = JSON.parse(await readFile(new URL('../tmp/runtime/smoke-profile.json', import.meta.url), 'utf8'));
        const previous = await other.call('/warp/progress', { headers: { Authorization: `Bearer ${old.token}` } });
        if (previous.status === 200) {
            account = await a.ok('/auth/upgrade', { method: 'POST', body: { loginId, displayName: 'MySQL 검증', password }, headers: { Authorization: `Bearer ${old.token}` } });
            assert.equal(account.profileId, old.profileId); assert.deepEqual(await a.ok('/warp/progress'), previous.payload);
            assert.equal((await other.call('/warp/progress', { headers: { Authorization: `Bearer ${old.token}` } })).status, 401);
            console.log('PASS: pre-existing anonymous MySQL profile upgraded without losing draws or pity; old bearer revoked.');
        }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!account) account = await a.ok('/auth/register', { method: 'POST', body: { loginId, displayName: 'MySQL 검증', password } });
    const second = await b.ok('/auth/login', { method: 'POST', body: { loginId, password } });
    assert.equal(second.profileId, account.profileId);
    const foreignId = 'smoke' + randomUUID().replaceAll('-', '').slice(0, 20);
    await other.ok('/auth/register', { method: 'POST', body: { loginId: foreignId, displayName: 'MySQL 검증', password: 'T!' + randomUUID() } });
    const state = await a.ok('/warp/progress'), revision = state.bannerStates.character.revision;
    const draw = { requestId: randomUUID(), bannerKey: 'character:1503', count: 10, expectedRevision: revision };
    const [first, retry] = await Promise.all([a.ok('/warp/pull', { method: 'POST', body: draw }), b.ok('/warp/pull', { method: 'POST', body: draw })]);
    assert.deepEqual(first, retry); assert.equal(first.results.length, 10);
    assert.deepEqual(await a.ok('/warp/progress'), await b.ok('/warp/progress'));
    assert.equal((await other.ok(`/warp/progress?profileId=${account.profileId}`)).history.character.length, 0);
    await a.ok('/account/documents/relic', { method: 'PUT', body: { entries: [relic], expectedRevision: 0 } });
    await b.ok('/account/documents/teams', { method: 'PUT', body: { entries: [team], expectedRevision: 0 } });
    assert.deepEqual(await a.ok('/account/documents'), await b.ok('/account/documents'));
    assert.equal((await other.ok(`/account/documents?profileId=${account.profileId}`)).relic.entries.length, 0);
    assert.equal((await b.call('/account/documents/relic', { method: 'PUT', body: { entries: [], expectedRevision: 0 } })).status, 409);
    const imported = { relic: [{ ...relic, id: randomUUID() }], teams: [team] };
    assert.equal((await a.ok('/account/import', { method: 'POST', body: imported })).addedRelics, 1);
    assert.equal((await b.ok('/account/import', { method: 'POST', body: imported })).alreadyImported, true);
    assert.equal((await b.call('/auth/login', { method: 'POST', body: { loginId, password: 'wrong-password' } })).status, 401);
    const oldCookie = a.cookie;
    await a.ok('/auth/refresh', { method: 'POST' }); assert.notEqual(a.cookie, oldCookie);
    assert.equal((await new Browser().call('/auth/me', { headers: { Cookie: oldCookie } })).status, 401);
    saved = { loginId, password, progress: await a.ok('/warp/progress'), documents: await a.ok('/account/documents') };
    await writeFile(stateFile, JSON.stringify(saved), { mode: 0o600 });
    const lastCookie = a.cookie;
    await a.ok('/auth/logout', { method: 'POST' });
    assert.equal((await new Browser().call('/auth/me', { headers: { Cookie: lastCookie } })).status, 401);
    assert.equal((await b.ok('/auth/me')).loginId, loginId);
    await b.ok('/auth/logout', { method: 'POST' }); await other.ok('/auth/logout', { method: 'POST' });
    console.log('PASS: independent cookie jars, shared account data, isolation, concurrent idempotent draw, import deduplication, wrong password, rotation and logout.');
}
