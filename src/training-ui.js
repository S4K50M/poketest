import { TrainingEngine, LESSONS } from './training.js';
import { TrainingRenderer } from './training-render.js';
import { HEAL } from './adventure.js';
import { MINIONS } from './designs.js';
import { fitCanvas, paintPortrait } from './render.js';
import { drawMinion } from './creatures.js';

const $=id=>document.getElementById(id);
export const PATH_GUIDE=`<div class="guide-row"><span>A / D</span><span>Move left and right. Unlike the arena, directions stay fixed in the side-view level.</span></div><div class="guide-row"><span>SPACE</span><span>Hold for a high jump, tap for a short hop. Press again for a double-jump. You have 7 frames of ledge grace and an 8-frame jump buffer. Push into a wall and jump to kick off it.</span></div><div class="guide-row"><span>SHIFT</span><span>Dash on the ground or once in the air. Landing, wall-jumping, and bouncing restore your air dash. A dash briefly protects you from enemy contact; thorns still require clearance.</span></div><div class="guide-row"><span>J / S + J / K</span><span>J slashes. Hold S while airborne and press J to strike down. Bounce off the glowing bell or an enemy to gain height. K hits harder with a longer recovery.</span></div><div class="guide-row"><span>L / E / R</span><span>L casts an elemental bolt using Focus. Landing hits restores Focus. E rests at the current waylight. R returns to your checkpoint. Lessons heal you and activate the next waylight automatically.</span></div><div class="guide-row"><span>THE PATH</span><span>Six gates verify movement skills. Collect six optional Echo Shards, then defeat the husks and Brass Warden. Watch enemy wind-ups and attack during recovery. Escape pauses.</span></div>`;
export const PARTY_GUIDE=`<div class="guide-row"><span>1 / 2 / 3 · Q</span><span>Switch between your three chosen companions or cycle with Q. Each keeps its own hearts, Focus, and skill cooldown. Position, momentum, status effects and jump/dash limits carry across the switch. A fainted creature rests until a waylight restores the party.</span></div><div class="guide-row"><span>HOLD F</span><span>Stand still on the ground to channel a heal for 0.8 seconds. One heart costs 33 Focus. Moving, attacking, taking a hit, switching, or releasing F interrupts the channel. There is no invulnerability while healing.</span></div><div class="guide-row"><span>L · DIRECTION + L</span><span>Neutral L uses your creature’s signature skill; hold a direction for its alternate. Terrakhan taps L for Fissure Stamp, or holds L for Fortress Shell and releases a shockwave. See Fighter Moves for your current companion.</span></div><div class="guide-row"><span>E · B · M</span><span>E restores the whole party at a lit waylight. B spends Lumens to forge a Heartwood Charm there: +1 heart to each companion and +8% damage, up to three times. M opens the field journal. Wild encounters and shards grant shared Bond XP, health and damage on level-up. Defeated enemies grant rewards once.</span></div>`;

