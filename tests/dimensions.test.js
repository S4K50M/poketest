import { BOSS_ENCOUNTERS, beginBossMove } from '../src/boss-encounters.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignEngine } from '../src/campaign.js';
import { ROOMS, CHAPTERS, BOSSES } from '../src/world.js';
import { MINIBOSSES } from '../src/dungeon-enemies.js';
import { DUNGEON_MINIONS, bossHealth, bossPhase, updateBossEncounter, updateDungeonMinion } from '../src/difficulty.js';
import { playCampaign, walkTo, climbTo, fightGuardian } from './helpers/campaign-route.js';

test('each of the six dimension gates contains a mandatory depth, a sentinel, and a branching dungeon loop',()=>{
  for(const chapter of CHAPTERS){
    const id=chapter.id,ids=['path','descent','nexus','ascent','vault','heart'].map(s=>id+'-'+s);
    for(const roomId of ids)assert(ROOMS[roomId],roomId+' must be authored');
    const edge=(a,b)=>ROOMS[id+'-'+a].objects.some(o=>o.to===id+'-'+b);
    assert(edge('path','descent'));assert(edge('descent','nexus'));assert(edge('nexus','heart'));
    assert(edge('nexus','ascent'));assert(edge('nexus','vault'));
    assert(edge('ascent','vault')||edge('vault','ascent'),'the optional branches need a real connecting loop');
    const seal=ROOMS[id+'-nexus'].objects.find(o=>o.to===id+'-heart');
    assert.equal(seal.requiresBoss,id+'-warden');
    assert(ROOMS[id+'-nexus'].enemies.some(e=>e.boss===id+'-warden'));
    assert(ROOMS[id+'-vault'].enemies.some(e=>e.boss===id+'-reaver'));
    assert(ROOMS[id+'-descent'].platforms.some(p=>p.y<0),'the dungeon must extend above a single screen');
    assert(ids.reduce((n,key)=>n+ROOMS[key].width,0)>15000,'a dimension must span multiple sizeable chambers');
  }
  assert.equal(Object.keys(MINIBOSSES).length,12);
});

test('sitting benches no longer heal and gate recovery is sparse across deeper chambers',()=>{
  const g=new CampaignEngine(),rooms=Object.values(ROOMS);
  assert.equal(rooms.flatMap(r=>r.objects.filter(o=>o.kind==='bench')).length,0);
  for(const ch of CHAPTERS){
    const points=rooms.filter(r=>r.biome===ch.id).flatMap(r=>g.recoveryForRoom(r.id));
    assert.equal(points.length,1,'each whole gate has one automatic recovery point');
    assert(points.every(p=>p.x>400),'recovery is placed inside chambers rather than at every entrance');
  }
  g.loadRoom('moss-nexus');g.lumens=100;g.party.forEach(m=>m.hp=0);g.respawn(true);
  assert.equal(g.phase,'gameover');assert.equal(g.lumens,90);assert(g.retryAfterDeath());
  assert.equal(g.roomId,'sanctuary');assert(g.party.every(m=>m.hp===m.maxHp));
});

test('guardians have larger health pools, four phases, and six bespoke telegraphed attacks',()=>{
  const g=new CampaignEngine();g.loadRoom('moss-heart');const e=g.enemies.find(e=>e.boss);
  assert.equal(e.maxHp,bossHealth(BOSSES.briar));assert(e.maxHp>=500);
  assert.equal(bossPhase({...e,hp:e.maxHp}),1);assert.equal(bossPhase({...e,hp:e.maxHp*.6}),2);assert.equal(bossPhase({...e,hp:e.maxHp*.3}),3);assert.equal(bossPhase({...e,hp:e.maxHp*.12}),4);
  e.introduced=true;
  for(const [fraction,phase] of [[.6,2],[.3,3],[.12,4]]){e.hp=e.maxHp*fraction;updateBossEncounter(g,e);assert.equal(e.phase,phase);assert.equal(e.state,'enrage');}
  const moves=new Set();
  for(let move=0;move<6;move++){
    Object.assign(e,{state:'patrol',timer:1,stun:0,hp:e.maxHp,phase:1});beginBossMove(g,e,move);
    assert.equal(e.state,'windup');assert(e.telegraph.events.length>0);moves.add(e.moveId);
    e.timer=1;updateBossEncounter(g,e);assert(e.attackFrame>=0);
  }
  assert.equal(moves.size,6);assert.equal(BOSS_ENCOUNTERS.briar.sequences.length,4);
});

test('boss rewards cannot refill every companion after an expedition',()=>{
  const g=new CampaignEngine();g.loadRoom('moss-heart');g.party.forEach(m=>m.hp=1);const e=g.enemies.find(e=>e.boss);
  g.strike(e,e.maxHp*100,1,{heavy:true});assert.equal(e.hp,0);assert(g.party.every(m=>m.hp<m.maxHp));
});

