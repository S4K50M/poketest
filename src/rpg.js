import './rpg-world.js';
import { CampaignEngine } from './campaign.js';
import { updateBossEncounter } from './difficulty.js';
import { AdventureSystems } from './adventure.js';
import { ROSTER } from './roster.js';
import { ROOMS, BOSSES, BIOMES, DIALOGUES } from './world.js';
import { MINIONS } from './designs.js';
import { QUESTS, FACTIONS, CHRONICLE_BOSSES, NPC_DIALOGUES, HISTORY, FACTION_CHOICE, CHRONICLE_ITEMS } from './chronicle.js';
import { TALENTS, EQUIPMENT, SHOP, BOND_RANKS, HUNT_TYPES } from './rpg-data.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const number=(n,min=0,max=999999)=>Number.isFinite(n)?clamp(n,min,max):min;
const array=value=>Array.isArray(value)?value:[];
const own=(obj,key)=>typeof key==='string'&&Object.hasOwn(obj,key);

/** RPG state is separate from the fixed-step platform/combat kernel. */
export class RPGCampaign extends CampaignEngine{
  constructor(party,options={}){
    super(party,{...options,save:null,onSave:()=>{}});
    this.persist=options.onSave||(()=>{});this.quests={};this.trackedQuest=null;this.faction=null;this.reputation={wardens:0,chorus:0,unwritten:0};
    this.talents=new Set();this.talentPoints=2;this.gear=[{id:'starter-relic',template:'travelersSeal'},{id:'starter-armor',template:'lanternCoat'}];this.loadout={relic:'starter-relic',armor:'starter-armor'};this.lootSerial=0;
    this.companionXP=Object.fromEntries(ROSTER.map(d=>[d.id,0]));this.surge=0;this.directHits=0;this.revivalUsed=false;this.defeatedBosses=new Set();this.historyKnown=new Set(['first-pulse']);this.trueEnding=null;this.keepsakes=new Set();this.questFlags=new Set();this.worldDrops=[];this.dropArchive={};this.eventCleared=new Set();this.worldEvent=null;this.worldEffects=[];this.shopStock=Object.fromEntries(Object.entries(SHOP).map(([id,d])=>[id,d.stock]));this.rpgReady=true;
    this.acceptAutostartQuests();if(options.save)this.loadSave(options.save);
  }
  save(){
    const base=super.save();if(!this.rpgReady)return base;
    this.dropArchive[this.roomId]=this.worldDrops.map(d=>({...d}));
    const s={...base,version:4,combat:this.combat.serialize(),expansion:'the-ninth-memory',quests:structuredClone(this.quests),trackedQuest:this.trackedQuest,faction:this.faction,reputation:{...this.reputation},talents:[...this.talents],talentPoints:this.talentPoints,gear:this.gear.map(d=>({...d})),loadout:{...this.loadout},lootSerial:this.lootSerial,companionXP:{...this.companionXP},surge:this.surge,defeatedBosses:[...this.defeatedBosses],historyKnown:[...this.historyKnown],trueEnding:this.trueEnding,keepsakes:[...this.keepsakes],questFlags:[...this.questFlags],dropArchive:structuredClone(this.dropArchive),eventCleared:[...this.eventCleared],shopStock:{...this.shopStock}};
    this.persist(s);return s;
  }
  loadSave(s){
    if(!s||![2,3,4].includes(s.version))return false;
    this.loading=true;const loaded=super.loadSave({...s,version:2,fragments:array(s.fragments).filter(id=>!own(CHRONICLE_BOSSES,id))});this.loading=false;if(!loaded)return false;
    // v2 saves keep their main journey and receive the new systems at sensible defaults.
    if(s.version>=3){
      this.quests={};for(const [id,q] of Object.entries(s.quests||{}))if(own(QUESTS,id)&&['active','ready','complete'].includes(q?.state))this.quests[id]={state:q.state,progress:QUESTS[id].objectives.map((o,i)=>Math.floor(number(q.progress?.[i],0,o.count||1)))};
      this.trackedQuest=own(this.quests,s.trackedQuest)?s.trackedQuest:null;this.faction=own(FACTIONS,s.faction)?s.faction:null;
      for(const id of Object.keys(this.reputation))this.reputation[id]=number(s.reputation?.[id],0,100);
      this.talents=new Set((Array.isArray(s.talents)?s.talents:[]).filter(id=>own(TALENTS,id)));this.talentPoints=Math.floor(number(s.talentPoints,0,30));
      const ids=new Set();this.gear=(Array.isArray(s.gear)?s.gear:[]).filter(d=>d&&typeof d.id==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(d.id)&&own(EQUIPMENT,d.template)&&!ids.has(d.id)&&ids.add(d.id)).slice(0,100).map(d=>({id:d.id,template:d.template}));
      this.loadout={relic:null,armor:null};for(const slot of ['relic','armor'])if(this.gear.some(d=>d.id===s.loadout?.[slot]&&EQUIPMENT[d.template].slot===slot))this.loadout[slot]=s.loadout[slot];
      this.lootSerial=Math.floor(number(s.lootSerial,0,99999));for(const id of Object.keys(this.companionXP))this.companionXP[id]=number(s.companionXP?.[id],0,1000);
      this.surge=number(s.surge,0,100);this.defeatedBosses=new Set(array(s.defeatedBosses).filter(id=>own(CHRONICLE_BOSSES,id)));this.historyKnown=new Set(array(s.historyKnown).filter(id=>HISTORY.some(h=>h.id===id)));this.questFlags=new Set(array(s.questFlags).filter(id=>typeof id==='string'));this.trueEnding=own(FACTIONS,s.trueEnding)?s.trueEnding:null;
      this.keepsakes=new Set((Array.isArray(s.keepsakes)?s.keepsakes:[]).filter(id=>own(CHRONICLE_ITEMS,id)));
      this.eventCleared=new Set(array(s.eventCleared).filter(id=>own(ROOMS,id)));this.dropArchive={};for(const [room,drops] of Object.entries(s.dropArchive||{}))if(own(ROOMS,room)&&Array.isArray(drops))this.dropArchive[room]=drops.filter(d=>d&&own(EQUIPMENT,d.template)&&typeof d.id==='string').map(d=>({id:d.id,template:d.template,x:number(d.x,30,ROOMS[room].width-30),y:number(d.y,-2400,650)}));
      for(const id of Object.keys(SHOP))this.shopStock[id]=Math.floor(number(s.shopStock?.[id]??SHOP[id].stock,0,SHOP[id].stock));
    }else{this.talentPoints=2+this.level-1;}
    this.worldDrops=(this.dropArchive[this.roomId]||[]).map(d=>({...d}));this.message='';this.messageTime=0;this.applyFactionBoon();if(s.party.some(m=>m.hp>0))this.party.forEach((m,i)=>{if(Number.isFinite(s.party[i].hp))m.hp=clamp(s.party[i].hp,0,m.maxHp);});if(!this.player.hp)this.activeSlot=this.party.findIndex(m=>m.hp>0);this.acceptAutostartQuests();this.refreshKnowledge();this.combat.load(s.combat);return true;
  }
  loadRoom(id,spawn=150,persist=true){
    if(this.rpgReady){this.dropArchive[this.roomId]=this.worldDrops.map(d=>({...d}));this.worldEvent=null;this.worldEffects=[];}
    const result=super.loadRoom(id,spawn,false);if(!result)return false;
    if(this.rpgReady){for(const e of this.enemies)if(e.boss&&own(CHRONICLE_BOSSES,e.boss)){e.left=Math.max(800,e.home-420);e.right=Math.min(this.worldWidth-130,e.home+380);e.introX=e.home-550;}this.worldDrops=(this.dropArchive[id]||[]).map(d=>({...d}));this.revivalUsed=false;if(!this.loading){this.recordObjective('visit',id);this.refreshKnowledge();if(persist)this.save();}}
    return result;
  }
  atBench(){const p=this.player;return !!(p.grounded&&this.room.objects.some(o=>['bench','workbench'].includes(o.kind)&&Math.abs(p.x-o.x)<110&&Math.abs(p.y-(o.y??520))<55));}
  fastTravel(id){if(!this.atBench()){this.say('REACH A WAYLIGHT ON THE SAME GROUND TO TRAVEL');return false;}if(!ROOMS[id]?.objects.some(o=>o.kind==='bench')){this.say('THIS PLACE HAS NO WAYLIGHT · USE ITS DOOR');return false;}return super.fastTravel(id);}
  replaceParty(slot,id){if(!this.atBench()){this.say('REST AT A WAYLIGHT TO CHANGE COMPANIONS');return false;}const ok=super.replaceParty(slot,id);if(ok)this.applyFactionBoon();return ok;}
  runMultiplier(){return (this.talents?.has('fleet')?1.1:1)*(1+this.equipmentMods().speed);}
  equipmentMods(){const mods={damage:0,armor:0,speed:0,focus:0,surge:0};for(const id of Object.values(this.loadout||{})){const item=this.gear?.find(d=>d.id===id);if(item)for(const [key,n] of Object.entries(EQUIPMENT[item.template].mods))mods[key]=(mods[key]||0)+n;}return mods;}
  bondRank(id=this.data.id){const xp=this.companionXP?.[id]||0;return BOND_RANKS.filter(r=>xp>=r.need).length-1;}
  skillPower(){return super.skillPower()*(1+(this.talents?.has('ferocity')?.12:0)+(this.rpgReady?this.equipmentMods().damage:0));}
  input(action){
    if(action==='surge')return this.castSurge();
    const ok=super.input(action);if(ok&&action==='dash')this.player.dashCooldown=Math.max(8,this.player.dashCooldown-(this.talents.has('fleet')?3:0)-(this.faction==='unwritten'?3:0));return ok;
  }
  switchTo(slot,forced=false){const ok=super.switchTo(slot,forced);if(ok)this.combat.releaseShield();if(ok&&this.rpgReady&&!forced&&this.talents.has('overdrive')&&!this.combat.remaining('assist')){this.combat.commit('assist');for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-this.player.x)<135)this.strike(e,10,this.player.face,{dot:true});this.worldEffects.push({type:'aurora',x:this.player.x,y:this.player.y-35,life:35,maxLife:35});}return ok;}
  strike(e,damage,direction,options={}){
    if(e.boss==='nullheart'&&!this.nullheartReady()){this.say('THE NULLHEART WAITS · AWAKEN THE HOLLOW SOVEREIGN FIRST');return;}
    const hp=e.hp,owner=this.party[options.source??this.activeSlot]?.data.id,frameEnemies=this.enemies;
    let mult=1+(this.rpgReady?BOND_RANKS[this.bondRank(owner)].damage:0);if(this.talents?.has('execution')&&e.hp<e.maxHp*.35)mult*=1.25;
    const previousSource=this.rewardSource;this.rewardSource=owner;try{super.strike(e,damage*mult,direction,options);}finally{this.rewardSource=previousSource;}
    if(this.enemies!==frameEnemies||this.player.respawning)return;
    if(this.rpgReady&&e.hp<hp&&!options.dot){
      const before=this.bondRank(owner);this.companionXP[owner]=Math.min(1000,(this.companionXP[owner]||0)+2);this.surge=Math.min(100,this.surge+3*(this.talents.has('overdrive')?1.4:1)*(1+this.equipmentMods().surge));this.directHits++;if(this.faction==='chorus'){const member=this.party.find(m=>m.data.id===owner);member.spirit=Math.min(100,member.spirit+1.8);}
      if(this.talents.has('siphon')&&this.directHits%5===0)this.player.hp=Math.min(this.player.maxHp,this.player.hp+.5);
      if(this.bondRank(owner)>before){this.say(this.party.find(m=>m.data.id===owner).data.name.toUpperCase()+' · '+BOND_RANKS[this.bondRank(owner)].name);this.emit('awakening',{id:owner});this.worldEffects.push({type:'aurora',x:this.player.x,y:this.player.y-40,life:100,maxLife:100});}
    }
  }
  hurt(direction=0,amount=1,status={}){
    return super.hurt(direction,amount*(1-Math.min(.45,this.equipmentMods().armor)),status);
  }
  preventLethal(amount,direction){
    const p=this.player,blocked=(p.guard>0||p.fortress)&&direction===-p.face;
    if(!this.rpgReady||!this.talents.has('secondchance')||this.revivalUsed||p.invul||p.respawning||blocked||p.hp<=0||p.hp>amount*(p.armor>0?.5:1))return false;
    this.revivalUsed=true;p.hp=1;p.invul=90;p.attack=null;this.cancelHeal();this.combat.releaseShield();this.say('REFUSE THE SILENCE · ONE MORE HEARTBEAT');this.emit('heal');return true;
  }
  gainXP(amount){const before=this.level;super.gainXP(amount);if(this.rpgReady&&this.level>before){this.talentPoints+=this.level-before;this.emit('talentpoint');}}
  step(){
    if(this.paused||this.phase!=='playing')return;
    const heals=this.stats.heals,frameEnemies=this.enemies;super.step();if(!this.rpgReady||this.enemies!==frameEnemies||this.player.respawning)return;
    const mods=this.equipmentMods();this.player.spirit=Math.min(100,this.player.spirit+mods.focus*.4);
    if(this.talents.has('reservoir'))this.party.forEach((m,i)=>{if(i!==this.activeSlot)m.spirit=Math.min(100,m.spirit+.12);});
    if(this.stats.heals>heals&&this.talents.has('stillwater'))this.player.hp=Math.min(this.player.maxHp,this.player.hp+.5);
    this.worldEffects=this.worldEffects.filter(e=>--e.life>0);
    const range=this.talents.has('magnet')?180:58;
    for(const d of [...this.worldDrops])if(Math.hypot(this.player.x-d.x,this.player.y-30-d.y)<range)this.pickupLoot(d.id);
    if(this.roomId.endsWith('-path')&&this.roomTime===900&&!this.eventCleared.has(this.roomId))this.startWorldEvent();
    this.updateWorldEvent();
    if(this.trueEnding&&this.keepsakes.has('blankegg')&&this.tick%180===0){const target=this.enemies.find(e=>e.hp>0&&Math.abs(e.x-this.player.x)<600);if(target)this.projectiles.push({x:this.player.x-35,y:this.player.y-90,vx:this.player.face*8,vy:0,life:85,homing:true,kind:'needle',damage:8,color:'#ffe8b3',element:'Electric',owner:this.activeSlot,hit:new Set()});}
  }
  awardEnemy(e){
    if(e.rewarded)return;
    const beforeCoins=this.lumens;
    if(own(CHRONICLE_BOSSES,e.boss)){
      AdventureSystems.prototype.awardEnemy.call(this,e);this.defeated.add(e.key);this.defeatedBosses.add(e.boss);this.gainXP(100);this.lumens+=55;this.inventory.flask++;this.talentPoints++;this.grantEquipment({palimpsest:'palimpsestKey',belltwin:'bellOath',nullheart:'nullCrown'}[e.boss]);
      this.say('FORBIDDEN MEMORY RESTORED · '+BOSSES[e.boss].name.toUpperCase());this.emit('bossdefeated',{boss:e.boss});
      if(e.boss==='nullheart'){this.trueEnding=this.faction||'unwritten';this.emit('trueending',{faction:this.trueEnding});}
    }else super.awardEnemy(e);
    if(!this.rpgReady)return;
    if(own(CHRONICLE_BOSSES,e.boss)||['candlewraith','clockscarab','oathbound','hushling'].includes(e.kind)){e.state='dying';e.deathTimer=35;}
    if(this.talents.has('magnet'))this.lumens+=Math.ceil((this.lumens-beforeCoins)*.2);
    const source=this.rewardSource||this.data.id;this.companionXP[source]=Math.min(1000,(this.companionXP[source]||0)+(e.boss?35:10));
    this.recordObjective('kill',e.boss||e.kind);
    // Fixed spawn IDs and persistent ground drops prevent reloading for extra loot.
    if(!own(CHRONICLE_BOSSES,e.boss)&&(e.boss||this.stats.minions%3===0)){
      const templates={moss:'thornFang',forge:'ashAegis',reef:'tideCloak',storm:'voltaicCoil',frost:'glassNeedle',rift:'voidShroud'},template=templates[this.room.biome]||'travelersSeal';
      const id=e.key+':relic';if(!this.worldDrops.some(d=>d.id===id))this.worldDrops.push({id,template,x:e.x,y:e.y-28});
    }
    if(this.worldEvent&&this.enemies.filter(n=>n.event&&n.hp>0).length===0)this.resolveWorldEvent();
    this.refreshKnowledge();this.acceptAutostartQuests();this.save();
  }
  grantEquipment(template){if(!own(EQUIPMENT,template))return null;let id;do{id='relic-'+(++this.lootSerial);}while(this.gear.some(d=>d.id===id));const item={id,template};this.gear.push(item);this.say('RELIC FOUND · '+EQUIPMENT[template].name.toUpperCase());this.emit('loot',{template});return item;}
  pickupLoot(id){const d=this.worldDrops.find(d=>d.id===id);if(!d)return false;this.worldDrops=this.worldDrops.filter(n=>n.id!==id);this.grantEquipment(d.template);this.save();return true;}
  equipItem(id){const d=this.gear.find(d=>d.id===id);if(!d)return false;this.loadout[EQUIPMENT[d.template].slot]=this.loadout[EQUIPMENT[d.template].slot]===id?null:id;this.save();return true;}
  salvageItem(id){if(Object.values(this.loadout).includes(id)){this.say('UNEQUIP THIS RELIC BEFORE SALVAGING');return false;}const d=this.gear.find(d=>d.id===id);if(!d)return false;this.lumens+=EQUIPMENT[d.template].value;this.gear=this.gear.filter(n=>n.id!==id);this.save();return true;}
  buyTalent(id){const d=TALENTS[id];if(!d||this.talents.has(id)||this.talentPoints<d.cost||d.requires&&!this.talents.has(d.requires)){this.say('TALENT LOCKED · CHECK POINTS AND THE PREVIOUS NODE');return false;}this.talentPoints-=d.cost;this.talents.add(id);this.say('TALENT AWAKENED · '+d.name.toUpperCase());this.emit('upgrade');this.save();return true;}
  buyItem(id){
    const d=SHOP[id],near=this.room.objects.some(o=>o.kind==='merchant'&&Math.abs(o.x-this.player.x)<115&&Math.abs((o.y??520)-this.player.y)<60&&this.player.grounded);
    if(!near||!d||this.shopStock[id]<=0||this.lumens<d.cost){this.say(!near?'FIND A MERCHANT TO TRADE':'NOT ENOUGH LUMENS OR NO STOCK LEFT');return false;}
    this.lumens-=d.cost;this.shopStock[id]--;if(id==='flask')this.inventory.flask++;else if(id==='insight')this.talentPoints++;else this.grantEquipment(id);this.say('TRADE COMPLETE · '+d.name.toUpperCase());this.emit('upgrade');this.save();return true;
  }
  acceptAutostartQuests(){for(const [id,q] of Object.entries(QUESTS))if(q.autostart||q.autoStart)this.acceptQuest(id,false);}
  questAvailable(id){const q=QUESTS[id];if(!q)return false;return (q.prerequisites||[]).every(k=>this.quests[k]?.state==='complete')&&(!q.needFragments||this.fragments.size>=q.needFragments);}
  acceptQuest(id,persist=true){if(!this.questAvailable(id)||this.quests[id])return false;const q=QUESTS[id];this.quests[id]={state:'active',progress:q.objectives.map(()=>0)};this.trackedQuest??=id;this.refreshQuest(id);if(this.rpgReady){this.say('NEW CHRONICLE · '+q.name.toUpperCase());this.emit('quest',{id});if(persist)this.save();}return true;}
  knownObjective(o){
    if(o.kind==='visit')return this.visited.has(o.target)?1:0;
    if(o.kind==='kill')return this.fragments.has(o.target)||this.defeatedBosses.has(o.target)?1:0;
    if(o.kind==='memory')return this.memories.has(o.target)?1:0;
    if(o.kind==='tool')return this.shrines.has(o.target)||this.opened.has(o.target)?1:0;
    if(o.kind==='craft')return this.charms.has(o.target)?1:0;
    if(o.kind==='faction')return this.faction&&(o.target==='any'||o.target===this.faction)?1:0;
    if(o.kind==='talk')return this.questFlags.has('talk:'+o.target)?1:0;
    return 0;
  }
  refreshQuest(id){const q=QUESTS[id],s=this.quests[id];if(!s||s.state==='complete')return;for(let i=0;i<q.objectives.length;i++)s.progress[i]=Math.max(s.progress[i]||0,Math.min(q.objectives[i].count||1,this.knownObjective(q.objectives[i])));if(q.objectives.every((o,i)=>s.progress[i]>=(o.count||1))){if(s.state!=='ready')this.say('CHRONICLE READY · RETURN TO '+q.giver.toUpperCase());s.state='ready';}}
  recordObjective(kind,target,amount=1){if(!this.rpgReady||this.loading)return;for(const [id,s] of Object.entries(this.quests)){if(s.state==='complete')continue;const q=QUESTS[id];q.objectives.forEach((o,i)=>{if(o.kind===kind&&(o.target===target||o.target==='any'))s.progress[i]=Math.min(o.count||1,s.progress[i]+amount);});this.refreshQuest(id);}}
  claimQuest(id){const s=this.quests[id],q=QUESTS[id];if(!s||s.state!=='ready')return false;s.state='complete';const r=q.reward||{};this.gainXP(r.xp||0);this.lumens+=r.lumens||0;for(const [key,n] of Object.entries(r.materials||{}))if(Object.hasOwn(this.inventory,key))this.inventory[key]+=n;if(r.item&&EQUIPMENT[r.item])this.grantEquipment(r.item);if(r.item&&CHRONICLE_ITEMS[r.item])this.keepsakes.add(r.item);if(r.keepsake)this.keepsakes.add(r.keepsake);if(r.talentPoints)this.talentPoints+=r.talentPoints;if(q.faction&&Object.hasOwn(this.reputation,q.faction))this.reputation[q.faction]=Math.min(100,this.reputation[q.faction]+15);this.questFlags.add(id);if(this.trackedQuest===id)this.trackedQuest=Object.keys(this.quests).find(k=>this.quests[k].state!=='complete')||null;this.say('CHRONICLE COMPLETE · '+q.name.toUpperCase());this.emit('questcomplete',{id});this.refreshKnowledge();this.acceptAutostartQuests();this.save();return true;}
  trackQuest(id){if(!this.quests[id])return false;this.trackedQuest=id;this.save();return true;}
  chooseFaction(id){if(!own(FACTIONS,id)||this.faction&&this.faction!==id){this.say('YOUR OATH HAS ALREADY BEEN GIVEN');return false;}if(this.faction===id)return false;this.faction=id;this.reputation[id]+=25;this.applyFactionBoon();this.questFlags.add('oath');this.recordObjective('faction',id);this.say('COVENANT SWORN · '+FACTIONS[id].name.toUpperCase());this.emit('oath',{faction:id});this.save();return true;}
  applyFactionBoon(){for(const m of this.party){const target=m.data.maxHp+this.level-1+this.upgrades+(this.faction==='wardens'?1:0),delta=target-m.maxHp;m.maxHp=target;m.hp=m.hp>0?Math.min(target,m.hp+Math.max(0,delta)):0;}}
  refreshKnowledge(){if(!this.rpgReady)return;for(const h of HISTORY){const unlock=h.unlock||{};if(!h.requires||this.questFlags.has(h.requires)||this.quests[h.requires]?.state==='complete')if((!unlock.fragments||this.fragments.size>=unlock.fragments)&&(!unlock.boss||this.defeatedBosses.has(unlock.boss)))this.historyKnown.add(h.id);}for(const id of Object.keys(this.quests))this.refreshQuest(id);}
  interact(){
    const p=this.player,near=this.room.objects.filter(o=>Math.abs(p.x-o.x)<100&&Math.abs(p.y-(o.y??520))<100).sort((a,b)=>Math.hypot(p.x-a.x,p.y-(a.y??520))-Math.hypot(p.x-b.x,p.y-(b.y??520)))[0];
    if(!near)return super.interact();
    if(near.kind==='merchant'){this.questFlags.add('talk:'+near.talk);this.recordObjective('talk',near.talk);this.emit('merchant');return true;}
    if(near.kind==='covenant'){this.emit('factionchoice');return true;}
    if(near.to&&ROOMS[near.to]?.chronicle){
      const dest=ROOMS[near.to];if(dest.requiresFaction&&!this.faction){this.say('SWEAR A COVENANT AT THE SANCTUARY FIRST');return false;}
      if(near.to==='cradle-zero'&&(!this.defeatedBosses.has('palimpsest')||!this.defeatedBosses.has('belltwin'))){this.say('THE CRADLE NEEDS THE UNBURNED PAGE AND THE OTHER HEART');return false;}
    }
    if(near.boss&&own(CHRONICLE_BOSSES,near.boss)){if(!this.defeatedBosses.has(near.boss)){this.say('THE FORBIDDEN GUARDIAN STILL HOLDS THIS DOOR');return false;}return this.loadRoom(near.to);}
    if(near.kind==='npc'){
      const truth=this.quests.vellLastDay;if(near.talk==='vell'&&truth&&truth.state!=='complete'&&truth.progress.slice(0,3).every(n=>n>=1)){this.questFlags.add('talk:vell-truth');this.recordObjective('talk','vell-truth');this.showDialogue(NPC_DIALOGUES['vell-truth']);this.save();return true;}
      this.questFlags.add('talk:'+near.talk);this.recordObjective('talk',near.talk);
      for(const [id,q] of Object.entries(QUESTS))if((q.giverId||q.giver)===near.talk){if(this.quests[id]?.state==='ready')this.claimQuest(id);else if(!this.quests[id]&&this.questAvailable(id))this.acceptQuest(id);}
      if(NPC_DIALOGUES[near.talk]){this.showDialogue(NPC_DIALOGUES[near.talk]);return true;}
    }
    const result=super.interact();if(result&&near.kind==='memory'){this.recordObjective('memory',this.roomId+':'+near.id);this.refreshKnowledge();this.save();}return result;
  }
  craft(id){const ok=super.craft(id);if(ok){this.recordObjective('craft',id);this.save();}return ok;}
  useTool(tool){const before=new Set([...this.shrines,...this.opened]),ok=super.useTool(tool);if(ok){for(const key of [...this.shrines,...this.opened])if(!before.has(key))this.recordObjective('tool',key);this.save();}return ok;}
  castSurge(){
    if(this.combat.remaining('surge'))return false;
    if(this.paused||this.player.respawning||this.surge<100){this.say('RESONANCE SURGE · BUILD THE GAUGE BY LANDING HITS');return false;}
    this.combat.commit('surge');this.combat.buffer=null;this.surge=0;this.cancelHeal();this.player.attack=null;this.player.invul=Math.max(this.player.invul,42);this.worldEffects.push({type:'eclipse',x:this.player.x,y:this.player.y-65,life:100,maxLife:100});
    for(const [i,m] of this.party.entries())if(m.hp>0){for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-this.player.x)<650)this.strike(e,20,this.player.face,{source:i,heavy:true});m.spirit=Math.min(100,m.spirit+15);}
    // Hits from the cinematic cannot instantly pay for another cinematic.
    this.surge=0;this.say('THREEFOLD RESONANCE · '+this.party.map(m=>m.data.name).join(' / ').toUpperCase());this.emit('surge');this.save();return true;
  }
  startWorldEvent(type=HUNT_TYPES[this.room.biome]||'eclipse'){
    if(this.worldEvent||this.eventCleared.has(this.roomId)||this.roomId==='sanctuary'||this.room.enemies.some(e=>e.boss))return false;
    this.worldEvent={type,x:clamp(this.player.x+180,500,this.worldWidth-300),y:400,life:1200,maxLife:1200,spawned:true};
    const kind=type==='meteor'?'clockscarab':type==='aurora'?'candlewraith':'hushling';
    for(let i=0;i<3;i++){if(this.defeated.has(this.roomId+':event:'+i))continue;const x=clamp(this.worldEvent.x+(i-1)*110,350,this.worldWidth-180),n=900+i,d=MINIONS[kind];this.enemies.push({id:n,key:this.roomId+':event:'+i,kind,x,y:520,home:x,baseY:520,hp:d.hp,maxHp:d.hp,face:-1,state:'patrol',timer:35+i*15,stun:0,flash:0,vx:0,left:x-160,right:x+160,event:true});}
    this.say('WORLD EVENT · '+type.toUpperCase()+' FRACTURE · DEFEAT THE THREE ECHOES');this.emit('worldevent');if(!this.enemies.some(e=>e.event&&e.hp>0))this.resolveWorldEvent();return true;
  }
  updateWorldEvent(){if(!this.worldEvent)return;if(--this.worldEvent.life<=0){for(const e of this.enemies)if(e.event)e.hp=0;this.worldEvent=null;this.say('THE FRACTURE FADES · ITS REWARD IS LOST');}}
  resolveWorldEvent(){if(!this.worldEvent||this.eventCleared.has(this.roomId)||this.enemies.some(e=>e.event&&e.hp>0))return false;this.eventCleared.add(this.roomId);this.worldEvent=null;this.lumens+=40;this.talentPoints++;this.inventory.flask++;this.worldEffects.push({type:'aurora',x:this.player.x,y:350,life:120,maxLife:120});this.say('FRACTURE SEALED · +1 TALENT / +40 LUMENS / +1 FLASK');this.recordObjective('event',this.roomId);this.emit('questcomplete');this.save();return true;}
  updateWild(e){
    if(!['candlewraith','clockscarab','oathbound','hushling'].includes(e.kind))return super.updateWild(e);
    const p=this.player,d=MINIONS[e.kind];if(Math.abs(e.x-p.x)>1100)return;this.discovered.add(e.kind);if(e.flash)e.flash--;if(e.slow>0)e.slow--;if(e.stun>0){e.stun--;return;}e.timer--;e.face=p.x>e.x?1:-1;
    if(e.kind==='candlewraith')e.y=(e.baseY??520)-55+Math.sin(this.tick*.05+e.id)*25;
    if(e.state==='patrol'){e.x=clamp(e.x+e.face*d.speed*(e.slow>0?.55:1),e.left,e.right);if(e.timer<=0){e.state='windup';e.timer=e.kind==='oathbound'?35:24;}}
    else if(e.state==='windup'&&e.timer<=0){
      if(e.kind==='oathbound'||e.kind==='clockscarab'){e.state='charge';e.timer=20;}
      else if(e.kind==='hushling'){e.x=clamp(p.x-p.face*95,e.left,e.right);this.hazards.push({type:'stasis',x:e.x,y:520,timer:24,life:65});e.state='recover';e.timer=45;}
      else{for(const dir of [-.25,0,.25]){const a=Math.atan2(p.y-30-(e.y-30),p.x-e.x)+dir;this.enemyShots.push({x:e.x,y:e.y-30,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,life:120,color:'#edcfab',status:{burn:80}});}e.state='recover';e.timer=50;}
    }else if(e.state==='charge'){e.x=clamp(e.x+e.face*(e.kind==='clockscarab'?11:8),e.left,e.right);if(e.timer<=0){e.state='recover';e.timer=42;}}
    else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=40;}
    if(Math.abs(e.x-p.x)<35&&Math.abs(e.y-p.y)<70&&e.state!=='recover')this.hurt(Math.sign(p.x-e.x),e.kind==='oathbound'?1.5:.5);
  }
  bossInfo(id){const base=BOSSES[id];return id==='nullheart'&&this.faction?{...base,...base.variants?.[this.faction],lore:base.variants?.[this.faction]?.story||base.lore}:base;}
  nullheartReady(){return this.fragments.has('crown')&&this.defeatedBosses.has('palimpsest')&&this.defeatedBosses.has('belltwin')&&!!this.faction;}
  updateBoss(e){
    if(e.boss==='nullheart'&&!this.nullheartReady()){e.state='sealed';return;}
    updateBossEncounter(this,e,this.bossInfo(e.boss));
  }
  snapshot(){const s=super.snapshot();if(!this.rpgReady)return s;return {...s,expansion:'the-ninth-memory',quests:structuredClone(this.quests),trackedQuest:this.trackedQuest,faction:this.faction,reputation:{...this.reputation},talents:[...this.talents],talentPoints:this.talentPoints,gear:this.gear.map(d=>({...d})),loadout:{...this.loadout},companionXP:{...this.companionXP},surge:this.surge,combat:this.combat.snapshot(),defeatedBosses:[...this.defeatedBosses],trueEnding:this.trueEnding,keepsakes:[...this.keepsakes],worldEvent:this.worldEvent?{...this.worldEvent}:null,eventCleared:[...this.eventCleared],worldDrops:this.worldDrops.map(d=>({...d})),historyKnown:[...this.historyKnown]};}
}
