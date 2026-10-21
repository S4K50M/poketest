import { drawArenaBoss } from './boss-art.js';
import { drawCreature } from './creatures.js';
import { findFighter } from './roster.js';
import { BOSSES } from './world.js';
import { CHRONICLE_BOSSES } from './chronicle.js';

// The host supplies the clock. These scenes never touch an encounter or a save.
export const BOSS_CINEMATIC_DURATION=6500;
export const FINALE_CINEMATIC_DURATION=9000;
export const ESSENTIAL_BOSSES=Object.freeze(['briar','bell','leviathan','conductor','hourglass','crown','belltwin','palimpsest','nullheart']);
const DEFINITIONS={...BOSSES,...CHRONICLE_BOSSES},TAU=Math.PI*2;
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const noise=n=>{const x=Math.sin(n*127.1+47.17)*43758.5453;return x-Math.floor(x);};
const GATES={
 briar:['MOURNINGWILD · THE FIRST GARDEN','The roots are holding their breath.','Little heartbeats… stay behind my roots. I can keep you safe.'],
 bell:['CINDER CATHEDRAL · THE FURNACE SERMON','The bells were never made of bronze alone.','Come closer, pilgrims. The city must not go cold.'],
 leviathan:['DROWNED ARCHIVE · THE LIVING TIDE','A thousand stories turn beneath the water.','No more stories lost. No more names beneath the tide.'],
 conductor:['THUNDERSONG · THE NINTH REST','The storm stops long enough to listen.','One voice is missing. I will make the whole sky answer.'],
 hourglass:['PALE MERIDIAN · THE LAST SECOND','Here, even the snow remembers how to wait.','Wait. Give me one more second. I can change what happens.'],
 crown:['THE HOLLOW CROWN · THE WORLDHEART','Behind the throne, something is afraid.','I kept the roads. I kept the voices. Why did nobody come home?'],
 belltwin:['CLOCKWORK OSSUARY · TWO DAWNS','Two saints have been sheltering one small sunrise.','If one of us falls silent, who will keep tomorrow warm?'],
 palimpsest:['THE PAPER MOON · THE LAST WORD','The book has eaten every goodbye but its own.','Do not turn the last page. I cannot bear another ending.'],
 nullheart:['CRADLE ZERO · THE UNWRITTEN FUTURE','A perfect tomorrow has no room left to grow.','Stay. Nothing can ever hurt you in a world that never changes.'],
};
const ENDINGS={
 restore:[['THE SIX MEMORIES','The heart remembers.','The cage opens. This time, nobody asks the living world to obey.'],['A DAWN WORTH KEEPING','A home with open doors.','Lanterns wake along the roads. Vell leaves a light for every traveler still on their way.'],['THE LAST LANTERN','Some bonds outlast the end.','Three companions. One impossible journey. A whole world learning how to begin again.']],
 release:[['THE SIX MEMORIES','A heart can choose the sky.','The locks fall away. The Worldheart unfolds into a thousand unfamiliar constellations.'],['A ROAD WITHOUT A CROWN','No kingdom owns the dawn.','The old roads become rivers of stars. Every creature carries a piece of their light.'],['A SKY FULL OF HEARTBEATS','Find one another. Again.','Your companions look up. Somewhere in the dark, a new road answers with a heartbeat.']],
 wardens:[['THE CRADLE OPENS','No life is expendable.','The perfect memory lowers its hand. Shelter can be a promise instead of a prison.'],['THE LANTERN COMPACT','A refuge with open doors.','The Waylights burn for the lost, and the living are free to decide when it is time to leave.'],['TOMORROW HAS PERMISSION','A small light. A whole world.','Vell remembers your name. Beyond the lantern, someone entirely new takes their first breath.']],
 chorus:[['THE CRADLE OPENS','A voice is not a thing to keep.','The stored voices find the window. This time, their song leaves room for the living.'],['THE DROWNED CHOIR','Every goodbye becomes a road.','Paper boats fill the sky. Some return as rain. Some as roots. Some become a name no one has heard.'],['TOMORROW HAS PERMISSION','Listen between the notes.','Your companions answer the first unfamiliar song. The world has room for another voice.']],
 unwritten:[['THE CRADLE OPENS','The next page belongs to the living.','The perfect child uncurls its hand. A future does not need to be certain to deserve a chance.'],['THE UNWRITTEN','A world it cannot remember.','The old constellations leave a space. No prophecy waits there. Only the next step you choose.'],['TOMORROW HAS PERMISSION','Every beginning is a bond.','From the open cradle comes a tiny, entirely unfamiliar sound. Your companions step closer.']],
};
function endingKey(ending,faction){return Object.hasOwn(ENDINGS,ending)?ending:ending==='true'?(Object.hasOwn(ENDINGS,faction)?faction:'unwritten'):'restore';}
function definition(id,faction){const b=Object.hasOwn(DEFINITIONS,id)?DEFINITIONS[id]:DEFINITIONS.briar;return id==='nullheart'&&b.variants&&Object.hasOwn(b.variants,faction)?{...b,...b.variants[faction]}:b;}

