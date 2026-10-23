// Original anatomical redraws. Geometry stays in local rig space with feet at
// zero; animation is a presentation of the simulation's existing action clock.
const TAU=Math.PI*2,INK='#101d25',BONE='#eadcb7';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>1-(1-clamp(t))**3;
const hash=s=>String(s).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))%997,7);
const BOUNDS=Object.freeze({
 gator:[-232,-222,235,12],mantis:[-167,-324,180,12],yeti:[-162,-292,229,12],
 griffin:[-224,-282,213,12],beetle:[-150,-253,219,12],jackal:[-239,-243,213,12],
 shark:[-148,-309,226,12],dragon:[-166,-312,192,12],deer:[-115,-310,194,12],
 moth:[-193,-296,193,12],owl:[-194,-304,194,12],
});
/** Conservative local bounds include limb extension, attack lean and wing tips. */
export function creatureBounds(d){const [left,top,right,bottom]=BOUNDS[d?.rig]||BOUNDS.dragon;return {left,top,right,bottom,width:right-left,height:bottom-top};}
function path(c,commands,fill,edge=INK,width=2){c.beginPath();for(const [kind,...v]of commands){if(kind==='M')c.moveTo(...v);else if(kind==='L')c.lineTo(...v);else if(kind==='C')c.bezierCurveTo(...v);else if(kind==='Q')c.quadraticCurveTo(...v);else if(kind==='A')c.arc(...v);else c.closePath();}if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}}
function poly(c,p,fill,edge=INK,width=2){path(c,p.map(([x,y],i)=>[i?'L':'M',x,y]).concat([['Z']]),fill,edge,width);}
function oval(c,x,y,rx,ry,fill,edge,width=2){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}}
function line(c,points,color,width=2){path(c,points.map(([x,y],i)=>[i?'L':'M',x,y]),null,color,width);}
function curve(c,p,col,width=2){path(c,[['M',...p.slice(0,2)],['C',...p.slice(2)]],null,col,width);}
function grad(c,x,y,x2,y2,...colors){const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;}
function glow(c,x,y,r,col,alpha=.18){c.save();c.globalAlpha*=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);c.restore();}
function joint(c,x,y,angle,draw){c.save();c.translate(x,y);c.rotate(angle);c.translate(-x,-y);draw();c.restore();}
function segment(c,a,b,r1,r2,fill,edge=INK){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;path(c,[['M',a[0]+nx*r1,a[1]+ny*r1],['C',lerp(a[0],b[0],.3)+nx*r1,lerp(a[1],b[1],.3)+ny*r1,lerp(a[0],b[0],.8)+nx*r2,lerp(a[1],b[1],.8)+ny*r2,b[0]+nx*r2,b[1]+ny*r2],['Q',b[0]+dx/len*r2,b[1]+dy/len*r2,b[0]-nx*r2,b[1]-ny*r2],['C',lerp(a[0],b[0],.8)-nx*r2,lerp(a[1],b[1],.8)-ny*r2,lerp(a[0],b[0],.3)-nx*r1,lerp(a[1],b[1],.3)-ny*r1,a[0]-nx*r1,a[1]-ny*r1],['Q',a[0]-dx/len*r1,a[1]-dy/len*r1,a[0]+nx*r1,a[1]+ny*r1],['Z']],fill,edge,2.2);}
function toes(c,x,y,col,count=3,scale=1){for(let i=0;i<count;i++)path(c,[['M',x+i*8*scale,y],['Q',x+(i*8+7)*scale,y-7*scale,x+(i*8+12)*scale,y+4*scale],['L',x+(i*8+2)*scale,y+5*scale],['Z']],col,INK,1.1);}
function eye(c,x,y,size,col,m,seed=0){const blink=!m.reduced&&(m.time+seed*.019)%5.9<.12,open=m.hurt?.3:blink?.08:1;path(c,[['M',x-size,y],['Q',x,y-size*.72*open,x+size*1.15,y-2],['Q',x+size*.1,y+size*.65*open,x-size,y],['Z']],INK,null);if(open>.2){oval(c,x+size*.25,y-size*.06,size*.5,size*.45*open,col);oval(c,x+size*.45,y-size*.06,size*.12,size*.36*open,'#10232a');oval(c,x+size*.23,y-size*.23,size*.14,size*.12,'#fffcec');}curve(c,[x-size*1.1,y-size*.48,x-size*.2,y-size*.8,x+size*.65,y-size*.7,x+size*1.2,y-size*.3],m.hurt?'#c1ced2':'#efdfb8',1.2);}
function fur(c,x,y,w,h,col,count=8){const p=[['M',x-w*.5,y-h*.15]];for(let i=0;i<count;i++){const a=x-w*.5+i*w/count,b=a+w/count,tip=b+(i%2?-.1:.08)*w/count;p.push(['Q',a+w/count*.15,y+h*.5,tip,y+h*(i%3===0?.83:.65)],['Q',b-w/count*.1,y+h*.27,b,y+h*.07]);}p.push(['Q',x+w*.24,y-h*.28,x,y-h*.23],['L',x-w*.5,y-h*.15],['Z']);path(c,p,col,INK,1.05);for(let i=1;i<count;i+=2){const a=x-w*.5+i*w/count;curve(c,[a,y-h*.08,a-2,y+h*.04,a+2,y+h*.2,a+1,y+h*.35],'#547a7c55',.9);}}
function feather(c,x,y,w,h,angle,col,light){joint(c,x,y,angle,()=>{path(c,[['M',x,y],['C',x-w,y-h*.38,x-w*.5,y-h*.88,x+2,y-h],['C',x+w*.6,y-h*.7,x+w,y-h*.2,x,y],['Z']],col,INK,1.4);curve(c,[x,y-4,x-w*.1,y-h*.22,x+w*.1,y-h*.65,x+2,y-h+6],light,1.1);});}
function vein(c,x,y,scale,col){curve(c,[x,y,x+9*scale,y+7*scale,x-4*scale,y+16*scale,x+10*scale,y+25*scale],col,1.8);line(c,[[x+4*scale,y+10*scale],[x+15*scale,y+7*scale]],col,1);}
function plate(c,p,fill,light){poly(c,p,fill,INK,2);if(light)line(c,p.slice(0,3),light,1.5);}

