// The first gate has an authored visual rhythm: a warm inhabited threshold,
// living root galleries, the waterfall shaft, a ruined court, and a seed shrine.
// This module only paints. Landing surfaces remain the supplied platform data.
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const noise=n=>{const v=Math.sin(n*123.71+47.13)*43758.5453;return v-Math.floor(v);};
const SCENES=Object.freeze({
 sanctuary:{title:'The Last Lantern',sky:'#0d2330',depth:'#1c403c',bark:'#2e4a43',ink:'#0a1d26',moss:'#779d78',edge:'#c1d5a0',light:'#ffdc9b',mist:'#a6d8c5',mode:'village'},
 'moss-path':{title:'The Rootway',sky:'#10272e',depth:'#24473e',bark:'#365749',ink:'#102a2c',moss:'#779e68',edge:'#c5dba3',light:'#d5edac',mist:'#9fceb6',mode:'cathedral'},
 'moss-descent':{title:'Rootfall Cistern',sky:'#0d2631',depth:'#1b4146',bark:'#2c5050',ink:'#0b232c',moss:'#79a58a',edge:'#bdded0',light:'#a8eee3',mist:'#94d5d3',mode:'waterfall'},
 'moss-nexus':{title:'The Seedkeeper’s Court',sky:'#152b31',depth:'#2e4540',bark:'#405b49',ink:'#10272c',moss:'#8aa775',edge:'#d2dba5',light:'#f2df9b',mist:'#b6ceba',mode:'court'},
 'moss-ascent':{title:'The Returning Canopy',sky:'#193a3c',depth:'#355747',bark:'#44644e',ink:'#143032',moss:'#9ab479',edge:'#e2e4ad',light:'#f1e7b1',mist:'#cee1bd',mode:'canopy'},
 'moss-vault':{title:'The Buried Garden',sky:'#1a2230',depth:'#303b45',bark:'#3e4a50',ink:'#151e2c',moss:'#939c97',edge:'#c9d2b7',light:'#dfc2ee',mist:'#a8becd',mode:'vault'},
 'moss-heart':{title:'The Matron’s Bower',sky:'#1b2b25',depth:'#3b4e37',bark:'#4b6042',ink:'#15271f',moss:'#a5b47c',edge:'#e5deac',light:'#f6e5ad',mist:'#cbd9a7',mode:'heart'},
});
export const MOURNINGWILD_SCENES=SCENES;
const handled=g=>g?.room?.biome==='moss'||g?.room?.biome==='sanctuary';
const sceneFor=g=>SCENES[g.roomId||g.room.id]||(g.room.biome==='sanctuary'?SCENES.sanctuary:SCENES['moss-path']);
const clock=(g,t)=>g?.combat?.settings?.reducedMotion?0:finite(t);
function poly(c,p,fill,edge,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function oval(c,x,y,rx,ry,fill,edge,width=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}}
function line(c,p,col,width=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function curve(c,p,col,width=1){c.beginPath();c.moveTo(p[0],p[1]);c.bezierCurveTo(...p.slice(2));c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.stroke();}
function grad(c,x,y,x2,y2,...colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((col,i)=>g.addColorStop(i/(colors.length-1),col));return g;}
function glow(c,x,y,r,col,opacity=.15){c.save();c.globalAlpha*=opacity;const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);c.restore();}
function leaf(c,x,y,length,angle,col,light){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-length*.4,-length*.35,-length*.3,-length*.8,0,-length);c.bezierCurveTo(length*.4,-length*.75,length*.5,-length*.25,0,0);c.closePath();c.fillStyle=col;c.fill();if(light)line(c,[[0,-2],[0,-length*.85]],light,.7);c.restore();}
function fern(c,x,y,size,col,light,t=0){
 const lean=Math.sin(t*.7+x*.01)*size*.05;
 for(const side of[-1,1])for(let stem=0;stem<3;stem++){
  const reach=side*size*(.3+stem*.17),high=size*(.65-stem*.12);curve(c,[x,y,x+reach*.2,y-high*.5,x+reach*.5+lean,y-high*.9,x+reach+lean,y-high],col,Math.max(1,size*.027));
  for(let n=1;n<5;n++){const p=n/5,xx=x+reach*p+lean*p,yy=y-high*(2*p-p*p);leaf(c,xx,yy,size*.16*(1-p*.5),side*(.9+stem*.15),col,light);}
 }
}
function lantern(c,x,y,size,t,palette){
 line(c,[[x,y-size*1.2],[x,y-size*.45]],palette.edge+'77',1.1);
 glow(c,x,y,size*4.3,palette.light,.15+.025*Math.sin(t*2+x));
 poly(c,[[x-size*.55,y-size*.5],[x+size*.55,y-size*.5],[x+size*.7,y+size*.55],[x-size*.7,y+size*.55]],'#c1ae78',palette.ink,1.2);
 poly(c,[[x-size*.5,y-size*.4],[x+size*.5,y-size*.4],[x+size*.48,y+size*.4],[x-size*.48,y+size*.4]],grad(c,x-size,y,x+size,y,palette.light,'#dca65e'),null);
 line(c,[[x,y-size*.5],[x,y+size*.45]],palette.ink+'77',1);line(c,[[x-size*.68,y+size*.55],[x+size*.68,y+size*.55]],palette.light,.8);
 oval(c,x,y,size*.14,size*.3,'#fff5cf');
}
function tree(c,x,bottom,height,width,col,detail,phase=0){
 c.beginPath();c.moveTo(x-width,bottom);c.bezierCurveTo(x-width*.3,bottom-height*.24,x-width*.62,bottom-height*.73,x-width*.12,bottom-height);c.lineTo(x+width*.35,bottom-height-18);c.bezierCurveTo(x+width*.2,bottom-height*.6,x+width*.15,bottom-height*.22,x+width*1.3,bottom);c.closePath();c.fillStyle=col;c.fill();
 for(const side of[-1,1])for(let b=0;b<3;b++){const y=bottom-height*(.45+b*.18),reach=side*height*(.17+b*.025);curve(c,[x,y+30,x+reach*.24,y-19,x+reach*.5,y-48,x+reach,y-63-b*12],col,width*(.42-b*.08));}
 if(detail){curve(c,[x-width*.25,bottom-8,x-width*.16,bottom-height*.25,x+width*.12,bottom-height*.7,x,bottom-height+20],detail,1.3);for(let n=0;n<5;n++){const y=bottom-height*.16-n*height*.14;curve(c,[x-width*.36,y,x-width*.12,y-8,x+width*.18,y-2,x+width*.4,y-14],detail,.8);}}
 for(let i=0;i<7;i++){const px=x+Math.cos(i*1.6+phase)*height*.16,py=bottom-height*.78+Math.sin(i*1.8)*height*.12;oval(c,px,py,height*.17,height*.075,col);}
}
function rootVault(c,x,floor,width,top,p,t){
 for(const side of[-1,1]){
  const bx=x+side*width*.56;c.beginPath();c.moveTo(bx+side*25,floor+32);c.bezierCurveTo(bx-side*28,floor-65,bx+side*12,top+80,x+side*31,top);c.bezierCurveTo(x+side*5,top+20,bx-side*50,top+139,bx-side*40,floor+10);c.closePath();c.fillStyle=p.bark+'d4';c.fill();
  curve(c,[bx+side*6,floor+10,bx-side*44,floor-110,bx-side*7,top+90,x+side*32,top+16],p.edge+'26',2.4);
  for(let i=0;i<4;i++){const yy=top+95+i*66;curve(c,[bx-side*23,yy,bx-side*11,yy-20,bx+side*18,yy-11,bx+side*22,yy-34],p.ink+'70',2);}
  for(let i=0;i<5;i++)leaf(c,x+side*(48+i*28),top+23+i*9,18+noise(i+x)*13,side*1.15,p.moss+'80',p.edge+'25');
 }
 for(let i=0;i<3;i++){const xx=x+(i-1)*40,yy=top+58+Math.sin(t+i)*2;line(c,[[xx,top+19],[xx,yy-8]],p.moss+'4c',1);oval(c,xx,yy,4,7,p.light+'8c');}
}
function windowRose(c,x,y,r,p){
 glow(c,x,y,r*1.8,p.light,.055);oval(c,x,y,r,r,p.ink+'aa',p.bark,10);oval(c,x,y,r-9,r-9,null,p.edge+'35',1.3);
 for(let i=0;i<8;i++){const a=i*TAU/8;c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(0,-r+15);c.bezierCurveTo(-r*.3,-r*.45,-r*.15,-r*.16,0,0);c.bezierCurveTo(r*.15,-r*.16,r*.3,-r*.45,0,-r+15);c.closePath();c.fillStyle=i%2?p.light+'12':p.moss+'27';c.fill();c.strokeStyle=p.edge+'42';c.lineWidth=1.6;c.stroke();c.restore();}
 oval(c,x,y,r*.14,r*.14,p.light+'66',p.edge+'80',1);
}
function mushrooms(c,x,y,size,p,t){
 for(let i=0;i<4;i++){const xx=x+(i-1.5)*size*.55,h=size*(.6+noise(i+x)*.5);curve(c,[xx,y,xx-3,y-h*.3,xx+4,y-h*.65,xx,y-h],p.moss,Math.max(1,size*.08));
  c.beginPath();c.ellipse(xx,y-h,size*.43,size*.2,0,Math.PI,TAU);c.closePath();c.fillStyle=i%2?p.light+'a0':p.moss;c.fill();line(c,[[xx-size*.39,y-h],[xx+size*.39,y-h]],p.light+'99',1);for(let n=0;n<3;n++)oval(c,xx+(n-1)*size*.15,y-h-size*.08,1,1,p.light);}
 if(size>16)glow(c,x,y-size,size*1.6,p.light,.07+.015*Math.sin(t*1.4));
}
function village(c,p,t){
 tree(c,326,520,635,58,p.bark,p.edge+'22');
 for(const side of[-1,1])for(let i=0;i<3;i++)curve(c,[326+side*15,485,326+side*44,500,326+side*88,501,326+side*(130+i*42),526+i*9],p.bark,18-i*4);
 const x=326,y=255;
 curve(c,[x-120,y-144,x-68,y-174,x+109,y-110,x+85,y-43],p.bark,18);curve(c,[x-115,y-147,x-43,y-166,x+101,y-101,x+80,y-41],p.edge+'55',1.7);
 line(c,[[x+47,y-93],[x+47,y-12]],'#9fa78b',2);glow(c,x+47,y+38,160,p.light,.21);
 c.beginPath();c.moveTo(x+47,y-19);c.bezierCurveTo(x-9,y+4,x-5,y+85,x+47,y+107);c.bezierCurveTo(x+98,y+85,x+102,y+4,x+47,y-19);c.closePath();c.fillStyle=grad(c,x,y,x+95,y,p.light,'#f5c878','#826d48');c.fill();c.strokeStyle='#263d38';c.lineWidth=5;c.stroke();
 for(const side of[-1,1])curve(c,[x+47,y-11,x+47+side*11,y+29,x+47+side*12,y+64,x+47,y+100],'#746d4d',2);oval(c,x+47,y+44,9,18,'#fff2c1');
 // The workbench is framed by a little inhabited shelter, not a collision hut.
 const hx=740;c.beginPath();c.moveTo(hx-133,518);c.lineTo(hx-125,422);c.quadraticCurveTo(hx,344,hx+125,422);c.lineTo(hx+133,518);c.closePath();c.fillStyle=p.ink+'85';c.fill();
 curve(c,[hx-145,429,hx-76,341,hx+80,338,hx+150,429],p.bark,17);curve(c,[hx-144,424,hx-70,342,hx+82,344,hx+148,425],p.edge+'64',2);
 for(let i=0;i<7;i++){const xx=hx-119+i*40;line(c,[[xx,413],[xx+12,436]],p.light+'24',8);}
 for(const side of[-1,1])line(c,[[hx+side*125,425],[hx+side*132,521]],p.bark,15);
 lantern(c,hx-92,457,9,t,p);lantern(c,hx+92,457,9,t+.5,p);
 for(let i=0;i<4;i++){const xx=70+i*118;fern(c,xx,524,29+i%2*17,p.moss,p.edge+'33',t);}
}
function waterfall(c,x,top,bottom,width,p,t){
 const fall=grad(c,x-width/2,0,x+width/2,0,'#79b5b000','#99d7cc24','#d6f2df38','#74b7b21b','#79b5b000');c.fillStyle=fall;c.fillRect(x-width/2,top,width,bottom-top);
 for(let i=0;i<7;i++){const xx=x+(i-3)*width*.1;curve(c,[xx,top,xx+Math.sin(i)*8,top+(bottom-top)*.3,xx+Math.cos(i)*6,bottom-90,xx,bottom],p.light+(i%2?'24':'13'),1.5);}
 for(let i=0;i<11;i++){const phase=((t*.34+i*.091)%1+1)%1,yy=top+phase*(bottom-top);line(c,[[x+Math.sin(i*4)*width*.25,yy],[x+Math.sin(i*4)*width*.25+2,yy+16]],p.light+'45',1);}
 for(let i=0;i<4;i++)oval(c,x+(i-1.5)*width*.27,bottom-4,25+noise(i)*13,4,p.light+'12');glow(c,x,bottom-20,width*1.3,p.light,.08);
}
function bellRuin(c,x,floor,p){
 for(const side of[-1,1]){line(c,[[x+side*167,floor],[x+side*148,floor-207]],p.bark,30);poly(c,[[x+side*181,floor-207],[x+side*151,floor-256],[x+side*129,floor-211]],p.bark);curve(c,[x+side*148,floor-207,x+side*97,floor-280,x+side*42,floor-275,x+side*22,floor-286],p.bark,19);}
 const y=floor-140;c.beginPath();c.moveTo(x-59,y+38);c.quadraticCurveTo(x-38,y-22,x-38,y-61);c.quadraticCurveTo(x,y-92,x+38,y-61);c.quadraticCurveTo(x+37,y-19,x+62,y+37);c.closePath();c.fillStyle=grad(c,x-60,y,x+65,y,'#6f7760','#a9a47b','#3c594b');c.fill();c.strokeStyle=p.ink;c.lineWidth=4;c.stroke();
 poly(c,[[x+2,y-67],[x-7,y-29],[x+10,y-4],[x-5,y+34]],p.ink);oval(c,x,y+38,61,9,'#344b3e',p.edge+'67',2);line(c,[[x,y-78],[x+6,y-125]],'#7c9074',3);glow(c,x,y-25,90,p.light,.035);
 for(let i=0;i<5;i++)poly(c,[[x-95+i*43,floor],[x-83+i*43,floor-16-noise(i)*20],[x-54+i*43,floor-7],[x-52+i*43,floor+1]],p.bark,p.moss+'44');
}
function seedShrine(c,x,floor,p,t){
 const top=floor-410;
 for(const side of[-1,1]){
  curve(c,[x+side*297,floor+12,x+side*257,floor-211,x+side*171,top-21,x+side*13,top+1],p.bark,35);
  curve(c,[x+side*282,floor-4,x+side*239,floor-204,x+side*161,top-4,x+side*18,top+12],p.edge+'50',2);
  for(let i=0;i<5;i++){const xx=x+side*(38+i*42),yy=top+31+i*13;leaf(c,xx,yy,38,side*1.07,p.moss,p.edge+'55');}
 }
 const y=floor-258;glow(c,x,y,173,p.light,.11);
 for(let i=0;i<10;i++){const a=i*TAU/10;c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(0,-34);c.bezierCurveTo(-37,-46,-31,-101,0,-119);c.bezierCurveTo(32,-94,37,-49,0,-34);c.closePath();c.fillStyle=i%2?p.moss+'70':p.edge+'40';c.fill();c.strokeStyle=p.edge+'75';c.lineWidth=1.5;c.stroke();c.restore();}
 oval(c,x,y,44,66,grad(c,x-45,y-50,x+46,y+50,'#e8e6b0','#c6cd8d','#6d8b54'),p.ink,3);
 for(const side of[-1,1])curve(c,[x,y-60,x+side*36,y-20,x+side*26,y+36,x,y+61],p.bark,2);
 oval(c,x,y+2,6,17,'#fff0bc');for(let i=0;i<6;i++){const a=i*TAU/6+t*.15,xx=x+Math.cos(a)*146,yy=y+Math.sin(a)*111;oval(c,xx,yy,2,2,p.light+'b0');}
}

