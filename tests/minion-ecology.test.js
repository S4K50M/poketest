import test from 'node:test';
import assert from 'node:assert/strict';
import {NEW_MINIONS,ECOLOGY_MINIONS} from '../src/minion-species.js';
import {updateEcologyMinion,ecologyStrikeDamage} from '../src/minion-behavior.js';
import {drawEnemyMinion,ENEMY_ART_SPECIES} from '../src/enemy-art.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

function fixture(kind,playerX=400){
 const d=NEW_MINIONS[kind],e={id:0,key:'test:0',kind,x:200,y:520,baseY:520,home:200,left:60,right:1000,hp:d.hp,maxHp:d.hp,face:1,state:'patrol',timer:0,flash:0,slow:0,stun:0,vx:0};
 const events=[],hits=[],g={player:{x:playerX,y:520,face:1,dash:0,shielding:false},worldWidth:1100,tick:0,enemies:[e],discovered:new Set(),effects:[],enemyShots:[],hazards:[],emit:(type,data)=>events.push({type,...data}),hurt:(direction,damage,status)=>hits.push({direction,damage,status})};
 return {g,e,events,hits,step(n=1){for(let i=0;i<n;i++){g.tick++;updateEcologyMinion(g,e);}}};
}

test('twelve new species provide twelve distinct roles and two original inhabitants per biome',()=>{
 assert.equal(ECOLOGY_MINIONS.length,12);assert.equal(new Set(Object.values(NEW_MINIONS).map(d=>d.behavior)).size,12);
 for(const biome of ['moss','forge','reef','storm','frost','rift'])assert.equal(Object.values(NEW_MINIONS).filter(d=>d.biome===biome).length,2);
 for(const [id,d] of Object.entries(NEW_MINIONS)){assert(ENEMY_ART_SPECIES.includes(id));assert(d.hp>0&&d.windup>=28&&d.cooldown>=60&&d.range>0);assert(d.hint.length>70);}
});
for(const kind of ECOLOGY_MINIONS)test(`${kind}: a locked attack mark precedes every damaging commitment`,()=>{
 const {g,e,hits,events,step}=fixture(kind);step();assert.equal(e.state,'windup');assert(e.telegraph);assert(events.some(v=>v.type==='warning'));assert(g.discovered.has(kind));
 const locked=e.targetX;g.player.x+=170;step(NEW_MINIONS[kind].windup-1);
 assert.equal(e.targetX,locked,'aim may not silently follow the player');assert.equal(hits.length,0);assert.equal(g.enemyShots.length,0);assert.equal(g.hazards.length,0);
 step();assert.notEqual(e.state,'windup');step(46);assert(e.x>=e.left&&e.x<=e.right);assert(['recover','patrol'].includes(e.state));
});

test('rooted seed artillery and siege mortar use different locked arc timings',()=>{
 const bloom=fixture('bloomspitter'),mortar=fixture('inkmortar');bloom.step(39);mortar.step(51);
 assert.equal(bloom.g.enemyShots.length,3);assert.equal(mortar.g.enemyShots.length,3);
 assert(bloom.g.enemyShots.every(b=>b.gravity===.22));assert(mortar.g.enemyShots.every(b=>b.gravity===.22));
 assert.notEqual(bloom.g.enemyShots[1].vx,mortar.g.enemyShots[1].vx);assert.equal(bloom.g.enemyShots[1].damage,1);assert.equal(mortar.g.enemyShots[1].damage,1.25);
});

test('Sporekeeper heals one wounded ordinary ally, never a boss, and its channel is interruptible',()=>{
 const {g,e,step}=fixture('sporekeeper');const boss={key:'boss',boss:'briar',x:230,y:520,hp:1,maxHp:100},ally={key:'ally',kind:'thornling',x:260,y:520,hp:10,maxHp:100};g.enemies.push(boss,ally);
 step(55);assert.equal(boss.hp,1);assert.equal(ally.hp,28);assert(g.effects.some(v=>v.type==='heal'));
 const f=fixture('sporekeeper');f.g.enemies.push({...ally,hp:10});f.step();assert.equal(f.e.state,'windup');assert.equal(ecologyStrikeDamage(f.g,f.e,10,1,{}),10);assert.equal(f.e.state,'recover');f.step(54);assert.equal(f.g.enemies[1].hp,10);
});