// These are anatomical motion traits, independent of gameplay tuning. A
// scuttling fortress and a hovering assassin should never share a gait.
const MOTION=Object.freeze({
 pyrojaw:{gait:.8,step:1.4,tuck:11,breath:.75,lean:.75},
 voltantis:{gait:1.6,step:.7,tuck:25,breath:.4,lean:1.25},
 glaciolith:{gait:.68,step:1.5,tuck:9,breath:1.5,lean:.65},
 zephyrix:{gait:1.16,step:.75,tuck:26,breath:.65,lean:1.25},
 terrakhan:{gait:.62,step:.65,tuck:7,breath:.4,lean:.55},
 noxshade:{gait:1.3,step:.65,tuck:21,breath:.5,lean:1.4},
 aqualance:{gait:.95,step:.9,tuck:18,breath:.7,lean:1.15},
 ferrodrake:{gait:.85,step:1.1,tuck:15,breath:1,lean:.85},
});
function poseFor(d,input,t,options){
 const p=typeof input==='string'?{state:input}:input||{},state=p.state||(p.hit?'hit':p.heavy?'heavy':p.attack?'attack':p.air?'air':p.land?'land':'idle');
 const attacking=state==='attack'||state==='heavy'||p.attack>0,explicit=options.attackProgress!=null||p.attackProgress!=null||typeof input==='string';
 const progress=clamp(options.attackProgress??p.attackProgress??.48),heavy=state==='heavy'||!!p.heavy,reduced=!!(options.reducedMotion||p.reducedMotion);
 const anticipate=attacking&&explicit&&progress<.22?Math.sin(progress/.22*Math.PI/2):0;
 const strike=attacking?(explicit?Math.sin(clamp((progress-.22)/.37)*Math.PI/2)*(1-clamp((progress-.59)/.41)):clamp(p.attack||.5)):0;
 const follow=attacking&&progress>.45?Math.sin(clamp((progress-.45)/.55)*Math.PI):0;
 const motion=MOTION[d.id]||{gait:1,step:1,tuck:16,breath:1,lean:1},walk=(p.walk||0)*motion.gait,speed=clamp(options.speed??(walk?1:0)),air=state==='air'||state==='launch'||!!p.air,guard=state==='shield'||state==='parry'||p.shield;
 const time=reduced?0:t,id=hash(d.id),breath=Math.sin(time*2.1+id)*1.1*motion.breath;
 return {state,time,progress,heavy,castVariant:options.castVariant||p.castVariant||'neutral',castPhase:reduced?.65:(Math.sin(time*9)*.5+.5),anticipate,strike,follow,attack:strike*(heavy?1.25:1)-anticipate*.45,combo:options.combo||p.combo||1,air,guard,parry:state==='parry',hurt:state==='hit'||p.hit,death:state==='death'?clamp(options.deathProgress??p.deathProgress??.65):0,dash:state==='dash',cast:state==='cast'||options.charged,land:clamp(p.land||0),reduced,walk,speed,breath,
  stride:Math.sin(walk)*speed*motion.step,flap:Math.sin(time*(d.id==='zephyrix'?air?13:5:air?10:4))*(air?.45:.1),tuck:air?motion.tuck:state==='dash'?9:0,
  lean:((state==='hit'?-.095:guard?-.045:state==='dash'?.12:0)-anticipate*(heavy?.09:.035)+strike*(heavy?.085:.04))*motion.lean,
  tail:Math.sin(time*3.5-walk*.35)*.1+anticipate*.15-strike*.17,head:Math.sin(time*1.8+id)*.015-anticipate*.07+strike*.055,
 };
}
function palette(d){return {body:d.color||'#8aa79d',dark:d.dark||'#354a4d',light:d.accent||'#f0e3ba',shade:'#1d3034',metal:'#a4b4b4',ivory:BONE};}
function quadrupedLeg(c,m,x,back,front,col,armor=false){
 const phase=m.walk+(back?Math.PI:0)+(front?Math.PI:0),swing=Math.sin(phase)*17*m.speed,lift=Math.max(0,Math.cos(phase))*12*m.speed+m.tuck;
 const reach=front?m.attack*17:0,hip=[x,-78],knee=[x+(front?7:-13)+swing*.45+reach,-39-lift*.4],foot=[x+swing+reach,-8-lift];
 segment(c,hip,knee,armor?19:13,armor?17:10,col);segment(c,knee,foot,armor?15:9,armor?16:8,col);
 oval(c,...knee,armor?15:9,armor?14:8,col,INK,1.5);path(c,[['M',foot[0]-14,foot[1]-7],['Q',foot[0]+15,foot[1]-10,foot[0]+24,foot[1]+4],['L',foot[0]-16,foot[1]+4],['Z']],col,INK,1.5);toes(c,foot[0]+1,foot[1],BONE,3,.65);
}
function bipedLeg(c,m,x,back,col,armor=false){
 const phase=m.walk+(back?Math.PI:0),swing=Math.sin(phase)*14*m.speed,lift=Math.max(0,Math.cos(phase))*10*m.speed+m.tuck;
 const hip=[x,-94],knee=[x+swing*.55-(m.guard?7:0),-48-lift*.5],foot=[x+swing+6,-8-lift];
 segment(c,hip,knee,armor?22:15,armor?17:11,col);segment(c,knee,foot,armor?16:11,armor?19:12,col);
 if(armor)plate(c,[[knee[0]-16,knee[1]-12],[knee[0]+16,knee[1]-15],[knee[0]+13,knee[1]+12],[knee[0]-10,knee[1]+15]],col,'#d9e3db77');
 path(c,[['M',foot[0]-18,foot[1]-10],['Q',foot[0]+11,foot[1]-15,foot[0]+28,foot[1]+5],['L',foot[0]-19,foot[1]+5],['Z']],col,INK,2);toes(c,foot[0]+3,foot[1],BONE,3,.7);
}

function gator(c,d,m,p){
 const body=grad(c,-40,-154,50,-25,'#777d72','#343d3c','#192b2c');
 joint(c,-72,-93,m.tail-m.attack*.25,()=>{
  path(c,[['M',-66,-109],['C',-108,-115,-143,-61,-171,-84],['C',-191,-100,-172,-119,-159,-113],['C',-180,-147,-215,-109,-199,-74],['C',-175,-35,-125,-53,-66,-69],['Z']],body,INK,3);
  plate(c,[[-175,-119],[-197,-108],[-207,-81],[-186,-58],[-158,-66],[-144,-91]],'#263b39','#9eaa8b');
  for(let i=0;i<4;i++)vein(c,-191+i*10,-101+i%2*15,.55,'#f7b55c');
  glow(c,-177,-88,40,'#fc9745',m.cast?.3:.1);
 });
 quadrupedLeg(c,m,-57,true,false,p.dark,true);quadrupedLeg(c,m,53,true,true,p.dark,true);
 path(c,[['M',-98,-91],['C',-103,-136,-61,-158,3,-151],['C',62,-148,95,-115,79,-78],['C',54,-48,-65,-43,-90,-70],['Z']],body,INK,3);
 path(c,[['M',-91,-105],['C',-47,-151,36,-137,77,-107],['L',53,-82],['C',6,-93,-39,-81,-80,-76],['Z']],'#34463e',INK,2);
 for(let row=0;row<3;row++)for(let i=0;i<6;i++){const x=-74+i*26+row%2*9,y=-126+row*19;plate(c,[[x,y],[x+13,y-9],[x+25,y],[x+18,y+12],[x+4,y+11]],row===0?'#4c5d4e':'#3d5147','#a6ad8466');}
 for(let i=0;i<6;i++){const x=-80+i*25;plate(c,[[x,-131],[x+8,-169-i%2*13],[x+28,-141],[x+19,-120]],i%2?'#354b45':'#263e3b','#a6b390');vein(c,x+8,-143,.55,'#e7a35b');}
 quadrupedLeg(c,m,-50,false,false,body,true);quadrupedLeg(c,m,60,false,true,body,true);
 joint(c,64,-115,m.head,()=>{
  c.translate(m.attack*21,-m.strike*3);
  path(c,[['M',42,-122],['C',49,-148,79,-163,109,-148],['L',126,-132],['C',148,-133,176,-124,183,-109],['L',177,-96],['L',123,-88],['C',98,-70,58,-78,46,-96],['Z']],body,INK,3);
  path(c,[['M',75,-138],['Q',103,-158,123,-130],['L',175,-117],['L',166,-106],['L',110,-110],['Z']],'#6e7960',INK,2);
  const jaw=m.cast?22+m.castPhase*6:m.strike*8+m.heavy*m.follow*5;
  joint(c,102,-101,-jaw*.009,()=>{path(c,[['M',89,-107],['L',176,-108],['Q',169,-82,126,-80],['L',100,-83],['Z']],'#b3a47d',INK,2);curve(c,[102,-92,127,-88,154,-91,171,-99],'#e5d4a3',2);for(let i=0;i<7;i++)poly(c,[[108+i*9,-104],[112+i*9,-92],[117+i*9,-104]],'#f6e8bd',INK,.7);});
  plate(c,[[58,-139],[65,-162],[79,-151],[91,-162],[108,-146],[97,-128]],'#344a43','#a4b191');eye(c,106,-127,10,'#ffdc8d',m,1);oval(c,170,-118,3.5,2.2,INK);
  for(let i=0;i<4;i++)curve(c,[57+i*13,-108,59+i*13,-101,53+i*13,-94,61+i*13,-84],'#f0a455',1.7);
  if(m.cast||m.dash)for(let i=0;i<4;i++)oval(c,163+i*7,-118-Math.sin(m.time*9+i)*3,2,2,'#ffd08a');
 });
}

