import {ROOMS,BOSSES,DIALOGUES} from './world.js';
import {MINIONS} from './designs.js';
import {CHRONICLE_ROOMS,CHRONICLE_BOSSES,CHRONICLE_LINKS,CHRONICLE_ENEMIES,NPC_DIALOGUES} from './chronicle.js';
// One additive registry keeps the original route and v2 save identifiers stable.
Object.assign(ROOMS,CHRONICLE_ROOMS);Object.assign(BOSSES,CHRONICLE_BOSSES);Object.assign(MINIONS,CHRONICLE_ENEMIES);Object.assign(DIALOGUES,NPC_DIALOGUES);
for(const [id,links] of Object.entries(CHRONICLE_LINKS))for(const object of links)if(!ROOMS[id].objects.some(o=>o.id===object.id))ROOMS[id].objects.push({...object});
for(const room of Object.values(CHRONICLE_ROOMS)){room.chronicle=true;room.thorns??=[];for(const o of room.objects)if(o.defeatedBoss)o.boss=o.defeatedBoss;}
ROOMS.sanctuary.objects.push({id:'ora',kind:'merchant',talk:'ora',x:610,name:'Ora, the Relic Peddler'},
  {id:'covenant-stone',kind:'covenant',x:825,name:'The Covenant Stone'});
