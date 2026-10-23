import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignEngine } from '../src/campaign.js';
import { RPGCampaign } from '../src/rpg.js';
import { ROOMS, CHAPTERS } from '../src/world.js';

const frames=(g,n)=>{for(let i=0;i<n;i++)g.step();};
const roundTrip=g=>new RPGCampaign(undefined,{save:JSON.parse(JSON.stringify(g.save()))});
const gatePoints=(g,gate)=>Object.values(ROOMS).filter(r=>r.biome===gate).flatMap(r=>g.recoveryForRoom(r.id));
const hurtParty=g=>{for(const m of g.party){m.hp=Math.max(.5,m.maxHp-3);m.spirit=12;}};
function enterSpring(g,point){
  g.loadRoom(point.room,{x:point.x+170,y:point.y},false);
  g.enemies=[];hurtParty(g);
  Object.assign(g.player,{x:point.x,y:point.y,vx:0,vy:0,grounded:true});
  g.step();
}

test('each seeded gate has one scarce automatic recovery point on a real tunnel surface',()=>{
  const layouts=new Set();
  for(const worldSeed of [1,17,81,2048,987654]){
    const g=new RPGCampaign(undefined,{worldSeed});
    const layout=[];
    for(const ch of CHAPTERS){
      const points=gatePoints(g,ch.id);
      assert.equal(points.length,1,ch.id+' has one full-party refill for the entire gate');
      assert.equal(new Set(points.map(p=>p.id)).size,points.length);
      for(const p of points){
        const room=ROOMS[p.room];assert.equal(room.biome,ch.id);
        assert(p.x>400&&p.x<room.width-150,'a recovery point must not be a routine room-entry refill');
        assert(room.platforms.some(b=>!b.moving&&Math.abs(b.y-p.y)<1&&p.x>=b.x+20&&p.x<=b.x+b.w-20),'spring rests on a stable, reachable shelf');
      }
      layout.push(points.map(p=>[p.id,p.room,p.x,p.y]));
    }
    layouts.add(JSON.stringify(layout));
    assert.equal(Object.values(ROOMS).flatMap(r=>r.objects.filter(o=>o.kind==='bench')).length,0,'sitting benches no longer supply healing');
  }
  assert(layouts.size>1,'different expedition seeds must change recovery placement');
});

test('walking into a spring restores the whole party automatically, without interaction or sitting',()=>{
  const g=new RPGCampaign(undefined,{worldSeed:17}),point=gatePoints(g,'moss')[0];
  enterSpring(g,point);
  assert(g.party.every(m=>m.hp===m.maxHp&&m.spirit===100));
  assert(g.spentRecovery.has(point.id));
  assert.equal(g.safeRest.room,point.room);assert.equal(g.safeRest.x,point.x);assert.equal(g.safeRest.y,point.y);
  assert.equal(g.paused,false);assert.equal(g.phase,'playing');
  const tick=g.tick;frames(g,3);assert(g.tick>tick,'recovery never interrupts the adventure with a modal');
});

test('spent recovery cannot be camped, retriggered by E, or refreshed through a reload',()=>{
  const g=new RPGCampaign(undefined,{worldSeed:81}),point=gatePoints(g,'moss')[0];
  enterSpring(g,point);hurtParty(g);const hp=g.player.hp;
  frames(g,6);g.input('interact');assert.equal(g.player.hp,hp);
  Object.assign(g.player,{x:point.x+170,vx:0});g.step();Object.assign(g.player,{x:point.x,vx:0});g.step();
  assert.equal(g.player.hp,hp,'leaving and entering a spent spring cannot refill it');
  const saved=JSON.parse(JSON.stringify(g.save())),restored=new RPGCampaign(undefined,{save:saved});
  assert.equal(restored.worldSeed,g.worldSeed);assert(restored.spentRecovery.has(point.id));
  assert.deepEqual(gatePoints(restored,'moss').map(p=>[p.id,p.room,p.x,p.y]),gatePoints(g,'moss').map(p=>[p.id,p.room,p.x,p.y]));
  restored.enemies=[];frames(restored,5);assert.equal(restored.player.hp,hp,'reload at the checkpoint preserves injuries and consumed recovery');
});

test('camp interaction retains crafting services while providing no health refill',()=>{
  const g=new CampaignEngine();g.loadRoom('moss-path',300,false);g.enemies=[];hurtParty(g);
  const hp=g.party.map(m=>m.hp);g.input('interact');frames(g,5);
  assert.deepEqual(g.party.map(m=>m.hp),hp);
  assert(g.atBench(),'camp remains a crafting and roster station');
  g.inventory.heartwood=2;assert(g.craft('flask'));
});

