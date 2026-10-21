import test from 'node:test';
import assert from 'node:assert/strict';
import { RPGCampaign } from '../src/rpg.js';

function fixture(){
  const events=[],g=new RPGCampaign(undefined,{worldSeed:1,onEvent:e=>events.push(e)});g.storyStage=1;g.loadRoom('moss-heart',1000,false);g.loadout={relic:null,armor:null};
  const e=g.enemies.find(e=>e.boss);Object.assign(e,{x:1080,y:520,hp:10000,maxHp:10000,stun:0,state:'patrol',introduced:true,phase:1,timer:80});Object.assign(g.player,{x:1000,y:520,grounded:true,invul:0});return {g,e,p:g.player,events};
}
const hit=(g,e,move='heavy',extra={})=>{g.tick+=36;g.strike(e,10,1,{heavy:move!=='light1',move,...extra});};

test('boss reads three demonstrated grounded heavy hits without reducing their damage',()=>{
  const {g,e}=fixture(),start=e.hp;
  hit(g,e);assert.equal(e.pressure.chain,1);assert(!e.pressureReady);
  hit(g,e);assert.equal(e.pressure.chain,2);assert(!e.pressureReady);
  hit(g,e);assert.equal(e.pressure.chain,3);assert(e.pressureReady);assert(e.hp<start-30,'the read must not silently negate damage');assert.equal(e.state,'patrol','a hit records a pattern; only the AI may commit to a warned response');
});

test('mixed attacks, an aerial route, or a parried riposte defeat the grounded heavy read',()=>{
  for(const change of[(g,e)=>hit(g,e,'light1'),(g,e)=>{g.player.grounded=false;hit(g,e);},(g,e)=>hit(g,e,'riposte')]){
    const {g,e}=fixture();for(let n=0;n<3;n++)hit(g,e);assert(e.pressureReady);change(g,e);assert(!e.pressureReady);assert.equal(e.pressure.chain,0);
  }
  const {g,e}=fixture();hit(g,e);hit(g,e);hit(g,e,'launcher');assert.equal(e.pressure.chain,1);assert(!e.pressureReady,'changing the heavy route forces the boss to learn it anew');
});

test('distant and periodic damage cannot manufacture a close-range read, and old patterns expire',()=>{
  const {g,e}=fixture();for(let n=0;n<8;n++)hit(g,e,'heavy',{dot:true});assert(!e.pressure);assert(!e.pressureReady);
  g.player.x=600;for(let n=0;n<3;n++)hit(g,e);assert.equal(e.pressure.chain,0);assert(!e.pressureReady);
  g.player.x=1000;hit(g,e);hit(g,e);g.tick+=181;g.combat.updateEnemy(e);assert.equal(e.pressure,null);assert(!e.pressureReady);
});

test('a warned escape takes full damage and recoil while committing through ordinary hit-stun',()=>{
  for(const state of ['countertell','evade','enrage']){
    const {g,e}=fixture();Object.assign(e,{state,stun:0});const hp=e.hp;hit(g,e);assert(e.hp<hp);assert.equal(e.state,state);assert.equal(e.stun,0);assert(e.recoil>0,'visual impact remains visible even when it cannot restart the AI timer');
  }
});

test('a visibly readied guard chips only the repeated grounded frontal heavy route',()=>{
  const normal=fixture(),guarded=fixture();Object.assign(guarded.e,{state:'countertell',face:-1,guarding:true,pressure:{lastMove:'heavy',chain:3,lastTick:0,closeHits:3}});
  hit(normal.g,normal.e);hit(guarded.g,guarded.e);const full=normal.e.maxHp-normal.e.hp,chip=guarded.e.maxHp-guarded.e.hp;
  assert(chip>0&&chip<full*.4&&chip>=full*.2,'guarded heavy damage is visible chip, not invulnerability');assert.equal(guarded.e.poise,3);assert.equal(normal.e.poise,17);assert(guarded.events.some(e=>e.type==='bossguard'));
  for(let n=0;n<5;n++)hit(guarded.g,guarded.e);assert.notEqual(guarded.e.state,'recover','repeating into the visible brace cannot refill an easy posture break');
});

test('light strings, changed heavy routes, aerial attacks, rear hits and ripostes bypass the readied heavy guard',()=>{
  const cases=[
    {move:'light1'},
    {move:'launcher'},
    {move:'heavy',setup:({p})=>p.grounded=false},
    {move:'heavy',setup:({p})=>p.x=1160},
    {move:'riposte'},
    {move:'heavy',setup:({e})=>{e.state='recover';e.stun=30;}},
  ];
  for(const change of cases){
    const f=fixture();Object.assign(f.e,{state:'countertell',face:-1,guarding:true,pressure:{lastMove:'heavy',chain:3,lastTick:0,closeHits:3}});change.setup?.(f);hit(f.g,f.e,change.move);assert(!f.events.some(e=>e.type==='bossguard'),change.move+' remains a real counter-route');assert(f.e.hp<f.e.maxHp-10,'the counter-route keeps its normal damage');
  }
  const noRead=fixture();Object.assign(noRead.e,{state:'countertell',face:-1,guarding:true});hit(noRead.g,noRead.e);assert(!noRead.events.some(e=>e.type==='bossguard'),'a guard cannot read a pattern before any attack was demonstrated');
  const art=fixture();Object.assign(art.e,{state:'countertell',face:-1,guarding:true,pressure:{lastMove:'heavy',chain:3,lastTick:0,closeHits:3}});art.g.strike(art.e,10,1,{heavy:true,element:'Electric'});assert(!art.events.some(e=>e.type==='bossguard'),'a different elemental art is not the learned melee route');
});

