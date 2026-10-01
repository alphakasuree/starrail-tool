(() => {
    'use strict';
    const base = (globalThis.HonkaiBackendConfig?.baseUrl || '').replace(/\/+$/, '');
    let token = null, progress = null, profileName = null, storagePrefix = '';
    let selectionQueue = Promise.resolve();
    class ApiError extends Error {
        constructor(message, status = 0) { super(message); this.status = status; }
    }
    async function request(route, { method = 'GET', body, anonymous = false } = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${base}/api${route}`, {
                method, credentials: 'omit', signal: controller.signal,
                headers: {
                    ...(body ? { 'Content-Type': 'application/json' } : {}),
                    ...(!anonymous && token ? { Authorization: `Bearer ${token}` } : {})
                },
                ...(body ? { body: JSON.stringify(body) } : {})
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new ApiError(error.detail || (response.status === 401 ? '서버 인증이 만료되었거나 잘못되었습니다.' : '서버 요청에 실패했습니다.'), response.status);
            }
            return response.status === 204 ? null : response.json();
        } finally { clearTimeout(timeout); }
    }
    function pendingKey() { return `${storagePrefix}:pending`; }
    async function connect(name) {
        if (!base) return;
        const url = new URL(base);
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
            throw new Error('백엔드는 HTTPS 주소를 사용해야 합니다.');
        }
        profileName = name;
        storagePrefix = `honkai-server-v1:${encodeURIComponent(base)}:${encodeURIComponent(name)}`;
        const saved = JSON.parse(localStorage.getItem(`${storagePrefix}:session`) || 'null');
        token = saved?.token || null;
        if (!token) {
            const session = await request('/profiles', { method: 'POST', body: { displayName: name }, anonymous: true });
            localStorage.setItem(`${storagePrefix}:session`, JSON.stringify(session));
            token = session.token;
        }
        // Resolve uncertain requests before loading canonical state after a refresh.
        const pending = JSON.parse(localStorage.getItem(pendingKey()) || 'null');
        if (pending) {
            try { await request('/warp/pull', { method: 'POST', body: pending }); }
            catch (error) { if (![400, 409].includes(error.status)) throw error; }
            localStorage.removeItem(pendingKey());
        }
        progress = await request('/warp/progress');
    }
    async function refresh() {
        progress = await request('/warp/progress');
        return progress;
    }
    async function pull(bannerKey, count, group) {
        await selectionQueue.catch(() => {});
        let pending = JSON.parse(localStorage.getItem(pendingKey()) || 'null');
        if (pending && (pending.bannerKey !== bannerKey || pending.count !== count)) {
            throw new ApiError('미확인 요청이 있습니다. 처음 요청한 픽업과 뽑기 횟수로 다시 시도하거나 새로고침해 주세요.');
        }
        if (!pending) {
            pending = { requestId: crypto.randomUUID(), bannerKey, count, expectedRevision: progress.bannerStates[group].revision };
            // Save before sending: retries and reloads must use the same UUID.
            localStorage.setItem(pendingKey(), JSON.stringify(pending));
        }
        try {
            const result = await request('/warp/pull', { method: 'POST', body: pending });
            localStorage.removeItem(pendingKey());
            progress.bannerStates[result.pityGroup] = result.state;
            progress.history[result.pityGroup].push(...result.results);
            for (const item of result.results) progress.inventory[item.type === 'character' ? `character:${item.id}` : item.name] = 1;
            return result;
        } catch (error) {
            if ([400, 409].includes(error.status)) {
                localStorage.removeItem(pendingKey());
                await refresh();
            }
            throw error;
        }
    }
    function saveSelection(selectedPickups) {
        const selection = { ...selectedPickups };
        selectionQueue = selectionQueue.catch(() => {}).then(async () => {
            await request('/warp/selection', { method: 'PUT', body: selection });
            progress.selectedPickups = selection;
        });
        return selectionQueue;
    }
    globalThis.HonkaiWarpApi = Object.freeze({
        get enabled() { return !!base; },
        get progress() { return progress; },
        get profileName() { return profileName; },
        connect, refresh, pull, saveSelection
    });
})();
