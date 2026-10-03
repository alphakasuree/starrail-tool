// Refresh the server-side Enka conversion snapshot; no player data is bundled.
import fs from 'node:fs/promises';
import vm from 'node:vm';
const base = 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/hsr/';
const [avatars,weapons,tree,relics,hsr,meta] = await Promise.all(
    ['avatars','weapons','tree','relics','hsr','honker_meta'].map(async name => {
        const response = await fetch(`${base}${name}.json`,{signal:AbortSignal.timeout(30000)});
        if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
        return response.json();
    }));
const local = vm.runInNewContext((await fs.readFile(new URL('../assets/js/spec-assets.js',import.meta.url),'utf8'))+'\nHonkaiSpecAssets');
const names = hsr.ko;
const data = {
    avatars:Object.fromEntries(Object.entries(avatars).map(([id,a])=>[id,{
        name:names[a.AvatarName.Hash] || id,path:a.AvatarBaseType,promotion:a.Promotion
    }])),
    weapons:Object.fromEntries(Object.entries(weapons).map(([id,w])=>[id,{
        name:names[w.EquipmentName.Hash] || id,path:w.AvatarBaseType,promotion:w.Promotion,skills:w.EquipmentSkill
    }])),
    tree,
    relics:Object.fromEntries(Object.entries(relics.Items).map(([id,r])=>[id,{
        name:local.relics[id]?.name || names[relics.Sets[r.SetID]?.Name] || id,
        rarity:r.Rarity,setId:r.SetID,main:r.MainAffixGroup,sub:r.SubAffixGroup
    }])),
    sets:relics.Sets,affixes:meta.relic
};
await fs.writeFile(new URL('./hsr-enka-data.mjs',import.meta.url),
    `// Enka.Network game data snapshot (${new Date().toISOString().slice(0,10)}).\n// Source: https://github.com/EnkaNetwork/API-docs/tree/master/store/hsr\nexport default ${JSON.stringify(data)};\n`);
console.log(`Enka conversion resources: ${Object.keys(data.avatars).length} characters, ${Object.keys(data.weapons).length} light cones.`);
