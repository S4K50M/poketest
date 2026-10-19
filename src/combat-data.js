// Combat runs on a fixed 60 Hz clock. Durations below are simulation frames,
// not wall-clock milliseconds; rendering never changes a cancel window.
export const COMBAT = {
  fps: 60,
  inputBuffer: 12,
  chainWindow: 24,
  comboTimer: 100,
  guardMax: 100,
  guardDrain: .24,
  guardRegen: .75,
  guardRegenDelay: 38,
  guardDamage: 24,
  guardBreakFrames: 52,
  parryFrames: 7,
  parryFocus: 10,
  riposteWindow: 45,
  guardWalk: .4,
  shieldDamageScale: .12,
  hitInvul: 32,
  dashInvul: 8,
  dashCancelFrame: 3,
  airDashLimit: 1,
  motor: {
    run: 10.3, acceleration: 3.2, friction: 3.6, gravity: .78,
    jump: -16.3, doubleJump: -14.7, fall: 19,
    dash: 24, dashFrames: 8, dashCooldown: 17,
    coyote: 8, jumpBuffer: 9,
  },
};

// start / active / recovery describe the entire move. cancelAt is an absolute
// frame within it; hit is tracked by the engine so each target is struck once.
// launch is initial upward velocity (negative Y); stun is grounded hit-stun.
export const MOVES = {
  light1: {id:'light1',type:'light',name:'Quick Fang',start:2,active:3,recovery:4,damage:10,range:105,reachY:72,impulse:2.7,launch:0,stun:10,hitstop:1,cancelAt:5,pose:'attack',next:'light2'},
  light2: {id:'light2',type:'light',name:'Cross Fang',start:2,active:4,recovery:4,damage:12,range:118,reachY:76,impulse:3.6,launch:0,stun:12,hitstop:1,cancelAt:6,pose:'attack',next:'light3'},
  light3: {id:'light3',type:'light',name:'Rising Fang',start:3,active:4,recovery:7,damage:18,range:136,reachY:84,impulse:5.2,launch:-9.8,stun:17,hitstop:3,cancelAt:7,pose:'heavy',finisher:true},
  heavy: {id:'heavy',type:'heavy',name:'Heartbreaker',start:5,active:5,recovery:9,damage:28,range:150,reachY:86,impulse:6.2,launch:-8,stun:22,hitstop:3,cancelAt:10,pose:'heavy',armor:true,finisher:true},
  launcher: {id:'launcher',type:'heavy',name:'Skybreaker',start:4,active:5,recovery:7,damage:22,range:112,reachY:148,impulse:2.4,launch:-15.6,stun:22,hitstop:3,cancelAt:9,pose:'heavy',dir:'up',finisher:true},
  plunge: {id:'plunge',type:'heavy',name:'Comet Talon',start:3,active:6,recovery:8,damage:25,range:92,reachY:150,impulse:0,launch:-9,stun:20,hitstop:3,cancelAt:9,pose:'heavy',dir:'down',air:true,finisher:true},
  airlight: {id:'airlight',type:'light',name:'Cloud Fang',start:2,active:4,recovery:4,damage:11,range:115,reachY:100,impulse:2,launch:-4.5,stun:13,hitstop:1,cancelAt:6,pose:'attack',air:true},
  dashstrike: {id:'dashstrike',type:'light',name:'Flash Fang',start:2,active:4,recovery:6,damage:16,range:145,reachY:80,impulse:9,launch:-5,stun:16,hitstop:2,cancelAt:6,pose:'dash',finisher:true},
  riposte: {id:'riposte',type:'heavy',name:'Perfect Reversal',start:1,active:5,recovery:8,damage:36,range:175,reachY:110,impulse:8,launch:-12.5,stun:28,hitstop:4,cancelAt:6,pose:'heavy',armor:true,finisher:true},
};

