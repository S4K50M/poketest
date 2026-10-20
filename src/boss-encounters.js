import { BOSSES } from './world.js';
import { MINIONS } from './designs.js';
import { MAJOR_ENCOUNTERS } from './boss-major-moves.js';
import { WARDEN_ENCOUNTERS } from './boss-warden-moves.js';
import { REAVER_ENCOUNTERS } from './boss-reaver-moves.js';

export const BOSS_ENCOUNTERS=Object.freeze({...MAJOR_ENCOUNTERS,...WARDEN_ENCOUNTERS,...REAVER_ENCOUNTERS});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const ownerOf=e=>e.key??`boss:${e.boss}:${e.id}`;
const phaseOf=e=>e.hp<=e.maxHp/3?3:e.hp<=e.maxHp*2/3?2:1;
const valid=g=>g.phase==='playing'&&!g.player.respawning;

function clearAttack(g,e){
  const owner=ownerOf(e);e.encounter=null;e.motion=null;e.telegraph=null;
  g.bossHazards=(g.bossHazards||[]).filter(h=>h.bossOwner!==owner);
  g.enemyShots=g.enemyShots.filter(s=>s.bossOwner!==owner);
  g.hazards=g.hazards.filter(s=>s.bossOwner!==owner);g.waves=g.waves.filter(s=>s.bossOwner!==owner);
}
export function clearBossEncounter(g,e){
  const owner=ownerOf(e);clearAttack(g,e);
  g.platforms=g.platforms.filter(p=>p.bossOwner!==owner);
  // Keep the enemy array identity until the caller's lifecycle boundary.
  for(let i=g.enemies.length-1;i>=0;i--)if(g.enemies[i].summonedBy===owner){const n=g.enemies[i];g.effects.push({type:'burst',x:n.x,y:n.y-25,color:BOSSES[e.boss].color,life:22});g.enemies.splice(i,1);}
}
export function resetBossEncounters(g){
  g.bossHazards=[];g.platforms=g.platforms.filter(p=>!p.bossOwner);
  for(const e of g.enemies||[])if(e.boss){e.encounter=null;e.motion=null;e.telegraph=null;}
}
function context(g,e,b){
  const left=Math.max(50,finite(e.left,50)),right=Math.min(g.worldWidth-50,finite(e.right,g.worldWidth-50));
  return {x:e.x,y:e.y,floor:e.baseY??520,tx:clamp(g.player.x,left,right),ty:g.player.y,left,right,center:(left+right)/2,phase:e.phase||1,face:Math.sign(g.player.x-e.x)||e.face||1,mechanic:b.mechanic,clampX:x=>clamp(x,left+24,right-24)};
}
/** The same deterministic entry point is used by gameplay and encounter tests. */
export function beginBossMove(g,e,index,definition=BOSSES[e.boss]){
  const profile=BOSS_ENCOUNTERS[e.boss],move=profile?.moves[index];if(!move||e.hp<=0)return false;
  const c=context(g,e,definition),events=move.build(c).map((event,n)=>({...event,at:Math.max(0,Math.floor(event.at||0)),order:n})).sort((a,b)=>a.at-b.at||a.order-b.order);
  e.move=index;e.moveId=move.id;e.moveName=move.name;e.attackKind=move.kind;e.counter=move.counter;e.hint=move.hint;e.face=c.face;
  e.windupFrames=move.tell;e.moveDuration=move.active;e.attackFrame=-1;e.state='windup';e.timer=move.tell;e.targetX=c.tx;e.targetY=c.ty;
  e.encounter={events,frame:-1,next:0,context:{...c,clampX:undefined},recover:move.recover,active:move.active};
  e.telegraph={kind:move.kind,x:c.x,y:c.floor,targetX:c.tx,targetY:c.ty,radius:100,name:move.name,hint:move.hint,counter:move.counter,events};
  g.emit('warning',{boss:e.boss,move:move.id});return true;
}
function execute(g,e,event,b){
  const owner=ownerOf(e),color=b.color,base=e.baseY??520;
  if(event.type==='zone'){
    const life=clamp(finite(event.life,20),1,180),delay=clamp(finite(event.delay,18),0,180);
    const h={...event,type:'zone',x:finite(event.x,e.x),y:finite(event.y,base-25),w:Math.max(8,finite(event.w,120)),h:Math.max(8,finite(event.h,70)),delay,maxDelay:delay,life,maxLife:life,bossOwner:owner,boss:e.boss,color,name:event.label||e.moveName,hint:e.hint,counter:e.counter,lethal:event.damage==='lethal'};
    g.bossHazards??=[];if(g.bossHazards.filter(n=>n.bossOwner===owner).length<36)g.bossHazards.push(h);
  }else if(event.type==='dash'){
    e.motion={x:e.x,y:e.y,to:clamp(finite(event.to,e.targetX),e.left,e.right),duration:Math.max(10,event.duration||18),height:Math.max(0,event.height||0),frame:0,damage:event.damage??1.5,knockback:event.knockback||1.4};
    e.face=Math.sign(e.motion.to-e.x)||e.face;e.state=e.motion.height?'leap':'charge';
  }else if(event.type==='warp'){
    g.effects.push({type:'bossTrail',x:e.x,y:e.y,color,life:22});e.x=clamp(event.x,e.left,e.right);e.y=finite(event.y,base);e.face=Math.sign(g.player.x-e.x)||e.face;
  }else if(event.type==='shots'){
    const x=finite(event.x,e.x),y=finite(event.y,e.y-75),a=finite(event.angle,Math.atan2(e.targetY-35-y,e.targetX-x)),count=clamp(Math.round(event.count||1),1,9),spread=event.spread||0;
    for(let i=0;i<count;i++){
      const angle=a+(count===1?0:(i/(count-1)-.5)*spread),speed=clamp(event.speed||6,2,14);
      if(g.enemyShots.filter(s=>s.bossOwner===owner).length>=64)break;
      g.enemyShots.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,gravity:event.gravity||0,damage:event.damage??1,status:event.status||{},life:150,color,kind:event.kind||'orb',radius:event.radius||7,bossOwner:owner});
    }
    g.emit('cast');
  }else if(event.type==='summon'&&MINIONS[event.kind]){
    const live=g.enemies.filter(n=>n.summonedBy===owner&&n.hp>0).length,count=Math.min(4-live,event.count||1),d=MINIONS[event.kind];
    for(let n=0;n<count;n++){
      const serial=(g._bossSpawnSerial||0)+1;g._bossSpawnSerial=serial;
      const x=clamp(finite(event.x,e.x)+(n-(count-1)/2)*95,e.left+20,e.right-20),hp=Math.round(d.hp*.7);
      g.enemies.push({id:10000+serial,key:owner+':summon:'+serial,summonedBy:owner,bossOwner:owner,kind:event.kind,x,y:base,home:x,homeY:base,baseY:base,left:e.left,right:e.right,hp,maxHp:hp,face:-e.face,state:'patrol',timer:45,stun:0,vx:0,slow:0,rewarded:false});
      g.effects.push({type:'burst',x,y:base-22,color,life:25});
    }
  }else if(event.type==='platform'){
    const w=clamp(event.w||150,80,240),x=clamp(event.x,e.left,e.right-w),y=clamp(event.y,base-145,base-50);
    if(g.platforms.filter(p=>p.bossOwner===owner).length>=8)return;
    // Platform x is its left edge, unlike the centered danger rectangles.
    g.platforms.push({x,y,w,h:18,bossOwner:owner,tempLife:Math.max(180,event.life||420),style:event.style||'stone',color});
    g.emit('cast');
  }else if(event.type==='force'){
    g.bossHazards??=[];g.bossHazards.push({...event,type:'force',x:finite(event.x,e.x),y:finite(event.y,base-50),radius:clamp(event.radius||240,50,500),pull:clamp(event.pull||.5,-1.2,1.2),delay:0,maxDelay:0,life:clamp(event.duration||45,1,90),maxLife:clamp(event.duration||45,1,90),bossOwner:owner,boss:e.boss,color,name:e.moveName,hint:e.hint});
  }else if(event.type==='heal'&&g.enemies.some(n=>n.summonedBy===owner&&n.hp>0))e.hp=Math.min(e.maxHp,e.hp+Math.min(e.maxHp*.03,event.amount||8));
}
function moveBoss(g,e){
  const m=e.motion;if(!m)return;
  const oldX=e.x,oldY=e.y,t=clamp(++m.frame/m.duration,0,1),base=e.baseY??520;
  e.x=m.x+(m.to-m.x)*t;e.y=m.y+(base-m.y)*t-Math.sin(Math.PI*t)*m.height;
  if(g.tick%4===0)g.effects.push({type:'bossTrail',x:e.x,y:e.y,color:BOSSES[e.boss].color,life:16});
  const p=g.player,between=p.x>Math.min(oldX,e.x)-45&&p.x<Math.max(oldX,e.x)+45;
  if(between&&Math.abs(p.y-(oldY+e.y)/2)<95)g.hurt(Math.sign(p.x-e.x)||-e.face,m.damage,{knockback:m.knockback});
  if(t>=1){e.motion=null;e.y=base;e.state='attack';}
}
export function updateBossEncounter(g,e,definition=BOSSES[e.boss]){
  if(!e.introduced||e.hp<=0||g.paused||g.hitstop>0||!valid(g)||e.frozen>0)return;
  const profile=BOSS_ENCOUNTERS[e.boss];if(!profile)return;
  const phase=phaseOf(e),base=e.baseY??520;
  if(phase>(e.phase||1)){
    clearBossEncounter(g,e);e.phase=phase;e.state='enrage';e.timer=54;e.stun=0;e.poise=0;e.y=base;e.attackCursor=0;
    g.effects.push({type:'burst',x:e.x,y:base-70,color:definition.color,life:40});g.emit('enrage');g.say(definition.name.toUpperCase()+' · PHASE '+phase+' · '+profile.title);return;
  }
  if(e.flash>0)e.flash--;if(e.slow>0)e.slow--;
  // Parry and posture break interrupt the entire uncommitted attack timeline.
  if(e.encounter&&(e.state==='recover'||e.stun>12)){clearAttack(g,e);e.y=base;}
  if(e.stun>0){e.stun--;e.x=clamp(e.x+(e.vx||0)*.35,e.left,e.right);e.vx=(e.vx||0)*.75;return;}
  e.timer--;
  if(e.state==='enrage'){if(e.timer<=0){e.state='patrol';e.timer=12;}return;}
  if(e.state==='recover'){e.y=base;if(e.timer<=0){e.state='patrol';e.timer=12;}return;}
  if(e.state==='patrol'){
    const dx=g.player.x-e.x,range=profile.preferredRange??140,speed=(profile.speed??2.4)*(e.slow>0?.55:1);e.face=Math.sign(dx)||e.face;
    if(profile.movement==='skirmish'&&Math.abs(dx)<range*.65)e.x=clamp(e.x-e.face*speed*.7,e.left,e.right);
    else if(profile.movement!=='anchor'&&Math.abs(dx)>range)e.x=clamp(e.x+e.face*speed,e.left,e.right);
    e.y=base-(profile.movement==='hover'?24+Math.sin(g.tick*.06)*10:0);
    if(e.timer<=0){const sequence=profile.sequences[(e.phase||1)-1];e.attackCursor=e.attackCursor||0;const index=sequence[e.attackCursor++%sequence.length];beginBossMove(g,e,index,definition);}return;
  }
  if(e.state==='windup'){
    if(e.timer>0)return;e.state='attack';e.telegraph=null;
  }
  const encounter=e.encounter;if(!encounter){e.state='recover';e.timer=30;e.y=base;return;}
  e.attackFrame=++encounter.frame;
  while(encounter.next<encounter.events.length&&encounter.events[encounter.next].at<=encounter.frame){execute(g,e,encounter.events[encounter.next++],definition);if(!valid(g))return;}
  moveBoss(g,e);if(!valid(g))return;
  if(encounter.frame>=encounter.active){e.encounter=null;e.motion=null;e.state='recover';e.timer=encounter.recover;e.y=base;}
}