/** Screen-space parallax, continuous through negative-height galleries. */
export function drawMourningwildBackdrop(c,g,camX,camY,width,height,time=0){
 if(!handled(g))return false;const p=sceneFor(g),t=clock(g,time),w=Math.max(1,finite(width,1280)),h=Math.max(1,finite(height,660)),cx=finite(camX),cy=finite(camY);
 c.save();try{
  c.fillStyle=grad(c,0,0,0,h,p.sky,p.depth,p.ink);c.fillRect(0,0,w,h);
  const skyX=w*.64-cx*.025,skyY=h*.21-cy*.015;glow(c,skyX,skyY,Math.min(w*.43,360),p.mist,.09);
  if(p.mode==='village'||p.mode==='canopy'){oval(c,skyX,skyY,38,38,'#e0e7cb24');oval(c,skyX+11,skyY-7,34,34,p.sky);}
  for(let layer=0;layer<3;layer++){
   const spacing=250+layer*105,parallax=.05+layer*.075,offset=cx*parallax,start=Math.floor(offset/spacing)-2;
   for(let i=start;i<start+Math.ceil(w/spacing)+5;i++){
    const x=i*spacing-offset,base=h+90-cy*parallax*.22,height=430+noise(i+layer*99)*310,width=17+layer*9;
    tree(c,x,base,height,width,[p.depth+'88',p.ink+'58',p.bark+'3d'][layer],layer===2?p.edge+'0c':null,i);
   }
  }
  // Carved root tracery and distant loops have no bright, walkable top edge.
  for(let i=0;i<4;i++){const yy=h*.31+i*101-cy*.075;curve(c,[-80,yy,w*.22,yy-210,w*.73,yy+95,w+70,yy-112],p.mist+'0d',2);}
  for(let i=0;i<4;i++){
   const x=(i*.31+.1)*w-cx*.018;c.save();c.globalAlpha=.023;c.fillStyle=p.light;c.beginPath();c.moveTo(x-10,-40);c.lineTo(x+32,-40);c.lineTo(x+225,h+80);c.lineTo(x+104,h+80);c.closePath();c.fill();c.restore();
  }
  if(p.mode==='waterfall'){
   const x=w*.64-(cx*.19)%470;waterfall(c,x,-100,h+60,110,p,t);waterfall(c,x+440,-80,h+40,48,p,t+.4);
  }
  if(p.mode==='vault')for(let i=0;i<7;i++){const x=i*240-(cx*.16)%240,y=h*.6+noise(i+21)*120;oval(c,x,y,58,104,p.ink+'54');windowRose(c,x,y-26,39,{...p,bark:p.bark+'88'});}
  // Suspended seeds and sparse leaves replace uniform screen-filling glitter.
  for(let i=0;i<28;i++){
   const x=((noise(i+83)*w-cx*.075+t*(i%2?1.7:-1.1))%(w+50)+w+50)%(w+50)-25,y=((noise(i+93)*h-cy*.09+t*(1+noise(i)*3))%(h+80)+h+80)%(h+80)-40;
   if(i%4===0)leaf(c,x,y,5+noise(i)*4,Math.sin(t*.3+i)*.6,p.edge+'50');else{oval(c,x,y,i%3===0?1.4:.8,i%3===0?1.4:.8,p.light+'55');if(i%7===0)glow(c,x,y,12,p.light,.08);}
  }
  const fog=grad(c,0,h*.5,0,h,'#b8d7c000',p.mist+'09',p.ink+'20');c.fillStyle=fog;c.fillRect(0,h*.5,w,h*.5);
 }finally{c.restore();}return true;
}

