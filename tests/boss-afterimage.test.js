import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSSES} from '../src/world.js';
import {CHRONICLE_BOSSES} from '../src/chronicle.js';
import {ESSENTIAL_BOSSES,drawBossCinematic} from '../src/boss-cinematic.js';
import {BOSS_AFTERMATH_ART_DURATION,drawBossAftermath} from '../src/boss-aftermath-render.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

const forms=['tree','embercenser','inkpool','featherperch','stoppedclock','worldheart','dawnlantern','paperbook','cradle'];
const record=(boss,i=0)=>Object.freeze({boss,form:forms[i],x:520,y:490,originX:810,originY:410,duration:4800});
function signature(boss,elapsedMs,reducedMotion=false){const c=canvasRecorder();drawBossAftermath(c.context,record(boss,ESSENTIAL_BOSSES.indexOf(boss)),{elapsedMs,reducedMotion,time:elapsedMs===Infinity?0:elapsedMs/1000});c.assertBalanced();return c.signature();}

test('all nine aftermath transformations are finite read-only art at death, transition and settlement',()=>{
 assert.equal(BOSS_AFTERMATH_ART_DURATION,4800);const before=JSON.stringify({BOSSES,CHRONICLE_BOSSES});
 for(const[boss,i]of ESSENTIAL_BOSSES.map((boss,i)=>[boss,i]))for(const elapsedMs of[-2,0,500,1800,3600,4800,9000,Infinity,NaN])for(const reducedMotion of[false,true]){
  const c=canvasRecorder(),r=record(boss,i),copy=JSON.stringify(r);assert.equal(drawBossAftermath(c.context,r,{elapsedMs,reducedMotion,time:8}),true);c.assertBalanced();assert(c.painted()>5);assert.equal(JSON.stringify(r),copy);
 }
 assert.equal(JSON.stringify({BOSSES,CHRONICLE_BOSSES}),before);
});

test('aftermath retains live death origin and becomes a distinct completed artifact',()=>{
 const settled=new Set();for(const[boss,i]of ESSENTIAL_BOSSES.map((boss,i)=>[boss,i])){
  const c=canvasRecorder();drawBossAftermath(c.context,record(boss,i),{elapsedMs:0});assert(c.calls.some(call=>call[0]==='translate'&&call[1]===810&&call[2]===410),'the body begins where combat ended');
  const first=signature(boss,0),middle=signature(boss,2300),last=signature(boss,4800);assert.notEqual(first,middle);assert.notEqual(middle,last);assert.notEqual(first,last);settled.add(last);
  assert.equal(signature(boss,4800),signature(boss,9000),'completed remains do not continue a death animation');
 }
 assert.equal(settled.size,9,'each major boss leaves its own recognizable remnant');
});

test('reduced motion and saved defeats show the complete remnant immediately',()=>{
 for(const boss of ESSENTIAL_BOSSES){assert.equal(signature(boss,0,true),signature(boss,4700,true));assert.equal(signature(boss,0,true),signature(boss,Infinity));}
 for(const boss of['missing','constructor','toString',null]){const c=canvasRecorder();assert.equal(drawBossAftermath(c.context,{boss,x:1,y:1}),false);assert.equal(c.painted(),0);c.assertBalanced();}
});

test('every introduction moves within both caption acts instead of swapping static text cards',()=>{
 for(const bossId of ESSENTIAL_BOSSES)for(const[a,b]of[[900,2400],[3900,5600]]){
  const frames=[a,b].map(elapsed=>{const c=canvasRecorder();drawBossCinematic(c.context,1280,660,{bossId,elapsed});c.assertBalanced();return c.calls;});
  const transforms=calls=>JSON.stringify(calls.filter(call=>['translate','rotate','scale'].includes(call[0])));
  assert.notEqual(transforms(frames[0]),transforms(frames[1]),bossId+' must change its actual pose/location within an act');
 }
});


test('Bellows leaves a single ember while the Twin Saint alone retains its two dawn suns',()=>{
 const single=canvasRecorder(),twin=canvasRecorder();
 drawBossAftermath(single.context,{boss:'bell',form:'embercenser',x:0,y:520},{elapsedMs:Infinity});
 drawBossAftermath(twin.context,{boss:'belltwin',form:'dawnlantern',x:0,y:520},{elapsedMs:Infinity});
 const dawnSun=call=>call[0]==='ellipse'&&Math.abs(call[1])===28&&call[2]===-115&&call[3]===15&&call[4]===15;
 assert.equal(single.calls.filter(dawnSun).length,0,'animation progress cannot turn Bellows into the Twin Saint');
 assert.equal(twin.calls.filter(dawnSun).length,2,'both of the Twin Saint’s suns remain visible');
 assert(single.calls.some(call=>call[0]==='ellipse'&&call[1]===0&&call[2]===-8&&call[3]===10&&call[4]===4),'the flame guardian leaves one gentle ember');
 single.assertBalanced();twin.assertBalanced();
});
