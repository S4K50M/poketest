import { ROSTER, findFighter, ARENAS, getMove } from './roster.js';
import { CombatEngine } from './engine.js';
import { paintPortrait, ArenaRenderer } from './render.js';
import { TrainingUI, PATH_GUIDE } from './training-ui.js';

const $=id=>document.getElementById(id);
let selected='pyrojaw',opponent='voltantis',game=null,view='select',sound=false,audio=null,guideTab='basics';
const pressed=new Set();let accumulator=0,last=performance.now(),heroLast=0;
const renderer=new ArenaRenderer($('arena-canvas'));
const statNames=['POWER','MOBILITY','DEFENSE','TECHNIQUE'];

function tone(freq=200,duration=.08,type='sine',volume=.05){
  if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.3),audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{/* Audio is optional. */}
}
const training=new TrainingUI({onExit:returnToSelect,onArena:()=>{training.stop();startMatch()},onSound:e=>{
  if(['jump','dash','walljump'].includes(e.type))tone(e.type==='dash'?320:460,.07,'triangle',.02);
  if(['hit','pogo','slam','hurt'].includes(e.type))tone(e.type==='hurt'?80:180,.12,'sawtooth',.035);
  if(['learned','checkpoint','relic','complete'].includes(e.type))tone(700,.25,'sine',.035);
}});
function startTraining(){view='training';game=null;pressed.clear();training.start(selected);}
$('start-training').addEventListener('click',startTraining);$('nav-path').addEventListener('click',startTraining);
function buildRoster(){
  $('roster-grid').innerHTML=ROSTER.map((d,i)=>`<button class="fighter-card" data-fighter="${d.id}" style="--fighter-color:${d.color}" aria-label="Select ${d.name}, ${d.element} ${d.role}" aria-pressed="false"><span class="card-num">${String(i+1).padStart(2,'0')}</span><canvas aria-hidden="true"></canvas><span class="card-bottom"><span class="card-name">${d.name.toUpperCase()}</span><span class="card-element">${d.element.toUpperCase()}<i></i></span></span></button>`).join('');
  document.querySelectorAll('.fighter-card').forEach(card=>card.addEventListener('click',()=>selectFighter(card.dataset.fighter)));
  selectFighter(selected);
}
function selectFighter(id){
  selected=id;const d=findFighter(id),i=ROSTER.indexOf(d);
  if(opponent===selected)opponent=ROSTER[(i+1)%ROSTER.length].id;
  $('preview-element').textContent=`◈ ${d.element.toUpperCase()} / ${d.role.toUpperCase()}`;
  $('fighter-preview').style.setProperty('--accent',d.color);
  $('preview-watermark').textContent=String(i+1).padStart(2,'0');$('preview-number').textContent=`KM—${String(i+1).padStart(3,'0')}`;
  $('preview-archetype').textContent=d.archetype.toUpperCase();$('preview-name').innerHTML=d.name.toUpperCase()+'<span>↗</span>';
  $('class-badge').innerHTML=d.element.toUpperCase()+'<br>CLASS';$('detail-title').innerHTML=d.title;$('detail-desc').textContent=d.description;
  $('fighter-stats').innerHTML=d.stats.map((s,i)=>`<div class="stat"><span>${statNames[i]}</span><div class="stat-bars" aria-label="${s} of 5">${Array.from({length:5},(_,n)=>`<i class="${n<s?'filled':''}"></i>`).join('')}</div></div>`).join('');
  $('signature-name').textContent=d.signature;$('signature-desc').textContent=d.signatureDesc;$('signature-keys').innerHTML=d.keys.map(k=>k==='+'?'<b>+</b>':`<kbd>${k}</kbd>`).join('<b>›</b>');
  $('difficulty-pips').innerHTML=Array.from({length:5},(_,n)=>`<i class="${n<d.difficulty?'filled':''}"></i>`).join('');
  document.querySelector('.hero-caption').innerHTML=`<span>${d.epithet.toUpperCase()}</span><span>ORIGINAL SPECIMEN / ${String(i+1).padStart(3,'0')}</span>`;
  $('hero-canvas').setAttribute('aria-label',`Original illustration of ${d.name}, ${d.description}`);
  $('opponent-select').innerHTML=ROSTER.filter(d=>d.id!==selected).map(d=>`<option value="${d.id}" ${d.id===opponent?'selected':''}>${d.name.toUpperCase()}</option>`).join('');
  updateCards();tone(500,.05,'triangle',.025);
}
function updateCards(){
  document.querySelectorAll('.fighter-card').forEach(card=>{const d=findFighter(card.dataset.fighter);card.classList.toggle('selected',d.id===selected);card.classList.toggle('cpu',d.id===opponent);card.setAttribute('aria-pressed',d.id===selected);paintPortrait(card.querySelector('canvas'),d);});
  paintPortrait($('opponent-avatar'),findFighter(opponent),{face:-1});
}
$('opponent-select').addEventListener('change',e=>{opponent=e.target.value;updateCards();tone(400,.05)});
$('sound-toggle').addEventListener('click',()=>{sound=!sound;$('sound-toggle').classList.toggle('on',sound);$('sound-toggle').setAttribute('aria-label',sound?'Disable sound':'Enable sound');$('sound-toggle').innerHTML=`♪ <span>SOUND ${sound?'ON':'OFF'}</span>`;tone(660,.2,'triangle');if(training.active)$('path-canvas').focus({preventScroll:true});else if(game)$('arena-canvas').focus({preventScroll:true});});

