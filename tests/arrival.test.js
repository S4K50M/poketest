import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS,DEFAULT_PARTY} from '../src/world.js';
import {ROSTER} from '../src/roster.js';
import {OPENING_DURATION,openingBeat,drawOpeningCinematic} from '../src/opening-cinematic.js';
import {drawMourningwildBackdrop,drawMourningwildLandmarks,drawMourningwildForeground,drawMourningwildPlatform} from '../src/mourningwild-render.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

const roomIds=['sanctuary',...Object.values(ROOMS).filter(r=>r.biome==='moss').map(r=>r.id)];

test('the opening has three complete finite story acts and clamps timeline boundaries',()=>{
 assert.equal(OPENING_DURATION,12000);
 for(const [ms,index]of [[-1,0],[0,0],[3999,0],[4000,1],[7999,1],[8000,2],[OPENING_DURATION,2],[OPENING_DURATION+4000,2]]){
  const beat=openingBeat(ms);assert.equal(beat.index,index);assert(Number.isFinite(beat.progress)&&beat.progress>=0&&beat.progress<=1);assert(beat.kicker&&beat.title&&beat.line,'every act has readable DOM story text');
 }
 for(const ms of[NaN,Infinity,-Infinity])assert.doesNotThrow(()=>openingBeat(ms));
 assert.equal(new Set([0,4000,8000].map(ms=>openingBeat(ms).title)).size,3,'each composition has its own story title');
});

test('opening artwork restores Canvas state, keeps selected companions immutable, and draws every story act',()=>{
 const parties=[DEFAULT_PARTY,...ROSTER.map((d,i)=>[d.id,ROSTER[(i+1)%ROSTER.length].id,ROSTER[(i+2)%ROSTER.length].id])];
 for(const partyIds of parties)for(const reducedMotion of[false,true])for(const ms of[0,1900,3999,4000,6100,7999,8000,10000,OPENING_DURATION]){
  const party=Object.freeze([...partyIds]),before=JSON.stringify(party),c=canvasRecorder();
  drawOpeningCinematic(c.context,1280,720,ms,party,{reducedMotion});c.assertBalanced();assert(c.painted()>8,'a complete composition appears without a blank opening');assert.equal(JSON.stringify(party),before);
 }
 for(const [w,h]of[[844,390],[640,360],[0,0]]){const c=canvasRecorder();assert.doesNotThrow(()=>drawOpeningCinematic(c.context,w,h,6000,DEFAULT_PARTY,{reducedMotion:true}));c.assertBalanced();}
});

test('reduced-motion opening holds a static complete composition within each act',()=>{
 for(const [a,b]of[[1200,2600],[4500,6500],[8500,10500]]){
  const signatures=[a,b].map(ms=>{const c=canvasRecorder();drawOpeningCinematic(c.context,1280,720,ms,DEFAULT_PARTY,{reducedMotion:true});c.assertBalanced();return c.signature();});
  assert.equal(signatures[0],signatures[1],'story beats may change while decorative movement remains still');
 }
});

for(const id of roomIds)test(`${id}: first-area art remains finite, balanced, and independent of gameplay geometry`,()=>{
 const g=new RPGCampaign(undefined,{worldSeed:1});g.loadRoom(id,150,false);
 for(const reducedMotion of[false,true])for(const cameraY of[0,-700]){
  g.combat.settings.reducedMotion=reducedMotion;
  const before=JSON.stringify({state:g.snapshot(),platforms:g.platforms,objects:g.room.objects,enemies:g.enemies});
  const c=canvasRecorder();assert.equal(drawMourningwildBackdrop(c.context,g,200,cameraY,1280,660,2.5),true);c.assertBalanced();assert(c.painted()>8);
  drawMourningwildLandmarks(c.context,g,200,cameraY,1280,660,2.5);c.assertBalanced();
  drawMourningwildForeground(c.context,g,200,cameraY,1280,660,2.5);c.assertBalanced();
  for(const p of g.platforms.filter(p=>!p.veil).slice(0,8)){drawMourningwildPlatform(c.context,p,g,2.5);c.assertBalanced();}
  assert.equal(JSON.stringify({state:g.snapshot(),platforms:g.platforms,objects:g.room.objects,enemies:g.enemies}),before,'scenery cannot move a landing, actor, enemy, or story object');
 }
});

test('first-area scenery declines other dimensions so their existing renderers remain available',()=>{
 const g=new RPGCampaign();g.loadRoom('forge-path',150,false);const c=canvasRecorder();
 assert.equal(drawMourningwildBackdrop(c.context,g,0,0,1280,660,2),false);assert.equal(drawMourningwildPlatform(c.context,g.platforms[0],g,2),false);c.assertBalanced();
});
