export function publicUidBase(value) {
    let url;
    try {url = new URL(value);} catch {throw new Error('UID_API_BASE_URL must be an absolute HTTPS URL ending in /api/hsr.');}
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.replace(/\/$/, '').endsWith('/api/hsr') || ['localhost','127.0.0.1','[::1]'].includes(url.hostname)) throw new Error('UID_API_BASE_URL must be a public HTTPS URL ending in /api/hsr, without credentials or query parameters.');
    return url.href.replace(/\/$/, '');
}

export function configureUidArtifacts(html, config, value) {
    const baseUrl = publicUidBase(value), origin = new URL(baseUrl).origin;
    const marker = /globalThis\.HonkaiUidConfig = Object\.freeze\(\{[^\n]+\}\);/;
    if (!marker.test(config)) throw new Error('UID configuration marker is missing.');
    const csp = /connect-src ([^;"\n]+)/;
    if (!csp.test(html)) throw new Error('CSP connect-src is missing.');
    config = config.replace(marker, `globalThis.HonkaiUidConfig = Object.freeze({ baseUrl: ${JSON.stringify(baseUrl)} });`);
    html = html.replace(csp, (_, sources) => `connect-src ${[...new Set([...sources.trim().split(/\s+/), origin])].join(' ')}`);
    return {html,config,baseUrl};
}