test('game over freezes the world, applies its penalty once, and retries only when requested',()=>{
  const g=new RPGCampaign(undefined,{worldSeed:1});g.loadRoom('moss-nexus',1700,false);g.lumens=123;
  g.party.forEach(m=>m.hp=0);g.respawn(true);
  assert.equal(g.phase,'gameover');assert(g.death);assert.equal(g.death.gate,'moss');assert.equal(g.death.room,'moss-nexus');
  assert.equal(g.lumens,110);assert.equal(g.death.lostLumens,13);assert(g.party.every(m=>m.hp===0));
  const tick=g.tick;frames(g,120);assert.equal(g.tick,tick);assert(!g.input('light'));assert(!g.input('jump'));
  g.respawn(true);assert.equal(g.lumens,110,'repeated death callbacks cannot apply the penalty again');
  const restored=roundTrip(g);assert.equal(restored.phase,'gameover');assert(restored.death);assert.equal(restored.lumens,110);
  assert(restored.retryAfterDeath());assert.equal(restored.phase,'playing');assert.equal(restored.death,null);
  assert(restored.party.every(m=>m.hp===m.maxHp));assert.equal(restored.roomId,'sanctuary');
  assert(!restored.retryAfterDeath(),'retry is a single transition');
});

test('death revives only the failed gate, preserves progression, and prevents duplicate unique rewards',()=>{
  const g=new RPGCampaign(undefined,{worldSeed:17});
  // Controlled victories isolate the reset/reward transaction from combat timing.
  for(const room of ['moss-path','moss-nexus','moss-heart','forge-path']){
    g.loadRoom(room,150,false);
    for(const e of g.enemies){e.hp=0;g.awardEnemy(e);}
  }
  const fragment=[...g.fragments],abilities=[...g.abilities],coins=g.lumens;
  assert(g.fragments.has('briar'));assert(g.bossDefeated('moss-warden'));
  g.loadRoom('moss-nexus',1700,false);g.party.forEach(m=>m.hp=0);g.respawn(true);
  assert.equal(g.phase,'gameover');assert(g.death.restoredEnemies>0);
  assert.deepEqual([...g.fragments],fragment);assert.deepEqual([...g.abilities],abilities);
  assert(g.retryAfterDeath());
  for(const room of ['moss-path','moss-nexus','moss-heart']){
    g.loadRoom(room,150,false);assert(g.enemies.every(e=>e.hp===e.maxHp),room+' must repopulate after death');
  }
  g.loadRoom('forge-path',150,false);assert(g.enemies.every(e=>e.hp===0),'another gate remains cleared');
  g.loadRoom('moss-heart',850,false);const boss=g.enemies.find(e=>e.boss),flasks=g.inventory.flask,xp=g.xp,lumens=g.lumens;
  boss.hp=0;g.awardEnemy(boss);
  assert.equal(g.inventory.flask,flasks);assert.equal(g.xp,xp);assert.equal(g.lumens,lumens,'a resurrected guardian cannot repeat its first-clear payout');
  assert(g.lumens<=coins);assert.deepEqual([...g.fragments],fragment);
});

test('a failed attempt rearms only that gate’s springs and retains its last recovery checkpoint',()=>{
  const g=new RPGCampaign(undefined,{worldSeed:2048}),moss=gatePoints(g,'moss')[0],forge=gatePoints(g,'forge')[0];
  enterSpring(g,forge);enterSpring(g,moss);
  assert(g.spentRecovery.has(moss.id)&&g.spentRecovery.has(forge.id));
  g.loadRoom('moss-heart',850,false);g.party.forEach(m=>m.hp=0);g.respawn(true);
  assert(!g.spentRecovery.has(moss.id));assert(g.spentRecovery.has(forge.id));
  assert(g.retryAfterDeath());assert.equal(g.roomId,moss.room);assert.equal(g.player.x,moss.x);assert.equal(g.player.y,moss.y);
  assert(!g.spentRecovery.has(moss.id),'spawning at a recovery point must not instantly consume the new attempt’s charge');
  frames(g,2);assert(!g.spentRecovery.has(moss.id));
});

test('camp roster changes cannot refill injured or defeated companions, including covenant hearts',()=>{
  for(const Game of [CampaignEngine,RPGCampaign]){
    const g=new Game();g.loadRoom('moss-path',300,false);
    if(g.chooseFaction)g.chooseFaction('wardens');
    g.party[0].hp=1;g.party[0].spirit=7;g.party[1].hp=0;g.party[1].spirit=3;
    assert(g.replaceParty(0,'glaciolith'));assert.equal(g.party[0].hp,1);assert.equal(g.party[0].spirit,7);
    assert(g.replaceParty(1,'noxshade'));assert.equal(g.party[1].hp,0);assert.equal(g.party[1].spirit,3);
  }
});


test('old elevated spring checkpoints migrate to the new safe tunnel floor',()=>{
  const g=new RPGCampaign(undefined,{worldSeed:17}),saved=JSON.parse(JSON.stringify(g.save()));
  const current=gatePoints(g,'moss')[0];
  saved.room=current.room;saved.safeRest={id:current.id,room:current.room,x:1090,y:140};
  saved.checkpoint={x:1090,y:140};
  saved.death={gate:'moss',room:current.room,returnTo:{...saved.safeRest},lostLumens:10,restoredEnemies:20};
  saved.party.forEach(m=>m.hp=0);
  const restored=new RPGCampaign(undefined,{save:saved});
  assert.equal(restored.phase,'gameover');assert.equal(restored.safeRest.id,current.id);
  assert.equal(restored.safeRest.x,current.x);assert.equal(restored.safeRest.y,520);
  assert(restored.retryAfterDeath());assert.equal(restored.player.x,current.x);assert.equal(restored.player.y,520);
  assert(restored.platforms.some(p=>p.y===520&&current.x>=p.x&&current.x<=p.x+p.w));
});
