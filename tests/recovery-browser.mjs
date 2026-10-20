import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS,SAVE_KEY} from '../src/world.js';

const port=Number(process.env.RECOVERY_TEST_PORT||3170),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
try{
  for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}if(i===59)throw Error('Recovery test server did not start');await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());
  const persisted=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);
  mkdirSync('test-results',{recursive:true});
  async function leave(){
    if(await page.locator('#home-screen').isVisible())return;
    if(await page.locator('#overlay').evaluate(el=>el.open)){
      if(await page.locator('#overlay').getAttribute('data-view')==='gameover'){await page.click('[data-return-home]');return;}
      await page.click('#close-overlay');
    }
    await page.keyboard.press('Escape');await page.click('[data-return-home]');
  }
  async function load(value){
    await leave();await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value});
    await page.reload();await clock(100);await page.click('#continue-button');await clock(100);
  }
  // Narrow save fixtures isolate recovery behavior from combat. Movement,
  // collecting the spring, lethal damage, and retry below use ordinary UI.
  const springGame=new RPGCampaign();springGame.storyStage=1;
  const points=Object.values(ROOMS).flatMap(room=>springGame.recoveryForRoom(room.id));
  const point=points.find(point=>point.room!=='sanctuary'&&ROOMS[point.room].platforms.some(p=>!p.moving&&p.y===point.y&&point.x-110>p.x&&point.x+25<p.x+p.w));
  assert(point,'the seeded layout offers a safe approach to an automatic recovery spring');
  ROOMS[point.room].enemies.forEach((_,n)=>springGame.defeated.add(point.room+':'+n));
  springGame.loadRoom(point.room,{x:point.x-105,y:point.y},false);
  springGame.party.forEach(m=>{m.hp=1;m.spirit=10;});
  const springSave=JSON.parse(JSON.stringify(springGame.save()));
  await load(springSave);assert((await snapshot()).party.every(m=>m.hp===1));
  await page.keyboard.down('KeyD');
  for(let frame=0;frame<30;frame++){await clock(17);if((await snapshot()).party.every(m=>m.hp===m.maxHp))break;}
  await page.keyboard.up('KeyD');
  let state=await snapshot();assert(state.party.every(m=>m.hp===m.maxHp&&m.spirit>=99),'walking into the spring fully restores the entire party without E or sitting');
  assert.equal(state.paused,false);assert.equal(await page.locator('#overlay').evaluate(el=>el.open),false);
  assert((await persisted()).spentRecovery.includes(point.id));
  assert.equal((await persisted()).safeRest.room,point.room);assert.equal((await persisted()).safeRest.x,point.x);
  await page.screenshot({path:'test-results/recovery-spring.png'});
  // Reload at the same checkpoint keeps the seed and consumed state, even if
  // the saved party is injured. A used spring is not an infinite healing aura.
  const used=await persisted();used.party.forEach(m=>m.hp=1);await load(used);await clock(600);
  assert((await snapshot()).party.every(m=>m.hp===1),'an already consumed spring cannot refill health by camping or reloading');
  assert.equal((await persisted()).worldSeed,springSave.worldSeed);assert((await persisted()).spentRecovery.includes(point.id));
  console.log('PASS: seeded recovery spring heals automatically without pausing; consumption, checkpoint and layout survive reload without infinite healing.');

  const campGame=new RPGCampaign();campGame.storyStage=1;
  const camp=ROOMS['moss-path'].objects.find(o=>o.kind==='camp');assert(camp,'gate entry keeps a utility camp rather than a healing bench');
  ROOMS['moss-path'].enemies.forEach((_,n)=>campGame.defeated.add('moss-path:'+n));
  campGame.loadRoom('moss-path',camp.x,false);campGame.party.forEach(m=>{m.hp=1;m.spirit=10;});await load(campGame.save());
  await page.keyboard.press('KeyE');await clock(100);assert((await snapshot()).party.every(m=>m.hp===1),'using a camp never heals the party');
  if(await page.locator('#overlay').evaluate(el=>el.open))await page.click('#close-overlay');
  console.log('PASS: camp services do not restore health or require a sitting interaction.');

  const deathGame=new RPGCampaign();deathGame.storyStage=1;deathGame.lumens=100;
  deathGame.defeated.add('moss-path:0');deathGame.defeated.add('forge-path:0');
  deathGame.loadRoom('moss-heart',1310,false);
  deathGame.party.forEach((m,i)=>{m.hp=i===0?.25:0;m.spirit=0;});
  await load(deathGame.save());
  for(let step=0;step<100&&(await snapshot()).phase!=='gameover';step++)await clock(100);
  state=await snapshot();assert.equal(state.phase,'gameover','a normal guardian attack causes the party wipe');
  assert(await page.locator('#overlay[data-view="gameover"] .game-over-panel').isVisible());
  assert.equal(state.lumens,90);assert(state.death.restoredEnemies>0);
  assert.equal(state.death.gate,'moss');
  const deathTick=state.tick,penalty=JSON.stringify(state.death);await clock(1000);assert.equal((await snapshot()).tick,deathTick);
  await page.keyboard.press('Escape');assert(await page.locator('.game-over-panel').isVisible(),'Escape cannot dismiss the game-over screen into a stuck world');
  await page.screenshot({path:'test-results/recovery-game-over.png'});
  // Pending death is a durable state. Reload cannot skip the retry choice or
  // apply the gate penalty for a second time.
  await page.reload();await clock(100);await page.click('#continue-button');await clock(100);
  state=await snapshot();assert.equal(state.phase,'gameover');assert.equal(state.lumens,90);assert.equal(JSON.stringify(state.death),penalty);
  assert(await page.locator('.game-over-panel').isVisible());
  await page.setViewportSize({width:844,height:390});await clock(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),844);
  await page.setViewportSize({width:390,height:844});await clock(100);assert(await page.locator('#rotate-prompt').isVisible());
  assert(!(await page.locator('#overlay').isVisible()));const portraitTick=(await snapshot()).tick;await clock(400);assert.equal((await snapshot()).tick,portraitTick);
  await page.setViewportSize({width:844,height:390});await clock(100);assert(await page.locator('.game-over-panel').isVisible());
  await page.screenshot({path:'test-results/recovery-mobile-game-over.png'});
  await page.locator('[data-retry-death]').click();await clock(700);
  state=await snapshot();assert.equal(state.phase,'playing');assert.equal(state.room,'sanctuary');assert(state.party.every(m=>m.hp===m.maxHp));
  assert.equal(await page.locator('#overlay').evaluate(el=>el.open),false);assert.equal(state.paused,false);
  const x=state.player.x;await page.keyboard.down('KeyD');await clock(100);await page.keyboard.up('KeyD');assert((await snapshot()).player.x>x,'retry returns control to the player');
  const save=await persisted();assert(!save.defeated.includes('moss-path:0'),'death restores an enemy from the failed gate');assert(save.defeated.includes('forge-path:0'),'death leaves another gate’s cleared enemies unchanged');
  assert.deepEqual(errors,[]);
  console.log('PASS: live guardian death, durable game-over screen, gate-only enemy resurrection, rotation preservation, and mobile retry. No JavaScript/asset errors.');
}finally{await browser?.close();server.kill();}
