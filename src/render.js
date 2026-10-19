import { drawCreature } from './creatures.js';
export { drawCreature } from './creatures.js';
import { ARENAS } from './roster.js';

const TAU=Math.PI*2;
function poly(c,points,fill,stroke='#111b16',line=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.lineJoin='round';c.stroke()}}
function ellipse(c,x,y,rx,ry,fill,stroke=null,line=2){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function line(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke()}
function grad(c,x,y,x2,y2,...colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ellipse(c,x,y,r,r,g)}

export function fitCanvas(canvas){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr)}const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w:r.width,h:r.height};}

export function paintPortrait(canvas,d,{hero=false,time=0,face=1}={}){
  const {c,w,h}=fitCanvas(canvas);c.clearRect(0,0,w,h);
  if(hero){glow(c,w*.53,h*.52,h*.43,d.color+'15');
    c.save();c.translate(w*.49,h*.88);c.scale(1,.26);c.strokeStyle='#b9d97844';c.lineWidth=2;c.beginPath();c.arc(0,0,w*.34,0,TAU);c.stroke();c.beginPath();c.arc(0,0,w*.28,0,TAU);c.stroke();c.restore();
    drawCreature(c,d,w*.48,h*.91,['gator','beetle','jackal','griffin'].includes(d.rig)?Math.min(h/240,w/420):h/328,face,{attack:.16},time,{aura:true});
    // Floating embers and registration marks.
    for(let i=0;i<12;i++){const x=w*.15+((i*53)%Math.max(1,w*.7)),y=h*.14+((i*71)%Math.max(1,h*.6));c.globalAlpha=.25+Math.sin(time+i)*.2;ellipse(c,x,y,1.2,1.2,d.accent)}c.globalAlpha=1;
  }else drawCreature(c,d,w*.49,h*1.08,['gator','beetle','jackal','griffin'].includes(d.rig)?Math.min(h/205,w/240):h/254,face,{attack:.10},0,{shadow:false});
}

