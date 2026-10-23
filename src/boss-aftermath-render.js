import {drawArenaBoss} from './boss-art.js';
import {BOSSES} from './world.js';
import {CHRONICLE_BOSSES} from './chronicle.js';

// A host-owned clock keeps these transformations independent of save/gameplay.
// Records use world-space feet, with optional live death originX/originY.
export const BOSS_AFTERMATH_ART_DURATION=4800;
const DEFINITIONS={...BOSSES,...CHRONICLE_BOSSES},TAU=Math.PI*2;
const FORMS={briar:'tree',bell:'embercenser',leviathan:'inkpool',conductor:'featherperch',hourglass:'stoppedclock',crown:'worldheart',belltwin:'dawnlantern',palimpsest:'paperbook',nullheart:'cradle'};
const finite=(v,f=0)=>Number.isFinite(v)?v:f,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);},noise=i=>{const x=Math.sin(i*127.1+47.17)*43758.5453;return x-Math.floor(x);};
function line(c,pts,col,w=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
function curve(c,p,col,w=1){c.beginPath();c.moveTo(p[0],p[1]);c.bezierCurveTo(...p.slice(2));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();}
function poly(c,pts,col,edge,w=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.lineJoin='round';c.stroke();}}
function oval(c,x,y,rx,ry,col,edge,w=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
function ring(c,x,y,r,col,w=1){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function gem(c,x,y,r,col,edge){poly(c,[[x,y-r],[x+r*.6,y],[x,y+r],[x-r*.6,y]],col,edge);}
function glow(c,x,y,r,col,power=.18){c.save();c.globalAlpha*=clamp(power);const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);c.restore();}
function metal(c,x,y,col){const g=c.createLinearGradient(x-50,y-80,x+50,y+80);g.addColorStop(0,'#e0d7b5');g.addColorStop(.35,col);g.addColorStop(1,'#25333c');return g;}
function leaf(c,x,y,s,a,col){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(-s,0);c.bezierCurveTo(-s*.4,-s*.7,s*.5,-s*.7,s,0);c.bezierCurveTo(s*.5,s*.6,-s*.3,s*.5,-s,0);c.fillStyle=col;c.fill();line(c,[[-s*.7,0],[s*.8,0]],'#d2dfaa66',.8);c.restore();}
function feather(c,x,y,s,a,col){c.save();c.translate(x,y);c.rotate(a);poly(c,[[0,-s],[-s*.24,-s*.6],[-s*.3,0],[-s*.12,s*.5],[0,s*.7],[s*.2,0],[s*.2,-s*.6]],col,'#e9dbd277');line(c,[[0,-s*.8],[0,s*.8]],'#f0e2cf',1);for(let i=0;i<5;i++)line(c,[[0,-s*.55+i*s*.2],[s*.17,-s*.7+i*s*.2]],'#e9dbd288',.7);c.restore();}
function page(c,x,y,s,a,col){c.save();c.translate(x,y);c.rotate(a);poly(c,[[-s*.65,-s],[s*.6,-s*.9],[s*.7,s],[-s*.5,s*.86]],col,'#8ab4a4');for(let i=0;i<4;i++)line(c,[[-s*.4,-s*.55+i*s*.35],[s*.35,-s*.6+i*s*.35]],'#466969',.8);c.restore();}

function tree(c,col,g,t){
 const h=240*g;glow(c,0,-h*.55,110*g,col,.1);
 for(const side of[-1,1])for(let i=0;i<4;i++)curve(c,[side*6,-25*g,side*(35+i*13)*g,-2*g,side*(55+i*19)*g,-15*g,side*(75+i*21)*g,-2*g],'#416052',Math.max(1,(11-i*2)*g));
 c.save();c.scale(.25+.75*g,g||.001);
 poly(c,[[-44,0],[-25,-69],[-30,-135],[-17,-190],[4,-236],[23,-192],[25,-124],[34,-54],[47,0]],metal(c,0,-120,'#657d58'),'#172d2b',3);
 for(let i=0;i<6;i++)curve(c,[-24+i*9,-16,-8+i*5,-70,-35+i*10,-133,-10+i*5,-205],'#a5b18388',1.4);
 for(const side of[-1,1])for(let i=0;i<3;i++){const x=side*(53+i*27),y=-133-i*28;curve(c,[side*12,-90-i*27,side*45,-121-i*26,side*61,-161-i*27,x,y-20],'#657d58',12-i*2);for(let n=0;n<5;n++)leaf(c,x+(noise(n+i*8)-.5)*53,y-25+noise(n+i*3)*36,17+noise(n+8)*10,side*(.15+n*.2),'#8fa773');}
 for(let i=0;i<15;i++){const a=i*2.399,r=25+noise(i)*70;leaf(c,Math.cos(a)*r,-223+Math.sin(a)*r*.52,20+noise(i+9)*12,a*.3,'#829d70');}
 oval(c,0,-108,19,29,'#1c3631','#bdc99a',2);gem(c,0,-107,13,'#d7eab0','#f1e8bd');glow(c,0,-108,45,col,.24);
 c.restore();
}
function censer(c,col,g,t,twin=false){
 const y=-27*g;oval(c,0,-1,70*g,10*g,'#1c242d','#6b6861',1);for(let i=0;i<12;i++)poly(c,[[-55+i*10,-2],[-49+i*10,-7-noise(i)*6],[-40+i*10,-1]],'#3f3d40');
 c.save();c.translate(0,y);c.scale(.25+.75*g,g||.001);
 for(const side of[-1,1]){line(c,[[side*33,10],[side*46,26]],'#7c7560',6);curve(c,[side*33,-1,side*73,-37,side*45,-58,side*31,-37],'#9e9372',3);}
 poly(c,[[-43,0],[-34,-23],[-22,-31],[22,-31],[34,-23],[43,0],[28,17],[-28,17]],metal(c,0,-20,twin?'#bca56b':'#8d6d50'),'#1d2932',2);
 oval(c,0,-28,34,8,'#262a31','#c4ab79',2);poly(c,[[-36,-33],[-25,-52],[-8,-61],[8,-61],[25,-52],[36,-33]],'#4b4340','#ba9b6b',2);gem(c,0,-44,5,col);
 for(let i=0;i<5;i++)line(c,[[-22+i*11,-14],[-22+i*11,2]],col+'99',2);
 if(twin){for(const side of[-1,1]){line(c,[[side*20,-53],[side*28,-105]],'#aca36e',2);glow(c,side*28,-115,41,col,.2);oval(c,side*28,-115,15,15,'#f4dd9b','#f6e9b8',1);ring(c,side*28,-115,21,'#c9b98088');}}
 else{glow(c,0,-13,55,col,.14);oval(c,0,-8,10,4,'#ffc282');}
 c.restore();
}
function inkpool(c,col,g,t){
 oval(c,0,-2,117*g,15*g,'#132736','#5e9b9b',2);oval(c,-9,-4,87*g,8*g,'#1d3c4b');
 for(let i=0;i<5;i++)curve(c,[-85+i*33,-4,-66+i*33,-12,-50+i*33,7,-33+i*33,-4],'#8bc7bf55',1);
 for(const side of[-1,1])curve(c,[side*16,-2,side*40,-40*g,side*69,-42*g,side*71,-19*g],'#264f5b',6);
 for(let i=0;i<3;i++)page(c,-47+i*48,-12-i%2*9,10+g*4,(i-1)*.22,'#c0d1b7');glow(c,0,-4,80*g,col,.1);
}
function perch(c,col,g,t){
 poly(c,[[-41,0],[-30,-15*g],[-13,-21*g],[7,-17*g],[31,-13*g],[42,0]],metal(c,0,-9,'#655c76'),'#29303d',2);
 curve(c,[-4,-10,5,-28*g,-6,-49*g,15,-71*g],'#8c7e91',5);line(c,[[15,-70*g],[46,-72*g]],'#ab9aad',3);
 feather(c,13,-61*g,51*g,-.47,col);feather(c,-20,-6,25*g,1.13,'#857b99');glow(c,15,-53*g,42*g,col,.13);
}
function clock(c,col,g,t,p){
 const y=-119*g,r=111*g;glow(c,0,y,r*1.3,col,.12);oval(c,0,y,r,r,'#253d49','#8ca6a4',7);ring(c,0,y,r*.88,'#b5c2aa',2);ring(c,0,y,r*.75,'#94b4b477',1);
 for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[Math.cos(a)*r*.8,y+Math.sin(a)*r*.8],[Math.cos(a)*r*.9,y+Math.sin(a)*r*.9]],'#c9d8c2',i%3===0?3:1.5);}
 const angle=p<1?-(1-p)*TAU*3:0;c.save();c.translate(0,y);c.rotate(angle);line(c,[[0,0],[-18*g,-70*g]],'#e1e8d0',4);line(c,[[0,0],[57*g,21*g]],'#bed3c8',3);c.restore();oval(c,0,y,7*g,7*g,'#d5e3d0','#6b999e');
 line(c,[[-76*g,y-68*g],[-48*g,y-32*g],[-56*g,y+2*g],[-31*g,y+42*g]],'#0c2738',3);line(c,[[55*g,y-92*g],[38*g,y-40*g],[64*g,y-4*g],[52*g,y+52*g]],'#aec3b466',1.5);
 for(const side of[-1,1])poly(c,[[side*55*g,-10*g],[side*48*g,-27*g],[side*33*g,-30*g],[side*28*g,-7*g]],'#526d72','#a5b9a6',1.5);
}
function heart(c,col,g,t){
 poly(c,[[-57,0],[-37,-19*g],[-32,-35*g],[32,-35*g],[37,-19*g],[57,0]],metal(c,0,-10,'#715470'),'#2b273b',2);oval(c,0,-34*g,31*g,8*g,'#2d233a','#d5a5ba');
 glow(c,0,-100*g,95*g,col,.22);ring(c,0,-100*g,45*g,col+'66',1.5);for(let i=0;i<6;i++){const a=i*TAU/6;gem(c,Math.cos(a)*60*g,-100*g+Math.sin(a)*43*g,7*g,'#b888a0','#eed9c0');}
 gem(c,0,-100*g,37*g,col,'#f0dcc4');gem(c,-3*g,-105*g,18*g,'#ffe0ce');
}
function book(c,col,g,t){
 c.save();c.scale(.15+.85*g,g||.001);poly(c,[[-82,-5],[-75,-23],[0,-28],[75,-23],[82,-5],[0,11]],'#476366','#a8c8af',2);
 for(const side of[-1,1]){poly(c,[[0,-14],[side*72,-13],[side*66,-50],[side*37,-54],[0,-37]],'#d0d9b8','#6c9d94',1.5);for(let i=0;i<5;i++)curve(c,[side*10,-24-i*3,side*25,-31-i*3,side*44,-23-i*5,side*61,-22-i*5],'#638e82',.8);}
 line(c,[[0,-13],[0,-39]],'#a5bf9c',3);poly(c,[[9,-11],[20,-10],[21,14],[14,7],[9,15]],col,'#447174');c.restore();
}
function cradle(c,col,g,t){
 const y=-43*g;for(const side of[-1,1])curve(c,[side*48,0,side*68,-7*g,side*59,-36*g,side*39,-58*g],'#6e7183',5);
 c.save();c.translate(0,y);c.scale(.15+.85*g,g||.001);oval(c,0,3,61,17,'#383d51','#a3afae',2);
 for(const side of[-1,1])poly(c,[[side*4,10],[side*31,-13],[side*48,-67],[side*66,-53],[side*53,-4],[side*31,18]],metal(c,0,-20,'#8385a0'),'#bdc6ba',2);
 glow(c,0,-18,77,col,.2);oval(c,0,-20,20,29,'#c1b8d4','#ebe1cb',2);gem(c,0,-21,12,col,'#f6ecdb');c.restore();
}
const REMAINS={tree,embercenser:(c,col,g,t)=>censer(c,col,g,t,false),inkpool,featherperch:perch,stoppedclock:clock,worldheart:heart,dawnlantern:(c,col,g,t)=>censer(c,col,g,t,true),paperbook:book,cradle};

