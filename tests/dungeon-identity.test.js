import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/rpg-world.js';
import {ROOMS,CHAPTERS} from '../src/world.js';
import {MINIONS} from '../src/designs.js';
import {ROOM_IDENTITIES,applyRoomIdentities} from '../src/room-identity.js';
import {drawRoomIdentity} from '../src/room-identity-render.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

test('all forty-two rooms have individual authored geometry and landmark identities',()=>{
 assert.equal(Object.keys(ROOMS).length,42);assert.equal(Object.keys(ROOM_IDENTITIES).length,42);
 const geometry=new Set(),motifs=new Set();
 for(const room of Object.values(ROOMS)){
  assert.equal(room.layout.id,room.id);assert(room.layout.title.length>10);assert.equal(room.layout.floorRoute,'connected');
  geometry.add(JSON.stringify(room.platforms.map(p=>[p.x,p.y,p.w,p.h,!!p.solid,!!p.moving])));
  motifs.add(room.layout.motif);
  assert(room.layout.landmarks.length>=3,'threshold, central chamber and far passage each have a landmark');
 }
 assert.equal(geometry.size,42,'room identity must change collision geometry rather than only its title');
 assert.equal(motifs.size,42,'each room has a recognisable architectural motif');
});

test('each successive dimension increases real travel length and enemy encounters',()=>{
 let previousWidth=0,previousEnemies=0;
 for(const chapter of CHAPTERS){
  const rooms=['path','descent','nexus','ascent','vault','heart'].map(s=>ROOMS[chapter.id+'-'+s]);
  const width=rooms.reduce((n,r)=>n+r.width,0),enemies=rooms.reduce((n,r)=>n+r.enemies.filter(e=>!e.boss).length,0);
  assert(width>previousWidth);assert(enemies>previousEnemies);previousWidth=width;previousEnemies=enemies;
  for(const room of rooms){
   assert(room.platforms.some(p=>p.x===0&&p.y===520&&p.w===room.width),'expanded rooms keep their catch floor');
   if(!room.id.endsWith('-heart')){
    const exit=room.objects.find(o=>o.id==='exit'||o.id==='depth-loop'||o.id==='court-loop');
    assert(exit&&exit.x>=room.width-150,'progress travels through the added chambers');
   }
  }
 }
});

test('room ecology places new biome species and only valid enemies on authored surfaces',()=>{
 const local={moss:['bloomspitter','sporekeeper'],forge:['cinderdrill','chainshield'],reef:['siphonray','inkmortar'],storm:['magnetmoth','galeswarm'],frost:['bellspider','crystalfencer'],rift:['phasehound','voidlantern']};
 for(const [biome,species] of Object.entries(local)){
  const encountered=new Set(Object.values(ROOMS).filter(r=>r.biome===biome).flatMap(r=>r.enemies.map(e=>e.kind)));
  for(const kind of species)assert(encountered.has(kind),biome+' ecology must include '+kind);
 }
 for(const room of Object.values(ROOMS))for(const e of room.enemies){
  assert(e.boss||MINIONS[e.kind],room.id+' has an undefined minion '+e.kind);
  assert(Number.isFinite(e.x)&&e.x>=0&&e.x<=room.width);
  if(e.y!==undefined&&e.y<520)assert(room.platforms.some(p=>Math.abs(p.y-e.y)<2&&e.x>=p.x&&e.x<=p.x+p.w),room.id+' elevated enemy needs a real ledge');
 }
});

test('expanded room registration keeps forward links and story landings inside the dungeon',()=>{
 for(const room of Object.values(ROOMS)){
  for(const p of room.platforms){assert([p.x,p.y,p.w,p.h].every(Number.isFinite));assert(p.w>0&&p.h>0);assert(p.x>=0&&p.x+p.w<=room.width+.01);}
  for(const o of room.objects){
   assert(o.x>=0&&o.x<=room.width,room.id+':'+o.id+' is outside the room');
   if(o.y!==undefined&&o.y<520&&['door','cache','memory','ore','shrine'].includes(o.kind))assert(room.platforms.some(p=>Math.abs(p.y-o.y)<2&&o.x>=p.x&&o.x<=p.x+p.w),room.id+':'+o.id+' needs a landing');
  }
 }
 const before=JSON.stringify(ROOMS);applyRoomIdentities(ROOMS);assert.equal(JSON.stringify(ROOMS),before,'re-registering content cannot append duplicate terrain or enemies');
});

test('all room architecture draws finite balanced geometry and respects reduced motion',()=>{
 for(const room of Object.values(ROOMS)){
  const record=canvasRecorder(),g={room,roomId:room.id,combat:{settings:{reducedMotion:false}}},before=JSON.stringify(room);
  assert(drawRoomIdentity(record.context,g,0,0,1280,660,2));record.assertBalanced();assert(record.painted()>0,room.id+' landmark must be visible at the threshold');assert.equal(JSON.stringify(room),before);
  const a=canvasRecorder(),b=canvasRecorder();g.combat.settings.reducedMotion=true;
  drawRoomIdentity(a.context,g,0,0,1280,660,0);drawRoomIdentity(b.context,g,0,0,1280,660,12);a.assertBalanced();b.assertBalanced();assert.equal(a.signature(),b.signature(),room.id+' ignores the passive clock in reduced motion');
 }
});
