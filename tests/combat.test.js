import test from 'node:test';
import assert from 'node:assert/strict';
import { RPGCampaign } from '../src/rpg.js';
import { CampaignEngine } from '../src/campaign.js';
import { COMBAT, MOVES, POWERS, availablePowers, powerUnlocked } from '../src/combat-data.js';

const frames=(g,n)=>{for(let i=0;i<n;i++)g.step();};
const fixture=(party=['pyrojaw','zephyrix','noxshade'])=>{
  const events=[],g=new RPGCampaign(party,{onEvent:e=>events.push(e)});
  g.storyStage=1;g.enemies=[];g.relics=[];Object.assign(g.player,{x:250,invul:0});g.loadout={relic:null,armor:null};
  return {g,p:g.player,events};
};
const target=(g,{x=g.player.x+70,y=520,hp=10000,...extra}={})=>{
  const e={id:100+g.enemies.length,key:'combat-test:'+g.enemies.length,kind:'sinder',x,y,baseY:y,home:x,hp,maxHp:hp,face:-1,state:'recover',timer:10000,flash:0,stun:10000,vx:0,slow:0,flipped:0,left:x,right:x,...extra};
  g.enemies.push(e);return e;
};
const until=(g,predicate,limit=120)=>{
  for(let i=0;i<limit&&!predicate();i++)g.step();
  assert(predicate(),'expected combat state within '+limit+' frames');
};
const unlockAll=g=>{
  for(const id of ['claw','grapple','swim','wings','blink'])g.abilities.add(id);
  g.fragments.add('crown');for(const id of ['belltwin','palimpsest','nullheart'])g.defeatedBosses.add(id);
  g.companionXP.pyrojaw=200;
};

test('J J J buffers a three-part chain and each swing strikes a target exactly once',()=>{
  const {g,p}=fixture(),e=target(g),seen=[];
  assert(g.input('light'));assert.equal(p.attack.move,'light1');
  for(const next of ['light2','light3']){
    frames(g,2);assert(g.input('light'));
    until(g,()=>p.attack?.move===next);seen.push(next);
  }
  until(g,()=>!p.attack);
  assert.deepEqual(seen,['light2','light3']);
  assert.equal(g.directHits,3,'active frames must not repeatedly damage the same enemy');
  assert(e.hp<e.maxHp);assert(g.combat.flow>0);assert(g.combat.stats.launches>0);
  assert.equal(g.combat.snapshot().move,null);
});

test('J J K branches into a launcher; up-heavy and aerial down-heavy choose directional moves',()=>{
  const {g,p}=fixture();target(g);
  g.input('light');frames(g,2);g.input('light');until(g,()=>p.attack?.move==='light2');
  frames(g,2);g.input('heavy');until(g,()=>p.attack?.move==='launcher');
  until(g,()=>!p.attack);assert(g.combat.stats.launches>0);
  g.setInputs({up:true});assert(g.input('heavy'));assert.equal(p.attack.move,'launcher');assert.equal(p.attack.dir,'up');
  until(g,()=>!p.attack);g.abilities.add('claw');g.setInputs({down:true});
  Object.assign(p,{y:350,grounded:false,coyote:0,jumpCount:1});
  assert(g.input('heavy'));assert.equal(p.attack.move,'plunge');assert.equal(p.attack.dir,'down');assert(p.vy>0);
});

test('the first seven shield frames deflect, reward Focus and open one immediate riposte',()=>{
  const {g,p,events}=fixture();target(g);p.spirit=40;
  const hp=p.hp;assert(g.input('shield'));assert.equal(p.parryFrames,COMBAT.parryFrames);
  assert.equal(g.hurt(-p.face,1),false);assert.equal(p.hp,hp);assert.equal(p.spirit,40+COMBAT.parryFocus);
  assert.equal(g.combat.stats.parries,1);assert(p.riposte>0);assert(events.some(e=>e.type==='parry'));
  p.invul=0;assert(g.input('heavy'));assert.equal(p.attack.move,'riposte');assert.equal(p.riposte,0);
});

