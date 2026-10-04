import {queryHsr} from './hsr-proxy.mjs';
import {FreeChat} from './free-chat.mjs';
export class ChatQuota {
    constructor(ctx, env) {
        this.chat = new FreeChat(env, ctx.storage);
        ctx.blockConcurrencyWhile(() => this.chat.load());
    }
    async fetch(request) {
        let result;
        if (request.method === 'GET') result = this.chat.status();
        else {
            try { result = await this.chat.answer(await request.json()); }
            catch { result = {status:400, body:{error:'요청을 확인해 주세요.'}}; }
        }
        return Response.json(result.body, {status:result.status});
    }
}
// Deploy this module with hsr-proxy.mjs; ALLOWED_ORIGIN must be your site's origin.
export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', {status:403});
        const headers = {'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Accept, Content-Type, Cache-Control, Pragma','Vary':'Origin','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
        if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
        const pathname = new URL(request.url).pathname;
        if (pathname === '/api/chat' || pathname === '/api/chat/status') {
            const statusRequest = pathname.endsWith('/status') && request.method === 'GET';
            if (!statusRequest && (pathname.endsWith('/status') || request.method !== 'POST')) return new Response('{}', {status:405,headers});
            if (!env.CHAT_QUOTA) return new Response(JSON.stringify({available:false,error:'대화 서비스를 준비 중이에요.'}), {status:503,headers});
            let body;
            if (!statusRequest) {
                if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return new Response('{}',{status:415,headers});
                // Bound the streamed body even when Content-Length is absent.
                const reader = request.body?.getReader();
                if (!reader) return new Response('{}',{status:400,headers});
                const chunks = []; let size = 0;
                while (true) {
                    const chunk = await reader.read(); if (chunk.done) break;
                    size += chunk.value.byteLength;
                    if (size > 30000) { await reader.cancel(); return new Response('{}',{status:413,headers}); }
                    chunks.push(chunk.value);
                }
                const bytes = new Uint8Array(size); let offset = 0;
                for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
                body = new TextDecoder().decode(bytes);
            }
            const stub = env.CHAT_QUOTA.get(env.CHAT_QUOTA.idFromName('shared-free-chat'));
            try {
                const response = await stub.fetch(new Request('https://quota/chat', {method:statusRequest ? 'GET' : 'POST', headers:{'Content-Type':'application/json'}, body}));
                return new Response(response.body,{status:response.status,headers});
            } catch { return new Response(JSON.stringify({error:'대화 서비스를 준비 중이에요.'}),{status:503,headers}); }
        }
        if (request.method !== 'GET') return new Response('{}', {status:405,headers});
        if (new URL(request.url).pathname === '/api/hsr/health') return new Response(JSON.stringify({service:'honkai-uid-relay',version:2}),{headers});
        const match = new URL(request.url).pathname.match(/^\/api\/hsr\/([1-9]\d{8,9})$/);
        if (!match) return new Response('{}', {status:404,headers});
        const response = await queryHsr(match[1]);
        return new Response(response.body,{status:response.status,headers});
    }
};