function particles(c,id,col,p,t,ox,oy,x,y){
 if(p<=0||p>=1)return;
 const strength=Math.sin(p*Math.PI),drift=smooth(p),n=id==='bell'?42:30;
 for(let i=0;i<n;i++){
  const a=i*2.399,spread=Math.sin(Math.PI*p)*(48+noise(i)*95),xx=ox+(x-ox)*drift+Math.cos(a+t*.4)*spread,yy=oy+(y-oy)*drift-90+Math.sin(a)*spread*.7-(id==='bell'?p*190:0);
  c.save();c.globalAlpha*=clamp(strength*(.35+noise(i+9)*.65));
  if(id==='conductor')feather(c,xx,yy,7+noise(i)*9,a+p*3,col);
  else if(id==='palimpsest'||id==='leviathan'&&i%3===0)page(c,xx,yy,5+noise(i)*5,a+p*4,id==='leviathan'?'#9cc4ae':'#d5e0bc');
  else if(id==='briar')leaf(c,xx,yy,5+noise(i)*8,a+p*3,'#9ab375');
  else{c.translate(xx,yy);c.rotate(a+p*4);gem(c,0,0,2+noise(i)*6,col+'cc');}
  c.restore();
 }
}
function dissolvingBody(c,id,b,col,p,t,ox,oy,x,y,reduced){
 if(p>=.86)return;
 const travel=smooth(p/.85),alpha=1-smooth((p-.25)/.58);let xx=ox+(x-ox)*travel,yy=oy+(y-oy)*travel,sx=1,sy=1,rotation=0;
 if(id==='briar'){sy=1-.52*travel;sx=1-.38*travel;yy-=25*Math.sin(p*Math.PI);}
 else if(id==='bell'){sy=1-.45*travel;rotation=Math.sin(p*21)*.065*(1-p);}
 else if(id==='leviathan'){yy+=75*travel;sy=1-.65*travel;rotation=-.15*travel;}
 else if(id==='conductor'){const lift=smooth((p-.16)/.64);xx+=lift*610;yy-=lift*740;rotation=lift*.27;}
 else if(id==='hourglass'){rotation=Math.sin(p*18)*.12;sy=1-.12*travel;}
 else if(id==='crown'){yy-=55*travel;sx=1-.5*travel;sy=1-.5*travel;rotation=travel*.22;}
 else if(id==='belltwin'){sx=1-.55*travel;sy=1-.55*travel;yy-=14*Math.sin(p*TAU);}
 else if(id==='palimpsest'){rotation=-travel*.38;sx=1+.25*travel;sy=1-.65*travel;}
 else{yy-=60*travel;sx=1-.68*travel;sy=1-.68*travel;}
 c.save();c.globalAlpha*=clamp(alpha);c.translate(xx,yy);c.rotate(rotation);c.scale(sx,sy);
 if(id==='leviathan'){c.beginPath();c.rect(-220,-330,440,330-120*travel);c.clip();}
 drawArenaBoss(c,{boss:id,id:13,x:0,y:0,face:-1,state:id==='conductor'?'windup':'recover',phase:2,timer:30,windupFrames:60,move:2,reducedMotion:reduced},b,t);c.restore();
 if(id==='bell'){
  const fire=Math.sin(Math.PI*clamp(p/.9));for(let i=0;i<12;i++){
   const fx=xx-65+i*12,top=yy-85-fire*(70+noise(i)*110);c.save();c.globalAlpha*=clamp(fire*.8);c.beginPath();c.moveTo(fx-13,yy-8);c.bezierCurveTo(fx-35,yy-80,fx+21,top+38,fx+Math.sin(t*8+i)*18,top);c.bezierCurveTo(fx+8,top+80,fx+33,yy-66,fx+14,yy-7);c.closePath();c.fillStyle=i%2?'#ffb876':'#ed895d';c.fill();c.restore();}
  glow(c,xx,yy-90,170*fire,'#ffc786',fire*.28);
 }else if(id==='hourglass'){
  c.save();c.globalAlpha*=Math.sin(p*Math.PI);for(let i=0;i<13;i++){const a=i*TAU/13,r=30+Math.sin(p*Math.PI)*120;gem(c,xx+Math.cos(a)*r,yy-110+Math.sin(a)*r,7+noise(i)*11,'#d3f1e6','#719fa9');}c.restore();
 }
}

