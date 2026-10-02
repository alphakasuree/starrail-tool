import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
await import('./generate-pwa.mjs');
const dist = path.join(root, 'dist');
// Verify the resolved target before replacing generated output on Windows.
if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Unsafe build output path');
await fs.rm(dist, {recursive:true, force:true});
await fs.mkdir(dist, {recursive:true});
await fs.copyFile(path.join(root,'index.html'),path.join(dist,'index.html'));
for (const name of ['sw.js','manifest.webmanifest']) await fs.copyFile(path.join(root,name),path.join(dist,name));
await fs.cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
await fs.mkdir(path.join(dist,'docs','references'),{recursive:true});
for (const name of await fs.readdir(path.join(root,'docs','references'))) {
    if (name.endsWith('.pdf')) await fs.copyFile(path.join(root,'docs','references',name),path.join(dist,'docs','references',name));
}
await fs.writeFile(path.join(dist,'.nojekyll'),'');
console.log('Pages artifact: dist/ (index.html, assets, reference PDFs only)');
