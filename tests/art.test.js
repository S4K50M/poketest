import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/rpg-world.js';
import {ROSTER} from '../src/roster.js';
import {MINIONS} from '../src/designs.js';
import {BOSSES} from '../src/world.js';
import {drawCreature} from '../src/creatures.js';
import {drawEnemyMinion} from '../src/enemy-art.js';
import {drawArenaBoss} from '../src/boss-art.js';
import {drawEntityAnimated} from '../src/entity-animation.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

const poses=['idle','walk','air','dash','land','shield','parry','attack','heavy','cast','hit','death'];
const states=['patrol','windup','charge','attack','leap','recover','stagger','dying'];
const enemy=(kind,state,face=1,boss)=>({id:7,key:'art-fixture',kind,boss,x:320,y:520,baseY:520,home:320,face,state,hp:state==='dying'?0:100,maxHp:100,timer:17,phase:2,move:2,pattern:2,flash:0,stun:state==='stagger'?25:0,recoil:state==='stagger'?8:0,recoilDir:-face,deathTimer:state==='dying'?20:0,introduced:true,telegraph:null,vx:0,slow:0});

for(const d of ROSTER)test(`${d.name}: every playable action draws finite, balanced art in both directions`,()=>{
  const data=JSON.stringify(d);
  for(const face of [-1,1])for(const state of poses)for(const progress of (state==='attack'||state==='heavy'?[0,.18,.5,.92]:[.5])){
    const pose=Object.freeze({state,walk:1.2,attack:state==='attack'||state==='heavy'?.7:0,air:state==='air',land:state==='land'?.8:0,hit:state==='hit'});
    const c=canvasRecorder();
    drawCreature(c.context,d,320,520,.38,face,pose,3.25,{attackProgress:progress,speed:state==='walk'?1:0,shieldRatio:.6,deathProgress:.65,reducedMotion:false,shadow:false});
    c.assertBalanced();assert(c.painted()>8,'a complete silhouette must remain visible');
    assert.equal(JSON.stringify(d),data,'drawing must not change companion statistics');
  }
});

for(const [kind,d] of Object.entries(MINIONS))test(`${d.name}: enemy action art is complete and read-only`,()=>{
  for(const face of [-1,1])for(const state of states){
    const e=Object.freeze(enemy(kind,state,face)),before=JSON.stringify(e),c=canvasRecorder();
    assert.equal(drawEnemyMinion(c.context,e,3.25,Object.freeze({...d})),true,kind+' must have its own renderer');
    c.assertBalanced();assert(c.painted()>5);assert.equal(JSON.stringify(e),before);
  }
});

for(const [id,b] of Object.entries(BOSSES))test(`${b.name}: all boss states and phases have finite, balanced art`,()=>{
  for(const face of [-1,1])for(const state of states){
    const e=Object.freeze(enemy('warden',state,face,id)),before=JSON.stringify(e),c=canvasRecorder();
    assert.equal(drawArenaBoss(c.context,e,Object.freeze({...b}),3.25),true,id+' must have its own renderer');
    c.assertBalanced();assert(c.painted()>9);assert.equal(JSON.stringify(e),before);
  }
  for(const phase of [1,2,3]){
    const c=canvasRecorder();assert(drawArenaBoss(c.context,Object.freeze({...enemy('warden','windup',1,id),phase}),b,0));c.assertBalanced();
  }
  for(const state of ['sealed','enrage']){const c=canvasRecorder();assert(drawArenaBoss(c.context,Object.freeze({...enemy('warden',state,-1,id),phase:3}),b,3.25));c.assertBalanced();assert(c.painted()>9);}
});

test('reduced-motion art keeps all companion, enemy and boss silhouettes visible',()=>{
  for(const d of ROSTER){const c=canvasRecorder();drawCreature(c.context,d,0,0,.38,-1,{state:'idle'},0,{reducedMotion:true,shadow:false});c.assertBalanced();assert(c.painted()>8);}
  for(const [kind,d] of Object.entries(MINIONS)){const c=canvasRecorder();assert(drawEnemyMinion(c.context,Object.freeze({...enemy(kind,'patrol'),reducedMotion:true}),0,d));c.assertBalanced();assert(c.painted()>5);}
  for(const [id,b] of Object.entries(BOSSES)){const c=canvasRecorder();assert(drawArenaBoss(c.context,Object.freeze({...enemy('warden','windup',1,id),reducedMotion:true}),b,0));c.assertBalanced();assert(c.painted()>9);}
});

test('all three final guardian identities keep their own completed drawings',()=>{
  for(const [faction,variant] of Object.entries(BOSSES.nullheart.variants)){
    const c=canvasRecorder();assert(drawArenaBoss(c.context,Object.freeze({...enemy('warden','windup',1,'nullheart'),phase:3}),{...BOSSES.nullheart,...variant},4));c.assertBalanced();assert(c.painted()>9,faction);
  }
});

test('new enemy art declines unknown IDs so fallback rendering remains possible',()=>{
  const c=canvasRecorder();assert.equal(drawEnemyMinion(c.context,enemy('unknown','patrol'),0,{}),false);assert.equal(drawArenaBoss(c.context,enemy('warden','patrol',1,'unknown'),{},0),false);c.assertBalanced();
});

test('frozen charge rigs and their shared animation wrapper stop secondary motion',()=>{
  const fixtures=[...Object.entries(MINIONS).map(([kind,data])=>({e:{...enemy(kind,'charge'),frozen:30},draw:(c,e,t)=>drawEnemyMinion(c,e,t,data)})),...Object.entries(BOSSES).map(([id,data])=>({e:{...enemy('warden','charge',-1,id),frozen:30},draw:(c,e,t)=>drawArenaBoss(c,e,data,t)}))];
  for(const {e,draw} of fixtures){
    const traces=[1,2].map(time=>{const c=canvasRecorder();drawEntityAnimated(c.context,Object.freeze(e),time,()=>draw(c.context,e,time));c.assertBalanced();assert(c.painted()>5);return c.signature();});
    assert.equal(traces[0],traces[1],`${e.boss||e.kind}: frozen charge must hold its complete pose`);
  }
});
