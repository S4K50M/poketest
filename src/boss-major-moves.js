// Each guardian owns a combat vocabulary. Event geometry is locked when the
// tell begins; later phases compose that vocabulary instead of reskinning a
// universal charge/fan/slam loop. All positions are world-space foot anchors.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const zone=(at,shape,x,y,w,h,extra={})=>({at,type:'zone',shape,x,y,w,h,delay:20,life:16,damage:1.5,...extra});
const platform=(at,c,x,style='stone',y=c.floor-105)=>({at,type:'platform',x:c.clampX(x),y,w:150,life:300,style});
const shot=(at,c,extra={})=>({at,type:'shots',x:c.x,y:c.y-95,count:3,spread:.6,speed:6.5,damage:1,kind:'orb',...extra});
const dash=(at,c,to,duration=24,height=0,extra={})=>({at,type:'dash',to:c.clampX(to),duration,height,damage:1.5,knockback:1.4,...extra});
const mark=(at,c,x,w=110,extra={})=>zone(at,'pillar',c.clampX(x),c.floor-120,w,240,{delay:30,life:18,...extra});
const move=(id,name,kind,counter,hint,tell,active,recover,build)=>({id,name,kind,counter,hint,tell,active,recover,build});

export const MAJOR_ENCOUNTERS={
  briar:{
    title:'The First Garden',identity:'An area-control mother grows root lanes, protects a living nursery, then leaves the heart of her embrace safe.',
    movement:'anchor',speed:1.25,preferredRange:175,sequences:[[0,3,1,0,2],[1,0,3,2,0],[2,3,0,1,3,0]],
    moves:[
      move('briar-root-comb','Root Comb','roots','jump','Jump the crawling root line; every raised patch bursts once.',46,110,44,c=>{
        const events=[];for(let i=0;i<4+c.phase;i++){const x=c.clampX(c.tx+(i-2)*76);events.push(zone(i*11,'floor',x,c.floor-13,62,26,{delay:23,life:14,damage:1,knockback:1.1,status:{root:10},label:'ROOT COMB'}));}return events;
      }),
      move('briar-living-nursery','Living Nursery','summon','minions','Cut down her thornlings while the Matron tends the nursery.',58,55,58,c=>[
        platform(0,c,c.x-c.face*140,'root'),
        {at:8,type:'summon',kind:'thornling',count:c.phase===3?3:2,x:c.clampX(c.x+c.face*130)},
        zone(14,'mine',c.clampX(c.x-c.face*145),c.floor-17,90,34,{delay:28,life:28,damage:1,label:'NURSERY SEED'}),
      ]),
      move('briar-mothers-embrace','Mother’s Embrace','ring','get-close','Stand inside the root circle, close to her seed chamber.',64,95,52,c=>[
        {at:0,type:'force',x:c.x,y:c.floor-40,radius:360,pull:.18,duration:35},
        zone(0,'ring',c.x,c.floor-45,490,110,{inner:90,delay:50,life:22,damage:2,knockback:1.7,status:{root:12},label:'SAFE INSIDE'}),
        ...(c.phase>=2?[zone(52,'floor',c.clampX(c.x+c.face*240),c.floor-12,120,24,{delay:20,life:12,damage:1})]:[]),
      ]),
      move('briar-heartwood-bound','Heartwood Bound','leap','dodge','Her landing is locked. Dash away, then punish the rooted body.',42,104,50,c=>[
        dash(0,c,c.tx,30,145,{damage:1.5,knockback:1.6}),
        zone(25,'blast',c.tx,c.floor-35,174,70,{delay:15,life:16,damage:2,knockback:1.8,label:'ROOT IMPACT'}),
        ...(c.phase>=2?[mark(38,c,c.tx-c.face*170,64,{delay:26,damage:1}),mark(52,c,c.tx+c.face*170,64,{delay:26,damage:1})]:[]),
      ]),
    ],
  },
  bell:{
    title:'The Furnace Sermon',identity:'A heavy bell saint alternates close hammer sweeps, concentric sound, furnace grates, and lobbed cinders.',
    movement:'stalk',speed:1.45,preferredRange:130,sequences:[[0,2,1,3],[2,0,3,1,0],[3,2,0,1,2,0]],
    moves:[
      move('bell-censer-crusher','Censer Crusher','hammer','behind','Cross behind the raised censer; its heavy swing faces one way.',62,92,55,c=>[
        zone(0,'slash',c.clampX(c.x+c.face*115),c.floor-68,245,135,{delay:15,life:12,damage:2.5,knockback:2.6,label:'CENSER SWING'}),
        ...(c.phase>=2?[zone(42,'slash',c.clampX(c.x-c.face*80),c.floor-46,185,92,{delay:22,life:10,damage:1.5,knockback:1.8,label:'BACKSWING'})]:[]),
      ]),
      move('bell-resonant-peal','Resonant Peal','ring','get-close','The outer bell ring hurts. Stay beneath the saint or jump clear.',66,120,48,c=>[
        zone(0,'ring',c.x,c.floor-25,570,58,{inner:100,delay:30,life:18,damage:1.5,knockback:2.2,label:'BELL RADIUS'}),
        zone(42,'ring',c.x,c.floor-25,810,58,{inner:190,delay:28,life:18,damage:1.5,knockback:2.2}),
        ...(c.phase===3?[zone(78,'ring',c.x,c.floor-25,1000,58,{inner:285,delay:22,life:16,damage:2,knockback:2.5})]:[]),
      ]),
      move('bell-open-the-grates','Open the Grates','vents','dodge','Orange grates ignite in alternating lanes. Move into the dark gaps.',54,145,42,c=>{
        const events=[];for(let i=0;i<5;i++){const x=c.left+90+i*(c.right-c.left-180)/4;events.push(mark((i%2)*42,c,x,70,{delay:32,life:24,damage:1.5,status:{burn:70},label:'FURNACE GRATE'}));}return events;
      }),
      move('bell-coal-communion','Coal Communion','rain','get-close','The cinders arc over the saint. Close in beneath the furnace mouth.',48,130,52,c=>{
        const events=[];for(let i=0;i<3+c.phase;i++)events.push(shot(i*16,c,{x:c.x,y:c.floor-175,angle:c.face>0?-.95:Math.PI+.95,count:2,spread:.3,speed:5.7,gravity:.18,kind:'orb',damage:1.5,status:{burn:55}}));return events;
      }),
    ],
  },
  leviathan:{
    title:'The Living Tide',identity:'A tidal body changes the usable floor with low water jets, creates lifeboat ledges, vacuums swimmers, and breaches across the chamber.',
    movement:'hover',speed:1.55,preferredRange:230,sequences:[[0,2,3,1],[1,0,3,2,0],[3,1,2,0,3,2]],
    moves:[
      move('leviathan-low-tide','Low Tide, High Water','flood','platform','Climb a water shelf or jump over the low horizontal current.',78,160,54,c=>[
        platform(0,c,c.tx-100,'water'),platform(0,c,c.tx+160,'water'),
        zone(0,'beam',c.center,c.floor-24,c.right-c.left,44,{delay:66,life:45,damage:1.5,knockback:1.9,status:{slick:90},label:'LOW TIDE'}),
        ...(c.phase>=2?[shot(105,c,{count:5,spread:1.5,speed:5,kind:'droplet'})]:[]),
      ]),
      move('leviathan-abyssal-inhale','Abyssal Inhale','vacuum','retreat','Escape the mouth before the inhale becomes a crushing bite.',76,115,64,c=>[
        {at:0,type:'force',x:c.x,y:c.floor-55,radius:440,pull:.28+c.phase*.07,duration:48},
        zone(8,'blast',c.x,c.floor-73,255,146,{delay:58,life:18,damage:2.5,knockback:2.5,unblockable:true,label:'ABYSSAL BITE'}),
      ]),
      move('leviathan-ink-constellation','Ink Constellation','orbit','dodge','Read the three separate ink fans. Their aim never follows you.',44,140,42,c=>{
        const events=[];for(let i=0;i<3;i++)events.push(shot(i*28,c,{x:c.x+c.face*(i-1)*45,y:c.floor-100-i*28,count:3+c.phase,spread:1.25,speed:5.4+i*.6,kind:'droplet',status:{slick:65}}));return events;
      }),
      move('leviathan-archive-breach','Archive Breach','leap','dodge','Let the Leviathan sail past, then avoid its ink geyser at the marked landing.',52,140,60,c=>[
        dash(0,c,c.tx+c.face*110,38,220,{damage:2,knockback:2}),
        mark(30,c,c.tx+c.face*110,120,{delay:24,life:24,damage:2,status:{slick:80},label:'INK GEYSER'}),
        ...(c.phase>=2?[mark(72,c,c.x,80,{delay:28,damage:1.5,label:'BACKWASH'})]:[]),
      ]),
    ],
  },
  conductor:{
    title:'A Storm in Four Movements',identity:'A winged duelist uses aerial crossing dives, forked sky-lanes, rhythmic thunder chords, and a summoned airborne choir.',
    movement:'skirmish',speed:3.8,preferredRange:180,sequences:[[0,2,1,3],[1,0,2,0,3],[0,1,0,3,2,1]],
    moves:[
      move('conductor-wingbeat-cadence','Wingbeat Cadence','dive','dodge','The first landing is marked. Leave it, then watch the crossing dive.',34,118,34,c=>[
        dash(0,c,c.tx+c.face*85,24,215,{damage:1.5,knockback:1.7}),
        mark(22,c,c.tx+c.face*85,70,{delay:22,damage:1.5,label:'DOWNBEAT'}),
        ...(c.phase>=2?[dash(60,c,c.tx-c.face*120,22,145,{damage:1.5,knockback:1.6})]:[]),
      ]),
      move('conductor-forked-verdict','Forked Verdict','lightning','dodge','Stand between the thin violet columns. The second chord strikes the gaps.',48,150,40,c=>{
        const events=[];for(let i=0;i<5;i++){const x=c.left+70+i*(c.right-c.left-140)/4;events.push(mark(i%2*18,c,x,48,{delay:30,life:12,damage:1.5,label:'SKY FORK'}));if(c.phase>=2&&i<4)events.push(mark(72,c,x+(c.right-c.left-140)/8,45,{delay:30,life:12,damage:1.5,label:'SECOND CHORD'}));}return events;
      }),
      move('conductor-thunderstaff','Thunderstaff','beam','jump','Jump the low staff beam; the final high chord passes above grounded creatures.',58,140,42,c=>[
        zone(0,'beam',c.center,c.floor-28,c.right-c.left,42,{delay:28,life:14,damage:2,knockback:2.2,label:'LOW CHORD'}),
        zone(52,'beam',c.center,c.floor-155,c.right-c.left,38,{delay:30,life:16,damage:2,knockback:1.8,label:'HIGH CHORD · LAND'}),
        ...(c.phase===3?[zone(98,'beam',c.center,c.floor-28,c.right-c.left,42,{delay:22,life:12,damage:2,label:'FINAL DOWNBEAT'})]:[]),
      ]),
      move('conductor-lost-choir','The Lost Choir','summon','minions','Silence the stormkites during the conductor’s long exposed cadenza.',65,120,65,c=>[
        {at:0,type:'summon',kind:'stormkite',count:2,x:c.clampX(c.x-c.face*180)},
        shot(34,c,{count:5,spread:2.8,speed:4.8,kind:'needle'}),
        ...(c.phase>=2?[shot(82,c,{count:5,spread:2.8,speed:5.3,kind:'needle'})]:[]),
      ]),
    ],
  },
  hourglass:{
    title:'A Second Repeated',identity:'The stag makes visible echoes of locked positions, reverses a gallop, freezes delayed mines, and rewrites its chamber into ice steps.',
    movement:'skirmish',speed:3.1,preferredRange:185,sequences:[[0,2,1,3],[2,0,3,1,0],[0,2,0,1,3,2]],
    moves:[
      move('hourglass-rewind-gallop','Rewind Gallop','rewind','jump','Jump the first gallop, then its return along the same remembered line.',44,140,44,c=>[
        dash(0,c,c.tx+c.face*140,28,0,{damage:1.5,knockback:1.6}),
        zone(22,'floor',c.x,c.floor-13,120,26,{delay:25,life:15,damage:1,status:{slow:90},label:'REMEMBERED START'}),
        dash(68,c,c.x,28,0,{damage:2,knockback:1.9}),
      ]),
      move('hourglass-second-hand','The Second Hand','beam','platform','Ice steps rise before the low sweeping hand. Leap onto one.',70,150,46,c=>[
        platform(0,c,c.tx-120,'ice'),platform(0,c,c.tx+130,'ice'),
        zone(0,'beam',c.center,c.floor-28,c.right-c.left,48,{delay:54,life:28,damage:2,knockback:1.5,status:{slow:90},label:'SECOND HAND'}),
        ...(c.phase>=2?[zone(78,'mine',c.tx,c.floor-13,98,26,{delay:28,life:18,damage:1.5,status:{slow:140},label:'AFTERSECOND'})]:[]),
      ]),
      move('hourglass-stolen-seconds','Stolen Seconds','mines','dodge','Leave your remembered position. Frost mines burst in a delayed spiral.',48,165,42,c=>{
        const events=[];for(let i=0;i<3+c.phase;i++)events.push(zone(i*19,'mine',c.clampX(c.tx+(i%2?1:-1)*Math.ceil(i/2)*100),c.floor-28,86,56,{delay:38-i*3,life:15,damage:1.5,status:{slow:150},label:'STOLEN SECOND '+(i+1)}));return events;
      }),
      move('hourglass-frozen-constellation','Frozen Constellation','terrain','dodge','The crystal pillars leave wide gaps; use the new ice steps for height.',62,150,58,c=>[
        platform(0,c,c.center,'ice'),
        mark(10,c,c.tx-160,68,{delay:34,life:25,damage:2,status:{slow:100},label:'FROZEN STAR'}),
        mark(38,c,c.tx+160,68,{delay:34,life:25,damage:2,status:{slow:100},label:'FROZEN STAR'}),
        shot(85,c,{count:c.phase+2,spread:1.6,speed:6,kind:'needle',status:{slow:80}}),
      ]),
    ],
  },
  crown:{
    title:'The Sovereign’s Broken Oath',identity:'A giant sword ruler combines directional cleaves, crushing throne charges, orbiting crown shards, and a terrain-changing heart trial.',
    movement:'stalk',speed:1.9,preferredRange:155,sequences:[[0,2,1,3],[1,0,2,3,0],[0,1,0,3,2,1]],
    moves:[
      move('crown-worldcleaver','Worldcleaver','sword','behind','The great blade claims one side. Dash behind the sovereign before it falls.',70,140,55,c=>[
        zone(0,'slash',c.clampX(c.x+c.face*170),c.floor-95,370,190,{delay:18,life:16,damage:3,knockback:2.8,label:'WORLDCLEAVER'}),
        ...(c.phase>=2?[zone(62,'slash',c.clampX(c.x-c.face*120),c.floor-46,270,92,{delay:28,life:12,damage:2,knockback:2.3,label:'RETURNING OATH'})]:[]),
      ]),
      move('crown-break-the-throne','Break the Throne','charge','dodge','Leave the marked lane; the throne’s crash throws everything away.',50,130,55,c=>[
        dash(0,c,c.tx+c.face*170,24,45,{damage:2.5,knockback:2.8}),
        zone(24,'blast',c.clampX(c.tx+c.face*170),c.floor-50,220,100,{delay:22,life:18,damage:2.5,knockback:2.8,label:'THRONE BREAK'}),
        ...(c.phase===3?[mark(70,c,c.tx-c.face*130,70,{delay:26,damage:1.5,label:'FALLEN CROWN'})]:[]),
      ]),
      move('crown-orbit-of-ruin','Orbit of Ruin','orbit','shield','The crown fires in two spokes. Deflect a shard or pass through its gaps.',46,130,42,c=>[
        shot(0,c,{y:c.floor-120,count:7,spread:3.5,speed:5.7,kind:'blade',damage:1.5}),
        shot(52,c,{y:c.floor-65,count:5+c.phase,spread:2.8,speed:6.4,kind:'blade',damage:1.5}),
      ]),
      move('crown-heart-trial','Trial of the Worldheart','terrain','platform','Memory stairs rise before the floor ruptures. Stand above the broken oath.',84,175,62,c=>[
        platform(0,c,c.tx-135,'memory'),platform(0,c,c.tx+135,'memory'),
        zone(0,'floor',c.center,c.floor-15,c.right-c.left,30,{delay:78,life:35,damage:2.5,knockback:2,unblockable:true,label:'HEART TRIAL · CLIMB'}),
        ...(c.phase>=2?[shot(128,c,{count:3,spread:1.25,speed:5.5,kind:'blade'})]:[]),
      ]),
    ],
  },
  palimpsest:{
    title:'The Unfinished Sentence',identity:'A living book edits the arena with parallel redactions, closing margins, flying punctuation, and a lethal final full stop.',
    movement:'anchor',speed:1,preferredRange:220,sequences:[[0,2,1,3],[1,0,2,3,0],[2,1,0,3,0,2]],
    moves:[
      move('palimpsest-redaction','Redaction','pillars','dodge','The crossed-out columns vanish into ink. Stand between the margins.',52,135,48,c=>[
        mark(0,c,c.tx-125,80,{delay:30,life:24,damage:1.5,label:'REDACTED'}),
        mark(22,c,c.tx+125,80,{delay:30,life:24,damage:1.5,label:'REDACTED'}),
        ...(c.phase>=2?[mark(72,c,c.tx,68,{delay:32,life:18,damage:2,label:'LAST WORD'})]:[]),
      ]),
      move('palimpsest-folded-margins','Folded Margins','walls','get-close','The book closes the outer margins; the central binding remains safe.',74,145,62,c=>[
        platform(0,c,c.center,'memory'),
        zone(0,'pillar',c.left+90,c.floor-155,140,310,{delay:44,life:40,damage:2,knockback:2,label:'LEFT MARGIN'}),
        zone(0,'pillar',c.right-90,c.floor-155,140,310,{delay:44,life:40,damage:2,knockback:2,label:'RIGHT MARGIN'}),
        ...(c.phase>=2?[{at:18,type:'force',x:c.center,y:c.floor-60,radius:400,pull:.16,duration:40}]:[]),
      ]),
      move('palimpsest-punctuation-storm','Punctuation Storm','rain','dodge','The comma blades fall in slanted sentences, with pauses between lines.',46,150,42,c=>{
        const events=[];for(let i=0;i<4;i++)events.push(shot(i*24,c,{x:c.clampX(c.tx+(i%2?180:-180)),y:c.floor-275,angle:i%2?2.05:1.09,count:3+c.phase,spread:.7,speed:5.5,kind:'blade',damage:1}));return events;
      }),
      move('palimpsest-full-stop','Full Stop','execution','platform','EXECUTION: get onto a paper shelf before the horizontal erasure beam.',100,165,68,c=>[
        platform(0,c,c.tx-115,'memory',c.floor-115),platform(0,c,c.tx+150,'memory',c.floor-115),
        zone(0,'beam',c.center,c.floor-39,c.right-c.left,58,{delay:88,life:24,damage:c.phase===3?'lethal':2.5,knockback:2.2,unblockable:true,label:c.phase===3?'FULL STOP · EXECUTION':'FULL STOP · CLIMB'}),
      ]),
    ],
  },
  belltwin:{
    title:'Yesterday, Tomorrow',identity:'Two saints alternate low and high bell rhythms, recruit candle attendants, and grow a paired dawn rather than copying the furnace saint.',
    movement:'anchor',speed:1.25,preferredRange:165,sequences:[[0,1,2,3],[1,0,3,2,1],[0,3,1,0,2,3]],
    moves:[
      move('belltwin-yesterdays-toll','Yesterday’s Toll','rhythm','jump','Two low tolls, a pause, then one late toll. Jump to the rhythm.',54,175,48,c=>[
        zone(0,'floor',c.center,c.floor-13,c.right-c.left,26,{delay:26,life:10,damage:1.5,label:'ONE'}),
        zone(42,'floor',c.center,c.floor-13,c.right-c.left,26,{delay:26,life:10,damage:1.5,label:'TWO'}),
        zone(108,'floor',c.center,c.floor-13,c.right-c.left,26,{delay:30,life:12,damage:2,knockback:2,label:'YESTERDAY'}),
      ]),
      move('belltwin-tomorrows-answer','Tomorrow’s Answer','rhythm','dodge','The future tolls where you stood; the second bell answers on either side.',58,150,45,c=>[
        mark(0,c,c.tx,86,{delay:36,life:14,damage:1.5,label:'TOMORROW'}),
        mark(52,c,c.tx-155,76,{delay:34,life:14,damage:1.5,label:'ANSWER LEFT'}),
        mark(52,c,c.tx+155,76,{delay:34,life:14,damage:1.5,label:'ANSWER RIGHT'}),
        ...(c.phase===3?[shot(105,c,{count:3,spread:.7,speed:6,kind:'orb'})]:[]),
      ]),
      move('belltwin-dawn-procession','Dawn Procession','summon','minions','Defeat the candle attendants while the saints expose their sunseed.',70,115,66,c=>[
        {at:0,type:'summon',kind:'candlewraith',count:2,x:c.clampX(c.x-c.face*155)},
        platform(0,c,c.center,'metal'),
        zone(32,'ring',c.x,c.floor-30,450,64,{inner:110,delay:34,life:18,damage:1.5,label:'DAWN HALO'}),
      ]),
      move('belltwin-two-suns','Two Suns','beam','jump','Jump the first low sun, then land beneath tomorrow’s high sun.',80,185,60,c=>[
        zone(0,'beam',c.center,c.floor-24,c.right-c.left,38,{delay:36,life:14,damage:2,knockback:2,label:'FIRST SUN · JUMP'}),
        zone(60,'beam',c.center,c.floor-156,c.right-c.left,42,{delay:34,life:18,damage:2,label:'SECOND SUN · LAND'}),
        ...(c.phase===3?[zone(121,'beam',c.center,c.floor-24,c.right-c.left,38,{delay:28,life:12,damage:2.5,label:'BORROWED DAWN'})]:[]),
      ]),
    ],
  },
  nullheart:{
    title:'Tomorrow Has Teeth',identity:'The chosen covenant rewrites memory cascades, the first chorus, or mirrored futures; the final cradle has its own summoned court and a horizon execution.',
    movement:'skirmish',speed:2.8,preferredRange:185,sequences:[[0,2,3,1],[3,0,2,1,0],[0,3,1,2,3,0,1]],
    moves:[
      move('nullheart-oath-unraveled','Oath Unraveled','covenant','dodge','Your covenant shapes the attack: leave memory columns, jump tides, or escape mirror marks.',62,170,52,c=>{
        if(c.mechanic==='memorycascade')return [mark(0,c,c.tx,80,{delay:40,life:20,damage:2,status:{slow:140},label:'PERFECT MEMORY'}),mark(48,c,c.tx-155,68,{delay:34,damage:1.5,status:{slow:100}}),mark(70,c,c.tx+155,68,{delay:34,damage:1.5,status:{slow:100}})];
        if(c.mechanic==='tidechoir')return [zone(0,'ring',c.tx,c.floor-25,500,58,{inner:88,delay:38,life:18,damage:2,status:{slick:100},label:'FIRST CHORUS'}),zone(60,'floor',c.center,c.floor-13,c.right-c.left,26,{delay:34,life:14,damage:2,status:{slick:80},label:'RISING VOICES'})];
        return [zone(0,'slash',c.tx,c.floor-60,165,120,{delay:40,life:12,damage:2,label:'UNWRITTEN FUTURE'}),zone(54,'slash',c.clampX(c.tx-180),c.floor-60,150,120,{delay:34,life:12,damage:2,label:'ROAD NOT TAKEN'}),zone(92,'slash',c.clampX(c.tx+180),c.floor-60,150,120,{delay:34,life:12,damage:2,label:'OTHER SELF'})];
      }),
      move('nullheart-zero-horizon','Zero Horizon','execution','platform','EXECUTION: take a memory ledge above the flying beam. The floor lane is erased.',108,185,72,c=>[
        platform(0,c,c.tx-130,'memory',c.floor-120),platform(0,c,c.tx+145,'memory',c.floor-120),
        zone(0,'mine',c.x,c.floor-15,110,30,{delay:36,life:12,damage:1,label:'ASCENDING CRADLE'}),
        {at:40,type:'warp',x:c.clampX(c.x-c.face*180),y:c.floor-175},
        zone(0,'beam',c.center,c.floor-44,c.right-c.left,64,{delay:100,life:28,damage:c.phase===3?'lethal':3,unblockable:true,knockback:2.5,label:c.phase===3?'ZERO HORIZON · EXECUTION':'ZERO HORIZON · CLIMB'}),
        {at:148,type:'warp',x:c.x,y:c.floor},
      ]),
      move('nullheart-empty-cradles','Empty Cradles','summon','minions','Break the summoned court before the cradle rings close around their empty seats.',76,150,66,c=>[
        {at:0,type:'summon',kind:c.mechanic==='memorycascade'?'clockscarab':c.mechanic==='tidechoir'?'inkfin':'hushling',count:c.phase===3?3:2,x:c.clampX(c.x-c.face*160)},
        platform(0,c,c.center,'memory'),
        zone(40,'ring',c.center,c.floor-35,540,80,{inner:125,delay:40,life:24,damage:2,label:'EMPTY SEATS'}),
      ]),
      move('nullheart-future-collapse','Future Collapse','leap','dodge','The outer futures detonate first. Bait the final descending heart away from the safe center.',72,200,65,c=>[
        zone(0,'blast',c.left+100,c.floor-65,165,130,{delay:38,life:18,damage:2,knockback:2.2,label:'LOST FUTURE'}),
        zone(0,'blast',c.right-100,c.floor-65,165,130,{delay:38,life:18,damage:2,knockback:2.2,label:'LOST FUTURE'}),
        dash(74,c,c.tx,34,225,{damage:2.5,knockback:2.7}),
        zone(94,'blast',c.tx,c.floor-40,205,80,{delay:30,life:20,damage:2.5,knockback:2.8,unblockable:true,label:'FUTURE COLLAPSE'}),
        ...(c.phase===3?[shot(150,c,{count:7,spread:2.9,speed:6.1,kind:'blade',damage:1.5})]:[]),
      ]),
    ],
  },
};
