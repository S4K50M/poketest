import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSSES,DEFAULT_PARTY} from '../src/world.js';
import {CHRONICLE_BOSSES} from '../src/chronicle.js';
import {ESSENTIAL_BOSSES,BOSS_CINEMATIC_DURATION,FINALE_CINEMATIC_DURATION,bossCinematicBeat,drawBossCinematic} from '../src/boss-cinematic.js';
import {canvasRecorder} from './helpers/canvas-recorder.js';

test('all nine essential encounters have complete finite two-act introductions',()=>{
 assert.equal(BOSS_CINEMATIC_DURATION,6500);assert.equal(FINALE_CINEMATIC_DURATION,9000);assert.equal(ESSENTIAL_BOSSES.length,9);assert(Object.isFrozen(ESSENTIAL_BOSSES));const titles=new Set();
 for(const id of ESSENTIAL_BOSSES){
  for(const [elapsed,index]of[[-1,0],[0,0],[3249,0],[3250,1],[6499,1],[6500,1],[90000,1]]){const beat=bossCinematicBeat(id,elapsed);assert.equal(beat.index,index);assert.equal(beat.duration,6500);assert(beat.kicker&&beat.title&&beat.line);assert(beat.progress>=0&&beat.progress<=1);}
  const title=bossCinematicBeat(id,4000).title;assert(!titles.has(title));titles.add(title);
 }
 for(const value of[undefined,NaN,Infinity,-Infinity])assert.equal(bossCinematicBeat('briar',value).index,0);
 for(const id of['missing','constructor','toString'])assert(bossCinematicBeat(id,1000).title);
});

test('the finale preserves the chosen ending rather than selecting a covenant accidentally',()=>{
 const endings=['restore','release','wardens','chorus','unwritten'],signatures=new Set();
 for(const ending of endings){const copy=[];for(const [elapsed,index]of[[0,0],[2999,0],[3000,1],[5999,1],[6000,2],[9000,2]]){const beat=bossCinematicBeat('crown',elapsed,{mode:'ending',ending});assert.equal(beat.index,index);assert.equal(beat.duration,9000);assert(beat.kicker&&beat.title&&beat.line);copy.push(beat.line);}assert(!signatures.has(copy.join('|')));signatures.add(copy.join('|'));}
 for(const faction of['wardens','chorus','unwritten'])for(const ms of[0,3500,7000]){
  assert.deepEqual(bossCinematicBeat('nullheart',ms,{mode:'ending',ending:'true',faction}),bossCinematicBeat('nullheart',ms,{mode:'ending',ending:faction}));
  assert.deepEqual(bossCinematicBeat('crown',ms,{mode:'ending',ending:'release',faction}),bossCinematicBeat('crown',ms,{mode:'ending',ending:'release'}),'an existing covenant cannot replace the actual ending choice');
 }
 assert.match(bossCinematicBeat('nullheart',4000,{faction:'wardens'}).title,/Vell/);
});

test('every cinematic chamber draws finite balanced art without editing creature or boss data',()=>{
 const before=JSON.stringify({BOSSES,CHRONICLE_BOSSES}),parties=[Object.freeze([...DEFAULT_PARTY]),Object.freeze(['chronowl','mycora','ferrodrake'])];
 for(const bossId of ESSENTIAL_BOSSES)for(const partyIds of parties)for(const reducedMotion of[false,true])for(const elapsed of[0,2400,3250,5500,6500]){
  const c=canvasRecorder(),copy=JSON.stringify(partyIds);drawBossCinematic(c.context,1280,720,{bossId,elapsed,partyIds,reducedMotion});c.assertBalanced();assert(c.painted()>20);assert.equal(JSON.stringify(partyIds),copy);
 }
 for(const bossId of ESSENTIAL_BOSSES)for(const[width,height]of[[844,390],[640,360],[390,844]]){const c=canvasRecorder();drawBossCinematic(c.context,width,height,{bossId,elapsed:4500});c.assertBalanced();}
 assert.equal(JSON.stringify({BOSSES,CHRONICLE_BOSSES}),before);
});

test('all five finale outcomes draw complete compositions at every story act',()=>{
 for(const ending of['restore','release','wardens','chorus','unwritten'])for(const elapsed of[0,2500,3000,5800,6000,9000])for(const reducedMotion of[false,true]){
  const c=canvasRecorder();drawBossCinematic(c.context,844,390,{mode:'ending',ending,elapsed,partyIds:DEFAULT_PARTY,reducedMotion});c.assertBalanced();assert(c.painted()>20);
 }
 for(const[width,height]of[[0,0],[-1,90],[NaN,720],[1280,Infinity]]){const c=canvasRecorder();assert.doesNotThrow(()=>drawBossCinematic(c.context,width,height));assert.equal(c.painted(),0);c.assertBalanced();}
});

test('reduced motion holds a complete still within each intro and finale act',()=>{
 const cases=[...ESSENTIAL_BOSSES.map(bossId=>({bossId})),...['restore','release','wardens','chorus','unwritten'].map(ending=>({mode:'ending',ending}))];
 for(const scene of cases){const times=scene.mode==='ending'?[[400,2200],[3500,5500],[6400,8400]]:[[400,2200],[3700,5700]];for(const[a,b]of times){const signatures=[a,b].map(elapsed=>{const c=canvasRecorder();drawBossCinematic(c.context,1280,720,{...scene,elapsed,reducedMotion:true});c.assertBalanced();return c.signature();});assert.equal(signatures[0],signatures[1]);}}
});

test('boss chambers have mechanically independent compositions rather than one reskinned portrait',()=>{
 const signatures=new Set();for(const bossId of ESSENTIAL_BOSSES){const c=canvasRecorder();drawBossCinematic(c.context,1280,720,{bossId,elapsed:4500,reducedMotion:true});const signature=c.signature();assert(!signatures.has(signature));signatures.add(signature);}assert.equal(signatures.size,9);
});
