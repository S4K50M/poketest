import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {SAVE_KEY} from '../src/world.js';
const port=Number(process.env.BOSS_TEST_PORT||3200),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});};
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results',{recursive:true});
 const art=await browser.newPage({viewport:{width:1440,height:1000}});watch(art);
 await art.route('**/__boss-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Boss mechanics</title><style>body{margin:0;background:#08131c}canvas{display:block}</style>'}));await art.goto(base+'/__boss-review');
 const coverage=await art.evaluate(async()=>{
  const [{RPGCampaign},{ROOMS,BOSSES},{BOSS_ENCOUNTERS,beginBossMove,updateBossEncounter,updateBossHazards},{drawArenaBoss},{drawBossEncounterWorld,drawBossMoveTelegraph,drawBossPlatform,drawBossProjectile,drawBossWeapon},{drawEnemyMinion},{MINIONS}]=await Promise.all([import('/src/rpg.js'),import('/src/world.js'),import('/src/boss-encounters.js'),import('/src/boss-art.js'),import('/src/boss-encounter-render.js'),import('/src/enemy-art.js'),import('/src/designs.js')]);
  const records=[];let count=0;
  for(const[id,profile]of Object.entries(BOSS_ENCOUNTERS))for(let index=0;index<4;index++){
   const g=new RPGCampaign(undefined,{worldSeed:1}),room=Object.values(ROOMS).find(r=>r.enemies.some(e=>e.boss===id));g.loadRoom(room.id,room.enemies.find(e=>e.boss===id).x-170,false);
   const e=g.enemies.find(e=>e.boss===id);Object.assign(e,{introduced:true,phase:3,hp:e.maxHp*.3});if(id==='nullheart')g.faction='wardens';beginBossMove(g,e,index,g.bossInfo(id));
   const cue=structuredClone(e);g.player.x=30;e.timer=1;
   for(let f=0;f<42;f++){g.tick++;updateBossEncounter(g,e,g.bossInfo(id));updateBossHazards(g);}
   records.push({id,index,g,e,cue,profile,b:BOSSES[id]});count++;
  }
  window.__bossReview={records,drawArenaBoss,drawBossEncounterWorld,drawBossMoveTelegraph,drawBossPlatform,drawBossProjectile,drawBossWeapon,drawEnemyMinion,MINIONS};
  return {count,ids:new Set(records.map(r=>r.id)).size};
 });assert.deepEqual(coverage,{count:84,ids:21});
 for(const category of['major','wardens','reavers']){
  const result=await art.evaluate(category=>{
   const api=window.__bossReview,rows=[...new Set(api.records.map(r=>r.id))].filter(id=>category==='wardens'?id.endsWith('-warden'):category==='reavers'?id.endsWith('-reaver'):!id.endsWith('-warden')&&!id.endsWith('-reaver'));
   document.querySelector('canvas')?.remove();const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=rows.length*240;document.body.append(canvas);const c=canvas.getContext('2d');let states=0;
   rows.forEach((id,row)=>api.records.filter(r=>r.id===id).forEach(r=>{
    const x=r.index*360,y=row*240,before=JSON.stringify({e:r.e,h:r.g.bossHazards,p:r.g.platforms});c.save();c.beginPath();c.rect(x,y,360,240);c.clip();c.fillStyle=(row+r.index)%2?'#14272c':'#172e34';c.fillRect(x,y,360,240);c.fillStyle='#dbe9c5';c.font='600 12px sans-serif';c.fillText(r.b.name,x+12,y+20);c.fillStyle='#f4d9a4';c.font='13px sans-serif';c.fillText(r.e.moveName,x+12,y+40);c.fillStyle='#a3beb8';c.font='10px sans-serif';c.fillText('COUNTER: '+r.e.counter.toUpperCase(),x+12,y+57);
    c.translate(x+180,y+213);c.scale(.34,.34);c.translate(-r.cue.x,-520);c.fillStyle='#304740';c.fillRect(r.cue.x-600,520,1200,48);
    for(const p of r.g.platforms.filter(p=>p.bossOwner))api.drawBossPlatform(c,p,2);api.drawBossMoveTelegraph(c,r.cue,2);api.drawBossEncounterWorld(c,r.g,2);api.drawArenaBoss(c,r.e,r.g.bossInfo(id),2);api.drawBossWeapon(c,r.e,2);for(const s of r.g.enemyShots)api.drawBossProjectile(c,s,2);for(const n of r.g.enemies.filter(n=>n.summonedBy))api.drawEnemyMinion(c,n,2,api.MINIONS[n.kind]);c.restore();
    if(before!==JSON.stringify({e:r.e,h:r.g.bossHazards,p:r.g.platforms}))throw Error('boss art mutated simulation');const t=c.getTransform();if(t.a!==1||t.d!==1||t.e!==0||t.f!==0||c.globalAlpha!==1)throw Error('boss art leaked Canvas state');states++;
   }));return {states};
  },category);assert(result.states>0);await art.locator('canvas').screenshot({path:`test-results/boss-signatures-${category}.png`});
 }
 console.log('PASS: all 84 signatures execute in Chromium and render their real warning/active areas, weapons, projectiles, summons, and temporary tiles without mutation.');
 const page=await browser.newPage({viewport:{width:1440,height:1000}});watch(page);await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
 const fixture=new RPGCampaign(undefined,{worldSeed:1});fixture.storyStage=1;fixture.loadRoom('moss-heart',1000,false);await page.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:SAVE_KEY,save:fixture.save()});await page.reload();await page.clock.runFor(50);await page.click('#continue-button');await page.clock.runFor(2200);
 let state=await page.evaluate(()=>window.kinetic.snapshot());let boss=state.enemies.find(e=>e.boss);assert(boss.moveId&&boss.moveName&&boss.counter&&boss.hint);assert((await page.locator('#boss-phase').textContent()).includes(boss.moveName.toUpperCase()));assert(state.phase==='playing');
 await page.screenshot({path:'test-results/boss-battle-desktop.png',animations:'disabled'});
 await page.keyboard.press('Escape');const paused=await page.evaluate(()=>window.kinetic.snapshot());await page.clock.runFor(300);const after=await page.evaluate(()=>window.kinetic.snapshot());assert.equal(after.tick,paused.tick);assert.deepEqual(after.bossHazards,paused.bossHazards);await page.click('[data-resume]');
 await page.keyboard.down('KeyD');await page.clock.runFor(120);await page.keyboard.up('KeyD');await page.keyboard.press('Space');await page.clock.runFor(80);assert((await page.evaluate(()=>window.kinetic.snapshot())).player.y<520);
 await page.setViewportSize({width:844,height:390});await page.clock.runFor(70);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),844);assert(await page.locator('.touch-controls').isVisible());await page.screenshot({path:'test-results/boss-battle-mobile.png',animations:'disabled'});
 await page.keyboard.press('KeyN');await page.click('[data-overlay="codex"]');assert.equal(await page.locator('.boss-field-notes').count(),21);assert.equal(await page.locator('.boss-notes li').count(),84);await page.locator('.boss-field-notes summary').first().click();assert(await page.locator('.boss-notes').first().locator('li').first().isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),844);
 assert.deepEqual(errors,[]);console.log('PASS: live named boss attacks and counter hints, pause-safe hazards, real movement/jumps, desktop/mobile landscape, and no JavaScript/asset errors.');
}finally{await browser?.close();server.kill();}
