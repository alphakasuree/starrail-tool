(() => {
    'use strict';
    const root = document.documentElement;
    // Match the existing large-monitor composition; keep this reference in one place.
    const reference = {width: 2560, height: 1440};
    const desktop = globalThis.matchMedia('(min-width: 1024px) and (min-height: 560px)');
    let frame = 0;
    function update() {
        frame = 0;
        if (!desktop.matches) {
            delete root.dataset.scaledViewport;
            for (const name of ['--ui-scale', '--ui-vw', '--ui-vh', '--ui-dvh', '--ui-left', '--ui-top']) root.style.removeProperty(name);
            return;
        }
        const width = globalThis.innerWidth, height = globalThis.innerHeight;
        const scale = Math.min(width / reference.width, height / reference.height);
        root.style.setProperty('--ui-scale', String(scale));
        // Keep one uniform UI scale, but let the canvas fill the entire viewport.
        root.style.setProperty('--ui-vw', `${width / scale / 100}px`);
        root.style.setProperty('--ui-vh', `${height / scale / 100}px`);
        root.style.setProperty('--ui-dvh', `${height / scale / 100}px`);
        root.style.setProperty('--ui-left', '0px');
        root.style.setProperty('--ui-top', '0px');
        root.dataset.scaledViewport = 'true';
    }
    function schedule() {
        if (!frame) frame = globalThis.requestAnimationFrame(update);
    }
    globalThis.addEventListener('resize', schedule);
    desktop.addEventListener('change', schedule);
    update();
})();
