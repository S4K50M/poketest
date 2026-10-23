import test from 'node:test';
import assert from 'node:assert/strict';
import { RPGCampaign } from '../src/rpg.js';
import { BOSS_AFTERMATH, aftermathObjects } from '../src/boss-aftermath.js';
import { ROOMS, BOSSES } from '../src/world.js';

const essential=['briar','bell','leviathan','conductor','hourglass','crown','belltwin','palimpsest','nullheart'];
const roomFor=id=>Object.values(ROOMS).find(room=>room.enemies.some(enemy=>enemy.boss===id));
const roundTrip=g=>new RPGCampaign(undefined,{save:JSON.parse(JSON.stringify(g.save()))});
function victory(id){
  const events=[],g=new RPGCampaign(undefined,{onEvent:event=>events.push(event)}),room=roomFor(id);
  g.loadRoom(room.id,150,false);const enemy=g.enemies.find(e=>e.boss===id);
  // A controlled defeat isolates progression and corpse lifecycle from AI timing.
  enemy.hp=0;g.awardEnemy(enemy);
  return {g,events,enemy,room};
}
function approach(g,object){Object.assign(g.player,{x:object.x,y:object.y,vx:0,vy:0,grounded:true,respawning:0});}
const rewards=g=>({xp:g.xp,level:g.level,lumens:g.lumens,inventory:{...g.inventory},gear:g.gear.map(item=>({...item})),talentPoints:g.talentPoints,fragments:[...g.fragments],abilities:[...g.abilities],defeatedBosses:[...g.defeatedBosses],companionXP:{...g.companionXP}});

