const TAU=Math.PI*2;
const line=(c,p,color,width=2)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
const poly=(c,p,color,edge)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=2;c.stroke();}};
const oval=(c,x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=color;c.fill();};

export function drawDungeonMinion(c,e,t,color){
 if(!['glassmarauder','veilwasp','graveburrower','chaincaster'].includes(e.kind))return false;
 c.save();c.translate(e.x,e.y);c.scale(e.face||1,1);if(e.flash)c.globalAlpha=.55;
 const wind=e.state==='windup',move=['patrol','charge','chase'].includes(e.state),stride=move?Math.sin(t*14+e.id)*6:Math.sin(t*3)*1.5;
 oval(c,0,0,28,5,'#07152166');
 if(e.kind==='glassmarauder'){
   for(const s of [-1,1]){line(c,[[s*10,-23],[s*(15+stride*.3),-10],[s*(19-stride*.4),0]],'#698b91',6);poly(c,[[s*13,-33],[s*28,-55],[s*32,-23]],color+'77',color);}
   poly(c,[[-19,-40],[-8,-64],[10,-62],[23,-34],[8,-22],[-10,-24]],'#3d6570',color);
   poly(c,[[-13,-65],[-5,-89],[10,-77],[18,-61],[1,-50]],color+'88',color);line(c,[[-7,-63],[11,-63]],'#f5ffe5',3);
   const reach=wind?-14:e.state==='charge'?28:0;
   line(c,[[15,-42],[31+reach,-31],[42+reach,-48]],'#648b91',5);poly(c,[[36+reach,-47],[50+reach,-99],[59+reach,-36],[43+reach,-22]],color+'99','#e8fff0');
   line(c,[[-9,-44],[-29,-35],[-35,-16]],'#648b91',5);
 }else if(e.kind==='veilwasp'){
   const flap=Math.sin(t*30)*13;
   for(const s of [-1,1]){poly(c,[[-3,-34],[s*48,-62+flap],[s*37,-20+flap],[-2,-20]],color+'30',color+'99');line(c,[[s*4,-24],[s*23,-11],[s*31,-19]],color,2);}
   oval(c,-12,-31,19,13,'#4d3b66');for(let i=0;i<3;i++)line(c,[[-24+i*10,-40],[-25+i*10,-22]],color+'88',3);
   poly(c,[[-30,-32],[-55,-24],[-31,-23]],color);oval(c,9,-40,13,15,color+'99');poly(c,[[14,-37],[41,-31],[16,-29]],'#eae5ce');
   line(c,[[6,-52],[0,-69],[-7,-72]],color,2);line(c,[[14,-51],[24,-67],[31,-66]],color,2);oval(c,16,-44,3,4,'#fff5c1');
 }else if(e.kind==='graveburrower'){
   for(const s of [-1,1])for(let i=0;i<3;i++)line(c,[[s*12,-20],[s*(27+i*3),-13+Math.sin(t*13+i)*3],[s*(33+i*3),0]],'#8c8377',4);
   poly(c,[[-29,-13],[-24,-40],[-10,-58],[15,-55],[32,-30],[27,-7]],'#675f62',color);for(let i=0;i<4;i++)poly(c,[[-28+i*15,-29],[-21+i*15,-64-(i%2)*13],[-8+i*15,-30]],color+'77',color);
   oval(c,10,-26,16,17,'#c9bda0');oval(c,4,-28,4,5,'#241f31');oval(c,17,-28,4,5,'#241f31');poly(c,[[10,-21],[6,-15],[14,-15]],'#423846');
   for(const s of [-1,1])poly(c,[[s*17,-8],[s*34,-20],[s*28,4],[s*16,-1]],'#e1d3ae');
   if(e.state==='burrow'||e.state==='windup'){c.strokeStyle=color+'77';c.lineWidth=2;c.beginPath();c.ellipse(0,2,42+Math.sin(t*9)*4,7,0,0,TAU);c.stroke();}
 }else{
   for(const s of [-1,1])line(c,[[s*8,-22],[s*17,-8],[s*22,0]],'#756984',5);
   poly(c,[[-16,-51],[10,-51],[25,-12],[7,-21],[-12,-9],[-22,-16]],'#574968',color+'88');oval(c,-1,-64,14,17,'#bdacbc');poly(c,[[-20,-70],[0,-91],[21,-69],[12,-49],[0,-57],[-13,-50]],'#685577',color);line(c,[[-8,-66],[7,-66]],'#f8e9bb',3);
   for(const s of [-1,1])line(c,[[s*12,-46],[s*26,-32],[s*35,-46]],'#9b819e',4);
   const length=wind?43:e.state==='charge'?90:65;
   for(let i=0;i<9;i++){const x=31+i*length/9,y=-42+Math.sin(i*.6+t*5)*8;c.save();c.translate(x,y);c.rotate(i%2?-.5:.5);c.strokeStyle=color;c.lineWidth=1.7;c.strokeRect(-4,-2,8,4);c.restore();}
   poly(c,[[31+length,-52],[41+length,-42],[31+length,-32],[21+length,-42]],'#a887ac',color);
 }
 if(wind){c.fillStyle='#ffe7b2';c.textAlign='center';c.font='600 20px Barlow, sans-serif';c.fillText('!',0,-106);}
 c.restore();return true;
}

