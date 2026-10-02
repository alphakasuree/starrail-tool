(() => {
    'use strict';
    const prefix = 'honkai-id-v1:';
    const sections = new Set(['warp', 'relic', 'teams', 'account']);
    let activeId = null;
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
                get('profile-current-id').textContent = `프로필 ${id} · 이 브라우저에 저장`;
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
