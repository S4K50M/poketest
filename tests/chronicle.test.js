import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignEngine } from '../src/campaign.js';
import { RPGCampaign } from '../src/rpg.js';
import { ROOMS } from '../src/world.js';
import { EQUIPMENT } from '../src/rpg-data.js';
import { QUESTS, CHRONICLE_BOSSES, FACTIONS } from '../src/chronicle.js';
import { playCampaign } from './helpers/campaign-route.js';

const roundTrip = g => new RPGCampaign(undefined, {save:JSON.parse(JSON.stringify(g.save()))});
const frames = (g,n) => {for(let i=0;i<n;i++)g.step();};

test('RPG waylight services require a grounded companion within both axes of a bench',()=>{
  const g=new RPGCampaign();
  Object.assign(g.player,{x:200,y:520,grounded:true});
  assert(g.atBench());
  Object.assign(g.player,{y:200,grounded:false});
  assert(!g.atBench());
  assert(!g.fastTravel('sanctuary'));
  g.unlocked.add('mycora');
  assert(!g.replaceParty(0,'mycora'));
  Object.assign(g.player,{y:520,grounded:false});
  assert(!g.atBench());
  Object.assign(g.player,{grounded:true,x:450});
  assert(!g.atBench());
});

test('talents enforce prerequisites, consume earned points once, and strengthen real attacks',()=>{
  const baseline=new RPGCampaign(),g=new RPGCampaign();
  const points=g.talentPoints;
  assert.equal(points,2);
  assert(!g.buyTalent('execution'));
  assert.equal(g.talentPoints,points);
  assert(g.buyTalent('ferocity'));
  assert.equal(g.talentPoints,points-1);
  assert(!g.buyTalent('ferocity'));
  assert.equal(g.talentPoints,points-1);
  for(const game of [baseline,g])game.loadRoom('moss-path',600);
  const before=baseline.enemies[0].hp,boostedBefore=g.enemies[0].hp;
  baseline.strike(baseline.enemies[0],10,1);
  g.strike(g.enemies[0],10,1);
  assert(boostedBefore-g.enemies[0].hp>before-baseline.enemies[0].hp,'Feral Instinct must change damage, not only the talent display');
  assert(g.buyTalent('execution'));
  assert.equal(g.talentPoints,0);
  assert(!g.buyTalent('fleet'));
  const restored=roundTrip(g);
  assert(restored.talents.has('ferocity'));
  assert(restored.talents.has('execution'));
  assert.equal(restored.talentPoints,0);
});

test('equipment changes combat modifiers, preserves its loadout across saves, and salvages only once',()=>{
  const g=new RPGCampaign(),before=g.equipmentMods();
  assert(EQUIPMENT.nullCrown);
  g.grantEquipment('nullCrown');
  const item=g.gear.find(x=>x.template==='nullCrown');
  assert(item,'the granted item must be present in the pack');
  assert(g.equipItem(item.id));
  assert.equal(g.loadout.relic,item.id);
  assert(g.equipmentMods().damage>before.damage);
  const restored=roundTrip(g);
  assert.equal(restored.loadout.relic,item.id);
  assert(restored.gear.some(x=>x.id===item.id&&x.template==='nullCrown'));
  assert.equal(restored.equipmentMods().damage,g.equipmentMods().damage);
  restored.grantEquipment('glassNeedle');
  const spare=restored.gear.find(x=>x.template==='glassNeedle'),coins=restored.lumens;
  assert(restored.salvageItem(spare.id));
  assert(restored.lumens>coins);
  assert(!restored.gear.some(x=>x.id===spare.id));
  const after=restored.lumens;
  assert(!restored.salvageItem(spare.id));
  assert.equal(restored.lumens,after);
});

