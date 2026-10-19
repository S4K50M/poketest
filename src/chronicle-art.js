// The Unwritten Choir: original procedural rigs, drawn in world space.
// These effects never change simulation state and keep every canvas mutation local.
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const seed=value=>String(value??0).split('').reduce((n,ch)=>(n*31+ch.charCodeAt(0))%997,7);
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const alpha=(color,opacity)=>{
  const hex=typeof color==='string'?color.replace('#',''):'';
  const full=hex.length===3?hex.split('').map(n=>n+n).join(''):hex.slice(0,6);
  return /^[\da-f]{6}$/i.test(full)?`rgba(${parseInt(full.slice(0,2),16)},${parseInt(full.slice(2,4),16)},${parseInt(full.slice(4,6),16)},${clamp(opacity)})`:`rgba(193,227,223,${clamp(opacity)})`;
};
function poly(c,points,fill,stroke,width=1.5){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
}
function oval(c,x,y,rx,ry,fill,stroke,width=1.5){
  c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c,points,color,width=2){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function curve(c,points,color,width=2){
  c.beginPath();c.moveTo(points[0],points[1]);c.bezierCurveTo(...points.slice(2));
  c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();
}
function glow(c,x,y,r,color,power=.3){
  if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,alpha(color,power));g.addColorStop(1,alpha(color,0));oval(c,x,y,r,r,g);
}
function ring(c,x,y,r,col,width=1,start=0,end=TAU){
  c.beginPath();c.arc(x,y,Math.max(.1,r),start,end);c.strokeStyle=col;c.lineWidth=width;c.stroke();
}
function star(c,x,y,r,col){poly(c,[[x,y-r],[x+r*.23,y-r*.23],[x+r,y],[x+r*.23,y+r*.23],[x,y+r],[x-r*.23,y+r*.23],[x-r,y],[x-r*.23,y-r*.23]],col);}
function gear(c,x,y,r,teeth,col,angle=0){
  const pts=[];for(let i=0;i<teeth*4;i++){const a=angle+i*TAU/(teeth*4),rr=r*(i%4<2?1:.87);pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}
  poly(c,pts,alpha(col,.08),alpha(col,.55));ring(c,x,y,r*.74,alpha(col,.4));
}
function flame(c,x,y,height,col,t){
  const flick=Math.sin(t*15+x)*2;c.beginPath();c.moveTo(x,y);
  c.bezierCurveTo(x-10,y-height*.23,x-6+flick,y-height*.62,x+2+flick,y-height);
  c.bezierCurveTo(x+4,y-height*.55,x+13,y-height*.28,x,y);c.fillStyle=col;c.fill();
  glow(c,x,y-height*.4,height*1.3,col,.22);oval(c,x+1,y-height*.25,2,height*.23,'#fff5da');
}
function eyes(c,x,y,col,spread=7){
  for(const side of [-1,1])oval(c,x+side*spread,y,2.4,3.8,col);glow(c,x,y,17,col,.25);
}
function runes(c,x,y,width,rows,col,offset=0){
  for(let row=0;row<rows;row++)for(let i=0;i<5;i++){
    const xx=x+i*width/5,yy=y+row*8,h=hash(row*11+i+offset);
    line(c,[[xx,yy],[xx+width/9,yy]],alpha(col,.28+h*.2),.8);
    if(h>.45)line(c,[[xx+2,yy-2],[xx+2,yy+2]],alpha(col,.35),.8);
  }
}
function statePose(c,e,t,boss=false){
  const wind=e.state==='windup',attack=['charge','attack','cast','slam'].includes(e.state),hurt=e.flash>0||e.state==='hurt';
  const anticipation=wind?clamp(1-finite(e.timer,20)/45):0;
  const dead=e.state==='dead'||e.state==='dying'||e.hp===0;
  const death=dead?clamp(1-finite(e.deathTimer??e.life,20)/35):0;
  c.translate(finite(e.x),finite(e.y));c.scale(e.face===-1?-1:1,1);
  if(dead){c.globalAlpha*=1-death;c.translate(Math.sin(t*18)*death*8,death*15);c.scale(1+death*.18,1-death*.3);}
  if(hurt){c.translate(-4-Math.sin(t*65)*2,0);c.rotate(-.035);c.globalAlpha*=.65+Math.sin(t*61)*.2;}
  if(wind){c.translate(-anticipation*(boss?14:6),anticipation*(boss?8:3));c.rotate(-anticipation*.035);}
  if(attack)c.translate(Math.sin(t*22)*(boss?3:1),-2);
  return {wind,attack,hurt,anticipation,dead,death,rage:e.phase>=2||e.state==='enrage'};
}
function tell(c,pose,y,col,t,big=false){
  if(!pose.wind)return;
  const r=(big?25:12)+pose.anticipation*7;ring(c,0,y,r,alpha(col,.6),1.5,-Math.PI/2,-Math.PI/2+TAU*pose.anticipation);
  star(c,0,y,5+Math.sin(t*12)*1.5,'#ffe8bd');
  line(c,[[-r-8,y],[-r-3,y]],alpha(col,.55));line(c,[[r+3,y],[r+8,y]],alpha(col,.55));
}

