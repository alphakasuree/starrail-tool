(() => {
    'use strict';
    const byId = id => document.getElementById(id);
    const dialog = byId('character-chat'), input = byId('chat-input'), send = byId('chat-send');
    const log = byId('chat-log'), status = byId('chat-status'), launcher = byId('chat-open');
    const entry = byId('profile-login-screen'), lobby = byId('lobby-screen');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let history = [], busy = false, ready = false, controller = null, revision = 0, checkRevision = 0, retryTimer;
    const allowed = () => entry.hidden && !lobby.hidden && lobby.style.display !== 'none' && lobby.style.opacity !== '0';
    const endpoint = () => {
        const base = new URL(globalThis.HonkaiUidConfig?.baseUrl || '/api/hsr', location.origin);
        base.pathname = base.pathname.replace(/\/hsr\/?$/, '/chat');
        return base.href;
    };
    function syncControls() { send.disabled = busy || !ready || !allowed(); input.disabled = busy; }
    function applyAvailability(data) {
        clearTimeout(retryTimer);
        const retryAt = Number(data.retryAt) || 0;
        ready = Boolean(data.available) && retryAt <= Date.now();
        if (retryAt > Date.now()) {
            const time = new Date(retryAt).toLocaleString('ko-KR', {month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit'});
            status.textContent = `${data.reason === 'daily' ? '오늘의 무료 대화 한도를 모두 사용했어요.' : '대화를 잠시 쉬고 있어요.'} ${time} 이후 다시 확인할게요.`;
            retryTimer = setTimeout(() => { if (dialog.open && allowed()) checkConnection(); }, Math.min(retryAt - Date.now() + 1000, 2147483647));
        } else status.textContent = ready ? '' : data.message || '지금은 대화에 연결할 수 없어요. 잠시 후 다시 열어 주세요.';
        syncControls();
    }
    async function checkConnection() {
        if (!allowed()) return;
        const current = ++checkRevision;
        ready = false; syncControls();
        try {
            const response = await fetch(`${endpoint()}/status`, {cache:'no-store', signal:AbortSignal.timeout(8000)});
            const data = await response.json().catch(() => ({}));
            if (current !== checkRevision || !allowed()) return;
            if (!response.ok) throw new Error();
            applyAvailability(data);
        } catch {
            if (current !== checkRevision) return;
            status.textContent = '대화에 연결하지 못했어요. 잠시 후 대화창을 다시 열어 주세요.';
            ready = false; syncControls();
        }
    }
    function append(role, text) {
        const item = document.createElement('div'); item.className = `chat-message chat-${role}`;
        const name = document.createElement('small'); name.textContent = role === 'user' ? '나' : '키레네';
        const content = document.createElement('p'); content.textContent = text;
        item.append(name, content); log.append(item); log.scrollTop = log.scrollHeight;
        return {item, content};
    }
    function waiting() {
        const bubble = append('assistant', '');
        bubble.item.classList.add('chat-pending');
        bubble.item.setAttribute('aria-label', '키레네가 입력 중이에요');
        bubble.content.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 3; i++) { const dot = document.createElement('span'); dot.className = 'chat-dot'; bubble.content.append(dot); }
        return bubble;
    }
    async function reveal(bubble, text, signal) {
        bubble.item.classList.remove('chat-pending'); bubble.item.removeAttribute('aria-label');
        bubble.content.replaceChildren();
        const letters = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('ko', {granularity:'grapheme'}).segment(text)].map(part => part.segment) : Array.from(text);
        const duration = Math.min(20000, letters.length * 28);
        const nearBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 100;
        await new Promise(resolve => {
            let frame, started, finished = false;
            function finish() { if (finished) return; finished = true; cancelAnimationFrame(frame); signal.removeEventListener('abort', finish); resolve(); }
            function step(time) {
                if (signal.aborted) { finish(); return; }
                started ??= time;
                const count = reducedMotion.matches ? letters.length : Math.min(letters.length, Math.max(1, Math.floor((time - started) / Math.max(duration, 1) * letters.length)));
                const follow = nearBottom();
                bubble.content.textContent = letters.slice(0, count).join('');
                if (follow) log.scrollTop = log.scrollHeight;
                if (count === letters.length) { finish(); return; }
                frame = requestAnimationFrame(step);
            }
            signal.addEventListener('abort', finish, {once:true});
            if (signal.aborted) finish(); else frame = requestAnimationFrame(step);
        });
        if (!signal.aborted) bubble.content.removeAttribute('aria-hidden');
    }
    function reset() {
        revision++; controller?.abort(); controller = null;
        history = []; busy = false; ready = false; syncControls();
        log.replaceChildren(); input.value = ''; status.textContent = ''; log.setAttribute('aria-busy', 'false');
        append('assistant', '후후, 반가워, 파트너~♪ 오늘은 어떤 이야기를 들고 왔어? 잘 정리된 말이 아니어도 괜찮아. 마음에 남은 페이지부터 천천히 펼쳐볼까?');
    }
    function syncAccess() {
        launcher.hidden = !allowed();
        if (!allowed() && dialog.open) dialog.close();
        syncControls();
    }
    const accessObserver = new MutationObserver(syncAccess);
    accessObserver.observe(entry, {attributes:true, attributeFilter:['hidden']});
    accessObserver.observe(lobby, {attributes:true, attributeFilter:['hidden', 'style']});
    launcher.addEventListener('click', () => { if (!allowed()) return; dialog.showModal(); input.focus(); checkConnection(); });
    byId('chat-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {reset(); clearTimeout(retryTimer); ++checkRevision;});
    byId('chat-starters').addEventListener('click', event => {
        const button = event.target.closest('button'); if (!button || busy) return;
        input.value = button.textContent; input.focus();
    });
    byId('chat-form').addEventListener('submit', async event => {
        event.preventDefault(); const text = input.value.trim();
        if (busy || !text || !ready || !allowed()) return;
        const current = revision;
        controller = new AbortController(); const requestController = controller;
        const timeout = setTimeout(() => requestController.abort(), 50000);
        const bubble = append('user', text), pending = waiting(); input.value = ''; busy = true; syncControls();
        log.setAttribute('aria-busy', 'true'); status.textContent = '';
        let messages = [...history.slice(-6), {role:'user', content:text}];
        while (messages.reduce((sum, item) => sum + item.content.length, 0) > 6000 && messages.length > 1) messages.splice(0, 2);
        try {
            const response = await fetch(endpoint(), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages}), signal:requestController.signal});
            const data = await response.json().catch(() => ({}));
            clearTimeout(timeout);
            if (current !== revision) return;
            if (response.status === 429) { ++checkRevision; applyAvailability(data); }
            if (!response.ok) throw new Error(data.error || '아직 대화에 연결되지 않았어요. 조금 뒤 다시 찾아와 주세요.');
            if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('답장이 도착하지 않았어요. 다시 보내 주세요.');
            await reveal(pending, data.reply, requestController.signal);
            if (current !== revision) return;
            history = [...messages, {role:'assistant', content:data.reply}];
            status.textContent = data.truncated ? '답변이 길어 잠시 끊겼어요. 이어서 말해 달라고 할 수 있어요.' : '';
        } catch (error) {
            if (current !== revision) return;
            pending.item.remove(); bubble.item.remove(); input.value = text;
            status.textContent ||= error.name === 'AbortError' ? '연결이 오래 걸리고 있어요. 다시 보내 주세요.' : error.message;
        } finally {
            clearTimeout(timeout);
            if (current === revision) { busy = false; controller = null; syncControls(); log.setAttribute('aria-busy', 'false'); if (dialog.open) input.focus(); }
        }
    });
    reset(); syncAccess();
})();
