import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryHsr } from './hsr-proxy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
const server = http.createServer(async (request, response) => {
    try {
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        if (pathname === '/api/hsr/health') {
            response.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
            response.end(request.method === 'HEAD' ? '' : JSON.stringify({service:'honkai-uid-relay',version:1})); return;
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
        response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache' });
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
