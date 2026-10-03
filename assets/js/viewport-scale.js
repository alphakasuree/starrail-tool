(() => {
    'use strict';
    const root = document.documentElement;
    // Only visual scenes consume these logical units. Tools use native viewport units.
    const reference = {width: 2560, height: 1440};
    const desktop = globalThis.matchMedia('(min-width: 1024px) and (min-height: 560px)');
    let frame = 0;
    function update() {
        frame = 0;
        if (!desktop.matches) {
            delete root.dataset.scaledViewport;
            for (const name of ['--ui-scale', '--scene-vw', '--scene-vh', '--scene-dvh']) root.style.removeProperty(name);
            return;
        }
        const width = globalThis.innerWidth, height = globalThis.innerHeight;
        const scale = Math.min(width / reference.width, height / reference.height);
        root.style.setProperty('--ui-scale', String(scale));
        root.style.setProperty('--scene-vw', `${width / scale / 100}px`);
        root.style.setProperty('--scene-vh', `${height / scale / 100}px`);
        root.style.setProperty('--scene-dvh', `${height / scale / 100}px`);
        root.dataset.scaledViewport = 'true';
    }
    function schedule() {
        if (!frame) frame = globalThis.requestAnimationFrame(update);
    }
    globalThis.addEventListener('resize', schedule);
    desktop.addEventListener('change', schedule);
    update();
})();