// An equipped power uses X; Z cycles equipped choices. Costs draw from the
// active companion's Focus, shared with healing and its signature special.
// cooldown / duration / interval are frames. Each record's type is also the
// implementation branch; the remaining numbers are its authoritative tuning.
export const POWERS = {
  arcbolt: {
    id:'arcbolt',name:'Kinetic Bolt',icon:'ϟ',color:'#b7f6de',type:'arcbolt',
    description:'Fire a piercing bolt through the front line. A cheap ranged route into a dash combo.',
    cost:16,cooldown:32,damage:18,speed:17,life:42,piercing:true,unlock:{kind:'starter'},
  },
  aegis: {
    id:'aegis',name:'Aegis Pulse',icon:'⬡',color:'#a8d9ff',type:'aegis',
    description:'Blast nearby enemies away, restore Guard, and raise a temporary protective shell.',
    cost:24,cooldown:210,damage:12,radius:170,duration:100,guardRestore:60,shield:2,unlock:{kind:'starter'},
  },
  comet: {
    id:'comet',name:'Comet Rush',icon:'☄',color:'#ffb373',type:'comet',
    description:'Rocket forward in a burning charge that launches enemies. Works in the air.',
    cost:28,cooldown:90,damage:32,speed:29,duration:10,radius:88,launch:-12,unlock:{kind:'ability',id:'claw',label:'Defeat the Briar Matron'},
  },
  cyclone: {
    id:'cyclone',name:'Thread Cyclone',icon:'◌',color:'#d1f5bd',type:'cyclone',
    description:'Weave a vortex around yourself. Pull enemies inward and shred them with repeated hits.',
    cost:30,cooldown:150,damage:7,radius:190,duration:90,interval:15,pull:.7,unlock:{kind:'ability',id:'grapple',label:'Defeat Saint Bellows'},
  },
  frostnova: {
    id:'frostnova',name:'Tideglass Nova',icon:'❄',color:'#a9eaff',type:'frostnova',
    description:'Shatter a ring of frozen water, briefly freeze minions, and slow every surviving target.',
    cost:32,cooldown:190,damage:24,radius:250,freeze:35,slow:180,unlock:{kind:'ability',id:'swim',label:'Defeat the Ink Leviathan'},
  },
  thunderstep: {
    id:'thunderstep',name:'Thunderstep',icon:'↯',color:'#e5c0ff',type:'thunderstep',
    description:'Blink through enemies in an electric streak. Reposition safely and extend aerial chains.',
    cost:22,cooldown:58,damage:23,speed:33,duration:8,radius:85,invul:12,stun:15,unlock:{kind:'ability',id:'wings',label:'Defeat the Storm Conductor'},
  },
  riftcut: {
    id:'riftcut',name:'Rift Sever',icon:'◇',color:'#ffadd2',type:'riftcut',
    description:'Tear a long line through space. A fast punish with broad reach and an upward kick.',
    cost:30,cooldown:92,damage:36,range:330,reachY:105,launch:-9,unlock:{kind:'ability',id:'blink',label:'Defeat the Hourglass Stag'},
  },
  bloodmoon: {
    id:'bloodmoon',name:'Worldheart Eclipse',icon:'◒',color:'#ff839e',type:'bloodmoon',
    description:'Detonate a heart-shaped shockwave. Devour its echoes to restore two hearts.',
    cost:40,cooldown:280,damage:48,radius:260,heal:2,launch:-10,unlock:{kind:'fragment',id:'crown',label:'Defeat the Hollow Sovereign'},
  },
  timefracture: {
    id:'timefracture',name:'Stolen Second',icon:'◷',color:'#ffd08b',type:'timefracture',
    description:'Break the bell of time. A slowing field leaves room for a heal, escape, or long combo.',
    cost:34,cooldown:360,damage:10,radius:410,duration:180,slow:180,timeScale:.3,unlock:{kind:'boss',id:'belltwin',label:'Defeat the Belltwin in the Clockwork Ossuary'},
  },
  gravitywell: {
    id:'gravitywell',name:'Paper Moon',icon:'◉',color:'#d9c0ff',type:'gravitywell',
    description:'Summon a singularity ahead of you. Drag foes into one place and crush them in pulses.',
    cost:34,cooldown:240,damage:6,radius:280,duration:120,interval:20,pull:.95,offset:170,unlock:{kind:'boss',id:'palimpsest',label:'Defeat the Palimpsest in the Paper Moon'},
  },
  choir: {
    id:'choir',name:'Kindred Choir',icon:'⋈',color:'#a5ffe1',type:'choir',
    description:'Three spectral companions answer your bond with homing shots from different angles.',
    cost:38,cooldown:180,damage:20,count:3,speed:11,life:85,homing:true,unlock:{kind:'mastery',xp:200,label:'Reach Soulbound mastery with any companion'},
  },
  phoenix: {
    id:'phoenix',name:'First Sunrise',icon:'✦',color:'#ffdf9d',type:'phoenix',
    description:'Become a blazing sunrise. Throw enemies upward and mend three hearts in the aftermath.',
    cost:45,cooldown:420,damage:65,radius:330,heal:3,launch:-17,invul:30,unlock:{kind:'boss',id:'nullheart',label:'Defeat the Nullheart in Cradle Zero'},
  },
};

const includes = (collection, id) => collection instanceof Set ? collection.has(id) : Array.isArray(collection) && collection.includes(id);

export function powerUnlocked(game, id) {
  if (!Object.hasOwn(POWERS, id)) return false;
  const power = POWERS[id];
  const unlock = power.unlock;
  if (unlock.kind === 'starter') return true;
  if (unlock.kind === 'ability') return includes(game?.abilities, unlock.id);
  if (unlock.kind === 'fragment') return includes(game?.fragments, unlock.id);
  if (unlock.kind === 'boss') return includes(game?.defeatedBosses, unlock.id);
  if (unlock.kind === 'mastery') return Object.values(game?.companionXP || {}).some(xp => Number.isFinite(xp) && xp >= unlock.xp);
  if (unlock.kind === 'quest') return game?.quests?.[unlock.id]?.state === 'complete';
  return false;
}

export function availablePowers(game) {
  return Object.values(POWERS).filter(power => powerUnlocked(game, power.id));
}

export function powerLockReason(game, id) {
  if (!Object.hasOwn(POWERS, id)) return 'Unknown power';
  const power = POWERS[id];
  return powerUnlocked(game, id) ? '' : power.unlock.label || 'Continue the Worldheart journey';
}
