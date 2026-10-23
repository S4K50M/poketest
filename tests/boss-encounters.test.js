import test from 'node:test';
import assert from 'node:assert/strict';
import { RPGCampaign } from '../src/rpg.js';
import { BOSSES, ROOMS } from '../src/world.js';
import { MINIONS } from '../src/designs.js';
import { BOSS_ENCOUNTERS, beginBossMove, updateBossEncounter, updateBossHazards, clearBossEncounter } from '../src/boss-encounters.js';
import {bossRank} from '../src/boss-progression.js';

const context=(phase=1,mechanic)=>({x:1200,y:520,floor:520,tx:1000,ty:520,left:600,right:1800,center:1200,phase,face:-1,mechanic,clampX:n=>Math.max(600,Math.min(1800,n))});
const finite=(value,path='event')=>{
  if(typeof value==='number')assert(Number.isFinite(value),path+' must be finite');
  else if(Array.isArray(value))value.forEach((v,i)=>finite(v,path+'.'+i));
  else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))finite(v,path+'.'+k);
};
const fingerprint=events=>JSON.stringify(events,(key,value)=>['color','name','label','hint','id'].includes(key)?undefined:value);
const fixture=(id,phase=1)=>{
  const g=new RPGCampaign(undefined,{worldSeed:1}),room=Object.values(ROOMS).find(r=>r.enemies.some(e=>e.boss===id));
  g.loadRoom(room.id,Math.max(100,room.enemies.find(e=>e.boss===id).x-240),false);
  const e=g.enemies.find(e=>e.boss===id);e.introduced=true;e.phase=phase;e.hp=e.maxHp*(phase===1?1:phase===2?.6:phase===3?.3:.1);e.berserk=phase>=3;e.healUsed=true;e.stun=0;e.timer=1;g.transition=0;
  return {g,e};
};

test('the entire 21-boss roster has bespoke, executable six-move encounter profiles',()=>{
  assert.deepEqual(Object.keys(BOSS_ENCOUNTERS).sort(),Object.keys(BOSSES).sort());
  const ids=new Set(),identities=new Set(),mechanicalProfiles=new Set();
  for(const[id,p]of Object.entries(BOSS_ENCOUNTERS)){
    assert(p.title&&p.identity,id+' needs a combat identity');assert(!identities.has(p.identity));identities.add(p.identity);
    assert.equal(p.moves.length,6,id);assert.equal(p.sequences.length,4,id+' must have four phase patterns');
    assert(['stalk','anchor','skirmish','hover'].includes(p.movement));
    const used=new Set();
    for(const sequence of p.sequences){assert(sequence.length>=4,id+' phase must be authored');for(const n of sequence){assert(Number.isInteger(n)&&n>=0&&n<p.moves.length);used.add(n);}}
    assert.equal(used.size,6,id+' must use all six signature moves');
    const signatures=[];
    for(const m of p.moves){
      assert(m.id&&m.name&&m.hint&&m.counter,id+' has an unnamed or unreadable move');assert(!ids.has(m.id),'move IDs must be globally unique: '+m.id);ids.add(m.id);
      assert(m.tell>=28,'startup must permit a visible reaction: '+m.id);assert(m.recover>=24,'every attack commits to a punish window: '+m.id);assert(m.active>0);
      for(const phase of[1,2,3,4]){
        const events=m.build(context(phase));assert(Array.isArray(events)&&events.length>0,m.id+' must execute mechanics');finite(events,m.id);
        for(const ev of events){
          assert(ev.at>=0&&Number.isInteger(ev.at),m.id+' needs fixed-frame event timing');
          assert(['zone','dash','warp','shots','summon','platform','force','heal','armament','shield'].includes(ev.type),m.id+' unknown event '+ev.type);
          if(ev.type==='summon')assert(MINIONS[ev.kind],m.id+' summons an existing species');
          if(ev.type==='platform'){assert(ev.y>=520-150,'new ledges must be reachable without double jump');assert(ev.life>=180);}
          if(ev.type==='zone'){
            assert(ev.delay>=12,'hazards warn before becoming damaging: '+m.id);assert(ev.life>0&&ev.life<=90,'hazard lifetime is bounded');
            if(ev.damage==='lethal'){assert(m.tell>=90,'execution attacks require a long tell: '+m.id);assert(phase>=3,'execution belongs to desperation phase: '+m.id);assert(ev.h<220||ev.w<800,'execution leaves a jump, ledge, or horizontal exit');}
          }
        }
      }
      signatures.push(fingerprint(m.build(context(3))));
    }
    assert.equal(new Set(signatures).size,6,id+' must change geometry or behavior between its six moves');
    const profileTrace=signatures.join('|');assert(!mechanicalProfiles.has(profileTrace),id+' may not reuse another boss script');mechanicalProfiles.add(profileTrace);
  }
  assert.equal(ids.size,126);assert.equal(mechanicalProfiles.size,21);
});

