(() => {
    'use strict';
    let context, master, voiceMaster, bus, duck, voice = null, voiceMedia = null, voiceEpoch = 0, epoch = 0, ready = false, dropped = false;
    let sources = new Set(), volume = .35, muted = false, track = null, buffer = null;
    const cache = new Map();
    const downloads = new Map();
    let introTimer = 0, musicTimer = 0, musicSource = null, revealed = false;
    const get = id => document.getElementById(id);
    try {
        const saved = localStorage.getItem('honkai-beat-volume');
        if (saved !== null && Number.isFinite(Number(saved))) volume = Math.max(0, Math.min(1, Number(saved)));
        muted = localStorage.getItem('honkai-beat-muted') === 'true';
    } catch {}
    function controls() {
        get('warp-beat-toggle').textContent = muted ? 'BGM OFF' : 'BGM ON';
        get('warp-beat-toggle').setAttribute('aria-pressed', String(!muted));
        get('warp-beat-volume').value = String(Math.round(volume * 100));
        if (master) master.gain.setTargetAtTime(muted ? 0 : volume, context.currentTime, .04);
        if (voiceMaster) voiceMaster.gain.setTargetAtTime(volume, context.currentTime, .04);
        if (voiceMedia) voiceMedia.volume = volume;
    }
    function stop() {
        epoch++; ready = false; dropped = false; buffer = null; track = null;
        clearTimeout(introTimer);clearTimeout(musicTimer);musicSource=null;revealed=false;
        stopVoice();
        if (bus) { bus.disconnect(); bus = null; }
        if (duck) { duck.disconnect(); duck = null; }
        for (const source of sources) { try { source.stop(); } catch {} }
        sources.clear(); get('warp-beat-controls').hidden = true;
    }
    function download(url) {
        if (!downloads.has(url)) downloads.set(url, fetch(url).then(response => {
            if (!response.ok) throw Error('audio unavailable');
            return response.arrayBuffer();
        }).catch(error => { downloads.delete(url); throw error; }));
        return downloads.get(url);
    }
    function decoded(url) {
        if (!cache.has(url)) cache.set(url, download(url).then(data => context.decodeAudioData(data.slice(0))).catch(error => { cache.delete(url); throw error; }));
        return cache.get(url);
    }
    function preloadVoices(items) {
        for (const item of items) {
            const line = globalThis.WarpVoiceLines?.[item.id];
            if (item.type === 'character' && item.rarity === 5 && line?.url) download(line.url).catch(() => {});
        }
    }
    function stopVoice() {
        voiceEpoch++;
        if (voice) { try { voice.stop(); } catch {} voice = null; }
        if (voiceMedia) { voiceMedia.pause(); voiceMedia.removeAttribute('src'); voiceMedia.load(); voiceMedia = null; }
        if (duck) duck.gain.setTargetAtTime(1, context.currentTime, .18);
    }
    function ensureContext() {
        const AudioContextType = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextType) return false;
        if (!context) {
            context = new AudioContextType(); master = context.createGain(); voiceMaster = context.createGain();
            const limiter = context.createDynamicsCompressor();
            limiter.threshold.value = -9; limiter.ratio.value = 6;
            master.connect(limiter); voiceMaster.connect(limiter); limiter.connect(context.destination);
        }
        controls();
        return true;
    }
    async function speakMedia(url, token, session) {
        if (token !== voiceEpoch || session !== epoch || !globalThis.Audio) return;
        const media = new globalThis.Audio(url);
        voiceMedia = media; media.volume = volume;
        if (duck) duck.gain.setTargetAtTime(.2, context.currentTime, .08);
        const ended = () => {
            if (voiceMedia !== media) return;
            voiceMedia = null;
            if (duck) duck.gain.setTargetAtTime(1, context.currentTime, .3);
        };
        media.onended = ended; media.onerror = ended;
        try { await media.play(); } catch { ended(); }
    }
    async function speak(item) {
        stopVoice();
        if (item.type !== 'character' || item.rarity !== 5) return;
        const line = globalThis.WarpVoiceLines?.[item.id];
        if (!line?.url) return;
        const token = voiceEpoch, session = epoch;
        try {
            if (!ensureContext()) { await speakMedia(line.url, token, session); return; }
            await context.resume();
            if (token !== voiceEpoch || session !== epoch) return;
            const audio = await decoded(line.url);
            if (token !== voiceEpoch || session !== epoch) return;
            const source = context.createBufferSource(), gain = context.createGain();
            source.buffer = audio; gain.gain.value = .95;
            source.connect(gain); gain.connect(voiceMaster); sources.add(source); voice = source;
            if (duck) duck.gain.setTargetAtTime(.2, context.currentTime, .08);
            source.onended = () => {
                sources.delete(source); source.disconnect(); gain.disconnect();
                if (voice === source) { voice = null; if (duck) duck.gain.setTargetAtTime(1, context.currentTime, .3); }
            };
            source.start();
        } catch { await speakMedia(line.url, token, session); }
    }
    function wire(source, gain, filter) {
        source.connect(filter || gain);
        if (filter) filter.connect(gain);
        gain.connect(bus); sources.add(source);
        source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); filter?.disconnect(); };
    }
    function tone(at, hz, length, level, type = 'sine', attack = .02) {
        const source = context.createOscillator(), gain = context.createGain();
        source.type = type; source.frequency.value = hz;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = type === 'sine' ? 7000 : 1200;
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(level, at + attack);
        gain.gain.exponentialRampToValueAtTime(.0001, at + length);
        wire(source, gain, filter); source.start(at); source.stop(at + length + .02);
    }
    let percussionNoise = null;
    function drum(at, kind, level) {
        const gain = context.createGain();
        const length = kind === 0 ? .3 : kind === 1 ? .18 : .045;
        let source, filter;
        if (kind === 0) {
            source = context.createOscillator(); source.type = 'sine';
            source.frequency.setValueAtTime(150, at);
            source.frequency.exponentialRampToValueAtTime(47, at + .09);
        } else {
            if (!percussionNoise) {
                percussionNoise = context.createBuffer(1, Math.ceil(context.sampleRate * .25), context.sampleRate);
                const data = percussionNoise.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            }
            source = context.createBufferSource(); source.buffer = percussionNoise;
            filter = context.createBiquadFilter(); filter.type = 'highpass';
            filter.frequency.value = kind === 1 ? 1500 : 7000;
        }
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(level, at + .002);
        gain.gain.exponentialRampToValueAtTime(.0001, at + length);
        wire(source, gain, filter); source.start(at); source.stop(at + length + .02);
    }
    function swell() {
        const at = context.currentTime + .02;
        [146.83, 220, 293.66, 349.23, 440].forEach(hz => tone(at, hz, 2.5, .035, 'triangle', .9));
        [587.33, 880, 1174.66].forEach((hz, i) => tone(at + i * .25, hz, 1.8, .035));
    }
    function click(kind='ui') {
        if (!ready || context.state!=='running' || muted) return;
        const at=context.currentTime+.005;
        const notes=kind==='signal' ? [660,990,1320] : [880,1320];
        notes.forEach((hz,i)=>tone(at+i*.025,hz,.13,kind==='signal' ? .095 : .055));
        if(kind==='signal')tone(at,110,.22,.11,'sine');
    }
    function intro(token) {
        if(token!==epoch || !ready || dropped)return;
        swell();
        const at=context.currentTime+.02;
        [0,6,10,15].forEach(step=>drum(at+step*.09375,0,.18));
        drum(at+.75,1,.075);
        for(let i=0;i<16;i++)drum(at+i*.09375,2,i%4===0 ? .025 : .012);
        [0,3,6,10,14].forEach(step=>tone(at+step*.09375,73.42,.25,.07,'triangle',.006));
        introTimer=setTimeout(()=>intro(token),1500);
    }
    async function prepare(item = {}) {
        stop(); const token = epoch;
        try {
            if (!ensureContext()) return;
            const resumed = context.resume();
            const configured = globalThis.WarpMusicTracks || {};
            track = configured.characters?.[item.id] || configured.elements?.[item.element] || configured.default || null;
            bus = context.createGain(); bus.gain.value = .8;
            duck = context.createGain(); duck.gain.value = 1; bus.connect(duck); duck.connect(master); controls();
            await resumed;
            if (token !== epoch) return;
            ready = context.state === 'running';
            if (!ready) return;
            get('warp-beat-controls').hidden = false;
            get('warp-beat-title').textContent = '네온 체이스 · WARP BGM';
            click('signal');intro(token);
            if (track?.url) {
                try {
                    const url = track.url;
                    const audio = await decoded(url);
                    if (token === epoch && !dropped) {buffer = audio;playBackground();}
                } catch { /* Cinematic synthesis remains available when loading fails. */ }
            }
            if(token===epoch && !dropped)playBackground();
        } catch { if (token === epoch) stop(); }
    }
    function playBackground() {
        if (!ready || dropped || context.state !== 'running') return;
        dropped = true;
        clearTimeout(introTimer);
        const at = context.currentTime + .012;
        if (buffer) {
            const offset = Math.max(0, Number(track.dropOffset) || 0);
            if (offset < buffer.duration) {
                const source = context.createBufferSource(), gain = context.createGain();
                source.buffer = buffer; source.loop = !revealed;
                source.loopStart=offset;source.loopEnd=Math.min(buffer.duration,Math.max(offset+.1,buffer.duration-5));
                musicSource=source;gain.gain.value = .8; wire(source, gain); source.start(at, offset);
                get('warp-beat-title').textContent = `${track.title || '네온 체이스'} · WARP BGM`;
                return;
            }
        }
        // 160 BPM electronic fallback, matching the locally generated score.
        const chords = [[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,61]];
        const hz = midi => 440 * 2 ** ((midi - 69) / 12);
        const arp = [0,2,1,3,2,1,3,2];
        for (let bar = 0; bar < 16; bar++) {
            const start = at + bar * 1.5, chord = chords[Math.floor(bar / 2) % 4];
            chord.forEach(note => tone(start,hz(note+12),2.2,.022,'triangle',.45));
            [0,3,6,10,14].forEach(step=>tone(start+step*.09375,hz(chord[0]-12),.3,.12,'triangle',.006));
            [0,6,10,15].forEach(step=>drum(start+step*.09375,0,.23));
            drum(start+.75,1,.09);
            for(let step=0;step<16;step++) {
                if(step%2===0 || bar%2===1)drum(start+step*.09375,2,step%4===0 ? .035 : .02);
            }
            for(let step=0;step<8;step++)tone(start+step*.1875,hz(chord[arp[step]]+24),.18,.04,'sawtooth',.004);
        }
        if(!revealed)musicTimer=setTimeout(()=>{if(ready&&!revealed){dropped=false;playBackground();}},24000);
    }
    function drop() {
        if(!ready || context.state!=='running' || revealed)return;
        revealed=true;clearTimeout(musicTimer);
        if(!dropped)playBackground();
        if(musicSource)musicSource.loop=false;
        const at=context.currentTime+.012;
        tone(at,82.41,.65,.22,'sine');
        [587.33,698.46,880,1174.66].forEach((hz,i)=>tone(at+i*.055,hz,1.4,.045));
    }
    get('warp-beat-toggle').onclick = () => { muted = !muted; controls(); try { localStorage.setItem('honkai-beat-muted', String(muted)); } catch {} };
    get('warp-beat-volume').oninput = event => { volume = Number(event.target.value) / 100; controls(); try { localStorage.setItem('honkai-beat-volume', String(volume)); } catch {} };
    // Switching tabs must preserve the current sources and playback position.
    // Recover if the browser suspended audio while the page was in the background.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && ready && context && context.state !== 'running' && context.state !== 'closed') {
            context.resume().catch(() => {});
        }
    });
    document.addEventListener('click',event=>{
        if(!ready || !event.target?.closest)return;
        if(event.target.closest('#warp-signal-open, #warp-beat-toggle, #skip-btn'))return;
        if(event.target.closest('button, #single-reveal-screen'))click();
    });
    const defaultUrl=globalThis.WarpMusicTracks?.default?.url;
    if(defaultUrl)download(defaultUrl).catch(()=>{});
    globalThis.WarpAudio = Object.freeze({ prepare, drop, stop, speak, stopVoice, preloadVoices, click }); controls();
})();
