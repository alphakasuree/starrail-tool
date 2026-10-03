(() => {
    'use strict';
    const validUid = uid => /^[1-9]\d{8,9}$/.test(String(uid));
    const text = value => typeof value === 'string' ? value.slice(0, 300) : '';
    const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
    function validateSnapshot(p) {
        const string = v => typeof v === 'string' && v.length <= 300;
        const stat = s => s && string(s.name) && string(s.display) && string(s.field) && Number.isFinite(s.value) && typeof s.percent === 'boolean';
        if (!p || !validUid(p.uid) || !string(p.nickname) || !string(p.signature) || !integer(p.level,100) || !integer(p.worldLevel,10) || !integer(p.fetchedAt,8640000000000000) || !(p.achievementCount === null || integer(p.achievementCount,100000)) || !Array.isArray(p.characters) || p.characters.length > 32) throw new Error('저장된 UID 프로필 형식이 올바르지 않습니다.');
        for (const c of p.characters) {
            if (!c || !/^\d{4,6}$/.test(c.id) || !string(c.name) || !integer(c.level,100) || !integer(c.rank,6) || !Array.isArray(c.stats) || c.stats.length > 20 || !c.stats.every(stat) || !Array.isArray(c.relics) || c.relics.length > 6 || !c.relics.every(r=>r && string(r.name) && integer(r.level,15) && stat(r.main) && Array.isArray(r.sub) && r.sub.length <= 4 && r.sub.every(stat)) || !(c.lightCone === null || c.lightCone && /^\d{4,6}$/.test(c.lightCone.id) && string(c.lightCone.name) && integer(c.lightCone.rank,5) && integer(c.lightCone.level,100))) throw new Error('저장된 UID 캐릭터 형식이 올바르지 않습니다.');
            if (c.relics.some(r => !(r.id == null || /^\d{4,6}$/.test(r.id)) || !(r.rarity == null || integer(r.rarity,5)))) throw new Error('저장된 UID 유물 형식이 올바르지 않습니다.');
        }
        return p;
    }
    function normalize(raw, uid) {
        if (!raw?.player || String(raw.player.uid) !== uid || typeof raw.player.nickname !== 'string' || !Array.isArray(raw.characters) || raw.characters.length > 32) throw new Error('UID 조회 응답이 올바르지 않습니다. 잠시 후 다시 조회하세요.');
        const stat = s => ({name:text(s?.name), display:text(s?.display), field:text(s?.field), value:Number.isFinite(s?.value) ? s.value : 0, percent:s?.percent === true});
        const characters = raw.characters.map(c => {
            if (!/^\d{4,6}$/.test(String(c?.id)) || !integer(c.rank, 6) || !integer(c.level, 100)) throw new Error('캐릭터 조회 응답이 올바르지 않습니다.');
            const cone = c.light_cone;
            return {id:String(c.id), name:text(c.name), level:c.level, rank:c.rank,
                lightCone:cone && /^\d{4,6}$/.test(String(cone.id)) && integer(cone.rank, 5) ? {id:String(cone.id),name:text(cone.name),rank:cone.rank,level:integer(cone.level,100) ? cone.level : 0} : null,
                stats:(Array.isArray(c.attributes) ? c.attributes : []).slice(0,20).map(s => {
                    const extra = (Array.isArray(c.additions) ? c.additions : []).find(a => a.field === s.field);
                    const result = stat(s); result.value += Number.isFinite(extra?.value) ? extra.value : 0;
                    result.display = result.percent ? `${(result.value * 100).toFixed(1)}%` : Math.floor(result.value).toLocaleString('ko-KR');
                    return result;
                }),
                relics:(Array.isArray(c.relics) ? c.relics : []).slice(0,6).map(r => ({id:/^\d{4,6}$/.test(String(r.id)) ? String(r.id) : null,rarity:integer(r.rarity,5) ? r.rarity : null,name:text(r.name),level:integer(r.level,15) ? r.level : 0,main:stat(r.main_affix),sub:(Array.isArray(r.sub_affix) ? r.sub_affix : []).slice(0,4).map(stat)}))};
        });
        return {uid, nickname:text(raw.player.nickname), level:integer(raw.player.level,100) ? raw.player.level : 0,
            worldLevel:integer(raw.player.world_level,10) ? raw.player.world_level : 0, signature:text(raw.player.signature),
            achievementCount:integer(raw.player.space_info?.achievement_count,100000) ? raw.player.space_info.achievement_count : null,
            fetchedAt:Date.now(), characters};
    }
    async function lookup(uid) {
        if (!validUid(uid)) throw new Error('게임에 표시된 9~10자리 숫자 UID를 입력하세요.');
        if (globalThis.location?.protocol === 'file:') throw new Error('HTML 파일 직접 열기에서는 UID 조회를 사용할 수 없습니다. ‘UID 연동 화면 열기’를 누르거나 프로젝트 폴더의 ‘스타레일 실행.cmd’를 실행하세요.');
        const base = globalThis.HonkaiUidConfig?.baseUrl || '/api/hsr';
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${base.replace(/\/$/, '')}/${uid}`, {signal:controller.signal, credentials:'omit', cache:'no-store'});
            if (response.status === 404) throw new Error('해당 UID를 찾을 수 없습니다. UID와 게임 프로필 공개 설정을 확인하세요.');
            if (response.status === 429) throw new Error('조회 요청이 많습니다. 잠시 후 다시 시도하세요.');
            if (!response.ok) throw new Error('UID 조회 서비스에 연결하지 못했습니다. 잠시 후 다시 시도하세요.');
            return normalize(await response.json(), uid);
        } catch (error) {
            if (error.name === 'AbortError') throw new Error('조회 시간이 초과되었습니다. 다시 시도하세요.');
            if (['TypeError','SyntaxError'].includes(error.name)) throw new Error('UID 조회 서버에 연결할 수 없습니다. 로컬 서버 실행 또는 배포 서버의 UID 연동 설정을 확인하세요.');
            throw error;
        } finally { clearTimeout(timeout); }
    }
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function render() {
        const panel = document.getElementById('uid-profile-panel');
        let profile;
        try {
            profile = JSON.parse(HonkaiProfileStorage.getItem('account') || 'null')?.uidProfile;
            if (profile) validateSnapshot(profile);
        } catch {profile = null; /* Account UI reports corrupt saves. */ }
        panel.hidden = !profile || profile.uid !== HonkaiProfileStorage.id;
        if (panel.hidden) return;
        document.getElementById('uid-player-summary').textContent = `${profile.nickname} · UID ${profile.uid} · 개척 Lv.${profile.level} · 균형 ${profile.worldLevel}${profile.achievementCount === null ? '' : ` · 업적 ${profile.achievementCount}`}`;
        document.getElementById('uid-signature').textContent = profile.signature;
        document.getElementById('uid-sync-status').textContent = `최근 조회 ${new Date(profile.fetchedAt).toLocaleString('ko-KR')} · 전시 캐릭터 ${profile.characters.length}명`;
        document.getElementById('uid-showcase').innerHTML = profile.characters.length ? profile.characters.map(c => {
            const local = characterCatalog.find(ch => ch.id === c.id);
            return `<article class="uid-character">${local ? `<img src="${escape(local.image)}" alt="" loading="lazy">` : ''}<h3>${escape(c.name || local?.name || c.id)}</h3><p>Lv.${c.level} · 성혼 E${c.rank}</p><p>${c.lightCone ? `${escape(c.lightCone.name)} · Lv.${c.lightCone.level} · S${c.lightCone.rank}` : '장착 광추 없음'}</p><dl>${c.stats.map(s=>`<div><dt>${escape(s.name)}</dt><dd>${escape(s.display)}</dd></div>`).join('')}</dl><details><summary>장착 유물 ${c.relics.length}개</summary>${c.relics.map(r=>`<p><strong>${escape(r.name)} +${r.level}</strong><br>${escape(r.main.name)} ${escape(r.main.display)}<br>${r.sub.map(s=>`${escape(s.name)} ${escape(s.display)}`).join(' · ')}</p>`).join('')}</details></article>`;
        }).join('') : '<p>전시 캐릭터가 없습니다. 게임 프로필에서 캐릭터 전시와 상세 정보 공개를 설정한 뒤 다시 조회하세요.</p>';
    }
    globalThis.HonkaiUid = Object.freeze({validUid, normalize, validateSnapshot, lookup, render});
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('profile-file-help').hidden = globalThis.location?.protocol !== 'file:';
        ['honkai-profile-login','honkai-documents-changed','honkai-account-changed'].forEach(event=>globalThis.addEventListener(event,render));
        document.getElementById('uid-refresh').addEventListener('click', async () => {
            const button = document.getElementById('uid-refresh'), status = document.getElementById('uid-sync-status'), uid = HonkaiProfileStorage.id;
            if (typeof isWarping !== 'undefined' && isWarping) {status.textContent='추첨이 끝난 뒤 다시 조회하세요.';return;}
            button.disabled = true; status.textContent = '공개 프로필을 조회하고 있습니다…';
            try {const profile = await lookup(uid); if (HonkaiProfileStorage.id === uid) HonkaiAccount.importUid(profile);}
            catch (error) {status.textContent = `${error.message} 이전 조회 정보는 유지됩니다.`;}
            finally {button.disabled = false;}
        });
    });
})();