export function drawChronicleEntity(c,e,time=0,color){
  if(!e||!['candlewraith','clockscarab','oathbound','hushling'].includes(e.kind))return false;
  const t=finite(time),s=seed(e.id),col=color||({candlewraith:'#dfc7ff',clockscarab:'#e0cf91',oathbound:'#e7ae91',hushling:'#b9a9ed'}[e.kind]);
  c.save();const pose=statePose(c,e,t);oval(c,0,1,23,5,'#04101a65');
  if(e.kind==='candlewraith'){
    const bob=Math.sin(t*3+s)*4;c.translate(0,bob-7);glow(c,0,-37,55,col,.15);
    // Three melted wax bodies form a choir, rather than a single generic ghost.
    for(const i of [-1,1,0]){
      const xx=i*17,yy=-25-(i===0?14:0)+Math.sin(t*3+i*2)*3;
      c.save();c.translate(xx,yy);c.rotate(Math.sin(t*2+i+s)*.07);
      c.beginPath();c.moveTo(-8,-15);c.bezierCurveTo(-14,-5,-7,6,-11,16);
      c.lineTo(-4,11);c.lineTo(0,18);c.lineTo(5,11);c.lineTo(10,15);c.bezierCurveTo(6,2,13,-10,7,-15);c.closePath();
      c.fillStyle=i===0?'#e8dccb':'#b8a7cb';c.fill();c.strokeStyle=alpha(col,.6);c.lineWidth=1.2;c.stroke();
      oval(c,0,-14,7,3,'#7c6d87');line(c,[[0,-16],[1,-21]],'#604b6e',1.5);
      flame(c,0,-20,pose.attack?27:18,col,t+i);eyes(c,0,-2,'#362a51',3.2);
      if(pose.attack)oval(c,0,6,3.5,5.5,'#473154');
      else line(c,[[-2,6],[2,6]],'#6c5879',1);
      c.restore();
    }
    for(let i=0;i<3;i++){const a=t*.8+i*TAU/3;star(c,Math.cos(a)*36,-33+Math.sin(a)*15,2,col);}
  }else if(e.kind==='clockscarab'){
    const walk=['patrol','charge','chase'].includes(e.state)?Math.sin(t*16+s):Math.sin(t*3)*.2;
    for(const back of [true,false])for(let i=0;i<3;i++){
      const xx=-22+i*20,step=walk*(i%2?1:-1)*(back?-1:1)*7;
      line(c,[[xx,-20],[xx-10+step,-11],[xx-8+step,0]],back?'#665d58':'#b6a679',3.5);
      oval(c,xx-8+step,-1,3,2,'#d2c293');
    }
    oval(c,-3,-27,31,22,'#5a5a68',col,1.2);
    poly(c,[[-31,-27],[-19,-47],[-5,-50],[-5,-23],[-23,-15]],'#aba87d',alpha(col,.75));
    poly(c,[[-3,-50],[15,-46],[26,-30],[16,-15],[-3,-23]],'#7d8275',alpha(col,.75));
    gear(c,-5,-31,17,10,col,t*.8);oval(c,-5,-31,11,11,'#303343',alpha(col,.5));
    const hand=t*(pose.attack?7:1);line(c,[[-5,-31],[-5+Math.sin(hand)*7,-31-Math.cos(hand)*7]],'#f6e3ac',1.6);
    line(c,[[-5,-31],[-5+Math.sin(hand*.17)*5,-31-Math.cos(hand*.17)*5]],col,1.6);
    poly(c,[[20,-30],[37,-30],[45,-19],[34,-10],[19,-16]],'#9d9b77',col);
    eyes(c,34,-23,'#e9ffda',4);line(c,[[29,-29],[33,-42],[42,-48]],col,1.7);
    line(c,[[35,-28],[44,-40],[51,-39]],col,1.7);star(c,42,-48,3,'#fff1c7');
    if(pose.wind){gear(c,0,-29,39,12,col,-t);ring(c,0,-29,45,alpha(col,.25),1);}
  }else if(e.kind==='oathbound'){
    const stride=Math.sin(t*8+s)*(['patrol','charge','chase'].includes(e.state)?7:1.2);
    // Hollow cathedral armor contains only an unkept oath, visible through the chest.
    for(const side of [-1,1]){
      const xx=side*11;line(c,[[xx,-29],[xx+stride*side,-13],[xx+stride*side+3,0]],'#737886',7);
      poly(c,[[xx-7+stride*side,-8],[xx+6+stride*side,-8],[xx+12+stride*side,0],[xx-8+stride*side,0]],'#82868d','#b6b5a0');
    }
    c.save();c.rotate(Math.sin(t*2)*.02);
    poly(c,[[-24,-56],[-9,-67],[16,-66],[27,-51],[18,-25],[-15,-25]],'#596373','#b7b4a0');
    poly(c,[[-19,-55],[-7,-51],[-13,-37],[-3,-43],[4,-30],[12,-43],[20,-51],[8,-60]],'#172437');
    glow(c,0,-46,22,col,.28);star(c,0,-46,8,col);
    for(const side of [-1,1]){
      poly(c,[[side*17,-63],[side*32,-63],[side*37,-49],[side*22,-46]],'#84848d',alpha(col,.5));
      line(c,[[side*27,-48],[side*33,-32]],'#6f7180',5);
    }
    const arm=pose.attack?24:pose.wind?-9:0;line(c,[[29,-33],[33+arm,-23]],'#b1ac9c',5);
    line(c,[[33+arm,-40],[33+arm,-5]],'#c5b58d',3);
    poly(c,[[33+arm,-40],[30+arm,-69],[35+arm,-82],[38+arm,-69],[36+arm,-40]],'#d7d8c3','#91a4b1');
    line(c,[[24+arm,-40],[42+arm,-40]],col,3);
    poly(c,[[-14,-68],[-16,-87],[-5,-98],[12,-95],[20,-82],[16,-66]],'#96938f','#c7c2ac');
    poly(c,[[-10,-80],[14,-84],[11,-73],[-8,-73]],'#293144');line(c,[[-7,-78],[10,-80]],col,2);
    poly(c,[[-17,-88],[-27,-107],[-12,-99]],'#777d89');
    curve(c,[-17,-63,-48,-57,-36,-27,-50,-18],'#7c5b6877',9);
    c.restore();
  }else{
    c.translate(0,Math.sin(t*2+s)*2);
    const stretch=pose.attack?1.12:1;c.scale(1/stretch,stretch);
    // A small silhouette wearing a too-large crescent mask; its shadow walks late.
    c.save();c.globalAlpha*=.28;c.translate(-13-Math.sin(t*2)*4,7);
    poly(c,[[-13,0],[-11,-43],[0,-58],[13,-41],[19,0],[5,-8]],'#a091d3');c.restore();
    for(const side of [-1,1])curve(c,[side*5,-11,side*7,-5,side*12,1,side*16,0],'#53415e',3);
    c.beginPath();c.moveTo(-15,-8);c.bezierCurveTo(-10,-24,-19,-37,-9,-44);
    c.bezierCurveTo(1,-51,16,-42,14,-29);c.bezierCurveTo(10,-17,23,-9,23,-4);
    c.lineTo(8,-7);c.lineTo(2,-1);c.lineTo(-4,-7);c.lineTo(-15,-4);c.closePath();c.fillStyle='#2b283e';c.fill();c.strokeStyle=alpha(col,.6);c.lineWidth=1.2;c.stroke();
    for(const side of [-1,1])curve(c,[side*11,-33,side*22,-21,side*(26+(pose.attack?18:0)),-36,side*28,-19],alpha(col,.8),2.8);
    oval(c,0,-47,17,19,'#d6cdbb','#897e98');
    poly(c,[[-17,-45],[-28,-65],[-9,-60]],'#d6cdbb','#897e98');
    poly(c,[[8,-62],[27,-72],[17,-45]],'#c1b9b1','#897e98');
    for(const side of [-1,1]){oval(c,side*6,-48,3.5,5,'#3b2c4e');oval(c,side*6,-48,1,2.2,col);}
    line(c,[[-3,-35],[0,-33],[4,-36]],'#7c6889',1);
    curve(c,[2,-62,-1,-72,12,-75,14,-86],alpha(col,.6),1);
    for(let i=0;i<4;i++){const a=t*1.3+i*1.6;oval(c,Math.sin(a)*24,-17+Math.cos(a)*13,1,2,alpha(col,.6));}
  }
  tell(c,pose,e.kind==='oathbound'?-115:-91,col,t);
  c.restore();return true;
}

