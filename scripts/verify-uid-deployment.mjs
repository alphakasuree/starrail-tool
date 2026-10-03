import {publicUidBase} from './pages-uid-config.mjs';
const base = publicUidBase(process.env.UID_API_BASE_URL || `${process.env.UID_WORKER_URL || ''}/api/hsr`);
const origin = process.env.UID_SITE_ORIGIN;
if (!origin) throw new Error('UID_SITE_ORIGIN is required.');
const healthUrl = `${base}/health`;
console.log(`Checking UID relay: ${healthUrl}; Origin: ${origin}`);
const response = await fetch(healthUrl,{headers:{Origin:origin},signal:AbortSignal.timeout(15000)});
const allowedOrigin = response.headers.get('Access-Control-Allow-Origin');
const body = await response.text();
let service;
try {service = JSON.parse(body).service;} catch {}
if (response.status !== 200 || allowedOrigin !== origin || service !== 'honkai-uid-relay') throw new Error(`Deployed UID relay health or CORS check failed. Pages deployment stopped. URL=${healthUrl}; expected Origin=${JSON.stringify(origin)}; HTTP=${response.status}; Access-Control-Allow-Origin=${JSON.stringify(allowedOrigin)}; service=${JSON.stringify(service ?? null)}.`);
console.log('PASS: deployed UID relay health and GitHub Pages CORS origin.');
