import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignEngine} from '../src/campaign.js';
import {COMPANION_KITS,signatureVariant} from '../src/companion-kits.js';
import {COMBAT,MOVES} from '../src/combat-data.js';
import {ROSTER} from '../src/roster.js';
const frames=(g,n)=>{for(let i=0;i<n;i++)g.step();};
function setup(id){
  const ids=[id,...ROSTER.filter(d=>d.id!==id).slice(0,2).map(d=>d.id)],events=[];
  const g=new CampaignEngine(ids,{onEvent:e=>events.push(e),worldSeed:472});g.enemies=[];g.relics=[];g.storyStage=1;Object.assign(g.player,{x:600,y:520,invul:0});return {g,p:g.player,events};
}
function target(g,x=720,y=520){const e={id:90+g.enemies.length,key:'kit-test:'+g.enemies.length,kind:'sinder',x,y,baseY:y,home:x,left:24,right:1800,hp:5000,maxHp:5000,state:'recover',timer:9999,stun:9999,face:-1,vx:0};g.enemies.push(e);return e;}

test('eight starter roles trade actual running speed, jump height, health and strike damage',()=>{
  const outcomes={};
  for(const id of Object.keys(COMPANION_KITS)){
    const {g,p}=setup(id);g.setInputs({right:true});frames(g,12);const speed=p.vx;
    g.setInputs({});g.input('jump');g.step();const launch=p.vy;
    const e=target(g,p.x+65);g.strike(e,20,1,{move:'light1'});
    outcomes[id]={speed,launch,hp:p.maxHp,damage:5000-e.hp};
  }
  assert(outcomes.voltantis.speed>outcomes.terrakhan.speed*1.6);
  assert(outcomes.zephyrix.launch<outcomes.terrakhan.launch-1.7);
  assert(outcomes.glaciolith.damage>outcomes.voltantis.damage*1.5);
  assert(outcomes.terrakhan.hp>outcomes.voltantis.hp*2.5);
  assert(new Set(Object.values(outcomes).map(o=>o.speed)).size>=7);
});

test('every starter retains the critical pre-unlock jump and finite air-dash budget',()=>{
  for(const id of Object.keys(COMPANION_KITS)){
    const {g,p}=setup(id);g.input('jump');let top=520;
    for(let i=0;i<65;i++){g.step();top=Math.min(top,p.y);}
    assert(top<360,id+' must clear the shared 160px critical rise');
    assert(!g.abilities.has('wings'));assert(!g.abilities.has('claw'));
    Object.assign(p,{y:250,grounded:false,coyote:0,jumpCount:1,airDashes:id==='zephyrix'?2:1});
    g.setInputs({right:true});const focus=p.spirit;
    if(['pyrojaw','voltantis','zephyrix'].includes(id)){assert(!g.input('special'));assert.equal(p.spirit,focus);}
  }
});

for(const id of Object.keys(COMPANION_KITS))test(id+' supports five distinct named signatures with real costs, cooldowns and typed geometry',()=>{
  const signatures=new Set();
  for(const [variant,input] of Object.entries({neutral:{},forward:{right:true},back:{left:true},up:{up:true},down:{down:true}})){
    const {g,p,events}=setup(id);g.setInputs(input);assert(g.input('special'),id+' '+variant);
    assert.equal(p.spirit,100-COMPANION_KITS[id].cost);assert.equal(g.party[0].skillCooldown,COMPANION_KITS[id].cooldown);
    assert.equal(p.signatureVariant,variant);assert(p.signatureAnim>0);
    const e=events.find(e=>e.type==='signature');assert(e);assert.equal(e.variant,variant);signatures.add(e.name);
    if(id==='terrakhan'&&variant==='neutral'){frames(g,18);assert(p.fortress);g.releaseSpecial();assert(g.companionFields.some(f=>f.type==='fault'&&!f.charging));}
    for(const f of g.companionFields){assert(Number.isFinite(f.x)&&Number.isFinite(f.y));assert(f.life>0&&f.radius>0);assert.equal(f.owner,0);}
    assert(!g.input('special'),'one L press spends resources only once');
  }
  assert.equal(signatures.size,5);
});

test('back specials remain reachable after holding an away direction for multiple walking frames',()=>{
  const {g,p}=setup('noxshade');target(g,800);g.setInputs({left:true});frames(g,8);assert.equal(p.face,-1);
  assert.equal(signatureVariant(g),'back');assert(g.input('special'));assert.equal(p.signatureVariant,'back');assert.equal(p.face,1);assert(p.vx<0);assert(g.decoy?.mimic);
  const other=setup('noxshade');target(other.g,400);other.g.setInputs({right:true});frames(other.g,8);assert.equal(signatureVariant(other.g),'back');assert(other.g.input('special'));assert.equal(other.p.face,-1);assert(other.p.vx>0);
});

