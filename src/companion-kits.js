// Companion identity lives in gameplay data: movement, Focus economy and
// signature geometry all survive a party switch independently of the art.
// Horizontal directions are relative to the creature's facing, so A/D + L
// choose advance/retreat while W/S always choose the vertical variants.
export const COMPANION_KITS=Object.freeze({
  pyrojaw:{role:'Area denial / armored breaker',move:.97,jump:1,gravity:1,attack:1.14,maxHp:8,cost:27,cooldown:132,skill:'Caldera Mortar',signature:'Caldera Arsenal',passive:'Magma wounds',variants:{neutral:'Caldera Mortar',forward:'Obsidian Ram',back:'Cinder Tail',up:'Magma God Fist',down:'Burning Sanctuary'}},
  voltantis:{role:'Pursuit / fragile assassin',move:1.30,jump:1.08,gravity:1,attack:.75,maxHp:4,cost:24,cooldown:108,skill:'Chain Circuit',signature:'Storm Circuit',passive:'Conductive execution',variants:{neutral:'Chain Circuit',forward:'Plasma Cross',back:'Afterimage Retreat',up:'Storm Needle',down:'Static Snare'}},
  glaciolith:{role:'Grappler / crowd control',move:.80,jump:1,gravity:1,attack:1.30,maxHp:10,cost:30,cooldown:150,skill:'Glacier Toss',signature:'Permafrost Dominion',passive:'Shatter brittle targets',variants:{neutral:'Glacier Toss',forward:'Permafrost Grab',back:'Avalanche Suplex',up:'Glacier Pillar',down:'Whiteout Prison'}},
  zephyrix:{role:'Air mobility / displacement',move:1.18,jump:1.13,gravity:.92,attack:.80,maxHp:5,cost:23,cooldown:114,skill:'Wandering Vortex',signature:'Skyweaver Arts',passive:'Twin air dash',variants:{neutral:'Wandering Vortex',forward:'Gale Dive',back:'Wing Buffet',up:'Updraft Choir',down:'Vacuum Mine'}},
  terrakhan:{role:'Slow fortress / ground control',move:.76,jump:1,gravity:1,attack:1.25,maxHp:11,cost:28,cooldown:150,skill:'Fortress Reprisal',signature:'Tectonic Stances',passive:'Charged shell counter',variants:{neutral:'Fortress Reprisal',forward:'Horn Bastion',back:'Rolling Menhir',up:'Fault Spire',down:'Quake Stance'}},
  noxshade:{role:'Traps / cross-up setups',move:1.16,jump:1.045,gravity:1,attack:.90,maxHp:5,cost:25,cooldown:138,skill:'Shadow Marionette',signature:'Phantom Theatre',passive:'A clone mirrors the next strike',variants:{neutral:'Shadow Marionette',forward:'Prowler Mark',back:'False Escape',up:'Nightfall Rake',down:'Grave Lantern'}},
  aqualance:{role:'Long reach / elemental setup',move:1.05,jump:1.02,gravity:1,attack:1.02,maxHp:6,cost:24,cooldown:120,skill:'Pressure Lance',signature:'Tidal Geometry',passive:'Soak primes lightning and frost',variants:{neutral:'Pressure Lance',forward:'Spiral Piercer',back:'Undertow Reversal',up:'Rising Geyser',down:'Tidal Basin'}},
  ferrodrake:{role:'Counter duelist / charged artillery',move:.99,jump:1.01,gravity:1,attack:1.07,maxHp:8,cost:29,cooldown:144,skill:'Railwing Beam',signature:'Aegis Protocols',passive:'Aegis wing reverses attacks',variants:{neutral:'Railwing Beam',forward:'Wing Guillotine',back:'Aegis Wing',up:'Anti-Air Batteries',down:'Dragon Foundry'}},
});
export const FORTRESS_HOLD_FRAMES=120;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function signatureFacing(g){
  const p=g.player,target=g.enemies.filter(e=>e.hp>0&&Math.abs(e.x-p.x)<650&&Math.abs(e.y-p.y)<260).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  return target?Math.sign(target.x-p.x)||p.face||1:1;
}
export function signatureVariant(g){
  if(g.inputs.up)return 'up';if(g.inputs.down)return 'down';
  const direction=Number(!!g.inputs.right)-Number(!!g.inputs.left);
  return !direction?'neutral':direction===signatureFacing(g)?'forward':'back';
}
function field(g,type,extra={}){
  const p=g.player,data=g.data;
  const f={type,x:p.x,y:p.y,radius:140,width:200,height:70,life:120,maxLife:120,interval:24,damage:5,owner:g.activeSlot,sourceId:data.id,color:data.color,face:p.face,variant:p.signatureVariant,...extra};
  f.maxLife=f.life;g.companionFields.push(f);return f;
}
function bolt(g,extra={}){
  const p=g.player;
  g.projectiles.push({x:p.x+p.face*28,y:p.y-g.data.bodyHeight*.6,vx:p.face*12,vy:0,life:60,owner:g.activeSlot,color:g.data.color,element:g.data.element,damage:18,kind:'needle',signature:g.data.id,hit:new Set(),...extra});
}
function pulse(g,{x=g.player.x,y=g.player.y,radius=150,height=110,damage=18,front=false,...options}={}){
  const frameEnemies=g.enemies;
  for(const e of g.enemies)if(e.hp>0&&Math.abs(e.x-x)<radius&&Math.abs(e.y-y)<height&&(!front||(e.x-x)*g.player.face>-25)){
    g.strike(e,damage,Math.sign(e.x-x)||g.player.face,{source:g.activeSlot,element:g.data.element,signature:g.data.id,...options});
    if(g.enemies!==frameEnemies||g.player.respawning)return;
  }
}
function rush(g,{speed=26,life=7,damage=22,armor=0,invul=0,radius=90,element=g.data.element,diagonal=false}={}){
  const p=g.player;
  // Specials share the finite aerial movement budget; switching cannot create
  // another jump or a way around the Rift Step veil.
  if(!p.grounded&&p.airDashes>=(g.data.id==='zephyrix'?2:1))return false;
  p.dash=life;p.dashElapsed=0;p.dashSpeed=speed;p.dashUsed=true;p.dashCooldown=Math.max(p.dashCooldown,24);p.armor=armor;p.invul=Math.max(p.invul,invul);
  p.skillVector=diagonal&&!p.grounded?{x:p.face*.8,y:.6}:null;
  if(!p.grounded){p.airDashes++;g.stats.airDashes++;}g.stats.dashes++;
  g.skillStrike={life,damage,radius,element,owner:g.activeSlot,hit:new Set()};return true;
}

