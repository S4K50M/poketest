import { ARENAS } from './roster.js';

const TAU=Math.PI*2;
function poly(c,points,fill,stroke='#111b16',line=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.lineJoin='round';c.stroke()}}
function ellipse(c,x,y,rx,ry,fill,stroke=null,line=2){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function line(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke()}
function grad(c,x,y,x2,y2,...colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ellipse(c,x,y,r,r,g)}

// Original procedural creature illustrations; the same rig drives portraits and combat.
export function drawCreature(c,d,x,y,s=1,face=1,pose={},time=0,options={}){
  c.save();c.translate(x,y);c.scale(s*face,s);
  const id=d.id,att=pose.attack||0,hit=pose.hit||0,walk=pose.walk||0,air=pose.air||0,guard=pose.guard||false;
  const heavy=['glaciolith','terrakhan'].includes(id),slim=['voltantis','noxshade','zephyrix'].includes(id);
  const breathe=Math.sin(time*2.3)*1.7,step=Math.sin(walk)*10;
  const base=grad(c,-90,-250,75,0,d.color,d.dark,'#17241d'),lit=grad(c,-70,-210,60,-10,d.accent,d.color,d.dark);
  const dark=grad(c,-65,-220,100,-20,d.dark,'#1b2722','#101a16');
  const outline='#101a15';
  if(options.shadow!==false)ellipse(c,0,2,heavy?78:64,12,'#050b08aa');
  if(options.aura){glow(c,0,-110,130,d.color+'55')}
  c.translate(hit?-7:0,breathe+air*-3);c.rotate(hit?-.12:0);
  // Tails and rear appendages.
  if(id==='pyrojaw'){
    poly(c,[[-30,-112],[-70,-85],[-121,-70],[-139,-110],[-127,-62],[-110,-47],[-56,-58],[-8,-83]],base);
    poly(c,[[-105,-56],[-117,-73],[-104,-96],[-87,-59]],'#e66e35');
    [[-116,-70],[-88,-68],[-63,-78]].forEach(([a,b])=>poly(c,[[a-8,b],[a-15,b-20],[a+5,b-5]],lit));
    for(let i=0;i<6;i++)poly(c,[[-47+i*3,-116-i*17],[-72+i*3,-124-i*17],[-45+i*3,-135-i*17]],d.dark);
  }
  if(id==='noxshade'){
    c.save();c.globalAlpha=.7;glow(c,-83,-76,64,'#b480fc35');
    line(c,[[-20,-84],[-72,-50],[-110,-80],[-95,-126],[-132,-138]],'#7b56a9',18);
    poly(c,[[-132,-138],[-154,-128],[-144,-157],[-153,-170],[-117,-157],[-95,-133]],lit);c.restore();
  }
  if(id==='ferrodrake'){
    poly(c,[[-23,-151],[-115,-243],[-106,-154],[-146,-120],[-92,-123],[-53,-74]],dark);
    poly(c,[[-16,-159],[-93,-219],[-76,-153],[-111,-133],[-65,-138]],lit);
    line(c,[[-27,-151],[-102,-227],[-76,-153],[-115,-132]],'#bcccd0',3);
    ellipse(c,-67,-159,24,27,'#162724','#a8b9bd',5);ellipse(c,-67,-159,17,20,'#354e49','#536b60',2);
    for(let i=0;i<6;i++){c.save();c.translate(-67,-159);c.rotate(i*TAU/6+time*.3);poly(c,[[2,0],[5,-16],[13,-4]],'#c2d2c3',null);c.restore()}
    poly(c,[[-24,-86],[-78,-29],[-113,-48],[-80,-14],[-18,-46]],base);
    poly(c,[[30,-164],[88,-211],[81,-152],[108,-136],[62,-127]],dark);
  }
  if(id==='zephyrix'){
    for(const side of [-1,1]){
      c.save();c.scale(side,1);c.rotate(-.08+Math.sin(time*2)*.04);
      for(let i=0;i<6;i++)poly(c,[[12,-163],[55+i*10,-225+i*12],[105+i*3,-173+i*11],[54,-111]],grad(c,20,-220,105,-100,'#e7ebc5',d.color,d.dark));
      c.restore();
    }
  }
  if(id==='terrakhan'){
    ellipse(c,-13,-153,82,92,dark,outline,3);
    poly(c,[[-11,-240],[-72,-207],[-89,-147],[-56,-99],[-14,-117]],base);
    poly(c,[[-8,-240],[51,-207],[59,-150],[22,-108],[-10,-117]],dark);
    line(c,[[-11,-237],[-14,-120]],'#0d2119',5);
    for(let i=0;i<4;i++)poly(c,[[-68,-202+i*24],[-96,-214+i*24],[-80,-182+i*24]],lit);
  }
  if(id==='glaciolith'){
    for(let i=0;i<7;i++)poly(c,[[-80+i*22,-162],[-92+i*24,-229-(i%3)*12],[-39+i*22,-191]],grad(c,-80,-240,80,-140,'#d7faff',d.color,d.dark));
  }
  // Legs: angular weight-bearing stance with separate armor plates.
  const hips=heavy?36:25,thick=heavy?27:slim?15:23;
  for(const [side,back] of [[-1,true],[1,false]]){
    const lx=hips*side,offset=(back?-step:step)+(air?side*13:0),fx=lx+side*18+offset;
    poly(c,[[lx-thick,-93],[lx+thick,-91],[fx+thick-4,-49],[fx+thick-8,-13],[fx-thick,-9],[fx-thick-8,-48]],back?dark:base);
    poly(c,[[lx-thick,-88],[lx+thick,-90],[fx+thick-5,-52],[fx,-43],[fx-thick,-54]],back?d.dark:lit);
    poly(c,[[fx-thick,-24],[fx+thick-4,-24],[fx+thick+14,-7],[fx+thick+20,0],[fx-thick-7,0]],back?dark:base);
    line(c,[[fx-thick+5,-43],[fx+thick-10,-41]],d.accent+'77',2);
    if(id!=='voltantis')for(let n=0;n<3;n++)poly(c,[[fx+thick-2+n*8,-8],[fx+thick+1+n*8,2],[fx+thick+9+n*8,0]],id==='pyrojaw'?'#bcb592':d.accent,outline,1.2);
    if(id==='glaciolith')poly(c,[[fx-thick,-44],[fx-8,-66],[fx+thick,-38],[fx+9,-17]],lit);
  }
  // Rear arm, common torso and armored chest.
  const shoulder=heavy?65:slim?36:48;
  poly(c,[[-shoulder,-175],[-shoulder-24,-141],[-shoulder-10,-106],[-shoulder+14,-116],[-shoulder+5,-142],[-shoulder+22,-163]],dark);
  ellipse(c,-shoulder-5,-112,heavy?25:18,heavy?23:18,dark,outline,2);
  poly(c,[[-shoulder+5,-185],[shoulder-5,-183],[shoulder+9,-143],[29,-84],[-32,-85],[-shoulder-13,-145]],base);
  poly(c,[[-shoulder+9,-181],[-4,-192],[shoulder-8,-181],[26,-142],[-8,-127],[-38,-149]],lit);
  if(id==='pyrojaw'){
    poly(c,[[-26,-143],[4,-149],[29,-139],[22,-98],[-24,-101]],'#6e6545');
    for(let i=0;i<4;i++)line(c,[[-25,-136+i*10],[22,-133+i*9]],'#262e22',2);
    line(c,[[-34,-176],[-26,-164],[-36,-154],[-28,-142]],'#ff9c45',3);
    line(c,[[22,-175],[15,-163],[31,-154],[24,-141]],'#f8b244',3);
  }
  if(id==='terrakhan'){
    poly(c,[[-40,-166],[0,-186],[43,-163],[21,-115],[-22,-115]],dark);
    glow(c,0,-150,34,'#aaff7744');poly(c,[[0,-177],[20,-151],[0,-124],[-20,-151]],'#adff86');poly(c,[[0,-177],[20,-151],[0,-124]],'#4fbb6e');
    line(c,[[-4,-165],[-12,-149],[0,-131]],'#e3ffd8',2);
  }
  if(id==='ferrodrake'){
    poly(c,[[-37,-169],[0,-186],[38,-168],[22,-137],[0,-124],[-23,-138]],dark);
    poly(c,[[0,-179],[14,-163],[0,-145],[-14,-163]],d.accent);glow(c,0,-163,25,'#ff775544');
    for(let i=0;i<3;i++)poly(c,[[-24+i*2,-128+i*10],[0,-120+i*10],[25-i*2,-128+i*10],[18,-116+i*10],[0,-109+i*10],[-20,-118+i*10]],base);
  }
  if(id==='aqualance'){
    poly(c,[[-40,-181],[-11,-191],[0,-162],[-19,-143],[-45,-155]],'#9dcad1');
    poly(c,[[0,-162],[18,-190],[45,-177],[41,-153],[20,-141]],lit);
    for(let i=0;i<4;i++)line(c,[[-17,-135+i*11],[0,-129+i*11],[22,-137+i*11]],'#8cb3b4',3);
    poly(c,[[-26,-88],[0,-104],[28,-88],[40,-62],[2,-71],[-39,-60]],dark);
  }
  if(id==='glaciolith'){
    poly(c,[[-43,-183],[-23,-167],[-12,-181],[0,-166],[16,-183],[27,-166],[45,-184],[26,-122],[1,-110],[-28,-125]],'#dfefdf');
    for(let i=0;i<5;i++)poly(c,[[-32+i*15,-141],[-29+i*14,-114],[-18+i*14,-136]],'#accccf');
    for(const side of [-1,1]){c.save();c.scale(side,1);poly(c,[[35,-126],[65,-129],[83,-88],[68,-68],[43,-92]],base);ellipse(c,72,-75,22,22,lit,outline);poly(c,[[56,-87],[73,-110],[91,-80],[76,-61]],'#b8edf1');c.restore()}
  }
  if(id==='noxshade'){
    poly(c,[[-39,-173],[-10,-187],[8,-167],[42,-179],[25,-141],[-1,-127],[-29,-141]],dark);
    line(c,[[-24,-176],[6,-159],[-5,-136]],'#e1b6ff',2);
    for(let i=0;i<4;i++)line(c,[[-28+i*13,-166],[-33+i*13,-154]],'#d4badf',2);
    poly(c,[[-39,-183],[-12,-199],[26,-187],[66,-201],[57,-171],[6,-160],[-29,-162]],'#b299b9');
    poly(c,[[44,-181],[99,-186],[115,-205],[105,-159],[58,-162]],dark);
  }
  if(id==='voltantis'){
    poly(c,[[-25,-181],[0,-194],[28,-178],[17,-151],[0,-140],[-19,-152]],dark);
    poly(c,[[0,-181],[12,-165],[0,-147],[-12,-164]],'#edff9c');
    line(c,[[-17,-132],[0,-124],[20,-132]],'#c2f76b',3);
    line(c,[[-13,-117],[0,-108],[17,-118]],'#c2f76b',3);
  }
  if(id==='zephyrix'){
    poly(c,[[-26,-182],[0,-196],[28,-178],[23,-139],[0,-115],[-26,-137]],'#e2d9ba');
    for(let i=0;i<7;i++)ellipse(c,-35+i*11,-182+Math.sin(i/6*Math.PI)*22,5,6,'#b9e0a4','#283f2a',1);
    poly(c,[[-29,-102],[3,-109],[32,-101],[46,-68],[6,-78],[-43,-66]],'#63876a');
  }
  // Front arm and fists; attack extension keeps a readable silhouette.
  const extension=att*66,gy=guard?-24:0;
  poly(c,[[shoulder-9,-176],[shoulder+18,-168],[shoulder+29+extension*.4,-137+gy],[shoulder+17+extension*.6,-114+gy],[shoulder-8,-131+gy],[shoulder-20,-155]],base);
  ellipse(c,shoulder+3,-166,heavy?26:22,heavy?29:23,lit,outline,2);
  if(['pyrojaw','glaciolith','terrakhan','ferrodrake'].includes(id)){
    const fistX=shoulder+20+extension, fistY=-121+gy-att*25;
    poly(c,[[shoulder+17,-143+gy],[fistX+12,fistY-25],[fistX+31,fistY-14],[fistX+30,fistY+13],[fistX+6,fistY+24],[shoulder+3,-115+gy]],id==='pyrojaw'?dark:base);
    poly(c,[[fistX+2,fistY-22],[fistX+24,fistY-17],[fistX+34,fistY-6],[fistX+29,fistY+18],[fistX+5,fistY+15],[fistX-5,fistY]],id==='pyrojaw'?'#27352c':lit);
    for(let i=0;i<3;i++)line(c,[[fistX+3+i*9,fistY-10],[fistX+6+i*9,fistY+9]],id==='pyrojaw'?'#efaa45':'#31453e',2);
    if(id==='pyrojaw'){glow(c,fistX+18,fistY,25,'#ffb93c33');line(c,[[fistX-4,fistY-5],[fistX+6,fistY],[fistX+10,fistY-8],[fistX+22,fistY-2]],'#ffba56',2)}
    if(id==='glaciolith')poly(c,[[fistX+3,fistY-20],[fistX+11,fistY-46],[fistX+26,fistY-22]],'#c2f5fb');
  }else if(id==='voltantis'){
    const xx=shoulder+17+extension;
    poly(c,[[xx-7,-126+gy],[xx+16,-137+gy],[xx+64,-189+gy],[xx+55,-142+gy],[xx+14,-107+gy]],'#e9ffc0');
    poly(c,[[xx+13,-131+gy],[xx+64,-189+gy],[xx+55,-142+gy]],'#a7fa53');glow(c,xx+40,-151+gy,23,'#d1ff6533');
    poly(c,[[-shoulder-8,-131],[-shoulder-61,-174],[-shoulder-36,-117],[-shoulder,-98]],lit);
  }else if(id==='aqualance'){
    const xx=shoulder+15+extension,yy=-118+gy-att*16;
    line(c,[[shoulder+10,-139],[xx,yy]],d.dark,20);ellipse(c,xx,yy,13,14,lit,outline);
    line(c,[[xx+8,yy+18],[xx+22,yy-22]],'#b6e9de',6);
    poly(c,[[xx+14,yy-4],[xx+115,yy-48],[xx+22,yy+4]],'#b9f7fb','#6ad7e5',1);line(c,[[xx+25,yy],[xx+112,yy-47]],'#eaffff',2);
  }else{
    const xx=shoulder+12+extension,yy=-122+gy-att*17;
    line(c,[[shoulder+10,-140],[xx,yy]],d.dark,18);ellipse(c,xx,yy,16,15,lit,outline);
    for(let i=0;i<3;i++)poly(c,[[xx+3+i*7,yy-5],[xx+18+i*7,yy-8],[xx+11+i*7,yy+7]],d.accent);
  }
  // Head: each species has its own original anatomy.
  if(id==='pyrojaw'){
    poly(c,[[-37,-210],[-27,-248],[10,-257],[40,-238],[73,-226],[87,-213],[81,-194],[52,-185],[10,-189],[-14,-176],[-34,-187]],base);
    poly(c,[[13,-217],[74,-217],[84,-210],[73,-196],[21,-197]],'#b9a16b');
    poly(c,[[-34,-231],[-30,-261],[-13,-244],[-5,-265],[9,-247]],dark);
    line(c,[[22,-207],[76,-207]],'#382e1b',3);
    for(let i=0;i<5;i++)poly(c,[[26+i*9,-207],[29+i*9,-199],[33+i*9,-207]],'#f3e8b4',null);
    poly(c,[[1,-237],[25,-234],[16,-223],[3,-225]],'#17271d');line(c,[[7,-230],[20,-231]],'#ffee7e',3);
    line(c,[[-21,-243],[-12,-231],[-19,-220],[-12,-210]],'#ffab46',3);
    ellipse(c,73,-221,3,2,'#202819');
  }else if(id==='voltantis'){
    poly(c,[[-33,-225],[-19,-253],[19,-255],[39,-230],[24,-205],[-19,-204]],lit);
    poly(c,[[-31,-235],[-10,-237],[-13,-219],[-32,-225]],'#1d2922');poly(c,[[12,-238],[38,-236],[29,-220],[15,-220]],'#182a1e');
    line(c,[[-23,-230],[-14,-229]],'#f6ffae',3);line(c,[[20,-230],[31,-231]],'#f6ffae',3);
    line(c,[[-17,-252],[-39,-275],[-31,-291]],d.accent,3);line(c,[[17,-253],[32,-279],[48,-285]],d.accent,3);
    poly(c,[[-11,-216],[14,-215],[6,-201],[-3,-204]],dark);
  }else if(id==='glaciolith'){
    poly(c,[[-32,-232],[-13,-253],[19,-250],[41,-227],[31,-197],[-21,-196],[-38,-215]],'#c8e2dd');
    poly(c,[[-35,-224],[-10,-231],[12,-229],[37,-220],[24,-203],[-13,-202]],dark);
    line(c,[[-19,-220],[-7,-218]],'#b4ffff',3);line(c,[[10,-219],[23,-220]],'#b4ffff',3);
    poly(c,[[-24,-204],[2,-211],[28,-202],[18,-185],[-13,-184]],'#e7f3e0');
    poly(c,[[-34,-231],[-45,-263],[-18,-247],[-8,-272],[7,-249],[28,-270],[39,-232]],lit);
  }else if(id==='terrakhan'){
    poly(c,[[-31,-219],[-27,-247],[2,-264],[33,-242],[36,-214],[8,-195],[-24,-199]],base);
    poly(c,[[-7,-253],[7,-285],[24,-285],[15,-269],[19,-251]],lit);
    poly(c,[[-29,-228],[3,-233],[34,-225],[21,-215],[-14,-217]],dark);line(c,[[6,-224],[24,-223]],'#dcff83',3);line(c,[[-20,-223],[-6,-224]],'#dcff83',3);
    poly(c,[[0,-247],[4,-226],[16,-221],[16,-212],[1,-214],[-8,-233]],lit);
  }else if(id==='zephyrix'){
    poly(c,[[-26,-227],[-18,-255],[4,-264],[30,-240],[27,-210],[-6,-196],[-26,-208]],'#ecedd1');
    poly(c,[[-23,-246],[-47,-254],[-31,-228],[-39,-217],[-17,-220]],base);
    poly(c,[[21,-230],[57,-217],[25,-204],[11,-214]],'#d5b77c');line(c,[[12,-239],[29,-235]],'#314b31',4);
    poly(c,[[-10,-255],[-12,-280],[5,-263],[15,-283],[19,-252]],lit);line(c,[[19,-230],[29,-230]],'#b1ed86',2);
  }else if(id==='noxshade'){
    poly(c,[[-27,-232],[-30,-277],[-7,-258],[18,-260],[36,-281],[37,-228],[21,-202],[-9,-202]],base);
    poly(c,[[-24,-266],[-12,-249],[-22,-239]],'#e1bafa');poly(c,[[30,-268],[22,-247],[33,-238]],'#dfb4ff');
    poly(c,[[-21,-231],[-2,-232],[8,-221],[30,-231],[25,-211],[9,-202],[-10,-212]],dark);
    line(c,[[-15,-225],[-4,-221]],'#e7d7ff',3);line(c,[[15,-220],[27,-226]],'#e7d7ff',3);
    poly(c,[[7,-217],[39,-209],[17,-198],[2,-207]],lit);ellipse(c,36,-209,4,3,'#171b20');
    line(c,[[-17,-246],[5,-238],[-1,-227]],'#d6bbdc',2);for(let i=0;i<4;i++)line(c,[[-19+i*7,-245+i*3],[-22+i*7,-235+i*3]],'#171b20',2);
  }else if(id==='aqualance'){
    poly(c,[[-28,-236],[-8,-259],[20,-253],[36,-230],[24,-203],[-12,-203]],base);
    poly(c,[[-56,-249],[-36,-263],[-9,-247],[29,-250],[55,-264],[74,-248],[62,-229],[29,-233],[0,-224],[-40,-232]],lit);
    poly(c,[[-7,-233],[31,-231],[35,-212],[8,-204],[-12,-218]],dark);
    line(c,[[-45,-245],[-31,-246]],'#efffff',3);line(c,[[49,-246],[64,-247]],'#d3faff',3);
    for(let i=0;i<3;i++)line(c,[[-15+i*8,-218],[-10+i*8,-208]],'#a1e6ec',2);
    poly(c,[[-16,-258],[-16,-284],[5,-258]],dark);
  }else{
    poly(c,[[-30,-231],[-22,-259],[10,-268],[37,-244],[40,-221],[22,-201],[-13,-205]],lit);
    poly(c,[[-28,-250],[-47,-272],[-39,-231],[-23,-222]],dark);poly(c,[[21,-258],[42,-275],[39,-245]],base);
    poly(c,[[-24,-235],[3,-240],[31,-231],[34,-216],[11,-208],[-18,-214]],dark);
    line(c,[[-14,-230],[-3,-228]],'#ffb18d',3);line(c,[[13,-230],[30,-229]],'#ffad85',3);
    poly(c,[[4,-224],[43,-220],[36,-208],[10,-204],[-3,-211]],lit);line(c,[[16,-213],[34,-214]],'#2b3b33',2);
    poly(c,[[-8,-264],[-17,-285],[7,-270],[12,-286],[23,-263]],base);
  }
  // Sparse hand-etched armor texture anchors the illustration in the environment.
  c.save();c.globalAlpha=.20;
  for(let i=0;i<21;i++){const px=Math.sin(i*19.7)*30,py=-170+(i*23)%73;line(c,[[px,py],[px+3,py-3]],d.accent,1)}c.restore();
  if(hit){c.globalCompositeOperation='screen';glow(c,15,-137,75,'#fff4b355')}
  c.restore();
}

export function fitCanvas(canvas){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr)}const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w:r.width,h:r.height};}

export function paintPortrait(canvas,d,{hero=false,time=0,face=1}={}){
  const {c,w,h}=fitCanvas(canvas);c.clearRect(0,0,w,h);
  if(hero){glow(c,w*.53,h*.52,h*.43,d.color+'15');
    c.save();c.translate(w*.49,h*.88);c.scale(1,.26);c.strokeStyle='#b9d97844';c.lineWidth=2;c.beginPath();c.arc(0,0,w*.34,0,TAU);c.stroke();c.beginPath();c.arc(0,0,w*.28,0,TAU);c.stroke();c.restore();
    drawCreature(c,d,w*.48,h*.91,h/328,face,{attack:.16},time,{aura:true});
    // Floating embers and registration marks.
    for(let i=0;i<12;i++){const x=w*.15+((i*53)%Math.max(1,w*.7)),y=h*.14+((i*71)%Math.max(1,h*.6));c.globalAlpha=.25+Math.sin(time+i)*.2;ellipse(c,x,y,1.2,1.2,d.accent)}c.globalAlpha=1;
  }else drawCreature(c,d,w*.49,h*1.18,h/254,face,{attack:.10},0,{shadow:false});
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
