// Encounter geometry is drawn from the same transient records used by combat.
// These functions never advance timers, move an actor, or mutate an arena.
const TAU=Math.PI*2;
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,finite(v)));
const alpha=(color,a)=>{const raw=String(color||'#f8d69a').replace('#','').slice(0,6),hex=raw.length===3?raw.split('').map(x=>x+x).join(''):raw;return /^[0-9a-f]{6}$/i.test(hex)?`rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${clamp(a)})`:`rgba(248,214,154,${clamp(a)})`;};
function line(c,points,col,w=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();}
function poly(c,points,col,edge,w=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
function oval(c,x,y,rx,ry,col,edge,w=1){c.beginPath();c.ellipse(x,y,Math.max(.05,rx),Math.max(.05,ry),0,0,TAU);if(col){c.fillStyle=col;c.fill();}if(edge){c.strokeStyle=edge;c.lineWidth=w;c.stroke();}}
function text(c,value,x,y,col,size=10){c.fillStyle=col;c.font=`600 ${size}px Barlow, sans-serif`;c.textAlign='center';c.fillText(String(value),x,y);}
function diamond(c,x,y,r,col){poly(c,[[x,y-r],[x+r*.6,y],[x,y+r],[x-r*.6,y]],col);}
function corners(c,x,y,w,h,col,amount=10){const xx=x-w/2,yy=y-h/2,l=Math.min(amount,w*.25,h*.4);for(const sx of[-1,1])for(const sy of[-1,1]){const a=x+sx*w/2,b=y+sy*h/2;line(c,[[a-sx*l,b],[a,b],[a,b-sy*l]],col,1.6);}}
function hatch(c,x,y,w,h,col){const left=x-w/2,top=y-h/2;c.save();c.beginPath();c.rect(left,top,w,h);c.clip();for(let i=-h;i<w;i+=28)line(c,[[left+i,top+h],[left+i+h,top]],col,.8);c.restore();}
const isLethal=h=>h.damage==='lethal'||h.lethal;
function zone(c,h,time,{preview=false,reducedMotion=false}={}){
 const x=finite(h.x),y=finite(h.y),w=Math.max(4,finite(h.w,120)),height=Math.max(4,finite(h.h,70)),shape=h.shape||'blast';
 const warning=preview||finite(h.delay)>0,progress=preview?.1:warning?1-clamp(finite(h.delay)/Math.max(1,finite(h.maxDelay,h.delay))):1-clamp(finite(h.life)/Math.max(1,finite(h.maxLife,h.life)));
 const color=isLethal(h)?'#ff6f82':h.color||'#f6cc8d',motion=reducedMotion?0:time,pulse=reducedMotion?.65:.6+Math.sin(motion*10)*.18;
 const opacity=preview?.45:warning?.64+progress*.3:1;
 c.save();c.globalAlpha*=opacity;
 try{
  c.strokeStyle=alpha(color,warning?.8:.95);c.fillStyle=alpha(color,warning?.055+progress*.045:.16);c.lineWidth=warning?1.3:2;
  if(warning)c.setLineDash(preview?[3,9]:[7,5]);
  if(shape==='blast'||shape==='ring'){
   const rx=w/2,ry=height/2,inner=Math.max(0,Math.min(rx-2,finite(h.inner)));
   // A hollow ring has a real safe center. Keep it unfilled in the artwork.
   c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.clip();
   c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
   if(shape==='ring'&&inner>0)c.ellipse(x,y,inner,inner,0,0,TAU,true);
   c.fill('evenodd');c.stroke();c.restore();c.setLineDash([]);
   if(warning){oval(c,x,y,Math.max(2,rx*(1-progress*.7)),Math.max(2,ry*(1-progress*.7)),null,alpha(color,.35),.8);}
   else{oval(c,x,y,Math.max(2,rx*(.86+progress*.1)),Math.max(2,ry*(.86+progress*.1)),null,alpha('#fff6d9',.5*(1-progress)),1.3);for(let i=0;i<12;i++){const a=i*TAU/12+motion*.12,r=1-progress*.12;line(c,[[x+Math.cos(a)*rx*.8*r,y+Math.sin(a)*ry*.8*r],[x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r]],alpha(color,.6),1.2);}}
   if(shape==='ring'&&inner>0){oval(c,x,y,inner,inner,alpha('#bcebc5',.04),'#bcebc599',1.3);if(warning)text(c,'SAFE CENTER',x,y+3,'#d3f3d2',8);}
  }else{
   c.fillRect(x-w/2,y-height/2,w,height);c.strokeRect(x-w/2,y-height/2,w,height);c.setLineDash([]);
   corners(c,x,y,w,height,alpha(color,.95));
   if(warning)hatch(c,x,y,w,height,alpha(color,.12));
   if(shape==='beam'){
    const vertical=height>w;
    const beamCore=warning?.75:Math.max(1,(vertical?w:height)*.22);
    line(c,vertical?[[x,y-height/2],[x,y+height/2]]:[[x-w/2,y],[x+w/2,y]],alpha(warning?color:'#fff5d2',warning?.8:.93),beamCore);
    if(!warning)for(const side of[-1,1]){
     const offset=(vertical?w:height)*(.24+Math.sin(motion*17)*.03*(reducedMotion?0:1));
     line(c,vertical?[[x+side*offset,y-height/2],[x+side*offset,y+height/2]]:[[x-w/2,y+side*offset],[x+w/2,y+side*offset]],alpha(color,.75),1.5);
    }
   }else if(shape==='slash'){
    // The sword's wake stays within the actual rectangular contact area.
    c.save();c.beginPath();c.rect(x-w/2,y-height/2,w,height);c.clip();c.strokeStyle=alpha(warning?color:'#fff1d0',warning?.5:.9);c.lineWidth=warning?1.4:Math.max(3,height*.09);c.beginPath();c.moveTo(x-w*.48,y+height*.4);c.bezierCurveTo(x-w*.15,y-height*.55,x+w*.25,y-height*.45,x+w*.48,y-height*.35);c.stroke();c.restore();
   }else if(shape==='pillar'){
    for(let i=0;i<Math.min(7,Math.ceil(w/18));i++){
     const xx=x-w*.42+i*w/Math.max(1,Math.ceil(w/18)-1)*.84,peak=y-height*.46+(i%3)*5;
     if(!warning)poly(c,[[xx-7,y+height*.48],[xx-5,peak+15],[xx,peak],[xx+7,peak+17],[xx+10,y+height*.48]],alpha(color,.5),alpha('#f6f4d8',.55),.8);
     else line(c,[[xx,y+height*.45],[xx,peak]],alpha(color,.2),.8);
    }
   }else if(shape==='floor'){
    for(let i=0;i<Math.min(18,Math.floor(w/26));i++){const xx=x-w/2+17+i*26;diamond(c,xx,y,warning?3:5,alpha(color,warning?.65:.9));line(c,[[xx-7,y+height*.34],[xx+7,y+height*.34]],alpha(color,.4),.8);}
    if(!warning)for(let i=0;i<Math.min(16,Math.floor(w/30));i++){const xx=x-w/2+15+i*30;line(c,[[xx,y+height*.4],[xx+5,y-height*.35]],alpha('#fff3ce',.65),1.6);}
   }
  }
  if(shape==='mine'){
   oval(c,x,y,Math.min(w,height)*.28,Math.min(w,height)*.28,alpha(color,warning?.15:.55),alpha(color,.8),1.5);
   for(let i=0;i<6;i++){const a=i*TAU/6+motion*.15;diamond(c,x+Math.cos(a)*w*.36,y+Math.sin(a)*height*.36,warning?2.5:4,alpha(color,.85));}
   if(warning){line(c,[[x,y-5],[x,y+3]],'#ffe6bc',1.8);oval(c,x,y+7,1.3,1.3,'#ffe6bc');}
  }
  if(!preview&&warning){
   const label=isLethal(h)?'EXECUTION · '+(h.hint||'LEAVE THE RED LANE'):h.label||'';
   if(label)text(c,label.toUpperCase().slice(0,64),x,y-height/2-12,isLethal(h)?'#ffadbb':alpha('#f7e6bc',.9),isLethal(h)?10:8);
   if(isLethal(h)){diamond(c,x-w/2+8,y-height/2-10,4,'#ff7f94');diamond(c,x+w/2-8,y-height/2-10,4,'#ff7f94');}
  }
 }finally{c.restore();}
}
function force(c,h,time,reducedMotion){
 const x=finite(h.x),y=finite(h.y),r=Math.max(1,finite(h.radius,220)),col=h.color||'#bceee1',clock=reducedMotion?0:time;
 c.save();
 try{
  oval(c,x,y,r,r,null,alpha(col,.15),1);oval(c,x,y,r*.4,r*.4,null,alpha(col,.3),1.3);
  for(let i=0;i<8;i++){const a=i*TAU/8+clock*.7,p=reducedMotion?.55:(clock*.5+i/8)%1,rr=r*(1-p*.8),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr;line(c,[[xx+Math.cos(a)*15,yy+Math.sin(a)*15],[xx,yy],[xx+Math.cos(a+.6)*7,yy+Math.sin(a+.6)*7]],alpha(col,.3+p*.3),1.2);}
  diamond(c,x,y,5,alpha(col,.5));
 }finally{c.restore();}
}
/** Draw every warned and active boss area, from its actual collision record. */
export function drawBossEncounterWorld(c,g,time=0){
 const reduced=!!g?.combat?.settings?.reducedMotion,t=finite(time);
 for(const h of g?.bossHazards||[]){if(h.type==='force')force(c,h,t,reduced);else zone(c,h,t,{reducedMotion:reduced});}
}
/** New move cues replace the old shared rush/volley/sigil/slam marker. */
export function drawBossMoveTelegraph(c,e,time=0){
 if(!e?.moveId)return false;
 if(e.hp<=0||e.state!=='windup'||!e.telegraph)return true;
 const cue=e.telegraph,x=finite(e.x),y=finite(e.baseY,e.y),tx=finite(cue.targetX,x),ty=finite(cue.targetY,y),wind=clamp(1-finite(e.timer)/Math.max(1,finite(e.windupFrames,46))),reduced=!!e.reducedMotion,t=reduced?0:finite(time);
 const col=cue.lethal?'#ff7d95':e.phase>=3?'#ffc0a0':'#f6d295';
 c.save();
 try{
  const previews=cue.events||cue.preview||[];
  for(const h of previews.filter(h=>h.type==='zone'&&finite(h.at)<50).slice(0,8))zone(c,{...h,color:h.color||col},t,{preview:true,reducedMotion:reduced});
  const kind=String(e.attackKind||cue.kind||'');
  if(/dash|charge|rush|lunge|stampede|dive|leap|pounce|jump/.test(kind)||['jump','dodge','behind'].includes(e.counter)){
   const height=/leap|dive|jump|pounce/.test(kind)?130:0;c.setLineDash([7,7]);c.strokeStyle=alpha(col,.55);c.lineWidth=1.3;c.beginPath();c.moveTo(x,y-12);c.quadraticCurveTo((x+tx)/2,Math.min(y,ty)-height,tx,ty-12);c.stroke();c.setLineDash([]);
   oval(c,tx,ty-3,35+wind*8,8,null,alpha(col,.6),1.2);
  }else if(e.counter==='shield'){
   c.setLineDash([4,7]);line(c,[[x,y-112],[tx,ty-38]],alpha(col,.5),1);c.setLineDash([]);diamond(c,tx,ty-38,10,col);
  }
  // The clock is an anticipation cue, never an extra unmarked damage shape.
  c.strokeStyle=alpha(col,.8);c.lineWidth=2;c.beginPath();c.arc(x,y-272,11,-Math.PI/2,-Math.PI/2+TAU*wind);c.stroke();
  if(wind>.8)diamond(c,x,y-272,3,col);
  const name=String(e.moveName||cue.name||'').toUpperCase();
  if(name)text(c,name,x,y-293,'#f7eacb',10);
  const hint=String(e.hint||cue.hint||'');if(hint)text(c,hint,x,y-309,alpha('#dcdfcd',.86),8);
 }finally{c.restore();}
 return true;
}
/** Temporary raised terrain is real one-way geometry, anchored at p.x/p.y. */
export function drawBossPlatform(c,p,time=0){
 if(!p?.bossOwner)return false;
 const x=finite(p.x),y=finite(p.y),w=Math.max(1,finite(p.w,120)),h=Math.max(8,finite(p.h,18)),style=p.style||'stone';
 const colors={root:['#526d4d','#c5e7a4'],ice:['#63899e','#d9fbff'],stone:['#6f7471','#e4dbb6'],memory:['#5c557b','#ede0ff'],metal:['#665557','#f2c798'],water:['#3f7283','#b6f8ed']},[dark,light]=colors[style]||colors.stone;
 c.save();
 try{
  c.fillStyle=dark;c.fillRect(x,y,w,h);c.fillStyle=alpha('#061522',.4);c.fillRect(x,y+h*.5,w,h*.5);line(c,[[x,y],[x+w,y]],light,2.5);line(c,[[x+4,y+4],[x+w-4,y+4]],alpha(light,.4),.8);
  if(style==='ice')for(let i=0;i<w/21;i++){const xx=x+9+i*21;poly(c,[[xx-8,y+h],[xx,y+h+13+i%3*5],[xx+9,y+h]],alpha(light,.5),alpha(light,.7),.7);}
  else if(style==='root')for(let i=0;i<w/25;i++){const xx=x+12+i*25;c.beginPath();c.moveTo(xx,y+h);c.bezierCurveTo(xx-13,y+h+17,xx+15,y+h+18,xx+6,y+h+28);c.strokeStyle=dark;c.lineWidth=5;c.stroke();line(c,[[xx-5,y+6],[xx+7,y+12]],alpha(light,.28),1);}
  else if(style==='metal')for(let i=0;i<w/27;i++){const xx=x+9+i*27;oval(c,xx,y+9,2,2,light);line(c,[[xx+7,y+2],[xx+7,y+h-2]],alpha(light,.3),1);}
  else if(style==='memory')for(let i=0;i<w/23;i++){const xx=x+9+i*23;poly(c,[[xx-6,y+h],[xx+7,y+h],[xx+9,y+h+14],[xx-5,y+h+11]],alpha(light,.35));line(c,[[xx-2,y+7],[xx+5,y+7]],light,.8);}
  else if(style==='water'){for(let i=0;i<w/25;i++){const xx=x+13+i*25;oval(c,xx,y+12,8,3,null,alpha(light,.5),1);oval(c,xx+3,y+h+9,2,3,alpha(light,.3));}}
  else for(let i=0;i<w/32;i++)line(c,[[x+12+i*32,y+5],[x+17+i*32,y+h]],alpha(light,.35),1);
  const remaining=finite(p.tempLife,p.life||500);if(remaining<75){line(c,[[x+3,y-5],[x+w-3,y-5]],'#ffd6a7',1);text(c,'FADING',x+w/2,y-11,'#ffe3ba',8);}
 }finally{c.restore();}
 return true;
}
/** Boss projectiles keep their own material silhouette instead of generic dots. */
export function drawBossProjectile(c,shot,time=0){
 if(!shot?.bossOwner)return false;
 const x=finite(shot.x),y=finite(shot.y),r=Math.max(3,finite(shot.radius,7)),col=shot.color||'#f9d39d',angle=Math.atan2(finite(shot.vy),finite(shot.vx,1));
 c.save();
 try{c.translate(x,y);c.rotate(angle);
  if(shot.kind==='blade'||shot.kind==='needle'){poly(c,[[-r*2,0],[r*1.6,-r*.45],[r*2.4,0],[r*1.6,r*.45]],alpha(col,.8),'#fff0d0',.8);line(c,[[-r*3,0],[-r*1.6,0]],alpha(col,.4),1.5);}
  else if(shot.kind==='droplet'){c.beginPath();c.moveTo(r*1.6,0);c.quadraticCurveTo(-r*.7,-r*1.3,-r,0);c.quadraticCurveTo(-r*.7,r*1.3,r*1.6,0);c.fillStyle=alpha(col,.75);c.fill();c.strokeStyle=alpha('#e7fff4',.8);c.lineWidth=.9;c.stroke();}
  else{oval(c,0,0,r,r,alpha(col,.5),alpha(col,.9),1.3);diamond(c,0,0,r*.65,'#fff0d1');line(c,[[-r*2.4,0],[-r*1.2,0]],alpha(col,.4),2);}
 }finally{c.restore();}
 return true;
}

/** Physical weapons follow the committed action clock, including hitstop. */
export function drawBossWeapon(c,e,time=0){
 if(!e?.moveId||e.hp<=0||!['windup','attack','charge','leap','recover'].includes(e.state))return;
 const kind=e.attackKind||'',id=e.boss||'',weapon=/axe|hammer|sword|cleaver|spear|guillotine|headsman/.test(kind)||['crown','moss-warden','forge-warden','frost-warden','storm-warden','rift-reaver'].includes(id);
 const wind=e.state==='windup',progress=wind?clamp(1-e.timer/Math.max(1,e.windupFrames)):clamp((e.attackFrame||0)/Math.max(1,e.moveDuration)),face=e.face||1,color=({crown:'#ffd0df','moss-warden':'#c9e7a2','forge-warden':'#ffd4a0','frost-warden':'#d5f8ff','storm-warden':'#ead9ff','rift-reaver':'#f4b6dd'})[id]||'#e4e7ce';
 c.save();
 try{
  c.translate(e.x,e.y);c.scale(face,1);
  if(weapon){
   const axe=/axe/.test(kind)||id==='moss-warden',hammer=/hammer/.test(kind)||id==='forge-warden',spear=/spear/.test(kind)||id==='storm-warden';
   const swing=wind?-.7-progress*.7:e.state==='recover'?.35:-1.4+Math.sin(Math.min(1,progress*2.7)*Math.PI*.78)*2.4;
   c.translate(35,-135);c.rotate(swing);line(c,[[0,26],[0,-110]],'#131f2d',12);line(c,[[0,22],[0,-110]],'#8c9e93',6);
   if(hammer){poly(c,[[-36,-137],[38,-137],[45,-82],[-42,-82]],'#65585b',color,2);line(c,[[-28,-129],[29,-129]],color,2);diamond(c,0,-108,13,color);}
   else if(axe){poly(c,[[-8,-158],[49,-146],[72,-101],[21,-76],[-7,-100],[-26,-80],[-42,-109],[-25,-143]],'#587363',color,2);line(c,[[45,-137],[60,-105],[22,-86]],color,3);}
   else if(spear){poly(c,[[0,-188],[18,-143],[7,-126],[-7,-126],[-18,-143]],'#827397',color,2);line(c,[[0,-177],[0,-117]],color,1.5);}
   else{poly(c,[[-11,-21],[-18,-150],[0,-194],[19,-150],[12,-21]],id==='frost-warden'?'#80a8bc':'#8d6d91',color,2.2);line(c,[[0,-179],[0,-35]],'#f7e8d8',1.7);line(c,[[-28,-20],[26,-20]],color,6);diamond(c,0,20,8,color);}
  }else if(wind){
   const radius=17+progress*15;c.globalAlpha*=.5+progress*.3;oval(c,0,-120,radius,radius,null,color,1.4);for(let i=0;i<4;i++){const a=i*TAU/4+(e.reducedMotion?0:time)*.5;diamond(c,Math.cos(a)*radius,-120+Math.sin(a)*radius,3,color);}
  }
 }finally{c.restore();}
}
