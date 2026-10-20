import {drawCreature} from './creatures.js';
import {drawWorldEvent} from './chronicle-art.js';
import {EQUIPMENT,RARITIES} from './rpg-data.js';
import {BIOMES} from './world.js';
const TAU=Math.PI*2;
const oval=(c,x,y,rx,ry,col)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=col;c.fill();};
const line=(c,p,col,w=2)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.stroke();};
const poly=(c,p,col,stroke)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}};
const glow=(c,x,y,r,col)=>{const a=c.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,col);a.addColorStop(1,'transparent');oval(c,x,y,r,r,a);};
const label=(c,txt,x,y,col='#dcd9b1')=>{c.font='600 9px Barlow, sans-serif';c.textAlign='center';c.fillStyle=col;c.fillText(txt,x,y);};
export function drawRPGObject(c,o,g,t){
 const id=o.talk;if(!['iona','cairn','morrow','pip','ora'].includes(id)&&o.kind!=='covenant')return false;
 c.save();c.translate(o.x,o.y||520);const bob=Math.sin(t*3+o.x)*2;
 if(o.kind==='covenant'){
   glow(c,0,-36,80,'#c9b6e620');poly(c,[[-31,0],[-22,-35],[-14,-44],[14,-44],[23,-34],[32,0]],'#50636a','#9bb4a6');
   for(let i=0;i<3;i++){const a=t*.35+i*TAU/3,x=Math.cos(a)*25,y=-65+Math.sin(a)*12;poly(c,[[x,y-9],[x+5,y],[x,y+9],[x-5,y]],['#efc68b','#9ae6e4','#d7b7ff'][i]);}label(c,'THE COVENANTS',0,-114,'#c6bead');
 }else if(id==='iona'){
   c.translate(0,bob);for(const side of [-1,1])for(let i=0;i<3;i++){const xx=side*(32+i*7),yy=-65+i*14+Math.sin(t*4+i)*5;poly(c,[[side*5,-39],[xx,yy-15],[xx+side*9,yy+7],[side*9,-23]],i%2?'#9aa98b99':'#d6d2a999','#d6d4b299');line(c,[[side*8,-41],[xx,yy]],'#b4bd9977',1);}
   poly(c,[[-12,-44],[11,-44],[20,-3],[-18,-3]],'#9da78b','#d3d8b4');oval(c,0,-53,12,14,'#c1c7a7');oval(c,-5,-55,3,4,'#fff0b5');oval(c,5,-55,3,4,'#fff0b5');line(c,[[-6,-65],[-14,-80],[ -19,-81]],'#dce3b8',2);line(c,[[6,-65],[15,-79],[22,-81]],'#dce3b8',2);
   poly(c,[[-21,-25],[4,-33],[18,-19],[-6,-11]],'#d6d1ad','#7d987c');line(c,[[-15,-23],[-2,-25],[7,-20]],'#7b9981',1);label(c,'IONA HUNDREDFOLD',0,-107);
 }else if(id==='cairn'){
   line(c,[[-13,-27],[-18,0]],'#a68b61',9);line(c,[[13,-27],[18,0]],'#a68b61',9);poly(c,[[-20,-68],[20,-68],[27,-35],[0,-20],[-25,-35]],'#8b8260','#c9b88c');oval(c,0,-80,17,19,'#7a7d61');poly(c,[[-20,-93],[0,-106],[20,-93],[17,-73],[-17,-73]],'#a89b73','#ddca98');for(const side of [-1,1]){line(c,[[side*18,-62],[side*32,-32],[side*28,-9]],'#938360',9);line(c,[[side*12,-97],[side*28,-124],[side*37,-124]],'#a8b282',4);oval(c,side*8,-82,3,4,'#fff6ba');}
   for(let i=0;i<5;i++){const x=-15+i*7,y=-62+Math.sin(i*2)*7;line(c,[[x,-34],[x,y]],'#7d9b6e',2);oval(c,x,y,5,4,i%2?'#d9c0a1':'#c3d097');}glow(c,0,-48,36,'#e9d68d22');label(c,'CAPTAIN CAIRN',0,-146);
 }else if(id==='morrow'){
   oval(c,-9,-7,31,8,'#709b9a');oval(c,0,-32,30,28,'#8bc1bd55');c.strokeStyle='#baded2';c.lineWidth=2;c.beginPath();c.arc(0,-33,29,0,TAU);c.stroke();poly(c,[[-19,-29],[-12,-60],[4,-76],[20,-47],[20,-20]],'#8bafa688','#c9ddc3');for(let i=0;i<8;i++){const a=t*.6+i*TAU/8;oval(c,Math.cos(a)*18,-35+Math.sin(a)*16,2,3,['#f4d999','#9cdef2','#dfb0e5'][i%3]);}
   line(c,[[22,-13],[38,-37],[43,-51]],'#8cc9bd',3);line(c,[[31,-13],[49,-33],[58,-44]],'#8cc9bd',3);oval(c,43,-51,4,5,'#dfffe1');oval(c,58,-44,4,5,'#dfffe1');label(c,'MORROW NINE',0,-104);
 }else if(id==='pip'){
   c.translate(0,bob);poly(c,[[-17,-30],[-32,-18],[-38,-47],[-29,-45],[-20,-33]],'#b3a6c2','#dbd3df');poly(c,[[-14,-34],[7,-42],[22,-12],[8,0],[-16,-7]],'#ada3bd','#d7cbdc');poly(c,[[-5,-43],[4,-65],[25,-68],[31,-48],[14,-33]],'#d8d7df','#9890ad');poly(c,[[4,-64],[0,-92],[12,-75],[24,-91],[24,-66]],'#c7c3d8','#9b94b1');oval(c,20,-56,3,4,'#fff4bc');poly(c,[[-19,-42],[1,-48],[12,-13],[-17,-18],[-24,-8]],'#977b9e');oval(c,4,-27,7,9,'#f0e4ba');line(c,[[-7,-8],[-13,0],[0,0]],'#b8b2c6',5);line(c,[[13,-9],[19,0],[28,0]],'#b8b2c6',5);label(c,'PIP OF THE BLANK PAGE',0,-118);
 }else{
   // Ora's entire shop is a walking cloak of bottles and lost keys.
   glow(c,0,-55,65,'#cfb98d18');poly(c,[[-21,-62],[14,-62],[29,-1],[-30,-1]],'#846d65','#b7a38b');oval(c,0,-75,14,16,'#978d7a');poly(c,[[-29,-84],[-11,-106],[11,-104],[31,-81]],'#806c68','#c7ad8a');oval(c,-5,-76,3,4,'#f3e4b5');oval(c,6,-76,3,4,'#f3e4b5');for(let i=0;i<5;i++){const x=-21+i*10;line(c,[[x,-53],[x+Math.sin(t*2+i)*3,-29-i%2*7]],'#c5b28c',1);oval(c,x,-24-i%2*7,4,7,['#b5d8bf','#d9bd94','#a9c5da'][i%3]);}line(c,[[28,0],[30,-78],[47,-78]],'#a99e7e',3);oval(c,47,-63,7,10,'#e6d59b');label(c,'ORA · RELIC PEDDLER',0,-124);
 }
 const relevant=Object.values(g.quests||{}).some(q=>q.state==='ready');if(relevant&&id==='iona')label(c,'◆',0,-127,'#ffe8a1');c.restore();return true;
}
export function drawRPGWorld(c,g,t){
 if(!g.expansion&&!g.rpgReady)return;
 const id=g.roomId;
 if(id==='clockwork-ossuary'){
   c.save();c.translate(1940,240);glow(c,0,0,240,'#ffd59c13');c.rotate(t*.05);c.strokeStyle='#d5b17a33';c.lineWidth=9;c.beginPath();c.arc(0,0,135,0,TAU);c.stroke();for(let i=0;i<16;i++){const a=i*TAU/16;c.save();c.rotate(a);poly(c,[[120,-9],[165,-11],[165,11],[120,9]],'#937b5644','#dbb77533');c.restore();}c.restore();
   for(let i=0;i<7;i++){const x=650+i*270;line(c,[[x,520],[x,215]],'#a68a6233',10);oval(c,x,190,40,58,'#d9b47912');for(let j=0;j<3;j++)line(c,[[x-20+j*19,220],[x-13+j*13,160]],'#a7ae7133',2);}
 }else if(id==='paper-moon'){
   glow(c,1760,200,250,'#bce9df16');oval(c,1760,200,117,117,'#bad8c118');oval(c,1800,164,104,104,'#153747');for(let i=0;i<12;i++){const x=550+i*170,y=170+Math.sin(i*2+t*.4)*30;c.save();c.translate(x,y);c.rotate(Math.sin(i+t*.3)*.2);poly(c,[[-18,-24],[12,-24],[21,-12],[21,24],[-18,24]],'#d4e2c219','#d2e3c02c');line(c,[[-10,-10],[10,-10]],'#d2e3c033',1);line(c,[[-10,0],[10,0]],'#d2e3c033',1);c.restore();}
 }else if(id==='cradle-zero'){
   glow(c,2100,240,280,'#e2c8f018');for(let i=0;i<9;i++){const a=i*TAU/9;line(c,[[2100,260],[2100+Math.cos(a)*195,260+Math.sin(a)*195]],'#dfdcf222',1);oval(c,2100+Math.cos(a)*195,260+Math.sin(a)*195,3,3,'#f7edd166');}line(c,[[2100,520],[2100,285],[2045,220],[2055,145]],'#b8c3ce22',13);line(c,[[2100,335],[2180,245],[2202,125]],'#b8c3ce22',10);
 }
 for(const e of g.worldEffects||[])drawWorldEvent(c,e,t,BIOMES[g.room.biome].color);
 if(g.worldEvent)drawWorldEvent(c,g.worldEvent,t,BIOMES[g.room.biome].color);
}
export function drawRPGAuras(c,g,t){
 if(!g.rpgReady)return;const p=g.player,rank=g.bondRank();
 if(rank>0){const col=rank===3?'#ffe2aa':rank===2?'#d4b3ff':'#b9e7d0';glow(c,p.x,p.y-30,45+rank*10,col+'14');for(let i=0;i<rank+2;i++){const a=t*1.5+i*TAU/(rank+2);oval(c,p.x+Math.cos(a)*38,p.y-35+Math.sin(a)*20,1.3,1.3,col+'aa');}}
 for(const d of g.worldDrops){const item=EQUIPMENT[d.template],col=RARITIES[item.rarity].color,y=d.y+Math.sin(t*3+d.x)*5;glow(c,d.x,y,33,col+'44');poly(c,[[d.x,y-12],[d.x+8,y],[d.x,y+12],[d.x-8,y]],col);line(c,[[d.x,y-45],[d.x,y-20]],col+'55',1);if(Math.abs(p.x-d.x)<160)label(c,item.name,d.x,y-25,col);}
 if(g.keepsakes.has('blankegg')){const xx=p.x-p.face*38,yy=p.y-83+Math.sin(t*3)*6;glow(c,xx,yy,25,'#ffedbf22');if(g.trueEnding){for(let i=0;i<6;i++){const a=t+i*TAU/6;line(c,[[xx,yy],[xx+Math.cos(a)*13,yy+Math.sin(a)*13]],'#f8e3ae',3);}oval(c,xx,yy,7,8,'#f3deb2');oval(c,xx+3,yy-1,1.5,2,'#3a4956');}else{oval(c,xx,yy,9,12,'#e9dfbf');line(c,[[xx-5,yy],[xx,yy-3],[xx+4,yy+1]],'#a3ab83',1.5);}}
 const surge=g.worldEffects.find(e=>e.type==='eclipse'&&e.maxLife===100);
 if(surge)for(const [i,m] of g.party.entries()){c.save();c.globalAlpha=.4*Math.min(1,surge.life/30);const a=t*2+i*TAU/3;drawCreature(c,m.data,p.x+Math.cos(a)*115,p.y-60+Math.sin(a)*35,.3,p.face,{attack:.9,air:true},t,{shadow:false,aura:true,reducedMotion:!!g.combat?.settings?.reducedMotion});c.restore();}
}
