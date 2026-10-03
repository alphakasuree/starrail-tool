(() => {
    'use strict';
    const prefix = 'honkai-id-v1:';
    const lastProfileKey = 'honkai-last-profile-v1';
    const sections = new Set(['warp', 'relic', 'teams', 'account']);
    let activeId = null;
    let linkedUid = false;
    const validId = id => typeof id === 'string' && /^[\p{L}\p{N}_.-]{1,30}$/u.test(id) && id === id.trim().normalize('NFC').toLowerCase();
    function rememberProfile() {
        // Remembering the entry is optional; it must never undo a committed save.
        try { localStorage.setItem(lastProfileKey, JSON.stringify({version: 1, id: activeId, linkedUid})); } catch {}
    }
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
            rememberProfile();
            globalThis.dispatchEvent(new Event('honkai-profile-renamed'));
        },
        deleteProfile() {
            const keys = [...sections].map(storageKey);
            keys.push(bundleKey(), `${prefix}${encodeURIComponent(activeId)}:ready`);
            for (const key of keys) localStorage.removeItem(key);
            activeId = null;
            linkedUid = false;
            rememberProfile();
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        const get = id => document.getElementById(id);
        function enterLobby(profile) {
            globalThis.dispatchEvent(new Event('honkai-profile-login'));
            get('profile-current-id').textContent = profile ? `${profile.nickname} · UID ${activeId} · 개척 Lv.${profile.level}` : `프로필 ${activeId} · 이 브라우저에 저장`;
            get('app-content').inert = false;
            get('profile-login-screen').hidden = true;
            get('profile-change').focus();
        }
        function restoreProfile() {
            try {
                const raw = localStorage.getItem(lastProfileKey);
                let remembered = raw === null ? null : JSON.parse(raw);
                if (raw === null) {
                    // Older versions did not remember the last entry. Restore only
                    // when there is exactly one saved profile, never guess between IDs.
                    const ids = new Set();
                    for (let i = 0; i < localStorage.length; i++) {
                        const match = localStorage.key(i)?.match(/^honkai-id-v1:([^:]+):(ready|save-bundle|warp|relic|teams|account)$/);
                        if (match) {
                            const id = decodeURIComponent(match[1]);
                            if (validId(id)) ids.add(id);
                        }
                    }
                    if (ids.size !== 1) return false;
                    remembered = {version: 1, id: [...ids][0], linkedUid: false};
                }
                if (remembered?.id === null || remembered === null) return false;
                if (remembered.version !== 1 || !validId(remembered.id) || typeof remembered.linkedUid !== 'boolean') throw new Error('Invalid remembered profile');
                const base = `${prefix}${encodeURIComponent(remembered.id)}:`;
                if (!['ready', 'save-bundle', ...sections].some(s => localStorage.getItem(base + s) !== null)) return false;
                activeId = remembered.id;
                const values = snapshot();
                const cached = JSON.parse(values.account || 'null')?.uidProfile;
                const profile = cached ? globalThis.HonkaiUid.validateSnapshot(cached) : null;
                if (profile && profile.uid !== activeId || remembered.linkedUid && !profile) throw new Error('Invalid cached UID profile');
                linkedUid = raw === null ? Boolean(profile) : remembered.linkedUid;
                // Use the cached public profile, with no network request on reload.
                enterLobby(profile);
                rememberProfile();
                return true;
            } catch {
                activeId = null;
                linkedUid = false;
                get('profile-login-error').textContent = '저장된 프로필을 자동으로 열지 못했습니다. UID나 로컬 프로필로 다시 접속해 주세요.';
                return false;
            }
        }
        get('profile-login-mode').addEventListener('change', () => {
            const local = get('profile-login-mode').value === 'local', input = get('profile-login-id');
            get('profile-mode-uid').ariaPressed = String(!local);
            get('profile-mode-local').ariaPressed = String(local);
            input.value = ''; input.minLength = local ? 1 : 9; input.maxLength = local ? 30 : 10;
            input.inputMode = local ? 'text' : 'numeric';
            input.pattern = local ? '[\\p{L}\\p{N}_.\\-]{1,30}' : '[1-9][0-9]{8,9}';
            input.placeholder = local ? '새 이름 또는 저장한 프로필 이름' : '게임에 표시된 9~10자리 UID';
            get('profile-login-title').textContent = local ? '로컬 프로필로 시작' : '게임 UID 연동';
            get('profile-login-description').textContent = local ? 'UID 없이 계산기를 사용합니다. 같은 이름의 저장이 있으면 열고, 없으면 새 프로필을 만듭니다.' : '게임 UID로 공개된 프로필과 전시 캐릭터 정보를 불러와 시작합니다.';
            get('profile-login-label').textContent = local ? '프로필 이름' : '붕괴: 스타레일 UID';
            get('profile-login-input-help').textContent = local ? '1~30자의 한글·영문·숫자·밑줄·점·하이픈을 사용하세요. 영문 대소문자는 구분하지 않습니다.' : '게임에 표시된 9~10자리 숫자 UID를 입력하세요.';
            get('profile-submit').textContent = local ? '로컬 프로필로 시작 →' : 'UID 조회하고 연동 →';
            get('profile-login-error').textContent = '';
        });
        for (const mode of ['uid', 'local']) {
            get(`profile-mode-${mode}`).addEventListener('click', () => {
                if (get('profile-submit').disabled || get('profile-login-mode').value === mode) return;
                get('profile-login-mode').value = mode;
                get('profile-login-mode').dispatchEvent(new Event('change'));
            });
        }
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
                error.textContent = '프로필 이름은 1~30자의 한글·영문·숫자·밑줄·점·하이픈으로 입력하세요.';
                return;
            }
            const label = button.textContent;
            button.disabled = true; get('profile-login-mode').disabled = true; get('profile-login-id').disabled = true;
            get('profile-mode-uid').disabled = true; get('profile-mode-local').disabled = true;
            button.textContent = local ? '로컬 프로필로 시작하는 중…' : '게임 정보를 조회하는 중…';
            try {
                const profile = local ? null : await HonkaiUid.lookup(id);
                // A read-only browser must fail before entering. Existing saves
                // and old backend sessions are never reset or removed.
                localStorage.setItem(`${prefix}${encodeURIComponent(id)}:ready`, '1');
                activeId = id;
                linkedUid = !local;
                if (profile) HonkaiAccount.importUid(profile);
                enterLobby(profile);
                rememberProfile();
            } catch (failure) {
                activeId = null;
                linkedUid = false;
                error.textContent = local ? '저장 공간을 사용할 수 없습니다. 브라우저의 사이트 데이터 저장을 허용하세요.' : failure.message || 'UID 연동에 실패했습니다. 사이트 데이터 저장 설정을 확인하세요.';
            } finally {
                button.disabled = false; get('profile-login-mode').disabled = false; get('profile-login-id').disabled = false; button.textContent = label;
                get('profile-mode-uid').disabled = false; get('profile-mode-local').disabled = false;
            }
        });
        get('profile-change').addEventListener('click', () => {
            if (typeof isWarping !== 'undefined' && isWarping) {
                get('profile-account-status').textContent = '추첨이 끝난 뒤 아이디를 변경하세요.';
                return;
            }
            try {
                // An explicit change returns to entry even if one profile is saved.
                localStorage.setItem(lastProfileKey, 'null');
                location.reload();
            } catch {
                get('profile-account-status').textContent = '프로필 변경을 위해 사이트 데이터 저장을 허용해 주세요.';
            }
        });
        if (!restoreProfile()) get('profile-login-id').focus({preventScroll: true});
    });
})();
