// Six pocket dimensions grown around the original roads. Coordinates describe
// feet, not sprite centres. Main passages stay grounded at Y = 520.
// The old upper routes remain optional and have catch shelves below their gaps.
export const DIMENSIONS = [
  {id:'moss',title:'The Root Beneath the Root',depth:'The buried first garden',material:'heartwood',rooms:['Rootfall Cistern','The Grafted Court','Canopy of Unborn Seeds','The Sap Widow’s Reliquary'],minions:['thornling','sproutlet'],story:[
    'THE GARDENER’S TESTIMONY|Before the sanctuary, there were six gardens. The council called them dimensions because it was easier to own a place than to admit it was alive. The first garden grew around an abandoned child.',
    'A CHILD’S HANDPRINT|The Matron planted a seed for every child the council forgot. The roots beneath this court are names. The marshal has spent a century keeping strangers from stepping on them.',
    'THE SEVENTH SEED|There were six gates, but seven seeds. Vell hid the last one where no map could remember it. Every time you return, a new leaf appears on its branch.',
    'THE SAP WIDOW|The Widow’s eggs were catalogued as fuel. She sealed the reliquary around their empty shells. Her fury is the last part of their mother the council could not harvest.',
  ]},
  {id:'forge',title:'The Furnace Below the Bells',depth:'The city’s forgotten underworks',material:'ember',rooms:['The Ashen Switchworks','Court of the Last Censer','The Unrung Belfry','The Furnace of Small Suns'],minions:['sinder','ashwing'],story:[
    'SHIFT LOG · FINAL ENTRY|The furnaces never burned coal. They burned the memories people agreed to lose: an argument, a funeral, a name. By the end, nobody remembered why the city needed to stay warm.',
    'THE CENSER’S OATH|The gatewarden was a chimney sweep who smuggled creatures through the vents. When the bells began asking for children, she locked herself inside the mechanism.',
    'A BELL THAT NEVER RANG|One bell was cast to announce the Worldheart’s freedom. The council ordered its tongue removed. Climb high enough and you can still hear the song it intended to sing.',
    'THE SUN TAX|Every household surrendered one happy day to keep a miniature sun alive. The kiln knight remembers all of them. He cannot tell which happiness was his.',
  ]},
  {id:'reef',title:'The Archive Beneath the Sea',depth:'A thousand drowned reading rooms',material:'pearl',rooms:['The Flooded Index','The Unreturned Court','The Inverted Reading Room','The Cabinet of Stolen Names'],minions:['inkfin','dewdrop'],story:[
    'THE INDEX OF THE MISSING|These shelves do not record books. They record the people removed from books. The water rose whenever someone tried to read a missing name aloud.',
    'THE LAST LIBRARIAN|The court’s keeper returned every borrowed story except her own. It is sealed inside the Leviathan. She attacks anyone carrying a voice she recognises.',
    'A NOTE IN THE MARGIN|Vell was not searching for the perfect memory. She was searching for a sentence the Worldheart had never heard: You are allowed to change your mind.',
    'THE NAME MERCHANT|The cabinet’s guardian traded away his name to rescue his sister. The council filed her under PROPERTY. He has been tearing up their ledgers ever since.',
  ]},
  {id:'storm',title:'The Choir Above the Storm',depth:'Suspended cities beneath a broken sky',material:'stormglass',rooms:['The Broken Bellwind','Court of the Thunder Choir','The Breathless Spire','The Vault of the Ninth Voice'],minions:['voltlet','stormkite'],story:[
    'WEATHER REPORT · THE LAST MORNING|The storm began when the council ordered every creature to sing the same note. The sky broke trying to hold the notes they swallowed instead.',
    'THE CHOIR MARSHAL|The marshal carries an empty conducting baton. It belonged to the first creature who refused the song. Every strike marks a beat the official history erased.',
    'A PRAYER WITHOUT WORDS|The spire was built as a ladder for a creature without wings. Its builders never expected to reach the sky. They wanted the creature to know someone had tried.',
    'VOICE NINE|The ninth singer never joined the choir. She was a newborn who had not learned the song. The vault keeps her first cry because it was the last sound the council could not command.',
  ]},
  {id:'frost',title:'The Winter Inside a Second',depth:'The hour the world tried to forget',material:'frostcore',rooms:['The Fractured Second','Court of the Rimekeeper','The Stair of Unspent Hours','The Vault of Borrowed Tomorrows'],minions:['frostmite','pebbleback'],story:[
    'CHRONOMETER · 00:00:01|The Stag froze the disaster one second too late. Everything here has been falling for a century. The cracks in the ice are paths the future is trying to take.',
    'THE RIMEKEEPER’S REPORT|The order was simple: hold until relieved. Nobody came. The keeper has measured one hundred years in footsteps approaching the same locked door.',
    'AN UNFINISHED BIRTHDAY|A table was set for someone who had not been born. Vell kept climbing these stairs to leave presents. She believed the future should have things to look forward to.',
    'THE BORROWED TOMORROW|The vault contains a day the council stole from every creature it owned. Its reaver guards the keys, terrified that opening the door will make those years real.',
  ]},
  {id:'rift',title:'The Cage Beneath the Crown',depth:'The place before the first heartbeat',material:'riftglass',rooms:['The Wound Between Worlds','Court of the Empty Throne','The Stair That Remembers You','The Vault of the First Cage'],minions:['riftling','inkfin'],story:[
    'THE FIRST ARCHITECT|The six gates are not roads to other worlds. They are six chambers of one living heart. The dungeons are the scars left by every kingdom that tried to call it a machine.',
    'THE EMPTY THRONE|There was never meant to be a sovereign. The Worldheart grew the crown because its captors could not imagine a living thing without a ruler.',
    'A FOOTSTEP BEFORE YOUR OWN|The stair remembers you arriving tomorrow. For the first time in a century, the memory is uncertain. It makes room for a second set of footprints.',
    'THE FIRST CAGE|The oldest lock bears no keyhole. It was closed by a promise: I will never leave you. Vell learned that love can become a cage when it refuses to let anything change.',
  ]},
];