function mantis(c,d,m,p){
 c.translate(0,-12-(m.reduced?0:Math.sin(m.time*6)*3));
 for(const back of[true,false])joint(c,-12,-172,(back?-.16:.23)+Math.sin(m.time*(m.air?34:24))* .12,()=>{
  path(c,[['M',-12,-161],['C',-51,-213,-127,-219,-131,-188],['C',-125,-152,-58,-139,-12,-161],['Z']],back?'#adcfae22':'#e4f2c92d','#b7d5b675',1.5);
  curve(c,[-15,-164,-59,-182,-101,-197,-127,-189],'#d6e0b688',1);for(let i=0;i<4;i++)line(c,[[-24-i*22,-168-i*4],[-37-i*20,-192-i*2]],'#c8ddb555',.8);
 });
 for(let i=0;i<4;i++){const x=-12+i*5,y=-121+i*17;oval(c,x,y,28-i*3,17,grad(c,x-20,y-12,x+24,y+12,'#e7e6a1',p.body,p.dark),INK,2);line(c,[[x-18,y+5],[x+18,y+8]],'#273a32',3);}
 for(const back of[true,false]){const x=back?-18:17,phase=m.walk+(back?Math.PI:0),foot=x+Math.sin(phase)*16*m.speed;
  segment(c,[x,-75],[x-18,-42-m.tuck],7,5,p.dark);segment(c,[x-18,-42-m.tuck],[foot,-3-m.tuck],4,3,'#a6b978');line(c,[[foot-5,-2-m.tuck],[foot+13,-2-m.tuck]],BONE,2);}
 path(c,[['M',-18,-171],['Q',2,-190,22,-167],['L',17,-119],['Q',-2,-102,-22,-122],['Z']],grad(c,-20,-170,25,-114,'#e0e59e',p.body,p.dark),INK,2.5);
 for(const back of[true,false]){
  const sign=back?-1:1,active=(m.combo%2===0)===back,extension=m.attack*(active?1:.22),root=[sign*22,-155];
  joint(c,...root,sign*(m.guard?-.5:m.cast?-.2:0)-extension*.7,()=>{
   const elbow=[sign*(44+extension*17),-121-(m.guard?34:0)],wrist=[sign*(58+extension*25),-158-(m.guard?40:0)];
   segment(c,root,elbow,11,7,back?p.dark:'#b3c77b');segment(c,elbow,wrist,7,5,p.body);
   const x=wrist[0],y=wrist[1];
   path(c,[['M',x-8,y+6],['C',x+26,y-9,x+57,y-45,x+65,y-73],['C',x+80,y-29,x+46,y+23,x+6,y+25],['Q',x+17,y+9,x-8,y+6],['Z']],grad(c,x,y-60,x+57,y+22,'#fff3c1','#cbe7a4','#6d9b71'),INK,2);
   curve(c,[x+7,y+12,x+31,y+4,x+57,y-27,x+62,y-56],'#fff9d3',2);for(let i=0;i<3;i++)line(c,[[x+20+i*10,y+2-i*7],[x+18+i*10,y-4-i*7]],'#6c8d65',1);
  });
 }
 joint(c,3,-188,m.head,()=>{
  path(c,[['M',-26,-185],['Q',-29,-211,-5,-226],['Q',24,-232,40,-204],['L',24,-176],['Q',-2,-163,-26,-185],['Z']],grad(c,-24,-225,25,-171,'#edf1b0',p.body,'#7a995a'),INK,2.5);
  plate(c,[[-25,-199],[-6,-205],[-10,-184],[-26,-187]],'#33493c','#91ac6d');plate(c,[[10,-208],[36,-207],[26,-185],[10,-184]],'#33493c','#b6c98f');eye(c,24,-196,9,'#f3ffd3',m,2);
  poly(c,[[-5,-182],[10,-183],[6,-171]],'#e1d7a4',INK,1);line(c,[[-12,-219],[-27,-242],[-23,-256]],'#d4dfad',3);curve(c,[13,-223,18,-245,38,-251,42,-260],'#d4dfad',3);oval(c,42,-260,3,4,'#e8ffd3');
 });
}

function yeti(c,d,m,p){
 const frost=grad(c,-75,-220,76,-70,'#e9f6e9','#b6dcd9','#507e90');
 // A smaller lower pair braces the body while the primary arms strike.
 for(const back of[true,false]){const side=back?-1:1,angle=side*(m.guard?.55:m.cast?-.6:.15)-m.strike*.18,reach=m.cast?29:0; joint(c,side*44,-130,angle,()=>{segment(c,[side*44,-130],[side*(77+reach*.3),-101],17,13,p.dark);segment(c,[side*(77+reach*.3),-101],[side*(72+reach),-64],13,16,'#82b1b9');fur(c,side*(73+reach),-67,32,20,'#cfe6df',5);});}
 bipedLeg(c,m,-39,true,p.dark,true);bipedLeg(c,m,39,false,frost,true);
 path(c,[['M',-67,-181],['C',-80,-153,-79,-114,-51,-83],['Q',-7,-61,39,-84],['C',78,-112,78,-163,57,-186],['Q',-7,-214,-67,-181],['Z']],frost,INK,3);
 fur(c,0,-174,128,61,'#e7f0df',11);fur(c,-9,-128,81,39,'#d4e3d6',8);
 for(const back of[true,false]){
  const sign=back?-1:1,striking=(m.combo%2===0)===back,a=m.attack*(striking?1:.24),root=[sign*58,-174];
  joint(c,...root,-sign*(m.guard?.65:.03)-a*.38,()=>{
   const elbow=[sign*86+a*35,-135-(m.guard?25:0)],hand=[sign*80+a*57,-84-(m.guard?52:0)-m.strike*15];
   segment(c,root,elbow,27,25,back?p.dark:frost);segment(c,elbow,hand,28,32,back?'#6094a1':frost);
   for(let i=0;i<4;i++){const x=lerp(elbow[0],hand[0],i/4);plate(c,[[x-19,-143+i*13],[x-13,-179+i*14],[x+4,-155+i*13],[x+21,-146+i*13],[x+16,-120+i*13]],i%2?'#a6d3d8':'#d1ece7','#f3fff2');}
   oval(c,...hand,34,29,back?'#79acb4':'#b9dcd9',INK,2);toes(c,hand[0]-16,hand[1]+18,BONE,3,.9);fur(c,root[0],-181,50,27,'#e7f1e1',6);
  });
 }
 joint(c,0,-213,m.head,()=>{
  oval(c,-2,-215,41,39,'#e3eee1',INK,2.4);fur(c,-2,-207,76,39,'#e3eee1',8);
  path(c,[['M',-29,-226],['Q',0,-243,29,-223],['L',24,-204],['Q',0,-188,-27,-208],['Z']],'#486d79',INK,1.7);eye(c,15,-219,9,'#dcfff1',m,3);
  oval(c,0,-205,12,7,'#263e48');path(c,[['M',-11,-193],['Q',5,-184,18,-197]],null,'#314f59',2);
  for(const sign of[-1,1])path(c,[['M',sign*25,-237],['C',sign*64,-268,sign*73,-224,sign*49,-225],['C',sign*66,-245,sign*43,-250,sign*32,-228],['Z']],grad(c,-60,-260,60,-225,'#e4eee1','#99c6d0','#426e86'),INK,2);
  for(let i=0;i<3;i++)poly(c,[[-15+i*15,-244],[-12+i*15,-267+i%2*5],[3+i*15,-247]],'#d3efdf',INK,1.3);
 });
}

