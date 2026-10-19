import { DESIGNS } from './designs.js';
// Distances are arena units. Timings are 60 Hz simulation frames.
const special = (name, props = {}) => ({ name, startup: 19, active: 5, recovery: 23, damage: 19, range: 1.9, width: .65, stun: 23, cost: 20, cooldown: 120, ...props });
export const ROSTER = [
  {
    id:'pyrojaw', name:'Pyrojaw', element:'Fire', role:'Brawler', archetype:'Rushdown / Brawler', epithet:'The magma menace', color:'#ff8747', dark:'#753d28', accent:'#ffd378',
    title:'Pressure.<br>Then eruption.', description:'A volcanic force of nature. Close the gap, turn up the heat, and send them skyward with obsidian fists.',
    stats:[5,3,3,4], difficulty:3, hp:190, speed:.059, dash:.17, weight:1.1, jab:10, power:1.1, reach:1.1, hurt:{radius:.42,height:1.65,depth:.4}, ai:'rush',
    signature:'Magma God Fist', keys:['D','S','D + K'], signatureDesc:'A rising magma uppercut. The perfect spark for a devastating juggle.',
    specials:{ neutral:special('Cinder Knuckle',{burn:true}), forward:special('Lava Rush',{travel:.10,range:1.65,burn:true}), back:special('Cinder Wake',{zone:true,range:2.6,damage:12,burn:true}), up:special('Volcanic Rise',{launch: .21,range:1.5,damage:23}), down:special('Magma Pool',{zone:true,low:true,range:1.7,damage:13,burn:true}) },
  },
  {
    id:'voltantis', name:'Voltantis', element:'Electric', role:'Speedster', archetype:'Hit & Run / Assassin', epithet:'Lightning has a pulse', color:'#dbfc65', dark:'#697b30', accent:'#f9ffe0',
    title:'Blink.<br>And it’s over.', description:'A cybernetic mantis built for speed. Plasma blades, teleport steps, and relentless aerial pressure.',
    stats:[3,5,1,4],difficulty:4,hp:155,speed:.085,dash:.23,weight:.7,jab:8,power:.88,reach:1.1,hurt:{radius:.32,height:1.72,depth:.32},ai:'assassin',
    signature:'Flash Circuit',keys:['W','+','L'],signatureDesc:'Vanish off-axis and return with a plasma-blade strike. Adds 3 frames of hit-stun.',
    specials:{neutral:special('Plasma Rake',{startup:12,multi:3,damage:7,range:1.6}),forward:special('Volt Pierce',{travel:.14,range:2.2,startup:14}),back:special('Arc Bolt',{projectile:true,range:7,damage:16}),up:special('Flash Circuit',{teleport:true,startup:11,range:1.8}),down:special('Static Lift',{launch:.22,range:1.5,damage:19})},
  },
  {
    id:'glaciolith',name:'Glaciolith',element:'Ice',role:'Grappler',archetype:'Command Grab / Grappler',epithet:'The glacier that fights back',color:'#8edce5',dark:'#386276',accent:'#e0ffff',
    title:'Cold hands.<br>Crushing grip.',description:'Four arms. One inevitable outcome. Trade mobility for glacial armor and the most punishing throws in the arena.',
    stats:[5,1,5,3],difficulty:3,hp:235,speed:.036,dash:.12,weight:1.7,jab:13,power:1.23,reach:1.25,hurt:{radius:.55,height:1.92,depth:.5},ai:'grappler',
    signature:'Permafrost Driver',keys:['D','+','L'],signatureDesc:'A command throw into ice spikes. Applies Frostbite: −30% dash and sidestep distance.',
    specials:{neutral:special('Glacial Hammer',{damage:27,range:1.9,armor:true}),forward:special('Permafrost Driver',{grab:true,range:1.9,damage:34,cost:28,launch:.2}),back:special('Ice Spire',{projectile:true,range:6,damage:17}),up:special('Avalanche Charge',{armor:true,travel:.12,damage:25,range:1.65}),down:special('Frozen Fault',{low:true,range:2.7,damage:21})},
  },
  {
    id:'zephyrix',name:'Zephyrix',element:'Wind',role:'Aerialist',archetype:'Aerial Mix-up / Acrobat',epithet:'Unbound by gravity',color:'#b4e2b0',dark:'#446e59',accent:'#f2ffdd',
    title:'Own the air.<br>Rewrite gravity.',description:'A griffin-monk who fights between the beats. Double-jump, air-dash, and pull your rivals into the storm.',
    stats:[3,5,2,5],difficulty:4,hp:170,speed:.073,dash:.20,weight:.65,jab:10,power:.91,reach:1.12,hurt:{radius:.34,height:1.7,depth:.32},ai:'aerial',
    signature:'Eye of the Storm',keys:['S','+','L'],signatureDesc:'A wind vortex pulls guarding opponents inward. Air S + K becomes a dive-kick.',
    specials:{neutral:special('Gale Palm',{range:2.3,damage:16}),forward:special('Tempest Rush',{travel:.13,range:2.0,launch:.18}),back:special('Feather Lance',{projectile:true,range:7,damage:15}),up:special('Ascendant Wing',{launch:.24,selfLaunch:.2,damage:21}),down:special('Eye of the Storm',{vortex:true,range:3.8,damage:13,cooldown:180})},
  },
  {
    id:'terrakhan',name:'Terrakhan',element:'Earth',role:'Juggernaut',archetype:'Stance Switch / Tank',epithet:'The living fault line',color:'#b6bd7c',dark:'#555f39',accent:'#bfff83',
    title:'Stand firm.<br>Break everything.',description:'A tectonic fortress with an emerald heart. Parry jabs in Fortress Stance or shake the earth in Quake Stance.',
    stats:[5,1,5,3],difficulty:3,hp:240,speed:.033,dash:.115,weight:1.9,jab:14,power:1.25,reach:1.2,hurt:{radius:.58,height:1.85,depth:.5},ai:'tank',
    signature:'Tectonic Shift',keys:['W','+','L'],signatureDesc:'Switch Fortress / Quake stance. In Quake, S + L is an unblockable shockwave. Jump to avoid it.',
    specials:{neutral:special('Bedrock Fist',{armor:true,damage:28}),forward:special('Plate Crusher',{armor:true,travel:.08,damage:30,wallBreak:true}),back:special('Emerald Fault',{projectile:true,range:6,damage:17}),up:special('Tectonic Shift',{stance:true,cost:0,cooldown:30,startup:6,recovery:9}),down:special('Seismic Rupture',{ground:true,range:4.2,width:1.6,startup:30,damage:29,cost:30})},
  },
  {
    id:'noxshade',name:'Noxshade',element:'Shadow',role:'Trickster',archetype:'Traps & Clones / Trickster',epithet:'Your shadow hits back',color:'#c29bea',dark:'#57416d',accent:'#f0d6ff',
    title:'See double.<br>Hit the wrong one.',description:'A phantom jackal with a mind of its own. Set a shadow clone, then attack from two angles at once.',
    stats:[3,4,2,5],difficulty:5,hp:165,speed:.071,dash:.20,weight:.8,jab:10,power:.94,reach:1.2,hurt:{radius:.35,height:1.7,depth:.35},ai:'trickster',
    signature:'Split Intent',keys:['S','+','L'],signatureDesc:'Leave a clone that echoes your next strike from the opposite side, crossing up a frontal guard.',
    specials:{neutral:special('Spectral Claw',{range:1.9,damage:19}),forward:special('Umbral Lunge',{travel:.13,range:2.3,damage:20}),back:special('Night Needle',{projectile:true,range:7,damage:15}),up:special('Ghost Step',{teleport:true,range:1.7,damage:17}),down:special('Split Intent',{clone:true,damage:0,cost:24,cooldown:240,startup:10})},
  },
  {
    id:'aqualance',name:'Aqualance',element:'Water',role:'Duelist',archetype:'Spacing / Zoner-Duelist',epithet:'Precision under pressure',color:'#6dc9f1',dark:'#315b77',accent:'#c7f4ff',
    title:'Keep distance.<br>Make a point.',description:'A hammerhead knight with a hydro-rapier. Bait the whiff, jet out of reach, and pierce every opening.',
    stats:[3,4,3,5],difficulty:3,hp:185,speed:.064,dash:.24,weight:1,jab:11,power:.98,reach:1.55,hurt:{radius:.4,height:1.78,depth:.36},ai:'zoner',
    signature:'Undertow Thrust',keys:['D','+','L'],signatureDesc:'A long-reaching hydro-rapier thrust. Exceptional range, sharp whiff punishment, and jet-stream knockback.',
    specials:{neutral:special('Pressure Cut',{range:2.5,damage:18}),forward:special('Undertow Thrust',{range:3.5,width:.3,startup:16,damage:24,knockback:.24}),back:special('Hydro Lance',{projectile:true,range:8,damage:18}),up:special('Rising Tide',{launch:.21,range:2.0,damage:22}),down:special('Riptide Sweep',{low:true,range:2.3,damage:20})},
  },
  {
    id:'ferrodrake',name:'Ferrodrake',element:'Steel',role:'Dragon',archetype:'All-rounder / Counter',epithet:'Engineered to dominate',color:'#c4cbd0',dark:'#5b6770',accent:'#f58865',
    title:'Cold steel.<br>Burning ambition.',description:'A chrome-scaled wyvern with turbine wings. Armored starts, a punishing counter, and a dragon waiting to awaken.',
    stats:[4,3,4,4],difficulty:4,hp:205,speed:.057,dash:.165,weight:1.35,jab:10,power:1.08,reach:1.2,hurt:{radius:.45,height:1.85,depth:.42},ai:'balanced',
    signature:'Iron Reversal',keys:['A','+','K'],signatureDesc:'Counter an incoming heavy with a devastating reversal. A + L fires a laser; W + L awakens Dragon Install.',
    specials:{neutral:special('Alloy Claw',{damage:23,armor:true}),forward:special('Turbine Fang',{travel:.11,range:2.3,damage:25,wallBreak:true}),back:special('Chrome Ray',{projectile:true,range:9,startup:24,damage:22}),up:special('Dragon Install',{install:true,cost:35,cooldown:600,startup:18}),down:special('Steel Cyclone',{range:2.2,width:1.8,damage:22,launch:.17})},
  },
];