for(const[id,p]of Object.entries(BOSS_ENCOUNTERS))test(id+': every signature reaches the simulation and retains named counterplay',()=>{
  const traces=[];
  for(let i=0;i<p.moves.length;i++){
    const {g,e}=fixture(id,3);if(id==='nullheart'){g.fragments.add('crown');g.defeatedBosses.add('palimpsest');g.defeatedBosses.add('belltwin');g.faction='wardens';}
    beginBossMove(g,e,i);
    assert.equal(e.moveId,p.moves[i].id);assert.equal(e.moveName,p.moves[i].name);assert.equal(e.state,'windup');assert.equal(e.counter,p.moves[i].counter);assert(e.telegraph?.hint);
    g.player.x=50;
    const xs=[];
    for(let frame=0;frame<p.moves[i].tell+p.moves[i].active+4;frame++){
      g.tick++;updateBossEncounter(g,e,g.bossInfo(id));updateBossHazards(g);xs.push(Math.round(e.x));
      if(g.phase!=='playing')break;
    }
    finite(e.x);finite(e.y);assert(e.hp>0);
    traces.push(JSON.stringify({hazards:g.bossHazards?.map(h=>({shape:h.shape,x:h.x,y:h.y,w:h.w,h:h.h})),shots:g.enemyShots.map(s=>({x:s.x,y:s.y,vx:s.vx,vy:s.vy})),summons:g.enemies.filter(n=>n.bossOwner).map(n=>n.kind),platforms:g.platforms.filter(b=>b.bossOwner).map(b=>({x:b.x,y:b.y,w:b.w})),motion:[Math.min(...xs),Math.max(...xs)]}));
    clearBossEncounter(g,e);
    assert(!(g.bossHazards||[]).some(h=>h.bossOwner===e.key));assert(!g.platforms.some(b=>b.bossOwner===e.key));assert(!g.enemies.some(n=>n.bossOwner===e.key));
  }
  assert(new Set(traces).size>=2,id+' signatures must produce distinct live simulation traces');
});

// The helper deliberately uses real boss moves and real collision/hurt code;
// these checks catch lifecycle failures that profile validation cannot see.
test('warning zones cannot hurt before activation, and dead owners cannot leave damaging geometry',()=>{
  const {g,e}=fixture('briar');const move=BOSS_ENCOUNTERS.briar.moves.findIndex(m=>m.build(context()).some(ev=>ev.type==='zone'));
  beginBossMove(g,e,move);g.player.invul=0;
  for(let f=0;f<BOSS_ENCOUNTERS.briar.moves[move].tell+1;f++){g.tick++;updateBossEncounter(g,e);}
  const h=g.bossHazards.find(h=>h.shape);assert(h,'signature must spawn a real arena zone');
  Object.assign(g.player,{x:h.x,y:h.y+(h.h||70)/2,invul:0,armor:0,shielding:false,guard:0,fortress:false});
  const hp=g.player.hp;assert(h.delay>0);updateBossHazards(g);assert.equal(g.player.hp,hp,'a visible warning is not an active hitbox');
  e.hp=0;updateBossHazards(g);assert(!g.bossHazards.some(h=>h.bossOwner===e.key));assert.equal(g.player.hp,hp);
});

test('summoned enemies and temporary arena tiles cannot farm progression or survive room resets',()=>{
  const {g,e}=fixture('briar',3),index=BOSS_ENCOUNTERS.briar.moves.findIndex(m=>m.build(context(3)).some(ev=>ev.type==='summon'));
  assert(index>=0);beginBossMove(g,e,index);
  for(let f=0;f<BOSS_ENCOUNTERS.briar.moves[index].tell+BOSS_ENCOUNTERS.briar.moves[index].active;f++){g.tick++;updateBossEncounter(g,e);}
  const summons=g.enemies.filter(n=>n.bossOwner===e.key);assert(summons.length>0&&summons.length<=4);
  const before={xp:g.xp,lumens:g.lumens,minions:g.stats.minions,claimed:g.claimedEnemyRewards.size,quests:JSON.stringify(g.quests),bonds:JSON.stringify(g.companionXP)};
  for(const s of summons)g.strike(s,s.maxHp*100,1,{heavy:true});
  assert.deepEqual({xp:g.xp,lumens:g.lumens,minions:g.stats.minions,claimed:g.claimedEnemyRewards.size,quests:JSON.stringify(g.quests),bonds:JSON.stringify(g.companionXP)},before);
  g.loadRoom('sanctuary',200,false);assert.equal(g.bossHazards.length,0);assert(!g.platforms.some(p=>p.bossOwner));assert(!g.enemies.some(n=>n.bossOwner));
});