test('the eight neutral L actions create different combat tools rather than a common dash',()=>{
  const outcomes={};
  for(const id of Object.keys(COMPANION_KITS)){
    const {g}=setup(id);target(g);assert(g.input('special'));
    outcomes[id]={shots:g.projectiles.map(b=>b.kind),fields:g.companionFields.map(f=>f.type),dash:g.player.dash,clone:!!g.decoy,charge:g.player.specialHeld};
  }
  assert.deepEqual(outcomes.pyrojaw.shots,['magma','magma','magma']);assert.deepEqual(outcomes.glaciolith.shots,['ice']);
  assert.deepEqual(outcomes.aqualance.shots,['water']);assert.deepEqual(outcomes.zephyrix.fields,['vortex']);
  assert.deepEqual(outcomes.ferrodrake.fields,['beam']);assert(outcomes.noxshade.clone);assert(outcomes.terrakhan.charge);
  assert.deepEqual(outcomes.voltantis.fields,['lightning']);assert(Object.values(outcomes).every(o=>o.dash===0));
});

test('water setup freezes a target for an Ice partner; fields survive a swap without changing ownership',()=>{
  const {g}=setup('aqualance'),e=target(g);g.party[1].data=ROSTER.find(d=>d.id==='glaciolith');g.party[1].hp=g.party[1].data.maxHp;
  g.setInputs({down:true});assert(g.input('special'));frames(g,3);assert(e.soaked>0);assert(g.input('slot2'));
  assert.equal(g.companionFields.find(f=>f.type==='tide').owner,0);
  frames(g,91);g.setInputs({});assert(g.input('special'));frames(g,25);
  assert(e.slow>0);assert(e.frozen>0||e.encounterFrozenTick>0,'soaked ice should visibly freeze a minion');
});

test('Noxshade clone echoes the next connecting normal attack once, across a companion switch',()=>{
  const {g,events}=setup('noxshade');const e=target(g,770);assert(g.input('special'));assert(g.decoy.mimic);
  assert(g.input('slot2'));frames(g,9);g.strike(e,20,1,{move:'light1'});
  const first=e.hp;assert(!g.decoy.mimic);assert(events.some(e=>e.type==='signature'&&e.variant==='echo'));
  g.strike(e,20,1,{move:'light1'});assert(first-e.hp<35,'a spent clone cannot echo the second hit');
});

test('signature clocks pause, clear with rooms, and preserve each creature cooldown through save/reload',()=>{
  const {g,p}=setup('pyrojaw');g.setInputs({down:true});assert(g.input('special'));const life=g.companionFields[0].life,anim=p.signatureAnim,cooldown=g.party[0].skillCooldown;
  g.paused=true;frames(g,80);assert.equal(g.companionFields[0].life,life);assert.equal(p.signatureAnim,anim);assert.equal(g.party[0].skillCooldown,cooldown);
  const save=structuredClone(g.save()),loaded=new CampaignEngine(undefined,{save});assert.equal(loaded.party[0].skillCooldown,cooldown);assert(!loaded.companionFields.length);assert(!loaded.player.signatureAnim);
  g.paused=false;g.loadRoom('sanctuary');assert(!g.companionFields.length);assert.equal(p.signatureAnim,0);assert.equal(g.party[0].skillCooldown,cooldown);
});

test('K damage and reuse now favor deliberate punishes over repeating one heavy',()=>{
  assert.equal(COMBAT.reuse.heavy,54);assert.equal(MOVES.heavy.damage,21);assert(MOVES.heavy.recovery>=11);
  const {g}=setup('pyrojaw');assert(g.input('heavy'));frames(g,40);assert(!g.input('heavy'));assert(g.combat.remaining('heavy')>12);
});

test('a spawned boss ward blocks ground combos but yields to visible aerial, rear or elemental routes',()=>{
  for(const route of ['ground','aerial','rear','special']){
    const {g,p,events}=setup('pyrojaw'),e=target(g,680);e.boss='briar';e.ward={charges:3,maxCharges:3,remaining:120,total:120};e.state='windup';e.stun=0;e.face=-1;
    if(route==='aerial')p.grounded=false;if(route==='rear'){p.x=760;e.face=-1;}
    const before=e.hp;g.strike(e,20,1,route==='special'?{element:'Fire',signature:'pyrojaw'}:{move:'light1',element:'Fire'});
    const hit=before-e.hp;
    if(route==='ground'){assert(hit<10);assert.equal(e.ward.charges,2);}else{assert(hit>=20);assert.equal(e.ward,null);assert(events.some(e=>e.type==='bossshieldbreak'));}
  }
});


