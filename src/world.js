// All campaign geography is data. Feet and ground use Y = 520 throughout a room.
export const BIOMES={
  sanctuary:{name:'The Last Lantern',subtitle:'A small light at the end of the world',color:'#e5d6a4',sky:['#101c23','#30433d'],ground:'#273f3a',accent:'#c9b87f',icon:'✦',kind:'sanctuary'},
  moss:{name:'Mourningwild',subtitle:'Where the roots remember',color:'#a9e6aa',sky:['#0b1c26','#23473f'],ground:'#23443a',accent:'#a9e6aa',icon:'❧',kind:'forest'},
  forge:{name:'Cinder Cathedral',subtitle:'A prayer forged in fire',color:'#ffa46b',sky:['#241323','#6c342b'],ground:'#50352f',accent:'#ffa46b',icon:'♜',kind:'forge'},
  reef:{name:'The Drowned Archive',subtitle:'Every tide keeps a secret',color:'#8ee4e6',sky:['#0b1830','#1b5265'],ground:'#254b59',accent:'#8ee4e6',icon:'≈',kind:'reef'},
  storm:{name:'Thundersong Spires',subtitle:'The sky has a heartbeat',color:'#d5b4ff',sky:['#181530','#49436d'],ground:'#403e60',accent:'#d5b4ff',icon:'ϟ',kind:'storm'},
  frost:{name:'Pale Meridian',subtitle:'Even time can freeze',color:'#b4e3ff',sky:['#142337','#537387'],ground:'#3e5c6b',accent:'#b4e3ff',icon:'❄',kind:'frost'},
  rift:{name:'The Hollow Crown',subtitle:'The dark beneath the Worldheart',color:'#ffa0bd',sky:['#1d102b','#4b264f'],ground:'#402d4c',accent:'#ffa0bd',icon:'◈',kind:'rift'},
};
export const ABILITIES={
  dash:{name:'Mothwing Dash',key:'SHIFT',icon:'»',description:'Dash on the ground and once in the air. Invulnerable during the first 9 frames.'},
  claw:{name:'Root Claw',key:'SPACE + WALL',icon:'⋔',description:'Slide against walls and jump away. Restores your air dash.'},
  grapple:{name:'Ember Thread',key:'U',icon:'⌁',description:'Grapple to golden anchors within 500 pixels. Face an anchor to choose the direction.'},
  swim:{name:'Tideglass Seal',key:'PASSIVE',icon:'≈',description:'Cross deep-water seals and breathe inside the Drowned Archive.'},
  wings:{name:'Storm Wings',key:'SPACE × 2',icon:'⋈',description:'Jump again in the air. Opens the high routes and floating islands.'},
  blink:{name:'Rift Step',key:'SHIFT',icon:'◇',description:'Your dash pierces violet veils. Dash cooldown reduced to 14 frames.'},
};
export const BOSSES={
  briar:{name:'The Briar Matron',epithet:'KEEPER OF THE FIRST SEED',biome:'moss',hp:240,color:'#aed49b',reward:'claw',creature:'mycora',material:'heartwood',lore:'She kept the forest alive by swallowing the first fragment. The roots are not a cage. They are an embrace.'},
  bell:{name:'Saint Bellows',epithet:'THE UNENDING SERMON',biome:'forge',hp:310,color:'#ffa06a',reward:'grapple',material:'ember',lore:'The cathedral bells were lungs. The saint kept breathing fire long after the city went quiet.'},
  leviathan:{name:'The Ink Leviathan',epithet:'ARCHIVIST OF THE ABYSS',biome:'reef',hp:340,color:'#88e0f0',reward:'swim',creature:'lumivern',material:'pearl',lore:'It swallowed the archive to save its stories. It forgot how to let them go.'},
  conductor:{name:'The Storm Conductor',epithet:'A THOUSAND SILENT VOICES',biome:'storm',hp:380,color:'#d5b4ff',reward:'wings',material:'stormglass',lore:'Every bolt is the last song of a lost creature. Listen between the thunder.'},
  hourglass:{name:'The Hourglass Stag',epithet:'WARDEN OF A FROZEN MOMENT',biome:'frost',hp:420,color:'#c6eaff',reward:'blink',creature:'chronowl',material:'frostcore',lore:'It froze the moment before the fracture. For a century, it has tried to choose differently.'},
  crown:{name:'The Hollow Sovereign',epithet:'THE HEART THAT REFUSED TO BREAK',biome:'rift',hp:600,color:'#ffa0bd',reward:null,material:'riftglass',lore:'The Worldheart was never a machine. It was a creature. And it has been waiting for its family.'},
};
export const CHAPTERS=[
  {id:'moss',title:'I. A seed of memory',need:0,boss:'briar',x:26,y:66,story:'Professor Vell found a pulse beneath the Mourningwild. Find the Matron and bring the first memory home.'},
  {id:'forge',title:'II. The city that burned',need:1,boss:'bell',x:15,y:39,story:'The second pulse tolls inside Cinder Cathedral. An old saint mistakes the fire for salvation.'},
  {id:'reef',title:'III. Stories under water',need:2,boss:'leviathan',x:48,y:79,story:'The Drowned Archive holds the truth about the fracture. Recover the page the sea tried to erase.'},
  {id:'storm',title:'IV. A song for the lost',need:3,boss:'conductor',x:64,y:30,story:'Follow the missing voices to Thundersong. A conductor has chained the sky to a broken melody.'},
  {id:'frost',title:'V. The moment before',need:4,boss:'hourglass',x:82,y:48,story:'The Hourglass Stag remembers Vell before the disaster. Ask it who really broke the Worldheart.'},
  {id:'rift',title:'VI. A heart made whole',need:5,boss:'crown',x:48,y:46,story:'Vell did not destroy the Worldheart. She opened its cage. Descend into the Hollow Crown and bring it home.'},
];
export const ITEMS={
  heartwood:{name:'Heartwood',icon:'❧',description:'Living timber from the Mourningwild. Used for charms.'},
  ember:{name:'Saint’s Ember',icon:'♨',description:'A spark that refuses to go out. Used for tools and flasks.'},
  pearl:{name:'Memory Pearl',icon:'◉',description:'A tiny story preserved in salt.'},stormglass:{name:'Stormglass',icon:'ϟ',description:'A thunderclap caught in crystal.'},
  frostcore:{name:'Frost Core',icon:'❄',description:'Cold enough to hold a moment still.'},riftglass:{name:'Riftglass',icon:'◇',description:'The space between two worlds, made solid.'},
  flask:{name:'Bramble Flask',icon:'♜',description:'V: restore 3 hearts instantly. Crafted or found in caches.'},
  pickaxe:{name:'Resonance Pick',icon:'⚒',description:'T: break cracked walls and ore veins nearby.'},
  lantern:{name:'Echo Lantern',icon:'✦',description:'T: reveal hidden echo caches near old shrines.'},
};
export const CHARMS={
  fang:{name:'Feral Fang',icon:'⌁',description:'+22% attack damage.',cost:{heartwood:4}},
  pulse:{name:'Wellspring',icon:'◉',description:'Doubles passive Focus recovery.',cost:{pearl:3}},
  feather:{name:'Swift Feather',icon:'⋈',description:'+12% run speed and longer grapples.',cost:{stormglass:3}},
  thorn:{name:'Briar Heart',icon:'❧',description:'Taking damage releases a retaliatory thorn burst.',cost:{heartwood:3,ember:2}},
};
const ground=(w)=>[{x:0,y:520,w,h:260}];
const entryPlatforms=(i)=>[
  ...ground(2500),{x:480,y:425,w:160,h:25},{x:730,y:335,w:160,h:25},
  {x:1110,y:405,w:190,h:25},{x:1460,y:320,w:175,h:25},{x:1800,y:425,w:170,h:25},
  ...(i>0?[{x:980,y:325,w:45,h:195,solid:true}]:[]),
];
export const ROOMS={sanctuary:{id:'sanctuary',name:'The Last Lantern',biome:'sanctuary',width:2200,platforms:ground(2200),enemies:[],anchors:[],relics:[],objects:[
  {id:'vell',kind:'npc',x:470,name:'Professor Vell',talk:'vell'},
  {id:'forge',kind:'workbench',x:750,name:'Mender’s Workbench'},
  {id:'bench',kind:'bench',x:200,name:'Waylight Bench'},
  ...CHAPTERS.map((ch,i)=>({id:ch.id,kind:'portal',x:1050+i*180,name:BIOMES[ch.id].name,to:ch.id+'-path',need:ch.need})),
]}};
CHAPTERS.forEach((ch,i)=>{
  const species=[['sproutlet','pebbleback','thornling'],['sinder','ashwing','sinder'],['dewdrop','inkfin','dewdrop'],['voltlet','stormkite','stormkite'],['frostmite','pebbleback','frostmite'],['riftling','riftling','inkfin']][i];
  const id=ch.id+'-path';
  ROOMS[id]={id,name:['The Rootway','Pilgrim’s Furnace','The Sunken Stacks','Bellwind Crossing','The Stillwood','The Unwritten Road'][i],biome:ch.id,width:2500,platforms:entryPlatforms(i),anchors:[{x:1200,y:210},{x:1630,y:155}],
    enemies:species.map((kind,n)=>({kind,x:650+n*530})),
    relics:[{id:id+'-a',x:800,y:280},{id:id+'-b',x:1540,y:265}],
    objects:[{id:'return',kind:'door',x:95,to:'sanctuary',name:'Return to Sanctuary'},
      {id:'bench',kind:'bench',x:300,name:'Waylight Bench'},
      {id:'lore',kind:'memory',x:440,name:'Echo of the fracture',text:[
        'VELL’S FIELD NOTE 01|The creatures are not weapons. They remember every hand that has held them. Today, I will ask them to trust mine.',
        'PILGRIM’S PRAYER|We fed the saint our broken machines. It gave us warmth. When the machines ran out, it asked for our memories.',
        'A PAGE FROM THE ARCHIVE|The council ordered the Worldheart sealed. Vell refused. “A living heart cannot belong to a kingdom.”',
        'A SONG ON THE WIND|Eight voices became one. One voice became thunder. The conductor is still searching for the ninth.',
        'VELL’S LAST LETTER|I did not break the heart. I broke the lock. If you find me on the other side, remind me why.',
        'THE WORLDHEART|You call this place hollow. But I have kept every voice. Come closer, little ones. I remember your names.',
      ][i]},
      {id:'cache',kind:'cache',x:1180,name:'Pilgrim’s Cache',material:BOSSES[ch.boss].material},
      {id:'ore',kind:'ore',x:1850,name:'Resonant Vein',material:BOSSES[ch.boss].material},
      {id:'exit',kind:'door',x:2370,to:ch.id+'-heart',name:['The Matron’s Bower','The Bellows Altar','The Ink Chamber','The Conductor’s Roost','The Last Second','The Heart Below'][i],ability:i===0?null:i===1?'claw':i===2?'grapple':i===3?'swim':i===4?'wings':'blink'},
      ...(i===0?[{id:'secret',kind:'door',x:820,y:335,to:'hidden-grove',name:'The Hidden Grove',ability:'claw'}]:[]),
      ...(i===3?[{id:'secret',kind:'door',x:1540,y:320,to:'star-observatory',name:'Fallen Star Observatory',ability:'wings'}]:[]),
    ]};
  ROOMS[ch.id+'-heart']={id:ch.id+'-heart',name:ROOMS[id].objects.find(o=>o.id==='exit').name,biome:ch.id,width:1900,platforms:[...ground(1900),{x:650,y:395,w:170,h:25},{x:1480,y:380,w:170,h:25}],anchors:[{x:1000,y:165}],enemies:[{kind:'warden',boss:ch.boss,x:1310}],relics:[],objects:[{id:'return',kind:'door',x:90,to:id,name:'Return to '+ROOMS[id].name},{id:'bench',kind:'bench',x:270,name:'Waylight Bench'},{id:'exit',kind:'door',x:1780,to:'sanctuary',name:'Return the Heart Fragment',boss:ch.boss}]};
});
ROOMS['hidden-grove']={id:'hidden-grove',name:'The Hidden Grove',biome:'moss',width:1700,platforms:[...ground(1700),{x:520,y:415,w:130,h:25},{x:760,y:310,w:130,h:25},{x:1000,y:220,w:170,h:25}],anchors:[{x:1200,y:110}],enemies:[{kind:'thornling',x:850},{kind:'sproutlet',x:1250}],relics:[{id:'grove',x:1070,y:170}],objects:[{id:'return',kind:'door',x:100,to:'moss-path',name:'Return to Rootway'},{id:'chest',kind:'cache',x:1440,name:'Gardener’s Legacy',material:'heartwood',rare:true},{id:'shrine',kind:'shrine',x:1080,y:220,name:'The Sleeping Seed'}]};
ROOMS['star-observatory']={id:'star-observatory',name:'Fallen Star Observatory',biome:'storm',width:1700,platforms:[...ground(1700),{x:550,y:390,w:130,h:25},{x:780,y:275,w:130,h:25},{x:1100,y:170,w:170,h:25}],anchors:[{x:1050,y:100}],enemies:[{kind:'stormkite',x:900}],relics:[{id:'star',x:1180,y:110}],objects:[{id:'return',kind:'door',x:100,to:'storm-path',name:'Return to Thundersong'},{id:'chest',kind:'cache',x:1450,name:'Stargazer’s Legacy',material:'stormglass',rare:true},{id:'shrine',kind:'shrine',x:1180,y:170,name:'The Ninth Voice'}]};
// Each biome has its own traversal problem. The central route changes as abilities awaken.
ROOMS['moss-path'].platforms=ROOMS['moss-path'].platforms.filter(p=>p.y!==520).concat([{x:0,y:520,w:1260,h:260},{x:1420,y:520,w:1080,h:260}]);
ROOMS['moss-path'].thorns=[{x:1260,w:160,y:625}];
ROOMS['moss-path'].objects.push({id:'bridge',kind:'lever',x:1190,name:'Raise the Rootbridge',bridge:{x:1260,y:520,w:160,h:25}});
ROOMS['forge-path'].platforms=ROOMS['forge-path'].platforms.filter(p=>p.y!==520).concat([{x:0,y:520,w:1390,h:260},{x:1680,y:520,w:820,h:260}]);
ROOMS['forge-path'].thorns=[{x:1390,w:290,y:620}];
ROOMS['forge-path'].objects.push({id:'mender',kind:'npc',talk:'mender',name:'Ash, the Wandering Mender',x:630});
ROOMS['reef-path'].platforms=[{x:0,y:520,w:1030,h:260},{x:1700,y:520,w:800,h:260},{x:690,y:420,w:180,h:25},{x:1160,y:330,w:120,h:25},{x:1490,y:270,w:140,h:25}];
ROOMS['reef-path'].thorns=[{x:1030,w:670,y:645}];
ROOMS['reef-path'].objects.find(o=>o.id==='cache').y=330;
ROOMS['reef-path'].relics=[{id:'reef-path-a',x:1210,y:265},{id:'reef-path-b',x:1560,y:205}];
ROOMS['reef-path'].objects.push({id:'archivist',kind:'npc',talk:'archivist',name:'The Paper Archivist',x:510});
ROOMS['storm-path'].platforms=[{x:0,y:520,w:940,h:260},{x:1810,y:520,w:690,h:260},{x:970,y:425,w:160,h:25,moving:true,origin:970,amplitude:70,rate:.02},{x:1260,y:325,w:160,h:25,moving:true,origin:1260,amplitude:65,rate:.025},{x:1560,y:400,w:170,h:25}];
ROOMS['storm-path'].anchors=[{x:1120,y:200},{x:1500,y:140},{x:1810,y:240}];
ROOMS['storm-path'].thorns=[{x:940,w:870,y:650}];
ROOMS['storm-path'].objects.find(o=>o.id==='secret').x=1640;ROOMS['storm-path'].objects.find(o=>o.id==='secret').y=400;
ROOMS['storm-path'].objects.find(o=>o.id==='cache').x=1620;ROOMS['storm-path'].objects.find(o=>o.id==='cache').y=400;
ROOMS['storm-path'].relics=[{id:'storm-path-a',x:1040,y:350},{id:'storm-path-b',x:1640,y:335}];
ROOMS['frost-path'].platforms=[{x:0,y:520,w:910,h:260},{x:1760,y:520,w:740,h:260},{x:870,y:410,w:150,h:25},{x:1110,y:280,w:150,h:25},{x:1370,y:150,w:170,h:25},{x:1610,y:330,w:160,h:25}];
ROOMS['frost-path'].thorns=[{x:910,w:850,y:645}];ROOMS['frost-path'].anchors=[{x:1150,y:145},{x:1500,y:65},{x:1780,y:180}];
ROOMS['frost-path'].objects.find(o=>o.id==='cache').x=1450;ROOMS['frost-path'].objects.find(o=>o.id==='cache').y=150;
ROOMS['frost-path'].relics=[{id:'frost-path-a',x:1180,y:215},{id:'frost-path-b',x:1440,y:90}];
ROOMS['rift-path'].platforms.push({x:1080,y:20,w:30,h:500,solid:true,veil:true});
ROOMS['rift-path'].objects.push({id:'veil',kind:'veil',x:1095,name:'Rift Veil'});
export const DIALOGUES={
  mender:[['Ash, the Mender','I used to mend cages. Vell taught me to mend bridges instead. Strange how the same hands can do both.'],['Ash, the Mender','Take the high path over the furnace. Jump toward a wall, then Space again to climb. Every bench can shape your materials into charms.']],
  archivist:[['The Paper Archivist','I have been looking for the last page for a hundred years. It says: “A living heart cannot belong to a kingdom.”'],['The Paper Archivist','Golden anchors remember the old roads. Press U when one is above you. Chain your grapples across the drowned stacks.']],

  vell:[
    ['Professor Vell','Once, the Worldheart joined every creature to every living thing. Then the sky cracked. The roads vanished. And the heart fell silent.'],
    ['Professor Vell','But you brought three little heartbeats here. I can hear the forest answering them. Follow that pulse into the Mourningwild.'],
    ['Professor Vell','A / D to run. Space to jump. Shift to dash. J for quick strikes; K breaks armor. Hold F, standing still, to heal with Focus. A hit restores Focus.'],
    ['Professor Vell','Switch your companions with 1 / 2 / 3 or Q. Their health and Focus are separate. E opens doors and rests at benches. M opens your map. I opens your pack.'],
  ],
};
export const DEFAULT_PARTY=['pyrojaw','voltantis','zephyrix'];
export const SAVE_KEY='kinetic-worldheart-v2';
