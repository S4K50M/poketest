import { BOSSES } from './world.js';
import { MINIONS } from './designs.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const DUNGEON_HEAL=Object.freeze({frames:72,cost:40,amount:1});
export const DUNGEON_MINIONS=['glassmarauder','veilwasp','graveburrower','chaincaster'];
export const bossHealth=boss=>Math.round(boss.hp*(boss.miniboss?1:2.2));
export const bossPhase=enemy=>enemy.hp<=enemy.maxHp/3?3:enemy.hp<=enemy.maxHp*2/3?2:1;

const shot=(g,e,angle,speed,damage,status={})=>g.enemyShots.push({x:e.x,y:e.y-70,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:145,color:BOSSES[e.boss]?.color||MINIONS[e.kind].color,damage,status});
const shockwave=(g,e,direction,speed)=>g.waves.push({x:e.x,y:e.baseY??520,vx:direction*speed,life:110,color:BOSSES[e.boss].color,damage:e.phase===3?1.5:1});
const aimedFan=(g,e,count)=>{const a=Math.atan2((e.targetY??g.player.y)-35-(e.y-70),(e.targetX??g.player.x)-e.x);for(let i=0;i<count;i++)shot(g,e,a+(i-(count-1)/2)*.24,7+e.phase,1,e.elementStatus);};

/** Shared encounter kernel; each biome changes the hazards and each phase adds pressure. */
export function updateBossEncounter(g,e,definition=BOSSES[e.boss]){
  if(!e.introduced)return;
  const p=g.player,b=definition,base=e.baseY??520,phase=bossPhase(e),frameEnemies=g.enemies;
  if(e.state!=='windup')e.telegraph=null;
  if(e.flash>0)e.flash--;if(e.slow>0)e.slow--;
  if(phase>e.phase){
    e.phase=phase;e.state='enrage';e.timer=54;e.stun=0;e.poise=0;e.y=base;e.telegraph=null;
    g.emit('enrage');g.say(b.name.toUpperCase()+' · PHASE '+(phase===2?'II · HUNT':'III · LAST BREATH'));
    g.effects.push({type:'burst',x:e.x,y:e.y-70,color:b.color,life:42});
  }
  if(e.stun>0){e.stun--;e.x=clamp(e.x+(e.vx||0)*.45,e.left,e.right);e.vx*=.75;return;}
  e.timer--;
  if(e.state==='enrage'){if(e.timer<=0){e.state='patrol';e.timer=12;}return;}
  const dx=p.x-e.x,vertical=Math.abs(p.y-base),speed=(1.8+e.phase*.65)*(e.slow>0?.6:1);
  e.elementStatus=b.biome==='frost'?{slow:100}:b.biome==='forge'?{burn:95}:b.biome==='reef'?{slick:95}:{};
  if(e.state==='patrol'){
    e.face=dx>0?1:-1;
    if(Math.abs(dx)>125)e.x=clamp(e.x+e.face*speed,e.left,e.right);
    if(e.timer<=0){
      e.pattern=(e.pattern||0)+1;e.move=(e.pattern+(b.encounter==='reaver'?2:0))%4;
      e.targetX=clamp(p.x,e.left,e.right);e.targetY=p.y;e.state='windup';e.timer=46-e.phase*5;
      const kind=['rush','volley','sigil','slam'][e.move];
      e.telegraph={kind,x:e.x,y:base,targetX:e.targetX,targetY:e.targetY,radius:e.move===3?135:70};
      g.emit('warning');
    }
  }else if(e.state==='windup'&&e.timer<=0){
    e.telegraph=null;
    if(e.move===0){e.state='charge';e.timer=22;e.face=e.targetX>e.x?1:-1;}
    else if(e.move===1){aimedFan(g,e,e.phase===3?7:5);e.state='recover';e.timer=38-e.phase*3;g.emit('cast');}
    else if(e.move===2){
      const oathSigil={memorycascade:'stasis',tidechoir:'lightning',mirrorfuture:'root'},type=oathSigil[b.mechanic]||(['moss','rift'].includes(b.biome)?'root':b.biome==='frost'?'stasis':'lightning');
      for(let n=-1;n<=1;n++)g.hazards.push({type,x:clamp(e.targetX+n*150,e.left,e.right),y:base,timer:34,life:62,damage:1.5,radius:type==='stasis'?68:38});
      if(e.phase===3)aimedFan(g,e,3);
      e.state='recover';e.timer=40;g.emit('cast');
    }else{e.state='leap';e.timer=32;e.leapStart=e.x;e.leapTarget=e.targetX;}
  }else if(e.state==='charge'){
    e.x=clamp(e.x+e.face*(10+e.phase*2),e.left,e.right);
    if(g.tick%3===0)g.effects.push({type:'bossTrail',x:e.x,y:base,color:b.color,life:20});
    if(e.timer<=0){if(e.phase===3)for(const dir of [-1,1])shockwave(g,e,dir,9);e.state='recover';e.timer=42-e.phase*4;}
  }else if(e.state==='leap'){
    const progress=1-e.timer/32;e.x=e.leapStart+(e.leapTarget-e.leapStart)*progress;e.y=base-Math.sin(progress*Math.PI)*190;
    if(e.timer<=0){
      e.y=base;e.state='recover';e.timer=44-e.phase*3;
      if(Math.abs(p.x-e.x)<130&&Math.abs(p.y-base)<70)g.hurt(Math.sign(p.x-e.x)||-e.face,2,{knockback:1.4});
      if(g.enemies!==frameEnemies||p.respawning)return;
      for(const dir of [-1,1])shockwave(g,e,dir,6+e.phase*2);
      g.effects.push({type:'burst',x:e.x,y:base-10,color:b.color,life:38});g.emit('slam');
    }
  }else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=e.phase===3?14:24;}
  // Touching a recovering guardian is safe: this is the deliberate punish/heal window.
  if(!['recover','enrage','leap','windup'].includes(e.state)&&Math.abs(p.x-e.x)<65&&vertical<105)g.hurt(Math.sign(p.x-e.x)||-e.face,e.state==='charge'?2:1.5,{knockback:e.state==='charge'?1.5:1.15});
}

