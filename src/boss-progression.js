// Encounter progression is independent of player level, reloads and rewards.
// Optional chronicle guardians sit after the early gates even in earlier biomes.
const BIOME_RANK={moss:1,forge:2,reef:3,storm:4,frost:5,rift:6};
const NAMED_RANK={briar:1,bell:2,leviathan:3,conductor:4,hourglass:5,crown:6,belltwin:4,palimpsest:5,nullheart:7};
const CONFIGS=Object.freeze(Object.fromEntries(Array.from({length:7},(_,i)=>{
  const rank=i+1;return [rank,Object.freeze({rank,health:1.55+i*.06,damage:1.12+i*.045,tempo:1.8*(1+i*.018),movement:2.25*(1+i*.018),late:rank>=4,healFraction:rank>=4?.09:0,healFrames:100,readFrames:rank<=2?24:22,counterCooldown:96})];
})));
export function bossRank(boss){
  if(typeof boss==='string')return NAMED_RANK[boss]||BIOME_RANK[boss.split('-')[0]]||1;
  if(!boss)return 1;
  if(boss.finale)return 7;
  if(boss.id&&NAMED_RANK[boss.id])return NAMED_RANK[boss.id];
  const rank=BIOME_RANK[boss.biome]||1;return Math.min(7,rank+(boss.optional?2:0));
}
export const bossProgression=boss=>CONFIGS[bossRank(boss)];
export const bossPhase=e=>e.hp<=e.maxHp*.18?4:e.hp<=e.maxHp*.4?3:e.hp<=e.maxHp*.7?2:1;
export const bossTempo=e=>bossProgression(e.boss).tempo*(e.berserk?1.12:1)*((e.phase||1)>=4?1.16:1);
// Locomotion has its own clock: speeding a warning cannot substitute for a
// boss actually crossing the arena faster. Every rank moves at least 2.25x.
export const bossMovement=e=>bossProgression(e.boss).movement*(e.berserk?1.12:1)*((e.phase||1)>=4?1.16:1);
export const bossDamage=(e,damage)=>damage*bossProgression(e.boss).damage*(e.berserk?1.18:1)*((e.phase||1)>=4?1.15:1);
export const bossKnockback=(e,force)=>force*(1+(bossRank(e.boss)-1)*.025)*(e.berserk?1.1:1);
