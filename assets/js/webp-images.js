(() => {
    'use strict';
    // 무손실 WebP가 있는 캐릭터·광추 이미지는 .webp로 바꾸고, 로딩에 실패하면 원본 .png로 한 번 다시 시도한다.
    const manifest = globalThis.HonkaiWebpManifest || {};
    const available = new Map(Object.entries(manifest).map(([folder, ids]) => [folder, new Set(ids)]));
    const pattern = /^(.*assets\/(character-art|lightcone-art|characters|lightcones)\/)([^/]+)\.png$/;

    function toWebp(src) {
        const match = typeof src === 'string' && src.match(pattern);
        return match && available.get(match[2])?.has(match[3]) ? `${match[1]}${match[3]}.webp` : src;
    }
    function pngOf(src) {
        return typeof src === 'string' && /\.webp$/.test(src) ? src.replace(/\.webp$/, '.png') : null;
    }
    function applyToCatalog(items) {
        for (const item of items) {
            item.image = toWebp(item.image);
            if (item.portrait) item.portrait = toWebp(item.portrait);
        }
    }

    // 일반 <img>용 대체 처리. WarpArtwork가 관리하는 이미지(data-artwork)는 자체 흐름에서 처리한다.
    document.addEventListener('error', event => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement) || 'artwork' in image.dataset) return;
        const png = pngOf(image.getAttribute('src'));
        if (!png || image.dataset.webpFallback === png) return;
        image.dataset.webpFallback = png;
        event.stopImmediatePropagation();
        image.src = png;
    }, true);

    globalThis.HonkaiImages = Object.freeze({ toWebp, pngOf, applyToCatalog });
})();
