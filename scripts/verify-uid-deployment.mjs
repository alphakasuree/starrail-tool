import {publicUidBase} from './pages-uid-config.mjs';
const base = publicUidBase(process.env.UID_API_BASE_URL || `${process.env.UID_WORKER_URL || ''}/api/hsr`);
const origin = process.env.UID_SITE_ORIGIN;
if (!origin) throw new Error('UID_SITE_ORIGIN is required.');
const response = await fetch(`${base}/health`,{headers:{Origin:origin},signal:AbortSignal.timeout(15000)});
if (!response.ok || response.headers.get('Access-Control-Allow-Origin') !== origin || (await response.json()).service !== 'honkai-uid-relay') throw new Error('Deployed UID relay health or CORS check failed. Pages deployment stopped.');
console.log('PASS: deployed UID relay health and GitHub Pages CORS origin.');
