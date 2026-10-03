const db = [
            // [ 5성 캐릭터 ]
            { name: "펄", rarity: 5, type: "character", isUp: true, image: "assets/characters/1503.png" },
            { name: "웰트", rarity: 5, type: "character", isUp: false, image: "" },
            { name: "은랑", rarity: 5, type: "character", isUp: false, image: "" },
            { name: "브로냐", rarity: 5, type: "character", isUp: false, image: "" },
            { name: "제레", rarity: 5, type: "character", isUp: false, image: "" },
            { name: "블레이드", rarity: 5, type: "character", isUp: false, image: "" },
            { name: "부현", rarity: 5, type: "character", isUp: false, image: "" },
            { name: "운리", rarity: 5, type: "character", isUp: false, image: "" },

            // [ 4성 캐릭터 ]
            { name: "미샤", rarity: 4, type: "character", isUp: true, image: "assets/images/misha.png" },
            { name: "설의", rarity: 4, type: "character", isUp: true, image: "assets/images/xueyi.png" },
            { name: "청작", rarity: 4, type: "character", isUp: true, image: "assets/images/qingque.png" },
            { name: "Mar. 7th", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "단항", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "아를란", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "아스타", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "헤르타", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "나타샤", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "서벌", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "페라", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "삼포", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "후크", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "소상", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "정운", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "어공", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "루카", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "링스", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "계네빈", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "한아", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "갤러거", rarity: 4, type: "character", isUp: false, image: "" },
            { name: "맥택", rarity: 4, type: "character", isUp: false, image: "" },

            // [ 4성 광추 ]
            { name: "수술 후의 대화", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "밤 인사와 잠든 얼굴", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "여생의 첫날", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "침묵만이", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "기억 속 모습", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "두더지파가 환영해", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "「나」의 탄생", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "같은 심정", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "사냥감의 시선", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "랜도의 선택", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "논검", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "행성과의 만남", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "비밀 맹세", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "세상을 진정시키지 마", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "알맞은 타이밍", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "땀방울처럼 빛나는 결심", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "우주 시장 동향", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "팔로우를 부탁해!", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "댄스! 댄스! 댄스!", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "푸른 하늘 아래", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "천재들의 휴식", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "마음에 새긴 약속", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "두 사람의 콘서트", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "끝없는 춤", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "조화가 침묵한 후", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "피어나길 기다리는 꽃", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "그림자처럼 뒤따르는 밤", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "꿈의 몽타주", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "천재들의 안부 인사", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "이야기의 다음 페이지", rarity: 4, type: "lightcone", isUp: false, image: "" },
            { name: "짧은 휴가", rarity: 4, type: "lightcone", isUp: false, image: "" },

            // [ 3성 광추 ]
            { name: "화살촉", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "풍작", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "천경", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "앰버", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "그윽", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "합창", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "아카이브", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "시위를 떠난 화살", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "알찬 열매", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "무너진 행복", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "수비", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "심연의 고리", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "맞물린 톱니", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "영험한 열쇠", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "대립", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "증식", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "전멸", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "강토 개척", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "숨은 그림자", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "어울림", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "식견", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "불타는 그림자", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "추억 회상", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "비웃음", rarity: 3, type: "lightcone", isUp: false, image: "" },
            { name: "눈물의 흔적", rarity: 3, type: "lightcone", isUp: false, image: "" }
        ];

        // 도감 전체 목록은 픽업의 뽑기 대상과 독립적으로 관리한다.
        const lightConesByName = new Map(lightConeCatalog.map(item => [item.name, item]));
        db.forEach(item => {
            if (item.type === 'lightcone') item.image = lightConesByName.get(item.name)?.image || '';
            if (item.type === 'character') {
                const character = characterCatalog.find(entry => entry.name === item.name);
                if (character) {
                    item.id = character.id;
                    item.image = item.image || character.image;
                }
            }
        });
        const collectionItems = [...characterCatalog, ...lightConeCatalog];
        characterCatalog.forEach(item => { item.portrait = `assets/character-art/${item.id}.png`; });
        lightConeCatalog.forEach(item => { item.portrait = item.rarity >= 4 ? `assets/lightcone-art/${item.id}.png` : item.image; });
        db.forEach(item => {
            const entry = item.type === 'character' ? characterCatalog.find(c => c.id === item.id) : lightConesByName.get(item.name);
            if (entry) Object.assign(item, { id: entry.id, portrait: entry.portrait, path: entry.path, pathName: entry.pathName, element: entry.element, elementName: entry.elementName });
        });

        const pool5_up = db.filter(item => item.rarity === 5 && item.isUp);
        const pool5_std = db.filter(item => item.rarity === 5 && !item.isUp);
        const pool4_up = db.filter(item => item.rarity === 4 && item.isUp);
        const pool4_std = db.filter(item => item.rarity === 4 && !item.isUp);
        const pool3 = db.filter(item => item.rarity === 3);

        const pearl = characterCatalog.find(item => item.id === '1503');
        const pearlCone = lightConeCatalog.find(item => item.id === '23055');
        const coneUp4 = ['21000', '21001', '21002'].map(id => lightConeCatalog.find(item => item.id === id));
        const banners = {
            character: { featured: pearl, maxPity: 90, softPity: 73, softStep: .06, base5: .006, base4: .051, rateUp: .5, rateUp4: .5, pool5: ['1003','1004','1101','1104','1107','1209','1211'].map(id=>characterCatalog.find(c=>c.id===id)), pool4Up: pool4_up, pool4: pool4_std },
            lightcone: { featured: pearlCone, maxPity: 80, softPity: 63, softStep: .07, base5: .008, base4: .066, rateUp: .75, rateUp4: .75,
                pool5: ['23000', '23002', '23003', '23004', '23005', '23012', '23013'].map(id => lightConeCatalog.find(item => item.id === id)),
                pool4Up: coneUp4, pool4: db.filter(item => item.rarity === 4 && !coneUp4.some(cone => cone.name === item.name)) }
        };
        banners.character.title = '창해에서 맺은 진주';
        banners.lightcone.title = '세월의 응고';
        const pickupChoices = {
            character: WarpBannerCatalog.characters.map(entry=>({...entry,featured:characterCatalog.find(item=>item.id===entry.id)})).filter(entry=>entry.featured),
            lightcone: WarpBannerCatalog.lightcones.map(entry=>({...entry,featured:lightConeCatalog.find(item=>item.id===entry.id)})).filter(entry=>entry.featured)
        };
        const selectedPickups = {character:'1503',lightcone:'23055'};
        let activeBanner = 'character';
        let activeStateKey = 'character';
        const warpStateKeys = ['character','lightcone','characterCollaboration','lightconeCollaboration'];
        function getBannerStateKey(type) {
            return type + (pickupChoices[type].find(entry=>entry.id===selectedPickups[type])?.collaboration ? 'Collaboration' : '');
        }
        const bannerStates = {
            characterCollaboration: { pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false },
            lightconeCollaboration: { pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false },
            character: { pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false },
            lightcone: { pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false }
        };

        let pity5 = 0; let pity4 = 0;
        let guaranteed5 = false; let guaranteed4 = false;
        let userInventory = {}; 

        let isWarping = false; 
        let revealQueue = [];
        let currentRevealIdx = 0;
        const progressStorageKey = 'warp';
        let warpHistory = { character: [], lightcone: [], characterCollaboration: [], lightconeCollaboration: [] };
        let progressStorageAvailable = true;
        function loadWarpProgress() {
            selectedPickups.character='1503';selectedPickups.lightcone='23055';
            for (const type of warpStateKeys) bannerStates[type] = {pity5:0,pity4:0,guaranteed5:false,guaranteed4:false};
            activeBanner='character';activeStateKey='character';
            pity5=0;pity4=0;guaranteed5=false;guaranteed4=false;
            userInventory={};warpHistory={character:[],lightcone:[],characterCollaboration:[],lightconeCollaboration:[]};historyPage=0;
            progressStorageAvailable=true;
            try {
            const saved = HonkaiWarpApi.enabled ? HonkaiWarpApi.progress : JSON.parse(HonkaiProfileStorage.getItem(progressStorageKey) || 'null');
            if (saved?.version === 1) {
                for (const type of warpStateKeys) {
                    const state = saved.bannerStates?.[type];
                    if (state && Number.isInteger(state.pity5) && state.pity5 >= 0 && state.pity5 < banners[type.replace("Collaboration","")].maxPity && Number.isInteger(state.pity4) && state.pity4 >= 0 && state.pity4 < 10) {
                        bannerStates[type] = { pity5: state.pity5, pity4: state.pity4, guaranteed5: !!state.guaranteed5, guaranteed4: !!state.guaranteed4 };
                    }
                    if (Array.isArray(saved.history?.[type])) {
                        warpHistory[type] = saved.history[type].filter(entry => typeof entry.name === 'string' && [3, 4, 5].includes(entry.rarity) && Number.isFinite(Date.parse(entry.time)));
                    }
                }
                if (saved.inventory && typeof saved.inventory === 'object' && !Array.isArray(saved.inventory)) {
                    userInventory = Object.fromEntries(Object.entries(saved.inventory).filter(([key, value]) => key !== '__proto__' && key !== 'constructor' && Number.isInteger(value) && value > 0).map(([key]) => [key, 1]));
                }
                for(const type of ['character','lightcone'])if(pickupChoices[type].some(entry=>entry.id===saved.selectedPickups?.[type]))selectedPickups[type]=saved.selectedPickups[type];
                activeStateKey=getBannerStateKey(activeBanner);
                ({ pity5, pity4, guaranteed5, guaranteed4 } = bannerStates[activeStateKey]);
            }
            } catch { progressStorageAvailable=false; }
            selectBanner(activeBanner);
        }
        globalThis.addEventListener('honkai-profile-login',loadWarpProgress);
        globalThis.addEventListener('honkai-save-imported',loadWarpProgress);

        function saveWarpProgress() {
            if (!HonkaiProfileStorage.id) return;
            bannerStates[activeStateKey] = { pity5, pity4, guaranteed5, guaranteed4 };
            if (HonkaiWarpApi.enabled) return;
            try {
                HonkaiProfileStorage.setItem(progressStorageKey, JSON.stringify({ version: 1, bannerStates, selectedPickups, history: warpHistory, inventory: userInventory }));
                progressStorageAvailable = true;
            } catch { progressStorageAvailable = false; }
        }

        function getWarpProbabilities() {
            const banner = banners[activeBanner];
            const five = WarpPrepMath.fiveProbability(pity5, banner);
            const four = Math.min(1 - five, pity4 >= 9 ? 1 : banner.base4);
            return { five, four, three: Math.max(0, 1 - five - four) };
        }

        let detailsTab = 'rates';
        const historyPageSize = 10;
        let historyPage = 0;
        let detailsPreviousFocus = null;
        function openWarpDetails() {
            if (isWarping) return;
            detailsPreviousFocus = document.activeElement;
            document.getElementById('warp-details-heading').textContent = banners[activeBanner].title;
            document.getElementById('warp-details').style.display = 'flex';
            historyPage = 0;
            selectWarpDetailsTab('rates');
            document.getElementById('warp-details-close').focus();
        }
        function closeWarpDetails() {
            document.getElementById('warp-details').style.display = 'none';
            detailsPreviousFocus?.focus();
        }
        function selectWarpDetailsTab(tab) {
            if (!['rates', 'history'].includes(tab)) return;
            detailsTab = tab;
            for (const type of ['rates', 'history']) document.getElementById(`warp-tab-${type}`).setAttribute('aria-selected', String(type === tab));
            document.getElementById('warp-details-content').setAttribute('aria-labelledby', `warp-tab-${tab}`);
            renderWarpDetails();
        }
        function changeHistoryPage(delta) {
            const pages = Math.max(1, Math.ceil(warpHistory[activeStateKey].length / historyPageSize));
            historyPage = Math.max(0, Math.min(pages - 1, historyPage + delta));
            renderWarpDetails();
        }
        function renderWarpDetails() {
            const container = document.getElementById('warp-details-content');
            const banner = banners[activeBanner];
            const percent = value => `${(value * 100).toFixed(2)}%`;
            if (detailsTab === 'rates') {
                const probability = getWarpProbabilities();
                container.innerHTML = `<p class="warp-details-note">이 시뮬레이터에 적용된 확률입니다. 현재 천장 진행도에 따라 다음 워프의 확률이 달라집니다.</p>
                    <table class="warp-details-table"><thead><tr><th scope="col">등급</th><th scope="col">기본 확률</th><th scope="col">다음 워프 확률</th></tr></thead><tbody>
                    <tr><td>★5</td><td>${percent(banner.base5)}</td><td>${percent(probability.five)}</td></tr>
                    <tr><td>★4</td><td>${percent(banner.base4)}</td><td>${percent(probability.four)}</td></tr>
                    <tr><td>★3</td><td>${percent(1 - banner.base5 - banner.base4)}</td><td>${percent(probability.three)}</td></tr></tbody></table>
                    <h3 class="warp-details-title">픽업 및 천장 안내</h3>
                    <p class="warp-details-note">★5 획득 시 「${escapeHTML(banner.featured.name)}」 픽업 확률: ${percent(guaranteed5 ? 1 : banner.rateUp)}<br>
                    ★4 획득 시 픽업 대상 확률: ${banner.collaboration ? '픽업 없음' : percent(guaranteed4 ? 1 : banner.rateUp4)}<br>
                    픽업 대상이 나오지 않으면 다음 같은 등급 획득 시 픽업 대상이 확정됩니다.<br>
                    ★5: 최대 ${banner.maxPity}회 확정 · 현재 ${pity5}회<br>★4 이상: 최대 10회 확정 · 현재 ${pity4}회<br>
                    ★5 확률은 ${banner.softPity + 1}번째 워프부터 회당 ${(banner.softStep * 100).toFixed(0)}%p씩 증가합니다.<br>
                    캐릭터와 광추의 천장·확정 상태는 각각 유지되며, 콜라보는 이벤트 워프와 따로 계산합니다.</p>
                    <h3 class="warp-details-title">픽업 대상</h3><p class="warp-details-note">★5: ${escapeHTML(banner.featured.name)}<br>★4: ${banner.pool4Up.map(item => escapeHTML(item.name)).join(' · ') || '픽업 없음'}</p>
                    <h3 class="warp-details-title">픽업 외 ★5 대상</h3><p class="warp-details-note">${banner.pool5.map(item => escapeHTML(item.name)).join(' · ')}</p>`;
            } else {
                const records = warpHistory[activeStateKey];
                const pages = Math.max(1, Math.ceil(records.length / historyPageSize));
                historyPage = Math.min(historyPage, pages - 1);
                const entries = records.slice().reverse().slice(historyPage * historyPageSize, (historyPage + 1) * historyPageSize);
                const rows = entries.map((entry, index) => {
                    const date = new Date(entry.time).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    return `<tr><td>${records.length - historyPage * historyPageSize - index}</td><td><span class="text-${entry.rarity}star">${escapeHTML(entry.name)}</span>${entry.featured ? ' <small>UP</small>' : ''}${entry.bannerTitle ? '<small class="warp-history-banner">'+escapeHTML([...pickupChoices.character,...pickupChoices.lightcone].find(choice=>choice.id===entry.bannerId)?.title || entry.bannerTitle)+'</small>' : ''}</td><td>★${entry.rarity}</td><td class="warp-history-time">${escapeHTML(date)}</td></tr>`;
                }).join('');
                container.innerHTML = `<p class="warp-details-note">${escapeHTML(banner.title)} · 총 ${records.length}회<br>이 브라우저에서 진행한 기록을 최신순으로 표시합니다.${progressStorageAvailable ? '' : '<br>기록을 저장할 수 없어 이 페이지를 닫으면 사라집니다.'}</p>` + (entries.length ?
                    `<table class="warp-details-table"><thead><tr><th scope="col">회차</th><th scope="col">획득 항목</th><th scope="col">등급</th><th scope="col">시간 (한국)</th></tr></thead><tbody>${rows}</tbody></table>
                    <div class="warp-history-pagination"><button data-action="history-page" data-step="-1" ${historyPage === 0 ? 'disabled' : ''}>이전</button><span>${historyPage + 1} / ${pages}</span><button data-action="history-page" data-step="1" ${historyPage === pages - 1 ? 'disabled' : ''}>다음</button></div>` : '<p class="collection-empty">아직 워프 기록이 없습니다.</p>');
            }
            container.scrollTop = 0;
        }
        document.addEventListener('keydown', event => {
            const modal = document.getElementById('warp-details');
            if (modal.style.display !== 'flex') return;
            if (event.key === 'Escape') { closeWarpDetails(); return; }
            if (event.key === 'Tab') {
                const targets = [...modal.querySelectorAll('button:not([disabled]), [tabindex="0"]')];
                const first = targets[0], last = targets[targets.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });

        function escapeHTML(value) {
            return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
        }

        function choosePickup(id) {
            if(isWarping || !pickupChoices[activeBanner].some(entry=>entry.id===id))return;
            selectedPickups[activeBanner]=id;
            selectBanner(activeBanner);saveWarpProgress();
            if (HonkaiWarpApi.enabled) HonkaiWarpApi.saveSelection(selectedPickups).catch(error => console.warn('픽업 선택 저장 실패', error));
            closeBannerPicker();
        }
        function updateLobbyPickups() {
            for (const type of ['character','lightcone']) {
                const choice = pickupChoices[type].find(entry=>entry.id===selectedPickups[type]) || pickupChoices[type][0];
                const item = choice.featured;
                const art = document.getElementById(`lobby-art-${type}`);
                WarpArtwork.setSource(art, item);
                art.alt = item.name;
                const kind = type === 'character' ? '캐릭터' : '광추';
                const warpName = `${kind} ${choice.collaboration ? '콜라보' : '이벤트'} 워프`;
                document.getElementById(`lobby-pickup-${type}`).setAttribute('aria-label', `${item.name} · ${choice.title} ${kind} 픽업 입장`);
                document.getElementById(`lobby-title-${type}`).textContent = `${choice.title} ↗`;
                document.getElementById(`lobby-tag-${type}`).textContent = warpName;
                const detail = type === 'character' ? [item.pathName,item.elementName].filter(Boolean).join(' · ') : '';
                document.getElementById(`lobby-description-${type}`).innerHTML = `★5 ${escapeHTML(item.name)}${detail ? ' · '+escapeHTML(detail) : ''}<br>${escapeHTML(warpName)}`;
            }
        }
        function openBannerPicker() {
            if (isWarping) return;
            document.getElementById('warp-banner-dialog-title').textContent = activeBanner === 'character' ? '캐릭터 픽업 선택' : '광추 픽업 선택';
            document.getElementById('warp-banner-search').value = '';
            renderBannerChoices();
            document.getElementById('warp-banner-dialog').showModal();
        }
        function closeBannerPicker() {
            const dialog = document.getElementById('warp-banner-dialog');
            if (dialog.open) {
                dialog.close();
                document.getElementById('warp-banner-select').focus();
            }
        }
        function renderBannerChoices(query = '') {
            const term = query.trim().toLocaleLowerCase('ko-KR');
            const choices = pickupChoices[activeBanner].filter(entry=>`${entry.featured.name} ${entry.title}`.toLocaleLowerCase('ko-KR').includes(term));
            document.getElementById('warp-banner-count').textContent = `${choices.length}개 배너 · 이미지를 눌러 선택하세요`;
            document.getElementById('warp-banner-grid').innerHTML = choices.length ? choices.map(entry=>{
                const selected = entry.id === selectedPickups[activeBanner];
                return `<button type="button" class="warp-banner-choice${activeBanner==='lightcone' ? ' cone' : ''}" aria-pressed="${selected}" data-action="choose-pickup" data-id="${escapeHTML(entry.id)}"><div class="warp-banner-choice-art"><img src="${escapeHTML(entry.featured.image)}" alt="" loading="lazy" decoding="async"><span>${selected ? '선택 중' : entry.collaboration ? '콜라보' : '★5 한정'}</span></div><strong>${escapeHTML(entry.featured.name)}</strong><small>${escapeHTML(entry.title)}</small></button>`;
            }).join('') : '<p class="warp-banner-empty">검색 결과가 없습니다.</p>';
        }
        function selectBanner(type) {
            if (isWarping || !banners[type]) return;
            closeBannerPicker();
            bannerStates[activeStateKey] = { pity5, pity4, guaranteed5, guaranteed4 };
            activeBanner = type;
            activeStateKey=getBannerStateKey(type);
            ({ pity5, pity4, guaranteed5, guaranteed4 } = bannerStates[activeStateKey]);
            const banner = banners[type];
            const choice=pickupChoices[type].find(entry=>entry.id===selectedPickups[type])||pickupChoices[type][0];
            banner.featured=choice.featured;banner.title=choice.title;banner.collaboration=!!choice.collaboration;
            const catalog=type==='character' ? characterCatalog : lightConeCatalog;
            const chosen4=(choice.up4||[]).map(id=>catalog.find(entry=>entry.id===id)).filter(entry=>entry?.rarity===4);
            banner.pool4Up=choice.collaboration ? [] : (chosen4.length ? chosen4 : (type==='character' ? pool4_up : coneUp4));
            banner.pool4=db.filter(entry=>entry.rarity===4&&!banner.pool4Up.some(up=>up.id===entry.id));
            const picker=document.getElementById('warp-banner-select');
            picker.innerHTML=`<img src="${escapeHTML(choice.featured.image)}" alt=""><span><strong id="warp-banner-current-name">${escapeHTML(choice.featured.name)}</strong><small>${escapeHTML(choice.title)}</small></span><span aria-hidden="true">▦</span>`;
            for(const tabType of ['character','lightcone'])document.getElementById(`warp-type-${tabType}`).setAttribute('aria-selected',String(tabType===type));
            const item = banner.featured;
            const isCone = type === 'lightcone';
            document.getElementById('warp-pickup-label').textContent = banner.title;
            const art = document.getElementById('warp-banner-art');
            WarpArtwork.setSource(art, item);
            art.alt = `${item.name} 일러스트`;
            art.className = `warp-art${isCone ? ' lightcone-art' : ''}`;
            document.getElementById('warp-banner-tag').textContent = `${isCone ? '광추' : '캐릭터'} ${choice.collaboration ? '콜라보' : '이벤트'} 워프`;
            document.getElementById('warp-banner-title').textContent = banner.title;
            document.getElementById('warp-banner-subtitle').innerHTML = `★5 ${isCone ? '광추' : '캐릭터'} 「${escapeHTML(item.name)}」<br><span class="warp-rate">출현 확률 UP!</span>`;
            document.getElementById('warp-banner-name').textContent = `✧ ${item.name}`;
            const pathName=item.pathName||characterCatalog.find(c=>c.path===item.path)?.pathName||item.path;
            document.getElementById('warp-banner-path').textContent = isCone ? `${pathName} / 한정 광추` : `${pathName} / ${item.elementName}`;
            document.getElementById('warp-banner-note').innerHTML = `이벤트 기간 한정 ${isCone ? '광추' : '캐릭터'} 확률 증가<br>10회 워프 시 ★4 이상의 캐릭터 또는 광추 확정`;
            document.getElementById('warp-banner-note').innerHTML += choice.collaboration ? '<br>콜라보 전용 천장 · ★4 픽업 없음' : '<br>같은 종류의 이벤트 워프끼리 천장 공유';
            const featured = document.getElementById('warp-banner-featured');
            featured.className = `warp-featured${isCone ? ' cones' : ''}`;
            featured.setAttribute('aria-label', '4성 픽업 ' + (isCone ? '광추' : '캐릭터'));
            featured.innerHTML = banner.pool4Up.map(entry => `<div class="warp-portrait"><img src="${entry.image}" alt="${escapeHTML(entry.name)}"><span>${escapeHTML(entry.name)}</span></div>`).join('');
            updateLobbyPickups();
            updateUI();
        }

        function createIllustration(item) {
            const content = document.createElement('div');
            content.className = `illustration ${item.type} text-${item.rarity}star`;
            const detail = item.type === 'character' ? [item.pathName, item.elementName].filter(Boolean).join(' · ') : '광추';
            content.innerHTML = `<img class="illustration-img" alt="${escapeHTML(item.name)} 일러스트"><p class="illustration-loading" role="status"></p><div class="illustration-info"><div class="illustration-stars">${'★'.repeat(item.rarity)}</div><h2>${escapeHTML(item.name)}</h2><p>${escapeHTML(detail)}</p></div>`;
            WarpArtwork.setSource(content.querySelector('img'), item, { status: content.querySelector('.illustration-loading') });
            return content;
        }

        let viewerPreviousFocus = null;
        function openCollectionItem(type, id) {
            const item = collectionItems.find(entry => entry.type === type && entry.id === id);
            if (!item) return;
            viewerPreviousFocus = document.activeElement;
            const container = document.getElementById('art-viewer-content');
            container.replaceChildren(createIllustration(item));
            document.getElementById('art-viewer').style.display = 'flex';
            document.getElementById('art-viewer-close').focus();
        }
        function closeArtViewer() {
            document.getElementById('art-viewer').style.display = 'none';
            document.getElementById('art-viewer-content').replaceChildren();
            viewerPreviousFocus?.focus();
        }
        document.addEventListener('keydown', event => {
            if (document.getElementById('art-viewer').style.display !== 'flex') return;
            if (event.key === 'Escape') closeArtViewer();
            if (event.key === 'Tab') { event.preventDefault(); document.getElementById('art-viewer-close').focus(); }
        });

        const DOM = {
            lobby: document.getElementById('lobby-screen'), // 추가됨
            warp: document.getElementById('warp-screen'),   // main에서 warp로 변경
            anim: document.getElementById('anim-screen'),
            singleScreen: document.getElementById('single-reveal-screen'),
            singleContainer: document.getElementById('single-card-container'),
            result: document.getElementById('result-screen'),
            cards: document.getElementById('cards-container'),
            pity5Text: document.getElementById('ui-pity5'),
            pity4Text: document.getElementById('ui-pity4'),
            g5Text: document.getElementById('ui-guaranteed5'),
            g4Text: document.getElementById('ui-guaranteed4'),
            colModal: document.getElementById('collection-modal'),
            skipBtn: document.getElementById('skip-btn')
        };

        // 화면 전환 로직
        function goToWarpScreen(type = 'character') {
            if (isWarping || !banners[type]) return;
            selectBanner(type);
            DOM.lobby.style.opacity = '0';
            setTimeout(() => {
                DOM.lobby.style.display = 'none';
                DOM.warp.style.display = 'flex';
                setTimeout(() => { DOM.warp.style.opacity = '1'; }, 20);
            }, 400);
        }

        function goToLobby() {
            if (isWarping) return; // 워프 진행 중엔 못 나감
            closeBannerPicker();
            DOM.warp.style.opacity = '0';
            setTimeout(() => {
                DOM.warp.style.display = 'none';
                DOM.lobby.style.display = 'flex';
                setTimeout(() => { DOM.lobby.style.opacity = '1'; }, 20);
            }, 400);
        }

        function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        function pullSingle() {
            const banner = banners[activeBanner];
            const { five: prob5, four: prob4 } = getWarpProbabilities();

            let r = Math.random();
            let finalItem = null;

            if (r < prob5) {
                pity5 = 0; pity4 = 0;
                if (guaranteed5 || Math.random() < banner.rateUp) {
                    finalItem = banner.featured;
                    guaranteed5 = false;
                } else {
                    finalItem = getRandom(banner.pool5);
                    guaranteed5 = true;
                }
            } 
            else if (r < prob5 + prob4 || pity4 >= 9) {
                pity5++; pity4 = 0;
                if (banner.collaboration) {
                    finalItem = getRandom(banner.pool4);
                    guaranteed4 = false;
                } else if (guaranteed4 || Math.random() < banner.rateUp4) {
                    finalItem = getRandom(banner.pool4Up);
                    guaranteed4 = false;
                } else {
                    finalItem = getRandom(banner.pool4);
                    guaranteed4 = true;
                }
            } 
            else {
                pity5++; pity4++;
                finalItem = getRandom(pool3);
            }

            warpHistory[activeStateKey].push({ bannerId: banner.featured.id, bannerTitle: banner.title, name: finalItem.name, rarity: finalItem.rarity, type: finalItem.type, featured: finalItem.rarity === 5 ? finalItem.name === banner.featured.name : banner.pool4Up.some(item => item.name === finalItem.name), time: new Date().toISOString() });
            saveWarpProgress();

            return finalItem;
        }

        function updateUI() {
            document.getElementById('ui-pity5-limit').textContent = `/ ${banners[activeBanner].maxPity}`;
            DOM.pity5Text.innerText = pity5;
            DOM.pity4Text.innerText = pity4;
            DOM.g5Text.style.opacity = guaranteed5 ? '1' : '0';
            DOM.g4Text.style.opacity = guaranteed4 ? '1' : '0';
        }

        async function doWarp(count) {
            if (!HonkaiProfileStorage.id) return;
            if (isWarping) return;
            if (![1, 10].includes(count)) return;
            isWarping = true;
            document.getElementById('warp-banner-select').disabled=true;
            document.getElementById('warp-type-character').disabled=true;
            document.getElementById('warp-type-lightcone').disabled=true;

            let results = [];
            let maxRarity = 3;

            if (HonkaiWarpApi.enabled) {
                try {
                    const response = await HonkaiWarpApi.pull(`${activeBanner}:${selectedPickups[activeBanner]}`, count, activeStateKey);
                    activeStateKey = response.pityGroup;
                    bannerStates[activeStateKey] = { ...response.state };
                    ({ pity5, pity4, guaranteed5, guaranteed4 } = response.state);
                    const knownIds = new Set(warpHistory[activeStateKey].map(entry => entry.historyId).filter(Boolean));
                    warpHistory[activeStateKey].push(...response.results.filter(entry => !knownIds.has(entry.historyId)));
                    results = response.results.map(record => {
                        const item = collectionItems.find(entry => entry.type === record.type && entry.id === record.id);
                        if (!item) throw new Error('서버와 사이트의 캐릭터 데이터 버전이 다릅니다. 새로고침해 주세요.');
                        return item;
                    });
                    maxRarity = Math.max(...results.map(item => item.rarity));
                } catch (error) {
                    isWarping = false;
                    for (const id of ['warp-banner-select', 'warp-type-character', 'warp-type-lightcone']) document.getElementById(id).disabled = false;
                    alert(error.status === 409 ? '다른 탭에서 기록이 변경되었습니다. 서버 기록을 다시 불러옵니다.' : `${error.message || '서버 연결 실패'}\n다시 뽑기 버튼을 누르면 미확인 요청을 재시도합니다.`);
                    if ([400, 409].includes(error.status)) loadWarpProgress();
                    return;
                }
            } else {
                for (let i = 0; i < count; i++) {
                    let item = pullSingle();
                    results.push(item);
                    if (item.rarity > maxRarity) maxRarity = item.rarity;
                }
            }

            revealQueue = results;
            WarpAudio.preloadVoices(results);
            WarpPathReveal.preload(results);
            // Preload one illustration instead of decoding ten large PNGs at once.
            WarpArtwork.preload(results);
            playAnimation(maxRarity);
        }

        function playAnimation(maxRarity) {
            DOM.warp.style.opacity = '0';
            DOM.warp.style.pointerEvents = 'none';
            DOM.skipBtn.style.display = 'block';
            DOM.anim.style.display = 'flex';
            try {
                if (!globalThis.WarpCinematic) throw new Error('Warp cinematic unavailable');
                WarpCinematic.start({rarity:maxRarity, count:revealQueue.length, featured:revealQueue.find(item=>item.rarity===5), onComplete:()=>{
                    startRevealSequence();
                }});
            } catch (error) {
                console.warn('워프 연출을 사용할 수 없어 결과를 바로 표시합니다.', error);
                globalThis.WarpCinematic?.stop();
                DOM.anim.style.display = 'none';
                startRevealSequence();
            }
        }

        function handleSkip() {
            if (!isWarping) return;
            WarpPathReveal.stop();
            WarpCinematic.stop();

            DOM.anim.style.display = 'none';
            DOM.singleScreen.style.opacity = '0';
            DOM.singleScreen.style.display = 'none';
            
            updateUI(); // 스킵 시 천장 적용
            
            if (revealQueue.length === 1) {
                currentRevealIdx = 0;
                DOM.singleScreen.style.display = 'flex';
            DOM.singleScreen.focus();
            setTimeout(() => { DOM.singleScreen.style.opacity = '1'; }, 10);
                nextReveal();
            } else {
                showFinalSummary(revealQueue);
            }
            
            DOM.skipBtn.style.display = 'none'; 
        }

        function startRevealSequence() {
            updateUI(); 
            currentRevealIdx = 0;
            
            DOM.warp.style.opacity = '0';
            DOM.warp.style.pointerEvents = 'none';
            
            DOM.singleScreen.style.display = 'flex';
            DOM.singleScreen.focus();
            setTimeout(() => { DOM.singleScreen.style.opacity = '1'; }, 10);
            
            nextReveal();
        }

        function nextReveal() {
            if (WarpPathReveal.finish()) return;
            WarpAudio.stopVoice();
            if (currentRevealIdx < revealQueue.length) {
                let item = revealQueue[currentRevealIdx];
                DOM.singleContainer.innerHTML = ''; 
                
                let card = document.createElement('div');
                let borderClass = item.rarity === 5 ? 'border-5star' : (item.rarity === 4 ? 'border-4star' : 'border-3star');
                let textClass = item.rarity === 5 ? 'text-5star' : (item.rarity === 4 ? 'text-4star' : 'text-3star');
                let starsHTML = `<span class="${textClass}">✦</span>`.repeat(item.rarity);
                
                card.className = `gacha-card single-reveal-card ${borderClass}`;
                let imgDiv = item.image ? `<div class="card-img-bg" style="background-image: url('${item.image}');"></div>` : '';
                
                card.innerHTML = `
                    ${imgDiv}
                    <div class="card-overlay"></div>
                    <div class="card-content">
                        <div class="stars-disp">${starsHTML}</div>
                        <div class="card-name ${textClass}">${item.name}</div>
                    </div>
                `;
                
                if (item.rarity >= 4) card = createIllustration(item);

                
                let bgGradient = 'rgba(0,0,0,0.9)';
                if (item.rarity === 5) bgGradient = 'radial-gradient(circle, rgba(255,204,102,0.15) 0%, rgba(0,0,0,0.9) 70%)';
                else if (item.rarity === 4) bgGradient = 'radial-gradient(circle, rgba(199,118,255,0.15) 0%, rgba(0,0,0,0.9) 70%)';
                DOM.singleScreen.style.background = bgGradient;

                const revealArtwork = () => {
                    DOM.singleContainer.appendChild(card);
                    card.classList.add('warp-reveal-enter');
                    if (item.type === 'character' && item.rarity === 5 && !document.hidden) WarpAudio.speak(item);
                };
                if (item.rarity === 5) {
                    WarpPathReveal.show({item, container: DOM.singleContainer, onReveal: revealArtwork});
                } else revealArtwork();
                
                currentRevealIdx++;
            } else {
                DOM.singleScreen.style.opacity = '0';
                DOM.skipBtn.style.display = 'none'; 

                setTimeout(() => {
                    DOM.singleScreen.style.display = 'none';
                    DOM.singleScreen.style.background = 'rgba(0,0,0,0.9)'; 
                    
                    if (revealQueue.length === 1) resetToWarp();
                    else showFinalSummary(revealQueue);
                }, 300);
            }
        }

        function showFinalSummary(results) {
            WarpPathReveal.stop();
            WarpAudio.stopVoice();
            DOM.cards.innerHTML = '';
            
            let sortedResults = [...results].sort((a, b) => b.rarity - a.rarity);

            sortedResults.forEach((item, idx) => {
                let card = document.createElement('div');
                let borderClass = item.rarity === 5 ? 'border-5star' : (item.rarity === 4 ? 'border-4star' : 'border-3star');
                let textClass = item.rarity === 5 ? 'text-5star' : (item.rarity === 4 ? 'text-4star' : 'text-3star');
                let starsHTML = `<span class="${textClass}">✦</span>`.repeat(item.rarity);
                
                card.className = `gacha-card summary-card ${borderClass}`;
                let imgDiv = item.image ? `<div class="card-img-bg" style="background-image: url('${item.image}');"></div>` : '';
                
                card.innerHTML = `
                    ${imgDiv}
                    <div class="card-overlay"></div>
                    <div class="card-content">
                        <div class="stars-disp">${starsHTML}</div>
                        <div class="card-name ${textClass}">${item.name}</div>
                    </div>
                `;
                DOM.cards.appendChild(card);
                setTimeout(() => { card.classList.add('reveal'); }, 50 + (idx * 50));
            });

            DOM.result.style.display = 'flex';
            setTimeout(() => { DOM.result.style.opacity = '1'; }, 50);
        }

        function resetToWarp() {
            WarpPathReveal.stop();
            WarpCinematic.stop();
            DOM.result.style.opacity = '0';
            setTimeout(() => {
                DOM.result.style.display = 'none';
                DOM.cards.innerHTML = '';
                DOM.singleContainer.innerHTML = '';
                
                DOM.warp.style.pointerEvents = 'auto';
                DOM.warp.style.display = 'flex'; // 확실히 flex로 복원
                DOM.warp.style.opacity = '1';
                
                isWarping = false; 
                document.getElementById('warp-banner-select').disabled=false;
                document.getElementById('warp-type-character').disabled=false;
                document.getElementById('warp-type-lightcone').disabled=false;
            }, 400);
        }

        let currentTab = 'character';
        function openCollection() {
            DOM.colModal.style.display = 'flex';
            setTimeout(() => { DOM.colModal.style.opacity = '1'; }, 10);
            renderCollection();
        }
        function closeCollection() {
            DOM.colModal.style.opacity = '0';
            setTimeout(() => { DOM.colModal.style.display = 'none'; }, 300);
        }
        function switchTab(tabType) {
            for (const kind of ['character', 'lightcone']) document.getElementById('tab-' + kind).setAttribute('aria-selected', String(kind === tabType));
            currentTab = tabType;
            document.getElementById('collection-search').value = '';
            document.getElementById('collection-rarity').value = 'all';
            if (tabType === 'character') {
                document.getElementById('tab-character').classList.add('active');
                document.getElementById('tab-lightcone').classList.remove('active');
            } else {
                document.getElementById('tab-character').classList.remove('active');
                document.getElementById('tab-lightcone').classList.add('active');
            }
            renderCollection();
        }
        function generateGridHTML(rarity, type, filteredItems = collectionItems) {
            const items = filteredItems.filter(i => i.rarity === rarity && i.type === type);
            if (items.length === 0) return ''; 

            let titleColor = rarity === 5 ? 'text-yellow-400 border-yellow-800' : (rarity === 4 ? 'text-purple-400 border-purple-800' : 'text-blue-400 border-blue-800');
            let html = `<div class="rarity-header ${titleColor}">${rarity}성 ${type === 'character' ? '캐릭터' : '광추'}</div><div class="col-grid${type === 'character' ? ' col-grid-character' : ''}">`;

            items.forEach(item => {
                const stateClass = `unlocked rarity-${rarity}`;
                const bgStyle = item.image ? `background-image: url('${item.image}'); background-size: cover; background-position: center;` : `background: linear-gradient(135deg, #1e293b, #0f172a);`;
                let nameColor = rarity === 5 ? 'text-yellow-400' : (rarity === 4 ? 'text-purple-300' : 'text-blue-200');

                const detailHTML = item.type === 'character' ? `<span class="col-item-detail">${item.pathName} · ${item.elementName}</span>` : '';
                html += `<article class="collection-entry"><button type="button" class="col-item ${stateClass}" style="${bgStyle}" data-action="collection-item" data-type="${escapeHTML(item.type)}" data-id="${escapeHTML(item.id)}" aria-label="${escapeHTML(item.name)} 일러스트 확대"><div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 60%); z-index: 3;"></div><div class="col-item-name ${nameColor}">${escapeHTML(item.name)}${detailHTML}</div></button></article>`;
            });
            return html + `</div>`;
        }
        function renderCollection() {
            const query = document.getElementById('collection-search').value.trim().toLocaleLowerCase();
            const rarity = document.getElementById('collection-rarity').value;
            const allItems = collectionItems.filter(item => item.type === currentTab);
            const items = allItems.filter(item => `${item.name} ${item.pathName || ''} ${item.elementName || ''}`.toLocaleLowerCase().includes(query) && (rarity === 'all' || item.rarity === Number(rarity)));
            document.getElementById('collection-count').textContent = `${items.length} / ${allItems.length}종`;
            let finalHTML = generateGridHTML(5, currentTab, items) + generateGridHTML(4, currentTab, items) + generateGridHTML(3, currentTab, items);
            if (!items.length) finalHTML = '<p class="collection-empty">검색 결과가 없습니다.</p>';
            document.getElementById('collection-render-area').innerHTML = finalHTML;
        }

        // 앱 초기 구동 시 UI 렌더링
        selectBanner('character');
        saveWarpProgress();
