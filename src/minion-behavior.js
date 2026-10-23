import {NEW_MINIONS} from './minion-species.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const move=(e,amount)=>{e.x=clamp(e.x+amount,e.left??24,e.right??1e6);};
const base=e=>e.baseY??520;
function shot(g,e,vx,vy,damage=1,extra={}){g.enemyShots.push({x:e.x,y:e.y-36,vx,vy,life:155,damage,color:NEW_MINIONS[e.kind].color,kind:'ecology',status:{knockback:1.1},...extra});}
function arc(g,e,targetX,targetY,travel=42,damage=1.1){const gravity=.22;shot(g,e,(targetX-e.x)/travel,(targetY-28-(e.y-36)-gravity*travel*(travel+1)/2)/travel,damage,{gravity});}
function tell(g,e,d){
  e.state='windup';e.timer=d.windup;e.targetX=g.player.x;e.targetY=g.player.y;e.chargeFace=Math.sign(e.targetX-e.x)||e.face||1;e.face=e.chargeFace;e.ecologyHits=0;
  const kind=['drill','drop','landfall'].includes(d.behavior)?'eruption':['shieldwhip','swarm','fencer','flank'].includes(d.behavior)?'rush':'volley';
  e.telegraph={kind,x:e.x,y:base(e),targetX:e.targetX,targetY:e.targetY,radius:d.behavior==='landfall'?120:d.behavior==='drop'?56:65};
  if(d.behavior==='flank'){e.flankX=clamp(e.targetX-(g.player.face||1)*175,e.left,e.right);e.telegraph.targetX=e.flankX;}
  if(d.behavior==='nurse')e.nurseTarget=g.enemies.filter(other=>other!==e&&other.hp>0&&!other.boss&&other.hp<other.maxHp&&Math.abs(other.x-e.x)<390).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]?.key;
  g.emit('warning',{kind:e.kind,x:e.x,y:e.y});
}
function recover(e,frames){e.state='recover';e.timer=frames;e.telegraph=null;e.shielded=false;}
function activate(g,e,d){
  const p=g.player,b=base(e);e.telegraph=null;e.ecologyAge=0;e.startX=e.x;e.startY=e.y;
  if(d.behavior==='seedarc'){for(const off of [-40,0,40])arc(g,e,e.targetX+off,e.targetY,40,1);recover(e,44);}
  else if(d.behavior==='nurse'){
    const ally=g.enemies.find(other=>other.key===e.nurseTarget&&other.hp>0&&!other.boss&&Math.abs(other.x-e.x)<440);
    if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+Math.max(5,Math.round(ally.maxHp*.18)));g.effects.push({type:'heal',x:ally.x,y:ally.y-35,color:d.color,life:36});}
    else{const a=Math.atan2(e.targetY-30-(e.y-36),e.targetX-e.x);shot(g,e,Math.cos(a)*5.5,Math.sin(a)*5.5,.75,{status:{slow:65}});}
    recover(e,48);
  }else if(d.behavior==='mortar'){for(const off of [-78,0,78])arc(g,e,e.targetX+off,e.targetY,49,1.25);recover(e,55);}
  else if(d.behavior==='landfall'){
    for(const off of [-150,0,150])g.hazards.push({type:'stasis',x:clamp(e.targetX+off,24,g.worldWidth-24),y:e.targetY,timer:32,life:53,damage:1.25,radius:46});recover(e,65);
  }else{e.state='charge';e.timer={drill:24,shieldwhip:16,tether:42,magnet:42,swarm:39,drop:27,fencer:22,flank:21}[d.behavior]||20;}
}

/** New species use the same normal stun, dash invulnerability and reward paths
 * as legacy enemies. Only committed, warned attacks deal contact damage. */