test('four new minions rush, fire aerial spreads, telegraph burrows, and root from range',()=>{
  assert.equal(DUNGEON_MINIONS.length,4);
  const fixture=kind=>{const g=new CampaignEngine();g.loadRoom('moss-path');Object.assign(g.player,{x:700,y:520});const e={...g.enemies[0],kind,x:500,y:520,baseY:520,left:200,right:1200,state:'windup',timer:1,stun:0,targetX:700,targetY:520};return {g,e};};
  {
    const {g,e}=fixture('glassmarauder');updateDungeonMinion(g,e);assert.equal(e.state,'charge');const x=e.x;updateDungeonMinion(g,e);assert(e.x>x+9);
  }
  {
    const {g,e}=fixture('veilwasp');updateDungeonMinion(g,e);assert(e.y<450);assert.equal(g.enemyShots.length,3);assert(new Set(g.enemyShots.map(s=>s.vy)).size===3);
  }
  {
    const {g,e}=fixture('graveburrower');e.state='patrol';updateDungeonMinion(g,e);assert.equal(e.state,'windup');assert.equal(g.hazards.at(-1).x,700);assert(e.x<700);
    e.timer=1;updateDungeonMinion(g,e);assert.equal(e.x,700);assert.equal(e.state,'recover');
  }
  {
    const {g,e}=fixture('chaincaster');e.state='patrol';const x=e.x;updateDungeonMinion(g,e);assert(e.x<x,'the caster must retreat from close range');
    e.timer=1;updateDungeonMinion(g,e);assert.equal(g.enemyShots.length,3);assert(g.enemyShots.every(s=>s.status.root>0));
  }
});

test('all six main dungeon routes in the shipped RPG can be completed through real player inputs and earned abilities',async()=>{
  const {RPGCampaign}=await import('../src/rpg.js');const g=new RPGCampaign();const s=playCampaign(g);
  assert.equal(s.fragments.length,6);assert(s.finished);assert.equal(s.stats.wipes,0);
  for(const c of CHAPTERS)for(const suffix of ['path','descent','nexus','heart'])assert(g.visited.has(c.id+'-'+suffix));
  assert.equal(s.stats.falls,0);assert(s.stats.dashes>0);assert(s.stats.wallJumps>0);
});

test('earned movement abilities open a challenging optional upper dungeon and its vault loop',async()=>{
  const {RPGCampaign}=await import('../src/rpg.js');const g=new RPGCampaign();playCampaign(g);
  assert(walkTo(g,200));g.input('interact');
  assert(walkTo(g,1050));g.input('interact');assert(walkTo(g,g.room.objects.find(o=>o.to==='moss-descent').x));g.input('interact');
  let door=g.room.objects.find(o=>o.to==='moss-nexus');assert(walkTo(g,door.x));g.input('interact');
  for(const [x,y] of [[450,400],[730,275],[1010,150],[1290,25],[1605,-100]])assert(climbTo(g,x,y),'nexus balcony '+x+','+y);
  door=g.room.objects.find(o=>o.to==='moss-ascent');assert(climbTo(g,door.x,door.y));assert(g.input('interact'));assert.equal(g.roomId,'moss-ascent');
  for(const [x,y] of [[490,395],[750,270],[1010,145],[1270,20],[1530,-105],[1800,-230],[1520,-360],[1260,-490],[1005,-620],[780,-750]])assert(climbTo(g,x,y),'upper switchback '+x+','+y);
  assert(climbTo(g,810,-750));assert(g.input('interact'));assert(g.memories.has('moss-ascent:unwritten'));
  // Walk off the upper route and follow the connected rescue galleries. The
  // network now catches drops before several former staircase coordinates.
  g.releaseJump();g.setInputs({right:true});const landings=new Set();
  for(let frame=0;frame<800;frame++){g.step();if(g.player.grounded&&g.player.y>-750&&g.player.y<520)landings.add(g.player.y);if(g.player.x>2820&&g.player.grounded&&g.player.y===520)break;}
  g.setInputs({});assert(landings.size>=2,'the descent lands on several playable tiers');
  assert(g.player.x>2820&&g.player.y===520);assert.equal(g.stats.falls,0);
  assert(walkTo(g,g.room.objects.find(o=>o.to==='moss-vault').x));
  door=g.room.objects.find(o=>o.to==='moss-vault');assert(climbTo(g,door.x,door.y));assert(g.input('interact'));assert.equal(g.roomId,'moss-vault');
  assert(walkTo(g,1800));assert(fightGuardian(g));assert(g.bossDefeated('moss-reaver'));
  door=g.room.objects.find(o=>o.to==='moss-nexus');assert(climbTo(g,door.x,door.y??520));assert(g.input('interact'));assert.equal(g.roomId,'moss-nexus');
  assert(g.stats.jumps>20,'the optional climb still uses a genuine multi-ledge route');assert.equal(g.stats.wipes,0);
});
