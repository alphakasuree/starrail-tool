(() => {
    'use strict';
    const get = id => document.getElementById(id), storage = globalThis.HonkaiProfileStorage;
    let data = {version:1, characters:{}, createdAt:Date.now(), lastExportAt:null}, failed = false;
    function validate(value) {
        if (!value || value.version !== 1 || !value.characters || Array.isArray(value.characters) || typeof value.characters !== 'object') throw new Error('계정 저장 형식을 확인하세요.');
        for (const [id, c] of Object.entries(value.characters)) {
            if (!characterCatalog.some(ch => ch.id === id) || !c || typeof c.owned !== 'boolean' || !Number.isInteger(c.e) || c.e < 0 || c.e > 6 || !Number.isInteger(c.s) || c.s < 0 || c.s > 5) throw new Error('캐릭터 보유 데이터가 올바르지 않습니다.');
        }
        if (value.uidProfile && globalThis.HonkaiUid) HonkaiUid.validateSnapshot(value.uidProfile);
        return value;
    }
    function save(next) {
        if (failed) throw new Error('저장 데이터를 읽지 못했습니다. 백업을 확인한 뒤 복구하세요.');
        storage.setItem('account', JSON.stringify(next)); data = next;
        globalThis.dispatchEvent(new Event('honkai-account-changed'));
        refresh();
    }
    function load() {
        failed = false;
        get('collection-status').textContent = '';
        data = {version:1,characters:{},createdAt:Date.now(),lastExportAt:null};
        try {
            const raw = storage.getItem('account');
            data = validate(JSON.parse(raw || JSON.stringify(data)));
            if (!raw) storage.setItem('account',JSON.stringify(data));
        }
        catch (error) { failed = true; get('account-status').textContent = error.message; get('collection-status').textContent = error.message; }
        render(); refresh();
    }
    function refresh() {
        if (!storage.id) return;
        const profile = data.uidProfile?.uid === storage.id ? data.uidProfile : null;
        get('profile-current-id').textContent = profile ? `${profile.nickname} · UID ${storage.id} · 개척 Lv.${profile.level}` : `프로필 ${storage.id} · 이 브라우저에 저장`;
        get('account-name').value = storage.id;
        get('account-name').disabled = storage.linkedUid;
        get('account-rename').disabled = storage.linkedUid;
        const bytes = new Blob([JSON.stringify(storage.snapshot())]).size;
        get('account-size').textContent = `현재 데이터 ${(bytes / 1024).toFixed(1)} KB / 내용 한도 512 KB · 복구 사본 별도`;
        const since = data.lastExportAt || data.createdAt;
        const days = Number.isFinite(since) ? Math.floor((Date.now() - since) / 86400000) : 0;
        get('backup-reminder').hidden = days < 30;
        get('backup-age').textContent = data.lastExportAt ? `최근 백업 ${days}일 전` : `프로필 생성 후 ${days}일 · 아직 백업하지 않았습니다`;
        get('account-backup-date').textContent = data.lastExportAt ? `최근 내보내기: ${new Date(data.lastExportAt).toLocaleString('ko-KR')}` : '최근 내보내기: 없음';
    }
    function render() {
        if (typeof renderCollection === 'function') renderCollection();
    }
    globalThis.HonkaiAccount = Object.freeze({
        get: id => failed ? {owned:false,e:0,s:0} : data.characters[id] || {owned:false,e:0,s:0},
        owned: () => new Set(failed ? [] : Object.keys(data.characters).filter(id => data.characters[id].owned)),
        editable: () => !failed && Boolean(storage.id),
        importUid(profile) {
            HonkaiUid.validateSnapshot(profile);
            if (profile.uid !== storage.id) throw new Error('조회한 UID와 현재 프로필이 다릅니다.');
            // Read and validate before writing; preserve manual ownership and all other saves.
            const raw = storage.getItem('account');
            const previous = validate(raw ? JSON.parse(raw) : {version:1,characters:{},createdAt:Date.now(),lastExportAt:null});
            const characters = {...previous.characters};
            for (const c of profile.characters) {
                if (!characterCatalog.some(ch => ch.id === c.id)) continue;
                // The planner's S means signature-cone ownership, not any equipped cone.
                characters[c.id] = {...characters[c.id], owned:true, e:c.rank, s:characters[c.id]?.s || 0};
            }
            const next = validate({...previous,characters,uidProfile:profile});
            storage.setItem('account',JSON.stringify(next)); data = next; failed = false;
            globalThis.dispatchEvent(new Event('honkai-account-changed')); render(); refresh();
        },
        markExport() { save({...data,lastExportAt:Date.now()}); }, validate
    });
    ['honkai-profile-login','honkai-documents-changed'].forEach(event => globalThis.addEventListener(event, load));
    globalThis.addEventListener('honkai-profile-renamed', refresh);
    get('account-open').addEventListener('click', () => {
        if (typeof isWarping !== 'undefined' && isWarping) return;
        load(); get('account-dialog').showModal();
    });
    get('account-close').addEventListener('click', () => get('account-dialog').close());
    get('collection-owned-filter')?.addEventListener('change', render);
    get('collection-render-area').addEventListener('change', event => {
        const {id,field} = event.target.dataset;
        if (!characterCatalog.some(c => c.id === id) || !['owned','e','s'].includes(field)) return;
        const old = data.characters[id] || {owned:false,e:0,s:0};
        const value = field === 'owned' ? event.target.checked : Number(event.target.value);
        try {
            if (!storage.id) throw new Error('프로필에 먼저 로그인하세요.');
            const next = {...data, characters:{...data.characters,[id]:{...old,[field]:value}}};
            validate(next); save(next); render();
            get('collection-status').textContent = '보유 정보 저장 완료 · 파티 추천에 적용됩니다.';
        }
        catch (error) {get('collection-status').textContent = error.message; render();}
    });
    get('account-rename').addEventListener('click', () => {
        try {storage.renameProfile(get('account-name').value); get('account-status').textContent='프로필 이름을 변경했습니다.';}
        catch (error) {get('account-status').textContent=error.message;}
    });
    ['account-backup','backup-now'].forEach(id => get(id).addEventListener('click', () => {get('account-dialog').close(); get('profile-save-open').click();}));
    render();
})();
