import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = await fs.readFile(new URL('../assets/js/warp-api.js', import.meta.url), 'utf8');
const storage = new Map(), calls = [], requests = [];
const groups = ['character', 'lightcone', 'characterCollaboration', 'lightconeCollaboration'];
const initial = () => ({
    version: 1,
    bannerStates: Object.fromEntries(groups.map(group => [group, { pity4: 0, pity5: 0, guaranteed4: false, guaranteed5: false, revision: 0 }])),
    selectedPickups: { character: '1503', lightcone: '23055' },
    history: Object.fromEntries(groups.map(group => [group, []])), inventory: {}
});
let failNext = false, conflictNext = false;
const answer = (body, status = 200) => ({ ok: status < 400, status, json: async () => structuredClone(body) });
const context = vm.createContext({
    HonkaiBackendConfig: { baseUrl: 'https://backend.example' },
    URL, AbortController, setTimeout, clearTimeout, crypto: webcrypto,
    localStorage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: key => storage.delete(key)
    },
    fetch: async (url, options) => {
        calls.push({ url, options });
        if (url.endsWith('/profiles')) return answer({ token: 'test-token', profileId: 'test-profile' }, 201);
        assert.equal(options.headers.Authorization, 'Bearer test-token');
        if (url.endsWith('/progress')) return answer(initial());
        if (url.endsWith('/selection')) return answer(null, 204);
        if (url.endsWith('/pull')) {
            const body = JSON.parse(options.body); requests.push(body);
            if (failNext) { failNext = false; throw new TypeError('Connection lost after sending'); }
            if (conflictNext) { conflictNext = false; return answer({ detail: 'Stale revision' }, 409); }
            return answer({ requestId: body.requestId, pityGroup: 'character',
                state: { pity4: 0, pity5: 0, guaranteed4: false, guaranteed5: false, revision: 1 },
                results: [{ historyId: 1, id: '1503', name: '펄', rarity: 5, type: 'character', time: '2026-10-02T00:00:00Z' }] });
        }
        throw Error(`Unexpected request: ${url}`);
    }
});
vm.runInContext(source, context);
const api = context.HonkaiWarpApi;
await api.connect('friend');
assert.equal(api.enabled, true);
assert.equal(api.progress.history.character.length, 0);
failNext = true;
await assert.rejects(api.pull('character:1503', 10, 'character'));
assert.equal([...storage.keys()].filter(key => key.endsWith(':pending')).length, 1);
await assert.rejects(api.pull('character:1102', 10, 'character'));
assert.equal(requests.length, 1); // cannot replace an uncertain request with another banner
const result = await api.pull('character:1503', 10, 'character');
assert.equal(requests[0].requestId, requests[1].requestId);
assert.equal(api.progress.history.character.length, 1);
assert.equal(api.progress.inventory['character:1503'], 1);
assert.equal(result.state.revision, 1);
assert.equal([...storage.keys()].filter(key => key.endsWith(':pending')).length, 0);
await Promise.all([
    api.saveSelection({ character: '1102', lightcone: '23055' }),
    api.saveSelection({ character: '1503', lightcone: '23055' })
]);
assert.equal(api.progress.selectedPickups.character, '1503');
const selections = calls.filter(call => call.url.endsWith('/selection'));
assert.equal(JSON.parse(selections[0].options.body).character, '1102');
assert.equal(JSON.parse(selections[1].options.body).character, '1503');
conflictNext = true;
await assert.rejects(api.pull('character:1503', 1, 'character'), error => error.status === 409);
assert.equal(api.progress.bannerStates.character.revision, 0);
assert.equal([...storage.keys()].filter(key => key.endsWith(':pending')).length, 0);
failNext = true;
await assert.rejects(api.pull('character:1503', 1, 'character'));
const pendingId = requests.at(-1).requestId;
vm.runInContext(source, context); // simulate reloading the page with the same browser storage
await context.HonkaiWarpApi.connect('friend');
assert.equal(requests.at(-1).requestId, pendingId);
assert.equal(calls.filter(call => call.url.endsWith('/profiles')).length, 1);
assert.equal([...storage.keys()].filter(key => key.endsWith(':pending')).length, 0);

const disabled = vm.createContext({ HonkaiBackendConfig: { baseUrl: '' } });
vm.runInContext(source, disabled);
assert.equal(disabled.HonkaiWarpApi.enabled, false);
await disabled.HonkaiWarpApi.connect('friend');
console.log('PASS: opt-in API, token reuse, same-UUID retry, reload recovery, selection ordering and conflict refresh.');