/** Returns null for a rescued companion, false for a failed cast. */
export function castCompanionSkill(g){
  const id=g.data.id,kit=COMPANION_KITS[id];if(!kit)return null;
  const p=g.player,m=g.party[g.activeSlot],variant=signatureVariant(g);
  if(m.skillCooldown||p.spirit<kit.cost||p.attack||p.dash||p.stagger||p.guardBroken||p.respawning)return false;
  if(variant==='forward'&&['pyrojaw','voltantis','zephyrix'].includes(id)&&!p.grounded&&p.airDashes>=(id==='zephyrix'?2:1))return false;
  p.face=signatureFacing(g);p.spirit-=kit.cost;m.skillCooldown=kit.cooldown;p.signatureAnim=42;p.signatureVariant=variant;p.powerAura=Math.max(p.powerAura||0,30);g.cancelHeal();
  const floor=p.y;
  if(id==='pyrojaw'){
    if(variant==='neutral')for(let i=0;i<3;i++)bolt(g,{vx:p.face*(6+i*2),vy:-5-i*.8,gravity:.22,kind:'magma',damage:10,life:90});
    if(variant==='forward')rush(g,{speed:24,life:10,damage:28,armor:1});
    if(variant==='back'){pulse(g,{radius:160,damage:24,heavy:true});p.vx=-p.face*11;}
    if(variant==='up'){pulse(g,{x:p.x+p.face*52,y:p.y-70,radius:95,height:230,damage:26,launch:-15,heavy:true});field(g,'magma',{x:p.x+p.face*52,radius:65,height:200,life:42,damage:3,variant:'up'});}
    if(variant==='down')field(g,'magma',{radius:190,life:240,damage:5,interval:30});
  }
  if(id==='voltantis'){
    if(variant==='neutral'){
      const targets=g.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<440).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x)).slice(0,3);
      for(const e of targets){field(g,'lightning',{x:e.x,y:e.y,radius:38,height:150,life:28,damage:0});g.strike(e,targets.indexOf(e)?11:17,Math.sign(e.x-p.x)||p.face,{source:g.activeSlot,element:'Electric',signature:id,stun:18});}
      if(!targets.length)bolt(g,{vx:p.face*21,damage:17,kind:'needle',life:24});
    }
    if(variant==='forward')rush(g,{speed:34,life:6,damage:17,invul:7,element:'Electric'});
    if(variant==='back'){p.vx=-p.face*20;p.wallLock=5;p.invul=Math.max(p.invul,8);field(g,'lightning',{x:p.x,radius:100,life:100,damage:12,interval:45,trap:true});}
    if(variant==='up')for(const vy of [-17,-14,-11])bolt(g,{vx:p.face*3,vy,damage:8,life:28});
    if(variant==='down')field(g,'lightning',{x:p.x+p.face*120,radius:115,life:210,damage:10,interval:45,trap:true});
  }
  if(id==='glaciolith'){
    if(variant==='neutral')bolt(g,{kind:'ice',vx:p.face*8,vy:-3,gravity:.13,damage:32,heavy:true,life:80});
    if(variant==='forward'||variant==='back'){
      const targets=g.enemies.filter(e=>e.hp>0&&Math.abs(e.x-p.x)<190&&Math.abs(e.y-p.y)<110).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
      const target=targets[0];
      if(target){if(!target.boss)target.x=clamp(p.x+p.face*(variant==='back'?-85:70),target.left??24,target.right??g.worldWidth-40);g.strike(target,36,variant==='back'?-p.face:p.face,{heavy:true,source:g.activeSlot,element:'Ice',signature:id,launch:-12});target.slow=210;}
      field(g,'icewall',{x:p.x+p.face*(variant==='back'?-85:90),radius:65,width:70,height:130,life:70,damage:6,interval:35});
    }
    if(variant==='up')field(g,'icewall',{x:p.x+p.face*100,radius:55,width:70,height:250,life:115,damage:11,interval:38});
    if(variant==='down'){pulse(g,{radius:190,damage:16,element:'Ice'});field(g,'icewall',{radius:180,width:360,height:45,life:210,damage:4,interval:42});}
  }
  if(id==='zephyrix'){
    if(variant==='neutral')field(g,'vortex',{x:p.x+p.face*140,radius:180,height:210,life:150,damage:5,interval:25,pull:.06,vx:p.face*.7});
    if(variant==='forward')rush(g,{speed:30,life:8,damage:19,invul:4,diagonal:true});
    if(variant==='back'){pulse(g,{radius:240,damage:13,launch:-9});for(const e of g.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<240)e.x=clamp(e.x+Math.sign(e.x-p.x)*(e.boss?8:75),e.left??24,e.right??g.worldWidth-40);p.vx=-p.face*12;}
    if(variant==='up'){field(g,'vortex',{radius:140,height:300,life:100,damage:4,interval:25,updraft:true});p.featherFall=90;}
    if(variant==='down')field(g,'vortex',{x:p.x+p.face*100,radius:115,life:190,damage:16,interval:60,trap:true,pull:.08,launch:-14});
  }
  if(id==='terrakhan'){
    if(variant==='neutral'){p.specialHeld=true;p.specialCharge=0;p.stored=0;p.signatureCharge=true;field(g,'fault',{radius:100,width:200,height:45,life:FORTRESS_HOLD_FRAMES,damage:0,charging:true});}
    if(variant==='forward'){p.armor=1;p.shield=Math.min(100,p.shield+25);pulse(g,{x:p.x+p.face*65,radius:145,front:true,damage:29,heavy:true,fracture:true});}
    if(variant==='back')bolt(g,{kind:'rockwave',vx:-p.face*8,damage:28,heavy:true,piercing:true,y:p.y-12,life:48});
    if(variant==='up')field(g,'fault',{x:p.x+p.face*110,radius:70,width:90,height:240,life:75,damage:14,interval:37,fracture:true});
    if(variant==='down')for(const direction of [-1,1])field(g,'fault',{x:p.x,y:floor,radius:70,width:150,height:65,vx:direction*8,life:55,damage:13,interval:15,fracture:true});
  }
  if(id==='noxshade'){
    if(variant==='neutral'||variant==='back'){g.decoy={x:clamp(p.x+p.face*(variant==='back'?60:170),24,g.worldWidth-40),y:p.y,life:330,owner:g.activeSlot,mimic:true};if(variant==='back'){p.vx=-p.face*16;p.wallLock=5;p.invul=Math.max(p.invul,8);}}
    if(variant==='forward'){pulse(g,{x:p.x+p.face*130,radius:150,front:true,damage:18,marked:true});field(g,'shadowtrap',{x:p.x+p.face*160,radius:80,life:110,damage:4,interval:45,marked:true});}
    if(variant==='up'){pulse(g,{x:p.x+p.face*40,y:p.y-100,radius:130,height:240,damage:18,launch:-14,marked:true});}
    if(variant==='down')field(g,'shadowtrap',{x:p.x+p.face*90,radius:100,life:300,damage:13,interval:55,trap:true,marked:true});
  }
  if(id==='aqualance'){
    if(variant==='neutral')bolt(g,{kind:'water',vx:p.face*21,life:35,damage:23,piercing:true,wet:true});
    if(variant==='forward'){pulse(g,{x:p.x+p.face*180,radius:190,front:true,damage:25,wet:true,heavy:true});field(g,'tide',{x:p.x+p.face*200,radius:75,width:300,height:32,life:32,damage:0});}
    if(variant==='back'){p.vx=-p.face*16;p.wallLock=5;field(g,'tide',{x:p.x+p.face*110,radius:190,life:150,damage:4,interval:30,pull:.05,wet:true});}
    if(variant==='up')field(g,'tide',{x:p.x+p.face*100,radius:70,width:100,height:270,life:90,damage:10,interval:30,launch:-13,wet:true});
    if(variant==='down')field(g,'tide',{radius:210,width:420,height:40,life:240,damage:3,interval:40,wet:true});
  }
  if(id==='ferrodrake'){
    if(variant==='neutral')field(g,'beam',{x:p.x,y:p.y-35,radius:350,width:350,height:52,life:42,damage:10,interval:14,front:true});
    if(variant==='forward'){pulse(g,{x:p.x+p.face*80,radius:190,front:true,damage:28,heavy:true,fracture:true});p.armor=1;}
    if(variant==='back'){p.guard=90;p.armor=1;p.shield=Math.min(100,p.shield+35);field(g,'beam',{x:p.x,y:p.y-35,radius:100,width:80,height:115,life:90,damage:0,guard:true});}
    if(variant==='up')for(const angle of [-.9,-.45,0])bolt(g,{kind:'ember',vx:p.face*Math.cos(angle)*14,vy:Math.sin(angle)*14-3,damage:11,life:35});
    if(variant==='down'){p.armor=1;field(g,'beam',{radius:160,width:320,height:95,life:150,damage:6,interval:30,both:true});}
  }
  const event={id,variant,name:kit.variants[variant],x:p.x,y:p.y,face:p.face,color:g.data.color,life:48};
  g.effects.push({type:'signature',...event});g.emit('signature',event);g.emit('cast',event);g.say(event.name.toUpperCase());return true;
}

