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
    if(p.grounded&&g.platforms.some(b=>b.solid&&!b.veil&&b.y<p.y&&b.x-p.x>0&&b.x-p.x<150))g.input('jump');
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
    const ch=CHAPTERS[i];
    // The sanctuary spring restores companions by contact; camp interaction
    // is reserved for services and never supplies a repeatable heal.
    if(!walkTo(g,200))throw Error('Cannot return to the sanctuary spring');g.step();
    if(switchParty)g.input('slot'+(i%3+1));
    if(!walkTo(g,1050+i*180))throw Error('Cannot reach sanctuary portal '+i);g.input('interact');
    if(g.roomId!==ch.id+'-path')throw Error('Portal did not open '+i);
    if(!walkTo(g,2370))throw Error('Cannot cross '+ch.id+' at '+g.player.x);g.input('interact');
    if(g.roomId===ch.id+'-descent'){
      // The main dungeon is an excavated floor route. The upper stairs are
      // optional exploration, not a compulsory sequence over a lethal abyss.
      const door=g.room.objects.find(o=>o.to===ch.id+'-nexus');
      if(!walkTo(g,door.x))throw Error('Cannot reach the grounded dungeon nexus '+i);g.input('interact');
      if(g.roomId!==ch.id+'-nexus')throw Error('Dungeon nexus did not open '+i);
      if(!walkTo(g,1700)||!fightGuardian(g))throw Error('Gate sentinel fight failed '+i);
      const heartDoor=g.room.objects.find(o=>o.to===ch.id+'-heart');
      if(!walkTo(g,heartDoor.x))throw Error('Cannot cross dungeon nexus '+i);g.input('interact');
    }
    if(g.roomId!==ch.id+'-heart')throw Error('Guardian door did not open '+i+' in '+g.roomId);
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
  let jumpFromY=p.y;
  for(let i=0;i<max;i++){
    const p=g.player;if(Math.abs(x-p.x)<13&&Math.abs(y-p.y)<5&&p.grounded){g.setInputs({});return true;}
    g.setInputs({right:p.x<x-12,left:p.x>x+12});
    const source=g.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x-12&&p.x<=b.x+b.w+12);
    const target=g.platforms.find(b=>Math.abs(b.y-y)<2&&x>=b.x&&x<=b.x+b.w);
    const gap=target?(p.x<x?target.x-p.x:p.x-target.x-target.w):Math.abs(x-p.x);
    const edge=source&&(p.x<x?source.x+source.w-p.x:p.x-source.x);
    if(p.grounded&&(p.y>y+5&&(gap<120||edge<35)||edge<60&&Math.abs(x-p.x)>45)){jumpFromY=p.y;g.input('jump');}
    // Use a second jump only when the desired rise needs it or the first
    // jump fell short. Firing it on every 125px hop overshoots the new catch
    // terraces and can leave the controller above its intended doorway.
    if(!p.grounded&&p.vy>-3&&p.y>y-40&&p.jumpCount<2&&(jumpFromY-y>150||p.y>y+25&&p.vy>0))g.input('jump');
    if(p.wall&&i%12===0)g.input('jump');
    if(g.roomId==='storm-path'&&i%24===0&&p.x>850&&p.x<1550)g.input('grapple');
    const projectile=g.enemyShots.find(s=>Math.abs(s.x-p.x)<100&&Math.abs(s.y-(p.y-g.data.bodyHeight*.5))<65&&((s.x-p.x)*s.vx<0||Math.abs(s.x-p.x)<35));
    if(projectile){g.setInputs({left:projectile.vx>0,right:projectile.vx<0});g.input('shield');}
    else{
      g.releaseShield();
      const foe=g.enemies.find(e=>e.hp>0&&Math.abs(e.x-p.x)<140&&Math.abs(e.y-p.y)<125);
      if(foe&&!p.attack)g.input(foe.kind==='pebbleback'?'heavy':'light');
      if(foe&&g.combat?.remaining('light')>6&&!p.attack)g.input('heavy');
    }
    g.step();
  }
  return false;
}