function quadrupedBody(c,m,p,bird){
 quadrupedLeg(c,m,-51,true,false,p.dark);quadrupedLeg(c,m,49,true,true,p.dark);
 path(c,[['M',-78,-111],['C',-63,-143,5,-153,60,-130],['Q',83,-112,59,-79],['C',20,-62,-49,-62,-71,-80],['Z']],grad(c,-66,-147,64,-63,p.light,p.body,p.dark),INK,2.8);
 path(c,[['M',-68,-109],['Q',-39,-130,-12,-122],['Q',-20,-90,-55,-78],['Q',-75,-86,-68,-109],['Z']],p.dark+'55',null);
 curve(c,[-66,-125,-37,-144,10,-143,43,-129],'#f1edcf66',1.7);curve(c,[-24,-83,5,-77,28,-84,37,-103],p.dark,1.4);
 if(bird)fur(c,48,-136,70,46,'#e2eee3',9);
 quadrupedLeg(c,m,-48,false,false,p.body);quadrupedLeg(c,m,55,false,true,p.body);
}
function jackal(c,d,m,p){
 joint(c,-65,-98,m.tail-m.attack*.3,()=>{
  path(c,[['M',-61,-116],['C',-119,-146,-85,-205,-173,-213],['C',-142,-192,-168,-159,-200,-169],['C',-184,-137,-152,-129,-161,-103],['C',-134,-120,-99,-74,-67,-83],['Z']],grad(c,-180,-205,-90,-77,'#bb9bcc','#795484','#352f4c'),INK,2.8);
  curve(c,[-78,-109,-133,-124,-112,-165,-157,-185],'#cfabd66b',2);for(let i=0;i<4;i++)feather(c,-136-i*9,-127-i*13,7,37,-.7,'#8b609e','#cfabd655');
 });
 quadrupedBody(c,m,p,false);
 path(c,[['M',-62,-128],['Q',-19,-155,45,-134],['L',55,-108],['Q',-15,-128,-71,-94],['Z']],'#4b3c5a',INK,1.8);for(let i=0;i<4;i++)curve(c,[-48+i*25,-121,-43+i*25,-111,-48+i*25,-102,-40+i*25,-95],'#c5a2cc',1.1);
 joint(c,48,-135,m.head,()=>{
  c.translate(m.attack*24,-m.anticipate*5);
  path(c,[['M',33,-143],['L',35,-194],['Q',48,-204,61,-172],['L',86,-181],['L',116,-210],['Q',125,-184,114,-157],['L',150,-132],['Q',156,-117,122,-111],['L',85,-117],['Q',53,-111,33,-143],['Z']],grad(c,32,-198,144,-111,'#a7a2bc',p.body,p.dark),INK,2.7);
  path(c,[['M',49,-186],['L',44,-158],['L',62,-169],['Z']],'#d5b8cf',INK,1);path(c,[['M',110,-195],['L',91,-170],['L',113,-170],['Z']],'#b99abf',INK,1);
  path(c,[['M',98,-137],['Q',123,-126,148,-133],['L',148,-123],['Q',122,-111,97,-121],['Z']],p.dark,INK,1.3);eye(c,100,-146,10,'#f1d4fa',m,4);
  poly(c,[[141,-132],[155,-127],[146,-120]],'#172533');curve(c,[56,-141,68,-135,64,-127,75,-122],'#e1b9d3',1.4);for(let i=0;i<4;i++)line(c,[[76+i*8,-126],[79+i*8,-120]],'#e5dac5',1.2);
  if(m.cast)for(let i=0;i<4;i++)oval(c,128+i*9,-138+Math.sin(m.time*4+i)*6,2,3,'#d2abed');
 });
}
function griffin(c,d,m,p){
 joint(c,-62,-96,m.tail,()=>{path(c,[['M',-62,-102],['C',-112,-111,-119,-65,-158,-79],['Q',-145,-45,-116,-58],['L',-63,-76],['Z']],p.dark,INK,2.4);for(let i=0;i<4;i++)feather(c,-142+i*7,-68,7,30,-1.05+i*.1,'#d9eadb','#f5efd5');});
 for(const back of[true,false])joint(c,-4,-128,(back?-.12:.08)+m.flap-(m.guard?.7:0)-m.attack*.24,()=>{
  path(c,[['M',20,-123],['Q',-19,-164,-107,-191],['L',-91,-122],['Q',-45,-90,4,-93],['Z']],back?p.dark:'#b7d6cb',INK,2);
  for(let i=0;i<8;i++)feather(c,-4-i*10,-109-i*4,12,80+i*6,-.5-i*.09,i%2?'#d8ebdf':'#b8d5cb','#f5f5df');
  for(let i=0;i<5;i++)oval(c,-14-i*12,-131-i*4,15,7,'#8fb9ad',INK,1);
 });
 quadrupedBody(c,m,p,true);
 joint(c,55,-142,m.head,()=>{
  c.translate(m.attack*22,-m.strike*5);fur(c,56,-151,79,50,'#f2f0db',10);
  path(c,[['M',47,-155],['Q',46,-190,69,-207],['Q',96,-218,115,-187],['L',108,-151],['L',85,-128],['L',59,-136],['Z']],grad(c,51,-205,114,-133,'#f2efdc','#cee1d4','#739b91'),INK,2.3);
  path(c,[['M',104,-177],['Q',130,-171,151,-153],['Q',137,-144,118,-142],['L',96,-151],['Z']],grad(c,104,-180,135,-145,'#f2dda7','#bba06d','#806b4f'),INK,2);
  curve(c,[120,-160,130,-156,143,-153,149,-154],'#f5e7b9',1.5);eye(c,101,-180,9,'#88bfae',m,5);
  for(let i=0;i<4;i++)feather(c,57+i*9,-193-i%2*7,9,40,-.45+i*.15,i%2?'#a6cbc0':'#e5ead6','#f4f0d6');
 });
 for(let i=0;i<6;i++){const a=i*.32+.2,x=57+Math.cos(a)*31,y=-127+Math.sin(a)*22;oval(c,x,y,4.4,4.4,'#c9b885',INK,1);oval(c,x-1,y-1,1,1,'#fff2c9');}
}

