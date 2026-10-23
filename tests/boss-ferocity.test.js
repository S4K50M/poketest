import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {BOSSES,ROOMS} from '../src/world.js';
import {ROSTER} from '../src/roster.js';
import {BOSS_ENCOUNTERS,beginBossMove,updateBossEncounter,resetBossEncounters} from '../src/boss-encounters.js';
import {bossMovement,bossTempo,bossDamage} from '../src/boss-progression.js';
import {drawBossWeapon} from '../src/boss-encounter-render.js';
import {drawBossAdaptation} from '../src/boss-adaptation-render.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';
import {fightGuardian,playCampaign,walkTo} from './helpers/campaign-route.js';

const early=['briar','bell','leviathan','conductor'];
function arena(id,party){
 const g=new RPGCampaign(party,{worldSeed:1}),room=Object.values(ROOMS).find(r=>r.enemies.some(e=>e.boss===id));
 const spec=room.enemies.find(e=>e.boss===id);g.loadRoom(room.id,spec.x-90,false);g.storyStage=1;
 const e=g.enemies.find(e=>e.boss===id);e.introduced=true;return {g,e};
}
function spamK(g,e,max=16000){
 for(let f=0;f<max&&g.phase==='playing'&&e.hp>0;f++){
  const p=g.player;g.setInputs({left:p.x>e.x+65,right:p.x<e.x-65});g.input('heavy');g.step();
 }
 return e.hp<=0;
}

test('actual patrol displacement is at least double the original locomotion, independent of attack tempo',()=>{
 for(const id of Object.keys(BOSSES)){
  const {g,e}=arena(id),profile=BOSS_ENCOUNTERS[id];
  e.state='patrol';e.timer=1000;e.left=50;e.right=g.worldWidth-50;e.x=g.worldWidth*.5;
  g.player.x=e.x+(profile.movement==='anchor'?55:390);g.player.y=520;
  const factor=profile.movement==='anchor'?.5:1,start=e.x;
  for(let n=0;n<10;n++){g.tick++;updateBossEncounter(g,e);}
  const oldDisplacement=(profile.speed||2.4)*factor*10;
  assert(Math.abs(e.x-start)>=oldDisplacement*2.2,id+' moves its body, rather than only shortening a tell');
 }
});

test('a leaping attack traverses its authored path in less than half its original motion frames',()=>{
 for(const id of early){
  const {g,e}=arena(id),profile=BOSS_ENCOUNTERS[id],index=profile.moves.findIndex(m=>m.build({x:e.x,y:e.y,floor:520,tx:g.player.x,ty:520,left:e.left,right:e.right,center:(e.left+e.right)/2,phase:1,face:-1,clampX:x=>x}).some(ev=>ev.type==='dash'));
  beginBossMove(g,e,index);const original=profile.moves[index].build({...e.encounter.context,clampX:x=>x}).find(ev=>ev.type==='dash');
  const motion=e.encounter.events.find(ev=>ev.type==='dash');assert(motion.duration<=original.duration/2,id+' has a genuinely faster crossing');assert(bossMovement(e)>bossTempo(e),'movement and action clocks are separate');
 }
});

for(const id of early)test(id+': stock-party forward K spam loses, while a mixed defensive route can win',()=>{
 const masher=arena(id);assert.equal(spamK(masher.g,masher.e),false);assert.equal(masher.g.phase,'gameover');assert(masher.e.hp>masher.e.maxHp*.2,'a failed masher cannot trade through the encounter');
 const reactive=arena(id);assert(fightGuardian(reactive.g),'visible tells, movement, guard and mixed strikes retain a legitimate route');assert.equal(reactive.e.hp,0);assert.equal(reactive.g.stats.wipes,0);
});

test('none of the eight starter leads can brute-force the first four guardians with forward K alone',()=>{
 for(const lead of ROSTER.slice(0,8))for(const id of early){
  const party=[lead.id,...ROSTER.filter(d=>d.id!==lead.id).slice(0,2).map(d=>d.id)],{g,e}=arena(id,party);
  assert.equal(spamK(g,e,20000),false,lead.name+' cannot armor-trade through '+id);assert.equal(g.phase,'gameover');
 }
});

test('earned levels, forging, talents and relics do not let a forward-K-only loop clear the first four gates',()=>{
 const journey=new RPGCampaign(undefined,{worldSeed:1}),results=[];
 playCampaign(journey,{chapters:4,onGuardian:current=>{
  // Clone the real journey checkpoint. Returning to the boss uses ordinary
  // movement; no health, inventory, enemy, or progression value is edited.
  const copy=new RPGCampaign(undefined,{save:structuredClone(current.save())});
  assert(walkTo(copy,850));const boss=copy.enemies.find(e=>e.boss&&e.hp>0);
  assert.equal(spamK(copy,boss,20000),false,boss.boss+' must respond to an earned-build heavy loop');
  assert.equal(copy.phase,'gameover');results.push(boss.boss);
 }});
 assert.deepEqual(results,early);assert.equal(journey.fragments.size,4);assert.equal(journey.stats.wipes,0,'the prepared mixed route remains playable');
});

test('the last stand is a fourth persistent phase and cannot be reversed by a later heal',()=>{
 for(const id of early){
  const {g,e}=arena(id);e.hp=e.maxHp*.39;updateBossEncounter(g,e);assert.equal(e.phase,3);assert(e.berserk);assert(e.ward?.charges===3);
  const before={movement:bossMovement(e),damage:bossDamage(e,1)};e.hp=e.maxHp*.17;updateBossEncounter(g,e);assert.equal(e.phase,4);assert(bossMovement(e)>before.movement);assert(bossDamage(e,1)>before.damage);assert.equal(e.ward.name,'LAST STAND SHIELD');
  e.hp=e.maxHp*.6;updateBossEncounter(g,e);assert.equal(e.phase,4);assert(e.berserk);assert(!e.healUsed,'early guardians do not gain a healing loop');
 }
});

test('physical armaments and segmented shields draw from their presentation state without advancing combat',()=>{
 const signatures=new Set();for(const id of Object.keys(BOSSES)){
  const {g,e}=arena(id);beginBossMove(g,e,4);assert(e.armament?.kind&&e.armament.name,'the weapon begins assembling during the warning');
  const before=JSON.stringify(e),a=canvasRecorder();drawBossWeapon(a.context,e,1);a.assertBalanced();assert(a.painted()>8);assert.equal(JSON.stringify(e),before);
  e.armament.age=25;const b=canvasRecorder();drawBossWeapon(b.context,e,1);b.assertBalanced();assert.notEqual(a.signature(),b.signature(),'the weapon visibly assembles');signatures.add(b.signature());
  e.ward={remaining:100,total:160,charges:3,maxCharges:3,name:'TEST WARD'};const c=canvasRecorder();drawBossAdaptation(c.context,e,1);c.assertBalanced();assert(c.painted()>3);e.ward.charges=1;const d=canvasRecorder();drawBossAdaptation(d.context,e,1);assert.notEqual(c.signature(),d.signature(),'broken shield plates stay visibly broken');
  resetBossEncounters(g);assert.equal(e.armament,null);assert.equal(e.ward,null);
 }
 assert(signatures.size>=12,'the roster does not share one summoned weapon silhouette');
});
