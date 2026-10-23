import {CHAPTERS} from '../../src/world.js';
import {EQUIPMENT} from '../../src/rpg-data.js';
// These controllers issue the same actions as keyboard play. No teleporting,
// inventory grants, boss damage injection, or ability shortcuts.
export function walkTo(g,x,max=2600){
  let drop=null;
  for(let t=0;t<max;t++){
    const p=g.player;
    if(Math.abs(p.x-x)<30&&p.grounded&&p.y===520){g.setInputs({});return true;}
    // A ground-level door may sit beneath a catch gallery. Step off its edge
    // before returning below it; waiting on the shelf cannot reach that door.
    if(drop&&p.y>drop.y+5)drop=null;
    if(!drop&&p.grounded&&p.y<520&&Math.abs(p.x-x)<55){
      const shelf=g.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x&&p.x<=b.x+b.w);
      if(shelf)drop={x:Math.abs(p.x-shelf.x)<Math.abs(p.x-shelf.x-shelf.w)?shelf.x-35:shelf.x+shelf.w+35,y:shelf.y};
    }
    const target=drop?.x??x,descending=!!drop;
    g.setInputs({right:p.x<target-10,left:p.x>target+10});
    const edge=g.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x&&p.x<=b.x+b.w);
    if(!descending&&p.grounded&&edge&&x>p.x&&edge.x+edge.w-p.x<95)g.input('jump');
    if(g.thorns.length&&g.abilities.has('grapple')&&!g.grapple&&t%20===0&&p.x>820&&p.x<1800)g.input('grapple');
    if(g.abilities.has('blink')&&p.x>1020&&p.x<1120)g.input('dash');
    if(g.thorns.some(h=>p.x>h.x-10&&p.x<h.x+h.w-30)&&!p.grounded&&p.vy>0&&!g.grapple)g.input('dash');
    if(p.wall&&t%10===0)g.input('jump');
    if(!descending&&p.grounded&&g.platforms.some(b=>b.solid&&!b.veil&&b.y<p.y&&b.x-p.x>0&&b.x-p.x<150))g.input('jump');
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
    if(dist>350&&p.grounded){target=p.x;heal=true;}
  }
  const inputs={right:p.x<target-14,left:p.x>target+14,down:!p.grounded&&dist<100};
  // Turn the shield toward the visible source. Retreat movement otherwise
  // turns a creature's back to the strike before the guard comes up.
  if(shield){const facing=Math.sign((h?.x??e.x)-p.x)||side;inputs.right=facing>0;inputs.left=facing<0;}
  // A two-light confirm into a heavy finisher changes the pressure read. Attack
  // only while in range, and use committed recovery/heal as the best opening.
  const opening=['recover','heal','patrol'].includes(e.state)||windup&&e.timer>22;
  const remaining=action=>typeof g.combat?.remaining==='function'?g.combat.remaining(action):g.combat?.actions?.[action]?.remaining||0;
  const attacking=p.attack||g.combat?.move;
  const kit=g.companionKit||g.data,signatureCost=kit?.cost||28;
  if(!heal&&!danger&&opening&&dist<340&&!attacking&&!remaining('special')&&p.spirit>=signatureCost){
    // Cast before starting a jab: L cannot replace an attack still in startup.
    // Ground control and traps need their own setup rather than another rush.
    const id=p.id||g.data?.id;inputs.left=false;inputs.right=false;
    if(['pyrojaw','terrakhan'].includes(id))inputs.down=true;else inputs.down=false;
    actions.push('special');
  }else if(!heal&&!danger&&opening&&dist<150&&!attacking){
    const chain=g.combat?.chain??0,heavyWait=remaining('heavy');
    actions.push(e.state==='heal'||chain>=2&&!heavyWait?'heavy':'light');
  }else if(!heal&&!danger&&opening&&dist>160&&dist<520&&!remaining('power')&&p.spirit>40)actions.push('power');
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
/** Spend earned Focus during an actual quiet interval after a cleared fight.
 * This is the player's ordinary F channel, never a heal or resource setter. */
