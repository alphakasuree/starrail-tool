import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {configureUidArtifacts} from './pages-uid-config.mjs';
import {generatePwa} from './generate-pwa.mjs';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const uidApiBase = process.env.UID_API_BASE_URL || (process.env.UID_WORKER_URL ? `${process.env.UID_WORKER_URL.replace(/\/$/,'')}/api/hsr` : '');
if (process.env.UID_REQUIRE_PUBLIC === '1' && !uidApiBase) throw new Error('Public Pages deployment requires a deployed UID relay URL.');
const configured = uidApiBase ? configureUidArtifacts(await fs.readFile(path.join(root,'index.html'),'utf8'),await fs.readFile(path.join(root,'assets/js/backend-config.js'),'utf8'),uidApiBase) : null;
await generatePwa(root);
const dist = path.join(root, 'dist');
// Verify the resolved target before replacing generated output on Windows.
if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Unsafe build output path');
await fs.rm(dist, {recursive:true, force:true});
await fs.mkdir(dist, {recursive:true});
await fs.copyFile(path.join(root,'index.html'),path.join(dist,'index.html'));
for (const name of ['sw.js','manifest.webmanifest']) await fs.copyFile(path.join(root,name),path.join(dist,name));
await fs.cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
if (configured) {
    await fs.writeFile(path.join(dist,'index.html'),configured.html);
    await fs.writeFile(path.join(dist,'assets/js/backend-config.js'),configured.config);
}
// Hash the final deployment configuration so installed apps also get new API URLs.
await generatePwa(dist);
await fs.mkdir(path.join(dist,'docs','references'),{recursive:true});
for (const name of await fs.readdir(path.join(root,'docs','references'))) {
    if (name.endsWith('.pdf')) await fs.copyFile(path.join(root,'docs','references',name),path.join(dist,'docs','references',name));
}
await fs.writeFile(path.join(dist,'.nojekyll'),'');
console.log('Pages artifact: dist/ (index.html, assets, reference PDFs only)');