let calloutUntil=0,lastComboSide=0;
function onCombatEvent(e){
  renderer.event(e);
  const messages={fight:'FIGHT!',counter:'COUNTER HIT',wall:'WALL SPLAT',break:'WALL BREAK · LOWER TIER',ringout:'RING OUT',tech:'THROW ESCAPE',guardbreak:'GUARD SHATTERED',parry:e.name,stance:e.name,install:'DRAGON INSTALL',clone:e.name,armor:'SUPER ARMOR'};
  if(messages[e.type]){$('combat-callout').textContent=messages[e.type];calloutUntil=performance.now()+1300;}
  if(e.type==='unavailable'&&e.side===0){$('combat-callout').textContent=e.name;calloutUntil=performance.now()+1000;}
  if(e.type==='hit'||e.type==='throw'){lastComboSide=e.side;tone(e.move?.type==='heavy'?100:175,.13,'sawtooth',.04);}
  if(e.type==='block')tone(440,.07,'triangle',.035);
  if(e.type==='parry'||e.type==='tech')tone(820,.15,'triangle',.04);
  if(e.type==='wall'||e.type==='break')tone(55,.4,'sawtooth',.06);
  if(e.type==='burst')tone(300,.8,'sawtooth',.045);
  if(e.type==='roundend')tone(440,.4,'triangle',.05);
}
function startMatch(){
  training.stop();
  game=new CombatEngine(selected,opponent,{arena:$('arena-select').value,difficulty:$('ai-level').value,onEvent:onCombatEvent});
  view='game';pressed.clear();accumulator=0;renderer.effects=[];$('selection-screen').hidden=true;$('game-screen').hidden=false;
  $('player-name').textContent=findFighter(selected).name.toUpperCase();$('enemy-name').textContent=findFighter(opponent).name.toUpperCase();
  $('arena-canvas').tabIndex=0;$('arena-canvas').focus({preventScroll:true});$('round-overlay').hidden=false;window.scrollTo({top:0,behavior:'instant'});tone(170,.2,'sawtooth',.03);updateHUD();
}
function returnToSelect(){
  training.stop();
  if($('guide-dialog').open)$('guide-dialog').close();view='select';game=null;pressed.clear();$('game-screen').hidden=true;$('selection-screen').hidden=false;$('start-fight').focus({preventScroll:true});updateCards();window.scrollTo({top:0,behavior:'smooth'});
}
function togglePause(value){
  if(!game||game.phase==='matchover')return;game.paused=value??!game.paused;pressed.clear();game.setInputs(0,{});$('pause-button').innerHTML=`${game.paused?'RESUME':'PAUSE'} <kbd>ESC</kbd>`;updateHUD();if(!game.paused)$('arena-canvas').focus({preventScroll:true});
}
$('start-fight').addEventListener('click',startMatch);$('back-select').addEventListener('click',returnToSelect);$('select-button').addEventListener('click',returnToSelect);$('rematch-button').addEventListener('click',startMatch);$('resume-button').addEventListener('click',()=>togglePause(false));$('pause-button').addEventListener('click',()=>togglePause());
$('hitbox-toggle').addEventListener('click',()=>{renderer.hitboxes=!renderer.hitboxes;$('hitbox-toggle').textContent=`HITBOXES ${renderer.hitboxes?'ON':'OFF'}`;$('hitbox-toggle').setAttribute('aria-pressed',renderer.hitboxes)});
$('nav-arena').addEventListener('click',()=>{if(view!=='select')returnToSelect();else $('start-fight').scrollIntoView({behavior:'smooth',block:'center'})});
$('nav-roster').addEventListener('click',()=>{if(view!=='select')returnToSelect();$('roster-grid').scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('.fighter-card.selected').focus({preventScroll:true})});

