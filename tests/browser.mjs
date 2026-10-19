import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import http from 'node:http';

// Real browser integration: local assets, every rig, keyboard inputs, a complete
// best-of-three, pause, rematch, move manual, and a narrow viewport.
const port=Number(process.env.TEST_PORT||3100),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser,nestedServer;const errors=[];
try{
  let ready=false;
  for(let i=0;i<50;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
  assert(ready,'static server did not become ready');
  const executablePath=process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1024}});
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install();
  assert.equal(await page.locator('.fighter-card').count(),8);
  mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/selection.png',fullPage:true});
  const ids=await page.locator('.fighter-card').evaluateAll(cards=>cards.map(c=>c.dataset.fighter));
  for(const id of ids){
    await page.locator(`[data-fighter="${id}"]`).click();
    assert.equal(await page.locator('#opponent-select option').count(),7);
    assert(!(await page.locator('#opponent-select option').evaluateAll(options=>options.map(o=>o.value))).includes(id));
    await page.locator('#start-fight').click();await page.clock.runFor(2300);
    const s=await page.evaluate(()=>window.kinetic.snapshot());assert.equal(s.fighters[0].id,id);assert.equal(s.phase,'fighting');
    await page.locator('#back-select').click();
  }
  console.log('PASS: all eight fighters render and enter combat; opponent cannot be the selected fighter.');
  await page.locator('[data-fighter="pyrojaw"]').click();await page.selectOption('#opponent-select','glaciolith');await page.selectOption('#ai-level','easy');
  await page.locator('#start-fight').click();await page.clock.runFor(2300);
  const initial=await page.evaluate(()=>window.kinetic.snapshot());
  await page.keyboard.down('KeyD');await page.clock.runFor(450);await page.keyboard.up('KeyD');
  const moved=await page.evaluate(()=>window.kinetic.snapshot());assert.notEqual(moved.fighters[0].x,initial.fighters[0].x);
  for(let i=0;i<12;i++){await page.keyboard.press(i%4===0?'KeyK':'KeyJ');await page.clock.runFor(210)}
  const fighting=await page.evaluate(()=>window.kinetic.snapshot());assert(fighting.fighters[0].hp<190||fighting.fighters[1].hp<235,'combat produced no damage');
  await page.locator('#hitbox-toggle').click();assert.equal(await page.locator('#hitbox-toggle').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'test-results/combat.png',fullPage:true});
  await page.keyboard.press('Escape');const paused=await page.evaluate(()=>window.kinetic.snapshot());assert(paused.paused);await page.clock.runFor(1000);assert.equal((await page.evaluate(()=>window.kinetic.snapshot())).tick,paused.tick);
  await page.locator('#resume-button').click();await page.locator('#battle-guide').click();assert(await page.locator('#guide-dialog').isVisible());assert((await page.evaluate(()=>window.kinetic.snapshot())).paused);assert(await page.locator('.move-table').isVisible());await page.locator('#close-guide').click();await page.clock.runFor(32);assert(!(await page.evaluate(()=>window.kinetic.snapshot())).paused);
  console.log('PASS: real keyboard movement and combat, hitbox inspector, pause/resume, and fighter move manual.');
  // Run the actual UI clock forward until a match concludes. No state mutation or
  // mocked damage: the CPU must win two rounds through the real combat loop.
  for(let i=0;i<4;i++){
    if((await page.evaluate(()=>window.kinetic.snapshot())).phase==='matchover')break;
    await page.clock.runFor(65000);console.log('match progress',JSON.stringify(await page.evaluate(()=>window.kinetic.snapshot())));
  }
  const finished=await page.evaluate(()=>window.kinetic.snapshot());assert.equal(finished.phase,'matchover');assert(finished.wins.some(w=>w===2));assert(await page.locator('#rematch-button').isVisible());
  await page.locator('#rematch-button').click();assert.deepEqual((await page.evaluate(()=>window.kinetic.snapshot())).wins,[0,0]);
  await page.locator('#back-select').click();await page.setViewportSize({width:390,height:844});await page.clock.runFor(200);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390,'mobile layout overflows');await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  await page.locator('#controls-button').click();assert(await page.locator('#guide-dialog').isVisible());await page.locator('#close-guide').click();
  console.log('PASS: complete best-of-three, rematch, responsive selection, and local assets.');
  // A repository subpath catches leading-slash asset URLs that pass root-hosted QA.
  nestedServer=http.createServer(async(req,res)=>{
    if(!req.url.startsWith('/poketest/')){res.writeHead(404).end('Outside repository path');return;}
    try{const upstream=await fetch(base+req.url.slice('/poketest'.length));res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/octet-stream'});res.end(Buffer.from(await upstream.arrayBuffer()));}
    catch{res.writeHead(502).end('Upstream unavailable');}
  });
  await new Promise(resolve=>nestedServer.listen(0,'127.0.0.1',resolve));
  await page.goto(`http://127.0.0.1:${nestedServer.address().port}/poketest/`);
  await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(250);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(17, 19, 15)');
  assert.equal(await page.locator('.fighter-card').count(),8);
  assert(await page.evaluate(()=>document.fonts.check('700 16px Barlow')),'bundled font failed to load');
  await page.locator('#start-fight').click();await page.clock.runFor(2300);assert.equal((await page.evaluate(()=>window.kinetic.snapshot())).phase,'fighting');
  assert.deepEqual(errors,[]);console.log('PASS: stylesheet, fonts, creature selection, and combat load below /poketest/ with zero browser errors.');
}finally{await browser?.close();nestedServer?.close();server.kill('SIGTERM')}