function beetle(c,d,m,p){
 for(const back of[true,false])for(let i=0;i<3;i++){
  const x=-76+i*65,phase=m.walk+i*2.1+(back?Math.PI:0),swing=Math.sin(phase)*16*m.speed,lift=Math.max(0,Math.cos(phase))*10*m.speed+m.tuck;
  const a=[x,-88],b=[x-24+swing*.4,-43-lift*.5],f=[x+swing,-5-lift];segment(c,a,b,14,10,back?'#334a3c':'#718b61');segment(c,b,f,10,9,p.dark);plate(c,[[f[0]-16,f[1]-8],[f[0]+7,f[1]-11],[f[0]+24,f[1]+4],[f[0]-18,f[1]+3]],'#536c4f','#a3b88a');
 }
 oval(c,-10,-98,108,62,p.dark,INK,3);
 joint(c,-9,-102,(m.cast?Math.sin(m.time*9)*.018:0)-m.anticipate*.045,()=>{
  path(c,[['M',-116,-108],['C',-108,-164,-49,-182,-11,-163],['L',-13,-75],['C',-54,-57,-105,-69,-116,-108],['Z']],grad(c,-95,-174,-20,-67,'#a5b88b','#687f57','#334e3f'),INK,3);
  path(c,[['M',-7,-162],['C',44,-178,91,-137,87,-97],['Q',58,-54,-7,-75],['Z']],grad(c,0,-169,77,-67,'#90a67a','#60794e','#304c3c'),INK,3);
  curve(c,[-10,-161,-17,-132,-13,-95,-10,-77],'#c4cca0',2);
  for(let side of[-1,1])for(let i=0;i<4;i++){const x=side*(25+i*17),y=-146+i*9;curve(c,[x,y,x+side*13,y-9,x+side*24,y-2,x+side*24,y+14],'#acbb8b88',1.3);}
 });
 for(let i=0;i<5;i++){const x=-91+i*36;plate(c,[[x,-132],[x-9,-163-i%2*13],[x+17,-151],[x+28,-126]],'#708a60','#b4c59a');}
 joint(c,78,-104,m.head-m.attack*.15,()=>{
  c.translate(m.attack*17,0);
  path(c,[['M',57,-126],['Q',95,-145,124,-120],['L',136,-88],['Q',119,-60,84,-63],['L',58,-83],['Z']],grad(c,71,-143,129,-63,'#a9bb8a','#738858','#36513c'),INK,2.5);
  path(c,[['M',109,-124],['C',108,-172,136,-214,165,-207],['Q',171,-192,151,-178],['Q',134,-162,140,-119],['Z']],grad(c,113,-209,149,-116,'#cbd0a1','#a1ae76','#617a52'),INK,2);
  for(let i=0;i<5;i++)curve(c,[120+i*2,-142-i*11,130+i*3,-142-i*11,138+i*2,-148-i*10,144+i*2,-152-i*11],'#4f6b46',1.5);
  eye(c,117,-104,9,'#e6eec1',m,6);line(c,[[108,-80],[125,-82]],'#d0c99d',2);
 });
 const pulse=m.cast?.75:.2;glow(c,-26,-124,36,'#b8e6a0',pulse);plate(c,[[-48,-128],[-26,-148],[-3,-129],[-24,-102]],'#89b990','#e2edc0');plate(c,[[-36,-128],[-25,-139],[-14,-128],[-25,-113]],'#d7edb4',null);
}

function shark(c,d,m,p){
 const steel=grad(c,-58,-225,70,-48,'#cbded9','#719cae','#294e64');
 joint(c,-32,-147,m.tail*.55,()=>{path(c,[['M',-28,-182],['L',-78,-217],['L',-67,-160],['L',-100,-128],['Q',-60,-117,-31,-126],['Z']],p.dark,'#aac7ce',1.8);});
 bipedLeg(c,m,-29,true,p.dark);bipedLeg(c,m,32,false,steel,true);
 path(c,[['M',-36,-192],['Q',0,-214,38,-184],['Q',61,-140,28,-91],['L',-27,-84],['Q',-60,-134,-36,-192],['Z']],steel,INK,3);
 for(let i=0;i<6;i++)plate(c,[[-39,-174+i*14],[-4,-158+i*12],[34,-174+i*14],[30,-152+i*13],[-3,-141+i*12],[-34,-151+i*13]],i%2?'#9fbfc4':'#638ca2','#d9e4d8aa');
 for(const back of[true,false]){const sign=back?-1:1,x=sign*42,a=m.attack*(back?.3:1),y=-168-(m.guard?28:0);joint(c,x,y,-sign*(m.guard?.5:.1)-a*.32,()=>{segment(c,[x,y],[x+sign*30+a*18,y+38],15,10,back?p.dark:steel);path(c,[['M',x+sign*17,y+21],['L',x+sign*72+a*20,y-13],['Q',x+sign*67+a*20,y+25,x+sign*29,y+49],['Z']],steel,INK,2);line(c,[[x+sign*23,y+28],[x+sign*55+a*15,y+6]],'#e0e9db',1.8);});}
 joint(c,5,-218,m.head-m.attack*.1,()=>{
  c.translate(m.attack*26,0);
  path(c,[['M',-26,-228],['L',-12,-255],['L',7,-281],['L',26,-249],['Q',47,-224,32,-193],['L',-12,-193],['Z']],steel,INK,2.4);
  path(c,[['M',-61,-249],['Q',-43,-266,-22,-249],['L',18,-251],['Q',47,-270,70,-249],['L',68,-231],['L',29,-232],['Q',3,-217,-21,-231],['L',-60,-230],['Z']],steel,INK,2.5);
  eye(c,-44,-242,7,'#e7f6df',m,7);eye(c,57,-243,7,'#e7f6df',m,7);
  path(c,[['M',25,-225],['L',64,-231],['L',71,-220],['L',31,-210],['Z']],grad(c,29,-241,44,-209,'#f7f3d7','#b7ced0','#63879b'),INK,2);
  path(c,[['M',-12,-211],['Q',5,-201,23,-211]],null,'#284f61',2);for(let i=0;i<3;i++)curve(c,[-21+i*8,-221,-24+i*8,-217,-22+i*8,-212,-25+i*8,-207],'#315972',1.3);
 });
}