export class TrainingUI{
  constructor({onExit,onArena,onSound}){
    this.active=false;this.game=null;this.pressed=new Set();this.accumulator=0;this.last=0;this.renderer=new TrainingRenderer($('path-canvas'));this.onExit=onExit;this.onArena=onArena;this.onSound=onSound;
    $('path-exit').addEventListener('click',onExit);$('path-overlay-exit').addEventListener('click',onExit);$('path-pause').addEventListener('click',()=>this.pause());$('path-resume').addEventListener('click',()=>{this.pause(false);$('path-canvas').focus()});$('path-retry').addEventListener('click',()=>{this.game.input('retry');$('path-canvas').focus()});$('path-again').addEventListener('click',()=>this.start(this.game.party.map(m=>m.data.id)));$('path-to-arena').addEventListener('click',onArena);
    $('path-journal-button').addEventListener('click',()=>this.openJournal());$('close-journal').addEventListener('click',()=>$('field-journal').close());$('field-journal').addEventListener('close',()=>{if(this.active&&!this.journalWasPaused)this.pause(false)});
    $('path-party').addEventListener('click',e=>{const button=e.target.closest('[data-switch-slot]');if(button){this.game.input('slot'+(Number(button.dataset.switchSlot)+1));$('path-canvas').focus()}});
    $('path-coach-toggle').addEventListener('click',()=>{const collapsed=$('path-coach').classList.toggle('collapsed');$('path-coach-toggle').textContent=collapsed?'SHOW +':'HIDE −';$('path-coach-toggle').setAttribute('aria-expanded',!collapsed);$('path-canvas').focus()});
    window.addEventListener('keydown',e=>this.keydown(e));window.addEventListener('keyup',e=>{this.pressed.delete(e.code);if(this.active){this.sample();if(e.code==='Space')this.game.releaseJump();if(e.code==='KeyF')this.game.releaseHeal();if(e.code==='KeyL')this.game.releaseSpecial();}});
    window.addEventListener('blur',()=>{if(this.active)this.pause(true)});document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.active)this.pause(true)});
  }
  start(id){
    this.active=true;this.game=new TrainingEngine(id,{onEvent:e=>{this.renderer.event(e);this.onSound(e)}});this.renderer.reset();this.pressed.clear();this.accumulator=0;
    $('path-party').innerHTML=this.game.party.map((m,i)=>`<button data-switch-slot="${i}" style="--member-color:${m.data.color}" aria-label="Switch to ${m.data.name}"><kbd>${i+1}</kbd><canvas aria-hidden="true"></canvas><span>${m.data.name.toUpperCase()}</span><div class="member-hp"><i></i></div><div class="member-focus"><i></i></div></button>`).join('');
    $('training-screen').hidden=false;$('selection-screen').hidden=true;$('game-screen').hidden=true;$('path-canvas').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});this.update();
    document.querySelectorAll('#path-party canvas').forEach((c,i)=>paintPortrait(c,this.game.party[i].data));
  }
  stop(){this.active=false;this.pressed.clear();if($('field-journal').open)$('field-journal').close();$('training-screen').hidden=true;}
  pause(value){if(!this.active||this.game.phase==='complete')return;this.game.paused=value??!this.game.paused;this.pressed.clear();this.game.releaseHeal();this.game.player.specialHeld=false;this.game.player.fortress=false;this.sample();this.update();if(!this.game.paused)$('path-canvas').focus({preventScroll:true});}
  sample(){this.game.setInputs({left:this.pressed.has('KeyA')||this.pressed.has('ArrowLeft'),right:this.pressed.has('KeyD')||this.pressed.has('ArrowRight'),down:this.pressed.has('KeyS')||this.pressed.has('ArrowDown'),up:this.pressed.has('KeyW')||this.pressed.has('ArrowUp')});}
  keydown(e){
    if(!this.active||$('guide-dialog').open||$('field-journal').open)return;
    if(e.code==='KeyM'){e.preventDefault();if(!e.repeat)this.openJournal();return;}
    const actions={Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyJ:'light',KeyK:'heavy',KeyL:'special',KeyE:'interact',KeyR:'retry',KeyF:'heal',KeyB:'upgrade',KeyQ:'switch',Digit1:'slot1',Digit2:'slot2',Digit3:'slot3'};
    if(!actions[e.code]&&!['KeyA','KeyD','KeyW','KeyS','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.code))return;
    if(e.code==='Space'&&e.target instanceof HTMLButtonElement)return;
    e.preventDefault();if(e.repeat)return;if(e.code==='Escape'){this.pause();return;}
    this.pressed.add(e.code);this.sample();if(actions[e.code])this.game.input(actions[e.code]);
  }
  frame(clock,delta){
    if(!this.active)return;
    this.accumulator+=delta;let steps=0;while(this.accumulator>=1000/60&&steps++<9){this.game.step();this.accumulator-=1000/60;}
    this.renderer.render(this.game,clock);this.update();
  }
  update(){
    const g=this.game,p=g.player,lesson=LESSONS[g.lesson],complete=g.phase==='complete';
    $('path-fighter-name').textContent=g.data.name.toUpperCase()+' / '+g.data.types.join(' · ').toUpperCase();
    const masks=Array.from({length:p.maxHp},(_,i)=>`<i class="${i+1<=p.hp?'filled':i<p.hp?'half':''}"></i>`).join('');if($('path-health').innerHTML!==masks)$('path-health').innerHTML=masks;$('path-health').setAttribute('aria-label',`${p.hp} of ${p.maxHp} health`);
    document.querySelectorAll('#path-party [data-switch-slot]').forEach((b,i)=>{const m=g.party[i];b.classList.toggle('active',g.activeSlot===i);b.classList.toggle('fainted',m.hp<=0);b.setAttribute('aria-pressed',g.activeSlot===i);b.querySelector('.member-hp i').style.width=Math.max(0,m.hp/m.maxHp*100)+'%';b.querySelector('.member-focus i').style.width=m.spirit+'%';b.title=`${m.data.name}: ${m.hp}/${m.maxHp} hearts · ${Math.floor(m.spirit)} Focus${m.skillCooldown?' · skill '+(m.skillCooldown/60).toFixed(1)+'s':''}`;});
    $('path-bond-label').textContent='BOND LV. '+g.level;$('path-lumens').textContent=g.lumens+' LUMENS';$('path-xp-fill').style.width=(g.level===5?100:Math.min(100,g.xp/(g.level*60)*100))+'%';$('path-bond-xp').textContent=g.level===5?'MAX BOND':g.xp+' / '+g.level*60+' XP';
    $('path-heal').hidden=!p.healHeld&&!p.healing;$('path-heal-fill').style.width=p.healProgress/HEAL.frames*100+'%';$('path-heal-label').textContent=p.hp>=p.maxHp?'HEALTH RESTORED':p.spirit<HEAL.cost?'NEED 33 FOCUS':p.healing?'FOCUSING · HOLD F':'STAND STILL TO FOCUS';
    const statuses=[];if(p.slow)statuses.push('STATIC SLOW');if(p.root)statuses.push('ROOTED');if(p.slick)statuses.push('BUBBLE SLICK');if(p.burn)statuses.push('BURN');if(p.guard)statuses.push('AEGIS READY');if(p.fortress)statuses.push('FORTRESS SHELL');if(g.decoy)statuses.push('MIRAGE SET');if(g.switchCooldown)statuses.push('SWITCH '+(g.switchCooldown/60).toFixed(1)+'s');$('path-statuses').textContent=statuses.join(' · ');
    $('path-spirit-fill').style.width=p.spirit+'%';$('path-shards').textContent=String(g.relics.filter(r=>r.collected).length).padStart(2,'0');
    $('path-chapter').textContent=`FIELD LESSON ${String(g.lesson+1).padStart(2,'0')} / 06`;$('path-zone').textContent=lesson.zone;
    const progress=LESSONS.map((l,i)=>`<i class="${g.completed[i]?'done':i===g.lesson?'current':''}" title="${l.name}"></i>`).join('');if($('path-progress').innerHTML!==progress)$('path-progress').innerHTML=progress;
    $('path-lesson').textContent=lesson.name+'.';$('path-hint').textContent=lesson.hint;$('path-keys').innerHTML=lesson.keys.map(k=>`<kbd>${k}</kbd>`).join('<span>→</span>');
    $('path-goal').textContent=g.completed[g.lesson]?'✓ LESSON LEARNED — FOLLOW THE PATH':lesson.goal;$('path-goal').classList.toggle('done',g.completed[g.lesson]);
    $('path-next').textContent=g.completed[g.lesson]?'THE WAY IS OPEN':'FOLLOW THE WAYLIGHT';$('path-toast').textContent=g.messageTime>0?g.message:'';
    $('path-pause').innerHTML=`${g.paused?'RESUME':'PAUSE'} <kbd>ESC</kbd>`;$('path-overlay').hidden=!g.paused&&!complete;
    $('path-overlay-kicker').textContent=complete?'THE HOLLOW FOUNDRY / COMPLETE':'TAKE A BREATH';$('path-overlay-title').textContent=complete?'INSTINCT AWAKENED.':'PAUSED';$('path-overlay-description').textContent=complete?'“YOU DID NOT LEARN TO MOVE. YOU LEARNED TO TRUST YOURSELF.” — PROF. VELL':'YOUR NEXT STEP IS WAITING.';
    $('path-resume').hidden=complete;$('path-again').hidden=!complete;$('path-to-arena').hidden=!complete;$('path-results').hidden=!complete;
    if(complete)$('path-results').innerHTML=`<span><b>${g.relics.filter(r=>r.collected).length}/6</b>ECHO SHARDS</span><span><b>${g.stats.minions}</b>MINIONS</span><span><b>${g.level}</b>BOND LEVEL</span><span><b>${g.stats.switches}</b>PARTNER SWITCHES</span>`;
  }
  openJournal(){
    if(!this.active||$('field-journal').open)return;
    const g=this.game;this.journalWasPaused=g.paused;this.pause(true);
    $('journal-progress').innerHTML=`<span>BOND LEVEL <b>${g.level}</b></span><span>LUMENS <b>${g.lumens}</b></span><span>HEARTWOOD <b>+${g.upgrades}</b></span><span>NEXT FORGE <b>${g.upgrades===3?'MAX':24+g.upgrades*20}</b></span>`;
    $('journal-party').innerHTML=g.party.map((m,i)=>`<article><span class="journal-slot">0${i+1}</span><div><h4>${m.data.name.toUpperCase()} <small>${m.data.types.join(' / ')}</small></h4><p>${m.hp}/${m.maxHp} hearts · ${Math.floor(m.spirit)} Focus</p><p><b>${m.data.skill}</b> / ${m.data.directional}</p><p>${m.data.signatureDesc}</p></div></article>`).join('');
    $('journal-discovered').textContent=g.discovered.size+' / 5 ENCOUNTERED';
    $('journal-minions').innerHTML=Object.entries(MINIONS).map(([id,d])=>`<article class="journal-species ${g.discovered.has(id)?'seen':''}"><canvas data-species="${id}" aria-hidden="true"></canvas><div><h4>${d.name} <small>${d.types}</small></h4><p>${d.hint}</p><span>${d.hp} HP · ${d.xp} BOND XP · ${d.coins} LUMENS</span></div></article>`).join('');
    $('field-journal').showModal();
    document.querySelectorAll('#journal-minions canvas').forEach(canvas=>{const {c,w,h}=fitCanvas(canvas);c.clearRect(0,0,w,h);c.save();c.translate(w*.5,h*.78);c.scale(1.1,1.1);drawMinion(c,{x:0,y:0,kind:canvas.dataset.species,id:1,face:1,state:'patrol'},0);c.restore();});
  }
}