test('a v2 campaign earned with real traversal and combat migrates without losing its progress',()=>{
  const legacy=new CampaignEngine();
  playCampaign(legacy,{chapters:1});
  const save=JSON.parse(JSON.stringify(legacy.save()));
  assert.equal(save.version,2);
  const g=new RPGCampaign(undefined,{save});
  assert.equal(g.roomId,legacy.roomId);
  assert.deepEqual([...g.fragments],[...legacy.fragments]);
  assert(g.abilities.has('claw'));
  assert(g.unlocked.has('mycora'));
  assert.deepEqual(g.party.map(m=>m.data.id),legacy.party.map(m=>m.data.id));
  assert.equal(g.lumens,legacy.lumens);
  assert.equal(g.level,legacy.level);
  assert.equal(g.inventory.flask,legacy.inventory.flask);
  assert.equal(g.save().version,3);
  assert(g.talents instanceof Set);
  assert(Array.isArray(g.gear));
  assert.deepEqual([...roundTrip(g).fragments],[...legacy.fragments]);
});

test('Resonance Surge requires a full meter, damages nearby enemies, and consumes the charge',()=>{
  const g=new RPGCampaign();
  g.loadRoom('moss-path',600);
  g.surge=40;
  assert(!g.input('surge'));
  assert.equal(g.surge,40);
  const target=g.enemies[0],before=target.hp;
  g.surge=100;
  assert(g.input('surge'));
  frames(g,20);
  assert(target.hp<before);
  assert(g.surge<100);
  assert(!g.input('surge'));
});

test('the first RPG quest completes through NPC, room and memory interactions and can be claimed only once',()=>{
  const g=new RPGCampaign(),quest=QUESTS.firstMargin;
  assert(quest.autoStart);
  assert.equal(g.quests[quest.id].state,'active');
  g.loadRoom('sanctuary',900);
  assert(g.input('interact'));
  g.loadRoom('moss-path',440);
  assert(g.input('interact'));
  assert.equal(g.quests[quest.id].state,'ready');
  assert.deepEqual(g.quests[quest.id].progress,quest.objectives.map(o=>o.count));
  const coins=g.lumens,wood=g.inventory.heartwood;
  assert(g.claimQuest(quest.id));
  assert.equal(g.quests[quest.id].state,'complete');
  assert.equal(g.lumens,coins+quest.reward.lumens);
  assert.equal(g.inventory.heartwood,wood+quest.reward.materials.heartwood);
  const restored=roundTrip(g),after=restored.lumens;
  assert.equal(restored.quests[quest.id].state,'complete');
  assert(!restored.claimQuest(quest.id));
  assert.equal(restored.lumens,after);
  restored.recordObjective('talk','iona',100);
  assert.deepEqual(restored.quests[quest.id].progress,quest.objectives.map(o=>o.count));
});

test('faction oaths are permanent, change party stats, and do not stack after save/reload',()=>{
  const g=new RPGCampaign();
  playCampaign(g,{chapters:5});
  assert(FACTIONS.wardens.boon.hearts>0);
  const hearts=g.party.map(m=>m.maxHp);
  assert(g.chooseFaction('wardens'));
  assert.equal(g.faction,'wardens');
  assert.deepEqual(g.party.map(m=>m.maxHp),hearts.map(h=>h+FACTIONS.wardens.boon.hearts));
  const current=g.party.map(m=>m.maxHp);
  assert(!g.chooseFaction('chorus'));
  assert(!g.chooseFaction('wardens'));
  assert.deepEqual(g.party.map(m=>m.maxHp),current);
  const restored=roundTrip(g);
  assert.equal(restored.faction,'wardens');
  assert.deepEqual(restored.party.map(m=>m.maxHp),current);
  assert(!restored.chooseFaction('unwritten'));
});

