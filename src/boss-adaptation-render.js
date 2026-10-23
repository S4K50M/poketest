// Read-only cues for the boss's defensive read, recovery channel and frenzy.
const TAU=Math.PI*2;
export function drawBossAdaptation(c,e,time,color='#dce5ba'){
  if(!e.boss||e.hp<=0)return;
  const heal=e.state==='heal',read=e.state==='countertell'||!!e.guarding,escape=e.state==='evade';
  if(!heal&&!read&&!escape&&!e.berserk&&!e.ward)return;
  const t=e.reducedMotion?0:time,x=e.x,y=e.y,col=heal?'#b5efcd':e.berserk?'#ffb088':color;
  c.save();
  try{
    if(e.ward){
      const front=e.face<0?Math.PI:0,total=e.ward.maxCharges||3,charges=e.ward.charges||0;
      for(let i=0;i<total;i++){
        const a=front-.92+i*1.84/Math.max(1,total-1),active=i<charges,xx=x+Math.cos(a)*91,yy=y-105+Math.sin(a)*91;
        c.save();c.translate(xx,yy);c.rotate(a);c.fillStyle=active?color+'44':'#42505b22';c.strokeStyle=active?'#f5f1cf':color+'44';c.lineWidth=active?2:1;c.beginPath();c.moveTo(-6,-24);c.lineTo(9,-30);c.lineTo(18,-10);c.lineTo(14,17);c.lineTo(0,30);c.lineTo(-9,11);c.closePath();c.fill();c.stroke();c.restore();
      }
      c.fillStyle=color;c.font='600 9px Barlow, sans-serif';c.textAlign='center';c.fillText((e.ward.name||'OATH SHIELD')+' · AERIAL / REAR / ELEMENTAL',x,y-275);
    }
    if((e.phase||1)>=4){
      for(let i=0;i<4;i++){const a=i*TAU/4+t*1.5,xx=x+Math.cos(a)*116,yy=y-115+Math.sin(a)*91;c.strokeStyle='#ffafbcaa';c.lineWidth=2;c.beginPath();c.moveTo(xx-5,yy+16);c.lineTo(xx,yy-23);c.lineTo(xx+5,yy+16);c.lineTo(xx-5,yy+16);c.stroke();}
    }
    if(e.berserk){
      c.strokeStyle='#ffb08855';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y-4,99,14,0,0,TAU);c.stroke();
      for(let i=0;i<7;i++){const a=i*TAU/7+t*.5,xx=x+Math.cos(a)*78,yy=y-90+Math.sin(a)*67;c.fillStyle='#ffc29a99';c.fillRect(xx-1,yy-2,2,4);}
    }
    if(read||escape){
      c.strokeStyle=col+'bb';c.lineWidth=3;c.beginPath();c.ellipse(x,y-90,77,105,0,e.face<0?Math.PI*.6:-Math.PI*.4,e.face<0?Math.PI*1.4:Math.PI*.4);c.stroke();
      c.setLineDash([5,7]);c.strokeStyle=col+'88';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y-5,117,18,0,0,TAU);c.stroke();c.setLineDash([]);
    }
    if(heal){
      const total=e.healChannel?.total||100,progress=Math.max(0,Math.min(1,1-(e.healChannel?.remaining??e.timer??0)/total));
      c.strokeStyle='#b5efcd44';c.lineWidth=4;c.beginPath();c.arc(x,y-125,77,0,TAU);c.stroke();c.strokeStyle='#d9ffe2';c.beginPath();c.arc(x,y-125,77,-Math.PI/2,-Math.PI/2+TAU*progress);c.stroke();
      for(let i=0;i<9;i++){const phase=(t*.7+i/9)%1,xx=x+Math.sin(i*2.4)*56,yy=y-20-phase*150;c.strokeStyle='#c9f8d9aa';c.lineWidth=1.5;c.beginPath();c.moveTo(xx-4,yy);c.lineTo(xx+4,yy);c.moveTo(xx,yy-4);c.lineTo(xx,yy+4);c.stroke();}
    }
    if(read||heal){c.font='600 10px Barlow, sans-serif';c.textAlign='center';c.fillStyle=col;c.shadowColor='#06121c';c.shadowBlur=8;c.fillText(heal?'HEAVY TO INTERRUPT':'READING YOUR RHYTHM',x,y-255);}
  }finally{c.restore();}
}
