import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicUidBase} from './pages-uid-config.mjs';

export function workerConfig(repository, customOrigin = '', customName = '') {
    const [owner, repo] = String(repository || '').split('/');
    if (!owner || !repo) throw new Error('GITHUB_REPOSITORY is required.');
    const origin = new URL(customOrigin || `https://${owner.toLowerCase()}.github.io`);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error('UID_SITE_ORIGIN must be an HTTPS origin without a path.');
    const name = customName || `${repo.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,55).replace(/-+$/,'')}-uid`;
    if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(name)) throw new Error('UID_WORKER_NAME must be a Worker name of 2-63 lowercase letters, digits or hyphens.');
    return {name, main:'../../scripts/hsr-worker.mjs', compatibility_date:'2026-10-01', workers_dev:true, preview_urls:false, vars:{ALLOWED_ORIGIN:origin.origin}};
}

async function main() {
    const env = process.env, config = workerConfig(env.GITHUB_REPOSITORY, env.UID_SITE_ORIGIN, env.UID_WORKER_NAME);
    const outputs = {site_origin:config.vars.ALLOWED_ORIGIN, deploy_worker:'false', api_base_url:''};
    if (env.UID_API_BASE_URL) outputs.api_base_url = publicUidBase(env.UID_API_BASE_URL);
    else {
        if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) throw new Error('UID deployment needs repository Secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. See docs/UID-LINK.md. An existing relay can instead be supplied in repository variable UID_API_BASE_URL.');
        if (!/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID)) throw new Error('CLOUDFLARE_ACCOUNT_ID must be the 32-character Cloudflare Account ID.');
        const root = fileURLToPath(new URL('../', import.meta.url));
        const directory = path.join(root,'tmp','uid-deploy');
        await fs.mkdir(directory,{recursive:true});
        await fs.writeFile(path.join(directory,'wrangler.json'),JSON.stringify(config,null,2)+'\n');
        outputs.deploy_worker = 'true';
    }
    if (env.GITHUB_OUTPUT) await fs.appendFile(env.GITHUB_OUTPUT,Object.entries(outputs).map(([k,v])=>`${k}=${v}\n`).join(''));
    console.log(`UID deployment prepared for ${config.vars.ALLOWED_ORIGIN}; ${outputs.deploy_worker === 'true' ? 'deploying Cloudflare Worker' : 'using configured relay'}.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
