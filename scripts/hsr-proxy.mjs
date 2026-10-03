// Shared by the local server and the deployable Cloudflare Worker.
import {convertEnkaCharacter, validateEnka, enkaProfile} from './hsr-enka.mjs';

async function upstreamJson(url, validate) {
    try {
        const response = await fetch(url, {
            headers:{'User-Agent':'HonkaiAccountPlanner/1.0', Accept:'application/json'}, signal:AbortSignal.timeout(12000)
        });
        if (!response.ok) return {status:[404,429].includes(response.status) ? response.status : 502};
        const body = await response.text();
        if (body.length > 1024 * 1024) throw new Error('Response too large');
        const data = JSON.parse(body);
        validate(data);
        return {status:200,data};
    } catch { return {status:502}; }
}
export async function queryHsr(uid) {
    if (!/^[1-9]\d{8,9}$/.test(uid)) return new Response(JSON.stringify({error:'Invalid UID'}), {status:400});
    try {
        const [parsed, enka] = await Promise.all([
            upstreamJson(`https://api.mihomo.me/sr_info_parsed/${uid}?lang=kr`, data => {
                if (String(data?.player?.uid) !== uid || !Array.isArray(data.characters) || data.characters.length > 32) throw new Error('Invalid response');
            }),
            upstreamJson(`https://enka.network/api/hsr/uid/${uid}`, data => validateEnka(data, uid))
        ]);
        if (!parsed.data && !enka.data) return new Response(JSON.stringify({error:'Profile lookup failed'}), {status:parsed.status});
        const data = parsed.data || enkaProfile(enka.data.detailInfo);
        // MiHoMo's parsed response can silently omit characters unsupported by its resources.
        // Preserve its complete builds and supplement only missing IDs from Enka.
        const ids = new Set(data.characters.map(c=>String(c.id)));
        for (const raw of enka.data?.detailInfo.avatarDetailList || []) {
            if (ids.has(String(raw.avatarId)) || data.characters.length >= 32) continue;
            try {
                data.characters.push(convertEnkaCharacter(raw));
                ids.add(String(raw.avatarId));
            } catch { /* One malformed build must not discard other valid characters. */ }
        }
        return new Response(JSON.stringify(data), {headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    } catch {return new Response(JSON.stringify({error:'Profile service unavailable'}), {status:502});}
}
