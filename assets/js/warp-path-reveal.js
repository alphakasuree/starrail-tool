(() => {
    'use strict';
    const paths = {
        Knight: ['Preservation', '보존'], Rogue: ['Hunt', '수렵'],
        Mage: ['Erudition', '지식'], Warlock: ['Nihility', '공허'],
        Warrior: ['Destruction', '파멸'], Shaman: ['Harmony', '화합'],
        Priest: ['Abundance', '풍요'], Memory: ['Remembrance', '기억'],
        Elation: ['Elation', '환락']
    };
    let timer = 0, overlay = null, pending = null;
    function stop() {
        clearTimeout(timer); timer = 0; pending = null;
        overlay?.remove(); overlay = null;
    }
    function finish() {
        if (!pending) return false;
        const reveal = pending;
        stop(); reveal(); return true;
    }
    function preload(items) {
        for (const item of items) {
            const path = paths[item.path];
            if (item.rarity === 5 && path) {
                const image = new Image(); image.src = `assets/paths/${path[0]}.png`;
            }
        }
    }
    function show({item, container, onReveal}) {
        stop();
        const path = paths[item.path];
        if (!path || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { onReveal(); return; }
        overlay = document.createElement('div');
        overlay.className = 'warp-path-intro';
        overlay.setAttribute('role', 'status');
        const halo = document.createElement('div'); halo.className = 'warp-path-halo';
        const icon = document.createElement('img');
        icon.src = `assets/paths/${path[0]}.png`; icon.alt = ''; icon.className = 'warp-path-icon';
        const label = document.createElement('small'); label.textContent = '운명의 길';
        const name = document.createElement('strong'); name.textContent = item.pathName || path[1];
        overlay.append(halo, icon, label, name); container.appendChild(overlay);
        pending = onReveal;
        timer = setTimeout(finish, 1450);
    }
    globalThis.WarpPathReveal = Object.freeze({show, stop, finish, preload});
})();