test('all nine essential bosses leave distinct authored scenery and readable scene lore',()=>{
  assert.deepEqual(Object.keys(BOSS_AFTERMATH).sort(),[...essential].sort());
  assert.equal(new Set(Object.values(BOSS_AFTERMATH).map(data=>data.form)).size,9);
  assert.equal(new Set(Object.values(BOSS_AFTERMATH).map(data=>data.name)).size,9);
  assert(Object.isFrozen(BOSS_AFTERMATH));
  for(const [id,data]of Object.entries(BOSS_AFTERMATH)){
    assert(BOSSES[id]);assert(roomFor(id));assert(Object.isFrozen(data));
    assert.equal(data.duration,4800);assert(/^#[0-9a-f]{6}$/i.test(data.color));
    assert(data.farewell.length>20);assert(data.lines.length>=2);
    assert(Object.isFrozen(data.lines));assert(data.lines.every(line=>Object.isFrozen(line)&&line.length===2&&line.every(text=>typeof text==='string'&&text.length>5)));
  }
  assert(BOSS_AFTERMATH.conductor.farewell.includes('I will return.'));
});

test('defeat events copy the actual death position while persistent scenery uses the authored arena floor',()=>{
  for(const id of essential){
    const events=[],g=new RPGCampaign(undefined,{onEvent:e=>events.push(e)}),room=roomFor(id),original=JSON.stringify(room.objects);
    g.loadRoom(room.id,150,false);const enemy=g.enemies.find(e=>e.boss===id),spawn=room.enemies.find(e=>e.boss===id);
    enemy.x=spawn.x+67;enemy.y=(spawn.y??520)-83;enemy.hp=0;g.awardEnemy(enemy);
    const event=events.findLast(e=>e.type==='bossdefeated');assert(event,id);
    assert.equal(event.x,spawn.x+67);assert.equal(event.y,(spawn.y??520)-83);assert.equal(event.room,room.id);assert.equal(event.name,BOSSES[id].name);assert.equal(event.species,enemy.kind);
    const object=g.bossAftermath[0];assert.equal(object.boss,id);assert.equal(object.x,spawn.x);assert.equal(object.y,spawn.y??520);assert.equal(object.kind,'aftermath');
    assert.equal(event.aftermath.form,object.form);assert.notEqual(event.aftermath,object);
    event.aftermath.x=-100;event.aftermath.lines[0][1]='Presentation-only change';
    assert.equal(g.bossAftermath[0].x,spawn.x);assert.notEqual(g.bossAftermath[0].lines[0][1],'Presentation-only change');
    assert.equal(JSON.stringify(room.objects),original,'shared room objects stay immutable');
    assert(g.interactionObjects.some(o=>o.id==='aftermath:'+id));
    const snapshot=g.snapshot();assert.equal(snapshot.bossAftermath[0].form,object.form);assert(snapshot.interactionObjects.some(o=>o.id===object.id&&o.kind==='aftermath'));
  }
});

test('all aftermaths persist through existing save flags and can be interacted with after reload',()=>{
  for(const id of essential){
    const {g}=victory(id),saved=g.save(),restored=roundTrip(g),events=[];
    assert(!Object.hasOwn(saved,'bossAftermath'),'scenery needs no new save schema');
    assert.deepEqual(restored.bossAftermath,g.bossAftermath,id+' remains after reload');
    restored.onEvent=event=>events.push(event);const object=restored.bossAftermath[0];approach(restored,object);
    const before=rewards(restored),tick=restored.tick;assert(restored.input('interact'),id+' is reachable with E');
    const type=id==='crown'?'worldheartchoice':id==='nullheart'?'cradleending':'dialogue',event=events.findLast(e=>e.type===type);
    assert(event,id+' emits '+type);assert.equal(event.source.id,object.id);assert.equal(event.source.kind,'aftermath');assert.equal(event.source.room,restored.roomId);assert.equal(event.source.x,object.x);assert.equal(event.source.y,object.y);
    assert(!restored.paused);assert.equal(restored.phase,'playing');assert.deepEqual(rewards(restored),before,'reading lore never grants a reward twice');
    restored.step();assert.equal(restored.tick,tick+1,'scenery never pauses the simulation');
  }
});

test('unawarded bodies and living bosses do not become interactable scenery from fragment flags alone',()=>{
  const g=new RPGCampaign();g.loadRoom('moss-heart',150,false);const enemy=g.enemies.find(e=>e.boss==='briar');
  enemy.hp=0;assert.deepEqual(aftermathObjects(g),[],'the clear transaction must complete first');
  enemy.hp=enemy.maxHp;g.fragments.add('briar');assert.deepEqual(g.bossAftermath,[],'a living resurrected boss suppresses old scenery');
  assert(!g.interactionObjects.some(o=>o.kind==='aftermath'));
});

test('gate death removes all nine aftermaths while revived bosses live, then restores scenery without another payout',()=>{
  for(const id of essential){
    const {g,events,room}=victory(id);assert.equal(g.bossAftermath.length,1,id);
    g.beginGameOver();assert.deepEqual(g.bossAftermath,[]);assert(g.retryAfterDeath());
    g.loadRoom(room.id,150,false);const enemy=g.enemies.find(e=>e.boss===id);assert(enemy.hp>0,id+' is revived');
    assert.deepEqual(g.bossAftermath,[]);assert(!g.interactionObjects.some(o=>o.kind==='aftermath'));
    const before=rewards(g);enemy.hp=0;g.awardEnemy(enemy);
    assert.deepEqual(rewards(g),before,id+' cannot duplicate unique or RPG rewards');
    assert.equal(g.bossAftermath[0].boss,id);assert.equal(events.findLast(e=>e.type==='bossdefeated').repeated,true);
    const count=events.filter(e=>e.type==='bossdefeated').length;g.awardEnemy(enemy);assert.equal(events.filter(e=>e.type==='bossdefeated').length,count,'duplicate award callbacks do not replay the defeat');
    assert.equal(roundTrip(g).bossAftermath[0].boss,id);
  }
});

test('Worldheart choices wait for E and become readable lore after the ending is chosen',()=>{
  const {g,events}=victory('crown');assert(g.finished);assert(g.fragments.has('crown'));
  assert(!events.some(e=>e.type==='worldheartchoice'),'defeating Crown does not open choices');
  approach(g,g.bossAftermath[0]);assert(g.input('interact'));assert(events.some(e=>e.type==='worldheartchoice'));
  assert(g.finishEnding('release'));const choices=events.filter(e=>e.type==='worldheartchoice').length;
  assert(g.input('interact'));assert.equal(events.filter(e=>e.type==='worldheartchoice').length,choices);assert.equal(events.at(-1).type,'dialogue');assert.equal(events.at(-1).source.kind,'aftermath');
  const restored=roundTrip(g),later=[];restored.onEvent=e=>later.push(e);approach(restored,restored.bossAftermath[0]);assert(restored.input('interact'));assert.equal(later.at(-1).type,'dialogue');
});

test('the Cradle finale waits for an explicit E interaction while final progression saves immediately',()=>{
  const {g,events}=victory('nullheart');assert.equal(g.trueEnding,'unwritten');assert(g.defeatedBosses.has('nullheart'));
  assert(!events.some(e=>e.type==='cradleending'));const restored=roundTrip(g),later=[];restored.onEvent=e=>later.push(e);
  assert.equal(restored.trueEnding,'unwritten');approach(restored,restored.bossAftermath[0]);assert(restored.input('interact'));
  const ending=later.find(e=>e.type==='cradleending');assert(ending);assert.equal(ending.faction,'unwritten');assert.equal(ending.source.form,'cradle');assert.equal(restored.roomId,'cradle-zero','the optional-boss door handler never consumes the Cradle interaction');
});
