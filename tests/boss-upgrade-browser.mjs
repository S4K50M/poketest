import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS,SAVE_KEY} from '../src/world.js';
import {ESSENTIAL_BOSSES,BOSS_CINEMATIC_DURATION,FINALE_CINEMATIC_DURATION} from '../src/boss-cinematic.js';
import {playCampaign} from './helpers/campaign-route.js';
const port=Number(process.env.BOSS_UPGRADE_TEST_PORT||3230),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});};
function encounterSave(id,{reducedMotion=false}={}){
 const g=new RPGCampaign(undefined,{worldSeed:1}),room=Object.values(ROOMS).find(r=>r.enemies.some(e=>e.boss===id));g.storyStage=1;
 // These are presentation fixtures, not proof of a combat victory or a route.
 if(id==='nullheart'){g.fragments.add('crown');g.defeatedBosses.add('palimpsest');g.defeatedBosses.add('belltwin');g.faction='wardens';}
 g.loadRoom(room.id,room.enemies.find(e=>e.boss===id).x-170,false);g.combat.settings.reducedMotion=reducedMotion;return g.save();
}
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results',{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});watch(page);await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
 const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());
 async function load(save,p=page){
  // Leave through the actual UI before replacing a fixture; beforeunload saves
  // the current expedition and would otherwise overwrite the next checkpoint.
  if(!(await p.locator('#home-screen').isVisible())){
   if(await p.locator('#encounter-skip').isVisible())await p.locator('#encounter-skip').click();
   if(await p.locator('#overlay').isVisible()){
    if(await p.locator('[data-return-home]').isVisible())await p.locator('[data-return-home]').click();
    else await p.locator('#close-overlay').click();
   }
   if(!(await p.locator('#home-screen').isVisible())){await p.locator('#home-button').click();await p.locator('[data-return-home]').click();}
  }
  await p.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:SAVE_KEY,save});await p.reload();await p.evaluate(()=>document.fonts.ready);await p.clock.runFor(100);await p.locator('#continue-button').click();await p.clock.runFor(100);
 }
 async function checkSceneFits(p=page){const geometry=await p.locator('#encounter-screen').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,screenW:innerWidth,screenH:innerHeight,scroll:document.documentElement.scrollWidth};});assert.equal(geometry.x,0);assert.equal(geometry.y,0);assert.equal(geometry.w,geometry.screenW);assert.equal(geometry.h,geometry.screenH);assert.equal(geometry.scroll,geometry.screenW);const button=await p.locator('#encounter-skip').boundingBox();assert(button&&button.width>=44&&button.height>=44&&button.x+button.width<=geometry.w&&button.y+button.height<=geometry.h);}
 const titles=new Set();
 for(const id of ESSENTIAL_BOSSES){
  const save=encounterSave(id);await load(save);const before=await snapshot();assert(before.cinematic.active,id+' has an introduction');assert.equal(before.cinematic.mode,'intro');assert.equal(before.cinematic.boss,id);assert(before.paused);await checkSceneFits();titles.add(await page.locator('#encounter-title').textContent());
  await page.keyboard.down('KeyD');await page.keyboard.down('KeyK');await page.keyboard.down('KeyL');await clock(500);await page.keyboard.up('KeyD');await page.keyboard.up('KeyK');await page.keyboard.up('KeyL');const held=await snapshot();assert.equal(held.tick,before.tick);assert.equal(held.player.x,before.player.x);assert.equal(held.player.hp,before.player.hp);assert.deepEqual(held.fragments,before.fragments);assert.deepEqual(held.enemies.map(e=>e.hp),before.enemies.map(e=>e.hp));
  if(['briar','leviathan','conductor','crown','nullheart'].includes(id))await page.screenshot({path:`test-results/encounter-intro-${id}.png`,animations:'disabled'});
  await page.locator('#encounter-skip').click();const skipped=await snapshot();assert(!skipped.cinematic.active);assert(!skipped.paused);assert.equal(await page.evaluate(()=>document.activeElement.id),'world-canvas');await clock(35);assert((await snapshot()).tick>before.tick);assert.equal((await snapshot()).player.x,before.player.x,'held movie movement cannot leak into the fight');assert.equal((await snapshot()).combat.move,null,'held movie heavy input cannot leak into the fight');
 }
 assert(titles.size>=6,'guardians introduce their own chambers and story');
 // Reduced motion holds a complete still within an act, then the intro finishes
 // naturally without allowing the boss or hazards to advance underneath it.
 await load(encounterSave('hourglass',{reducedMotion:true}));const stillStart=await snapshot();await clock(500);const first=await page.locator('#encounter-canvas').evaluate(c=>c.toDataURL());await clock(700);assert.equal(await page.locator('#encounter-canvas').evaluate(c=>c.toDataURL()),first);await clock(BOSS_CINEMATIC_DURATION-1200+100);assert(!(await snapshot()).cinematic.active);assert(!(await snapshot()).paused);assert.equal((await snapshot()).player.x,stillStart.player.x);
 console.log('PASS: all nine essential introductions, story identity, full-screen/skip layout, input and simulation isolation, focus return, reduced motion and natural completion.');

 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await context.newPage();watch(phone);await phone.goto(base);await phone.evaluate(()=>document.fonts.ready);await phone.clock.install({time:new Date('2026-01-01T00:00:00Z')});await phone.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));await phone.setViewportSize({width:844,height:390});await phone.clock.runFor(100);await load(encounterSave('leviathan'),phone);await checkSceneFits(phone);const entering=await phone.evaluate(()=>window.kinetic.snapshot());
 await phone.setViewportSize({width:390,height:844});await phone.clock.runFor(100);assert(await phone.locator('#rotate-prompt').isVisible());const portrait=await phone.evaluate(()=>window.kinetic.snapshot());await phone.clock.runFor(800);assert.equal((await phone.evaluate(()=>window.kinetic.snapshot())).cinematic.elapsed,portrait.cinematic.elapsed);assert.equal((await phone.evaluate(()=>window.kinetic.snapshot())).tick,entering.tick);await phone.keyboard.press('Enter');assert((await phone.evaluate(()=>window.kinetic.snapshot())).cinematic.active,'portrait cannot dismiss the hidden scene');
 await phone.setViewportSize({width:844,height:390});await phone.clock.runFor(100);await checkSceneFits(phone);await phone.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await phone.evaluate(()=>window.kinetic.snapshot());await phone.clock.runFor(600);assert.equal((await phone.evaluate(()=>window.kinetic.snapshot())).cinematic.elapsed,hidden.cinematic.elapsed);await phone.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await phone.clock.runFor(100);assert((await phone.evaluate(()=>window.kinetic.snapshot())).cinematic.elapsed>hidden.cinematic.elapsed);await phone.screenshot({path:'test-results/encounter-intro-mobile.png',animations:'disabled'});await phone.locator('#encounter-skip').tap();assert(!(await phone.evaluate(()=>window.kinetic.snapshot())).cinematic.active);assert(!(await phone.evaluate(()=>window.kinetic.snapshot())).paused);await context.close();
 console.log('PASS: real mobile portrait gating, paused movie clock, hidden-tab preservation, landscape layout and touch skip.');

 // Obtain the finale through the same earned movement/combat route as campaign
 // play, then exercise each real UI decision from that complete checkpoint.
 const earned=new RPGCampaign(undefined,{worldSeed:1});let finalSave;playCampaign(earned,{onVictory:g=>{if(g.roomId==='rift-heart')finalSave=structuredClone(g.save());}});assert.equal(finalSave.fragments.length,6);assert(finalSave.finished);
 for(const ending of['restore','release']){
  await load(finalSave);assert(!(await page.locator('#overlay').isVisible()),'Worldheart choices wait for an intentional E interaction');const heart=(await snapshot()).bossAftermath.find(o=>o.boss==='crown');assert(heart);for(let i=0;i<120&&Math.abs((await snapshot()).player.x-heart.x)>25;i++){const p=(await snapshot()).player,key=p.x<heart.x?'KeyD':'KeyA';await page.keyboard.down(key);await clock(50);await page.keyboard.up(key);}await page.keyboard.press('KeyE');assert(await page.locator(`[data-ending="${ending}"]`).isVisible());await page.click(`[data-ending="${ending}"]`);const beginning=await snapshot();assert.equal(beginning.ending,ending);assert(beginning.cinematic.active);assert.equal(beginning.cinematic.mode,'ending');assert.equal(beginning.cinematic.boss,'crown');await clock(1200);assert.equal((await snapshot()).tick,beginning.tick);assert.equal((await snapshot()).player.hp,beginning.player.hp);await page.screenshot({path:`test-results/encounter-ending-${ending}.png`,animations:'disabled'});
  if(ending==='restore')await page.click('#encounter-skip');else await clock(FINALE_CINEMATIC_DURATION-1200+100);
  assert(!(await snapshot()).cinematic.active);assert(await page.locator('#overlay[data-view="credits"]').isVisible());assert.match(await page.locator('#overlay-title').textContent(),/world remembers/);assert.equal((await snapshot()).ending,ending);await page.click('[data-resume]');assert(!(await snapshot()).paused);assert.equal((await snapshot()).fragments.length,6);
 }
 assert.deepEqual(errors,[]);console.log('PASS: earned six-gate completion unlocks both choice-specific ending movies, skip/natural completion return to credits, and progression remains intact.');
}finally{await browser?.close();server.kill();}
