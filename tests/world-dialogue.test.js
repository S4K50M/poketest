import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS,BOSSES,DIALOGUES} from '../src/world.js';
import {WORLD_VOICES,BOSS_VOICES} from '../src/world-voices.js';
import {paginateDialogue,resolveDialogueAnchor,WorldDialogueState} from '../src/world-dialogue-state.js';

const anchor={room:'sanctuary',id:'vell',x:470,y:520,name:'Professor Vell',kind:'npc'};
function world({room='sanctuary',x=470,y=520,enemies=[]}={}){return {phase:'playing',roomId:room,paused:false,hitstop:0,player:{x,y,hp:4,respawning:0},room:{objects:[{id:'vell',x:470,y:520}]},enemies};}
function advanceTime(state,g,ms,options){for(let time=0;time<ms;time+=100)state.update(g,Math.min(100,ms-time),options);}

test('world dialogue preserves speaker order and complete readable text when paging long conversations',()=>{
 const long='A seed can remember the shape of the sun. '+('The garden still has room for tomorrow. '.repeat(12));const lines=[['Vell','  First\n  heartbeat. '],['Traveler',long],['Vell','Then keep going.']];const before=JSON.stringify(lines),pages=paginateDialogue(lines,180);
 assert(pages.length>lines.length);assert(pages.every(([speaker,text])=>speaker&&text&&text.length<=180));assert.deepEqual(pages.filter(([speaker])=>speaker==='Traveler').map(([,text])=>text).join(' '),long.trim());assert.equal(pages[0][1],'First heartbeat.');assert.equal(pages.at(-1)[1],'Then keep going.');assert.equal(JSON.stringify(lines),before);
 const unbroken='x'.repeat(500);assert.equal(paginateDialogue([['A voice',unbroken]],120).map(([,text])=>text).join(''),unbroken);assert.deepEqual(paginateDialogue(null),[]);assert.deepEqual(paginateDialogue([null,['Nobody'],['Vell',7]]),[]);
});

test('dialogue events copy the actual speaker anchor and lines without pausing or changing the world',()=>{
 const events=[],g=new RPGCampaign(undefined,{onEvent:e=>events.push(e)}),npc=g.room.objects.find(o=>o.id==='vell'),lines=[['Professor Vell','A lantern is a promise.']];g.storyStage=1;const before=JSON.stringify(g.snapshot());assert.equal(g.showDialogue(lines,npc),true);const event=events.findLast(e=>e.type==='dialogue');assert(event);assert.deepEqual(event.source,{room:'sanctuary',id:npc.id,x:npc.x,y:npc.y??520,name:npc.name,kind:'npc'});assert.notEqual(event.source,npc);assert.notEqual(event.lines,lines);assert.notEqual(event.lines[0],lines[0]);event.lines[0][1]='Changed in presentation';event.source.x=-100;assert.equal(lines[0][1],'A lantern is a promise.');assert.equal(npc.x,470);assert.equal(JSON.stringify(g.snapshot()),before);assert.equal(g.showDialogue(null,npc),false);assert.equal(g.showDialogue([],npc),false);
});

test('every live NPC interaction emits its own room and position for scene dialogue',()=>{
 for(const room of Object.values(ROOMS))for(const npc of room.objects.filter(o=>o.kind==='npc')){
  const events=[],g=new RPGCampaign(undefined,{onEvent:e=>events.push(e)});g.storyStage=1;g.loadRoom(room.id,{x:npc.x,y:npc.y??520},false);assert(g.input('interact'),room.id+':'+npc.id+' can speak');const event=events.findLast(e=>e.type==='dialogue');assert(event,room.id+':'+npc.id+' emits dialogue');assert.equal(event.source.room,room.id);assert.equal(event.source.id,npc.id);assert.equal(event.source.x,npc.x);assert.equal(event.source.y,npc.y??520);assert(event.lines.length>0);assert(!g.paused);
 }
});

test('every room has a distinct environmental voice tied to a real existing landmark',()=>{
 assert.deepEqual(Object.keys(WORLD_VOICES).sort(),Object.keys(ROOMS).sort());const texts=new Set(),ids=new Set();
 for(const [roomId,voices]of Object.entries(WORLD_VOICES)){
  assert(voices.length>0);assert(Object.isFrozen(voices));for(const voice of voices){const object=ROOMS[roomId].objects.find(o=>o.id===voice.anchorId);assert(object,roomId+' anchor exists');assert.equal(voice.room,roomId);assert.equal(voice.x,object.x);assert.equal(voice.y,object.y??520);assert(Number.isFinite(voice.range)&&voice.range>0);assert(voice.speaker&&voice.text.length>20);assert(!texts.has(voice.text));assert(!ids.has(voice.id));texts.add(voice.text);ids.add(voice.id);assert(Object.isFrozen(voice));}
 }
 assert(Object.isFrozen(WORLD_VOICES));assert.equal(new Set(Object.keys(WORLD_VOICES).map(id=>ROOMS[id].biome)).size,7);
});

