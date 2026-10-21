import { BOSSES } from './world.js';
import { MINIONS } from './designs.js';
import {bossProgression} from './boss-progression.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const DUNGEON_HEAL=Object.freeze({frames:72,cost:40,amount:1});
export const DUNGEON_MINIONS=['glassmarauder','veilwasp','graveburrower','chaincaster'];
export const bossHealth=boss=>Math.round(boss.hp*(boss.miniboss?1:2.2)*bossProgression(boss).health);
export {bossPhase} from './boss-progression.js';

const shot=(g,e,angle,speed,damage,status={})=>g.enemyShots.push({x:e.x,y:e.y-70,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:145,color:BOSSES[e.boss]?.color||MINIONS[e.kind].color,damage,status});

export { updateBossEncounter } from './boss-encounters.js';

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
