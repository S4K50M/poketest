// The first gate teaches recovery through its geometry: several climbable
// galleries overlap, so a missed jump feeds into a lower route rather than
// restarting the same staircase. All original ledges remain for saved visits.
const shelf=(id,x,y,w,extra={})=>({id,x,y,w,h:26,landing:true,route:'upper',...extra});
const waypoints=points=>points.map(([x,y])=>({x,y}));
const route=(id,name,points)=>({id,name,waypoints:waypoints(points)});
const rescue=(id,x,y,w)=>shelf(id,x,y,w,{catch:true,route:'recovery'});

function install(room,title,platforms,routes,drops=[]){
  for(const p of room.platforms)if(p.y<520&&!p.veil){p.landing=true;if(!p.catch)p.route??='upper';}
  room.platforms.push(...platforms);
  room.climbNetwork={title,routes,drops};
  room.landingNetwork=room.climbNetwork;
}

export function applyMossLandings(rooms){
  install(rooms['moss-path'],'The Rootway Crossings',[
    shelf('rootway-west-step',260,425,300),
    shelf('rootway-west-balcony',180,335,330),
    shelf('rootway-east-balcony',650,335,390),
    shelf('rootway-west-branch',450,245,340),
    shelf('rootway-seed-landing',790,145,450),
    shelf('rootway-arch-landing',1040,245,340),
    shelf('rootway-east-step',1430,200,340),
    shelf('rootway-east-gallery',1240,80,350),
    shelf('rootway-crown',980,-40,380),
    rescue('rootway-lower-catch',410,435,760),
    rescue('rootway-middle-catch',720,365,1050),
  ],[
    route('west','The Moss Balconies',[[390,425],[340,335],[610,245],[980,145],[1370,80],[1170,-40]]),
    route('east','The Old Root Arches',[[510,425],[900,335],[1200,245],[1600,200],[1390,80],[1170,-40]]),
  ]);

  install(rooms['moss-descent'],'Rootfall’s Braided Galleries',[
    // The western zigzag and the old eastern stair meet at a high crossway.
    shelf('rootfall-entry-gallery',180,400,310),
    shelf('rootfall-west-low',100,270,290),
    shelf('rootfall-west-middle',340,140,280),
    shelf('rootfall-west-turn',80,10,270),
    shelf('rootfall-west-canopy',350,-120,300),
    shelf('rootfall-west-crown',110,-250,270),
    shelf('rootfall-canopy-crossing',390,-380,460),
    shelf('rootfall-east-crossing',950,-380,290),
    shelf('rootfall-high-island',1370,-380,300),
    shelf('rootfall-high-east',1800,-380,260),
    // These are broad alternative walking galleries, not invisible cushions.
    rescue('rootfall-low-gallery',440,270,720),
    rescue('rootfall-middle-gallery',500,10,780),
    rescue('rootfall-upper-gallery',800,-250,1450),
  ],[
    route('west','The Western Rootways',[[260,400],[250,270],[460,140],[220,10],[460,-120],[240,-250],[590,-380],[1070,-380],[1490,-380],[1920,-380],[2400,-380]]),
    route('east','The Cistern Crossings',[[555,400],[825,270],[1095,140],[1365,10],[1635,-120],[1905,-250],[2175,-380],[2400,-380]]),
  ],[
    {id:'lower-root-catch',from:{x:600,y:140},direction:'right',untilX:690,catchY:270,return:waypoints([[460,140]])},
    {id:'middle-root-catch',from:{x:600,y:-120},direction:'right',untilX:690,catchY:10,return:waypoints([[460,-120]])},
    {id:'canopy-root-catch',from:{x:1210,y:-380},direction:'right',untilX:1310,catchY:-250,return:waypoints([[1490,-380]])},
  ]);

  install(rooms['moss-nexus'],'The Court’s Interwoven Roots',[
    shelf('court-west-entry',200,400,300),
    shelf('court-west-rest',90,275,310),
    shelf('court-west-loop',320,150,330),
    shelf('court-west-arch',80,25,300),
    shelf('court-canopy-turn',340,-100,310),
    shelf('court-crossway',650,-100,820),
    shelf('court-east-rest',1740,150,310),
    shelf('court-east-loop',2010,25,330),
    shelf('court-east-crown',2210,-100,350),
    rescue('court-low-gallery',300,405,1050),
    rescue('court-middle-gallery',750,275,1200),
    rescue('court-return-gallery',1120,145,1250),
  ],[
    route('west','The Warden’s West Gallery',[[330,400],[240,275],[470,150],[230,25],[490,-100],[1040,-100],[1605,-100]]),
    route('east','The Court Balcony',[[450,400],[730,275],[1010,150],[1290,25],[1605,-100]]),
  ]);

  install(rooms['moss-ascent'],'Canopy’s Returning Paths',[
    shelf('canopy-west-entry',120,395,300),
    shelf('canopy-west-low',100,270,290),
    shelf('canopy-west-rest',340,145,300),
    shelf('canopy-west-turn',90,20,290),
    shelf('canopy-west-bough',350,-105,300),
    shelf('canopy-west-crown',110,-230,290),
    shelf('canopy-west-arch',370,-355,310),
    shelf('canopy-west-high',130,-480,290),
    shelf('canopy-west-lantern',390,-620,310),
    rescue('canopy-low-gallery',380,270,700),
    rescue('canopy-middle-gallery',430,20,940),
    rescue('canopy-upper-gallery',380,-230,1260),
    rescue('canopy-high-gallery',370,-480,1450),
    shelf('canopy-top-landing',640,-750,270),
  ],[
    route('west','The Returning Canopy',[[260,395],[240,270],[480,145],[230,20],[490,-105],[250,-230],[520,-355],[270,-480],[540,-620],[780,-750]]),
    route('east','The Seedkeeper’s Walk',[[490,395],[750,270],[1010,145],[1270,20],[1530,-105],[1800,-230],[1520,-360],[1260,-490],[1005,-620],[780,-750]]),
  ]);
}
