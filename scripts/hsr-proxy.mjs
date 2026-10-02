// Shared by the local server and the deployable Cloudflare Worker.
export async function queryHsr(uid) {
    if (!/^[1-9]\d{8,9}$/.test(uid)) return new Response(JSON.stringify({error:'Invalid UID'}), {status:400});
    try {
        const upstream = await fetch(`https://api.mihomo.me/sr_info_parsed/${uid}?lang=kr`, {
            headers:{'User-Agent':'HonkaiAccountPlanner/1.0', Accept:'application/json'}, signal:AbortSignal.timeout(12000)
        });
        if (!upstream.ok) return new Response(JSON.stringify({error:'Profile lookup failed'}), {status:[404,429].includes(upstream.status) ? upstream.status : 502});
        const body = await upstream.text();
        if (body.length > 1024 * 1024) throw new Error('Response too large');
        const data = JSON.parse(body);
        if (String(data?.player?.uid) !== uid || !Array.isArray(data.characters)) throw new Error('Invalid response');
        return new Response(body, {headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
    } catch {return new Response(JSON.stringify({error:'Profile service unavailable'}), {status:502});}
}
