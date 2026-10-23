import { COMBAT, MOVES, POWERS, availablePowers, powerUnlocked } from './combat-data.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/** Fixed-frame combat owns attack states, defensive timing and kinetic arts.
 * Campaign geometry, creature resources and RPG rewards remain independent. */
export class CombatDirector{
  constructor(game){
    this.g=game;this.powerSlots=['arcbolt','aegis'];this.selectedPower=0;this.cooldowns={};this.recovery=0;this.flow=0;this.flowGrace=0;this.chain=0;this.chainLife=0;this.buffer=null;this.fields=[];this.settings={reducedMotion:false};
    this.stats={parries:0,guardBreaks:0,perfectDodges:0,launches:0,powers:0};this.reset();
  }
  reset(){
    Object.assign(this.g.player,{shielding:false,shieldHeld:false,shield:100,shieldDelay:0,guardBroken:0,parryFrames:0,parryLock:0,riposte:0,stagger:0,powerAura:0,dashElapsed:0,dashSpeed:0,lastDashTick:-999,evadeTick:-999});
    this.buffer=null;this.chain=0;this.chainLife=0;this.fields=[];
  }
  remaining(action){return Math.max(this.cooldowns[action]||0,this.recovery,action==='special'?this.g.party[this.g.activeSlot].skillCooldown:0);}
  powerRemaining(id=this.powerSlots[this.selectedPower]){return Math.max(this.cooldowns[id]||0,this.remaining('power'));}
  commit(action,frames=COMBAT.reuse[action]){this.cooldowns[action]=Math.max(this.cooldowns[action]||0,frames);this.recovery=COMBAT.recovery;}
  serialize(){return {cooldowns:{...this.cooldowns},recovery:this.recovery,powerSlots:[...this.powerSlots],selectedPower:this.selectedPower,settings:{...this.settings},stats:{...this.stats}};}
  load(s){
    if(!s||typeof s!=='object')return;
    const limits={...COMBAT.reuse,...Object.fromEntries(Object.values(POWERS).map(d=>[d.id,d.cooldown]))};
    this.cooldowns={};for(const [id,max] of Object.entries(limits))if(Number.isFinite(s.cooldowns?.[id]))this.cooldowns[id]=Math.floor(clamp(s.cooldowns[id],0,max));
    this.recovery=Number.isFinite(s.recovery)?Math.floor(clamp(s.recovery,0,COMBAT.recovery)):0;
    const slots=Array.isArray(s.powerSlots)?s.powerSlots:[];
    this.powerSlots=[0,1].map(i=>powerUnlocked(this.g,slots[i])?slots[i]:i?'aegis':'arcbolt');
    if(this.powerSlots[0]===this.powerSlots[1])this.powerSlots[1]=this.powerSlots[0]==='aegis'?'arcbolt':'aegis';
    this.selectedPower=s.selectedPower===1?1:0;this.settings.reducedMotion=s.settings?.reducedMotion===true;
    for(const k of Object.keys(this.stats))if(Number.isFinite(s.stats?.[k]))this.stats[k]=Math.floor(clamp(s.stats[k],0,999999));
  }
  equipPower(slot,id){
    if(![0,1].includes(slot)||!powerUnlocked(this.g,id))return false;
    const other=1-slot;if(this.powerSlots[other]===id)this.powerSlots[other]=this.powerSlots[slot];this.powerSlots[slot]=id;this.g.save();return true;
  }
  choosePower(index){if(![0,1].includes(index))return false;this.selectedPower=index;return true;}
  releaseShield(){const p=this.g.player;p.shieldHeld=false;p.shielding=false;p.parryFrames=0;}
  input(action){
    const g=this.g,p=g.player;
    if(action==='powerCycle'){this.selectedPower=1-this.selectedPower;g.emit('powerselect');return true;}
    if(action==='power')return this.castPower();
    if(action==='shield'){
      if(p.guardBroken||p.stagger||p.dash||p.respawning)return false;
      if(p.shieldHeld)return true;
      if(p.attack&&p.attack.frame<p.attack.cancelAt)return false;
      g.cancelHeal();this.buffer=null;p.attack=null;p.shieldHeld=true;p.shielding=true;
      // Tapping repeatedly cannot reopen the perfect-deflect window.
      if(!p.parryLock){p.parryFrames=COMBAT.parryFrames;p.parryLock=24;}
      g.emit('shieldup');return true;
    }
    if(!['light','heavy','dash'].includes(action))return null;
    if(p.stagger||p.root>0&&action==='dash')return false;
    if(action==='dash')return this.dash();
    const wait=this.remaining(action);if(wait>COMBAT.inputBuffer||this.buffer)return false;
    g.cancelHeal();this.releaseShield();
    if(p.attack||p.dash||wait){this.buffer={action,life:COMBAT.inputBuffer};return true;}
    return this.attack(action);
  }
  attack(action){
    const g=this.g,p=g.player;if(this.remaining(action)||p.stagger||p.respawning)return false;this.releaseShield();let id;
    if(p.riposte){id='riposte';p.riposte=0;}
    else if(action==='light'&&g.tick-p.lastDashTick<14)id='dashstrike';
    else if(!p.grounded&&g.inputs.down&&action==='heavy'&&g.abilities.has('claw'))id='plunge';
    else if(g.inputs.up&&action==='heavy')id='launcher';
    else if(!p.grounded)id=action==='heavy'?'heavy':'airlight';
    else if(action==='heavy')id=this.chain>=2&&this.chainLife?'launcher':'heavy';
    else{id='light'+(this.chainLife?this.chain%3+1:1);this.chain=this.chainLife?this.chain%3+1:1;}
    const move=MOVES[id]||MOVES.heavy;
    p.attack={...move,type:action,move:id,frame:0,dir:move.dir||(g.inputs.down&&!p.grounded?'down':g.inputs.up?'up':'side'),hit:new Set(),swing:this.chain};
    if(id==='plunge'){p.vy=18;p.vx*=.4;}
    else if(p.grounded)p.vx+=p.face*(move.impulse||2);
    p.armor=action==='heavy'&&['pyrojaw','terrakhan','ferrodrake','glaciolith'].includes(g.data.id)?1:0;
    this.chainLife=COMBAT.chainWindow+move.start+move.active+move.recovery;
    this.commit(action);g.swingIndex=this.chain;g.emit('slash',{move:id,x:p.x+p.face*45,y:p.y-35,element:g.data.types[0]});return true;
  }
  dash(){
    const g=this.g,p=g.player;if(p.dashCooldown||p.dash||!p.grounded&&p.airDashes>=(g.data.id==='zephyrix'?2:1))return false;
    if(p.attack&&p.attack.frame<p.attack.cancelAt)return false;
    g.cancelHeal();this.releaseShield();p.attack=null;this.buffer=null;
    const dx=Number(g.inputs.right)-Number(g.inputs.left),dy=Number(g.inputs.down)-Number(g.inputs.up);
    if(dx)p.face=dx;
    const omni=!p.grounded&&g.abilities.has('wings')&&dy;
    const length=Math.hypot(dx,dy)||1;
    p.skillVector=omni?{x:dx/length,y:dy/length}:null;
    p.lastDashTick=g.tick;p.dash=COMBAT.motor.dashFrames;p.dashElapsed=0;p.dashCooldown=g.abilities.has('blink')?12:COMBAT.motor.dashCooldown;p.dashUsed=true;p.vy=0;p.invul=Math.max(p.invul,COMBAT.dashInvul);
    if(g.inputs.down&&p.grounded&&g.abilities.has('claw')){p.dash+=2;g.emit('slide');}
    if(!p.grounded){p.airDashes++;g.stats.airDashes++;}g.stats.dashes++;g.emit('dash',{x:p.x,y:p.y-25});return true;
  }
  step(){
    const g=this.g,p=g.player,frameEnemies=g.enemies;
    for(const key of ['guardBroken','parryFrames','parryLock','riposte','stagger','powerAura','shieldDelay'])if(p[key]>0)p[key]--;
    if(this.recovery>0)this.recovery--;
    for(const id of Object.keys(this.cooldowns))if(this.cooldowns[id]>0)this.cooldowns[id]--;
    if(p.dash)p.dashElapsed++;else {p.dashElapsed=0;p.dashSpeed=0;}
    if(this.chainLife>0)this.chainLife--;else this.chain=0;
    if(this.flowGrace>0)this.flowGrace--;else this.flow=Math.max(0,this.flow-.12);
    if(p.shieldHeld&&!p.guardBroken&&!p.stagger&&!p.dash){
      p.shielding=true;g.cancelHeal();p.shield=Math.max(0,p.shield-COMBAT.guardDrain);p.shieldDelay=COMBAT.guardRegenDelay;if(p.shield<=0)this.breakGuard();
    }else {p.shielding=false;if(!p.shieldDelay&&!p.guardBroken)p.shield=Math.min(100,p.shield+COMBAT.guardRegen);}
    if(this.buffer){
      const action=this.buffer.action;
      if(!this.remaining(action)&&!p.stagger&&!p.dash&&!p.shielding&&(!p.attack||p.attack.frame>=p.attack.cancelAt)){
        this.buffer=null;p.attack=null;this.attack(action);
      }else if(--this.buffer.life<0)this.buffer=null;
    }
    for(const f of this.fields){
      f.life--;if(f.type==='time')for(const e of g.enemies)if(e.hp>0&&Math.hypot(e.x-f.x,e.y-40-f.y)<f.radius){e.timeSlowUntil=g.tick+2;e.timeScale=f.timeScale;}
      if(['gravity','cyclone'].includes(f.type))for(const e of g.enemies)if(e.hp>0&&Math.hypot(e.x-f.x,e.y-40-f.y)<f.radius){e.x+=(f.x-e.x)*(e.boss?.008:.055);if(f.life%f.interval===0)g.strike(e,f.damage,p.face,{source:f.owner,dot:true,element:f.type==='gravity'?'Shadow':'Wind'});if(g.enemies!==frameEnemies||p.respawning)return;}
    }
    this.fields=this.fields.filter(f=>f.life>0);
  }
  updateAttack(){
    const g=this.g,p=g.player,a=p.attack,frameEnemies=g.enemies;if(!a)return;
    a.frame++;if(a.frame>=a.start+a.active+a.recovery){p.attack=null;p.armor=0;return;}
    if(a.frame===a.start){g.effects.push({type:'slash',x:p.x+p.face*45,y:p.y-35,face:p.face,dir:a.dir,heavy:a.type==='heavy',swing:a.swing,life:12});}
    if(a.frame>=a.start)p.armor=0;
    if(a.frame<a.start||a.frame>=a.start+a.active)return;
    for(const e of g.enemies){
      if(e.hp<=0||a.hit.has(e.id))continue;
      const dx=e.x-p.x,dy=(e.y-(e.boss?70:28))-(p.y-g.data.bodyHeight*.5),range=a.range||105;
      const contact=a.dir==='down'?e.y-p.y>5&&e.y-p.y<(a.move==='plunge'?145:120)&&Math.abs(dx)<75:a.dir==='up'?dy<35&&dy>-(a.reachY||150)&&Math.abs(dx)<85:dx*p.face>-28&&dx*p.face<range+(e.boss?30:15)&&Math.abs(dy)<(a.reachY||90);
      if(!contact)continue;a.hit.add(e.id);
      g.strike(e,a.damage||18,p.face,{heavy:a.type==='heavy',element:a.element||g.data.types[0],move:a.move,launch:a.launch,stun:a.stun});
      if(g.enemies!==frameEnemies||p.respawning)return;
      if(a.dir==='down')g.pogo();
    }
  }
  noteBossPressure(e,options){
    if(!e.boss||options.dot||e.hp<=0)return;
    const g=this.g,p=g.player,move=options.move||(options.heavy?'heavy':'light'),previous=e.pressure;
    const close=Math.abs(e.x-p.x)<205&&Math.abs(e.y-p.y)<135,groundedHeavy=options.heavy&&typeof options.move==='string'&&move!=='riposte'&&p.grounded&&close;
    const repeated=previous&&g.tick-previous.lastTick<=150&&previous.lastMove===move;
    e.pressure={lastMove:groundedHeavy?move:null,chain:groundedHeavy?(repeated?previous.chain+1:1):0,lastTick:g.tick,closeHits:close?(previous?.closeHits||0)+1:0};
    // The AI reads a demonstrated pattern, never the player's next input.
    // Mixed strings, aerial routes and a parried riposte reset this read.
    if(!groundedHeavy){e.pressureReady=false;e.guardReadMove=null;e.guarding=false;}
    else if(e.pressure.chain>=2&&!e.postureLock&&e.state!=='heal')e.pressureReady=true;
    else if(e.pressure.chain<2)e.pressureReady=false;
  }
  bossReadsStrike(e,options){
    const p=this.g.player;
    if(e.boss&&e.ward&&!options.dot&&!['recover','heal','enrage'].includes(e.state)){
      const frontal=Math.sign(p.x-e.x)===e.face,melee=typeof options.move==='string'&&options.move!=='riposte';
      if(!frontal||!p.grounded||!melee){e.ward=null;this.g.emit('bossshieldbreak',{boss:e.boss,x:e.x,y:e.y-80});}
      else{e.ward.charges-=options.heavy?2:1;if(e.ward.charges<=0){e.ward=null;this.g.emit('bossshieldbreak',{boss:e.boss,x:e.x,y:e.y-80});}return true;}
    }
    if(!e.boss||!e.guarding||options.dot||!options.heavy||typeof options.move!=='string'||options.move==='riposte'||!p.grounded||['recover','heal','enrage'].includes(e.state))return false;
    const read=e.guardReadMove||e.pressure?.lastMove;
    return !!read&&Math.abs(e.x-p.x)<205&&Math.abs(e.y-p.y)<135&&Math.sign(p.x-e.x)===e.face&&read===(options.move||'heavy');
  }
  onStrike(e,before,direction,options){
    if(e.hp>=before)return;
    const g=this.g,p=g.player;
    if(!options.dot){this.flow=clamp(this.flow+5+(options.heavy?3:0),0,100);this.flowGrace=140;
      g.emit('impact',{x:e.x,y:e.y-(e.boss?80:30),element:options.element||g.data.types[0],heavy:options.heavy,move:options.move});
      e.recoil=12;e.recoilDir=direction;e.stun=e.boss&&['countertell','evade','enrage'].includes(e.state)?0:Math.max(e.stun||0,e.boss?3:options.stun||12);
      this.noteBossPressure(e,options);
      if(e.boss&&options.guarded)e.guardRetaliation=true;
      if(e.boss&&e.state==='heal'&&e.healChannel&&(options.heavy||options.move==='riposte')){e.healChannel.interrupted=true;e.pressureReady=false;}
      if(options.launch&&!e.boss&&e.hp>0){e.juggle=32;e.launchVy=typeof options.launch==='number'?options.launch:-10.5;e.baseY=e.baseY||520;this.stats.launches++;g.emit('launch',{x:e.x,y:e.y-30});}
      if(e.boss&&e.hp>0&&!e.postureLock){e.poise=(e.poise||0)+(options.guarded?3:options.heavy?17:6);if(e.poise>=100){e.poise=0;e.postureLock=180;e.pressureReady=false;e.guarding=false;e.stun=24;e.state='recover';e.timer=36;g.emit('bossbreak',{x:e.x,y:e.y-70});g.say('POSTURE BROKEN · UNLEASH YOUR COMBO');}}
      if(options.element==='Fire'&&options.heavy&&!options.guarded)g.zones.push({type:'fire',x:e.x,y:e.baseY||520,radius:60,life:90,owner:options.source??g.activeSlot});
    }
    if(!e.hp){e.deathTimer=32;e.state='dying';g.emit('shatter',{x:e.x,y:e.y-40,color:e.boss?undefined:g.data.accent});}
    if(this.flow>=70&&p.attack)p.powerAura=Math.max(p.powerAura,12);
  }
  updateEnemy(e){
    if(e.recoil>0)e.recoil--;
    if(e.timeSlowUntil>=this.g.tick&&this.g.tick%10>=Math.round(e.timeScale*10))return true;
    if(e.frozen>0){e.encounterFrozenTick=this.g.tick;e.frozen--;if(e.flash)e.flash--;return true;}
    if(e.boss){
      if(e.postureLock>0)e.postureLock--;
      if(e.pressure&&this.g.tick-e.pressure.lastTick>180){e.pressure=null;e.pressureReady=false;}
    }
    if(e.juggle>0&&e.hp>0){e.juggle=Math.max(1,e.juggle-1);e.launchVy+=.7;e.y+=e.launchVy;e.x=clamp(e.x+(e.vx||0)*.5,40,this.g.worldWidth-40);if(e.y>=(e.baseY||520)){e.y=e.baseY||520;e.juggle=0;e.stun=18;}return true;}
    return false;
  }
  defend(direction,amount){
    const g=this.g,p=g.player;if(p.respawning||p.invul)return null;
    if(!p.shielding||p.guardBroken||direction!==-p.face)return null;
    if(p.parryFrames>0){
      p.parryFrames=0;p.riposte=COMBAT.riposteWindow;p.invul=10;p.shield=Math.min(100,p.shield+18);p.spirit=Math.min(100,p.spirit+COMBAT.parryFocus);p.dashCooldown=0;
      this.flow=Math.min(100,this.flow+20);this.flowGrace=180;this.stats.parries++;
      for(const e of g.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<200){e.stun=e.boss?30:65;e.state='recover';e.timer=55;}
      g.hitstop=4;g.emit('parry',{x:p.x+p.face*28,y:p.y-35});g.say('PERFECT DEFLECT · J / K TO RIPOSTE');return false;
    }
    p.shield-=COMBAT.guardDamage*Math.max(.6,amount);p.shieldDelay=COMBAT.guardRegenDelay;
    g.emit('guard',{x:p.x+p.face*30,y:p.y-35});if(p.shield<=0){this.breakGuard();return null;}
    p.invul=10;p.vx=direction*3;return false;
  }
  breakGuard(){const g=this.g,p=g.player;p.shield=0;p.guardBroken=COMBAT.guardBreakFrames;p.stagger=22;this.releaseShield();p.attack=null;this.flow*=.5;this.stats.guardBreaks++;g.emit('guardbreak',{x:p.x,y:p.y-30});g.say('SHIELD SHATTERED · EVADE UNTIL IT REFORMS');}
  onHurt(status={}){const p=this.g.player;p.invul=Math.min(p.invul,COMBAT.hitInvul);p.stagger=Math.max(p.stagger,(status.knockback||1)>=1.4?16:9);this.flow=Math.max(0,this.flow-28);this.releaseShield();this.buffer=null;}
  evade(direction){
    const g=this.g,p=g.player;if(!g.abilities.has('blink')||!p.dash||p.dashElapsed>4||p.evadeTick&&g.tick-p.evadeTick<24)return;
    p.evadeTick=g.tick;this.stats.perfectDodges++;this.flow=Math.min(100,this.flow+12);this.flowGrace=150;p.spirit=Math.min(100,p.spirit+6);g.emit('perfectdodge',{x:p.x,y:p.y-30,direction});
  }
  castPower(){
    const g=this.g,p=g.player,id=this.powerSlots[this.selectedPower],d=POWERS[id];
    if(g.paused||g.phase!=='playing'||p.respawning||!d||!powerUnlocked(g,id)||this.powerRemaining(id)>0||p.spirit<d.cost||p.stagger||p.guardBroken||p.dash||p.attack&&p.attack.frame<p.attack.cancelAt)return false;
    if(['comet','thunderstep'].includes(id)&&!p.grounded&&p.airDashes>=(g.data.id==='zephyrix'?2:1))return false;
    g.cancelHeal();this.releaseShield();this.buffer=null;p.attack=null;p.spirit-=d.cost;this.cooldowns[id]=d.cooldown;this.commit('power');p.powerAura=40;this.stats.powers++;g.emit('power',{id,x:p.x,y:p.y-35,color:d.color,element:d.element});
    const nearby=(range=250)=>g.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<range);
    const pulse=(range,damage,options={})=>{for(const e of nearby(range))g.strike(e,damage,Math.sign(e.x-p.x)||p.face,{heavy:true,...options});};
    if(['comet','thunderstep'].includes(id)){
      p.dash=d.duration;p.dashElapsed=0;p.dashSpeed=d.speed;p.skillVector=null;p.invul=Math.max(p.invul,d.invul||8);
      if(!p.grounded){p.airDashes++;g.stats.airDashes++;}g.stats.dashes++;
      g.skillStrike={life:d.duration,damage:d.damage,launch:d.launch||0,stun:d.stun||0,radius:d.radius,element:id==='comet'?'Fire':'Electric',owner:g.activeSlot,hit:new Set()};
    }
    if(id==='arcbolt')g.projectiles.push({x:p.x+p.face*25,y:p.y-35,vx:p.face*d.speed,vy:0,life:d.life,damage:d.damage,kind:'needle',element:'Electric',color:d.color,owner:g.activeSlot,piercing:d.piercing,hit:new Set()});
    if(id==='aegis'){p.shield=Math.min(100,p.shield+d.guardRestore);p.guard=d.duration;p.invul=Math.max(p.invul,12);pulse(d.radius,d.damage);}
    if(id==='cyclone')this.fields.push({type:'cyclone',x:p.x,y:p.y-35,life:d.duration,radius:d.radius,owner:g.activeSlot,color:d.color,damage:d.damage,interval:d.interval});
    if(id==='frostnova'){pulse(d.radius,d.damage,{element:'Ice'});for(const e of nearby(d.radius)){e.frozen=e.boss?Math.round(d.freeze*.6):d.freeze;e.slow=d.slow;}}
    if(id==='riftcut'){
      for(const e of nearby(d.range))if((e.x-p.x)*p.face>-30&&Math.abs(e.y-p.y)<d.reachY)g.strike(e,d.damage,p.face,{heavy:true,element:'Shadow',launch:d.launch});
      p.invul=12;
    }
    if(id==='bloodmoon'){const hit=nearby(d.radius).length;pulse(d.radius,d.damage,{element:'Shadow',launch:d.launch});if(hit)p.hp=Math.min(p.maxHp,p.hp+d.heal);}
    if(id==='timefracture'){pulse(d.radius,d.damage,{element:'Ice'});this.fields.push({type:'time',x:p.x,y:p.y-40,life:d.duration,radius:d.radius,color:d.color,timeScale:d.timeScale});}
    if(id==='gravitywell')this.fields.push({type:'gravity',x:p.x+p.face*d.offset,y:p.y-40,life:d.duration,radius:d.radius,owner:g.activeSlot,color:d.color,damage:d.damage,interval:d.interval});
    if(id==='choir')for(const [i,m] of g.party.entries())if(m.hp>0)g.projectiles.push({x:p.x+(i-1)*45,y:p.y-55-i*25,vx:p.face*d.speed,vy:(i-1)*2,life:d.life,damage:d.damage,kind:'needle',element:m.data.types[0],color:m.data.color,owner:i,homing:true,hit:new Set()});
    if(id==='phoenix'){pulse(d.radius,d.damage,{element:'Fire',launch:d.launch});p.hp=Math.min(p.maxHp,p.hp+d.heal);p.invul=d.invul;p.armor=1;this.fields.push({type:'phoenix',x:p.x,y:p.y-40,life:120,radius:d.radius,color:d.color});}
    return true;
  }
  snapshot(){const p=this.g.player;return {...this.serialize(),flow:this.flow,chain:this.chain,move:p.attack?.move||null,attackFrame:p.attack?.frame||0,shield:p.shield,shielding:p.shielding,parryFrames:p.parryFrames,riposte:p.riposte,guardBroken:p.guardBroken,cooldowns:{...this.cooldowns},actions:Object.fromEntries(Object.entries(COMBAT.reuse).map(([id,total])=>[id,{remaining:this.remaining(id),total}])),available:availablePowers(this.g).map(d=>d.id)};}
}