export function updateDungeonMinion(g,e){
  if(!DUNGEON_MINIONS.includes(e.kind))return false;
  const p=g.player,d=MINIONS[e.kind],base=e.baseY??520;
  if(Math.abs(e.x-p.x)>1200||Math.abs(base-p.y)>620)return true;
  g.discovered.add(e.kind);if(e.flash>0)e.flash--;if(e.slow>0)e.slow--;
  if(e.stun>0){e.stun--;e.x=clamp(e.x+(e.vx||0),e.left,e.right);e.vx*=.75;return true;}
  const dx=p.x-e.x,dist=Math.abs(dx);e.timer--;
  if(e.state!=='charge')e.face=dx>0?1:-1;
  if(e.kind==='veilwasp')e.y=base-105+Math.sin(g.tick*.05+e.id)*28;
  if(e.state==='patrol'){
    const keepAway=e.kind==='chaincaster'&&dist<230?-1:1;
    e.x=clamp(e.x+e.face*d.speed*keepAway*(e.slow>0?.5:1),e.left,e.right);
    if(e.timer<=0&&dist<650){e.state='windup';e.timer=e.kind==='graveburrower'?40:30;e.targetX=p.x;e.targetY=p.y;g.emit('warning');
      if(e.kind==='graveburrower')g.hazards.push({type:'root',x:clamp(e.targetX,e.left,e.right),y:base,timer:40,life:62,damage:1.5,radius:50});}
  }else if(e.state==='windup'&&e.timer<=0){
    if(e.kind==='glassmarauder'){e.state='charge';e.timer=20;}
    else if(e.kind==='graveburrower'){e.x=clamp(e.targetX,e.left,e.right);e.state='recover';e.timer=42;g.effects.push({type:'burst',x:e.x,y:base,color:d.color,life:28});}
    else{
      const angle=Math.atan2(e.targetY-35-(e.y-70),e.targetX-e.x);
      for(const offset of (e.kind==='veilwasp'?[-.25,0,.25]:[-.14,0,.14]))shot(g,e,angle+offset,e.kind==='chaincaster'?9:7,1,e.kind==='chaincaster'?{root:12}:{});
      e.state='recover';e.timer=e.kind==='chaincaster'?46:38;
    }
  }else if(e.state==='charge'){
    e.x=clamp(e.x+e.face*11,e.left,e.right);
    if(e.timer<=0){e.state='recover';e.timer=40;}
  }else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=40;}
  if(!['recover','windup'].includes(e.state)&&Math.abs(p.x-e.x)<36&&Math.abs(p.y-e.y)<65)g.hurt(Math.sign(p.x-e.x)||-e.face,e.state==='charge'?1.5:1,{knockback:1.15});
  return true;
}
