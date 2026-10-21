import { drawEntityAnimated, drawBossAura, drawNPCAnimation } from './entity-animation.js';
import { CombatFX } from './combat-fx.js';
import { drawEnemyMinion } from './enemy-art.js';
import { drawBossEncounterWorld, drawBossMoveTelegraph, drawBossPlatform, drawBossProjectile, drawBossWeapon } from './boss-encounter-render.js';
import { drawArenaBoss } from './boss-art.js';
import {drawChronicleEntity,drawChronicleBoss} from './chronicle-art.js';
import {drawRPGObject,drawRPGWorld,drawRPGAuras} from './rpg-render.js';
import { drawMourningwildBackdrop, drawMourningwildLandmarks, drawMourningwildForeground, drawMourningwildPlatform } from './mourningwild-render.js';
import { fitCanvas } from './render.js';
import { drawCreature, drawMinion } from './creatures.js';
import { findFighter } from './roster.js';
import { BIOMES, BOSSES } from './world.js';
import { MINIONS } from './designs.js';
import {drawDungeonMinion,drawDungeonChampion,drawDungeonTelegraph} from './dungeon-art.js';
import {isTunnel,drawTunnelBackdrop,drawTunnelStructure,drawTunnelPlatform,drawRecoverySpring} from './tunnel-render.js';
const TAU=Math.PI*2;
const poly=(c,pts,fill,stroke)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
const oval=(c,x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=color;c.fill();};
const line=(c,pts,col,width=2)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
const glow=(c,x,y,r,col)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);};
const text=(c,txt,x,y,col='#dbeae0',size=12,align='center')=>{c.fillStyle=col;c.font=`600 ${size}px Barlow, sans-serif`;c.textAlign=align;c.fillText(txt,x,y);};
const noise=n=>{const a=Math.sin(n*127.1+37)*43758.5453;return a-Math.floor(a);};