test('holding Guard beyond its deflect window blocks through Guard rather than health',()=>{
  const {g,p}=fixture();const hp=p.hp;
  g.input('shield');frames(g,COMBAT.parryFrames);assert.equal(p.parryFrames,0);
  const guard=p.shield;assert.equal(g.hurt(-p.face,1),false);
  assert.equal(p.hp,hp);assert(p.shield<guard);assert.equal(g.combat.stats.parries,0);
  assert.equal(p.riposte,0);assert(p.shieldDelay>0);
});

test('Guard is directional, and attacks from the rear interrupt the defender',()=>{
  const {g,p}=fixture();const hp=p.hp;g.input('shield');
  assert.equal(g.hurt(p.face,1),true);assert.equal(p.hp,hp-1);
  assert(!p.shielding);assert(p.stagger>0);assert.equal(g.combat.stats.parries,0);
});

test('repeated shield taps cannot reopen a deflect window during its 24-frame lock',()=>{
  const {g,p}=fixture();g.input('shield');assert.equal(p.parryLock,24);g.releaseShield();
  frames(g,2);assert(g.input('shield'));assert.equal(p.parryFrames,0);
  g.releaseShield();frames(g,22);assert.equal(p.parryLock,0);
  assert(g.input('shield'));assert.equal(p.parryFrames,COMBAT.parryFrames);
});

test('raising Guard cancels a pending attack buffer instead of attacking behind the shield',()=>{
  const {g,p}=fixture();g.input('heavy');frames(g,MOVES.heavy.cancelAt-1);g.input('light');g.step();
  assert(g.combat.buffer);assert(g.input('shield'));g.step();
  assert(p.shielding);assert.equal(p.attack,null);assert.equal(g.combat.buffer,null);
});

test('a companion signature lowers Guard before attacking',()=>{
  const {g,p}=fixture();assert(g.input('shield'));assert(g.input('special'));
  assert(g.projectiles.length>0);assert(!p.shielding);assert(!p.shieldHeld);assert.equal(p.parryFrames,0);
});

test('Guard breaks under pressure, locks defensive actions, and reforms after its recovery delay',()=>{
  const {g,p,events}=fixture();g.input('shield');frames(g,COMBAT.parryFrames);
  p.shield=1;p.invul=0;const hp=p.hp;g.hurt(-p.face,1);
  assert.equal(p.shield,0);assert(p.guardBroken>0);assert(!p.shieldHeld);assert.equal(g.combat.stats.guardBreaks,1);
  assert(!g.input('shield'));assert(!g.input('light'));assert(p.hp<hp,'the hit that shatters Guard must connect');
  assert(events.some(e=>e.type==='guardbreak'));
  frames(g,COMBAT.guardBreakFrames+COMBAT.guardRegenDelay+50);
  assert.equal(p.guardBroken,0);assert(p.shield>0);assert(p.shield<=COMBAT.guardMax);
  assert(g.input('shield'));
});

test('Second Chance still rescues a lethal hit when that hit shatters the shield',()=>{
  const {g,p}=fixture();g.talents.add('secondchance');p.hp=.5;g.input('shield');frames(g,COMBAT.parryFrames);
  p.shield=1;p.invul=0;assert(g.hurt(-p.face,1));
  assert.equal(g.activeSlot,0,'a lethal guard break must not bypass the equipped rescue talent');
  assert.equal(p.hp,1);assert.equal(g.revivalUsed,true);
});

test('holding Guard drains it, while release allows regeneration only after the delay',()=>{
  const {g,p}=fixture();g.input('shield');frames(g,30);
  assert(p.shield<100);const depleted=p.shield;g.releaseShield();frames(g,COMBAT.guardRegenDelay-2);
  assert.equal(p.shield,depleted);frames(g,5);assert(p.shield>depleted);
});

test('dash cancels only after an attack cancel window and uses finite aerial resources',()=>{
  const {g,p}=fixture();assert(g.input('heavy'));assert(!g.input('dash'));assert.equal(p.dash,0);
  frames(g,MOVES.heavy.cancelAt);assert(g.input('dash'));assert.equal(p.attack,null);assert(p.dash>0);
  until(g,()=>!p.dash);frames(g,30);
  g.input('jump');frames(g,2);assert(!p.grounded);assert(g.input('dash'));assert.equal(p.airDashes,1);
  Object.assign(p,{dash:0,dashCooldown:0});assert(!g.input('dash'));
  assert(g.input('slot3'));assert.equal(p.airDashes,1);assert.equal(p.dashCooldown,0);assert(!g.input('dash'));
});

