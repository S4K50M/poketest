import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {SAVE_KEY} from '../src/world.js';
const port=Number(process.env.ARRIVAL_TEST_PORT||3210),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.stack||e.message));p.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});};
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready,'isolated arrival server starts');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results',{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});watch(page);await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
 const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot()),stored=()=>page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
 async function fitsViewport(){
  const geometry=await page.evaluate(()=>({w:innerWidth,h:innerHeight,scrollW:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),scrollH:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)}));
  assert(geometry.scrollW<=geometry.w+1,JSON.stringify(geometry)+' must have no horizontal outer scroller');assert(geometry.scrollH<=geometry.h+1,JSON.stringify(geometry)+' must fit one composed viewport');
  for(const id of ['start-button','atlas-button','party-button']){const b=await page.locator('#'+id).boundingBox();assert(b&&b.width>0&&b.height>0&&b.x>=-1&&b.y>=-1&&b.x+b.width<=geometry.w+1&&b.y+b.height<=geometry.h+1,id+' remains visible and reachable inside the viewport');}
  for(const button of await page.locator('#replay-intro, .landing-tabs button, .landing-panel:not([hidden]) button').all()){const b=await button.boundingBox();assert(b&&b.width>0&&b.height>0&&b.x>=-1&&b.y>=-1&&b.x+b.width<=geometry.w+1&&b.y+b.height<=geometry.h+1,'active journal and replay controls cannot be clipped behind overflow:hidden');}
 }
 for(const size of[{width:1440,height:1000},{width:1280,height:720},{width:1024,height:768},{width:844,height:390},{width:667,height:375},{width:640,height:360}]){
  await page.setViewportSize(size);await clock(100);assert(!(await page.locator('#rotate-prompt').isVisible()));await fitsViewport();
  for(const name of['realms','chronicle','kindred']){await page.click(`[data-landing-tab="${name}"]`);assert.equal(await page.locator(`[data-landing-tab="${name}"]`).getAttribute('aria-selected'),'true');await fitsViewport();}
  if(size.width===1440||size.width===844)await page.screenshot({path:`test-results/arrival-home-${size.width}.png`,animations:'disabled'});
 }
 await page.setViewportSize({width:1440,height:1000});await clock(100);await page.locator('[data-landing-tab="kindred"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.dataset.landingTab),'realms');assert.equal(await page.locator('#landing-panel-realms').getAttribute('hidden'),null);
 await page.locator('.biome-card[data-map-region="reef"]').focus();await clock(150);assert.equal((await snapshot()).home.biome,'reef');assert.match(await page.locator('#landing-realm-name').textContent(),/Drowned Archive/);await page.screenshot({path:'test-results/arrival-home-realm.png',animations:'disabled'});
 await page.locator('[data-landing-tab="realms"]').focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement.dataset.landingTab),'chronicle');await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>document.activeElement.dataset.landingTab),'kindred');
 console.log('PASS: single-viewport landing at six desktop/tablet/landscape sizes, visible primary actions, accessible journal tabs and dynamic realm previews.');

 // A replay is a presentation-only visit; it must never create or replace a save.
 const untouched=await stored();await page.click('#replay-intro');assert(await page.locator('#intro-screen').isVisible());const firstTitle=await page.locator('#intro-title').textContent();await clock(800);await page.screenshot({path:'test-results/arrival-intro-fracture.png',animations:'disabled'});await clock(3800);assert.notEqual(await page.locator('#intro-title').textContent(),firstTitle);await page.screenshot({path:'test-results/arrival-intro-lantern.png',animations:'disabled'});await clock(4000);assert.equal((await snapshot()).intro.beat,2);await page.screenshot({path:'test-results/arrival-intro-awakening.png',animations:'disabled'});await page.keyboard.press('Escape');assert(!(await page.locator('#intro-screen').isVisible()));assert.equal(await stored(),untouched);assert.equal((await snapshot()).phase,'selection');
 await page.click('#start-button');await page.click('#confirm-expedition');assert((await snapshot()).intro.active);assert((await snapshot()).paused);const entering=await snapshot();await page.keyboard.down('KeyD');await page.keyboard.down('KeyJ');await page.keyboard.down('ShiftLeft');await clock(1000);await page.keyboard.up('KeyD');await page.keyboard.up('KeyJ');await page.keyboard.up('ShiftLeft');const held=await snapshot();assert.equal(held.tick,entering.tick);assert.equal(held.player.x,entering.player.x);assert.equal(held.player.hp,entering.player.hp);
 // Orientation and hidden tabs hold the cinematic clock as well as gameplay.
 await page.setViewportSize({width:390,height:844});await clock(100);assert(await page.locator('#rotate-prompt').isVisible());const rotated=await snapshot();await clock(1000);assert.equal((await snapshot()).intro.elapsed,rotated.intro.elapsed);assert.equal((await snapshot()).tick,rotated.tick);await page.keyboard.press('Enter');assert((await snapshot()).intro.active,'portrait cannot dismiss an obscured cutscene');
 await page.setViewportSize({width:844,height:390});await clock(100);assert.equal(await page.evaluate(()=>document.activeElement.closest('dialog')?.id),'intro-screen');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await snapshot();await clock(1000);assert.equal((await snapshot()).intro.elapsed,hidden.intro.elapsed);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await clock(100);assert((await snapshot()).intro.elapsed>hidden.intro.elapsed);
 await page.keyboard.press('Enter');assert(!(await snapshot()).intro.active);assert(!(await snapshot()).paused);assert.equal(await page.evaluate(()=>document.activeElement.id),'world-canvas');await clock(100);const resumed=await snapshot();assert(resumed.tick>entering.tick);assert.equal(resumed.player.x,entering.player.x,'held movement from the cutscene cannot leak into gameplay');assert(!resumed.combat.move,'held attack cannot leak into gameplay');
 await page.keyboard.press('Escape');await page.click('[data-return-home]');const beforeReplay=await stored();assert(beforeReplay);assert(await page.locator('#continue-button').isVisible());await fitsViewport();await page.click('#replay-intro');await clock(500);await page.click('#intro-skip');assert.equal(await stored(),beforeReplay,'previewing the opening preserves the existing journey');
 await page.click('#continue-button');assert(!(await snapshot()).intro.active,'Continue returns directly to the checkpoint');assert(!(await snapshot()).paused);await page.keyboard.press('Escape');await page.click('[data-return-home]');
 // A fresh expedition also completes without requiring a skip or a hidden input.
 await page.emulateMedia({reducedMotion:'reduce'});await page.click('#start-button');await page.click('#confirm-expedition');assert((await snapshot()).intro.active);const beginning=await snapshot();await clock(1000);const staticArt=await page.locator('#intro-canvas').evaluate(c=>c.toDataURL());await clock(600);assert.equal(await page.locator('#intro-canvas').evaluate(c=>c.toDataURL()),staticArt,'reduced motion holds a complete still image inside the story act');await clock(10500);assert(!(await snapshot()).intro.active);assert(!(await snapshot()).paused);assert.equal((await snapshot()).player.x,beginning.player.x);assert((await snapshot()).tick>=beginning.tick);
 console.log('PASS: opening acts, natural completion, keyboard/button skips, input isolation, rotation/hidden-tab pause, reduced motion, replay save safety and Continue bypass.');

 // Real mobile emulation catches portrait content that expands the layout
 // viewport and leaves the browser zoomed after rotation, shifting touch hits.
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const phone=await mobile.newPage();watch(phone);await phone.goto(base);await phone.evaluate(()=>document.fonts.ready);await phone.clock.install({time:new Date('2026-01-01T00:00:00Z')});await phone.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
 assert(await phone.locator('#rotate-prompt').isVisible());assert.equal(await phone.evaluate(()=>innerWidth),390,'the hidden portrait header must not expand the layout viewport');
 await phone.setViewportSize({width:844,height:390});await phone.clock.runFor(100);assert.equal(await phone.evaluate(()=>visualViewport.scale),1,'rotation preserves unzoomed touch coordinates');
 await phone.locator('#replay-intro').tap();await phone.locator('#intro-skip').tap();assert.equal(await phone.evaluate(key=>localStorage.getItem(key),SAVE_KEY),null,'touch replay never starts a save');
 await phone.locator('#start-button').tap();await phone.locator('#confirm-expedition').tap();assert(await phone.locator('#intro-screen').isVisible());const phoneTick=await phone.evaluate(()=>window.kinetic.snapshot().tick);
 await phone.setViewportSize({width:390,height:844});await phone.clock.runFor(300);assert(await phone.locator('#rotate-prompt').isVisible());assert.equal(await phone.evaluate(()=>window.kinetic.snapshot().tick),phoneTick);
 await phone.setViewportSize({width:844,height:390});await phone.clock.runFor(100);await phone.locator('#intro-skip').tap();assert(!(await phone.evaluate(()=>window.kinetic.snapshot().intro.active)));assert(!(await phone.evaluate(()=>window.kinetic.snapshot().paused)));await mobile.close();
 console.log('PASS: real mobile portrait-to-landscape keeps the viewport and touch coordinates aligned; prologue replay and expedition skips work by touch.');

 // Actual WorldRenderer fixtures inspect the new first-area compositions while
 // leaving simulation, collision geometry, and progression untouched.
 const review=await browser.newPage({viewport:{width:1280,height:660}});watch(review);await review.route('**/__arrival-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>First-area scenery</title><style>body{margin:0;background:#0c1723}canvas{display:block;width:1280px;height:660px}</style><canvas></canvas>'}));await review.goto(base+'/__arrival-review');
 for(const room of['sanctuary','moss-path','moss-descent','moss-nexus','moss-ascent','moss-vault','moss-heart']){
  const safe=await review.evaluate(async room=>{
   const [{RPGCampaign},{WorldRenderer}]=await Promise.all([import('/src/rpg.js'),import('/src/world-render.js')]);const g=new RPGCampaign(undefined,{worldSeed:1});g.storyStage=1;g.loadRoom(room,{x:room==='sanctuary'?520:room==='moss-heart'?1120:1200,y:room==='moss-ascent'?-380:520},false);const state=()=>JSON.stringify({state:g.snapshot(),platforms:g.platforms,enemies:g.enemies,objects:g.room.objects}),before=state();const renderer=new WorldRenderer(document.querySelector('canvas'));renderer.render(g,1000);renderer.render(g,1033);return before===state();
  },room);assert(safe,'first-area rendering must preserve simulation and landing coordinates');await review.locator('canvas').screenshot({path:`test-results/arrival-${room}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS: sanctuary and all six first-gate room scenes, including the upper canopy, render with unchanged gameplay and no JavaScript/asset errors.');
}finally{await browser?.close();server.kill();}
