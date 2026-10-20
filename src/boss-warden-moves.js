// Six gatekeepers, six different combat problems. Event geometry is locked at
// the tell: follow-up strikes remember a position rather than tracking a dodge.
const zone=(at,shape,x,y,w,h,delay=18,life=18,extra={})=>({at,type:'zone',shape,x,y,w,h,delay,life,damage:1.5,...extra});
const dash=(at,to,duration,height=0,extra={})=>({at,type:'dash',to,duration,height,damage:1.5,knockback:1.5,...extra});
const ledge=(c,at,x,style='stone',y=c.floor-105,w=160)=>({at,type:'platform',x:c.clampX(x)-w/2,y,w,life:390,style});
const shot=(at,x,y,angle,count,spread,speed,extra={})=>({at,type:'shots',x,y,angle,count,spread,speed,damage:1,...extra});

export const WARDEN_ENCOUNTERS={
  'moss-warden':{
    title:'THE HANGING AXE',
    identity:'A rooted executioner commits its enormous axe to long frontal cuts, low heel tremors and marked landing chops. Get behind the axe and punish the recovery.',
    movement:'anchor',speed:1.3,preferredRange:145,
    sequences:[[0,1,0,2,3],[2,0,3,1,0],[0,2,1,3,2,0]],
    moves:[
      {id:'rootbound-timber-verdict',name:'Timber Verdict',kind:'axe',counter:'behind',hint:'Cross behind the raised axe; its back is exposed.',tell:50,active:58,recover:54,build:c=>[
        zone(0,'slash',c.x+c.face*142,c.floor-75,242,135,14,14,{damage:2,knockback:2.2}),
        ...(c.phase>=2?[zone(28,'slash',c.x-c.face*95,c.floor-55,150,90,16,12,{damage:1.5,knockback:1.6})]:[]),
      ]},
      {id:'rootbound-gallows-heel',name:'Gallows Heel',kind:'quake',counter:'jump',hint:'Jump the low root tremors; they cannot reach the air.',tell:44,active:92,recover:45,build:c=>[
        zone(0,'blast',c.x,c.floor-8,128,30,12,12,{damage:2,knockback:2}),
        ...[-1,1].map(side=>zone(6,'floor',c.x+side*75,c.floor-10,82,26,16,52,{vx:side*(4+c.phase),damage:1.5,knockback:1.7})),
      ]},
      {id:'rootbound-hangmans-descent',name:'Hangman’s Descent',kind:'leap',counter:'dodge',hint:'The axe lands on the marked ground. Dash past its landing.',tell:55,active:94,recover:58,build:c=>[
        zone(0,'pillar',c.tx,c.floor-70,105,140,32,18,{damage:2.5,knockback:2.2,unblockable:true}),
        dash(0,c.clampX(c.tx),32,180,{damage:1}),
        ledge(c,53,c.tx,'root',c.floor-95,130),
        ...(c.phase===3?[zone(40,'floor',c.tx-c.face*100,c.floor-10,130,28,18,18,{status:{root:12}})]:[]),
      ]},
      {id:'rootbound-chainroot-prison',name:'Chainroot Prison',kind:'roots',counter:'minions',hint:'Cut the burrower down; roots erupt beside your marked position.',tell:58,active:114,recover:54,build:c=>[
        {at:0,type:'summon',kind:'graveburrower',count:c.phase===3?2:1,x:c.clampX(c.x-c.face*160)},
        ...[-1,1].map((side,i)=>zone(i*24,'pillar',c.clampX(c.tx+side*105),c.floor-65,65,130,25,20,{damage:1.5,status:{root:18}})),
        ...(c.phase>=2?[zone(52,'pillar',c.tx,c.floor-60,60,120,24,18,{damage:2,status:{root:18}})]:[]),
      ]},
    ],
  },
  'forge-warden':{
    title:'THE PRESSURE COURT',
    identity:'A furnace magistrate fights like a hydraulic press: a massive piston strike, checkerboard vent lanes, suction before a crushing hammer, and a pressurized leap.',
    movement:'anchor',speed:1.1,preferredRange:190,
    sequences:[[0,1,2,0,3],[1,0,3,2,1],[2,1,0,3,1,0]],
    moves:[
      {id:'bailiff-piston-writ',name:'Piston Writ',kind:'hammer',counter:'behind',hint:'The hammer extends far forward. Cross its shoulder before impact.',tell:58,active:50,recover:60,build:c=>[
        zone(0,'slash',c.x+c.face*185,c.floor-68,330,125,12,18,{damage:3,knockback:2.8}),
        zone(12,'floor',c.x+c.face*330,c.floor-10,100,30,20,16,{damage:1.5,status:{burn:80}}),
      ]},
      {id:'bailiff-checkerboard-foundry',name:'Checkerboard Foundry',kind:'vents',counter:'dodge',hint:'The vent rows alternate. Move into a lane after its fire dies.',tell:48,active:136,recover:40,build:c=>{
        const vents=Array.from({length:5},(_,i)=>c.left+70+i*(c.right-c.left-140)/4);
        return vents.flatMap((x,i)=>[
          zone(i%2?44:0,'pillar',x,c.floor-90,62,180,24,27,{damage:1.5,status:{burn:95}}),
          ...(c.phase>=2?[zone(i%2?0:72,'floor',x,c.floor-14,88,36,24,20,{damage:1,status:{burn:65}})]:[]),
        ]).sort((a,b)=>a.at-b.at);
      }},
      {id:'bailiff-vacuum-contempt',name:'Vacuum Contempt',kind:'vacuum',counter:'retreat',hint:'Run out of the intake. The crushing blow lands close to the furnace.',tell:56,active:106,recover:58,build:c=>[
        {at:0,type:'force',x:c.x,y:c.floor-35,radius:330,pull:.55+c.phase*.1,duration:38},
        zone(25,'blast',c.x,c.floor-60,220,120,26,20,{damage:3,knockback:2.7,unblockable:true}),
        ...(c.phase===3?[shot(54,c.x,c.floor-100,-Math.PI/2,5,1.4,5,{gravity:.25,kind:'orb',status:{burn:90}})]:[]),
      ]},
      {id:'bailiff-redline-appeal',name:'Redline Appeal',kind:'leap',counter:'platform',hint:'Use the metal plate to clear the returning floor shock.',tell:62,active:126,recover:55,build:c=>[
        ledge(c,0,c.tx-c.face*150,'metal',c.floor-100,180),
        dash(0,c.clampX(c.tx+c.face*100),34,150,{damage:2,knockback:2}),
        ...[-1,1].map(side=>zone(35,'floor',c.tx+c.face*100+side*60,c.floor-9,110,26,21,51,{vx:side*6,damage:2,knockback:2.1,status:{burn:70}})),
      ]},
    ],
  },
  'reef-warden':{
    title:'THE UNDERTOW JAILER',
    identity:'A mobile jailer uses a real inward current, rooting harpoons, delayed prison walls and an arcing arrest. The water moves you before its chains close.',
    movement:'skirmish',speed:2.7,preferredRange:255,
    sequences:[[1,0,2,1,3],[2,1,3,0,1],[0,3,1,2,3,1]],
    moves:[
      {id:'gaoler-undertow-warrant',name:'Undertow Warrant',kind:'current',counter:'retreat',hint:'Swim against the pull; the chain loop closes around the jailer.',tell:42,active:106,recover:46,build:c=>[
        {at:0,type:'force',x:c.x,y:c.floor-35,radius:390,pull:.65,duration:48},
        zone(29,'ring',c.x,c.floor-42,300,90,22,24,{inner:48,damage:2,knockback:1.8,status:{slick:100}}),
        ...(c.phase>=2?[shot(58,c.x,c.floor-82,undefined,3,.32,7,{kind:'droplet',status:{slick:100}})]:[]),
      ]},
      {id:'gaoler-shackle-harpoons',name:'Shackle Harpoons',kind:'harpoon',counter:'shield',hint:'Deflect the chain needles, then close the gap during the reload.',tell:38,active:88,recover:46,build:c=>[
        shot(0,c.x,c.floor-72,undefined,3,.32,8,{kind:'needle',status:{root:16}}),
        shot(28,c.x,c.floor-115,undefined,c.phase>=2?3:1,.45,6,{kind:'droplet',status:{slick:120}}),
        ...(c.phase===3?[shot(54,c.x,c.floor-45,undefined,3,.2,9,{kind:'needle',status:{root:12}})]:[]),
      ]},
      {id:'gaoler-drowning-cells',name:'Drowning Cells',kind:'cells',counter:'dodge',hint:'Wait between the first water walls, then leave before the middle cell seals.',tell:50,active:122,recover:48,build:c=>[
        ...[-1,1].map(side=>zone(0,'pillar',c.clampX(c.tx+side*135),c.floor-120,80,240,24,28,{damage:2,status:{slick:95}})),
        zone(48,'pillar',c.tx,c.floor-110,110,220,30,22,{damage:2,status:{root:14}}),
        ...(c.phase===3?[ledge(c,7,c.tx,'water',c.floor-100,150)]:[]),
      ]},
      {id:'gaoler-breaker-arrest',name:'Breaker Arrest',kind:'leap',counter:'jump',hint:'Jump the low returning breaker after the jailer vaults past you.',tell:46,active:122,recover:44,build:c=>[
        dash(0,c.clampX(c.tx+c.face*130),30,140,{damage:1.5,knockback:2}),
        zone(30,'floor',c.tx+c.face*130,c.floor-11,105,30,20,60,{vx:-c.face*7,damage:2,knockback:2.3,status:{slick:110}}),
        ...(c.phase>=2?[zone(55,'floor',c.tx-c.face*110,c.floor-11,75,28,22,36,{vx:c.face*5,damage:1.5,status:{slick:80}})]:[]),
      ]},
    ],
  },
  'storm-warden':{
    title:'THE LIGHTNING VERDICT',
    identity:'The magistrate is a fast spear duelist. Its announced zigzag lunges, staggered lightning brands, long judgment lance and storm-ring landing demand different dodges.',
    movement:'skirmish',speed:4.4,preferredRange:240,
    sequences:[[0,2,1,0,3],[0,1,3,2,0],[0,3,0,1,2,0]],
    moves:[
      {id:'magistrate-three-count-indictment',name:'Three-Count Indictment',kind:'lunge',counter:'jump',hint:'Jump the first spear rush. The follow-ups cross the same marked lane.',tell:44,active:106,recover:38,build:c=>[
        dash(0,c.clampX(c.tx+c.face*160),16,0,{damage:1.5,knockback:1.5}),
        dash(30,c.clampX(c.tx-c.face*150),17,0,{damage:1.5,knockback:1.6}),
        ...(c.phase>=2?[dash(63,c.clampX(c.tx+c.face*105),14,0,{damage:2,knockback:2})]:[]),
      ]},
      {id:'magistrate-ion-brand',name:'Ion Brand',kind:'lightning',counter:'dodge',hint:'Your old position is branded. Move away; do not dodge into the side brands.',tell:39,active:108,recover:34,build:c=>[
        zone(0,'pillar',c.tx,c.floor-160,55,320,24,14,{damage:2}),
        zone(29,'pillar',c.clampX(c.tx-c.face*160),c.floor-160,55,320,22,14,{damage:1.5}),
        zone(52,'pillar',c.clampX(c.tx+c.face*160),c.floor-160,55,320,22,14,{damage:1.5}),
      ]},
      {id:'magistrate-judgment-lance',name:'Judgment Lance',kind:'spear',counter:'jump',hint:'The long spear sweeps low. Jump it or reach the magistrate’s back.',tell:48,active:72,recover:42,build:c=>[
        zone(0,'beam',c.x+c.face*230,c.floor-53,420,58,16,16,{damage:2.5,knockback:2.4}),
        ...(c.phase>=2?[shot(32,c.x,c.floor-120,undefined,3,.55,10,{kind:'needle'})]:[]),
      ]},
      {id:'magistrate-ascendant-circuit',name:'Ascendant Circuit',kind:'dive',counter:'get-close',hint:'The storm ring has a calm eye. Stand near its marked center after the dive.',tell:53,active:114,recover:46,build:c=>[
        dash(0,c.clampX(c.tx),30,220,{damage:1.5,knockback:1.5}),
        zone(27,'ring',c.tx,c.floor-48,470,110,24,24,{inner:92,damage:2,knockback:2}),
        ...(c.phase===3?[zone(68,'pillar',c.clampX(c.tx+c.face*230),c.floor-160,65,320,22,12,{damage:2})]:[]),
      ]},
    ],
  },
  'frost-warden':{
    title:'THE CLOCKWORK GUILLOTINE',
    identity:'A patient headsman seals old positions in falling ice, rewinds into a cutting rush, raises escape blocks above a freezing floor and calls clockscarabs into a slow-time court.',
    movement:'stalk',speed:1.7,preferredRange:170,
    sequences:[[0,1,0,2,3],[2,0,3,1,0],[1,0,2,1,3,0]],
    moves:[
      {id:'headsman-meridian-drop',name:'Meridian Drop',kind:'guillotine',counter:'dodge',hint:'Leave the thin guillotine lines. Each blade falls on an old position.',tell:52,active:116,recover:54,build:c=>[
        zone(0,'pillar',c.tx,c.floor-155,60,310,24,16,{damage:2.5,knockback:1.8,status:{slow:100}}),
        zone(38,'pillar',c.clampX(c.tx+c.face*160),c.floor-155,70,310,26,16,{damage:2,status:{slow:80}}),
        ...(c.phase===3?[zone(70,'pillar',c.clampX(c.tx-c.face*160),c.floor-155,70,310,22,14,{damage:2,status:{slow:80}})]:[]),
      ]},
      {id:'headsman-rewind-sentence',name:'Rewind Sentence',kind:'rewind',counter:'jump',hint:'The headsman reappears at the ice marker, then cuts back toward its old position.',tell:50,active:112,recover:52,build:c=>[
        zone(0,'mine',c.clampX(c.tx-c.face*150),c.floor-20,80,45,26,12,{damage:1,status:{slow:90}}),
        {at:12,type:'warp',x:c.clampX(c.tx-c.face*150)},
        dash(28,c.clampX(c.x),24,0,{damage:2,knockback:1.8}),
        ...(c.phase>=2?[zone(53,'slash',c.x+c.face*60,c.floor-65,180,100,22,15,{damage:2,status:{slow:100}})]:[]),
      ]},
      {id:'headsman-clock-ice-flood',name:'Clock-Ice Flood',kind:'frostfloor',counter:'platform',hint:'Climb an ice block or find the unmarked gap before the floor freezes.',tell:62,active:138,recover:56,build:c=>{
        const gap=c.clampX(c.tx),leftWidth=Math.max(0,gap-88-c.left),rightWidth=Math.max(0,c.right-gap-88);
        return [
          ledge(c,0,gap-170,'ice',c.floor-105,170),ledge(c,0,gap+170,'ice',c.floor-105,170),
          ...(leftWidth>30?[zone(0,'floor',c.left+leftWidth/2,c.floor-13,leftWidth,34,46,62,{damage:2,status:{slow:140},unblockable:true})]:[]),
          ...(rightWidth>30?[zone(0,'floor',gap+88+rightWidth/2,c.floor-13,rightWidth,34,46,62,{damage:2,status:{slow:140},unblockable:true})]:[]),
          ...(c.phase===3?[zone(77,'pillar',gap,c.floor-95,55,190,29,18,{damage:2})]:[]),
        ];
      }},
      {id:'headsman-stasis-jury',name:'Stasis Jury',kind:'clockcourt',counter:'minions',hint:'Break the clockscarabs. The court’s pulse leaves a safe center beneath the headsman.',tell:58,active:128,recover:54,build:c=>[
        {at:0,type:'summon',kind:'clockscarab',count:c.phase>=2?2:1,x:c.clampX(c.x-c.face*190)},
        zone(22,'ring',c.x,c.floor-26,410,56,28,25,{inner:90,damage:1.5,status:{slow:140}}),
        shot(69,c.tx,c.floor-250,Math.PI/2,3,.65,5,{kind:'blade',gravity:.12,status:{slow:80}}),
      ]},
    ],
  },
  'rift-warden':{
    title:'THE IMPOSSIBLE TESTIMONY',
    identity:'The witness fights through reflected positions: staggered phantom cuts, a warned side inversion, fractured footholds and an aerial eye that fires downward execution rays.',
    movement:'hover',speed:2.5,preferredRange:220,
    sequences:[[0,1,2,0,3],[1,0,3,2,0],[3,1,0,2,1,0]],
    moves:[
      {id:'witness-split-testimony',name:'Split Testimony',kind:'mirrors',counter:'dodge',hint:'The reflections strike in order. Leave your old position before its second cut.',tell:45,active:121,recover:42,build:c=>[
        zone(0,'slash',c.tx-c.face*90,c.floor-65,140,110,22,14,{damage:1.5,knockback:1.6}),
        zone(30,'slash',c.clampX(c.left+c.right-c.tx),c.floor-65,160,110,22,14,{damage:2,knockback:1.8}),
        zone(62,'slash',c.tx+c.face*90,c.floor-65,140,110,24,16,{damage:2,knockback:1.8}),
      ]},
      {id:'witness-oath-inversion',name:'Oath Inversion',kind:'warp',counter:'behind',hint:'Watch the arrival mark. The witness swaps sides before its long inward cut.',tell:52,active:111,recover:48,build:c=>{
        const arrival=c.clampX(c.left+c.right-c.x),direction=c.tx>arrival?1:-1;
        return [
          zone(0,'mine',arrival,c.floor-18,92,42,30,14,{damage:1.5}),
          {at:15,type:'warp',x:arrival},
          zone(34,'slash',arrival+direction*142,c.floor-65,245,115,25,16,{damage:2.5,knockback:2.3}),
          ...(c.phase===3?[shot(71,arrival,c.floor-145,undefined,3,.5,7,{kind:'blade'})]:[]),
        ];
      }},
      {id:'witness-fracture-bridge',name:'Fracture Bridge',kind:'riftbridge',counter:'platform',hint:'Memory footholds appear before the rifts open. Ground between the rifts remains safe.',tell:60,active:142,recover:52,build:c=>{
        const xs=[c.clampX(c.tx-180),c.clampX(c.tx+180)];
        return [
          ...xs.map((x,i)=>ledge(c,0,x,'memory',c.floor-100-i*20,155)),
          ...[-240,0,240].map((dx,i)=>zone(i*19,'floor',c.clampX(c.tx+dx),c.floor-12,120,32,34,45,{damage:1.5,unblockable:true})),
          ...(c.phase>=2?[zone(65,'beam',c.tx,c.floor-175,340,35,26,14,{damage:2})]:[]),
        ];
      }},
      {id:'witness-eye-of-unmaking',name:'Eye of Unmaking',kind:'flyingbeam',counter:'dodge',hint:'Leave the marked vertical ray. The eye descends after its second beam.',tell:70,active:156,recover:64,build:c=>[
        zone(0,'mine',c.clampX(c.tx),c.floor-220,105,70,24,12,{damage:1}),
        {at:12,type:'warp',x:c.clampX(c.tx),y:c.floor-205},
        zone(26,'beam',c.tx,c.floor-105,80,210,30,22,{damage:3,knockback:2.5,unblockable:true}),
        zone(74,'beam',c.clampX(c.tx+c.face*155),c.floor-105,70,210,26,20,{damage:2.5,knockback:2.1}),
        dash(119,c.clampX(c.tx-c.face*95),24,0,{damage:1.5}),
      ]},
    ],
  },
};
