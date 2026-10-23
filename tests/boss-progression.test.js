import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {BOSSES,ROOMS} from '../src/world.js';
import {bossHealth} from '../src/difficulty.js';
import {bossRank,bossProgression,bossDamage,bossTempo} from '../src/boss-progression.js';
import {BOSS_ENCOUNTERS,chooseBossMove,updateBossEncounter,updateBossHazards,resetBossEncounters} from '../src/boss-encounters.js';
const main=['briar','bell','leviathan','conductor','hourglass','crown'];
function fixture(id,{ratio=1,far=false}={}){
  const g=new RPGCampaign(undefined,{worldSeed:1}),room=Object.values(ROOMS).find(r=>r.enemies.some(e=>e.boss===id)),spec=room.enemies.find(e=>e.boss===id);g.storyStage=1;g.loadRoom(room.id,spec.x-(far?330:90),false);
  const e=g.enemies.find(e=>e.boss===id);Object.assign(e,{introduced:true,hp:e.maxHp*ratio,phase:ratio<=.18?4:ratio<=.4?3:ratio<=.7?2:1,timer:1,state:'patrol',stun:0});return {g,e};
}
const step=(g,e,n=1)=>{for(let f=0;f<n;f++){g.tick++;updateBossEncounter(g,e);updateBossHazards(g);}};

test('guardian progression grows by gate and optional guardian rank is consistent for ids and definitions',()=>{
  let health=0,damage=0,tempo=0;
  for(const [i,id]of main.entries()){const config=bossProgression(id);assert.equal(config.rank,i+1);assert(bossHealth(BOSSES[id])>health);assert(config.damage>damage);assert(config.tempo>tempo);health=bossHealth(BOSSES[id]);damage=config.damage;tempo=config.tempo;}
  for(const [id,boss]of Object.entries(BOSSES)){assert.equal(bossRank(id),bossRank(boss),id+' health and runtime tier agree');assert(Object.isFrozen(bossProgression(id)));}
  assert.equal(bossRank('belltwin'),4);assert.equal(bossRank('palimpsest'),5);assert.equal(bossRank('nullheart'),7);assert.equal(bossHealth(BOSSES.briar),818,'the first guardian starts with a substantial endurance check');
});

test('reactive signature choice avoids immediate repeats and responds to distance and previous attacks',()=>{
  for(const id of Object.keys(BOSSES)){
    const {g,e}=fixture(id),profile=BOSS_ENCOUNTERS[id],used=[];
    for(let n=0;n<12;n++){g.player.x=e.x-(n%3===0?420:90);const index=chooseBossMove(g,e,profile);assert(Number.isInteger(index)&&index>=0&&index<profile.moves.length);if(used.length)assert.notEqual(index,used.at(-1),id+' does not repeat its last signature');used.push(index);e.attackHistory=used.slice(-4);}
    assert(new Set(used).size>=3,id+' uses a varied vocabulary while spacing changes');
  }
});

test('a read has a visible, damaging breakaway and guard only opens after its first six frames',()=>{
  for(const id of ['briar','bell','conductor','leviathan']){
    const {g,e}=fixture(id);e.pressureReady=true;step(g,e);assert.equal(e.state,'countertell');assert(!e.guarding);const hazard=g.bossHazards[0];assert(hazard&&hazard.delay>=20&&hazard.knockback>=2.6);assert(hazard.hint&&hazard.counter);step(g,e,5);assert(!e.guarding);step(g,e);assert(e.guarding);const hp=g.player.hp;g.player.invul=0;step(g,e,40);assert(g.player.hp<hp,id+' cannot be hugged through the announced retaliation');assert(['evade','windup','attack','charge','leap'].includes(e.state));
  }
});

test('a parry interrupts the entire counter read, damage warning and readied guard',()=>{
  const {g,e}=fixture('briar');e.pressureReady=true;step(g,e,14);assert(e.guarding&&e.counterMotion);g.player.shielding=true;g.player.parryFrames=7;g.player.invul=0;g.player.face=1;assert.equal(g.combat.defend(-1,1),false);assert.equal(e.state,'recover');g.hitstop=0;updateBossEncounter(g,e);assert(!e.counterMotion);assert(!e.guarding);assert(!g.bossHazards.some(h=>h.bossOwner===e.key));assert(e.stun>0,'the earned riposte opening survives cleanup');
});

test('all guardians announce frenzy below forty percent, with healing reserved for late gates',()=>{
  for(const id of main){const {g,e}=fixture(id,{ratio:.39,far:true});step(g,e);assert(e.berserk);assert.equal(e.state,'enrage');assert.equal(e.phase,3);assert(e.timer>=28&&e.timer<=40);assert(!e.healChannel);assert(!e.healUsed);assert(g.bossHazards.every(h=>h.delay>0),'phase knockback is visibly announced');assert(bossDamage(e,1)>bossProgression(id).damage);assert(bossTempo(e)>bossProgression(id).tempo);const timer=e.timer;g.paused=true;step(g,e,40);assert.equal(e.timer,timer);}
});

test('late healing is one bounded channel with an exposed recovery and cannot rewind desperation',()=>{
  for(const id of ['conductor','hourglass']){
    const {g,e}=fixture(id,{ratio:.38,far:true});e.berserk=true;step(g,e);assert.equal(e.state,'heal');assert.equal(e.healChannel.total,100);assert(e.healUsed);const before=e.hp;step(g,e,100);assert.equal(e.hp,before+Math.round(e.maxHp*.09));assert(e.berserk);assert.equal(e.state,'recover');assert(!e.healChannel);e.hp=e.maxHp*.36;e.state='patrol';e.timer=1;step(g,e);assert.notEqual(e.state,'heal','healing is spent for this attempt even after health drops again');
  }
});

test('a heavy strike interrupts late healing without granting even a partial heal or a retry',()=>{
  const {g,e}=fixture('crown',{ratio:.38,far:true});e.berserk=true;step(g,e);assert(e.healChannel);g.player.x=e.x-80;const before=e.hp;g.strike(e,1,1,{heavy:true,move:'heavy'});assert(e.healChannel.interrupted);g.hitstop=0;step(g,e);assert.equal(e.state,'recover');assert.equal(e.timer,70);assert(e.hp<before);assert(e.healUsed);assert(!e.healChannel);e.state='patrol';e.stun=0;g.player.x=e.x-330;step(g,e);assert.notEqual(e.state,'heal');
});

test('attempt reset clears the full reaction, guard, posture, healing and rage lifecycle',()=>{
  const {g,e}=fixture('conductor');Object.assign(e,{berserk:true,healUsed:true,healRequest:true,healChannel:{remaining:20},counterMotion:{frame:2},counterState:'read',guarding:true,counterGuard:true,counterFollowup:true,pressureReady:true,pressure:{chain:4},postureLock:120,counterCooldown:140,poise:80,attackHistory:[1,2]});resetBossEncounters(g);for(const field of ['berserk','healUsed','healRequest','guarding','counterGuard','counterFollowup','pressureReady'])assert.equal(e[field],false,field);for(const field of ['healChannel','counterMotion','counterState','pressure'])assert.equal(e[field],null,field);assert.equal(e.postureLock,0);assert.equal(e.counterCooldown,0);assert.equal(e.poise,0);assert.deepEqual(e.attackHistory,[]);
});