function dragon(c,d,m,p){
 const chrome=grad(c,-54,-248,57,-28,'#e9e8d5','#acb9bd','#4b6473');
 joint(c,-30,-101,m.tail,()=>{path(c,[['M',-25,-112],['C',-60,-124,-67,-68,-103,-66],['L',-124,-83],['Q',-113,-39,-81,-47],['L',-23,-76],['Z']],chrome,INK,2);for(let i=0;i<5;i++)poly(c,[[-49-i*12,-89+i*5],[-61-i*12,-109+i*6],[-69-i*12,-79+i*6]],'#a65c64',INK,1);});
 for(const back of[true,false]){const sign=back?-1:1; joint(c,sign*21,-175,sign*(m.flap*.35-(m.guard?.45:0)+m.attack*.1),()=>{
  path(c,[['M',sign*18,-174],['L',sign*101,-259],['L',sign*91,-181],['L',sign*122,-132],['L',sign*58,-142],['L',sign*26,-112],['Z']],back?'#617889':chrome,INK,2.2);
  path(c,[['M',sign*27,-172],['L',sign*89,-235],['L',sign*70,-171],['L',sign*94,-147],['L',sign*48,-151],['Z']],grad(c,0,-240,75,-134,'#bd7778','#844c5c','#533d52'),INK,1.2);
  curve(c,[sign*26,-175,sign*50,-182,sign*68,-212,sign*89,-235],'#e1e6d7',2);oval(c,sign*51,-172,16,17,'#3d5364','#d9dfce',2);for(let i=0;i<4;i++)line(c,[[sign*(41+i*5),-180],[sign*(38+i*5),-167]],'#b8c6bc',1.4);
 });}
 bipedLeg(c,m,-30,true,p.dark,true);bipedLeg(c,m,32,false,chrome,true);
 path(c,[['M',-37,-190],['Q',0,-213,42,-186],['L',45,-136],['L',26,-89],['Q',0,-72,-33,-91],['L',-52,-142],['Z']],chrome,INK,3);
 plate(c,[[-39,-181],[0,-203],[39,-180],[25,-139],[0,-124],[-28,-143]],'#984d5c','#edb49d');plate(c,[[-20,-170],[0,-186],[20,-168],[0,-145]],'#dfac9a','#fff0d1');
 for(let i=0;i<4;i++)plate(c,[[-27,-119+i*9],[0,-110+i*9],[28,-121+i*9],[22,-107+i*9],[0,-99+i*9]],i%2?'#849da6':'#c2cfc9','#e8e7d8');
 for(const back of[true,false]){const sign=back?-1:1,a=m.attack*(((m.combo%2===0)===back)?1:.22),shoulder=[sign*43,-176],elbow=[sign*62+a*32,-137-(m.guard?24:0)],hand=[sign*56+a*58,-102-(m.guard?60:0)];joint(c,...shoulder,-sign*(m.guard?.3:0)-a*.25,()=>{oval(c,...shoulder,26,25,'#835461','#d6d5c4',2);for(let i=0;i<4;i++)line(c,[[shoulder[0]-10+i*6,-188],[shoulder[0]-12+i*6,-174]],'#253d50',2);segment(c,shoulder,elbow,19,16,chrome);segment(c,elbow,hand,17,21,chrome);plate(c,[[hand[0]-19,hand[1]-19],[hand[0]+16,hand[1]-25],[hand[0]+27,hand[1]+9],[hand[0]-17,hand[1]+16]],'#8faaaa','#e7ead9');toes(c,hand[0]+4,hand[1]+5,'#e5ead8',3,.85);});}
 joint(c,0,-213,m.head,()=>{
  c.translate(m.attack*11,-m.anticipate*3);
  path(c,[['M',-24,-225],['L',-21,-250],['L',-38,-275],['L',-9,-257],['L',13,-264],['L',36,-280],['L',30,-248],['Q',47,-232,39,-209],['L',14,-195],['L',-17,-206],['Z']],chrome,INK,2.5);
  path(c,[['M',-20,-231],['L',6,-240],['L',33,-226],['L',51,-213],['L',38,-199],['L',2,-202],['Z']],p.dark,INK,1.7);eye(c,26,-226,9,'#f8c4ac',m,8);
  plate(c,[[-14,-255],[-6,-278],[6,-262],[17,-278],[26,-250]],'#ad6470','#e6c2a4');line(c,[[8,-207],[37,-210]],'#c5d4c8',1.6);for(let i=0;i<3;i++)line(c,[[12+i*8,-209],[15+i*8,-202]],'#eef0da',1);
 });
}

function deer(c,d,m,p){
 for(const back of[true,false])for(const front of[false,true]){
  const x=front?45:-51,phase=m.walk+(back?Math.PI:0)+(front?Math.PI:0),delta=Math.sin(phase)*15*m.speed,lift=Math.max(0,Math.cos(phase))*9*m.speed+m.tuck;
  segment(c,[x+(back?-8:8),-94],[x+delta*.5,-48-lift*.5],8,5,back?p.dark:p.body);segment(c,[x+delta*.5,-48-lift*.5],[x+delta,-7-lift],4,3,'#90b59b');plate(c,[[x+delta-5,-13-lift],[x+delta+8,-12-lift],[x+delta+13,0-lift],[x+delta-6,0-lift]],'#d4c4a3','#f3e5c1');
 }
 path(c,[['M',-75,-105],['Q',-73,-145,-15,-145],['Q',48,-150,67,-121],['L',59,-90],['Q',-4,-65,-59,-84],['Z']],grad(c,-50,-148,44,-76,'#bfd1ac','#779c81','#3b5f55'),INK,2.4);
 for(let i=0;i<9;i++){const x=-65+i*14,y=-132+(i%3)*4;feather(c,x,y,16,27+Math.sin(m.time*2+i)*2,.15+(i%3-.5)*.1,i%2?'#7ca480':'#a5bd91','#d5d8ae');}
 joint(c,49,-139,m.head-m.attack*.1,()=>{
  c.translate(m.attack*17,-m.strike*4);
  path(c,[['M',32,-127],['Q',45,-164,46,-195],['Q',52,-223,77,-219],['Q',111,-216,115,-189],['L',104,-162],['L',75,-124],['Z']],grad(c,39,-224,108,-125,'#d7dcbb','#9cbb98','#4e7765'),INK,2.4);
  for(const sign of[-1,1]){const x=sign<0?54:85;curve(c,[x,-206,x+sign*9,-238,x+sign*21,-256,x+sign*44,-265],'#b9aa89',6);curve(c,[x+sign*15,-247,x+sign*2,-260,x+sign*16,-275,x+sign*18,-279],'#b9aa89',4);oval(c,x+sign*43,-267,18,7,'#dac79b',INK,1.2);oval(c,x+sign*41,-270,12,4,'#eee4bd');glow(c,x+sign*43,-267,22,'#eae7ac',.1);}
  path(c,[['M',49,-189],['L',23,-214],['Q',14,-189,43,-171],['Z']],'#759d83',INK,1.3);path(c,[['M',93,-201],['L',125,-219],['Q',130,-190,103,-181],['Z']],'#8ead8b',INK,1.3);
  for(let i=0;i<3;i++){oval(c,64+i*7,-194+i*8,2.3,3.1,'#dbe2ae');oval(c,64+i*7,-194+i*8,.7,1.3,'#38594f');oval(c,80+i*9,-192+i*7,3,4,'#f5e2b5');oval(c,81+i*9,-193+i*7,.8,1.3,'#38594f');}oval(c,110,-173,3.5,2.5,'#42665b');
 });
 for(let i=0;i<5;i++){const x=-55+i*20,y=-109+Math.sin(i)*8;oval(c,x,y,3.5,5,'#d5d6a7');line(c,[[x,y-5],[x-2,y-13]],'#547c60',1);}
}
function wingCreature(c,d,m,p,owl){
 for(const sign of[-1,1]){
  const back=sign<0;
  const count=owl?3:2;
  for(let layer=count-1;layer>=0;layer--)joint(c,sign*14,-142,sign*(m.flap+layer*.19+(m.guard?-.65:0)+m.attack*.23+(back?-.1:0)),()=>{
   const span=132-layer*18;
   path(c,[['M',sign*12,-146],['C',sign*45,-225+layer*26,sign*107,-253+layer*37,sign*span,-198+layer*35],['Q',sign*(span+30),-118+layer*30,sign*38,-84+layer*14],['Z']],back?p.dark:grad(c,0,-230,sign*120,-90,p.light,p.body,p.dark),INK,1.8);
   if(owl){for(let i=0;i<6;i++)feather(c,sign*(40+i*14),-116+layer*18-i*6,10,70+layer*5,sign*.3,back?p.dark:i%2?'#bbced6':'#dde3d4','#edf0d9');}
   else{const x=sign*88,y=-169+layer*48;oval(c,x,y,29,39,'#e0c9aa88','#efe4c1',1.2);oval(c,x,y,15,24,'#665c78');oval(c,x+sign*3,y-3,7,12,'#d6cba5');curve(c,[sign*20,-143,sign*46,-167,sign*92,-218+layer*37,sign*(span-5),-196+layer*35],'#eee1c166',1.3);for(let i=0;i<3;i++)line(c,[[sign*(45+i*20),-165-i*11+layer*28],[sign*(67+i*20),-104+layer*24]],'#d3c5b44d',1);}
  });
 }
 for(const sign of[-1,1]){segment(c,[sign*15,-65],[sign*21+m.stride*3,-23-m.tuck],5,3,p.dark);line(c,[[sign*21+m.stride*3,-23-m.tuck],[sign*35,-12-m.tuck]],BONE,3);}
 path(c,[['M',-27,-168],['Q',-48,-124,-27,-71],['Q',0,-39,29,-74],['Q',45,-125,28,-169],['Z']],grad(c,-28,-170,31,-49,p.light,p.body,p.dark),INK,2.4);
 if(owl){for(let i=0;i<5;i++)fur(c,0,-153+i*17,70-i*8,19,i%2?'#b5c8cb':'#d8ded2',6);}
 else{for(let i=0;i<4;i++)oval(c,0,-118+i*12,20-i*2,11,i%2?'#d7c29d':'#d8cdb1',INK,1.1);glow(c,0,-115,37,'#ffe2a6',.25+(m.cast?.1:0));path(c,[['M',-11,-130],['Q',0,-151,11,-129],['L',14,-103],['Q',0,-91,-14,-104],['Z']],'#f9e4ae','#a7967a',1.5);curve(c,[0,-132,-6,-116,7,-112,0,-100],'#fff6d0',2);}
 joint(c,0,-180,m.head,()=>{
  oval(c,0,-190,owl?51:31,owl?45:33,grad(c,-42,-227,40,-158,p.light,p.body,p.dark),INK,2.5);
  for(const sign of[-1,1]){oval(c,sign*(owl?23:15),-193,owl?22:12,owl?27:17,owl?'#d9ddd0':'#645971',INK,1.6);oval(c,sign*(owl?23:15),-193,owl?12:6,owl?16:10,owl?'#526a7c':'#e6d9a9');eye(c,sign*(owl?23:15),-193,owl?9:6,owl?'#dce9de':'#fbefca',m,owl?10:9);}
  poly(c,[[-10,-180],[0,-162],[11,-180]],'#d4bd95',INK,1.3);
  if(owl){for(let i=0;i<5;i++)feather(c,-33+i*16,-222,10,34+i%2*10,(i-2)*.15,i%2?'#a5bcc9':'#d7e0d4','#e9ead3');plate(c,[[-16,-237],[-13,-263],[13,-263],[17,-237],[7,-228],[-7,-228]],'#d9c496','#fcf0ca');line(c,[[-9,-257],[8,-236],[-8,-236],[9,-257]],'#596d7a',1.8);oval(c,0,-248,2,3,'#f1e5bd');}
  else for(const sign of[-1,1]){curve(c,[sign*12,-216,sign*27,-239,sign*35,-241,sign*40,-256],'#c8c6a0',3);for(let i=0;i<4;i++)line(c,[[sign*(23+i*4),-235-i*4],[sign*(36+i*5),-238-i*5]],'#ded6ae',1);}
 });
}

