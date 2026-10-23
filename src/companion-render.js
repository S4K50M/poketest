// Signature geometry mirrors each companion's actual field shape. Rendering is
// read-only; it cannot extend an effect, change damage or move a collision body.
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const line=(c,pts,col,w=2)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();};
const curve=(c,pts,col,w=2)=>{c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();};
const poly=(c,pts,col,edge,w=1)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}};
const oval=(c,x,y,rx,ry,col,edge,w=1)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}};
const arc=(c,x,y,r,start,end,col,w=2)=>{c.beginPath();c.arc(x,y,Math.max(.1,r),start,end);c.strokeStyle=col;c.lineWidth=w;c.stroke();};
const gem=(c,x,y,r,col,edge)=>poly(c,[[x,y-r],[x+r*.55,y],[x,y+r],[x-r*.55,y]],col,edge);
const alpha=(color,a)=>{const h=typeof color==='string'?color.replace('#','').slice(0,6):'';return /^[\da-f]{6}$/i.test(h)?`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${clamp(a)})`:`rgba(201,236,223,${clamp(a)})`;};
function glow(c,x,y,r,col,p=.2){const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,alpha(col,p));g.addColorStop(1,alpha(col,0));oval(c,x,y,r,r,g);}
function feather(c,x,y,size,angle,col){c.save();c.translate(x,y);c.rotate(angle);poly(c,[[0,-size],[-size*.4,-size*.3],[-size*.15,size],[size*.4,size*.2],[size*.3,-size*.4]],col);line(c,[[0,-size],[0,size]],'#edfff0',.8);c.restore();}
function bolt(c,x,y,dx,dy,col,w=2){const points=[];for(let i=0;i<7;i++){const p=i/6,j=i===0||i===6?0:Math.sin(i*2.17)*9;points.push([x+dx*p-dy*.02*j,y+dy*p+dx*.02*j]);}line(c,points,col,w);}

