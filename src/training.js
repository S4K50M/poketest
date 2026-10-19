import { findFighter } from './roster.js';
import { AdventureSystems } from './adventure.js';
import { MINIONS } from './designs.js';

export const MOTOR={run:6.7,acceleration:1.5,friction:1.8,gravity:.62,jump:-13.5,doubleJump:-12.2,fall:16,dash:16,dashFrames:11,dashCooldown:32,coyote:7,jumpBuffer:8};
export const LESSONS=[
  {name:'Find your feet',zone:'THE AWAKENING',start:0,gate:920,spawn:150,keys:['A','D'],goal:'Move through the first chamber.',hint:'A / D move left and right. Turn quickly. Your feet should answer before you think.',test:g=>g.stats.distance>250},
  {name:'Trust the jump',zone:'THE BROKEN STAIR',start:1000,gate:2150,spawn:1080,keys:['SPACE','SPACE'],goal:'Jump across the broken bridge.',hint:'Hold Space for height; release for a short hop. Press again in the air to double-jump. A late jump still counts.',test:g=>g.player.x>1670&&g.stats.jumps>0},
  {name:'Find the rhythm',zone:'THE WINDLESS SPAN',start:2250,gate:3420,spawn:2340,keys:['SPACE','SHIFT'],goal:'Jump, then dash across the long gap.',hint:'Jump toward the gap, then Shift to dash through the air. Land to refresh your air dash. Never stop moving.',test:g=>g.player.x>3080&&g.stats.airDashes>0},
  {name:'Make impact lift you',zone:'THE THORN GARDEN',start:3500,gate:4700,spawn:3590,keys:['SPACE','S + J'],goal:'Bounce from the glowing training bell.',hint:'Get above the bell. Hold S and press J to strike downward. A clean hit bounces you up and restores your air dash.',test:g=>g.player.x>4430&&g.stats.pogos>0},
  {name:'The walls are a path',zone:'THE ASCENT',start:4800,gate:6100,spawn:4900,keys:['D','SPACE','SPACE'],goal:'Wall-jump and double-jump over the pillar.',hint:'Push into a wall to slide. Press Space to kick away, steer back, then jump again. Keep your height, not your hesitation.',test:g=>g.player.x>5580&&g.stats.wallJumps>0&&g.stats.doubleJumps>0},
  {name:'Move with intent',zone:'THE WARDEN’S HALL',start:6200,gate:7750,spawn:6280,keys:['1 / 2 / 3','F','K'],goal:'Defeat the two sentries and the Brass Warden.',hint:'Switch partners with 1 / 2 / 3. Hold F while still to heal using Focus. Heavy K flips rock shells. Defeat the Warden and its sentries to open the exit.',test:g=>g.enemies.filter(e=>e.encounter).every(e=>e.hp<=0)},
];

// World coordinates are pixels; Y points down and player position is at the feet.
export const PLATFORMS=[
  {x:0,y:520,w:1460,h:250}, {x:1620,y:520,w:1000,h:250},
  {x:2940,y:520,w:990,h:250}, {x:4320,y:520,w:3680,h:250},
  {x:540,y:455,w:155,h:28}, {x:745,y:405,w:135,h:28},
  {x:1170,y:445,w:145,h:30}, {x:1360,y:380,w:125,h:28},
  {x:1860,y:420,w:160,h:30}, {x:3180,y:420,w:125,h:28},
  {x:3770,y:430,w:130,h:28}, {x:4390,y:410,w:150,h:28},
  {x:4590,y:325,w:130,h:28},
  {x:5180,y:260,w:48,h:260,solid:true},
  {x:5445,y:145,w:48,h:275,solid:true},
  {x:5540,y:365,w:150,h:28}, {x:5780,y:425,w:135,h:28},
  {x:6580,y:405,w:145,h:30}, {x:7340,y:405,w:150,h:30},
];
export const THORNS=[{x:1460,w:160,y:605},{x:2620,w:320,y:605},{x:3930,w:390,y:575}];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const approach=(a,b,amount)=>a<b?Math.min(b,a+amount):Math.max(b,a-amount);

