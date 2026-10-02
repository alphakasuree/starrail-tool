(() => {
    'use strict';
    const FORMAT = 'honkai-local-save', VERSION = 1, MAX_BYTES = 512 * 1024;
    const groups = ['character', 'lightcone', 'characterCollaboration', 'lightconeCollaboration'];
    const statIds = ['cr', 'cd', 'spd', 'atk', 'hp', 'def', 'break', 'ehr', 'res', 'flatAtk', 'flatHp', 'flatDef'];
    const profiles = ['pdf', 'crit', 'hpCrit', 'defCrit', 'dot', 'break', 'support', 'critSupport', 'atkSupport', 'atkHeal', 'defSupport', 'hpSupport', 'debuff'];
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const string = value => typeof value === 'string' && value.length <= 2000;
    const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
    const numeric = value => (typeof value === 'string' || typeof value === 'number') && Number.isFinite(Number(value)) && Number(value) >= 0;
    const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
    function require(condition, message) { if (!condition) throw new Error(message); }
    function inspect(value, depth = 0, count = {n: 0}) {
        require(depth <= 20 && ++count.n <= 1500000, '파일의 데이터 구조가 너무 큽니다.');
        if (typeof value === 'string') require(value.length <= 2000, '파일의 문자열 길이가 허용 범위를 넘었습니다.');
        if (typeof value === 'number') require(Number.isFinite(value), '파일에 올바르지 않은 숫자가 있습니다.');
        if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
            require(!['__proto__', 'constructor', 'prototype'].includes(key), '파일에 허용되지 않은 데이터 키가 있습니다.');
            inspect(child, depth + 1, count);
        }
    }
    function validateWarp(warp) {
        if (warp === null) return;
        require(object(warp) && warp.version === 1 && object(warp.bannerStates) && object(warp.history) && object(warp.inventory) && object(warp.selectedPickups), '워프 저장 데이터 형식이 올바르지 않습니다.');
        for (const group of groups) {
            const state = warp.bannerStates[group], history = warp.history[group];
            // Older character/light-cone saves may omit collaboration sections.
            if (group.endsWith('Collaboration') && state === undefined && history === undefined) continue;
            require(object(state) && integer(state.pity5, group.startsWith('character') ? 89 : 79) && integer(state.pity4, 9) && typeof state.guaranteed5 === 'boolean' && typeof state.guaranteed4 === 'boolean', `${group} 천장·확정 데이터가 올바르지 않습니다.`);
            require(Array.isArray(history) && history.length <= 200000, '워프 기록 목록이 올바르지 않습니다.');
            require(history.every(entry => object(entry) && string(entry.name) && [3, 4, 5].includes(entry.rarity) && date(entry.time) && (entry.type === undefined || ['character', 'lightcone'].includes(entry.type))), '워프 기록에 올바르지 않은 항목이 있습니다.');
        }
        require(Object.entries(warp.inventory).every(([key, value]) => key.length <= 200 && integer(value, Number.MAX_SAFE_INTEGER) && value > 0), '보유 목록 데이터가 올바르지 않습니다.');
        require(['character', 'lightcone'].every(kind => string(warp.selectedPickups[kind]) && warp.selectedPickups[kind].length > 0), '픽업 선택 데이터가 올바르지 않습니다.');
    }
    function validateRelic(relic) {
        if (relic === null) return;
        require(Array.isArray(relic) && relic.length <= 10000, '유물 세팅 목록이 올바르지 않습니다.');
        const ids = new Set();
        for (const setup of relic) {
            require(object(setup) && string(setup.id) && setup.id.length > 0 && !ids.has(setup.id) && string(setup.characterId) && string(setup.name) && ['build', 'item'].includes(setup.mode) && integer(setup.savedAt, 8640000000000000) && profiles.includes(setup.profile), '유물 세팅 기본 정보가 올바르지 않습니다.');
            ids.add(setup.id);
            require(Array.isArray(setup.targets) && setup.targets.length <= statIds.length && new Set(setup.targets.map(t => t?.id)).size === setup.targets.length && setup.targets.every(t => object(t) && statIds.includes(t.id) && ['min', 'max', 'lt'].includes(t.mode) && [t.value, t.endValue, t.current].every(numeric)), '유물 목표 수치가 올바르지 않습니다.');
            require(Array.isArray(setup.rows) && setup.rows.length === 4 && setup.rows.every(row => object(row) && statIds.includes(row.id) && numeric(row.value)), '유물 부옵션 데이터가 올바르지 않습니다.');
            require(object(setup.weights) && statIds.every(id => numeric(setup.weights[id]) && Number(setup.weights[id]) <= 1), '유물 가중치 데이터가 올바르지 않습니다.');
        }
    }
    function validateTeams(teams) {
        if (teams === null) return;
        require(Array.isArray(teams) && teams.length <= 10000 && teams.every(team => object(team) && Array.isArray(team.ids) && team.ids.length === 4 && team.ids.every(id => string(id) && id.length > 0) && new Set(team.ids).size === 4 && integer(team.savedAt, 8640000000000000) && ['ownedOnly', 'fourStarOnly', 'acheronE2', 'offensive'].every(key => team[key] === undefined || typeof team[key] === 'boolean')), '저장 파티 데이터가 올바르지 않습니다.');
    }
    function validate(save) {
        require(object(save) && save.format === FORMAT, '이 사이트에서 내보낸 세이브 파일을 선택해주세요.');
        require(save.version === VERSION, '지원하지 않는 세이브 버전입니다. 파일을 내보낸 사이트 버전을 확인해주세요.');
        require(typeof save.profileId === 'string' && /^[\p{L}\p{N}_.-]{1,30}$/u.test(save.profileId) && date(save.exportedAt), '세이브의 아이디·내보낸 날짜가 올바르지 않습니다.');
        require(object(save.sections) && Object.keys(save.sections).every(key => ['warp','relic','teams','account'].includes(key)) && ['warp', 'relic', 'teams'].every(key => Object.hasOwn(save.sections, key)), '워프·유물·파티 저장 영역이 모두 필요합니다.');
        inspect(save);
        validateWarp(save.sections.warp); validateRelic(save.sections.relic); validateTeams(save.sections.teams);
        const account = save.sections.account;
        if (account !== undefined && account !== null) {
            require(object(account) && account.version === 1 && object(account.characters) && Object.keys(account.characters).length <= 500 && integer(account.createdAt, 8640000000000000) && (account.lastExportAt === null || integer(account.lastExportAt, 8640000000000000)), '계정 저장 정보가 올바르지 않습니다.');
            require(Object.entries(account.characters).every(([id,c]) => /^\d{4,6}$/.test(id) && object(c) && typeof c.owned === 'boolean' && integer(c.e,6) && integer(c.s,5)), '계정의 성혼·광추 정보가 올바르지 않습니다.');
        }
        return save;
    }
    function parse(text) {
        require(typeof text === 'string' && text.length <= MAX_BYTES, '파일이 너무 큽니다. 최대 512KB 파일을 선택해주세요.');
        let bytes = 0;
        for (const char of text) {
            const code = char.codePointAt(0); bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
            require(bytes <= MAX_BYTES, '파일이 너무 큽니다. 최대 512KB 파일을 선택해주세요.');
        }
        let save;
        try { save = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('JSON 파일을 읽을 수 없습니다. 파일이 손상되었는지 확인해주세요.'); }
        return validate(save);
    }
    function create(profileId, raw, exportedAt = new Date().toISOString()) {
        let sections;
        try { sections = Object.fromEntries(['warp', 'relic', 'teams', ...(Object.hasOwn(raw,'account') ? ['account'] : [])].map(key => [key, raw[key] === null ? null : JSON.parse(raw[key])])); }
        catch { throw new Error('현재 저장 데이터를 읽을 수 없어 내보내지 못했습니다.'); }
        return validate({format: FORMAT, version: VERSION, profileId, exportedAt, sections});
    }
    function toRaw(save) { return Object.fromEntries(['warp', 'relic', 'teams', ...(Object.hasOwn(save.sections,'account') ? ['account'] : [])].map(key => [key, save.sections[key] === null ? null : JSON.stringify(save.sections[key])])); }
    function summary(save) {
        const warp = save.sections.warp;
        return {history: Object.values(warp?.history || {}).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0), inventory: Object.keys(warp?.inventory || {}).length, account: Object.values(save.sections.account?.characters || {}).filter(c=>c.owned).length, relic: save.sections.relic?.length || 0, teams: save.sections.teams?.length || 0};
    }
    globalThis.HonkaiSaveFormat = Object.freeze({MAX_BYTES, validate, parse, create, toRaw, summary});
})();