test('corrupt fractional or excessive class cooldowns cannot stick or bypass their integer countdown',()=>{
  const {g}=setup('glaciolith');g.input('special');const s=structuredClone(g.save());s.party[0].skillCooldown=999999.8;
  const clamped=new CampaignEngine(undefined,{save:s});assert.equal(clamped.party[0].skillCooldown,150);
  s.party[0].skillCooldown=34.9;const rounded=new CampaignEngine(undefined,{save:s});assert.equal(rounded.party[0].skillCooldown,34);frames(rounded,34);assert.equal(rounded.party[0].skillCooldown,0);
});


test('a soaked group conducts an Electric strike to another wet target without recursively chaining forever',()=>{
  const {g,events}=setup('aqualance'),first=target(g,720),second=target(g,800);g.setInputs({down:true});g.input('special');frames(g,3);
  assert(first.soaked>0&&second.soaked>0);const hp1=first.hp,hp2=second.hp;
  g.strike(first,20,1,{element:'Electric'});assert(first.hp<hp1);assert(second.hp<hp2);
  assert(events.some(e=>e.type==='resonance'&&e.kind==='conduct'));assert(g.companionFields.some(f=>f.type==='lightning'));
  assert.equal(first.conductiveHitTick,-1);assert(second.hp>hp2-15,'secondary arc stays a small setup reward');
});

test('a projectile detonating a shadow clone cannot apply a legacy 75-frame boss stun',()=>{
  const {g,p}=setup('noxshade');g.loadRoom('moss-heart',1200,false);
  const boss=g.enemies.find(e=>e.boss==='briar');boss.introduced=true;
  assert(g.input('special'));const clone={...g.decoy};
  boss.x=clone.x+50;boss.y=clone.y;boss.state='recover';boss.timer=200;boss.stun=0;
  const minion=target(g,clone.x+70);minion.stun=0;
  g.enemyShots.push({x:clone.x,y:clone.y-20,vx:0,vy:0,life:40,damage:1});
  g.updateAdventure();
  assert.equal(g.decoy,null,'the actual shot hit destroys the clone');assert.equal(g.enemyShots.length,0);
  assert(boss.hp<boss.maxHp,'the clone keeps its useful damage');assert(boss.stun<=6,'boss resistance applies after the legacy burst path');
  assert.equal(minion.stun,75,'ordinary enemies keep the intended trap stun');
});

test('Fortress Shell visibly protects a finite hold and automatic release restarts reuse',()=>{
  const {g,p}=setup('terrakhan');assert(g.input('special'));frames(g,18);
  assert(p.fortress&&p.specialHeld&&p.signatureCharge);assert(g.companionFields.some(f=>f.charging&&f.life>0));
  const hp=p.hp;assert.equal(g.hurt(-p.face,2),false);assert.equal(p.hp,hp);assert(p.stored>0,'a frontal blocked hit strengthens the release');
  for(let n=0;n<220&&p.signatureCharge;n++){
    assert(g.companionFields.some(f=>f.charging&&f.life>0),'the protective hold always has its field');g.step();
  }
  assert(!p.signatureCharge&&!p.specialHeld&&!p.fortress);assert(!g.companionFields.some(f=>f.charging));
  assert(g.companionFields.some(f=>f.type==='fault'&&!f.charging),'timeout releases the stored shockwaves');
  assert.equal(g.party[0].skillCooldown,COMPANION_KITS.terrakhan.cooldown);assert(g.combat.remaining('special')>0);assert(!g.input('special'));
  const saved=structuredClone(g.save()),loaded=new CampaignEngine(undefined,{save:saved});
  assert.equal(loaded.party[0].skillCooldown,150);assert(!loaded.player.fortress&&!loaded.player.specialHeld&&!loaded.player.signatureCharge);
  assert(g.input('slot2'));frames(g,18);assert(g.input('slot1'));assert(!p.fortress);assert(g.party[0].skillCooldown>0,'switching does not refresh the shell');
});

test('an interrupted Fortress charge cannot retain an invisible shell or create a free release',()=>{
  const {g,p}=setup('terrakhan');g.input('special');frames(g,20);p.hp--;
  assert(g.input('heal'));g.step();
  assert(!p.signatureCharge&&!p.specialHeld&&!p.fortress);assert(!g.companionFields.some(f=>f.charging));
  assert(!g.companionFields.some(f=>f.type==='fault'&&!f.charging),'cancelled commitment does not fire the stored attack');
  assert(g.party[0].skillCooldown>140);
});