test('boss timelines and arena hazards stop for pause, hitstop, and frost',()=>{
  const {g,e}=fixture('briar');beginBossMove(g,e,0);e.timer=1;updateBossEncounter(g,e);const h=g.bossHazards[0];
  for(const key of ['paused','hitstop']){
    g[key]=key==='paused'?true:4;const before=JSON.stringify({timer:e.timer,frame:e.attackFrame,h});updateBossEncounter(g,e);updateBossHazards(g);assert.equal(JSON.stringify({timer:e.timer,frame:e.attackFrame,h}),before,key);g[key]=key==='paused'?false:0;
  }
  e.frozen=20;const before=JSON.stringify({timer:e.timer,frame:e.attackFrame,h});updateBossEncounter(g,e);updateBossHazards(g);assert.equal(JSON.stringify({timer:e.timer,frame:e.attackFrame,h}),before);
});

test('posture break cancels pending boss events and owned damage while preserving a punish window',()=>{
  const {g,e}=fixture('briar');beginBossMove(g,e,0);e.timer=1;updateBossEncounter(g,e);assert(g.bossHazards.length);
  e.state='recover';e.timer=80;e.stun=65;updateBossEncounter(g,e);assert.equal(e.encounter,null);assert.equal(e.state,'recover');assert(e.timer>=70);assert.equal(g.bossHazards.length,0);
});

test('execution beams defeat a blocking active companion, but elevated terrain clears the real hitbox',()=>{
  const {g,e}=fixture('palimpsest',3);const profile=BOSS_ENCOUNTERS.palimpsest,index=profile.moves.findIndex(m=>m.kind==='execution');beginBossMove(g,e,index);e.timer=1;updateBossEncounter(g,e);
  const h=g.bossHazards.find(h=>h.lethal),platform=g.platforms.find(p=>p.bossOwner===e.key);assert(h&&platform);h.delay=0;
  Object.assign(g.player,{x:platform.x+platform.w/2,y:platform.y,invul:0,armor:0,guard:20,fortress:true,shielding:true});const before=g.player.hp;updateBossHazards(g);assert.equal(g.player.hp,before,'standing on the new landing clears the low beam');
  const slot=g.activeSlot;Object.assign(g.player,{x:h.x,y:520,invul:0,armor:0,guard:20,fortress:true,shielding:true});updateBossHazards(g);assert.equal(g.party[slot].hp,0,'an execution cannot be held off by shielding');assert.notEqual(g.activeSlot,slot,'other party members retain the normal mid-fight rescue rule');
});

test('temporary encounter ledges are collidable using the normal platform motor',()=>{
  const {g,e}=fixture('leviathan');beginBossMove(g,e,0);e.timer=1;updateBossEncounter(g,e);const platform=g.platforms.find(p=>p.bossOwner);assert(platform);
  Object.assign(g.player,{x:platform.x+platform.w/2,y:platform.y-2,vy:3,vx:0,grounded:false,invul:60});g.setInputs({});g.step();assert.equal(g.player.y,platform.y);assert(g.player.grounded);
});

test('summoned minion projectiles are owned and cleared when their boss is defeated',()=>{
  const {g,e}=fixture('briar');beginBossMove(g,e,1);e.timer=1;for(let f=0;f<12;f++)updateBossEncounter(g,e);
  const minion=g.enemies.find(n=>n.summonedBy);assert(minion);Object.assign(minion,{kind:'chaincaster',state:'windup',timer:1,stun:0,targetX:g.player.x,targetY:g.player.y});g.updateEnemies();assert(g.enemyShots.some(s=>s.bossOwner===e.key));clearBossEncounter(g,e);assert(!g.enemyShots.some(s=>s.bossOwner===e.key));
});

test('the final frozen frame also holds the owner’s hazard clock',()=>{
  const {g,e}=fixture('briar');beginBossMove(g,e,0);e.timer=1;updateBossEncounter(g,e);e.frozen=1;g.tick++;
  const before=JSON.stringify(g.bossHazards);g.updateEnemies();assert.equal(e.frozen,0);updateBossHazards(g);assert.equal(JSON.stringify(g.bossHazards),before);
});

test('real phase transitions remove old arena terrain, including during an awakened dash',()=>{
 for(const blink of[false,true]){
  const {g,e}=fixture('leviathan');if(blink){g.abilities.add('blink');g.player.dash=5;}
  beginBossMove(g,e,0);e.timer=1;g.step();assert(g.platforms.some(p=>p.bossOwner),'the real step retains newly spawned tiles');
  const oldHazards=new Set(g.bossHazards);e.hp=e.maxHp*.6;g.step();assert.equal(e.phase,2);assert(!g.platforms.some(p=>p.bossOwner),'phase cleanup must survive the shared motor step');assert(!g.bossHazards.some(h=>oldHazards.has(h)),'only the new announced phase breakaway may remain');assert(g.bossHazards.every(h=>h.name==='PHASE BREAKAWAY'&&h.delay>0));
 }
});

test('the public encounter snapshot cannot mutate live status or warning geometry',()=>{
 const {g,e}=fixture('briar');beginBossMove(g,e,0);e.timer=1;updateBossEncounter(g,e);const h=g.bossHazards[0],before=JSON.stringify(h),copy=g.snapshot();
 copy.bossHazards[0].x=-5000;copy.bossHazards[0].status.root=9999;assert.equal(JSON.stringify(h),before);
});
