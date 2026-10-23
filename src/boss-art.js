// Original encounter illustrations. Every pose is driven by the encounter's
// existing state clock; drawing never advances combat or changes a hitbox.
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const n=(v,f=0)=>Number.isFinite(v)?v:f;
const INK='#101b24',PAPER='#e9ddbf';
const MAJORS=new Set(['briar','bell','leviathan','conductor','hourglass','crown','palimpsest','belltwin','nullheart']);
const THEMES={
 moss:{base:'#557963',dark:'#263f3c',mid:'#82987b',light:'#c8d4a0',energy:'#d7efab'},
 forge:{base:'#96694d',dark:'#3e3440',mid:'#bc9367',light:'#ead3a0',energy:'#ffc279'},
 reef:{base:'#467f8a',dark:'#223d59',mid:'#84adb0',light:'#c4e8dd',energy:'#a9f8e5'},
 storm:{base:'#75658e',dark:'#2d344e',mid:'#aaa0bb',light:'#e4d4d0',energy:'#e5cbff'},
 frost:{base:'#7eabb8',dark:'#34485d',mid:'#a6cccf',light:'#e3f0e9',energy:'#d8faff'},
 rift:{base:'#8b688e',dark:'#30283f',mid:'#bd8ca8',light:'#edd8c9',energy:'#ffbadb'},
};
function rgba(color,opacity){const s=String(color||'#e9ddbf').replace('#','').slice(0,6),h=s.length===3?s.split('').map(x=>x+x).join(''):s;return /^[0-9a-f]{6}$/i.test(h)?`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${clamp(opacity)})`:`rgba(233,221,191,${clamp(opacity)})`;}
function path(c,points,fill,edge=INK,width=1.5){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function oval(c,x,y,rx,ry,fill,edge,width=1.4){c.beginPath();c.ellipse(x,y,Math.max(.05,rx),Math.max(.05,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}}
function line(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function curve(c,points,color,width=2){c.beginPath();c.moveTo(points[0],points[1]);c.bezierCurveTo(...points.slice(2));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function joint(c,x,y,a,draw){c.save();c.translate(x,y);c.rotate(a);draw();c.restore();}
function metal(c,x,y,w,h,t){const g=c.createLinearGradient(x-w,y-h,x+w,y+h);g.addColorStop(0,t.light);g.addColorStop(.22,t.mid);g.addColorStop(.56,t.base);g.addColorStop(1,t.dark);return g;}
function glow(c,x,y,r,color,alpha=.2){const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,rgba(color,alpha));g.addColorStop(1,rgba(color,0));oval(c,x,y,r,r,g);}
function gem(c,x,y,r,t,hot=false){path(c,[[x,y-r],[x+r*.67,y-r*.1],[x+r*.4,y+r*.7],[x,y+r],[x-r*.65,y+r*.1]],hot?t.energy:t.mid,t.dark,1);path(c,[[x,y-r],[x+r*.15,y+r*.2],[x-r*.65,y+r*.1]],t.light,null);line(c,[[x,y-r*.75],[x+r*.1,y+r*.45]],hot?PAPER:t.light,.9);}
function ring(c,x,y,rx,ry,color,width=1,a=0){c.save();c.translate(x,y);c.rotate(a);c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.stroke();c.restore();}
function eye(c,x,y,t,size=4){oval(c,x,y,size*1.5,size*.8,INK);oval(c,x+1,y,size*.75,size*.6,t.energy);oval(c,x+size*.35,y-1,size*.23,size*.23,'#fff7df');}
function rib(c,points,t,w=12){line(c,points,INK,w+3);line(c,points,t.dark,w+1);line(c,points,t.base,w);line(c,points.map(([x,y])=>[x-2,y-2]),rgba(t.light,.45),Math.max(1,w*.17));}
function thorn(c,x,y,length,angle,t){joint(c,x,y,angle,()=>{path(c,[[-5,3],[-5,-length*.36],[0,-length],[7,-length*.3],[8,3]],metal(c,0,-length*.4,6,length*.5,t));line(c,[[0,-length+6],[0,0]],rgba(t.light,.65),1);});}
function plates(c,x,y,count,spacing,t,scale=1){for(let i=0;i<count;i++){const xx=x+i*spacing;path(c,[[xx-11*scale,y+4],[xx-12*scale,y-12*scale],[xx,y-22*scale],[xx+13*scale,y-10*scale],[xx+10*scale,y+6]],metal(c,xx,y,14,20,t));line(c,[[xx-7*scale,y-10*scale],[xx,y-17*scale],[xx+7*scale,y-8*scale]],rgba(t.light,.6),1);}}
function cloth(c,x,y,w,h,t,time,bend=0){c.beginPath();c.moveTo(x-w*.45,y);c.bezierCurveTo(x-w*.6-bend,y+h*.3,x-w*.45+bend,y+h*.7,x-w*.7+Math.sin(time*3+x)*7,y+h);c.lineTo(x-w*.15,y+h*.83);c.lineTo(x+w*.12,y+h*1.03);c.lineTo(x+w*.35,y+h*.84);c.lineTo(x+w*.7+Math.cos(time*2+x)*6,y+h*.96);c.bezierCurveTo(x+w*.4+bend,y+h*.6,x+w*.64-bend,y+h*.2,x+w*.45,y);c.closePath();c.fillStyle=t.dark;c.fill();c.strokeStyle=INK;c.lineWidth=1.7;c.stroke();curve(c,[x-w*.24,y+8,x-w*.3,y+h*.4,x-w*.13,y+h*.68,x-w*.15,y+h*.83],rgba(t.mid,.7),2);curve(c,[x+w*.2,y+8,x+w*.4,y+h*.4,x+w*.1,y+h*.65,x+w*.32,y+h*.84],rgba(t.mid,.6),1.7);}
function hand(c,x,y,t,open=0,scale=1){joint(c,x,y,-open*.15,()=>{oval(c,0,0,9*scale,11*scale,metal(c,0,0,10,12,t),INK);for(let i=0;i<3;i++)curve(c,[-6*scale+i*6*scale,-2*scale,(-9+i*8)*scale,-14*scale,(-7+i*8)*scale,-18*scale-open*9,(i*8-5)*scale,-15*scale-open*11],t.light,3*scale);});}
function arm(c,x,y,side,t,m,weapon=false){const lift=m.wind*(weapon?.95:.65)+(m.cast?.8:0)-m.strike*(weapon?1.4:.8);joint(c,x,y,side*lift,()=>{rib(c,[[0,0],[side*24,34],[side*39,61]],t,13);oval(c,side*23,33,10,10,t.dark,t.mid);path(c,[[side*14,25],[side*37,23],[side*47,54],[side*31,67],[side*17,49]],metal(c,side*29,43,18,25,t));hand(c,side*39,64,t,m.cast,.95);});}
function legs(c,t,m,width=28,height=75,bulk=14){for(const side of[-1,1]){const stride=Math.sin(m.gait+side)*m.walk*10,raise=Math.max(0,Math.cos(m.gait+side))*m.walk*6;joint(c,side*width,-height,side*m.crouch*.15,()=>{rib(c,[[0,0],[side*9+stride,-height*.38+height],[side*15-stride,height-raise-5]],t,bulk);path(c,[[side*4+stride,20],[side*22+stride,22],[side*24-stride,height-8],[side*3-stride,height-5]],metal(c,side*14,height*.55,15,height*.5,t));path(c,[[side*4-stride,height-11],[side*24-stride,height-11],[side*37-stride,height],[side*1-stride,height]],t.dark);line(c,[[side*9-stride,height-6],[side*29-stride,height-2]],rgba(t.light,.5),2);});}}
function pose(e,time){
 const motion=e.reducedMotion||e.frozen>0?0:1,phase=Math.max(1,Math.min(4,n(e.phase,1))),healing=e.state==='heal',bracing=e.state==='countertell'||!!e.guarding;
 const wind=bracing?.7:e.state==='windup'?clamp(1-n(e.timer)/Math.max(1,e.windupFrames||46-phase*5)):0,walk=['patrol','charge','chase','evade'].includes(e.state)?motion:0;
 return {phase,wind,walk,gait:time*(['charge','evade'].includes(e.state)?15:7)+n(e.id),breath:Math.sin(time*2.2+n(e.id))*.012*motion,strike:e.state==='charge'?1:e.state==='attack'?Math.sin(clamp(n(e.attackFrame)/Math.max(1,n(e.moveDuration,60)))*Math.PI):e.state==='recover'?clamp(n(e.timer)/42)*.4:0,cast:healing||e.state==='windup'&&(e.move===1||e.move===2),crouch:healing?.45:e.state==='leap'?.65:e.state==='recover'?.35:wind*.2,flutter:Math.sin(time*4.5)*motion,clock:time*motion,motion};
}
function ribs(c,t,width=38,y=-117,count=5){for(let i=0;i<count;i++){const yy=y+i*11;curve(c,[-width,yy,-width*.56,yy+12,width*.56,yy+12,width,yy],rgba(t.light,.54),2);}}
function crown(c,x,y,t,phase=1){joint(c,x,y,0,()=>{path(c,[[-36,8],[-41,-22],[-23,-8],[-17,-34],[0,-11],[18,-38],[25,-9],[41,-25],[35,8]],metal(c,0,-11,40,30,t));for(const xx of[-24,0,25])gem(c,xx,0,4,t,true);if(phase>=3)for(const side of[-1,1])thorn(c,side*32,-19,25,side*.7,t);});}
function aureole(c,t,m,x=0,y=-168,r=61){ring(c,x,y,r,r*.93,rgba(t.light,.24),1.2);ring(c,x,y,r+7,r*.99,rgba(t.energy,.25),.7,m.clock*.08);for(let i=0;i<9;i++){const a=i*TAU/9+m.clock*.07;gem(c,x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7),2.5,t,i%3===0);}}

function briar(c,t,m){
 // A root-backed mother with a bowed stag mask, four planted limbs and a
 // living seed chamber. The limbs bend independently of the antler crown.
 for(const side of[-1,1])for(let back=1;back>=0;back--){const xx=side*(back?45:62),lift=Math.sin(m.gait+back*2+side)*m.walk*5;rib(c,[[xx,-83],[xx+side*19,-42+lift],[xx+side*27,-4]],back?{...t,base:t.dark}:t,back?14:19);for(let i=0;i<3;i++)curve(c,[xx+side*26,-8,xx+side*(35+i*6),-2,xx+side*(40+i*4),0,xx+side*(47+i*6),-1],t.dark,3);}
 joint(c,0,-108,m.breath-m.wind*.06,()=>{
  oval(c,-5,2,70,60,metal(c,-10,0,75,65,t),INK,2.6);
  for(let i=0;i<7;i++){const xx=-62+i*19;path(c,[[xx,12],[xx-9,-29],[xx+1,-55-(i%2)*10],[xx+21,-28],[xx+18,22]],i%2?t.dark:t.base,INK);curve(c,[xx+2,-40,xx+15,-12,xx+5,2,xx+12,17],rgba(t.light,.65),1.2);}
  oval(c,8,11,28,39,t.dark,t.mid,2);for(let i=0;i<4;i++){const a=i*TAU/4+m.clock*.1;path(c,[[8,14],[8+Math.cos(a)*35,14+Math.sin(a)*40],[8+Math.cos(a+.7)*29,14+Math.sin(a+.7)*37]],t.base,t.light,1);}
  glow(c,8,12,45,t.energy,.2+m.phase*.04);gem(c,8,11,19,t,true);
 });
 for(const side of[-1,1])joint(c,side*30,-156,side*(m.wind*.2+m.strike*.18),()=>{rib(c,[[0,0],[side*12,-41],[side*37,-73]],t,9);for(let i=0;i<4;i++){const yy=-21-i*13;rib(c,[[side*(8+i*6),yy],[side*(27+i*8),yy-21],[side*(35+i*9),yy-30]],t,3.5);oval(c,side*(31+i*9),yy-28,8,4,t.mid);}});
 joint(c,13,-150,-m.wind*.2+m.strike*.16,()=>{path(c,[[-32,-4],[-20,-40],[3,-53],[30,-39],[43,-12],[23,16],[-6,18]],metal(c,3,-15,36,40,t));path(c,[[-24,-33],[-8,-50],[0,-17],[21,-44],[33,-21],[22,4],[0,16]],t.light,INK);for(const side of[-1,1])eye(c,side*14,-15,t,3);path(c,[[-10,-1],[0,6],[10,-1],[5,13],[-4,13]],t.dark);for(const side of[-1,1])curve(c,[side*31,-18,side*49,-6,side*48,3,side*43,16],t.dark,6);});
 if(m.phase>=2)for(let i=0;i<5;i++){const a=i*TAU/5+m.clock*.3,xx=Math.cos(a)*61,yy=-145+Math.sin(a)*23;oval(c,xx,yy,10,5,t.mid);gem(c,xx,yy,3,t,true);}
}
function bell(c,t,m,twin=false){
 legs(c,t,m,26,57,17);cloth(c,0,-112,92,107,t,m.clock,m.flutter*3);
 joint(c,0,-104,-m.wind*.05+m.strike*.09,()=>{
  c.beginPath();c.moveTo(-77,53);c.bezierCurveTo(-65,18,-57,-38,-40,-73);c.bezierCurveTo(-22,-108,25,-106,45,-71);c.bezierCurveTo(59,-29,61,22,80,53);c.closePath();c.fillStyle=metal(c,0,-5,85,100,t);c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();
  path(c,[[-65,40],[-44,-48],[0,-88],[44,-48],[65,40]],t.dark,rgba(t.mid,.65));
  for(let i=0;i<5;i++){const xx=(i-2)*20;path(c,[[xx-5,25],[xx-4,-38],[xx,-49],[xx+5,-38],[xx+6,25]],'#1c2531',rgba(t.mid,.6));glow(c,xx,-2,18,t.energy,.12);line(c,[[xx,-30],[xx,16]],rgba(t.energy,.55),2);}
  oval(c,0,49,80,12,t.dark,t.mid,3);ring(c,0,46,75,9,t.light,2);for(let i=0;i<9;i++)oval(c,-64+i*16,42,2,2,t.light);
  oval(c,0,-12,25,33,t.dark,t.light,2);glow(c,0,-12,36,t.energy,.3);for(let i=0;i<4;i++)curve(c,[-12+i*7,12,-18+i*10,-3,2+i*5,-18,-2+i*7,-35-Math.sin(m.clock*9+i)*5],t.energy,3);
 });
 for(const side of[-1,1])joint(c,side*54,-121,side*(.2+m.wind*.8-m.strike*.9),()=>{rib(c,[[0,0],[side*24,34],[side*29,78]],t,18);path(c,[[side*12,20],[side*34,16],[side*44,61],[side*34,81],[side*13,68]],metal(c,side*27,46,23,40,t));hand(c,side*29,78,t,0,1.3);});
 for(const side of twin?[-1,1]:[1])joint(c,side*(twin?24:0),-195,side*m.flutter*.03,()=>{oval(c,0,0,twin?24:29,33,metal(c,0,0,30,35,t),INK,2);path(c,[[-20,-12],[0,-27],[20,-12],[17,9],[0,23],[-17,8]],t.light);eye(c,-10,-4,t,2.8);eye(c,10,-4,t,2.8);line(c,[[-8,14],[8,14]],t.dark,1.5);thorn(c,-17,-22,23,-.24,t);thorn(c,17,-22,23,.24,t);});
 if(twin){for(const side of[-1,1]){const a=side*(.25+m.flutter*.1+m.wind*.4);joint(c,side*62,-168,a,()=>{line(c,[[0,0],[side*24,31]],t.mid,3);path(c,[[side*12,44],[side*15,24],[side*23,15],[side*32,25],[side*38,44]],metal(c,side*25,32,16,20,t));oval(c,side*25,44,15,4,t.dark,t.light);});}}else{for(const xx of[-22,0,22]){line(c,[[xx,-217],[xx,-239]],t.dark,8);oval(c,xx,-240,8,3,t.mid,t.light);if(m.phase>=2)glow(c,xx,-246,15,t.energy,.13);}}
 if(m.phase>=3)aureole(c,t,m,0,-165,76);
}
function leviathan(c,t,m){
 for(let i=0;i<7;i++){const xx=-73+i*23,side=i<3?-1:1;curve(c,[xx,-57,xx+side*41,-34,xx-side*28+Math.sin(m.clock*3+i)*24,-7,xx+side*(37+Math.sin(m.clock*2+i)*20),-2],t.dark,14);curve(c,[xx,-57,xx+side*37,-34,xx-side*28+Math.sin(m.clock*3+i)*24,-8,xx+side*(36+Math.sin(m.clock*2+i)*20),-3],t.mid,8);for(let j=0;j<3;j++)oval(c,xx+side*9,-40+j*11,2.5,2,t.light);}
 for(const side of[-1,1])joint(c,side*35,-131,side*(m.flutter*.08+m.wind*.2-m.strike*.3),()=>{
  c.beginPath();c.moveTo(0,0);c.bezierCurveTo(side*37,-26,side*113,-89,side*122,-23);c.bezierCurveTo(side*118,7,side*66,57,side*11,53);c.closePath();c.fillStyle=metal(c,side*55,0,70,60,t);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  for(let j=0;j<5;j++)curve(c,[side*8,29,side*40,15-j*11,side*71,-5-j*10,side*(99-j*8),-15-j*8],rgba(t.light,.48),1.2);
 });
 joint(c,0,-123,m.breath-m.wind*.07,()=>{c.beginPath();c.moveTo(-55,52);c.bezierCurveTo(-78,-5,-55,-77,0,-104);c.bezierCurveTo(63,-75,78,-6,56,52);c.bezierCurveTo(28,80,-29,80,-55,52);c.closePath();c.fillStyle=metal(c,0,-8,75,90,t);c.fill();c.strokeStyle=INK;c.lineWidth=2.7;c.stroke();
  for(let i=0;i<6;i++){const yy=-66+i*19;curve(c,[-46,yy,-17,yy+16,18,yy+16,47,yy],rgba(t.mid,.9),2);}
  path(c,[[-27,-56],[0,-81],[28,-56],[36,30],[0,52],[-35,30]],t.dark,t.mid,1.5);for(let i=0;i<5;i++)line(c,[[-20,-44+i*14],[20,-44+i*14]],rgba(t.light,.45),1);gem(c,0,-7,17,t,true);
  for(const side of[-1,1]){eye(c,side*40,-45,t,5);curve(c,[side*50,-58,side*85,-48,side*74,-25,side*100,-16],t.light,2);}
  path(c,[[-22,31],[0,45],[23,31],[16,56],[-15,56]],t.light);for(let i=0;i<7;i++)path(c,[[-18+i*6,34],[-15+i*6,45],[-12+i*6,34]],t.dark,null);
 });
 for(let i=0;i<4;i++)joint(c,(i-1.5)*20,-220,m.flutter*.04,()=>{path(c,[[-7,0],[-4,-20],[3,-28],[8,-2]],i%2?t.mid:t.light);});
 if(m.phase>=2)for(const side of[-1,1])for(let i=0;i<3;i++)thorn(c,side*(55+i*13),-147+i*22,32+m.phase*3,side*(.7+i*.1),t);
}
function conductor(c,t,m){
 legs(c,t,m,18,58,9);cloth(c,0,-119,50,102,t,m.clock,m.flutter*4);
 for(const side of[-1,1])joint(c,side*24,-143,side*(.1+m.flutter*.05+m.wind*.35-m.strike*.4),()=>{
  for(let i=6;i>=0;i--){const length=86+i*9;path(c,[[0,12],[side*(30+i*7),-49-i*7],[side*length,-42+i*10],[side*(length-11),8+i*11],[side*24,52]],metal(c,side*55,-5,65,75,{...t,base:i%2?t.base:t.mid}),INK);line(c,[[side*25,-13],[side*(length-19),-27+i*10]],rgba(t.light,.5),1);}
 });
 path(c,[[-33,-133],[-12,-168],[16,-167],[37,-126],[24,-57],[0,-43],[-25,-65]],metal(c,0,-108,40,60,t));ribs(c,t,29,-120,5);arm(c,28,-139,1,t,m,true);
 joint(c,-25,-139,-m.wind*.4,()=>{rib(c,[[0,0],[-20,38],[-28,60]],t,8);hand(c,-28,61,t,m.cast,.8);});
 joint(c,0,-176,m.breath-m.wind*.16+m.strike*.12,()=>{oval(c,0,-13,25,30,t.light,INK,2);path(c,[[-26,-23],[-20,-45],[-7,-36],[3,-56],[12,-35],[31,-44],[24,-19],[3,-27]],t.mid);path(c,[[17,-19],[45,-9],[23,1],[10,-3]],t.dark,t.light);eye(c,9,-17,t,3.5);for(const side of[-1,1])curve(c,[side*14,-34,side*30,-65,side*49,-64,side*51,-80],t.mid,5);});
 joint(c,67,-79,-.2-m.wind*.65+m.strike*.7,()=>{line(c,[[0,0],[31,-102]],t.light,4);gem(c,32,-106,7,t,true);});
 if(m.phase>=2){aureole(c,t,m,0,-159,69);for(let i=0;i<3;i++){const yy=-175+i*32;curve(c,[-56,yy,-24,yy-6,27,yy+6,57,yy],rgba(t.energy,.5),1);}}
}
function hourglass(c,t,m){
 for(const side of[-1,1])for(const back of[true,false]){const x=side*(back?43:56),step=Math.sin(m.gait+side+(back?2:0))*m.walk*8;rib(c,[[x,-78],[x+step,-34],[x-step,-3]],back?{...t,base:t.dark}:t,11);path(c,[[x-10-step,-11],[x+9-step,-11],[x+15-step,-1],[x-13-step,-1]],t.light);}
 joint(c,0,-117,m.breath,()=>{oval(c,0,20,69,39,metal(c,0,0,80,65,t),INK,2);path(c,[[-57,-2],[-25,-28],[26,-29],[62,-4],[47,26],[-48,29]],t.dark,t.mid);for(let i=0;i<7;i++)gem(c,-46+i*15,-9,8,t,i%2===0&&m.phase>=2);cloth(c,0,-2,80,65,{...t,dark:rgba(t.mid,.5)},m.clock);});
 joint(c,26,-138,-m.wind*.18+m.strike*.2,()=>{path(c,[[-19,31],[-15,-30],[0,-68],[28,-61],[41,-19],[18,31]],metal(c,14,-14,35,60,t));path(c,[[0,-57],[28,-48],[22,-25],[44,-11],[29,9],[8,10],[-8,-10]],t.light);eye(c,21,-24,t,4);path(c,[[30,-11],[58,-5],[47,9],[27,7]],t.mid);for(const side of[-1,1]){const xx=side<0?2:20;rib(c,[[xx,-53],[xx+side*9,-81],[xx+side*26,-105]],t,5);for(let j=0;j<3;j++)rib(c,[[xx+side*(8+j*6),-77-j*10],[xx+side*(31+j*9),-87-j*11]],t,2);}});
 aureole(c,t,m,27,-164,44);ring(c,27,-164,35,35,rgba(t.light,.65),1);line(c,[[27,-164],[27+Math.sin(m.clock*.15)*21,-164-Math.cos(m.clock*.15)*21]],t.light,2);line(c,[[27,-164],[42,-151]],t.mid,1.5);
 if(m.phase>=2)for(let i=0;i<6;i++){const a=i*TAU/6+m.clock*.1;gem(c,27+Math.cos(a)*60,-164+Math.sin(a)*57,5,t,true);}
 if(m.phase>=3)for(const side of[-1,1])thorn(c,side*60,-92,46,side*.6,t);
}
function sovereign(c,t,m){
 for(const side of[-1,1]){cloth(c,side*25,-165,43,152,t,m.clock+side,m.flutter*5);for(let i=0;i<3;i++)curve(c,[side*30,-118,side*(74+i*10),-98,side*(49+i*13),-41,side*(71+i*13),-7],t.dark,7-i);}
 legs(c,t,m,18,60,10);
 joint(c,0,-140,m.breath-m.wind*.06,()=>{path(c,[[-48,-9],[-30,-54],[0,-72],[33,-53],[51,-8],[33,56],[0,74],[-34,52]],metal(c,0,0,60,80,t));path(c,[[-34,-16],[0,-48],[35,-15],[25,39],[0,58],[-27,37]],t.dark,t.mid);const pulse=1+Math.sin(m.clock*4)*.04;glow(c,0,1,48,t.energy,.25);c.save();c.scale(pulse,pulse);c.beginPath();c.moveTo(0,38);c.bezierCurveTo(-57,1,-21,-28,0,-7);c.bezierCurveTo(23,-30,53,2,0,38);c.fillStyle=metal(c,0,0,35,35,{...t,base:t.energy});c.fill();c.strokeStyle=t.light;c.lineWidth=2;c.stroke();c.restore();for(const side of[-1,1])rib(c,[[side*28,-28],[side*38,2],[side*19,32]],t,5);});
 for(const side of[-1,1])arm(c,side*42,-153,side,t,m,true);
 joint(c,0,-204,-m.wind*.15,()=>{path(c,[[-22,-9],[0,-26],[22,-9],[15,20],[0,30],[-15,20]],t.light);eye(c,-8,2,t,3);eye(c,8,2,t,3);path(c,[[-3,13],[3,13],[0,20]],t.dark);crown(c,0,-26,t,m.phase);});
 if(m.phase>=2)aureole(c,t,m,0,-162,95);
 if(m.phase>=3)for(let i=0;i<6;i++){const a=i*TAU/6+m.clock*.08;gem(c,Math.cos(a)*108,-153+Math.sin(a)*91,9,t,true);}
}
function palimpsest(c,t,m){
 // Six writing hands carry an opened, tooth-edged folio. Page layers, spine,
 // bookmarks and ink tendrils all have different periods of secondary motion.
 for(const side of[-1,1])for(let i=0;i<3;i++)joint(c,side*26,-140+i*20,side*(.3+i*.28+m.wind*.6-m.strike*.3+m.flutter*.035),()=>{rib(c,[[0,0],[side*(33+i*10),16],[side*(57+i*8),51]],{...t,base:t.light,mid:t.mid},6);hand(c,side*(57+i*8),51,t,m.cast,.8);});
 for(let i=0;i<5;i++)curve(c,[(-2+i)*16,-67,(-2+i)*23,-40,(-2+i)*8+Math.sin(m.clock*3+i)*25,-12,(-2+i)*25,-3],t.dark,7);
 joint(c,0,-145,-m.wind*.05+m.strike*.06,()=>{
  for(const side of[-1,1])joint(c,0,0,side*(.08+m.wind*.12),()=>{
   path(c,[[0,-68],[side*70,-87],[side*84,-45],[side*79,64],[0,78]],t.dark,t.mid,3);
   for(let layer=3;layer>=0;layer--){const inset=layer*3;path(c,[[side*6,-61+inset],[side*(65-inset),-77+inset],[side*(74-inset),-42],[side*(70-inset),56-inset],[side*6,68-inset]],layer%2?t.light:PAPER,INK,.8);}
   for(let row=0;row<8;row++){const yy=-42+row*11;curve(c,[side*15,yy,side*29,yy-6,side*43,yy-6,side*60,yy-9],rgba(t.dark,.6),1.1);}
   for(let i=0;i<5;i++)path(c,[[side*5,-42+i*20],[side*16,-33+i*20],[side*5,-24+i*20]],t.light,INK,.8);
   eye(c,side*37,-9,t,5);curve(c,[side*18,22,side*30,33,side*49,32,side*61,19],t.dark,3);
  });
  line(c,[[0,-72],[0,78]],t.mid,8);line(c,[[0,-66],[0,69]],t.light,2);
  for(let i=0;i<3;i++)cloth(c,(i-1)*14,64,8,39+i*8,{...t,dark:i%2?t.base:t.mid},m.clock+i);
 });
 if(m.phase>=2)for(let i=0;i<5;i++){const a=i*TAU/5+m.clock*.2,x=Math.cos(a)*105,y=-150+Math.sin(a)*75;joint(c,x,y,Math.sin(m.clock+i)*.2,()=>{path(c,[[-8,-13],[8,-13],[12,-6],[10,13],[-8,13]],PAPER,t.dark,.8);line(c,[[-4,-6],[6,-6]],t.dark,.7);line(c,[[-4,0],[5,0]],t.dark,.7);});}
}
function nullheart(c,t,m,mechanic){
 if(mechanic==='memorycascade'){
  for(const side of[-1,1]){cloth(c,side*17,-155,44,143,t,m.clock+side,m.flutter*7);for(let i=0;i<3;i++)joint(c,side*(48+i*18),-137+i*37,side*(.15+m.flutter*.03+i*.08),()=>{path(c,[[-13,-20],[9,-20],[17,7],[-10,22]],rgba(t.light,.48),rgba(t.mid,.65));line(c,[[-7,-6],[9,-6]],rgba(t.dark,.6),1);});}
  legs(c,t,m,15,57,7);path(c,[[-24,-177],[24,-177],[41,-71],[0,-46],[-39,-69]],metal(c,0,-116,40,70,t));ribs(c,t,22,-151,5);for(const side of[-1,1])arm(c,side*21,-162,side,t,m,true);
  joint(c,0,-190,m.breath,()=>{oval(c,0,-13,23,30,t.light,INK);path(c,[[-27,-26],[-15,-45],[16,-42],[29,-20],[13,-29],[-15,-28]],t.mid);eye(c,-8,-14,t,2.6);eye(c,8,-14,t,2.6);line(c,[[-7,5],[7,5]],t.base,1);crown(c,0,-48,t,m.phase);});aureole(c,t,m,0,-164,76);
 }else if(mechanic==='tidechoir'){
  for(const side of[-1,1])for(let i=0;i<4;i++)curve(c,[side*18,-164,side*(80+i*9),-137+i*17,side*(43+i*13),-48,side*(66+i*11),-6],i%2?t.mid:t.dark,11-i);
  oval(c,0,-112,49,78,metal(c,0,-100,60,90,t),INK,2);for(let i=0;i<9;i++){const a=i*TAU/9+m.clock*.05,x=Math.cos(a)*55,y=-140+Math.sin(a)*70;oval(c,x,y,13,18,t.light,t.dark);eye(c,x-4,y-3,t,1.8);eye(c,x+4,y-3,t,1.8);oval(c,x,y+6,2.5,4,t.dark);}
  gem(c,0,-112,23,t,true);crown(c,0,-213,t,m.phase);aureole(c,t,m,0,-144,91);
 }else{
  // A possible future: an armored child-shaped constellation with empty wing
  // frames, a living heart and articulated ribbon limbs.
  for(const side of[-1,1])joint(c,side*20,-155,side*(m.wind*.25+m.flutter*.035),()=>{for(let i=0;i<3;i++){curve(c,[0,0,side*25,-38,side*(68+i*13),-62+i*26,side*(79+i*8),-25+i*31],t.mid,3);line(c,[[side*(79+i*8),-25+i*31],[side*(55+i*5),24+i*17]],rgba(t.energy,.6),1);}});
  legs(c,t,m,17,65,9);cloth(c,0,-120,43,106,t,m.clock);path(c,[[-32,-170],[0,-188],[32,-169],[26,-87],[0,-65],[-28,-89]],metal(c,0,-132,40,65,t));ribs(c,t,24,-153,5);gem(c,0,-127,18,t,true);for(const side of[-1,1])arm(c,side*27,-164,side,t,m,true);
  joint(c,0,-197,-m.wind*.1,()=>{path(c,[[-23,-18],[0,-35],[24,-16],[19,14],[0,27],[-19,14]],t.light);for(const side of[-1,1])thorn(c,side*18,-23,31,side*.35,t);eye(c,-8,-3,t,3);eye(c,8,-3,t,3);path(c,[[-4,12],[4,12],[0,21]],t.dark);});aureole(c,t,m,0,-156,83);
 }
 if(m.phase>=2)for(let i=0;i<3+m.phase;i++){const a=i*TAU/(3+m.phase)+m.clock*.15;gem(c,Math.cos(a)*108,-135+Math.sin(a)*97,5+m.phase,t,true);}
}

function warden(c,t,m,biome){
 legs(c,t,m,23,64,biome==='forge'?18:12);cloth(c,0,-116,biome==='rift'?49:58,107,t,m.clock,m.flutter*3);
 if(biome==='moss'){
  for(const side of[-1,1]){rib(c,[[side*27,-144],[side*39,-181],[side*66,-209]],t,6);for(let i=0;i<3;i++)rib(c,[[side*(34+i*9),-170-i*11],[side*(57+i*10),-187-i*11]],t,2.5);}
  path(c,[[-39,-130],[-20,-158],[22,-160],[41,-127],[29,-69],[0,-54],[-28,-73]],metal(c,0,-107,50,65,t));plates(c,-23,-123,3,23,t);gem(c,0,-96,15,t,true);
  joint(c,0,-171,-m.wind*.12,()=>{path(c,[[-22,-16],[-9,-40],[16,-32],[31,-9],[16,18],[-7,21]],t.light);eye(c,11,-9,t,3);path(c,[[15,5],[37,10],[24,23],[9,17]],t.mid);});
  arm(c,-31,-135,-1,t,m);joint(c,-65,-81,-.1-m.wind*.15,()=>{path(c,[[-27,-28],[0,-52],[31,-23],[25,33],[0,54],[-29,28]],metal(c,0,0,35,55,t));rib(c,[[0,-40],[-2,38]],t,5);for(const side of[-1,1])for(let i=0;i<3;i++)line(c,[[0,-20+i*18],[side*19,-32+i*17]],t.light,1.1);});
  joint(c,40,-130,-m.wind*.75+m.strike*.85,()=>{rib(c,[[0,0],[25,37],[37,15]],t,11);line(c,[[37,-51],[37,76]],t.dark,7);path(c,[[16,-63],[50,-68],[72,-36],[49,-10],[18,-22]],metal(c,40,-36,40,40,t));});
 }else if(biome==='forge'){
  for(const x of[-28,22]){path(c,[[x-9,-133],[x-9,-210],[x+9,-210],[x+12,-134]],metal(c,x,-173,15,55,t));oval(c,x,-211,11,4,t.dark,t.light);}
  path(c,[[-47,-130],[-29,-158],[32,-159],[49,-124],[42,-60],[-39,-60]],metal(c,0,-110,55,65,t));for(let i=0;i<5;i++)path(c,[[-28+i*14,-126],[-25+i*14,-132],[-22+i*14,-85],[-29+i*14,-85]],t.dark,t.mid);glow(c,0,-99,38,t.energy,.18);gem(c,0,-83,15,t,true);
  joint(c,0,-174,-m.wind*.08,()=>{path(c,[[-24,-20],[-12,-40],[18,-34],[29,-12],[24,17],[-23,17]],metal(c,0,-10,28,35,t));line(c,[[-18,-11],[20,-11]],t.dark,9);line(c,[[-14,-11],[16,-11]],t.energy,3);path(c,[[-11,1],[13,1],[9,17],[-8,17]],t.dark);});
  arm(c,-38,-136,-1,t,m);joint(c,39,-134,-m.wind*.8+m.strike,()=>{rib(c,[[0,0],[25,33],[38,27]],t,15);line(c,[[38,-45],[38,81]],t.dark,8);path(c,[[8,-44],[15,-75],[69,-75],[76,-42],[67,-18],[16,-18]],metal(c,40,-45,45,37,t));for(const xx of[23,40,57])oval(c,xx,-47,3,3,t.dark);});
 }else if(biome==='reef'){
  for(let i=0;i<5;i++)curve(c,[-35,-133,-62-i*5,-111,-69-i*4,-82,-94-i*4,-87],t.mid,4);
  oval(c,-8,-118,42,49,metal(c,0,-115,50,60,t),INK,2);for(let i=0;i<5;i++)curve(c,[-33,-144+i*15,-10,-137+i*15,12,-137+i*15,34,-149+i*15],rgba(t.light,.65),2);gem(c,0,-107,16,t,true);
  joint(c,0,-174,-m.wind*.12,()=>{path(c,[[-23,-12],[-16,-34],[11,-41],[34,-16],[24,11],[-14,18]],metal(c,0,-12,35,40,t));eye(c,13,-15,t,4);path(c,[[-13,6],[21,6],[27,21],[5,27],[-16,18]],t.dark,t.light);for(let i=0;i<4;i++)curve(c,[i*6-13,18,i*9-17,35,i*5-10,39,i*8-15,50],t.mid,3);});
  arm(c,-34,-134,-1,t,m);joint(c,32,-133,-m.wind*.7+m.strike*.9,()=>{rib(c,[[0,0],[27,37],[45,30]],t,11);line(c,[[45,-62],[45,72]],t.dark,7);curve(c,[17,31,12,74,76,80,75,31],t.mid,10);path(c,[[5,28],[30,20],[21,46]],t.light);path(c,[[85,28],[60,20],[69,46]],t.light);});
 }else if(biome==='storm'){
  for(const side of[-1,1])for(let i=0;i<4;i++)path(c,[[side*24,-145],[side*(52+i*13),-194+i*10],[side*(71+i*11),-145+i*17],[side*32,-104]],i%2?t.dark:t.mid);
  path(c,[[-33,-138],[0,-161],[35,-137],[24,-64],[0,-51],[-25,-68]],metal(c,0,-113,45,60,t));ribs(c,t,24,-124,5);gem(c,0,-103,11,t,true);
  joint(c,0,-179,-m.wind*.2,()=>{oval(c,0,-12,23,29,t.light,INK);path(c,[[-22,-29],[-31,-53],[-6,-39],[6,-60],[18,-33],[36,-41],[25,-15]],t.mid);path(c,[[14,-16],[46,-7],[22,6],[10,1]],t.dark,t.light);eye(c,8,-16,t,3);});
  for(const side of[-1,1])arm(c,side*30,-139,side,t,m,side>0);joint(c,71,-75,-m.wind*.75,()=>{line(c,[[0,0],[14,-118]],t.light,4);path(c,[[-2,-115],[15,-138],[29,-112],[15,-102]],t.mid,t.light);gem(c,15,-119,5,t,true);});
 }else if(biome==='frost'){
  for(const side of[-1,1]){rib(c,[[side*18,-185],[side*27,-221],[side*53,-231],[side*56,-207]],t,5);}
  path(c,[[-41,-139],[-16,-166],[27,-162],[44,-129],[26,-69],[0,-53],[-29,-74]],metal(c,0,-111,50,60,t));for(let i=0;i<4;i++)gem(c,-26+i*18,-139,11,t,m.phase>=2);path(c,[[-25,-109],[0,-131],[29,-106],[0,-72]],t.dark,t.light);gem(c,0,-104,13,t,true);
  joint(c,1,-184,-m.wind*.13,()=>{path(c,[[-21,-15],[-11,-40],[12,-37],[26,-14],[18,12],[0,25],[-21,9]],t.light);eye(c,-10,-12,t,3);eye(c,10,-12,t,3);path(c,[[-8,5],[13,5],[25,20],[4,28],[-12,18]],t.mid);});
  arm(c,-31,-140,-1,t,m);joint(c,35,-138,-m.wind*.85+m.strike,()=>{rib(c,[[0,0],[22,38],[37,29]],t,11);line(c,[[37,-59],[37,77]],t.dark,7);path(c,[[17,-58],[43,-84],[83,-62],[76,-19],[45,-7],[27,-23]],metal(c,50,-44,38,45,t));line(c,[[41,-67],[67,-58],[63,-26]],t.light,2);});
 }else{
  for(const side of[-1,1])cloth(c,side*28,-173,25,151,t,m.clock+side,m.flutter*5);path(c,[[-36,-141],[-13,-169],[24,-165],[42,-131],[25,-66],[0,-52],[-26,-70]],metal(c,0,-116,48,60,t));ribs(c,t,27,-128,5);gem(c,0,-107,16,t,true);
  joint(c,0,-183,-m.wind*.12,()=>{path(c,[[-23,-23],[0,-45],[27,-20],[18,12],[0,28],[-19,11]],t.light);for(const side of[-1,1])thorn(c,side*18,-27,29,side*.4,t);for(const yy of[-16,-5])for(const side of[-1,1])eye(c,side*9,yy,t,2);});
  for(const side of[-1,1])arm(c,side*31,-142,side,t,m,true);aureole(c,t,m,0,-175,59);for(const side of[-1,1])joint(c,side*63,-84,side*m.wind*.5,()=>{line(c,[[0,0],[side*17,-69]],t.mid,5);path(c,[[side*11,-66],[side*30,-109],[side*39,-59],[side*21,-28]],t.light,t.dark);});
 }
 if(m.phase>=2){glow(c,0,-116,64,t.energy,.065*m.phase);for(const side of[-1,1])gem(c,side*40,-139,5,t,true);}
 if(m.phase>=3){ring(c,0,-121,67,89,rgba(t.energy,.26),1,m.clock*.05);for(const side of[-1,1])thorn(c,side*46,-132,32,side*.8,t);}
}
function reaver(c,t,m,biome){
 if(biome==='moss'){
  // A fungal garden carried by a six-legged, long-tailed matriarch.
  for(const side of[-1,1])for(let i=0;i<3;i++){const xx=(i-1)*31,step=Math.sin(m.gait+i*1.5+side)*m.walk*7;rib(c,[[xx,-63],[xx+side*(31+i*4),-34+step],[xx+side*(38+i*5),-2]],t,7);}
  oval(c,-7,-77,69,43,metal(c,0,-77,80,50,t),INK,2);for(let i=0;i<6;i++){const xx=-58+i*22,hh=24+(i%3)*14;line(c,[[xx,-91],[xx+Math.sin(m.clock*3+i)*2,-91-hh]],t.dark,4);oval(c,xx,-91-hh,17,6,i%2?t.mid:t.light,INK);for(let j=0;j<3;j++)oval(c,xx-8+j*7,-92-hh,1.2,1.2,t.dark);}
  joint(c,48,-88,-m.wind*.2+m.strike*.25,()=>{path(c,[[-17,-18],[2,-38],[35,-28],[54,-7],[38,16],[0,17]],metal(c,17,-11,45,35,t));for(let i=0;i<3;i++)eye(c,12+i*11,-13+i*3,t,2.5);path(c,[[23,5],[64,4],[51,22],[24,21]],t.dark,t.light);});
  curve(c,[-63,-78,-125,-73,-123,-133,-93,-147],t.dark,12);path(c,[[-104,-147],[-89,-176],[-74,-150],[-89,-135]],t.mid,t.light);gem(c,-89,-152,8,t,true);
 }else if(biome==='forge'){
  // A crawling confessional kiln, with articulated bell legs and a censer jaw.
  for(const side of[-1,1])for(let i=0;i<2;i++){const xx=(i?1:-1)*41,step=Math.sin(m.gait+i*3+side)*m.walk*7;rib(c,[[xx,-55],[xx+side*19,-30+step],[xx+side*38,-2]],t,12);path(c,[[xx+side*27,-14],[xx+side*48,-14],[xx+side*56,0],[xx+side*23,0]],t.dark);}
  path(c,[[-70,-63],[-64,-115],[-43,-151],[23,-149],[57,-116],[67,-57],[29,-37],[-35,-36]],metal(c,0,-92,85,65,t));for(const xx of[-32,-5,22]){path(c,[[xx-7,-137],[xx-7,-193],[xx+8,-193],[xx+11,-141]],t.base,t.dark);oval(c,xx,-194,10,4,t.dark,t.mid);}
  for(let i=0;i<5;i++)path(c,[[-45+i*20,-112],[-42+i*20,-120],[-37+i*20,-65],[-48+i*20,-65]],t.dark,t.mid);glow(c,0,-94,43,t.energy,.2);oval(c,0,-92,20,25,t.dark,t.light);for(let i=0;i<4;i++)line(c,[[-13+i*8,-109],[-13+i*8,-75]],t.energy,2);
  joint(c,58,-95,-m.wind*.3+m.strike*.5,()=>{path(c,[[-9,-18],[15,-31],[47,-18],[59,3],[35,26],[-5,21]],t.mid,t.dark);eye(c,28,-8,t,4);path(c,[[23,15],[66,15],[52,35],[24,30]],t.dark,t.light);for(let i=0;i<4;i++)path(c,[[29+i*8,17],[33+i*8,26],[37+i*8,17]],t.light,null);});
 }else if(biome==='reef'){
  // A ledger-eating angler ray with a fan of bone pages and ribbon fins.
  for(const side of[-1,1])joint(c,side*10,-102,side*(m.flutter*.07+m.wind*.25),()=>{path(c,[[0,0],[side*61,-89],[side*120,-31],[side*89,39],[side*16,54]],metal(c,side*60,-5,75,80,t));for(let i=0;i<5;i++)line(c,[[side*13,12],[side*(52+i*13),-45+i*14]],rgba(t.light,.6),1.2);});
  oval(c,0,-96,49,57,metal(c,0,-95,60,65,t),INK,2);for(const side of[-1,1])eye(c,side*20,-117,t,5);path(c,[[-32,-83],[0,-95],[32,-82],[27,-54],[0,-43],[-29,-55]],t.dark,t.light);for(const side of[-1,1])for(let i=0;i<5;i++)path(c,[[side*(2+i*6),-85],[side*(4+i*5),-65],[side*(8+i*5),-84]],PAPER,null);
  curve(c,[0,-147,-4,-199,48,-218,59,-182],t.mid,4);glow(c,59,-179,25,t.energy,.24);gem(c,59,-179,8,t,true);for(let i=0;i<5;i++)curve(c,[-25+i*13,-51,-58+i*26,-23,-12+i*5,-17+Math.sin(m.clock*3+i)*8,-36+i*19,-3],t.mid,6);
 }else if(biome==='storm'){
  // A bell-breaking raptor: hooked beak, forked tail, split flight feathers.
  for(const side of[-1,1]){rib(c,[[side*19,-58],[side*25,-22],[side*39,-2]],t,9);for(let i=0;i<3;i++)line(c,[[side*39,-3],[side*(48+i*7),-1]],t.light,3);}
  for(const side of[-1,1])joint(c,side*19,-111,side*(m.flutter*.09+m.wind*.25-m.strike*.3),()=>{for(let i=4;i>=0;i--)path(c,[[0,0],[side*(56+i*13),-87+i*12],[side*(96+i*9),-45+i*19],[side*(52+i*8),30+i*10],[side*7,33]],i%2?t.mid:t.dark,t.light,.8);});
  oval(c,0,-96,36,57,metal(c,0,-99,45,65,t),INK,2);plates(c,-20,-105,3,20,t,.8);joint(c,12,-151,-m.wind*.23+m.strike*.2,()=>{path(c,[[-21,-4],[-18,-38],[7,-51],[37,-28],[28,9],[2,19]],t.mid,t.dark);path(c,[[27,-24],[73,-8],[51,3],[46,17],[30,7]],t.dark,t.light);eye(c,22,-22,t,4);for(let i=0;i<3;i++)thorn(c,-9+i*13,-36,29+i*8,(i-1)*.3,t);});for(const side of[-1,1])cloth(c,side*15,-61,18,58,t,m.clock+side,m.flutter*5);
 }else if(biome==='frost'){
  // An antlered mourning moth, with torn veils and a visible clock-heart.
  for(const side of[-1,1])joint(c,side*12,-123,side*(.1+m.flutter*.04+m.wind*.3),()=>{path(c,[[0,0],[side*57,-82],[side*101,-20],[side*88,57],[side*59,37],[side*44,84],[side*21,57]],metal(c,side*44,0,65,90,t));for(let i=0;i<5;i++)curve(c,[side*7,12,side*29,-15+i*7,side*61,-40+i*21,side*(85-i*7),-10+i*19],rgba(t.light,.55),1.1);gem(c,side*55,-9,13,t,m.phase>=2);});
  oval(c,0,-111,26,61,t.dark,t.mid,2);for(let i=0;i<5;i++)oval(c,0,-139+i*20,27-i*3,8,metal(c,0,-130+i*20,28,13,t),INK);gem(c,0,-121,16,t,true);oval(c,0,-181,22,25,t.light,INK);for(const side of[-1,1]){eye(c,side*9,-182,t,3);rib(c,[[side*13,-198],[side*20,-222],[side*37,-239]],t,4);rib(c,[[side*20,-220],[side*41,-222]],t,2);curve(c,[side*15,-59,side*34,-24,side*16,-20,side*40,-3],t.mid,4);}
 }else{
  // A four-armed phantom butcher: canine mask and floating blade gauntlets.
  for(const side of[-1,1]){cloth(c,side*17,-129,35,127,t,m.clock+side,m.flutter*6);rib(c,[[side*18,-60],[side*30,-27],[side*45,-2]],t,10);for(let row=0;row<2;row++)joint(c,side*26,-150+row*37,side*(.24+row*.24+m.wind*.8-m.strike*.9),()=>{rib(c,[[0,0],[side*23,29],[side*48,25]],t,9);for(let i=0;i<3;i++)path(c,[[side*39,19+i*7],[side*(76-i*6),-12+i*9],[side*51,34+i*6]],t.light,t.dark);});}
  path(c,[[-34,-149],[-12,-174],[24,-166],[35,-119],[24,-66],[0,-51],[-26,-73]],metal(c,0,-116,43,65,t));gem(c,0,-123,16,t,true);joint(c,4,-182,-m.wind*.17+m.strike*.1,()=>{path(c,[[-24,-8],[-24,-38],[-10,-26],[1,-51],[17,-24],[31,-34],[30,-5],[15,15],[-9,16]],t.light);path(c,[[13,-4],[57,4],[43,18],[11,18]],t.mid,t.dark);eye(c,15,-9,t,4);path(c,[[26,12],[52,13],[42,25],[24,22]],t.dark);});aureole(c,t,m,0,-153,70);
 }
 if(m.phase>=2){glow(c,0,-101,60,t.energy,.07*m.phase);for(let i=0;i<m.phase+2;i++){const a=i*TAU/(m.phase+2)+m.clock*.22;gem(c,Math.cos(a)*78,-113+Math.sin(a)*47,4,t,true);}}
}

/** Draw a redesigned boss in world coordinates. Unknown IDs retain fallback art. */
export function drawArenaBoss(c,e,b,time=0){
 if(!c||!e||!b||(!MAJORS.has(e.boss)&&!b.miniboss&&!b.mini))return false;
 const t={...(THEMES[b.biome]||THEMES.rift)},m=pose(e,n(time));
 if(b.color)t.energy=b.color;
 c.save();
 try{
  c.translate(n(e.x),n(e.y));c.scale(e.face===-1?-1:1,1);
  oval(c,0,1,e.boss==='leviathan'?110:74,9,'#03101770');
  // A warm rim and restrained core glow finish the material without covering
  // the ground telegraphs that the encounter renderer draws separately.
  if(m.phase>=2||e.state==='enrage')glow(c,0,-110,100,t.energy,e.state==='enrage'?.13:.035*m.phase);
  if(e.flash)c.globalAlpha*=.8;
  if(e.state==='sealed'){c.globalAlpha*=.62;ring(c,0,-113,78,103,rgba(t.light,.25),2);}
  if(b.miniboss||b.mini){if(b.encounter==='reaver'||String(e.boss).endsWith('-reaver'))reaver(c,t,m,b.biome);else warden(c,t,m,b.biome);}
  else if(e.boss==='briar')briar(c,t,m);
  else if(e.boss==='bell')bell(c,t,m);
  else if(e.boss==='leviathan')leviathan(c,t,m);
  else if(e.boss==='conductor')conductor(c,t,m);
  else if(e.boss==='hourglass')hourglass(c,t,m);
  else if(e.boss==='crown')sovereign(c,t,m);
  else if(e.boss==='palimpsest')palimpsest(c,t,m);
  else if(e.boss==='belltwin')bell(c,{...t,base:'#a98b59',mid:'#d2b17a',light:'#f2ddb1'},m,true);
  else nullheart(c,t,m,b.mechanic);
  // Phase-three fissures are part of the new silhouettes, not a global tint.
  if(m.phase>=3){for(let i=0;i<4;i++){const x=(i-1.5)*19,yy=-93-i%2*21;line(c,[[x,yy-12],[x-3,yy],[x+4,yy+9]],rgba(t.energy,.58),1.3);}}
 }finally{c.restore();}
 return true;
}
