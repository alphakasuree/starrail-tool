(() => {
    'use strict';
    const prefix = 'honkai-id-v1:';
    const resetKey = 'honkai-id-reset-v2';
    let activeId = null;
    function initializeStorage() {
        if (localStorage.getItem(resetKey) !== 'done') {
            // Delete all existing profiles once, including IDs stored in key names.
            // New saves made after this reset remain available on later visits.
            const oldKeys = ['honkai-warp-progress-v1', 'honkai-relic-setups-v1', 'honkai-id-reset-v1'];
            for (let i=0;i<localStorage.length;i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(prefix)) oldKeys.push(key);
            }
            oldKeys.forEach(key=>localStorage.removeItem(key));
            localStorage.setItem(resetKey,'done');
        }
    }
    try { initializeStorage(); } catch { /* Show the error when attempting entry. */ }
    globalThis.HonkaiProfileStorage = Object.freeze({
        get id() { return activeId; },
        getItem(section) { return activeId ? localStorage.getItem(`${prefix}${encodeURIComponent(activeId)}:${section}`) : null; },
        setItem(section,value) {
            if (!activeId) throw new Error('아이디를 입력하고 접속하세요.');
            localStorage.setItem(`${prefix}${encodeURIComponent(activeId)}:${section}`,value);
        }
    });
    document.addEventListener('DOMContentLoaded',()=>{
        const get = id=>document.getElementById(id);
        get('profile-login-form').addEventListener('submit',event=>{
            event.preventDefault();
            const id = get('profile-login-id').value.trim().normalize('NFC').toLowerCase();
            const error = get('profile-login-error');
            error.textContent='';
            if (!/^[\p{L}\p{N}_.-]{1,30}$/u.test(id)) {
                error.textContent='아이디는 1~30자의 한글·영문·숫자·밑줄·점·하이픈으로 입력하세요.';
                return;
            }
            try {
                initializeStorage();
                // Check writes too so a read-only browser cannot appear to save successfully.
                localStorage.setItem(resetKey,'done');
                activeId=id;
                globalThis.dispatchEvent(new Event('honkai-profile-login'));
                get('profile-current-id').textContent=`${id} 님`;
                get('app-content').inert=false;
                get('profile-login-screen').hidden=true;
                get('profile-change').focus();
            } catch {
                activeId=null;
                error.textContent='저장 공간을 사용할 수 없습니다. 브라우저의 사이트 데이터 저장을 허용한 뒤 다시 접속하세요.';
            }
        });
        get('profile-change').addEventListener('click',()=>location.reload());
        get('profile-login-id').focus();
    });
})();
