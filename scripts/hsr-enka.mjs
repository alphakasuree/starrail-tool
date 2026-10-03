import resources from './hsr-enka-data.mjs';

const definitions = {
    hp:['HP',false], atk:['공격력',false], def:['방어력',false], spd:['속도',false],
    crit_rate:['치명타 확률',true], crit_dmg:['치명타 피해',true],
    break_dmg:['격파 특수효과',true], heal_rate:['치유량 보너스',true],
    sp_rate:['에너지 회복효율',true], effect_hit:['효과 명중',true], effect_res:['효과 저항',true],
    hp_ratio:['HP',true], atk_ratio:['공격력',true], def_ratio:['방어력',true], spd_ratio:['속도',true],
    physical_dmg:['물리 속성 피해 증가',true], fire_dmg:['화염 속성 피해 증가',true],
    ice_dmg:['얼음 속성 피해 증가',true], lightning_dmg:['번개 속성 피해 증가',true],
    wind_dmg:['바람 속성 피해 증가',true], quantum_dmg:['양자 속성 피해 증가',true],
    imaginary_dmg:['허수 속성 피해 증가',true], elation_dmg:['즐거움',true]
};
const fields = {
    BaseHP:'hp', HPDelta:'hp', HPAddedRatio:'hp_ratio',
    BaseAttack:'atk', AttackDelta:'atk', AttackAddedRatio:'atk_ratio',
    BaseDefence:'def', DefenceDelta:'def', DefenceAddedRatio:'def_ratio',
    BaseSpeed:'spd', SpeedDelta:'spd', SpeedAddedRatio:'spd_ratio',
    CriticalChance:'crit_rate', CriticalChanceBase:'crit_rate',
    CriticalDamage:'crit_dmg', CriticalDamageBase:'crit_dmg',
    BreakDamageAddedRatio:'break_dmg', BreakDamageAddedRatioBase:'break_dmg',
    HealRatio:'heal_rate', HealRatioBase:'heal_rate', SPRatio:'sp_rate', SPRatioBase:'sp_rate',
    StatusProbability:'effect_hit', StatusProbabilityBase:'effect_hit',
    StatusResistance:'effect_res', StatusResistanceBase:'effect_res',
    PhysicalAddedRatio:'physical_dmg', FireAddedRatio:'fire_dmg', IceAddedRatio:'ice_dmg',
    ThunderAddedRatio:'lightning_dmg', WindAddedRatio:'wind_dmg', QuantumAddedRatio:'quantum_dmg',
    ImaginaryAddedRatio:'imaginary_dmg', ElationDamageAddedRatio:'elation_dmg', ElationDamageAddedRatioBase:'elation_dmg'
};
function stat(field, value) {
    const [name, percent] = definitions[field] || [field, false];
    return {name, field, value, percent, display:percent ? `${(value * 100).toFixed(1)}%` : Math.floor(value).toLocaleString('ko-KR')};
}
function propertyStat(p) {
    if (!p || !fields[p.type] || !Number.isFinite(p.value)) throw new Error('Invalid equipment property');
    return stat(fields[p.type], p.value);
}
function relicProperties(r, local) {
    // Enka provides resolved affix values. Older responses can be resolved from the snapshot.
    if (Array.isArray(r._flat?.props) && r._flat.props.length === 1 + (r.subAffixList || []).length) return r._flat.props;
    const main = resources.affixes.mainAffix[local?.main]?.[r.mainAffixId];
    if (!main) throw new Error('Unknown relic main affix');
    return [{type:main.Property,value:main.BaseValue + main.LevelAdd * (r.level || 0)},
        ...(r.subAffixList || []).map(s => {
            const sub = resources.affixes.subAffix[local?.sub]?.[s.affixId];
            if (!sub) throw new Error('Unknown relic sub affix');
            return {type:sub.Property,value:sub.BaseValue * s.cnt + sub.StepValue * (s.step || 0)};
        })];
}
export function convertEnkaCharacter(c) {
    if (!/^\d{4,6}$/.test(String(c?.avatarId)) || !Number.isInteger(c.level) || c.level < 1 || c.level > 100 || !Number.isInteger(c.rank ?? 0) || (c.rank ?? 0) < 0 || (c.rank ?? 0) > 6) throw new Error('Invalid Enka character');
    const id = String(c.avatarId), avatar = resources.avatars[id];
    const cone = c.equipment?.tid ? c.equipment : null, weapon = resources.weapons[cone?.tid];
    if (cone && (!/^\d{4,6}$/.test(String(cone.tid)) || !Number.isInteger(cone.level) || cone.level < 1 || cone.level > 100 || !Number.isInteger(cone.rank || 1) || (cone.rank || 1) < 1 || (cone.rank || 1) > 5)) throw new Error('Invalid Enka light cone');
    if (c.relicList != null && (!Array.isArray(c.relicList) || c.relicList.length > 6)) throw new Error('Invalid Enka relics');
    const relics = (c.relicList || []).slice(0,6).map(r => {
        if (!/^\d{4,6}$/.test(String(r.tid)) || !Number.isInteger(r.level || 0) || (r.level || 0) < 0 || (r.level || 0) > 15 || !Array.isArray(r.subAffixList || []) || (r.subAffixList || []).length > 4) throw new Error('Invalid Enka relic');
        const local = resources.relics[r.tid], props = relicProperties(r, local);
        return {id:String(r.tid),name:local?.name || String(r.tid),rarity:local?.rarity ?? null,level:r.level || 0,
            main_affix:propertyStat(props[0]),sub_affix:props.slice(1).map(propertyStat),props,setId:local?.setId ?? r._flat?.setID};
    });
    const promotion = avatar?.promotion[c.promotion || 0];
    let attributes = [];
    if (promotion && (!cone || weapon?.promotion[cone.promotion || 0])) {
        const values = {hp:0,atk:0,def:0,spd:0,crit_rate:promotion.CriticalChance,crit_dmg:promotion.CriticalDamage,
            break_dmg:0,heal_rate:0,sp_rate:1,effect_hit:0,effect_res:0};
        const base = {hp:promotion.HPBase + promotion.HPAdd * (c.level - 1),
            atk:promotion.AttackBase + promotion.AttackAdd * (c.level - 1),
            def:promotion.DefenceBase + promotion.DefenceAdd * (c.level - 1),spd:promotion.SpeedBase};
        function add(props) {
            for (const p of props) if (fields[p.type] && Number.isFinite(p.value)) values[fields[p.type]] = (values[fields[p.type]] || 0) + p.value;
        }
        function addObject(props) { add(Object.entries(props || {}).map(([type,value])=>({type,value}))); }
        if (cone) {
            const w = weapon.promotion[cone.promotion || 0];
            base.hp += w.BaseHP + w.BaseHPAdd * (cone.level - 1);
            base.atk += w.BaseAttack + w.BaseAttackAdd * (cone.level - 1);
            base.def += w.BaseDefence + w.BaseDefenceAdd * (cone.level - 1);
            if (weapon.path === avatar.path) addObject(weapon.skills[cone.rank || 1]?.props);
        }
        for (const s of c.skillTreeList || []) addObject(resources.tree[s.pointId]?.[s.level]?.props);
        const sets = new Map();
        for (const r of relics) { add(r.props); sets.set(r.setId, (sets.get(r.setId) || 0) + 1); }
        for (const [setId,count] of sets) for (const [required,skill] of Object.entries(resources.sets[setId]?.SetSkills || {})) {
            if (count >= Number(required)) addObject(skill.props);
        }
        for (const field of ['hp','atk','def','spd']) values[field] += base[field] * (1 + (values[`${field}_ratio`] || 0));
        attributes = Object.entries(values).filter(([field])=>!field.endsWith('_ratio')).map(([field,value])=>stat(field,value));
    }
    return {id,name:avatar?.name || id,level:c.level,rank:c.rank ?? 0,
        light_cone:cone ? {id:String(cone.tid),name:weapon?.name || String(cone.tid),level:cone.level,rank:cone.rank || 1} : null,
        attributes,additions:[],relics:relics.map(({props,setId,...r})=>r)};
}

export function validateEnka(data, uid) {
    const p = data?.detailInfo;
    if (String(p?.uid) !== uid || typeof p.nickname !== 'string' || !Array.isArray(p.avatarDetailList) || p.avatarDetailList.length > 32) throw new Error('Invalid Enka profile');
    return p;
}
export function enkaProfile(p) {
    return {player:{uid:String(p.uid),nickname:p.nickname,level:p.level,world_level:p.worldLevel,
        signature:p.signature || '',space_info:{achievement_count:p.recordInfo?.achievementCount}},characters:[]};
}
