import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const port=Number(process.env.MOBILE_TEST_PORT||3150),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
try{
  let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});
  await page.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{throw Error('Fullscreen unavailable in this fixture');};if(screen.orientation)screen.orientation.lock=async()=>{throw Error('Orientation lock unavailable in this fixture');};});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install();
  const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());mkdirSync('test-results',{recursive:true});
  assert(await page.locator('#rotate-prompt').isVisible(),'portrait home is gated before any expedition starts');
  assert.equal(await page.evaluate(()=>document.activeElement.closest('dialog')?.id),'rotate-prompt');
  await page.click('#landscape-button');assert.match(await page.locator('#rotate-help').textContent(),/manually/);
  await page.setViewportSize({width:844,height:390});await clock(100);assert(!(await page.locator('#rotate-prompt').isVisible()));
  await page.click('#start-button');await page.click('#confirm-expedition');await clock(100);
  await page.setViewportSize({width:390,height:844});await clock(100);
  assert(await page.locator('#rotate-prompt').isVisible());assert((await snapshot()).paused);const portrait=await snapshot();
  await page.keyboard.down('KeyD');await page.keyboard.press('Space');await clock(500);await page.keyboard.up('KeyD');
  assert.equal((await snapshot()).tick,portrait.tick);assert.equal((await snapshot()).player.x,portrait.player.x);
  await page.screenshot({path:'test-results/mobile-rotate-prompt.png'});
  await page.setViewportSize({width:844,height:390});await clock(100);assert(!(await snapshot()).paused);assert(!(await page.locator('#rotate-prompt').isVisible()));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),844);
  assert.deepEqual(await page.locator('#world-canvas').evaluate(c=>({w:c.clientWidth,h:c.clientHeight})),{w:844,h:342});
  assert(await page.locator('.touch-controls').isVisible());assert(!(await page.locator('.topbar').isVisible()));
  for(const button of await page.locator('.touch-actions button, .touch-move button, #mobile-menu-button').all()){
    const box=await button.boundingBox();assert(box&&box.width>=44&&box.height>=44,'thumb controls have 44px targets');assert(box.x>=0&&box.y>=0&&box.x+box.width<=844&&box.y+box.height<=390,'control stays inside viewport');
  }
  const shield=await page.locator('[data-hold="shield"]').boundingBox();await page.mouse.move(shield.x+22,shield.y+22);await page.mouse.down();await clock(100);assert((await snapshot()).combat.shielding);
  await page.setViewportSize({width:390,height:844});await clock(100);const frozen=await snapshot();assert(frozen.paused);assert(!frozen.combat.shielding);await clock(300);assert.equal((await snapshot()).tick,frozen.tick);await page.mouse.up();
  await page.setViewportSize({width:844,height:390});await clock(100);assert(!(await snapshot()).paused);assert(!(await snapshot()).combat.shielding);
  const previousSlot=(await snapshot()).activeSlot;await page.locator('.touch-move [data-action="switch"]').tap();await clock(100);assert.notEqual((await snapshot()).activeSlot,previousSlot);
  await page.click('#mobile-menu-button');assert((await snapshot()).paused);
  assert.deepEqual(await page.locator('.quick-grid button').evaluateAll(bs=>bs.map(b=>b.dataset.quickAction||b.dataset.overlay)),['potion','powerCycle','arsenal','inventory','map','chronicle','tool','party']);
  await clock(300);await page.screenshot({path:'test-results/mobile-priority-menu.png'});
  await page.click('[data-toggle-sound]');assert.equal(await page.locator('[data-toggle-sound]').getAttribute('aria-pressed'),'true');await page.click('[data-toggle-sound]');
  const slot=(await snapshot()).combat.selectedPower;await page.click('[data-quick-action="powerCycle"]');assert.equal((await snapshot()).combat.selectedPower,1-slot);assert(!(await snapshot()).paused);
  await page.click('#mobile-menu-button');await page.click('.quick-menu [data-overlay="map"]');const menuTick=(await snapshot()).tick;
  await page.setViewportSize({width:390,height:844});await clock(250);assert(await page.locator('#rotate-prompt').isVisible());assert(!(await page.locator('#overlay').isVisible()));assert.equal((await snapshot()).tick,menuTick);await page.click('#landscape-button');assert.match(await page.locator('#rotate-help').textContent(),/manually/);assert((await snapshot()).paused);
  await page.setViewportSize({width:844,height:390});await clock(100);assert(await page.locator('#overlay').isVisible());assert((await snapshot()).paused);assert.match(await page.locator('#overlay-title').textContent(),/Atlas/);assert.equal(await page.evaluate(()=>document.activeElement.id),'close-overlay');await page.click('#close-overlay');
  // Two actual touch points prove that movement and an attack can be held together.
  const right=await page.locator('[data-hold="right"]').boundingBox(),strike=await page.locator('.touch-actions [data-action="light"]').boundingBox(),client=await context.newCDPSession(page);
  const before=await snapshot();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right.x+22,y:right.y+22,id:1},{x:strike.x+27,y:strike.y+27,id:2}]});await clock(50);
  assert((await snapshot()).player.x>before.player.x);assert((await snapshot()).combat.move);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await clock(150);
  await page.screenshot({path:'test-results/mobile-landscape-controls.png'});
  for(const size of [{width:568,height:320},{width:667,height:375},{width:1024,height:600}]){await page.setViewportSize(size);await clock(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),size.width);assert(await page.locator('.touch-controls').isVisible());assert(!(await page.locator('#rotate-prompt').isVisible()));}
  await page.click('#mobile-menu-button');await page.click('[data-return-home]');await page.setViewportSize({width:390,height:844});await clock(100);assert(await page.locator('#home-screen').isVisible());assert(await page.locator('#rotate-prompt').isVisible(),'portrait home remains gated after leaving play');assert.equal(await page.evaluate(()=>document.activeElement.closest('dialog')?.id),'rotate-prompt');
  assert.deepEqual(errors,[]);console.log('PASS: permanent portrait gate, rotation pause and input release, modal preservation, prioritized menu, fullscreen landscape layout, 44px touch targets, multitouch combat, phone/tablet widths, and blocked portrait home. No browser/asset errors.');
}finally{if(browser)await browser.close();server.kill();}
