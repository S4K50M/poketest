import test from 'node:test';
import assert from 'node:assert/strict';
import {RPGCampaign} from '../src/rpg.js';
import {COMBAT,POWERS} from '../src/combat-data.js';
import {ROSTER} from '../src/roster.js';
const frames=(g,n)=>{for(let i=0;i<n;i++)g.step();};
function fixture(lead='pyrojaw'){
  const ids=[lead,...ROSTER.filter(d=>d.id!==lead).slice(0,2).map(d=>d.id)],g=new RPGCampaign(ids);g.storyStage=1;g.enemies=[];g.unlocked.add(lead);return g;
}
for(const action of ['light','heavy'])test(`${action} has a real repeat cooldown and mashing can queue only one timed follow-up`,()=>{
  const g=fixture();let starts=0;g.onEvent=e=>{if(e.type==='slash')starts++;};
  assert(g.input(action));assert.equal(g.combat.remaining(action),COMBAT.reuse[action]);
  const attack=g.player.attack;for(let i=0;i<100;i++)g.input(action);assert.equal(g.player.attack,attack);assert.equal(starts,1);
  for(let frame=1;frame<COMBAT.reuse[action];frame++){g.input(action);g.step();assert.equal(starts,1,'cannot cast before the cooldown expires');}
  g.input(action);g.step();assert.equal(starts,2);assert.equal(g.combat.cooldowns[action],COMBAT.reuse[action]);
  for(let i=0;i<180;i++){g.input(action);g.step();}
  assert(starts<=2+Math.floor(180/COMBAT.reuse[action]));
});
test('queued inputs expire and repeated presses cannot refresh a queue or overwrite its chosen action',()=>{
  const g=fixture();g.input('light');assert(g.input('light'));const queued={...g.combat.buffer};
  for(let i=0;i<30;i++)assert(!g.input('heavy'));assert.deepEqual(g.combat.buffer,queued);
  frames(g,12);assert.equal(g.player.attack.move,'light2');assert.equal(g.combat.buffer,null);
});
test('alternating J/K/powers cannot bypass shared offensive recovery, while dodge remains responsive',()=>{
  const g=fixture();g.input('light');const focus=g.player.spirit;
  assert(!g.input('special'));assert(!g.input('power'));assert.equal(g.player.spirit,focus);
  assert(g.input('heavy'));for(let i=0;i<COMBAT.recovery-1;i++){g.step();assert.equal(g.player.attack.move,'light1');}
  g.step();assert.equal(g.player.attack.move,'heavy');
  frames(g,10);assert(g.input('dash'));assert.equal(g.player.attack,null);
  assert(g.combat.remaining('heavy')>0,'canceling cannot reset the heavy cooldown');
});
for(const lead of ROSTER)test(`${lead.name} signature and its charge/release respect the shared L cooldown after a party swap`,()=>{
  const g=fixture(lead.id);assert(g.input('special'));g.releaseSpecial();
  assert.equal(g.combat.cooldowns.special,COMBAT.reuse.special);const focus=g.player.spirit,shots=g.projectiles.length;
  for(let i=0;i<30;i++){assert(!g.input('special'));g.releaseSpecial();}
  assert.equal(g.player.spirit,focus);assert.equal(g.projectiles.length,shots);
  assert(g.input('slot2'));assert(!g.input('special'));
  frames(g,COMBAT.reuse.special);assert(g.input('special'));g.releaseSpecial();
});
test('Terrakhan cannot bank a long-held charge and immediately cast a second signature',()=>{
  const g=fixture('terrakhan');assert(g.input('special'));frames(g,COMBAT.reuse.special+20);assert(g.player.specialHeld);
  g.releaseSpecial();assert.equal(g.combat.cooldowns.special,COMBAT.reuse.special);assert(!g.input('special'));assert.equal(g.companionFields.filter(f=>f.type==='fault'&&!f.charging).length,2);assert(g.party[g.activeSlot].skillCooldown>=150);
});
test('different arts share cast recovery and equipping, cycling and switching cannot refresh an art',()=>{
  const g=fixture();g.input('power');const cost=POWERS.arcbolt.cost;assert.equal(g.player.spirit,100-cost);
  g.input('powerCycle');assert(!g.input('power'));frames(g,COMBAT.reuse.power-1);assert(!g.input('power'));
  g.step();assert(g.input('power'));assert.equal(g.combat.cooldowns.aegis,POWERS.aegis.cooldown);
  g.combat.equipPower(0,'aegis');g.input('slot2');assert(!g.input('power'));assert(g.combat.cooldowns.arcbolt>0);
});
test('Surge needs both its gauge and its cooldown; a refilled gauge cannot spam another cinematic',()=>{
  const g=fixture();g.surge=100;assert(g.input('surge'));assert.equal(g.combat.cooldowns.surge,COMBAT.reuse.surge);
  g.surge=100;assert(!g.input('surge'));frames(g,COMBAT.reuse.surge-1);assert(!g.input('surge'));g.step();assert(g.input('surge'));
});
test('cooldowns persist across room changes and save/reload, freeze on pause and reject corrupt values',()=>{
  const g=fixture();g.input('power');const saved=g.save(),r=new RPGCampaign(undefined,{save:structuredClone(saved)});
  assert.equal(r.combat.cooldowns.arcbolt,POWERS.arcbolt.cooldown);assert.equal(r.combat.recovery,COMBAT.recovery);assert(!r.input('power'));
  r.loadRoom('moss-path');assert.equal(r.combat.cooldowns.arcbolt,POWERS.arcbolt.cooldown);r.paused=true;frames(r,80);assert.equal(r.combat.cooldowns.arcbolt,POWERS.arcbolt.cooldown);
  const broken=structuredClone(saved);broken.combat.cooldowns={arcbolt:Infinity,heavy:-8,special:999999,unknown:99};broken.combat.recovery=99999;
  const clean=new RPGCampaign(undefined,{save:broken});assert.equal(clean.combat.cooldowns.arcbolt,undefined);assert.equal(clean.combat.cooldowns.heavy,0);assert.equal(clean.combat.cooldowns.special,COMBAT.reuse.special);assert.equal(clean.combat.cooldowns.unknown,undefined);assert.equal(clean.combat.recovery,COMBAT.recovery);
});

test('Overdrive cannot turn repeated companion swaps into a cooldown-free attack',()=>{
  const g=fixture();g.talents.add('overdrive');const enemy={id:900,key:'assist-test',kind:'sinder',x:g.player.x+50,y:520,hp:1000,maxHp:1000,stun:0,state:'recover',timer:9999,home:g.player.x+50,left:0,right:2200};g.enemies=[enemy];
  assert(g.input('slot2'));const hp=enemy.hp;assert(hp<1000);assert.equal(g.combat.cooldowns.assist,COMBAT.reuse.assist);
  frames(g,18);assert(g.input('slot3'));assert.equal(enemy.hp,hp);frames(g,18);assert(g.input('slot1'));assert.equal(enemy.hp,hp);
  frames(g,COMBAT.reuse.assist);assert(g.input('slot2'));assert(enemy.hp<hp);
});

test('a rejected cooling-down signature does not drop Guard or cancel held healing',()=>{
  const g=fixture();assert(g.input('special'));const focus=g.player.spirit;
  assert(g.input('shield'));assert(!g.input('special'));assert(g.player.shielding);assert.equal(g.player.spirit,focus);
  g.releaseShield();g.player.hp--;assert(g.input('heal'));assert(!g.input('special'));assert(g.player.healHeld);
});