test('posture break keeps its earned combo opening but cannot be refilled by the same follow-up combo',()=>{
  const {g,e,events}=fixture();for(let n=0;n<6;n++)hit(g,e);assert.equal(e.state,'recover');assert.equal(e.stun,65);assert.equal(e.postureLock,180);assert.equal(e.poise,0);
  const openedHP=e.hp;for(let n=0;n<12;n++)hit(g,e);assert(e.hp<openedHP,'punishing a broken boss still deals full damage');assert.equal(e.stun,65,'additional hits must not refresh or lengthen the earned stagger');assert.equal(e.poise,0);assert.equal(events.filter(e=>e.type==='bossbreak').length,1);
  g.hitstop=0;e.introduced=false;for(let n=0;n<180;n++)g.step();assert.equal(e.postureLock,0);for(let n=0;n<6;n++)hit(g,e);assert.equal(events.filter(e=>e.type==='bossbreak').length,2,'posture becomes available again after the boss gets a response cycle');
});

test('posture protection stops with pause, hitstop, and frozen enemy time',()=>{
  const {g,e}=fixture();e.postureLock=20;g.paused=true;for(let n=0;n<20;n++)g.step();assert.equal(e.postureLock,20);g.paused=false;g.hitstop=4;for(let n=0;n<4;n++)g.step();assert.equal(e.postureLock,20);
  e.frozen=5;for(let n=0;n<5;n++)g.step();assert.equal(e.postureLock,20);g.step();assert.equal(e.postureLock,19);
});

test('late healing can be interrupted by a heavy or riposte, not an incidental light tick',()=>{
  for(const move of ['heavy','riposte']){const {g,e}=fixture();e.state='heal';e.healChannel={remaining:90,total:100,interrupted:false};hit(g,e,move);assert(e.healChannel.interrupted);assert(!e.pressureReady);}
  const {g,e}=fixture();e.state='heal';e.healChannel={remaining:90,total:100,interrupted:false};hit(g,e,'light1');assert.equal(e.healChannel.interrupted,false);assert(e.hp<e.maxHp,'light attacks still damage the healing boss');
});

test('large boss impacts move an armored attacker without removing armor damage mitigation',()=>{
  const {g,p}=fixture();const hp=p.hp;Object.assign(p,{armor:1,attack:{type:'heavy',frame:1},vx:0,vy:0,grounded:true});assert(g.hurt(-1,2,{knockback:2}));assert.equal(p.hp,hp-1);assert.equal(p.vx,-20);assert(p.vy<0);assert(!p.grounded);assert.equal(p.attack,null);assert(p.stagger>=16);
  const ordinary=fixture();Object.assign(ordinary.p,{armor:1,vx:0,vy:0,grounded:true});assert(ordinary.g.hurt(-1,2));assert.equal(ordinary.p.hp,ordinary.p.maxHp-1);assert.equal(ordinary.p.vx,0,'ordinary armor trades retain their existing behavior');
});

test('shield deflects and invulnerable dashes still defeat heavy knockback',()=>{
  const {g,p}=fixture();g.input('shield');const hp=p.hp;assert.equal(g.hurt(-p.face,2,{knockback:2}),false);assert.equal(p.hp,hp);assert.equal(g.combat.stats.parries,1);
  g.releaseShield();p.invul=10;p.vx=5;assert.equal(g.hurt(-1,2,{knockback:2}),false);assert.equal(p.vx,5);
});

test('inspection copies pressure state, while save/reload starts a fresh boss attempt',()=>{
  const {g,e}=fixture();for(let n=0;n<3;n++)hit(g,e);e.postureLock=45;e.healChannel={remaining:30,total:100,interrupted:false};const copy=g.snapshot().enemies.find(n=>n.boss===e.boss);assert(copy.pressureReady);copy.pressure.chain=999;copy.healChannel.remaining=999;assert.equal(e.pressure.chain,3);assert.equal(e.healChannel.remaining,30);
  const loaded=new RPGCampaign(undefined,{save:g.save()}),boss=loaded.enemies.find(n=>n.boss===e.boss);assert(!boss.pressure);assert(!boss.pressureReady);assert(!boss.postureLock);assert(!boss.healChannel);
});

test('a nonlethal fall clears adaptive boss state and owned attacks before restarting the encounter',()=>{
  const {g,e}=fixture();Object.assign(e,{pressure:{lastMove:'heavy',chain:4,lastTick:g.tick,closeHits:4},pressureReady:true,postureLock:90,guarding:true,berserk:true,healUsed:true,healChannel:{remaining:30,total:100},counterMotion:{x:e.x,y:e.y,to:e.x+180},state:'evade'});
  g.bossHazards.push({bossOwner:e.key,type:'zone',life:90});g.platforms.push({bossOwner:e.key,x:800,y:440,w:150,h:18,tempLife:200});g.player.hp=g.player.maxHp;g.respawn(false);
  assert(!e.pressure);assert(!e.pressureReady);assert(!e.postureLock);assert(!e.guarding);assert(!e.berserk);assert(!e.healUsed);assert(!e.healChannel);assert(!e.counterMotion);assert.equal(e.hp,e.maxHp);assert.equal(e.state,'patrol');assert(!g.bossHazards.length);assert(!g.platforms.some(p=>p.bossOwner));
});