export function updateEcologyMinion(g,e){
  const d=NEW_MINIONS[e.kind];if(!d)return false;if(e.hp<=0)return true;
  const p=g.player,b=base(e),dx=p.x-e.x,dist=Math.abs(dx),speed=d.speed*(e.slow>0?.5:1);
  if(dist>1250||Math.abs(b-p.y)>650)return true;
  g.discovered.add(e.kind);if(e.flash>0)e.flash--;if(e.slow>0)e.slow--;if(e.shieldBroken>0)e.shieldBroken--;
  if(e.stun>0){e.stun--;move(e,(e.vx||0));e.vx=(e.vx||0)*.75;return true;}
  e.timer--;e.ecologyAge=(e.ecologyAge||0)+1;
  if(e.state==='patrol'){
    e.face=dx>=0?1:-1;e.shielded=d.behavior==='shieldwhip'&&!e.shieldBroken;
    if(['tether','magnet','swarm','landfall'].includes(d.behavior))e.y=b-95+Math.sin(g.tick*.045+(e.id||0))*18;
    if(d.behavior==='drop')e.y=b-215+Math.sin(g.tick*.025+(e.id||0))*6;
    const preferred={seedarc:330,nurse:250,mortar:430,tether:230,magnet:280,landfall:370,drop:60}[d.behavior]||75;
    if(dist>preferred+35)move(e,e.face*speed);else if(dist<preferred-45&&['nurse','mortar','tether','landfall'].includes(d.behavior))move(e,-e.face*speed*.75);
    if(e.timer<=0&&dist<d.range)tell(g,e,d);
  }else if(e.state==='windup'){
    e.shielded=(d.behavior==='shieldwhip'&&!e.shieldBroken)||(d.behavior==='fencer'&&!e.shieldBroken);
    if(d.behavior==='flank'&&e.timer===24){e.x=e.flankX;e.y=b;e.face=Math.sign(e.targetX-e.x)||1;e.chargeFace=e.face;g.effects.push({type:'mist',x:e.x,y:e.y-25,color:d.color,life:24});e.telegraph={kind:'rush',x:e.x,y:b,targetX:e.targetX,targetY:e.targetY};}
    if(e.timer<=0)activate(g,e,d);
  }else if(e.state==='charge'){
    e.shielded=false;const age=e.ecologyAge;
    if(d.behavior==='drill'){
      const q=Math.min(1,age/19);e.x=e.startX+(clamp(e.targetX,e.left,e.right)-e.startX)*q;e.y=b+Math.sin(q*Math.PI)*24;
      if(age===19){g.effects.push({type:'burst',x:e.x,y:b,color:d.color,life:25});if(Math.abs(p.x-e.x)<66&&Math.abs(p.y-b)<75)g.hurt(Math.sign(p.x-e.x)||e.face,1.5,{knockback:1.45});}
    }else if(d.behavior==='drop'){
      const q=Math.min(1,age/21);e.x=e.startX+(clamp(e.targetX,e.left,e.right)-e.startX)*q;e.y=e.startY+(b-e.startY)*q*q;
      if(age>=19&&Math.abs(p.x-e.x)<46&&Math.abs(p.y-e.y)<70)g.hurt(Math.sign(p.x-e.x)||e.face,1.5,{knockback:1.4,slow:80});
    }else if(d.behavior==='shieldwhip'){
      if(age>=5&&age<=12&&(p.x-e.x)*e.chargeFace>0&&Math.abs(p.x-e.x)<132&&Math.abs(p.y-b)<74)g.hurt(e.chargeFace,1.4,{knockback:1.5});
    }else if(d.behavior==='tether'){
      if(age<30&&dist<300&&Math.abs(p.y-b)<170&&!p.dash&&!p.shielding)p.x+=Math.sign(e.x-p.x)*1.3;
      if(age===31){g.effects.push({type:'static',x:e.x,y:b-30,color:d.color,life:24});if(dist<105&&Math.abs(p.y-b)<100)g.hurt(Math.sign(p.x-e.x)||e.face,1.5,{knockback:1.4});}
    }else if(d.behavior==='magnet'){
      if(age<30&&dist<350&&!p.dash&&!p.shielding)p.x+=Math.sign(e.x-p.x)*1.05;
      if([9,21,33].includes(age)){const a=Math.atan2(e.targetY-30-(e.y-36),e.targetX-e.x);shot(g,e,Math.cos(a)*6.2,Math.sin(a)*6.2,1,{status:{slow:45}});}
    }else if(d.behavior==='swarm'){
      e.y=e.startY+(e.targetY-25-e.startY)*Math.min(1,age/9);const beat=age%13;if(beat<7)move(e,e.chargeFace*7.8);
      if(beat<7&&Math.abs(p.x-e.x)<49&&Math.abs(p.y-e.y)<73)g.hurt(e.chargeFace,1,{knockback:1.2});
    }else if(d.behavior==='fencer'||d.behavior==='flank'){
      const active=d.behavior==='flank'||age<8||age>13;move(e,e.chargeFace*(active?(d.behavior==='fencer'?8.2:11):1));
      if(active&&(p.x-e.x)*e.chargeFace>-20&&Math.abs(p.x-e.x)<(d.behavior==='fencer'?90:45)&&Math.abs(p.y-e.y)<78)g.hurt(e.chargeFace,d.behavior==='fencer'?1.25:1.5,{knockback:1.35});
    }
    if(e.timer<=0){e.y=b-(d.behavior==='magnet'||d.behavior==='tether'||d.behavior==='swarm'?90:0);recover(e,d.behavior==='drop'?64:d.behavior==='fencer'?44:46);}
  }else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=d.cooldown;e.ecologyAge=0;e.telegraph=null;}
  return true;
}

/** Frontal guard is breakable; skills, a flank, or a heavy always matter.
 * Healer channels are explicitly interruptible rather than delayed by stun. */
export function ecologyStrikeDamage(g,e,damage,direction,options={}){
  const d=NEW_MINIONS[e.kind];if(!d)return damage;
  if(d.behavior==='nurse'&&e.state==='windup'&&!options.dot){recover(e,65);e.nurseTarget=null;g.effects.push({type:'number',x:e.x,y:e.y-85,text:'CHANNEL BROKEN',life:35,color:d.color});}
  const frontal=direction===-e.face;
  if(e.shielded&&!e.shieldBroken&&frontal&&!options.dot){
    if(options.heavy||(options.element&&!options.move)){e.shieldBroken=125;recover(e,50);g.emit('slam');return damage*1.1;}
    g.effects.push({type:'spark',x:e.x-e.face*18,y:e.y-38,color:d.color,life:16});return damage*.2;
  }
  return damage;
}