test('each optional guardian has a reachable room and grants a unique reward without advancing the six main fragments',()=>{
  const bossIds=Object.entries(CHRONICLE_BOSSES).filter(([,boss])=>boss.optional).map(([id])=>id);
  assert.equal(bossIds.length,3);
  const reachable=new Set(),visit=id=>{if(reachable.has(id))return;assert(ROOMS[id]);reachable.add(id);for(const object of ROOMS[id].objects)if(object.to)visit(object.to);};
  visit('sanctuary');
  for(const id of bossIds){
    const room=Object.values(ROOMS).find(r=>r.enemies.some(e=>e.boss===id));
    assert(room,`${id} needs a real encounter`);
    assert(reachable.has(room.id),`${id} needs a world connection`);
    const g=new RPGCampaign();
    g.loadRoom(room.id,850);
    if(id==='nullheart'){g.fragments.add('crown');g.defeatedBosses.add('palimpsest');g.defeatedBosses.add('belltwin');g.chooseFaction('unwritten');}
    const e=g.enemies.find(e=>e.boss===id),fragments=g.fragments.size;
    g.strike(e,e.maxHp*10,1,{heavy:true});
    assert.equal(e.hp,0);
    assert(g.defeatedBosses.has(id));
    assert.equal(g.fragments.size,fragments);
    assert(!g.finished,'an optional guardian cannot trigger the main ending');
    const rewards={lumens:g.lumens,points:g.talentPoints,gear:g.gear.length};
    g.awardEnemy(e);
    assert.deepEqual({lumens:g.lumens,points:g.talentPoints,gear:g.gear.length},rewards);
    const restored=roundTrip(g);
    assert(restored.defeatedBosses.has(id));
    assert.equal(restored.enemies.find(e=>e.boss===id).hp,0);
    assert.equal(restored.fragments.size,fragments);
  }
});

