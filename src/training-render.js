import { drawCreature, fitCanvas } from './render.js';
import { LESSONS, PLATFORMS, THORNS } from './training.js';

const TAU=Math.PI*2;
function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke()}}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill()}
function path(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke()}
function halo(c,x,y,r,color){const a=c.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,color);a.addColorStop(1,'transparent');ellipse(c,x,y,r,r,a)}

/** Side-on parallax presentation. World state remains entirely in TrainingEngine. */
export class TrainingRenderer{
  constructor(canvas){this.canvas=canvas;this.camera=0;this.cameraY=0;this.shake=0;this.lastTick=-1;this.clock=0;}
  reset(){this.camera=0;this.cameraY=0;this.lastTick=-1;}
  event(e){if(['hit','pogo','slam','hurt'].includes(e.type))this.shake=e.type==='slam'?7:4;}
  render(g,clock){
    const {c,w,h}=fitCanvas(this.canvas);if(!w||!h)return;
    const scale=h/660,viewWidth=w/scale,p=g.player;
    // Camera advances only with simulation, preserving a perfectly still pause.
    if(this.lastTick!==g.tick){const mobile=viewWidth<700,targetY=Math.min(mobile?130:0,p.y-(mobile?300:240));if(this.lastTick===-1)this.cameraY=targetY;this.camera+=(Math.max(0,Math.min(8000-viewWidth,p.x-viewWidth*.36+p.vx*7))-this.camera)*.11;this.cameraY+=(targetY-this.cameraY)*.08;this.lastTick=g.tick;this.clock=clock;}
    const t=this.clock/1000,x0=this.camera,x1=this.camera+viewWidth;
    c.clearRect(0,0,w,h);
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#091515');sky.addColorStop(.52,'#142c2b');sky.addColorStop(1,'#0a1818');c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.save();c.scale(scale,scale);
    // Distant cavern arches, several parallax layers, and cold shafts of light.
    for(let layer=0;layer<3;layer++){
      c.save();c.translate(-this.camera*(.12+layer*.16),-this.cameraY*.12);
      const period=layer===0?650:420,start=Math.floor(this.camera*(.12+layer*.16)/period)*period;
      for(let x=start-period;x<start+viewWidth+period;x+=period){
        const offset=Math.sin(x*.013+layer)*35;
        c.fillStyle=['#0d2022','#102727','#102321'][layer];
        c.beginPath();c.moveTo(x-40,-80);c.lineTo(x+65,-80);c.lineTo(x+45,510);c.lineTo(x-50,600);c.closePath();c.fill();
        c.beginPath();c.arc(x+period/2,320+offset,period/2-50,Math.PI,0);c.lineTo(x+period-50,600);c.lineTo(x+50,600);c.closePath();c.strokeStyle=['#1c3637','#1c3834','#244239'][layer];c.lineWidth=layer===0?18:9;c.stroke();
        if(layer===0){halo(c,x+period*.5,210+offset,190,'#6ec7b310');polygon(c,[[x+period*.5-12,0],[x+period*.5+12,0],[x+period*.5+135,580],[x+period*.5-135,580]],'#a5e0bd05');}
        if(layer===1){for(let k=0;k<4;k++){const xx=x+96+k*48;path(c,[[xx,250],[xx-8,390],[xx+8,470]],'#36554a33',2)}}
      }
      c.restore();
    }
    // Specks drift instead of imposing visual noise on the collision surfaces.
    for(let i=0;i<40;i++){
      const x=((i*131.3-this.camera*.2+t*(i%3+1)*2)%(viewWidth+60)+viewWidth+60)%(viewWidth+60)-30;
      const y=(i*71.7+Math.sin(t*.4+i)*16)%640;
      ellipse(c,x,y,i%3===0?1.6:.8,i%3===0?1.6:.8,i%3===0?'#c7efba44':'#b7e5d022');
    }
    c.save();if(this.shake>.2&&!g.paused){c.translate(Math.sin(clock*.13)*this.shake,Math.cos(clock*.11)*this.shake*.5);this.shake*=.8}
    c.translate(-this.camera,-this.cameraY);
    // Area titles are authored into the architecture of each room.
    for(let i=0;i<LESSONS.length;i++){
      const room=LESSONS[i];if(room.start>x1+300||room.start+1200<x0)continue;
      c.textAlign='center';c.font='700 13px Barlow';c.fillStyle='#88b7a755';c.fillText(String(i+1).padStart(2,'0')+'  /  PILGRIM’S PATH',room.start+490,155);
      c.font='600 48px "Barlow Condensed",sans-serif';c.fillStyle='#a8d9ba17';c.fillText(room.zone,room.start+490,207);
      // Hanging moss, chains and crystal sconces frame each space.
      for(let k=0;k<4;k++){const xx=room.start+140+k*240;path(c,[[xx,-20],[xx+3,80+k*14]],'#54756b44',2);ellipse(c,xx+3,90+k*14,9,15,'#3b675a');halo(c,xx+3,90+k*14,75,'#a0e6c514');}
    }
    for(const b of PLATFORMS){
      if(b.x+b.w<x0-80||b.x>x1+80)continue;
      const fill=c.createLinearGradient(0,b.y,0,b.y+Math.min(b.h,140));fill.addColorStop(0,'#263f37');fill.addColorStop(.22,'#142923');fill.addColorStop(1,'#0b1b18');
      c.fillStyle=fill;c.fillRect(b.x,b.y,b.w,b.h);path(c,[[b.x,b.y+2],[b.x+b.w,b.y+2]],'#86b598',3);
      path(c,[[b.x,b.y+6],[b.x+b.w,b.y+6]],'#c8e6b02a',1);
      for(let xx=b.x+12;xx<b.x+b.w;xx+=55){if(xx<x0-60||xx>x1+60)continue;path(c,[[xx,b.y+12],[xx+13,b.y+28],[xx+9,b.y+49]],'#3f5d4a66',1);if(xx%3<1.4)path(c,[[xx,b.y],[xx+5,b.y-7],[xx+8,b.y]],'#93ba7355',1.5);}
      if(b.h<100){polygon(c,[[b.x,b.y+b.h],[b.x+18,b.y+b.h+18],[b.x+31,b.y+b.h],[b.x+48,b.y+b.h+7],[b.x+b.w-15,b.y+b.h+5],[b.x+b.w,b.y+b.h]],'#0e231e');}
      if(b.solid){for(let yy=b.y+20;yy<b.y+b.h;yy+=28)path(c,[[b.x+8,yy],[b.x+b.w-8,yy+2]],'#8bb59b33',1);halo(c,b.x+b.w/2,b.y,75,'#a7e7c91c');}
    }
    for(const th of THORNS){
      if(th.x>x1||th.x+th.w<x0)continue;
      halo(c,th.x+th.w/2,th.y+18,th.w*.6,'#a45b4c17');
      for(let xx=th.x;xx<th.x+th.w;xx+=21)polygon(c,[[xx,th.y+28],[xx+9,th.y-10-(Math.sin(xx)*8)],[xx+21,th.y+28]],'#694f48','#ba8c6b66');
    }
    for(let i=0;i<LESSONS.length;i++){
      const room=LESSONS[i],x=room.gate;if(x<x0-60||x>x1+60)continue;
      if(!g.completed[i]){
        halo(c,x,360,140,'#b4e3a518');path(c,[[x,205],[x,520]],'#b5dc9b88',3);
        for(let yy=230;yy<515;yy+=31){polygon(c,[[x-10,yy],[x,yy-9],[x+10,yy],[x,yy+9]],'#b5dc9b55');}
        c.font='600 11px Barlow';c.textAlign='center';c.fillStyle='#b2d0a9';c.fillText('PROVE THE LESSON',x,185);
      }else{path(c,[[x-12,505],[x-12,520],[x+12,520],[x+12,505]],'#92c89288',2);}
    }
    // Each waylight is both a mentor station and a visible respawn landmark.
    for(let i=0;i<LESSONS.length;i++){
      const x=LESSONS[i].spawn;if(x<x0-100||x>x1+100)continue;const lit=i<=g.lesson;
      halo(c,x,478,115,lit?'#a9df9c22':'#a9df9c08');
      path(c,[[x-27,519],[x-27,496],[x+27,496],[x+27,519]],'#6d8870',3);path(c,[[x-34,492],[x+34,492]],lit?'#c6e5ac':'#66836c',3);
      path(c,[[x,495],[x,450]],'#7e9979',3);polygon(c,[[x,429],[x+12,447],[x,464],[x-12,447]],lit?'#d9f2b2':'#365444');
      if(lit){halo(c,x,447,42,'#c8f79a33');c.fillStyle='#cee8b7';c.font='600 8px Barlow';c.textAlign='center';c.fillText('E  /  REST',x,414);}
    }
    for(const r of g.relics){if(r.collected||r.x<x0-30||r.x>x1+30)continue;const y=r.y+Math.sin(t*2+r.id)*5;halo(c,r.x,y,40,'#d4fcb82a');polygon(c,[[r.x,y-14],[r.x+7,y],[r.x,y+14],[r.x-7,y]],'#deffc3','#a7cb90');}
    const bell=g.bell;
    if(bell.x>x0-100&&bell.x<x1+100){
      path(c,[[bell.x,120],[bell.x,bell.y-30]],'#597466',2);halo(c,bell.x,bell.y,80,bell.flash?'#e6ffbd66':'#b5e7a529');
      ellipse(c,bell.x,bell.y,25,25,'#2e5141');c.strokeStyle='#d1eaa7';c.lineWidth=2;c.beginPath();c.arc(bell.x,bell.y,22,0,TAU);c.stroke();polygon(c,[[bell.x,bell.y-14],[bell.x+9,bell.y],[bell.x,bell.y+14],[bell.x-9,bell.y]],'#d0f49b');
      c.textAlign='center';c.font='600 10px Barlow';c.fillStyle='#b7d59a';c.fillText('STRIKE DOWN · S + J',bell.x,bell.y+54);
    }
    for(const enemy of g.enemies)if(enemy.x>x0-130&&enemy.x<x1+130&&enemy.hp>0)this.enemy(c,enemy,t);
    for(const wave of g.waves){halo(c,wave.x,510,50,'#f5b37644');polygon(c,[[wave.x-25,520],[wave.x-10,485],[wave.x,506],[wave.x+13,478],[wave.x+28,520]],'#e5bd86');}
    for(const bolt of g.projectiles){halo(c,bolt.x,bolt.y,40,g.data.color+'55');ellipse(c,bolt.x,bolt.y,24,7,g.data.accent);path(c,[[bolt.x-Math.sign(bolt.vx)*40,bolt.y],[bolt.x,bolt.y]],g.data.color,4);}
    for(const e of g.effects){
      if(e.type==='trail'){c.save();c.globalAlpha=e.life/50;drawCreature(c,g.data,e.x,e.y,.25,e.face,{},t,{shadow:false});c.restore();}
      else{c.save();c.globalAlpha=Math.min(1,e.life/15);const r=(24-e.life)*3;for(let i=0;i<8;i++){const a=i*TAU/8;path(c,[[e.x+Math.cos(a)*r*.4,e.y+Math.sin(a)*r*.4],[e.x+Math.cos(a)*(r+12),e.y+Math.sin(a)*(r+12)]],g.data.accent,2)}c.restore();}
    }
    c.save();if(p.invul>0&&g.tick%8<3)c.globalAlpha=.45;
    if(p.dash>0){halo(c,p.x,p.y-30,60,g.data.color+'22');}
    drawCreature(c,g.data,p.x,p.y,.25,p.face,{attack:p.attack?Math.sin(Math.min(1,p.attack.frame/14)*Math.PI):0,hit:p.flash>0,air:!p.grounded,walk:p.walkPhase},t,{shadow:false});c.restore();
    const attack=p.attack;
    if(attack&&attack.frame>=attack.start&&attack.frame<attack.start+attack.active){
      c.save();c.translate(p.x,p.y-32);c.scale(p.face,1);c.strokeStyle=g.data.accent;c.shadowColor=g.data.color;c.shadowBlur=12;c.lineWidth=attack.type==='heavy'?8:4;c.beginPath();
      if(attack.dir==='down')c.arc(0,30,57,.12,Math.PI-.12);
      else if(attack.dir==='up')c.arc(0,-25,64,Math.PI+ .15,TAU-.15);
      else c.arc(8,-8,66,-1.2,1.15);
      c.stroke();c.restore();
    }
    // The exit is visible long before the final encounter is won.
    if(x1>7630){halo(c,7900,380,180,'#c5efb429');path(c,[[7835,520],[7835,350]],'#5a8068',12);path(c,[[7965,350],[7965,520]],'#5a8068',12);c.strokeStyle='#9fc294';c.lineWidth=10;c.beginPath();c.arc(7900,350,65,Math.PI,0);c.stroke();c.fillStyle='#d8edb5';c.font='600 13px Barlow';c.textAlign='center';c.fillText('THE ARENA AWAITS',7900,267);}
    c.restore();
    // Foreground silhouettes add depth while leaving the walkable edge readable.
    for(let i=0;i<Math.ceil(viewWidth/120)+1;i++){const xx=i*120-(this.camera*.7%120),hh=25+Math.sin(i*13)*16;polygon(c,[[xx-30,660],[xx-8,660-hh],[xx+10,648],[xx+31,660-hh*.7],[xx+50,660]],'#071210');}
    c.restore();
    const vignette=c.createRadialGradient(w*.5,h*.5,h*.2,w*.5,h*.5,w*.7);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#030b0b99');c.fillStyle=vignette;c.fillRect(0,0,w,h);
  }
  enemy(c,e,t){
    const boss=e.kind==='warden',s=boss?1.65:.85,x=e.x,y=e.y;
    c.save();c.translate(x,y);c.scale(s*e.face,s);
    if(e.state==='windup'){halo(c,0,-35,80,'#ffc7882a');c.strokeStyle='#eab47d';c.lineWidth=2;c.setLineDash([3,5]);c.beginPath();c.arc(0,-35,62,-1.3,1.3);c.stroke();c.setLineDash([]);}
    ellipse(c,0,0,25,6,'#030c0a99');
    for(const side of [-1,1]){path(c,[[side*15,-18],[side*27,-10],[side*31,0]],'#647465',6);path(c,[[side*15,-31],[side*35,-24],[side*38,-13]],'#7d8971',4);}
    polygon(c,[[-26,-26],[-30,-55],[-15,-75],[12,-76],[32,-55],[25,-24],[0,-13]],e.flash?'#fff9d3':boss?'#5b6551':'#344e44','#8d9f7e');
    polygon(c,[[-26,-56],[-6,-66],[10,-61],[23,-52],[10,-36],[-13,-37]],e.flash?'#fff9d3':'#142d28','#7e9d7c');
    path(c,[[-14,-52],[-6,-49]],'#f5daa0',3);path(c,[[8,-49],[17,-54]],'#f5daa0',3);
    polygon(c,[[-18,-70],[-23,-93],[-4,-78],[6,-101],[13,-76],[30,-90],[23,-67]],boss?'#b5b68d':'#77917b','#344b3d');
    path(c,[[25,-41],[43,-21],[51,-39]],'#a1a687',5);
    if(boss){polygon(c,[[-29,-43],[-44,-15],[-35,-4],[-13,-18],[12,-11],[34,-6],[25,-39]],'#314137','#8d9877');polygon(c,[[0,-34],[8,-25],[0,-16],[-8,-25]],'#d6dda2');}
    c.restore();
    const width=boss?122:60;c.fillStyle='#0a1915';c.fillRect(x-width/2,y-(boss?180:98),width,4);c.fillStyle=boss?'#d4cc91':'#9ac4a1';c.fillRect(x-width/2,y-(boss?180:98),width*e.hp/e.maxHp,4);
    if(boss){c.fillStyle='#c1c8a1';c.textAlign='center';c.font='600 9px Barlow';c.fillText('THE BRASS WARDEN',x,y-191);}
    if(e.state==='windup'){c.fillStyle='#e4c48f';c.textAlign='center';c.font='700 16px Barlow';c.fillText('!',x,y-(boss?215:120));}
  }
}
