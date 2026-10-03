(() => {
    'use strict';
    const get = id => document.getElementById(id);
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    let profile = null, selected = null, generation = 0;
    const localCharacter = c => characterCatalog.find(item => item.id === c.id);
    const nameOf = c => localCharacter(c)?.name || c.name || c.id;
    const gameAssets = typeof HonkaiSpecAssets === 'undefined' ? {characters:{},relics:{},elements:{},paths:{}} : HonkaiSpecAssets;
    const relicAsset = r => gameAssets.relics[r.id] || Object.values(gameAssets.relics).find(item => item.name === r.name);
    const iconCache = new Map();
    function loadIcon(src) {
        if (!src) return Promise.resolve(null);
        if (!iconCache.has(src)) iconCache.set(src, loadImage(src).then(img => {
            if (!img) iconCache.delete(src);
            return img;
        }));
        return iconCache.get(src);
    }
    function showGallery() {
        generation++;
        const previous = selected;
        selected = null;
        get('spec-card-dialog').dataset.view = 'gallery';
        get('spec-card-list').hidden = false;
        get('spec-card-navigation').hidden = true;
        get('spec-card-preview').hidden = true;
        get('spec-card-download').disabled = true;
        get('spec-card-status').textContent = '';
        get('spec-card-status').hidden = true;
        get('spec-card-dialog').scrollTop = 0;
        for (const button of get('spec-card-list').children) {
            button.setAttribute('aria-pressed', 'false');
            if (button.dataset.characterId === previous) button.focus();
        }
    }
    function readProfile() {
        const p = JSON.parse(HonkaiProfileStorage.getItem('account') || 'null')?.uidProfile;
        if (!p || p.uid !== HonkaiProfileStorage.id) return null;
        return HonkaiUid.validateSnapshot(p);
    }
    function render() {
        showGallery();
        get('spec-card-list').replaceChildren();
        profile = null;
        try { profile = readProfile(); }
        catch { get('spec-card-status').textContent = '저장된 프로필을 읽을 수 없습니다. 내 계정에서 백업·복구를 확인해 주세요.'; }
        get('spec-card-status').hidden = Boolean(profile?.characters.length);
        get('spec-card-refresh').disabled = !profile;
        get('spec-card-updated').textContent = profile ? `최근 조회 · ${new Date(profile.fetchedAt).toLocaleString('ko-KR', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}` : '';
        get('spec-card-summary').textContent = profile ? `${profile.nickname} · 전시 캐릭터 ${profile.characters.length}명` : 'UID 연동이 필요합니다';
        if (!profile) {
            get('spec-card-status').textContent ||= 'UID · 프로필 변경에서 게임 UID를 연동하면 내 캐릭터가 여기에 표시됩니다.';
            return;
        }
        get('spec-card-status').textContent = profile.characters.length ? '' : '게임 프로필에서 캐릭터 전시·상세 정보 공개를 켠 뒤 다시 조회해 주세요.';
        for (const c of profile.characters) {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'spec-character'; button.dataset.characterId = c.id;
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-label', `${nameOf(c)} · 레벨 ${c.level} · 성혼 ${c.rank}, 스펙 명함 만들기`);
            const local = localCharacter(c);
            button.innerHTML = `<span class="spec-character-copy"><strong>${escape(nameOf(c))}</strong><small><span>Lv.${c.level}</span><span>성혼 ${c.rank}</span>${local ? `<span>${escape(local.elementName)}</span>` : ''}</small></span>`;
            if (local) {
                const img = document.createElement('img'); img.alt = ''; img.loading = 'lazy';
                WarpArtwork.setSource(img, {portrait:`assets/character-art/${c.id}.png`, image:local.image});
                button.prepend(img);
            }
            button.addEventListener('click', () => select(c.id));
            get('spec-card-list').append(button);
        }
    }
    function loadImage(src) {
        return new Promise(resolve => {
            const img = new Image();
            const timer = setTimeout(() => finish(null), 8000);
            function finish(value) { clearTimeout(timer); img.onload = img.onerror = null; resolve(value); }
            img.onload = () => finish(img); img.onerror = () => finish(null); img.src = src;
        });
    }
    async function select(id) {
        const c = profile?.characters.find(c => c.id === id);
        if (!c) return;
        selected = id;
        get('spec-card-dialog').dataset.view = 'card';
        get('spec-card-list').hidden = true;
        get('spec-card-navigation').hidden = false;
        get('spec-card-dialog').scrollTop = 0;
        get('spec-card-back').focus();
        const token = ++generation, p = profile, showUid = get('spec-card-show-uid').checked;
        get('spec-card-download').disabled = true;
        get('spec-card-preview').hidden = true;
        get('spec-card-status').hidden = false;
        get('spec-card-status').textContent = '일러스트와 스펙 명함을 만드는 중입니다…';
        for (const button of get('spec-card-list').children) button.setAttribute('aria-pressed', String(button.dataset.characterId === id));
        try {
            const local = localCharacter(c);
            const [art, coneArt, rankIcons, relicIcons, elementIcon, pathIcon] = await Promise.all([
                local ? loadImage(`assets/character-art/${c.id}.png`).then(img => img || loadImage(local.image)) : null,
                c.lightCone ? loadImage(`assets/lightcone-art/${c.lightCone.id}.png`).then(img => img || loadImage(`assets/lightcones/${c.lightCone.id}.png`)) : null,
                Promise.all((gameAssets.characters[c.id] || []).map(rank => loadIcon(rank.icon))),
                Promise.all(c.relics.map(r => loadIcon(relicAsset(r)?.icon))),
                loadIcon(gameAssets.elements[local?.element]),
                loadIcon(gameAssets.paths[local?.path])
            ]);
            if (token !== generation || !get('spec-card-dialog').open) return;
            drawCard(get('spec-card-canvas'), p, c, art, showUid, {coneArt, rankIcons, relicIcons, elementIcon, pathIcon});
            get('spec-card-canvas').setAttribute('aria-label', `${nameOf(c)} · Lv.${c.level} · E${c.rank} · ${p.nickname}의 스펙 명함`);
            get('spec-preview-title').textContent = `${nameOf(c)} · 스펙 명함`;
            get('spec-card-text').innerHTML = `<h3>${escape(nameOf(c))} · Lv.${c.level} · E${c.rank}</h3><p>${escape(coneText(c))}</p><p>${c.stats.map(s => `${escape(s.name)} ${escape(s.display)}`).join(' · ') || '능력치 정보 없음'}</p>${c.relics.map(r => `<h3>${escape(r.name)} +${r.level}</h3><p>${escape(r.main.name)} ${escape(r.main.display)}<br>${r.sub.map(s => `${escape(s.name)} ${escape(s.display)}`).join(' · ')}</p>`).join('')}`;
            get('spec-card-preview').hidden = false;
            get('spec-card-download').disabled = false;
            get('spec-card-status').hidden = Boolean(art);
            get('spec-card-status').textContent = art ? '명함 완성 · PNG 저장을 누르면 이미지로 내려받습니다.' : '일러스트를 불러오지 못해 텍스트 명함을 만들었습니다. 캐릭터를 다시 선택하면 재시도합니다.';
        } catch {
            if (token === generation) {
                get('spec-card-status').hidden = false;
                get('spec-card-status').textContent = '명함을 만들지 못했습니다. 캐릭터를 다시 선택해 주세요.';
            }
        }
    }
    const coneText = c => c.lightCone ? `${c.lightCone.name} · Lv.${c.lightCone.level} · S${c.lightCone.rank}` : '장착 광추 정보 없음';
    function artworkTheme(art) {
        let rgb = [75, 100, 140];
        if (art) try {
            const sample = document.createElement('canvas');
            sample.width = sample.height = 32;
            const sampleCtx = sample.getContext('2d', {willReadFrequently:true});
            if (typeof sampleCtx?.getImageData === 'function') {
                // Favor colored midtones near the character, avoiding white highlights and black outlines.
                sampleCtx.drawImage(art, art.width * .1, art.height * .08, art.width * .8, art.height * .72, 0, 0, 32, 32);
                const pixels = sampleCtx.getImageData(0, 0, 32, 32).data;
                const buckets = Array.from({length:12}, () => ({weight:0, rgb:[0,0,0]}));
                for (let i = 0; i < pixels.length; i += 4) {
                    const color = [pixels[i], pixels[i + 1], pixels[i + 2]];
                    const max = Math.max(...color), min = Math.min(...color), delta = max - min;
                    const lightness = (max + min) / 510, saturation = delta / Math.max(max, 1);
                    if (pixels[i + 3] < 180 || saturation < .18 || lightness < .12 || lightness > .86) continue;
                    let hue = max === color[0] ? (color[1] - color[2]) / delta : max === color[1] ? 2 + (color[2] - color[0]) / delta : 4 + (color[0] - color[1]) / delta;
                    hue = (hue * 60 + 360) % 360;
                    const x = (i / 4) % 32, y = Math.floor(i / 128);
                    const centerWeight = 1 - .45 * Math.hypot((x - 15.5) / 22, (y - 15.5) / 22);
                    const weight = saturation * saturation * (1 - Math.abs(lightness - .45)) * centerWeight;
                    const bucket = buckets[Math.floor(hue / 30)];
                    bucket.weight += weight;
                    color.forEach((value, channel) => bucket.rgb[channel] += value * weight);
                }
                const dominant = buckets.reduce((best, bucket) => bucket.weight > best.weight ? bucket : best);
                if (dominant.weight) rgb = dominant.rgb.map(value => value / dominant.weight);
            }
        } catch { /* Unavailable or unreadable artwork keeps the neutral fallback theme. */ }
        const mix = (base, amount) => '#' + base.map((value, i) => Math.round(value * (1 - amount) + rgb[i] * amount).toString(16).padStart(2, '0')).join('');
        return {
            background:mix([13,17,24], .12), backgroundLight:mix([19,24,32], .19),
            panel:mix([23,28,37], .16), inset:mix([12,16,23], .1),
            artwork:mix([26,34,46], .28), accent:mix([218,225,237], .15),
            muted:mix([158,169,187], .12)
        };
    }
    function drawCard(canvas, p, c, art, showUid, {coneArt, rankIcons, relicIcons, elementIcon, pathIcon}) {
        const ctx = canvas.getContext('2d'), local = localCharacter(c);
        const theme = artworkTheme(art), accent = theme.accent, gold = '#cbb991';
        const statRows = Math.max(2, Math.ceil(c.stats.length / 3));
        const statsTop = 184, statRowHeight = 116;
        const statsHeight = Math.max(400, statRows * statRowHeight + 20);
        const relicRowHeight = 240, relicTop = statsTop + statsHeight + 64;
        // Size the exported PNG itself to a landscape 16:10 card, including every relic row.
        const contentHeight = Math.max(1200, relicTop + Math.max(3, Math.ceil(c.relics.length / 2)) * relicRowHeight + 36);
        canvas.height = Math.ceil(contentHeight / 10) * 10;
        canvas.width = canvas.height / 10 * 16;
        const h = canvas.height, right = 664, rightWidth = canvas.width - right - 36;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, h);
        gradient.addColorStop(0, theme.backgroundLight); gradient.addColorStop(.55, theme.background); gradient.addColorStop(1, theme.backgroundLight);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, h);
        function panel(x, y, w, height, fill = theme.panel, stroke = '#ffffff12', radius = 12) {
            ctx.beginPath(); ctx.roundRect(x, y, w, height, radius);
            ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke();
        }
        function line(x, y, endX, endY, color = '#ffffff12') {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
        }
        function text(value, x, y, size = 24, color = '#edf1f8', maxWidth = 820, bold = false) {
            ctx.fillStyle = color; ctx.font = `${bold ? '600 ' : ''}${size}px "Malgun Gothic", sans-serif`;
            const content = String(value);
            let fitted = content;
            while (fitted.length && ctx.measureText(fitted).width > maxWidth) fitted = fitted.slice(0, -1);
            if (fitted !== content) {
                while (fitted.length && ctx.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1);
                fitted += '…';
            }
            ctx.fillText(fitted, x, y);
            return ctx.measureText(fitted).width;
        }
        function image(img, x, y, w, height) {
            if (!img) return;
            const scale = Math.min(w / img.width, height / img.height);
            ctx.drawImage(img, x + (w - img.width * scale) / 2, y + (height - img.height * scale) / 2, img.width * scale, img.height * scale);
        }
        function star(x, y, size, color = gold) {
            ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * .25, y - size * .25);
            ctx.lineTo(x + size, y); ctx.lineTo(x + size * .25, y + size * .25);
            ctx.lineTo(x, y + size); ctx.lineTo(x - size * .25, y + size * .25);
            ctx.lineTo(x - size, y); ctx.lineTo(x - size * .25, y - size * .25); ctx.closePath();
            ctx.fillStyle = color; ctx.fill();
        }
        // Keep the build readable with a quiet background and a single artwork frame.
        ctx.save(); ctx.beginPath(); ctx.roundRect(20, 20, 618, h - 40, 22); ctx.clip();
        const artBackground = ctx.createLinearGradient(20, 20, 638, h);
        artBackground.addColorStop(0, theme.artwork); artBackground.addColorStop(1, theme.inset);
        ctx.fillStyle = artBackground; ctx.fillRect(20, 20, 618, h - 40);
        if (art) {
            const scale = Math.max(618 / art.width, (h - 40) / art.height);
            ctx.drawImage(art, 329 - art.width * scale / 2, 20 + (h - 40 - art.height * scale) / 2, art.width * scale, art.height * scale);
        } else {
            text('✦', 300, h * .43, 70, gold, 100);
            text(nameOf(c), 166, h * .43 + 150, 36, accent, 400, true);
        }
        const fade = ctx.createLinearGradient(0, h - 300, 0, h);
        fade.addColorStop(0, theme.inset + '00'); fade.addColorStop(.65, theme.inset + 'dc'); fade.addColorStop(1, theme.inset);
        ctx.fillStyle = fade; ctx.fillRect(20, h - 300, 618, 300);
        text('개척자', 58, h - 165, 20, accent, 420);
        text(p.nickname, 58, h - 115, 36, '#f5f6fc', 520, true);
        text(`${showUid ? `UID ${p.uid}  ·  ` : ''}개척 Lv.${p.level}`, 58, h - 76, 20, accent, 530);
        panel(38, 64, 86, 576, theme.inset + 'b8', '#ffffff20', 36);
        for (let i = 0; i < 6; i++) {
            const y = 106 + i * 90, active = i < c.rank;
            ctx.save(); ctx.globalAlpha = active ? 1 : .28;
            ctx.beginPath(); ctx.arc(81, y, 29, 0, Math.PI * 2);
            ctx.fillStyle = active ? theme.artwork : theme.inset; ctx.fill();
            ctx.strokeStyle = active ? '#8b9db5' : '#526075'; ctx.lineWidth = 1.5; ctx.stroke();
            image(rankIcons[i], 55, y - 26, 52, 52);
            if (!rankIcons[i]) text(active ? '✦' : '◇', 67, y + 9, 28, accent, 35);
            text(['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'][i], 72, y + 49, 17, '#f5e7c9', 35);
            ctx.restore();
        }
        ctx.restore();
        panel(20, 20, 618, h - 40, '#ffffff00', '#ffffff20', 22);
        // Keep identity and progression together instead of anchoring metadata to the far edge.
        panel(right, 20, rightWidth, 144, '#ffffff04', '#ffffff10');
        const identityX = right + 24;
        const nameWidth = text(nameOf(c), identityX, 79, 44, '#f3f5fa', rightWidth - 350, true);
        const levelX = identityX + nameWidth + 24;
        const levelWidth = text(`Lv.${c.level}`, levelX, 77, 24, accent, 120, true);
        text(local ? '★'.repeat(local.rarity) : '', levelX + levelWidth + 22, 77, 22, '#edc873', 180);
        let metadataX = identityX;
        for (const [icon, label] of [[elementIcon, local?.elementName], [pathIcon, local?.pathName]]) {
            if (!label) continue;
            image(icon, metadataX, 106, 30, 30);
            const labelWidth = text(label, metadataX + 38, 129, 21, accent, 160);
            metadataX += 38 + labelWidth + 24;
            line(metadataX - 12, 110, metadataX - 12, 134, '#ffffff20');
        }
        text(`성혼 ${c.rank}`, metadataX, 129, 21, accent, 160);
        const coneWidth = Math.round(rightWidth * .36), statsX = right + coneWidth + 20;
        const statsWidth = rightWidth - coneWidth - 20;
        panel(right, statsTop, coneWidth, statsHeight);
        // Contain the complete portrait; no crop or enhancement badge overlaps the image.
        const coneImageHeight = statsHeight - 40;
        const coneImageWidth = Math.round(Math.min(coneWidth * .46, coneImageHeight * .7));
        panel(right + 18, statsTop + 18, coneImageWidth + 4, coneImageHeight + 4, theme.inset, '#ffffff10', 8);
        if (coneArt) image(coneArt, right + 20, statsTop + 20, coneImageWidth, coneImageHeight);
        else text('✦', right + 20 + coneImageWidth / 2 - 24, statsTop + statsHeight / 2 + 18, 56, gold, 70);
        const coneName = c.lightCone?.name || '장착 광추 없음';
        const coneTextX = right + coneImageWidth + 44, coneTextWidth = coneWidth - coneImageWidth - 64;
        ctx.font = '600 30px "Malgun Gothic", sans-serif';
        const coneLines = [''];
        for (const char of coneName) {
            const last = coneLines.length - 1;
            if (ctx.measureText(coneLines[last] + char).width > coneTextWidth && coneLines[last]) coneLines.push(char);
            else coneLines[last] += char;
        }
        const visibleConeLines = coneLines.length > 2 ? [coneLines[0], coneLines.slice(1).join('')] : coneLines;
        const coneCopyHeight = visibleConeLines.length * 42 + 124;
        const coneCopyTop = statsTop + (statsHeight - coneCopyHeight) / 2;
        visibleConeLines.forEach((value, i) => text(value, coneTextX, coneCopyTop + 30 + i * 42, 30, '#eef1f7', coneTextWidth, true));
        const cone = typeof lightConeCatalog === 'undefined' ? null : lightConeCatalog.find(item => item.id === c.lightCone?.id);
        const coneRarityY = coneCopyTop + visibleConeLines.length * 42 + 24;
        text(cone ? '★'.repeat(cone.rarity) : '', coneTextX, coneRarityY, 24, '#edc873', coneTextWidth);
        text(c.lightCone ? `Lv.${c.lightCone.level}  ·  중첩 ${['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][c.lightCone.rank] || '—'}` : '', coneTextX, coneRarityY + 46, 24, accent, coneTextWidth);
        if (c.lightCone) for (let i = 0; i < 5; i++) star(coneTextX + 10 + i * 30, coneRarityY + 80, 8, i < c.lightCone.rank ? '#edc873' : '#ffffff24');
        panel(statsX, statsTop, statsWidth, statsHeight);
        const fittedStatRowHeight = (statsHeight - 20) / statRows;
        for (let row = 1; row < statRows; row++) line(statsX + 20, statsTop + 10 + row * fittedStatRowHeight, statsX + statsWidth - 20, statsTop + 10 + row * fittedStatRowHeight);
        if (!c.stats.length) text('공개된 능력치 정보가 없습니다.', statsX + 30, statsTop + 66, 22, accent, statsWidth - 60);
        c.stats.forEach((s, i) => {
            const col = i % 3, columnWidth = statsWidth / 3, x = statsX + col * columnWidth, y = statsTop + 10 + Math.floor(i / 3) * fittedStatRowHeight;
            if (col) line(x, y + 8, x, y + fittedStatRowHeight - 8);
            text(s.name, x + 22, y + fittedStatRowHeight / 2 - 14, 22, theme.muted, columnWidth - 44);
            text(s.display, x + 22, y + fittedStatRowHeight / 2 + 34, 38, '#edf2f9', columnWidth - 44, true);
        });
        // Derive set counts from equipped pieces; never infer a fictional set name.
        const sets = new Map();
        c.relics.forEach(r => {
            const id = relicAsset(r)?.setId;
            if (id) sets.set(id, (sets.get(id) || 0) + 1);
        });
        const setSummary = [...sets.values()].sort((a, b) => b - a).map(count => `${count}세트`).join('  ·  ');
        const label = setSummary ? `장착 유물  ·  ${setSummary}` : '장착 유물';
        const dividerY = relicTop - 26;
        text(label, right + 4, dividerY, 24, '#aebbcf', rightWidth, true);
        if (!c.relics.length) text('공개된 유물 정보가 없습니다.', right + 30, relicTop + 45, 22, accent);
        c.relics.forEach((r, i) => {
            const relicWidth = (rightWidth - 18) / 2;
            const x = right + (i % 2) * (relicWidth + 18), y = relicTop + Math.floor(i / 2) * relicRowHeight;
            panel(x, y, relicWidth, relicRowHeight - 16);
            text(r.name, x + 24, y + 38, 24, '#dce4ef', relicWidth - 48, true);
            line(x + 20, y + 54, x + relicWidth - 20, y + 54);
            panel(x + 20, y + 66, 132, 132, '#ffffff06', '#ffffff12', 10);
            image(relicIcons[i], x + 26, y + 72, 120, 120);
            panel(x + 94, y + 70, 54, 30, theme.inset + 'eb', '#ffffff16', 6);
            text(`+${r.level}`, x + 101, y + 93, 21, '#f7f4e9', 40, true);
            const rarity = r.rarity || (r.id ? relicAsset(r)?.rarity : r.level > 12 ? 5 : 0);
            if (rarity) text('★'.repeat(rarity), x + 26, y + 216, 19, '#edc873', 120);
            const subX = x + relicWidth - 280;
            text(r.main.name, x + 174, y + 112, 22, theme.muted, relicWidth - 478);
            text(r.main.display, x + 174, y + 166, 38, '#edf2f9', relicWidth - 478, true);
            line(subX - 20, y + 72, subX - 20, y + 204);
            r.sub.forEach((s, j) => {
                text(s.name, subX, y + 96 + j * 32, 20, '#a9b6c8', 162);
                ctx.textAlign = 'right'; text(s.display, x + relicWidth - 24, y + 96 + j * 32, 22, '#e4ebf8', 88); ctx.textAlign = 'left';
            });
        });

    }
    get('spec-card-open').addEventListener('click', () => {
        if (typeof isWarping !== 'undefined' && isWarping) return;
        get('spec-card-status').textContent = '';
        render(); get('spec-card-dialog').showModal();
    });
    get('spec-card-close').addEventListener('click', () => get('spec-card-dialog').close());
    get('spec-card-dismiss').addEventListener('click', () => get('spec-card-dialog').close());
    get('spec-card-back').addEventListener('click', showGallery);
    const dialog = get('spec-card-dialog');
    dialog.addEventListener('cancel', event => {
        if (selected) { event.preventDefault(); showGallery(); }
    });
    const isGallerySpace = target => target === dialog || target === get('spec-card-list');
    let pressedOnSpace = false;
    dialog.addEventListener('pointerdown', event => { pressedOnSpace = isGallerySpace(event.target); });
    dialog.addEventListener('click', event => {
        if (pressedOnSpace && isGallerySpace(event.target)) dialog.close();
        pressedOnSpace = false;
    });
    get('spec-card-dialog').addEventListener('close', () => { generation++; get('spec-card-download').disabled = true; });
    get('spec-card-show-uid').addEventListener('change', () => { if (selected) select(selected); });
    get('spec-card-refresh').addEventListener('click', async () => {
        const uid = profile?.uid;
        if (!uid || get('spec-card-refresh').disabled) return;
        get('spec-card-refresh').disabled = true;
        get('spec-card-status').textContent = '게임 공개 프로필을 다시 조회하는 중입니다…';
        try {
            const next = await HonkaiUid.lookup(uid);
            if (HonkaiProfileStorage.id === uid) HonkaiAccount.importUid(next);
        } catch (error) {
            if (HonkaiProfileStorage.id === uid) get('spec-card-status').textContent = `${error.message} 이전 조회 정보를 유지합니다.`;
        } finally { get('spec-card-refresh').disabled = !profile; }
    });
    get('spec-card-download').addEventListener('click', () => {
        if (!selected || get('spec-card-download').disabled) return;
        const token = generation, c = profile.characters.find(c => c.id === selected);
        get('spec-card-canvas').toBlob(blob => {
            if (token !== generation || !get('spec-card-dialog').open) return;
            if (!blob) { get('spec-card-status').textContent = '이미지 저장에 실패했습니다. 다시 시도해 주세요.'; return; }
            const url = URL.createObjectURL(blob), link = document.createElement('a');
            link.href = url; link.download = `스타레일_${nameOf(c).replace(/[\\/:*?"<>|]/g, '_')}_스펙명함.png`;
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }, 'image/png');
    });
    ['honkai-profile-login', 'honkai-documents-changed', 'honkai-account-changed', 'honkai-profile-renamed'].forEach(event => globalThis.addEventListener(event, () => {
        get('spec-card-status').textContent = '';
        render();
    }));
})();