function signatureAnatomy(c,d,m,p){
 const t=m.time,cast=m.cast,pulse=m.reduced?.65:m.castPhase;
 if(d.id==='pyrojaw'){
  // Open dorsal chimneys vent the same magma as the ground-denial skill.
  for(let i=0;i<4;i++){const x=-75+i*29,y=-147-i%2*9;poly(c,[[x-9,y+9],[x-8,y-17],[x+8,y-15],[x+12,y+10]],'#202e2f','#8f9a84',1.5);oval(c,x+1,y-13,6,3,'#ffba6e');
   if(cast||m.dash){const high=12+(cast?25:10)*pulse;curve(c,[x,y-18,x-13,y-high,x+12,y-high-11,x+5,y-high-21],'#f4a05e',4);glow(c,x,y-28,24,'#ffad58',.17);}}
  for(let i=0;i<6;i++){const x=-78+i*26;curve(c,[x,-104,x+12,-109,x+9,-97,x+18,-91],'#fb9e55',cast?2.8:1.1);}
 }else if(d.id==='voltantis'){
  // Exposed neon circuitry and a hard-light scythe edge, not a shared aura.
  curve(c,[-8,-167,-2,-157,-9,-142,1,-125],'#e6ff72',3);line(c,[[-12,-204],[-8,-215],[6,-215]],'#f9ffb0',2);
  for(const side of[-1,1]){const reach=cast?23*pulse:0;curve(c,[side*68,-157,side*(98+reach),-183,side*(114+reach),-213,side*(118+reach),-235],'#dfff6e',cast?5:2.3);glow(c,side*(102+reach),-202,31,'#dcff65',cast?.2:.08);}
  if(cast)for(let i=0;i<3;i++)line(c,[[-40-i*13,-159+i*14],[-77-i*15,-160+i*14]],'#ebff9b88',2);
 }else if(d.id==='glaciolith'){
  // The lower hands make a grappling cage; the main arms carry the ice crown.
  for(const side of[-1,1]){const reach=cast?pulse*21:0;for(let i=0;i<3;i++)poly(c,[[side*(65+i*11+reach),-83],[side*(70+i*11+reach),-107-i*5],[side*(80+i*11+reach),-80]],'#d5f3ee','#719eaf',1.2);}
  for(let i=0;i<4;i++){const x=-34+i*22;poly(c,[[x,-171],[x+7,-197-(i%2)*12],[x+17,-171]],'#b6e5e5','#effff4',1);}
  if(cast)curve(c,[-83,-67,-56,-84,47,-84,89,-66],'#dffdf2',3);
 }else if(d.id==='zephyrix'){
  // Prayer beads float independently of the monk's collar and wing motion.
  for(let i=0;i<7;i++){const a=i*TAU/7+t*(cast?1.6:.35),rx=cast?67:42,ry=cast?27:16,x=14+Math.cos(a)*rx,y=-153+Math.sin(a)*ry;oval(c,x,y,cast?5.8:4.6,cast?5.8:4.6,'#d9d4a8','#547c75',1.3);oval(c,x-1,y-1,1.2,1.2,'#ffffdf');}
  path(c,[['M',37,-129],['Q',7,-118,-31,-128],['L',-53,-104],['Q',-9,-111,27,-111]],'#e2e7cd','#69998a',1.2);
  if(cast||m.air){curve(c,[-80,-84,-125,-112,-104,-157,-55,-164],'#caffea88',2);curve(c,[72,-89,119,-118,104,-156,76,-161],'#caffea66',1.4);}
 }else if(d.id==='terrakhan'){
  // Fractured plates lift apart during tectonic casts, exposing the core.
  for(let i=0;i<3;i++){const x=-77+i*37,lift=cast?(11+pulse*9):0;poly(c,[[x,-141-lift],[x+11,-174-lift],[x+34,-157-lift],[x+34,-135-lift]],'#596b4c','#c3d198',2);line(c,[[x+10,-149-lift],[x+19,-158-lift],[x+28,-149-lift]],'#b6efac',1.4);}
  if(cast)for(const side of[-1,1])curve(c,[side*29,-120,side*58,-112,side*63,-95,side*87,-89],'#dcf9b5',2.7);
 }else if(d.id==='noxshade'){
  // A visibly detached shadow-flame hand acts as the jackal's third limb.
  const tx=-159-(cast?pulse*24:0),ty=-162+Math.sin(t*3)*8;
  for(let i=0;i<3;i++)curve(c,[-83-i*5,-106-i*2,-128-i*4,-112,-100-i*9,ty-5,tx+19-i*3,ty+10],'#bb8ee1'+(i?'66':'aa'),2.2-i*.4);
  path(c,[['M',tx+15,ty+12],['L',tx-10,ty+14],['L',tx-25,ty-2],['L',tx-36,ty-29],['L',tx-17,ty-14],['L',tx-12,ty-39],['L',tx-1,ty-18],['L',tx+9,ty-36],['L',tx+15,ty-9],['Z']],'#765496aa','#d7a5ed',1.4);
  for(let i=0;i<3;i++)line(c,[[22+i*20,-119],[27+i*20,-108]],'#f0b6e2',1.2);
 }else if(d.id==='aqualance'){
  // A basket-hilt hydro-rapier gives the duelist a clear, held weapon.
  const thrust=m.attack*24+(cast?pulse*17:0),hx=83+thrust,hy=-132-(m.guard?23:0);
  segment(c,[42,-166],[67+thrust*.45,-138],13,9,p.body);segment(c,[67+thrust*.45,-138],[hx,hy],9,9,p.light);
  oval(c,hx+5,hy,8,17,'#557d92','#cde8e4',2);curve(c,[hx-9,hy+8,hx-6,hy-20,hx+13,hy-24,hx+18,hy-3],'#d3e5d9',2);
  poly(c,[[hx+11,hy-4],[208,hy-14-(cast?9:0)],[hx+13,hy+4]],'#b9f5f6bb','#e8ffff',1.4);line(c,[[hx-15,hy],[hx+12,hy]],'#4b677c',4);
  if(cast)curve(c,[hx+29,hy+2,hx+62,hy+15,hx+83,hy-14,208,hy-12],'#b8ffff88',2);
 }else if(d.id==='ferrodrake'){
  for(const side of[-1,1]){const x=side*52,y=-173;oval(c,x,y,17,19,'#243849','#c4d6ce',2.4);oval(c,x,y,11,13,'#526f7a','#91a9aa',1);
   for(let i=0;i<5;i++){const a=t*(cast?17:6)+i*TAU/5;line(c,[[x+Math.cos(a)*3,y+Math.sin(a)*3],[x+Math.cos(a+.4)*11,y+Math.sin(a+.4)*13]],'#d5e2d7',2);}
   oval(c,x,y,4,5,cast?'#ffdfb0':'#df9c95');if(cast||m.dash){curve(c,[x-5,y+14,x-13,y+33,x+14,y+43,x+2,y+65],'#ffb7a2',5);glow(c,x,y+24,30,'#ff9e81',.16);}}
 }
}