/** Geometry is shared with the rendered warning; no invisible full-room hit. */
export function bossHazardHits(h,p,bodyHeight=72){
  const hw=h.w/2,hh=h.h/2,cx=p.x,cy=p.y-bodyHeight/2;
  if(h.shape==='blast'||h.shape==='ring'){
    const dx=Math.max(Math.abs(cx-h.x)-13,0),dy=Math.max(Math.abs(cy-h.y)-bodyHeight/2,0);
    if((dx/hw)**2+(dy/hh)**2>1)return false;
    if(h.shape==='ring'&&Math.hypot(cx-h.x,cy-h.y)+Math.hypot(13,bodyHeight/2)<(h.inner||0))return false;
    return true;
  }
  return cx+13>h.x-hw&&cx-13<h.x+hw&&p.y>h.y-hh&&p.y-bodyHeight<h.y+hh;
}
export function updateBossHazards(g){
  if(g.paused||g.hitstop>0||!valid(g))return;
  const frameEnemies=g.enemies;
  for(const h of g.bossHazards||[]){
    const owner=g.enemies.find(e=>e.boss&&ownerOf(e)===h.bossOwner);
    if(!owner||owner.hp<=0){h.life=0;continue;}if(owner.frozen>0||owner.encounterFrozenTick===g.tick)continue;
    h.x+=(h.vx||0);h.y+=(h.vy||0);
    if(h.delay>0){h.delay--;continue;}
    if(h.life--<=0)continue;
    if(!h.started){h.started=true;if(h.type==='zone'&&['blast','slash'].includes(h.shape)){g.emit('slam',{x:h.x,y:h.y,boss:h.boss});g.effects.push({type:'bossTrail',x:h.x,y:h.y+35,color:h.color,life:14});}}
    const p=g.player;
    if(h.type==='force'){
      const dx=h.x-p.x,dy=h.y-(p.y-35),r=Math.hypot(dx,dy)||1;
      if(r<h.radius&&!p.invul){p.vx+=dx/r*h.pull*1.8;p.vy+=dy/r*h.pull*.12;}
    }else if(bossHazardHits(h,p,g.data.bodyHeight)){
      const damage=h.lethal?p.maxHp*10:(h.damage??1.5),direction=Math.sign(p.x-h.x)||-owner.face;
      g.hurt(direction,damage,{...h.status,knockback:h.knockback||1,unblockable:!!h.unblockable||h.lethal});
      if(g.enemies!==frameEnemies||!valid(g))return;
    }
  }
  g.bossHazards=(g.bossHazards||[]).filter(h=>h.life>0);
  for(const platform of g.platforms)if(platform.bossOwner){const owner=g.enemies.find(e=>e.boss&&ownerOf(e)===platform.bossOwner);if(!owner||owner.hp<=0)platform.tempLife=0;else if(!owner.frozen&&owner.encounterFrozenTick!==g.tick)platform.tempLife--;}
  g.platforms=g.platforms.filter(p=>!p.bossOwner||p.tempLife>0);
  // Finished corpses and summons never accumulate across an extended fight.
  for(let n=g.enemies.length-1;n>=0;n--)if(g.enemies[n].summonedBy&&g.enemies[n].hp<=0&&!g.enemies[n].deathTimer)g.enemies.splice(n,1);
}
