import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryHsr } from './hsr-proxy.mjs';
import { FreeChat } from './free-chat.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// Server-only file, excluded from Git and the static-file allowlist.
try {
    const localEnv = parseEnv(await readFile(path.join(root, '.env.chat'), 'utf8'));
    for (const name of ['GEMINI_API_KEY', 'GEMINI_FREE_TIER_CONFIRMED']) {
        if (process.env[name] === undefined && localEnv[name] !== undefined) process.env[name] = localEnv[name];
    }
} catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Could not read local chat settings.');
}
const chat = new FreeChat(process.env);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
const server = http.createServer(async (request, response) => {
    try {
        const chatPath = new URL(request.url, 'http://localhost').pathname;
        if (chatPath === '/api/chat' || chatPath === '/api/chat/status') {
            const host = request.headers.host;
            const origin = request.headers.origin;
            if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host || '') || (origin && origin !== `http://${host}`) || (!origin && request.method !== 'GET')) { response.writeHead(403); response.end(); return; }
            if (chatPath === '/api/chat/status' && request.method === 'GET') {
                const result = chat.status();
                response.writeHead(result.status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
                response.end(JSON.stringify(result.body)); return;
            }
            if (request.method !== 'POST') {response.writeHead(405); response.end(); return;}
            if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] || '')) {response.writeHead(415); response.end(); return;}
            let size = 0;
            const chunks = [];
            for await (const chunk of request) {
                size += chunk.length;
                if (size > 100000) { response.writeHead(413); response.end(); return; }
                chunks.push(chunk);
            }
            let payload;
            try {payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {response.writeHead(400); response.end(); return;}
            const cancellation = new AbortController();
            const cancel = () => {if (!response.writableEnded) cancellation.abort();};
            response.once('close', cancel);
            const result = await chat.answer(payload, cancellation.signal);
            response.off('close', cancel);
            if (response.destroyed) return;
            response.writeHead(result.status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
            response.end(JSON.stringify(result.body)); return;
        }
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        if (pathname === '/api/hsr/health') {
            response.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
            response.end(request.method === 'HEAD' ? '' : JSON.stringify({service:'honkai-uid-relay',version:2,freeChat:2})); return;
        }
        if (pathname.startsWith('/api/hsr/')) {
            const result = await queryHsr(pathname.slice('/api/hsr/'.length));
            response.writeHead(result.status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
            response.end(request.method === 'HEAD' ? '' : await result.text()); return;
        }
        const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
        const file = path.resolve(root, relative);
        const allowed = ['index.html', 'manifest.webmanifest', 'sw.js'].some(name => file === path.join(root, name)) || file.startsWith(path.join(root, 'assets') + path.sep) || (file.startsWith(path.join(root, 'docs', 'references') + path.sep) && path.extname(file) === '.pdf');
        if (!allowed) { response.writeHead(404); response.end(); return; }
        const info = await stat(file);
        if (!info.isFile()) { response.writeHead(404); response.end(); return; }
        response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store' });
        if (request.method === 'HEAD') { response.end(); return; }
        createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch (error) {
        response.writeHead(error instanceof URIError ? 400 : 404);
        response.end();
    }
});
const port = Number(process.env.PORT || 5500);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
server.listen(port, '127.0.0.1', () => console.log(`Frontend: http://localhost:${port}`));
