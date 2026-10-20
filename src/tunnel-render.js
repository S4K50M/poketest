// Cavern scenery is drawn behind the fixed collision surfaces. Receding rock
// buttresses attach the one-way shelves to the far wall; only the bright shelf
// edge describes a landing surface. Nothing here changes traversal geometry.
const TAU=Math.PI*2;
const noise=n=>{const a=Math.sin(n*127.1+37)*43758.5453;return a-Math.floor(a);};
const polygon=(c,points,fill,stroke,width=1)=>{c.beginPath();for(const [i,p]of points.entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
const stroke=(c,points,color,width=1)=>{c.beginPath();for(const[i,p]of points.entries())i?c.lineTo(...p):c.moveTo(...p);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
const ellipse=(c,x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=color;c.fill();};
const glow=(c,x,y,r,color)=>{const gradient=c.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');ellipse(c,x,y,r,r,gradient);};
const PALETTES={
 moss:{void:'#071415',back:'#112727',wall:'#183331',shadow:'#0c1d20',stone:'#35483e',face:'#26372f',edge:'#7f9a75',vein:'#8fb795',light:'#b9e5b3'},
 forge:{void:'#160f12',back:'#2a1c1c',wall:'#3b2925',shadow:'#1c1719',stone:'#55433c',face:'#382b28',edge:'#a8896b',vein:'#e08c4f',light:'#ffc68e'},
 reef:{void:'#07151d',back:'#102b35',wall:'#1b3b43',shadow:'#0b202a',stone:'#40585a',face:'#263f46',edge:'#9ebbb0',vein:'#78bcbf',light:'#a5ede5'},
 storm:{void:'#10111d',back:'#222534',wall:'#333a49',shadow:'#161d2b',stone:'#505361',face:'#343a4c',edge:'#9f9eb8',vein:'#a29ac7',light:'#ded1ff'},
 frost:{void:'#101d29',back:'#1e3442',wall:'#304d5a',shadow:'#192c3c',stone:'#566a71',face:'#354b5b',edge:'#b7d5d4',vein:'#a5d4e5',light:'#dcf7ff'},
 rift:{void:'#160e1d',back:'#291f32',wall:'#3a2c43',shadow:'#201528',stone:'#514257',face:'#33283d',edge:'#a08fba',vein:'#c18aaa',light:'#f8b7d8'},
};
export const tunnelPalette=biome=>PALETTES[biome]||PALETTES.moss;
export const isTunnel=game=>game.room.biome!=='sanctuary';

function arch(c,x,y,width,height,color,edge){
 c.beginPath();c.moveTo(x-width,y+height);c.lineTo(x-width,y);c.bezierCurveTo(x-width,y-height*.75,x+width,y-height*.75,x+width,y);c.lineTo(x+width,y+height);c.closePath();c.fillStyle=color;c.fill();
 if(edge){c.strokeStyle=edge;c.lineWidth=8;c.stroke();}
}
function ceilingAt(g,x){
 const nearby=g.platforms.filter(p=>!p.veil&&x>=p.x-210&&x<=p.x+p.w+210);
 const top=Math.min(...(nearby.length?nearby:g.platforms).map(p=>p.y));
 return top-310-26*noise(Math.floor(x/110)+g.roomId.length);
}

export function drawTunnelBackdrop(c,g,camX,camY,width,height,t){
 const p=tunnelPalette(g.room.biome),background=c.createLinearGradient(0,0,0,height);
 background.addColorStop(0,p.void);background.addColorStop(.58,p.back);background.addColorStop(1,p.void);c.fillStyle=background;c.fillRect(0,0,width,height);
 // Broad sediment planes form a continuous chamber wall. Their diagonal
 // facets and curved seams replace the outdoor tree/sky silhouettes.
 c.save();c.translate(-camX*.18,-camY*.12);
 const originX=Math.floor(camX*.18/240)*240,originY=Math.floor(camY*.12/170)*170;
 for(let row=-2;row<8;row++)for(let n=-2;n<Math.ceil(width/240)+3;n++){
  const x=originX+n*240+(row%2)*90,y=originY+row*170,seed=(n+1)*31+row*17;
  const top=y-15-noise(seed)*28,bottom=y+155+noise(seed+1)*35;
  const facet=[[x-30,top+15],[x+99,top-10],[x+236,top+21],[x+260,bottom-31],[x+144,bottom+9],[x+17,bottom-2]];
  polygon(c,facet,noise(seed+4)>.5?p.wall+'60':p.shadow+'60');
  stroke(c,[[x-30,top+15],[x+99,top-10],[x+236,top+21]],p.vein+'16',1.2);
  stroke(c,[[x+236,top+21],[x+219,top+65],[x+235,top+100]],p.void+'80',1.6);
  stroke(c,[[x+14,top+65],[x+42,top+82],[x+35,top+110]],p.vein+'11',1);
 }
 c.restore();
 // Dark arched recesses open into deeper tunnels. Sparse openings at a lower
 // contrast read as excavations rather than an endless forest of columns.
 const spacing=630,offset=(camX*.32)%spacing;
 for(let i=-1;i<Math.ceil(width/spacing)+1;i++){
  const x=i*spacing-offset,y=240+noise(Math.floor(camX*.32/spacing)+i+63)*90;
  c.save();c.globalAlpha=.72;arch(c,x,y,93,290,p.shadow,p.wall);
  arch(c,x+8,y+16,64,280,p.void);c.restore();
  for(let stone=0;stone<7;stone++){
   const angle=Math.PI+stone*Math.PI/6,xx=x+Math.cos(angle)*99,yy=y+Math.sin(angle)*73;
   polygon(c,[[xx-19,yy-12],[xx+14,yy-17],[xx+22,yy+9],[xx-12,yy+14]],p.wall,p.vein+'0e');
  }
 }
 // Horizontal mineral seams, chipped plaster and distant tool scars.
 for(let layer=0;layer<8;layer++){
  const y=(layer*121-camY*.2)%920-90,points=[];
  for(let n=-1;n<Math.ceil(width/145)+2;n++)points.push([n*145-(camX*.27)%145,y+Math.sin(n*.75+layer*2)*24+noise(n+layer*17)*17]);
  stroke(c,points,p.vein+'12',layer%3===0?2:1);
 }
 if(g.room.biome==='forge'||g.room.biome==='storm')for(let i=-1;i<Math.ceil(width/300)+1;i++){
  const x=i*300-(camX*.4)%300;
  polygon(c,[[x-25,-50],[x+18,-50],[x+27,height+40],[x-36,height+40]],p.shadow+'aa');
  stroke(c,[[x-12,90],[x+14,82],[x+8,120],[x-17,136]],p.vein+'18',2);
 }
 // Light comes from small wall fissures; it pools locally instead of bleaching
 // the whole scene, keeping enemies, bolts and the player readable.
 for(let i=-1;i<Math.ceil(width/310)+2;i++){
  const tile=Math.floor(camX/310)+i,x=tile*310-camX,y=170+noise(tile+53)*260;
  glow(c,x,y,135,p.light+'0b');
  if(g.room.biome==='forge'){stroke(c,[[x,y-37],[x-10,y],[x+4,y+40]],'#ef8d4040',2);glow(c,x,y,35,'#f49d4d25');}
  else if(g.room.biome==='reef'||g.room.biome==='moss'){
   for(let n=0;n<4;n++)ellipse(c,x+Math.sin(n*3)*18,y+n*5,2.5,1.5,p.light+'42');
  }else if(g.room.biome==='frost'){polygon(c,[[x,y+26],[x+8,y-20],[x+19,y+14],[x+11,y+33]],p.vein+'32');}
  else if(g.room.biome==='rift'){stroke(c,[[x-10,y-40],[x+8,y-10],[x-2,y+12],[x+13,y+42]],p.vein+'38',2);}
 }
}

// The principal route is a horizontal passage excavated through the rear wall.
// Its roof is recessed scenery: the higher shelf network remains visible in
// front of it, and no foreground rock covers a creature or a landing edge.
function drawGroundPassage(c,g,camX,camY,width,height,t){
 if(!Number.isFinite(g.room.tunnelCeiling)||camY+height<g.room.tunnelCeiling-30||camY>560)return;
 const p=tunnelPalette(g.room.biome),roof=g.room.tunnelCeiling,floor=520;
 const left=Math.max(0,camX-100),right=Math.min(g.worldWidth,camX+width+100);
 // Long stone soffits and their undercut lip distinguish the walkable tunnel
 // below from the optional galleries that wind higher through the rock.
 const opening=c.createLinearGradient(0,roof-110,0,floor);
 opening.addColorStop(0,p.void+'e0');opening.addColorStop(.25,p.shadow+'cf');opening.addColorStop(1,p.back+'10');
 c.fillStyle=opening;c.fillRect(left,roof-110,right-left,floor-roof+110);
 const spacing=560,start=Math.floor(left/spacing)-1,end=Math.ceil(right/spacing)+1;
 for(let n=start;n<=end;n++){
  const x=n*spacing,peak=roof-28-noise(n+g.roomId.length)*22;
  // A broad barrel-vault rim sits behind the play plane. The open centre
  // carries through into the next chamber instead of ending above a chasm.
  c.beginPath();c.moveTo(x-18,floor);c.lineTo(x-18,roof+116);
  c.bezierCurveTo(x+54,peak,x+spacing-54,peak,x+spacing+18,roof+116);
  c.lineTo(x+spacing+18,floor);c.strokeStyle=p.shadow+'d9';c.lineWidth=39;c.stroke();
  c.beginPath();c.moveTo(x-8,floor);c.lineTo(x-8,roof+115);
  c.bezierCurveTo(x+60,peak+15,x+spacing-60,peak+15,x+spacing+8,roof+115);
  c.lineTo(x+spacing+8,floor);c.strokeStyle=p.stone+'72';c.lineWidth=11;c.stroke();
  for(let j=0;j<9;j++){
   const a=Math.PI+(j+.5)*Math.PI/9,xx=x+spacing/2+Math.cos(a)*(spacing/2-8),yy=roof+110+Math.sin(a)*110;
   polygon(c,[[xx-17,yy-11],[xx+14,yy-15],[xx+21,yy+7],[xx-12,yy+13]],p.wall+'b0',p.vein+'16');
  }
  // Stone risers continue into the ground, giving the floor an attached wall
  // edge rather than a sequence of separate suspended rectangles.
  for(let j=0;j<5;j++){
   const y=roof+148+j*36;
   polygon(c,[[x-25,y-14],[x+12,y-17],[x+20,y+13],[x-21,y+17]],p.wall+'c0',p.stone+'32');
  }
  const lampX=x+spacing*.5,lampY=roof+66;
  if(lampX>left-50&&lampX<right+50){
   stroke(c,[[lampX,peak+29],[lampX,lampY]],p.edge+'35',1);
   glow(c,lampX,lampY+6,95,p.light+'10');
   if(g.room.biome==='forge'){
    polygon(c,[[lampX-9,lampY+7],[lampX-7,lampY-7],[lampX+7,lampY-7],[lampX+9,lampY+7]],p.stone,p.edge+'55');
    ellipse(c,lampX,lampY,4,6,'#f9bc7b');
   }else{
    for(let j=0;j<3;j++)ellipse(c,lampX+(j-1)*8,lampY+Math.sin(j+t*.4)*3,2.5,1.5,p.light+'70');
   }
  }
 }
 // A continuous recessed skirting ledge runs beside the real floor. It is
 // deliberately darker and thinner than the actual collision lip above it.
 stroke(c,[[left,floor-9],[right,floor-9]],p.wall,12);
 stroke(c,[[left,floor-16],[right,floor-16]],p.vein+'24',1.3);
}

// The first gate is a stack of inhabited galleries rather than a row of
// suspended steps. These recesses sit in the rear wall, so a real landing edge
// always stays in front of the architecture and no decorative wall blocks play.
function drawLandingNetwork(c,g,camX,camY,width,height,t){
 if(!g.room.climbNetwork)return;
 const p=tunnelPalette(g.room.biome),visible=g.platforms.filter(s=>s.y<520&&!s.veil&&(s.landing||s.catch)&&s.x+s.w>camX-100&&s.x<camX+width+100&&s.y>camY-60&&s.y<camY+height+130);
 for(const shelf of visible){
  const height=shelf.catch?96:126,roof=shelf.y-height,x=shelf.x,w=shelf.w;
  // Shallow carved rooms put a quiet horizontal band behind each wide terrace.
  polygon(c,[[x-17,shelf.y+15],[x-12,roof+33],[x+23,roof],[x+w-29,roof-7],[x+w+12,roof+27],[x+w+20,shelf.y+15]],p.shadow+'d9');
  stroke(c,[[x-12,roof+33],[x+23,roof],[x+w-29,roof-7],[x+w+12,roof+27]],p.stone+'92',7);
  stroke(c,[[x-5,shelf.y-11],[x+w+4,shelf.y-11]],p.vein+'29',1.3);
  const bays=Math.max(1,Math.floor(w/180));
  for(let n=0;n<bays;n++){
   const xx=x+w*(n+.5)/bays;
   arch(c,xx,shelf.y-52,Math.min(36,w/bays*.24),54,p.void+'ac',p.wall);
   // Warm seed lamps distinguish usable landings from far background strata.
   if(!shelf.catch||n%2===0){
    glow(c,xx,shelf.y-38,45,p.light+'12');
    ellipse(c,xx,shelf.y-38,2.2,3.6,'#d4e6baaa');
    stroke(c,[[xx,roof+10],[xx,shelf.y-46]],p.edge+'33',1);
   }
  }
  // Upright root piers connect lower landings back into the wall without
  // extending solid-looking wedges over the next route below.
  for(const side of[-1,1]){
   const xx=side<0?x+9:x+w-9,root=side<0?-1:1;
   stroke(c,[[xx,shelf.y+8],[xx+root*9,shelf.y+43],[xx+root*3,shelf.y+86]],p.wall,13);
   stroke(c,[[xx,shelf.y+8],[xx+root*9,shelf.y+43],[xx+root*3,shelf.y+86]],p.edge+'28',2);
   if(shelf.catch)for(let leaf=0;leaf<3;leaf++)ellipse(c,xx+root*(6+leaf*3),shelf.y+20+leaf*14,6,2,'#71916b55');
  }
  if(shelf.landing){
   const xx=x+w*.27,yy=roof+15;
   stroke(c,[[xx,yy],[xx-8,yy+24],[xx+4,yy+50]],'#526b4a77',2);
   ellipse(c,xx-5,yy+30,6,2,'#93ac7d66');
   ellipse(c,xx+3,yy+44,6,2,'#93ac7d66');
  }
 }
}

export function drawTunnelStructure(c,g,camX,camY,width,height,t){
 const p=tunnelPalette(g.room.biome),left=Math.max(0,Math.floor((camX-100)/90)*90),right=Math.min(g.worldWidth,camX+width+100);
 drawGroundPassage(c,g,camX,camY,width,height,t);
 const edge=[];for(let x=left;x<=right+90;x+=90)edge.push([x,ceilingAt(g,x)]);
 // The highest traversable ledge always has at least 280px headroom. These
 // ceiling masses follow a climb instead of closing across the jump corridor.
 const cap=camY-1200;polygon(c,[[left-100,cap],[right+190,cap],...edge.slice().reverse()],p.shadow);
 stroke(c,edge,p.stone+'b0',13);stroke(c,edge.map(([x,y])=>[x,y-8]),p.wall,17);
 for(let x=left;x<right;x+=113){
  const y=ceilingAt(g,x),length=18+noise(x+19)*55;
  polygon(c,[[x-18,y-9],[x+13,y-5],[x+3,y+length],[x-7,y+length*.7]],p.shadow,p.stone+'88');
  if(g.room.biome==='moss'){
   stroke(c,[[x,y+4],[x+8,y+55],[x-5,y+92+Math.sin(t*.5+x)*3]],'#52715a88',2);
   for(let j=0;j<3;j++)ellipse(c,x+5+j%2*5,y+40+j*17,6,2,'#68876777');
  }else if(g.room.biome==='frost')polygon(c,[[x-5,y+5],[x+5,y+3],[x+1,y+length+20]],'#b9e1e359');
 }
 drawLandingNetwork(c,g,camX,camY,width,height,t);
 // Shelves jut from out-of-plane wall buttresses. Their dark receding sides
 // connect them to rock without drawing pretend collision faces in the route.
 for(const shelf of g.platforms){
  if(shelf.veil||shelf.h>70||shelf.x+shelf.w<camX-120||shelf.x>camX+width+120||g.room.climbNetwork&&(shelf.landing||shelf.catch))continue;
  const depth=170+noise(shelf.x+shelf.y)*170,base=shelf.y+depth;
  c.save();c.globalAlpha=.9;
  polygon(c,[[shelf.x+6,shelf.y+14],[shelf.x+shelf.w-6,shelf.y+14],[shelf.x+shelf.w+100,base-28],[shelf.x+shelf.w*.65,base+70],[shelf.x-84,base]],p.wall);
  polygon(c,[[shelf.x+shelf.w*.66,shelf.y+20],[shelf.x+shelf.w+65,base-28],[shelf.x+shelf.w*.65,base+70]],p.shadow);
  for(let n=1;n<4;n++){const yy=shelf.y+depth*n/4;stroke(c,[[shelf.x-7-n*9,yy],[shelf.x+shelf.w*.42,yy+10],[shelf.x+shelf.w+15+n*8,yy-4]],p.vein+'14',2);}
  c.restore();
 }
 // Door niches make the entrances part of the excavated rock wall.
 for(const o of g.room.objects)if(['door','portal'].includes(o.kind)&&o.x>camX-130&&o.x<camX+width+130){
  const y=o.y??520;c.save();c.globalAlpha=.75;arch(c,o.x,y-74,47,75,p.void,p.stone+'55');c.restore();
 }
 // The far lateral walls stay outside player-width bounds and indicate the
 // edge of a chamber while all actual side collisions remain engine-owned.
 for(const x of [0,g.worldWidth])if(x>camX-65&&x<camX+width+65){const side=x?1:-1;polygon(c,[[x,camY-50],[x+side*90,camY-50],[x+side*90,camY+height+80],[x,camY+height+80],[x-side*6,camY+height*.64],[x,camY+height*.3]],p.shadow);}
 // Sparse drips and suspended stone dust continue through high/negative Y.
 for(let i=0;i<32;i++){
  const x=camX+noise(i+Math.floor(camX/250)*53)*width,y=camY+(noise(i+97)*height+t*(g.room.biome==='reef'?12:3))%height;
  if(i%7===0&&['moss','reef','frost'].includes(g.room.biome))stroke(c,[[x,y],[x-1,y+6]],p.light+'20',1);
  else ellipse(c,x,y,.6+noise(i)*.9,.6+noise(i)*.9,p.light+'22');
 }
}

export function drawTunnelPlatform(c,shelf,biome,t){
 const p=tunnelPalette(biome),{x,y,w,h}=shelf,depth=Math.max(12,h),seed=x+y;
 // Exact upper collision edge remains level, while rock edges underneath chip
 // and taper. Ground is a solid cliff; one-way shelves remain clearly narrow.
 const silhouette=[[x,y],[x+w,y],[x+w,y+Math.min(depth,17)]];
 for(let xx=x+w;xx>x;xx-=29)silhouette.push([Math.max(x,xx-9),y+depth*(.72+noise(xx+seed)*.28)]);
 silhouette.push([x,y+Math.min(depth,14)]);polygon(c,silhouette,p.face);
 c.save();c.beginPath();for(const[i,point]of silhouette.entries())i?c.lineTo(...point):c.moveTo(...point);c.closePath();c.clip();
 const shade=c.createLinearGradient(0,y,0,y+depth);shade.addColorStop(0,p.stone);shade.addColorStop(.15,p.face);shade.addColorStop(1,p.shadow);c.fillStyle=shade;c.fillRect(x,y,w,depth);
 for(let layer=0;layer<Math.ceil(depth/28);layer++){
  const yy=y+12+layer*29;
  stroke(c,[[x,yy],[x+w*.22,yy+4],[x+w*.59,yy-3],[x+w,yy+5]],p.edge+(layer%2?'0b':'14'),1);
 }
 for(let xx=x+13;xx<x+w;xx+=42){
  const yy=y+12+noise(xx)*Math.min(depth*.65,80),d=7+noise(xx+3)*16;
  stroke(c,[[xx-7,yy],[xx+3,yy+d],[xx-3,yy+d+12]],'#020b106b',1.4);
  stroke(c,[[xx+4,yy+d],[xx+20,yy+d+8]],p.edge+'20',1);
 }
 c.restore();
 // Slightly broken lip: readable stone rather than a neon platform outline.
 stroke(c,[[x,y+.5],[x+w,y+.5]],biome==='moss'&&shelf.catch?'#a8c89caa':p.edge+'b0',shelf.landing||shelf.catch?2.5:2);
 if(shelf.landing||shelf.catch){stroke(c,[[x+7,y+7],[x+w-7,y+7]],biome==='moss'&&shelf.catch?'#68866399':p.edge+'42',3);if(biome==='moss')for(let xx=x+20;xx<x+w-12;xx+=67)ellipse(c,xx,y+4,14,2,'#75916a88');}
 for(let xx=x+3;xx<x+w-2;xx+=19){const ww=Math.min(18,x+w-xx),chip=noise(xx+seed);polygon(c,[[xx,y+1],[xx+ww,y+1],[xx+ww-3,y+4+chip*4],[xx+4,y+3]],p.stone);}
 if(biome==='moss')for(let xx=x+9;xx<x+w-7;xx+=24){const n=noise(xx);ellipse(c,xx,y+2,9+n*5,2,'#69815f99');if(n>.65)stroke(c,[[xx,y+3],[xx+3,y+12],[xx-1,y+21]],'#596f5299',1.4);}
 else if(biome==='forge'){for(let xx=x+37;xx<x+w;xx+=87)stroke(c,[[xx,y+9],[xx-4,y+17],[xx+4,y+21]],'#d68a4d44',1.4);}
 else if(biome==='reef'){for(let xx=x+15;xx<x+w;xx+=53){ellipse(c,xx,y+6,8,2,'#779b9277');stroke(c,[[xx,y+4],[xx+4,y-5]],'#8bafaa44',1);}}
 else if(biome==='frost')stroke(c,[[x+4,y+2],[x+w*.31,y+4],[x+w*.78,y+2],[x+w-4,y+3]],'#cbe5e877',3);
 if(shelf.moving){for(const xx of[x+w*.25,x+w*.75]){stroke(c,[[xx,y+5],[xx+4,y-30],[xx,y-62]],p.edge+'55',2);for(let n=0;n<3;n++)ellipse(c,xx+(n%2)*3,y-15-n*17,3,6,p.stone);}}
}

export function drawRecoverySpring(c,point,t){
 const {x,y}=point,spent=point.used,light=spent?'#667d84':'#b8f3db';
 if(!spent){glow(c,x,y-28,95,'#a5eadb23');glow(c,x,y-20,34,'#e3fff139');}
 polygon(c,[[x-36,y-2],[x-31,y-18],[x-21,y-25],[x+27,y-22],[x+37,y-10],[x+30,y-2]],'#43514d','#748c7b');
 ellipse(c,x,y-18,28,8,spent?'#243b3b':'#77bfae');ellipse(c,x,y-19,23,4,spent?'#3a5350':'#c3f9df');
 for(const side of[-1,1]){polygon(c,[[x+side*25,y-14],[x+side*31,y-55],[x+side*38,y-31],[x+side*34,y-6]],'#55675b','#8ba78d66');stroke(c,[[x+side*30,y-27],[x+side*32,y-40]],light+'88',1.5);}
 if(!spent)for(let i=0;i<7;i++){const rise=(t*19+i*11)%63,xx=x+Math.sin(i*2+t)*18;ellipse(c,xx,y-23-rise,1+Math.sin(i+t)*.35,1.5,light+'b0');}
 c.font='600 8px Barlow, sans-serif';c.textAlign='center';c.fillStyle=spent?'#83938d':'#d7f4dd';c.fillText(spent?'SPRING QUIET':'RECOVERY SPRING',x,y-80);
}
