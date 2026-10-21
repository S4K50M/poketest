import { drawCreature } from './creatures.js';
import { findFighter } from './roster.js';

// The opening is a presentation of a supplied clock, never a second game loop.
export const OPENING_DURATION=12000;
const ACT_DURATION=4000,TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const noise=n=>{const v=Math.sin(n*127.1+37)*43758.5453;return v-Math.floor(v);};
const BEATS=Object.freeze([
 Object.freeze({kicker:'PROLOGUE · THE NINETY-NINTH SILENCE',title:'A world forgot its heartbeat.',line:'Ninety-nine expeditions entered the rift. None returned with a name.'}),
 Object.freeze({kicker:'THE LAST LANTERN · JOURNEY 100',title:'Then three hearts answered.',line:'Professor Vell kept one lantern burning. Tonight, it burns for you.'}),
 Object.freeze({kicker:'MOURNINGWILD · THE FIRST MEMORY',title:'Every beginning is a bond.',line:'Find the Briar Matron. Bring the first memory home.'}),
]);

export function openingBeat(elapsedMs=0){
 const elapsed=clamp(finite(elapsedMs),0,OPENING_DURATION),index=Math.min(2,Math.floor(elapsed/ACT_DURATION));
 return {index,...BEATS[index],progress:clamp((elapsed-index*ACT_DURATION)/ACT_DURATION)};
}
function line(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function poly(c,points,color,edge,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(color){c.fillStyle=color;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function oval(c,x,y,rx,ry,color,edge,width=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(color){c.fillStyle=color;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}}
function curve(c,points,color,width=1){c.beginPath();c.moveTo(points[0],points[1]);c.bezierCurveTo(...points.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function glow(c,x,y,r,color,power=.2){c.save();c.globalAlpha*=clamp(power);const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,color);g.addColorStop(.42,color);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);c.restore();}
function gradient(c,x,y,x2,y2,...colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
function diamond(c,x,y,r,color,edge){poly(c,[[x,y-r],[x+r*.6,y],[x,y+r],[x-r*.6,y]],color,edge);}
function arc(c,x,y,r,a,b,color,width=1){c.beginPath();c.arc(x,y,r,a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function leaf(c,x,y,length,angle,col){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-length*.6,-length*.25,-length*.4,-length*.85,0,-length);c.bezierCurveTo(length*.5,-length*.7,length*.5,-length*.1,0,0);c.fillStyle=col;c.fill();line(c,[[0,-2],[0,-length*.85]],'#b5d6a433',.7);c.restore();}
function dust(c,w,t,col,count=55,wind=1){
 for(let i=0;i<count;i++){
  const x=noise(i+90)*w+Math.sin(t*.2+i)*10*wind,y=95+noise(i+190)*580+Math.sin(t*.4+i*3)*11*wind;
  c.save();c.globalAlpha*=.2+noise(i+290)*.65;oval(c,x,y,.7+noise(i+390)*1.7,.7+noise(i+390)*1.7,col);c.restore();
 }
}
function background(c,w,top,base){c.fillStyle=gradient(c,0,0,0,900,top,base,'#07161c');c.fillRect(0,0,w,900);}
function stoneArch(c,x,y,rx,ry,thick,color,edge){
 c.beginPath();c.moveTo(x-rx,y+180);c.lineTo(x-rx,y);c.bezierCurveTo(x-rx,y-ry*.72,x-rx*.48,y-ry,x,y-ry);c.bezierCurveTo(x+rx*.48,y-ry,x+rx,y-ry*.72,x+rx,y);c.lineTo(x+rx,y+180);c.strokeStyle=color;c.lineWidth=thick;c.stroke();
 c.beginPath();c.moveTo(x-rx+thick*.35,y+180);c.lineTo(x-rx+thick*.35,y);c.bezierCurveTo(x-rx+thick*.35,y-ry*.67,x-rx*.4,y-ry+thick*.35,x,y-ry+thick*.35);c.bezierCurveTo(x+rx*.4,y-ry+thick*.35,x+rx-thick*.35,y-ry*.67,x+rx-thick*.35,y);c.lineTo(x+rx-thick*.35,y+180);c.strokeStyle=edge;c.lineWidth=2;c.stroke();
}
function root(c,x,y,side,col,width=24,t=0){
 const sway=Math.sin(t*.55+x)*4;
 curve(c,[x,y,x+side*175,y-85,x+side*160+sway,y-290,x+side*385,y-380],col,width);
 curve(c,[x+side*115,y-130,x+side*45,y-285,x+side*145,y-405,x+side*65,y-565],col,width*.56);
 curve(c,[x+side*183,y-293,x+side*260,y-305,x+side*238,y-475,x+side*355,y-470],col,width*.37);
}
function lantern(c,x,y,size,t=0,power=1){
 glow(c,x,y,size*6,'#f0d391',.12*power);glow(c,x,y,size*2,'#ffe7a5',.24*power);
 line(c,[[x,y-size*2.5],[x,y-size*1.25]],'#b3ae7e',size*.12);
 poly(c,[[x-size*.62,y-size*.95],[x-size*.45,y+size*.9],[x,y+size*1.18],[x+size*.45,y+size*.9],[x+size*.62,y-size*.95],[x,y-size*1.3]],'#192d30','#a7ac7b',size*.1);
 poly(c,[[x-size*.43,y-size*.78],[x-size*.3,y+size*.72],[x,y+size*.92],[x+size*.3,y+size*.72],[x+size*.43,y-size*.78]],'#f5d38f');
 const flame=.86+Math.sin(t*3.1+x)*.06;oval(c,x,y,size*.16,size*.63*flame,'#fff3c4');
 line(c,[[x-size*.5,y-size*.82],[x+size*.5,y-size*.82]],'#c7c092',size*.12);line(c,[[x,y-size*.92],[x,y+size*.95]],'#d4c899',size*.08);
}

function fracturedHeart(c,w,progress,t,reduced){
 const cx=w*.5,cy=390,spread=reduced?1:smooth(progress),motion=reduced?0:t;
 background(c,w,'#070e1c','#102731');
 glow(c,cx,cy,520,'#53787b',.11);glow(c,cx,cy,240,'#e2d6ad',.06);
 // Ghost architecture and the discarded route markers of the previous journeys.
 for(const side of[-1,1])for(let layer=2;layer>=0;layer--){const x=cx+side*(370+layer*190),y=500+layer*35;stoneArch(c,x,y,74+layer*30,310+layer*30,20,'#18303755','#8cb6a415');}
 for(let i=0;i<68;i++){const x=noise(i+77)*w,y=85+noise(i+8)*520;c.save();c.globalAlpha*=.1+noise(i+135)*.5;diamond(c,x,y,1+noise(i+67)*2,'#a4c4bd');c.restore();}
 for(let i=0;i<17;i++){
  const a=i*TAU/17+motion*.018,r=390+noise(i+44)*120,x=cx+Math.cos(a)*r,yy=cy+Math.sin(a)*r*.66;
  c.save();c.translate(x,yy);c.rotate(a+.5);poly(c,[[-9,-19],[8,-15],[13,6],[3,18],[-13,13]],'#6e8f8430','#bdd5b829',1);line(c,[[-5,-7],[5,-5]],'#c8d6b73b',1);line(c,[[-4,2],[6,4]],'#c8d6b729',1);c.restore();
 }
 c.save();c.translate(cx,cy);if(!reduced)c.scale(1+progress*.025,1+progress*.025);
 // The outer mechanism is broken into six unequal wedges rather than a single ring.
 const colors=['#b9dba0','#e6ad77','#8edbd6','#c3ace2','#bfdeed','#e4a9c4'];
 for(let i=0;i<6;i++){
  const a=-Math.PI/2+i*TAU/6,angle=a+Math.sin(motion*.25+i)*.025,rx=Math.cos(angle)*(253+spread*18),ry=Math.sin(angle)*(220+spread*18);
  arc(c,0,0,205+i%2*9,a+.11,a+TAU/6-.13,colors[i]+'66',4);arc(c,0,0,223,a+.14,a+TAU/6-.16,colors[i]+'22',1);
  c.save();c.translate(rx,ry);c.rotate(angle+Math.PI/2);poly(c,[[-29,18],[-25,-14],[-12,-39],[11,-39],[29,-14],[24,18]],'#1d363c',colors[i]+'99',1.5);poly(c,[[-16,11],[-14,-11],[0,-27],[14,-11],[15,11]],colors[i]+'19',colors[i]+'66',1);diamond(c,0,-8,6,colors[i]);c.restore();
  const inner=159+spread*15;line(c,[[Math.cos(angle)*inner,Math.sin(angle)*inner],[Math.cos(angle)*188,Math.sin(angle)*188]],colors[i]+'55',1);
  c.save();c.globalAlpha*=.65;c.fillStyle=colors[i];c.font='500 12px Barlow, sans-serif';c.textAlign='center';c.fillText(['I','II','III','IV','V','VI'][i],Math.cos(angle)*296,Math.sin(angle)*263+5);c.restore();
 }
 for(let i=0;i<4;i++)arc(c,0,0,125+i*12,.2+i*.9+motion*.025,.2+i*.9+motion*.025+1.05,'#dfd4ac44',i===0?2:1);
 glow(c,0,0,165,'#f4de9c',.1+Math.sin(motion*1.6)*.02);
 const rift=8+spread*13;
 poly(c,[[-8-rift,-131],[-89-rift,-38],[-53-rift,75],[-8-rift,129],[-26-rift,20],[-8-rift,-19]],gradient(c,-100,-130,0,130,'#c4d7b2','#557f7c','#203f4c'),'#d0dfc1',1.4);
 poly(c,[[9+rift,-131],[90+rift,-38],[53+rift,75],[9+rift,129],[26+rift,20],[8+rift,-19]],gradient(c,0,-130,110,130,'#e4d9ae','#688d80','#234650'),'#d0dfc1',1.4);
 poly(c,[[-38,-37],[0,-91],[37,-37],[0,81]],'#eed6a366','#f8e7b8aa',1.3);line(c,[[-10,-65],[14,-32],[-11,4],[11,30],[0,65]],'#fff4cc',2);
 for(let i=0;i<15;i++){
  const a=i*2.399+motion*.09,r=132+noise(i+91)*80+spread*17,x=Math.cos(a)*r,y=Math.sin(a)*r*.83;
  c.save();c.translate(x,y);c.rotate(a+motion*.05);poly(c,[[-4,-9],[8,-5],[4,10],[-7,3]],i%3?'#a8c6b5':'#efd9a6','#dae3ca77',.7);c.restore();
 }
 c.restore();
 // Roots reach toward a warm seam without revealing what the Worldheart is.
 for(const side of[-1,1]){curve(c,[cx+side*70,666,cx+side*80,602,cx+side*300,615,cx+side*305,535],'#294a4655',14);curve(c,[cx+side*84,661,cx+side*90,616,cx+side*251,615,cx+side*275,565],'#91b3a52b',1);}
 c.save();c.fillStyle='#b2c7bb55';c.font='500 10px Barlow, sans-serif';c.textAlign='center';c.fillText('XCIX  /  THE SIGNAL WENT QUIET',cx,693);c.restore();
 dust(c,w,motion,'#cbd6bf',40,reduced?0:1);
}

function vell(c,x,y,t){
 c.save();c.translate(x,y);
 oval(c,0,1,29,6,'#06121788');
 // Vell remains a distant scholar: the companions are the detailed protagonists.
 poly(c,[[-25,-113],[-7,-138],[19,-119],[34,-20],[20,-1],[-30,-1],[-35,-27]],'#162b31','#839b8666',1.5);
 poly(c,[[-22,-112],[-8,-131],[12,-116],[4,-51],[-15,-11],[-29,-16]],'#24423e');
 oval(c,-1,-150,15,20,'#789187');poly(c,[[-26,-148],[-15,-182],[14,-183],[27,-154],[10,-158]],'#344e48','#879b803b',1.2);
 line(c,[[13,-105],[38,-87],[66,-94]],'#6b8173',8);oval(c,65,-94,5,6,'#c4b894');
 line(c,[[-9,-90],[-39,-62],[-47,-70]],'#435e51',7);poly(c,[[-55,-87],[-33,-80],[-34,-54],[-59,-64]],'#b6ae8c','#e1d7ae55',1);
 line(c,[[-16,-2],[-17,5]],'#132c32',8);line(c,[[14,-2],[18,4]],'#132c32',8);
 lantern(c,70,-66,13,t,1.2);c.restore();
}
function meeting(c,w,progress,t,reduced,party){
 const cx=w*.5,motion=reduced?0:t,p=reduced?1:progress;
 background(c,w,'#0b1a23','#1d3c39');
 glow(c,cx+100,375,490,'#668f70',.12);glow(c,cx-170,500,300,'#e3c58b',.07);
 for(let layer=2;layer>=0;layer--)for(const side of[-1,1]){
  const x=cx+side*(450+layer*95),y=660;root(c,x,y,-side,['#102b2f','#163235','#244238'][2-layer],35-layer*6,motion);
 }
 stoneArch(c,cx+150,550,300,375,36,'#3b55413b','#b4c79828');stoneArch(c,cx+150,550,270,343,14,'#0b232a77','#9abc8e22');
 // A little inhabited architecture makes the lantern a home, not a floating prop.
 for(const side of[-1,1]){
  const x=cx+side*540;poly(c,[[x-75,685],[x-65,544],[x,503],[x+70,550],[x+79,685]],'#203e39','#7d9a7844',2);
  poly(c,[[x-91,549],[x-35,485],[x+11,472],[x+94,550]],'#354f3e','#9aae7a44',2);
  c.fillStyle='#0a242b';c.fillRect(x-20,585,40,100);lantern(c,x+40,574,9,motion,.8);
 }
 for(let i=0;i<9;i++){
  const x=cx-480+i*116,y=230+Math.sin(i*.8)*55;curve(c,[x,82,x-17,157,x+14,191,x,y-28],'#62865c55',2);lantern(c,x,y,8+noise(i+88)*4,motion,.75);
 }
 // Warm mist and wide flagstones meet the animated cast at a clear baseline.
 c.fillStyle=gradient(c,0,672,0,790,'#54705b','#1b3b35','#0a222b');c.fillRect(0,682,w,160);line(c,[[0,682],[w,682]],'#a0b58b66',2);
 for(let i=-1;i<w/120+1;i++){const x=i*120;poly(c,[[x,684],[x+92,684],[x+124,714],[x+16,714]],'#a2b78b12','#9aad8024',1);}
 glow(c,cx-290,600,260,'#efd390',.11);vell(c,cx-425,683,motion);
 const arrive=reduced?1:smooth(p/.62),enter=(1-arrive)*96;
 const slots=[{x:cx-180-enter,y:680,s:.62,face:1},{x:cx+60-enter*.68,y:688,s:.68,face:-1},{x:cx+302-enter*.4,y:669,s:.6,face:-1}];
 for(const i of[2,0,1]){const pos=slots[i],moving=!reduced&&p<.61;drawCreature(c,party[i],pos.x,pos.y,pos.s,pos.face,{state:moving?'walk':'idle',walk:moving?motion*5+i:0},motion,{speed:moving?.38:0,reducedMotion:reduced,shadow:true,aura:false});}
 for(let i=0;i<14;i++){
  const x=cx-550+i*82,y=682+Math.sin(i*2)*4;leaf(c,x,y,12+noise(i+14)*10,(noise(i+61)-.5)*1.2,'#6e966655');
 }
 dust(c,w,motion,'#e5dcaa',57,reduced?0:1);
 c.save();c.globalAlpha*=.13;c.fillStyle=gradient(c,0,630,0,760,'transparent','#99bca4','transparent');c.fillRect(0,630,w,130);c.restore();
}

function dawn(c,w,progress,t,reduced,party){
 const cx=w*.5,motion=reduced?0:t,p=reduced?1:progress,zoom=reduced?1:1+p*.035;
 background(c,w,'#16323d','#42665a');
 c.save();c.translate(cx,430);c.scale(zoom,zoom);c.translate(-cx,-430);
 const sunX=cx+270,sunY=243;
 glow(c,sunX,sunY,420,'#b6d3ad',.15);glow(c,sunX,sunY,210,'#f0dfaf',.21);oval(c,sunX,sunY,76,76,'#d5d9ad44');arc(c,sunX,sunY,93,.2,TAU-.3,'#e5deae44',1);
 // The first gate is a living cathedral. Its seed door is a destination,
 // rather than a navigation arrow or a revelation of the later story.
 for(let i=-1;i<5;i++){
  const x=cx-500+i*235,y=565;poly(c,[[x-60,y],[x-49,252-noise(i+3)*90],[x-17,231-noise(i+3)*90],[x+25,258-noise(i+3)*90],[x+48,y]],'#1c3c3e');
  for(let j=0;j<3;j++)curve(c,[x-36+j*17,610,x-28+j*17,470,x-45+j*17,390,x-22+j*17,290],'#54745c33',2);
 }
 stoneArch(c,cx+120,535,160,295,34,'#42644c','#a2b89366');stoneArch(c,cx+120,535,132,260,15,'#17373a','#7fa58166');
 c.fillStyle='#0d2931';c.fillRect(cx+39,412,162,176);glow(c,cx+120,437,100,'#b7dba4',.19);
 for(const side of[-1,1])curve(c,[cx+120+side*85,588,cx+120+side*123,429,cx+120+side*112,350,cx+120,286],'#7f9d6d',13);
 diamond(c,cx+120,437,43,'#527b6244','#c2dca566');diamond(c,cx+120,437,25,'#b2dba077');
 for(let i=0;i<6;i++){const a=i*TAU/6+Math.PI/6;leaf(c,cx+120+Math.cos(a)*54,438+Math.sin(a)*54,18,a,'#8eae7644');}
 // Long climbing roots frame rather than cover the selected companions.
 for(const side of[-1,1]){
  root(c,cx+side*620,696,-side,'#294b3e',49,motion);root(c,cx+side*700,719,-side,'#1c3b36',31,motion);
  for(let i=0;i<7;i++){const x=cx+side*(530+i*26),y=365-i*41;leaf(c,x,y,30+i%3*14,side*(.7+i*.13),'#76976c44');}
 }
 // Slanting shafts are low contrast and stationary in reduced motion.
 c.save();c.globalAlpha*=.035;c.fillStyle='#fff0c8';for(let i=0;i<5;i++){const x=sunX-180+i*90;c.beginPath();c.moveTo(x,66);c.lineTo(x+27,66);c.lineTo(x-190,684);c.lineTo(x-260,684);c.closePath();c.fill();}c.restore();
 c.fillStyle=gradient(c,0,648,0,760,'#526b4b','#294b3d','#102b30');poly(c,[[-90,707],[cx-480,674],[cx-190,689],[cx+60,670],[cx+360,685],[w+100,665],[w+100,835],[-90,835]],c.fillStyle);
 line(c,[[0,699],[cx-480,674],[cx-190,689],[cx+60,670],[cx+360,685],[w,674]],'#afc38b77',3);
 for(let i=0;i<20;i++){const x=noise(i+61)*w,y=687+noise(i+73)*17;leaf(c,x,y,11+noise(i+81)*14,(noise(i+40)-.5)*1.9,'#8eaf7344');}
 const slots=[{x:cx-225,y:685,s:.64,face:1},{x:cx+18,y:675,s:.69,face:1},{x:cx+260,y:684,s:.61,face:-1}];
 for(const i of[2,0,1]){const q=slots[i];glow(c,q.x,q.y-65,108,party[i].accent,.045);drawCreature(c,party[i],q.x,q.y,q.s,q.face,{state:'idle'},motion,{reducedMotion:reduced,shadow:true,aura:false});}
 // Tiny awake lanterns echo the sanctuary that will load when the film ends.
 for(const [x,y]of[[cx-500,584],[cx+510,555]]){line(c,[[x,684],[x,y-48]],'#658865',3);curve(c,[x,y-48,x+12,y-64,x+39,y-64,x+42,y-43],'#9eb78c',3);lantern(c,x+42,y-22,11,motion,.9);}
 dust(c,w,motion,'#d2e6ac',63,reduced?0:1);c.restore();
}
const SCENES=[fracturedHeart,meeting,dawn];

/** Render the opening in screen space without DOM, timers, inputs or game state. */
export function drawOpeningCinematic(c,width,height,elapsedMs=0,partyIds=[],{reducedMotion=false}={}){
 if(!c||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 const elapsed=clamp(finite(elapsedMs),0,OPENING_DURATION),beat=openingBeat(elapsed),scale=height/900,w=width/scale;
 const ids=Array.isArray(partyIds)?partyIds:[],party=[0,1,2].map((i)=>findFighter(ids[i]??['pyrojaw','voltantis','zephyrix'][i]));
 const time=reducedMotion?0:elapsed/1000;
 c.save();
 try{
  c.beginPath();c.rect(0,0,width,height);c.clip();c.scale(scale,scale);
  // Avoid zooming a composition past the narrowest supported landscape width.
  const compositionScale=Math.min(1,w/1390);
  c.fillStyle='#071820';c.fillRect(0,0,w,900);
  c.save();c.translate(0,690*(1-compositionScale));c.scale(compositionScale,compositionScale);const sceneWidth=w/compositionScale;
  const blend=reducedMotion?1:smooth(beat.progress*ACT_DURATION/650);
  if(beat.index>0&&blend<1)SCENES[beat.index-1](c,sceneWidth,1,time,false,party);
  c.save();if(beat.index>0)c.globalAlpha*=blend;SCENES[beat.index](c,sceneWidth,beat.progress,time,reducedMotion,party);c.restore();c.restore();
  // The lower fifth belongs to the DOM caption, with no moving content behind it.
  c.fillStyle=gradient(c,0,624,0,900,'#06131a00','#06131acf','#06131a');c.fillRect(0,624,w,276);
  c.fillStyle='#050e16';c.fillRect(0,0,w,47);c.fillRect(0,842,w,58);
  line(c,[[0,47],[w,47]],'#c6d3a51c',1);line(c,[[0,842],[w,842]],'#c6d3a51c',1);
  // Registration marks add a quiet film frame without obscuring the skip control.
  for(const x of[28,w-28]){line(c,[[x,70],[x,87]],'#c9d4b244',1);line(c,[[x-5,78],[x+5,78]],'#c9d4b244',1);}
 }finally{c.restore();}
}
