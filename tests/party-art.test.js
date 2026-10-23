import test from 'node:test';
import assert from 'node:assert/strict';
import {ROSTER} from '../src/roster.js';
import {drawCreature,creatureBounds} from '../src/creatures.js';
import {drawCompanionFields,drawCompanionSignature} from '../src/companion-render.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

const starters=ROSTER.slice(0,8),variants=['neutral','up','down','forward','back'];
const types=['magma','lightning','icewall','vortex','fault','shadowtrap','tide','beam'];
const trace=draw=>{const c=canvasRecorder();draw(c.context);c.assertBalanced();assert(c.painted()>3);return c;};

for(const d of starters)test(`${d.name} has readable signature poses and finite directional cast flourishes`,()=>{
 const before=JSON.stringify(d),signatures=[];
 for(const face of[-1,1])for(const variant of variants){
  const event=Object.freeze({id:d.id,variant,name:'fixture',x:320,y:520,face,color:d.accent,life:48});
  for(const reducedMotion of[false,true])for(const progress of[0,.4,.85,1]){
   trace(c=>assert(drawCompanionSignature(c,event,progress,2.7,{reducedMotion})));
   trace(c=>drawCreature(c,d,320,520,.38,face,{state:'cast',walk:1.8},2.7,{castVariant:variant,reducedMotion,shadow:false}));
  }
  const a=trace(c=>drawCompanionSignature(c,event,.2,1)).signature(),b=trace(c=>drawCompanionSignature(c,event,.65,2)).signature();assert.notEqual(a,b,'normal motion must advance through a visible flourish');signatures.push(a);
 }
 assert.equal(new Set(signatures).size,10,'each direction and facing must have a distinguishable cast placement');
 assert.equal(JSON.stringify(d),before,'presentation must preserve stats');
 const bounds=creatureBounds(d);assert(bounds.width>200&&bounds.height>200);
});

test('eight live field shapes are complete, bounded in their authored coordinate system, and immutable',()=>{
 const signatures=[];
 for(const [i,type]of types.entries()){
  const f=Object.freeze({type,x:320,y:520,radius:100,width:170,height:120,life:60,maxLife:120,face:i%2?-1:1,color:starters[i].accent}),g=Object.freeze({companionFields:Object.freeze([f])}),before=JSON.stringify(g);
  for(const reducedMotion of[false,true]){
   const c=trace(c=>assert.equal(drawCompanionFields(c,g,2.5,{reducedMotion}),1));if(!reducedMotion)signatures.push(c.signature());
  }
  assert.equal(JSON.stringify(g),before,'rendering must not consume field life or alter simulation state');
 }
 assert.equal(new Set(signatures).size,8,'all elemental field silhouettes must differ');
});

test('reduced motion freezes eight signature overlays and persistent field secondary motion',()=>{
 for(const [i,d]of starters.entries()){
  const event=Object.freeze({id:d.id,variant:'neutral',x:0,y:0,face:1,color:d.accent}),g=Object.freeze({companionFields:Object.freeze([Object.freeze({type:types[i],x:0,y:0,life:48,maxLife:60,width:170,height:120,radius:100,color:d.accent})])});
  const render=t=>trace(c=>{drawCompanionSignature(c,event,.4,t,{reducedMotion:true});drawCompanionFields(c,g,t,{reducedMotion:true});}).signature();
  assert.equal(render(1),render(10),`${d.name} still secondary animation must not drift`);
 }
});

test('unknown or expired companion effects leave Canvas untouched',()=>{
 const c=canvasRecorder();assert.equal(drawCompanionSignature(c.context,{id:'unknown',x:0,y:0}),false);assert.equal(drawCompanionFields(c.context,{companionFields:[{type:'beam',x:0,y:0,life:0},{type:'unknown',x:0,y:0,life:10}]}),0);assert.equal(c.painted(),0);c.assertBalanced();
});
