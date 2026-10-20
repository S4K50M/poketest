import { RPGCampaign as CampaignEngine } from './rpg.js';
import {chronicleHTML,merchantHTML,trueEndingHTML,trackedQuestText} from './rpg-ui.js';
import {CHRONICLE_BOSSES} from './chronicle.js';
import {EQUIPMENT,BOND_RANKS} from './rpg-data.js';
import { arsenalHTML } from './combat-ui.js';
import { POWERS } from './combat-data.js';
import { BOSS_ENCOUNTERS } from './boss-encounters.js';
import { WorldRenderer } from './world-render.js';
import {regionAtlas} from './exploration-ui.js';
import { paintPortrait } from './render.js';
import { ROSTER, findFighter } from './roster.js';
import { MINIONS } from './designs.js';
import { ROOMS, BIOMES, BOSSES, CHAPTERS, ABILITIES, ITEMS, CHARMS, DEFAULT_PARTY, SAVE_KEY } from './world.js';
const $=id=>document.getElementById(id);
const readSave=()=>{try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return [2,3,4].includes(s?.version)&&Object.hasOwn(ROOMS,s.room)?s:null;}catch{return null;}};
let rpgTab='quests',orientationBlocked=false;
let saved=readSave(),party=[...DEFAULT_PARTY],game=null,view='home',overlayType='',mapRegion='sanctuary',mapRoom='',dialogue=[],dialogueIndex=0,rewardQueue=[],last=0,accumulator=0,lastHud=0,notice='',noticeFrames=0,sound=false,audioContext=null;
const held=new Set(),canvas=$('world-canvas'),renderer=new WorldRenderer(canvas),heroRenderer=new WorldRenderer($('hero-scene')),modal=$('overlay');
const preview=new CampaignEngine(DEFAULT_PARTY);
const state=()=>game||preview;
const bossCounterLabel=counter=>({'get-close':'GET CLOSE',behind:'GET BEHIND',platform:'TAKE HIGH GROUND',dodge:'DASH CLEAR',jump:'JUMP',retreat:'MOVE AWAY',minions:'DEFEAT SUMMONS',shield:'PARRY / SHIELD'}[counter]||'WATCH THE TELL');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function store(s){saved=s;try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));notice='';}catch{notice='Browser storage is unavailable. Keep this tab open to preserve the journey.';noticeFrames=300;}updateContinue();}
function updateContinue(){saved=readSave()||saved;$('continue-button').hidden=!saved;if(saved){$('continue-button').textContent='CONTINUE JOURNEY →';$('save-caption').textContent=`${BIOMES[ROOMS[saved.room]?.biome||'sanctuary'].name} · ${saved.fragments?.length||0}/6 heart fragments · journey saved`;}}
function tone(type){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain(),frequencies={slash:380,hit:110,hurt:65,jump:290,dash:190,heal:640,relic:820,upgrade:740,bossdefeated:530,cast:460,switch:610,grapple:760};osc.type=['hit','hurt','slam'].includes(type)?'triangle':'sine';osc.frequency.setValueAtTime(frequencies[type]||240,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime((frequencies[type]||240)*.65,audioContext.currentTime+.12);gain.gain.setValueAtTime(.035,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.18);osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.19);}catch{/* Audio is optional. */}}
function mobileLayout(){return window.matchMedia('(any-pointer: coarse)').matches||navigator.maxTouchPoints>0||innerWidth<=760||innerWidth<=1100&&innerHeight<=600;}
function syncMobileLayout(){
  const active=view==='game'&&!!game,mobile=mobileLayout(),viewport=window.visualViewport,portrait=(viewport?.height||innerHeight)>(viewport?.width||innerWidth),blocked=mobile&&portrait,changed=blocked!==orientationBlocked;
  orientationBlocked=blocked;document.body.classList.toggle('mobile-game',active&&mobile);document.body.classList.toggle('orientation-blocked',blocked);
  const rotate=$('rotate-prompt');rotate.hidden=!blocked;if(blocked&&!rotate.open)rotate.showModal();else if(!blocked&&rotate.open)rotate.close();$('game-screen').inert=blocked;$('home-screen').inert=blocked;document.querySelector('.topbar').inert=blocked;modal.inert=blocked;
  if(game){if(changed)clearInputs();game.paused=blocked||modal.open||game.phase==='gameover';}
  if(changed){accumulator=0;if(blocked)$('landscape-button').focus({preventScroll:true});else (modal.open?overlayFocus():active?canvas:$('start-button')).focus({preventScroll:true});}
}
window.addEventListener('resize',syncMobileLayout);window.addEventListener('orientationchange',syncMobileLayout);window.visualViewport?.addEventListener('resize',syncMobileLayout);screen.orientation?.addEventListener('change',syncMobileLayout);window.matchMedia('(any-pointer: coarse)').addEventListener('change',syncMobileLayout);
$('rotate-prompt').addEventListener('cancel',e=>e.preventDefault());
$('landscape-button').onclick=async()=>{
  try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{/* Rotation instructions remain available without fullscreen. */}
  try{await screen.orientation?.lock?.('landscape');}catch{/* Safari and embedded browsers require physical rotation. */}
  syncMobileLayout();if(orientationBlocked)$('rotate-help').textContent='Rotate your device manually, and check that rotation lock is off.';
};
function quickMenuHTML(){return heading('Your next <em>move.</em>','Combat stays under your thumbs. Everything else is one tap away.')+`<div class="quick-menu"><button class="primary" data-resume>RESUME ADVENTURE →</button><div class="quick-section"><p class="eyebrow">01 · RECOVER & PREPARE</p><div class="quick-grid"><button data-quick-action="potion">✚<strong>Drink flask</strong><small>${game?.inventory.flask||0} available · +3 hearts</small></button><button data-quick-action="powerCycle">⇄<strong>Cycle power</strong><small>Change your selected art</small></button><button data-overlay="arsenal">ϟ<strong>Combat arsenal</strong><small>Equip powers & motion options</small></button><button data-overlay="inventory">◇<strong>Inventory</strong><small>Equipment, items & crafting</small></button></div></div><div class="quick-section"><p class="eyebrow">02 · EXPLORE & PROGRESS</p><div class="quick-grid"><button data-overlay="map">⌁<strong>World map</strong><small>Tunnels & wellsprings</small></button><button data-overlay="chronicle">≋<strong>Chronicle</strong><small>Quests, talents & story</small></button><button data-quick-action="tool">⚒<strong>Use tool</strong><small>Current: ${escapeHtml(game?.tools[game.toolIndex]||'pickaxe')}</small></button><button data-overlay="party">⋈<strong>Companions</strong><small>Change roster at a camp station</small></button></div></div><div class="quick-footer"><button data-overlay="guide">CONTROLS & HELP</button><button data-toggle-sound aria-pressed="${sound}">SOUND · ${sound?'ON':'OFF'}</button><button data-return-home>SAVE & RETURN TO CAMP</button></div></div>`;}
function clearInputs(){held.clear();if(game){game.setInputs({});game.releaseJump();game.releaseHeal();game.releaseSpecial();game.releaseShield();}}
function events(e){
  renderer.event(e,game);tone(e.type);
  if(e.type==='gameover'&&game&&view==='game'){rewardQueue=[];openOverlay('gameover');return;}
  if(e.type==='recovery'){notice='WELLSPRING AWAKENED · PARTY FULLY RESTORED';noticeFrames=240;document.body.classList.add('recovery-flash');setTimeout(()=>document.body.classList.remove('recovery-flash'),900);}
  if(e.type==='memory'){notice='ECHO RECORDED · '+e.title+' · N: WORLD HISTORY';noticeFrames=240;}
  if(e.type==='artunlocked'){notice='COMBAT ART AWAKENED · '+e.name+' · H TO EQUIP';noticeFrames=180;}
  if(e.type==='dialogue'){dialogue=e.lines;dialogueIndex=0;openOverlay('dialogue');}
  if(e.type==='workbench')openOverlay('inventory');
  if(e.type==='merchant')openOverlay('merchant');
  if(e.type==='factionchoice'){rpgTab='factions';openOverlay('chronicle');}
  if(e.type==='bossintro'){const b=game?.bossInfo?.(e.boss)||BOSSES[e.boss];notice=b.epithet+' · '+b.name;noticeFrames=160;}
  if(e.type==='bossdefeated'&&(e.miniboss||BOSSES[e.boss]?.miniboss)){notice='GATE CHAMPION DEFEATED · A NEW PASSAGE OPENS';noticeFrames=180;}
  else if(e.type==='bossdefeated'){rewardQueue.push(e.boss);setTimeout(()=>{if(view==='game'&&rewardQueue.length&&!modal.open)openOverlay('reward');},700);}
  if(e.type==='credits')openOverlay('credits');
}
function startCampaign(resume=false){
  closeOverlay(true);rewardQueue=[];game=new CampaignEngine(resume?DEFAULT_PARTY:party,{save:resume?saved:null,onEvent:events,onSave:store});view='game';$('home-screen').hidden=true;$('game-screen').hidden=false;document.body.classList.add('playing');accumulator=0;last=performance.now();lastHud=0;noticeFrames=0;if(!resume||!saved?.combat)game.combat.settings.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;game.save();renderHud();canvas.focus({preventScroll:true});window.scrollTo(0,0);if(game.phase==='gameover')openOverlay('gameover');else if(game.trueEnding)openOverlay('trueending');else if(game.finished&&!game.ending)openOverlay('ending');syncMobileLayout();
}
function returnHome(){if(game)game.save();clearInputs();closeOverlay(true);view='home';$('home-screen').hidden=false;$('game-screen').hidden=true;document.body.classList.remove('playing','game-over','recovery-flash');game=null;syncMobileLayout();renderHomeParty();updateContinue();$('start-button').focus({preventScroll:true});}
function reducedMotion(){return game?.combat?.settings?.reducedMotion??saved?.combat?.settings?.reducedMotion??window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function renderPortraits(){document.querySelectorAll('[data-portrait]').forEach(c=>paintPortrait(c,findFighter(c.dataset.portrait),{hero:c.dataset.hero==='true',reducedMotion:reducedMotion()}));}
let lastPortraitClock=0;
function animatePortraits(clock){
  if(reducedMotion()||clock-lastPortraitClock<100)return;
  lastPortraitClock=clock;
  document.querySelectorAll('[data-portrait][data-hero="true"]').forEach(c=>{
    const r=c.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return;
    paintPortrait(c,findFighter(c.dataset.portrait),{hero:true,time:clock/1000});
  });
}
function renderHomeParty(){
  $('home-party').innerHTML=party.map((id,i)=>{const d=findFighter(id);return `<button class="companion-card" data-build-party style="--creature-glow:${d.color}"><div class="companion-copy"><small>COMPANION 0${i+1}</small><h3>${d.name}</h3><p>${d.role}</p><span>${d.types.join(' / ').toUpperCase()} &nbsp; ↗</span></div><canvas data-portrait="${id}" aria-label="${d.name}"></canvas></button>`;}).join('');renderPortraits();
}
$('biome-cards').innerHTML=CHAPTERS.map((ch,i)=>{const b=BIOMES[ch.id];return `<button class="biome-card" data-map-region="${ch.id}" data-icon="${b.icon}" style="--biome:${b.color};--biome-bg:${b.sky[1]}"><small>CHAPTER 0${i+1}</small><h3>${b.name}</h3><p>${b.subtitle}</p></button>`;}).join('');
function overlayFocus(){return overlayType==='gameover'?modal.querySelector('[data-retry-death]')||modal:$('close-overlay');}
function openOverlay(type){
  if(game?.phase==='gameover')type='gameover';
  if(type==='chronicle')$('overlay-kicker').textContent='THE NINTH MEMORY';
  if(type==='map'&&game){mapRegion=game.room.biome;mapRoom=game.roomId;}
  clearInputs();overlayType=type;modal.dataset.view=type;if(game)game.paused=true;renderOverlay();modal.scrollTop=0;if(!modal.open)modal.showModal();overlayFocus().focus({preventScroll:true});
}
function closeOverlay(force=false){if(game?.phase==='gameover'&&!force)return;if(modal.open)modal.close();overlayType='';if(game){game.paused=orientationBlocked||game.phase==='gameover';if(!orientationBlocked)canvas.focus({preventScroll:true});}clearInputs();}
modal.addEventListener('cancel',e=>{e.preventDefault();if(orientationBlocked||overlayType==='gameover')return;if(overlayType==='dialogue')nextDialogue();else if(overlayType==='reward')dismissReward();else closeOverlay();});
$('close-overlay').onclick=()=>{if(overlayType==='gameover')return;if(overlayType==='reward')dismissReward();else closeOverlay();};
function heading(title,description=''){return `<div class="modal-heading"><h2 id="overlay-title">${title}</h2><p>${description}</p></div>`;}
function renderOverlay(){
  const g=state();$('close-overlay').hidden=overlayType==='gameover';modal.setAttribute('aria-describedby',overlayType==='gameover'?'gameover-description':'overlay-kicker');$('overlay-kicker').textContent={map:'ATLAS OF THE BROKEN WORLD',inventory:'THE TRAVELER’S PACK',party:'BONDS ARE YOUR STRONGEST WEAPON',pause:'TAKE A BREATH',codex:'PROFESSOR VELL’S FIELD JOURNAL',guide:'MOVE WITH INTENT',dialogue:'A VOICE IN THE QUIET',reward:'A MEMORY RETURNS',ending:'THE WORLDHEART REMEMBERS',credits:'YOUR BONDS CHANGED THE WORLD',gameover:'THE GATE REMEMBERS YOUR FALL'}[overlayType]||'KINETIC MONSTERS';
  const content=$('overlay-content');
  if(overlayType==='gameover')content.innerHTML=gameOverHTML(g);
  else if(overlayType==='quick')content.innerHTML=quickMenuHTML();
  else if(overlayType==='arsenal')content.innerHTML=arsenalHTML(g,!!game);
  else if(overlayType==='chronicle')content.innerHTML=chronicleHTML(g,rpgTab,!!game);
  else if(overlayType==='merchant')content.innerHTML=merchantHTML(g,!!game);
  else if(overlayType==='trueending')content.innerHTML=trueEndingHTML(g);
  else if(overlayType==='map')content.innerHTML=mapHTML(g);
  else if(overlayType==='inventory')content.innerHTML=inventoryHTML(g);
  else if(overlayType==='party')content.innerHTML=partyHTML(g);
  else if(overlayType==='codex')content.innerHTML=codexHTML(g);
  else if(overlayType==='guide')content.innerHTML=guideHTML();
  else if(overlayType==='pause')content.innerHTML=`<div class="pause-menu"><p class="eyebrow">${g.room.name.toUpperCase()}</p><h2 id="overlay-title">A quiet moment.</h2><p>Your companions will wait.<br>${notice||'Progress saves at wellsprings, doors, discoveries, and victories.'}</p><button class="primary" data-resume>RETURN TO THE WORLD →</button><button data-overlay="arsenal">KINETIC ARSENAL · POWERS & TECHNIQUES</button><button data-overlay="map">WORLD ATLAS</button><button data-overlay="inventory">INVENTORY & CRAFTING</button><button data-overlay="party">YOUR COMPANIONS</button><button data-overlay="chronicle">CHRONICLES · TALENTS · EQUIPMENT</button><button data-overlay="codex">CREATURE BESTIARY</button><button data-overlay="guide">CONTROLS & TECHNIQUES</button><button data-return-home>SAVE & RETURN TO CAMP</button></div>`;
  else if(overlayType==='dialogue')content.innerHTML=dialogueHTML();
  else if(overlayType==='reward')content.innerHTML=rewardHTML(g);
  else if(overlayType==='ending')content.innerHTML=endingHTML();
  else if(overlayType==='credits')content.innerHTML=creditsHTML(g);
  renderPortraits();
}
function mapHTML(g){
  return heading('Atlas of the <em>broken world.</em>','Six gates. Vast dungeons. Learn the passages, unlock shortcuts, and chart your own way through.')+regionAtlas(g,mapRegion,mapRoom,!!game)+`<p class="modal-note">${g.visited.size} / ${Object.keys(ROOMS).length} places discovered · ${g.fragments.size} / 6 heart fragments · Camps provide travel and crafting. Wellsprings heal automatically and become retry checkpoints. M or Escape to close.</p>`;
}

function inventoryHTML(g){
  const crafting=game&&!!g.atBench?.();
  return heading('Everything you <em>carry.</em>',`${g.lumens} Lumens · Bond level ${g.level} · ${g.equipped.length}/2 charms equipped`)+`<div class="status-note">${crafting?'CAMP IN REACH · Crafting and party changes available.':'CRAFTING · Visit a camp station or the Mender’s Workbench.'}</div>${g.messageTime?`<p class="status-note" role="status">${escapeHtml(g.message)}</p>`:''}<div class="reliquary-banner"><span>NEW · RELIC EQUIPMENT & TALENT BUILDS</span><button class="secondary" data-open-reliquary>OPEN YOUR RELIQUARY ↗</button></div><div class="inventory-grid"><div><h3 class="minor-heading">SUPPLIES & MATERIALS</h3><div class="item-list">${Object.entries(ITEMS).filter(([id])=>!['pickaxe','lantern'].includes(id)).map(([id,d])=>`<div class="item-tile"><span>${d.icon}</span><div><p>${d.name}</p><small>${id==='flask'?'V to restore 3 hearts':'Crafting material'}</small></div><strong>${g.inventory[id]}</strong></div>`).join('')}</div><div class="modal-actions"><button class="secondary" data-craft="flask" ${!crafting?'disabled':''}>CRAFT FLASK · 2 HEARTWOOD</button><button class="secondary" data-use-flask ${!game?'disabled':''}>DRINK FLASK · V</button></div><h3 class="minor-heading">EXPLORATION TOOLS</h3>${['pickaxe','lantern'].map((id,i)=>`<p class="tool-tip"><em>${ITEMS[id].icon} ${ITEMS[id].name}</em> · ${ITEMS[id].description} <span>${game?.toolIndex===i?'[ SELECTED ]':''}</span></p>`).join('')}<p class="tool-tip">C cycles tools · T uses selected tool · U grapples to golden anchors</p><button class="secondary" data-cycle-tool ${!game?'disabled':''}>CYCLE TOOL</button></div><div><h3 class="minor-heading">CHARMS · TWO SLOTS</h3>${Object.entries(CHARMS).map(([id,d])=>`<div class="charm-card ${g.equipped.includes(id)?'equipped':''}"><span class="charm-icon">${d.icon}</span><div><h4>${d.name}</h4><p>${d.description}</p><small>${Object.entries(d.cost).map(([k,n])=>`${n} ${ITEMS[k].name}`).join(' + ')}</small></div><button data-${g.charms.has(id)?'equip':'craft'}="${id}" ${!game||!g.charms.has(id)&&!crafting?'disabled':''}>${g.charms.has(id)?g.equipped.includes(id)?'UNEQUIP':'EQUIP':'CRAFT'}</button></div>`).join('')}<button class="secondary" data-forge ${!crafting?'disabled':''}>HEARTWOOD FORGE +${g.upgrades} · ${24+g.upgrades*20} LUMENS</button><p class="modal-note">Forge upgrades raise the whole party’s health and damage. Wellsprings restore the whole party automatically when you pass through them. Each gate has two or three, placed deeper in its tunnels. A wipe costs 10% of Lumens and revives every enemy in that gate. Story rewards stay yours.</p></div></div><h3 class="minor-heading">AWAKENED ABILITIES · PROGRESSION OPENS THE WORLD</h3><div class="ability-grid">${Object.entries(ABILITIES).map(([id,d])=>`<div class="ability-card ${g.abilities.has(id)?'':'locked'}"><span>${d.icon}</span><h4>${d.name}</h4><p>${d.description}</p><small>${g.abilities.has(id)?d.key:'SLUMBERING · DEFEAT A GUARDIAN'}</small></div>`).join('')}</div>`;
}
function partyHTML(g){
  const ids=game?g.party.map(m=>m.data.id):party,atBench=!game||!!g.atBench?.();
  return heading('Three hearts.<br><em>One heartbeat.</em>','Quick-switch with 1 / 2 / 3 or Q during battle. Each companion keeps its own health, Focus, and elemental skill.')+`<p class="status-note">${atBench?'Choose three distinct companions. Rescued creatures join your sanctuary.':'Your party is traveling. Reach a camp station to change companions.'}</p><div class="party-builder">${ids.map((id,i)=>{const d=findFighter(id);return `<div class="build-slot"><small>COMPANION 0${i+1}</small><canvas data-portrait="${id}" data-hero="true" aria-label="${d.name}"></canvas><select data-party-slot="${i}" aria-label="Companion ${i+1}" ${!atBench?'disabled':''}>${ROSTER.filter(d=>g.unlocked.has(d.id)).map(d=>`<option value="${d.id}" ${d.id===id?'selected':''}>${d.name}</option>`).join('')}</select><span class="type-label">${d.types.join(' / ').toUpperCase()}</span><p><em>${d.skill}</em><br>${d.signatureDesc||d.description}</p></div>`;}).join('')}</div><div class="modal-actions"><p>${game?'Rescue Mycora, Lumivern, and Chronowl from their guardians to unlock them.':saved?'Starting a new expedition replaces the saved campaign. Your current save remains until you begin.':'Your journey begins at the Last Lantern. Professor Vell will show you the way.'}</p>${game?'<button class="primary" data-resume>BACK TO THE WORLD →</button>':'<button class="primary" id="confirm-expedition">ENTER THE LAST LANTERN <span>→</span></button>'}</div>`;
}
function codexHTML(g){
  const chapter=CHAPTERS[Math.min(g.fragments.size,5)];return heading('What the world <em>remembers.</em>',`${g.memories.size} field notes · ${g.shrines.size} lost echoes · ${g.discovered.size}/${Object.keys(MINIONS).length} wild species`)+`<div class="story-panel"><p class="eyebrow">${g.finished?'EPILOGUE':'CURRENT CHAPTER'}</p><h3>${g.finished?'A family for the Worldheart':chapter.title}</h3><p>${g.finished?'The guardians were never your enemies. They were carrying something too heavy to put down. The Worldheart remembers what you did for them.':chapter.story}</p></div><h3 class="minor-heading">COMPANIONS · ${g.unlocked.size} / 11 FOUND</h3><div class="codex-grid">${ROSTER.map(d=>`<article class="codex-card"><canvas data-portrait="${d.id}" aria-label="${d.name}"></canvas><small>${g.unlocked.has(d.id)?d.types.join(' / ').toUpperCase():'RESCUE THIS COMPANION'}</small><h3>${d.name}</h3><p>${d.description}</p><p><em>${d.skill}</em> · ${d.passive}</p></article>`).join('')}</div><h3 class="minor-heading">GUARDIANS & THEIR MEMORIES</h3><div class="codex-grid">${Object.entries(BOSSES).map(([id,b])=>`<article class="codex-card"><small>${g.bossDefeated(id)?'MEMORY RESTORED':'A VOICE STILL LOST'}</small><h3>${b.name}</h3><p>${g.bossDefeated(id)?b.lore:b.epithet.toLowerCase()}</p><details class="boss-field-notes"><summary>ATTACK FIELD NOTES</summary><p>${BOSS_ENCOUNTERS[id].identity}</p><ul class="boss-notes">${BOSS_ENCOUNTERS[id].moves.map(m=>`<li><strong>${m.name}</strong><small>${bossCounterLabel(m.counter)}</small><p>${m.hint}</p></li>`).join('')}</ul></details></article>`).join('')}</div><h3 class="minor-heading">FIELD BESTIARY</h3><div class="codex-grid">${Object.entries(MINIONS).map(([id,d])=>`<article class="codex-card"><small>${g.discovered.has(id)?'DISCOVERED · '+d.types:'UNOBSERVED · '+d.types}</small><h3>${d.name}</h3><p>${d.hint}</p></article>`).join('')}</div>`;
}
function guideHTML(){const rows=[['Shield / timed parry','HOLD G · 7-frame deflect'],['Power / cycle / arsenal','X / Z / H'],['Uppercut launcher','W + K · J J K branches'],['Aerial plunge','AIR S + K · unlock Claw'],['Run / aim','A D / W S'],['Variable-height jump','SPACE · release for short hop'],['Dash / recovery cancel','SHIFT'],['Fast three-hit chain','J · buffer your next strike'],['Armor breaker','K'],['Directional elemental skill','W A S D + L / neutral L'],['Pogo bounce','Air S + J'],['Focus heal · hold still','HOLD F · costs 40 FOCUS · 1.2s channel'],['Drink a flask','V · restores 3 hearts'],['Switch companions','1 / 2 / 3 · Q cycles'],['Interact / craft / enter','E'],['Automatic full recovery','WALK THROUGH A WELLSPRING'],['Use / cycle tools','T / C'],['Grapple to golden anchor','U · requires Ember Thread'],['Map / inventory / journal','M / I / N'],['Threefold Resonance Surge','R · full gauge required'],['Chronicle / talents / equipment','N'],['Pause','ESCAPE']];return heading('Learn the <em>rhythm.</em>','J: 0.2s · K: 0.6s · L: 1.5s. Time your follow-ups; each power has its own cooldown. Every hit refills Focus; every quiet moment can restore a heart.')+`<div class="controls-grid">${rows.map(([a,b])=>`<div class="control-row"><span>${a}</span><kbd>${b}</kbd></div>`).join('')}</div><p class="modal-note">Defeat the Briar Matron for wall jumps, Saint Bellows for grappling, the Leviathan for the Tideglass Seal, the Conductor for a double jump, and the Hourglass Stag for Rift Step. Return with new abilities to reach high chambers, buried vaults, and looping shortcuts. The map records explored passages; navigation is yours.</p><button class="secondary" data-overlay="arsenal">KINETIC ARSENAL · ALL POWERS & COMBAT ROUTES ↗</button>`;}
function dialogueHTML(){const line=dialogue[dialogueIndex]||['The Worldheart','Listen.'];return `<div class="dialogue-body"><div class="dialogue-sigil">✧</div><div><h2 id="overlay-title">${line[0]}</h2><p>${line[1]}</p></div></div><div class="dialogue-footer"><span>${String(dialogueIndex+1).padStart(2,'0')} / ${String(dialogue.length).padStart(2,'0')} &nbsp; · &nbsp; E / SPACE TO CONTINUE</span><button class="primary" data-dialogue-next>${dialogueIndex===dialogue.length-1?'FOLLOW THE PULSE':'LISTEN'} <span>→</span></button></div>`;}
function nextDialogue(){if(dialogueIndex<dialogue.length-1){dialogueIndex++;renderOverlay();}else{game?.save();closeOverlay();}}
function rewardHTML(){const id=rewardQueue[0],b=game?.bossInfo?.(id)||BOSSES[id],art=Object.values(POWERS).find(d=>d.unlock.id===id||d.unlock.id===b?.reward);if(!b)return '';return `<div class="reward-panel"><span class="reward-icon">✧</span><p class="eyebrow">${CHRONICLE_BOSSES[id]?'FORBIDDEN MEMORY RESTORED':'HEART FRAGMENT RESTORED'} · ${BIOMES[b.biome].name.toUpperCase()}</p><h2 id="overlay-title">${b.name}</h2><p>${b.lore}</p><p class="reward-unlock">${b.reward?'ABILITY AWAKENED · '+ABILITIES[b.reward].name.toUpperCase():CHRONICLE_BOSSES[id]?'MYTHIC RELIC & TALENT POINT EARNED':'THE WORLDHEART OPENS ITS EYES'}${b.creature?'<br><br>NEW COMPANION · '+findFighter(b.creature).name.toUpperCase():''}</p>${b.reward?`<p class="modal-note">${ABILITIES[b.reward].description}</p>`:''}${art?`<p class="reward-unlock">COMBAT ART · ${art.name.toUpperCase()}<br><small>Open H · Arsenal to equip it in either power slot.</small></p>`:''}<div class="modal-actions"><button class="primary" data-dismiss-reward>CARRY THE MEMORY <span>→</span></button></div></div>`;}
function dismissReward(){const id=rewardQueue.shift();closeOverlay();if(id==='crown')openOverlay('ending');else if(id==='nullheart')openOverlay('trueending');}
function endingHTML(){return `<div class="reward-panel"><span class="reward-icon">◈</span><p class="eyebrow">THE WORLDHEART SPEAKS</p><h2 id="overlay-title">“Will you stay with me?”</h2><p>The heart was a creature all along. Vell broke its cage, and the world broke with it. Now six memories are whole again. Your three companions step forward. The choice is yours.</p><div class="ending-options"><button data-ending="restore"><h3>Become its guardians.</h3><p>Restore the Worldheart. Keep the roads open, and make sure no kingdom ever cages it again.</p></button><button data-ending="release"><h3>Let the heart run free.</h3><p>Release it into the stars. The roads will change, but every creature will carry a piece of its light.</p></button></div></div>`;}
function creditsHTML(g){return `<div class="reward-panel"><span class="reward-icon">✧</span><p class="eyebrow">${g.ending==='release'?'ENDING · A SKY FULL OF HEARTBEATS':'ENDING · THE LAST LANTERN BECOMES A DAWN'}</p><h2 id="overlay-title">The world remembers you.</h2><p>${g.ending==='release'?'The heart unfurls into a thousand constellations. For the first time, the creatures look up and hear their own names in the stars.':'The sanctuary fills with travelers. New roads wind through the forest. The Worldheart rests beneath the lantern, surrounded by creatures who chose to stay.'}<br><br>Professor Vell smiles. “I think we can stop running now.”</p><div class="inline-stats"><span><b>${g.fragments.size}/6</b>HEARTS RESTORED</span><span><b>${g.visited.size}/${Object.keys(ROOMS).length}</b>PLACES FOUND</span><span><b>${g.unlocked.size}/11</b>COMPANIONS</span><span><b>${Math.floor(g.playtime/3600)}</b>MINUTES TRAVELED</span></div><div class="modal-actions"><button class="secondary" data-return-home>SAVE & RETURN HOME</button><button class="primary" data-resume>KEEP EXPLORING →</button></div></div>`;}
function gameOverHTML(g){
  const death=g.death||{},gate=BIOMES[death.gate]||BIOMES[g.room.biome],room=ROOMS[death.room]||g.room,refuge=ROOMS[death.returnTo?.room],lost=Math.max(0,Math.floor(death.lostLumens||0)),count=Math.max(0,Math.floor(death.restoredEnemies||0));
  return `<section class="game-over-panel" style="--death-color:${gate.color}"><div class="fallen-sigil" aria-hidden="true"><span>◈</span><i></i><i></i><i></i></div><p class="eyebrow">GAME OVER · ${escapeHtml(gate.name)}<br>${escapeHtml(room.name)}</p><h2 id="overlay-title">The light<br><em>fell silent.</em></h2><p id="gameover-description">Your three companions have fallen.<br>The gate draws breath. Its creatures rise again.</p><div class="death-costs"><div><b>${count}</b><span>ENEMIES REAWAKENED</span></div><div><b>−${lost} <small>◈</small></b><span>LUMENS LOST</span></div><div><b>✦</b><span>STORY & ABILITIES KEPT</span></div></div><p class="death-return">RETURN POINT <strong>${escapeHtml(refuge?.name||'The Last Lantern')}</strong><span>Wellsprings in the fallen gate awaken for your next attempt.</span></p><div class="death-actions"><button class="primary" data-retry-death>RISE AGAIN <span>↗</span></button><button class="secondary" data-return-home>SAVE & RETURN TO TITLE</button></div><p class="death-key">R TO RETRY · YOUR JOURNEY IS STILL HERE</p></section>`;
}
function retryDeath(){
  if(!game||game.phase!=='gameover'||!game.retryAfterDeath?.())return;
  rewardQueue=[];accumulator=0;noticeFrames=0;closeOverlay(true);renderHud();syncMobileLayout();
}
function renderHud(){
  if(!game)return;const g=game,p=g.player;document.body.classList.toggle('game-over',g.phase==='gameover');
  const fingerprint=g.party.map(m=>m.data.id).join()+':'+g.activeSlot;
  if($('party-hud').dataset.party!==fingerprint){$('party-hud').dataset.party=fingerprint;$('party-hud').innerHTML=g.party.map((m,i)=>`<button class="party-slot ${g.activeSlot===i?'active':''}" data-switch="${i}" aria-label="Switch to ${m.data.name}"><span class="slot-key">${i+1}</span><canvas data-portrait="${m.data.id}" aria-hidden="true"></canvas><div><strong>${m.data.name}</strong><span class="hearts" id="hearts-${i}"></span><div class="focus-bar"><i id="focus-${i}"></i></div></div></button>`).join('');renderPortraits();}
  g.party.forEach((m,i)=>{$('hearts-'+i).innerHTML=Array.from({length:m.maxHp},(_,n)=>`<i class="heart ${m.hp<=n?'empty':m.hp<n+1?'half':''}"></i>`).join('');$('focus-'+i).style.width=m.spirit+'%';const btn=document.querySelector(`[data-switch="${i}"]`);btn.disabled=m.hp<=0;btn.title=`${m.data.name} · ${m.hp}/${m.maxHp} hearts · ${Math.floor(m.spirit)} Focus`;});
  $('location-biome').textContent=BIOMES[g.room.biome].name.toUpperCase();$('location-room').textContent=g.room.name;$('lumen-count').textContent=g.lumens+' ◈';
  const chapter=CHAPTERS[Math.min(g.fragments.size,5)];$('quest-chapter').textContent=g.finished?'EPILOGUE · A WORLD REBORN':chapter.title.toUpperCase();$('quest-goal').textContent=g.finished?'Find the echoes still waiting for you.':g.roomId==='sanctuary'?`Find the ${BIOMES[chapter.id].name} portal.`:g.enemies.some(e=>e.boss&&e.hp>0)?'Free the guardian. Recover its memory.':'Chart the high chambers and depths. Find your own route.';
  $('bond-level').textContent=`BOND ${g.level} · ${Math.floor(g.xp)}/${g.level*60} XP`;$('fragment-count').textContent=g.fragments.size+' / 6 FRAGMENTS';
  const tracked=trackedQuestText(g);if(tracked){$('quest-chapter').textContent=tracked.name;$('quest-goal').textContent=tracked.goal;}
  $('surge-fill').style.width=g.surge+'%';$('surge-value').textContent=Math.floor(g.surge)+'%';$('surge-hud').classList.toggle('ready',g.surge>=100);$('mastery-rank').textContent=BOND_RANKS[g.bondRank()].name;
  const combat=g.combat,power=POWERS[combat.powerSlots[combat.selectedPower]],cd=combat.powerRemaining(power.id);
  for(const action of ['light','heavy','special','power']){const left=action==='power'?cd:combat.remaining(action),seconds=(Math.ceil(left/6)/10).toFixed(1)+'s';
    for(const b of document.querySelectorAll(`.touch-controls [data-action="${action==='special'?'special':action}"]`)){b.classList.toggle('recharging',left>0);b.dataset.cooldownText=seconds;b.setAttribute('aria-disabled',String(left>0));}
    const meter=document.querySelector(`[data-cooldown="${action}"]`);if(meter){meter.classList.toggle('recharging',left>0);meter.querySelector('small').textContent=left?seconds:'READY';}
  }
  const surgeCD=combat.remaining('surge');$('surge-button').disabled=g.surge<100||surgeCD>0;$('surge-value').textContent=surgeCD?(Math.ceil(surgeCD/6)/10).toFixed(1)+'s':Math.floor(g.surge)+'%';$('surge-hud').classList.toggle('ready',g.surge>=100&&!surgeCD);
  $('guard-fill').style.width=p.shield+'%';$('guard-label').textContent=p.guardBroken?'GUARD BROKEN':p.parryFrames?'DEFLECT WINDOW':'GUARD '+Math.round(p.shield);$('flow-fill').style.width=combat.flow+'%';$('flow-label').textContent='FLOW '+Math.round(combat.flow)+(combat.flow>=70?' · OVERDRIVE':'');
  $('power-icon').textContent=power.icon;$('power-name').textContent=power.name;$('power-status').textContent=cd?((Math.ceil(cd/6)/10).toFixed(1)+'s'):power.cost+' FOCUS · X';$('power-button').style.setProperty('--power',power.color);$('power-button').disabled=cd>0||p.spirit<power.cost;$('combat-hud').classList.toggle('guard-broken',p.guardBroken>0);$('combat-hud').classList.toggle('shielding',p.shielding);$('combat-hud').classList.toggle('parry-ready',p.parryFrames>0);document.querySelector('.party-slot.active')?.classList.toggle('taking-hit',p.flash>0);
  $('combat-state').textContent=p.riposte?'PERFECT DEFLECT · STRIKE TO RIPOSTE':p.stagger?'HIT STUN':p.shielding?'SHIELD RAISED':p.attack?(p.attack.move||'').replace(/([0-9])/g,' $1').toUpperCase():combat.flow>=70?'OVERDRIVE · +'+Math.round(combat.flow*.15)+'% DAMAGE':'';
  document.body.classList.toggle('reduced-motion',combat.settings.reducedMotion);
  const interact=document.querySelector('.touch-tools [data-action="interact"]');interact.hidden=!g.room.objects.some(o=>Math.abs(o.x-p.x)<100&&Math.abs((o.y||520)-p.y)<100);document.querySelector('.touch-tools [data-action="grapple"]').hidden=!g.abilities.has('grapple');
  const event=g.worldEvent;$('world-event-hud').hidden=!event;if(event)$('world-event-hud').textContent=event.type.toUpperCase()+' FRACTURE · CLEAR THE ECHOES';
  $('combo-hud').hidden=g.combo<2;$('combo-number').textContent=g.combo;$('heal-indicator').hidden=!p.healing;$('heal-progress').style.width=p.healProgress/(g.healConfig?.frames||72)*100+'%';
  $('game-toast').hidden=!(g.messageTime||noticeFrames);$('game-toast').textContent=g.messageTime?g.message:notice;
  const boss=g.enemies.find(e=>e.boss&&e.hp>0&&e.introduced);$('boss-hud').hidden=!boss;if(boss){$('boss-name').textContent=g.bossInfo(boss.boss).name;$('boss-fill').style.width=boss.hp/boss.maxHp*100+'%';$('boss-fill').style.background=BOSSES[boss.boss].color;$('boss-phase').textContent=(boss.phase>=3?'PHASE III':boss.phase===2?'PHASE II':'PHASE I')+(boss.moveName?' · '+boss.moveName.toUpperCase():'')+(boss.state==='recover'?' · RECOVERING':boss.counter?' · '+bossCounterLabel(boss.counter):'');$('boss-phase').title=boss.hint||'Watch the windup';}
  $('region-title').hidden=g.transition<20||g.transition>95;$('region-kicker').textContent=BIOMES[g.room.biome].subtitle.toUpperCase();$('region-name').textContent=g.room.name;$('region-title').style.opacity=String(Math.min(1,(g.transition-20)/18,(100-g.transition)/18));
}
const keyAction={KeyG:'shield',KeyX:'power',KeyZ:'powerCycle',KeyR:'surge',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyJ:'light',KeyK:'heavy',KeyL:'special',KeyF:'heal',KeyE:'interact',KeyQ:'switch',Digit1:'slot1',Digit2:'slot2',Digit3:'slot3',KeyV:'potion',KeyT:'tool',KeyC:'toolCycle',KeyU:'grapple',KeyB:'upgrade'};
function syncMovement(){game?.setInputs({left:held.has('KeyA')||held.has('ArrowLeft'),right:held.has('KeyD')||held.has('ArrowRight'),up:held.has('KeyW')||held.has('ArrowUp'),down:held.has('KeyS')||held.has('ArrowDown')});}
window.addEventListener('keydown',e=>{
  if(orientationBlocked){if(keyAction[e.code])e.preventDefault();return;}
  if(modal.open){if(overlayType==='gameover'){if(e.code==='KeyR'&&!e.repeat){e.preventDefault();retryDeath();}return;}if(overlayType==='dialogue'&&['Space','Enter','KeyE'].includes(e.code)){e.preventDefault();if(!e.repeat)nextDialogue();}else if((overlayType==='map'&&e.code==='KeyM'||overlayType==='inventory'&&e.code==='KeyI'||overlayType==='chronicle'&&e.code==='KeyN'||overlayType==='arsenal'&&e.code==='KeyH')&&!e.repeat){e.preventDefault();closeOverlay();}return;}
  if(view!=='game')return;
  const overlays={KeyH:'arsenal',KeyM:'map',KeyI:'inventory',KeyN:'chronicle',Escape:'pause'};
  if(overlays[e.code]){e.preventDefault();if(!e.repeat)openOverlay(overlays[e.code]);return;}
  if(keyAction[e.code]||/^(Key[WASD]|Arrow(Left|Right|Up|Down))$/.test(e.code)){e.preventDefault();held.add(e.code);syncMovement();if(!e.repeat&&keyAction[e.code])game.input(keyAction[e.code]);}
});
window.addEventListener('keyup',e=>{held.delete(e.code);syncMovement();if(e.code==='Space')game?.releaseJump();if(e.code==='KeyF')game?.releaseHeal();if(e.code==='KeyL')game?.releaseSpecial();if(e.code==='KeyG')game?.releaseShield();});
window.addEventListener('blur',()=>{if(game&&!modal.open)openOverlay('pause');else clearInputs();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&!modal.open)openOverlay('pause');});
window.addEventListener('beforeunload',()=>game?.save());
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(orientationBlocked)return;
  if(b.hasAttribute('data-retry-death')){retryDeath();return;}
  if(b.hasAttribute('data-toggle-sound')){$('sound-button').click();renderOverlay();modal.querySelector('[data-toggle-sound]').focus();return;}
  if(b.dataset.quickAction){const action=b.dataset.quickAction;closeOverlay();game?.input(action);renderHud();return;}
  if(b.id==='power-button'){game?.input('power');canvas.focus({preventScroll:true});}
  if(b.id==='cycle-power'){game?.input('powerCycle');canvas.focus({preventScroll:true});}
  if(b.dataset.powerEquip){game?.combat.equipPower(Number(b.dataset.powerSlot),b.dataset.powerEquip);renderOverlay();}
  if(b.dataset.powerSelect!==undefined){game?.combat.choosePower(Number(b.dataset.powerSelect));game?.save();renderOverlay();}
  if(b.hasAttribute('data-combat-motion')&&game){game.combat.settings.reducedMotion=!game.combat.settings.reducedMotion;game.save();renderOverlay();}
  if(b.id==='surge-button'){game?.input('surge');canvas.focus({preventScroll:true});}
  if(b.dataset.overlay)openOverlay(b.dataset.overlay);
  if(b.dataset.chronicleTab){rpgTab=b.dataset.chronicleTab;renderOverlay();}
  if(b.dataset.openChronicle){rpgTab=b.dataset.openChronicle;openOverlay('chronicle');}
  if(b.dataset.buyTalent){game?.buyTalent(b.dataset.buyTalent);renderOverlay();}
  if(b.dataset.gearEquip){game?.equipItem(b.dataset.gearEquip);renderOverlay();}
  if(b.dataset.gearSalvage){game?.salvageItem(b.dataset.gearSalvage);renderOverlay();}
  if(b.dataset.trackQuest){game?.trackQuest(b.dataset.trackQuest);renderOverlay();}
  if(b.dataset.chooseFaction){game?.chooseFaction(b.dataset.chooseFaction);renderOverlay();}
  if(b.dataset.buyItem){game?.buyItem(b.dataset.buyItem);renderOverlay();}
  if(b.hasAttribute('data-open-reliquary')){rpgTab='equipment';openOverlay('chronicle');}
  if(b.hasAttribute('data-build-party'))openOverlay('party');
  if(b.dataset.mapRegion){mapRegion=b.dataset.mapRegion;openOverlay('map');}
  if(b.dataset.region){mapRegion=b.dataset.region;mapRoom='';renderOverlay();}
  if(b.dataset.inspectRoom){mapRoom=b.dataset.inspectRoom;renderOverlay();}
  if(b.dataset.travel){if(game?.fastTravel(b.dataset.travel))closeOverlay();else{const msg=game?.message||'Begin your expedition to discover this waylight.';const prior=$('overlay-content').querySelector('.travel-message');if(prior)prior.remove();$('overlay-content').insertAdjacentHTML('beforeend',`<p class="status-note travel-message" role="status">${escapeHtml(msg)}</p>`);}}
  if(b.hasAttribute('data-resume'))closeOverlay();
  if(b.hasAttribute('data-return-home'))returnHome();
  if(b.hasAttribute('data-dialogue-next'))nextDialogue();
  if(b.hasAttribute('data-dismiss-reward'))dismissReward();
  if(b.dataset.ending)game?.finishEnding(b.dataset.ending);
  if(b.dataset.switch!==undefined){game?.switchTo(Number(b.dataset.switch));renderHud();canvas.focus({preventScroll:true});}
  if(b.dataset.craft){game?.craft(b.dataset.craft);renderOverlay();}
  if(b.dataset.equip){game?.equip(b.dataset.equip);renderOverlay();}
  if(b.hasAttribute('data-use-flask')){game?.useFlask();renderOverlay();}
  if(b.hasAttribute('data-cycle-tool')){game?.cycleTool();renderOverlay();}
  if(b.hasAttribute('data-forge')){game?.buyUpgrade();game?.save();renderOverlay();}
  if(b.id==='confirm-expedition')startCampaign(false);
});
document.addEventListener('change',e=>{const slot=e.target.dataset.partySlot;if(slot===undefined)return;const i=Number(slot),id=e.target.value;if(game)game.replaceParty(i,id);else{const other=party.indexOf(id),old=party[i];party[i]=id;if(other>=0&&other!==i)party[other]=old;renderHomeParty();}renderOverlay();});
for(const b of document.querySelectorAll('.touch-controls button')){
  const end=e=>{e.preventDefault();const h=b.dataset.hold;if(h==='heal')game?.releaseHeal();else if(h==='shield')game?.releaseShield();else if(h){held.delete({left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS'}[h]);syncMovement();}if(b.dataset.action==='jump')game?.releaseJump();if(b.dataset.action==='special')game?.releaseSpecial();};
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(orientationBlocked||modal.open||!game)return;b.setPointerCapture(e.pointerId);const h=b.dataset.hold;if(h==='heal')game?.input('heal');else if(h==='shield')game?.input('shield');else if(h){held.add({left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS'}[h]);syncMovement();}else game?.input(b.dataset.action);});b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
}
$('start-button').onclick=()=>openOverlay('party');$('party-button').onclick=()=>openOverlay('party');$('continue-button').onclick=()=>startCampaign(true);$('home-button').onclick=()=>{if(game)openOverlay('pause');else window.scrollTo({top:0,behavior:'smooth'});};$('nav-campaign').onclick=()=>{if(game)closeOverlay();else window.scrollTo({top:0,behavior:'smooth'});};$('nav-map').onclick=$('atlas-button').onclick=()=>openOverlay('map');$('nav-codex').onclick=()=>openOverlay('chronicle');$('guide-button').onclick=$('footer-guide').onclick=()=>openOverlay('guide');$('sound-button').onclick=()=>{sound=!sound;$('sound-button').setAttribute('aria-pressed',String(sound));$('sound-button').style.color=sound?'#e6dcac':'';tone('relic');canvas.focus({preventScroll:true});};
function frame(clock){
  const delta=Math.min(100,clock-(last||clock));last=clock;
  if(view==='game'&&game){accumulator+=delta;let steps=0;while(accumulator>=1000/60&&steps++<6){game.step();if(noticeFrames>0)noticeFrames--;accumulator-=1000/60;}renderer.render(game,clock);if(clock-lastHud>80){renderHud();lastHud=clock;}if(game.tick&&game.tick%600===0&&!game.paused)game.save();
    if(game.phase==='gameover'&&overlayType!=='gameover')openOverlay('gameover');
    if(game.phase==='playing'&&rewardQueue.length&&!modal.open&&game.enemies.every(e=>!e.boss||e.hp<=0))openOverlay('reward');
  }else heroRenderer.renderHome(clock,party,{reducedMotion:reducedMotion()});
  animatePortraits(clock);
  requestAnimationFrame(frame);
}
window.kinetic={snapshot:()=>game?game.snapshot():{phase:'selection',mode:'campaign',party:[...party],hasSave:!!saved},version:'4.0.0'};
renderHomeParty();updateContinue();syncMobileLayout();requestAnimationFrame(frame);