const ledge=(x,y,w=150,extra={})=>({x,y,w,h:24,...extra});
const floor=(x,w)=>({x,y:520,w,h:260});
const door=(id,x,y,to,name,extra={})=>({id,kind:'door',x,y,to,name,...extra});
const memory=(id,x,y,text)=>({id,kind:'memory',x,y,name:text.split('|')[0],text});
const enemy=(kind,x,y=520,w=140)=>({kind,x,y,left:x-w/2,right:x+w/2});
// Missing an optional jump should lose a little height rather than a heart.
// Broad one-way terraces sit 145px below each route gap and catch a running
// player before they can fall far. Their width covers both neighbouring ledges.
const catchShelves=route=>route.slice(0,-1).flatMap((source,n)=>{
  const target=route[n+1],left=Math.min(source.x,target.x)-45,right=Math.max(source.x+source.w,target.x+target.w)+45,y=Math.max(source.y,target.y)+145;
  return y<520?[ledge(left,y,right-left,{catch:true})]:[];
});

function descent(d,tier){
  const late=tier>=4,rise=late?185:130,start=late?335:400,stride=late?340:270;
  const steps=Array.from({length:7},(_,n)=>ledge(490+n*stride,start-n*rise,late?230:220,
    {route:'upper',...(tier===3&&[2,4].includes(n)?{moving:true,origin:490+n*stride,amplitude:35,rate:.018+n*.001}:{})}));
  const top=steps.at(-1),width=late?3400:3100,exitX=width-220;
  return {id:d.id+'-descent',name:d.rooms[0],biome:d.id,width,height:1600,traversal:'tunnel',tunnelCeiling:200,depth:1,dungeon:d.title,map:{x:2,y:1},story:d.story[0],
    subtitle:d.depth,platforms:[floor(0,width),...steps,ledge(top.x+125,top.y,260,{route:'upper'}),...catchShelves(steps)],
    anchors:tier>=2?steps.filter((_,n)=>n%2===1).map(p=>({x:p.x+80,y:p.y-130})):[],
    thorns:[],
    enemies:[enemy(d.minions[0],steps[1].x+75,520,100),enemy('veilwasp',steps[3].x+65,450,160),enemy('chaincaster',steps[5].x+65,520,90)],
    relics:[{id:d.id+'-descent-shard',x:steps[4].x+65,y:steps[4].y-60}],
    objects:[door('return',100,520,d.id+'-path','Return to the Gate Road',{spawn:{x:2260,y:520}}),
      memory('witness',310,520,d.story[0]),
      door('exit',exitX,520,d.id+'-nexus',d.rooms[1]),
      door('high-loop',top.x+290,top.y,d.id+'-ascent','The High Passage',{spawn:{x:150,y:520}})],
  };
}

