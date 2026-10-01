(() => {
    'use strict';
    const base = (globalThis.HonkaiBackendConfig?.baseUrl || '').replace(/\/+$/, '');
    let progress = null, account = null, documents = null, storagePrefix = '', refreshTimer;
    let selectionQueue = Promise.resolve(), generation = 0, refreshing = null;
    class ApiError extends Error {
        constructor(message, status = 0) { super(message); this.status = status; }
    }
    function validateBase() {
        if (!base) throw new ApiError('계정 서버 주소가 설정되지 않았습니다. 로컬 웹 주소로 접속하세요.');
        const url = new URL(base);
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new ApiError('계정 서버는 HTTPS 주소를 사용해야 합니다.');
    }
    function reset() {
        generation++; clearTimeout(refreshTimer); account = null; progress = null; documents = null; storagePrefix = ''; selectionQueue = Promise.resolve();
    }
    function expired() { reset(); globalThis.dispatchEvent(new Event('honkai-session-expired')); }
    async function request(route, { method = 'GET', body, legacyToken, notify = true } = {}) {
        validateBase();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${base}/api${route}`, {
                method, credentials: 'include', signal: controller.signal,
                headers: {
                    ...(body ? { 'Content-Type': 'application/json' } : {}),
                    ...(method !== 'GET' ? { 'X-Honkai-Client': 'web' } : {}),
                    ...(account && !route.startsWith('/auth/login') && !route.startsWith('/auth/register') && !route.startsWith('/auth/upgrade') ? { 'X-Honkai-Account': account.profileId } : {}),
                    ...(legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {})
                },
                ...(body ? { body: JSON.stringify(body) } : {})
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                if (response.status === 401 && account && notify) expired();
                throw new ApiError(error.detail || (response.status === 401 ? '로그인이 필요하거나 세션이 만료되었습니다.' : '서버 요청에 실패했습니다.'), response.status);
            }
            return response.status === 204 ? null : response.json();
        } finally { clearTimeout(timeout); }
    }
    function scheduleRefresh() {
        clearTimeout(refreshTimer);
        const delay = Math.max(1000, Math.min(2147483647, Date.parse(account.expiresAt) - Date.now() - 300000));
        refreshTimer = setTimeout(() => refreshSession().catch(() => {
            if (account) refreshTimer = setTimeout(() => refreshSession().catch(() => {}), 30000);
        }), delay);
    }
    function pendingKey() { return `${storagePrefix}:pending`; }
    async function attach(view) {
        reset(); account = view;
        storagePrefix = `honkai-account-v1:${encodeURIComponent(base)}:${view.profileId}`;
        const current = generation;
        const pending = JSON.parse(localStorage.getItem(pendingKey()) || 'null');
        if (pending) {
            try { await request('/warp/pull', { method: 'POST', body: pending }); }
            catch (error) { if (![400, 409].includes(error.status)) throw error; }
            localStorage.removeItem(pendingKey());
        }
        const [loadedProgress, loadedDocuments] = await Promise.all([request('/warp/progress'), request('/account/documents')]);
        if (current !== generation) throw new ApiError('로그인 상태가 변경되었습니다.');
        progress = loadedProgress; documents = loadedDocuments; scheduleRefresh(); return account;
    }
    async function restore() {
        if (!base) return null;
        try { return await attach(await request('/auth/me', { notify: false })); }
        catch (error) { if (error.status === 401) { reset(); return null; } throw error; }
    }
    async function login(loginId, password) { return attach(await request('/auth/login', { method: 'POST', body: { loginId, password }, notify: false })); }
    async function register(loginId, displayName, password, legacy) {
        if (legacy) {
            // An old/expired account cookie must not override the anonymous
            // bearer while resolving its uncertain draw.
            await request('/auth/logout', { method: 'POST', notify: false }); reset();
            if (legacy.pending) {
                try { await request('/warp/pull', { method: 'POST', body: legacy.pending, legacyToken: legacy.token, notify: false }); }
                catch (error) { if (![400, 409].includes(error.status)) throw error; }
            }
        }
        const view = await request(legacy ? '/auth/upgrade' : '/auth/register', { method: 'POST', body: { loginId, displayName, password }, legacyToken: legacy?.token, notify: false });
        if (legacy?.pendingKey) localStorage.removeItem(legacy.pendingKey);
        return attach(view);
    }
    async function logout() { await request('/auth/logout', { method: 'POST', notify: false }); reset(); }
    async function refreshSession() {
        if (refreshing) return refreshing;
        const current = generation;
        refreshing = request('/auth/refresh', { method: 'POST' }).then(view => {
            if (current === generation) { account = view; scheduleRefresh(); }
            return view;
        }).finally(() => { refreshing = null; });
        return refreshing;
    }
    async function refresh() {
        const current = generation, loaded = await request('/warp/progress');
        if (current !== generation) throw new ApiError('로그인 상태가 변경되었습니다.');
        progress = loaded; return progress;
    }
    async function pull(bannerKey, count, group) {
        await selectionQueue.catch(() => {});
        if (!account) throw new ApiError('로그인이 필요합니다.', 401);
        const current = generation, key = pendingKey();
        let pending = JSON.parse(localStorage.getItem(key) || 'null');
        if (pending && (pending.bannerKey !== bannerKey || pending.count !== count)) throw new ApiError('미확인 요청이 있습니다. 같은 픽업과 횟수로 다시 시도하거나 새로고침하세요.');
        if (!pending) {
            pending = { requestId: crypto.randomUUID(), bannerKey, count, expectedRevision: progress.bannerStates[group].revision };
            localStorage.setItem(key, JSON.stringify(pending));
        }
        try {
            const result = await request('/warp/pull', { method: 'POST', body: pending });
            if (current !== generation) throw new ApiError('로그인 상태가 변경되었습니다.');
            localStorage.removeItem(key);
            progress.bannerStates[result.pityGroup] = result.state;
            progress.history[result.pityGroup].push(...result.results);
            for (const item of result.results) progress.inventory[item.type === 'character' ? `character:${item.id}` : item.name] = 1;
            return result;
        } catch (error) {
            if ([400, 409].includes(error.status) && current === generation) { localStorage.removeItem(key); await refresh(); }
            throw error;
        }
    }
    function saveSelection(selectedPickups) {
        const selection = { ...selectedPickups }, current = generation;
        selectionQueue = selectionQueue.catch(() => {}).then(async () => {
            if (current !== generation) return;
            await request('/warp/selection', { method: 'PUT', body: selection });
            if (current === generation) progress.selectedPickups = selection;
        });
        return selectionQueue;
    }
    async function reloadDocuments() {
        const current = generation, loaded = await request('/account/documents');
        if (current !== generation) throw new ApiError('로그인 상태가 변경되었습니다.');
        documents = loaded; return documents;
    }
    async function saveDocument(section, entries) {
        const current = generation;
        try {
            const loaded = await request(`/account/documents/${section}`, { method: 'PUT', body: { entries, expectedRevision: documents[section].revision } });
            if (current !== generation) throw new ApiError('로그인 상태가 변경되었습니다.');
            documents[section] = loaded; return loaded;
        } catch (error) {
            if (error.status === 409 && current === generation) { await reloadDocuments(); globalThis.dispatchEvent(new Event('honkai-documents-changed')); }
            throw error;
        }
    }
    async function importData(relic, teams) {
        const current = generation;
        const result = await request('/account/import', { method: 'POST', body: { relic, teams } });
        if (current !== generation) throw new ApiError('로그인 상태가 변경되었습니다.');
        documents = result.documents; globalThis.dispatchEvent(new Event('honkai-documents-changed')); return result;
    }
    globalThis.HonkaiWarpApi = Object.freeze({
        get enabled() { return !!base; }, get progress() { return progress; }, get account() { return account; },
        get documents() { return documents; }, get baseUrl() { return base; },
        restore, login, register, logout, refreshSession, refresh, pull, saveSelection, saveDocument, reloadDocuments, importData
    });
})();