export function drawChronicleBoss(c,e,time=0){
  const id=e?.boss||e?.kind||e?.id;
  if(!['palimpsest','belltwin','nullheart'].includes(id))return false;
  const t=finite(time),col=({palimpsest:'#c4b1ed',belltwin:'#efc789',nullheart:'#ef9ac4'})[id];
  c.save();const pose=statePose(c,e,t,true);oval(c,0,2,75,13,'#060e1a66');
  glow(c,0,-105,160,col,pose.rage?.18:.08);
  if(id==='palimpsest')drawPalimpsest(c,e,t,pose,col);
  else if(id==='belltwin')drawBellTwin(c,e,t,pose,col);
  else drawNullHeart(c,e,t,pose,col);
  if(pose.rage){
    c.save();c.translate(0,-105);c.rotate(-t*.15);ring(c,0,0,142,alpha(col,.25),1,.2,2.5);ring(c,0,0,142,alpha(col,.25),1,3.3,5.7);
    for(let i=0;i<8;i++){const a=i*TAU/8;star(c,Math.cos(a)*142,Math.sin(a)*142,3,col);}c.restore();
  }
  tell(c,pose,-273,col,t,true);c.restore();return true;
}

function drawPalimpsest(c,e,t,pose,col){
  const bob=Math.sin(t*1.8)*5;c.translate(0,bob-9);
  // Six articulated arms support the forbidden book: the hands write themselves.
  for(const side of [-1,1])for(let i=2;i>=0;i--){
    const root=[side*34,-91-i*25],reach=pose.attack?28:pose.wind?-14:0;
    const elbow=[side*(74+i*8+reach*.4),-85-i*40+Math.sin(t*2+i+side)*7];
    const hand=[side*(107+i*10+reach),-61-i*57+Math.sin(t*2.8+i)*6];
    curve(c,[...root,side*69,-140,...elbow,...hand],i===1?'#a7a0ae':'#8b7d96',7);
    oval(c,...elbow,6,6,'#d4cabd','#776681');oval(c,...hand,7,10,'#d7ccba','#8a7c92');
    for(let finger=0;finger<4;finger++){
      const fx=hand[0]+side*(finger-1)*3,fy=hand[1]-7;
      const curl=pose.wind?9:Math.sin(t*2+finger+i)*3;
      line(c,[[fx,fy],[fx+side*(7+finger),fy-10-finger*2],[fx+side*(11+curl),fy-15-finger*2]],'#ded3c3',2);
    }
    if(i===0||pose.rage){line(c,[[hand[0],hand[1]-8],[hand[0]+side*7,hand[1]-45]],'#d8bd87',2);poly(c,[[hand[0]+side*7,hand[1]-45],[hand[0]+side*3,hand[1]-54],[hand[0]+side*13,hand[1]-49]],'#a58bb2');}
  }
  // Ribbon bookmarks anchor the levitating book to nothing.
  for(let i=0;i<5;i++){
    const xx=-30+i*15;c.beginPath();c.moveTo(xx,-61);
    c.bezierCurveTo(xx-12,-22,xx+Math.sin(t*2+i)*27,-33,xx-10+Math.sin(t*1.5+i)*22,1);
    c.lineTo(xx+2+Math.sin(t*1.5+i)*22,-7);c.bezierCurveTo(xx+Math.sin(t*2+i)*27,-29,xx+4,-30,xx+8,-62);c.closePath();c.fillStyle=i%2?'#ad7299':'#d4bd9a';c.fill();
  }
  c.save();c.rotate(Math.sin(t*1.5)*.025);
  poly(c,[[-7,-190],[-69,-204],[-83,-96],[-14,-66],[0,-72],[14,-66],[83,-96],[69,-204],[7,-190]],'#655268','#c5aec9',3);
  for(const side of [-1,1]){
    const flutter=Math.sin(t*5+side)*3;
    for(let page=3;page>=0;page--)poly(c,[[side*7,-187],[side*(63-page),-198+page*3],[side*(76-page),-101+page*2],[side*8,-75]],page%2?'#b9b0ac':'#e3d4b9','#bba7a1',.8);
    poly(c,[[side*5,-187],[side*62,-198+flutter],[side*72,-105+flutter],[side*6,-79]],'#e5d9bc','#9b839b',1.2);
    c.save();c.translate(side*12,-179);c.rotate(side*-.16);c.scale(side,1);runes(c,0,0,42,7,'#584562',side+4);c.restore();
    for(let i=0;i<3;i++){const yy=-176+i*29;oval(c,side*68,yy,3,3,'#f0d1a2');}
  }
  poly(c,[[-7,-186],[0,-195],[7,-186],[8,-79],[0,-69],[-8,-79]],'#a98f99','#d7c7b4');
  for(let i=0;i<6;i++)line(c,[[-5,-180+i*18],[5,-180+i*18]],'#e5c9a2',2);
  // The eye is half-lidded until a casting animation opens it.
  const openness=pose.attack?12:pose.wind?3:7+Math.sin(t*.7)*1.5;
  oval(c,0,-137,25,openness,'#3a2a4d','#cdaed7',2);oval(c,0,-137,6,Math.max(1,openness-2),'#eed7b2');oval(c,1,-137,2,Math.max(.8,openness-3),'#56335f');
  for(let i=0;i<5;i++){const xx=(i-2)*9;line(c,[[xx,-143-Math.abs(i-2)],[xx-2,-151-Math.abs(i-2)*2]],'#cbb5cf',1.5);}
  c.restore();
  for(let i=0;i<(pose.rage?9:5);i++){
    const a=t*(.2+i*.012)+i*2.4,x=Math.cos(a)*(87+i*4),y=-139+Math.sin(a)*70;
    c.save();c.translate(x,y);c.rotate(a+Math.sin(t*3+i)*.2);poly(c,[[-5,-9],[6,-8],[5,10],[-7,8]],'#e8d7b8b0');line(c,[[-3,-4],[3,-3]],'#705f83',.8);line(c,[[-3,0],[2,1]],'#705f83',.8);c.restore();
  }
}

