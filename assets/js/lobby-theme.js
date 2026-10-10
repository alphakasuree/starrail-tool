(() => {
    'use strict';
    const lobby = document.getElementById('lobby-screen');
    const art = document.getElementById('lobby-art-character');
    if (!lobby?.classList.contains('terminal-lobby') || !art) return;
    const cache = new Map();
    const targets = [...new Set([lobby, document.documentElement].filter(Boolean))];
    const properties = ['--terminal-bg', '--terminal-surface', '--terminal-accent', '--terminal-action', '--terminal-action-hover'];
    const reset = () => targets.forEach(target => properties.forEach(name => target.style.removeProperty(name)));
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    function hslToRgb(hue, saturation, lightness) {
        const a = saturation * Math.min(lightness, 1 - lightness);
        return [0, 8, 4].map(n => {
            const k = (n + hue / 30) % 12;
            return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        });
    }
    function luminance(rgb) {
        const c = rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
    }
    function safeColor(hue, saturation, lightness) {
        // All secondary text remains at least 4.5:1 against both surfaces.
        const text = luminance([208 / 255, 217 / 255, 213 / 255]);
        while ((text + .05) / (luminance(hslToRgb(hue, saturation, lightness)) + .05) < 4.5 && lightness > .20) lightness -= .01;
        return `hsl(${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.floor(lightness * 100)}%)`;
    }
    function palette(pixels) {
        const buckets = Array.from({length: 36}, () => ({weight: 0, hue: 0, saturation: 0}));
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 180) continue;
            const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]].map(v => v / 255);
            const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
            const lightness = (max + min) / 2;
            if (delta < .10 || lightness < .12 || lightness > .88) continue;
            const saturation = delta / (1 - Math.abs(2 * lightness - 1));
            if (saturation < .20) continue;
            let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
            hue = (hue * 60 + 360) % 360;
            const weight = saturation ** 1.5 * pixels[i + 3] / 255;
            const bucket = buckets[Math.floor(hue / 10)];
            bucket.weight += weight;
            bucket.hue += hue * weight;
            bucket.saturation += saturation * weight;
        }
        const best = buckets.reduce((a, b) => b.weight > a.weight ? b : a);
        if (best.weight < 3) return null;
        const hue = best.hue / best.weight;
        const saturation = clamp(best.saturation / best.weight * .45, .20, .32);
        return [safeColor(hue, saturation, .31), safeColor(hue, saturation * .8, .35),
            `hsl(${Math.round(hue)} 52% 79%)`, `hsl(${Math.round(hue)} 48% 77%)`, `hsl(${Math.round(hue)} 50% 83%)`];
    }
    function update() {
        if (art.dataset.artwork === 'unavailable') { reset(); return; }
        if (!art.complete || !art.naturalWidth) return;
        const source = art.currentSrc || art.src;
        try {
            if (!cache.has(source)) {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 48;
                const context = canvas.getContext('2d', {willReadFrequently: true});
                if (!context) { reset(); return; }
                context.drawImage(art, 0, 0, 48, 48);
                cache.set(source, palette(context.getImageData(0, 0, 48, 48).data));
                if (cache.size > 100) cache.delete(cache.keys().next().value);
            }
            const colors = cache.get(source);
            if (!colors) { reset(); return; }
            targets.forEach(target => properties.forEach((name, index) => target.style.setProperty(name, colors[index])));
        } catch {
            // Blocked canvas access or failed artwork keeps the neutral theme usable.
            reset();
        }
    }
    art.addEventListener('load', update);
    new MutationObserver(update).observe(art, {attributes: true, attributeFilter: ['src', 'data-artwork']});
    update();
})();