const basicGuide=`
<div class="guide-row"><span><kbd>W</kbd> <kbd>S</kbd><br><kbd>A</kbd> <kbd>D</kbd></span><span><strong>Own your axis.</strong> W / S sidestep into the background / foreground. D advances toward your opponent. Hold A to retreat and automatically guard. Inputs stay relative when sides switch.</span></div>
<div class="guide-row"><span><kbd>A</kbd> <kbd>A</kbd><br><kbd>SPACE</kbd></span><span><strong>Make them miss.</strong> Double-tap A / D to backdash / dash. Tap S to cancel a backdash, then A again to chain it. Space jumps; lightweights air-dash on a second press. Zephyrix double-jumps.</span></div>
<div class="guide-row"><span><kbd>J</kbd> <kbd>K</kbd></span><span><strong>Earn the opening.</strong> J is a fast jab (8–14f by fighter; 10f standard). Time repeated jabs on hit to cancel into a string. K is a slower launcher. Hit an opponent during startup for a counter-hit bonus. Sidesteps dodge narrow attacks.</span></div>
<div class="guide-row"><span><kbd>L</kbd> + DIRECTION</span><span><strong>Channel your element.</strong> Hold W, S, D, or A and press L for four signature techniques; neutral L is a fifth attack. Specials cost stamina and have individual cooldowns. Fire leaves burn zones and chips guard. Electric adds +3f stun. Ice slows dashes and sidesteps 30%. Steel has one hit of startup armor.</span></div>
<div class="guide-row"><span><kbd>U</kbd> <kbd>I</kbd></span><span><strong>Crack the defense.</strong> U throws through guard; the defender has 12f to press U and escape. Blocking depletes guard; a break leaves you stunned. I activates a cinematic, armored Synergy Burst once per round when HP is below 25% or Kinetic Gauge is full.</span></div>
<div class="guide-row"><span>WALLS & ROUNDS</span><span><strong>Take the fight downstairs.</strong> Launch into walls for a guaranteed follow-up window. Heavy impacts damage and break walls into a lower tier. Break a lower-tier wall for a ring-out. Win 2 rounds; each lasts 60 seconds. Timeout compares remaining HP percentage. Exact ties replay the round.</span></div>`;
function updateGuide(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.tab===guideTab));
  if(guideTab==='basics'){$('guide-body').innerHTML=training.active?PATH_GUIDE:basicGuide;return;}
  const d=findFighter(selected),f=game?.fighters[0]||{};
  const moves=[['J',getMove(d,'jab')],['K',getMove(d,'heavy')],['U',getMove(d,'grab')],...Object.entries(d.specials).map(([dir,m])=>[({neutral:'L',forward:'D + L',back:'A + L',up:'W + L',down:'S + L'})[dir],m])];
  if(d.id==='pyrojaw')moves.push(['D, S, D + K',getMove(d,'godfist')]);
  if(d.id==='ferrodrake')moves.push(['A + K',getMove(d,'heavy','back')]);
  if(d.id==='zephyrix')moves.push(['AIR S + K',getMove(d,'heavy','down',{y:1})]);
  moves.push(['I',getMove(d,'burst')]);
  $('guide-body').innerHTML=`<h3 class="guide-fighter-label">${d.name.toUpperCase()} <small> / ${d.hp} HP</small></h3><table class="move-table"><thead><tr><th>INPUT</th><th>TECHNIQUE</th><th>START / ACTIVE / REC.</th><th>BASE DMG</th></tr></thead><tbody>${moves.map(([key,m])=>`<tr><td>${key}</td><td>${m.name}</td><td>${m.startup} / ${m.active} / ${m.recovery}</td><td>${m.damage||'—'}</td></tr>`).join('')}</tbody></table><p class="move-notes">${d.signatureDesc}<br>Base damage scales with fighter power, counter-hits, and juggle decay. Specials cost 0–35 stamina and recover individually. Green outlines show hurtboxes; red shows an active attack’s horizontal reach. The engine also checks depth and height.</p>`;
}
let guideWasPaused=false;
function showGuide(tab='basics'){guideTab=tab;guideWasPaused=training.active?training.game.paused:game?.paused??false;if(training.active)training.pause(true);else if(game&&!game.paused)togglePause(true);updateGuide();$('guide-dialog').showModal();}
function closeGuide(){ $('guide-dialog').close(); }
for(const id of ['nav-guide','controls-button'])$(id).addEventListener('click',()=>showGuide());$('battle-guide').addEventListener('click',()=>showGuide('moves'));$('close-guide').addEventListener('click',closeGuide);
$('guide-dialog').addEventListener('close',()=>{if(training.active&&!guideWasPaused)training.pause(false);else if(game&&!guideWasPaused)togglePause(false)});
$('guide-dialog').addEventListener('click',e=>{if(e.target===$('guide-dialog')){const r=$('guide-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGuide()}});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{guideTab=b.dataset.tab;updateGuide()}));

const movement={KeyW:'up',KeyS:'down',KeyA:'back',KeyD:'forward',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'back',ArrowRight:'forward'};
const attacks={KeyJ:'jab',KeyK:'heavy',KeyL:'special',KeyU:'grab',KeyI:'burst',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash'};
function sampleInputs(){if(game)game.setInputs(0,{up:pressed.has('KeyW')||pressed.has('ArrowUp'),down:pressed.has('KeyS')||pressed.has('ArrowDown'),back:pressed.has('KeyA')||pressed.has('ArrowLeft'),forward:pressed.has('KeyD')||pressed.has('ArrowRight')});}
window.addEventListener('keydown',e=>{
  if($('guide-dialog').open)return;
  if(view!=='game')return;
  if(e.code==='Escape'){e.preventDefault();if(!e.repeat)togglePause();return;}
  if(!movement[e.code]&&!attacks[e.code])return;
  // Native controls retain keyboard behavior. Tab focus can still reach pause/rematch.
  if(e.target instanceof HTMLButtonElement||e.target instanceof HTMLSelectElement){if(e.code==='Space')return;}
  e.preventDefault();if(e.repeat)return;pressed.add(e.code);sampleInputs();
  if(movement[e.code])game.input(0,movement[e.code]);if(attacks[e.code])game.input(0,attacks[e.code]);
});
window.addEventListener('keyup',e=>{pressed.delete(e.code);sampleInputs()});
window.addEventListener('blur',()=>{pressed.clear();sampleInputs();if(view==='game'&&game&&!game.paused)togglePause(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&!game.paused)togglePause(true)});

function updateHUD(){
  if(!game)return;
  const [p,e]=game.fighters;
  for(const [f,prefix] of [[p,'player'],[e,'enemy']]){
    const hp=`${Math.max(0,f.hp/f.data.hp*100)}%`;
    $(prefix+'-hp').style.width=hp;$(prefix+'-hp-ghost').style.width=hp;$(prefix+'-hp-number').textContent=`${Math.ceil(f.hp)} / ${f.data.hp}`;
    $(prefix+'-guard').style.width=f.guard+'%';$(prefix+'-burst').style.width=f.kinetic+'%';
    const ready=!f.burstUsed&&(f.rage||f.kinetic>=100);$(prefix+'-burst-label').textContent=f.burstUsed?'BURST EXPENDED':ready?prefix==='player'?'SYNERGY READY · PRESS I':'SYNERGY BURST READY':'KINETIC GAUGE';$(prefix+'-burst-label').classList.toggle('ready',ready);
    const wins=game.wins[f.side];const html=[0,1].map(n=>`<i class="${n<wins?'won':''}"></i>`).join('');if($(prefix+'-rounds').innerHTML!==html)$(prefix+'-rounds').innerHTML=html;
  }
  $('round-timer').textContent=String(Math.max(0,Math.ceil(game.time/60))).padStart(2,'0');$('round-label').textContent=`ROUND ${String(game.round).padStart(2,'0')}`;document.querySelector('.timer-box').classList.toggle('urgent',game.time<600);
  $('arena-name').innerHTML=`${ARENAS[game.arena].name}<i> / </i>TIER 0${game.tier+1}`;
  const combo=game.fighters[lastComboSide];$('combo-display').hidden=combo.combo<2||combo.comboTime<=0;$('combo-display').classList.toggle('enemy',lastComboSide===1);$('combo-display').innerHTML=`<strong>${combo.combo}</strong><span>HIT COMBO</span><small>${combo.comboDamage} DAMAGE</small>`;
  const statuses=[`STAMINA ${Math.floor(p.stamina)}%`];if(p.frost>0)statuses.push('FROSTBITE −30%');if(p.burn>0)statuses.push('BURN');if(p.data.id==='terrakhan')statuses.push(p.stance.toUpperCase()+' STANCE');if(p.install>0)statuses.push('DRAGON INSTALL');if(p.clone)statuses.push('CLONE ARMED');if(p.attack?.move.type==='parry')statuses.push('COUNTER READY');
  const cooldowns=Object.entries(p.cooldowns).filter(([,v])=>v>0).map(([d,v])=>`${{neutral:'L',up:'W+L',down:'S+L',forward:'D+L',back:'A+L'}[d]} ${(v/60).toFixed(1)}s`);
  if(cooldowns.length)statuses.push(cooldowns.join(' · '));
  $('status-display').innerHTML=statuses.map(s=>`<span>${s}</span>`).join('');
  $('wall-integrity').textContent=`${Math.round(game.walls.reduce((s,v)=>s+v,0)/8)}%`;
  if(p.attack){const a=p.attack,m=a.move,phase=a.frame<m.startup?'STARTUP':a.frame<m.startup+m.active?'ACTIVE':'RECOVERY';$('frame-readout').textContent=`${m.name.toUpperCase()} / ${phase} ${a.frame}F`;}else $('frame-readout').textContent=p.stun?'HIT STUN':p.blocking?'GUARDING':p.y>.1?'AIRBORNE':'NEUTRAL';
  $('combat-state').textContent=game.paused?'SIMULATION PAUSED':'60 HZ COMBAT ENGINE';
  const show=game.paused||game.phase!=='fighting';$('round-overlay').hidden=!show;
  $('overlay-buttons').hidden=!(game.paused||game.phase==='matchover');$('resume-button').hidden=!game.paused||game.phase==='matchover';$('rematch-button').hidden=game.phase!=='matchover';
  if(show){
    if(game.paused){$('overlay-kicker').textContent='TAKE A BREATH';$('overlay-title').textContent='PAUSED';$('overlay-subtitle').textContent='ESC TO GET BACK IN THE FIGHT';}
    else if(game.phase==='intro'){$('overlay-kicker').textContent=game.round===1?'IRON FIST ARENA':'KEEP THE PRESSURE ON';$('overlay-title').textContent=game.phaseTime<45?'READY?':`ROUND ${game.round}`;$('overlay-subtitle').textContent=`${p.data.name.toUpperCase()}  VS  ${e.data.name.toUpperCase()}`;}
    else if(game.phase==='roundover'||game.phase==='matchover'){
      $('overlay-kicker').textContent=game.phase==='matchover'?'MATCH COMPLETE':game.time<=0?'TIME UP':'KNOCKOUT';
      $('overlay-title').textContent=game.roundWinner===null?'DRAW':game.phase==='matchover'?game.roundWinner===0?'YOU WIN':'DEFEATED':game.roundWinner===0?'ROUND WON':'ROUND LOST';
      $('overlay-subtitle').textContent=game.roundWinner===null?'DEAD EVEN. RUN IT AGAIN.':`${game.fighters[game.roundWinner].data.name.toUpperCase()} TAKES IT · ${game.wins[0]} — ${game.wins[1]}`;
    }
  }
}
function animate(clock){
  const delta=Math.min(140,clock-last);last=clock;
  if(view==='select'){
    if(clock-heroLast>32){paintPortrait($('hero-canvas'),findFighter(selected),{hero:true,time:clock/1000});heroLast=clock;}
  }else if(view==='training'){
    training.frame(clock,delta);
  }else if(game){
    accumulator+=delta;let steps=0;while(accumulator>=1000/60&&steps<9){game.step();accumulator-=1000/60;steps++;}
    renderer.render(game,clock);updateHUD();if(clock>calloutUntil)$('combat-callout').textContent='';
  }
  requestAnimationFrame(animate);
}
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(view==='select')updateCards()},100)});
buildRoster();requestAnimationFrame(animate);

// A read-only snapshot is convenient for browser QA and frame-data inspection.
window.kinetic={snapshot:()=>training.active?training.game.snapshot():game?{phase:game.phase,paused:game.paused,tick:game.tick,time:game.time,wins:[...game.wins],round:game.round,tier:game.tier,fighters:game.fighters.map(f=>({id:f.data.id,hp:f.hp,x:f.x,z:f.z,y:f.y,guard:f.guard,kinetic:f.kinetic,stamina:f.stamina,move:f.attack?.move.name||null}))}:{phase:'selection',player:selected,opponent}};