function drawBellTwin(c,e,t,pose,col){
  const rock=Math.sin(t*1.6)*.025;c.rotate(rock);const stride=pose.attack?Math.sin(t*12)*7:0;
  for(const side of [-1,1]){
    line(c,[[side*23,-63],[side*(35+stride),-28],[side*(42+stride),-3]],'#6e655b',15);
    poly(c,[[side*(29+stride),-19],[side*(56+stride),-14],[side*(69+stride),0],[side*(29+stride),0]],'#ad926a','#e2bf83');
  }
  // Processional robes are cast in bronze and split down the erased saint's oath.
  poly(c,[[-55,-57],[-36,-108],[-32,-164],[0,-190],[34,-165],[38,-110],[59,-57],[23,-47],[0,-58],[-23,-47]],'#816e63','#ddb783',2.5);
  poly(c,[[-43,-70],[-25,-126],[-20,-164],[-2,-178],[-2,-65]],'#b1956a');
  poly(c,[[3,-178],[28,-154],[26,-111],[45,-69],[4,-64]],'#665f62');
  for(const side of [-1,1])for(let i=0;i<4;i++)line(c,[[side*(11+i*5),-149],[side*(16+i*8),-78]],'#473f4a',4);
  glow(c,0,-123,43,col,.3);oval(c,0,-126,9,23,'#f6cb86');oval(c,0,-125,4,14,'#fff0c3');
  line(c,[[0,-164],[0,-88]],'#ecd199',2);line(c,[[-15,-108],[16,-108]],'#ecd199',2);
  for(const side of [-1,1]){
    // Each shoulder bears a different face and a halo that rotates in opposition.
    const hx=side*25,hy=-196+(side===1?5:0),angle=t*.12*side;
    gear(c,hx,hy,43,16,col,angle);ring(c,hx,hy,37,alpha(col,.5));
    poly(c,[[hx-17,hy-24],[hx+14,hy-27],[hx+24,hy-8],[hx+16,hy+20],[hx-4,hy+29],[hx-22,hy+11]],side===-1?'#d3ba8c':'#988976','#edd49f',1.3);
    poly(c,[[hx-15,hy-8],[hx-5,hy-10],[hx-1,hy-5],[hx-11,hy-4]],'#51464c');
    poly(c,[[hx+5,hy-10],[hx+16,hy-8],[hx+13,hy-4],[hx+3,hy-5]],'#51464c');
    line(c,[[hx+2,hy-6],[hx-1,hy+5],[hx+4,hy+6]],'#79664f',1.5);
    if(side===-1)curve(c,[hx-9,hy+12,hx-3,hy+16,hx+4,hy+16,hx+10,hy+10],'#6b544e',1.8);
    else{oval(c,hx+1,hy+14,6,8,'#57434d');line(c,[[hx-12,hy-21],[hx-2,hy-13],[hx-6,hy+1],[hx+4,hy+18]],'#675766',1.4);}
    for(let i=0;i<3;i++)line(c,[[hx-15+i*12,hy-22],[hx-16+i*12,hy-34]],'#d4bb88',2);
    poly(c,[[side*31,-160],[side*57,-162],[side*72,-136],[side*47,-127]],'#b09570','#e0bd85');
    const swing=pose.attack?Math.sin(t*15)*.85:pose.wind?-.45:Math.sin(t*2+side)*.14;
    const handX=side*72,handY=-98;
    line(c,[[side*59,-135],[side*79,-119],[handX,handY]],'#918273',13);
    c.save();c.translate(handX,handY);c.rotate(side*swing);
    for(let i=0;i<7;i++)oval(c,0,i*7,3.5,5,null,'#a89979',1.5);
    poly(c,[[-19,53],[-14,33],[0,25],[15,33],[20,54],[27,62],[-26,62]],'#a78b64','#e3c38b',2);
    line(c,[[-23,58],[23,58]],'#604f51',3);oval(c,0,65,5,5,'#e6c791');
    if(pose.attack){ring(c,0,49,37,alpha(col,.3),1);ring(c,0,49,46,alpha(col,.15),1);}
    c.restore();
  }
  for(let i=0;i<4;i++){const x=(i-1.5)*16;line(c,[[x,-65],[x+Math.sin(t*3+i)*3,-36]],'#c9aa79',1);star(c,x+Math.sin(t*3+i)*3,-34,3,'#f5d99d');}
}