/** Draw a defeat transformation and its persistent E-interactable world remnant.
 * elapsedMs defaults to Infinity so reloads immediately show the completed form.
 * No actor, definition, record, world clock, or save state is changed.
 */
export function drawBossAftermath(c,record,{elapsedMs=Infinity,reducedMotion=false,time=0}={}){
 if(!c||!record||!Object.hasOwn(FORMS,record.boss))return false;
 const id=record.boss,form=Object.hasOwn(REMAINS,record.form)?record.form:FORMS[id],b=DEFINITIONS[id],x=finite(record.x),y=finite(record.y),ox=finite(record.originX,x),oy=finite(record.originY,y),duration=Math.max(1,finite(record.duration,BOSS_AFTERMATH_ART_DURATION));
 const p=reducedMotion||elapsedMs===Infinity?1:clamp(finite(elapsedMs)/duration),t=reducedMotion?0:finite(time),col=record.color||b.color,g=smooth((p-.16)/.78);
 c.save();try{
  // Remains grow behind the departing body; the clock is intentionally a wall
  // artifact, allowing the host to paint all remains before living actors.
  if(p>.16){c.save();c.translate(x,y);c.globalAlpha*=smooth((p-.16)/.35);REMAINS[form](c,col,g,t,p);c.restore();}
  dissolvingBody(c,id,b,col,p,t,ox,oy,x,y,reducedMotion);
  particles(c,id,col,p,t,ox,oy,x,y);
 }finally{c.restore();}
 return true;
}

