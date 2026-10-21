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
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const endangered=(h,p)=>{
  const hw=(h.w||0)/2+18,hh=(h.h||0)/2,cy=p.y-36;
  if(h.shape==='ring'&&Math.hypot(p.x-h.x,cy-h.y)+39<(h.inner||0))return false;
  return Math.abs(p.x-h.x)<hw&&p.y>h.y-hh&&p.y-72<h.y+hh;
};
/** Read only visible tells and warned areas, then issue ordinary player inputs.
 * Shared by simulation and Chromium routes so victories cannot rely on a
 * hidden damage setter or a controller that ignores the game's new defense. */
export function guardianPlan(g){
  const p=g.player,e=g.enemies.find(e=>e.boss&&e.hp>0);
  if(!e)return {inputs:{},actions:[],shield:false,jump:false,heal:false};
  const dx=e.x-p.x,dist=Math.abs(dx),side=Math.sign(dx)||p.face||1,actions=[];
  let target=e.x-side*76,jump=false,shield=false,danger=false,heal=false;
  const windup=e.state==='windup',committed=['attack','charge','leap'].includes(e.state),counter=e.counter;
  if(windup&&counter==='behind')target=e.x+side*115;
  if((windup||committed)&&counter==='retreat')target=e.x-side*340;
  if((windup||committed)&&counter==='get-close')target=e.x-side*40;
  if(['countertell','evade','enrage'].includes(e.state)){target=e.x-side*210;danger=true;}
  if(windup&&e.timer<=9&&['dodge','behind'].includes(counter)&&dist<190){jump=p.grounded;danger=true;if(!p.dash)actions.push('dash');}
  const hazards=(g.bossHazards||[]).filter(h=>h.type!=='force'&&h.life>0&&h.delay<=17&&endangered(h,p)).sort((a,b)=>a.delay-b.delay);
  const h=hazards[0];
  if(h){
    danger=true;
    const low=(h.h||0)<105&&h.y>(e.baseY??520)-85;
    if(low&&['beam','floor'].includes(h.shape)){
      if(p.grounded&&h.delay<=15)jump=true;
      target=p.x;
    }else if(h.shape==='ring'&&h.inner>65&&Math.abs(p.x-h.x)<h.inner+100){target=h.x;}
    else{
      const margin=(h.w||120)/2+72,targetSide=Math.sign(p.x-h.x)||-side;
      target=h.x+targetSide*margin;
      if(h.delay<10&&Math.abs(target-p.x)>80&&!p.dash)actions.push('dash');
    }
    if(!h.unblockable&&!h.lethal&&h.damage!=='lethal'&&h.delay<7)shield=true;
  }
  if(committed&&dist<115&&['charge','leap'].includes(e.state)){danger=true;jump=p.grounded;if(!p.dash)actions.push('dash');}
  if((windup&&counter==='shield'&&e.timer<10)||(committed&&counter==='shield')){danger=true;shield=true;}
  const floor=520;
  if((windup||committed)&&counter==='platform'&&p.grounded&&p.y===floor&&dist<350&&e.timer<20)jump=true;
  if(p.hp<=Math.min(3,p.maxHp-3)&&g.inventory.flask)actions.push('potion');
  if(p.hp<=1.5&&!g.inventory.flask){const members=g.party||[],slot=members.findIndex((m,i)=>i!==g.activeSlot&&m.hp>p.hp+1);if(slot>=0)actions.push('slot'+(slot+1));}
  if(e.state==='heal')target=e.x-side*65;
  const needsFocusHeal=!g.inventory.flask&&p.spirit>=40&&p.hp<=p.maxHp*.6;
  if(needsFocusHeal&&!danger&&e.state!=='heal'){
    target=e.x-side*460;
    if(dist>350&&p.grounded&&!committed){target=p.x;heal=true;}
  }
  const inputs={right:p.x<target-14,left:p.x>target+14,down:!p.grounded&&dist<100};
  // A two-light confirm into a heavy finisher changes the pressure read. Attack
  // only while in range, and use committed recovery/heal as the best opening.
  const opening=['recover','heal','patrol'].includes(e.state)||windup&&e.timer>22;
  if(!heal&&!danger&&opening&&dist<150&&!p.attack){
    const chain=g.combat?.chain??0,heavyWait=typeof g.combat?.remaining==='function'?g.combat.remaining('heavy'):g.combat?.actions?.heavy?.remaining||0;
    actions.push(e.state==='heal'||chain>=2&&!heavyWait?'heavy':'light');
    if(e.state==='recover'&&dist<125&&(g.tick||0)%110<5)actions.push('special');
  }else if(!heal&&!danger&&dist>190&&dist<520&&(g.tick||0)%160<3)actions.push('power');
  if((g.surge||0)>=100&&!danger&&dist<300)actions.push('surge');
  return {inputs,actions:[...new Set(actions)],shield,jump,heal};
}
export function fightGuardian(g,max=16000){
  for(let t=0;t<max;t++){
    if(g.phase!=='playing')return false;
    if(!g.enemies.some(e=>e.boss&&e.hp>0)){g.setInputs({});g.releaseShield();g.releaseJump();return true;}
    const plan=guardianPlan(g);g.setInputs(plan.inputs);
    if(plan.heal)g.input('heal');else g.releaseHeal();
    if(plan.jump)g.input('jump');else if(g.player.vy>=0)g.releaseJump();
    if(plan.shield)g.input('shield');else g.releaseShield();
    for(const action of plan.actions){g.input(action);if(action==='special')g.releaseSpecial();}
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
    // Spend only resources earned on the route. Later guardians are tuned for
    // an adventurer who forges upgrades and supplies between expeditions.
    while(g.upgrades<3&&g.input('upgrade')){}
    if(!g.charms.has('fang'))g.craft('fang');
    while(g.inventory.flask<3&&g.inventory.heartwood>=2)g.craft('flask');
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
