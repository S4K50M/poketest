import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignEngine,CAMPAIGN_MOTOR} from '../src/campaign.js';
import {ROOMS,BIOMES,CHAPTERS,BOSSES,ABILITIES} from '../src/world.js';
import {ROSTER} from '../src/roster.js';
import {playCampaign,walkTo,fightGuardian,climbTo} from './helpers/campaign-route.js';
const frames=(g,n)=>{for(let i=0;i<n;i++)g.step();};

test('39 rooms form six reachable dungeons with six guardians, twelve minibosses, and hidden branches',()=>{
  assert.equal(Object.keys(ROOMS).length,39);assert.equal(CHAPTERS.length,6);assert.equal(Object.keys(BOSSES).length,18);assert.equal(Object.values(BOSSES).filter(b=>b.miniboss).length,12);
  const seen=new Set(),visit=id=>{if(seen.has(id))return;assert(ROOMS[id]);seen.add(id);ROOMS[id].objects.filter(o=>o.to).forEach(o=>visit(o.to));};visit('sanctuary');assert.equal(seen.size,39);
  assert.equal(new Set(CHAPTERS.map(c=>BIOMES[c.id].kind)).size,6);
  assert(ROOMS['reef-path'].thorns[0].w>600);assert(ROOMS['storm-path'].platforms.some(p=>p.moving));assert(ROOMS['rift-path'].platforms.some(p=>p.veil));
});
test('campaign starts with three companions, real tools, flasks, and locked story abilities',()=>{
  const g=new CampaignEngine();assert.equal(g.roomId,'sanctuary');assert.equal(g.party.length,3);assert.deepEqual([...g.abilities],['dash']);assert.equal(g.inventory.flask,3);assert(g.inventory.pickaxe);assert(g.inventory.lantern);assert.equal(g.unlocked.size,8);
});
test('fast movement, two-frame light startup, input buffering and recovery dash cancels',()=>{
  const g=new CampaignEngine(),p=g.player;g.setInputs({right:true});frames(g,5);assert(p.vx>9.5);assert.equal(CAMPAIGN_MOTOR.run,10.3);assert.equal(CAMPAIGN_MOTOR.dash,24);
  g.setInputs({});g.input('light');assert.equal(p.attack.start,2);frames(g,5);g.input('heavy');assert.equal(g.combat.buffer.action,'heavy');frames(g,7);assert.equal(p.attack.type,'heavy');frames(g,7);assert(g.input('dash'));assert.equal(p.attack,null);assert(p.dash>0);
});
test('Rift Step reduces dash recovery for both ordinary and twin-dash companions',()=>{
  for(const id of ['pyrojaw','zephyrix']){const g=new CampaignEngine([id]);g.abilities.add('blink');assert(g.input('dash'));assert.equal(g.player.dashCooldown,12);}
});
test('double jumps and wall kicks require earned abilities',()=>{
  const g=new CampaignEngine(),p=g.player;g.input('jump');frames(g,8);const n=g.stats.doubleJumps;g.input('jump');g.step();assert.equal(g.stats.doubleJumps,n);g.abilities.add('wings');g.input('jump');g.step();assert.equal(g.stats.doubleJumps,n+1);
  p.wall=1;p.jumpCount=2;p.jumpBuffer=0;g.input('jump');g.jump();assert.equal(g.stats.wallJumps,0);g.abilities.add('claw');g.input('jump');g.jump();assert.equal(g.stats.wallJumps,1);
});
test('portals and guardian exits enforce fragment and ability progression',()=>{
  const g=new CampaignEngine();g.player.x=1230;assert(!g.input('interact'));assert.equal(g.roomId,'sanctuary');g.loadRoom('forge-path');g.player.x=2370;assert(!g.input('interact'));assert.match(g.message,/ROOT CLAW/);g.abilities.add('claw');assert(g.input('interact'));assert.equal(g.roomId,'forge-descent');g.loadRoom('forge-heart');g.player.x=1780;assert(!g.input('interact'));
});
test('raising the rootbridge changes collision and persists on revisiting',()=>{
  const g=new CampaignEngine();g.loadRoom('moss-path');g.player.x=1190;assert(g.input('interact'));assert(g.platforms.some(p=>p.x===1260&&p.w===160));g.loadRoom('sanctuary');g.loadRoom('moss-path');assert(g.platforms.some(p=>p.x===1260&&p.w===160));
});
test('grapple needs the unlock and a real anchor, pulls the actor, and refreshes air movement',()=>{
  const g=new CampaignEngine();g.loadRoom('reef-path');g.player.x=900;assert(!g.input('grapple'));g.abilities.add('grapple');const start=g.player.x;assert(g.input('grapple'));frames(g,15);assert(g.player.x>start+200);assert(g.player.y<300);assert.equal(g.player.airDashes,0);
});
test('rift veil physically blocks ordinary movement and lets awakened dashes through',()=>{
  const g=new CampaignEngine();g.loadRoom('rift-path',1030);g.setInputs({right:true});frames(g,20);assert(g.player.x<1080);g.abilities.add('blink');assert(g.input('dash'));frames(g,10);assert(g.player.x>1110);
});
test('ore, caches, and lantern shrines give rewards once, including across saves',()=>{
  const g=new CampaignEngine();g.loadRoom('moss-path');g.player.x=1850;assert(g.useTool('pickaxe'));assert.equal(g.inventory.heartwood,4);assert(!g.useTool('pickaxe'));
  g.player.x=1180;g.input('interact');const n=g.inventory.heartwood;g.input('interact');assert.equal(g.inventory.heartwood,n);
  g.loadRoom('hidden-grove');Object.assign(g.player,{x:1080,y:220});assert(g.useTool('lantern'));assert.equal(g.shrines.size,1);assert(!g.useTool('lantern'));
  const restored=new CampaignEngine(undefined,{save:JSON.parse(JSON.stringify(g.save()))});assert.equal(restored.shrines.size,1);assert(!restored.useTool('lantern'));assert.equal(restored.inventory.heartwood,g.inventory.heartwood);
});
test('crafting is transactional, requires a camp, consumes materials and supports two charm slots',()=>{
  const g=new CampaignEngine();g.inventory.heartwood=10;g.inventory.ember=4;assert(g.craft('fang'));assert.equal(g.inventory.heartwood,6);assert(g.equipped.includes('fang'));assert(!g.craft('fang'));assert(g.craft('thorn'));g.inventory.pearl=3;assert(g.craft('pulse'));assert.equal(g.equipped.length,2);assert(!g.equip('pulse'));assert(g.equip('fang'));assert(g.equip('pulse'));
  g.player.x=450;const before=g.inventory.heartwood;assert(!g.craft('flask'));assert.equal(g.inventory.heartwood,before);g.player.x=200;assert(g.craft('flask'));assert.equal(g.inventory.heartwood,before-2);g.player.x=750;g.lumens=24;assert(g.buyUpgrade());assert.equal(g.upgrades,1);assert.equal(g.lumens,0);assert.equal(g.checkpoint.x,150);
});
test('Focus healing and consumable flasks preserve independent companion resources',()=>{
  const g=new CampaignEngine();g.player.hp=2;g.player.spirit=80;g.input('heal');frames(g,71);assert.equal(g.player.hp,2,'healing cannot finish before its full 72-frame channel');g.step();assert.equal(g.player.hp,3);assert(g.player.spirit<41);g.releaseHeal();assert(g.useFlask());assert.equal(g.player.hp,6);assert.equal(g.inventory.flask,2);assert(g.input('slot2'));assert.equal(g.player.hp,g.player.maxHp);assert(!g.useFlask());assert.equal(g.inventory.flask,2);
});
test('fast travel requires a discovered destination, a camp, and clear surroundings',()=>{
  const g=new CampaignEngine();assert(!g.fastTravel('frost-path'));g.visited.add('moss-path');g.player.x=470;assert(!g.fastTravel('moss-path'));g.player.x=200;assert(g.fastTravel('moss-path'));assert.equal(g.roomId,'moss-path');assert.equal(g.player.x,300);g.enemies[0].x=400;assert(!g.fastTravel('sanctuary'));
});
test('boss rewards are unique, unlock abilities and companions, and survive room reloads',()=>{
  const g=new CampaignEngine();g.loadRoom('moss-heart');g.enemies[0].introduced=true;g.player.x=850;assert(fightGuardian(g));assert(g.fragments.has('briar'));assert(g.abilities.has('claw'));assert(g.unlocked.has('mycora'));const coins=g.lumens;g.awardEnemy(g.enemies[0]);assert.equal(g.lumens,coins);g.loadRoom('moss-heart');assert.equal(g.enemies[0].hp,0);
});
test('every guardian has three phases and four telegraphed attacks with jump, position, and projectile counterplay',()=>{
  const elementalHazards=new Set();
  for(const [id,b] of Object.entries(BOSSES).filter(([,b])=>!b.miniboss)){
    const g=new CampaignEngine();g.loadRoom(b.biome+'-heart');const e=g.enemies.find(e=>e.boss===id);
    assert(e,`${id} must have a real heart encounter`);assert.equal(e.maxHp,Math.round(b.hp*2.2));
    Object.assign(e,{introduced:true,hp:e.maxHp*.6});g.player.x=900;g.updateBoss(e);assert.equal(e.phase,2);assert.equal(e.state,'enrage');
    e.hp=e.maxHp*.3;g.updateBoss(e);assert.equal(e.phase,3);assert.equal(e.state,'enrage');
    for(let move=0;move<4;move++){
      g.hazards=[];g.waves=[];g.enemyShots=[];Object.assign(e,{state:'patrol',timer:1,pattern:move-1,stun:0});g.updateBoss(e);
      assert.equal(e.state,'windup');assert(e.telegraph,`${id} attack ${move} needs a visible warning`);assert(e.timer>=30,'players need a reaction window');
      e.timer=1;g.updateBoss(e);assert.equal(e.telegraph,null);
      if(move===0)assert.equal(e.state,'charge');
      if(move===1)assert.equal(g.enemyShots.length,7);
      if(move===2){assert.equal(g.hazards.length,3);elementalHazards.add(g.hazards[0].type);}
      if(move===3){assert.equal(e.state,'leap');e.timer=1;g.updateBoss(e);assert.equal(e.state,'recover');assert.equal(g.waves.length,2,'slam creates jumpable ground pressure');}
    }
  }
  assert.deepEqual([...elementalHazards].sort(),['lightning','root','stasis']);
});
test('a wipe pauses at game over and retry returns to recovery without losing earned progression',()=>{
  const g=new CampaignEngine();g.loadRoom('forge-heart',270);g.enemies[0].hp=15;g.lumens=100;g.inventory.ember=5;g.abilities.add('claw');g.party.forEach(m=>m.hp=0);g.respawn(true);
  assert.equal(g.phase,'gameover');assert.equal(g.lumens,90);assert.equal(g.inventory.ember,5);assert(g.abilities.has('claw'));assert(g.party.every(m=>m.hp===0));
  assert(g.retryAfterDeath());assert.equal(g.roomId,'sanctuary');assert.equal(g.player.x,200);assert(g.party.every(m=>m.hp===m.maxHp));
  g.loadRoom('forge-heart');assert.equal(g.enemies[0].hp,g.enemies[0].maxHp);
});
test('save loading clamps values, rejects invalid parties, and handles partial data without crashing',()=>{
  const g=new CampaignEngine();assert(!g.loadSave(null));assert(!g.loadSave({version:1}));assert(!g.loadSave({version:2,party:[null,null,null],room:'sanctuary'}));assert(!g.loadSave({version:2,party:g.save().party,room:'constructor'}));const s=g.save();s.party[0].hp=-999;s.party[1].spirit=100000;s.lumens=-100;const r=new CampaignEngine(undefined,{save:s});assert.equal(r.party[0].hp,0);assert.equal(r.party[1].spirit,100);assert.equal(r.lumens,0);assert(r.player.hp>0);
  const invalid={...s,party:[s.party[0],s.party[0],s.party[2]]};assert(!g.loadSave(invalid));assert.equal(g.roomId,'sanctuary');
  assert(!g.loadSave({...s,party:[{id:'mycora'},s.party[1],s.party[2]],unlocked:[]}));assert.equal(g.unlocked.size,8);
});
for(const id of ['mycora','lumivern','chronowl'])test(`${id} can be rescued, recruited only at a camp, and damage foes with its signature`,()=>{
  const g=new CampaignEngine();g.unlocked.add(id);g.player.x=470;assert(!g.replaceParty(0,id));g.player.x=200;assert(g.replaceParty(0,id));g.loadRoom('moss-path',600);const e=g.enemies[0];e.x=680;e.state='patrol';g.setInputs({});assert(g.input('special'));assert.equal(g.player.spirit,id==='lumivern'?75:79);frames(g,24);assert(e.hp<e.maxHp);assert(g.player.spirit<=100);
});
for(const lead of ROSTER.slice(0,8))test(`${lead.name} leads a complete six-biome campaign using real movement, grappling, attacks and party switches`,()=>{
  const party=[lead.id,...ROSTER.filter(d=>d.id!==lead.id).slice(0,2).map(d=>d.id)],g=new CampaignEngine(party);const s=playCampaign(g);assert(s.finished);assert.equal(s.fragments.length,6);assert.equal(s.visited.length,25);assert.equal(s.abilities.length,Object.keys(ABILITIES).length);assert.equal(s.unlocked.length,11);assert(s.stats.wallJumps>0);assert(s.stats.dashes>0);assert(s.stats.switches>=4);assert.equal(s.stats.wipes,0);assert(g.finishEnding('release'));const r=new CampaignEngine(undefined,{save:JSON.parse(JSON.stringify(g.save()))});assert(r.finished);assert.equal(r.ending,'release');assert.equal(r.fragments.size,6);assert.equal(r.party.length,3);
});

test('earned abilities allow real backtracking into both hidden rooms and climbing to both lantern shrines',()=>{
  const g=new CampaignEngine();playCampaign(g);
  assert(walkTo(g,1050));assert(g.input('interact'));assert(climbTo(g,820,335));assert(g.input('interact'));assert.equal(g.roomId,'hidden-grove');
  assert(climbTo(g,1080,220));assert(g.useTool('lantern'));assert(climbTo(g,100,520));g.input('interact');assert(climbTo(g,95,520));g.input('interact');assert.equal(g.roomId,'sanctuary');
  assert(walkTo(g,1590));g.input('interact');assert.equal(g.roomId,'storm-path');assert(climbTo(g,1640,400));g.input('interact');assert.equal(g.roomId,'star-observatory');
  assert(climbTo(g,835,275));assert(climbTo(g,1180,170));assert(g.useTool('lantern'));assert.equal(g.visited.size,27);assert.equal(g.shrines.size,2);assert(g.stats.doubleJumps>0);
});
