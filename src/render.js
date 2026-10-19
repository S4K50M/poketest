import { drawCreature } from './creatures.js';
export { drawCreature } from './creatures.js';


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