function accents(c,d,m,p,options){
 const low=['gator','beetle','griffin','jackal'].includes(d.rig),y=low?-105:-158,col=options.elementColor||p.light;
 if(m.strike>.32){c.save();c.globalAlpha*=m.strike*.36;path(c,[['M',70,y+39],['C',133,y+28,148,y-25,102,y-51]],null,col,m.heavy?6:3);path(c,[['M',81,y+31],['C',125,y+16,134,y-22,108,y-40]],null,'#fff4cf',1.2);c.restore();}
 if(m.guard){c.save();c.globalAlpha*=m.parry?.8:.45;path(c,[['M',low?106:73,y-40],['Q',low?144:112,y,low?110:78,y+44]],null,m.parry?'#fff3c1':col,m.parry?6:3);c.restore();}
 if(m.cast){for(let i=0;i<5;i++){const a=m.time*1.5+i*TAU/5,x=12+Math.cos(a)*31,sy=(low?-149:-226)+Math.sin(a)*11;poly(c,[[x,sy-4],[x+3,sy],[x,sy+4],[x-3,sy]],col,null);}}
 if(m.hurt){c.save();c.globalAlpha*=.25;path(c,[['M',-54,y-8],['Q',0,y-35,61,y-10]],null,'#fff8dc',5);c.restore();}
}

/** Draw one of eleven fully articulated original companions. */
export function drawCreature(c,d,x,y,s=1,face=1,input={},time=0,options={}){
 if(!d||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(s))return;
 const m=poseFor(d,input,Number.isFinite(time)?time:0,options),p=palette(d),low=['gator','beetle','griffin','jackal'].includes(d.rig);
 c.save();
 try{
  c.translate(x,y);c.scale(s*(face===-1?-1:1),s);
  if(options.shadow!==false)oval(c,0,2,low?95:57,m.air?5:9,'#030f1288');
  if(options.aura)glow(c,0,low?-100:-155,low?135:112,p.body,.1);
  c.translate(m.hurt?-8:m.strike*3,m.breath-Math.abs(m.stride)*2+m.land*5);c.rotate(m.lean);
  if(m.death){c.translate(0,m.death*5);c.rotate(m.death*.48);c.scale(1,1-m.death*.36);c.globalAlpha*=1-m.death*.55;}
  const squash=m.land*.1+(m.guard?.025:0)+m.anticipate*.035;c.scale(1+squash+(m.dash?.07:0),1-squash-(m.dash?.045:0));
  if(m.cast&&MOTION[d.id]){
   // Each species transfers weight differently while its field forms.
   const q=m.castPhase,poses={pyrojaw:[5,5,.025,1.025,.97],voltantis:[0,-10,-.06,.96,1.04],glaciolith:[0,4,-.025,1.045,.98],zephyrix:[-2,-15,-.045,1.02,1.02],terrakhan:[-2,6,.01,1.04,.96],noxshade:[7,3,.045,1.055,.96],aqualance:[10,-1,.06,1.02,1],ferrodrake:[-2,-5,-.035,1.03,1.02]},v=poses[d.id];
   c.translate(v[0]*q,v[1]*q);c.rotate(v[2]*q+(m.castVariant==='up'?-.035:m.castVariant==='down'?.025:0));c.scale(1+(v[3]-1)*q,1+(v[4]-1)*q);
  }
  if(d.rig==='gator')gator(c,d,m,p);else if(d.rig==='mantis')mantis(c,d,m,p);else if(d.rig==='yeti')yeti(c,d,m,p);else if(d.rig==='griffin')griffin(c,d,m,p);else if(d.rig==='beetle')beetle(c,d,m,p);else if(d.rig==='jackal')jackal(c,d,m,p);else if(d.rig==='shark')shark(c,d,m,p);else if(d.rig==='dragon')dragon(c,d,m,p);else if(d.rig==='deer')deer(c,d,m,p);else wingCreature(c,d,m,p,d.rig==='owl');
  signatureAnatomy(c,d,m,p);
  accents(c,d,m,p,options);
 }finally{c.restore();}
}