export function releaseCompanionSkill(g){
  const p=g.player;if(g.data.id!=='terrakhan'||!p.signatureCharge)return false;
  if(p.specialHeld){
    const charged=p.specialCharge>=15,damage=charged?27+p.stored*5:18;
    for(const direction of charged?[-1,1]:[p.face])field(g,'fault',{x:p.x,y:p.y,radius:80,width:160,height:70,life:55,vx:direction*9,damage,interval:50,fracture:true,once:true});
    g.emit('signature',{id:'terrakhan',variant:'release',name:'Fortress Reprisal',x:p.x,y:p.y,face:p.face,color:g.data.color,life:48});
  }
  p.signatureCharge=false;p.specialHeld=false;p.fortress=false;p.specialCharge=0;
  g.companionFields=g.companionFields.filter(f=>!f.charging);return true;
}

export function updateCompanionFields(g){
  const p=g.player,frameEnemies=g.enemies;
  // A shell is a two-second commitment, not a permanent free shield. Use the
  // host release path so expiry starts the same shared/personal reuse as keyup.
  if(p.signatureCharge&&(!p.specialHeld||p.specialCharge>=FORTRESS_HOLD_FRAMES))g.releaseSpecial();
  if(p.signatureAnim>0)p.signatureAnim--;if(p.featherFall>0){p.featherFall--;if(!p.grounded&&p.vy>5)p.vy=5;}
  for(const e of g.enemies)for(const status of ['soaked','marked','fractured'])if(e[status]>0)e[status]--;
  for(const f of g.companionFields){
    f.life--;f.x+=f.vx||0;
    if(f.charging){f.x=p.x;f.y=p.y;if(!p.signatureCharge)f.life=0;continue;}
    for(const e of g.enemies){
      if(e.hp<=0)continue;
      const dx=e.x-f.x,dy=e.y-f.y,vertical=f.type==='beam'?Math.abs(e.y-55-f.y)<f.height:dy<80&&dy>-f.height;
      if(!vertical||Math.abs(dx)>f.radius||f.front&&dx*f.face<-15)continue;
      if(f.type==='icewall')e.slow=Math.max(e.slow||0,80);
      if(f.wet)e.soaked=240;if(f.marked)e.marked=240;
      if(f.pull)e.x=clamp(e.x+(f.x-e.x)*(e.boss?f.pull*.08:f.pull),e.left??24,e.right??g.worldWidth-40);
      if(f.updraft&&!e.boss){e.juggle=Math.max(e.juggle||0,10);e.launchVy=Math.min(e.launchVy||0,-3);}
      if(f.damage<=0)continue;
      if(f.trap&&f.triggered)continue;
      if(!f.trap&&f.life%f.interval!==0)continue;
      if(f.once&&f.hit?.has(e.id))continue;
      if(f.once){f.hit??=new Set();f.hit.add(e.id);}
      if(f.trap){f.triggered=true;f.life=Math.min(f.life,24);}
      const element={magma:'Fire',lightning:'Electric',icewall:'Ice',vortex:'Wind',fault:'Earth',shadowtrap:'Shadow',tide:'Water',beam:'Steel'}[f.type];
      g.strike(e,f.damage,Math.sign(dx)||f.face,{source:f.owner,element,signature:f.sourceId,dot:!f.trap,wet:f.wet,marked:f.marked,fracture:f.fracture,launch:f.launch});
      if(g.enemies!==frameEnemies||p.respawning)return;
    }
  }
  g.companionFields=g.companionFields.filter(f=>f.life>0);
}

