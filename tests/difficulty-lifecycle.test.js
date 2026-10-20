import test from 'node:test';
import assert from 'node:assert/strict';
import { RPGCampaign } from '../src/rpg.js';
import { ROOMS } from '../src/world.js';

const vulnerable=g=>{
  g.party.forEach(m=>m.hp=0);g.party[g.activeSlot].hp=.25;
  Object.assign(g.player,{invul:0,armor:0,guard:0,fortress:false,shielding:false});
};

test('a lethal first enemy stops the old room iteration at the game-over boundary',()=>{
  const g=new RPGCampaign();g.loadRoom('moss-path',600,false);vulnerable(g);
  const first={id:0,kind:'glassmarauder',hp:60,maxHp:60,x:589,y:520,baseY:520,home:589,left:400,right:1000,face:1,state:'charge',timer:20,stun:0};
  const second={...first,id:1,kind:'chaincaster',x:650,state:'patrol',timer:70};
  g.enemies=[first,second];g.updateEnemies();
  assert.equal(g.phase,'gameover');assert.equal(second.timer,70,'no subsequent old-room enemy may advance after the lethal hit');
  assert(g.retryAfterDeath());assert.equal(g.roomId,'sanctuary');assert.equal(g.player.x,200);assert(g.player.invul>0);assert.equal(g.player.stagger,0);
});

test('a wipe during burn processing stops movement, attacks, and relic collection that frame',()=>{
  const g=new RPGCampaign();g.loadRoom('moss-path',600,false);vulnerable(g);
  Object.assign(g.player,{burn:2,vx:15});g.setInputs({right:true});const shards=g.relics.filter(r=>r.collected).length;
  g.step();
  assert.equal(g.phase,'gameover');assert.equal(g.player.x,600);assert.equal(g.relics.filter(r=>r.collected).length,shards);
  const tick=g.tick;g.step();assert.equal(g.tick,tick);
  assert(g.retryAfterDeath());assert.equal(g.roomId,'sanctuary');assert.equal(g.player.x,200);assert.equal(g.player.y,520);
  assert(g.player.invul>0);assert(g.player.respawning>0);assert.equal(g.enemyShots.length,0);assert.equal(g.waves.length,0);
});

test('a same-room retry rebuilds platforms rather than restoring stale geometry',()=>{
  const g=new RPGCampaign(),point=Object.values(ROOMS).filter(r=>r.biome==='moss').flatMap(r=>g.recoveryForRoom(r.id))[0];
  g.loadRoom(point.room,{x:point.x+170,y:point.y},false);g.enemies=[];Object.assign(g.player,{x:point.x,y:point.y,grounded:true});g.step();
  vulnerable(g);const oldPlatforms=g.platforms;oldPlatforms.push({x:520,y:450,w:30,h:10});
  g.player.burn=2;g.step();assert.equal(g.phase,'gameover');assert(g.retryAfterDeath());
  assert.equal(g.roomId,point.room);assert.equal(g.player.x,point.x);assert.notEqual(g.platforms,oldPlatforms);
  assert.equal(g.platforms.length,ROOMS[point.room].platforms.length);assert(g.player.invul>0);assert(g.player.respawning>0);
});

test('a lethal boss slam cannot spawn old-arena shockwaves after game over or into the retry',()=>{
  const g=new RPGCampaign();g.loadRoom('moss-heart',1310,false);vulnerable(g);
  const e=g.enemies.find(e=>e.boss);Object.assign(e,{introduced:true,state:'leap',timer:1,leapStart:1310,leapTarget:1310,x:1310,y:520});
  g.updateBoss(e);
  assert.equal(g.phase,'gameover');assert.equal(g.waves.length,0);assert.equal(g.hazards.length,0);
  assert(g.retryAfterDeath());assert.equal(g.roomId,'sanctuary');assert.equal(g.waves.length,0);assert.equal(g.hazards.length,0);assert(g.player.invul>0);
});

test('invalid waylight references and miniboss fragments cannot corrupt a migrated save',()=>{
  const g=new RPGCampaign(),saved=JSON.parse(JSON.stringify(g.save()));
  saved.safeRest={room:'constructor',x:200,y:520};saved.fragments=['moss-warden','forge-reaver','briar'];
  let restored;assert.doesNotThrow(()=>{restored=new RPGCampaign(undefined,{save:saved});});
  assert.equal(restored.safeRest.id,'sanctuary:hearth');assert.equal(restored.safeRest.room,'sanctuary');assert.equal(restored.safeRest.x,200);assert.equal(restored.safeRest.y,520);assert.deepEqual([...restored.fragments],['briar']);
});

test('loot on negative-height dungeon ledges keeps its position across reload',()=>{
  const g=new RPGCampaign();g.loadRoom('moss-ascent',150,false);
  g.worldDrops.push({id:'ledge-loot',template:'travelersSeal',x:790,y:-780});
  const restored=new RPGCampaign(undefined,{save:JSON.parse(JSON.stringify(g.save()))});
  assert.equal(restored.worldDrops.find(d=>d.id==='ledge-loot').y,-780);
});


test('the final guardian preserves each covenant’s distinct dimensional sigils',()=>{
  for(const [faction,type] of [['wardens','stasis'],['chorus','lightning'],['unwritten','root']]){
    const g=new RPGCampaign();g.fragments.add('crown');g.defeatedBosses.add('palimpsest');g.defeatedBosses.add('belltwin');g.chooseFaction(faction);g.loadRoom('cradle-zero',1800,false);
    const e=g.enemies.find(e=>e.boss==='nullheart');Object.assign(e,{introduced:true,state:'windup',timer:1,move:2,targetX:1800,targetY:520});
    g.updateBoss(e);assert.equal(g.hazards.length,3);assert(g.hazards.every(h=>h.type===type),faction+' must retain its promised final attack pattern');
  }
});