test('a light strike buffered during dash becomes Flash Fang, and old chains expire between engagements',()=>{
  const {g,p}=fixture();assert(g.input('dash'));assert(g.input('light'));
  until(g,()=>!!p.attack);assert.equal(p.attack.move,'dashstrike');
  until(g,()=>!p.attack);frames(g,COMBAT.chainWindow+30);
  assert(g.input('light'));assert.equal(p.attack.move,'light1');
});

test('hit-stop freezes attack and defensive simulation windows instead of consuming cancel frames',()=>{
  const {g,p}=fixture();g.input('light');frames(g,2);
  const frame=p.attack.frame;g.hitstop=4;frames(g,4);assert.equal(p.attack.frame,frame);
  g.step();assert.equal(p.attack.frame,frame+1);
  p.attack=null;g.input('shield');const window=p.parryFrames,lock=p.parryLock;
  g.hitstop=3;frames(g,3);assert.equal(p.parryFrames,window);assert.equal(p.parryLock,lock);
});

test('unlocked directional air dash steers on both axes without manufacturing extra air dashes',()=>{
  const {g,p}=fixture();g.abilities.add('wings');g.input('jump');frames(g,3);
  g.setInputs({right:true,up:true});const x=p.x,y=p.y;
  assert(g.input('dash'));g.step();assert(p.x>x);assert(p.y<y);assert(p.skillVector.x>0);assert(p.skillVector.y<0);
  assert.equal(p.airDashes,1);
});

test('perfect evade is earned after Blink and grants its reward once per incoming dash window',()=>{
  const {g,p}=fixture();g.abilities.add('blink');p.spirit=40;
  assert(g.input('dash'));g.step();const before=p.spirit,hp=p.hp;
  assert.equal(g.hurt(-p.face,1),false);assert.equal(g.combat.stats.perfectDodges,1);
  assert.equal(p.spirit,before+6);assert.equal(p.hp,hp);
  g.hurt(-p.face,1);assert.equal(g.combat.stats.perfectDodges,1);assert.equal(p.spirit,before+6);
  const fresh=fixture();fresh.g.input('dash');fresh.g.step();fresh.g.hurt(-1,1);assert.equal(fresh.g.combat.stats.perfectDodges,0);
});

test('boss posture breaks after accumulated heavy hits and creates a real recovery opening',()=>{
  const {g,events}=fixture(),e=target(g,{boss:'briar',introduced:true,phase:1});
  for(let i=0;i<6;i++)g.strike(e,10,1,{heavy:true});
  assert.equal(e.poise,0);assert.equal(e.state,'recover');assert(e.timer>=COMBAT.riposteWindow);
  assert(events.some(e=>e.type==='bossbreak'));assert(e.hp>0);
});

test('ordinary boss hits cannot create an infinite stun-lock, while posture breaks survive follow-up hits',()=>{
  const {g}=fixture(),e=target(g,{boss:'briar',introduced:true,phase:1,state:'patrol',stun:0});
  g.strike(e,10,1,{heavy:true,stun:MOVES.heavy.stun});assert(e.stun<=3,'normal attacks must not erase a boss response window');
  for(let i=0;i<5;i++)g.strike(e,10,1,{heavy:true,stun:MOVES.heavy.stun});
  assert.equal(e.state,'recover');const opening=e.stun;assert(opening>20);
  g.strike(e,10,1,{stun:MOVES.light1.stun});assert(e.stun>=opening,'an earned posture break must survive the follow-up combo');
});