/** Cross-companion interactions change useful openings, rather than a flat
 * type chart. Effects belong to the hit's owner even after a party switch. */
export function companionStrikeDamage(g,e,damage,options){
  if(options.wet||options.element==='Water')e.soaked=Math.max(e.soaked||0,240);
  if(options.marked)e.marked=240;
  if(options.fracture)e.fractured=200;
  if(e.marked&&!options.dot&&!options.marked){damage*=1.18;e.marked=0;g.emit('resonance',{kind:'shadow',x:e.x,y:e.y,color:'#b88be2'});}
  if(e.fractured&&options.heavy&&!options.fracture){damage*=1.20;e.fractured=0;g.emit('resonance',{kind:'shatter',x:e.x,y:e.y,color:'#c6e9e4'});}
  if(e.soaked&&options.element==='Electric'&&!options.dot){e.conductiveHitTick=g.tick;e.stun=Math.max(e.stun||0,e.boss?6:24);g.emit('resonance',{kind:'conduct',x:e.x,y:e.y,color:'#e7fc8d'});}
  if(e.soaked&&options.element==='Ice'){e.slow=Math.max(e.slow||0,240);if(!e.boss)e.frozen=Math.max(e.frozen||0,24);e.soaked=0;g.emit('resonance',{kind:'frost',x:e.x,y:e.y,color:'#bdeeff'});}
  return damage;
}
export function echoCompanionStrike(g,e,damage,options){
  if(e.conductiveHitTick===g.tick&&options.element==='Electric'&&!options.dot&&!options.conduct){
    e.conductiveHitTick=-1;
    const neighbor=g.enemies.filter(t=>t!==e&&t.hp>0&&t.soaked>0&&Math.hypot(t.x-e.x,t.y-e.y)<210).sort((a,b)=>Math.abs(a.x-e.x)-Math.abs(b.x-e.x))[0];
    if(neighbor){
      const owner=options.source??g.activeSlot;
      field(g,'lightning',{x:neighbor.x,y:neighbor.y,radius:45,height:160,life:30,damage:0,owner,sourceId:g.party[owner].data.id,color:'#dbfc65'});
      g.strike(neighbor,damage*.35,Math.sign(neighbor.x-e.x)||g.player.face,{source:owner,element:'Electric',dot:true,conduct:true});
    }
  }
  const clone=g.decoy;
  if(!clone?.mimic||options.dot||options.echo||!options.move||e.hp<=0)return;
  clone.mimic=false;
  const target=g.enemies.filter(t=>t.hp>0&&Math.abs(t.x-clone.x)<260&&Math.abs(t.y-clone.y)<150).sort((a,b)=>Math.abs(a.x-clone.x)-Math.abs(b.x-clone.x))[0];
  if(target){g.strike(target,damage*.55,Math.sign(target.x-clone.x)||-g.player.face,{source:clone.owner,element:'Shadow',signature:'noxshade',echo:true});g.effects.push({type:'signature',id:'noxshade',variant:'echo',x:clone.x,y:clone.y,face:Math.sign(target.x-clone.x)||-g.player.face,color:'#ab82d4',life:30});g.emit('signature',{id:'noxshade',variant:'echo',name:'Shadow Echo',x:clone.x,y:clone.y,face:g.player.face,color:'#ab82d4',life:30});}
}
export function companionKitSnapshot(g){const kit=COMPANION_KITS[g.data.id];return kit?{...kit,variants:{...kit.variants},tips:{...kit.tips},variant:signatureVariant(g),remaining:g.party[g.activeSlot].skillCooldown}:null;}

