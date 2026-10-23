// Authored chamber identities. Main tunnels stay safe underfoot; side routes
// have different silhouettes, rhythms and rewards instead of a shared stair.
const ledge=(x,y,w=210,extra={})=>({x,y,w,h:26,landing:true,route:'gallery',...extra});
const GATES=['moss','forge','reef','storm','frost','rift'];
const WIDTH={path:[2800,3350,3900,4450,5000,5550],descent:[3500,4100,4700,5300,5900,6500],nexus:[3700,4300,4900,5500,6100,6700],ascent:[3300,3900,4500,5100,5700,6300],vault:[3400,4000,4600,5200,5800,6400],heart:[2100,2380,2660,2940,3220,3500]};
const SPECIES={moss:['bloomspitter','sporekeeper','thornling','sproutlet'],forge:['cinderdrill','chainshield','sinder','ashwing'],reef:['siphonray','inkmortar','inkfin','dewdrop'],storm:['magnetmoth','galeswarm','stormkite','voltlet'],frost:['bellspider','crystalfencer','frostmite','pebbleback'],rift:['phasehound','voidlantern','riftling','inkfin']};
const p=(name,motif,form,points,landmarkY=520)=>({name,motif,form,points,landmarkY});
// Coordinates are deliberately authored, not generated from a single ascent
// formula. Y is feet height; the connected floor always remains at 520.
export const ROOM_IDENTITIES={
 sanctuary:p('A Village Inside the Lantern','lantern-village','village',[]),
 'moss-path':p('Living Root Nave','root-organ','braid',[]),
 'moss-descent':p('Waterfall Woven Through Roots','seed-aqueduct','cistern',[]),
 'moss-nexus':p('The Garden Court','seed-court','court',[]),
 'moss-ascent':p('The Three Canopy Rings','canopy-rings','spiral',[],-210),
 'moss-vault':p('The Widow’s Egg Chambers','root-eggs','chambers',[[330,410,250],[520,295,310],[390,180,230],[690,75,380],[1030,-40,260],[1240,-155,410],[1620,-270,280],[1960,-380,350],[2270,-480,320]]),
 'moss-heart':p('The First Seed’s Root Cage','living-cage','arena',[[450,400,240],[730,280,210],[1060,400,240],[1410,320,240],[1710,430,220]]),
 'hidden-grove':p('The Sleeping Seed’s Hollow','seed-hollow','sanctum',[]),
 'forge-path':p('The Ember Waterwheel','furnace-wheel','channel',[[420,420,280],[790,310,230],[1160,420,370],[1510,305,300],[1910,420,220]]),
 'forge-descent':p('The Counterweight Works','iron-pistons','counterweights',[[320,405,260],[570,285,250],[430,170,260],[760,55,350],[1100,-65,260],[1420,55,240],[1710,-65,300],[2020,-180,310],[2310,-300,340],[2610,-420,250]]),
 'forge-nexus':p('The Crucible’s Four Mouths','four-crucibles','crossing',[[330,410,220],[590,290,300],[900,170,230],[1130,50,240],[1400,-70,350],[1710,-190,260],[1990,-310,290]]),
 'forge-ascent':p('The Unrung Bell’s Spiral','hanging-bells','belfry',[[300,405,210],[120,290,260],[400,175,260],[160,60,250],[460,-55,270],[760,-170,340],[1110,-285,330],[1450,-400,300],[1120,-520,300],[780,-635,320],[430,-750,480]]),
 'forge-vault':p('The Three Miniature Suns','sun-kilns','kilns',[[350,405,300],[700,285,260],[960,170,260],[1230,50,320],[1510,-70,320],[1820,-190,240],[2070,-310,260],[2310,-430,360]]),
 'forge-heart':p('The Saint’s Open Furnace','saint-furnace','altar',[[440,400,250],[780,290,220],[1150,410,320],[1570,315,240],[1880,420,250]]),
 'reef-path':p('The Broken Flood Lock','tidal-lock','aqueduct',[[360,415,260],[650,295,240],[960,410,300],[1130,330,230],[1430,270,280],[1820,390,350],[2190,280,230]]),
 'reef-descent':p('The Helical Flooded Index','archive-coil','helix',[[310,405,330],[660,290,260],[950,175,240],[1220,60,310],[1540,-55,280],[1220,-170,280],[900,-285,280],[590,-400,280],[920,-515,370],[1300,-630,330],[1640,-745,350]]),
 'reef-nexus':p('Three Drowned Reading Halls','reading-vaults','trident',[[310,405,340],[730,285,230],[1020,165,300],[1320,45,250],[1570,-75,220],[1860,-195,260],[2160,-315,330]]),
 'reef-ascent':p('The Book That Became a Bridge','book-bridge','stacked-bridges',[[320,405,300],[660,290,300],[1000,175,300],[1330,60,320],[1700,-55,360],[1360,-170,290],[1040,-285,290],[720,-400,290],[1050,-515,290],[720,-630,270],[430,-750,480]]),
 'reef-vault':p('The Siphon’s Three Reservoirs','siphon-reservoir','reservoir',[[370,410,350],[740,295,260],[1050,180,370],[1410,60,260],[1680,-55,300],[1970,-175,270],[2230,-295,290],[2400,-415,350]]),
 'reef-heart':p('The Mouth of the Archive','archive-jaws','abyss',[[360,405,300],[710,285,250],[1060,405,370],[1470,275,250],[1810,405,300],[2160,300,260]]),
 'storm-path':p('The Fallen Wind Organ','wind-organ','airways',[[390,410,250],[760,300,220],[1080,425,260],[1270,325,230],[1540,400,250],[1910,280,280],[2280,390,260]]),
 'storm-descent':p('The Suspended Inverted Bells','inverted-bells','pendulums',[[340,400,270],[650,280,240],[960,160,280],[1310,40,250],[1630,-80,280],[1980,-200,260],[2300,-320,350],[2670,-440,280]]),
 'storm-nexus':p('The Four Broken Choir Lofts','choir-lofts','lofts',[[300,410,310],[650,290,300],[1010,170,250],[1330,50,250],[1570,-70,250],[1860,-190,330],[2200,-310,360]]),
 'storm-ascent':p('The Wind’s Corkscrew Stair','wind-corkscrew','corkscrew',[[280,405,300],[600,290,230],[350,175,240],[670,60,230],[1000,-55,260],[1330,-170,250],[1640,-285,280],[1320,-400,260],[1000,-515,260],[700,-635,250],[430,-750,480]]),
 'storm-vault':p('The Ninth Voice’s Tuning Fork','giant-tuning-fork','fork',[[320,405,300],[660,285,300],[1010,165,300],[1360,45,260],[1640,-75,260],[1930,-195,260],[2210,-315,280],[2430,-435,340]]),
 'storm-heart':p('The Unchained Constellation','storm-cage','concert',[[330,405,250],[670,285,240],[1020,405,270],[1370,285,240],[1720,405,270],[2060,285,240],[2410,405,250]]),
 'star-observatory':p('The Broken Planetarium','fallen-planetarium','observatory',[]),
 'frost-path':p('A River Frozen Into Seconds','frozen-river','rifts',[[350,410,330],[760,410,300],[1060,280,260],[1320,150,250],[1610,330,250],[1960,215,270],[2300,390,310]]),
 'frost-descent':p('The Clock’s Escapement Teeth','clock-escapement','escapement',[[380,335,300],[720,150,300],[1040,-35,300],[1370,-220,310],[1700,-405,320],[1390,-590,320],[1730,-775,340],[2090,-775,350],[2470,-775,470]]),
 'frost-nexus':p('The Winter Astrolabe','winter-astrolabe','orrery',[[310,405,310],[670,285,280],[1040,165,250],[1360,45,230],[1570,-75,260],[1850,-195,280],[2140,-315,350]]),
 'frost-ascent':p('The Stair Walking Backward','reverse-clock','rewind',[[290,405,260],[560,285,280],[860,165,270],[1170,45,260],[1490,-75,250],[1800,-195,280],[1510,-315,260],[1200,-435,260],[910,-555,260],[620,-675,290],[430,-750,480]]),
 'frost-vault':p('The Vault’s Frozen Pendulum','frozen-pendulum','pendulum',[[340,405,280],[640,285,300],[960,165,290],[1280,45,280],[1580,-75,320],[1920,-195,280],[2200,-315,270],[2400,-435,350]]),
 'frost-heart':p('The Face of the Last Second','clock-cathedral','clockface',[[350,410,250],[650,290,250],[970,170,260],[1290,290,270],[1640,410,280],[1980,290,260],[2320,410,260],[2660,300,250]]),
 'rift-path':p('The Spine of the First Cage','world-spine','ribcage',[[350,405,280],[680,285,260],[960,165,250],[1260,285,290],[1610,405,300],[1970,285,280],[2290,165,300]]),
 'rift-descent':p('The Wound’s Unequal Teeth','fracture-jaws','fracture',[[370,335,310],[720,150,300],[1060,-35,310],[1410,-220,320],[1750,-405,310],[2100,-590,320],[2440,-775,480]]),
 'rift-nexus':p('A Throne Seen From Inside','inverted-throne','throne',[[340,405,300],[680,285,260],[1000,165,280],[1320,45,250],[1560,-75,260],[1850,-195,290],[2170,-315,330]]),
 'rift-ascent':p('The Stair Unwriting Itself','unwritten-stair','palindrome',[[300,405,280],[610,285,260],[930,165,290],[1260,45,290],[1590,-75,300],[1920,-195,310],[1610,-315,300],[1280,-435,290],[960,-555,290],[650,-675,290],[430,-750,480]]),
 'rift-vault':p('Six Locks Around One Heart','six-locks','radial-locks',[[340,405,290],[670,285,280],[1000,165,310],[1340,45,300],[1670,-75,290],[1990,-195,300],[2320,-315,310],[2420,-435,340]]),
 'rift-heart':p('The Cage Turned Inside Out','open-worldheart','heart',[[360,405,280],[700,285,260],[1030,405,310],[1400,285,280],[1760,405,310],[2130,285,270],[2480,405,290],[2830,285,260]]),
 'clockwork-ossuary':p('A Garden Growing Inside Two Bells','twin-greenhouse','garden-gears',[[330,410,300],[650,295,280],[960,180,300],[1270,390,270],[1590,280,280],[1920,165,300],[2260,390,270]]),
 'paper-moon':p('The Bridge of Unsent Letters','paper-moon-bridge','folded-pages',[[330,405,300],[660,290,300],[1000,300,280],[1340,385,270],[1670,280,260],[1980,160,290],[2290,385,270]]),
 'cradle-zero':p('The Future’s Unfinished Orrery','empty-cradle-stars','unbuilt-orbits',[[320,405,290],[640,290,280],[960,295,270],[1260,390,270],[1590,270,280],[1920,150,290],[2310,385,270]])
};