/** Readable captions stay in the host DOM, independent of Canvas animation. */
export function bossCinematicBeat(bossId,elapsed=0,{mode='intro',ending='restore',faction=null}={}){
 const duration=mode==='ending'?FINALE_CINEMATIC_DURATION:BOSS_CINEMATIC_DURATION,count=mode==='ending'?3:2,act=duration/count,ms=clamp(finite(elapsed),0,duration),index=Math.min(count-1,Math.floor(ms/act));
 const b=definition(bossId,faction),copy=Object.hasOwn(GATES,bossId)?GATES[bossId]:GATES.briar;
 const [kicker,title,line]=mode==='ending'?ENDINGS[endingKey(ending,faction)][index]:index===0?[copy[0],copy[1],b.epithet]:[b.epithet,b.name,copy[2]];
 return {index,kicker,title,line,progress:clamp((ms-index*act)/act),duration};
}
function line(c,pts,col,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function curve(c,pts,col,width=1){c.beginPath();c.moveTo(pts[0],pts[1]);c.bezierCurveTo(...pts.slice(2));c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.stroke();}
function poly(c,pts,col,edge,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function oval(c,x,y,rx,ry,col,edge,width=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}}
function gradient(c,x,y,x2,y2,...colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((col,i)=>g.addColorStop(i/(colors.length-1),col));return g;}
function glow(c,x,y,r,col,power=.15){c.save();c.globalAlpha*=clamp(power);const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);c.restore();}
function ring(c,x,y,r,col,width=1,a=0,b=TAU){c.beginPath();c.arc(x,y,Math.max(1,r),a,b);c.strokeStyle=col;c.lineWidth=width;c.stroke();}
function gem(c,x,y,r,col,edge){poly(c,[[x,y-r],[x+r*.55,y],[x,y+r],[x-r*.55,y]],col,edge);}
function arch(c,x,y,rx,ry,col,width=22){c.beginPath();c.moveTo(x-rx,y+80);c.lineTo(x-rx,y);c.bezierCurveTo(x-rx,y-ry*.72,x-rx*.45,y-ry,x,y-ry);c.bezierCurveTo(x+rx*.45,y-ry,x+rx,y-ry*.72,x+rx,y);c.lineTo(x+rx,y+80);c.strokeStyle=col;c.lineWidth=width;c.stroke();}
function dust(c,w,t,col,kind='dust'){
 for(let i=0;i<48;i++){
  const x=(noise(i+17)*w+t*(kind==='snow'?8:kind==='ember'?4:2)+w*3)%(w+30)-15,y=(noise(i+100)*580+(kind==='ember'?-t*22:kind==='bubble'?-t*12:t*5)+5800)%580+100;
  if(kind==='bubble')oval(c,x,y,2+noise(i+10)*5,2+noise(i+10)*5,null,col+'35');
  else if(kind==='paper'){c.save();c.translate(x,y);c.rotate(noise(i)*3+t*.12);poly(c,[[-4,-7],[5,-6],[4,7],[-5,5]],col+'44');c.restore();}
  else oval(c,x,y,1+noise(i)*1.2,kind==='ember'?3:1+noise(i)*1.2,col+(i%3?'55':'a0'));
 }
}
function roots(c,x,y,side,col,t=0){for(let i=0;i<3;i++)curve(c,[x+side*i*15,y,x+side*(90+i*14),y-130,x-side*(70+i*19)+Math.sin(t*.4)*3,y-350,x+side*(130+i*40),y-520],col,24-i*5);}
function chamber(c,w,id,b,t){
 const x=w*.65,color=b.color;
 const sky={briar:'#112a2a',bell:'#281c2a',leviathan:'#102c3c',conductor:'#222842',hourglass:'#183644',crown:'#21172e',belltwin:'#282a28',palimpsest:'#172832',nullheart:'#201f36'}[id]||'#112a2a';
 c.fillStyle=gradient(c,0,0,0,900,'#071019',sky,'#06131b');c.fillRect(0,0,w,900);glow(c,x,330,500,color,.15);
 if(id==='briar'){
  for(let i=-1;i<5;i++){const xx=x-760+i*330;arch(c,xx,610,210,420,'#365347',37);arch(c,xx,610,188,391,'#88a67a33',2);roots(c,xx-205,705,1,'#2b463e',t);}
  oval(c,x,380,138,185,'#172e2b','#8ea67955',9);for(let i=0;i<12;i++){const a=i*TAU/12;gem(c,x+Math.cos(a)*150,380+Math.sin(a)*195,12,'#8ca67455');}glow(c,x,390,190,color,.13);
  for(const side of[-1,1])roots(c,x+side*260,690,-side,'#59714c',t);dust(c,w,t,color);
 }else if(id==='bell'){
  for(let i=-1;i<6;i++){const xx=x-850+i*320;arch(c,xx,650,150,460,'#523b40',38);line(c,[[xx-143,650],[xx-143,170]],'#b08a6644',2);}
  for(let i=0;i<7;i++){const xx=x-280+i*93;line(c,[[xx,75],[xx,412]],'#8c806a55',3);for(let n=0;n<8;n++)oval(c,xx,120+n*34,6,11,null,'#b29c6a44');}
  glow(c,x,500,310,'#ffac60',.25);poly(c,[[x-210,620],[x-173,300],[x-80,210],[x+80,210],[x+173,300],[x+210,620]],'#241f2b','#9e755555',4);
  for(let i=0;i<7;i++){const xx=x-150+i*50;line(c,[[xx,360],[xx,600]],'#ffb16d44',8);}dust(c,w,t,color,'ember');
 }else if(id==='leviathan'){
  for(let i=-1;i<8;i++){const xx=x-900+i*220;c.save();c.translate(xx,600);c.rotate(i%2?.07:-.08);c.fillStyle='#234552';c.fillRect(-22,-400,44,480);for(let n=0;n<6;n++)line(c,[[-55,-80-n*53],[70,-80-n*53]],'#5b878c44',5);c.restore();}
  for(let i=0;i<5;i++){const yy=240+i*80;curve(c,[-80,yy,w*.3,yy-110,w*.75,yy+60,w+80,yy-30],'#a0eee922',2);}
  for(let i=0;i<7;i++){const xx=x-370+i*120,yy=220+Math.sin(t*.3+i)*24;oval(c,xx,yy,23,9,'#c4ede218');for(let n=0;n<3;n++)curve(c,[xx-13+n*13,yy,xx-22+n*19,yy+34,xx-8+n*9,yy+60,xx-13+n*13,yy+90],'#b4ece222',1);}
  c.fillStyle='#65b6bd18';c.fillRect(0,604,w,130);dust(c,w,t,color,'bubble');
 }else if(id==='conductor'){
  for(let i=-1;i<6;i++){const xx=x-850+i*330,yy=420+noise(i+5)*100;poly(c,[[xx-130,yy],[xx+140,yy-18],[xx+64,yy+83],[xx,yy+140],[xx-52,yy+62]],'#353b58','#8b8eaa44',2);line(c,[[xx,yy],[xx,yy-220]],'#515c7a',17);gem(c,xx,yy-234,26,'#a9a0bf44','#d0bcea55');}
  const forks=[x-330,x+140,x+420];for(const xx of forks){line(c,[[xx,72],[xx-35,190],[xx+7,179],[xx-45,350]],'#ceb8fb55',3);glow(c,xx-15,185,90,color,.08);}
  for(let i=0;i<8;i++){const yy=170+i*65;line(c,[[0,yy],[w,yy-60]],'#b5abd715',1);}dust(c,w,t,color);
 }else if(id==='hourglass'){
  ring(c,x,315,207,'#bbdbe533',4);ring(c,x,315,180,'#d3e9e944',1);for(let i=0;i<12;i++){const a=i*TAU/12;line(c,[[x+Math.cos(a)*183,315+Math.sin(a)*183],[x+Math.cos(a)*199,315+Math.sin(a)*199]],'#d9ece266',2);}line(c,[[x,315],[x-16,180]],'#d6f0eb88',4);line(c,[[x,315],[x+91,350]],'#d6f0eb66',3);
  for(let i=-1;i<7;i++){const xx=x-850+i*270;poly(c,[[xx-50,690],[xx-25,215-noise(i)*100],[xx+20,170-noise(i)*80],[xx+52,690]],'#3b6573','#b7dce348',2);poly(c,[[xx+8,205],[xx+20,180],[xx+31,650]],'#bcdfe422');}dust(c,w,t,color,'snow');
 }else if(id==='crown'){
  oval(c,x,330,183,183,'#0e1624');ring(c,x,330,202,color+'55',3);ring(c,x,330,221,color+'22');
  for(let i=0;i<10;i++){const a=i*TAU/10+t*.025,xx=x+Math.cos(a)*265,yy=330+Math.sin(a)*228;c.save();c.translate(xx,yy);c.rotate(a);poly(c,[[-19,-33],[21,-36],[33,7],[4,35],[-23,11]],'#55415a','#c793b266',2);c.restore();}
  for(const side of[-1,1])poly(c,[[x+side*320,699],[x+side*285,403],[x+side*230,371],[x+side*203,489],[x+side*170,700]],'#352f43','#91718a44',2);dust(c,w,t,color);
 }else if(id==='palimpsest'){
  for(let i=0;i<9;i++){const xx=x-620+i*145,yy=160+(i%3)*95;c.save();c.translate(xx,yy);c.rotate(Math.sin(i+t*.16)*.18);poly(c,[[-36,-47],[36,-42],[31,47],[-32,44]],'#b6c8b244','#d1e1c755',1);for(let n=0;n<5;n++)line(c,[[-21,-22+n*12],[17-noise(n+i)*13,-20+n*12]],'#729f9b66',1.5);c.restore();}
  for(const side of[-1,1])curve(c,[x+side*50,620,x+side*330,560,x+side*390,386,x+side*330,170],'#5d858566',8);oval(c,x,677,390,35,'#152c3e','#8dd9ce33',2);dust(c,w,t,color,'paper');
 }else if(id==='belltwin'){
  for(const side of[-1,1]){const xx=x+side*190;glow(c,xx,272,198,'#f6d798',.2);oval(c,xx,272,75,75,'#e9ce9666','#eddbb477',2);ring(c,xx,272,93,'#beaa6e66',3);arch(c,xx,540,145,365,'#6c7053',16);for(let n=0;n<5;n++)curve(c,[xx-110+n*55,570,xx-123+n*53,396,xx-42+n*21,260,xx,132],'#a7ad7444',2);}
  for(let i=0;i<6;i++){const xx=x-450+i*180;line(c,[[xx,100],[xx,370]],'#bea36d55',2);oval(c,xx,394,29,12,'#978153','#d5bf8555');poly(c,[[xx-29,394],[xx-23,359],[xx,343],[xx+24,360],[xx+29,394]],'#756748','#d2bc8f66');}dust(c,w,t,color,'ember');
 }else{
  for(let i=0;i<3;i++){const a=.1+i*.45; c.save();c.translate(x,340);c.rotate(a);oval(c,0,0,270-i*33,151-i*16,null,color+(i?'44':'77'),2);c.restore();}
  for(let i=0;i<6;i++){const a=i*TAU/6+t*.04,xx=x+Math.cos(a)*300,yy=340+Math.sin(a)*170;arch(c,xx,yy+35,38,66,'#a8b3b877',7);oval(c,xx,yy+35,36,9,'#5b637c88',color+'66');gem(c,xx,yy+4,10,color+'77');}
  glow(c,x,365,240,color,.15);for(const side of[-1,1])curve(c,[x+side*55,670,x+side*170,570,x+side*230,190,x+side*100,90],'#5f6a8755',13);dust(c,w,t,color);
 }
 // A grounded chamber edge contrasts the threat with the tiny arriving party.
 c.fillStyle=gradient(c,0,672,0,800,sky,'#07151d');c.fillRect(0,683,w,175);line(c,[[0,683],[w,683]],color+'55',2);
}
function companions(c,party,x,y,t,reduced,scale=.48,spread=125,face=1){
 for(const i of[2,0,1]){const xx=x+(i-1)*spread,yy=y+(i===1?0:-4);drawCreature(c,party[i],xx,yy,scale*(i===1?1.02:.92),face,{state:'idle'},t,{reducedMotion:reduced,shadow:true,aura:false});}
}
function intro(c,w,id,b,beat,t,reduced,party){
 chamber(c,w,id,b,t);const p=reduced?1:smooth(beat.progress),focus=beat.index===0?.92:1.04,appear=reduced?1:beat.index===0?.58+.25*p:1;
 const bx=w*.66,by=680,bossScale=(id==='leviathan'?1.75:id==='conductor'?1.75:1.83)*focus;
 c.save();c.globalAlpha*=appear;c.translate(bx,by);c.scale(bossScale,bossScale);
 drawArenaBoss(c,{boss:id,id:7,x:0,y:0,face:-1,state:beat.index===0?'sealed':'windup',phase:beat.index===0?1:2,timer:beat.index===0?50:25,windupFrames:65,attackFrame:0,reducedMotion:reduced},b,t);c.restore();
 if(beat.index===1){const enter=reduced?0:(1-smooth(beat.progress/.45))*35;companions(c,party,w*.23-enter,690,t,reduced,.49,120,1);}
 else{for(const side of[-1,1]){const xx=w*.19+side*45;line(c,[[xx,690],[xx+18,674]],b.color+'35',1);}}
}
function lantern(c,x,y,col,t,size=16){
 line(c,[[x,y-45],[x,y-25]],'#b3b58977',2);glow(c,x,y,size*6,col,.2);poly(c,[[x-size*.7,y-20],[x-size*.6,y+18],[x,y+28],[x+size*.6,y+18],[x+size*.7,y-20],[x,y-31]],'#28413a','#a9b58a',2);oval(c,x,y,size*.3,17+Math.sin(t*2)*2,col);line(c,[[x,y-23],[x,y+22]],'#bfbb8a',1.2);
}
function worldheart(c,x,y,size,t,col,open=0){
 c.save();c.translate(x,y);c.scale(size,size);glow(c,0,0,190,col,.19);ring(c,0,0,137,col+'44',1.5);for(let i=0;i<6;i++){const a=i*TAU/6+t*.06;gem(c,Math.cos(a)*156,Math.sin(a)*130,8,col+'99');}
 const gap=12+open*43;
 for(const side of[-1,1])poly(c,[[side*gap,-108],[side*(gap+68),-34],[side*(gap+51),45],[side*gap,111],[side*(gap+15),9]],side>0?'#9eb4a4':'#547a77','#d8dfbf',2);
 poly(c,[[-29,-30],[0,-74],[30,-30],[0,74]],col+'99','#f5edc5',1.5);c.restore();
}
function finale(c,w,key,beat,t,reduced,party){
 const cx=w*.5,p=reduced?1:smooth(beat.progress),release=key==='release',chorus=key==='chorus',wild=key==='unwritten',col=release?'#c1c7f4':chorus?'#a5e6d9':wild?'#d8c4f4':'#e4dbad';
 c.fillStyle=gradient(c,0,0,0,900,beat.index===0?'#101b2a':'#17333a',beat.index===0?'#28373f':'#466458','#0b1d25');c.fillRect(0,0,w,900);
 if(beat.index===0){
  glow(c,cx,340,450,col,.15);
  for(let i=0;i<6;i++){const a=i*TAU/6,spread=(reduced?1:p)*35,x=cx+Math.cos(a)*(280+spread),y=350+Math.sin(a)*(220+spread);line(c,[[cx+Math.cos(a)*148,350+Math.sin(a)*123],[x,y]],col+'35',2);gem(c,x,y,20,['#bddaa2','#f1bb88','#9cddd9','#cfb2ec','#c7e6e9','#ecb2cb'][i]+'aa');}
  worldheart(c,cx,340,1.3,t,col,p);companions(c,party,cx,686,t,reduced,.57,190,1);
 }else if(beat.index===1){
  const sunX=cx+240,sunY=235;glow(c,sunX,sunY,400,col,.22);oval(c,sunX,sunY,80,80,col+'44');
  if(release||chorus){
   for(let i=0;i<22;i++){const x=noise(i+88)*w,yy=80+noise(i+77)*520-t*4;c.save();c.translate(x,yy);c.rotate(Math.sin(i)*.4);if(chorus)poly(c,[[-20,0],[24,0],[7,16],[-6,15]],'#cfe9d466','#dcebd677');else{gem(c,0,0,3+noise(i)*4,col+'aa');ring(c,0,0,9,col+'22');}c.restore();}
   for(let i=0;i<5;i++)curve(c,[-60,600-i*83,w*.3,650-i*97,w*.6,240-i*20,w+70,200+i*25],col+'25',2);
  }else{
   for(let i=-1;i<6;i++){const x=cx-680+i*270;arch(c,x,650,138,290,'#54735a',18);roots(c,x-135,720,1,'#294c40',t);lantern(c,x,350+Math.sin(i)*30,col,t,12);}
   if(wild)for(let i=0;i<12;i++){const a=i*TAU/12;gem(c,sunX+Math.cos(a)*122,sunY+Math.sin(a)*122,8,col+'55');}
  }
  c.fillStyle=gradient(c,0,655,0,850,'#435c47','#19382f','#0c222b');c.fillRect(0,680,w,170);line(c,[[0,680],[w,680]],'#c5d6a777',2);companions(c,party,cx,686,t,reduced,.62,210,release?-1:1);
 }else{
  const warm=release?'#bac9ef':chorus?'#b3e9db':wild?'#dcc6f1':'#e8dbad';
  glow(c,cx,270,440,warm,.2);oval(c,cx,248,99,99,warm+'22');
  for(const side of[-1,1]){roots(c,cx+side*640,760,-side,'#2a4b3f',t);arch(c,cx+side*470,650,135,320,'#355345',22);lantern(c,cx+side*470,366,warm,t,15);}
  for(let i=0;i<9;i++){const a=i*TAU/9;gem(c,cx+Math.cos(a)*195,265+Math.sin(a)*115,3,warm+'66');}
  c.fillStyle=gradient(c,0,662,0,840,'#5a6f51','#274638','#0c2328');poly(c,[[0,700],[cx-380,669],[cx,683],[cx+340,670],[w,704],[w,870],[0,870]],c.fillStyle);line(c,[[0,700],[cx-380,669],[cx,683],[cx+340,670],[w,704]],'#c5d4a977',2);
  companions(c,party,cx,682,t,reduced,.74,230,1);
  if(!release){lantern(c,cx,385,warm,t,19);if(wild||chorus||key==='wardens'){oval(c,cx,622,23,30,warm+'44',warm+'55');glow(c,cx,622,60,warm,.2);}}
  else{worldheart(c,cx,276,.33,t,warm,1);for(let i=0;i<15;i++)gem(c,cx+(noise(i+93)-.5)*800,140+noise(i+12)*340,2+noise(i)*3,warm+'99');}
 }
 dust(c,w,t,col,chorus?'paper':'dust');
}

