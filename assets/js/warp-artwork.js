(() => {
    'use strict';
    const cleanups = new WeakMap();
    function setSource(image, item, { status = null } = {}) {
        cleanups.get(image)?.();
        const primary = item.portrait || item.image;
        const preview = item.image && item.image !== primary ? item.image : null;
        let timer = 0, usingPreview = false, finished = false;
        const message = text => { if (status) status.textContent = text; };
        const cleanup = () => {
            clearTimeout(timer);
            image.onload = null;
            image.onerror = null;
        };
        const unavailable = () => {
            finished = true;
            cleanup();
            image.dataset.artwork = 'unavailable';
            message('이미지를 불러오지 못했습니다. 연결을 확인한 뒤 다시 열어 주세요.');
        };
        const fallback = () => {
            if (finished) return;
            clearTimeout(timer);
            if (preview && !usingPreview) {
                usingPreview = true;
                image.dataset.artwork = 'preview';
                message('미리보기를 불러오는 중입니다…');
                image.src = preview;
                timer = setTimeout(unavailable, 8000);
            } else unavailable();
        };
        image.decoding = 'async';
        image.dataset.artwork = 'loading';
        message('일러스트를 불러오는 중입니다…');
        image.onload = () => {
            finished = true;
            cleanup();
            image.dataset.artwork = usingPreview ? 'preview' : 'loaded';
            message(usingPreview ? '전체 일러스트 대신 미리보기로 표시합니다.' : '');
        };
        image.onerror = fallback;
        cleanups.set(image, cleanup);
        if (!primary) { unavailable(); return; }
        timer = setTimeout(fallback, 8000);
        image.src = primary;
    }
    function preload(items) {
        const item = items.find(entry => entry.rarity >= 4);
        if (!item) return;
        const image = new Image();
        image.decoding = 'async';
        image.src = item.portrait || item.image;
    }
    globalThis.WarpArtwork = Object.freeze({ setSource, preload });
})();