const upperSurface=(room,x,y,w=200)=>{
 if(room.platforms.some(s=>!s.solid&&Math.abs(s.y-y)<2&&x>=s.x+12&&x<=s.x+s.w-12))return;
 room.platforms.push(ledge(Math.max(0,x-w/2),y,w,{purpose:'story-landing'}));
};
function safeCatchTerraces(room,points){
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];if(a.y>=400||Math.abs(a.y-b.y)>190)continue;
  const x=Math.max(0,Math.min(a.x,b.x)-24),w=Math.min(room.width-x,Math.max(a.x+a.w,b.x+b.w)-x+24),y=Math.max(a.y,b.y)+(Math.abs(a.y-b.y)>160?185:136);
  if(y<520)room.platforms.push(ledge(x,y,w,{catch:true,route:'recovery'}));
 }
}
function tailGalleries(room,from,width,tier,variant){
 const count=Math.max(1,Math.floor((width-from)/370)),points=[];
 for(let n=0;n<count;n++){
  // Each chamber chooses a different terrace cadence. Shelf rises stay below
  // a single ordinary jump; wide falls land on the connected lower tunnel.
  const x=from+n*370+35,y=[405,300,405,190,300,405][(n+variant)%6];
  points.push(ledge(x,y,230+(n+variant)%3*30,{route:'annex',identity:room.id+':annex:'+n}));
  if(y<400)points.push(ledge(x-80,y+115,190,{catch:true,route:'recovery'}));
 }
 room.platforms.push(...points.filter(s=>s.x+s.w<width-50));
}
function placeEcology(room,tier,suffix,oldWidth){
 if(room.biome==='sanctuary')return;
 const pool=SPECIES[room.biome];if(!pool)return;
 const offset=['path','descent','nexus','ascent','vault','heart'].indexOf(suffix),bossRoom=suffix==='heart'||room.chronicle;
 // Keep enemy keys stable across existing saves. Existing species become a
 // biome-appropriate ecology; extra encounter groups append new keys only.
 if(!room.chronicle)for(const [n,e]of room.enemies.entries())if(!e.boss&&['glassmarauder','graveburrower','veilwasp','chaincaster'].includes(e.kind))e.kind=pool[(n+Math.max(0,offset))%pool.length];
 if(bossRoom)return;
 const added=Math.max(1,Math.floor((room.width-oldWidth)/540)),pocketY=520;
 for(let n=0;n<added;n++){
  const x=oldWidth-70+n*(room.width-oldWidth-240)/Math.max(1,added-1),kind=pool[(n+Math.max(0,offset))%pool.length];
  // Avoid placing a surprise enemy directly on a story item or travel door.
  if(room.objects.some(o=>Math.abs(o.x-x)<100&&(o.y??520)===pocketY))continue;
  room.enemies.push({kind,x:Math.min(room.width-280,x),y:pocketY,left:Math.max(60,x-150),right:Math.min(room.width-100,x+150),elite:tier>=4&&n%3===2});
 }
 // The late gates contain more encounters as well as longer passages. Fill
 // distinct open pockets instead of stacking enemies beside the same door.
 const target=(suffix==='path'?6:5)+tier;
 for(let attempt=0;room.enemies.filter(e=>!e.boss).length<target&&attempt<30;attempt++){
  const x=650+((attempt*467+Math.max(0,offset)*149)%(room.width-1000));
  if(room.objects.some(o=>Math.abs(o.x-x)<105&&(o.y??520)===520)||room.enemies.some(e=>Math.abs(e.x-x)<(e.boss?480:170)))continue;
  room.enemies.push({kind:pool[(attempt+Math.max(0,offset))%pool.length],x,y:520,left:x-130,right:x+130});
 }
}

