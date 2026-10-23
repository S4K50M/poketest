import test from 'node:test';
import assert from 'node:assert/strict';
import {TrainingEngine} from '../src/training.js';
import {HEAL} from '../src/adventure.js';
import {ROSTER} from '../src/roster.js';
import {MINIONS} from '../src/designs.js';
import {driveTrainingRoute} from './helpers/training-route.js';
const frames=(g,n)=>{for(let i=0;i<n;i++)g.step()};
const expedition=()=>new TrainingEngine(['pyrojaw','zephyrix','noxshade']);

test('the supplied identities use correct types and distinct anatomical rigs',()=>{
  assert.deepEqual(ROSTER.find(d=>d.id==='pyrojaw').types,['Fire','Rock']);
  assert.equal(ROSTER.find(d=>d.id==='terrakhan').rig,'beetle');
  assert.equal(ROSTER.find(d=>d.id==='noxshade').rig,'jackal');
  assert.equal(new Set(ROSTER.map(d=>d.rig)).size,11);assert.equal(Object.keys(MINIONS).length,27);
});
test('party selection rejects duplicates or invalid members and fills to three',()=>{
  assert.throws(()=>new TrainingEngine(['pyrojaw','pyrojaw']));assert.throws(()=>new TrainingEngine(['missing']));
  const g=new TrainingEngine('noxshade');assert.equal(g.party.length,3);assert.equal(g.data.id,'noxshade');assert.equal(new Set(g.party.map(m=>m.data.id)).size,3);
});
test('switching preserves independent health and Focus, position, velocity and air limits',()=>{
  const g=expedition(),p=g.player;p.hp=3;p.spirit=57;
  Object.assign(p,{x:500,y:400,vx:4.2,vy:-6,grounded:false,jumpCount:2,airDashes:1,dashUsed:true,slow:42});
  assert(g.input('slot2'));assert.equal(g.data.id,'zephyrix');assert.equal(p.x,500);assert.equal(p.vx,4.2);assert.equal(p.vy,-6);assert.equal(p.jumpCount,2);assert.equal(p.airDashes,1);assert.equal(p.slow,42);
  p.hp=2;p.spirit=17;assert(!g.input('slot1'));frames(g,18);assert(g.input('slot1'));assert.equal(p.hp,3);assert.equal(p.spirit,57);assert.equal(g.party[1].hp,2);
});
test('switching gives no free invulnerability or new aerial resources',()=>{
  const g=expedition();g.player.invul=0;g.player.dashCooldown=20;g.player.airDashes=2;g.input('slot2');assert.equal(g.player.invul,0);assert.equal(g.player.airDashes,2);assert.equal(g.player.dashCooldown,20);
});
test('a heal restores one heart only after the full channel and costs 33 Focus',()=>{
  const g=expedition(),p=g.player;p.hp=4;p.spirit=70;g.input('heal');frames(g,HEAL.frames-1);assert.equal(p.hp,4);g.step();assert.equal(p.hp,5);assert.equal(g.stats.heals,1);assert(Math.abs(p.spirit-(70+HEAL.frames*.06-HEAL.cost))<.001);
});
test('releasing, moving, taking damage or switching cancels healing',()=>{
  for(const action of ['release','move','hurt','switch']){
    const g=expedition();g.player.hp=4;g.input('heal');frames(g,20);assert(g.player.healProgress>0);
    if(action==='release')g.releaseHeal();if(action==='move')g.setInputs({right:true});if(action==='hurt')g.hurt(-1);if(action==='switch')g.input('slot2');
    g.step();assert.equal(g.stats.heals,0);assert.equal(g.player.healProgress,0);assert(g.party[0].spirit>99);
  }
});
test('channeling recovery gives up damage invulnerability and can be interrupted immediately',()=>{
  const g=expedition();g.player.hp=3;g.player.invul=60;g.input('heal');g.step();assert.equal(g.player.invul,0);assert.equal(g.player.healProgress,1);g.hurt(-1);assert.equal(g.player.hp,2);assert.equal(g.player.healProgress,0);assert.equal(g.player.healHeld,false);
});
test('healing needs Focus and grounded stillness, and dismisses protective shields',()=>{
  const g=expedition();g.player.hp=2;g.player.spirit=32;assert(!g.input('heal'));frames(g,5);assert.equal(g.stats.heals,0);g.player.spirit=100;g.player.guard=90;g.player.fortress=true;g.input('heal');assert.equal(g.player.guard,0);assert.equal(g.player.fortress,false);g.player.grounded=false;g.player.y=300;g.player.jumpCount=2;g.step();assert.equal(g.player.healProgress,0);
});
test('KO automatically brings in a living companion; resting revives the whole party',()=>{
  const g=expedition();g.player.hp=.5;g.hurt(-1);assert.equal(g.activeSlot,1);assert.equal(g.party[0].hp,0);assert(!g.input('slot1'));g.player.invul=0;assert(g.input('interact'));assert(g.party.every(m=>m.hp===m.maxHp&&m.spirit===100));
});
test('a party wipe returns to the checkpoint, restores all members, and loses 10% Lumens',()=>{
  const g=expedition();g.lumens=100;g.party.forEach(m=>{m.hp=0});g.hurt(-1);assert.equal(g.stats.wipes,1);assert.equal(g.player.x,g.checkpoint.x);assert(g.party.every(m=>m.hp===m.maxHp));assert.equal(g.lumens,90);
});
test('Pebbleback resists light hits, heavy flips its shell, and rewards cannot be farmed twice',()=>{
  const g=expedition(),e=g.enemies.find(e=>e.kind==='pebbleback');g.strike(e,12,1);assert.equal(e.hp,34);g.strike(e,25,1,{heavy:true});assert(e.flipped>0);assert(e.stun>=45);g.strike(e,12,1);assert.equal(e.hp,0);const xp=g.xp,coins=g.lumens;g.strike(e,999,1);g.awardEnemy(e);assert.equal(g.xp,xp);assert.equal(g.lumens,coins);
});
test('Voltlet shocks nearby attackers but rewards careful ranged spacing',()=>{
  for(const near of [true,false]){const g=expedition(),e=g.enemies.find(e=>e.kind==='voltlet');g.player.x=e.x-(near?30:130);const hp=g.player.hp;g.strike(e,12,1);assert.equal(e.hp,0);assert.equal(g.player.slow,near?60:0);assert.equal(g.player.hp,near?hp-.5:hp);assert.equal(g.stats.minions,1);}
});
test('Dewdrop bubbles lower traction and Sproutlet roots grounded victims',()=>{
  const g=expedition();g.hazards.push({type:'bubble',x:g.player.x,y:520,life:100});g.step();assert(g.player.slick>0);g.player.vx=5;g.step();assert(g.player.vx>4);
  const s=g.enemies.find(e=>e.kind==='sproutlet');g.player.x=s.x+50;g.player.y=520;g.player.invul=0;s.state='windup';s.timer=1;g.updateMinion(s);assert(g.player.root>0);assert(!g.input('dash'));
});
test('Sproutlet burrowing hides it from light strikes but not a heavy impact',()=>{
  const g=expedition(),e=g.enemies.find(e=>e.kind==='sproutlet');e.state='burrow';const hp=e.hp;g.strike(e,12,1);assert.equal(e.hp,hp);g.strike(e,25,1,{heavy:true});assert(e.hp<hp);
});
test('Sinder appears in groups of three and telegraphs aimed spark shots',()=>{
  const g=expedition(),s=g.enemies.filter(e=>e.kind==='sinder');assert.equal(s.length,6);const e=s[0];g.player.x=e.x-240;e.state='windup';e.timer=1;g.updateMinion(e);assert.equal(g.enemyShots.length,1);assert(g.enemyShots[0].vx<0);
});
test('spark burn deals one delayed chip after the initial hit protection expires',()=>{
  const g=expedition();const hp=g.player.hp;g.hurt(-1,.5,{burn:65});assert.equal(g.player.hp,hp-.5);frames(g,65);assert.equal(g.player.hp,hp-1);assert.equal(g.player.burn,0);
});
test('Bond levels and waylight forging benefit the party without reviving fainted members',()=>{
  const g=expedition();g.party[2].hp=0;const hp=g.player.maxHp;g.gainXP(61);assert.equal(g.level,2);assert.equal(g.player.maxHp,hp+1);assert.equal(g.party[2].hp,0);g.lumens=24;assert(g.input('upgrade'));assert.equal(g.lumens,0);assert.equal(g.upgrades,1);assert.equal(g.player.maxHp,hp+2);assert.equal(g.party[2].hp,0);assert(!g.input('upgrade'));g.player.x=700;g.lumens=100;assert(!g.input('upgrade'));
});
test('mirage decoys persist across switching and explode when a minion attacks them',()=>{
  const g=new TrainingEngine(['noxshade','pyrojaw','zephyrix']);g.player.x=1770;assert(g.input('special'));assert(g.decoy);const owner=g.decoy.owner;g.input('slot2');const e=g.enemies.find(e=>e.kind==='sinder');g.updateMinion(e);assert.equal(g.decoy,null);assert(e.hp<e.maxHp);assert.equal(owner,0);assert(g.stats.minions>0);
});
for(const id of ROSTER.map(d=>d.id))test(`${id} has its own usable signature technique and finite Focus cost`,()=>{
  const g=new TrainingEngine(id);assert(g.input('special'));if(id==='terrakhan')g.releaseSpecial();assert.equal(g.player.spirit,75);
  if(id==='pyrojaw')assert(g.projectiles.some(p=>p.kind==='magma'));
  if(id==='voltantis'){assert.equal(g.projectiles.length,3);assert(g.projectiles.every(p=>p.homing));}
  if(id==='glaciolith')assert(g.projectiles.some(p=>p.kind==='ice'));
  if(id==='zephyrix')assert(g.zones.some(z=>z.type==='wind'));
  if(id==='terrakhan')assert(g.projectiles.some(p=>p.kind==='rockwave'));
  if(id==='noxshade')assert(g.decoy);
  if(id==='aqualance')assert(g.projectiles.some(p=>p.kind==='water'&&p.piercing));
  if(id==='ferrodrake')assert.equal(g.projectiles.filter(p=>p.kind==='ember').length,3);
  assert(!g.input('special'));
});
test('Fortress Shell guards from the front and releases a stored shockwave',()=>{
  const g=new TrainingEngine('terrakhan');g.input('special');frames(g,16);assert(g.player.fortress);const hp=g.player.hp;g.hurt(-g.player.face);assert.equal(g.player.hp,hp);g.releaseSpecial();assert.equal(g.player.spirit,75);assert(g.projectiles[0].damage>25);
});
test('Aegis Wing reverses a frontal hit while still taking hits from behind',()=>{
  const g=new TrainingEngine('ferrodrake');g.setInputs({right:true});g.input('special');assert(g.player.guard>0);const hp=g.player.hp;g.hurt(-1);assert.equal(g.player.hp,hp);g.player.invul=0;g.player.guard=90;g.hurt(1);assert.equal(g.player.hp,hp-1);
});
test('three chosen creatures complete the full route with real in-level partner switches',()=>{
  const g=new TrainingEngine(['pyrojaw','zephyrix','glaciolith']);const result=driveTrainingRoute(g,8000,{switching:true});assert.equal(result.phase,'complete',JSON.stringify(result));assert(result.stats.switches>=4);assert.deepEqual(result.party.map(m=>m.id),['pyrojaw','zephyrix','glaciolith']);assert(result.enemies.filter(e=>e.encounter).every(e=>!e.hp));
});