test('powers unlock from journey, optional bosses and mastery; locked slots cannot be equipped or forged by loading',()=>{
  const {g}=fixture();assert.deepEqual(availablePowers(g).map(p=>p.id),['arcbolt','aegis']);
  assert(!g.combat.equipPower(0,'comet'));assert(!g.combat.equipPower(2,'arcbolt'));assert(!powerUnlocked(g,'__proto__'));
  g.combat.load({powerSlots:['phoenix','gravitywell'],selectedPower:99,stats:{powers:-99},settings:{reducedMotion:'yes'}});
  assert.deepEqual(g.combat.powerSlots,['arcbolt','aegis']);assert.equal(g.combat.selectedPower,0);assert.equal(g.combat.stats.powers,0);
  g.abilities.add('claw');assert(g.combat.equipPower(0,'comet'));assert(powerUnlocked(g,'comet'));
  g.defeatedBosses.add('belltwin');assert(powerUnlocked(g,'timefracture'));
  g.companionXP.pyrojaw=199;assert(!powerUnlocked(g,'choir'));g.companionXP.pyrojaw=200;assert(powerUnlocked(g,'choir'));
  unlockAll(g);assert.equal(availablePowers(g).length,12);
});

for(const id of Object.keys(POWERS))test(`${id} consumes its advertised Focus once and enforces its cooldown`,()=>{
  const {g,p}=fixture();unlockAll(g);g.combat.equipPower(0,id);g.combat.choosePower(0);
  p.spirit=POWERS[id].cost-.01;assert(!g.input('power'));assert.equal(g.combat.cooldowns[id]||0,0);
  p.spirit=100;assert(g.input('power'));assert.equal(p.spirit,100-POWERS[id].cost);
  assert.equal(g.combat.cooldowns[id],POWERS[id].cooldown);assert.equal(g.combat.stats.powers,1);
  const after=p.spirit;assert(!g.input('power'));assert.equal(p.spirit,after);
});

test('the twelve arts create distinct battlefield effects rather than interchangeable damage pulses',()=>{
  const play=id=>{
    const f=fixture();unlockAll(f.g);f.e=target(f.g,{x:f.p.x+120});f.p.hp=f.p.maxHp-3;f.p.shield=20;
    f.g.combat.equipPower(0,id);f.g.combat.choosePower(0);assert(f.g.input('power'),id);return f;
  };
  let f=play('arcbolt');assert(f.g.projectiles.some(s=>s.element==='Electric'));
  f=play('aegis');assert(f.p.shield>20);assert(f.p.guard>0);
  f=play('comet');assert(f.p.dash>0||f.p.vy<0);assert(f.e.juggle>0||f.g.skillStrike,'Comet Rush must provide a rushing or launching route');
  f=play('cyclone');assert(f.g.zones.some(z=>z.type==='wind')||f.g.combat.fields.some(z=>z.type==='cyclone'));
  f=play('frostnova');assert(f.e.frozen>0);assert(f.e.slow>0);
  f=play('thunderstep');assert(f.p.invul>0);assert.equal(f.p.dashCooldown,0);
  f=play('riftcut');assert(f.e.hp<f.e.maxHp);assert(f.e.juggle>0||f.e.stun>0);
  f=play('bloodmoon');assert(f.p.hp>f.p.maxHp-3);
  f=play('timefracture');assert(f.g.combat.fields.some(z=>z.type==='time')||f.e.frozen>0);
  f=play('gravitywell');assert(f.g.combat.fields.some(z=>z.type==='gravity'));
  f=play('choir');assert(f.g.projectiles.some(s=>s.homing),'the party choir must summon homing companion shots');
  f=play('phoenix');assert.equal(f.p.hp,f.p.maxHp,'First Sunrise restores its three advertised hearts');
  assert(f.g.combat.fields.some(z=>z.type==='phoenix'));assert(f.p.invul>0);
});

test('rush powers share the finite air-dash budget instead of bypassing it with Focus or a party swap',()=>{
  for(const id of ['comet','thunderstep']){
    const {g,p}=fixture();unlockAll(g);g.combat.equipPower(0,id);g.combat.choosePower(0);
    Object.assign(p,{grounded:false,y:300,coyote:0,jumpCount:1,airDashes:1});
    assert(!g.input('power'));assert.equal(p.spirit,100);assert(!g.combat.cooldowns[id]);
    assert(g.input('slot3'));assert(!g.input('power'));assert.equal(p.airDashes,1);
  }
});

