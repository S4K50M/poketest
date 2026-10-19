import { TrainingEngine, MOTOR } from './training.js';
import { ROSTER, findFighter } from './roster.js';
import { MINIONS } from './designs.js';
import { ROOMS, BOSSES, CHAPTERS, ABILITIES, CHARMS, DIALOGUES, DEFAULT_PARTY } from './world.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,a,b,fallback=0)=>Number.isFinite(v)?clamp(v,a,b):fallback;
export const CAMPAIGN_MOTOR={...MOTOR,run:8.4,acceleration:2.4,friction:2.8,gravity:.68,jump:-15.3,doubleJump:-13.5,dash:20,dashFrames:10,dashCooldown:21};
const starterIds=ROSTER.slice(0,8).map(d=>d.id);

export class CampaignEngine extends TrainingEngine{
  constructor(party=DEFAULT_PARTY,options={}){
    super(party,options);this.campaign=true;this.motor={...CAMPAIGN_MOTOR};this.onSave=options.onSave||(()=>{});
    this.abilities=new Set(['dash']);this.unlocked=new Set(starterIds);this.fragments=new Set();this.visited=new Set();this.opened=new Set();this.defeated=new Set();this.memories=new Set();this.shrines=new Set();
    this.inventory={heartwood:0,ember:0,pearl:0,stormglass:0,frostcore:0,riftglass:0,flask:3,pickaxe:1,lantern:1};
    this.charms=new Set();this.equipped=[];this.tools=['pickaxe','lantern'];this.toolIndex=0;this.roomId='sanctuary';this.storyStage=0;this.finished=false;this.ending=null;this.playtime=0;this.combo=0;this.comboTimer=0;this.attackBuffer=null;this.swingIndex=0;this.transition=0;this.grapple=null;this.landing=0;this.tutorial=0;
    this.loadRoom('sanctuary',150,false);
    if(options.save)this.loadSave(options.save);
  }
  save(){
    const state={version:2,room:this.roomId,checkpoint:{...this.checkpoint},party:this.party.map(m=>({id:m.data.id,hp:m.hp,maxHp:m.maxHp,spirit:m.spirit})),activeSlot:this.activeSlot,level:this.level,xp:this.xp,lumens:this.lumens,upgrades:this.upgrades,
      abilities:[...this.abilities],unlocked:[...this.unlocked],fragments:[...this.fragments],visited:[...this.visited],opened:[...this.opened],defeated:[...this.defeated],memories:[...this.memories],shrines:[...this.shrines],inventory:{...this.inventory},charms:[...this.charms],equipped:[...this.equipped],discovered:[...this.discovered],stats:{...this.stats},playtime:this.playtime,storyStage:this.storyStage,finished:this.finished,ending:this.ending};
    this.onSave(state);return state;
  }
  loadSave(s){
    // A corrupt or old save must never destroy a playable fresh campaign.
    if(!s||s.version!==2||!Array.isArray(s.party)||s.party.length!==3||s.party.some(m=>!m||typeof m.id!=='string')||new Set(s.party.map(m=>m.id)).size!==3||s.party.some(m=>!ROSTER.some(d=>d.id===m.id))||!Object.hasOwn(ROOMS,s.room))return false;
    const requestedUnlocks=new Set([...starterIds,...(Array.isArray(s.unlocked)?s.unlocked:[])]);if(s.party.some(m=>!requestedUnlocks.has(m.id)))return false;
    const list=(key,valid)=>new Set(Array.isArray(s[key])?s[key].filter(x=>typeof x==='string'&&(!valid||valid(x))):[]);
    this.fragments=list('fragments',x=>!!BOSSES[x]);this.abilities=new Set(['dash',...list('abilities',x=>!!ABILITIES[x])]);
    this.unlocked=new Set([...starterIds,...list('unlocked',x=>ROSTER.some(d=>d.id===x))]);
    if(s.party.some(m=>!this.unlocked.has(m.id)))return false;
    this.level=finite(s.level,1,5,1);this.xp=finite(s.xp,0,300);this.lumens=finite(s.lumens,0,99999);this.upgrades=finite(s.upgrades,0,3);
    this.party=s.party.map(m=>{const data=findFighter(m.id),maxHp=data.maxHp+this.level-1+this.upgrades;return {data,maxHp,hp:finite(m.hp,0,maxHp,maxHp),spirit:finite(m.spirit,0,100,100),skillCooldown:0};});
    this.activeSlot=Math.floor(finite(s.activeSlot,0,2));if(!this.party.some(m=>m.hp>0))this.restoreParty();if(!this.party[this.activeSlot].hp)this.activeSlot=this.party.findIndex(m=>m.hp>0);
    for(const key of ['visited','opened','defeated','memories','shrines'])this[key]=list(key);this.discovered=list('discovered',x=>!!MINIONS[x]);
    for(const key of Object.keys(this.inventory))this.inventory[key]=Math.floor(finite(s.inventory?.[key],0,999,0));this.inventory.pickaxe=1;this.inventory.lantern=1;
    this.charms=list('charms',x=>!!CHARMS[x]);this.equipped=Array.isArray(s.equipped)?[...new Set(s.equipped)].filter(x=>this.charms.has(x)).slice(0,2):[];
    this.playtime=finite(s.playtime,0,99999999);this.storyStage=finite(s.storyStage,0,20);this.finished=!!s.finished;this.ending=['restore','release'].includes(s.ending)?s.ending:null;
    for(const key of Object.keys(this.stats))this.stats[key]=finite(s.stats?.[key],0,99999999);
    this.loadRoom(s.room,finite(s.checkpoint?.x,80,ROOMS[s.room].width-80,150),false);return true;
  }
  loadRoom(id,spawn=150,persist=true){
    if(!Object.hasOwn(ROOMS,id))return false;
    this.roomId=id;this.room=ROOMS[id];this.worldWidth=this.room.width;this.platforms=this.room.platforms.map(p=>({...p}));this.thorns=this.room.thorns||[];this.visited.add(id);
    this.enemies=this.room.enemies.map((spec,n)=>{
      const boss=spec.boss&&BOSSES[spec.boss],d=MINIONS[spec.kind],key=id+':'+n;
      return {id:n,key,kind:spec.kind,boss:spec.boss,x:spec.x,y:520,baseY:520,home:spec.x,hp:this.defeated.has(key)||spec.boss&&this.fragments.has(spec.boss)?0:boss?.hp||d.hp,maxHp:boss?.hp||d.hp,face:-1,state:'patrol',timer:70,flash:0,stun:0,vx:0,slow:0,flipped:0,left:spec.boss?660:Math.max(350,spec.x-190),right:spec.boss?1740:Math.min(this.worldWidth-220,spec.x+190),pattern:0,phase:1,rewarded:this.defeated.has(key)};
    });
    this.relics=this.room.relics.map(r=>({...r,collected:this.opened.has(r.id)}));this.bell={x:-5000,y:430,r:24,flash:0};
    this.projectiles=[];this.enemyShots=[];this.waves=[];this.hazards=[];this.zones=[];this.effects=[];this.decoy=null;this.skillStrike=null;this.attackBuffer=null;this.grapple=null;
    const p=this.player;this.cancelHeal();Object.assign(p,{x:spawn,y:520,vx:0,vy:0,grounded:true,jumpCount:0,jumpBuffer:0,dash:0,dashCooldown:0,wall:0,wallLock:0,attack:null,airDashes:0,respawning:0,slow:0,root:0,slick:0,burn:0,guard:0,armor:0,fortress:false,specialHeld:false,skillVector:null,invul:30});
    for(const o of this.room.objects)if(o.kind==='lever'&&this.opened.has(id+':'+o.id))this.platforms.push({...o.bridge});
    this.checkpoint={x:spawn,y:520};this.transition=100;this.roomTime=0;this.emit('room',{room:id});if(persist)this.save();return true;
  }
  input(action){
    if(this.paused||this.phase!=='playing'||this.player.respawning)return false;
    const p=this.player;
    if(action==='interact')return this.interact();
    if(action==='tool')return this.useTool();
    if(action==='toolCycle')return this.cycleTool();
    if(action==='potion')return this.useFlask();
    if(action==='grapple')return this.useGrapple();
    if(action==='light'||action==='heavy'){
      this.cancelHeal();
      if(p.attack||p.dash){this.attackBuffer={action,life:10};return true;}
      const heavy=action==='heavy';this.swingIndex=(this.swingIndex+1)%3;
      p.attack={type:action,frame:0,start:heavy?5:2,active:heavy?5:4,recovery:heavy?9:5,dir:this.inputs.down&&!p.grounded?'down':this.inputs.up?'up':'side',hit:new Set(),swing:this.swingIndex};
      p.armor=heavy&&['pyrojaw','terrakhan','ferrodrake'].includes(this.data.id)?1:0;
      if(p.grounded)p.vx+=p.face*(heavy?2.5:1.5);this.emit('slash');return true;
    }
    if(action==='dash'&&p.attack){if(p.attack.frame<p.attack.start+2)return false;p.attack=null;}
    if(action==='dash'&&!p.grounded&&!this.abilities.has('dash'))return false;
    if(action==='upgrade'){const ok=this.buyUpgrade();if(ok)this.save();return ok;}
    const accepted=super.input(action);if(accepted&&action==='dash')p.dashCooldown=this.abilities.has('blink')?14:21;return accepted;
  }
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
    this.playtime++;this.roomTime++;this.motor.run=CAMPAIGN_MOTOR.run*(this.equipped.includes('feather')?1.12:1);this.motor.dashCooldown=this.abilities.has('blink')?14:21;
    if(this.transition>0)this.transition--;if(this.comboTimer>0)this.comboTimer--;else this.combo=0;if(this.landing>0)this.landing--;
    if(this.attackBuffer){if(--this.attackBuffer.life<=0)this.attackBuffer=null;else if(!this.player.attack&&!this.player.dash){const a=this.attackBuffer.action;this.attackBuffer=null;this.input(a);}}
    const wasGrounded=this.player.grounded,vy=this.player.vy;
    // Moving platforms carry grounded actors. Violet veils only yield during an awakened dash.
    for(const block of this.platforms)if(block.moving){const before=block.x;block.x=block.origin+Math.sin(this.tick*block.rate)*block.amplitude;if(this.player.grounded&&Math.abs(this.player.y-block.y)<2&&this.player.x>before-10&&this.player.x<before+block.w+10)this.player.x+=block.x-before;}
    const allPlatforms=this.platforms;
    if(this.abilities.has('blink')&&this.player.dash>0)this.platforms=this.platforms.filter(b=>!b.veil);
    super.step();this.platforms=allPlatforms;
    for(const h of this.hazards)if(['root','lightning','stasis'].includes(h.type)){
      h.timer--;if(h.timer===0)this.emit('slam');
      if(h.timer<=0&&h.timer>-18&&Math.abs(this.player.x-h.x)<(h.type==='stasis'?100:38)&&(h.type==='lightning'||this.player.y>460))this.hurt(Math.sign(this.player.x-h.x),1,h.type==='stasis'?{slow:150}:h.type==='root'?{root:18}:{});
    }
    if(this.equipped.includes('pulse'))this.player.spirit=Math.min(100,this.player.spirit+.06);
    if(!wasGrounded&&this.player.grounded&&vy>4){this.landing=10;this.effects.push({type:'land',x:this.player.x,y:this.player.y,life:20});this.emit('land');}
    if(this.grapple){const p=this.player,g=this.grapple,dx=g.x-p.x,dy=g.y-p.y,len=Math.hypot(dx,dy);p.x+=dx*.18;p.y+=dy*.18;p.vx=dx*.12;p.vy=dy*.12;p.grounded=false;p.airDashes=0;p.dashCooldown=0;p.jumpCount=1;if(len<42||--g.life<=0){this.grapple=null;p.vy=-12;p.vx=p.face*10;this.emit('grapple');}}
  }
  updateLesson(){
    // Room progression replaces the old six tutorial gates entirely.
    for(const r of this.relics)if(r.collected&&!this.opened.has(r.id)){this.opened.add(r.id);this.inventory[CHAPTERS.find(c=>c.id===this.room.biome)?BOSSES[CHAPTERS.find(c=>c.id===this.room.biome).boss].material:'heartwood']+=2;this.save();}
    const p=this.player;
    if(this.roomId==='sanctuary'&&this.storyStage===0&&p.x>330){this.storyStage=1;this.showDialogue(DIALOGUES.vell);}
    const boss=this.enemies.find(e=>e.boss&&e.hp>0);
    if(boss&&p.x>760&&!boss.introduced){boss.introduced=true;this.emit('bossintro',{boss:boss.boss});}
    if(p.x<650&&this.roomId==='moss-path'&&this.tutorial<1){this.tutorial=1;this.say('J QUICK STRIKE · K HEAVY · SHIFT DASH · HOLD F TO HEAL');}
  }
  updateAttack(){
    super.updateAttack();
    const a=this.player.attack;if(a&&a.frame===a.start)this.effects.push({type:'slash',x:this.player.x+this.player.face*50,y:this.player.y-35,face:this.player.face,dir:a.dir,heavy:a.type==='heavy',swing:a.swing,life:12});
  }
  strike(e,damage,direction,options={}){
    if(e.hp<=0)return;
    const before=e.hp;const power=this.equipped.includes('fang')?1.22:1;
    super.strike(e,damage*power,direction,options);
    if(e.hp<before){if(e.boss)e.stun=Math.min(e.stun,3);this.hitstop=options.dot?0:options.heavy?3:1;
      if(!options.dot){this.combo++;this.comboTimer=100;this.effects.push({type:'number',x:e.x,y:e.y-80,text:String(Math.round(before-e.hp)),life:35,color:this.data.accent});}
    }
  }
  hurt(direction=0,amount=1,status={}){
    const ok=super.hurt(direction,amount,status);
    if(ok&&this.equipped.includes('thorn'))for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-this.player.x)<180)this.strike(e,18,direction,{heavy:true});
    return ok;
  }
  awardEnemy(e){
    if(e.rewarded)return;super.awardEnemy(e);this.defeated.add(e.key);const ch=CHAPTERS.find(c=>c.id===this.room.biome);
    if(ch)this.inventory[BOSSES[ch.boss].material]++;
    if(e.boss){const b=BOSSES[e.boss];this.fragments.add(e.boss);if(b.reward)this.abilities.add(b.reward);if(b.creature)this.unlocked.add(b.creature);this.inventory[b.material]+=5;this.inventory.flask+=2;this.lumens+=45;this.gainXP(80);this.restoreParty();
      this.say('HEART FRAGMENT RESTORED · '+(b.reward?ABILITIES[b.reward].name.toUpperCase():'THE WORLDHEART IS AWAKE'));this.emit('bossdefeated',{boss:e.boss});
      if(e.boss==='crown'){this.finished=true;this.emit('ending');}
    }
    this.save();
  }
  respawn(wipe=false){super.respawn(wipe);this.grapple=null;for(const e of this.enemies)if(e.hp>0&&e.boss){e.hp=e.maxHp;e.phase=1;e.pattern=0;}this.save();}
  interact(){
    const p=this.player,near=this.room.objects.filter(o=>Math.abs(p.x-o.x)<100&&Math.abs(p.y-(o.y||520))<100).sort((a,b)=>Math.hypot(p.x-a.x,p.y-(a.y||520))-Math.hypot(p.x-b.x,p.y-(b.y||520)))[0];
    if(!near){this.say('FIND A BENCH, DOOR, OR TRAVELER · E TO INTERACT');return false;}
    const key=this.roomId+':'+near.id;
    if(near.kind==='lever'){if(this.opened.has(key)){this.say('THE ROOTBRIDGE IS ALREADY RAISED');return false;}this.opened.add(key);this.platforms.push({...near.bridge});this.say('ROOTBRIDGE RAISED · THE WAY REMEMBERS');this.emit('slam');this.save();return true;}
    if(near.kind==='npc'&&near.talk!=='vell'){this.showDialogue(DIALOGUES[near.talk]);return true;}
    if(near.kind==='npc'){const chapter=CHAPTERS[Math.min(this.fragments.size,5)];this.storyStage=Math.max(1,this.storyStage);this.showDialogue(this.fragments.size?[['Professor Vell',chapter.story],['Professor Vell','The sanctuary remembers every companion you rescue. Change your party at a bench, craft at the workbench, and follow the new portal.']]:DIALOGUES.vell);return true;}
    if(near.kind==='bench'){
      this.checkpoint={x:near.x,y:near.y||520};this.restoreParty();this.say('WAYLIGHT KINDLED · PARTY RESTORED · PROGRESS SAVED');this.emit('bench');this.save();return true;
    }
    if(near.kind==='workbench'){this.emit('workbench');return true;}
    if(near.kind==='memory'){if(!this.memories.has(key)){this.memories.add(key);this.gainXP(30);}const [name,text]=near.text.split('|');this.showDialogue([[name,text]]);this.save();return true;}
    if(near.kind==='cache'){if(this.opened.has(key)){this.say('THIS CACHE HAS ALREADY BEEN CLAIMED');return false;}this.opened.add(key);this.inventory[near.material]+=near.rare?7:3;this.inventory.flask++;this.lumens+=near.rare?35:15;this.say('CACHE FOUND · MATERIALS + FLASK + LUMENS');this.emit('relic');this.save();return true;}
    if(near.kind==='ore'){this.say('CRACKED ORE · T TO USE YOUR RESONANCE PICK');return this.useTool('pickaxe');}
    if(near.kind==='shrine'){this.say('AN ECHO HIDES HERE · USE THE ECHO LANTERN WITH T');return this.useTool('lantern');}
    if(near.kind==='door'||near.kind==='portal'){
      if(near.need>this.fragments.size){this.say('THE PORTAL NEEDS '+near.need+' HEART FRAGMENTS');return false;}
      if(near.ability&&!this.abilities.has(near.ability)){this.say('SEALED PATH · REQUIRES '+ABILITIES[near.ability].name.toUpperCase());return false;}
      if(near.boss&&!this.fragments.has(near.boss)){this.say('THE GUARDIAN STILL HOLDS THIS DOOR');return false;}
      return this.loadRoom(near.to);
    }
    return false;
  }
  showDialogue(lines){this.emit('dialogue',{lines});}
  useFlask(){const p=this.player;if(!this.inventory.flask||p.hp>=p.maxHp){this.say(!this.inventory.flask?'NO FLASKS · CRAFT MORE AT A WORKBENCH':'ALREADY AT FULL HEALTH');return false;}this.inventory.flask--;p.hp=Math.min(p.maxHp,p.hp+3);this.effects.push({type:'heal',x:p.x,y:p.y-30,life:35});this.emit('heal');this.save();return true;}
  cycleTool(){this.toolIndex=(this.toolIndex+1)%this.tools.length;this.say('TOOL · '+this.tools[this.toolIndex].toUpperCase());return true;}
  useTool(tool=this.tools[this.toolIndex]){
    const p=this.player;
    if(tool==='pickaxe'){
      const ore=this.room.objects.find(o=>o.kind==='ore'&&Math.abs(p.x-o.x)<110&&!this.opened.has(this.roomId+':'+o.id));
      if(!ore){this.say('RESONANCE PICK · FIND A CRACKED ORE VEIN');return false;}
      this.opened.add(this.roomId+':'+ore.id);this.inventory[ore.material]+=4;this.lumens+=12;this.effects.push({type:'burst',x:ore.x,y:480,life:40});this.emit('slam');this.say('ORE SHATTERED · +4 MATERIALS / +12 LUMENS');this.save();return true;
    }
    const shrine=this.room.objects.find(o=>o.kind==='shrine'&&Math.hypot(p.x-o.x,p.y-(o.y||520))<130);
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
    if(!this.player.grounded||!this.room.objects.some(o=>['bench','workbench'].includes(o.kind)&&Math.abs(this.player.x-o.x)<110&&Math.abs(this.player.y-(o.y||520))<60)){this.say('RETURN TO A WAYLIGHT OR THE MENDER’S WORKBENCH');return false;}
    if(this.upgrades>=3){this.say('HEARTWOOD CHARM AT MAXIMUM');return false;}
    const cost=24+this.upgrades*20;if(this.lumens<cost){this.say(`HEARTWOOD CHARM NEEDS ${cost} LUMENS`);return false;}
    this.lumens-=cost;this.upgrades++;for(const m of this.party){m.maxHp++;if(m.hp>0)m.hp=Math.min(m.maxHp,m.hp+1);}
    this.say('HEARTWOOD CHARM +'+this.upgrades+' · HEALTH & DAMAGE UP');this.emit('upgrade');this.save();return true;
  }
  craft(id){
    const atBench=this.room.objects.some(o=>['workbench','bench'].includes(o.kind)&&Math.abs(this.player.x-o.x)<110&&Math.abs(this.player.y-(o.y||520))<50);
    if(!atBench){this.say('CRAFT AT A WORKBENCH OR WAYLIGHT BENCH');return false;}
    const cost=id==='flask'?{heartwood:2}:CHARMS[id]?.cost;if(!cost||id!=='flask'&&this.charms.has(id))return false;
    if(Object.entries(cost).some(([key,n])=>this.inventory[key]<n)){this.say('MISSING MATERIALS · EXPLORE CACHES AND ORE VEINS');return false;}
    for(const [key,n] of Object.entries(cost))this.inventory[key]-=n;
    if(id==='flask')this.inventory.flask++;else{this.charms.add(id);if(this.equipped.length<2)this.equipped.push(id);}
    this.say('CRAFTED · '+(id==='flask'?'BRAMBLE FLASK':CHARMS[id].name.toUpperCase()));this.emit('upgrade');this.save();return true;
  }
  equip(id){if(!this.charms.has(id))return false;if(this.equipped.includes(id))this.equipped=this.equipped.filter(x=>x!==id);else if(this.equipped.length<2)this.equipped.push(id);else{this.say('TWO CHARM SLOTS · UNEQUIP A CHARM FIRST');return false;}this.save();return true;}
  replaceParty(slot,id){
    if(!Number.isInteger(slot)||slot<0||slot>2||!this.unlocked.has(id)||this.party.some(m=>m.data.id===id))return false;
    if(!this.room.objects.some(o=>['bench','workbench'].includes(o.kind)&&Math.abs(this.player.x-o.x)<110)){this.say('CHANGE COMPANIONS AT A WAYLIGHT BENCH');return false;}
    const data=findFighter(id),maxHp=data.maxHp+this.level-1+this.upgrades;this.party[slot]={data,maxHp,hp:maxHp,spirit:100,skillCooldown:0};this.save();this.emit('switch');return true;
  }
  fastTravel(id){
    if(id!=='sanctuary'&&!this.visited.has(id)){this.say('DISCOVER THIS WAYLIGHT BEFORE TRAVELING');return false;}
    if(this.enemies.some(e=>e.hp>0&&Math.abs(e.x-this.player.x)<600)){this.say('CLEAR NEARBY ENEMIES BEFORE TRAVELING');return false;}
    if(!this.room.objects.some(o=>o.kind==='bench'&&Math.abs(o.x-this.player.x)<110)){this.say('REST AT A WAYLIGHT BENCH TO FAST TRAVEL');return false;}
    this.restoreParty();return this.loadRoom(id,ROOMS[id].objects.find(o=>o.kind==='bench')?.x||150);
  }
  finishEnding(choice){if(!this.finished||!['restore','release'].includes(choice))return false;this.ending=choice;this.save();this.emit('credits',{choice});return true;}
  castSkill(){
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
    for(const e of this.enemies){if(e.hp<=0)continue;if(e.boss){this.updateBoss(e);continue;}if(['sinder','voltlet','pebbleback','dewdrop','sproutlet'].includes(e.kind)){this.updateMinion(e);continue;}this.updateWild(e);}
  }
  updateWild(e){
    const p=this.player,d=MINIONS[e.kind];if(Math.abs(e.x-p.x)>1000)return;this.discovered.add(e.kind);if(e.flash)e.flash--;if(e.slow)e.slow--;
    if(e.stun>0){e.stun--;e.x=clamp(e.x+e.vx,e.left,e.right);e.vx*=.75;return;}
    const dx=p.x-e.x,dist=Math.abs(dx);e.face=dx>0?1:-1;e.timer--;
    const flying=['ashwing','inkfin','stormkite'].includes(e.kind);if(flying)e.y=440+Math.sin(this.tick*.04+e.id)*40;
    if(e.state==='patrol'){e.x=clamp(e.x+e.face*d.speed*(e.slow?.5:1),e.left,e.right);if(e.timer<=0&&dist<550){e.state='windup';e.timer=26;}}
    else if(e.state==='windup'&&e.timer<=0){
      if(e.kind==='riftling'){e.x=clamp(p.x-p.face*75,e.left,e.right);e.state='charge';e.timer=18;this.effects.push({type:'mist',x:e.x,y:e.y-40,life:30});}
      else{for(const spread of e.kind==='thornling'?[-.35,0,.35]:[0]){const dy=p.y-30-e.y+30,angle=Math.atan2(dy,dx)+spread;this.enemyShots.push({x:e.x,y:e.y-30,vx:Math.cos(angle)*6,vy:Math.sin(angle)*6,life:120,color:d.color});}e.state='recover';e.timer=48;}
    }else if(e.state==='charge'){e.x+=e.face*10;if(e.timer<=0){e.state='recover';e.timer=40;}}
    else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=55;}
    if(dist<35&&Math.abs(p.y-e.y)<65)this.hurt(Math.sign(p.x-e.x),1,e.kind==='frostmite'?{slow:100}:{});
  }
  updateBoss(e){
    const p=this.player;if(!e.introduced)return;if(e.flash)e.flash--;if(e.slow)e.slow--;
    if(e.stun>0){e.stun--;e.x=clamp(e.x+e.vx,e.left,e.right);e.vx*=.7;return;}
    if(e.hp<e.maxHp*.5&&e.phase===1){e.phase=2;e.state='enrage';e.timer=65;this.emit('enrage');this.say(BOSSES[e.boss].name.toUpperCase()+' · PHASE II');}
    const dx=p.x-e.x,dist=Math.abs(dx);e.timer--;
    if(e.state==='enrage'&&e.timer<=0){e.state='patrol';e.timer=10;}
    if(e.state==='patrol'){
      e.face=dx>0?1:-1;e.x=clamp(e.x+e.face*(e.phase===2?2.8:1.8)*(e.slow?.6:1),e.left,e.right);
      if(e.timer<=0){e.pattern++;e.state='windup';e.timer=e.phase===2?24:36;e.move=e.pattern%3;this.emit('warning');}
    }else if(e.state==='windup'&&e.timer<=0){
      if(e.move===0){e.state='charge';e.timer=24;}
      else if(e.move===1){
        if(e.boss==='briar')for(const n of [-1,0,1])this.hazards.push({type:'root',x:clamp(p.x+n*100,680,1750),y:520,timer:30,life:65});
        else if(e.boss==='conductor')for(const n of [-1,0,1])this.hazards.push({type:'lightning',x:clamp(p.x+n*150,680,1750),y:520,timer:32,life:66});
        else if(e.boss==='hourglass')for(const n of [-1,1])this.hazards.push({type:'stasis',x:clamp(e.x+n*140,680,1750),y:520,timer:34,life:75});
        else if(e.boss==='leviathan'){for(const spread of [-.22,0,.22]){const ang=Math.atan2(p.y-35-(e.y-80),p.x-e.x)+spread;this.enemyShots.push({x:e.x,y:e.y-80,vx:Math.cos(ang)*7,vy:Math.sin(ang)*7,life:130,color:BOSSES[e.boss].color,status:{slick:120}});}}
        else for(const side of [-1,1])this.waves.push({x:e.x,y:520,vx:side*(e.phase===2?10:7),life:100,color:BOSSES[e.boss].color});
        e.state='recover';e.timer=38;this.emit('slam');} 
      else{const count=e.boss==='crown'?9:e.phase===2?7:5;for(let i=0;i<count;i++){const angle=-Math.PI+(i/(count-1))*Math.PI;this.enemyShots.push({x:e.x,y:e.y-85,vx:Math.cos(angle)*6,vy:Math.sin(angle)*6+1.6,life:150,color:BOSSES[e.boss].color,status:e.boss==='hourglass'?{slow:120}:e.boss==='leviathan'?{slick:100}:{burn:65}});}e.state='recover';e.timer=44;this.emit('cast');}
    }else if(e.state==='charge'){e.x=clamp(e.x+e.face*(e.phase===2?15:11),e.left,e.right);if(this.tick%3===0)this.effects.push({type:'bossTrail',x:e.x,y:e.y,color:BOSSES[e.boss].color,life:20});if(e.timer<=0){e.state='recover';e.timer=42;}}
    else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=e.phase===2?18:32;}
    if(dist<62&&Math.abs(p.y-e.y)<110&&e.state!=='recover')this.hurt(Math.sign(p.x-e.x),e.boss==='crown'?1.5:1);
  }
  snapshot(){const s=super.snapshot();return {...s,mode:'campaign',room:this.roomId,roomName:this.room.name,biome:this.room.biome,chapter:CHAPTERS[Math.min(this.fragments.size,5)].title,abilities:[...this.abilities],fragments:[...this.fragments],unlocked:[...this.unlocked],visited:[...this.visited],inventory:{...this.inventory},charms:[...this.charms],equipped:[...this.equipped],memories:[...this.memories],shrines:[...this.shrines],combo:this.combo,finished:this.finished,ending:this.ending,playtime:this.playtime,enemies:this.enemies.map(e=>({id:e.id,boss:e.boss,kind:e.kind,hp:e.hp,maxHp:e.maxHp,state:e.state,x:e.x,y:e.y,phase:e.phase})),nearby:this.room.objects.filter(o=>Math.abs(o.x-this.player.x)<100).map(o=>o.id)};}
}