/** Apply once while registering authored rooms. Runtime/save state is separate. */
export function applyRoomIdentity(room){
 const design=ROOM_IDENTITIES[room?.id];if(!design||room.layout)return;
 const tier=Math.max(0,GATES.indexOf(room.biome)),suffix=room.id.slice(room.biome.length+1),oldWidth=room.width;
 let width=WIDTH[suffix]?.[tier]||oldWidth;
 if(room.id==='hidden-grove')width=2050;if(room.id==='star-observatory')width=2950;
 if(room.id==='clockwork-ossuary')width=4050;if(room.id==='paper-moon')width=4650;if(room.id==='cradle-zero')width=5850;
 room.width=width;
 const original=room.platforms;
 // Keep the established first-gate learning routes and shrine approaches.
 const preserve=room.biome==='moss'&&room.climbNetwork||['sanctuary','hidden-grove','star-observatory'].includes(room.id);
 room.platforms=[{x:0,y:520,w:width,h:260},...original.filter(s=>s.y!==520&&(preserve||s.solid||s.veil))];
 if(!preserve){
  const points=design.points.map(([x,y,w],n)=>ledge(x,y,w,{identity:room.id+':gallery:'+n,...(room.biome==='storm'&&n%3===1?{moving:true,origin:x,amplitude:28+tier*3,rate:.015+n*.001}:{})}));
  room.platforms.push(...points);safeCatchTerraces(room,points);
  if(['descent','ascent'].includes(suffix))room.climbNetwork={title:design.name,routes:[{id:'east',name:design.name,waypoints:points.map(s=>({x:s.x+Math.min(65,s.w/2),y:s.y}))}],drops:[]};
 }
 tailGalleries(room,Math.max(1850,oldWidth-220),width,tier,Math.max(0,Object.keys(ROOM_IDENTITIES).indexOf(room.id)));
 for(const o of room.objects){
  if((o.y??520)<520)upperSurface(room,o.x,o.y,Math.min(310,Math.max(210,room.id.endsWith('-ascent')?250:210)));
  // Forward doors extend the actual journey, not just the camera bounds.
  if((o.y??520)===520&&o.kind==='door'&&((o.id==='exit')||(o.id==='depth-loop')||(o.id==='court-loop')||(o.id==='home'))&&o.x>oldWidth*.6)o.x=width-(o.id==='court-loop'?130:140);
  if(o.id==='reaver-cache')o.x=width-250;
 }
 for(const e of room.enemies)if((e.y??520)<520){
  const surfaces=room.platforms.filter(s=>!s.solid&&!s.catch&&s.y<520&&e.x>=s.x-30&&e.x<=s.x+s.w+30).sort((a,b)=>Math.abs(a.y-e.y)-Math.abs(b.y-e.y));
  if(surfaces[0]){e.y=surfaces[0].y;e.x=Math.max(surfaces[0].x+25,Math.min(e.x,surfaces[0].x+surfaces[0].w-25));}
  else e.y=520;
 }
 for(const r of room.relics){
  const surfaces=room.platforms.filter(s=>!s.solid&&!s.catch&&s.y<520&&r.x>=s.x-70&&r.x<=s.x+s.w+70).sort((a,b)=>Math.abs(a.y-60-r.y)-Math.abs(b.y-60-r.y));
  if(surfaces[0]){r.y=surfaces[0].y-60;r.x=Math.max(surfaces[0].x+25,Math.min(r.x,surfaces[0].x+surfaces[0].w-25));}
 }
 placeEcology(room,tier,suffix,oldWidth);
 const landmarkX=room.id==='sanctuary'?740:670+(tier%2)*70;
 room.layout={id:room.id,title:design.name,motif:design.motif,form:design.form,tier:tier+1,originalWidth:oldWidth,
  landmarks:[{kind:design.motif,x:landmarkX,y:design.landmarkY,scale:1},{kind:design.motif,x:Math.max(1300,width*.56),y:520,scale:.72},{kind:design.motif,x:width-400,y:520,scale:.56}],
  zones:[{name:'Threshold',from:0,to:850},{name:design.name,from:850,to:Math.max(1450,width*.62)},{name:'The Far Passage',from:Math.max(1450,width*.62),to:width}],
  floorRoute:'connected',navigation:'Every missed optional jump lands on a lower gallery or the tunnel floor.'};
 room.height=Math.max(room.height||660,Math.max(...room.platforms.map(s=>520-s.y))+400);
}
export function applyRoomIdentities(rooms){for(const room of Object.values(rooms))applyRoomIdentity(room);}
