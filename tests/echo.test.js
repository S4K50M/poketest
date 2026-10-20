import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS} from '../src/world.js';

const copy=value=>JSON.parse(JSON.stringify(value));
const earnedXP=g=>g.xp+Array.from({length:g.level-1},(_,i)=>(i+1)*60).reduce((a,b)=>a+b,0);

test('every field echo is a nonblocking pickup, awards XP once, and survives reload',()=>{
  for(const room of Object.values(ROOMS))for(const note of room.objects.filter(o=>o.kind==='memory')){
    const events=[],g=new RPGCampaign(undefined,{onEvent:e=>events.push(e)});
    g.loadRoom(room.id,note.x,false);Object.assign(g.player,{x:note.x,y:note.y||520});
    const before=earnedXP(g),key=room.id+':'+note.id;
    assert.doesNotThrow(()=>g.input('interact'),key);
    const memory=events.findLast(e=>e.type==='memory');
    assert(memory,key+' emits readable history');assert.equal(typeof memory.title,'string');assert.equal(typeof memory.text,'string');assert(memory.text.trim().length>0);
    assert.equal(events.some(e=>e.type==='dialogue'),false,key+' never opens a paused dialogue');assert.equal(g.paused,false);
    assert(g.memories.has(key),key+' is collected');
    assert.equal(earnedXP(g),before+30,key+' awards XP');
    const tick=g.tick;g.step();assert(g.tick>tick,key+' keeps updating');
    const repeatXP=earnedXP(g); // A nearby shard may be picked up during the live frame.
    Object.assign(g.player,{x:note.x,y:note.y||520});g.input('interact');
    assert.equal(earnedXP(g),repeatXP,key+' repeat does not duplicate XP');
    const restored=new RPGCampaign(undefined,{save:copy(g.save())});
    Object.assign(restored.player,{x:note.x,y:note.y||520});
    const restoredXP=earnedXP(restored);restored.input('interact');
    assert(restored.memories.has(key));assert.equal(earnedXP(restored),restoredXP,key+' reload does not duplicate XP');
  }
});

test('E collects hidden lantern echoes once without pausing or duplicating rewards',()=>{
  for(const id of ['hidden-grove','star-observatory']){
    const g=new RPGCampaign(),shrine=ROOMS[id].objects.find(o=>o.kind==='shrine');
    g.loadRoom(id,shrine.x,false);Object.assign(g.player,{x:shrine.x,y:shrine.y||520});
    const before={xp:earnedXP(g),lumens:g.lumens,flasks:g.inventory.flask};
    assert(g.input('interact'));assert(g.shrines.has(id+':'+shrine.id));assert.equal(g.paused,false);
    assert.equal(earnedXP(g),before.xp+70);assert.equal(g.lumens,before.lumens+50);assert.equal(g.inventory.flask,before.flasks+2);
    assert.equal(g.input('interact'),false);assert.equal(g.inventory.flask,before.flasks+2);
    const restored=new RPGCampaign(undefined,{save:copy(g.save())});
    Object.assign(restored.player,{x:shrine.x,y:shrine.y||520});
    assert.equal(restored.input('interact'),false);assert.equal(restored.lumens,g.lumens);assert.equal(restored.inventory.flask,g.inventory.flask);
    const tick=restored.tick;restored.step();assert(restored.tick>tick);
  }
});
