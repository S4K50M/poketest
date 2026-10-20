// Optional vault guardians: encounter identities, not recolored common attacks.
// Events use fixed, announced world-space targets so speed retains counterplay.
const zone=(at,shape,x,y,w,h,delay,life,damage=1.5,extra={})=>({at,type:'zone',shape,x,y,w,h,delay,life,damage,...extra});
const platform=(at,x,y,w,style,life=420)=>({at,type:'platform',x,y,w,style,life});
const aim=(c,x=c.x,y=c.floor-85)=>Math.atan2(c.ty-35-y,c.tx-x);
const sorted=events=>events.sort((a,b)=>a.at-b.at);

export const REAVER_ENCOUNTERS={
 'moss-reaver':{
  title:'The Carrion Gardener',identity:'A patient mine-layer that grows a living nursery and turns the floor into a spore garden.',
  movement:'anchor',speed:1.2,preferredRange:225,
  sequences:[[0,1,0,2,3],[1,2,0,3,0,2],[3,0,2,1,0,3,2]],
  moves:[
   {id:'carrion-seed-testament',name:'Seed Testament',kind:'seed-minefield',counter:'dodge',hint:'The seeds open in sequence. Move out of each marked patch.',tell:42,active:84,recover:40,
    build:c=>{
     const events=[],count=c.phase===3?5:3;
     for(let i=0;i<count;i++)events.push(zone(i*9,'mine',c.clampX(c.tx+(i-(count-1)/2)*132),c.floor-22,82,68,26+i*3,24,1.25,{status:{root:12},label:'GERMINATING'}));
     return events;
    }},
   {id:'carrion-funeral-orchard',name:'Funeral Orchard',kind:'living-nursery',counter:'minions',hint:'Cut down the nursery before it feeds the Gardener. The center lane stays open.',tell:58,active:100,recover:52,
    build:c=>sorted([
     {at:0,type:'summon',kind:'sproutlet',count:2,x:c.clampX(c.x-c.face*135)},
     {at:24,type:'summon',kind:'graveburrower',count:1,x:c.clampX(c.x+c.face*155)},
     zone(12,'floor',c.clampX(c.center-275),c.floor-13,170,28,30,48,1,{status:{root:14},label:'NURSERY BED'}),
     zone(12,'floor',c.clampX(c.center+275),c.floor-13,170,28,30,48,1,{status:{root:14},label:'NURSERY BED'}),
     ...(c.phase>=2?[{at:76,type:'heal',amount:7}]:[]),
    ])},
   {id:'carrion-root-harrow',name:'Root Harrow',kind:'spore-halo',counter:'get-close',hint:'Enter the hollow center of the spore ring; the outer garden erupts.',tell:46,active:72,recover:48,
    build:c=>[
     {at:0,type:'force',x:c.x,y:c.floor-35,radius:320,pull:.45,duration:38},
     zone(0,'ring',c.x,c.floor-35,530,130,34,24,2,{inner:102,knockback:1.8,status:{root:14},label:'HOLLOW SPORE HALO'}),
     ...(c.phase===3?[zone(38,'ring',c.x,c.floor-35,650,130,24,16,1.5,{inner:122,label:'SECOND BLOOM'})]:[]),
    ]},
   {id:'carrion-compost-cathedral',name:'Compost Cathedral',kind:'root-bridge-purge',counter:'platform',hint:'Use the new root bridges. The spores crawl along the ground.',tell:64,active:118,recover:58,
    build:c=>[
     platform(0,c.clampX(c.center-205),c.floor-100,150,'root'),
     platform(0,c.clampX(c.center+85),c.floor-100,150,'root'),
     zone(24,'floor',c.center,c.floor-15,Math.min(760,c.right-c.left-50),32,36,54,1.5,{status:{root:16},label:'COMPOST TIDE'}),
     ...(c.phase>=2?[zone(76,'mine',c.clampX(c.tx),c.floor-22,96,68,28,14,1.5,{label:'LATE BLOOM'})]:[]),
    ]},
  ],
 },
 'forge-reaver':{
  title:'The Cinder Confessor',identity:'A furnace beast that ricochets through powder charges, leaps like a mortar, and alternates low and high fire lanes.',
  movement:'stalk',speed:2.8,preferredRange:150,
  sequences:[[0,1,2,0,3],[2,0,1,3,0,1],[0,2,1,0,3,2,1]],
  moves:[
   {id:'cinder-shrapnel-stampede',name:'Shrapnel Stampede',kind:'powder-stampede',counter:'jump',hint:'Jump the two charging passes. Powder ignites behind the beast.',tell:46,active:88,recover:45,
    build:c=>{
     const end=c.clampX(c.tx+c.face*130),events=[{at:0,type:'dash',to:end,duration:20,damage:2,knockback:2.2},{at:44,type:'dash',to:c.x,duration:18,damage:2,knockback:2.2}];
     for(let i=1;i<=3;i++)events.push(zone(i*7,'mine',c.x+(end-c.x)*i/4,c.floor-14,66,42,26,14,1,{status:{burn:65},label:'POWDER CHARGE'}));
     return sorted(events);
    }},
   {id:'cinder-confession-chain',name:'Confession Chain',kind:'chain-detonation',counter:'dodge',hint:'The center bomb bursts first; outer bombs follow. Keep changing lanes.',tell:48,active:100,recover:48,
    build:c=>{
     const offsets=c.phase>=2?[0,-165,165,-320,320]:[0,-165,165];
     return offsets.map((dx,i)=>zone(i*10,'blast',c.clampX(c.tx+dx),c.floor-54,112,128,26,18,1.75,{knockback:1.9,status:{burn:80},label:'CONFESSION '+(i+1)}));
    }},
   {id:'cinder-mortar-requiem',name:'Mortar Requiem',kind:'mortar-leap',counter:'behind',hint:'Leave the landing seal, then attack its back while the mortar cools.',tell:52,active:82,recover:55,
    build:c=>{
     const landing=c.clampX(c.tx+c.face*55);
     return [
      zone(0,'blast',landing,c.floor-24,160,74,30,16,2,{knockback:2.5,status:{burn:80},label:'MORTAR IMPACT'}),
      {at:0,type:'dash',to:landing,duration:30,height:218,damage:1.5,knockback:1.8},
      {at:42,type:'shots',x:landing,y:c.floor-85,angle:-Math.PI/2,count:5+c.phase,spread:2.3,speed:6.2,gravity:.24,damage:1,kind:'orb',status:{burn:65}},
     ];
    }},
   {id:'cinder-ashen-absolution',name:'Ashen Absolution',kind:'furnace-height-switch',counter:'platform',hint:'Climb over the low flare, then drop below the high flare.',tell:64,active:124,recover:60,
    build:c=>[
     platform(0,c.clampX(c.center-170),c.floor-105,170,'metal'),
     platform(0,c.clampX(c.center+95),c.floor-105,170,'metal'),
     zone(30,'beam',c.center,c.floor-20,Math.min(760,c.right-c.left-40),38,30,24,2.5,{unblockable:true,status:{burn:95},knockback:2,label:'LOW FURNACE FLARE'}),
     zone(78,'beam',c.center,c.floor-185,Math.min(760,c.right-c.left-40),42,24,24,2,{status:{burn:95},label:'HIGH FURNACE FLARE'}),
    ]},
  ],
 },
 'reef-reaver':{
  title:'The Page-Eater',identity:'A swimming archive predator that vacuums prey into its bookmaw, breaches across the room, and feeds on a shoal of inkfish.',
  movement:'skirmish',speed:3.2,preferredRange:190,
  sequences:[[0,2,1,3],[1,0,2,3,2],[2,1,0,2,3,1]],
  moves:[
   {id:'page-bookmaw',name:'Bookmaw Undertow',kind:'vacuum-bite',counter:'behind',hint:'The mouth draws you inward. Dash past the bite or stay behind it.',tell:50,active:84,recover:56,
    build:c=>[
     {at:0,type:'force',x:c.x+c.face*50,y:c.floor-45,radius:355,pull:.7,duration:42},
     zone(0,'slash',c.clampX(c.x+c.face*105),c.floor-65,182,136,44,16,2.5,{knockback:2.2,status:{slick:95},label:'BOOKMAW SNAP'}),
     ...(c.phase===3?[zone(52,'blast',c.clampX(c.x+c.face*110),c.floor-30,210,74,18,14,1.5,{label:'INK REGURGITATION'})]:[]),
    ]},
   {id:'page-boundless-breach',name:'Boundless Breach',kind:'tidal-double-vault',counter:'dodge',hint:'Two splashes: a long breach, then the return vault. Leave the marked water.',tell:46,active:88,recover:44,
    build:c=>{
     const landing=c.clampX(c.tx+c.face*110);
     return [
      platform(0,c.clampX(c.center-65),c.floor-105,130,'water'),
      zone(0,'blast',landing,c.floor-20,166,72,28,16,1.75,{knockback:2.1,status:{slick:110},label:'FIRST BREACH'}),
      {at:0,type:'dash',to:landing,duration:28,height:230,damage:1.5,knockback:1.8},
      zone(32,'blast',c.x,c.floor-20,146,72,24,16,1.75,{knockback:2.1,label:'RETURN BREACH'}),
      {at:36,type:'dash',to:c.x,duration:20,height:115,damage:1.5,knockback:1.8},
     ];
    }},
   {id:'page-ink-pagination',name:'Ink Pagination',kind:'alternating-ink-cones',counter:'shield',hint:'Alternate the shield toward each ink fan; the ink marks on the floor burst late.',tell:42,active:86,recover:46,
    build:c=>{
     const events=[];
     for(let i=0;i<3;i++){
      const x=c.clampX(c.x+(i%2?-95:95)),y=c.floor-100;
      events.push({at:i*22,type:'shots',x,y,angle:aim(c,x,y),count:4+c.phase,spread:.8,speed:7+i,damage:1,kind:'droplet',status:{slick:110}});
      events.push(zone(12+i*18,'mine',c.clampX(c.tx+(i-1)*135),c.floor-12,80,40,30,14,1,{status:{slick:140},label:'UNREAD INK'}));
     }
     return sorted(events);
    }},
   {id:'page-archive-hunger',name:'Archive Hunger',kind:'inkfish-feeding',counter:'minions',hint:'Break the shoal before the archive feeds its guardian. Stay out of the black pool.',tell:58,active:108,recover:52,
    build:c=>[
     {at:0,type:'summon',kind:'inkfin',count:2,x:c.clampX(c.x-c.face*145)},
     ...(c.phase>=2?[{at:14,type:'summon',kind:'dewdrop',count:1,x:c.clampX(c.x+c.face*165)}]:[]),
     {at:18,type:'force',x:c.center,y:c.floor-30,radius:390,pull:.28,duration:60},
     zone(24,'floor',c.clampX(c.tx),c.floor-12,290,32,34,40,1.25,{status:{slick:140},label:'BLACK ARCHIVE POOL'}),
     ...(c.phase>=2?[{at:84,type:'heal',amount:8}]:[]),
    ],
   },
  ],
 },
 'storm-reaver':{
  title:'The Bellbreaker',identity:'An aerial duelist: rapid zigzag dives, delayed sonic traps, a hollow scream, and a final toll that must be escaped vertically.',
  movement:'hover',speed:4.5,preferredRange:245,
  sequences:[[0,2,1,0,3],[1,0,2,0,3,1],[0,1,0,2,3,0,2]],
  moves:[
   {id:'bellbreaker-broken-metronome',name:'Broken Metronome',kind:'aerial-zigzag',counter:'dodge',hint:'Three diving beats lock their endpoints. Dash after each wing flash.',tell:40,active:86,recover:40,
    build:c=>{
     const near=c.clampX(c.tx+c.face*100),far=c.clampX(c.tx-c.face*135);
     return [
      zone(0,'slash',near,c.floor-42,94,110,14,12,1.5,{knockback:1.7,label:'BEAT ONE'}),
      {at:0,type:'dash',to:near,duration:14,height:145,damage:1.5,knockback:1.7},
      zone(21,'slash',far,c.floor-42,94,110,14,12,1.5,{knockback:1.7,label:'BEAT TWO'}),
      {at:21,type:'dash',to:far,duration:14,height:125,damage:1.5,knockback:1.7},
      zone(44,'slash',near,c.floor-42,116,110,16,12,2,{knockback:2.2,label:'BEAT THREE'}),
      {at:44,type:'dash',to:near,duration:16,height:95,damage:2,knockback:2.2},
     ];
    }},
   {id:'bellbreaker-resonant-ruin',name:'Resonant Ruin',kind:'air-dropped-aftershocks',counter:'jump',hint:'The ground bells explode in staggered time. Jump the low pulses, avoid the late high echo.',tell:45,active:100,recover:44,
    build:c=>sorted([
     {at:0,type:'dash',to:c.clampX(c.x-c.face*170),duration:24,height:175,damage:1,knockback:1.2},
     ...[-1,0,1].map((n,i)=>zone(i*12,'blast',c.clampX(c.tx+n*142),c.floor-19,106,55,32,14,1.5,{knockback:1.9,label:'GROUND BELL '+(i+1)})),
     zone(54,'beam',c.clampX(c.tx),c.floor-158,265,40,22,14,1.5,{label:'HIGH ECHO'}),
    ])},
   {id:'bellbreaker-silence-scream',name:'Silence Scream',kind:'hollow-sonic-beam',counter:'get-close',hint:'Take shelter beneath the hollow throat. The sonic wings strike the outer lanes.',tell:60,active:112,recover:50,
    build:c=>{
     const width=260+c.phase*30,reach=width/2+112;
     return [
      {at:0,type:'force',x:c.x,y:c.floor-40,radius:310,pull:.28,duration:24},
      zone(20,'beam',c.x+c.face*reach,c.floor-70,width,64,30,26,2,{knockback:2.3,unblockable:true,label:'FORWARD SONIC WING'}),
      ...(c.phase>=2?[zone(56,'beam',c.x-c.face*reach,c.floor-70,width,64,26,24,2,{knockback:2.3,unblockable:true,label:'REVERSE SONIC WING'})]:[]),
     ];
    }},
   {id:'bellbreaker-last-toll',name:'Last Toll — Execution',kind:'execution-sonic-floor',counter:'platform',hint:'Stand on the new bell perch. Phase III: the ground-level death note downs a companion.',tell:104,active:118,recover:64,
    build:c=>[
     platform(0,c.center-75,c.floor-120,150,'metal',480),
     platform(0,c.clampX(c.tx-60),c.floor-100,120,'metal',480),
     zone(46,'beam',c.center,c.floor-39,Math.max(200,c.right-c.left-36),72,42,20,c.phase===3?'lethal':2.5,{unblockable:true,knockback:2.8,label:c.phase===3?'EXECUTION · LEAVE THE FLOOR':'DEATH NOTE · CLIMB'}),
    ]},
  ],
 },
 'frost-reaver':{
  title:'The White Mourner',identity:'A snow-winged trapper that makes hollow ice lattices and temporary refuges, then hunts between them with diving passes.',
  movement:'hover',speed:3.1,preferredRange:240,
  sequences:[[0,3,1,2],[1,3,0,2,3],[3,1,0,3,2,1]],
  moves:[
   {id:'mourner-hollow-halo',name:'Hollow Halo',kind:'snow-ring',counter:'get-close',hint:'The snow halo has an empty heart. Enter the center before the wings close.',tell:46,active:94,recover:48,
    build:c=>[
     zone(0,'ring',c.x,c.floor-50,580,160,30,24,1.75,{inner:106,status:{slow:85},label:'HOLLOW SNOW HALO'}),
     zone(40,'pillar',c.x-205,c.floor-118,48,250,26,18,1.5,{status:{slow:100},label:'LEFT WING ICICLE'}),
     zone(40,'pillar',c.x+205,c.floor-118,48,250,26,18,1.5,{status:{slow:100},label:'RIGHT WING ICICLE'}),
    ]},
   {id:'mourner-white-lattice',name:'White Lattice',kind:'diamond-safe-lane',counter:'get-close',hint:'Stay in the empty center of the ice diamond. The outer lanes close one after another.',tell:54,active:112,recover:52,
    build:c=>{
     const half=Math.max(160,(c.right-c.left)/2-95),events=[
      zone(0,'pillar',c.center-180,c.floor-135,52,290,30,34,1.75,{status:{slow:100},label:'LATTICE WEST'}),
      zone(0,'pillar',c.center+180,c.floor-135,52,290,30,34,1.75,{status:{slow:100},label:'LATTICE EAST'}),
      zone(40,'floor',c.center-half/2-85,c.floor-14,half,34,28,30,1.5,{status:{slow:140},label:'LEFT ICE BED'}),
      zone(52,'floor',c.center+half/2+85,c.floor-14,half,34,28,26,1.5,{status:{slow:140},label:'RIGHT ICE BED'}),
     ];
     if(c.phase===3)events.push({at:74,type:'shots',x:c.center,y:c.floor-240,angle:Math.PI/2,count:3,spread:.62,speed:5.2,damage:1,kind:'needle',status:{slow:85}});
     return sorted(events);
    }},
   {id:'mourner-last-warmth',name:'Last Warmth',kind:'ice-refuge-purge',counter:'platform',hint:'Climb a new ice refuge. The deep frost washes the ground; stay below the high snow.',tell:68,active:126,recover:60,
    build:c=>[
     platform(0,c.clampX(c.center-245),c.floor-105,150,'ice',460),
     platform(0,c.clampX(c.center+100),c.floor-105,150,'ice',460),
     zone(24,'floor',c.center,c.floor-12,Math.max(220,c.right-c.left-50),28,44,48,2,{status:{slow:160},unblockable:true,label:'DEEP FROST · CLIMB'}),
     zone(72,'beam',c.center,c.floor-230,Math.max(220,c.right-c.left-80),36,28,16,1.5,{status:{slow:110},label:'HIGH SNOW'}),
    ]},
   {id:'mourner-funeral-flight',name:'Funeral Flight',kind:'snow-needle-swoop',counter:'dodge',hint:'Move after the first swoop locks. The returning wing drops needles.',tell:40,active:94,recover:40,
    build:c=>{
     const far=c.clampX(c.x-c.face*150),landing=c.clampX(c.tx+c.face*85);
     return [
      {at:0,type:'dash',to:far,duration:20,height:165,damage:1.25,knockback:1.5},
      {at:24,type:'shots',x:far,y:c.floor-180,angle:Math.PI/2,count:3+c.phase,spread:1.25,speed:6.7,damage:1,kind:'needle',status:{slow:95}},
      zone(34,'blast',landing,c.floor-25,135,86,26,14,1.5,{knockback:1.9,status:{slow:90},label:'RETURNING WING'}),
      {at:42,type:'dash',to:landing,duration:18,height:115,damage:1.75,knockback:2},
     ];
    }},
  ],
 },
 'rift-reaver':{
  title:'The Unwritten Butcher',identity:'A spatial executioner that telegraphs its future locations, cuts with giant cleavers, and erases floor lanes beneath temporary memory tiles.',
  movement:'skirmish',speed:3.9,preferredRange:185,
  sequences:[[0,1,2,0,3],[1,0,2,3,0,1],[0,2,1,0,3,1,2]],
  moves:[
   {id:'butcher-unfinished-sentence',name:'Unfinished Sentence',kind:'warned-warp-crosscut',counter:'behind',hint:'The purple seal is its next position. Cross behind the cleaver after it appears.',tell:46,active:116,recover:48,
    build:c=>{
     const arrival=c.clampX(c.tx+c.face*145);
     return [
      zone(0,'mine',arrival,c.floor-55,86,130,24,1,1,{label:'FUTURE POSITION'}),
      {at:24,type:'warp',x:arrival},
      zone(27,'slash',arrival-c.face*115,c.floor-70,245,130,22,14,2.25,{knockback:2.1,unblockable:true,label:'UNFINISHED CLEAVER'}),
      zone(38,'mine',c.x,c.floor-55,86,130,26,1,1,{label:'RETURN POSITION'}),
      {at:64,type:'warp',x:c.x},
      zone(68,'slash',c.x+c.face*115,c.floor-70,245,130,22,14,2.25,{knockback:2.1,unblockable:true,label:'RETURN CLEAVER'}),
     ];
    }},
   {id:'butcher-twin-guillotines',name:'Twin Guillotines',kind:'giant-cleaver-cage',counter:'retreat',hint:'Leave the two vertical blade seals, then stay below the late crosscut.',tell:56,active:104,recover:56,
    build:c=>[
     zone(0,'pillar',c.clampX(c.tx-138),c.floor-135,80,290,36,18,2.5,{knockback:2.6,unblockable:true,label:'LEFT GIANT CLEAVER'}),
     zone(12,'pillar',c.clampX(c.tx+138),c.floor-135,80,290,36,18,2.5,{knockback:2.6,unblockable:true,label:'RIGHT GIANT CLEAVER'}),
     zone(52,'slash',c.clampX(c.tx),c.floor-205,340,48,26,18,2,{knockback:2.3,label:'HIGH CROSSCUT'}),
    ]},
   {id:'butcher-erased-causeway',name:'Erased Causeway',kind:'memory-tile-floor-erasure',counter:'platform',hint:'Use the memory tiles. The causeway still exists beneath the erasure, but it burns.',tell:66,active:130,recover:62,
    build:c=>[
     platform(0,c.clampX(c.center-215),c.floor-100,145,'memory',460),
     platform(0,c.clampX(c.center+70),c.floor-100,145,'memory',460),
     zone(18,'pillar',c.clampX(c.center-350),c.floor-150,44,310,40,30,1.5,{label:'LEFT MARGIN'}),
     zone(18,'pillar',c.clampX(c.center+350),c.floor-150,44,310,40,30,1.5,{label:'RIGHT MARGIN'}),
     zone(32,'floor',c.center,c.floor-14,480,32,46,36,2.25,{unblockable:true,knockback:2,label:'ERASED CAUSEWAY · CLIMB'}),
    ]},
   {id:'butcher-future-erasure',name:'Future Erasure — Execution',kind:'execution-falling-ray',counter:'dodge',hint:'Phase III: the tall white ray downs a companion. Leave your locked position, then punish the exhausted Butcher.',tell:100,active:134,recover:68,
    build:c=>{
     const arrival=c.clampX(c.tx<c.center?c.right-55:c.left+55);
     return [
      zone(0,'mine',arrival,c.floor-55,86,130,28,1,1,{label:'FINAL APPEARANCE'}),
      {at:28,type:'warp',x:arrival},
      zone(34,'beam',c.clampX(c.tx),c.floor-220,126,470,52,20,c.phase===3?'lethal':2.5,{unblockable:true,knockback:2.8,label:c.phase===3?'EXECUTION · LEAVE THE RAY':'FUTURE ERASURE'}),
      ...(c.phase>=2?[-1,1].map((dir,i)=>zone(78+i*12,'slash',c.clampX(c.tx+dir*210),c.floor-68,115,138,24,14,1.75,{label:'DISCARDED FUTURE'})):[]),
     ];
    }},
  ],
 },
};