export function recoverFocus(g){
  const original=g.activeSlot;
  g.setInputs({});g.releaseShield();g.releaseJump();g.releaseHeal();
  // Residual warned areas must finish before tending an injured companion.
  for(let frame=0;frame<240&&(g.bossHazards||[]).some(h=>h.life>0);frame++)g.step();
  for(let slot=0;slot<g.party.length;slot++){
    if(g.party[slot].hp<=0)continue;
    for(let wait=0;wait<120&&g.activeSlot!==slot;wait++){g.input('slot'+(slot+1));g.step();}
    if(g.activeSlot!==slot)continue;
    for(let frame=0;frame<360&&g.phase==='playing';frame++){
      const p=g.player;if(p.maxHp-p.hp<.5||p.spirit<40)break;
      g.input('heal');g.step();
    }
    g.releaseHeal();
  }
  for(let wait=0;wait<120&&g.activeSlot!==original;wait++){g.input('slot'+(original+1));g.step();}
  g.releaseHeal();return g.phase==='playing';
}
export function playCampaign(g,{chapters=6,switchParty=true,onGuardian=()=>{},onVictory=()=>{}}={}){
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
    // An RPG expedition uses the talents and relics earned on earlier gates.
    // Purchases still go through the same checks as their menu buttons.
    if(typeof g.buyTalent==='function')for(const talent of ['ferocity','execution','stillwater','reservoir','secondchance'])if(!g.talents.has(talent))g.buyTalent(talent);
    if(typeof g.equipItem==='function')for(const slot of ['relic','armor']){
      const score=d=>{const m=EQUIPMENT[d.template].mods;return (m.damage||0)*3+(m.armor||0)*3+(m.focus||0)+(m.speed||0);};
      const best=g.gear.filter(d=>EQUIPMENT[d.template].slot===slot).sort((a,b)=>score(b)-score(a))[0];
      if(best&&g.loadout[slot]!==best.id)g.equipItem(best.id);
    }
    if(typeof g.buyItem==='function'&&g.inventory.flask<3&&g.shopStock.flask>0){
      const merchant=g.room.objects.find(o=>o.kind==='merchant');
      if(merchant&&walkTo(g,merchant.x))while(g.inventory.flask<3&&g.buyItem('flask')){}
    }
    if(switchParty)g.input('slot'+(i%3+1));
    if(!walkTo(g,1050+i*180))throw Error('Cannot reach sanctuary portal '+i);g.input('interact');
    if(g.roomId!==ch.id+'-path')throw Error('Portal did not open '+i);
    const depthDoor=g.room.objects.find(o=>o.to===ch.id+'-descent'||o.to===ch.id+'-heart');
    if(!depthDoor||!walkTo(g,depthDoor.x))throw Error('Cannot cross '+ch.id+' at '+g.player.x);g.input('interact');
    if(g.roomId===ch.id+'-descent'){
      // The main dungeon is an excavated floor route. The upper stairs are
      // optional exploration, not a compulsory sequence over a lethal abyss.
      const door=g.room.objects.find(o=>o.to===ch.id+'-nexus');
      if(!walkTo(g,door.x))throw Error('Cannot reach the grounded dungeon nexus '+i);g.input('interact');
      if(g.roomId!==ch.id+'-nexus')throw Error('Dungeon nexus did not open '+i);
      if(!walkTo(g,1700)||!fightGuardian(g))throw Error('Gate sentinel fight failed '+i);
      onVictory(g);recoverFocus(g);
      const heartDoor=g.room.objects.find(o=>o.to===ch.id+'-heart');
      if(!walkTo(g,heartDoor.x))throw Error('Cannot cross dungeon nexus '+i);g.input('interact');
    }
    if(g.roomId!==ch.id+'-heart')throw Error('Guardian door did not open '+i+' in '+g.roomId);
    onGuardian(g);
    if(!walkTo(g,850)||!fightGuardian(g))throw Error('Guardian fight failed '+ch.boss);
    onVictory(g);recoverFocus(g);
    const returnDoor=g.room.objects.find(o=>o.to==='sanctuary');
    if(!returnDoor||!walkTo(g,returnDoor.x))throw Error('Guardian exit not reachable '+i);g.input('interact');
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
  let jumpFromY=p.y,drop=null;
  for(let i=0;i<max;i++){
    const p=g.player;if(Math.abs(x-p.x)<13&&Math.abs(y-p.y)<5&&p.grounded){g.setInputs({});return true;}
    if(drop&&p.y>drop.y+5)drop=null;
    if(!drop&&p.grounded&&p.y<y-5&&Math.abs(p.x-x)<55){
      // High-jump companions can land above the requested story doorway.
      // Walk off the current one-way shelf and steer back while descending.
      const shelf=g.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x&&p.x<=b.x+b.w);
      if(shelf){const exitX=x>shelf.x+shelf.w?shelf.x+shelf.w+35:x<shelf.x?shelf.x-35:Math.abs(p.x-shelf.x)<Math.abs(p.x-shelf.x-shelf.w)?shelf.x-35:shelf.x+shelf.w+35;drop={x:exitX,y:p.y};jumpFromY=p.y;}
    }
    const targetX=drop?.x??x,descending=!!drop;
    g.setInputs({right:p.x<targetX-12,left:p.x>targetX+12});
    const source=g.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x-12&&p.x<=b.x+b.w+12);
    const target=g.platforms.find(b=>Math.abs(b.y-y)<2&&x>=b.x&&x<=b.x+b.w);
    const gap=target?(p.x<x?target.x-p.x:p.x-target.x-target.w):Math.abs(x-p.x);
    const edge=source&&(p.x<x?source.x+source.w-p.x:p.x-source.x);
    if(!descending&&p.grounded&&(p.y>y+5&&(gap<120||edge<35)||edge<60&&Math.abs(x-p.x)>45)){jumpFromY=p.y;g.input('jump');}
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