for(const fighter of ROSTER)Object.assign(fighter,DESIGNS[fighter.id]);

export const findFighter = id => ROSTER.find(f => f.id === id) || ROSTER[0];
export const ARENAS = {
  foundry:{name:'THE FOUNDRY',tag:'VOLCANIC INDUSTRIAL COMPLEX',floor:'#303729',edge:'#9ead5d',glow:'#d9fb65',bg:'#11190f',horizon:'#3b432b'},
  glacier:{name:'GLACIER VAULT',tag:'SUBZERO CONTAINMENT FACILITY',floor:'#273d43',edge:'#76bdca',glow:'#a6efff',bg:'#101d26',horizon:'#274c5a'},
  neon:{name:'NEON UNDERCITY',tag:'SECTOR 09 / AFTER HOURS',floor:'#32283f',edge:'#a97ca7',glow:'#ed92ff',bg:'#181120',horizon:'#42314e'},
};

export function getMove(data, key, direction = 'neutral', fighter = {}) {
  if (key === 'special') return {type:'special',element:data.element,...data.specials[direction]};
  if (key === 'jab') return {name:fighter.string === 1 ? 'Cross' : fighter.string === 2 ? 'Finisher' : 'Jab', type:'jab',startup:data.jab,active:3,recovery:14,damage:8,range:data.reach+.20,width:.43,stun:19,knockback:.025};
  if (key === 'heavy') {
    if(data.id==='ferrodrake' && direction==='back') return {name:'Iron Reversal',type:'parry',startup:1,active:20,recovery:22,damage:28,range:1.8,width:.7,stun:30,launch:.22};
    if(data.id==='zephyrix' && fighter.y>.1 && direction==='down') return {name:'Skyfall Kick',type:'heavy',startup:10,active:10,recovery:17,damage:24,range:2,width:.6,stun:28,dive:true};
    return {name:'Rising Breaker',type:'heavy',startup:20,active:4,recovery:27,damage:21,range:data.reach+.5,width:.48,stun:29,launch:.23,wallBreak:true,armor:data.weight>1.5};
  }
  if (key === 'godfist') return {name:'Magma God Fist',type:'heavy',element:'Fire',startup:14,active:5,recovery:24,damage:26,range:1.7,width:.5,stun:31,launch:.27,burn:true,wallBreak:true};
  if (key === 'grab') return {name:data.id==='glaciolith'?'Glacier Driver':'Clinch Throw',type:'grab',grab:true,startup:12,active:3,recovery:26,damage:data.id==='glaciolith'?30:22,range:data.id==='glaciolith'?1.9:1.2,width:.65,stun:32,launch:.16};
  if (key === 'burst') return {name:'Synergy: '+({Fire:'Extinction Event',Electric:'Million Volt Divide',Ice:'Absolute Zero',Wind:'Heavenfall',Earth:'Continental Divide',Shadow:'Eclipse Requiem',Water:'Abyssal Verdict',Steel:'Iron Eclipse'}[data.element]),type:'burst',startup:10,active:8,recovery:40,damage:49,range:3.5,width:1.9,stun:48,launch:.29,armor:true,wallBreak:true,element:data.element};
  return null;
}
