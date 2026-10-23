import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {BOSS_AFTERMATH} from '../src/boss-aftermath.js';
import {SAVE_KEY} from '../src/world.js';
import {playCampaign,guardianPlan} from './helpers/campaign-route.js';
import {playChronicle} from './helpers/chronicle-route.js';

const port=Number(process.env.AFTERMATH_TEST_PORT||3245),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;const errors=[];
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));mkdirSync('test-results',{recursive:true});
 const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot()),held=new Set();
 async function keys(wanted=[]){for(const key of [...held])if(!wanted.includes(key)){await page.keyboard.up(key);held.delete(key);}for(const key of wanted)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}}
 async function skipEncounter(){if(await page.locator('#encounter-skip').isVisible()){await keys();await page.click('#encounter-skip');await clock(34);}}
 async function load(save){
  await keys();await skipEncounter();
  if(!(await page.locator('#home-screen').isVisible())){
   if(await page.locator('#overlay').isVisible()){if(await page.locator('[data-return-home]').isVisible())await page.click('[data-return-home]');else await page.click('#close-overlay');}
   if(!(await page.locator('#home-screen').isVisible())){await page.click('#home-button');await page.click('[data-return-home]');}
  }
  await page.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:SAVE_KEY,save});await page.reload();await page.evaluate(()=>document.fonts.ready);await clock(100);await page.click('#continue-button');await clock(100);
 }
 async function walk(x){for(let i=0;i<200;i++){await skipEncounter();const s=await snapshot();if(Math.abs(s.player.x-x)<22&&s.player.grounded){await keys();await clock(100);return;}await keys([s.player.x<x?'KeyD':'KeyA']);await clock(50);}throw Error('Cannot reach aftermath '+JSON.stringify(await snapshot()));}
 async function readLore(boss){
  const before=await snapshot(),object=before.bossAftermath.find(o=>o.boss===boss);assert(object,boss+' leaves an inspectable object');await walk(object.x);await page.keyboard.press('KeyE');const read=await snapshot();
  assert(read.dialogue.active,boss+' responds to E');assert.equal(read.dialogue.kind,'conversation');assert.equal(read.dialogue.source.id,object.id);assert.equal(read.dialogue.speaker,object.lines[0][0]);assert.equal(read.dialogue.text,object.lines[0][1]);assert(!read.paused);assert(!(await page.locator('#overlay').isVisible()));assert(await page.locator('#world-dialogue').isVisible());
  await clock(300);assert((await snapshot()).tick>read.tick,'lore stays in the moving world');await page.keyboard.press('KeyE');assert.equal((await snapshot()).dialogue.text,object.lines[1][1]);await page.keyboard.press('KeyE');assert(!(await snapshot()).dialogue.active);return object;
 }

 // The first checkpoint, including every resource and ability, is earned by
 // actual traversal and mixed combat. This browser fight uses keyboard input.
 let beforeBriar;const first=new RPGCampaign(undefined,{worldSeed:1});playCampaign(first,{chapters:1,onGuardian:g=>beforeBriar=structuredClone(g.save())});await load(beforeBriar);await walk(850);
 let sawBoss=false;
 for(let i=0;i<2200;i++){
  await skipEncounter();const s=await snapshot();if(!s.enemies.some(e=>e.boss&&e.hp>0))break;sawBoss=true;assert.equal(s.phase,'playing','a reactive mixed-attack route remains winnable');assert(!(await page.locator('#overlay').isVisible()));
  const plan=guardianPlan(s),moves=[];if(plan.inputs.left)moves.push('KeyA');if(plan.inputs.right)moves.push('KeyD');if(plan.inputs.down)moves.push('KeyS');if(plan.shield)moves.push('KeyG');if(plan.heal)moves.push('KeyF');if(plan.jump||!s.player.grounded&&s.player.vy<0)moves.push('Space');await keys(moves);
  const actionKeys={light:'KeyJ',heavy:'KeyK',special:'KeyL',power:'KeyX',dash:'ShiftLeft',potion:'KeyV',surge:'KeyR',slot1:'Digit1',slot2:'Digit2',slot3:'Digit3'};for(const action of plan.actions)await page.keyboard.press(actionKeys[action]);await clock(34);
 }
 await keys();const victory=await snapshot();assert(sawBoss);assert(!victory.enemies.some(e=>e.boss&&e.hp>0));assert(victory.fragments.includes('briar'));assert(victory.abilities.includes('claw'));assert(victory.unlocked.includes('mycora'));assert.equal(await page.locator('[data-dismiss-reward]').count(),0);assert(!(await page.locator('#overlay').isVisible()));assert(!victory.paused);const frames=[];
 for(const [name,advance]of[['impact',0],['rooting',1000],['unfurling',2000],['settled',2100]]){
  await clock(advance);frames.push(await page.locator('#world-canvas').evaluate(canvas=>canvas.toDataURL()));
  await page.screenshot({path:`test-results/aftermath-briar-${name}.png`,animations:'disabled'});
 }
 assert.equal(new Set(frames).size,4,'the real arena renders distinct impact, growing roots, unfurling and completed tree frames');assert((await snapshot()).tick>victory.tick);await readLore('briar');await page.screenshot({path:'test-results/aftermath-briar-tree.png',animations:'disabled'});
 await page.reload();await clock(100);await page.click('#continue-button');await clock(100);assert(!(await page.locator('#overlay').isVisible()));await readLore('briar');
 console.log('PASS: an earned live guardian victory grants rewards immediately, never opens a victory modal or pauses play, and leaves persistent E-readable tree lore.');

 // Earn the six-gate journey and all three forbidden guardians. Saving the
 // checkpoint after each actual victory tests persistence without invented
 // fragments, defeated flags, equipment, or boss damage.
 const victories=new Map(),earned=new RPGCampaign(undefined,{worldSeed:1});playChronicle(earned,{onVictory:g=>{for(const e of g.enemies)if(e.hp<=0&&BOSS_AFTERMATH[e.boss])victories.set(e.boss,structuredClone(g.save()));}});assert.equal(victories.size,9);
 const forms=new Set();
 for(const [boss,save]of victories){
  await load(save);const s=await snapshot();assert(!(await page.locator('#overlay').isVisible()),boss+' completion does not reopen a reward');assert(!s.cinematic.active,'defeated guardians do not replay their entrance');const object=s.bossAftermath.find(o=>o.boss===boss);assert(object);assert.equal(object.form,BOSS_AFTERMATH[boss].form);forms.add(object.form);assert(s.interactionObjects.some(o=>o.id===object.id));assert.equal(s.enemies.find(e=>e.boss===boss).hp,0);
  if(!['crown','nullheart'].includes(boss)){await readLore(boss);if(['bell','conductor','hourglass'].includes(boss))await page.screenshot({path:`test-results/aftermath-${boss}-remains.png`,animations:'disabled'});}
  else{
   await walk(object.x);await page.keyboard.press('KeyE');
   if(boss==='crown'){assert(await page.locator('[data-ending="restore"]').isVisible());assert(await page.locator('[data-ending="release"]').isVisible());await page.click('#close-overlay');}
   else{assert((await snapshot()).cinematic.active);assert.equal((await snapshot()).cinematic.mode,'ending');assert.equal((await snapshot()).cinematic.boss,'nullheart');await skipEncounter();assert(await page.locator('.true-ending').isVisible());await page.click('[data-resume]');}
  }
 }
 assert.equal(forms.size,9,'all essential guardians leave distinct setpieces');
 // The Stag remains an E-readable stopped clock through a second full reload.
 await load(victories.get('hourglass'));await readLore('hourglass');await page.reload();await clock(100);await page.click('#continue-button');await clock(100);assert.equal((await readLore('hourglass')).form,'stoppedclock');
 console.log('PASS: nine distinct earned aftermath setpieces, fire ashes, the returning sky guardian, stopped-clock lore across reloads, and intentional Worldheart/Cradle endings.');

 // Use the real death/retry rules to derive a revived-gate presentation save.
 // It retains the earned fragment but must render the living boss, no tree.
 const revived=new RPGCampaign(undefined,{save:victories.get('briar')});revived.beginGameOver();assert(revived.retryAfterDeath());revived.loadRoom('moss-heart',850,false);await load(revived.save());await skipEncounter();const returned=await snapshot();assert(returned.fragments.includes('briar'));assert(returned.enemies.some(e=>e.boss==='briar'&&e.hp>0));assert(!returned.bossAftermath.some(o=>o.boss==='briar'));assert(!returned.interactionObjects.some(o=>o.id==='aftermath:briar'));assert.equal(await page.locator('[data-dismiss-reward]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: dying in a cleared gate revives its guardian and suppresses obsolete aftermath scenery; no JavaScript or asset errors.');
}finally{await browser?.close();server.kill();}