/** World-space room landmarks; draw before platforms, entities and hazards. */
export function drawMourningwildLandmarks(c,g,camX,camY,viewWidth,viewHeight,time=0){
 if(!handled(g))return false;const p=sceneFor(g),t=clock(g,time),left=finite(camX)-250,right=finite(camX)+finite(viewWidth,1200)+250,top=finite(camY)-150,bottom=finite(camY)+finite(viewHeight,660)+150,near=(x,r=280)=>x+r>left&&x-r<right;
 c.save();try{
  if(p.mode==='village'){
   if(near(430,450)&&bottom>0)village(c,p,t);
   for(const o of g.room.objects||[])if(o.kind==='portal'&&near(o.x,100)&&bottom>330&&top<550){
    rootVault(c,o.x,520,150,355,p,t);windowRose(c,o.x,375,20,p);for(const side of[-1,1])mushrooms(c,o.x+side*65,523,12,p,t);
   }
  }else{
   const spacing=p.mode==='canopy'?760:680,start=Math.floor(left/spacing),end=Math.ceil(right/spacing),roof=p.mode==='heart'?95:p.mode==='court'?155:p.mode==='vault'?180:150;
   if(top<550&&bottom>roof-80)for(let i=start;i<=end;i++)rootVault(c,i*spacing+spacing*.5,520,spacing*.8,roof+noise(i+13)*36,p,t);
   // Root columns extend into the upper paths, so climbing remains inside a
   // connected living structure rather than emerging into an empty backdrop.
   if(top<220)for(let i=Math.floor(left/740);i<=Math.ceil(right/740);i++){
    const x=i*740+145;tree(c,x,555,1310,29,p.bark+'70',p.edge+'17',i);
    for(let n=-3;n<2;n++){const y=n*230+80;curve(c,[x-3,y,x+95,y-50,x+153,y-124,x+231,y-104],p.bark+'70',17);for(let k=0;k<3;k++)leaf(c,x+104+k*41,y-76-k*15,23,.8,p.moss+'45',p.edge+'16');}
   }
   if(p.mode==='cathedral'){
    for(const x of[610,1420,2160])if(near(x,120)&&bottom>40&&top<380)windowRose(c,x,221,88,p);
    if(near(2380,190)&&bottom>180)rootVault(c,2370,520,300,229,{...p,bark:'#526248',edge:'#dddaa2'},t);
   }else if(p.mode==='waterfall'){
    for(const x of[760,1690,2610])if(near(x,120))waterfall(c,x,-780,520,x===1690?130:60,p,t);
    if(near(640,260)&&top<400){for(const side of[-1,1])fern(c,640+side*145,500,86,p.moss+'77',p.edge+'27',t);}
   }else if(p.mode==='court'){
    for(const x of[560,2110])if(near(x,250)&&bottom>90&&top<540)bellRuin(c,x,520,p);
    if(near(1470,190)&&bottom>0)windowRose(c,1460,205,107,p);
   }else if(p.mode==='canopy'){
    for(const[x,y]of[[560,93],[1320,-265],[2080,-518]])if(near(x,180)&&y+180>top&&y-180<bottom){windowRose(c,x,y,91,p);curve(c,[x-130,y+135,x-123,y-4,x+124,y-4,x+132,y+135],p.bark,17);}
   }else if(p.mode==='vault'){
    for(const x of[460,1110,1820,2530])if(near(x,160)&&top<540){windowRose(c,x,356,70,p);mushrooms(c,x,520,36,p,t);}
    if(near(1940,300)&&bottom>100){for(const side of[-1,1])curve(c,[1940+side*230,516,1940+side*193,359,1940+side*117,249,1940+side*12,244],p.bark,24);}
   }else if(p.mode==='heart'){
    if(near(1230,400)&&bottom>0&&top<540)seedShrine(c,1230,520,p,t);
    if(near(360,180)&&top<540){windowRose(c,360,307,64,p);mushrooms(c,352,521,27,p,t);}
   }
   // Embedded gardens sit on the true lower floor, never across its edge.
   if(top<550&&bottom>455)for(let i=Math.floor(left/230);i<=Math.ceil(right/230);i++){
    const x=i*230+37;if(i%3===0)mushrooms(c,x,522,p.mode==='vault'?25:14,p,t);else fern(c,x,524,25+noise(i+17)*19,p.moss+'70',p.edge+'25',t);
   }
  }
 }finally{c.restore();}return true;
}