function magma(c,f,t){
 const r=f.radius;oval(c,0,-2,r,12,'#3c2927','#e6954b',1.2);oval(c,0,-4,r*.85,6,'#ec97554d');
 for(let i=0;i<7;i++){const x=(i/6-.5)*r*1.65,p=(t*.8+i*.21)%1;curve(c,[x-12,-4,x-3,-12,x+7,-7,x+16,-5],'#ffd09499',1);oval(c,x,-4-p*8,1.5+p*3,1+p*1.8,'#ffcd7c88');if(i%2===0)poly(c,[[x-7,-3],[x-4,-20-p*17],[x+5,-12],[x+8,-4]],'#ed9b6d99');}
}
function lightning(c,f,t){
 const r=f.radius;oval(c,0,-3,r,13,null,'#dfff7077',1.5);
 for(const side of[-1,1]){const x=side*r*.68;poly(c,[[x-6,-1],[x-4,-28],[x+5,-32],[x+8,-1]],'#73825c','#e6ff8f');oval(c,x,-26,4,4,'#efffb7');}
 for(let i=0;i<3;i++)bolt(c,-r*.65,-27-i*4,r*1.3,Math.sin(t*13+i)*12,'#e8ff8d'+(i?'55':'bb'),i?1:2.1);
 glow(c,0,-22,r*.5,'#e7ff7e',.11);
}
function icewall(c,f,t){
 const w=f.width,h=f.height;oval(c,0,-1,w*.8,10,'#4f748a55');
 for(let i=0;i<5;i++){const x=(i/4-.5)*w*.88,high=h*(.72+(i%2)*.15+(i===2?.13:0));poly(c,[[x-w*.19,0],[x-w*.16,-high*.7],[x,-high],[x+w*.15,-high*.76],[x+w*.2,0]],i%2?'#9edddd77':'#c0f5f599','#e4ffffbb',1.3);line(c,[[x,-high],[x-3,-high*.43],[x+6,-high*.2],[x,0]],'#f2ffffaa',1);}
 for(let i=0;i<4;i++)gem(c,(i-1.5)*w*.22,-h*.2-i*23,3,'#ecffff');
}
function vortex(c,f,t){
 const r=f.radius,cy=-r*.55;glow(c,0,cy,r,'#b9ead9',.11);oval(c,0,-3,r*.72,12,null,'#c9fbe777',1);
 for(let i=0;i<6;i++){const a=t*3+i*TAU/6,x=Math.cos(a)*r*.8,y=cy+Math.sin(a)*r*.38;curve(c,[x,y,x*.2-r*.3,cy-r*.18,-x*.3,cy+r*.42,-x,y+30],'#e4fff2'+(i%2?'66':'aa'),1.3);feather(c,Math.cos(a+.2)*r*.55,cy+Math.sin(a+.2)*r*.45,7,a,'#b8e4cd');}
}
function fault(c,f,t){
 const w=f.width;oval(c,0,-2,w*.52,8,'#18342e55');
 for(let i=0;i<9;i++){const x=(i/8-.5)*w,high=f.height*(.3+(i%3)*.2);poly(c,[[x-w*.07,0],[x-w*.03,-high*.64],[x+3,-high],[x+w*.07,-high*.2],[x+w*.09,0]],i%2?'#698563':'#3e5b4b','#a4c58a',1.2);line(c,[[x-5,-4],[x+1,-high*.45],[x+7,-high*.4]],'#d2efaa',1.4);}
}
function shadowtrap(c,f,t){
 const r=f.radius;oval(c,0,-3,r,14,'#33263c77','#ba8be055',1.5);oval(c,0,-3,r*.74,9,null,'#cf9dea88',1);
 for(let i=0;i<6;i++){const a=i*TAU/6+t*.45,x=Math.cos(a)*r*.8,y=-4+Math.sin(a)*12;gem(c,x,y,4,'#d7b0ea');}
 // A phantom paw over the mark distinguishes a trap from generic ground DoT.
 const yy=-31+Math.sin(t*2)*4;poly(c,[[-23,yy+8],[-26,yy-13],[-9,yy-6],[-5,yy-26],[8,yy-9],[24,yy-21],[21,yy+11],[4,yy+20]],'#a16bbb44','#ddaeed99',1.3);
}
function tide(c,f,t){
 const r=f.radius;oval(c,0,-2,r,13,'#79d6e731','#a9eff288',1);
 for(let i=0;i<5;i++){const x=-r+(i/4)*r*2,phase=t*4+i;curve(c,[x-18,-4,x-4,-20-Math.sin(phase)*5,x+14,-18,x+30,-5],'#bffaffaa',1.4);}
 for(let i=0;i<4;i++){const x=(Math.sin(t*2+i)*.5)*r;oval(c,x,-9-i*5,2+i%2,2+i%2,null,'#ddffff99');}
}
function beam(c,f,t){
 const w=f.width,h=f.height,face=f.face===-1?-1:1;c.save();c.scale(face,1);
 poly(c,[[0,-35-h*.5],[w,-35-h*.18],[w,-35+h*.18],[0,-35+h*.5]],'#c3e5ea33','#e9f9f488',1.2);line(c,[[0,-35],[w,-35]],'#fff3db',3);
 for(let i=0;i<3;i++){const x=((t*1.8+i*.33)%1)*w;oval(c,x,-35,5,h*.45,null,'#f3beae77',1.2);}
 c.restore();
}
const FIELD_ART={magma,lightning,icewall,vortex,fault,shadowtrap,tide,beam};

/** Draw simulation-owned field geometry. Returns the number of fields drawn. */
export function drawCompanionFields(c,g,time=0,{reducedMotion=false}={}){
 if(!c||!g)return 0;let count=0;const t=reducedMotion?0:finite(time);
 for(const record of g.companionFields||[]){
  if(!record||!FIELD_ART[record.type]||!Number.isFinite(record.x)||!Number.isFinite(record.y)||record.life<=0)continue;
  const f={...record,radius:Math.max(1,finite(record.radius,80)),width:Math.max(1,finite(record.width,160)),height:Math.max(1,finite(record.height,60)),color:record.color||'#c0e5dc'};
  c.save();try{c.translate(f.x,f.y);c.globalAlpha*=clamp(finite(f.life,1)/Math.min(18,Math.max(1,finite(f.maxLife,18))),.18,1);FIELD_ART[f.type](c,f,t);count++;}finally{c.restore();}
 }
 return count;
}

/** A brief authored flourish for the real L cast, including casts without fields.
 * progress is normalized host time; reduced motion keeps a readable still. */
