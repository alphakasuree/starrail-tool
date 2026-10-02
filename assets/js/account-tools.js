(() => {
    'use strict';
    const get = id => document.getElementById(id), storage = globalThis.HonkaiProfileStorage;
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    let data = {version:1, characters:{}, createdAt:Date.now(), lastExportAt:null}, failed = false;
    function validate(value) {
        if (!value || value.version !== 1 || !value.characters || Array.isArray(value.characters) || typeof value.characters !== 'object') throw new Error('계정 저장 형식을 확인하세요.');
        for (const [id, c] of Object.entries(value.characters)) {
            if (!characterCatalog.some(ch => ch.id === id) || !c || typeof c.owned !== 'boolean' || !Number.isInteger(c.e) || c.e < 0 || c.e > 6 || !Number.isInteger(c.s) || c.s < 0 || c.s > 5) throw new Error('캐릭터 보유 데이터가 올바르지 않습니다.');
        }
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
        data = {version:1,characters:{},createdAt:Date.now(),lastExportAt:null};
        try {
            const raw = storage.getItem('account');
            data = validate(JSON.parse(raw || JSON.stringify(data)));
            if (!raw) storage.setItem('account',JSON.stringify(data));
        }
        catch (error) { failed = true; get('account-status').textContent = error.message; }
        render(); refresh();
    }
    function refresh() {
        if (!storage.id) return;
        get('profile-current-id').textContent = `프로필 ${storage.id} · 이 브라우저에 저장`;
        get('account-name').value = storage.id;
        const bytes = new Blob([JSON.stringify(storage.snapshot())]).size;
        get('account-size').textContent = `현재 데이터 ${(bytes / 1024).toFixed(1)} KB / 내용 한도 512 KB · 복구 사본 별도`;
        const since = data.lastExportAt || data.createdAt;
        const days = Number.isFinite(since) ? Math.floor((Date.now() - since) / 86400000) : 0;
        get('backup-reminder').hidden = days < 30;
        get('backup-age').textContent = data.lastExportAt ? `최근 백업 ${days}일 전` : `프로필 생성 후 ${days}일 · 아직 백업하지 않았습니다`;
        get('account-backup-date').textContent = data.lastExportAt ? `최근 내보내기: ${new Date(data.lastExportAt).toLocaleString('ko-KR')}` : '최근 내보내기: 없음';
    }
    function render() {
        const query = get('account-search').value.trim().toLocaleLowerCase();
        const chars = characterCatalog.filter(c => `${c.name} ${c.pathName} ${c.elementName}`.toLocaleLowerCase().includes(query) && (!get('account-owned-filter').checked || data.characters[c.id]?.owned));
        get('account-count').textContent = `${Object.values(data.characters).filter(c => c.owned).length}명 보유 · 검색 ${chars.length}명`;
        get('account-characters').innerHTML = chars.map(c => {
            const value = data.characters[c.id] || {owned:false,e:0,s:0};
            return `<article class="account-character"><img src="${escape(c.image)}" alt="" loading="lazy"><div><label><input type="checkbox" data-id="${c.id}" data-field="owned" ${value.owned ? 'checked' : ''} ${failed ? 'disabled' : ''}> ${escape(c.name)}</label><small>${escape(c.pathName)} · ${escape(c.elementName)}</small><div class="account-investment"><label>성혼 <select data-id="${c.id}" data-field="e" aria-label="${escape(c.name)} 성혼" ${!value.owned || failed ? 'disabled' : ''}>${Array.from({length:7},(_,e)=>`<option value="${e}" ${e===value.e ? 'selected' : ''}>E${e}</option>`).join('')}</select></label><label>전용 광추 <select data-id="${c.id}" data-field="s" aria-label="${escape(c.name)} 전용 광추" ${failed ? 'disabled' : ''}>${Array.from({length:6},(_,s)=>`<option value="${s}" ${s===value.s ? 'selected' : ''}>${s ? `S${s}` : '미보유'}</option>`).join('')}</select></label></div></div></article>`;
        }).join('') || '<p>검색 결과가 없습니다.</p>';
    }
    globalThis.HonkaiAccount = Object.freeze({
        get: id => failed ? {owned:false,e:0,s:0} : data.characters[id] || {owned:false,e:0,s:0},
        owned: () => new Set(failed ? [] : Object.keys(data.characters).filter(id => data.characters[id].owned)),
        markExport() { save({...data,lastExportAt:Date.now()}); }, validate
    });
    ['honkai-profile-login','honkai-documents-changed'].forEach(event => globalThis.addEventListener(event, load));
    globalThis.addEventListener('honkai-profile-renamed', refresh);
    get('account-open').addEventListener('click', () => {
        if (typeof isWarping !== 'undefined' && isWarping) return;
        load(); get('account-dialog').showModal();
    });
    get('account-close').addEventListener('click', () => get('account-dialog').close());
    get('account-search').addEventListener('input', render);
    get('account-owned-filter').addEventListener('change', render);
    get('account-characters').addEventListener('change', event => {
        const {id,field} = event.target.dataset;
        if (!id || !['owned','e','s'].includes(field)) return;
        const old = data.characters[id] || {owned:false,e:0,s:0};
        const value = field === 'owned' ? event.target.checked : Number(event.target.value);
        try {save({...data, characters:{...data.characters,[id]:{...old,[field]:value}}}); render(); get('account-status').textContent = '보유 정보 저장 완료 · 파티 추천에 적용됩니다.';}
        catch (error) {get('account-status').textContent = error.message; render();}
    });
    get('account-rename').addEventListener('click', () => {
        try {storage.renameProfile(get('account-name').value); get('account-status').textContent='프로필 이름을 변경했습니다.';}
        catch (error) {get('account-status').textContent=error.message;}
    });
    ['account-backup','backup-now'].forEach(id => get(id).addEventListener('click', () => {get('account-dialog').close(); get('profile-save-open').click();}));
    render();
})();
