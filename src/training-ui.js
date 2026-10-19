import { TrainingEngine, LESSONS } from './training.js';
import { TrainingRenderer } from './training-render.js';

const $=id=>document.getElementById(id);
export const PATH_GUIDE=`<div class="guide-row"><span>A / D</span><span>Move left and right. Unlike the arena, directions stay fixed in the side-view level.</span></div><div class="guide-row"><span>SPACE</span><span>Hold for a high jump, tap for a short hop. Press again for a double-jump. You have 7 frames of ledge grace and an 8-frame jump buffer. Push into a wall and jump to kick off it.</span></div><div class="guide-row"><span>SHIFT</span><span>Dash on the ground or once in the air. Landing, wall-jumping, and bouncing restore your air dash. A dash briefly protects you from enemy contact; thorns still require clearance.</span></div><div class="guide-row"><span>J / S + J / K</span><span>J slashes. Hold S while airborne and press J to strike down. Bounce off the glowing bell or an enemy to gain height. K hits harder with a longer recovery.</span></div><div class="guide-row"><span>L / E / R</span><span>L casts an elemental bolt using Focus. Landing hits restores Focus. E rests at the current waylight. R returns to your checkpoint. Lessons heal you and activate the next waylight automatically.</span></div><div class="guide-row"><span>THE PATH</span><span>Six gates verify movement skills. Collect six optional Echo Shards, then defeat the husks and Brass Warden. Watch enemy wind-ups and attack during recovery. Escape pauses.</span></div>`;

export class TrainingUI{
  constructor({onExit,onArena,onSound}){
    this.active=false;this.game=null;this.pressed=new Set();this.accumulator=0;this.last=0;this.renderer=new TrainingRenderer($('path-canvas'));this.onExit=onExit;this.onArena=onArena;this.onSound=onSound;
    $('path-exit').addEventListener('click',onExit);$('path-overlay-exit').addEventListener('click',onExit);$('path-pause').addEventListener('click',()=>this.pause());$('path-resume').addEventListener('click',()=>{this.pause(false);$('path-canvas').focus()});$('path-retry').addEventListener('click',()=>{this.game.input('retry');$('path-canvas').focus()});$('path-again').addEventListener('click',()=>this.start(this.game.data.id));$('path-to-arena').addEventListener('click',onArena);
    $('path-coach-toggle').addEventListener('click',()=>{const collapsed=$('path-coach').classList.toggle('collapsed');$('path-coach-toggle').textContent=collapsed?'SHOW +':'HIDE −';$('path-coach-toggle').setAttribute('aria-expanded',!collapsed);$('path-canvas').focus()});
    window.addEventListener('keydown',e=>this.keydown(e));window.addEventListener('keyup',e=>{this.pressed.delete(e.code);if(this.active){this.sample();if(e.code==='Space')this.game.releaseJump()}});
    window.addEventListener('blur',()=>{if(this.active)this.pause(true)});document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.active)this.pause(true)});
  }
  start(id){
    this.active=true;this.game=new TrainingEngine(id,{onEvent:e=>{this.renderer.event(e);this.onSound(e)}});this.renderer.reset();this.pressed.clear();this.accumulator=0;
    $('training-screen').hidden=false;$('selection-screen').hidden=true;$('game-screen').hidden=true;$('path-canvas').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});this.update();
  }
  stop(){this.active=false;this.pressed.clear();$('training-screen').hidden=true;}
  pause(value){if(!this.active||this.game.phase==='complete')return;this.game.paused=value??!this.game.paused;this.pressed.clear();this.sample();this.update();if(!this.game.paused)$('path-canvas').focus({preventScroll:true});}
  sample(){this.game.setInputs({left:this.pressed.has('KeyA')||this.pressed.has('ArrowLeft'),right:this.pressed.has('KeyD')||this.pressed.has('ArrowRight'),down:this.pressed.has('KeyS')||this.pressed.has('ArrowDown'),up:this.pressed.has('KeyW')||this.pressed.has('ArrowUp')});}
  keydown(e){
    if(!this.active||$('guide-dialog').open)return;
    const actions={Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyJ:'light',KeyK:'heavy',KeyL:'special',KeyE:'interact',KeyR:'retry'};
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
    $('path-fighter-name').textContent=g.data.name.toUpperCase()+' / PILGRIM';
    const masks=Array.from({length:p.maxHp},(_,i)=>`<i class="${i<p.hp?'filled':''}"></i>`).join('');if($('path-health').innerHTML!==masks)$('path-health').innerHTML=masks;$('path-health').setAttribute('aria-label',`${p.hp} of ${p.maxHp} health`);
    $('path-spirit-fill').style.width=p.spirit+'%';$('path-shards').textContent=String(g.relics.filter(r=>r.collected).length).padStart(2,'0');
    $('path-chapter').textContent=`FIELD LESSON ${String(g.lesson+1).padStart(2,'0')} / 06`;$('path-zone').textContent=lesson.zone;
    const progress=LESSONS.map((l,i)=>`<i class="${g.completed[i]?'done':i===g.lesson?'current':''}" title="${l.name}"></i>`).join('');if($('path-progress').innerHTML!==progress)$('path-progress').innerHTML=progress;
    $('path-lesson').textContent=lesson.name+'.';$('path-hint').textContent=lesson.hint;$('path-keys').innerHTML=lesson.keys.map(k=>`<kbd>${k}</kbd>`).join('<span>→</span>');
    $('path-goal').textContent=g.completed[g.lesson]?'✓ LESSON LEARNED — FOLLOW THE PATH':lesson.goal;$('path-goal').classList.toggle('done',g.completed[g.lesson]);
    $('path-next').textContent=g.completed[g.lesson]?'THE WAY IS OPEN':'FOLLOW THE WAYLIGHT';$('path-toast').textContent=g.messageTime>0?g.message:'';
    $('path-pause').innerHTML=`${g.paused?'RESUME':'PAUSE'} <kbd>ESC</kbd>`;$('path-overlay').hidden=!g.paused&&!complete;
    $('path-overlay-kicker').textContent=complete?'THE HOLLOW FOUNDRY / COMPLETE':'TAKE A BREATH';$('path-overlay-title').textContent=complete?'INSTINCT AWAKENED.':'PAUSED';$('path-overlay-description').textContent=complete?'“YOU DID NOT LEARN TO MOVE. YOU LEARNED TO TRUST YOURSELF.” — PROF. VELL':'YOUR NEXT STEP IS WAITING.';
    $('path-resume').hidden=complete;$('path-again').hidden=!complete;$('path-to-arena').hidden=!complete;$('path-results').hidden=!complete;
    if(complete)$('path-results').innerHTML=`<span><b>${g.relics.filter(r=>r.collected).length}/6</b>ECHO SHARDS</span><span><b>${g.stats.falls}</b>RETURNS</span><span><b>${Math.floor(g.tick/3600)}:${String(Math.floor(g.tick/60)%60).padStart(2,'0')}</b>TIME ON THE PATH</span>`;
  }
}