export function drawCompanionSignature(c,event,progress=0,time=0,{reducedMotion=false}={}){
 const id=event?.id;if(!c||!['pyrojaw','voltantis','glaciolith','zephyrix','terrakhan','noxshade','aqualance','ferrodrake'].includes(id)||!Number.isFinite(event.x)||!Number.isFinite(event.y))return false;
 const p=reducedMotion?.45:clamp(finite(progress)),t=reducedMotion?0:finite(time),col=event.color||'#d1efdc',v=event.variant||'neutral',dir=event.face===-1?-1:1,extent=24+p*70;
 c.save();try{
  c.translate(event.x,event.y);c.scale(dir,1);c.globalAlpha*=Math.max(0,1-p)*.8;
  if(v==='up'){c.translate(0,-18);c.rotate(-Math.PI*.18);}else if(v==='back'){c.scale(-1,1);}else if(v==='down')c.translate(0,20);else if(v==='forward'){c.translate(16,-2);c.scale(1.14,.92);}
  if(id==='pyrojaw'){
   for(let i=0;i<5;i++){const x=14+i*12+p*42,high=24+Math.sin(i*2)*10;poly(c,[[x-8,-20],[x-7,-high-43],[x+1,-high-68],[x+9,-34],[x+16,-20]],i%2?'#ffc387':'#e7874f');}glow(c,47,-44,extent,col,.2);
  }else if(id==='voltantis'){
   for(let i=0;i<3;i++)bolt(c,12,-42-i*7,extent*(1+i*.18),-18+i*22,'#f0ff99',i?1.2:2.3);
   arc(c,28,-42,extent*.6,-1.5,.8,'#dbff73',3);
  }else if(id==='glaciolith'){
   for(const side of[-1,1])for(let i=0;i<3;i++){const x=side*(28+i*12+p*15),y=-30-i*8;poly(c,[[x-9,y],[x-5,y-25],[x+1,y-47],[x+10,y]],'#a8eced77','#effff5',1.2);}
   curve(c,[-50,-33,-27,-70,38,-70,56,-32],'#ceffff',2.3);
  }else if(id==='zephyrix'){
   for(let i=0;i<3;i++){const r=extent*.7+i*8;arc(c,12,-43,r,-2.2+p,.6+p,'#dcfff1',2-i*.35);feather(c,12+Math.cos(i+p)*r,-43+Math.sin(i+p)*r,8,i,'#a7dcc6');}
  }else if(id==='terrakhan'){
   for(let i=0;i<7;i++){const x=(i-3)*13,y=-3-p*8;poly(c,[[x-9,y],[x-5,y-12],[x+1,y-31-i%2*12],[x+11,y]],i%2?'#8aa26d':'#4d7153','#d0eab1',1.3);}oval(c,0,-3,extent,8,null,'#d8edaa88',2);
  }else if(id==='noxshade'){
   for(let i=0;i<3;i++)curve(c,[12,-28-i*7,45,-55-i*7,38+p*49,-17-i*9,82+p*29,-48-i*8],'#d9aff4',2.4-i*.4);
   for(const side of[-1,1])gem(c,side*extent*.5,-43,6,'#f4cbff');
  }else if(id==='aqualance'){
   const x=extent+20;poly(c,[[11,-37],[x,-45],[x+18,-41],[x,-36]],'#e5ffffbb','#f5ffff',1.3);for(let i=0;i<3;i++)curve(c,[14,-40+i*5,42,-18+i*3,52,-61+i*3,x,-40+i*4],'#91e6edaa',1.5);
  }else{
   for(const side of[-1,1]){const x=side*27,y=-65;oval(c,x,y,15,17,null,'#e4ece4',2);for(let i=0;i<4;i++){const a=t*8+i*TAU/4;line(c,[[x+Math.cos(a)*5,y+Math.sin(a)*5],[x+Math.cos(a+.6)*13,y+Math.sin(a+.6)*13]],'#d6e9df',1.5);}curve(c,[x,y+15,x-8,y+38,x+8,y+40,x,y+extent],'#f0b3a4',4);}
   line(c,[[16,-43],[extent+39,-43]],'#fff0cf',2);
  }
 }finally{c.restore();}
 return true;
}
