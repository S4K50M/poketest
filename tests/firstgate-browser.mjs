import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {ROOMS,SAVE_KEY} from '../src/world.js';

const port=Number(process.env.FIRSTGATE_TEST_PORT||3180),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
try{
  for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}if(i===59)throw Error('First-gate test server did not start');await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());
  const held=new Set();
  async function keys(wanted=[]){for(const key of [...held])if(!wanted.includes(key)){await page.keyboard.up(key);held.delete(key);}for(const key of wanted)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}}
  const fixture=new RPGCampaign(undefined,{worldSeed:12345});fixture.storyStage=1;
  // A narrow, cleared-room fixture isolates the landing network from combat.
  // Position, velocity, physics, jump count and health are never changed during
  // traversal: subsequent movement uses the same keyboard inputs as play.
  const room=ROOMS['moss-descent'];assert(room.climbNetwork||room.landingNetwork,'the first gate has a branching landing network');
  room.enemies.forEach((_,n)=>fixture.defeated.add(room.id+':'+n));fixture.loadRoom(room.id,150,false);
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value:fixture.save()});
  await page.reload();await clock(100);await page.click('#continue-button');await clock(100);
  const initial=await snapshot();assert.deepEqual(initial.abilities,['dash']);
  mkdirSync('test-results',{recursive:true});

  async function climb(x,y,max=1000){
    let jumpFrom=(await snapshot()).player.y;
    for(let frame=0;frame<max;frame++){
      const state=await snapshot(),p=state.player;
      if(Math.abs(x-p.x)<15&&Math.abs(y-p.y)<5&&p.grounded){await keys();return state;}
      const wanted=[];if(p.x<x-12)wanted.push('KeyD');else if(p.x>x+12)wanted.push('KeyA');
      const source=room.platforms.find(b=>Math.abs(b.y-p.y)<2&&p.x>=b.x-12&&p.x<=b.x+b.w+12);
      const target=room.platforms.find(b=>Math.abs(b.y-y)<2&&x>=b.x&&x<=b.x+b.w);
      const gap=target?(p.x<x?target.x-p.x:p.x-target.x-target.w):Math.abs(x-p.x),edge=source&&(p.x<x?source.x+source.w-p.x:p.x-source.x);
      if(p.grounded&&(p.y>y+5&&(gap<120||edge<35)||edge<60&&Math.abs(x-p.x)>45)){
        await keys(wanted);jumpFrom=p.y;wanted.push('Space');
      }else if(held.has('Space')&&!p.grounded)wanted.push('Space');
      // First-gate exploration uses only the initial single jump and dash.
      assert(!state.abilities.includes('wings'));assert.equal(state.stats.doubleJumps,0);
      await keys(wanted);await clock(17);
    }
    throw Error('Cannot reach landing '+JSON.stringify({x,y,jumpFrom,state:await snapshot()}));
  }

  // The west and east chains both start on the real lower tunnel. Their
  // separate galleries meet the same upper crossway.
  const network=room.climbNetwork||room.landingNetwork,routes=network.routes,drops=network.drops;
  assert(routes.length>=2);assert(drops.length>=3);
  async function intentionalDrop(drop){
    await climb(drop.from.x,drop.from.y);
    const before=await snapshot();let leftShelf=false,caught,stopped=false;
    const left=drop.direction==='left'||drop.direction<0;
    await keys([left?'KeyA':'KeyD']);
    for(let frame=0;frame<160;frame++){
      await clock(17);const current=await snapshot(),p=current.player;
      if(!stopped&&(left?p.x<=drop.untilX:p.x>=drop.untilX)){await keys();stopped=true;}
      if(!p.grounded)leftShelf=true;
      if(leftShelf&&p.grounded&&p.y>before.player.y+20){caught=current;await keys();break;}
    }
    assert(caught,'walking off the upper landing is caught by another real platform');
    assert(caught.player.y<420,'the catch stays in the upper network instead of dumping onto the bottom floor');
    assert.equal(caught.player.y,drop.catchY??drop.catch?.y);
    assert.equal(caught.player.hp,before.player.hp);assert.equal(caught.stats.falls,before.stats.falls);
    for(const waypoint of drop.return||drop.returnRoute||[])await climb(waypoint.x,waypoint.y);
    await climb(drop.from.x,drop.from.y);
  }
  // Make an actual mistake partway up the first route, then resume from the
  // landing that caught it. No reload or position update repairs the mistake.
  let testedDrop=false;
  for(const waypoint of routes[0].waypoints){
    await climb(waypoint.x,waypoint.y);
    if(!testedDrop&&waypoint.y===drops[0].from.y){await intentionalDrop(drops[0]);testedDrop=true;}
  }
  assert(testedDrop);assert.equal((await snapshot()).stats.falls,initial.stats.falls);
  assert.equal((await snapshot()).stats.doubleJumps,0);
  await page.screenshot({path:'test-results/firstgate-network-desktop.png'});

  // Start the second authored branch from the same entrance fixture. Loading
  // a controlled room is limited to setup, never used to skip a failed jump.
  await keys();await page.keyboard.press('Escape');await page.click('[data-return-home]');
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value:fixture.save()});
  await page.reload();await clock(100);await page.click('#continue-button');await clock(100);
  for(const waypoint of routes[1].waypoints)await climb(waypoint.x,waypoint.y);
  const second=await snapshot();assert.equal(second.stats.falls,0);assert.equal(second.stats.doubleJumps,0);
  await page.setViewportSize({width:844,height:390});await clock(180);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),844);
  assert(await page.locator('.touch-controls').isVisible());
  await page.screenshot({path:'test-results/firstgate-network-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: first-gate branching landings, actual keyboard climb, above-ground catch and return climb without damage/double-jump, desktop/mobile presentation, and no browser or asset errors.');
}finally{await browser?.close();server.kill();}
