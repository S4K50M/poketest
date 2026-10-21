import { ROOMS } from './world.js';
import { CHRONICLE_ROOMS } from './chronicle.js';

// These voices belong to existing objects in the world. Hearing one does not
// collect a memory, complete a quest, create terrain, or alter a save.
const whispers=[
 ['sanctuary','bench','A promise on the lantern','Leave a light for anyone still finding their way home.'],
 ['moss-path','lore','Ink beneath the roots','The first field note is still warm. The forest has been keeping it alive.'],
 ['moss-descent','witness','The cistern remembers','We planted shelter here. We never meant the roots to learn the shape of a cage.'],
 ['moss-nexus','keeper','A child’s handprint','The little hand is pressed into the bark from the inside. Someone was being carried.'],
 ['moss-ascent','unwritten','A seed without a name','Six seeds remember the old garden. This one is waiting to become something else.'],
 ['moss-vault','buried','A voice in the amber','I saved everything the garden lost. I forgot that living things need room to leave.'],
 ['moss-heart','return','The living threshold','Beyond this arch, every root bends toward the same heartbeat.'],
 ['forge-path','lore','A pilgrim’s prayer','First we gave the furnace broken machines. Then we started giving it names.'],
 ['forge-descent','witness','The last shift bell','The workers went home a hundred years ago. The machines are still waiting to be relieved.'],
 ['forge-nexus','keeper','Ash in the censer','Keep the fire, the order said. Nobody told us what to do when the people were gone.'],
 ['forge-ascent','unwritten','The silent bell','This bell was cast to celebrate a dawn that never came. Its bronze is full of birdsong.'],
 ['forge-vault','buried','An account written in soot','One small sun for every household. One borrowed memory for every sunrise.'],
 ['forge-heart','return','The altar breathes','The sermon has no words left. Only the breath between the bells.'],
 ['reef-path','lore','A page that would not sink','A living heart cannot belong to a kingdom. The sea has failed to wash those words away.'],
 ['reef-descent','witness','The missing index','Every empty shelf has a name. Every name has someone still searching for it.'],
 ['reef-nexus','keeper','The librarian’s whisper','I returned every story but my own. If it calls for me, please do not answer in my voice.'],
 ['reef-ascent','unwritten','Words in the margin','The page is upside down. The handwriting says: perhaps the world is.'],
 ['reef-vault','buried','A name inside a pearl','They called it safekeeping. Listen closely: the names are asking for the door.'],
 ['reef-heart','return','The ink-dark threshold','A thousand unfinished stories turn beneath the water. Something enormous is holding its breath.'],
 ['storm-path','lore','A song caught in stone','Eight voices became thunder. The space between them is still waiting for a ninth.'],
 ['storm-descent','witness','Yesterday’s weather','Clear skies expected. The report repeats, beneath a century of thunder.'],
 ['storm-nexus','keeper','The choir’s old oath','No voice left unheard. No silence left unbroken. We should have asked which silences were kind.'],
 ['storm-ascent','unwritten','A prayer without words','Up here, the bells move before the wind. Someone is listening for your answer.'],
 ['storm-vault','buried','The ninth rest','There is no missing note on this page. There is a space for the singer to breathe.'],
 ['storm-heart','return','Before the first note','The storm goes quiet for one heartbeat. It knows you are here.'],
 ['frost-path','lore','Ink beneath the ice','I did not break the heart. I broke the lock. The final word has never finished freezing.'],
 ['frost-descent','witness','A stopped chronometer','One second remains on the dial. The hand has worn a groove trying to move.'],
 ['frost-nexus','keeper','The relief that never came','Hold until relieved. A simple order can become a very long winter.'],
 ['frost-ascent','unwritten','An unspent wish','The candle is still lit. The child who made the wish would be a hundred years old.'],
 ['frost-vault','buried','A borrowed tomorrow','They stored the hours they feared to lose. Outside, the world kept needing them.'],
 ['frost-heart','return','The last second','Snow hangs motionless beyond the arch. Something is still trying to choose differently.'],
 ['rift-path','lore','The road answers','You call this place hollow. I have kept a space for every voice that might come home.'],
 ['rift-descent','witness','The first architect','We taught the walls to remember. We never asked what remembering would cost them.'],
 ['rift-nexus','keeper','The empty throne','No ruler ever sat here. The throne was built to make a living heart look like a machine.'],
 ['rift-ascent','unwritten','A footstep before your own','The stair remembers every traveler. This next step is the first it cannot predict.'],
 ['rift-vault','buried','A mark beneath the lock','The oldest scratch is not an escape attempt. It is a hand reaching toward another hand.'],
 ['rift-heart','return','The heart below','The pulse beyond the door is frightened. It sounds almost like yours.'],
 ['hidden-grove','shrine','The sleeping seed','A gardener left one seed beyond the maps. Not every beautiful thing was made to be found.'],
 ['star-observatory','shrine','A voice beyond the stars','The telescope points into empty sky. The music stand beside it has room for one more name.'],
 ['clockwork-ossuary','death-certificate','A lantern beside the record','The paper says there was no survivor. The little lantern beside it has never gone out.'],
 ['paper-moon','last-letter','The unsent letter','Someone folded this page a thousand times. The first words are still: Dear Worldheart.'],
 ['cradle-zero','first-promise','The first promise','Nothing in this cradle has happened before. For once, the walls have no memory to offer.'],
];

