// World-space landmarks make room identities legible before the first fight.
// These are recessed architecture, never additional invisible collision walls.
const TAU=Math.PI*2;
const COLORS={sanctuary:['#c7b67f','#38534a','#b7d8ba'],moss:['#9eae79','#355446','#c4e0a5'],forge:['#af8257','#48302d','#ffd196'],reef:['#7faeb0','#234651','#a2e6dd'],storm:['#b8abd0','#3b3658','#e0d0ff'],frost:['#abcdd4','#385867','#d5f4f4'],rift:['#c39ac0','#48324f','#f0c3e5']};
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
function line(c,points,col,w=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
function curve(c,pts,col,w=1){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();}
function poly(c,points,col,edge,w=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
function oval(c,x,y,rx,ry,col,edge,w=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
function ring(c,x,y,r,col,w=1){oval(c,x,y,r,r,null,col,w);}
function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,col+'27');g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);}
function arch(c,x,y,w,h,stone,edge){c.beginPath();c.moveTo(x-w,y);c.lineTo(x-w,y-h*.6);c.bezierCurveTo(x-w,y-h*1.25,x+w,y-h*1.25,x+w,y-h*.6);c.lineTo(x+w,y);c.strokeStyle=stone;c.lineWidth=17;c.stroke();c.strokeStyle=edge;c.lineWidth=2;c.stroke();}
function gear(c,x,y,r,col,dark,teeth=12,turn=0){
 c.save();c.translate(x,y);c.rotate(turn);
 for(let i=0;i<teeth;i++){const a=i*TAU/teeth;c.save();c.rotate(a);poly(c,[[-r*.12,-r*.8],[-r*.1,-r*1.1],[r*.1,-r*1.1],[r*.12,-r*.8]],dark,col,1);c.restore();}
 oval(c,0,0,r*.88,r*.88,dark,col,4);ring(c,0,0,r*.64,col+'99',2);oval(c,0,0,r*.14,r*.14,col);
 for(let i=0;i<6;i++){const a=i*TAU/6;line(c,[[Math.cos(a)*r*.18,Math.sin(a)*r*.18],[Math.cos(a)*r*.65,Math.sin(a)*r*.65]],col+'88',r*.06);}
 c.restore();
}
function clock(c,x,y,r,col,dark,turn=0){
 oval(c,x,y,r,r,dark,col,5);ring(c,x,y,r*.87,col+'99',2);
 for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[x+Math.cos(a)*r*.75,y+Math.sin(a)*r*.75],[x+Math.cos(a)*r*.86,y+Math.sin(a)*r*.86]],col,i%3===0?3:1);}
 c.save();c.translate(x,y);c.rotate(turn);line(c,[[0,0],[-r*.14,-r*.67]],col,4);line(c,[[0,0],[r*.51,r*.2]],col,3);c.restore();
}
function bell(c,x,y,s,col,dark,inverted=false){c.save();c.translate(x,y);if(inverted)c.scale(1,-1);c.scale(s,s);poly(c,[[-62,0],[-47,-32],[-39,-111],[-21,-137],[21,-137],[39,-111],[47,-32],[62,0]],dark,col,3);oval(c,0,0,63,11,dark,col,2);line(c,[[0,-137],[0,-184]],col,3);oval(c,0,5,10,13,col);c.restore();}
function books(c,x,y,w,h,col,dark){poly(c,[[x,y],[x+w,y],[x+w,y-h],[x,y-h]],dark,col,2);for(let row=0;row<4;row++){
 const yy=y-h+row*h/4;line(c,[[x,yy],[x+w,yy]],col+'77',3);for(let n=0;n<7;n++){const xx=x+8+n*(w-16)/7;poly(c,[[xx,yy+8],[xx+12,yy+6],[xx+14,yy+h/4-4],[xx+1,yy+h/4-4]],n%2?col+'55':col+'88');}}
}
function root(c,x,y,h,col,w=14,side=1){curve(c,[x,y,x+side*80,y-h*.25,x-side*55,y-h*.7,x+side*27,y-h],col,w);for(let i=1;i<4;i++)curve(c,[x,y-h*i/4,x+side*40,y-h*i/4-14,x+side*100,y-h*i/4-30,x+side*125,y-h*i/4-57],col,w*.45);}
function leaf(c,x,y,r,col){poly(c,[[x-r,y],[x-r*.35,y-r*.4],[x+r,y-r*.25],[x+r*.4,y+r*.35]],col);}
function crystal(c,x,y,w,h,col,dark){poly(c,[[x-w*.5,y],[x-w*.4,y-h*.45],[x,y-h],[x+w*.4,y-h*.6],[x+w*.5,y],[x,y-h*.15]],dark,col,2);line(c,[[x,y-h],[x,y-h*.15]],col+'88',1);}
function ribs(c,x,y,r,col,dark,n=6){for(let i=0;i<n;i++){
 const z=i/(n-1),w=r*(.35+Math.sin(z*Math.PI)*.65),yy=y-z*r*1.7;
 for(const side of[-1,1])curve(c,[x+side*w,yy+45,x+side*w*.8,yy-65,x+side*w*.4,yy-80,x,yy-25],dark,19-z*7);
 for(const side of[-1,1])curve(c,[x+side*w,yy+45,x+side*w*.8,yy-65,x+side*w*.4,yy-80,x,yy-25],col+'77',2);
}line(c,[[x,y],[x,y-r*1.8]],col+'55',8);}
function vessel(c,x,y,r,col,dark,light,t){
 oval(c,x,y-r*.7,r,r*.7,dark,col,3);oval(c,x,y-r*.7,r*.75,r*.45,null,col+'77',1);oval(c,x,y-r*.7,r*.3,r*.31,light+'66');glow(c,x,y-r*.7,r,light);
 line(c,[[x-r*.7,y-r*.2],[x-r*.85,y],[x+r*.85,y],[x+r*.7,y-r*.2]],col,8);
}
function landmark(c,m,t,palette){
 const [col,dark,light]=palette,id=m.kind;
 c.save();c.translate(m.x,m.y);c.scale(m.scale||1,m.scale||1);c.globalAlpha*=.76;
 // Floors and bright collision lips belong to the terrain renderer. Every
 // landmark stops just behind them, with no decorative ledge at feet height.
 if(id==='lantern-village'){for(const side of[-1,1])arch(c,side*165,-15,102,255,dark,col+'66');glow(c,0,-230,150,light);}
 else if(id==='root-organ'){
  for(let i=0;i<7;i++){const x=(i-3)*53,h=250+Math.cos(i*.8)*110;root(c,x,15,h,dark,18,i%2?1:-1);oval(c,x,-h,13,28,dark,col+'99',2);}
 }else if(id==='seed-aqueduct'){
  for(let i=0;i<3;i++)arch(c,(i-1)*145,-5,70,280+i%2*70,dark,col+'88');
  for(let i=0;i<5;i++){const xx=(i-2)*21;line(c,[[xx,-350],[xx,-21]],light+'24',7);for(let n=0;n<4;n++){const y=-340+(t*42+n*80)%320;line(c,[[xx,y],[xx,y+17]],light+'66',1);}}
 }else if(id==='seed-court'){
  arch(c,0,0,230,350,dark,col);for(let i=0;i<6;i++){const a=i*TAU/6;oval(c,Math.cos(a)*125,-200+Math.sin(a)*90,28,42,dark,col,2);}oval(c,0,-200,38,58,light+'55',col,2);
 }else if(id==='canopy-rings'){
  for(let i=0;i<3;i++){const x=(i-1)*80,y=-70-i*105;oval(c,x,y,180-i*22,45,null,col+'99',8);root(c,x,y,150,dark,15,i%2?1:-1);}
 }else if(id==='root-eggs'||id==='seed-hollow'){
  for(let i=0;i<5;i++){const x=(i-2)*67,y=-25-i%2*47;root(c,x+15,20,225+i%3*31,dark,12);oval(c,x,y-60,31,55,dark,col+'88',2);oval(c,x-5,y-71,10,27,light+'22');}
 }else if(id==='living-cage'){
  ribs(c,0,0,230,col,dark,5);oval(c,0,-190,41,66,light+'55',col,3);for(let i=0;i<7;i++)leaf(c,(i-3)*40,-290+i%2*25,24,col+'88');
 }else if(id==='furnace-wheel'){
  gear(c,0,-180,155,col,dark,16,t*.06);for(const side of[-1,1]){line(c,[[side*190,-350],[side*190,-25],[side*100,-25]],dark,26);line(c,[[side*190,-350],[side*190,-25],[side*100,-25]],col+'88',2);}
 }else if(id==='iron-pistons'){
  for(let i=0;i<4;i++){const x=(i-1.5)*100,h=190+i%2*130;poly(c,[[x-24,-16],[x-24,-h],[x+24,-h],[x+24,-16]],dark,col,2);line(c,[[x,-h],[x,-h-80]],col+'aa',8);poly(c,[[x-49,-h-78],[x+49,-h-78],[x+49,-h-105],[x-49,-h-105]],dark,col,2);}
 }else if(id==='four-crucibles'||id==='sun-kilns'){
  const count=id==='four-crucibles'?4:3;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*130;arch(c,x,-5,55,230+i%2*70,dark,col+'88');vessel(c,x,-40,44,col,dark,light,t);}
 }else if(id==='hanging-bells'||id==='inverted-bells'){
  for(let i=0;i<3;i++){const x=(i-1)*145,y=-110-i%2*95;bell(c,x,y,.95+i%2*.25,col,dark,id==='inverted-bells');}
 }else if(id==='saint-furnace'){
  arch(c,0,-5,190,360,dark,col);poly(c,[[-140,-35],[-120,-210],[-65,-270],[65,-270],[120,-210],[140,-35]],'#241c23',col,3);for(let i=0;i<7;i++)line(c,[[-100+i*33,-44],[-90+i*30,-225]],col+'77',4);glow(c,0,-125,140,light);
 }else if(id==='tidal-lock'){
  for(const side of[-1,1])line(c,[[side*205,5],[side*205,-340],[side*120,-340]],dark,37);gear(c,0,-185,135,col,dark,8,-t*.04);line(c,[[-130,-185],[130,-185]],light+'66',4);
 }else if(id==='archive-coil'){
  books(c,-220,-20,110,285,col,dark);books(c,110,-20,110,285,col,dark);for(let i=0;i<5;i++){const r=165-i*27;oval(c,0,-180,r,r*.63,null,col+'77',3);}line(c,[[-180,-180],[180,-180]],light+'66',1);
 }else if(id==='reading-vaults'){
  for(let i=0;i<3;i++){const x=(i-1)*170;arch(c,x,-4,76,270+i%2*60,dark,col);books(c,x-49,-15,98,160+i%2*65,col,dark);}
 }else if(id==='book-bridge'||id==='paper-moon-bridge'){
  for(let i=0;i<7;i++){const x=(i-3)*70,y=-130-Math.sin(i/6*Math.PI)*110;poly(c,[[x-43,y],[x-37,y-63],[x+38,y-72],[x+45,y]],dark,col,2);for(let n=0;n<4;n++)line(c,[[x-27,y-16-n*10],[x+27,y-20-n*10]],col+'77',1);}
  if(id==='paper-moon-bridge')oval(c,0,-350,78,78,light+'44',col,3);
 }else if(id==='siphon-reservoir'){
  for(let i=0;i<3;i++){const x=(i-1)*165;vessel(c,x,-20,68,col,dark,light,t);curve(c,[x,-120,x-30,-270,x+25,-315,x+62,-330],col,9);}
 }else if(id==='archive-jaws'){
  ribs(c,0,0,225,col,dark,6);for(const side of[-1,1])books(c,side*170-45,-18,90,250,col,dark);
 }else if(id==='wind-organ'){
  for(let i=0;i<11;i++){const x=(i-5)*38,h=170+Math.sin(i/10*Math.PI)*205;line(c,[[x,-15],[x,-h]],dark,25);line(c,[[x-5,-25],[x-5,-h+10]],col+'99',2);oval(c,x,-h,12,5,dark,col,2);}
 }else if(id==='choir-lofts'){
  for(let i=0;i<4;i++){const x=(i-1.5)*130,y=-55-(i%2)*110;arch(c,x,y,55,195,dark,col);for(let n=0;n<5;n++)line(c,[[x-37+n*18,y],[x-37+n*18,y-120]],col+'66',2);}
 }else if(id==='wind-corkscrew'){
  for(let i=0;i<8;i++){const y=-25-i*43,x=Math.sin(i*.8)*95;oval(c,x,y,140-i*5,19,null,col+'99',5);line(c,[[x-100,y],[x+95,y-20]],light+'33',1);}
 }else if(id==='giant-tuning-fork'){
  curve(c,[-105,-355,-130,-150,-90,-100,0,-95],dark,27);curve(c,[105,-355,130,-150,90,-100,0,-95],dark,27);line(c,[[0,-95],[0,5]],dark,28);curve(c,[-105,-355,-130,-150,-90,-100,0,-95],col+'aa',3);curve(c,[105,-355,130,-150,90,-100,0,-95],col+'aa',3);ring(c,0,-230,83,light+'44',2);
 }else if(id==='storm-cage'){
  arch(c,0,0,220,365,dark,col);for(let i=0;i<7;i++){const x=(i-3)*46;line(c,[[x,-40],[x-11,-130],[x+8,-190],[x-4,-280]],col+'88',2);}glow(c,0,-190,145,light);
 }else if(id==='fallen-planetarium'||id==='winter-astrolabe'||id==='empty-cradle-stars'){
  oval(c,0,-200,180,180,dark,col,4);for(let i=0;i<3;i++){c.save();c.translate(0,-200);c.rotate(i*1.05+.2);oval(c,0,0,153,45+i*14,null,col+'88',2);c.restore();}for(let i=0;i<8;i++){const a=i*TAU/8;crystal(c,Math.cos(a)*135,-200+Math.sin(a)*135,10,24,light,dark);}if(id==='empty-cradle-stars')vessel(c,0,-35,58,col,dark,light,t);
 }else if(id==='frozen-river'){
  for(let i=0;i<5;i++)curve(c,[-240,-30-i*70,-100,-200-i*35,80,40-i*90,250,-95-i*58],col+'77',10-i);for(let i=0;i<7;i++)crystal(c,(i-3)*70,-15,35,70+i%3*45,col,dark);
 }else if(id==='clock-escapement'){
  gear(c,-85,-105,110,col,dark,10,-t*.025);gear(c,92,-270,93,col,dark,9,t*.03);line(c,[[-85,-105],[92,-270]],col+'77',8);
 }else if(id==='reverse-clock'||id==='clock-cathedral'){
  const r=id==='clock-cathedral'?180:145;clock(c,0,-r-30,r,col,dark,id==='reverse-clock'?-t*.075:0);for(const side of[-1,1])arch(c,side*190,-12,42,210,dark,col+'77');
 }else if(id==='frozen-pendulum'){
  arch(c,0,0,230,390,dark,col);const a=Math.sin(t*.35)*.04;line(c,[[0,-370],[Math.sin(a)*270,-100]],col,5);gear(c,Math.sin(a)*270,-100,65,col,dark,8,0);
 }else if(id==='world-spine')ribs(c,0,0,210,col,dark,7);
 else if(id==='fracture-jaws'){
  for(const side of[-1,1])for(let i=0;i<5;i++){const x=side*(55+i*33),y=-20-i*66;poly(c,[[x,y],[x+side*75,y-24],[x+side*70,y-90],[x-side*25,y-77]],dark,col+'99',2);}
 }else if(id==='inverted-throne'){
  poly(c,[[-180,-340],[-145,-205],[-80,-170],[-40,-40],[40,-40],[80,-170],[145,-205],[180,-340]],dark,col,3);for(let i=0;i<5;i++)crystal(c,(i-2)*53,-207,38,120+i%2*40,col,dark);
 }else if(id==='unwritten-stair'){
  for(let i=0;i<9;i++){const x=(i%2?1:-1)*(70+i*10),y=-30-i*40;poly(c,[[x-60,y],[x-50,y-22],[x+62,y-27],[x+55,y-4]],dark,col+'99',2);line(c,[[x-35,y-11],[x+35,y-15]],light+'44',1);}
 }else if(id==='six-locks'){
  for(let i=0;i<6;i++){const a=i*TAU/6,x=Math.cos(a)*140,y=-195+Math.sin(a)*125;oval(c,x,y,32,42,dark,col,3);oval(c,x,y-4,5,9,col);line(c,[[x,y+4],[x,y+18]],col,4);}ring(c,0,-195,91,col+'66',2);
 }else if(id==='open-worldheart'){
  ribs(c,0,0,210,col,dark,5);vessel(c,0,-90,90,col,dark,light,t);for(let i=0;i<7;i++){const a=i*TAU/7;crystal(c,Math.cos(a)*130,-200+Math.sin(a)*100,24,46,col,dark);}
 }else if(id==='twin-greenhouse'){
  for(const side of[-1,1]){bell(c,side*125,-55,1.1,col,dark);root(c,side*110,-90,200,light+'99',6,-side);}arch(c,0,0,70,370,dark,col);
 }
 c.restore();
}

/** Must be called in world coordinates, behind platforms and actors. */
export function drawRoomIdentity(c,g,camX=0,camY=0,viewWidth=1280,viewHeight=660,time=0){
 if(!c||!g?.room?.layout)return false;
 const palette=COLORS[g.room.biome]||COLORS.moss,t=g.combat?.settings?.reducedMotion?0:finite(time),left=finite(camX)-380,right=finite(camX)+finite(viewWidth,1280)+380,top=finite(camY)-400,bottom=finite(camY)+finite(viewHeight,660)+450;
 c.save();try{for(const m of g.room.layout.landmarks||[])if(m.x>left&&m.x<right&&m.y>top&&m.y-500<bottom)landmark(c,m,t,palette);}finally{c.restore();}
 return true;
}
