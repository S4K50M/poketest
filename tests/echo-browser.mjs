import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS,SAVE_KEY} from '../src/world.js';

const port=Number(process.env.ECHO_TEST_PORT||3160),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
const earnedXP=s=>s.xp+Array.from({length:s.level-1},(_,i)=>(i+1)*60).reduce((a,b)=>a+b,0);
try{
  for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}if(i===59)throw Error('Echo server did not start');await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());
  mkdirSync('test-results',{recursive:true});
  function fixture(id,x){
    // Cleared checkpoint fixtures isolate echo interactions from enemy combat.
    // All traversal and collection below use normal keyboard inputs.
    const g=new RPGCampaign();g.storyStage=1;g.abilities.add('wings');g.abilities.add('claw');
    ROOMS[id].enemies.forEach((_,i)=>g.defeated.add(id+':'+i));g.loadRoom(id,x,false);return g.save();
  }
  async function load(s){
    if(!(await page.locator('#home-screen').isVisible())){if(await page.locator('#overlay').evaluate(el=>el.open))await page.click('#close-overlay');await page.keyboard.press('Escape');await page.click('[data-return-home]');}
    await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value:s});
    await page.reload();await clock(100);await page.click('#continue-button');await clock(100);assert.equal((await snapshot()).room,s.room);
  }
  async function resumes(){const tick=(await snapshot()).tick;await clock(200);const s=await snapshot();assert.equal(s.paused,false);assert(s.tick>tick,'simulation continues after collecting echo');assert.deepEqual(errors,[]);}
  async function collected(){assert.equal(await page.locator('#overlay').evaluate(el=>el.open),false,'collecting an echo never opens a paused modal');await resumes();}
  // Includes six base-world records and the three forbidden chronicle records.
  for(const id of ['moss-path','forge-path','reef-path','storm-path','frost-path','rift-path','clockwork-ossuary','paper-moon','cradle-zero','moss-descent','moss-nexus']){
    if(!ROOMS[id])continue;
    const note=ROOMS[id].objects.find(o=>o.kind==='memory');if(!note)continue;
    await load(fixture(id,note.x));const before=await snapshot();
    await page.keyboard.press('KeyE');await collected();
    const first=await snapshot();assert(first.memories.includes(id+':'+note.id));assert.equal(earnedXP(first),earnedXP(before)+30);
    await page.keyboard.press('KeyE');await collected();assert.equal(earnedXP(await snapshot()),earnedXP(first));
    // Longer stories remain accessible by deliberate journal navigation.
    await page.keyboard.press('KeyN');await page.click('[data-chronicle-tab="history"]');assert((await page.locator('.memory-record').allTextContents()).some(text=>text.includes(note.text.split('|')[1])));await page.keyboard.press('KeyN');await resumes();
    await page.reload();await clock(100);await page.click('#continue-button');await page.keyboard.press('KeyE');await collected();
    assert.equal(earnedXP(await snapshot()),earnedXP(first),id+' persists one reward across reload');
  }
  console.log('PASS: keyboard E collects echoes without pausing; full stories remain in history, and repeated inputs/reloads grant rewards once.');
  async function climb(x,y,max=320){
    await page.keyboard.up('Space');
    for(let i=0;i<max;i++){
      const s=await snapshot(),p=s.player;
      if(Math.abs(p.x-x)<14&&Math.abs(p.y-y)<5&&p.grounded){await page.keyboard.up('KeyD');await page.keyboard.up('KeyA');await page.keyboard.up('Space');return;}
      const direction=p.x<x-12?'KeyD':p.x>x+12?'KeyA':null;
      for(const key of ['KeyD','KeyA'])if(key===direction)await page.keyboard.down(key);else await page.keyboard.up(key);
      if(p.grounded&&p.y>y+5){await page.keyboard.up('Space');await page.keyboard.down('Space');}
      else if(!p.grounded&&p.vy>-3&&p.y>y-40){await page.keyboard.up('Space');await page.keyboard.down('Space');}
      await clock(20);
    }
    throw Error('Cannot climb to echo '+JSON.stringify({x,y,state:await snapshot()}));
  }
  for(const id of ['hidden-grove','star-observatory']){
    await load(fixture(id,835));const shrine=ROOMS[id].objects.find(o=>o.kind==='shrine');
    await climb(835,id==='hidden-grove'?310:275);await climb(shrine.x,shrine.y);
    const before=await snapshot();await page.keyboard.press('KeyE');await clock(100);const after=await snapshot();
    assert(after.shrines.includes(id+':'+shrine.id));assert.equal(after.lumens,before.lumens+50);assert.equal(after.inventory.flask,before.inventory.flask+2);await resumes();
    await page.keyboard.press('KeyE');assert.equal((await snapshot()).inventory.flask,after.inventory.flask);await resumes();
    if(id==='hidden-grove')await page.screenshot({path:'test-results/echo-collected.png'});
    await page.reload();await clock(100);await page.click('#continue-button');assert((await snapshot()).shrines.includes(id+':'+shrine.id));
    await climb(835,id==='hidden-grove'?310:275);await climb(shrine.x,shrine.y);await page.keyboard.press('KeyE');await resumes();
    assert.equal((await snapshot()).inventory.flask,after.inventory.flask,'reloaded shrine never duplicates rewards');
  }
  console.log('PASS: both elevated lantern echoes reached with jumps; E collection, repeated collection and reload keep the game running with no browser errors.');
  await load(fixture('moss-path',ROOMS['moss-path'].objects.find(o=>o.kind==='memory').x));
  await page.setViewportSize({width:844,height:390});await clock(100);
  await page.click('.touch-tools [data-action="interact"]');await collected();assert((await snapshot()).memories.includes('moss-path:lore'));
  await page.setViewportSize({width:390,height:844});await clock(100);assert(await page.locator('#rotate-prompt').evaluate(el=>el.open));assert.equal((await snapshot()).paused,true);
  await page.setViewportSize({width:844,height:390});await clock(100);await resumes();
  console.log('PASS: touch echo pickup stays responsive, portrait safely pauses, and returning to landscape resumes normally.');
  assert.deepEqual(errors,[]);
}finally{await browser?.close();server.kill();}
