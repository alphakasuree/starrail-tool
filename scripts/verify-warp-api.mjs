import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = await fs.readFile(new URL('../assets/js/warp-api.js', import.meta.url), 'utf8');
const storage = new Map(), calls = [], pulls = [], events = [], batches = new Map();
const groups = ['character', 'lightcone', 'characterCollaboration', 'lightconeCollaboration'];
const initial = () => ({ version: 1,
    bannerStates: Object.fromEntries(groups.map(group => [group, { pity4: 0, pity5: 0, guaranteed4: false, guaranteed5: false, revision: 0 }])),
    selectedPickups: { character: '1503', lightcone: '23055' },
    history: Object.fromEntries(groups.map(group => [group, []])), inventory: {}
});
const view = { profileId: 'test-account', loginId: 'tester', displayName: '테스터', expiresAt: '2050-01-01T00:00:00Z', absoluteExpiresAt: '2050-02-01T00:00:00Z' };
let canonical = initial(), canonicalDocs = { relic: { entries: [], revision: 0 }, teams: { entries: [], revision: 0 } };
let authenticated = false, failNext = false, conflictNext = false;
const answer = (body, status = 200) => ({ ok: status < 400, status, json: async () => structuredClone(body) });
const legacySession = 'honkai-server-v1:https%3A%2F%2Fbackend.example:old:session';
storage.set(legacySession, '{"token":"legacy-only"}');
storage.set('honkai-id-v1:old:relic', '[{"id":"original"}]');
const originals = new Map(storage);
const context = vm.createContext({
    HonkaiBackendConfig: { baseUrl: 'https://backend.example' },
    URL, AbortController, crypto: webcrypto, Event,
    setTimeout: (fn, ms) => { const timer = setTimeout(fn, ms); timer.unref(); return timer; }, clearTimeout,
    dispatchEvent: event => events.push(event.type),
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    fetch: async (url, options) => {
        calls.push({ url, options });
        assert.equal(options.credentials, 'include');
        if (options.method !== 'GET') assert.equal(options.headers['X-Honkai-Client'], 'web');
        if (url.endsWith('/auth/login') || url.endsWith('/auth/register') || url.endsWith('/auth/upgrade')) {
            if (url.endsWith('/auth/upgrade')) assert.equal(options.headers.Authorization, 'Bearer legacy-only');
            else assert.equal(options.headers.Authorization, undefined);
            authenticated = true; return answer(view);
        }
        assert.equal(options.headers.Authorization, undefined);
        if (url.endsWith('/auth/logout')) { authenticated = false; return answer(null, 204); }
        if (!authenticated) return answer({ detail: 'Expired' }, 401);
        if (url.endsWith('/auth/me') || url.endsWith('/auth/refresh')) return answer(view);
        if (url.endsWith('/progress')) return answer(canonical);
        if (url.endsWith('/selection')) { canonical.selectedPickups = JSON.parse(options.body); return answer(null, 204); }
        if (url.endsWith('/account/documents')) return answer(canonicalDocs);
        if (url.includes('/account/documents/')) {
            const section = url.split('/').at(-1), body = JSON.parse(options.body);
            if (body.expectedRevision !== canonicalDocs[section].revision) return answer({ detail: 'Document conflict' }, 409);
            canonicalDocs[section] = { entries: body.entries, revision: body.expectedRevision + 1 };
            return answer(canonicalDocs[section]);
        }
        if (url.endsWith('/account/import')) return answer({ documents: canonicalDocs, alreadyImported: true, addedRelics: 0, addedTeams: 0 });
        if (url.endsWith('/pull')) {
            const body = JSON.parse(options.body); pulls.push(body);
            if (conflictNext) { conflictNext = false; return answer({ detail: 'Stale revision' }, 409); }
            if (!batches.has(body.requestId)) {
                const result = { requestId: body.requestId, pityGroup: 'character', state: { pity4: 0, pity5: 1, guaranteed4: false, guaranteed5: false, revision: canonical.bannerStates.character.revision + 1 }, results: [{ historyId: batches.size + 1, id: '1503', name: '펄', rarity: 5, type: 'character', time: '2026-10-02T00:00:00Z' }] };
                batches.set(body.requestId, result); canonical.bannerStates.character = result.state; canonical.history.character.push(...result.results); canonical.inventory['character:1503'] = 1;
            }
            if (failNext) { failNext = false; throw new TypeError('Connection lost after commit'); }
            return answer(batches.get(body.requestId));
        }
        throw Error(`Unexpected request: ${url}`);
    }
});
vm.runInContext(source, context);
let api = context.HonkaiWarpApi;
assert.equal(await api.restore(), null);
await api.login('tester', 'test-only-not-stored');
assert.equal(api.account.loginId, 'tester');
failNext = true;
await assert.rejects(api.pull('character:1503', 10, 'character'));
await assert.rejects(api.pull('character:1102', 10, 'character'));
assert.equal(pulls.length, 1);
await api.pull('character:1503', 10, 'character');
assert.equal(pulls[0].requestId, pulls[1].requestId);
assert.equal(api.progress.history.character.length, 1);
assert.equal([...storage.keys()].filter(key => key.endsWith(':pending')).length, 0);
await Promise.all([api.saveSelection({ character: '1102', lightcone: '23055' }), api.saveSelection({ character: '1503', lightcone: '23055' })]);
assert.equal(api.progress.selectedPickups.character, '1503');
conflictNext = true;
await assert.rejects(api.pull('character:1503', 1, 'character'), error => error.status === 409);
assert.equal(api.progress.bannerStates.character.revision, 1);
failNext = true;
await assert.rejects(api.pull('character:1503', 1, 'character'));
const pendingId = pulls.at(-1).requestId;
vm.runInContext(source, context);
api = context.HonkaiWarpApi;
await api.restore();
assert.equal(pulls.at(-1).requestId, pendingId);
assert.equal(api.progress.history.character.length, 2);
await api.saveDocument('relic', [{ id: 'test' }]);
canonicalDocs.relic.revision++;
await assert.rejects(api.saveDocument('relic', []), error => error.status === 409);
assert.equal(api.documents.relic.revision, 2);
assert.ok(events.includes('honkai-documents-changed'));
await api.importData([], []);
await Promise.all([api.refreshSession(), api.refreshSession()]);
assert.equal(calls.filter(call => call.url.endsWith('/auth/refresh')).length, 1);
authenticated = false;
await assert.rejects(api.refresh(), error => error.status === 401);
assert.equal(api.account, null);
assert.ok(events.includes('honkai-session-expired'));
await api.register('tester', '테스터', 'test-only-not-stored', { token: 'legacy-only' });
await api.logout();
assert.equal(api.account, null);
assert.equal(await api.restore(), null);
for (const [key, value] of originals) assert.equal(storage.get(key), value);
assert.equal([...storage.keys()].some(key => key.startsWith('honkai-account-v1:') && key.endsWith(':session')), false);
const disabled = vm.createContext({ HonkaiBackendConfig: { baseUrl: '' }, Event });
vm.runInContext(source, disabled);
assert.equal(await disabled.HonkaiWarpApi.restore(), null);
console.log('PASS: cookie credentials, no stored account tokens, legacy retention, UUID retry/reload, selection ordering, document conflicts, refresh coalescing and expiry.');
