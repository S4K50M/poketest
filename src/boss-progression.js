// Encounter progression is independent of player level, reloads and rewards.
// Optional chronicle guardians sit after the early gates even in earlier biomes.
const BIOME_RANK={moss:1,forge:2,reef:3,storm:4,frost:5,rift:6};
const NAMED_RANK={briar:1,bell:2,leviathan:3,conductor:4,hourglass:5,crown:6,belltwin:4,palimpsest:5,nullheart:7};
const CONFIGS=Object.freeze(Object.fromEntries(Array.from({length:7},(_,i)=>{
  const rank=i+1;return [rank,Object.freeze({rank,health:1+i*.04,damage:1+i*.04,tempo:1+i*.018,late:rank>=4,healFraction:rank>=4?.09:0,healFrames:100,readFrames:rank<=2?36:30,counterCooldown:180})];
})));
export function bossRank(boss){
  if(typeof boss==='string')return NAMED_RANK[boss]||BIOME_RANK[boss.split('-')[0]]||1;
  if(!boss)return 1;
  if(boss.finale)return 7;
  if(boss.id&&NAMED_RANK[boss.id])return NAMED_RANK[boss.id];
  const rank=BIOME_RANK[boss.biome]||1;return Math.min(7,rank+(boss.optional?2:0));
}
export const bossProgression=boss=>CONFIGS[bossRank(boss)];
export const bossPhase=e=>e.hp<=e.maxHp/3?3:e.hp<=e.maxHp*2/3?2:1;
export const bossTempo=e=>bossProgression(e.boss).tempo*(e.berserk?1.12:1);
export const bossDamage=(e,damage)=>damage*bossProgression(e.boss).damage*(e.berserk?1.18:1);
export const bossKnockback=(e,force)=>force*(1+(bossRank(e.boss)-1)*.025)*(e.berserk?1.1:1);
