export const TALENTS={
  ferocity:{name:'Feral Instinct',branch:'FANG',icon:'⌁',cost:1,description:'+12% damage with every companion.',requires:null},
  execution:{name:'Mercy’s Edge',branch:'FANG',icon:'†',cost:1,description:'+25% damage against enemies below 35% health.',requires:'ferocity'},
  siphon:{name:'Blood into Bloom',branch:'FANG',icon:'❧',cost:1,description:'Every fifth direct hit restores half a heart.',requires:'execution'},
  stillwater:{name:'Stillwater',branch:'HEART',icon:'◉',cost:1,description:'Focus healing restores an extra half-heart.',requires:null},
  reservoir:{name:'Shared Wellspring',branch:'HEART',icon:'≈',cost:1,description:'Inactive companions recover Focus as you travel.',requires:'stillwater'},
  secondchance:{name:'Refuse the Silence',branch:'HEART',icon:'✧',cost:1,description:'Once per room, a lethal hit leaves your active companion at one heart.',requires:'reservoir'},
  fleet:{name:'Threadrunner',branch:'THREAD',icon:'»',cost:1,description:'+10% run speed. Dash recovery is 3 frames shorter.',requires:null},
  magnet:{name:'Echo Magnet',branch:'THREAD',icon:'◇',cost:1,description:'Collect loot from further away and gain 20% more Lumens from enemies.',requires:'fleet'},
  overdrive:{name:'Threefold Overture',branch:'THREAD',icon:'⋈',cost:1,description:'Resonance Surge recharges 40% faster. Swapping adds a damage pulse with a 2-second cooldown.',requires:'magnet'},
};
export const RARITIES={common:{name:'WORN',color:'#aebdb0',scale:1},rare:{name:'RESONANT',color:'#98d9eb',scale:1.3},legendary:{name:'MYTHIC',color:'#edc789',scale:1.8}};
export const EQUIPMENT={
  travelersSeal:{name:'Traveler’s Seal',slot:'relic',icon:'◇',description:'A promise worn close to the heart.',rarity:'common',mods:{damage:.04},value:8},
  lanternCoat:{name:'Lanternkeeper’s Mantle',slot:'armor',icon:'♧',description:'Warmth stitched from the last safe place.',rarity:'common',mods:{armor:.06},value:8},
  thornFang:{name:'Briar’s Testament',slot:'relic',icon:'❧',description:'The forest’s grief, sharpened into resolve.',rarity:'rare',mods:{damage:.12,focus:.05},value:24},
  voltaicCoil:{name:'The Ninth Note',slot:'relic',icon:'ϟ',description:'The voice the Conductor could never find.',rarity:'rare',mods:{damage:.08,surge:.25},value:27},
  tideCloak:{name:'Abyssal Vestment',slot:'armor',icon:'≈',description:'The tide moves around its wearer.',rarity:'rare',mods:{armor:.16,focus:.08},value:28},
  ashAegis:{name:'Saint’s Remorse',slot:'armor',icon:'♜',description:'It remembers the fire, and refuses to burn you.',rarity:'rare',mods:{armor:.2},value:32},
  glassNeedle:{name:'Meridian Needle',slot:'relic',icon:'❄',description:'The instant before a blow becomes a wound.',rarity:'rare',mods:{damage:.16,speed:.04},value:30},
  voidShroud:{name:'The Unwritten Coat',slot:'armor',icon:'◈',description:'There is no prophecy stitched inside.',rarity:'legendary',mods:{armor:.22,speed:.05},value:55},
  vellPromise:{name:'Vell’s Last Promise',slot:'relic',icon:'✧',description:'“You do not have to be remembered to be real.”',rarity:'legendary',mods:{damage:.2,focus:.1,surge:.2},value:60},
  palimpsestKey:{name:'The Unburned Page',slot:'relic',icon:'≋',description:'One history that cannot be overwritten.',rarity:'legendary',mods:{damage:.18,focus:.15},value:60},
  bellOath:{name:'The Saint’s Other Heart',slot:'armor',icon:'♜',description:'A second heartbeat, freely given.',rarity:'legendary',mods:{armor:.25,surge:.15},value:65},
  nullCrown:{name:'Crown of the Unwritten',slot:'relic',icon:'♕',description:'No one has worn this crown before. No one can tell you what comes next.',rarity:'legendary',mods:{damage:.25,speed:.08,surge:.3},value:100},
};
export const SHOP={flask:{name:'Bramble Flask',description:'Restore three hearts. V to drink.',cost:15,stock:5,icon:'♜'},
  thornFang:{name:'Briar’s Testament',description:'Resonant relic · damage and Focus.',cost:42,stock:1,icon:'❧'},
  ashAegis:{name:'Saint’s Remorse',description:'Resonant armor · reduce incoming damage.',cost:48,stock:1,icon:'♜'},
  insight:{name:'A Thought Not Yet Thought',description:'Gain one talent point. One available.',cost:55,stock:1,icon:'✧'},
};
export const BOND_RANKS=[{name:'Stranger',need:0,damage:0},{name:'Kindred',need:80,damage:.05},{name:'Soulbound',need:200,damage:.1},{name:'AWAKENED',need:400,damage:.18}];
export const HUNT_TYPES={moss:'aurora',forge:'meteor',reef:'aurora',storm:'meteor',frost:'aurora',rift:'eclipse'};
