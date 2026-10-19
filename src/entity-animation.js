// Shared action animation surrounds the anatomical drawings without changing AI
// state. The callbacks continue to draw in absolute world coordinates.
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const seed=value=>String(value??0).split('').reduce((n,s)=>(n*31+s.charCodeAt(0))%997,7);
const ownRig=e=>['palimpsest','belltwin','nullheart'].includes(e.boss)||['candlewraith','clockscarab','oathbound','hushling'].includes(e.kind);
function alpha(color,opacity){
  const hex=typeof color==='string'?color.replace('#',''):'';
  const full=hex.length===3?hex.split('').map(n=>n+n).join(''):hex.slice(0,6);
  return /^[\da-f]{6}$/i.test(full)?`rgba(${parseInt(full.slice(0,2),16)},${parseInt(full.slice(2,4),16)},${parseInt(full.slice(4,6),16)},${clamp(opacity)})`:`rgba(221,211,182,${clamp(opacity)})`;
}
function line(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function oval(c,x,y,rx,ry,color,stroke,width=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function poly(c,points,color,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function glow(c,x,y,r,color,power=.2){const grad=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));grad.addColorStop(0,alpha(color,power));grad.addColorStop(1,alpha(color,0));oval(c,x,y,r,r,grad);}
function diamond(c,x,y,size,color){poly(c,[[x,y-size],[x+size*.5,y],[x,y+size],[x-size*.5,y]],color);}

export function drawEntityAnimated(c,e,time,draw){
  if(typeof draw!=='function')return;
  if(!e){draw();return;}
  const t=finite(time),x=finite(e.x),y=finite(e.y),face=e.face===-1?-1:1;
  const existing=ownRig(e),strength=existing?.42:1,boss=!!e.boss;
  const moving=['patrol','chase','charge','attack'].includes(e.state),wind=e.state==='windup';
  const hurt=clamp(finite(e.recoil)/12),recoilDir=Math.sign(e.recoilDir)||-face;
  const stunned=e.stun>0||e.state==='stagger',dead=e.hp<=0&&e.deathTimer>0;
  const death=dead?clamp(1-finite(e.deathTimer,32)/32):0;
  const anticipation=wind?clamp(1-finite(e.timer,32)/(boss?(e.phase>=2?26:38):32)):0;
  const motion=e.reducedMotion?0:1,phase=seed(e.id||e.kind||e.boss);
  c.save();
  try{
    c.translate(x,y);
    const stride=moving?Math.sin(t*(boss?8:12)+phase):0;
    c.translate(recoilDir*hurt*(boss?8:6)*strength,
      (Math.sin(t*2.9+phase)*.65-Math.abs(stride)*(boss?1.2:1.8))*strength*motion);
    if(wind){c.translate(-face*anticipation*(boss?7:4)*strength,anticipation*3*strength);c.rotate(-face*anticipation*.025*strength);}
    if(e.state==='charge'){c.rotate(face*.045*strength);c.scale(1+.065*strength,1-.035*strength);}
    if(e.state==='recover'){const squash=clamp(finite(e.timer)/55)*.025*strength;c.scale(1+squash,1-squash);}
    if(hurt){c.rotate(recoilDir*hurt*.055*strength);c.scale(1+hurt*.045*strength,1-hurt*.025*strength);}
    if(stunned&&!hurt&&!e.frozen)c.rotate(Math.sin(t*13+phase)*.012*strength*motion);
    if(e.juggle>0){const stretch=clamp(Math.abs(finite(e.launchVy))/14)*.09;c.scale(1-stretch*.5,1+stretch);c.rotate(face*Math.sin(t*8)*.035*motion);}
    if(dead){
      c.globalAlpha*=Math.max(0,1-death)**(existing?.15:.65);
      c.translate(recoilDir*death*7*strength,death*death*(boss?24:16)*strength);
      c.scale(1+death*.2*strength,Math.max(.1,1-death*.48*strength));
      c.rotate(recoilDir*death*.12*strength);
    }
    c.translate(-x,-y);draw();
    if(e.frozen>0){
      const radius=boss?66:26,cy=y-(boss?95:28);
      c.globalAlpha*=.65;const points=[];
      for(let i=0;i<6;i++){const a=-Math.PI/2+i*TAU/6;points.push([x+Math.cos(a)*radius,cy+Math.sin(a)*radius*1.1]);}
      poly(c,points,'#bdefff12','#d1f6ff99',1.3);
      for(let i=0;i<3;i++){const a=i*Math.PI/3;line(c,[[x-Math.cos(a)*radius*.8,cy-Math.sin(a)*radius*.8],[x+Math.cos(a)*radius*.8,cy+Math.sin(a)*radius*.8]],'#dcfaff55',.8);}
    }
  }finally{c.restore();}
}

// Ground glyphs are deliberately shallow: they communicate a windup without
// obscuring platforms, projectiles or the defender's feet.
export function drawBossAura(c,e,time,color='#e9c7ab'){
  if(!e?.boss||e.hp<=0)return;
  const t=finite(time),x=finite(e.x),y=finite(e.baseY,finite(e.y));
  const wind=e.state==='windup',rage=e.phase>=2,enrage=e.state==='enrage';
  const active=e.introduced!==false&&e.state!=='sealed';
  const anticipation=wind?clamp(1-finite(e.timer,32)/(rage?26:38)):0;
  const pulse=(Math.sin(t*3)+1)/2,staggered=e.stun>20&&e.state==='recover';
  c.save();
  try{
    if(rage||wind||enrage){
      oval(c,x,y-1,95+anticipation*42,12+anticipation*5,alpha(color,wind?.06+anticipation*.045:.025+enrage*.07));
      oval(c,x,y-1,90+anticipation*38,12+anticipation*4,null,alpha(color,wind?.35+anticipation*.45:.1+pulse*.1),wind?1.7:1);
      oval(c,x,y-1,75+anticipation*25,9+anticipation*3,null,alpha(color,.13+(wind?.18:0)),.8);
      const count=wind?12:8;
      for(let i=0;i<count;i++){
        const a=i*TAU/count+t*(wind?.38:.1),xx=x+Math.cos(a)*(91+anticipation*38),yy=y-1+Math.sin(a)*(12+anticipation*4);
        const size=wind?2.5+anticipation*2:1.6;
        diamond(c,xx,yy,size,alpha(color,wind?.65:.3+pulse*.15));
      }
    }
    if(wind&&active){
      const linear=e.move===0||(e.move==null&&finite(e.pattern)%3===0),face=e.face===-1?-1:1;
      if(linear)for(let i=0;i<4;i++){
        const xx=x+face*(95+i*43),opacity=(.15+anticipation*.6)*(1-i*.18);
        line(c,[[xx-face*9,y-7],[xx+face*2,y-2],[xx-face*9,y+3]],alpha(color,opacity),1.5);
      }
      const center=y-95;
      glow(c,x,center,70+anticipation*20,color,.055+anticipation*.1);
      for(let i=0;i<8;i++){
        const phase=(t*.75+i/8)%1,a=i*TAU/8+t*.4,radius=86*(1-phase)+16;
        const xx=x+Math.cos(a)*radius,yy=center+Math.sin(a)*radius*.7;
        line(c,[[xx+Math.cos(a)*5,yy+Math.sin(a)*3],[xx,yy]],alpha(color,phase*.65),1.2);
        diamond(c,xx,yy,1+phase*2,alpha(color,phase*.7));
      }
      // The shrinking diamond is the final attack cue, separate from body sway.
      const rr=12+(1-anticipation)*10;
      poly(c,[[x,y-268-rr],[x+rr*.7,y-268],[x,y-268+rr],[x-rr*.7,y-268]],alpha(color,.025),alpha(color,.55+anticipation*.4),1.2);
      if(anticipation>.72)diamond(c,x,y-268,3+anticipation*2,'#fff1cf');
    }
    if(enrage){
      for(let i=0;i<10;i++){
        const phase=(t*.8+i/10)%1,xx=x+Math.sin(i*4.9)*65,yy=y-phase*200;
        line(c,[[xx,yy+10],[xx+Math.sin(i)*5,yy]],alpha(color,(1-phase)*.5),1.5);
      }
      glow(c,x,y-90,150,color,.12+pulse*.08);
    }
    if(active&&(e.poise>0||staggered)){
      const ratio=clamp(finite(e.poise)/100),yy=y-295,bar=82;
      c.fillStyle='#09121edb';c.fillRect(x-bar/2-2,yy-2,bar+4,8);
      c.fillStyle=alpha(staggered?'#fff4ca':color,.85);c.fillRect(x-bar/2,yy,bar*(staggered?1:ratio),4);
      for(let i=1;i<4;i++){c.fillStyle='#081222bb';c.fillRect(x-bar/2+bar*i/4,yy,1,4);}
      line(c,[[x-bar/2,yy+7],[x+bar/2,yy+7]],alpha(color,.2),.7);
      if(staggered){
        c.fillStyle='#fff0bb';c.font='600 8px Barlow, sans-serif';c.textAlign='center';c.fillText(e.stun>35?'POSTURE BROKEN':'STAGGERED',x,yy-6);
        for(let i=0;i<3;i++){const a=t*2.4+i*TAU/3;diamond(c,x+Math.cos(a)*28,y-240+Math.sin(a)*6,2.5,'#ffe5ad');}
      }
    }
  }finally{c.restore();}
}

export function drawNPCAnimation(c,o,g,time,draw){
  if(typeof draw!=='function')return;
  if(!o||!['npc','merchant'].includes(o.kind)){draw();return;}
  const t=finite(time),x=finite(o.x),y=finite(o.y,520),p=g?.player||{};
  const distance=Math.hypot(finite(p.x,-9999)-x,finite(p.y,-9999)-y),near=distance<150;
  const facing=finite(p.x,x)>=x?1:-1,s=seed(o.id||o.talk),motion=g?.combat?.settings?.reducedMotion?0:1;
  const talking=near&&(o.speaking||g?.paused||g?.activeNPC===o.id),original=['vell','mender','archivist'].includes(o.talk);
  c.save();
  try{
    const breath=Math.sin(t*2.5+s)*.7*motion;
    c.translate(x,y);c.rotate((Math.sin(t*1.8+s)*.003+(near?facing*.004:0))*motion);c.scale(1,1+Math.sin(t*2.5+s)*.003*motion);c.translate(-x,-y+breath);
    draw();
    if(original){
      // Eye placement follows the player without mirroring a name or a book.
      oval(c,x+facing*5,y-79,1.6,2.2,'#314446');
      const bookX=x+facing*17,bookY=y-42+Math.sin(t*2.5+s)*1.5*motion;
      const openness=near?1:.72,flip=(Math.sin(t*(talking?6:1.4)+s)+1)/2;
      glow(c,bookX,bookY,28,'#ffe6b3',talking?.18:.07);
      poly(c,[[bookX,bookY],[bookX-18*openness,bookY-8],[bookX-19*openness,bookY+5],[bookX,bookY+11]],'#d4c49b','#887e68',.7);
      poly(c,[[bookX,bookY],[bookX+18*openness,bookY-8],[bookX+19*openness,bookY+5],[bookX,bookY+11]],'#eee0b7','#a79776',.7);
      for(const side of [-1,1])for(let i=0;i<3;i++)line(c,[[bookX+side*4,bookY+2+i*2],[bookX+side*14*openness,bookY-3+i*2]],'#938c6a99',.65);
      poly(c,[[bookX,bookY+1],[bookX+(flip-.5)*24*openness,bookY-12],[bookX+(flip-.5)*25*openness,bookY+1],[bookX,bookY+10]],'#fff3cb99');
      if(talking)for(let i=0;i<3;i++){const phase=(t*.55+i/3)%1;diamond(c,bookX+Math.sin(i*3+phase*4)*13,bookY-phase*35,1.5,alpha('#ffe9ac',(1-phase)*.7));}
    }
    if(near){
      // A small eye-line glimmer gives the interaction a visible response.
      const col=o.talk==='morrow'?'#b4eee0':o.talk==='pip'?'#e5ccff':'#f5e6b4';
      glow(c,x+facing*12,y-(original?78:49),20,col,talking?.08:.025);
    }
  }finally{c.restore();}
}