function drawNullHeart(c,e,t,pose,col){
  c.translate(0,-112+Math.sin(t*1.6)*5);
  const beat=1+Math.pow(Math.max(0,Math.sin(t*(pose.rage?7:4))),7)*.045;
  const orbit=t*(pose.rage?.42:.23);
  // Cages travel on an inclined, mechanical orrery. Draw the rear half first.
  const cages=Array.from({length:6},(_,i)=>({i,a:orbit+i*TAU/6}));
  const drawCage=({i,a})=>{
    const x=Math.cos(a)*125,y=Math.sin(a)*63-4,sz=12+Math.sin(a)*2;
    line(c,[[0,0],[x,y]],alpha(col,.19),1);
    c.save();c.translate(x,y);c.rotate(Math.sin(t*.7+i)*.12);
    glow(c,0,0,27,i%2?'#a7dff1':col,.16);
    line(c,[[-sz,-sz],[sz,-sz],[sz,sz],[-sz,sz],[-sz,-sz]],'#a29daf',1.3);
    for(let j=-1;j<=1;j++)line(c,[[j*sz*.48,-sz],[j*sz*.48,sz]],alpha('#e2d2d4',.65),1);
    oval(c,0,sz,sz,3,'#6a607d','#b5a6b7',1);oval(c,0,-sz,sz,3,'#8b7a95','#e0c2cb',1);
    // Each captive is a distinct tiny wandering star, still visibly alive.
    star(c,Math.sin(t*2+i)*2,-1+Math.cos(t*2+i)*2,5.5,i%2?'#c4f5ee':'#ffe0c6');
    line(c,[[0,-sz-1],[0,-sz-10]],'#baa3b5',1);oval(c,0,-sz-12,2,3,'#e4c3c2');c.restore();
  };
  for(const cage of cages)if(Math.sin(cage.a)<0)drawCage(cage);
  c.save();c.rotate(-.23);c.scale(1,.47);ring(c,0,0,126,'#a59ab16a',1.5);ring(c,0,0,137,'#776c913b',1);c.restore();
  gear(c,0,-1,94,24,'#c4aac6',-t*.1);
  for(const side of [-1,1]){
    curve(c,[side*13,-54,side*20,-91,side*44,-77,side*39,-109],side===-1?'#c6b6ba':'#9a849e',9);
    line(c,[[side*39,-109],[side*39,-125]],'#dbbec1',10);oval(c,side*39,-126,5,3,'#5b465e','#dfc0c4');
    for(let i=0;i<3;i++)line(c,[[side*(19+i*8),-77],[side*(17+i*10),-87]],'#806a86',1);
  }
  c.save();c.scale(beat,beat);
  c.beginPath();c.moveTo(3,-47);c.bezierCurveTo(-34,-90,-77,-45,-59,-8);
  c.bezierCurveTo(-49,20,-12,37,2,73);c.bezierCurveTo(25,42,62,2,58,-34);
  c.bezierCurveTo(52,-68,19,-71,3,-47);c.closePath();
  const metal=c.createLinearGradient(-55,-60,60,65);metal.addColorStop(0,'#c89eaf');metal.addColorStop(.35,'#65506d');metal.addColorStop(.7,'#a3809a');metal.addColorStop(1,'#3d3557');c.fillStyle=metal;c.fill();c.strokeStyle='#e1b8c9';c.lineWidth=2.3;c.stroke();
  // Asymmetric armored ventricles with a glass wound that exposes the night sky.
  poly(c,[[-49,-37],[-31,-55],[-7,-29],[-14,7],[-33,-7]],'#b197a7','#dfbfc8');
  poly(c,[[19,-48],[42,-43],[48,-16],[30,7],[12,-12]],'#766482','#b5a2b9');
  poly(c,[[-14,4],[1,-17],[24,-6],[21,27],[2,56],[-6,23]],'#28223e','#dd9ebd',2);
  glow(c,3,13,40,col,.5);star(c,3,13,17,'#fff2d4');star(c,3,13,8,'#f3b4d9');
  line(c,[[2,-46],[-3,-24],[6,-14],[-6,7],[0,28]],'#efb2cf',2.6);
  for(const side of [-1,1])for(let i=0;i<4;i++){
    const yy=-34+i*16;line(c,[[side*(44-i*4),yy],[side*(24-i*3),yy+11]],'#d3b2bd',1.4);
    oval(c,side*(45-i*4),yy,2.4,2.4,'#e9cfcb');
  }
  c.restore();
  for(const cage of cages)if(Math.sin(cage.a)>=0)drawCage(cage);
  for(let i=0;i<8;i++){const a=i*TAU/8-t*.2;star(c,Math.cos(a)*101,Math.sin(a)*101,2.8,'#f4d3da');}
  if(pose.wind||pose.attack){const r=pose.attack?130:35+pose.anticipation*65;ring(c,3,12,r,alpha('#fff1d3',pose.attack?.28:.45),1.7);glow(c,3,12,60,col,.35);}
}

