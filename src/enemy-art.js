// The field bestiary: original, independently articulated silhouettes.
import {ECOLOGY_MINIONS} from './minion-species.js';
// Feet remain at the supplied entity origin; this module is presentation only.
const TAU=Math.PI*2,INK='#101b23';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const SPECIES=new Set(['sinder','voltlet','pebbleback','dewdrop','sproutlet','thornling','ashwing','inkfin','stormkite','frostmite','riftling','glassmarauder','veilwasp','graveburrower','chaincaster','candlewraith','clockscarab','oathbound','hushling']);
for(const id of ECOLOGY_MINIONS)SPECIES.add(id);
function mix(hex,other,ratio){const a=/^#[\da-f]{6}$/i.test(hex)?hex:'#a8cab8',b=/^#[\da-f]{6}$/i.test(other)?other:'#fff4d6';return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-ratio)+parseInt(b.slice(i,i+2),16)*ratio).toString(16).padStart(2,'0')).join('');}
function path(c,commands,fill,edge=INK,width=1.45){c.beginPath();for(const [op,...v]of commands){if(op==='M')c.moveTo(...v);else if(op==='L')c.lineTo(...v);else if(op==='C')c.bezierCurveTo(...v);else if(op==='Q')c.quadraticCurveTo(...v);else c.closePath();}if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function poly(c,p,fill,edge=INK,w=1.4){path(c,[['M',...p[0]],...p.slice(1).map(p=>['L',...p]),['Z']],fill,edge,w);}
function oval(c,x,y,rx,ry,fill,edge=null,w=1.2){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
function line(c,p,col,w=1.4){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();}
function curve(c,a,col,w=1.4){c.beginPath();c.moveTo(a[0],a[1]);c.bezierCurveTo(...a.slice(2));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.stroke();}
function grad(c,x,y,w,h,light,dark){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,light);g.addColorStop(.4,mix(light,dark,.24));g.addColorStop(1,dark);return g;}
function glow(c,x,y,r,col,opacity=.3){c.save();c.globalAlpha*=opacity;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);c.restore();}
function joint(c,x,y,a,draw){c.save();c.translate(x,y);c.rotate(a);draw();c.restore();}
function eye(c,x,y,color,size=2.4,blink=false){oval(c,x,y,size*1.55,blink?.7:size*1.25,INK);if(!blink){oval(c,x+.6,y,size*.65,size*.9,color);oval(c,x+1,y-size*.35,size*.22,size*.22,'#fffde5');}}
function claw(c,x,y,side=1){for(let n=0;n<3;n++)path(c,[['M',x+n*3,y],['Q',x+n*3+side*5,y+1,x+n*3+side*4,y+5],['L',x+n*3-1,y+2],['Z']],'#d8d2b8',INK,.7);}
function limb(c,x,y,knee,foot,thick,col,highlight){line(c,[[x,y],knee,foot],INK,thick+2.2);line(c,[[x,y],knee,foot],col,thick);line(c,[[x-1,y],[knee[0]-1,knee[1]]],highlight,.9);oval(c,knee[0],knee[1],thick*.4,thick*.4,highlight);}
function leaf(c,x,y,len,a,col,light){joint(c,x,y,a,()=>{path(c,[['M',0,2],['C',-len*.48,-len*.35,-len*.38,-len*.8,0,-len],['C',len*.43,-len*.7,len*.35,-len*.15,0,2],['Z']],col,INK,1);curve(c,[0,0,-2,-len*.3,2,-len*.6,0,-len*.9],light,.8);});}
function crystal(c,x,y,w,h,col){poly(c,[[x-w*.5,y],[x-w*.64,y-h*.65],[x,y-h],[x+w*.5,y-h*.55],[x+w*.35,y]],grad(c,x-w,y-h,w,h,col,mix(col,INK,.55)));poly(c,[[x,y-h],[x+w*.5,y-h*.55],[x+w*.35,y],[x,y-h*.2]],mix(col,'#fff3d5',.3),null);line(c,[[x,y-h*.85],[x-w*.34,y-h*.62],[x-w*.32,y-h*.15]],mix(col,'#fff9e5',.6),.8);}
function pose(e,t){
 const still=!!e.reducedMotion||e.frozen>0,time=still?0:t,s=String(e.kind).split('').reduce((n,v)=>n+v.charCodeAt(0),0);
 const moving=['patrol','chase','charge','attack'].includes(e.state),wind=e.state==='windup',charge=e.state==='charge',recover=e.state==='recover',attack=e.state==='attack',dead=e.hp<=0&&e.deathTimer>0;
 return {t:time,wind,charge,recover,attack,dead,broken:e.shieldBroken>0,flipped:e.flipped>0,burrow:e.state==='burrow',stun:e.stun>0||e.state==='stun'||e.state==='stagger',death:dead?clamp(1-finite(e.deathTimer,35)/35):0,
  bob:still||dead?0:Math.sin(time*3+s)*.9,walk:moving&&!still&&!dead?Math.sin(time*11+s):0,pace:time*11+s,flap:still||dead?0:Math.sin(time*19+s),anticipation:wind?clamp(1-finite(e.timer,30)/42):0,
  reach:charge?1:attack?.8:wind?-.3:recover?-.14*clamp(finite(e.timer,20)/40):0,blink:dead||!still&&Math.sin(time*.72+s)>.992,hurt:e.flash>0};
}

function sinder(c,m,p){
 const leg=m.walk*5;
 path(c,[['M',-17,-23],['C',-30,-35,-43,-17,-41,-10],['C',-32,-18,-27,-10,-17,-9]],p.dark,INK,2);
 for(const back of [true,false])for(const x of[-13,12]){const d=leg*(x<0?-1:1)*(back?-1:1);limb(c,x,-17,[x+d,-8],[x+d+6,-1],4,back?p.dark:p.mid,p.edge);if(!back)claw(c,x+d+4,-3);}
 path(c,[['M',-25,-18],['C',-28,-43,5,-48,22,-27],['L',16,-10],['C',1,-6,-17,-7,-25,-18],['Z']],p.body);
 for(let n=0;n<5;n++)crystal(c,-21+n*7,-31-n%2*4,9,12+n%2*5,p.mid);
 joint(c,15,-28,m.reach*.25,()=>{path(c,[['M',-2,-8],['C',4,-21,21,-18,27,-8],['L',39,-4],['Q',45,3,36,8],['L',13,10],['Q',-4,8,-2,-8],['Z']],p.body);path(c,[['M',15,5],['L',38,4],['Q',32,13,14,10]],p.pale);eye(c,18,-7,'#ffeab0',2.6,m.blink);line(c,[[22,8],[37,7]],p.dark,.9);for(let n=0;n<3;n++)poly(c,[[24+n*4,6],[26+n*4,10],[27+n*4,6]],'#fff2c9',null);});
 for(let n=0;n<3;n++)curve(c,[-16+n*10,-28,-12+n*9,-23,-18+n*11,-17,-10+n*9,-15],'#f3b46e',1.3);
 if(m.wind||m.charge){glow(c,35,-25,20,'#ffb865',.35);path(c,[['M',29,-20],['Q',25,-30,32+m.flap,-44],['Q',35,-32,43,-24],['Q',37,-15,29,-20]],'#ffc575',null);}
}
function voltlet(c,m,p){
 for(let n=0;n<5;n++){const x=-22+n*10,lift=Math.max(0,Math.sin(m.pace+n))*3;limb(c,x,-10,[x+3,-5],[x+5,-1-lift],2.3,p.dark,p.edge);}
 for(let n=0;n<5;n++){const x=-23+n*10;oval(c,x,-17-Math.sin(m.t+n)*1.3,11,15,p.body,INK);curve(c,[x-6,-27,x-3,-31,x+4,-30,x+7,-25],p.edge,1.3);}
 joint(c,22,-23,m.reach*.35,()=>{oval(c,0,0,13,16,p.body,INK);eye(c,6,-4,'#fbffd3',3,m.blink);poly(c,[[8,8],[17,4],[14,11]],p.pale);for(const s of[-1,1]){curve(c,[-3,-13,s*13,-22,s*13,-29,s*20,-31],p.dark,2.5);oval(c,s*20,-31,3.5,4,p.light);glow(c,s*20,-31,10,p.light,.2);}});
 if(m.wind||m.charge)for(let n=0;n<3;n++)line(c,[[-25+n*22,-37],[-17+n*22,-43],[-21+n*22,-49]],p.light,1.5);
}
function pebbleback(c,m,p){
 if(m.flipped){c.translate(0,-28);c.rotate(Math.PI+Math.sin(m.t*9)*.06);c.translate(0,28);}
 for(const side of[-1,1])for(const x of[-21,17]){const d=m.walk*(x<0?1:-1)*3;limb(c,x,-13,[x+side*6,-7],[x+side*9+d,0],5,side<0?p.dark:p.mid,p.edge);}
 oval(c,0,-19,32,20,p.dark,INK);path(c,[['M',-31,-17],['C',-35,-49,-15,-62,9,-58],['C',29,-57,39,-35,31,-15],['Q',1,-5,-31,-17],['Z']],p.body);
 for(const [x,y,w,h]of[[-16,-37,18,12],[5,-43,21,16],[23,-29,13,11],[-7,-20,23,11]]){poly(c,[[x-w*.5,y],[x-w*.3,y-h],[x+w*.4,y-h*.8],[x+w*.5,y-1],[x,y+4]],p.mid,p.dark,1);line(c,[[x-w*.23,y-h+3],[x+w*.2,y-h+2]],p.edge,.9);}
 joint(c,28,-18,m.reach*.35,()=>{path(c,[['M',-3,-4],['Q',3,-18,14,-11],['L',22,0],['Q',14,10,0,7],['Z']],p.mid);eye(c,12,-4,'#fff1aa',2.5,m.blink);poly(c,[[13,5],[24,2],[17,10]],p.pale);});
 if(m.wind)crystal(c,0,-47,14,14,p.light);
 if(m.flipped){oval(c,0,-16,24,11,p.pale,p.dark);for(let n=-1;n<=1;n++)curve(c,[n*11,-24,n*13,-19,n*11,-13,n*9,-8],p.mid,1.1);}
}
function dewdrop(c,m,p){
 for(let n=0;n<3;n++)curve(c,[-15,-20,-31,-26+n*5,-47-m.reach*7,-8+n*6,-51-m.reach*7,-20+n*8],n%2?p.mid:p.dark,3-n*.5);
 path(c,[['M',-21,-24],['C',-26,-48,0,-62,16,-44],['C',36,-37,34,-11,14,-5],['C',-4,3,-24,-6,-21,-24],['Z']],p.body);
 path(c,[['M',-14,-39],['C',-5,-53,13,-48,17,-39],['Q',0,-44,-14,-31]],'#f1fff633',null);
 for(const s of[-1,1])leaf(c,s*13,-15,22,s*(.95+m.reach*.3),p.mid,p.edge);
 eye(c,15,-30,'#f9ffdf',3,m.blink);oval(c,23,-20,4,2,p.dark);oval(c,-5,-29,4,7,'#efffe542');
 if(m.wind){oval(c,25,-16,7+m.anticipation*4,7+m.anticipation*4,'#a8f0f744',p.edge);glow(c,25,-16,16,p.light,.15);}
}
function sproutlet(c,m,p){
 if(m.burrow){oval(c,0,-1,28,5,p.dark,INK);for(const [x,a]of[[-15,-.7],[0,.1],[15,.7]])leaf(c,x,-2,13,a,p.mid,p.edge);return;}
 const crouch=m.wind?m.anticipation*8:0;c.translate(0,crouch);
 for(const x of[-11,11])limb(c,x,-16,[x+m.walk*3,-7],[x*1.5-m.walk*3,-crouch],3.4,p.dark,p.edge);
 path(c,[['M',-22,-11],['C',-30,-30,-15,-48,2,-45],['C',23,-44,30,-22,18,-10],['Q',0,-2,-22,-11],['Z']],p.body);
 for(const [x,y,a]of[[-15,-31,-.7],[0,-40,.12],[14,-32,.75]])leaf(c,x,y,23,a,p.mid,p.edge);
 path(c,[['M',-9,-21],['Q',0,-35,12,-24],['Q',8,-10,-4,-10],['Z']],p.dark,p.edge,.9);
 eye(c,-1,-23,'#ffe9b2',2.5,m.blink);eye(c,11,-22,'#ffe9b2',2.3,m.blink);curve(c,[-4,-13,1,-10,8,-10,12,-14],p.pale,1);
 for(const s of[-1,1]){curve(c,[s*17,-20,s*34+m.reach*8,-28+s*m.walk,s*32+m.reach*13,-10-m.reach*8,s*27+m.reach*15,-3-m.reach*8],p.mid,4);leaf(c,s*29+m.reach*12,-14-m.reach*6,12,s*.9+m.reach*.3,p.dark,p.edge);}
}
function thornling(c,m,p){
 for(const s of[-1,1])limb(c,s*9,-20,[s*(15+m.walk*2),-10],[s*(23-m.walk*2),-1],3.4,p.dark,p.edge);
 path(c,[['M',-17,-23],['C',-23,-42,-12,-56,2,-58],['C',19,-58,23,-38,14,-20],['L',0,-11],['Z']],p.body);
 for(const s of[-1,1])joint(c,s*13,-39,s*(m.wind?-.6:m.reach*.5)+Math.sin(m.t*4+s)*.06,()=>{curve(c,[0,0,s*13,-5,s*22,10,s*25,20],p.mid,4);for(let n=0;n<3;n++)poly(c,[[s*(9+n*5),-1+n*5],[s*(22+n*5),-10+n*5],[s*(15+n*5),9+n*5]],p.mid,p.dark,.7);});
 for(const [x,a,l]of[[-17,-.8,27],[-5,-.3,35],[8,.3,37],[19,.9,24]])leaf(c,x,-47,l,a,p.mid,p.edge);
 path(c,[['M',-13,-50],['Q',0,-69,15,-49],['L',11,-34],['Q',0,-29,-11,-37],['Z']],p.dark,p.edge,1);
 eye(c,-3,-46,'#f7f0bb',2.7,m.blink);eye(c,8,-46,'#f7f0bb',2.7,m.blink);
 poly(c,[[0,-40],[5,-36],[0,-33],[-3,-36]],p.pale,null);for(let n=0;n<3;n++)oval(c,-8+n*8,-28,2,3,p.light);
}
function ashwing(c,m,p){
 const f=m.flap*.35+(m.wind?-.45:m.charge?.3:0);
 for(const s of[-1,1])joint(c,s*7,-27,s*f,()=>{path(c,[['M',0,0],['Q',s*10,-34,s*40,-46],['Q',s*37,-28,s*53,-15],['Q',s*29,-24,s*27,1],['Q',s*12,-10,0,11],['Z']],p.body);for(let n=1;n<4;n++)curve(c,[0,-1,s*n*10,-12,s*n*12,-25,s*n*13,-34+n*5],p.edge,1);});
 oval(c,0,-27,12,23,p.dark,INK);for(let n=0;n<4;n++)poly(c,[[-8,-40+n*10],[0,-45+n*10],[9,-40+n*10],[0,-35+n*10]],p.mid,p.dark,.7);
 path(c,[['M',-12,-44],['L',-16,-66],['L',-4,-55],['Q',5,-62,13,-53],['L',20,-64],['L',17,-38],['Q',0,-29,-12,-44],['Z']],p.body);eye(c,6,-48,'#ffefb7',3,m.blink);poly(c,[[7,-40],[18,-38],[8,-34]],p.pale);
 for(const s of[-1,1])line(c,[[s*5,-9],[s*11,1],[s*17,-1]],p.mid,2);if(m.charge||m.wind)glow(c,8,-37,18,'#ffae66',.2);
}
function inkfin(c,m,p){
 const f=m.flap*5+m.reach*9;
 path(c,[['M',-10,-18],['C',-28,-12,-31,19,-52,15],['C',-39,14,-42,-8,-24,-25]],p.dark,INK,2);
 for(const s of[-1,1])path(c,[['M',0,-37],['C',s*18,-42,s*31,-59+f,s*52,-56+f],['C',s*41,-39+f,s*50,-15,s*29,-10],['Q',s*17,-9,0,-5],['Z']],p.body);
 for(const s of[-1,1])for(let n=0;n<3;n++)curve(c,[s*5,-29,s*17,-38+n*9,s*25,-45+n*9,s*37,-46+n*9+f*.5],p.edge,.8);
 path(c,[['M',-12,-40],['C',-5,-55,15,-54,21,-38],['L',29,-24],['Q',7,-11,-6,-22],['Z']],p.mid);eye(c,15,-35,'#efffe4',2.7,m.blink);for(let n=0;n<4;n++)oval(c,2-n*7,-18,2.7,1.2,p.light);
 if(m.wind)curve(c,[25,-25,31,-19,33,-14,42,-19],p.dark,3);
}
function stormkite(c,m,p){
 for(const s of[-1,1])joint(c,s*7,-37,s*(m.flap*.27+(m.wind?-.35:0)),()=>{path(c,[['M',0,0],['Q',s*20,-42,s*54,-47],['L',s*41,-32],['L',s*55,-27],['L',s*34,-18],['L',s*43,-13],['L',s*19,2],['Q',s*7,7,0,0],['Z']],p.body);for(let n=0;n<4;n++)line(c,[[s*(14+n*8),-17-n*5],[s*(30+n*7),-21-n*5]],p.edge,1.3);});
 path(c,[['M',-15,-26],['Q',-18,-52,1,-54],['Q',16,-50,17,-30],['L',5,-10],['L',-14,-7],['L',-3,-20],['Z']],p.mid);for(let n=0;n<3;n++)poly(c,[[-7+n*6,-15],[-18+n*7,8],[-1+n*6,-6]],p.dark);
 joint(c,8,-49,m.wind?-.2:m.reach*.2,()=>{path(c,[['M',-9,-1],['Q',-12,-20,5,-22],['L',21,-12],['L',11,2],['Q',1,9,-9,-1],['Z']],p.body);poly(c,[[14,-14],[32,-5],[13,-3]],'#cbbca7');eye(c,8,-13,'#ffedbf',2.8,m.blink);poly(c,[[-7,-16],[-5,-31],[2,-25],[8,-33],[10,-20]],p.mid);});
 if(m.wind){line(c,[[16,-63],[22,-70],[19,-75],[27,-82]],p.light,1.8);glow(c,22,-69,17,p.light,.25);}
}
function frostmite(c,m,p){
 for(const s of[-1,1])for(let n=0;n<4;n++){const x=-22+n*14,d=Math.sin(m.pace+n*1.1)*4;limb(c,x,-15,[x+s*(7+m.reach*3),-8-m.anticipation*3],[x+s*11+d+m.reach*5,-1],2.6,p.dark,p.edge);}
 oval(c,0,-21,32,19,p.dark,INK);for(let n=0;n<6;n++)crystal(c,-28+n*11,-13,12,28+(n%3)*9,p.mid);
 oval(c,26,-20,12,13,p.body,INK);eye(c,31,-22,'#f7fbd6',2.5,m.blink);for(const s of[-1,1])curve(c,[31,-11+s*3,42+m.reach*5,-7+s*(4+m.anticipation*4),45+m.reach*8,-16+s*5,40+m.reach*9,-19+s*(4+m.anticipation*6)],p.pale,2.2);
 for(let n=0;n<4;n++)oval(c,-16+n*10,-25,1.4,1.4,'#f2ffff');
}
function riftling(c,m,p){
 for(let n=0;n<4;n++){const swing=Math.sin(m.t*5+n)*5;path(c,[['M',-17+n*8,-18],['C',-34+n*9,-6,-21+n*11,10+swing,-36+n*13,11],['Q',-8+n*10,15,-2+n*8,-12]],n%2?p.dark:p.mid,INK,.9);}
 path(c,[['M',-23,-22],['C',-28,-44,-14,-67,3,-70],['C',28,-64,31,-33,17,-17],['L',4,-26],['L',-4,-12],['L',-13,-23],['Z']],p.body);
 for(const s of[-1,1]){path(c,[['M',s*11,-46],['Q',s*35+m.reach*6,-51,s*37+m.reach*14,-25-m.reach*7],['L',s*28+m.reach*15,-13-m.reach*9],['L',s*26,-33],['Z']],p.dark);poly(c,[[s*13,-57],[s*23,-83],[s*5,-66]],p.mid);}
 path(c,[['M',-10,-50],['Q',1,-61,13,-47],['L',9,-33],['L',0,-29],['L',-8,-36],['Z']],p.dark,p.edge,.8);eye(c,-2,-47,'#fff0c9',2.5,m.blink);eye(c,8,-45,'#fff0c9',2.5,m.blink);
 curve(c,[-4,-35,0,-38,6,-36,9,-39],p.light,1);glow(c,0,-43,21,p.light,.12);
}
function glassmarauder(c,m,p){
 for(const s of[-1,1]){const k=m.walk*s*5;limb(c,s*10,-30,[s*17-k,-16],[s*24+k,0],6,p.dark,p.edge);poly(c,[[s*15-k,-20],[s*26-k,-18],[s*27+k,-2],[s*18+k,-1]],p.body);}
 path(c,[['M',-18,-52],['Q',-20,-67,0,-71],['L',22,-57],['L',17,-29],['L',0,-20],['L',-18,-32],['Z']],p.body);
 for(const s of[-1,1])crystal(c,s*17,-48,15,25,p.mid);
 joint(c,-17,-48,-.15-m.anticipation*.4,()=>{limb(c,0,0,[-12,12],[-14,26],5,p.mid,p.edge);poly(c,[[-25,-13],[-1,-16],[5,8],[-14,32],[-32,12]],p.body,p.light,1.1);poly(c,[[-24,-9],[-5,-12],[-1,7],[-14,22]],'#d8f9ff33',null);line(c,[[-20,-6],[-7,5],[-15,15]],p.edge,1);});
 joint(c,20,-51,m.anticipation*-.9+m.reach*.65,()=>{limb(c,0,0,[10,10],[22,-1],5,p.mid,p.edge);crystal(c,26,3,17,48,p.light);});
 path(c,[['M',-14,-71],['L',-10,-89],['L',1,-99],['L',16,-82],['L',13,-63],['L',1,-57],['Z']],p.body);poly(c,[[-7,-85],[2,-95],[11,-79],[2,-65]],p.mid);line(c,[[-6,-76],[9,-75]],'#fff4d0',2);curve(c,[-10,-79,-6,-88,0,-88,2,-91],p.edge,1);
}
function veilwasp(c,m,p){
 const f=m.flap*.38;
 for(const s of[-1,1])for(const n of[0,1])joint(c,-1,-33,s*(f+n*.2),()=>{path(c,[['M',0,0],['C',s*10,-23,s*40,-40+n*14,s*49,-28+n*13],['C',s*47,-7+n*9,s*19,10+n*4,0,7],['Z']],p.light+'24',p.mid,.9);for(let k=0;k<3;k++)curve(c,[s*3,2,s*15,-6,s*25,-17+k*6,s*40,-23+k*7+n*9],p.edge+'88',.6);});
 path(c,[['M',-13,-26],['C',-38,-48,-41,-23,-24,-10],['Q',-12,-2,-4,-18],['Z']],p.body);poly(c,[[-27,-12],[-44,1],[-25,-6]],p.pale);for(let n=0;n<3;n++)line(c,[[-33+n*8,-29],[-31+n*8,-13]],p.mid,2.2);
 oval(c,1,-30,12,18,p.dark,INK);oval(c,11,-48,13,15,p.body,INK);eye(c,18,-50,'#fff4c8',3,m.blink);
 for(const s of[-1,1]){curve(c,[8+s*4,-59,7+s*12,-77,20+s*15,-64,17+s*20,-78],p.mid,1.7);for(let n=0;n<3;n++)line(c,[[s*5,-33+n*4],[s*(18+n*4)+m.reach*8,-15+n*4],[s*(26+n*4)+m.reach*15,-21+n*5-m.reach*8]],p.mid,1.8);}
 poly(c,[[19,-42],[35,-39],[21,-34]],p.pale);if(m.wind)glow(c,30,-38,18,p.light,.3);
}
function graveburrower(c,m,p){
 for(const s of[-1,1])for(let n=0;n<3;n++){const x=-16+n*13;limb(c,x,-17,[x+s*(12+m.walk*2),-9],[x+s*17,-1],3.8,p.dark,p.edge);}
 path(c,[['M',-31,-15],['C',-38,-40,-21,-63,3,-61],['C',26,-62,38,-36,30,-13],['Q',0,-3,-31,-15],['Z']],p.body);for(let n=0;n<5;n++)poly(c,[[-30+n*14,-24],[-30+n*14,-49-(n%2)*13],[-20+n*14,-57-(n%2)*9],[-14+n*14,-27]],n%2?p.dark:p.mid,p.edge,.9);
 joint(c,20,-24,m.anticipation*-.25+m.reach*.2,()=>{oval(c,3,0,17,18,p.pale,INK);path(c,[['M',-7,-11],['Q',5,-18,17,-7],['L',14,9],['L',1,15],['L',-10,7],['Z']],p.pale);oval(c,0,-3,4.5,6,p.dark);oval(c,11,-4,4,5,p.dark);poly(c,[[6,1],[3,5],[9,5]],p.dark,null);for(let n=0;n<4;n++)line(c,[[-2+n*4,10],[-1+n*4,14]],p.dark,.8);});
 for(const s of[-1,1])poly(c,[[s*21,-10],[s*43+m.reach*9,-20-m.anticipation*11],[s*40+m.reach*12,-3-m.anticipation*8],[s*21,3]],grad(c,s*20,-20,s*20,20,p.pale,p.mid));
 if(m.wind)for(let n=0;n<3;n++){const a=m.t*2+n*2;oval(c,Math.cos(a)*30,1,4,2,p.mid);}
}
function chaincaster(c,m,p){
 for(const s of[-1,1])limb(c,s*8,-25,[s*13+m.walk*4,-12],[s*21-m.walk*3,0],4,p.dark,p.edge);
 path(c,[['M',-17,-61],['Q',0,-73,18,-59],['L',26,-15],['L',13,-22],['L',0,-8],['L',-10,-22],['L',-28,-15],['Z']],p.body);for(const s of[-1,1])curve(c,[s*9,-55,s*3,-39,s*12,-29,s*11,-19],p.edge,1);
 joint(c,16,-49,m.anticipation*-.5+m.reach*.45,()=>{limb(c,0,0,[10,13],[25,5],4,p.mid,p.edge);const len=24+(m.wind?m.anticipation*30:m.charge?43:28);for(let n=0;n<9;n++){const x=25+n*len/9,y=4+Math.sin(m.t*4+n*.5)*6;c.save();c.translate(x,y);c.rotate(n%2?.5:-.2);c.strokeStyle=INK;c.lineWidth=3;c.strokeRect(-3,-2,7,4);c.strokeStyle=p.mid;c.lineWidth=1.5;c.strokeRect(-3,-2,7,4);c.restore();}poly(c,[[25+len,-8],[35+len,4],[25+len,17],[14+len,4]],p.body,p.edge);glow(c,25+len,4,12,p.light,.2);});
 joint(c,-16,-49,-.4+m.reach*.25,()=>limb(c,0,0,[-11,10],[-19,-5],4,p.mid,p.edge));
 path(c,[['M',-18,-65],['Q',-14,-83,1,-91],['Q',23,-82,21,-62],['L',8,-49],['L',-11,-51],['Z']],p.body);path(c,[['M',-11,-67],['Q',0,-81,13,-68],['L',10,-56],['Q',0,-51,-10,-57],['Z']],p.dark);eye(c,-2,-65,'#ffebbf',2,m.blink);eye(c,8,-65,'#ffebbf',2,m.blink);poly(c,[[-5,-78],[1,-86],[7,-78],[1,-72]],p.pale);
}
function candlewraith(c,m,p){
 const swing=Math.sin(m.t*4)*3;
 for(let n=0;n<4;n++)path(c,[['M',-18+n*11,-12],['C',-26+n*13,2,-15+n*11,11+swing,-21+n*14,18],['Q',-3+n*11,11,1+n*9,-10]],p.dark,p.mid,1);
 path(c,[['M',-24,-19],['Q',-29,-56,-11,-63],['L',17,-63],['Q',31,-49,23,-18],['L',11,-9],['L',-12,-11],['Z']],p.body);
 path(c,[['M',-17,-53],['Q',-13,-68,2,-67],['Q',20,-62,18,-46],['L',16,-28],['Q',-1,-17,-17,-30],['Z']],p.dark,p.edge,1);
 for(const x of[-15,15])line(c,[[x,-51],[x,-28]],p.mid,2);oval(c,0,-31,16,3,p.mid);glow(c,0,-43,25,'#ffc886',.25);
 path(c,[['M',-6,-32],['C',-17,-44,-3,-54,1,-65-m.anticipation*9],['C',4,-52,15,-44,8,-34],['Q',3,-28,-6,-32]],'#efbd7b',null);path(c,[['M',-3,-34],['Q',-5,-44,2,-51],['Q',9,-40,3,-33]],'#fff1bd',null);
 path(c,[['M',-23,-58],['Q',-21,-78,-7,-82],['L',-5,-93],['L',5,-89],['L',10,-79],['Q',25,-70,25,-55],['Q',4,-48,-23,-58],['Z']],p.body);for(let n=0;n<3;n++)curve(c,[-19+n*8,-62,-16+n*9,-66,-20+n*12,-74,-12+n*8,-73],p.pale,1.5);
 for(const s of[-1,1])joint(c,s*23,-33,s*(.4+m.anticipation*.7-m.reach*.4),()=>curve(c,[0,0,s*15,-17,s*28,3,s*30+m.reach*6,14-m.reach*9],p.mid,3));
}
function clockscarab(c,m,p){
 if(m.charge){c.translate(0,-27);c.rotate(m.t*12);c.translate(0,27);}
 for(const s of[-1,1])for(let n=0;n<3;n++){const x=-16+n*16,d=Math.sin(m.pace+n)*4;limb(c,x,-19,[x+s*9,-10],[x+s*15+d,0],2.6,p.dark,p.edge);}
 oval(c,0,-27,29,29,p.body,INK);oval(c,0,-29,22,23,p.dark,p.edge,1.5);oval(c,0,-29,16,18,p.pale,INK,1);
 for(let n=0;n<12;n++){const a=n*TAU/12;line(c,[[Math.cos(a)*13,-29+Math.sin(a)*15],[Math.cos(a)*15,-29+Math.sin(a)*17]],p.dark,1);}
 const a=m.wind?m.anticipation*TAU:m.t*.6;line(c,[[Math.cos(a)*11,-29+Math.sin(a)*12],[0,-29],[Math.sin(a)*7,-29-Math.cos(a)*8]],p.dark,1.6);oval(c,0,-29,2,2,p.mid);
 for(const s of[-1,1])curve(c,[s*16,-45,s*23,-63,s*30,-49,s*32,-62],p.mid,2);eye(c,23,-19,'#fff2bc',2.5,m.blink);poly(c,[[25,-12],[37,-12],[29,-4]],p.mid);
 joint(c,-22,-39,Math.sin(m.t*3)*.15,()=>{line(c,[[0,0],[-12,-5]],p.mid,3);oval(c,-17,-7,6,4,null,p.edge,2);oval(c,-17,-1,6,4,null,p.edge,2);});
}
function oathbound(c,m,p){
 for(const s of[-1,1]){const d=m.walk*s*5;limb(c,s*11,-31,[s*15+d,-16],[s*19-d,0],7,p.dark,p.edge);poly(c,[[s*11+d,-25],[s*22+d,-21],[s*22-d,-3],[s*12-d,-2]],p.body);}
 path(c,[['M',-23,-61],['Q',-22,-78,0,-78],['L',25,-62],['L',18,-34],['L',0,-24],['L',-19,-35],['Z']],p.body);for(const s of[-1,1])poly(c,[[s*15,-71],[s*30,-77],[s*39,-60],[s*19,-48]],p.mid,p.dark);
 path(c,[['M',-13,-56],['L',-2,-64],['L',12,-53],['L',2,-35],['L',-11,-42],['Z']],p.dark,p.edge,.8);glow(c,1,-48,14,p.light,.15);line(c,[[-8,-56],[1,-48],[-3,-38]],p.light,1);
 joint(c,24,-59,m.anticipation*-1.15+m.reach*.9,()=>{limb(c,0,0,[12,13],[23,-2],6,p.mid,p.edge);line(c,[[23,9],[23,-17]],p.pale,4);line(c,[[12,-17],[34,-17]],p.mid,3);path(c,[['M',17,-18],['L',18,-57],['L',23,-69],['L',29,-56],['L',29,-18],['Z']],grad(c,17,-69,12,50,p.edge,p.dark));line(c,[[23,-60],[23,-25]],p.pale,1);});
 joint(c,-24,-58,m.anticipation*.3,()=>{limb(c,0,0,[-10,10],[-10,22],6,p.mid,p.edge);poly(c,[[-24,-8],[-2,-10],[2,15],[-12,31],[-28,14]],p.body,p.edge);line(c,[[-13,-2],[-13,19]],p.mid,2);});
 path(c,[['M',-16,-79],['L',-15,-99],['L',1,-110],['L',19,-96],['L',19,-77],['L',3,-68],['Z']],p.body);poly(c,[[-10,-88],[14,-90],[13,-80],[-8,-78]],p.dark);line(c,[[-9,-85],[13,-86]],'#fff0bf',2);poly(c,[[-11,-101],[-16,-119],[-3,-107],[3,-117],[9,-103]],p.mid);curve(c,[-17,-94,-33,-100,-28,-117,-39,-115],p.dark,4);
}
function hushling(c,m,p){
 for(const s of[-1,1]){const yy=-8+Math.sin(m.pace+s)*3;path(c,[['M',s*8,-21],['Q',s*17,-13,s*21,yy],['L',s*31,yy+2],['Q',s*22,yy+10,s*11,yy+5],['Z']],p.dark);}
 path(c,[['M',-21,-18],['Q',-28,-45,-13,-60],['Q',0,-68,14,-54],['L',24,-19],['L',12,-25],['L',3,-8],['L',-8,-22],['L',-17,-11],['Z']],p.body);for(const s of[-1,1])curve(c,[s*18,-43,s*29+m.reach*5,-36-m.anticipation*6,s*29+m.reach*13,-18,s*37+m.reach*15,-15-m.reach*10],p.dark,4);
 path(c,[['M',-20,-57],['C',-27,-81,-7,-88,8,-80],['L',26,-89],['L',20,-65],['Q',15,-51,-1,-49],['Z']],p.body);path(c,[['M',-12,-67],['Q',0,-79,13,-67],['Q',11,-51,-3,-55],['Z']],p.dark,p.edge,.8);eye(c,-3,-66,'#fff0ca',3,m.blink);eye(c,8,-65,'#fff0ca',2.6,m.blink);line(c,[[-2,-56],[5,-58]],p.pale,1.1);
 for(let n=0;n<3;n++)curve(c,[-9,-20+n*4,-27,-6+n*4,-41,-15+n*5,-48,-4+n*6],n%2?p.mid:p.dark,3-n*.6);
 if(m.wind)for(let n=0;n<3;n++){const y=-36+n*8;line(c,[[27,y],[35,y-3],[40,y+1]],p.light,1);}
}
function bloomspitter(c,m,p){
 for(const side of[-1,1]){curve(c,[0,-11,side*19,-5,side*32,-11,side*43,-2],p.dark,5);leaf(c,side*21,-7,23,side*.9,p.mid,p.edge);}
 curve(c,[0,-4,-9,-23,8,-40,2,-57-m.anticipation*5],p.dark,9);curve(c,[-2,-4,-11,-25,6,-41,0,-57],p.mid,5);
 joint(c,2,-55-m.anticipation*5,-.15+m.reach*.25,()=>{for(let i=0;i<8;i++){const a=i*TAU/8,len=24-m.anticipation*10;leaf(c,Math.cos(a)*6,Math.sin(a)*6,len,a+Math.PI/2,p.mid,p.edge);}oval(c,0,0,17,17,p.dark,p.edge);oval(c,4,0,10,10,p.pale,INK);eye(c,9,-3,'#fff2ab',3,m.blink);for(let n=0;n<3;n++)oval(c,-7+n*4,7,2,3,p.light);});
 if(m.wind){glow(c,2,-56,30,p.light,.2);for(let i=0;i<4;i++)oval(c,-15+i*10,-83-Math.sin(m.t*5+i)*3,2,3,p.light);}
}
function sporekeeper(c,m,p){
 for(const side of[-1,1])limb(c,side*10,-24,[side*14+m.walk*4,-13],[side*20-m.walk*3,-1],4,p.dark,p.edge);
 path(c,[['M',-19,-20],['Q',-23,-52,-8,-58],['L',12,-58],['Q',25,-41,19,-15],['Q',0,-8,-19,-20],['Z']],p.body);for(let n=0;n<4;n++)curve(c,[-12+n*8,-40,-9+n*6,-30,-14+n*10,-23,-9+n*6,-17],p.edge,.8);
 poly(c,[[-36,-59],[-29,-77],[-9,-91],[14,-86],[34,-68],[39,-57]],p.body,p.dark,2);curve(c,[-30,-62,-17,-72,15,-75,33,-61],p.edge,1.4);for(const [x,y]of[[-15,-77],[5,-81],[22,-69]])oval(c,x,y,5,3,p.pale);
 eye(c,-4,-47,'#f6ecc3',2.7,m.blink);eye(c,9,-46,'#f6ecc3',2.5,m.blink);
 for(const side of[-1,1])curve(c,[side*17,-39,side*30,-46-m.anticipation*7,side*35,-28,side*29,-25],p.mid,4);
 line(c,[[31,-29],[35,-13]],p.dark,2);oval(c,35,-12,8,11,p.dark,p.edge);glow(c,35,-13,27,p.light,m.wind?.3:.13);oval(c,35,-13,4,7,p.light);
 for(let n=0;n<5;n++){const a=m.t*1.8+n*TAU/5;oval(c,Math.cos(a)*33,-45+Math.sin(a)*25,1.5+m.anticipation,2,p.light);}
}
function cinderdrill(c,m,p){
 for(const side of[-1,1])for(const x of[-17,16])limb(c,x,-20,[x+side*10+m.walk*3,-10],[x+side*15,-1],4,p.dark,p.edge);
 path(c,[['M',-31,-15],['Q',-40,-40,-22,-51],['Q',1,-65,23,-45],['L',33,-17],['Q',0,-3,-31,-15],['Z']],p.body);for(let n=0;n<5;n++)poly(c,[[-28+n*12,-25],[-24+n*12,-55-(n%2)*8],[-13+n*12,-30]],p.mid,p.edge,.9);
 joint(c,22,-26,-m.anticipation*.18+m.reach*.15,()=>{oval(c,0,0,16,18,p.dark,p.edge);poly(c,[[10,-17],[52,-2-m.reach*8],[10,15]],grad(c,10,-20,40,35,p.pale,p.mid));for(let n=0;n<4;n++)line(c,[[15+n*8,-14+n*3],[20+n*7,10-n*3]],p.dark,1.3);eye(c,0,-8,'#ffebae',3,m.blink);});
 for(let n=0;n<3;n++)curve(c,[-20+n*15,-40,-13+n*13,-35,-20+n*16,-26,-9+n*13,-23],'#ffbc77',1.3);
 if(m.wind||m.charge){oval(c,0,1,49,5,null,p.light,1.4);glow(c,30,-27,21,'#ffba70',.2);}
}
function chainshield(c,m,p){
 for(const side of[-1,1]){const d=m.walk*side*4;limb(c,side*10,-30,[side*16+d,-15],[side*22-d,0],6,p.dark,p.edge);poly(c,[[side*12+d,-24],[side*23+d,-23],[side*24-d,-1],[side*13-d,0]],p.body);}
 path(c,[['M',-23,-62],['L',0,-75],['L',25,-58],['L',19,-28],['Q',0,-19,-21,-31],['Z']],p.body);oval(c,0,-49,10,14,p.dark,p.edge);glow(c,0,-49,17,'#ffbc76',.2);for(let i=0;i<3;i++)line(c,[[-6+i*6,-57],[-6+i*6,-42]],'#ffc389',1.7);
 path(c,[['M',-14,-73],['L',-11,-93],['L',10,-94],['L',22,-76],['L',12,-62],['L',-9,-62],['Z']],p.body);line(c,[[-4,-79],[14,-79]],p.pale,2);poly(c,[[-11,-93],[-9,-107],[0,-96],[9,-106],[13,-93]],p.mid);
 joint(c,-22,-53,m.anticipation*.12+(m.broken?-.7:0),()=>{limb(c,0,0,[-13,14],[-15,30],5,p.mid,p.edge);poly(c,[[-29,-17],[0,-20],[9,15],[-13,44],[-39,16]],p.body,p.edge,2);poly(c,[[-23,-9],[-5,-11],[0,12],[-13,31],[-29,12]],p.dark,p.mid,1);oval(c,-14,6,9,11,p.pale,p.dark);if(m.broken)line(c,[[-20,-12],[-9,1],[-18,14],[-10,31]],p.light,2);});
 joint(c,22,-55,-m.anticipation*.55+m.reach*.5,()=>{limb(c,0,0,[12,13],[22,2],5,p.mid,p.edge);for(let n=0;n<8;n++){const x=24+n*(6+m.reach*5),y=3+Math.sin(n*.7+m.t*3)*6;oval(c,x,y,4,2.7,null,p.edge,1.4);}poly(c,[[70+m.reach*35,-8],[85+m.reach*35,3],[71+m.reach*35,15],[57+m.reach*35,3]],p.mid,p.dark);});
}
function siphonray(c,m,p){
 const flap=m.flap*4;
 for(const side of[-1,1])path(c,[['M',0,-32],['C',side*20,-56,side*42,-60+flap,side*59,-37+flap],['L',side*42,-20],['L',side*23,-5],['Q',side*5,-13,0,-32],['Z']],p.body);
 for(const side of[-1,1])for(let n=0;n<3;n++)curve(c,[side*4,-34,side*18,-38,side*28,-37+n*7,side*44,-34+n*5+flap*.5],p.edge,.8);
 oval(c,0,-32,15,24,p.mid,INK);for(const x of[-7,7])eye(c,x,-38,'#f2ffce',2.8,m.blink);
 for(let n=0;n<5;n++){const x=-12+n*6;curve(c,[x,-17,x-13,-1,x+14,4+Math.sin(m.t*4+n)*6,x-1,16+Math.sin(m.t*3+n)*7],p.mid,2);}
 oval(c,0,-20,7,5,p.dark,p.edge);if(m.wind||m.charge){for(let n=0;n<3;n++)oval(c,0,-20,17+n*13+m.anticipation*8,7+n*4,null,p.light+'88',1.2);glow(c,0,-20,35,p.light,.15);}
}
function inkmortar(c,m,p){
 for(const side of[-1,1])for(let n=0;n<3;n++)curve(c,[side*(9+n*7),-14,side*(18+n*8),-5,side*(21+n*9),2,side*(33+n*5),-2],p.mid,4-n*.6);
 oval(c,-3,-34,37,32,p.body,INK,2);for(let n=0;n<4;n++){const r=28-n*6;c.beginPath();c.arc(-6,-36,r,-Math.PI*.3,Math.PI*1.8);c.strokeStyle=n%2?p.edge:p.dark;c.lineWidth=2;c.stroke();}
 path(c,[['M',13,-31],['Q',25,-50,34,-38],['L',48,-57-m.anticipation*9],['L',63,-48-m.anticipation*8],['L',45,-12],['L',23,-9],['Z']],p.body);oval(c,55,-51-m.anticipation*8,11,5,p.dark,p.edge);eye(c,26,-25,'#f5f1cc',3,m.blink);for(let n=0;n<3;n++)oval(c,-24+n*15,-44,2.3,3.2,p.light);
 if(m.wind){glow(c,55,-51,26,p.light,.25);for(let n=0;n<3;n++)oval(c,49+n*8,-73-n*5,2,3,p.light);}
}
function magnetmoth(c,m,p){
 for(const side of[-1,1])joint(c,side*6,-32,side*m.flap*.22,()=>{path(c,[['M',0,0],['C',side*11,-44,side*45,-53,side*57,-29],['Q',side*69,-8,side*39,8],['Q',side*13,14,0,0],['Z']],p.body);oval(c,side*35,-20,14,17,p.dark,p.edge);poly(c,[[side*24,-25],[side*32,-36],[side*43,-25],[side*36,-4]],p.mid,p.edge,.9);for(let n=0;n<3;n++)line(c,[[side*(9+n*10),-16],[side*(20+n*8),-29]],p.edge,.9);});
 oval(c,0,-29,10,23,p.dark,INK);oval(c,1,-51,13,15,p.mid,INK);eye(c,7,-53,'#fff2bc',2.8,m.blink);
 for(const side of[-1,1]){curve(c,[side*5,-62,side*17,-78,side*23,-66,side*28,-80],p.dark,2);curve(c,[side*8,-28,side*22,-15,side*18,-6,side*31,-5],p.mid,3);poly(c,[[side*25,-15],[side*37,-15],[side*37,1],[side*25,1]],p.pale,p.dark);}
 if(m.wind||m.charge)for(let n=0;n<3;n++)oval(c,0,-24,40+n*15,24+n*7,null,p.light+'88',1.2);
}
function galeswarm(c,m,p){
 const points=[[-23,-42],[21,-56],[4,-13]];line(c,[...points,points[0]],p.edge+'77',1);
 for(let n=0;n<3;n++){const [xx,yy]=points[n],off=Math.sin(m.t*8+n)*3;joint(c,xx+m.reach*(n===1?17:8),yy+off,(n-1)*.16,()=>{for(const side of[-1,1])poly(c,[[0,-3],[side*19,-18+m.flap*3],[side*15,-1],[side*7,7]],n%2?p.dark:p.mid,p.edge,.8);oval(c,0,0,8,11,p.body,INK);poly(c,[[5,-5],[17,-1],[6,4]],p.pale,p.dark,.8);eye(c,5,-6,'#fff1be',1.7,m.blink);for(let k=0;k<2;k++)poly(c,[[-4+k*5,7],[-9+k*8,19],[4+k*4,8]],p.dark);});}
 if(m.wind)for(let n=0;n<3;n++)oval(c,points[n][0],points[n][1]-19,2.5,2.5,p.light);
}
function bellspider(c,m,p){
 curve(c,[0,-58,Math.sin(m.t)*5,-90,-3,-121,0,-150],p.edge+'88',1);
 for(const side of[-1,1])for(let n=0;n<4;n++){const d=Math.sin(m.pace+n)*5;limb(c,side*11,-38+n*6,[side*(29+n*7),-47+n*8+d],[side*(42+n*6),-1-n%2*6],2.8,p.dark,p.edge);}
 path(c,[['M',-25,-14],['L',-20,-42],['Q',-14,-63,0,-65],['Q',17,-62,21,-42],['L',29,-14],['Q',0,-2,-25,-14],['Z']],p.body);oval(c,1,-15,25,6,p.dark,p.edge);oval(c,0,-20,5,13,p.pale,p.dark);for(let n=0;n<3;n++)curve(c,[-13+n*11,-45,-17+n*14,-37,-15+n*12,-26,-18+n*15,-21],p.edge,1);
 oval(c,1,-58,14,12,p.mid,INK);for(let n=0;n<4;n++)eye(c,-8+n*6,-58,2===n?'#fff8d0':'#d5f7f0',1.8,m.blink);poly(c,[[-11,-51],[-6,-42],[-2,-50]],p.pale);poly(c,[[4,-50],[10,-41],[12,-51]],p.pale);
 if(m.wind)oval(c,0,2,55,7,null,p.light,1.6);
}
function crystalfencer(c,m,p){
 for(const side of[-1,1]){limb(c,side*8,-32,[side*18+m.walk*4,-14],[side*27-m.walk*3,0],4,p.dark,p.edge);poly(c,[[side*10,-30],[side*18,-41],[side*29,-20]],p.mid,p.edge,.9);}
 path(c,[['M',-18,-63],['L',-3,-78],['L',16,-65],['L',22,-34],['L',4,-22],['L',-15,-32],['Z']],p.body);poly(c,[[-15,-57],[0,-70],[14,-55],[2,-39]],p.mid,p.edge);crystal(c,-17,-52,13,25,p.light);crystal(c,18,-49,12,22,p.mid);
 joint(c,18,-55,-.6-m.anticipation*.65+m.reach*1.4+(m.broken?.55:0),()=>{limb(c,0,0,[14,11],[30,2],4,p.mid,p.edge);oval(c,32,1,7,12,null,p.pale,2);poly(c,[[31,-4],[85,-15],[97,-12],[38,4]],p.pale,p.dark,1);line(c,[[44,-4],[87,-11]],p.edge,1);});
 joint(c,-17,-55,-.4+m.anticipation*.7,()=>limb(c,0,0,[-15,5],[-16,20],4,p.mid,p.edge));
 path(c,[['M',-11,-77],['L',-7,-98],['L',3,-108],['L',17,-89],['L',15,-72],['L',3,-63],['Z']],p.body);line(c,[[-4,-82],[12,-84]],p.light,2);poly(c,[[-7,-99],[-20,-114],[-2,-106],[5,-118],[10,-101]],p.mid,p.edge,.8);
}
function phasehound(c,m,p){
 for(const side of[-1,1])for(const x of[-20,19])limb(c,x,-20,[x+side*10+m.walk*5,-10],[x+side*12-m.walk*5,-1],4,p.dark,p.edge);
 path(c,[['M',-31,-21],['C',-36,-47,2,-56,27,-31],['L',20,-14],['Q',0,-7,-31,-21],['Z']],p.body);for(let n=0;n<3;n++)poly(c,[[-26+n*14,-37],[-21+n*15,-52],[-9+n*13,-30]],p.mid,p.edge,.8);
 curve(c,[-27,-25,-52,-9,-63,-27,-74,-11+Math.sin(m.t*5)*6],p.dark,10);curve(c,[-29,-25,-47,-21,-55,-32,-68,-27+Math.sin(m.t*4)*4],p.mid,4);
 joint(c,25,-33,-.1-m.anticipation*.2+m.reach*.1,()=>{path(c,[['M',-8,-4],['L',-10,-31],['L',3,-19],['L',18,-29],['L',19,-12],['L',37,-2],['L',32,10],['L',4,13],['Z']],p.body);eye(c,13,-10,'#fff1d3',3,m.blink);line(c,[[17,6],[32,5]],p.pale,1.1);});
 for(let n=0;n<4;n++)line(c,[[-34+n*17,-13-n%2*7],[-22+n*17,-13-n%2*7]],p.light+'99',1.2);
 if(m.wind){for(let n=0;n<3;n++)poly(c,[[-23+n*16,-43],[-14+n*16,-58],[-9+n*16,-38]],p.light+'55',null);glow(c,29,-37,24,p.light,.15);}
}
function voidlantern(c,m,p){
 for(const side of[-1,1])curve(c,[side*14,-18,side*28,-5,side*19,10,side*35,16+Math.sin(m.t*4+side)*5],p.dark,4);
 path(c,[['M',-27,-18],['L',-28,-65],['L',-15,-83],['L',15,-83],['L',29,-64],['L',27,-18],['L',0,-6],['Z']],p.body);poly(c,[[-19,-25],[-19,-61],[0,-73],[19,-61],[19,-25],[0,-16]],p.dark,p.edge,1.2);
 for(const x of[-10,0,10])line(c,[[x,-65],[x,-24]],p.mid,2);glow(c,0,-43,33,p.light,.2);oval(c,0,-43,9,15,p.light);poly(c,[[-31,-17],[31,-17],[23,-9],[-23,-9]],p.mid,p.edge);poly(c,[[-31,-66],[-23,-86],[0,-100],[24,-85],[32,-66]],p.body,p.edge);
 line(c,[[0,-99],[0,-114]],p.mid,2);oval(c,0,-119,7,7,null,p.edge,2);for(const side of[-1,1]){curve(c,[side*28,-48,side*49,-62,side*52,-32,side*44,-22],p.mid,4);oval(c,side*44,-22,4,6,p.pale,p.dark);}
 if(m.wind||m.charge)for(let n=0;n<3;n++){const a=m.t*2+n*TAU/3;poly(c,[[Math.cos(a)*42,-45+Math.sin(a)*26-6],[Math.cos(a)*42+4,-45+Math.sin(a)*26],[Math.cos(a)*42,-45+Math.sin(a)*26+6],[Math.cos(a)*42-4,-45+Math.sin(a)*26]],p.light,p.dark,.7);}
}
const RIGS={sinder,voltlet,pebbleback,dewdrop,sproutlet,thornling,ashwing,inkfin,stormkite,frostmite,riftling,glassmarauder,veilwasp,graveburrower,chaincaster,candlewraith,clockscarab,oathbound,hushling,bloomspitter,sporekeeper,cinderdrill,chainshield,siphonray,inkmortar,magnetmoth,galeswarm,bellspider,crystalfencer,phasehound,voidlantern};

/** Returns false for unknown species so callers can retain a graceful fallback. */
export function drawEnemyMinion(c,e,time=0,data={}){
 if(!e||!SPECIES.has(e.kind))return false;
 const t=finite(time),m=pose(e,t),color=/^#[\da-f]{6}$/i.test(data.color)?data.color:'#a7c3b5';
 const p={mid:color,dark:mix(color,INK,.66),edge:mix(color,'#fff3d5',.5),pale:mix(color,'#e8d5b4',.68),light:mix(color,'#faffd1',.74)};
 c.save();
 try{
  c.translate(finite(e.x),finite(e.y));c.scale(e.face===-1?-1:1,1);
  oval(c,0,1,['ashwing','inkfin','stormkite','dewdrop','veilwasp','candlewraith','riftling','hushling'].includes(e.kind)?18:27,4,'#06101570');
  c.translate(m.reach*2,m.bob);if(m.wind)c.scale(1+m.anticipation*.035,1-m.anticipation*.04);
  if(m.hurt)c.translate(-3,1);
  if(m.stun){c.rotate(-.055);c.scale(1.025,.97);}
  if(m.dead){c.rotate(.12*m.death);c.scale(1.04+m.death*.08,.96-m.death*.18);}
  p.body=grad(c,-29,-87,54,87,p.mid,p.dark);
  RIGS[e.kind](c,m,p);
  // Small rim-light notches keep anatomical edges readable at gameplay scale.
  if(m.wind){c.save();c.globalAlpha=.5+m.anticipation*.45;glow(c,6,-34,20,p.light,.1);c.restore();}
 }finally{c.restore();}
 return true;
}

export const ENEMY_ART_SPECIES=Object.freeze([...SPECIES]);