export class ArenaRenderer{
  constructor(canvas){this.canvas=canvas;this.effects=[];this.shake=0;this.time=0;this.hitboxes=false;this.lastClock=0;}
  event(e){if(['hit','block','parry','throw','wall','break','burst','tech','guardbreak'].includes(e.type)){this.effects.push({...e,age:0});if(e.type==='hit'||e.type==='wall'||e.type==='break')this.shake=Math.min(12,e.move?.type==='burst'?15:e.type==='break'?14:5)}}
  render(game,clock){
    const {c,w,h}=fitCanvas(this.canvas);if(!w||!h)return;
    const dt=Math.min(.05,(clock-this.lastClock)/1000||.016);this.lastClock=clock;this.time+=dt;
    const a=ARENAS[game.arena],scale=Math.min(w/14,h/7.1);
    const project=(x,z,y=0)=>[w/2+x*scale,h*.70+z*scale*.37-y*scale];
    c.clearRect(0,0,w,h);c.save();if(this.shake>.2&&!game.paused){c.translate(Math.sin(clock*.09)*this.shake,Math.cos(clock*.12)*this.shake*.45);this.shake*=.85}
    c.fillStyle=grad(c,0,0,0,h,a.bg,a.horizon,a.bg);c.fillRect(0,0,w,h);
    // Industrial vaulted hall and distant hazy lights.
    glow(c,w*.5,h*.44,w*.5,a.glow+'0e');
    for(let i=0;i<11;i++){
      const x=w*(i/10),columnW=w*.022;
      poly(c,[[x-columnW,0],[x+columnW,0],[x+columnW*.6,h*.58],[x-columnW*.6,h*.58]],'#080e0bb8',null);
      line(c,[[x-columnW,0],[x+columnW,h*.57]],'#81966218',2);
      c.fillStyle=a.glow+'35';c.fillRect(x-columnW*.65,h*.33,columnW*1.3,2);
      if(i%2===0){const g=c.createLinearGradient(x,h*.12,w*.5,h*.7);g.addColorStop(0,a.glow+'0d');g.addColorStop(1,'transparent');poly(c,[[x-3,h*.12],[x+3,h*.12],[w*.5+100,h*.72],[w*.5-100,h*.72]],g,null)}
    }
    for(let i=0;i<5;i++)line(c,[[0,h*(.22+i*.065)],[w,h*(.22+i*.065)]],'#879b6320',1);
    c.save();c.textAlign='center';c.fillStyle=a.glow+'26';c.font=`800 ${Math.round(w*.06)}px "Barlow Condensed", Impact`;c.fillText('IRON FIST ARENA',w/2,h*.35);c.font=`600 ${Math.round(w*.008)}px Barlow, sans-serif`;c.fillStyle='#b8c9a33b';c.fillText(game.tier===0?'KINETIC CONTAINMENT FACILITY  /  SECTOR 07':'SUB-LEVEL 02  /  STRUCTURAL INTEGRITY COMPROMISED',w/2,h*.39);c.restore();
    const vertices=[[-4.5,-3.3],[4.5,-3.3],[6,-1.8],[6,1.8],[4.5,3.3],[-4.5,3.3],[-6,1.8],[-6,-1.8]];
    // Rear walls, separated per segment to show persistent damage.
    for(let i=0;i<8;i++){
      const p=vertices[i],q=vertices[(i+1)%8];if((p[1]+q[1])/2>0)continue;
      this.wall(c,project,p,q,game.walls[i],a,scale,false);
    }
    poly(c,vertices.map(([x,z])=>project(x,z)),grad(c,0,h*.5,0,h,a.floor,'#182218'),a.edge+'88',2);
    c.save();c.beginPath();vertices.forEach(([x,z],i)=>{const p=project(x,z);i?c.lineTo(...p):c.moveTo(...p)});c.closePath();c.clip();
    for(let x=-6;x<=6;x+=.5)line(c,[project(x,-3.4),project(x,3.4)],a.edge+(Number.isInteger(x)?'17':'09'),1);
    for(let z=-3.5;z<=3.5;z+=.5)line(c,[project(-6,z),project(6,z)],a.edge+(Number.isInteger(z)?'17':'09'),1);
    // Tournament floor insignia and wear.
    c.save();const center=project(0,0);c.translate(...center);c.scale(1,.37);c.strokeStyle=a.edge+'50';c.lineWidth=1.5;c.beginPath();c.arc(0,0,scale*2.1,0,TAU);c.stroke();c.setLineDash([8,12]);c.beginPath();c.arc(0,0,scale*2.3,0,TAU);c.stroke();c.setLineDash([]);c.fillStyle=a.glow+'0c';c.font=`900 ${scale*2.0}px "Barlow Condensed",Impact`;c.textAlign='center';c.fillText('K',0,scale*.72);c.restore();
    for(let i=0;i<90;i++){const x=Math.sin(i*19.7)*6,z=Math.cos(i*13.3)*3.4;line(c,[project(x,z),project(x+.08,z+.15)],'#afbb9310',1)}
    if(game.tier===1)for(let i=0;i<8;i++){const x=Math.sin(i*4)*5,z=Math.cos(i*3)*3;line(c,[project(x,z),project(x+.2,z+.4),project(x-.2,z+.8)],'#060e08aa',2)}
    for(const zone of game.zones){const [zx,zy]=project(zone.x,zone.z);const rad=zone.radius*scale;const alpha=Math.min(1,zone.life/60);c.globalAlpha=alpha;ellipse(c,zx,zy,rad,rad*.37,'#fb7a2938','#ffb443aa',1);for(let i=0;i<10;i++){const an=i*2.4+this.time*.5,px=zx+Math.cos(an)*rad*.75,py=zy+Math.sin(an)*rad*.25;poly(c,[[px-3,py],[px+Math.sin(this.time*4+i)*3,py-10-(i%3)*5],[px+4,py]],'#ffad5999',null)}c.globalAlpha=1;}
    c.restore();
    // Foreground boundary is low, leaving fighting silhouettes unobstructed.
    for(let i=0;i<8;i++){const p=vertices[i],q=vertices[(i+1)%8];if((p[1]+q[1])/2<=0)continue;this.wall(c,project,p,q,game.walls[i],a,scale,true)}
    const actors=[...game.fighters].sort((a,b)=>a.z-b.z);
    for(const f of actors){
      const [x,y]=project(f.x,f.z,f.y),[sx,sy]=project(f.x,f.z);const size=scale*(f.data.id==='glaciolith'?.0086:f.data.id==='terrakhan'?.0083:.0080);
      ellipse(c,sx,sy,scale*.52,scale*.18,'#050c0bbb');
      if(f.clone){const [cx,cy]=project(f.clone.x,f.clone.z);c.save();c.globalAlpha=.26;drawCreature(c,f.data,cx,cy,size,f.face,{attack:.1},this.time,{aura:true,shadow:false});c.restore()}
      if(f.install>0)glow(c,x,y-scale*1.2,scale*1.6,'#ff885033');
      if(f.frost>0){glow(c,x,y-scale*.5,scale*.9,'#80eaff22');for(let i=0;i<3;i++)poly(c,[[x-20+i*18,y],[x-16+i*18,y-25],[x-9+i*18,y]],'#b1efff66',null)}
      const m=f.attack,attack=m?Math.max(0,Math.sin(Math.min(1,m.frame/(m.move.startup+m.move.active+8))*Math.PI)):0;
      c.save();if(f.knockdown>0){c.translate(x,y-scale*.1);c.rotate(f.face*1.3);drawCreature(c,f.data,0,0,size*.9,f.face,{hit:1},this.time,{shadow:false})}
      else drawCreature(c,f.data,x,y,size,f.face,{attack,hit:f.flash>0,guard:f.blocking,walk:f.walkPhase,air:f.y>.1},this.time,{shadow:false,aura:f.armor>0||f.rage});c.restore();
      if(f.blocking){c.save();c.globalAlpha=.4;const bx=x+f.face*scale*.55;c.strokeStyle='#d0f5a6';c.lineWidth=2;c.beginPath();c.ellipse(bx,y-scale*.9,scale*.17,scale*.75,-f.face*.2,0,TAU);c.stroke();c.restore()}
      if(f.techWindow>0){c.font=`700 ${Math.round(scale*.22)}px Barlow`;c.fillStyle='#f7f7cf';c.textAlign='center';c.fillText('U · BREAK THROW',x,y-scale*2.6)}
      if(this.hitboxes){const r=f.data.hurt;c.strokeStyle='#6bf5c9';c.lineWidth=1;const [hx,hy]=project(f.x-r.radius,f.z,f.y+r.height);c.strokeRect(hx,hy,r.radius*2*scale,r.height*scale);if(m&&m.frame>=m.move.startup&&m.frame<m.move.startup+m.move.active){c.fillStyle='#ff775944';c.strokeStyle='#ff7759';const start=project(f.x,f.z,f.y+1.35);c.fillRect(start[0],start[1],f.face*m.move.range*scale,scale*.65);c.strokeRect(start[0],start[1],f.face*m.move.range*scale,scale*.65)}}
      // In-arena name plates.
      c.fillStyle=f.side===0?'#d2fa59':'#ff9d7b';c.font=`700 ${Math.max(8,scale*.13)}px Barlow`;c.textAlign='center';c.fillText(f.side===0?'▼ P1':'▼ CPU',x,y-scale*(f.data.hurt.height+1));
    }
    for(const p of game.projectiles){const [x,y]=project(p.x,p.z,p.y||.8);glow(c,x,y,scale*.35,p.color+'77');ellipse(c,x,y,scale*.28,scale*.07,p.color);line(c,[[x-p.face*scale*.65,y],[x,y]],p.color+'99',4)}
    this.effects=this.effects.filter(e=>e.age<.8);for(const e of this.effects){if(!game.paused)e.age+=dt;const [x,y]=project(e.x||0,e.z||0,e.y||1);const t=e.age,col=e.type==='block'?'#aee8ff':e.type==='parry'?'#c8ff99':e.type==='break'?'#e1ff8c':'#fff2bc';c.save();c.globalAlpha=Math.max(0,1-t*2);for(let i=0;i<12;i++){const a=i*TAU/12+t*1.3,r=(10+t*120)*(i%2?1:.6);line(c,[[x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.5],[x+Math.cos(a)*r,y+Math.sin(a)*r]],col,i%3?1.5:3)}c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.arc(x,y,scale*(.1+t*1.7),0,TAU);c.stroke();c.restore()}
    if(game.cinematic>0){c.fillStyle='#050a06df';c.fillRect(0,0,w,h*.15);c.fillRect(0,h*.86,w,h*.14);c.fillStyle='#dfff92';c.textAlign='center';c.font=`800 ${Math.max(20,w*.035)}px "Barlow Condensed",Impact`;c.fillText(game.cinematicName.toUpperCase(),w/2,h*.82)}
    const vignette=c.createRadialGradient(w/2,h/2,h*.25,w/2,h/2,w*.7);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#03080399');c.fillStyle=vignette;c.fillRect(0,0,w,h);c.restore();
  }
  wall(c,p,a,b,hp,arena,scale,front){
    if(hp<=0)return;const height=front?.16:.52;
    const points=[p(...a),p(...b),p(b[0],b[1],height),p(a[0],a[1],height)];
    poly(c,points,front?'#121c11':grad(c,0,points[2][1],0,points[0][1],'#4c5b33','#1c2919'),arena.edge+'66',1);
    line(c,[points[2],points[3]],arena.glow+(hp<50?'55':'bb'),front?3:2);
    if(hp<70){const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];line(c,[p(mid[0]-.3,mid[1],height),p(mid[0],mid[1],height*.4),p(mid[0]+.2,mid[1],height*.7),p(mid[0]+.5,mid[1],0)],'#071006',2)}
    if(!front)for(let i=1;i<8;i++){const k=i/8,x=a[0]+(b[0]-a[0])*k,z=a[1]+(b[1]-a[1])*k;line(c,[p(x,z,.05),p(x,z,height*.8)],'#a7b67c22',1)}
  }
}