/** Exact collision lip, with bark and masonry supporting the authored shelf. */
export function drawMourningwildPlatform(c,platform,g,time=0){
 if(!handled(g)||platform.bossOwner)return false;const p=sceneFor(g),x=platform.x,y=platform.y,w=platform.w,h=Math.max(1,platform.h||24),t=clock(g,time),ground=y===520&&w>600;
 c.save();try{
  if(!ground&&!platform.solid){
   const mid=x+w*.5,depth=clamp(w*.2,32,80);
   // Narrow branching roots attach the shelf to its rear wall. Broad filled
   // wedges would compete with the deliberately dense recovery galleries.
   for(const side of[-1,1]){
    const rootX=mid+side*Math.min(w*.31,95);curve(c,[rootX,y+h-2,rootX-side*17,y+h+17,mid+side*19,y+h+depth*.55,mid+side*8,y+h+depth],p.bark+'a0',9);
    curve(c,[rootX-side*3,y+h-1,rootX-side*19,y+h+16,mid+side*15,y+h+depth*.55,mid+side*7,y+h+depth-5],p.edge+'24',1.1);
   }
   for(let n=0;n<2;n++){const xx=mid+(n?22:-22);curve(c,[xx,y+h+9,xx-13,y+h+39,xx+8,y+h+55,xx-2,y+h+depth+17],p.moss+'55',1.7);}
  }
  c.fillStyle=grad(c,0,y,0,y+Math.min(h,170),p.bark,p.ink);c.fillRect(x,y,w,h);
  const count=Math.min(28,Math.ceil(w/47));
  for(let i=0;i<count;i++){const xx=x+i*w/count,ww=w/count;poly(c,[[xx,y+4],[xx+ww*.7,y+2],[xx+ww,y+12],[xx+ww*.72,y+Math.min(h-1,25)],[xx+ww*.2,y+Math.min(h,30)]],i%2?p.moss+'19':p.edge+'10');line(c,[[xx+ww*.74,y+8],[xx+ww*.51,y+Math.min(h,27)]],p.ink+'80',1);}
  c.fillStyle=p.moss+'aa';c.fillRect(x,y,w,3);line(c,[[x,y+.5],[x+w,y+.5]],platform.catch?p.light:p.edge,ground?2.7:2.2);line(c,[[x+2,y+5],[x+w-2,y+5]],p.edge+'38',.8);
  if(ground){
   const shade=grad(c,0,y+10,0,y+180,'#071b1900',p.ink+'dd');c.fillStyle=shade;c.fillRect(x,y+10,w,h-10);
   for(let i=0;i<Math.min(22,Math.ceil(w/93));i++){const xx=x+26+i*93;curve(c,[xx,y+30,xx-12,y+57,xx+30,y+88,xx+14,y+144],p.moss+'20',2);}
  }else for(const side of[0,1]){const xx=x+(side?w-13:13);leaf(c,xx,y+3,11,side?.9:-.9,p.moss,p.edge+'30');}
  for(let i=0;i<Math.min(14,Math.floor(w/42));i++){const xx=x+17+i*42,hh=4+noise(i+x)*5;line(c,[[xx,y],[xx+Math.sin(t*1.1+i)*2,y-hh]],p.moss,1.1);}
 }finally{c.restore();}return true;
}

/** Edge framing only: no foreground strip covers the playable center. */
export function drawMourningwildForeground(c,g,camX,camY,viewWidth,viewHeight,time=0){
 if(!handled(g))return false;const p=sceneFor(g),t=clock(g,time),cx=finite(camX),cy=finite(camY),w=finite(viewWidth,1200),h=finite(viewHeight,660);
 c.save();try{
  c.globalAlpha=.56;
  fern(c,cx-31,cy+h+25,101,p.ink,p.bark+'66',t*.6);fern(c,cx+w+33,cy+h+28,110,p.ink,p.bark+'66',t*.6);
  // Delicate hanging leaves at the very edge avoid hiding upper landing lips.
  for(const side of[0,1]){const x=cx+(side?w+17:-16);curve(c,[x,cy-18,x+(side?-17:17),cy+19,x+(side?-26:26),cy+43,x+(side?-14:14),cy+75],p.ink,4);for(let i=0;i<4;i++)leaf(c,x+(side?-i*3:i*3),cy+4+i*16,17,side?-.8:.8,p.bark+'aa');}
 }finally{c.restore();}return true;
}