export class WorldRenderer{
  constructor(canvas){this.canvas=canvas;this.camera=0;this.cameraY=0;this.lastRoom='';this.shake=0;this.flash=0;this.time=0;this.fx=new CombatFX();this.lastClock=0;this.actorTime=0;this.actorHistory=new Map();this.corpses=new Map();}
  event(e,g){if(e.type!=='hit')this.fx.event(e,g);}
  project(x,y){const {width,height}=this.canvas.getBoundingClientRect(),scale=height/660;return {x:(x-this.camera)*scale,y:(y-this.cameraY)*scale,width,height};}
  render(g,clock,{speakerId=null}={}){
    const {c,w,h}=fitCanvas(this.canvas);if(!w||!h)return;const scale=h/660,view=w/scale,t=clock/1000,b=BIOMES[g.room.biome];this.time=t;this.fx.reducedMotion=!!g.combat?.settings?.reducedMotion;const elapsed=Math.min(.05,Math.max(0,(clock-(this.lastClock||clock))/1000));this.fx.update(elapsed);this.lastClock=clock;
    const animationDelta=!g.paused&&g.phase==='playing'&&!g.hitstop?elapsed:0;this.actorTime+=animationDelta;const actorTime=this.actorTime;
    const target=Math.max(0,Math.min(g.worldWidth-view,g.player.x-view*.38+g.player.vx*7));
    if(this.lastRoom!==g.roomId){this.camera=target;this.cameraY=Math.min(0,g.player.y-245);this.lastRoom=g.roomId;this.actorHistory.clear();this.corpses.clear();}this.camera+=(target-this.camera)*.12;this.cameraY+=(Math.min(0,g.player.y-245)-this.cameraY)*.09;
    c.save();c.scale(scale,scale);const impulse=this.fx.camera();c.translate(impulse.x,impulse.y);if(impulse.zoom!==1){c.translate(view/2,330);c.scale(impulse.zoom,impulse.zoom);c.translate(-view/2,-330);}
    const firstArea=drawMourningwildBackdrop(c,g,this.camera,this.cameraY,view,660,t);if(!firstArea){if(isTunnel(g))drawTunnelBackdrop(c,g,this.camera,this.cameraY,view,660,t);else this.backdrop(c,b,view,660,this.camera,t);}this.fx.drawAmbient(c,g,this.camera,this.cameraY,view,660,t);
    c.save();c.translate(-this.camera,-this.cameraY);
    if(firstArea)drawMourningwildLandmarks(c,g,this.camera,this.cameraY,view,660,t);else if(isTunnel(g))drawTunnelStructure(c,g,this.camera,this.cameraY,view,660,t);
    // Luminous dust lives in the scene instead of following the camera.
    for(let i=0;i<55;i++){const x=noise(i+9)*g.worldWidth,y=70+noise(i+72)*420+Math.sin(t*.5+i)*15;glow(c,x,y,4,b.color+'25');oval(c,x,y,.8,.8,b.color+'99');}
    for(const p of g.platforms)if(!p.veil&&p.x+p.w>this.camera-120&&p.x<this.camera+view+120&&p.y+p.h+160>this.cameraY&&p.y<this.cameraY+740)this.platform(c,p,b,t,g);
    for(const pit of g.thorns){
      glow(c,pit.x+pit.w/2,pit.y,Math.min(220,pit.w),b.color+'16');
      for(let i=0;i<pit.w;i+=23)poly(c,[[pit.x+i,pit.y+12],[pit.x+i+12,pit.y-20-noise(i)*14],[pit.x+i+23,pit.y+12]],b.color+'55');
      if(g.room.biome==='reef'){c.fillStyle='#61c5d128';c.fillRect(pit.x,570,pit.w,100);line(c,[[pit.x,570],[pit.x+pit.w,570]],'#a0edeb55',2);}
    }
    drawRPGWorld(c,g,t);
    for(const o of g.room.objects)this.object(c,o,g,t);
    for(const spring of g.recoveryPoints||[])drawRecoverySpring(c,spring,t);
    for(const a of g.room.anchors){line(c,[[a.x,a.y-36],[a.x,a.y]],'#d6b87866',1);glow(c,a.x,a.y,25,'#ffdd932a');poly(c,[[a.x,a.y-9],[a.x+8,a.y],[a.x,a.y+9],[a.x-8,a.y]],'#f8d895');}
    for(const r of g.relics)if(!r.collected){const yy=r.y+Math.sin(t*3+r.x)*6;glow(c,r.x,yy,35,b.color+'30');poly(c,[[r.x,yy-13],[r.x+8,yy],[r.x,yy+13],[r.x-8,yy]],b.color,'#efffe6');}
    for(const z of g.zones){glow(c,z.x,z.y-25,z.radius,z.type==='fire'?'#ff9b3833':z.type==='wind'?'#bfffe128':'#e2d6ff33');for(let i=0;i<9;i++){const xx=z.x+Math.sin(t*4+i)*z.radius*.8;line(c,[[xx,z.y],[xx+10,z.y-18-Math.sin(i+t*6)*10]],z.type==='fire'?'#ffb96d88':'#d0f7ed77',2);}}
    drawBossEncounterWorld(c,g,actorTime);
    for(const e of g.enemies){const actor={...e,reducedMotion:this.fx.reducedMotion};if(!drawBossMoveTelegraph(c,actor,actorTime))drawDungeonTelegraph(c,actor,actorTime);}
    for(const e of g.enemies){
      const key=e.key??e.id,previous=this.actorHistory.get(key),actor={...e,reducedMotion:this.fx.reducedMotion};
      // Enemy death poses are local presentation state. They never keep a
      // defeated simulation body alive or delay an earned reward.
      if(e.hp<=0&&!e.deathTimer){
        if(previous?.hp>0)this.corpses.set(key,{actor:{...actor,hp:0,state:'dying',deathTimer:32},life:.53});
        this.actorHistory.set(key,actor);continue;
      }
      if(e.hp>0)this.corpses.delete(key);this.actorHistory.set(key,actor);
      if(e.boss&&e.hp>0)drawBossAura(c,actor,actorTime,BOSSES[e.boss].color);
      drawEntityAnimated(c,actor,actorTime,()=>e.boss?this.boss(c,actor,actorTime,g):this.minion(c,actor,actorTime));
      if(e.hp>0&&e.hp<e.maxHp){c.fillStyle='#0c1729';c.fillRect(e.x-24,e.y-(e.boss?180:70),48,3);c.fillStyle=e.boss?BOSSES[e.boss].color:MINIONS[e.kind].color;c.fillRect(e.x-24,e.y-(e.boss?180:70),48*e.hp/e.maxHp,3);}
    }
    for(const [key,corpse] of this.corpses){
      corpse.life-=animationDelta;if(corpse.life<=0){this.corpses.delete(key);continue;}
      const actor={...corpse.actor,deathTimer:corpse.life/.53*32,reducedMotion:this.fx.reducedMotion};
      drawEntityAnimated(c,actor,actorTime,()=>actor.boss?this.boss(c,actor,actorTime,g):this.minion(c,actor,actorTime));
    }
    if(g.decoy){c.save();c.globalAlpha=.35;drawCreature(c,findFighter('noxshade'),g.decoy.x,g.decoy.y,.36,1,{state:'idle'},actorTime,{reducedMotion:this.fx.reducedMotion});c.restore();}
    const trails=this.fx.reducedMotion?[]:g.effects.filter(e=>e.type==='trail'),trailStride=Math.max(1,Math.ceil(trails.length/4));
    for(let i=0;i<trails.length;i+=trailStride){const e=trails[i];c.save();c.globalAlpha=e.life/48;drawCreature(c,findFighter(e.creature),e.x,e.y,.38,e.face,{state:'dash',air:true},actorTime,{shadow:false,reducedMotion:true});c.restore();}
    const p=g.player,a=p.attack,af=a?Math.sin(Math.PI*Math.min(1,a.frame/(a.start+a.active))):0;
    c.save();if(p.invul&&Math.floor(g.tick/4)%2)c.globalAlpha=.5;
    drawCreature(c,g.data,p.x,p.y,.38,p.face,{state:p.flash?'hit':p.riposte?'parry':p.shielding?'shield':p.dash?'dash':p.powerAura?'cast':a?a.type==='heavy'?'heavy':'attack':!p.grounded?'air':Math.abs(p.vx)>.5?'walk':'idle',walk:p.walkPhase,attack:af,heavy:a?.type==='heavy',air:!p.grounded,land:g.landing/10,hit:p.flash>0},actorTime,{reducedMotion:this.fx.reducedMotion,attackProgress:a?a.frame/(a.start+a.active+a.recovery):0,combo:a?.swing||1,speed:Math.min(1,Math.abs(p.vx)/10),shieldRatio:p.shield/100,charged:p.powerAura>0,elementColor:g.data.accent});c.restore();
    drawRPGAuras(c,g,actorTime);
    if(p.healing){glow(c,p.x,p.y-30,80,'#abf2ce38');for(let i=0;i<6;i++){const ang=t*3+i*TAU/6;oval(c,p.x+Math.cos(ang)*32,p.y-35+Math.sin(ang)*35,2,2,'#dcffe0');}}
    if(p.guard||p.fortress){c.strokeStyle='#dce7a4';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-35,48,-Math.PI*.5,Math.PI*.5);c.stroke();}
    if(g.grapple)line(c,[[p.x,p.y-30],[g.grapple.x,g.grapple.y]],'#ffe2a7',2);
    for(const b of g.projectiles){glow(c,b.x,b.y,23,(b.color||'#c9f4df')+'55');oval(c,b.x,b.y,b.kind==='ice'?14:7,b.kind==='needle'?3:7,b.color||'#c7f7e4');line(c,[[b.x,b.y],[b.x-b.vx*2,b.y-b.vy*2]],b.color||'#c7f7e4',3);}
    for(const b of g.enemyShots){if(drawBossProjectile(c,b,actorTime))continue;glow(c,b.x,b.y,18,(b.color||'#fba37c')+'44');poly(c,[[b.x-7,b.y],[b.x,b.y-7],[b.x+7,b.y],[b.x,b.y+7]],b.color||'#fba37c');}
    for(const wave of g.waves){const col=wave.color||b.color;glow(c,wave.x,510,45,col+'44');poly(c,[[wave.x-26,520],[wave.x-10,481],[wave.x,500],[wave.x+16,465],[wave.x+25,520]],col);}
    for(const hz of g.hazards){
      if(hz.type==='bubble')oval(c,hz.x,hz.y-4,22,8,'#8ddeed77');
      else{const col=hz.type==='root'?'#c7e1a7':hz.type==='lightning'?'#ddbcff':'#c7eeff';
        oval(c,hz.x,hz.y-2,hz.type==='stasis'?100:38,8,col+'33');
        if(hz.timer>0){line(c,[[hz.x-30,hz.y-3],[hz.x+30,hz.y-3]],col+'77',2);text(c,'!',hz.x,hz.y-25,col,18);}
        else if(hz.type==='lightning'){line(c,[[hz.x+20,0],[hz.x-10,200],[hz.x+10,185],[hz.x-8,400],[hz.x+12,390],[hz.x,hz.y]],col,5);glow(c,hz.x,hz.y-70,100,col+'44');}
        else for(let i=0;i<5;i++)poly(c,[[hz.x-36+i*15,hz.y],[hz.x-25+i*15,hz.y-65-noise(i)*55],[hz.x-13+i*15,hz.y]],col+'99');
      }
    }
    for(const e of g.effects)this.effect(c,e,t,b);
    this.fx.drawWorld(c,g,t);
    for(const f of g.combat?.fields||[]){if(!Number.isFinite(f.x))continue;const radius=f.radius||100;c.save();c.globalAlpha=Math.min(.6,f.life/25);c.strokeStyle=f.color||b.color;c.lineWidth=2;c.setLineDash(f.type==='time'?[8,12]:[]);c.beginPath();c.ellipse(f.x,f.y,radius*(.9+Math.sin(t*5)*.04),f.type==='gravity'?radius*.6:35,t*.15,0,TAU);c.stroke();glow(c,f.x,f.y,radius,(f.color||b.color)+'14');c.restore();}
    if(firstArea)drawMourningwildForeground(c,g,this.camera,this.cameraY,view,660,t);
    const near=g.room.objects.filter(o=>Math.abs(o.x-p.x)<90&&Math.abs((o.y??520)-p.y)<95).sort((x,y)=>Math.abs(x.x-p.x)-Math.abs(y.x-p.x))[0];
    if(near&&near.id!==speakerId){const defeated=id=>g.bossDefeated?.(id)||g.fragments.has(id)||g.defeatedBosses?.has(id),locked=near.need>g.fragments.size||near.ability&&!g.abilities.has(near.ability)||near.boss&&!defeated(near.boss)||near.requiresBoss&&!defeated(near.requiresBoss);text(c,'[ E ]  '+(locked?'SEALED · ':'')+near.name,near.x,(near.y??520)-110,locked?'#b6acbf':'#f6e5bb',11);}
    c.restore();
    // Soft foreground silhouette and cinematic light rays.
    const vign=c.createLinearGradient(0,0,0,660);vign.addColorStop(0,'#07101d77');vign.addColorStop(.3,'transparent');vign.addColorStop(.85,'transparent');vign.addColorStop(1,'#040a14bb');c.fillStyle=vign;c.fillRect(0,0,view,660);
    this.fx.drawScreen(c,view,660,t);
    c.restore();
  }
  backdrop(c,b,w,h,cam,t){
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,b.sky[0]);sky.addColorStop(1,b.sky[1]);c.fillStyle=sky;c.fillRect(0,0,w,h);
    glow(c,w*.65-cam*.035,180,360,b.color+'15');
    if(['forest','sanctuary'].includes(b.kind)){
      for(let layer=0;layer<3;layer++)for(let i=-2;i<12;i++){
        const spacing=210+layer*110,x=i*spacing-(cam*(.08+layer*.13))%spacing,base=600,top=-100+noise(i+layer*34)*160,col=['#18343b','#183c3c','#163835'][layer];
        poly(c,[[x-40-layer*9,base],[x-14,top],[x+25,top-50],[x+35,base]],col);
        for(const side of [-1,1])for(let j=0;j<3;j++){const yy=80+j*120;line(c,[[x+7,yy+80],[x+side*65,yy],[x+side*140,yy-20]],col,15+layer*6);oval(c,x+side*95,yy-30,120,55,col);}
        if(layer===2)line(c,[[x-2,base],[x+12,220]],'#45665b22',3);
      }
      for(let i=0;i<18;i++){const x=i*95-(cam*.27)%95,y=470+noise(i)*90;
        line(c,[[x,y+40],[x+5,y]],'#5c8b7355',2);oval(c,x+5,y,13,5,'#90b99a44');glow(c,x+5,y-2,20,'#c5e4aa0c');
        if(i%3===0){line(c,[[x+9,0],[x+4,130],[x+23,205]],'#71a68a33',1);for(let j=0;j<4;j++)oval(c,x+3+j*4,80+j*26,6,3,'#7eb39933');}
      }
      for(let i=0;i<7;i++){const x=i*260-cam*.04; c.save();c.globalAlpha=.025;c.fillStyle='#f5f3d0';c.translate(x,0);c.rotate(-.28);c.fillRect(0,-200,55,1000);c.restore();}
    }else if(b.kind==='forge'){
      for(let i=-1;i<10;i++){const x=i*240-(cam*.2)%240;c.fillStyle='#231d2d';c.fillRect(x-35,30,70,590);c.strokeStyle='#583a3b';c.lineWidth=18;c.beginPath();c.moveTo(x+30,540);c.lineTo(x+30,230);c.bezierCurveTo(x+30,90,x+210,90,x+210,230);c.lineTo(x+210,540);c.stroke();glow(c,x+120,330,70,'#f58d3d23');for(let j=0;j<5;j++)line(c,[[x+90+j*14,230],[x+90+j*14,440]],'#f6a46028',4);}
      for(let i=0;i<20;i++){const x=(i*67+t*9)%(w+50),y=600-(t*25+i*71)%650;oval(c,x,y,1.5,2.5,'#ffb67c88');}
    }else if(b.kind==='reef'){
      for(let i=0;i<12;i++){const x=i*150-(cam*.16)%150;c.fillStyle='#143444';c.fillRect(x,190+noise(i)*100,45,500);for(let j=0;j<5;j++)line(c,[[x+4,240+j*55],[x+42,240+j*55]],'#2c526155',3);}
      for(let i=0;i<30;i++){const x=(i*83+Math.sin(t*.1+i)*25-cam*.08+w*4)%w,y=(i*71-t*17+6600)%660;c.strokeStyle='#a4e7ed25';c.lineWidth=1;c.beginPath();c.arc(x,y,3+noise(i)*8,0,TAU);c.stroke();}
      for(let i=0;i<6;i++){const x=(i*241+t*15-cam*.04)%(w+160)-80,y=160+noise(i+20)*250;poly(c,[[x-24,y],[x,y-8],[x+30,y],[x,y+8]],'#9edbe422');}
    }else if(b.kind==='storm'){
      for(let i=0;i<6;i++){const x=i*350-(cam*.13)%350,y=260+noise(i)*180;poly(c,[[x-110,y],[x+110,y],[x+50,y+110],[x,y+160],[x-55,y+80]],'#272740');poly(c,[[x-110,y],[x-40,y-20],[x+100,y-15],[x+110,y]],'#64617e');c.fillStyle='#28273f';c.fillRect(x-13,y-210,26,210);poly(c,[[x-32,y-210],[x,y-256],[x+32,y-210]],'#aaa0bd55');}
      if(Math.sin(t*.7)>.995)line(c,[[w*.75,-10],[w*.7,130],[w*.77,120],[w*.66,310]],'#eee3ff77',3);
      for(let i=0;i<10;i++){const xx=(i*181+t*70)%(w+200)-100;line(c,[[xx,120+i*47],[xx+70,114+i*47]],'#d9d2f022',1);}
    }else if(b.kind==='frost'){
      for(let i=0;i<8;i++){const x=i*220-(cam*.12)%220;poly(c,[[x-150,560],[x,80+noise(i)*130],[x+170,560]],'#3b5b6d');poly(c,[[x,80+noise(i)*130],[x+56,240],[x+17,210],[x-20,245],[x-50,220]],'#a1b9c444');}
      for(let i=0;i<50;i++){const x=(i*63+t*(6+noise(i)*14))%(w+30),y=(i*77+t*20)%660;oval(c,x,y,noise(i)*2+.5,noise(i)*2+.5,'#e8f7ff66');}
    }else{
      const x=w*.6-cam*.025,y=200;glow(c,x,y,250,'#ffa0c02a');oval(c,x,y,105,105,'#180f29');c.strokeStyle='#efa7c455';c.lineWidth=2;c.beginPath();c.arc(x,y,122,0,TAU);c.stroke();
      for(let i=0;i<14;i++){const ang=i*TAU/14+t*.08,xx=x+Math.cos(ang)*160,yy=y+Math.sin(ang)*160;c.save();c.translate(xx,yy);c.rotate(ang);poly(c,[[0,-12],[7,0],[0,12],[-7,0]],'#e7a0bc55');c.restore();}
      for(let i=0;i<12;i++){const xx=i*170-(cam*.2)%170,yy=400+Math.sin(t+i)*20;poly(c,[[xx-30,yy],[xx+20,yy-80],[xx+45,yy+70],[xx,yy+110]],'#2a203c');}
    }
  }
  platform(c,p,b,t,g){
    if(drawBossPlatform(c,p,t))return;
    if(g&&drawMourningwildPlatform(c,p,g,t))return;
    if(g&&isTunnel(g)){drawTunnelPlatform(c,p,g.room.biome,t);return;}
    c.fillStyle=b.ground;c.fillRect(p.x,p.y,p.w,p.h);const under=c.createLinearGradient(0,p.y,0,p.y+p.h);under.addColorStop(0,'#06131c00');under.addColorStop(1,'#06101be8');c.fillStyle=under;c.fillRect(p.x,p.y,p.w,p.h);
    line(c,[[p.x,p.y],[p.x+p.w,p.y]],b.color+'55',3);
    for(let i=0;i<p.w;i+=42){const xx=p.x+i;line(c,[[xx,p.y+10],[xx+noise(i)*20,p.y+34],[xx+30,p.y+46]],'#b9d0be0b',1);}
    if(['forest','sanctuary'].includes(b.kind))for(let i=5;i<p.w;i+=14){const xx=p.x+i,hh=5+noise(i)*10;line(c,[[xx,p.y],[xx+Math.sin(t*2+i)*3,p.y-hh]],i%3===0?'#8ca48066':'#5d8c7077',1.5);}
    else if(b.kind==='frost')poly(c,[[p.x,p.y],[p.x+p.w,p.y],[p.x+p.w-14,p.y+10],[p.x+20,p.y+8]],'#cce8e788');
  }
  object(c,o,g,t){
    if(['npc','merchant'].includes(o.kind)){let drawn=false;drawNPCAnimation(c,o,g,t,()=>{drawn=drawRPGObject(c,o,g,t);});if(drawn)return;}else if(drawRPGObject(c,o,g,t))return;
    const x=o.x,y=o.y??520,col=BIOMES[g.room.biome].color,key=g.roomId+':'+o.id,used=g.opened.has(key);
    if(o.kind==='camp'||o.kind==='bench'){
      line(c,[[x-27,y],[x-30,y-20],[x+18,y-26],[x+31,y-8],[x+29,y]],'#776c58',6);poly(c,[[x-33,y-26],[x-28,y-52],[x+19,y-52],[x+27,y-28]],'#6f7360','#a5a48566');line(c,[[x-26,y-40],[x+20,y-40]],'#3c4a4288',3);line(c,[[x+38,y],[x+38,y-80],[x+22,y-80]],'#8f9c7e',2);oval(c,x+21,y-67,5,9,'#e2c891');glow(c,x+21,y-67,24,'#ead79a28');text(c,'SUPPLY CAMP',x,y-100,'#bbc1a9',8);
    }else if(o.kind==='npc'){
      drawNPCAnimation(c,o,g,t,()=>{
      oval(c,x,y,20,6,'#08151e88');poly(c,[[x-15,y-63],[x+10,y-62],[x+23,y-3],[x-22,y-3]],'#d0d6bb','#263e3d');oval(c,x,y-79,13,16,'#d9b996');poly(c,[[x-18,y-85],[x-9,y-108],[x+12,y-106],[x+20,y-85]],'#b5c5b9');line(c,[[x+22,y-52],[x+31,y-8]],'#c7b783',3);oval(c,x+31,y-54,6,10,'#edd69b');text(c,'PROF. VELL',x,y-126,'#cbd8c4',9);});
    }else if(o.kind==='workbench'){
      c.fillStyle='#747e69';c.fillRect(x-40,y-36,80,9);line(c,[[x-31,y-29],[x-31,y],[x+30,y],[x+30,y-29]],'#555e54',6);poly(c,[[x-15,y-40],[x-6,y-70],[x+8,y-70],[x+25,y-40]],'#a5a78a');glow(c,x,y-55,25,'#ffe6ac33');text(c,'THE MENDER',x,y-97,'#c8d5bf',9);
    }else if(o.kind==='portal'){
      const active=o.need<=g.fragments.size,cc=BIOMES[o.id].color;
      glow(c,x,y-66,90,active?cc+'23':'#77777708');c.strokeStyle=active?cc+'88':'#526161';c.lineWidth=7;c.beginPath();c.ellipse(x,y-65,37,65,0,Math.PI,TAU);c.lineTo(x+37,y);c.stroke();line(c,[[x-37,y],[x-37,y-65]],active?cc+'88':'#526161',7);
      for(let i=0;i<4;i++)if(active){const a=t*.7+i*TAU/4;oval(c,x+Math.cos(a)*21,y-60+Math.sin(a)*35,1.5,1.5,cc);}
      text(c,BIOMES[o.id].icon,x,y-46,active?cc:'#63716f',23);text(c,String(o.need+1).padStart(2,'0'),x,y-150,active?cc:'#64726e',10);
     }else if(o.kind==='veil'){
      const active=g.abilities.has('blink');glow(c,x,300,200,'#d7a5e81b');
      for(let i=0;i<8;i++){const xx=x+Math.sin(t*2+i)*8;line(c,[[xx,45],[xx+Math.sin(t+i)*10,280],[xx,520]],active?'#d5a7e75c':'#d5a7e7bb',2);}
      text(c,'RIFT STEP',x,410,'#e1bfea',9);
    }else if(o.kind==='lever'){
      line(c,[[x-15,y],[x+15,y]],'#91a582',5);line(c,[[x,y],[x+(used?24:-24),y-42]],'#cfcea0',4);oval(c,x+(used?24:-24),y-42,6,6,used?'#b4deb0':'#efd8a0');
    }else if(o.kind==='door'){
      const defeated=id=>g.bossDefeated?.(id)||g.fragments.has(id)||g.defeatedBosses?.has(id),locked=o.ability&&!g.abilities.has(o.ability)||o.boss&&!defeated(o.boss)||o.requiresBoss&&!defeated(o.requiresBoss);
      line(c,[[x-26,y],[x-26,y-77],[x,y-103],[x+26,y-77],[x+26,y]],locked?'#655b70':'#8caa92',5);line(c,[[x-18,y-4],[x-18,y-72],[x,y-89],[x+18,y-72],[x+18,y-4]],col+'44',1);
      glow(c,x,y-47,46,locked?'#bd94e622':col+'18');text(c,locked?'◇':'≋',x,y-45,locked?'#b79ac4':col,21);
      if(!locked)for(let i=0;i<4;i++){const yy=y-10-(t*19+i*21)%80;oval(c,x+Math.sin(i*2+t)*12,yy,1,1,col+'99');}
    }else if(o.kind==='memory'){
      line(c,[[x-15,y],[x-12,y-51],[x+12,y-51],[x+16,y]],'#5d7a71',4);text(c,'≋',x,y-30,'#b4d8bf',24);if(!g.memories.has(key))glow(c,x,y-36,30,'#caecc02a');
    }else if(o.kind==='cache'){
      poly(c,[[x-24,y-4],[x-24,y-29],[x-12,y-43],[x+19,y-43],[x+27,y-29],[x+27,y-4]],used?'#35483f':'#8d8c61','#c7c3a277');line(c,[[x-23,y-24],[x+24,y-24]],'#b9bd9177',2);if(!used){glow(c,x,y-23,25,'#ead49025');c.fillStyle='#ead7a4';c.fillRect(x-3,y-26,6,10);}
    }else if(o.kind==='ore'&&!used){for(let i=0;i<5;i++)poly(c,[[x-30+i*12,y],[x-25+i*12,y-25-noise(i)*22],[x-8+i*12,y]],i%2?col+'88':'#687b78',col+'66');}
    else if(o.kind==='shrine'){
      poly(c,[[x-22,y],[x-16,y-48],[x,y-70],[x+16,y-48],[x+22,y]],'#4e6563','#93bcb166');glow(c,x,y-42,35,g.shrines.has(key)?'#f9e4aa44':'#a0dfd01a');text(c,'◇',x,y-32,g.shrines.has(key)?'#ffe9b0':'#80a79c',25);
    }
  }
  minion(c,e,t){
    if(drawEnemyMinion(c,e,t,MINIONS[e.kind]))return;
    if(drawDungeonMinion(c,e,t,MINIONS[e.kind]?.color||'#d9bdea'))return;
    if(drawChronicleEntity(c,e,t))return;
    if(['sinder','voltlet','pebbleback','dewdrop','sproutlet'].includes(e.kind)){drawMinion(c,e,t);return;}
    const col=MINIONS[e.kind].color;c.save();c.translate(e.x,e.y);c.scale(e.face,1);if(e.flash)c.globalAlpha=.5;
    if(e.kind==='thornling'){for(const side of [-1,1])poly(c,[[0,-20],[side*34,-65],[side*30,-15]],'#66896a',col+'99');oval(c,0,-28,19,23,'#647e61');poly(c,[[-20,-35],[0,-65],[19,-35]],col);}
    else if(['ashwing','stormkite','inkfin'].includes(e.kind)){const flap=Math.sin(t*12+e.id)*18;for(const side of [-1,1])poly(c,[[0,-20],[side*55,-60+flap],[side*40,-12],[side*12,-2]],col+'88',col);poly(c,[[-15,-45],[12,-45],[23,-22],[0,-3],[-17,-20]],'#435167');}
    else if(e.kind==='frostmite'){for(let i=0;i<5;i++)poly(c,[[-30+i*12,-5],[-24+i*12,-35-(i%2)*15],[-10+i*12,-6]],col+'88',col);for(const s of [-1,1])line(c,[[s*12,-5],[s*30,1]],'#b5cfdf',3);}
    else{glow(c,0,-40,40,col+'22');poly(c,[[-19,-16],[-11,-60],[7,-78],[24,-38],[12,-5],[0,-19]],'#8d628d',col);for(let i=0;i<4;i++)line(c,[[-10+i*7,-5],[-20+i*12,Math.sin(t*7+i)*9]],col+'55',2);}
    oval(c,5,-32,3,4,'#fff0cd');oval(c,15,-32,3,4,'#fff0cd');if(e.state==='windup')text(c,'!',0,-83,'#ffce91',22);c.restore();
  }
  boss(c,e,t,g){
    if(drawArenaBoss(c,e,g?.bossInfo?.(e.boss)||BOSSES[e.boss],t)){drawBossWeapon(c,e,t);return;}
    if(drawChronicleBoss(c,e,t))return;
    const b=BOSSES[e.boss],col=b.color;if(drawDungeonChampion(c,e,b,t))return;c.save();c.translate(e.x,e.y);c.scale(e.face,1);if(e.flash)c.globalAlpha=.55;
    const breathe=Math.sin(t*2)*3,wind=e.state==='windup',rage=e.phase>=2;c.translate(0,breathe+(e.state==='recover'?8:0));c.rotate(e.state==='charge'?.1:wind?-.045:0);glow(c,0,-70,160,col+(rage?'22':'10'));
    if(e.boss==='briar'||e.boss==='hourglass'){
      for(const side of [-1,1]){line(c,[[side*35,-85],[side*58,-38],[side*72,0]],e.boss==='briar'?'#607e65':'#8ca9b6',15);line(c,[[side*20,-132],[side*40,-200],[side*73,-242]],col,7);for(let i=0;i<3;i++)line(c,[[side*(42+i*10),-200-i*10],[side*(67+i*13),-215-i*20]],col,4);}
      poly(c,[[-48,-110],[-22,-151],[34,-140],[60,-91],[24,-48],[-34,-56]],e.boss==='briar'?'#54745b':'#536b88',col+'77');
      oval(c,5,-146,31,33,e.boss==='briar'?'#8caa77':'#bad3db');for(const side of [-1,1])oval(c,side*13,-153,4,7,'#ffebbc');
      if(e.boss==='briar')for(let i=0;i<7;i++)poly(c,[[-49+i*14,-103],[-55+i*14,-147-(i%2)*15],[-27+i*14,-124]],i%2?'#b8c891':'#7c9c75');
      else{c.strokeStyle='#e0deb7';c.lineWidth=2;c.beginPath();c.arc(4,-144,40,0,TAU);c.stroke();line(c,[[4,-144],[4,-169],[19,-144]],'#e7dcae',2);}
    }else if(e.boss==='bell'){
      for(const side of [-1,1])line(c,[[side*27,-38],[side*47,-4]],'#564455',16);
      poly(c,[[-76,-30],[-53,-83],[-40,-155],[0,-193],[40,-155],[54,-83],[78,-30]],'#866252','#e2aa7977');line(c,[[-73,-44],[75,-44]],col,5);for(let i=0;i<5;i++)line(c,[[-33+i*16,-143],[-42+i*21,-62]],'#322e3c',7);
      for(const side of [-1,1]){line(c,[[side*40,-115],[side*90,-88],[side*95,-12]],'#b27a59',17);poly(c,[[side*85,-18],[side*118,-33],[side*132,-4],[side*86,0]],'#57525b',col+'99');}glow(c,0,-108,40,'#ff8d3f66');oval(c,0,-109,8,20,'#ffe2a1');
    }else if(e.boss==='leviathan'){
      for(let i=0;i<7;i++){const xx=-70+i*23;c.beginPath();c.moveTo(xx,-55);c.bezierCurveTo(xx-45,-20,xx+Math.sin(t*3+i)*70,8,xx+Math.sin(t*2+i)*65,-5);c.strokeStyle=i%2?'#6b9cb7':'#395a82';c.lineWidth=13;c.stroke();}
      poly(c,[[-60,-68],[-42,-143],[0,-203],[43,-145],[63,-68],[28,-45],[-25,-45]],'#4c6f96',col+'88');for(const side of [-1,1]){poly(c,[[side*32,-145],[side*105,-160],[side*87,-105],[side*40,-71]],'#597da380',col+'88');oval(c,side*18,-115,7,11,'#d4f8e4');}text(c,'≋',0,-155,'#b1e7e6',32);
    }else if(e.boss==='conductor'){
      for(const side of [-1,1])for(let i=0;i<5;i++)poly(c,[[side*15,-92],[side*(70+i*17),-201+i*12+Math.sin(t*4)*8],[side*(88+i*14),-145+i*10],[side*35,-42]],i%2?'#85729f':'#65597e',col+'44');
      poly(c,[[-33,-83],[-12,-147],[24,-146],[43,-84],[4,-36]],'#655784',col+'88');oval(c,3,-163,25,28,'#a296b9');poly(c,[[-13,-177],[-17,-210],[8,-186],[30,-213],[24,-169]],'#d5c5cf');oval(c,14,-161,4,6,'#fff0bd');line(c,[[32,-108],[81,-64],[110,-172]],col,4);
    }else{
      for(let i=0;i<6;i++){const ang=i*TAU/6+t*.3;line(c,[[Math.cos(ang)*30,-110+Math.sin(ang)*30],[Math.cos(ang)*115,-110+Math.sin(ang)*115]],col+'55',3);oval(c,Math.cos(ang)*115,-110+Math.sin(ang)*115,6,6,col+'88');}
      poly(c,[[-68,-6],[-38,-99],[-32,-174],[0,-205],[33,-176],[37,-101],[70,-6],[22,-34],[0,-9],[-26,-33]],'#684263',col+'88');oval(c,0,-156,23,27,'#241b36');oval(c,0,-155,11,15,'#ffe9c0');poly(c,[[-34,-197],[-47,-235],[-15,-219],[0,-247],[15,-218],[46,-235],[34,-197]],'#b1859b','#efbece');
    }
    if(wind){glow(c,0,-70,90,'#ffcc7c33');text(c,'!',0,-260,'#ffe4a0',34);}if(rage){c.strokeStyle=col+'55';c.lineWidth=1;c.beginPath();c.ellipse(0,-50,100+Math.sin(t*8)*5,20,0,0,TAU);c.stroke();}c.restore();
  }
  effect(c,e,t,b){
    const a=Math.max(0,e.life/(e.type==='number'?35:30));c.save();c.globalAlpha=Math.min(1,a);
    if(e.type==='number')text(c,e.text,e.x,e.y-(35-e.life)*1.2,e.color,17);
    else if(e.type==='slash'){
      c.translate(e.x,e.y);c.scale(e.face||1,1);c.rotate(e.dir==='down'?Math.PI*.5:e.dir==='up'?-Math.PI*.5:(e.swing%2?.35:-.3));c.strokeStyle=e.heavy?'#ffe7b0':'#e7ffe1';c.lineWidth=e.heavy?8:5;c.beginPath();c.ellipse(-28,0,76,55,-.2,-1.3,1.1);c.stroke();c.strokeStyle='#c7f4c755';c.lineWidth=15;c.stroke();
    }else if(['trail','bossTrail'].includes(e.type)){if(e.type==='bossTrail')oval(c,e.x,e.y-60,42,65,e.color+'22');}
    else if(['land','jump'].includes(e.type)){for(let i=0;i<6;i++){const xx=e.x+(i-2.5)*(23-e.life)*2;oval(c,xx,e.y-2-Math.sin(i)*5,3,2,b.color+'77');}}
    else{const radius=(35-e.life)*2+16,col=['heal','swap'].includes(e.type)?'#c9f7c7':e.type==='mist'?'#c7a3e9':b.color;if(radius>0){glow(c,e.x,e.y,radius,col+'22');c.strokeStyle=col+'99';c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,radius*.65,0,TAU);c.stroke();for(let i=0;i<8;i++){const angle=i*TAU/8;line(c,[[e.x+Math.cos(angle)*radius*.5,e.y+Math.sin(angle)*radius*.5],[e.x+Math.cos(angle)*radius,e.y+Math.sin(angle)*radius]],col+'88',2);}}}
    c.restore();
  }
  renderHome(clock,ids,{reducedMotion=false,biome='moss'}={}){
    const {c,w,h}=fitCanvas(this.canvas);if(!w||!h)return;const t=reducedMotion?0:clock/1000;c.save();const scale=h/660;c.scale(scale,scale);const ww=w/scale,theme=BIOMES[biome]||BIOMES.moss,homeScene={roomId:'moss-path',room:{id:'moss-path',biome,objects:[],platforms:[]},platforms:[],worldWidth:ww,player:{x:ww*.65,y:570},enemies:[],combat:{settings:{reducedMotion}}};if(!drawMourningwildBackdrop(c,homeScene,Math.sin(t*.08)*70,0,ww,660,t))this.backdrop(c,theme,ww,660,Math.sin(t*.08)*70,t);
    this.platform(c,{x:0,y:570,w:ww,h:200},theme,t,homeScene);
    // Ancient Worldheart architecture behind the party.
    const mid=ww*.65;glow(c,mid,260,185,'#dfffdc12');c.strokeStyle='#89af9433';c.lineWidth=8;c.beginPath();c.arc(mid,265,156,Math.PI*.15,Math.PI*1.85);c.stroke();c.strokeStyle='#b8d4af22';c.lineWidth=1;c.beginPath();c.arc(mid,265,140,0,TAU);c.stroke();
    for(let i=0;i<12;i++){const ang=i*TAU/12+t*.03,x=mid+Math.cos(ang)*140,y=265+Math.sin(ang)*140;poly(c,[[x,y-5],[x+3,y],[x,y+5],[x-3,y]],'#d7e7b466');}
    const positions=[{x:mid-105,y:570,s:.83,face:1},{x:mid+115,y:558,s:.72,face:-1},{x:mid+15,y:565,s:.72,face:1}];
    [2,0,1].forEach(i=>{const p=positions[i];drawCreature(c,findFighter(ids[i]),p.x,p.y,p.s,p.face,{state:'idle'},t,{aura:true,reducedMotion});});
    for(let i=0;i<30;i++){const x=noise(i)*ww,y=50+noise(i+22)*480+Math.sin(t+i)*8;glow(c,x,y,6,'#e4ffbc22');oval(c,x,y,1,1,'#e3f8be88');}
    const shade=c.createLinearGradient(0,0,ww,0);shade.addColorStop(0,'#0b172b88');shade.addColorStop(.4,'transparent');shade.addColorStop(1,'#0b172b33');c.fillStyle=shade;c.fillRect(0,0,ww,660);c.restore();
  }
}
