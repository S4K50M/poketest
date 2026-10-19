import {CHAPTERS} from '../../src/world.js';
// These controllers issue the same actions as keyboard play. No teleporting,
// inventory grants, boss damage injection, or ability shortcuts.
export function walkTo(g,x,max=1800){
  for(let t=0;t<max;t++){
    const p=g.player;if(Math.abs(p.x-x)<30){g.setInputs({});if(p.grounded&&p.y===520)return true;g.step();continue;}
    g.setInputs({right:p.x<x,left:p.x>x});
    const edge=g.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x&&p.x<=b.x+b.w);
    if(p.grounded&&edge&&x>p.x&&edge.x+edge.w-p.x<95)g.input('jump');
    if(g.thorns.length&&g.abilities.has('grapple')&&!g.grapple&&t%20===0&&p.x>820&&p.x<1800)g.input('grapple');
    if(g.abilities.has('blink')&&p.x>1020&&p.x<1120)g.input('dash');
    if(g.thorns.some(h=>p.x>h.x-10&&p.x<h.x+h.w-30)&&!p.grounded&&p.vy>0&&!g.grapple)g.input('dash');
    if(p.wall&&t%10===0)g.input('jump');
    if(p.grounded&&Math.abs(p.x-980)<150&&g.roomId!=='sanctuary')g.input('jump');
    const e=g.enemies.find(e=>e.hp>0&&Math.abs(e.x-p.x)<135);if(e&&t%10===0)g.input(e.kind==='pebbleback'?'heavy':'light');
    if(t%80===0&&e){g.setInputs({});g.input('special');g.releaseSpecial();}
    g.step();
  }
  return false;
}
export function fightGuardian(g,max=7000){
  for(let t=0;t<max;t++){
    const e=g.enemies.find(e=>e.boss&&e.hp>0);if(!e)return true;
    const p=g.player,dx=e.x-p.x;g.setInputs({right:dx>60,left:dx< -60,down:!p.grounded&&Math.abs(dx)<90});
    if(t%10===0)g.input('heavy');
    if(t%65===0){g.setInputs({});g.input('special');g.releaseSpecial();}
    if(p.grounded&&e.state==='windup'&&e.timer<20)g.input('jump');
    if(p.hp<2&&g.inventory.flask)g.input('potion');
    g.step();
  }
  return false;
}
export function playCampaign(g,{chapters=6,switchParty=true,onGuardian=()=>{}}={}){
  for(let i=0;i<chapters;i++){
    const ch=CHAPTERS[i];if(switchParty)g.input('slot'+(i%3+1));
    if(!walkTo(g,1050+i*180))throw Error('Cannot reach sanctuary portal '+i);g.input('interact');
    if(g.roomId!==ch.id+'-path')throw Error('Portal did not open '+i);
    if(!walkTo(g,2370))throw Error('Cannot cross '+ch.id+' at '+g.player.x);g.input('interact');
    if(g.roomId!==ch.id+'-heart')throw Error('Guardian door did not open '+i);
    onGuardian(g);
    if(!walkTo(g,850)||!fightGuardian(g))throw Error('Guardian fight failed '+ch.boss);
    if(!walkTo(g,1780))throw Error('Guardian exit not reachable '+i);g.input('interact');
    if(g.roomId!=='sanctuary')throw Error('Cannot return the fragment '+i);
  }
  return g.snapshot();
}
export function climbTo(g,x,y,max=2500){
  // The faster motor has a lower combined jump apex than the old floaty one.
  // Route via actual ledges instead of repeatedly attempting a 300px jump
  // from the ground straight onto the grove shrine.
  const p=g.player,maxRise=g.abilities.has('wings')?270:150;
  if(p.grounded&&p.y-y>maxRise){
    const ledge=g.platforms.filter(b=>b.y>y+5&&b.y<p.y-5&&p.y-b.y<=maxRise)
      .sort((a,b)=>a.y-b.y||Math.abs(x-(a.x+a.w/2))-Math.abs(x-(b.x+b.w/2)))[0];
    if(ledge){const approach=Math.max(ledge.x+24,Math.min(x,ledge.x+ledge.w-24));if(!climbTo(g,approach,ledge.y,max))return false;}
  }
  for(let i=0;i<max;i++){
    const p=g.player;if(Math.abs(x-p.x)<13&&Math.abs(y-p.y)<5&&p.grounded){g.setInputs({});return true;}
    g.setInputs({right:p.x<x-12,left:p.x>x+12});
    if(p.grounded&&(p.y>y+5||g.platforms.some(b=>b.y===p.y&&b.x+b.w-p.x<80&&p.x<b.x+b.w)))g.input('jump');
    if(!p.grounded&&p.vy>-3&&p.y>y-40&&p.jumpCount<2)g.input('jump');
    if(p.wall&&i%12===0)g.input('jump');
    if(g.roomId==='storm-path'&&i%24===0&&p.x>850&&p.x<1550)g.input('grapple');
    if(i%15===0&&g.enemies.some(e=>e.hp>0&&Math.abs(e.x-p.x)<120))g.input('heavy');
    g.step();
  }
  return false;
}
