(() => {
    'use strict';
    const prefix = 'honkai-id-v1:';
    const sections = new Set(['warp', 'relic', 'teams', 'account']);
    let activeId = null;
    let linkedUid = false;
    function storageKey(section) {
        if (!activeId) throw new Error('아이디를 입력하고 접속하세요.');
        if (!sections.has(section)) throw new Error('저장 영역이 잘못되었습니다.');
        return `${prefix}${encodeURIComponent(activeId)}:${section}`;
    }
    function bundleKey() {
        if (!activeId) throw new Error('아이디를 입력하고 접속하세요.');
        return `${prefix}${encodeURIComponent(activeId)}:save-bundle`;
    }
    function readBundle() {
        const raw = localStorage.getItem(bundleKey());
        if (raw === null) return null;
        const bundle = JSON.parse(raw);
        if (bundle?.version !== 1 || !bundle.sections) throw new Error('세이브 저장 데이터를 읽을 수 없습니다.');
        if (!Object.hasOwn(bundle.sections, 'account')) bundle.sections.account = null;
        checkSections(bundle.sections);
        return bundle;
    }
    function checkSections(values) {
        if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).length !== sections.size) throw new Error('세이브 저장 영역이 올바르지 않습니다.');
        for (const section of sections) if (!Object.hasOwn(values, section) || (values[section] !== null && typeof values[section] !== 'string')) throw new Error('세이브 저장 영역이 올바르지 않습니다.');
    }
    const MAX_SECTION_CHARS = 512 * 1024, MAX_BUNDLE_CHARS = 1536 * 1024;
    function checkSize(values) {
        if (Object.values(values).reduce((n, value) => n + (value?.length || 0), 0) > MAX_SECTION_CHARS) throw new Error("프로필 저장 한도에 도달했습니다. 세이브를 내보내 보관한 뒤 기록을 정리하세요.");
    }
    function writeBundle(bundle) {
        const raw = JSON.stringify(bundle);
        if (raw.length > MAX_BUNDLE_CHARS) throw new Error("복구 사본을 포함한 저장 용량이 너무 큽니다. 세이브를 내보내 보관하고 복구 사본을 정리하세요.");
        try {localStorage.setItem(bundleKey(), raw);} catch {throw new Error("브라우저 저장 공간이 부족하거나 저장이 차단되었습니다. 기존 저장은 유지됩니다. 백업 후 다른 프로필이나 복구 사본을 정리하세요.");}
    }
    function snapshot() {
        const bundle = readBundle();
        return bundle ? {...bundle.sections} : Object.fromEntries([...sections].map(section => [section, localStorage.getItem(storageKey(section))]));
    }
    globalThis.HonkaiProfileStorage = Object.freeze({
        get id() { return activeId; },
        get linkedUid() { return linkedUid; },
        getItem(section) {
            if (!activeId) return null;
            const key = storageKey(section);
            const bundle = readBundle();
            return bundle ? bundle.sections[section] : localStorage.getItem(key);
        },
        // Keep writes synchronous so the warp screen can catch storage failures.
        // Relic/team callers may also await this method.
        setItem(section, value) {
            const key = storageKey(section), bundle = readBundle();
            const values = snapshot(); values[section] = String(value); checkSize(values);
            if (bundle) {
                bundle.sections[section] = String(value);
                writeBundle(bundle);
            } else localStorage.setItem(key, value);
        },
        snapshot,
        importSections(values, expected) {
            values = {account: null, ...values};
            checkSections(values);
            checkSize(values);
            const before = snapshot();
            if (expected && JSON.stringify(before) !== JSON.stringify(expected)) throw new Error('미리보기 이후 저장 내용이 변경되었습니다. 파일을 다시 선택해주세요.');
            // One localStorage write commits all sections and the recovery copy together.
            // Quota/write failures leave the previous save completely intact.
            writeBundle({version: 1, sections: values, previous: {sections: before, savedAt: new Date().toISOString()}});
        },
        getPrevious() {
            if (!activeId) return null;
            const previous = readBundle()?.previous;
            if (!previous) return null;
            if (!Object.hasOwn(previous.sections, 'account')) previous.sections.account = null;
            checkSections(previous.sections);
            return {sections: {...previous.sections}, savedAt: previous.savedAt};
        },
        restorePrevious() {
            const previous = this.getPrevious();
            if (!previous) throw new Error('되돌릴 세이브가 없습니다.');
            writeBundle({version: 1, sections: previous.sections, previous: null});
        },
        clearPrevious() {
            const bundle = readBundle();
            if (bundle) {bundle.previous = null; writeBundle(bundle);}
        },
        renameProfile(name) {
            if (linkedUid) throw new Error('연동 UID는 이름을 변경할 수 없습니다. UID · 프로필 변경으로 다른 UID를 조회하세요.');
            const id = String(name).trim().normalize('NFC').toLowerCase();
            if (!/^[\p{L}\p{N}_.-]{1,30}$/u.test(id)) throw new Error('프로필 이름은 1~30자의 한글·영문·숫자·밑줄·점·하이픈으로 입력하세요.');
            if (id === activeId) return;
            const target = `${prefix}${encodeURIComponent(id)}:`;
            if (['ready', 'save-bundle', ...sections].some(s => localStorage.getItem(target + s) !== null)) throw new Error('이미 있는 프로필 이름입니다. 다른 이름을 입력하세요.');
            const bundle = readBundle() || {version: 1, sections: snapshot(), previous: null};
            // Commit the destination before removing the old profile; quota failure preserves it.
            localStorage.setItem(target + 'save-bundle', JSON.stringify(bundle));
            const keys = [...sections].map(storageKey).concat(bundleKey(), `${prefix}${encodeURIComponent(activeId)}:ready`);
            activeId = id;
            for (const key of keys) localStorage.removeItem(key);
            globalThis.dispatchEvent(new Event('honkai-profile-renamed'));
        },
        deleteProfile() {
            const keys = [...sections].map(storageKey);
            keys.push(bundleKey(), `${prefix}${encodeURIComponent(activeId)}:ready`);
            for (const key of keys) localStorage.removeItem(key);
            activeId = null;
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        const get = id => document.getElementById(id);
        get('profile-login-mode').addEventListener('change', () => {
            const local = get('profile-login-mode').value === 'local', input = get('profile-login-id');
            input.value = ''; input.minLength = local ? 1 : 9; input.maxLength = local ? 30 : 10;
            input.inputMode = local ? 'text' : 'numeric';
            input.pattern = local ? '[\\p{L}\\p{N}_.\\-]{1,30}' : '[1-9][0-9]{8,9}';
            input.placeholder = local ? '기존 저장 프로필 이름' : '게임에 표시된 9~10자리 UID';
            get('profile-login-label').textContent = local ? '저장 프로필 이름' : '붕괴: 스타레일 UID';
            get('profile-submit').textContent = local ? '프로필 열기 →' : 'UID 조회하고 연동 →';
            get('profile-login-error').textContent = ''; input.focus();
        });
        get('profile-login-form').addEventListener('submit', async event => {
            event.preventDefault();
            const button = get('profile-submit');
            if (button.disabled) return;
            const local = get('profile-login-mode').value === 'local';
            const id = get('profile-login-id').value.trim().normalize('NFC').toLowerCase();
            const error = get('profile-login-error');
            error.textContent = '';
            if (!local && !globalThis.HonkaiUid?.validUid(id)) {
                error.textContent = '게임에 표시된 9~10자리 숫자 UID를 입력하세요.'; return;
            }
            if (!/^[\p{L}\p{N}_.-]{1,30}$/u.test(id)) {
                error.textContent = '아이디는 1~30자의 한글·영문·숫자·밑줄·점·하이픈으로 입력하세요.';
                return;
            }
            const label = button.textContent;
            button.disabled = true; get('profile-login-mode').disabled = true; get('profile-login-id').disabled = true;
            button.textContent = local ? '프로필을 여는 중…' : '게임 정보를 조회하는 중…';
            try {
                const profile = local ? null : await HonkaiUid.lookup(id);
                // A read-only browser must fail before entering. Existing saves
                // and old backend sessions are never reset or removed.
                localStorage.setItem(`${prefix}${encodeURIComponent(id)}:ready`, '1');
                activeId = id;
                linkedUid = !local;
                if (profile) HonkaiAccount.importUid(profile);
                globalThis.dispatchEvent(new Event('honkai-profile-login'));
                get('profile-current-id').textContent = profile ? `${profile.nickname} · UID ${id} · 개척 Lv.${profile.level}` : `프로필 ${id} · 이 브라우저에 저장`;
                get('app-content').inert = false;
                get('profile-login-screen').hidden = true;
                get('profile-change').focus();
            } catch (failure) {
                activeId = null;
                linkedUid = false;
                error.textContent = local ? '저장 공간을 사용할 수 없습니다. 브라우저의 사이트 데이터 저장을 허용하세요.' : failure.message || 'UID 연동에 실패했습니다. 사이트 데이터 저장 설정을 확인하세요.';
            } finally {
                button.disabled = false; get('profile-login-mode').disabled = false; get('profile-login-id').disabled = false; button.textContent = label;
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
