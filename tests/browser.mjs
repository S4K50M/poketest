import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import http from 'node:http';
import {CampaignEngine} from '../src/campaign.js';
import {playCampaign,walkTo} from './helpers/campaign-route.js';
import {SAVE_KEY,ROOMS} from '../src/world.js';

const port=Number(process.env.TEST_PORT||3100),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser,nestedServer;const errors=[];
try{
  let ready=false;for(let i=0;i<50;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install();mkdirSync('test-results',{recursive:true});
  const snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());
  const clock=ms=>page.clock.runFor(ms);
  const downKeys=new Set();
  async function keys(wanted=[]){for(const k of [...downKeys])if(!wanted.includes(k)){await page.keyboard.up(k);downKeys.delete(k);}for(const k of wanted)if(!downKeys.has(k)){await page.keyboard.down(k);downKeys.add(k);}}
  async function driveTo(x,max=500){
    let jumpingUntil=0;
    for(let i=0;i<max;i++){
      const s=await snapshot(),p=s.player;if(await page.locator('#overlay').isVisible())throw Error('Unexpected overlay while walking: '+await page.locator('#overlay-title').textContent());
      if(Math.abs(p.x-x)<25&&p.grounded){await keys();await clock(120);return s;}
      const moves=Math.abs(p.x-x)<20?[]:[p.x<x?'KeyD':'KeyA'];
      const room=ROOMS[s.room],edge=room.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x&&p.x<=b.x+b.w);
      if(p.grounded&&edge&&x>p.x&&edge.x+edge.w-p.x<90||p.wall)jumpingUntil=s.tick+32;
      if(s.tick<jumpingUntil)moves.push('Space');
      await keys(moves);
      if(s.enemies.some(e=>e.hp>0&&Math.abs(e.x-p.x)<120))await page.keyboard.press('KeyK');
      if(room.thorns?.some(h=>p.x>h.x&&p.x<h.x+h.w)&&!p.grounded&&p.vy>0)await page.keyboard.press('ShiftLeft');
      await clock(85);
    }
    throw Error('walk timed out: '+JSON.stringify(await snapshot()));
  }
  assert.equal((await snapshot()).phase,'selection');assert.equal(await page.locator('#opponent-select').count(),0);assert.equal(await page.locator('.companion-card').count(),3);assert.equal(await page.locator('.biome-card').count(),6);
  await page.screenshot({path:'test-results/campaign-home.png',fullPage:true});
  await page.click('#atlas-button');assert.equal(await page.locator('.map-node').count(),10);await page.screenshot({path:'test-results/campaign-atlas.png'});await page.click('#close-overlay');
  await page.click('#start-button');assert.equal(await page.locator('[data-party-slot="0"] option').count(),8);await page.selectOption('[data-party-slot="1"]','noxshade');await page.selectOption('[data-party-slot="2"]','noxshade');assert.equal(new Set((await snapshot()).party).size,3);await page.selectOption('[data-party-slot="1"]','voltantis');await page.selectOption('[data-party-slot="2"]','zephyrix');
  await page.click('#confirm-expedition');await keys(['KeyD']);await clock(650);await keys();assert(await page.locator('#overlay').isVisible());assert.match(await page.locator('#overlay-title').textContent(),/Professor Vell/);for(let i=0;i<4;i++)await page.keyboard.press('KeyE');assert(!(await snapshot()).paused);
  await driveTo(1050);await page.keyboard.press('KeyE');await clock(100);assert.equal((await snapshot()).room,'moss-path');
  await driveTo(300);await page.keyboard.press('KeyE');await page.keyboard.press('KeyI');assert(await page.locator('#overlay').isVisible());assert.equal(await page.locator('.item-tile').count(),7);assert.equal(await page.locator('.ability-card').count(),6);await page.click('[data-craft="fang"]');assert.match(await page.locator('#overlay-content').textContent(),/MISSING MATERIALS/);await page.keyboard.press('KeyI');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'world-canvas');await page.keyboard.press('Digit2');await clock(350);assert.equal((await snapshot()).player.id,'voltantis');await page.click('[data-switch="2"]');await clock(350);assert.equal((await snapshot()).player.id,'zephyrix');await page.keyboard.press('KeyQ');await clock(350);assert.equal((await snapshot()).player.id,'pyrojaw');
  await page.keyboard.press('KeyM');const paused=await snapshot();await clock(500);assert.equal((await snapshot()).tick,paused.tick);assert.equal(paused.visited.length,2);await page.keyboard.press('KeyM');
  // Real browser traversal crosses the gap and enters the first guardian chamber.
  await driveTo(2370);await page.keyboard.press('KeyE');await clock(100);assert.equal((await snapshot()).room,'moss-heart');await driveTo(850);
  let jumpUntil=0;
  for(let i=0;i<650;i++){
    const s=await snapshot(),e=s.enemies.find(e=>e.boss&&e.hp>0);if(!e)break;const p=s.player,dx=e.x-p.x;
    const moves=[];if(dx>60)moves.push('KeyD');if(dx< -60)moves.push('KeyA');if(!p.grounded&&Math.abs(dx)<90)moves.push('KeyS');if(p.grounded&&e.state==='windup')jumpUntil=s.tick+30;if(s.tick<jumpUntil)moves.push('Space');
    await keys(moves);await page.keyboard.press('KeyK');if(i%12===0){await keys();await page.keyboard.press('KeyL');}if(p.hp<2)await page.keyboard.press('KeyV');await clock(85);
  }
  await keys();await clock(150);const won=await snapshot();assert(won.fragments.includes('briar'));assert(won.abilities.includes('claw'));assert(won.unlocked.includes('mycora'));assert(await page.locator('[data-dismiss-reward]').isVisible());await page.screenshot({path:'test-results/campaign-first-guardian.png'});await page.click('[data-dismiss-reward]');
  const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SAVE_KEY);assert(persisted.fragments.includes('briar'));await page.reload();await clock(100);await page.click('#continue-button');await clock(100);assert((await snapshot()).fragments.includes('briar'));assert.equal((await snapshot()).enemies[0].hp,0);
  await driveTo(270);await page.keyboard.press('KeyE');await page.keyboard.press('Escape');await page.click('[data-overlay="party"]');assert.equal(await page.locator('[data-party-slot="0"] option').count(),9);await page.selectOption('[data-party-slot="0"]','mycora');await page.click('[data-resume]');assert.equal((await snapshot()).player.id,'mycora');
  await page.keyboard.press('Escape');const pause=await snapshot();await clock(300);assert.equal((await snapshot()).tick,pause.tick);await page.click('[data-resume]');assert.equal(await page.evaluate(()=>document.activeElement.id),'world-canvas');
  console.log('PASS: original party selection, story, real traversal, minion combat, guardian victory, ability/companion rewards, save/reload, recruitment, map, inventory and pause.');

  // Earn every later fixture through the headless input controller, then render
  // those legitimate checkpoints in Chromium. No invented progression flags.
  const checkpoints=[],earned=new CampaignEngine();playCampaign(earned,{onGuardian:g=>checkpoints.push(JSON.parse(JSON.stringify(g.save())))});
  for(let i=1;i<checkpoints.length;i++){
    await page.click('#home-button');await page.click('[data-return-home]');
    await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s:checkpoints[i]});await page.reload();await clock(100);await page.click('#continue-button');await clock(100);await driveTo(850);await clock(150);const s=await snapshot();assert.equal(s.biome,['moss','forge','reef','storm','frost','rift'][i]);assert(await page.locator('#boss-hud').isVisible());await page.screenshot({path:`test-results/campaign-${s.biome}.png`});await page.keyboard.press('KeyI');assert.equal(await page.locator('.ability-card:not(.locked)').count(),s.abilities.length);await page.keyboard.press('KeyI');
  }
  await page.keyboard.press('KeyN');await page.click('[data-overlay="codex"]');assert.equal(await page.locator('.codex-card').count(),35);await page.screenshot({path:'test-results/campaign-journal.png'});await page.click('#close-overlay');
  await page.click('#home-button');await page.click('[data-return-home]');await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:SAVE_KEY,s:earned.save()});await page.reload();await clock(100);await page.click('#continue-button');assert((await snapshot()).finished);assert(await page.locator('[data-ending="restore"]').isVisible());await page.click('[data-ending="restore"]');assert.equal((await snapshot()).ending,'restore');assert.match(await page.locator('#overlay-title').textContent(),/world remembers/);await page.click('[data-resume]');await page.keyboard.press('KeyM');assert.equal(await page.locator('.map-node.locked').count(),0);await page.click('#close-overlay');
  console.log('PASS: all six biome renderers, guardian rigs, progressive ability inventory, completed campaign reload, and full story bestiary.');

  await page.setViewportSize({width:390,height:844});await clock(180);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'test-results/campaign-mobile.png'});assert(await page.locator('.touch-controls').isVisible());const prior=(await snapshot()).player.x;const touchBox=await page.locator('[data-hold="right"]').boundingBox();await page.mouse.move(touchBox.x+20,touchBox.y+20);await page.mouse.down();await clock(200);await page.mouse.up();assert((await snapshot()).player.x>prior);await page.click('[data-overlay="inventory"]');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'test-results/campaign-mobile-pack.png'});await page.click('#close-overlay');await page.click('#home-button');await page.click('[data-return-home]');await page.screenshot({path:'test-results/campaign-mobile-home.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  console.log('PASS: mobile layout, touch movement, inventory and home screen without horizontal overflow.');

  nestedServer=http.createServer(async(req,res)=>{if(!req.url.startsWith('/poketest/')){res.writeHead(404).end();return;}try{const r=await fetch(base+req.url.slice('/poketest'.length));res.writeHead(r.status,{'Content-Type':r.headers.get('content-type')||'application/octet-stream'});res.end(Buffer.from(await r.arrayBuffer()));}catch{res.writeHead(502).end();}});
  await new Promise(resolve=>nestedServer.listen(0,'127.0.0.1',resolve));await page.goto(`http://127.0.0.1:${nestedServer.address().port}/poketest/`);await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(12, 23, 35)');assert.equal(await page.locator('.biome-card').count(),6);await page.click('#start-button');await page.click('#confirm-expedition');assert.equal((await snapshot()).mode,'campaign');
  console.log('PASS: relative CSS, bundled script, fonts and playable campaign under a GitHub-style /poketest/ hosting path.');
  assert.deepEqual(errors,[]);console.log('All campaign browser checks passed. No JavaScript errors or failed assets.');
}finally{if(browser)await browser.close();if(nestedServer)await new Promise(resolve=>nestedServer.close(resolve));server.kill();}