function nexus(d,tier){
  return {id:d.id+'-nexus',name:d.rooms[1],biome:d.id,width:3300,height:1350,traversal:'tunnel',tunnelCeiling:200,depth:2,dungeon:d.title,map:{x:4,y:1},story:d.story[1],
    subtitle:'A guardian below; an older road above',
    platforms:[floor(0,3300),ledge(380,400,145),ledge(660,275,145),ledge(940,150,140),ledge(1220,25,145),ledge(1490,-100,240),ledge(1770,-225,145),ledge(2040,-350,220)],
    anchors:tier>=2?[{x:1090,y:-10},{x:1740,y:-250},{x:2160,y:-470}]:[],
    thorns:[],
    enemies:[enemy('graveburrower',760),enemy('glassmarauder',1300),{kind:'warden',boss:d.id+'-warden',x:2150,y:520,left:1740,right:2900,introX:1660},enemy(d.minions[1],3020),enemy('veilwasp',1610,-155,150)],
    relics:[{id:d.id+'-court-shard',x:2110,y:-410}],
    objects:[door('return',100,520,d.id+'-descent','Return to '+d.rooms[0],{spawn:{x:descent(d,tier).objects.find(o=>o.id==='exit').x,y:descent(d,tier).objects.find(o=>o.id==='exit').y}}),
      door('vault',580,520,d.id+'-vault',d.rooms[3]),
      memory('keeper',1470,520,d.story[1]),
      door('ascent',1605,-100,d.id+'-ascent',d.rooms[2]),
      door('exit',3160,520,d.id+'-heart','The Heart Chamber',{requiresBoss:d.id+'-warden'}),
      {id:'ore',kind:'ore',x:2130,y:-350,name:'Deep Resonance Vein',material:d.material}],
  };
}