test('world events require all spawned echoes defeated and award a persistent reward once',()=>{
 const g=new RPGCampaign();g.loadRoom('moss-path',550);assert(g.startWorldEvent('aurora'));assert.equal(g.enemies.filter(e=>e.event).length,3);assert(!g.resolveWorldEvent());
 const points=g.talentPoints,level=g.level;for(const e of g.enemies.filter(e=>e.event))g.strike(e,1000,1,{heavy:true});assert.equal(g.worldEvent,null);assert(g.eventCleared.has('moss-path'));assert.equal(g.talentPoints,points+1+(g.level-level));const money=g.lumens;assert(!g.resolveWorldEvent());assert.equal(g.lumens,money);
 const r=roundTrip(g);assert(!r.startWorldEvent());assert(r.eventCleared.has('moss-path'));
});
test('ground loot survives leaving a room, can be picked up once, and grants actual equipment',()=>{
 const g=new RPGCampaign();g.loadRoom('moss-heart',850);const e=g.enemies[0];g.strike(e,10000,1,{heavy:true});assert.equal(g.worldDrops.length,1);const drop=g.worldDrops[0];g.loadRoom('sanctuary');g.loadRoom('moss-heart');assert.equal(g.worldDrops[0].id,drop.id);assert(g.pickupLoot(drop.id));assert(g.gear.some(d=>d.template===drop.template));const count=g.gear.length;assert(!g.pickupLoot(drop.id));assert.equal(g.gear.length,count);assert.equal(roundTrip(g).worldDrops.length,0);
});
test('merchant transactions require a reachable shop, consume Lumens and retain finite stock',()=>{
 const g=new RPGCampaign();g.lumens=100;assert(!g.buyItem('flask'));Object.assign(g.player,{x:610,y:520,grounded:true});const n=g.inventory.flask;assert(g.buyItem('flask'));assert.equal(g.inventory.flask,n+1);assert.equal(g.lumens,85);assert.equal(g.shopStock.flask,4);g.player.y=200;assert(!g.buyItem('insight'));g.player.y=520;const points=g.talentPoints;assert(g.buyItem('insight'));assert.equal(g.talentPoints,points+1);assert(!g.buyItem('insight'));assert.equal(roundTrip(g).shopStock.insight,0);
});
test('new enemy AI produces concrete, telegraphed projectiles, charges and stasis hazards',()=>{
 const g=new RPGCampaign();for(const kind of ['candlewraith','clockscarab','oathbound','hushling']){
  g.enemyShots=[];g.hazards=[];g.player.x=600;const e={id:90,kind,x:700,y:520,home:700,baseY:520,hp:100,maxHp:100,left:400,right:900,state:'windup',timer:1,stun:0,flash:0};g.updateWild(e);if(kind==='candlewraith')assert.equal(g.enemyShots.length,3);else if(kind==='hushling')assert.equal(g.hazards[0].type,'stasis');else assert.equal(e.state,'charge');
 }
});
test('the full optional chronicle is completable through inputs, preserves every quest and unlocks the true ending',async()=>{
 const {playChronicle}=await import('./helpers/chronicle-route.js');const g=new RPGCampaign();const s=playChronicle(g);assert.equal(s.fragments.length,6);assert.equal(s.defeatedBosses.length,3);assert.equal(Object.keys(s.quests).length,8);assert(Object.values(s.quests).every(q=>q.state==='complete'));assert.equal(s.trueEnding,'unwritten');assert.equal(s.historyKnown.length,10);assert.equal(g.keepsakes.size,5);assert.equal(s.stats.wipes,0);const r=roundTrip(g);assert.equal(r.trueEnding,'unwritten');assert(Object.values(r.quests).every(q=>q.state==='complete'));assert.equal(r.keepsakes.size,5);assert(r.gear.some(d=>d.template==='nullCrown'));
});
test('leaving a partially cleared world event cannot respawn defeated echoes for farming',()=>{
 const g=new RPGCampaign();g.loadRoom('moss-path',550);g.startWorldEvent('aurora');const e=g.enemies.find(e=>e.event);g.strike(e,1000,1,{heavy:true});const dead=e.key;g.loadRoom('sanctuary');g.loadRoom('moss-path',550);assert(g.startWorldEvent('aurora'));assert.equal(g.enemies.filter(e=>e.event).length,2);assert(!g.enemies.some(e=>e.key===dead));
});
test('partially corrupt v3 optional fields stay playable and completed saves do not announce a fresh quest',()=>{
 const g=new RPGCampaign(),s=g.save();s.defeatedBosses={bad:true};s.historyKnown=null;s.questFlags=14;s.eventCleared='oops';s.shopStock=undefined;const r=new RPGCampaign(undefined,{save:s});assert.equal(r.fragments.size,0);assert(r.historyKnown instanceof Set);assert.equal(r.shopStock.flask,5);assert.equal(r.messageTime,0);assert(r.input('light'));
});
for(const faction of ['wardens','chorus'])test(`${faction} can finish all eight stories and earns its own persistent true ending`,async()=>{
 const {playChronicle}=await import('./helpers/chronicle-route.js');const g=new RPGCampaign();playChronicle(g,{faction});assert.equal(g.trueEnding,faction);assert.equal(g.faction,faction);assert(Object.values(g.quests).every(q=>q.state==='complete'));assert.equal(roundTrip(g).trueEnding,faction);assert.equal(g.bossInfo('nullheart').name,CHRONICLE_BOSSES.nullheart.variants[faction].name);
});
test('Refuse the Silence preserves a lethal hit once per room without consuming itself on guarded attacks',()=>{
 const g=new RPGCampaign();g.talents.add('secondchance');g.player.invul=0;g.player.hp=1;g.player.guard=30;g.player.face=1;assert(!g.hurt(-1,2));assert(!g.revivalUsed);g.player.guard=0;frames(g,16);assert(g.hurt(1,2));assert.equal(g.player.hp,1);assert(g.revivalUsed);g.player.invul=0;g.hurt(1,2);assert.equal(g.party[0].hp,0);g.loadRoom('moss-path');assert(!g.revivalUsed);
});
test('the Compact health boon neither heals nor removes health when an injured party reloads',()=>{
 const g=new RPGCampaign();g.chooseFaction('wardens');g.party[0].hp=3.5;g.party[1].hp=0;const hp=g.party.map(m=>m.hp),r=roundTrip(g);assert.deepEqual(r.party.map(m=>m.hp),hp);assert.deepEqual(roundTrip(r).party.map(m=>m.hp),hp);assert.equal(r.party[0].maxHp,g.party[0].maxHp);
});