/** Lesser gate champions break apart in the arena too. Their destroyed weapon
 * is transient scenery; essential guardian remains are handled above. */
export function drawChampionDestruction(c,record,{elapsedMs=0,reducedMotion=false,time=0}={}){
 const b=BOSSES[record?.boss];if(!c||!b?.miniboss)return false;
 const p=clamp(finite(elapsedMs)/2600);if(p>=1)return true;
 const x=finite(record.x),y=finite(record.y),col=b.color,t=reducedMotion?0:finite(time),shatter=reducedMotion?1:smooth(p/.68);
 c.save();try{
  c.globalAlpha*=1-smooth((p-.72)/.28);
  if(!reducedMotion&&p<.65){
   c.save();c.globalAlpha*=1-smooth(p/.65);c.translate(x,y+shatter*20);c.rotate((record.face===1?1:-1)*shatter*.22);c.scale(1+shatter*.08,1-shatter*.42);
   drawArenaBoss(c,{...record,x:0,y:0,state:'recover',stun:0,hp:1,phase:Math.max(2,record.phase||1),timer:24,reducedMotion:false},b,t);c.restore();
  }
  const n=b.encounter==='warden'?18:25;
  for(let i=0;i<n;i++){
   const a=i*2.399,reach=(45+noise(i)*145)*shatter,xx=x+Math.cos(a)*reach,yy=y-88+Math.sin(a)*reach*.5+shatter*shatter*64;
   c.save();c.translate(xx,yy);c.rotate(a+shatter*(i%2?3:-3));
   if(i%3===0)poly(c,[[-3,-22],[4,-19],[6,14],[0,28],[-5,11]],metal(c,0,0,col),'#e0d4b788',1);
   else gem(c,0,0,3+noise(i+1)*10,col,i%2?'#e6daba88':undefined);
   c.restore();
  }
  // The fallen insignia is readable after the body has gone, then settles
  // into harmless grit. Wardens split their polearm; reavers lose their blade.
  c.save();c.translate(x,y-4);c.rotate(b.encounter==='warden'?-.2:.32);
  const split=14+shatter*22;
  line(c,[[-72,-5],[-split,-5]],'#baa888',6);line(c,[[split,-5],[75,-5]],'#766e76',6);
  poly(c,[[35,-13],[71,-26],[103,-13],[79,-2],[48,3]],col,'#e7dab777',1.5);
  poly(c,[[-65,-10],[-48,-29],[-34,-8],[-52,0]],'#71677a',col,1.5);c.restore();
  if(!reducedMotion&&p<.65)ring(c,x,y-56,20+shatter*165,col+'77',2);
 }finally{c.restore();}
 return true;
}