test('all twenty-one bosses have distinct, concise arrival and farewell voices',()=>{
 assert.deepEqual(Object.keys(BOSS_VOICES).sort(),Object.keys(BOSSES).sort());const lines=new Set();for(const [id,voice]of Object.entries(BOSS_VOICES)){for(const kind of['intro','defeat']){assert(voice[kind].length>10&&voice[kind].length<=180,id+' '+kind+' can be read during movement');assert(!lines.has(voice[kind]));lines.add(voice[kind]);}assert(Object.isFrozen(voice));}
});

test('manual conversations advance deliberately and never edit gameplay or expire while being read',()=>{
 const state=new WorldDialogueState(),g=world(),before=JSON.stringify(g);assert(state.begin([['Vell','First page.'],['Traveler','Second page.']],anchor));assert(state.snapshot().manual);advanceTime(state,g,30000);assert.equal(state.snapshot().index,0);assert.equal(state.snapshot().text,'First page.');assert.equal(JSON.stringify(g),before);assert(state.advance());assert.equal(state.snapshot().speaker,'Traveler');assert.equal(state.snapshot().index,1);assert(state.advance());assert(!state.snapshot().active);assert.equal(state.advance(),false);
});

test('world speech snapshots and copied sources cannot mutate active presentation state',()=>{
 const state=new WorldDialogueState(),source={...anchor};state.begin(DIALOGUES.vell,source);source.x=-999;const view=state.snapshot();view.source.x=-888;view.text='changed';view.index=999;assert.equal(state.snapshot().source.x,470);assert.notEqual(state.snapshot().text,'changed');assert.equal(state.snapshot().index,0);
});

test('pause, orientation suspension, hitstop and respawn preserve the voice timeline',()=>{
 const state=new WorldDialogueState(),g=world();state.begin([['A voice','Keep the light.']],anchor,{manual:false,kind:'whisper',duration:1000});state.update(g,100);const elapsed=state.snapshot().elapsed;
 for(const flag of['paused','hitstop']){g[flag]=true;advanceTime(state,g,2000);assert.equal(state.snapshot().elapsed,elapsed);g[flag]=false;}g.player.respawning=30;advanceTime(state,g,2000);assert.equal(state.snapshot().elapsed,elapsed);g.player.respawning=0;advanceTime(state,g,2000,{suspended:true});assert.equal(state.snapshot().elapsed,elapsed);state.update(g,100);assert(state.snapshot().elapsed>elapsed);
});

test('walking away, changing room and ending play clear stale scene conversations',()=>{
 for(const change of[g=>g.player.x=1000,g=>g.player.y=-100,g=>g.roomId='moss-path',g=>g.phase='gameover']){const state=new WorldDialogueState(),g=world();state.begin([['Vell','Come back when you are ready.']],anchor);change(g);state.update(g,16);assert(!state.snapshot().active);}
});

test('environmental voices wait for safety, respect manual conversations and speak once per visit session',()=>{
 const voice={id:'lantern',anchorId:'vell',x:470,y:520,speaker:'A promise',text:'Leave a light for anyone still finding their way home.',range:210},state=new WorldDialogueState({voices:{sanctuary:[voice]}}),g=world({enemies:[{x:500,y:520,hp:10}]});advanceTime(state,g,2000);assert(!state.snapshot().active,'nearby enemies suppress automatic reading');g.enemies[0].x=1500;state.update(g,100);assert.equal(state.snapshot().kind,'whisper');assert.equal(state.advance(),false,'ambient text cannot consume interaction');advanceTime(state,g,14000);assert(!state.snapshot().active);advanceTime(state,g,10000);assert(!state.snapshot().active,'a landmark is not spammed again');state.reset();state.begin([['Vell','Stay for a moment.']],anchor);advanceTime(state,g,10000);assert.equal(state.snapshot().kind,'conversation');assert.equal(state.begin([['Boss','You cannot pass.']],{...anchor,boss:'briar'},{manual:false,kind:'boss'}),false,'passing barks do not replace deliberate conversation');state.reset();advanceTime(state,g,1300);assert.equal(state.snapshot().kind,'whisper','a new expedition may hear the place again');
});

test('voice anchors follow actual moving bosses while fixed landmarks retain their real positions',()=>{
 const g=world({enemies:[{boss:'briar',x:900,y:520,hp:10}]});assert.deepEqual(resolveDialogueAnchor({...anchor,boss:'briar',x:700},g),{x:900,y:520});assert.deepEqual(resolveDialogueAnchor({...anchor,x:0},g),{x:470,y:520});assert.equal(resolveDialogueAnchor(null,g),null);const state=new WorldDialogueState();state.begin([['Briar Matron','Keep behind my roots.']],{...anchor,boss:'briar',x:900},{manual:false,kind:'boss'});g.player.x=1600;state.update(g,100);assert(state.snapshot().active,'boss barks tolerate combat movement');g.enemies[0].x=3200;state.update(g,100);assert(!state.snapshot().active,'a far-off boss does not leave a detached caption');
});