const rooms={...ROOMS,...CHRONICLE_ROOMS};
export const WORLD_VOICES=Object.freeze(Object.fromEntries(whispers.map(([roomId,anchorId,speaker,text])=>{
 const room=rooms[roomId],anchor=room.objects.find(o=>o.id===anchorId);
 return [roomId,Object.freeze([Object.freeze({id:roomId+':voice:'+anchorId,room:roomId,anchorId,x:anchor.x,y:anchor.y??520,speaker,text,range:210})])];
})));

// Boss voices are short enough to read during movement. They express motive;
// attack warnings and counterplay remain owned by the combat presentation.
export const BOSS_VOICES=Object.freeze(Object.fromEntries(Object.entries({
 briar:{intro:'Little heartbeats… stay behind my roots. I can keep you safe.',defeat:'Then grow beyond me. That is what a garden is for.'},
 bell:{intro:'Come closer, pilgrims. The city must not go cold.',defeat:'The fire may rest. Let the morning do its work.'},
 leviathan:{intro:'No more stories lost. No more names beneath the tide.',defeat:'Take them gently. They have waited so long to be heard.'},
 conductor:{intro:'One voice is missing. I will make the whole sky answer.',defeat:'There… between the notes. I can hear it now.'},
 hourglass:{intro:'Wait. Give me one more second. I can change what happens.',defeat:'You are still here. Then tomorrow did come.'},
 crown:{intro:'I kept the roads. I kept the voices. Why did nobody come home?',defeat:'You came back for me. Not the kingdom. Me.'},
 'moss-warden':{intro:'The roots gave me one command: nothing passes, nothing is lost.',defeat:'A gate can open. I had forgotten.'},
 'moss-reaver':{intro:'Everything that falls belongs to my garden.',defeat:'Some things were meant to fly away.'},
 'forge-warden':{intro:'The cathedral is owed its fire. Pay, or become the payment.',defeat:'Strike the debt from the ledger. All of it.'},
 'forge-reaver':{intro:'Confess to the furnace. It remembers every secret.',defeat:'My last confession: I wanted the fire to end.'},
 'reef-warden':{intro:'These stories were sentenced to silence. I guard the sentence.',defeat:'Open the cells. Let their names find the surface.'},
 'reef-reaver':{intro:'Such fresh voices. Such beautifully unwritten endings.',defeat:'Leave one page blank. Please.'},
 'storm-warden':{intro:'The verdict is thunder. You will hear it when it is too late.',defeat:'Let the next voice speak before the judgment.'},
 'storm-reaver':{intro:'Break every bell, and perhaps the screaming will stop.',defeat:'The ringing is gone. I can hear the wind.'},
 'frost-warden':{intro:'The sentence stands. The hour will not release you.',defeat:'A hundred winters… and still there is an afterward.'},
 'frost-reaver':{intro:'Do not bring another ending into my winter.',defeat:'I can put the flowers down now.'},
 'rift-warden':{intro:'I have watched this arrival ninety-nine times. You are not the one I remember.',defeat:'At last. Something I have never seen.'},
 'rift-reaver':{intro:'A blank future. Hold still while I cut it into something familiar.',defeat:'Keep your tomorrow. I have taken enough.'},
 belltwin:{intro:'One dawn for the city. One dawn for those it buried.',defeat:'Carry the warm seed home. It was never meant to stay with the dead.'},
 palimpsest:{intro:'Begin again. Sing it correctly this time, and nobody has to leave.',defeat:'The last note belongs to whoever sings next.'},
 nullheart:{intro:'Hush, little tomorrow. Nothing can hurt you if nothing ever changes.',defeat:'Wake gently. There is a whole world waiting to meet you.'},
}).map(([id,voice])=>[id,Object.freeze(voice)])));