const TIPS={
  pyrojaw:{neutral:'Three arcing magma rocks leave persistent burn pools.',forward:'A grounded armored body check commits to a long rush.',back:'A close tail sweep covers a recoil step.',up:'An upward fist catches airborne targets and ignites a narrow geyser.',down:'A broad fire pool controls a place for four seconds.'},
  voltantis:{neutral:'Lightning jumps to up to three nearby enemies without aiming a projectile.',forward:'A brief, invulnerable plasma cross trades reach for quick repositioning.',back:'Withdraw and leave a conductive afterimage trap.',up:'Three rising needles intercept enemies above you.',down:'Place a one-use static snare ahead of your feet.'},
  glaciolith:{neutral:'An armored ice boulder drops slowly through a distant line.',forward:'Grab the nearest target and slam it into ice; bosses resist relocation.',back:'Throw a close target behind you to separate a pack.',up:'A tall ice pillar controls a narrow column.',down:'A low frost prison slows a broad group; soaked minions freeze.'},
  zephyrix:{neutral:'A drifting vortex pulls a group together for another companion.',forward:'A fast aerial dive descends while striking; it spends an air dash.',back:'Buffet nearby foes away while retreating.',up:'An updraft lifts minions and gives you a temporary slow fall.',down:'A vacuum mine pulls and launches its first victim.'},
  terrakhan:{neutral:'Hold L to raise Fortress Shell for up to two seconds; release to launch shockwaves. Expiry releases it and restarts reuse. Blocked attacks strengthen the release.',forward:'A horn crush fractures a close target and restores some Guard.',back:'Send a rolling menhir behind you without moving your heavy body.',up:'A fault spire attacks a tall, narrow space.',down:'Twin ground faults travel in opposite directions.'},
  noxshade:{neutral:'A shadow clone mirrors your next connecting J/K from its own position, even after a switch.',forward:'Mark a target; the next companion’s direct strike cashes in the mark.',back:'Withdraw and leave a clone at the escape point.',up:'An anti-air shadow rake marks its victims.',down:'A long-lived lantern trap marks and bursts on its first victim.'},
  aqualance:{neutral:'A long, piercing water thrust soaks every enemy on its path.',forward:'A precise distant rapier strike leaves the close pocket uncovered.',back:'Withdraw and leave a pulling undertow to gather enemies.',up:'A narrow geyser lifts and soaks targets above it.',down:'A long-lived tidal basin soaks a group for Electric or Ice follow-ups.'},
  ferrodrake:{neutral:'A stationary rail beam pulses three times along a horizontal lane.',forward:'A close wing blade fractures a target and grants one armor hit.',back:'Raise the Aegis Wing: counter the next frontal hit and refill Guard.',up:'Fan three metal-fire shots into the air.',down:'Deploy a short-range foundry pulse around an armored body.'},
};
for(const [id,kit] of Object.entries(COMPANION_KITS)){
  kit.tips=Object.freeze(TIPS[id]);Object.freeze(kit.variants);Object.freeze(kit);
}
