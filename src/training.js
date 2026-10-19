import { findFighter } from './roster.js';

export const MOTOR={run:6.7,acceleration:1.5,friction:1.8,gravity:.62,jump:-13.5,doubleJump:-12.2,fall:16,dash:16,dashFrames:11,dashCooldown:32,coyote:7,jumpBuffer:8};
export const LESSONS=[
  {name:'Find your feet',zone:'THE AWAKENING',start:0,gate:920,spawn:150,keys:['A','D'],goal:'Move through the first chamber.',hint:'A / D move left and right. Turn quickly. Your feet should answer before you think.',test:g=>g.stats.distance>250},
  {name:'Trust the jump',zone:'THE BROKEN STAIR',start:1000,gate:2150,spawn:1080,keys:['SPACE','SPACE'],goal:'Jump across the broken bridge.',hint:'Hold Space for height; release for a short hop. Press again in the air to double-jump. A late jump still counts.',test:g=>g.player.x>1670&&g.stats.jumps>0},
  {name:'Find the rhythm',zone:'THE WINDLESS SPAN',start:2250,gate:3420,spawn:2340,keys:['SPACE','SHIFT'],goal:'Jump, then dash across the long gap.',hint:'Jump toward the gap, then Shift to dash through the air. Land to refresh your air dash. Never stop moving.',test:g=>g.player.x>3080&&g.stats.airDashes>0},
  {name:'Make impact lift you',zone:'THE THORN GARDEN',start:3500,gate:4700,spawn:3590,keys:['SPACE','S + J'],goal:'Bounce from the glowing training bell.',hint:'Get above the bell. Hold S and press J to strike downward. A clean hit bounces you up and restores your air dash.',test:g=>g.player.x>4430&&g.stats.pogos>0},
  {name:'The walls are a path',zone:'THE ASCENT',start:4800,gate:6100,spawn:4900,keys:['D','SPACE','SPACE'],goal:'Wall-jump and double-jump over the pillar.',hint:'Push into a wall to slide. Press Space to kick away, steer back, then jump again. Keep your height, not your hesitation.',test:g=>g.player.x>5580&&g.stats.wallJumps>0&&g.stats.doubleJumps>0},
  {name:'Move with intent',zone:'THE WARDEN’S HALL',start:6200,gate:7750,spawn:6280,keys:['J','K','L','SHIFT'],goal:'Defeat the two husks and the Brass Warden.',hint:'Watch the gold wind-up. Dash through a charge, jump the shockwave, and punish the recovery. J strikes; K hits harder; L casts.',test:g=>g.enemies.every(e=>e.hp<=0)},
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

export class TrainingEngine{
  constructor(id='pyrojaw',options={}){
    this.data=findFighter(id);this.onEvent=options.onEvent||(()=>{});this.tick=0;this.phase='playing';this.paused=false;this.lesson=0;this.completed=LESSONS.map(()=>false);this.hitstop=0;this.checkpoint={x:150,y:520};
    this.player={x:150,y:520,vx:0,vy:0,face:1,hp:6,maxHp:6,spirit:100,grounded:true,coyote:7,jumpBuffer:0,jumpHeld:false,jumpCount:0,wall:0,wallLock:0,dash:0,dashCooldown:0,dashUsed:false,invul:0,attack:null,walkPhase:0,flash:0,respawning:0};
    this.inputs={left:false,right:false,down:false,up:false};this.stats={distance:0,jumps:0,doubleJumps:0,wallJumps:0,dashes:0,airDashes:0,pogos:0,hits:0,falls:0};
    this.bell={x:4115,y:430,r:24,flash:0};
    this.enemies=[{id:0,kind:'husk',x:6520,y:520,home:6520,hp:28,maxHp:28,face:-1,state:'patrol',timer:35,flash:0,stun:0,vx:0},
      {id:1,kind:'husk',x:6810,y:520,home:6810,hp:28,maxHp:28,face:-1,state:'patrol',timer:60,flash:0,stun:0,vx:0},
      {id:2,kind:'warden',x:7240,y:520,home:7240,hp:130,maxHp:130,face:-1,state:'patrol',timer:70,flash:0,stun:0,vx:0,pattern:0}];
    this.relics=[{x:795,y:365},{x:1935,y:380},{x:3240,y:380},{x:4650,y:285},{x:5480,y:90},{x:7410,y:365}].map((r,i)=>({...r,id:i,collected:false}));
    this.projectiles=[];this.waves=[];this.effects=[];this.message='';this.messageTime=0;
  }
  emit(type,props={}){this.onEvent({type,...props});}
  setInputs(inputs){this.inputs={left:false,right:false,down:false,up:false,...inputs};}
  input(action){
    if(this.paused||this.phase!=='playing'||this.player.respawning)return false;
    const p=this.player;
    if(action==='jump'){p.jumpBuffer=MOTOR.jumpBuffer;p.jumpHeld=true;return true;}
    if(action==='dash'){
      if(p.dashCooldown||!p.grounded&&p.dashUsed)return false;
      if(p.attack&&p.attack.frame<p.attack.start+p.attack.active)return false;
      p.attack=null;p.dash=MOTOR.dashFrames;p.dashCooldown=MOTOR.dashCooldown;p.dashUsed=true;p.vy=0;p.invul=Math.max(p.invul,9);this.stats.dashes++;if(!p.grounded)this.stats.airDashes++;this.emit('dash');return true;
    }
    if(action==='light'||action==='heavy'){
      if(p.attack||p.dash)return false;
      p.attack={type:action,frame:0,start:action==='light'?4:9,active:6,recovery:action==='light'?9:16,dir:this.inputs.down&&!p.grounded?'down':this.inputs.up?'up':'side',hit:new Set()};this.emit('slash');return true;
    }
    if(action==='special'){
      if(p.spirit<25||p.attack)return false;p.spirit-=25;
      this.projectiles.push({x:p.x+p.face*22,y:p.y-36,vx:p.face*12,life:65,hit:new Set()});this.emit('cast');return true;
    }
    if(action==='interact'){
      const waylight=LESSONS.slice(0,this.lesson+1).find(l=>Math.abs(p.x-l.spawn)<95);
      if(waylight&&p.grounded){this.checkpoint={x:waylight.spawn,y:520};p.hp=p.maxHp;p.spirit=100;this.say('RESTORED AT THE WAYLIGHT');this.emit('rest');return true;}
    }
    if(action==='retry'){this.respawn();return true;}
    return false;
  }
  releaseJump(){const p=this.player;p.jumpHeld=false;if(p.vy<-4.5)p.vy*=.48;}
  say(text){this.message=text;this.messageTime=150;}
  respawn(){
    const p=this.player;this.stats.falls++;p.hp--;if(p.hp<=0)p.hp=p.maxHp;
    Object.assign(p,{x:this.checkpoint.x,y:this.checkpoint.y,vx:0,vy:0,dash:0,dashUsed:false,dashCooldown:0,attack:null,wall:0,wallLock:0,jumpCount:0,jumpBuffer:0,coyote:7,grounded:true,invul:90,respawning:18});
    // Reset living opponents to their homes so a checkpoint can never spawn into a charge.
    for(const e of this.enemies)if(e.hp>0){e.x=e.home;e.state='patrol';e.timer=55;e.stun=0;e.vx=0;}
    this.waves=[];this.projectiles=[];this.say('BREATHE. THE WAYLIGHT IS STILL HERE.');this.emit('respawn');
  }
  hurt(direction=0){const p=this.player;if(p.invul||p.respawning)return;p.hp--;p.invul=80;p.flash=10;p.vx=direction*6;p.vy=-5;this.emit('hurt');if(p.hp<=0){p.hp=1;this.respawn();}}
  jump(){
    const p=this.player;
    if(!p.jumpBuffer)return;
    if(p.grounded||p.coyote>0){p.vy=MOTOR.jump;p.jumpCount=1;p.coyote=0;this.stats.jumps++;}
    else if(p.wall){p.vy=-13;p.vx=-p.wall*9;p.face=-p.wall;p.wallLock=9;p.jumpCount=1;p.dashUsed=false;this.stats.wallJumps++;this.emit('walljump');}
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
    p.spirit=Math.min(100,p.spirit+.06);
    if(p.grounded){p.coyote=MOTOR.coyote;p.dashUsed=false;}else p.coyote=Math.max(0,p.coyote-1);
    this.jump();if(p.jumpBuffer>0)p.jumpBuffer--;
    const direction=Number(this.inputs.right)-Number(this.inputs.left),oldX=p.x,oldY=p.y;
    if(p.dash>0){p.vx=p.face*MOTOR.dash;p.vy=0;p.dash--;this.effects.push({type:'trail',x:p.x,y:p.y,face:p.face,life:13});}
    else{
      if(!p.wallLock){const speed=MOTOR.run*clamp(.96+(this.data.speed-.059)*2,.90,1.08);p.vx=approach(p.vx,direction*speed,direction?MOTOR.acceleration:MOTOR.friction);if(direction)p.face=direction;}
      p.vy=Math.min(MOTOR.fall,p.vy+MOTOR.gravity);
      if(p.wall&&direction===p.wall&&p.vy>2)p.vy=2;
    }
    p.x=clamp(p.x+p.vx,24,7960);p.wall=0;
    for(const block of PLATFORMS.filter(b=>b.solid)){
      if(p.y<=block.y+2||p.y-66>=block.y+block.h-2)continue;
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
      if(p.vy>=0&&oldY<=platform.y+1&&p.y>=platform.y){p.y=platform.y;p.vy=0;p.grounded=true;p.jumpCount=0;p.wall=0;p.dashUsed=false;}
      else if(platform.solid&&p.vy<0&&oldY-66>=platform.y+platform.h&&p.y-66<=platform.y+platform.h){p.y=platform.y+platform.h+66;p.vy=0;}
    }
    this.stats.distance+=Math.abs(p.x-oldX);if(Math.abs(p.vx)>.5)p.walkPhase+=Math.abs(p.vx)*.055;
    if(p.y>720||THORNS.some(t=>p.x>t.x&&p.x<t.x+t.w&&p.y>t.y)){this.respawn();return;}
    this.updateAttack();this.updateEnemies();this.updateProjectiles();
    for(const wave of this.waves){wave.x+=wave.vx;wave.life--;if(Math.abs(p.x-wave.x)<28&&p.y>485)this.hurt(Math.sign(p.x-wave.x));}
    this.waves=this.waves.filter(w=>w.life>0);
    for(const r of this.relics)if(!r.collected&&Math.hypot(p.x-r.x,p.y-35-r.y)<42){r.collected=true;this.say('ECHO SHARD FOUND');this.emit('relic');}
    this.updateLesson();
  }
  updateLesson(){
    const p=this.player,lesson=LESSONS[this.lesson];
    if(!this.completed[this.lesson]&&lesson.test(this)){this.completed[this.lesson]=true;this.say('LESSON LEARNED · '+lesson.name.toUpperCase());this.emit('learned',{lesson:this.lesson});}
    if(this.lesson<LESSONS.length-1&&this.completed[this.lesson]&&p.x>LESSONS[this.lesson+1].start){this.lesson++;this.checkpoint={x:LESSONS[this.lesson].spawn,y:520};p.hp=p.maxHp;p.spirit=100;this.say('WAYLIGHT LIT · '+LESSONS[this.lesson].zone);this.emit('checkpoint');}
    if(this.lesson===5&&this.completed[5]&&p.x>7870){this.phase='complete';this.emit('complete');}
  }
  updateAttack(){
    const p=this.player,a=p.attack;if(!a)return;a.frame++;
    if(a.frame>=a.start+a.active+a.recovery){p.attack=null;return;}
    if(a.frame<a.start||a.frame>=a.start+a.active)return;
    const b=this.bell;
    if(a.dir==='down'&&p.y<b.y&&b.y-p.y<94&&Math.abs(p.x-b.x)<62&&!a.hit.has('bell')){a.hit.add('bell');b.flash=20;this.pogo();}
    for(const e of this.enemies){
      if(e.hp<=0||a.hit.has(e.id))continue;
      const radius=e.kind==='warden'?40:24,dx=e.x-p.x,dy=(e.y-(e.kind==='warden'?58:26))-(p.y-30);
      const contact=a.dir==='down'?p.y<e.y-10&&e.y-p.y<120&&Math.abs(dx)<55:a.dir==='up'?dy<0&&dy>-130&&Math.abs(dx)<65:dx*p.face>-15&&dx*p.face<85+radius&&Math.abs(dy)<75;
      if(contact){a.hit.add(e.id);this.strike(e,a.type==='heavy'?25:12,p.face);if(a.dir==='down')this.pogo();}
    }
  }
  pogo(){const p=this.player;p.vy=-13.6;p.jumpCount=1;p.dashUsed=false;p.dashCooldown=0;this.stats.pogos++;this.hitstop=3;this.emit('pogo');this.effects.push({type:'spark',x:p.x,y:p.y+25,life:20});}
  strike(e,damage,direction){
    e.hp=Math.max(0,e.hp-damage);e.flash=8;e.stun=e.kind==='warden'?6:13;e.vx=direction*(e.kind==='warden'?2:5);this.player.spirit=Math.min(100,this.player.spirit+9);this.stats.hits++;this.hitstop=3;
    this.effects.push({type:'spark',x:e.x,y:e.y-40,life:20});this.emit('hit');
    if(!e.hp){this.emit('kill');this.effects.push({type:'burst',x:e.x,y:e.y-40,life:40});}
  }
  updateProjectiles(){
    for(const b of this.projectiles){b.x+=b.vx;b.life--;for(const e of this.enemies)if(e.hp>0&&!b.hit.has(e.id)&&Math.abs(b.x-e.x)<(e.kind==='warden'?50:30)&&Math.abs(b.y-(e.y-40))<70){b.hit.add(e.id);this.strike(e,20,Math.sign(b.vx));}}
    this.projectiles=this.projectiles.filter(b=>b.life>0);
  }
  updateEnemies(){
    const p=this.player;
    for(const e of this.enemies){
      if(e.hp<=0)continue;if(e.flash)e.flash--;if(e.stun>0){e.stun--;e.x+=e.vx;e.vx*=.8;continue;}
      if(Math.abs(p.x-e.x)>950)continue;
      const dist=Math.abs(p.x-e.x);e.timer--;
      if(e.state==='patrol'){
        e.face=p.x>e.x?1:-1;
        if(dist<550){e.x+=e.face*(e.kind==='warden'?1.15:1.45);if(e.timer<=0&&dist<350){e.state='windup';e.timer=e.kind==='warden'?38:27;this.emit('warning');}}
      }else if(e.state==='windup'&&e.timer<=0){
        if(e.kind==='warden'&&e.pattern++%2===1){this.waves.push({x:e.x,y:520,vx:e.face*7,life:130});e.state='recover';e.timer=45;this.emit('slam');}
        else{e.state='charge';e.timer=e.kind==='warden'?29:22;}
      }else if(e.state==='charge'){
        e.x+=e.face*(e.kind==='warden'?10:7);if(e.timer<=0){e.state='recover';e.timer=e.kind==='warden'?45:36;}
      }else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=45;}
      e.x=clamp(e.x,e.kind==='warden'?6970:6320,e.kind==='warden'?7630:6920);
      if(dist<(e.kind==='warden'?52:32)&&Math.abs(p.y-e.y)<(e.kind==='warden'?100:50))this.hurt(Math.sign(p.x-e.x));
    }
  }
  snapshot(){const p=this.player;return {mode:'training',phase:this.phase,paused:this.paused,tick:this.tick,lesson:this.lesson,completed:[...this.completed],player:{id:this.data.id,x:p.x,y:p.y,vx:p.vx,vy:p.vy,hp:p.hp,grounded:p.grounded,dash:p.dash,wall:p.wall},stats:{...this.stats},shards:this.relics.filter(r=>r.collected).length,enemies:this.enemies.map(e=>({id:e.id,hp:e.hp,state:e.state}))};}
}
