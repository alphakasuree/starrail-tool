(() => {
    'use strict';
    const prefix = 'honkai-id-v1:';
    const sections = new Set(['warp', 'relic', 'teams']);
    let activeId = null;
    function storageKey(section) {
        if (!activeId) throw new Error('아이디를 입력하고 접속하세요.');
        if (!sections.has(section)) throw new Error('저장 영역이 잘못되었습니다.');
        return `${prefix}${encodeURIComponent(activeId)}:${section}`;
    }
    globalThis.HonkaiProfileStorage = Object.freeze({
        get id() { return activeId; },
        getItem(section) { return activeId ? localStorage.getItem(storageKey(section)) : null; },
        // Keep writes synchronous so the warp screen can catch storage failures.
        // Relic/team callers may also await this method.
        setItem(section, value) { localStorage.setItem(storageKey(section), value); }
    });
    document.addEventListener('DOMContentLoaded', () => {
        const get = id => document.getElementById(id);
        get('profile-login-form').addEventListener('submit', event => {
            event.preventDefault();
            const id = get('profile-login-id').value.trim().normalize('NFC').toLowerCase();
            const error = get('profile-login-error');
            error.textContent = '';
            if (!/^[\p{L}\p{N}_.-]{1,30}$/u.test(id)) {
                error.textContent = '아이디는 1~30자의 한글·영문·숫자·밑줄·점·하이픈으로 입력하세요.';
                return;
            }
            try {
                // A read-only browser must fail before entering. Existing saves
                // and old backend sessions are never reset or removed.
                localStorage.setItem(`${prefix}${encodeURIComponent(id)}:ready`, '1');
                activeId = id;
                globalThis.dispatchEvent(new Event('honkai-profile-login'));
                get('profile-current-id').textContent = `${id} 님 · 이 브라우저에 저장`;
                get('app-content').inert = false;
                get('profile-login-screen').hidden = true;
                get('profile-change').focus();
            } catch {
                activeId = null;
                error.textContent = '저장 공간을 사용할 수 없습니다. 브라우저의 사이트 데이터 저장을 허용하세요.';
            }
        });
        get('profile-change').addEventListener('click', () => {
            if (typeof isWarping !== 'undefined' && isWarping) {
                get('profile-account-status').textContent = '추첨이 끝난 뒤 아이디를 변경하세요.';
                return;
            }
            location.reload();
        });
        get('profile-login-id').focus();
    });
})();
