import { clearBossEncounter, resetBossEncounters, updateBossHazards } from './boss-encounters.js';
import { TrainingEngine, MOTOR } from './training.js';
import { ROSTER, findFighter } from './roster.js';
import { MINIONS } from './designs.js';
import { CombatDirector } from './combat.js';
import { COMBAT } from './combat-data.js';
import { HUB_RECOVERY, validSeed, newWorldSeed, recoveryLayout, recoverySavePoint } from './recovery.js';
import { DUNGEON_HEAL, bossHealth, updateBossEncounter, updateDungeonMinion } from './difficulty.js';
import { ROOMS, BOSSES, CHAPTERS, ABILITIES, CHARMS, DIALOGUES, DEFAULT_PARTY } from './world.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,a,b,fallback=0)=>Number.isFinite(v)?clamp(v,a,b):fallback;
export const CAMPAIGN_MOTOR={...MOTOR,...COMBAT.motor};
const starterIds=ROSTER.slice(0,8).map(d=>d.id);

export class CampaignEngine extends TrainingEngine{
  constructor(party=DEFAULT_PARTY,options={}){
    super(party,options);this.campaign=true;this.healConfig=DUNGEON_HEAL;this.motor={...CAMPAIGN_MOTOR};this.onSave=options.onSave||(()=>{});
    this.abilities=new Set(['dash']);this.unlocked=new Set(starterIds);this.fragments=new Set();this.visited=new Set();this.opened=new Set();this.defeated=new Set();this.memories=new Set();this.shrines=new Set();
    this.inventory={heartwood:0,ember:0,pearl:0,stormglass:0,frostcore:0,riftglass:0,flask:3,pickaxe:1,lantern:1};
    this.charms=new Set();this.equipped=[];this.tools=['pickaxe','lantern'];this.toolIndex=0;this.roomId='sanctuary';this.storyStage=0;this.finished=false;this.ending=null;this.playtime=0;this.combo=0;this.comboTimer=0;this.attackBuffer=null;this.swingIndex=0;this.transition=0;this.grapple=null;this.landing=0;this.tutorial=0;
    this.worldSeed=validSeed(options.worldSeed)?options.worldSeed:newWorldSeed();this.spentRecovery=new Set();this.discoveredRecovery=new Set();this.claimedEnemyRewards=new Set();this.respawnedEnemies=new Set();this.death=null;this.safeRest={...HUB_RECOVERY};this.combat=new CombatDirector(this);this.loadRoom('sanctuary',150,false);
    if(options.save)this.loadSave(options.save);
  }
  save(){
    const state={version:2,room:this.roomId,checkpoint:{...this.checkpoint},safeRest:{...this.safeRest},worldSeed:this.worldSeed,spentRecovery:[...this.spentRecovery],discoveredRecovery:[...this.discoveredRecovery],claimedEnemyRewards:[...this.claimedEnemyRewards],respawnedEnemies:[...this.respawnedEnemies],death:this.death?structuredClone(this.death):null,party:this.party.map(m=>({id:m.data.id,hp:m.hp,maxHp:m.maxHp,spirit:m.spirit})),activeSlot:this.activeSlot,level:this.level,xp:this.xp,lumens:this.lumens,upgrades:this.upgrades,
      abilities:[...this.abilities],unlocked:[...this.unlocked],fragments:[...this.fragments],visited:[...this.visited],opened:[...this.opened],defeated:[...this.defeated],memories:[...this.memories],shrines:[...this.shrines],inventory:{...this.inventory},charms:[...this.charms],equipped:[...this.equipped],discovered:[...this.discovered],stats:{...this.stats},playtime:this.playtime,storyStage:this.storyStage,finished:this.finished,ending:this.ending};
    this.onSave(state);return state;
  }
  loadSave(s){
    // A corrupt or old save must never destroy a playable fresh campaign.
    if(!s||s.version!==2||!Array.isArray(s.party)||s.party.length!==3||s.party.some(m=>!m||typeof m.id!=='string')||new Set(s.party.map(m=>m.id)).size!==3||s.party.some(m=>!ROSTER.some(d=>d.id===m.id))||!Object.hasOwn(ROOMS,s.room))return false;
    const requestedUnlocks=new Set([...starterIds,...(Array.isArray(s.unlocked)?s.unlocked:[])]);if(s.party.some(m=>!requestedUnlocks.has(m.id)))return false;
    const list=(key,valid)=>new Set(Array.isArray(s[key])?s[key].filter(x=>typeof x==='string'&&(!valid||valid(x))):[]);
    this.fragments=list('fragments',x=>CHAPTERS.some(ch=>ch.boss===x));this.abilities=new Set(['dash',...list('abilities',x=>!!ABILITIES[x])]);
    this.unlocked=new Set([...starterIds,...list('unlocked',x=>ROSTER.some(d=>d.id===x))]);
    if(s.party.some(m=>!this.unlocked.has(m.id)))return false;
    this.level=finite(s.level,1,5,1);this.xp=finite(s.xp,0,300);this.lumens=finite(s.lumens,0,99999);this.upgrades=finite(s.upgrades,0,3);
    this.party=s.party.map(m=>{const data=findFighter(m.id),maxHp=data.maxHp+this.level-1+this.upgrades;return {data,maxHp,hp:finite(m.hp,0,maxHp,maxHp),spirit:finite(m.spirit,0,100,100),skillCooldown:0};});
    this.activeSlot=Math.floor(finite(s.activeSlot,0,2));const pendingDeath=s.death&&Object.hasOwn(ROOMS,s.death.room)&&ROOMS[s.death.room].biome===s.death.gate;if(!this.party.some(m=>m.hp>0)&&!pendingDeath)this.restoreParty();if(!this.party[this.activeSlot].hp&&this.party.some(m=>m.hp>0))this.activeSlot=this.party.findIndex(m=>m.hp>0);
    for(const key of ['visited','opened','defeated','memories','shrines'])this[key]=list(key);this.claimedEnemyRewards=new Set([...this.defeated,...list('claimedEnemyRewards')]);this.respawnedEnemies=list('respawnedEnemies',key=>Object.values(ROOMS).some(r=>r.enemies.some((e,n)=>r.id+':'+n===key)));
    this.worldSeed=validSeed(s.worldSeed)?s.worldSeed:this.worldSeed;this._recoveryLayout=null;const recoveryIds=new Set(this.allRecovery().map(p=>p.id));this.spentRecovery=list('spentRecovery',id=>recoveryIds.has(id));this.discoveredRecovery=new Set([...this.spentRecovery,...list('discoveredRecovery',id=>recoveryIds.has(id))]);this.discovered=list('discovered',x=>!!MINIONS[x]);
    for(const key of Object.keys(this.inventory))this.inventory[key]=Math.floor(finite(s.inventory?.[key],0,999,0));this.inventory.pickaxe=1;this.inventory.lantern=1;
    this.charms=list('charms',x=>!!CHARMS[x]);this.equipped=Array.isArray(s.equipped)?[...new Set(s.equipped)].filter(x=>this.charms.has(x)).slice(0,2):[];
    this.playtime=finite(s.playtime,0,99999999);this.storyStage=finite(s.storyStage,0,20);this.finished=!!s.finished;this.ending=['restore','release'].includes(s.ending)?s.ending:null;
    for(const key of Object.keys(this.stats))this.stats[key]=finite(s.stats?.[key],0,99999999);
    this.safeRest=recoverySavePoint(s.safeRest,this.allRecovery());
    this.loadRoom(s.room,{x:finite(s.checkpoint?.x,60,ROOMS[s.room].width-60,150),y:finite(s.checkpoint?.y,-2400,520,520)},false);
    if(pendingDeath){this.death={gate:s.death.gate,room:s.death.room,returnTo:recoverySavePoint(s.death.returnTo,this.allRecovery()),lostLumens:finite(s.death.lostLumens,0,99999),restoredEnemies:finite(s.death.restoredEnemies,0,999)};this.phase='gameover';this.paused=true;this.party.forEach(m=>m.hp=0);this.player.respawning=1;}else{this.death=null;this.phase='playing';}
    return true;
  }
  loadRoom(id,spawn=150,persist=true){
    if(!Object.hasOwn(ROOMS,id))return false;
    const arrival=typeof spawn==='object'&&spawn?{x:finite(spawn.x,24,ROOMS[id].width-40,150),y:finite(spawn.y,-2400,520,520)}:{x:finite(spawn,24,ROOMS[id].width-40,150),y:520};
    this.roomId=id;this.room=ROOMS[id];this.worldWidth=this.room.width;this.platforms=this.room.platforms.map(p=>({...p}));this.thorns=this.room.thorns||[];this.visited.add(id);
    this.enemies=this.room.enemies.map((spec,n)=>{
      const boss=spec.boss&&BOSSES[spec.boss],d=MINIONS[spec.kind],key=id+':'+n;
      const health=boss?bossHealth(boss):Math.round(d.hp*(1.25+(spec.elite?.35:0))),cleared=this.defeated.has(key)||spec.boss&&this.fragments.has(spec.boss)&&!this.respawnedEnemies.has(key),floor=spec.y??520;
      return {id:n,key,kind:spec.kind,boss:spec.boss,x:spec.x,y:floor,baseY:floor,homeY:floor,home:spec.x,hp:cleared?0:health,maxHp:health,face:-1,state:'patrol',timer:70,flash:0,stun:0,vx:0,slow:0,flipped:0,left:spec.left??Math.max(60,spec.x-(boss?500:240)),right:spec.right??Math.min(this.worldWidth-60,spec.x+(boss?500:240)),introX:spec.introX??spec.x-640,pattern:0,phase:1,rewarded:!!cleared||this.claimedEnemyRewards.has(key)};
    });
    this.relics=this.room.relics.map(r=>({...r,collected:this.opened.has(r.id)}));this.bell={x:-5000,y:430,r:24,flash:0};
    this.projectiles=[];this.enemyShots=[];this.waves=[];this.hazards=[];this.zones=[];this.effects=[];this.decoy=null;this.skillStrike=null;this.attackBuffer=null;this.grapple=null;
    const p=this.player;this.cancelHeal();Object.assign(p,{x:arrival.x,y:arrival.y,vx:0,vy:0,grounded:true,jumpCount:0,jumpBuffer:0,dash:0,dashCooldown:0,wall:0,wallLock:0,attack:null,airDashes:0,respawning:0,slow:0,root:0,slick:0,burn:0,guard:0,armor:0,fortress:false,specialHeld:false,skillVector:null,invul:30});
    for(const o of this.room.objects)if(o.kind==='lever'&&this.opened.has(id+':'+o.id))this.platforms.push({...o.bridge});
    this.recoveryPoints=this.recoveryForRoom(id);this._insideRecovery=new Set(this.recoveryPoints.filter(r=>Math.abs(r.x-arrival.x)<46&&Math.abs(r.y-arrival.y)<24).map(r=>r.id));
    resetBossEncounters(this);this.combat?.reset();this.checkpoint={...arrival};this.transition=100;this.roomTime=0;this.emit('room',{room:id});if(persist)this.save();return true;
  }
  input(action){
    if(this.paused||this.phase!=='playing'||this.player.respawning)return false;
    const p=this.player;
    if(p.stagger&&['jump','special','grapple'].includes(action))return false;
    if(['jump','grapple','heal'].includes(action))this.combat.releaseShield();
    const combatAction=this.combat.input(action);if(combatAction!==null)return combatAction;
    if(action==='special')return this.castSkill();
    if(action==='interact')return this.interact();
    if(action==='tool')return this.useTool();
    if(action==='toolCycle')return this.cycleTool();
    if(action==='potion')return this.useFlask();
    if(action==='grapple')return this.useGrapple();
    if(action==='upgrade'){const ok=this.buyUpgrade();if(ok)this.save();return ok;}
    return super.input(action);
  }
  releaseShield(){this.combat.releaseShield();}
  jump(){
    const p=this.player;if(!p.jumpBuffer)return;
    if(p.grounded||p.coyote>0){p.vy=this.motor.jump;p.jumpCount=1;p.coyote=0;this.stats.jumps++;}
    else if(p.wall&&this.abilities.has('claw')){p.vy=-14.6;p.vx=-p.wall*11;p.face=-p.wall;p.wallLock=8;p.jumpCount=1;p.airDashes=0;this.stats.wallJumps++;this.emit('walljump');}
    else if(p.jumpCount<2&&this.abilities.has('wings')){p.vy=this.motor.doubleJump;p.jumpCount=2;this.stats.doubleJumps++;this.emit('doublejump');}
    else return;
    if(!p.jumpHeld)p.vy*=.55;p.dash=0;p.grounded=false;p.jumpBuffer=0;this.emit('jump');this.effects.push({type:'jump',x:p.x,y:p.y,life:18});
  }
  step(){
    if(this.paused||this.phase!=='playing')return;
    this.playtime++;this.roomTime++;this.motor.run=CAMPAIGN_MOTOR.run*(this.equipped.includes('feather')?1.12:1)*(this.runMultiplier?.()||1);this.motor.dashCooldown=this.abilities.has('blink')?12:17;
    const combatEnemies=this.enemies;if(!this.hitstop)this.combat.step();if(this.enemies!==combatEnemies)return;
    if(this.transition>0)this.transition--;if(this.comboTimer>0)this.comboTimer--;else this.combo=0;if(this.landing>0)this.landing--;
    const wasGrounded=this.player.grounded,vy=this.player.vy,encountersStopped=this.hitstop>0;
    // Moving platforms carry grounded actors. Violet veils only yield during an awakened dash.
    for(const block of this.platforms)if(block.moving){const before=block.x;block.x=block.origin+Math.sin(this.tick*block.rate)*block.amplitude;if(this.player.grounded&&Math.abs(this.player.y-block.y)<2&&this.player.x>before-10&&this.player.x<before+block.w+10)this.player.x+=block.x-before;}
    const allPlatforms=this.platforms,frameEnemies=this.enemies,hidingVeils=this.abilities.has('blink')&&this.player.dash>0;
    if(hidingVeils)this.platforms=this.platforms.filter(b=>!b.veil);
    super.step();if(this.enemies!==frameEnemies)return;
    // Restore only hidden veils. Encounter events may have added or removed
    // real temporary terrain while the shared motor was advancing this frame.
    if(hidingVeils)this.platforms.push(...allPlatforms.filter(b=>b.veil));if(this.player.respawning)return;
    for(const h of this.hazards)if(['root','lightning','stasis'].includes(h.type)){
      h.timer--;if(h.timer===0)this.emit('slam');
      const floor=h.y??520,range=h.radius||(h.type==='stasis'?100:38),dy=this.player.y-floor;
      if(h.timer<=0&&h.timer>-18&&Math.abs(this.player.x-h.x)<range&&dy<45&&dy>-(h.type==='lightning'?360:60))this.hurt(Math.sign(this.player.x-h.x),h.damage??1,h.type==='stasis'?{slow:150}:h.type==='root'?{root:18}:{});
      if(this.enemies!==frameEnemies||this.player.respawning)return;
    }
    if(!encountersStopped)updateBossHazards(this);if(this.enemies!==frameEnemies||this.player.respawning||this.phase!=='playing')return;
    if(this.equipped.includes('pulse'))this.player.spirit=Math.min(100,this.player.spirit+.012);
    if(!wasGrounded&&this.player.grounded&&vy>4){this.landing=10;this.effects.push({type:'land',x:this.player.x,y:this.player.y,life:20});this.emit('land');}
    this.updateRecovery();
    if(this.grapple){const p=this.player,g=this.grapple,dx=g.x-p.x,dy=g.y-p.y,len=Math.hypot(dx,dy);p.x+=dx*.18;p.y+=dy*.18;p.vx=dx*.12;p.vy=dy*.12;p.grounded=false;p.airDashes=0;p.dashCooldown=0;p.jumpCount=1;if(len<42||--g.life<=0){this.grapple=null;p.vy=-12;p.vx=p.face*10;this.emit('grapple');}}
  }
  updateLesson(){
    // Room progression replaces the old six tutorial gates entirely.
    for(const r of this.relics)if(r.collected&&!this.opened.has(r.id)){this.opened.add(r.id);this.inventory[CHAPTERS.find(c=>c.id===this.room.biome)?BOSSES[CHAPTERS.find(c=>c.id===this.room.biome).boss].material:'heartwood']+=2;this.save();}
    const p=this.player;
    if(this.roomId==='sanctuary'&&this.storyStage===0&&p.x>330){this.storyStage=1;this.showDialogue(DIALOGUES.vell,this.room.objects.find(o=>o.id==='vell'));}
    const boss=this.enemies.find(e=>e.boss&&e.hp>0);
    if(boss&&p.x>(boss.introX??760)&&!boss.introduced){boss.introduced=true;this.emit('bossintro',{boss:boss.boss});}
    if(p.x<650&&this.roomId==='moss-path'&&this.tutorial<1){this.tutorial=1;this.say('J QUICK STRIKE · K HEAVY · SHIFT DASH · HOLD F TO HEAL');}
  }
  updateAttack(){
    this.combat.updateAttack();
  }
  strike(e,damage,direction,options={}){
    if(e.hp<=0)return;
    if(this.combat.bossReadsStrike(e,options)){
      damage*=.3;options={...options,guarded:true};
      this.emit('bossguard',{boss:e.boss,x:e.x,y:e.y-80});
      if(!e.guardNoticedTick||this.tick-e.guardNoticedTick>90){e.guardNoticedTick=this.tick;this.effects.push({type:'number',x:e.x,y:e.y-115,text:'READ · CHANGE ROUTE',life:40,color:BOSSES[e.boss].color});}
    }
    if(e.kind==='glassmarauder'&&['patrol','windup'].includes(e.state)){
      if(options.heavy){e.state='recover';e.timer=52;this.emit('slam');}
      else damage*=.22;
    }
    const before=e.hp,brokenStun=e.stun>20&&e.boss&&e.state==='recover'?e.stun:0,committingCounter=e.boss&&['countertell','evade','enrage'].includes(e.state);const power=(this.equipped.includes('fang')?1.22:1)*(1+this.combat.flow*.0015);
    const owner=this.party[options.source??this.activeSlot],focus=owner.spirit,frameEnemies=this.enemies;
    super.strike(e,damage*power,direction,options);
    if(this.enemies!==frameEnemies||this.player.respawning)return;
    owner.spirit=Math.min(owner.spirit,focus+(options.dot?.15:4));
    if(e.hp<before){if(e.boss)e.stun=committingCounter?0:brokenStun||Math.min(e.stun,3);this.hitstop=options.dot?0:this.player.attack?.hitstop||(options.heavy?3:1);
      if(!options.dot){this.combo++;this.comboTimer=100;this.effects.push({type:'number',x:e.x,y:e.y-80,text:String(Math.round(before-e.hp)),life:35,color:this.data.accent});}
    }
    this.combat.onStrike(e,before,direction,options);
  }
  hurt(direction=0,amount=1,status={}){
    const frameEnemies=this.enemies;
    if(this.player.dash&&this.player.invul)this.combat.evade(direction);
    const defended=status.unblockable?null:this.combat.defend(direction,amount);if(defended!==null)return defended;
    if(this.preventLethal?.(amount,direction))return true;
    const armored=this.player.armor>0,strongImpact=Number.isFinite(status.knockback)&&status.knockback>=1.4;
    const ok=super.hurt(direction,amount,status);
    if(this.enemies!==frameEnemies||this.player.respawning)return ok;
    // Heavy armor still reduces damage, but a committed boss impact must move
    // the attacker away instead of allowing stationary heavy trades forever.
    if(ok&&armored&&strongImpact){const p=this.player,force=Math.min(3,status.knockback);p.vx=direction*10*force;p.vy=-Math.min(10,5+force);p.grounded=false;p.wallLock=Math.max(p.wallLock,10);p.attack=null;p.armor=0;}
    if(ok)this.combat.onHurt(status);
    if(ok&&this.equipped.includes('thorn'))for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-this.player.x)<180)this.strike(e,18,direction,{heavy:true});
    return ok;
  }
  awardEnemy(e){
    if(e.summonedBy){e.rewarded=true;this.emit('kill');return;}
    if(e.boss)clearBossEncounter(this,e);
    if(e.rewarded){this.defeated.add(e.key);this.respawnedEnemies.delete(e.key);this.save();return;}super.awardEnemy(e);this.defeated.add(e.key);this.claimedEnemyRewards.add(e.key);this.respawnedEnemies.delete(e.key);const ch=CHAPTERS.find(c=>c.id===this.room.biome);
    if(ch)this.inventory[BOSSES[ch.boss].material]++;
    if(e.boss&&BOSSES[e.boss].miniboss){const b=BOSSES[e.boss];this.inventory[b.material]+=3;this.lumens+=35;this.gainXP(50);this.say('GATEKEEPER DEFEATED · '+b.name.toUpperCase());this.emit('bossdefeated',{boss:e.boss,miniboss:true});this.save();return;}
    if(e.boss){const b=BOSSES[e.boss];this.fragments.add(e.boss);if(b.reward)this.abilities.add(b.reward);if(b.creature)this.unlocked.add(b.creature);this.inventory[b.material]+=5;this.inventory.flask++;this.lumens+=45;this.gainXP(80);
      this.say('HEART FRAGMENT RESTORED · '+(b.reward?ABILITIES[b.reward].name.toUpperCase():'THE WORLDHEART IS AWAKE'));this.emit('bossdefeated',{boss:e.boss});
      if(e.boss==='crown'){this.finished=true;this.emit('ending');}
    }
    this.save();
  }
  allRecovery(){return this._recoveryLayout??=recoveryLayout(this.worldSeed);}
  recoveryForRoom(id){return this.allRecovery().filter(p=>p.room===id).map(p=>({...p,used:p.id!==HUB_RECOVERY.id&&this.spentRecovery.has(p.id)}));}
  updateRecovery(){
    if(this.phase!=='playing'||this.player.respawning)return;
    const p=this.player,inside=new Set();
    for(const r of this.recoveryPoints){
      if(!p.grounded||Math.abs(r.x-p.x)>=46||Math.abs(r.y-p.y)>=24)continue;
      inside.add(r.id);if(this._insideRecovery?.has(r.id)||r.used)continue;
      this.restoreParty();this.safeRest={id:r.id,room:r.room,x:r.x,y:r.y};this.checkpoint={x:r.x,y:r.y};this.discoveredRecovery.add(r.id);
      if(r.id!==HUB_RECOVERY.id){this.spentRecovery.add(r.id);r.used=true;}
      this.effects.push({type:'heal',x:r.x,y:r.y-30,life:45});this.say('WELLSPRING AWAKENED · PARTY FULLY RESTORED · CHECKPOINT SAVED');this.save();this.emit('recovery',{id:r.id,room:r.room});
    }
    this._insideRecovery=inside;
  }
  atBench(){const p=this.player;return !!(p.grounded&&(this.room.objects.some(o=>['camp','workbench'].includes(o.kind)&&Math.abs(p.x-o.x)<110&&Math.abs(p.y-(o.y??520))<55)||this.recoveryPoints.some(r=>Math.abs(p.x-r.x)<110&&Math.abs(p.y-r.y)<55)));}
  respawn(wipe=false){
    if(this.phase==='gameover')return;
    const lethalFall=!wipe&&this.player.hp<=1&&!this.party.some((m,i)=>i!==this.activeSlot&&m.hp>0);
    if(wipe||lethalFall){this.stats.falls++;this.beginGameOver();return;}
    super.respawn(false);this.combat?.reset();this.grapple=null;
    for(const e of [...this.enemies])if(e.hp>0&&e.boss)clearBossEncounter(this,e);
    resetBossEncounters(this);
    for(const e of this.enemies)if(e.hp>0&&e.boss){e.hp=e.maxHp;e.phase=1;e.pattern=0;}this.save();
  }
  beginGameOver(){
    if(this.phase==='gameover')return;
    const gate=this.room.biome,room=this.roomId,before=this.lumens;this.stats.wipes++;this.lumens=Math.floor(this.lumens*.9);
    let restoredEnemies=0;
    for(const r of Object.values(ROOMS))if(r.biome===gate){
      r.enemies.forEach((spec,n)=>{const key=r.id+':'+n;if(this.defeated.has(key)||spec.boss&&this.bossDefeated(spec.boss))this.claimedEnemyRewards.add(key);this.defeated.delete(key);this.respawnedEnemies.add(key);restoredEnemies++;});
      for(const key of [...this.defeated])if(key.startsWith(r.id+':event:'))this.defeated.delete(key);
    }
    for(const r of this.allRecovery())if(ROOMS[r.room].biome===gate)this.spentRecovery.delete(r.id);
    this.phase='gameover';this.paused=true;this.party.forEach(m=>m.hp=0);this.cancelHeal();this.combat.reset();this.grapple=null;this.setInputs({});
    Object.assign(this.player,{respawning:1,invul:0,vx:0,vy:0,attack:null,dash:0,specialHeld:false,fortress:false,guard:0,armor:0});
    resetBossEncounters(this);this.projectiles=[];this.enemyShots=[];this.waves=[];this.hazards=[];this.zones=[];this.effects=[];this.decoy=null;this.skillStrike=null;this.enemies=[];
    this.death={gate,room,returnTo:{...this.safeRest},lostLumens:before-this.lumens,restoredEnemies};
    this.recoveryPoints=this.recoveryForRoom(room);this.save();this.emit('gameover',structuredClone(this.death));
  }
  retryAfterDeath(){
    if(this.phase!=='gameover'||!this.death)return false;
    const rest=recoverySavePoint(this.death.returnTo,this.allRecovery());this.death=null;this.phase='playing';this.paused=false;this.restoreParty();this.loadRoom(rest.room,{x:rest.x,y:rest.y},false);this.safeRest=rest;this.player.respawning=30;this.player.invul=60;this.save();this.emit('retry');return true;
  }
  bossDefeated(id){return this.fragments.has(id)||this.defeatedBosses?.has(id)||Object.values(ROOMS).some(r=>r.enemies.some((e,n)=>e.boss===id&&this.defeated.has(r.id+':'+n)));}
  interact(){
    const p=this.player,near=this.room.objects.filter(o=>Math.abs(p.x-o.x)<100&&Math.abs(p.y-(o.y??520))<100).sort((a,b)=>Math.hypot(p.x-a.x,p.y-(a.y??520))-Math.hypot(p.x-b.x,p.y-(b.y??520)))[0];
    if(!near){this.say('FIND A BENCH, DOOR, OR TRAVELER · E TO INTERACT');return false;}
    const key=this.roomId+':'+near.id;
    if(near.requiresBoss&&!this.bossDefeated(near.requiresBoss)){this.say('THE DEPTH WARDEN HOLDS THIS SEAL · DEFEAT '+BOSSES[near.requiresBoss].name.toUpperCase());return false;}
    if(near.kind==='lever'){if(this.opened.has(key)){this.say('THE ROOTBRIDGE IS ALREADY RAISED');return false;}this.opened.add(key);this.platforms.push({...near.bridge});this.say('ROOTBRIDGE RAISED · THE WAY REMEMBERS');this.emit('slam');this.save();return true;}
    if(near.kind==='npc'&&near.talk!=='vell'){this.showDialogue(DIALOGUES[near.talk],near);return true;}
    if(near.kind==='npc'){const chapter=CHAPTERS[Math.min(this.fragments.size,5)];this.storyStage=Math.max(1,this.storyStage);this.showDialogue(this.fragments.size?[['Professor Vell',chapter.story],['Professor Vell','The sanctuary remembers every companion you rescue. Change your party at a camp, craft at the workbench, and follow the new portal.']]:DIALOGUES.vell,near);return true;}
    if(near.kind==='camp'){this.say('WAYFARER’S CAMP · EQUIPMENT & CRAFTING · FIND A WELLSPRING TO RECOVER');this.emit('workbench');return true;}
    if(near.kind==='workbench'){this.emit('workbench');return true;}
    if(near.kind==='memory'){const [title,text]=near.text.split('|');if(!this.memories.has(key)){this.memories.add(key);this.gainXP(30);this.emit('memory',{title,text});}this.say('ECHO RECOVERED · '+title+' · N: WORLD HISTORY');this.save();return true;}
    if(near.kind==='cache'){if(this.opened.has(key)){this.say('THIS CACHE HAS ALREADY BEEN CLAIMED');return false;}this.opened.add(key);this.inventory[near.material]+=near.rare?7:3;this.inventory.flask++;this.lumens+=near.rare?35:15;this.say('CACHE FOUND · MATERIALS + FLASK + LUMENS');this.emit('relic');this.save();return true;}
    if(near.kind==='ore'){this.say('CRACKED ORE · T TO USE YOUR RESONANCE PICK');return this.useTool('pickaxe');}
    if(near.kind==='shrine'){this.say('AN ECHO HIDES HERE · USE THE ECHO LANTERN WITH T');return this.useTool('lantern');}
    if(near.kind==='door'||near.kind==='portal'){
      if(near.need>this.fragments.size){this.say('THE PORTAL NEEDS '+near.need+' HEART FRAGMENTS');return false;}
      if(near.ability&&!this.abilities.has(near.ability)){this.say('SEALED PATH · REQUIRES '+ABILITIES[near.ability].name.toUpperCase());return false;}
      if(near.boss&&!this.fragments.has(near.boss)){this.say('THE GUARDIAN STILL HOLDS THIS DOOR');return false;}
      return this.loadRoom(near.to,near.spawn??150);
    }
    return false;
  }
  showDialogue(lines,source=null){
    if(!Array.isArray(lines))return false;
    const copy=lines.filter(line=>Array.isArray(line)&&typeof line[0]==='string'&&typeof line[1]==='string').map(line=>[line[0],line[1]]);if(!copy.length)return false;
    const anchor=source||this.room.objects.find(o=>o.kind==='npc'&&o.name===copy[0][0])||this.player;
    // Dialogue carries a value copy of its real speaker, never a live entity.
    // The host can place text in the scene without moving or pausing the world.
    this.emit('dialogue',{lines:copy,source:{room:this.roomId,id:anchor.id||anchor.talk||'voice',x:Number.isFinite(anchor.x)?anchor.x:this.player.x,y:Number.isFinite(anchor.y)?anchor.y:520,name:anchor.name||copy[0][0],kind:anchor.kind||'npc'}});return true;
  }
  useFlask(){const p=this.player;if(!this.inventory.flask||p.hp>=p.maxHp){this.say(!this.inventory.flask?'NO FLASKS · CRAFT MORE AT A WORKBENCH':'ALREADY AT FULL HEALTH');return false;}this.inventory.flask--;p.hp=Math.min(p.maxHp,p.hp+3);this.effects.push({type:'heal',x:p.x,y:p.y-30,life:35});this.emit('heal');this.save();return true;}
  cycleTool(){this.toolIndex=(this.toolIndex+1)%this.tools.length;this.say('TOOL · '+this.tools[this.toolIndex].toUpperCase());return true;}
  useTool(tool=this.tools[this.toolIndex]){
    const p=this.player;
    if(tool==='pickaxe'){
      const ore=this.room.objects.find(o=>o.kind==='ore'&&Math.abs(p.x-o.x)<110&&!this.opened.has(this.roomId+':'+o.id));
      if(!ore){this.say('RESONANCE PICK · FIND A CRACKED ORE VEIN');return false;}
      this.opened.add(this.roomId+':'+ore.id);this.inventory[ore.material]+=4;this.lumens+=12;this.effects.push({type:'burst',x:ore.x,y:480,life:40});this.emit('slam');this.say('ORE SHATTERED · +4 MATERIALS / +12 LUMENS');this.save();return true;
    }
    const shrine=this.room.objects.find(o=>o.kind==='shrine'&&Math.hypot(p.x-o.x,p.y-(o.y??520))<130);
    if(!shrine){this.effects.push({type:'heal',x:p.x,y:p.y-40,life:50});this.say('ECHO LANTERN · NO HIDDEN ECHO NEARBY');return false;}
    const key=this.roomId+':'+shrine.id;if(this.shrines.has(key)){this.say('THIS ECHO IS ALREADY SAFE');return false;}
    this.shrines.add(key);this.lumens+=50;this.gainXP(70);this.inventory.flask+=2;this.effects.push({type:'heal',x:shrine.x,y:shrine.y-30,life:70});this.say('LOST ECHO FOUND · +50 LUMENS / +2 FLASKS');this.emit('relic');this.save();return true;
  }
  useGrapple(){
    if(!this.abilities.has('grapple')){this.say('EMBER THREAD · DEFEAT SAINT BELLOWS TO AWAKEN');return false;}
    const p=this.player,range=this.equipped.includes('feather')?650:500;
    const candidates=this.room.anchors.filter(a=>Math.hypot(a.x-p.x,a.y-p.y)<range&&a.y<p.y-30&&Math.abs(a.x-p.x)>45);
    const forward=candidates.filter(a=>(a.x-p.x)*p.face>30);
    const anchor=(forward.length?forward:candidates).sort((a,b)=>(Math.abs(a.x-p.x)-(a.x-p.x)*p.face*.4)-(Math.abs(b.x-p.x)-(b.x-p.x)*p.face*.4))[0];
    if(!anchor){this.say('NO GOLDEN ANCHOR IN REACH');return false;}
    this.grapple={...anchor,life:22};p.attack=null;p.dash=0;this.cancelHeal();this.emit('grapple');return true;
  }
  buyUpgrade(){
    if(!this.atBench()){this.say('RETURN TO A CAMP, WELLSPRING, OR THE MENDER’S WORKBENCH');return false;}
    if(this.upgrades>=3){this.say('HEARTWOOD CHARM AT MAXIMUM');return false;}
    const cost=24+this.upgrades*20;if(this.lumens<cost){this.say(`HEARTWOOD CHARM NEEDS ${cost} LUMENS`);return false;}
    this.lumens-=cost;this.upgrades++;for(const m of this.party){m.maxHp++;if(m.hp>0)m.hp=Math.min(m.maxHp,m.hp+1);}
    this.say('HEARTWOOD CHARM +'+this.upgrades+' · HEALTH & DAMAGE UP');this.emit('upgrade');this.save();return true;
  }
  craft(id){
    const atBench=this.atBench();
    if(!atBench){this.say('CRAFT AT A CAMP, WELLSPRING, OR WORKBENCH');return false;}
    const cost=id==='flask'?{heartwood:2}:CHARMS[id]?.cost;if(!cost||id!=='flask'&&this.charms.has(id))return false;
    if(Object.entries(cost).some(([key,n])=>this.inventory[key]<n)){this.say('MISSING MATERIALS · EXPLORE CACHES AND ORE VEINS');return false;}
    for(const [key,n] of Object.entries(cost))this.inventory[key]-=n;
    if(id==='flask')this.inventory.flask++;else{this.charms.add(id);if(this.equipped.length<2)this.equipped.push(id);}
    this.say('CRAFTED · '+(id==='flask'?'BRAMBLE FLASK':CHARMS[id].name.toUpperCase()));this.emit('upgrade');this.save();return true;
  }
  equip(id){if(!this.charms.has(id))return false;if(this.equipped.includes(id))this.equipped=this.equipped.filter(x=>x!==id);else if(this.equipped.length<2)this.equipped.push(id);else{this.say('TWO CHARM SLOTS · UNEQUIP A CHARM FIRST');return false;}this.save();return true;}
  replaceParty(slot,id){
    if(!Number.isInteger(slot)||slot<0||slot>2||!this.unlocked.has(id)||this.party.some(m=>m.data.id===id))return false;
    if(!this.atBench()){this.say('CHANGE COMPANIONS AT A CAMP OR WELLSPRING');return false;}
    const data=findFighter(id),maxHp=data.maxHp+this.level-1+this.upgrades;const previous=this.party[slot];this.party[slot]={data,maxHp,hp:Math.min(maxHp,previous.hp),spirit:previous.spirit,skillCooldown:previous.skillCooldown};this.save();this.emit('switch');return true;
  }
  fastTravel(id){
    if(!Object.hasOwn(ROOMS,id)||id!=='sanctuary'&&!this.visited.has(id)){this.say('DISCOVER THIS CAMP BEFORE TRAVELING');return false;}
    if(this.enemies.some(e=>e.hp>0&&Math.abs(e.x-this.player.x)<600)){this.say('CLEAR NEARBY ENEMIES BEFORE TRAVELING');return false;}
    if(!this.atBench()){this.say('REACH A CAMP OR WELLSPRING TO FAST TRAVEL');return false;}
    const spring=this.recoveryForRoom(id).find(r=>this.discoveredRecovery.has(r.id)),camp=ROOMS[id].objects.find(o=>o.kind==='camp'),arrival=spring||camp;
    if(!arrival){this.say('NO DISCOVERED CAMP OR WELLSPRING IN THIS CHAMBER');return false;}
    return this.loadRoom(id,{x:arrival.x,y:arrival.y??520});
  }
  finishEnding(choice){if(!this.finished||!['restore','release'].includes(choice))return false;this.ending=choice;this.save();this.emit('credits',{choice});return true;}
  castSkill(){
    if(this.paused||this.player.respawning||this.combat.remaining('special'))return false;
    const ok=this.performSkill();if(ok){this.cancelHeal();this.combat.releaseShield();this.combat.buffer=null;this.combat.commit('special');this.party[this.activeSlot].skillCooldown=Math.max(this.party[this.activeSlot].skillCooldown,COMBAT.reuse.special);}return ok;
  }
  releaseSpecial(){
    const shots=this.projectiles.length,held=this.player.specialHeld;super.releaseSpecial();
    if(held&&this.projectiles.length>shots){this.combat.commit('special');this.party[this.activeSlot].skillCooldown=Math.max(this.party[this.activeSlot].skillCooldown,COMBAT.reuse.special);}
  }
  performSkill(){
    if(!['mycora','lumivern','chronowl'].includes(this.data.id))return super.castSkill();
    const p=this.player,m=this.party[this.activeSlot];if(m.skillCooldown||p.spirit<25||p.attack)return false;
    m.skillCooldown=32;p.spirit-=25;this.cancelHeal();
    const directed=this.inputs.left||this.inputs.right||this.inputs.up||this.inputs.down;
    if(directed){
      p.face=this.inputs.left?-1:this.inputs.right?1:p.face;
      if(this.data.id==='mycora'){p.dash=12;p.dashCooldown=28;p.armor=1;this.skillStrike={life:16,damage:28,element:'Earth',owner:this.activeSlot,hit:new Set()};}
      if(this.data.id==='lumivern')for(const e of this.enemies)if(e.hp>0&&(e.x-p.x)*p.face>-20&&(e.x-p.x)*p.face<240){this.strike(e,32,p.face,{element:'Electric',heavy:true});e.stun+=15;}
      if(this.data.id==='chronowl'){p.dash=8;p.dashCooldown=25;p.invul=8;this.skillStrike={life:12,damage:32,element:'Ice',owner:this.activeSlot,hit:new Set()};}
      this.effects.push({type:'swap',x:p.x,y:p.y-35,life:25});this.emit('cast');return true;
    }
    if(this.data.id==='mycora'){this.zones.push({type:'wind',x:p.x+p.face*110,y:p.y,radius:200,life:150,owner:this.activeSlot});for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<200){this.strike(e,25,p.face,{heavy:true});e.stun=50;}p.hp=Math.min(p.maxHp,p.hp+.5);}
    if(this.data.id==='lumivern')for(let i=0;i<5;i++)this.projectiles.push({x:p.x,y:p.y-30-i*8,vx:p.face*11,vy:(i-2)*1.2,life:70,homing:true,kind:'needle',damage:9,color:this.data.color,element:'Electric',owner:this.activeSlot,hit:new Set()});
    if(this.data.id==='chronowl')for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<300){this.strike(e,30,p.face,{heavy:true,element:'Ice'});e.stun=e.boss?30:100;e.slow=240;}
    this.effects.push({type:'swap',x:p.x,y:p.y-40,life:35});this.say(this.data.skill.toUpperCase());this.emit('cast');return true;
  }
  updateEnemies(){
    const frameEnemies=this.enemies;
    for(const e of frameEnemies){
      if(this.enemies!==frameEnemies||this.player.respawning)return;
      if(e.hp<=0){if(e.deathTimer>0)e.deathTimer--;continue;}
      if(this.combat.updateEnemy(e))continue;
      const shotStart=this.enemyShots.length,hazardStart=this.hazards.length,waveStart=this.waves.length;
      if(e.boss)this.updateBoss(e);
      else if(['sinder','voltlet','pebbleback','dewdrop','sproutlet'].includes(e.kind))this.updateMinion(e);
      else this.updateWild(e);
      if(e.summonedBy){for(const shot of this.enemyShots.slice(shotStart))shot.bossOwner=e.summonedBy;for(const h of this.hazards.slice(hazardStart))h.bossOwner=e.summonedBy;for(const wave of this.waves.slice(waveStart))wave.bossOwner=e.summonedBy;}
    }
  }
  updateWild(e){
    if(updateDungeonMinion(this,e))return;
    const p=this.player,d=MINIONS[e.kind];if(!d||Math.abs(e.x-p.x)>1000||Math.abs((e.baseY??520)-p.y)>600)return;this.discovered.add(e.kind);if(e.flash)e.flash--;if(e.slow)e.slow--;
    if(e.stun>0){e.stun--;e.x=clamp(e.x+e.vx,e.left,e.right);e.vx*=.75;return;}
    const dx=p.x-e.x,dist=Math.abs(dx);e.face=dx>0?1:-1;e.timer--;
    const flying=['ashwing','inkfin','stormkite'].includes(e.kind);if(flying)e.y=(e.baseY??520)-80+Math.sin(this.tick*.04+e.id)*40;
    if(e.state==='patrol'){e.x=clamp(e.x+e.face*d.speed*(e.slow?.5:1),e.left,e.right);if(e.timer<=0&&dist<550){e.state='windup';e.timer=26;}}
    else if(e.state==='windup'&&e.timer<=0){
      if(e.kind==='riftling'){e.x=clamp(p.x-p.face*75,e.left,e.right);e.state='charge';e.timer=18;this.effects.push({type:'mist',x:e.x,y:e.y-40,life:30});}
      else{for(const spread of e.kind==='thornling'?[-.35,0,.35]:[0]){const dy=p.y-30-e.y+30,angle=Math.atan2(dy,dx)+spread;this.enemyShots.push({x:e.x,y:e.y-30,vx:Math.cos(angle)*6,vy:Math.sin(angle)*6,life:120,color:d.color});}e.state='recover';e.timer=48;}
    }else if(e.state==='charge'){e.x+=e.face*10;if(e.timer<=0){e.state='recover';e.timer=40;}}
    else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=55;}
    if(dist<35&&Math.abs(p.y-e.y)<65)this.hurt(Math.sign(p.x-e.x),1,e.kind==='frostmite'?{slow:100}:{});
  }
  updateBoss(e){updateBossEncounter(this,e);}
  snapshot(){const s=super.snapshot();return {...s,mode:'campaign',worldSeed:this.worldSeed,recoveryPoints:this.recoveryPoints.map(r=>({...r})),spentRecovery:[...this.spentRecovery],discoveredRecovery:[...this.discoveredRecovery],death:this.death?structuredClone(this.death):null,safeRest:{...this.safeRest},combat:this.combat.snapshot(),room:this.roomId,roomName:this.room.name,biome:this.room.biome,chapter:CHAPTERS[Math.min(this.fragments.size,5)].title,abilities:[...this.abilities],fragments:[...this.fragments],unlocked:[...this.unlocked],visited:[...this.visited],inventory:{...this.inventory},charms:[...this.charms],equipped:[...this.equipped],memories:[...this.memories],shrines:[...this.shrines],combo:this.combo,finished:this.finished,ending:this.ending,playtime:this.playtime,bossHazards:(this.bossHazards||[]).map(h=>structuredClone(h)),enemies:this.enemies.map(e=>({id:e.id,boss:e.boss,kind:e.kind,hp:e.hp,maxHp:e.maxHp,state:e.state,x:e.x,y:e.y,phase:e.phase,timer:e.timer,pressureReady:!!e.pressureReady,pressure:e.pressure?{...e.pressure}:null,postureLock:e.postureLock||0,guarding:!!e.guarding,berserk:!!e.berserk,healUsed:!!e.healUsed,healChannel:e.healChannel?{...e.healChannel}:null,counterMotion:e.counterMotion?{...e.counterMotion}:null,counterState:e.counterState||null,moveId:e.moveId,moveName:e.moveName,attackKind:e.attackKind,counter:e.counter,hint:e.hint,attackFrame:e.attackFrame,windupFrames:e.windupFrames,summonedBy:e.summonedBy,telegraph:e.telegraph?structuredClone(e.telegraph):null})),nearby:this.room.objects.filter(o=>Math.abs(o.x-this.player.x)<100).map(o=>o.id)};}
}