export function drawWorldEvent(c,event,time=0,biomeColor='#bce5cd'){
  if(!event||!['ritual','meteor','aurora','eclipse','memory-rain'].includes(event.type))return false;
  const t=finite(time),max=Math.max(1,finite(event.maxLife,360)),life=finite(event.life,max),progress=clamp(1-life/max),fade=Math.min(1,progress*8,Math.max(0,life)/45);
  c.save();c.translate(finite(event.x),finite(event.y,520));c.globalAlpha*=fade;
  const col=event.color||biomeColor;
  if(event.type==='ritual'){
    glow(c,0,-80,230,col,.15);c.save();c.scale(1,.25);c.rotate(t*.16);
    ring(c,0,0,175,alpha(col,.7),2);ring(c,0,0,151,alpha(col,.35),1);ring(c,0,0,189,alpha(col,.2),1);
    const vertices=Array.from({length:7},(_,i)=>{const a=i*TAU/7;return [Math.cos(a)*157,Math.sin(a)*157];});
    for(let i=0;i<7;i++){line(c,[vertices[i],vertices[(i+3)%7]],alpha(col,.25),1);star(c,...vertices[i],7,'#fce7c0');}
    c.restore();
    for(let i=0;i<14;i++){
      const a=i*TAU/14+t*.3,x=Math.cos(a)*150,yy=-((t*45+i*29)%260),weight=1-Math.abs(yy)/300;
      line(c,[[x,0],[x,yy]],alpha(col,.1*weight),1);star(c,x,yy,2.3+weight,col);
    }
    const pillar=c.createLinearGradient(0,-330,0,0);pillar.addColorStop(0,alpha(col,0));pillar.addColorStop(.7,alpha(col,.025));pillar.addColorStop(1,alpha(col,.16));
    poly(c,[[-70,0],[-18,-330],[18,-330],[70,0]],pillar);
  }else if(event.type==='meteor'){
    const fall=clamp(progress*1.8),x=210*(1-fall),y=-460*(1-fall);
    if(fall<1){
      line(c,[[x+95,y-200],[x,y]],alpha(col,.1),24);line(c,[[x+80,y-168],[x,y]],alpha(col,.35),9);line(c,[[x+55,y-110],[x,y]],'#fff1d6',3);
      glow(c,x,y,60,col,.55);star(c,x,y,13,'#fff2d8');
      for(let i=0;i<9;i++){const d=(i+1)*13;oval(c,x+d*.45+Math.sin(t*12+i)*5,y-d,1.8,3,alpha(col,1-i/10));}
    }else{
      const impact=clamp((progress-.55)/.45);c.save();c.scale(1,.23);ring(c,0,0,20+impact*280,alpha(col,1-impact),4*(1-impact)+.2);ring(c,0,0,10+impact*210,alpha('#fff1ce',(1-impact)*.5),1.5);c.restore();
      glow(c,0,-25,110*(1-impact)+15,col,(1-impact)*.6);
      for(let i=0;i<17;i++){const angle=-Math.PI+i*Math.PI/16,r=impact*(65+hash(i)*120),xx=Math.cos(angle)*r,yy=Math.sin(angle)*r+impact*impact*80;poly(c,[[xx-3,yy],[xx,yy-8],[xx+4,yy+2]],alpha(col,1-impact));}
    }
  }else if(event.type==='aurora'){
    for(let band=0;band<4;band++){
      const color=['#8fe9cb','#a7c8ed','#c0a4eb','#eac0dd'][band],base=-350+band*30;
      for(let i=0;i<36;i++){
        const x=-420+i*24,y=base+Math.sin(i*.15+t*.4+band)*42+Math.sin(i*.33-t*.2)*17;
        const beam=c.createLinearGradient(x,y-80,x,y+120);beam.addColorStop(0,alpha(color,0));beam.addColorStop(.48,alpha(color,.12));beam.addColorStop(1,alpha(color,0));
        poly(c,[[x,y-80],[x+23,y-75],[x+32,y+110],[x+3,y+120]],beam);
        line(c,[[x,y+8],[x+25,y+Math.sin((i+1)*.15+t*.4+band)*2+8]],alpha(color,.25),1.4);
      }
    }
    for(let i=0;i<30;i++){const x=(hash(i)*2-1)*460,y=-170-hash(i+90)*300;star(c,x,y,1+Math.sin(t*2+i)*.7,'#dfedf0');}
  }else if(event.type==='eclipse'){
    c.translate(0,-300);glow(c,0,0,190,'#f3a9c7',.18);oval(c,0,0,75,75,'#090b1d');
    ring(c,0,0,78,'#f4c3cf',2);ring(c,0,0,82,'#f3c2cf66',5);
    for(let i=0;i<18;i++){const a=i*TAU/18+t*.03,r=83+Math.sin(t*3+i)*4;line(c,[[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(a)*(r+8),Math.sin(a)*(r+8)]],alpha(col,.4),1);}
    for(let i=0;i<7;i++){const a=t*.1+i*TAU/7;star(c,Math.cos(a)*110,Math.sin(a)*110,4,col);}
  }else{
    for(let i=0;i<32;i++){
      const x=(hash(i)*2-1)*330,y=-420+((t*30+i*73)%450),angle=Math.sin(t*.8+i)*.3;
      c.save();c.translate(x+Math.sin(t+i)*12,y);c.rotate(angle);poly(c,[[-4,-7],[5,-6],[4,7],[-5,6]],'#e7dcc49a');line(c,[[-2,-2],[3,-1]],'#6b6389',.7);c.restore();
      if(i%3===0)glow(c,x,y,16,col,.07);
    }
  }
  c.restore();return true;
}