test('furnace shields and rapier parries have heavy, elemental and rear counterplay',()=>{
 for(const kind of ['chainshield','crystalfencer']){
  const f=fixture(kind,310);f.step();f.step();f.e.face=-1;assert(f.e.shielded);assert.equal(ecologyStrikeDamage(f.g,f.e,10,1,{element:'Fire',move:'light1'}),2);
  assert.equal(ecologyStrikeDamage(f.g,f.e,10,-1,{}),10);assert.equal(ecologyStrikeDamage(f.g,f.e,10,1,{element:'Wind'}),11);assert.equal(f.e.state,'recover');assert(f.e.shieldBroken>=120);
  const h=fixture(kind,310);h.step(2);h.e.face=-1;assert.equal(ecologyStrikeDamage(h.g,h.e,10,1,{heavy:true}),11);
 }
});

test('drill and ceiling ambush keep their marked destination after the player retreats',()=>{
 for(const kind of ['cinderdrill','bellspider']){const f=fixture(kind);f.step();const target=f.e.targetX;f.g.player.x=900;f.step(NEW_MINIONS[kind].windup+26);assert(Math.abs(f.e.x-target)<1);assert.equal(f.hits.length,0);assert.equal(f.e.y,520);}
});

test('tether currents respect both shielding and an invulnerable dash',()=>{
 for(const protectedState of [{shielding:true},{dash:5}]){const f=fixture('siphonray',420);Object.assign(f.g.player,protectedState);f.step(45);const x=f.g.player.x;f.step(12);assert.equal(f.g.player.x,x);}
 const f=fixture('siphonray',420);f.step(45);const x=f.g.player.x;f.step(12);assert(f.g.player.x<x);
});

test('magnetic needles, three-beat swarm and two-step fencer commit at different cadences',()=>{
 const m=fixture('magnetmoth');m.step(43+34);assert.equal(m.g.enemyShots.length,3);
 const s=fixture('galeswarm',280);s.step(33);const start=s.e.x;s.step(38);assert(s.e.x>start+80);assert(s.hits.length>0);
 const f=fixture('crystalfencer',300);f.step(29);const x=f.e.x;f.step(22);assert(f.e.x>x+100);assert.equal(f.e.state,'recover');
});

test('Phasehound shows its flank mark, then remains solid for twenty-four frames before the rush',()=>{
 const f=fixture('phasehound',430);f.step();const marked=f.e.flankX;f.step(30);assert.equal(f.e.x,marked);assert.equal(f.e.state,'windup');assert.equal(f.e.timer,24);assert.equal(f.hits.length,0);
 f.step(23);assert.equal(f.e.state,'windup');assert.equal(f.e.x,marked);assert.equal(f.hits.length,0);f.step();assert.equal(f.e.state,'charge');
});

test('Void Lantern uses three spaced delayed floor closures instead of a contact rush',()=>{
 const f=fixture('voidlantern');f.step(57);assert.equal(f.g.hazards.length,3);assert(f.g.hazards.every(h=>h.timer===32&&h.radius===46));assert.equal(f.g.hazards[1].x-f.g.hazards[0].x,150);assert.equal(f.hits.length,0);
});

for(const kind of ECOLOGY_MINIONS)test(`${kind}: original art is finite, balanced, immutable and still under reduced motion`,()=>{
 const signatures=[];
 for(const state of ['patrol','windup','charge','recover','dying']){
  const f=fixture(kind);Object.assign(f.e,{state,timer:17,hp:state==='dying'?0:f.e.hp,deathTimer:state==='dying'?21:0,stun:0,phase:1});const e=Object.freeze({...f.e}),before=JSON.stringify(e),c=canvasRecorder();
  assert(drawEnemyMinion(c.context,e,3.25,NEW_MINIONS[kind]));c.assertBalanced();assert(c.painted()>7);assert.equal(JSON.stringify(e),before);signatures.push(c.signature());
 }
 assert(new Set(signatures).size>2,'anticipation, commitment and recovery need visibly different poses');
 const e=Object.freeze({...fixture(kind).e,state:'charge',reducedMotion:true});const still=[1,2].map(t=>{const c=canvasRecorder();assert(drawEnemyMinion(c.context,e,t,NEW_MINIONS[kind]));c.assertBalanced();return c.signature();});assert.equal(still[0],still[1]);
});

test('unknown species keep existing update and damage paths untouched',()=>{
 const f=fixture('phasehound');f.e.kind='not-an-ecology-species';const before=JSON.stringify(f.e);assert.equal(updateEcologyMinion(f.g,f.e),false);assert.equal(ecologyStrikeDamage(f.g,f.e,12,1,{}),12);assert.equal(JSON.stringify(f.e),before);
});