/** Pure screen-space composition. No actor or party array is mutated. */
export function drawBossCinematic(c,width,height,{bossId='briar',elapsed=0,partyIds=[],reducedMotion=false,mode='intro',ending='restore',faction=null}={}){
 if(!c||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 const id=ESSENTIAL_BOSSES.includes(bossId)?bossId:'briar',beat=bossCinematicBeat(id,elapsed,{mode,ending,faction}),time=reducedMotion?0:clamp(finite(elapsed),0,beat.duration)/1000;
 const ids=Array.isArray(partyIds)?partyIds:[],party=[0,1,2].map(i=>findFighter(ids[i]||['pyrojaw','voltantis','zephyrix'][i])),scale=height/900,w=width/scale;
 c.save();try{
  c.beginPath();c.rect(0,0,width,height);c.clip();c.scale(scale,scale);c.fillStyle='#07141c';c.fillRect(0,0,w,900);
  const composition=Math.min(1,w/1450);c.save();c.translate(0,680*(1-composition));c.scale(composition,composition);
  if(mode==='ending')finale(c,w/composition,endingKey(ending,faction),beat,time,reducedMotion,party);else intro(c,w/composition,id,definition(id,faction),beat,time,reducedMotion,party);c.restore();
  // Captions and skip controls live above quiet parts of the full-screen film.
  c.fillStyle=gradient(c,0,630,0,900,'#06131a00','#06131adc','#06131a');c.fillRect(0,630,w,270);c.fillStyle='#050e16';c.fillRect(0,0,w,47);c.fillRect(0,844,w,56);line(c,[[0,47],[w,47]],'#c6d3a51c');line(c,[[0,844],[w,844]],'#c6d3a51c');
  for(const x of[28,w-28]){line(c,[[x,70],[x,87]],'#c9d4b244');line(c,[[x-5,78],[x+5,78]],'#c9d4b244');}
 }finally{c.restore();}
}
