import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {RPGCampaign} from '../src/rpg.js';
import {SAVE_KEY} from '../src/world.js';

const port=Number(process.env.ART_TEST_PORT||3190),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:'pipe'});
let browser;
const errors=[];
const watch=page=>{
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
};
try{
  let ready=false;
  for(let i=0;i<60;i++){
    try{if((await fetch(base)).ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert(ready,'isolated art test server starts');mkdirSync('test-results',{recursive:true});
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const art=await browser.newPage({viewport:{width:1600,height:1000}});watch(art);
  // A browser-only review page uses the real Canvas implementation and the
  // same module exports as the game, without a second simulation running.
  await art.route('**/__art-review',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Creature art review</title><style>body{margin:0;background:#08141c}canvas{display:block}</style>'}));
  await art.goto(base+'/__art-review');
  const raster=await art.evaluate(async()=>{
    await import('/src/rpg-world.js');
    const [{ROSTER},{MINIONS},{BOSSES},{drawCreature},{drawEnemyMinion},{drawArenaBoss}]=await Promise.all([import('/src/roster.js'),import('/src/designs.js'),import('/src/world.js'),import('/src/creatures.js'),import('/src/enemy-art.js'),import('/src/boss-art.js')]);
    const entity=(kind,state='patrol',face=1,boss)=>({id:7,kind,boss,x:320,y:430,baseY:430,home:320,face,state,hp:state==='dying'?0:100,maxHp:100,timer:17,phase:2,move:2,pattern:2,flash:state==='stagger'?1:0,stun:state==='stagger'?25:0,recoil:state==='stagger'?8:0,recoilDir:-face,deathTimer:state==='dying'?20:0,introduced:true,vx:0});
    const paint=(c,item,state='idle',face=1,time=2.1,reducedMotion=false)=>{
      if(item.type==='companion')drawCreature(c,item.data,320,430,.72,face,{state,walk:1.2,attack:['attack','heavy'].includes(state)?.8:0,air:state==='air',hit:state==='hit',land:state==='land'?.8:0},time,{attackProgress:.5,speed:state==='walk'?1:0,shieldRatio:.6,deathProgress:.65,reducedMotion,shadow:false});
      else if(item.type==='minion')drawEnemyMinion(c,{...entity(item.id,state,face),reducedMotion},time,item.data);
      else drawArenaBoss(c,{...entity('warden',state,face,item.id),reducedMotion},item.data,time);
    };
    const items=[...ROSTER.map(data=>({type:'companion',id:data.id,data})),...Object.entries(MINIONS).map(([id,data])=>({type:'minion',id,data})),...Object.entries(BOSSES).map(([id,data])=>({type:'boss',id,data}))];
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
    const c=canvas.getContext('2d',{willReadFrequently:true});
    const fingerprint=()=>{
      const pixels=c.getImageData(0,0,640,480).data;let visible=0,hash=2166136261;
      for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]>16)visible++;hash=Math.imul(hash^pixels[i],16777619);hash=Math.imul(hash^pixels[i+1],16777619);hash=Math.imul(hash^pixels[i+2],16777619);hash=Math.imul(hash^pixels[i+3],16777619);}
      return {visible,hash};
    };
    let frames=0,minVisible=Infinity;
    const failures=[];
    for(const item of items){
      const states=item.type==='companion'?['idle','walk','attack','heavy','air','dash','shield','parry','cast','hit','death']:item.type==='minion'?['patrol','windup','charge','attack','leap','recover','stagger','dying']:['patrol','windup','charge','attack','leap','recover','stagger','dying','sealed','enrage'];
      for(const state of states)for(const face of[-1,1]){
        c.clearRect(0,0,640,480);paint(c,item,state,face);const f=fingerprint();frames++;minVisible=Math.min(minVisible,f.visible);
        if(f.visible<100)failures.push(`${item.id}/${state}/${face} has no readable silhouette`);
        const m=c.getTransform();if(m.a!==1||m.b!==0||m.c!==0||m.d!==1||m.e!==0||m.f!==0||c.globalAlpha!==1)failures.push(`${item.id} leaked Canvas state`);
      }
      const idle=item.type==='companion'?'idle':'patrol';
      c.clearRect(0,0,640,480);paint(c,item,idle,1,0,true);const a=fingerprint();
      c.clearRect(0,0,640,480);paint(c,item,idle,1,8,true);const b=fingerprint();
      if(a.hash!==b.hash)failures.push(`${item.id} continues passive motion with reduced motion enabled`);
      c.clearRect(0,0,640,480);paint(c,item,item.type==='companion'?'heavy':'windup',1,8,true);const cue=fingerprint();
      if(cue.hash===b.hash||cue.visible<100)failures.push(`${item.id} loses its action cue with reduced motion enabled`);
    }
    window.__art={items,paint};return {frames,minVisible,failures,counts:{companions:ROSTER.length,minions:Object.keys(MINIONS).length,bosses:Object.keys(BOSSES).length}};
  });
  assert.deepEqual(raster.counts,{companions:11,minions:31,bosses:21});assert.deepEqual(raster.failures,[]);
  console.log(`PASS: ${raster.frames} real-Canvas action/facing frames; all 63 silhouettes and reduced-motion attack cues remain visible.`);

  for(const [type,columns,cellWidth,cellHeight]of[['companion',4,340,300],['minion',5,250,220],['boss',4,360,350]]){
    await art.evaluate(({type,columns,cellWidth,cellHeight})=>{
      document.querySelector('canvas')?.remove();const canvas=document.createElement('canvas'),items=window.__art.items.filter(i=>i.type===type);
      canvas.width=columns*cellWidth;canvas.height=Math.ceil(items.length/columns)*cellHeight;document.body.append(canvas);const c=canvas.getContext('2d');
      items.forEach((item,i)=>{const x=i%columns*cellWidth,y=Math.floor(i/columns)*cellHeight,foot=y+cellHeight-37;
        c.fillStyle=i%2?'#10252c':'#142b31';c.fillRect(x,y,cellWidth,cellHeight);c.fillStyle='#ebdfbd';c.font='600 16px sans-serif';c.fillText(item.data.name,x+17,y+26);c.fillStyle='#819a99';c.font='11px sans-serif';c.fillText(type==='boss'?'PHASE II · WINDUP':type==='minion'?'WINDUP · CONTACT ANATOMY':'IDLE · ARTICULATED COMPANION',x+17,y+44);
        c.strokeStyle='#77968b44';c.lineWidth=1;c.beginPath();c.moveTo(x+15,foot);c.lineTo(x+cellWidth-15,foot);c.stroke();
        c.save();const scale=type==='minion'?1.15:type==='companion'?.92:.9;c.translate(x+cellWidth*.5,foot);c.scale(scale,scale);c.translate(-320,-430);window.__art.paint(c,item,type==='companion'?'idle':'windup',i%2?-1:1);c.restore();
        c.fillStyle='#b3c3ad';c.font='11px monospace';c.fillText(item.id,x+17,y+cellHeight-12);
      });
    },{type,columns,cellWidth,cellHeight});
    const filename=type==='companion'?'companions':type==='minion'?'minions':'bosses';
    await art.locator('canvas').screenshot({path:`test-results/art-${filename}.png`});
  }
  await art.evaluate(()=>{
    document.querySelector('canvas')?.remove();const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1470;document.body.append(canvas);const c=canvas.getContext('2d');
    const selected=['pyrojaw','voltantis','glaciolith','chaincaster','veilwasp','briar','nullheart'].map(id=>window.__art.items.find(item=>item.id===id));
    selected.forEach((item,row)=>{
      const states=item.type==='companion'?['idle','walk','heavy','air','shield','hit']:['patrol','windup','charge','leap','recover','stagger'];
      states.forEach((state,col)=>{const x=col*240,y=row*210;c.fillStyle=(row+col)%2?'#10252c':'#162b32';c.fillRect(x,y,240,210);c.fillStyle='#e7dcc1';c.font='12px sans-serif';c.fillText(`${item.data.name} · ${state}`,x+12,y+22);c.strokeStyle='#72918333';c.beginPath();c.moveTo(x+12,y+188);c.lineTo(x+228,y+188);c.stroke();c.save();c.translate(x+120,y+188);const scale=item.type==='boss'?.56:item.type==='minion'?1.05:.68;c.scale(scale,scale);c.translate(-320,-430);window.__art.paint(c,item,state,col%2?-1:1);c.restore();});
    });
  });
  await art.locator('canvas').screenshot({path:'test-results/art-action-poses.png'});

  const readonly=await art.evaluate(async()=>{
    const [{RPGCampaign},{WorldRenderer}]=await Promise.all([import('/src/rpg.js'),import('/src/world-render.js')]);
    const canvas=document.createElement('canvas');canvas.style.width='1280px';canvas.style.height='660px';document.body.replaceChildren(canvas);
    const g=new RPGCampaign(undefined,{worldSeed:1});g.storyStage=1;g.loadRoom('moss-nexus',1540,false);g.input('light');
    const renderer=new WorldRenderer(canvas),state=()=>JSON.stringify({snapshot:g.snapshot(),enemies:g.enemies,player:g.player,platforms:g.platforms});
    const before=state();renderer.render(g,1000);renderer.render(g,1033);const untouched=before===state(),moving=renderer.actorTime;
    g.paused=true;renderer.render(g,1066);const paused=renderer.actorTime===moving;
    g.paused=false;g.hitstop=5;renderer.render(g,1100);const hitstop=renderer.actorTime===moving;
    g.hitstop=0;renderer.render(g,1133);const resumed=renderer.actorTime>moving;
    // Corpses are presentation-only copies and cannot delay a death/reward.
    const e=g.enemies.find(e=>e.hp>0);e.x+=60;e.y-=42;e.recoil=8;e.hp=0;const deadBefore=state();renderer.render(g,1166);
    const corpse=renderer.corpses.get(e.key??e.id)?.actor;
    return {untouched,paused,hitstop,resumed,corpseReadonly:deadBefore===state(),corpseVisible:!!corpse,finalContact:corpse?.x===e.x&&corpse?.y===e.y&&corpse?.recoil===e.recoil};
  });
  assert.deepEqual(readonly,{untouched:true,paused:true,hitstop:true,resumed:true,corpseReadonly:true,corpseVisible:true,finalContact:true});
  console.log('PASS: integrated world drawing leaves combat state, entities and foot anchors unchanged; actor time stops during pause/hitstop, and death rigs use local copies.');

  const page=await browser.newPage({viewport:{width:1440,height:1000}});watch(page);
  await page.addInitScript(()=>{
    const fill=CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(this.canvas.id==='world-canvas'&&x===0&&y===0&&h===660&&w>200){const m=this.getTransform();window.__artFrame={height:this.canvas.height,floor:m.d*520+m.f,scale:m.d/(this.canvas.height/660)};}return fill.call(this,x,y,w,h);};
  });
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  const clock=ms=>page.clock.runFor(ms),snapshot=()=>page.evaluate(()=>window.kinetic.snapshot());
  const fixture=new RPGCampaign(undefined,{worldSeed:1});fixture.storyStage=1;fixture.loadRoom('moss-heart',850,false);fixture.transition=0;
  await page.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:SAVE_KEY,save:fixture.save()});await page.reload();await clock(50);await page.click('#continue-button');await clock(120);if(await page.locator('#encounter-skip').isVisible()){await page.click('#encounter-skip');await clock(120);}
  assert.equal((await snapshot()).room,'moss-heart');assert((await snapshot()).enemies.some(e=>e.boss==='briar'&&e.hp>0));
  await page.keyboard.down('KeyD');await clock(150);await page.keyboard.up('KeyD');await page.keyboard.press('KeyJ');await clock(70);
  let state=await snapshot();assert(state.player.hp>0&&state.phase==='playing','a live boss battle renders during real movement and attacks');
  assert.equal(state.combat.move,'light1');await page.screenshot({path:'test-results/art-battle-desktop.png',animations:'disabled'});
  await page.keyboard.press('Escape');const pausedTick=(await snapshot()).tick;await clock(200);assert.equal((await snapshot()).tick,pausedTick);await page.click('[data-resume]');await clock(300);
  await page.keyboard.down('KeyG');await clock(80);assert((await snapshot()).combat.shielding);await page.keyboard.up('KeyG');
  await page.keyboard.press('KeyH');await page.click('[data-combat-motion]');assert((await snapshot()).combat.settings.reducedMotion);await page.keyboard.press('KeyH');
  await page.setViewportSize({width:844,height:390});await clock(80);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),844);assert(await page.locator('.touch-controls').isVisible());
  const frame=await page.evaluate(()=>window.__artFrame);assert(frame.scale>.95&&frame.scale<1.06);assert(frame.floor>frame.height*.6&&frame.floor<frame.height*.92,'battle silhouettes remain above the mobile floor');
  const shield=await page.locator('[data-hold="shield"]').boundingBox();assert(shield&&shield.width>=44&&shield.height>=44);
  await page.mouse.move(shield.x+shield.width/2,shield.y+shield.height/2);await page.mouse.down();await clock(80);assert((await snapshot()).combat.shielding);
  await page.screenshot({path:'test-results/art-battle-mobile.png',animations:'disabled'});await page.mouse.up();assert.equal((await snapshot()).combat.shielding,false);
  state=await snapshot();assert(state.player.hp>0);assert.deepEqual(errors,[]);
  await page.click('#mobile-menu-button');await page.click('[data-return-home]');await clock(100);
  const homeArt=await page.locator('#hero-scene').evaluate(c=>c.toDataURL());await clock(500);
  assert.equal(await page.locator('#hero-scene').evaluate(c=>c.toDataURL()),homeArt,'saved reduced-motion preference also freezes home artwork');
  assert.deepEqual(errors,[]);
  console.log('PASS: live boss battle, movement, attacks and shield in desktop/mobile landscape, reduced-motion gameplay, pause safety and no JavaScript or asset errors.');
}finally{if(browser)await browser.close();server.kill();}
