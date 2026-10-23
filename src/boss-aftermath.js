// Defeat scenery is derived from existing clear/revival flags, never saved as
// another source of progression. Durations are presentation milliseconds.
const definition=(form,name,color,farewell,lines)=>Object.freeze({form,name,color,duration:4800,farewell,lines:Object.freeze(lines.map(line=>Object.freeze(line)))});

export const BOSS_AFTERMATH=Object.freeze({
  briar:definition('tree','The Matron’s Memory Tree','#aed49b','Then let me grow something that does not need a cage.',[
    ['The Matron’s Memory Tree','The armor takes root. Every thorn opens into a leaf; a small heartbeat travels through the bark. The Matron is still here.'],
    ['A voice in the leaves','I swallowed the first fragment to keep the forest alive. Take its memory home. I will keep its shade.'],
  ]),
  bell:definition('embercenser','The Last Ember Censer','#ffa06a','No more sermons. Let this be a little warmth.',[
    ['The Last Ember Censer','The saint’s iron lungs have burned themselves empty. In their ashes, one gentle flame survives beneath the cracked cathedral bell.'],
    ['An inscription beneath the soot','We built the bells to call our children home. When nobody answered, he mistook louder fire for a louder voice.'],
  ]),
  leviathan:definition('inkpool','The Open Ink Archive','#88e0f0','Let the last page go. Let them all go.',[
    ['The Open Ink Archive','The leviathan unravels into a dark, luminous pool. Pages circle its shore without sinking; the stories it swallowed can finally be read.'],
    ['A recovered page','The fracture began when the Worldheart’s cage opened. Professor Vell did not break its heart. She heard it asking to leave.'],
  ]),
  conductor:definition('featherperch','The Silent Sky Perch','#d5b4ff','Keep the sky open. I will return.',[
    ['The Silent Sky Perch','A single stormglass feather marks the conductor’s flight. The clouds have parted around the empty perch. The voices are free to choose their own song.'],
    ['A voice riding the wind','Every bolt carried someone we could not bring home. Hear them in the quiet, traveler. I will return.'],
  ]),
  hourglass:definition('stoppedclock','The Clock That Chose Tomorrow','#c6eaff','Enough of yesterday. Let the next second belong to you.',[
    ['The Clock That Chose Tomorrow','The antlers fold around a still clock face. Its hands point to the instant before the fracture. For the first time in a century, no one is forcing them backward.'],
    ['The Hourglass Stag’s last memory','Vell stood beside the cage with a key, not a weapon. I froze the moment because I feared her choice. You have shown me another way to remember.'],
  ]),
  crown:definition('worldheart','The Awakened Worldheart','#ffa0bd','No crown. No cage. Only a way home.',[
    ['The Awakened Worldheart','The hollow crown opens like a rib cage around a living light. Beneath the machinery is a creature that has waited a century for its family.'],
    ['The Awakened Worldheart','The gates still remember your footsteps. Whatever promise you chose, this heart is alive to hear it.'],
  ]),
  belltwin:definition('dawnlantern','The Garden of Two Dawns','#f0bc72','Yesterday can rest. Tomorrow is growing.',[
    ['The Garden of Two Dawns','Two bronze shells open around a lantern greenhouse. A tiny sun grows between their bells. Neither sister had stolen the dawn; they were raising another.'],
    ['A gardener’s vow','One of us kept yesterday warm. One of us kept tomorrow safe. Please carry a little of both into the dark.'],
  ]),
  palimpsest:definition('paperbook','The Unburned Goodbye','#a7e0d8','I remember my name. You may turn the page.',[
    ['The Unburned Goodbye','A thousand paper boats unfold from the fallen book. The last remains beside an open page; its crossed-out names are slowly returning.'],
    ['An unsent letter','Goodbye was never the cruel word. Forgetting was. The archive can keep our names without keeping us here.'],
  ]),
  nullheart:definition('cradle','The Open Cradle','#dfb7ff','Tomorrow has permission to arrive.',[
    ['The Open Cradle','The orbiting cages come to rest around an open cradle. Its perfect mechanical lullaby has stopped. Something small and entirely unfamiliar answers.'],
    ['A promise without an author','No one has written this child’s future. No machine will keep it safe by making sure it never begins.'],
  ]),
});

/** Fresh value objects for the current room; living resurrected bosses win
 * over persistent fragment flags. Global ROOMS objects are never modified. */
export function aftermathObjects(game){
  if(!game?.room||!Array.isArray(game.enemies))return [];
  return game.enemies.flatMap(enemy=>{
    const data=BOSS_AFTERMATH[enemy.boss];
    if(!data||enemy.hp>0||!Number.isFinite(enemy.hp))return [];
    const cleared=game.defeated?.has(enemy.key)||game.fragments?.has(enemy.boss)||game.defeatedBosses?.has(enemy.boss);
    if(!cleared)return [];
    const spawn=game.room.enemies?.find((spec,n)=>spec.boss===enemy.boss&&(enemy.key===game.roomId+':'+n||enemy.id===n))||game.room.enemies?.find(spec=>spec.boss===enemy.boss);
    return [{...data,id:'aftermath:'+enemy.boss,kind:'aftermath',boss:enemy.boss,room:game.roomId,
      x:Number.isFinite(spawn?.x)?spawn.x:Number.isFinite(enemy.home)?enemy.home:enemy.x,
      y:Number.isFinite(spawn?.y)?spawn.y:Number.isFinite(enemy.baseY)?enemy.baseY:520,
      lines:data.lines.map(line=>[...line])}];
  });
}