export class TrainingEngine extends AdventureSystems{
  constructor(id='pyrojaw',options={}){
    super();this.data=findFighter(Array.isArray(id)?id[0]:id);this.onEvent=options.onEvent||(()=>{});this.tick=0;this.phase='playing';this.paused=false;this.lesson=0;this.completed=LESSONS.map(()=>false);this.hitstop=0;this.checkpoint={x:150,y:520};
    this.player={x:150,y:520,vx:0,vy:0,face:1,hp:6,maxHp:6,spirit:100,grounded:true,coyote:7,jumpBuffer:0,jumpHeld:false,jumpCount:0,wall:0,wallLock:0,dash:0,dashCooldown:0,dashUsed:false,invul:0,attack:null,walkPhase:0,flash:0,respawning:0};
    this.inputs={left:false,right:false,down:false,up:false};this.stats={distance:0,jumps:0,doubleJumps:0,wallJumps:0,dashes:0,airDashes:0,pogos:0,hits:0,falls:0};
    this.bell={x:4115,y:430,r:24,flash:0};
    this.enemies=[{id:0,kind:'husk',x:6520,y:520,home:6520,hp:28,maxHp:28,face:-1,state:'patrol',timer:35,flash:0,stun:0,vx:0},
      {id:1,kind:'husk',x:6810,y:520,home:6810,hp:28,maxHp:28,face:-1,state:'patrol',timer:60,flash:0,stun:0,vx:0},
      {id:2,kind:'warden',x:7240,y:520,home:7240,hp:130,maxHp:130,face:-1,state:'patrol',timer:70,flash:0,stun:0,vx:0,pattern:0}];
    this.relics=[{x:795,y:365},{x:1935,y:380},{x:3240,y:380},{x:4650,y:285},{x:5480,y:90},{x:7410,y:365}].map((r,i)=>({...r,id:i,collected:false}));
    this.projectiles=[];this.waves=[];this.effects=[];this.message='';this.messageTime=0;
    this.enemies.forEach(e=>{e.encounter=true;});this.initAdventure(id,options);this.spawnMinions();
  }
  emit(type,props={}){this.onEvent({type,...props});}
  setInputs(inputs){this.inputs={left:false,right:false,down:false,up:false,...inputs};}
  input(action){
    if(this.paused||this.phase!=='playing'||this.player.respawning)return false;
    const p=this.player;
    const partyAction=this.partyInput(action);if(partyAction!==null)return partyAction;
    if(['jump','dash','light','heavy','special'].includes(action))this.cancelHeal();
    if(p.root>0&&['jump','dash'].includes(action))return false;
    if(action==='jump'){p.jumpBuffer=MOTOR.jumpBuffer;p.jumpHeld=true;return true;}
    if(action==='dash'){
      if(p.dashCooldown||!p.grounded&&p.airDashes>=(this.data.id==='zephyrix'?2:1))return false;
      if(p.attack&&p.attack.frame<p.attack.start+p.attack.active)return false;
      p.attack=null;p.dash=MOTOR.dashFrames;p.skillVector=null;p.dashCooldown=this.data.id==='zephyrix'?21:MOTOR.dashCooldown;p.dashUsed=true;p.vy=0;p.invul=Math.max(p.invul,9);this.stats.dashes++;if(!p.grounded){this.stats.airDashes++;p.airDashes++;}this.emit('dash');return true;
    }
    if(action==='light'||action==='heavy'){
      if(p.attack||p.dash)return false;
      p.attack={type:action,frame:0,start:action==='light'?4:9,active:6,recovery:action==='light'?9:16,dir:this.inputs.down&&!p.grounded?'down':this.inputs.up?'up':'side',hit:new Set()};p.armor=action==='heavy'&&['pyrojaw','terrakhan','ferrodrake'].includes(this.data.id)?1:0;this.emit('slash');return true;
    }
    if(action==='special'){
      return this.castSkill();
    }
    if(action==='interact'){
      const waylight=LESSONS.slice(0,this.lesson+1).find(l=>Math.abs(p.x-l.spawn)<95);
      if(waylight&&p.grounded){this.checkpoint={x:waylight.spawn,y:520};this.restoreParty();this.say('PARTY RESTORED · B TO FORGE A CHARM');this.emit('rest');return true;}
    }
    if(action==='retry'){this.respawn();return true;}
    return false;
  }
  releaseJump(){const p=this.player;p.jumpHeld=false;if(p.vy<-4.5)p.vy*=.48;}
  say(text){this.message=text;this.messageTime=150;}
  respawn(wipe=false){
    const p=this.player;this.stats.falls++;this.loseHeart(wipe);this.cancelHeal();
    Object.assign(p,{x:this.checkpoint.x,y:this.checkpoint.y,vx:0,vy:0,dash:0,skillVector:null,dashUsed:false,airDashes:0,dashCooldown:0,attack:null,wall:0,wallLock:0,jumpCount:0,jumpBuffer:0,coyote:7,grounded:true,invul:90,respawning:18,slow:0,root:0,slick:0,burn:0,specialHeld:false,fortress:false,specialCharge:0,guard:0,armor:0});
    // Reset living opponents to their homes so a checkpoint can never spawn into a charge.
    for(const e of this.enemies)if(e.hp>0){e.x=e.home;e.y=e.baseY||520;e.state='patrol';e.timer=55;e.stun=0;e.vx=0;}
    this.waves=[];this.projectiles=[];this.enemyShots=[];this.hazards=[];this.zones=[];this.decoy=null;this.skillStrike=null;this.say('BREATHE. THE WAYLIGHT IS STILL HERE.');this.emit('respawn');
  }
  hurt(direction=0,amount=1,status={}){return this.damagePlayer(direction,amount,status);}
  jump(){
    const p=this.player;
    if(!p.jumpBuffer)return;
    if(p.grounded||p.coyote>0){p.vy=MOTOR.jump;p.jumpCount=1;p.coyote=0;this.stats.jumps++;}
    else if(p.wall){p.vy=-13;p.vx=-p.wall*9;p.face=-p.wall;p.wallLock=9;p.jumpCount=1;p.dashUsed=false;p.airDashes=0;this.stats.wallJumps++;this.emit('walljump');}
    else if(p.jumpCount<2){p.vy=MOTOR.doubleJump;p.jumpCount=2;this.stats.doubleJumps++;this.emit('doublejump');}
    else return;
    if(!p.jumpHeld)p.vy*=.55;
    p.dash=0;p.grounded=false;p.jumpBuffer=0;this.emit('jump');
  }
  step(){
    if(this.paused||this.phase!=='playing')return;
    this.tick++;if(this.hitstop>0){this.hitstop--;return;}
    const p=this.player;
    for(const key of ['dashCooldown','invul','flash','respawning','wallLock'])if(p[key]>0)p[key]--;
    if(this.messageTime>0)this.messageTime--;if(this.bell.flash>0)this.bell.flash--;
    this.effects=this.effects.filter(e=>--e.life>0);
    if(p.respawning)return;
    this.updateAdventure();
    p.spirit=Math.min(100,p.spirit+.06);
    if(p.grounded){p.coyote=MOTOR.coyote;p.dashUsed=false;p.airDashes=0;}else p.coyote=Math.max(0,p.coyote-1);
    this.jump();if(p.jumpBuffer>0)p.jumpBuffer--;
    const direction=p.root>0||p.healing||p.fortress?0:Number(this.inputs.right)-Number(this.inputs.left),oldX=p.x,oldY=p.y,slow=p.slow>0?.55:1;
    if(p.dash>0){p.vx=(p.skillVector?.x??p.face)*MOTOR.dash*slow;p.vy=(p.skillVector?.y||0)*MOTOR.dash;p.dash--;this.effects.push({type:'trail',x:p.x,y:p.y,face:p.face,creature:this.data.id,life:13});}
    else{
      if(!p.wallLock){const speed=MOTOR.run*clamp(.96+(this.data.speed-.059)*2,.90,1.08)*slow;p.vx=approach(p.vx,direction*speed,direction?(p.slick>0?.6:MOTOR.acceleration):(p.slick>0?.12:MOTOR.friction));if(direction)p.face=direction;}
      p.vy=Math.min(MOTOR.fall,p.vy+MOTOR.gravity);
      if(p.wall&&direction===p.wall&&p.vy>2)p.vy=2;
    }
    p.x=clamp(p.x+p.vx,24,7960);p.wall=0;
    for(const block of PLATFORMS.filter(b=>b.solid)){
      if(p.y<=block.y+2||p.y-this.data.bodyHeight>=block.y+block.h-2)continue;
      if(oldX+15<=block.x&&p.x+15>block.x){p.x=block.x-15;p.wall=1;p.vx=0;}
      else if(oldX-15>=block.x+block.w&&p.x-15<block.x+block.w){p.x=block.x+block.w+15;p.wall=-1;p.vx=0;}
      else if(Math.abs(p.x+15-block.x)<2)p.wall=1;
      else if(Math.abs(p.x-15-block.x-block.w)<2)p.wall=-1;
    }
    const gate=LESSONS[this.lesson];
    if(!this.completed[this.lesson]&&p.x+15>gate.gate&&oldX<gate.gate){p.x=gate.gate-15;p.vx=0;}
    p.y+=p.vy;p.grounded=false;
    for(const platform of PLATFORMS){
      if(p.x+13<=platform.x||p.x-13>=platform.x+platform.w)continue;
      if(p.vy>=0&&oldY<=platform.y+1&&p.y>=platform.y){p.y=platform.y;p.vy=0;p.grounded=true;p.jumpCount=0;p.wall=0;p.dashUsed=false;p.airDashes=0;}
      else if(platform.solid&&p.vy<0&&oldY-this.data.bodyHeight>=platform.y+platform.h&&p.y-this.data.bodyHeight<=platform.y+platform.h){p.y=platform.y+platform.h+this.data.bodyHeight;p.vy=0;}
    }
    this.stats.distance+=Math.abs(p.x-oldX);if(Math.abs(p.vx)>.5)p.walkPhase+=Math.abs(p.vx)*.055;
    if(p.y>720||THORNS.some(t=>p.x>t.x&&p.x<t.x+t.w&&p.y>t.y)){this.respawn();return;}
    this.updateAttack();this.updateEnemies();this.updateProjectiles();
    for(const wave of this.waves){wave.x+=wave.vx;wave.life--;if(Math.abs(p.x-wave.x)<28&&p.y>485)this.hurt(Math.sign(p.x-wave.x));}
    this.waves=this.waves.filter(w=>w.life>0);
    for(const r of this.relics)if(!r.collected&&Math.hypot(p.x-r.x,p.y-35-r.y)<42){r.collected=true;this.gainXP(25);this.lumens+=10;this.say('ECHO SHARD · +25 BOND XP / +10 LUMENS');this.emit('relic');}
    this.updateLesson();
  }
  updateLesson(){
    const p=this.player,lesson=LESSONS[this.lesson];
    if(!this.completed[this.lesson]&&lesson.test(this)){this.completed[this.lesson]=true;this.say('LESSON LEARNED · '+lesson.name.toUpperCase());this.emit('learned',{lesson:this.lesson});}
    if(this.lesson<LESSONS.length-1&&this.completed[this.lesson]&&p.x>LESSONS[this.lesson+1].start){this.lesson++;this.checkpoint={x:LESSONS[this.lesson].spawn,y:520};this.restoreParty();this.say('PARTY RESTORED · '+LESSONS[this.lesson].zone);this.emit('checkpoint');}
    if(this.lesson===5&&this.completed[5]&&p.x>7870){this.phase='complete';this.emit('complete');}
  }
  updateAttack(){
    const p=this.player,a=p.attack;if(!a)return;a.frame++;
    if(a.frame>=a.start+a.active+a.recovery){p.attack=null;p.armor=0;return;}
    if(a.frame>=a.start&&!this.skillStrike)p.armor=0;
    if(a.frame<a.start||a.frame>=a.start+a.active)return;
    const b=this.bell;
    if(a.dir==='down'&&p.y<b.y&&b.y-p.y<94&&Math.abs(p.x-b.x)<62&&!a.hit.has('bell')){a.hit.add('bell');b.flash=20;this.pogo();}
    for(const e of this.enemies){
      if(e.hp<=0||a.hit.has(e.id))continue;
      const radius=e.kind==='warden'?40:24,dx=e.x-p.x,dy=(e.y-(e.kind==='warden'?58:MINIONS[e.kind]?.height||26))-(p.y-this.data.bodyHeight*.5);
      const contact=a.dir==='down'?p.y<e.y-10&&e.y-p.y<120&&Math.abs(dx)<55:a.dir==='up'?dy<0&&dy>-130&&Math.abs(dx)<65:dx*p.face>-15&&dx*p.face<85+radius&&Math.abs(dy)<75;
      if(contact){a.hit.add(e.id);this.strike(e,a.type==='heavy'?25:12,p.face,{heavy:a.type==='heavy'});if(a.dir==='down')this.pogo();}
    }
  }
  pogo(){const p=this.player;p.vy=-13.6;p.jumpCount=1;p.dashUsed=false;p.airDashes=0;p.dashCooldown=0;this.stats.pogos++;this.hitstop=3;this.emit('pogo');this.effects.push({type:'spark',x:p.x,y:p.y+25,life:20});}
  strike(e,damage,direction,options={}){
    if(e.hp<=0)return;
    if(e.kind==='voltlet'){this.explodeVoltlet(e);return;}
    if(e.kind==='sproutlet'&&e.state==='burrow'&&!options.heavy)return;
    const owner=this.party[options.source??this.activeSlot];
    damage*=owner.data.attack*this.skillPower();
    if(e.kind==='pebbleback'&&!e.flipped){if(options.heavy){e.flipped=180;e.stun=45;}else damage*=.15;}
    e.hp=Math.max(0,e.hp-Math.max(1,Math.round(damage)));e.flash=8;e.stun=Math.max(e.stun||0,e.kind==='warden'?6:13);e.vx=direction*(e.kind==='warden'?2:5);owner.spirit=Math.min(100,owner.spirit+(options.dot?1:9));this.stats.hits++;if(!options.dot)this.hitstop=3;
    if(options.element==='Ice')e.slow=180;if(options.element==='Electric')e.stun+=3;
    this.effects.push({type:'spark',x:e.x,y:e.y-40,life:20});this.emit('hit');
    if(!e.hp){this.awardEnemy(e);this.effects.push({type:'burst',x:e.x,y:e.y-40,life:40});}
  }
  updateProjectiles(){
    for(const b of this.projectiles){
      if(b.homing){const target=this.enemies.filter(e=>e.hp>0).sort((a,c)=>Math.hypot(a.x-b.x,a.y-25-b.y)-Math.hypot(c.x-b.x,c.y-25-b.y))[0];if(target&&Math.abs(target.x-b.x)<600){const dx=target.x-b.x,dy=target.y-20-b.y,r=Math.hypot(dx,dy)||1;b.vx+=(dx/r*10-b.vx)*.12;b.vy+=(dy/r*10-b.vy)*.12;}}
      b.vy=(b.vy||0)+(b.gravity||0);b.x+=b.vx;b.y+=b.vy;b.life--;
      for(const e of this.enemies){
        if(b.life<=0)break;
        if(e.hp>0&&!b.hit.has(e.id)&&Math.abs(b.x-e.x)<(e.kind==='warden'?50:30)&&Math.abs(b.y-(e.y-(MINIONS[e.kind]?.height||40)))<55&&(b.kind!=='rockwave'||e.y>500)){
          b.hit.add(e.id);this.strike(e,b.damage||20,Math.sign(b.vx),{source:b.owner,heavy:b.heavy,element:b.element});
          if(b.kind==='water')e.x+=Math.sign(b.vx)*35;
          if(b.kind==='magma')this.zones.push({type:'fire',x:e.x,y:e.y,radius:85,life:210,owner:b.owner});
          if(!b.piercing)b.life=0;
        }
      }
      if(b.kind==='magma'&&b.y>=510){this.zones.push({type:'fire',x:b.x,y:520,radius:85,life:210,owner:b.owner});b.life=0;}
    }
    this.projectiles=this.projectiles.filter(b=>b.life>0);
  }
  updateEnemies(){
    const p=this.player;
    for(const e of this.enemies){
      if(e.hp<=0)continue;if(this.updateMinion(e))continue;if(e.flash)e.flash--;if(e.slow>0)e.slow--;if(e.stun>0){e.stun--;e.x+=e.vx;e.vx*=.8;continue;}
      if(Math.abs(p.x-e.x)>950)continue;
      const target=this.decoy&&Math.abs(this.decoy.x-e.x)<Math.abs(p.x-e.x)+100?this.decoy:p;
      const dist=Math.abs(target.x-e.x);e.timer--;
      if(e.state==='patrol'){
        e.face=target.x>e.x?1:-1;
        if(dist<550){e.x+=e.face*(e.kind==='warden'?1.15:1.45)*(e.slow>0?.55:1);if(e.timer<=0&&dist<350){e.state='windup';e.timer=e.kind==='warden'?38:27;this.emit('warning');}}
      }else if(e.state==='windup'&&e.timer<=0){
        if(e.kind==='warden'&&e.pattern++%2===1){this.waves.push({x:e.x,y:520,vx:e.face*7,life:130});e.state='recover';e.timer=45;this.emit('slam');}
        else{e.state='charge';e.timer=e.kind==='warden'?29:22;}
      }else if(e.state==='charge'){
        e.x+=e.face*(e.kind==='warden'?10:7)*(e.slow>0?.55:1);if(e.timer<=0){e.state='recover';e.timer=e.kind==='warden'?45:36;}
      }else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=45;}
      e.x=clamp(e.x,e.kind==='warden'?6970:6320,e.kind==='warden'?7630:6920);
      if(dist<(e.kind==='warden'?52:32)&&Math.abs(target.y-e.y)<(e.kind==='warden'?100:50)){if(target===p)this.hurt(Math.sign(p.x-e.x));else this.burstDecoy();}
    }
  }
  snapshot(){const p=this.player;return {mode:'training',phase:this.phase,paused:this.paused,tick:this.tick,lesson:this.lesson,completed:[...this.completed],player:{id:this.data.id,x:p.x,y:p.y,vx:p.vx,vy:p.vy,hp:p.hp,maxHp:p.maxHp,spirit:p.spirit,grounded:p.grounded,dash:p.dash,wall:p.wall,healing:p.healing,healProgress:p.healProgress,slow:p.slow,root:p.root,slick:p.slick},activeSlot:this.activeSlot,switchCooldown:this.switchCooldown,party:this.party.map(m=>({id:m.data.id,hp:m.hp,maxHp:m.maxHp,spirit:m.spirit,cooldown:m.skillCooldown})),level:this.level,xp:this.xp,lumens:this.lumens,upgrades:this.upgrades,discovered:[...this.discovered],stats:{...this.stats},shards:this.relics.filter(r=>r.collected).length,enemies:this.enemies.map(e=>({id:e.id,kind:e.kind,hp:e.hp,state:e.state,encounter:!!e.encounter}))};}
}
