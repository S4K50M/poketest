import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {WorldRenderer} from '../src/world-render.js';
import {BOSS_AFTERMATH} from '../src/boss-aftermath.js';
import {BOSSES} from '../src/world.js';
import {drawChampionDestruction} from '../src/boss-aftermath-render.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

function fixture(room){
 const recorder=canvasRecorder(),canvas={width:1440,height:660,getBoundingClientRect:()=>({width:1440,height:660}),getContext:()=>recorder.context};
 const renderer=new WorldRenderer(canvas);let game;
 game=new RPGCampaign(undefined,{worldSeed:1,onEvent:event=>renderer.event(event,game)});
 game.loadRoom(room,850,false);game.combat.settings.reducedMotion=false;
 return {game,renderer,recorder};
}
function withWindow(fn){const previous=globalThis.window;globalThis.window={devicePixelRatio:1};try{return fn();}finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}}

test('a real guardian defeat event drives visible multi-second world animation, pauses, and settles without a modal',()=>withWindow(()=>{
 const {game:g,renderer:r,recorder:c}=fixture('moss-heart'),e=g.enemies.find(e=>e.boss==='briar');
 e.x=1088;e.hp=0;g.awardEnemy(e);const key=g.roomId+':briar';
 assert(r.aftermathStarts.has(key));assert.equal(g.paused,false);assert.equal(g.bossAftermath[0].form,'tree');
 r.render(g,1000);assert(c.calls.some(call=>call[0]==='translate'&&call[1]===1088&&call[2]===520),'death body starts at the actual combat location');c.assertBalanced();
 for(let i=1;i<=20;i++)r.render(g,1000+i*50);
 const elapsed=r.actorTime-r.aftermathStarts.get(key).start;assert(elapsed>.9&&elapsed<1.1,'the transformation remains in its first second');
 g.paused=true;for(let i=1;i<=20;i++)r.render(g,2000+i*50);assert.equal(r.actorTime-r.aftermathStarts.get(key).start,elapsed,'menus pause the local transformation clock');
 g.paused=false;for(let i=1;i<=100;i++)r.render(g,3000+i*50);assert(r.actorTime-r.aftermathStarts.get(key).start>=4.8);assert.equal(g.enemies.find(e=>e.boss==='briar').hp,0);assert(!r.corpses.has(e.key),'a second generic corpse must not obscure the special transformation');c.assertBalanced();
 g.loadRoom('moss-heart',850,false);assert.equal(r.aftermathStarts.size,0,'re-entry shows the persistent tree without replaying a fake death');assert.equal(g.bossAftermath[0].form,BOSS_AFTERMATH.briar.form);
}));

test('every lesser champion breaks into its own colored weapon fragments with finite, immutable art',()=>{
 for(const [boss,b] of Object.entries(BOSSES).filter(([,b])=>b.miniboss)){
  const actor=Object.freeze({boss,x:510,y:520,face:-1,phase:2,state:'recover',timer:24}),before=JSON.stringify(actor),frames=[];
  for(const elapsedMs of[0,600,1500,2400]){const c=canvasRecorder();assert(drawChampionDestruction(c.context,actor,{elapsedMs,time:elapsedMs/1000}));c.assertBalanced();assert(c.painted()>5);frames.push(c.signature());}
  assert.equal(new Set(frames).size,4,b.name+' has a full destruction sequence');assert.equal(JSON.stringify(actor),before);
  const c=canvasRecorder();assert(drawChampionDestruction(c.context,actor,{elapsedMs:2600}));assert.equal(c.painted(),0);
 }
});