function ascent(d,tier){
  // The optional switchback rises above a connected lower tunnel. Extra catch
  // shelves protect the gaps; a missed jump never drops into a lethal void.
  const platforms=[floor(0,2900),
    ledge(430,395,135),ledge(690,270,130),ledge(950,145,125),ledge(1210,20,130),ledge(1470,-105,135),
    ledge(1720,-230,175),ledge(1460,-360,135),ledge(1200,-490,130),ledge(940,-620,130),ledge(430,-750,480),
    ledge(1930,-100,160),ledge(2160,25,160),ledge(2390,150,160),ledge(2620,275,170),
  ];
  for(const p of platforms.filter(p=>p.y<520).slice(0,10)){p.route='upper';if(p.w<175)p.w+=45;}
  if(tier>=3){const p=platforms.find(p=>p.x===1210);Object.assign(p,{moving:true,origin:p.x,amplitude:38,rate:.021});}
  platforms.push(...catchShelves(platforms.filter(p=>p.route==='upper')));
  return {id:d.id+'-ascent',name:d.rooms[2],biome:d.id,width:2900,height:1700,traversal:'shaft',tunnelCeiling:200,depth:0,dungeon:d.title,map:{x:3,y:-1},story:d.story[2],optional:true,
    subtitle:'The abandoned high road and its hidden history',platforms,
    anchors:tier>=2?[{x:900,y:80},{x:1650,y:-290},{x:1000,y:-700}]:[],
    thorns:[],
    enemies:[enemy('veilwasp',1000,75,180),enemy('chaincaster',1770,-230,100),enemy(d.minions[0],1260,-490,90),enemy('glassmarauder',800,-750,130)],
    relics:[{id:d.id+'-ascent-shard',x:790,y:-810}],
    objects:[door('return',120,520,d.id+'-nexus','Return to '+d.rooms[1],{spawn:{x:1605,y:-100}}),
      door('depth-loop',2770,520,d.id+'-vault','Descend into '+d.rooms[3],{spawn:{x:2780,y:520}}),
      memory('unwritten',810,-750,d.story[2]),
      {id:'high-cache',kind:'cache',x:720,y:-750,name:'The Climber’s Reliquary',material:d.material,rare:true},
      door('gate-loop',510,-750,d.id+'-path','The Forgotten Gate Shortcut',{spawn:{x:510,y:520}})],
  };
}

function vault(d,tier){
  return {id:d.id+'-vault',name:d.rooms[3],biome:d.id,width:3000,height:1350,traversal:'tunnel',tunnelCeiling:200,depth:3,dungeon:d.title,map:{x:3,y:3},story:d.story[3],optional:true,
    subtitle:'An optional executioner guards a history worth stealing',
    platforms:[floor(0,3000),ledge(440,395,135),ledge(710,270,135),ledge(980,145,130),ledge(1250,20,130),ledge(1520,-105,150),ledge(1790,-230,170),ledge(2060,-355,170),ledge(2330,-480,250)],
    anchors:tier>=2?[{x:1120,y:-15},{x:1950,y:-365},{x:2470,y:-615}]:[],
    thorns:[],
    enemies:[enemy('chaincaster',680),enemy('graveburrower',1080),{kind:'warden',boss:d.id+'-reaver',x:1910,y:520,left:1380,right:2670,introX:1300},enemy('veilwasp',1350,-45,180),enemy('glassmarauder',2410,-480,110)],
    relics:[{id:d.id+'-vault-shard',x:2400,y:-545}],
    objects:[door('return',110,520,d.id+'-nexus','Return to the Court',{spawn:{x:650,y:520}}),
      memory('buried',1170,520,d.story[3]),
      {id:'reaver-cache',kind:'cache',x:2770,y:520,name:'The Reaver’s Hoard',material:d.material,rare:true,requiresBoss:d.id+'-reaver'},
      door('high-loop',2490,-480,d.id+'-ascent','The Hidden Stair Above',{spawn:{x:2770,y:520}}),
      door('court-loop',2870,520,d.id+'-nexus','The Old Court Passage',{spawn:{x:1260,y:520},requiresBoss:d.id+'-reaver'})],
  };
}

export const DUNGEON_ROOMS={};
for(const [tier,d]of DIMENSIONS.entries())for(const room of[descent(d,tier),nexus(d,tier),ascent(d,tier),vault(d,tier)])DUNGEON_ROOMS[room.id]=room;

// Courts and vault balconies get the same rescue terraces as optional shafts.
for(const room of Object.values(DUNGEON_ROOMS))if(!room.id.endsWith('-descent')&&!room.id.endsWith('-ascent')){
  const upper=room.platforms.filter(p=>p.y<520&&!p.solid);
  for(const p of upper){p.route='upper';p.w=Math.max(p.w,180);}
  room.platforms.push(...catchShelves(upper));
}