export function drawDungeonChampion(c,e,b,t){
 if(!b.miniboss&&!b.mini)return false;
 c.save();c.translate(e.x,e.y);c.scale(e.face||1,1);if(e.flash)c.globalAlpha=.55;
 const col=b.color,wind=e.state==='windup',reaver=e.boss.endsWith('-reaver'),rage=e.phase>=2;
 oval(c,0,0,72,10,'#09111b88');
 if(!reaver){
   for(const s of [-1,1]){line(c,[[s*22,-48],[s*37,-24],[s*39,-2]],'#647274',15);poly(c,[[s*26,-41],[s*45,-43],[s*56,0],[s*29,0]],'#455861',col+'88');}
   poly(c,[[-45,-118],[-25,-144],[25,-144],[49,-116],[35,-53],[0,-42],[-32,-55]],'#435963',col);
   for(const s of [-1,1])poly(c,[[s*25,-132],[s*58,-152],[s*77,-115],[s*34,-103]],'#657b7e',col);
   poly(c,[[-24,-144],[-17,-184],[0,-201],[20,-182],[26,-144],[0,-132]],'#617780',col);line(c,[[-15,-159],[15,-159]],rage?'#ffe9b0':col,5);
   for(const s of [-1,1])poly(c,[[s*15,-185],[s*34,-218],[s*30,-176]],col+'88',col);
   line(c,[[-40,-113],[-67,-79],[-65,-42]],'#779091',13);poly(c,[[-79,-108],[-49,-108],[-36,-60],[-65,-35],[-91,-60]],'#3e535f',col);
   const lean=wind?-.35:e.state==='charge'?.45:0;
   c.save();c.translate(49,-105);c.rotate(lean);line(c,[[0,0],[23,35],[41,20]],'#779091',12);line(c,[[41,-46],[41,67]],'#b4ae8f',6);poly(c,[[16,-46],[24,-78],[59,-78],[70,-46],[57,-17],[25,-17]],'#5a7075',col);c.restore();
   poly(c,[[-12,-115],[0,-129],[14,-115],[0,-91]],rage?'#ffe2af':col);
 }else{
   const motion=Math.sin(t*5)*5;
   for(let i=0;i<6;i++)line(c,[[-37,-75],[-65-i*9,-60+motion],[-85-i*7,-90-i*9+Math.sin(t*3+i)*10]],i%2?col+'88':'#6c5b79',7-i*.7);
   for(const s of [-1,1]){line(c,[[s*22,-51],[s*43,-23],[s*51,0]],'#7d6985',12);poly(c,[[s*45,-12],[s*67,-11],[s*76,2],[s*45,2]],'#ac94a2',col);}
   poly(c,[[-40,-104],[-25,-147],[13,-158],[46,-120],[36,-67],[4,-43],[-32,-61]],'#66516f',col);
   for(const s of [-1,1]){line(c,[[s*30,-113],[s*60,-80],[s*(79+(wind?-12:7)),-118]],'#8a6c8c',13);for(let i=0;i<3;i++)poly(c,[[s*69,-116+i*4],[s*(108-i*5),-147+i*8],[s*84,-100+i*3]],'#e0cdbb',col);}
   poly(c,[[-23,-153],[-15,-195],[20,-200],[45,-172],[30,-140],[0,-130]],'#bd9fac',col);poly(c,[[26,-169],[70,-159],[32,-150]],'#d9bfae');oval(c,23,-174,4,7,'#fff4c4');
   for(let i=0;i<4;i++)poly(c,[[-26+i*12,-160],[-43+i*13,-209-(i%2)*17],[-9+i*12,-176]],col+'88',col);
 }
 if(rage){c.strokeStyle=col+'88';c.lineWidth=2;c.beginPath();c.ellipse(0,-2,82+Math.sin(t*6)*6,13,0,0,TAU);c.stroke();}
 if(wind){c.fillStyle='#ffe8b7';c.textAlign='center';c.font='600 25px Barlow, sans-serif';c.fillText('!',0,-250);}
 c.restore();return true;
}

export function drawDungeonTelegraph(c,e,t){
 const cue=e.telegraph;if(!cue||e.hp<=0||e.state!=='windup')return;
 const x=Number.isFinite(cue.x)?cue.x:e.x,y=Number.isFinite(cue.y)?cue.y:e.y,tx=Number.isFinite(cue.targetX)?cue.targetX:x,ty=Number.isFinite(cue.targetY)?cue.targetY:y;
 const pulse=(Math.sin(t*15)+1)/2,col=e.phase>=3?'#ff6f86':'#ffcb88';
 c.save();c.strokeStyle=col;c.fillStyle=col+'16';c.lineWidth=2;
 if(cue.kind==='rush'){
   const end=x+(Math.sign(tx-x)||e.face)*Math.min(700,Math.max(300,Math.abs(tx-x)+80));
   c.fillRect(Math.min(x,end),y-28,Math.abs(end-x),28);line(c,[[x,y-4],[end,y-4]],col+'aa',2);line(c,[[x,y-25],[end,y-25]],col+'55',1);
 }else if(cue.kind==='volley'){
   c.setLineDash([5,8]);line(c,[[x,y-90],[tx,ty-30]],col+'99',1.3);c.setLineDash([]);
   c.strokeStyle=col;c.beginPath();c.arc(tx,ty-30,19+pulse*4,0,TAU);c.stroke();line(c,[[tx-28,ty-30],[tx+28,ty-30]],col+'88',1);line(c,[[tx,ty-58],[tx,ty-2]],col+'88',1);
 }else{
   const radius=cue.radius||90,target=cue.kind==='slam'?x:tx,base=cue.kind==='slam'?y:ty;
   c.beginPath();c.ellipse(target,base-3,radius,13,0,0,TAU);c.fill();c.stroke();
   c.strokeStyle=col+'88';c.beginPath();c.ellipse(target,base-3,radius*(.55+pulse*.2),9,0,0,TAU);c.stroke();
   for(const side of [-1,1])line(c,[[target+side*radius,base-12],[target+side*radius,base+4]],col,2);
 }
 c.restore();
}
