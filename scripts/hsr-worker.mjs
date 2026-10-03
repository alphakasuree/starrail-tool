import {queryHsr} from './hsr-proxy.mjs';
// Deploy this module with hsr-proxy.mjs; ALLOWED_ORIGIN must be your site's origin.
export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', {status:403});
        const headers = {'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept, Cache-Control, Pragma','Vary':'Origin','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
        if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
        if (request.method !== 'GET') return new Response('{}', {status:405,headers});
        if (new URL(request.url).pathname === '/api/hsr/health') return new Response(JSON.stringify({service:'honkai-uid-relay',version:2}),{headers});
        const match = new URL(request.url).pathname.match(/^\/api\/hsr\/([1-9]\d{8,9})$/);
        if (!match) return new Response('{}', {status:404,headers});
        const response = await queryHsr(match[1]);
        return new Response(response.body,{status:response.status,headers});
    }
};
