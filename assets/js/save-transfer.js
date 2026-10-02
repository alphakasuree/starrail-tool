(() => {
    'use strict';
    const get = id => document.getElementById(id), storage = globalThis.HonkaiProfileStorage, format = globalThis.HonkaiSaveFormat;
    let pending = null, generation = 0, previousFocus = null;
    const busy = () => typeof isWarping !== 'undefined' && isWarping;
    const count = value => value.toLocaleString('ko-KR');
    const table = summary => `<div class="save-counts"><div><strong>${count(summary.history)}</strong><span>워프 기록</span></div><div><strong>${count(summary.inventory)}</strong><span>보유 항목</span></div><div><strong>${count(summary.relic)}</strong><span>유물 세팅</span></div><div><strong>${count(summary.teams)}</strong><span>파티</span></div></div>`;
    function clearPreview() {
        generation++; pending = null; get('save-preview').hidden = true;
        get('save-replace-check').checked = false; get('save-import').disabled = true;
    }
    function allowed() {
        if (!storage.id) throw new Error('아이디로 접속한 뒤 세이브를 관리하세요.');
        if (busy()) throw new Error('추첨이 끝난 뒤 세이브를 관리하세요.');
        if (globalThis.HonkaiWarpApi?.enabled) throw new Error('이 기능은 백엔드 없이 사용하는 로컬 세이브용입니다.');
    }
    function refresh() {
        const save = format.create(storage.id, storage.snapshot());
        get('save-owner').textContent = `현재 저장 대상: ${storage.id} · 이 브라우저`;
        get('save-current-summary').innerHTML = table(format.summary(save));
        const previous = storage.getPrevious();
        get('save-undo-panel').hidden = !previous;
        if (previous) get('save-undo-info').textContent = `${new Date(previous.savedAt).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})} 가져오기 직전의 세이브가 보관되어 있습니다.`;
    }
    function notify() {
        globalThis.dispatchEvent(new Event('honkai-save-imported'));
        globalThis.dispatchEvent(new Event('honkai-documents-changed'));
    }
    function report(error) { get('save-error').textContent = error.message || '세이브 작업을 완료하지 못했습니다.'; }
    get('profile-save-open').addEventListener('click', () => {
        get('save-error').textContent = ''; get('save-status').textContent = '';
        try {
            allowed(); previousFocus = document.activeElement; clearPreview();
            get('save-file').value = ''; get('save-dialog').showModal(); refresh();
        } catch (error) {
            if (get('save-dialog').open) report(error);
            else get('profile-account-status').textContent = error.message;
        }
    });
    get('save-close').addEventListener('click', () => get('save-dialog').close());
    get('save-dialog').addEventListener('close', () => {clearPreview(); previousFocus?.focus();});
    get('save-export').addEventListener('click', () => {
        get('save-error').textContent = ''; get('save-status').textContent = '';
        let url;
        try {
            allowed();
            const save = format.create(storage.id, storage.snapshot());
            const blob = new Blob([JSON.stringify(save, null, 2) + '\n'], {type: 'application/json;charset=utf-8'});
            if (blob.size > format.MAX_BYTES) throw new Error('내보낼 세이브가 20MB를 넘습니다.');
            url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = save.exportedAt.replace(/[:.]/g, '-');
            link.href = url; link.download = `honkai-save-${storage.id}-${timestamp}.json`;
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            get('save-status').textContent = '세이브 다운로드를 시작했습니다. 이 파일을 다른 기기로 옮겨 가져오세요.';
        } catch (error) { if (url) URL.revokeObjectURL(url); report(error); }
    });
    get('save-file').addEventListener('change', async () => {
        clearPreview(); get('save-error').textContent = ''; get('save-status').textContent = '';
        const file = get('save-file').files[0], token = generation;
        if (!file) return;
        try {
            allowed();
            if (file.size > format.MAX_BYTES) throw new Error('파일이 너무 큽니다. 최대 20MB 파일을 선택해주세요.');
            const targetId = storage.id, baseline = storage.snapshot();
            get('save-status').textContent = '파일을 검사하고 있습니다…';
            const save = format.parse(await file.text());
            if (token !== generation || targetId !== storage.id || !get('save-dialog').open) return;
            pending = {save, targetId, baseline};
            get('save-file-info').textContent = `${file.name} · 원래 아이디: ${save.profileId} · ${new Date(save.exportedAt).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'})} 내보냄`;
            get('save-incoming-summary').innerHTML = table(format.summary(save));
            get('save-replace-label').textContent = `현재 아이디 ‘${targetId}’의 기록과 세팅을 위 파일 내용으로 교체합니다.`;
            get('save-preview').hidden = false; get('save-status').textContent = '파일 검증 완료. 내용을 확인하고 교체에 체크한 뒤 가져오세요.';
        } catch (error) { if (token === generation) {get('save-status').textContent = ''; report(error);} }
    });
    get('save-replace-check').addEventListener('change', () => {get('save-import').disabled = !pending || !get('save-replace-check').checked;});
    get('save-import').addEventListener('click', () => {
        get('save-error').textContent = ''; get('save-status').textContent = '';
        try {
            allowed();
            if (!pending || !get('save-replace-check').checked || storage.id !== pending.targetId) throw new Error('파일과 가져올 아이디를 다시 확인해주세요.');
            storage.importSections(format.toRaw(pending.save), pending.baseline);
            clearPreview(); get('save-file').value = ''; notify(); refresh();
            get('save-status').textContent = `‘${storage.id}’ 아이디로 세이브를 가져왔습니다. 기록·천장·보유 목록·유물 세팅·파티에 적용했습니다.`;
        } catch (error) { report(error); }
    });
    get('save-undo').addEventListener('click', () => {
        get('save-error').textContent = ''; get('save-status').textContent = '';
        try {
            allowed(); storage.restorePrevious(); clearPreview(); get('save-file').value = ''; notify(); refresh();
            get('save-status').textContent = '가져오기 전 세이브로 되돌렸습니다.';
        } catch (error) { report(error); }
    });
    globalThis.addEventListener('honkai-profile-login', () => {clearPreview(); if (get('save-dialog').open) get('save-dialog').close();});
})();
