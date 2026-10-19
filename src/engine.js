import { findFighter, getMove } from './roster.js';

export const FPS=60;
export const GRAVITY=.013;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const magnitude=(a,b)=>Math.hypot(a.x-b.x,(a.z-b.z)*1.15);
const emptyInputs=()=>({forward:false,back:false,up:false,down:false});

export function createFighter(id,side){
  const data=findFighter(id);
  return {data,side,x:side===0?-1.65:1.65,z:0,y:0,face:side===0?1:-1,vx:0,vy:0,vz:0,hp:data.hp,guard:100,kinetic:0,stamina:100,
    attack:null,buffer:null,stun:0,blockstun:0,knockdown:0,frost:0,burn:0,install:0,armor:0,parry:0,flash:0,wallLock:0,wallSplat:0,dash:0,dashDir:1,airJumps:0,
    blocking:false,inputs:emptyInputs(),lastTaps:{},history:[],cooldowns:{},techWindow:0,pendingThrow:null,clone:null,cloneAttack:null,
    stance:'fortress',burstUsed:false,rage:false,combo:0,comboDamage:0,comboTime:0,juggles:0,walkPhase:0,string:0,aiThink:0,aiPlan:null,lastMove:null,aiTechAt:0};
}

/** Deterministic fixed-step simulation. Rendering and input sampling run independently. */
export class CombatEngine{
  constructor(player='pyrojaw',enemy='voltantis',options={}){
    this.ids=[player,enemy];this.arena=options.arena||'foundry';this.difficulty=options.difficulty||'normal';this.aiEnabled=options.ai!==false;this.random=options.random||Math.random;
    this.onEvent=options.onEvent||(()=>{});this.wins=[0,0];this.round=1;this.tick=0;this.paused=false;this.events=[];this.walls=Array(8).fill(100);this.tier=0;this.resetRound();
  }
  emit(type,props={}){const e={type,tick:this.tick,...props};this.events.push(e);if(this.events.length>80)this.events.shift();this.onEvent(e);}
  resetRound(){
    this.fighters=this.ids.map(createFighter);this.phase='intro';this.phaseTime=125;this.time=3600;this.hitstop=0;this.cinematic=0;this.cinematicName='';this.zones=[];this.projectiles=[];this.roundWinner=null;this.callout=null;
  }
  setInputs(side,inputs){this.fighters[side].inputs={...emptyInputs(),...inputs};}
  direction(f){return f.inputs.down?'down':f.inputs.up?'up':f.inputs.forward?'forward':f.inputs.back?'back':'neutral';}
  input(side,key,direction){
    if(this.phase!=='fighting'||this.paused||this.cinematic>0)return false;
    const f=this.fighters[side],dir=direction||this.direction(f);
    if(key==='grab'&&f.techWindow>0){this.tech(f);return true;}
    if(['forward','back','up','down'].includes(key)){
      f.history.push({key,tick:this.tick});f.history=f.history.filter(h=>this.tick-h.tick<35);
      if((key==='forward'||key==='back')&&f.lastTaps[key]!==undefined&&this.tick-f.lastTaps[key]<15&&this.canAct(f)){
        f.dash=13;f.dashDir=key==='forward'?1:-1;this.emit('dash',{side});
      }
      f.lastTaps[key]=this.tick;
      // Crouch/sidestep cancel allows a back, back, down, back backdash chain.
      if(key==='down'&&f.dash>0&&f.dashDir<0){f.dash=0;f.lastTaps.back=this.tick;}
      return true;
    }
    if(key==='jump'){
      if(!this.canAct(f))return false;
      if(f.y<=.02){f.vy=f.data.weight>1.5?.19:.235;f.airJumps=1;this.emit('jump',{side});return true;}
      if(f.data.id==='zephyrix'&&f.airJumps===1){f.vy=.23;f.airJumps++;this.emit('jump',{side});return true;}
      if(f.data.weight<1&&f.airJumps===1){f.vx=f.face*f.data.dash*1.6;f.vy=.05;f.airJumps++;f.dash=9;this.emit('dash',{side});return true;}
      return false;
    }
    if(key==='heavy'&&f.data.id==='pyrojaw'){
      const history=f.history.filter(h=>this.tick-h.tick<30).map(h=>h.key);
      if(dir==='forward'&&history.join(',').endsWith('forward,down,forward'))key='godfist';
    }
    if(!this.canAct(f)||f.attack){f.buffer={key,dir,expires:this.tick+9};return false;}
    return this.startAttack(f,key,dir);
  }
  canAct(f){return !f.stun&&!f.blockstun&&!f.knockdown&&!f.techWindow;}
  startAttack(f,key,dir='neutral'){
    const move=getMove(f.data,key,dir,f);if(!move)return false;
    if(key==='burst'){
      if(f.burstUsed||!(f.hp<f.data.hp*.25||f.kinetic>=100))return false;
      f.burstUsed=true;f.kinetic=0;this.cinematic=48;this.cinematicName=move.name;this.emit('burst',{side:f.side,x:f.x,z:f.z,name:move.name});
    }
    if(key==='special'){
      if((f.cooldowns[dir]||0)>0||f.stamina<move.cost){this.emit('unavailable',{side:f.side,name:f.stamina<move.cost?'STAMINA RECOVERING':'TECHNIQUE COOLING DOWN'});return false;}
      f.stamina-=move.cost;f.cooldowns[dir]=move.cooldown;
      if(move.ground)move.unblockable=f.stance==='quake';
    }
    f.attack={move:{...move},frame:0,hit:false,spawned:false,contact:false,dir};f.lastMove=move;f.blocking=false;f.dash=0;
    f.armor=(move.armor||f.data.element==='Steel'||key==='burst')?1:0;
    if(move.type==='parry')f.parry=move.startup+move.active;
    if(key==='jab')f.string=(f.string+1)%3;else f.string=0;
    if(f.clone&&!move.clone&&move.type!=='parry'){
      f.cloneAttack={move:{...move,damage:Math.round(move.damage*.55),grab:false,launch:0,projectile:false,cloneHit:true},timer:move.startup+7,x:f.clone.x,z:f.clone.z,face:f.face};f.clone=null;
    }
    this.emit('attack',{side:f.side,name:move.name});return true;
  }
  tech(f){const other=this.fighters[1-f.side];f.techWindow=0;f.pendingThrow=null;f.stun=10;other.stun=10;other.attack=null;f.vx=-f.face*.12;other.vx=-other.face*.12;this.emit('tech',{side:f.side,x:f.x,z:f.z});}
  step(){
    if(this.paused||this.phase==='matchover')return;
    this.tick++;
    if(this.phase==='intro'){if(--this.phaseTime<=0){this.phase='fighting';this.emit('fight')}return;}
    if(this.phase==='roundover'){if(--this.phaseTime<=0){this.round++;this.resetRound()}return;}
    if(this.cinematic>0){this.cinematic--;return;}
    if(this.hitstop>0){this.hitstop--;return;}
    if(this.aiEnabled)this.think(this.fighters[1],this.fighters[0]);
    for(const f of this.fighters)this.updateFighter(f,this.fighters[1-f.side]);
    this.resolveBodyCollision();
    for(const f of this.fighters)this.resolveAttack(f,this.fighters[1-f.side]);
    this.updateProjectiles();this.updateZones();
    this.time--;
    const [p,e]=this.fighters;
    if(p.hp<=0||e.hp<=0||this.time<=0){
      const hp=[p.hp/p.data.hp,e.hp/e.data.hp];
      this.roundWinner=Math.abs(hp[0]-hp[1])<.0001?null:hp[0]>hp[1]?0:1;
      if(this.roundWinner!==null)this.wins[this.roundWinner]++;
      this.phase=this.wins.some(w=>w>=2)?'matchover':'roundover';this.phaseTime=165;
      this.emit('roundend',{winner:this.roundWinner,match:this.phase==='matchover',timeout:this.time<=0});
    }
  }
  updateFighter(f,other){
    for(const key of ['stun','blockstun','knockdown','frost','burn','install','parry','flash','wallLock','wallSplat','comboTime'])if(f[key]>0)f[key]--;
    for(const k in f.cooldowns)if(f.cooldowns[k]>0)f.cooldowns[k]--;
    if(f.comboTime===0){f.combo=0;f.comboDamage=0;}
    f.stamina=clamp(f.stamina+.16,0,100);
    if(!f.blockstun&&!f.blocking)f.guard=clamp(f.guard+.14,0,100);
    f.rage=f.hp<f.data.hp*.25&&!f.burstUsed;
    if(f.clone){f.clone.life--;if(f.clone.life<=0)f.clone=null;}
    if(f.techWindow>0){
      // Window covers exactly the next 12 simulation frames after connection.
      f.techWindow--;
      if(f.techWindow===0&&f.pendingThrow){
        const pending=f.pendingThrow;f.pendingThrow=null;this.damage(pending.attacker,f,pending.move,{throw:true});
        f.vy=pending.move.launch||.17;f.vx=pending.attacker.face*.11;f.y=.05;
      }
    }
    if(f.cloneAttack){
      f.cloneAttack.timer--;
      if(f.cloneAttack.timer<=0){const a=f.cloneAttack;f.cloneAttack=null;
        // The clone relocates to the opponent's flank. Its own hurtbox was placed at cast time.
        if(Math.abs(a.x-other.x)<a.move.range+1&&Math.abs(a.z-other.z)<2){this.damage(f,other,a.move,{crossup:true});this.emit('clone',{x:a.x,z:a.z,side:f.side});}
      }
    }
    if(this.canAct(f)&&!f.attack){f.face=other.x>=f.x?1:-1;}
    f.blocking=!!(f.inputs.back&&!f.stun&&!f.knockdown&&!f.techWindow&&!f.attack&&f.y<=.02);
    if(f.attack){
      f.attack.frame++;const a=f.attack,m=a.move;
      if(m.type==='burst')f.armor=99;
      else if(a.frame>=m.startup)f.armor=0;
      if(m.travel&&a.frame>=Math.max(1,m.startup-5)&&a.frame<m.startup+m.active)f.x+=f.face*m.travel;
      if(m.dive){f.vy=-.13;f.x+=f.face*.09;}
      if(a.frame===m.startup){
        if(m.teleport){f.z=clamp(other.z+(f.z<=other.z?-.8:.8),-2.9,2.9);f.x=other.x-f.face*1.25;this.emit('teleport',{side:f.side,x:f.x,z:f.z});}
        if(m.selfLaunch)f.vy=m.selfLaunch;
        if(m.stance){f.stance=f.stance==='fortress'?'quake':'fortress';this.emit('stance',{side:f.side,name:f.stance.toUpperCase()+' STANCE'});}
        if(m.install){f.install=480;this.emit('install',{side:f.side,name:'DRAGON INSTALL'});}
        if(m.clone){f.clone={x:other.x+f.face*.8,z:clamp(f.z+.9,-2.7,2.7),life:480};this.emit('clone',{side:f.side,name:'SHADOW CLONE SET'});}
        if(m.zone){this.zones.push({x:f.x+f.face*1.5,z:f.z,radius:1.1,life:300,owner:f.side,tick:0});}
        if(m.vortex){f.vortex=45;}
        if(m.projectile){this.projectiles.push({x:f.x+f.face*.5,z:f.z,y:.9,face:f.face,speed:.16,color:f.data.color,owner:f.side,move:m,life:Math.ceil(m.range/.16)});a.hit=true;}
      }
      if(a.frame>=m.startup+m.active+m.recovery){f.attack=null;f.armor=0;}
      // Confirmed jab strings cancel their recovery. Whiffs must fully recover.
      if(f.attack&&m.type==='jab'&&a.contact&&a.frame>=m.startup+m.active+2&&f.buffer?.key==='jab'&&f.buffer.expires>=this.tick){f.attack=null;}
    }
    if(f.vortex>0){f.vortex--;if(magnitude(f,other)<4.5){other.x+=(f.x-other.x)*.025;other.z+=(f.z-other.z)*.025;}}
    if(f.buffer&&f.buffer.expires<this.tick)f.buffer=null;
    if(!f.attack&&this.canAct(f)&&f.buffer){const b=f.buffer;f.buffer=null;this.startAttack(f,b.key,b.dir);}
    if(this.canAct(f)&&!f.attack){
      const frost=f.frost>0?.7:1,ix=Number(f.inputs.forward)-Number(f.inputs.back),iz=Number(f.inputs.down)-Number(f.inputs.up);
      if(f.dash>0){f.x+=f.face*f.data.dash*f.dashDir*frost;f.dash--;}
      else{f.x+=ix*f.face*f.data.speed*(ix<0?.4:1);f.z+=iz*f.data.speed*.9*frost;}
      if((ix||iz)&&f.y<.05)f.walkPhase+=.20;
      if(f.data.id==='voltantis'&&iz&&this.tick%9===0)f.z+=iz*.11*frost;
    }
    f.x+=f.vx;f.z+=f.vz;f.vx*=f.y>.05?.96:.78;f.vz*=.8;
    if(f.wallSplat>0){f.y=.7;f.vy=0;}
    else if(f.y>0||f.vy>0){f.y+=f.vy;f.vy-=GRAVITY*f.data.weight**.3;if(f.y<=0){f.y=0;f.vy=0;f.airJumps=0;if(f.juggles>0){f.knockdown=24;f.juggles=0;f.stun=0;this.emit('land',{side:f.side,x:f.x,z:f.z});}}}
    this.boundary(f);
  }
  resolveBodyCollision(){
    const [a,b]=this.fighters;if(Math.abs(a.z-b.z)>.65||Math.abs(a.y-b.y)>1.0)return;
    const min=a.data.hurt.radius+b.data.hurt.radius,dist=Math.abs(a.x-b.x);
    if(dist<min){const sign=a.x<=b.x?1:-1,amount=(min-dist)/2;a.x-=amount*sign;b.x+=amount*sign;}
  }
  resolveAttack(f,target){
    const a=f.attack;if(!a)return;const m=a.move;
    if(a.frame<m.startup||a.frame>=m.startup+m.active||a.hit||m.stance||m.install||m.clone||m.projectile||m.type==='parry'||m.zone)return;
    const dx=(target.x-f.x)*f.face,dz=Math.abs(target.z-f.z);
    const attackBottom=f.y+(m.low||m.ground?0:.5),attackTop=f.y+(m.ground?.2:m.low?.7:m.launch?2.15:1.7);
    const inHeight=m.ground?target.y<.16:attackTop>=target.y+.1&&attackBottom<=target.y+target.data.hurt.height;
    if(dx<-.18||dx>m.range+target.data.hurt.radius||dz>m.width+target.data.hurt.depth||!inHeight||target.knockdown>0||target.techWindow>0)return;
    if(m.grab){if(target.y>.15||target.stun>0)return;a.hit=true;a.contact=true;target.techWindow=12;target.pendingThrow={attacker:f,move:m};target.attack=null;this.emit('grab',{side:f.side,x:target.x,z:target.z});return;}
    if(m.multi){a.multiNext??=m.startup;if(a.frame<a.multiNext)return;a.multiNext=a.frame+2;if(a.frame+2>=m.startup+m.active)a.hit=true;}else a.hit=true;
    a.contact=true;this.damage(f,target,m);
  }
  damage(attacker,target,move,options={}){
    if(target.hp<=0)return;
    const counter=!!(target.attack&&target.attack.frame<target.attack.move.startup);
    const parryHeavy=target.parry>0&&move.type==='heavy';
    const fortress=target.data.id==='terrakhan'&&target.stance==='fortress'&&move.type==='jab'&&this.canAct(target)&&!target.attack;
    if(!options.throw&&(parryHeavy||fortress)){
      attacker.stun=parryHeavy?32:20;attacker.attack=null;attacker.vx=-attacker.face*.09;
      if(parryHeavy){attacker.hp=Math.max(0,attacker.hp-28);attacker.vy=.20;attacker.y=.05;attacker.juggles++;target.parry=0;target.attack=null;target.kinetic=clamp(target.kinetic+20,0,100);}
      this.emit('parry',{side:target.side,x:target.x,z:target.z,name:parryHeavy?'IRON REVERSAL':'FORTRESS PARRY'});return;
    }
    const guard=target.blocking&&!options.crossup&&!options.throw&&!move.unblockable;
    if(guard){
      const guardDamage=move.type==='heavy'?27:move.type==='burst'?55:move.type==='special'?22:10;
      target.guard=Math.max(0,target.guard-guardDamage);target.blockstun=move.type==='jab'?10:17;
      target.vx=attacker.face*.035;attacker.kinetic=clamp(attacker.kinetic+3,0,100);
      if(move.element==='Fire'||attacker.data.element==='Fire'&&move.type==='special')target.hp=Math.max(0,target.hp-Math.max(2,Math.round(move.damage*.17)));
      this.emit('block',{x:target.x,z:target.z,side:target.side});
      if(target.guard<=0){target.blocking=false;target.blockstun=0;target.stun=65;target.guard=40;this.emit('guardbreak',{x:target.x,z:target.z,side:target.side,name:'GUARD SHATTERED'});}
      return;
    }
    const scaled=target.juggles>0?Math.max(.35,1-target.juggles*.16):1;
    const rawDamage=move.damage*attacker.data.power*(counter?1.2:1)*(attacker.install>0?1.2:1)*scaled;
    const damage=Math.max(1,Math.round(rawDamage));target.hp=Math.max(0,target.hp-damage);
    target.flash=8;attacker.kinetic=clamp(attacker.kinetic+damage*.85,0,100);target.kinetic=clamp(target.kinetic+damage*.65,0,100);
    attacker.combo=target.stun>0||target.y>.05||target.techWindow>0?attacker.combo+1:1;
    attacker.comboDamage=attacker.combo===1?damage:attacker.comboDamage+damage;attacker.comboTime=120;
    let stun=move.stun||24;const element=move.element||(move.type==='special'?attacker.data.element:null);
    if(element==='Electric')stun+=3;
    if(element==='Ice')target.frost=300;
    if(element==='Fire'&&move.burn){target.burn=180;this.zones.push({x:target.x,z:target.z,radius:.75,life:210,owner:attacker.side,tick:0});}
    const armored=target.armor>0;
    if(armored){target.armor--;this.emit('armor',{side:target.side,name:'SUPER ARMOR'});}
    else{
      target.stun=stun+(counter?6:0);target.blockstun=0;target.wallSplat=0;target.blocking=false;target.attack=null;target.parry=0;target.dash=0;
      target.vx=attacker.face*(move.knockback??(move.type==='burst'?.22:move.type==='heavy'?.13:.035));
      if(move.launch||target.y>.05){const launch=(move.launch||.13)*Math.max(.42,1-target.juggles*.13);target.vy=launch;target.y=Math.max(.04,target.y);target.juggles++;}
      target.wallImpact={damage,break:!!move.wallBreak,attacker:attacker.side};
    }
    this.hitstop=move.type==='burst'?13:move.type==='heavy'?5:3;
    this.emit(options.throw?'throw':'hit',{x:target.x,z:target.z,y:target.y+.9,side:attacker.side,damage,counter,move,armored,crossup:!!options.crossup});
    if(counter)this.emit('counter',{side:attacker.side,name:'COUNTER HIT'});
  }
  boundary(f){
    const maxZ=3.2,maxX=5.9-Math.max(0,Math.abs(f.z)-1.7),outside=Math.abs(f.x)>maxX||Math.abs(f.z)>maxZ;
    if(!outside)return;
    const z=Math.abs(f.z)>maxZ;
    const index=z?(f.z<0?0:4):f.x>0?(f.z<-1.7?1:f.z>1.7?3:2):(f.z>1.7?5:f.z<-1.7?7:6);
    if(f.wallImpact&&f.wallLock===0&&(Math.abs(f.vx)>.045||Math.abs(f.vz)>.045)){
      f.wallLock=60;const impact=f.wallImpact;
      if(this.walls[index]<=0&&this.tier===1){f.hp=0;this.emit('ringout',{side:f.side,name:'RING OUT'});}
      else{
        this.walls[index]=Math.max(0,this.walls[index]-(impact.break?65:24));
        if(this.walls[index]<=0&&impact.break){
          if(this.tier===0){this.tier=1;this.walls=Array(8).fill(70);f.x=clamp(f.x,-3.5,3.5);f.z=clamp(f.z,-2,2);f.y=2.4;f.vy=-.02;f.stun=55;this.fighters[1-f.side].x=f.x-f.face*-2;this.emit('break',{x:f.x,z:f.z,side:f.side,name:'WALL BREAK · LOWER TIER'});return;}
          f.hp=0;this.emit('ringout',{side:f.side,name:'RING OUT'});
        }else{f.stun=43;f.wallSplat=43;f.y=.7;f.vy=0;f.vx=0;f.vz=0;this.emit('wall',{x:f.x,z:f.z,side:f.side,name:'WALL SPLAT'});}
      }
    }
    f.x=clamp(f.x,-maxX,maxX);f.z=clamp(f.z,-maxZ,maxZ);
  }
  updateProjectiles(){
    for(const p of this.projectiles){
      p.x+=p.face*p.speed;p.life--;const t=this.fighters[1-p.owner];
      if(Math.abs(p.x-t.x)<p.speed+t.data.hurt.radius&&Math.abs(p.z-t.z)<t.data.hurt.depth+.25&&t.y<1.5&&!t.knockdown){this.damage(this.fighters[p.owner],t,p.move);p.life=0;}
    }
    this.projectiles=this.projectiles.filter(p=>p.life>0&&Math.abs(p.x)<7);
  }
  updateZones(){
    for(const zone of this.zones){zone.life--;zone.tick++;if(zone.tick%30!==0)continue;
      const t=this.fighters[1-zone.owner];if(t.y<.2&&magnitude(zone,t)<zone.radius){t.hp=Math.max(0,t.hp-3);t.burn=60;this.emit('burn',{x:t.x,z:t.z,side:t.side});}
    }
    this.zones=this.zones.filter(z=>z.life>0);
  }
  think(f,other){
    const level=this.difficulty,delay=level==='easy'?24:level==='hard'?8:15;
    if(f.techWindow>0){if(!f.aiTechAt)f.aiTechAt=this.tick+(level==='hard'?4:8);if(this.tick>=f.aiTechAt&&this.random()<(level==='easy'?.2:level==='hard'?.9:.6)){this.input(f.side,'grab');f.aiTechAt=0;}return;}else f.aiTechAt=0;
    if(--f.aiThink>0)return;f.aiThink=delay+Math.floor(this.random()*8);
    f.inputs=emptyInputs();if(!this.canAct(f)||f.attack)return;
    const dist=magnitude(f,other),axis=other.z-f.z,r=this.random(),archetype=f.data.ai;
    // React to visible startup, not to future input. Rookie is deliberately late.
    if(other.attack&&other.attack.frame<other.attack.move.startup){
      const m=other.attack.move;
      if(m.ground&&dist<4.5&&level!=='easy'){this.input(f.side,'jump');return;}
      if(m.width<.8&&dist<m.range+1&&r<.55){f.inputs[axis>=0?'up':'down']=true;f.aiThink=18;this.emit('ai-step',{side:f.side});return;}
      if(dist<2.6&&r<.8){
        if(f.data.id==='ferrodrake'&&m.type==='heavy'){this.input(f.side,'heavy','back');return;}
        f.inputs.back=true;f.aiThink=12;return;
      }
    }
    if(!f.burstUsed&&(f.kinetic>=100||f.rage)&&dist<3&&r<.65){this.input(f.side,'burst');return;}
    if(Math.abs(axis)>.50){f.inputs[axis>0?'down':'up']=true;return;}
    if(archetype==='trickster'&&!f.clone&&dist>2&&r<.38){this.input(f.side,'special','down');return;}
    if(archetype==='tank'&&dist>2&&r<.25){this.input(f.side,'special','up');return;}
    if(archetype==='aerial'&&dist<3&&r<.28){if(f.y>.1)this.input(f.side,'heavy','down');else this.input(f.side,'jump');return;}
    if(dist>3.3){
      if(['zoner','balanced','assassin'].includes(archetype)&&r<.45){this.input(f.side,'special','back');return;}
      f.inputs.forward=true;if(r<.5){f.lastTaps.forward=this.tick-4;this.input(f.side,'forward');}return;
    }
    if(archetype==='zoner'&&dist<1.7&&r<.55){f.inputs.back=true;f.lastTaps.back=this.tick-4;this.input(f.side,'back');return;}
    if(dist>2.0){if(r<.38)this.input(f.side,'special',archetype==='tank'?'down':'forward');else f.inputs.forward=true;return;}
    if(other.blocking&&dist<(f.data.id==='glaciolith'?2:1.45)&&r<.8){this.input(f.side,'grab');return;}
    if(archetype==='grappler'&&dist<1.8&&r<.45){this.input(f.side,'grab');return;}
    if(r<.48)this.input(f.side,'jab');else if(r<.72)this.input(f.side,'heavy');else if(r<.88)this.input(f.side,'special',f.data.id==='terrakhan'?'down':'neutral');else f.inputs.back=true;
  }
}