test('vortex arts pull enemies and deal periodic damage throughout their field lifetime',()=>{
  for(const id of ['cyclone','gravitywell']){
    const {g,p}=fixture();unlockAll(g);const e=target(g,{x:p.x+120,left:40,right:2000});
    g.combat.equipPower(0,id);g.combat.choosePower(0);g.input('power');
    const field=g.combat.fields[0],initialDistance=Math.abs(e.x-field.x),hp=e.hp;
    frames(g,POWERS[id].interval+2);
    assert(e.hp<hp,id+' should pulse damage');
    assert(Math.abs(e.x-field.x)<initialDistance,id+' should pull toward its center');
    assert(g.combat.fields.length>0);
  }
});

test('power cycling selects one of two unique slots and snapshot copies cannot mutate a loadout',()=>{
  const {g}=fixture();assert.equal(g.combat.selectedPower,0);assert(g.input('powerCycle'));assert.equal(g.combat.selectedPower,1);
  assert(g.combat.equipPower(0,'aegis'));assert.deepEqual(new Set(g.combat.powerSlots),new Set(['arcbolt','aegis']));
  const s=g.combat.snapshot();s.powerSlots[0]='phoenix';s.stats.parries=999;s.settings.reducedMotion=true;
  assert(!g.combat.powerSlots.includes('phoenix'));assert.equal(g.combat.stats.parries,0);assert.equal(g.combat.settings.reducedMotion,false);
});

test('paused combat accepts no actions and freezes defensive windows, fields and cooldowns',()=>{
  const {g,p}=fixture();g.input('shield');g.combat.cooldowns.arcbolt=20;
  const shield=p.shield,window=p.parryFrames,slots=[...g.combat.powerSlots],selection=g.combat.selectedPower;
  g.paused=true;
  for(const action of ['light','heavy','dash','shield','power','powerCycle','jump','special','slot2'])assert.equal(g.input(action),false,action);
  frames(g,60);assert.equal(p.shield,shield);assert.equal(p.parryFrames,window);assert.equal(g.combat.cooldowns.arcbolt,20);
  assert.equal(g.combat.selectedPower,selection);assert.deepEqual(g.combat.powerSlots,slots);
});

test('v2 and v3 saves migrate to v4 without losing injured companions, inventory or RPG progress',()=>{
  const legacy=new CampaignEngine();legacy.abilities.add('claw');legacy.fragments.add('briar');legacy.unlocked.add('mycora');
  legacy.loadRoom('moss-path',300);legacy.player.hp=2;legacy.player.spirit=45;legacy.inventory.flask=7;legacy.lumens=123;
  const v2=legacy.save(),from2=new RPGCampaign(undefined,{save:structuredClone(v2)});
  assert.equal(from2.save().version,4);assert(from2.abilities.has('claw'));assert(from2.fragments.has('briar'));assert(from2.unlocked.has('mycora'));
  assert.equal(from2.player.hp,2);assert.equal(from2.player.spirit,45);assert.equal(from2.inventory.flask,7);assert.equal(from2.lumens,123);
  from2.talents.add('fleet');from2.companionXP.pyrojaw=203;from2.grantEquipment('thornFang');
  const gear=from2.gear.find(d=>d.template==='thornFang');from2.equipItem(gear.id);
  const v3=structuredClone(from2.save());v3.version=3;delete v3.combat;
  const from3=new RPGCampaign(undefined,{save:v3});assert(from3.talents.has('fleet'));assert.equal(from3.companionXP.pyrojaw,203);
  assert.equal(from3.loadout.relic,gear.id);assert.equal(from3.player.hp,2);assert.equal(from3.roomId,'moss-path');
  assert.deepEqual(from3.combat.powerSlots,['arcbolt','aegis']);
  from3.combat.equipPower(0,'comet');from3.combat.choosePower(1);from3.combat.settings.reducedMotion=true;from3.combat.stats.parries=8;
  const from4=new RPGCampaign(undefined,{save:structuredClone(from3.save())});
  assert.equal(from4.save().version,4);assert.deepEqual(from4.combat.powerSlots,['comet','aegis']);assert.equal(from4.combat.selectedPower,1);
  assert.equal(from4.combat.settings.reducedMotion,true);assert.equal(from4.combat.stats.parries,8);assert.equal(from4.player.hp,2);
  assert.equal(from4.inventory.flask,7);assert.equal(from4.lumens,123);assert.equal(from4.loadout.relic,gear.id);
});
