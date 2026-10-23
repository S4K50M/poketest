// Every guardian gains two authored techniques. The summoned armament is a
// presentation of the attack, while every damaging part uses warned geometry.
const zone=(at,shape,x,y,w,h,extra={})=>({at,type:'zone',shape,x,y,w,h,delay:24,life:14,damage:1.7,...extra});
const shot=(at,c,extra={})=>({at,type:'shots',x:c.x,y:c.floor-110,count:3,spread:1,speed:7,kind:'blade',damage:1.2,...extra});
const dash=(at,c,x,height=0)=>({at,type:'dash',to:c.clampX(x),height,duration:28,damage:1.8,knockback:2});
const arm=(c,kind,name,duration=110)=>({at:0,type:'armament',kind,name,duration});
const ward=(name)=>({at:0,type:'shield',name,duration:160,charges:3});
const move=(id,name,kind,counter,hint,tell,active,recover,build)=>({id,name,kind,counter,hint,tell,active,recover,build});
const blade=(at,c,x,w=190,extra={})=>zone(at,'slash',c.clampX(x),c.floor-65,w,130,extra);
const pillar=(at,c,x,w=65,extra={})=>zone(at,'pillar',c.clampX(x),c.floor-130,w,260,extra);
const floor=(at,c,x,w=170,extra={})=>zone(at,'floor',c.clampX(x),c.floor-16,w,32,extra);
const ledge=(c,x,style)=>({at:0,type:'platform',x:c.clampX(x),y:c.floor-105,w:145,life:320,style});

export const OVERDRIVE_MOVES={
 briar:[
  move('briar-thorn-crown','Crown of the First Thorn','thorn-sword','behind','Her crown becomes a thorn sword. Cross behind the two committed cuts.',46,96,42,c=>[arm(c,'thorn','First Thorn'),ward('BARK CARAPACE'),blade(12,c,c.x+c.face*125,240,{status:{root:8}}),blade(53,c,c.x+c.face*210,165,{delay:20}),floor(66,c,c.x-c.face*170,100,{delay:28})]),
  move('briar-seedstorm','Seedstorm Rebellion','seed-rain','dodge','Seed pods mark three separate patches; keep moving, then cut down the sapling.',40,120,42,c=>[arm(c,'seed','Rebel Seed'),...[-1,0,1].map((s,i)=>pillar(i*25,c,c.tx+s*130,55,{delay:28,label:'GERMINATION'})),{at:70,type:'summon',kind:'thornling',count:1,x:c.clampX(c.x-c.face*140)}]),
 ],
 bell:[
  move('bell-cathedral-anvil','Cathedral Anvil','anvil-hammer','jump','The saint forges an anvil overhead. Jump the floor quake after its fall.',52,104,45,c=>[arm(c,'hammer','Cathedral Anvil'),ward('TEMPERED BRONZE'),pillar(0,c,c.tx,90,{delay:34,damage:2.3,knockback:2.8}),floor(43,c,c.center,c.right-c.left-150,{delay:26,life:12,damage:2,label:'ANVIL AFTERSHOCK'})]),
  move('bell-ash-pilgrimage','Ash Pilgrimage','cinder-charge','dodge','Two furnace lunges leave burning stations. Dash across the second path.',40,112,43,c=>[arm(c,'censer','Ash Pilgrim'),dash(0,c,c.tx+c.face*140,40),floor(28,c,c.tx,150,{delay:25,life:35,status:{burn:60}}),dash(70,c,c.x,55),shot(82,c,{count:4,spread:1.4,gravity:.11,kind:'orb'})]),
 ],
 leviathan:[
  move('leviathan-drowned-trident','Trident of the Unread','hydro-spear','behind','A hydro trident unfolds from the archive. Cross behind its three thrusts.',47,118,43,c=>[arm(c,'trident','The Unread Trident'),ward('INK ARMOR'),...[0,1,2].map(i=>blade(i*28,c,c.x+c.face*(100+i*50),170,{delay:20,h:80,y:c.floor-75-i*15,status:{slick:65}}))]),
  move('leviathan-inverted-rain','Inverted Rain','tidal-pillar-rain','dodge','The tide climbs upward in separate columns. Stay between the ink fountains.',44,126,46,c=>[arm(c,'tide','Inverted Tide'),...[-2,-1,0,1,2].map((s,i)=>pillar((i%2)*36,c,c.center+s*155,60,{delay:32,status:{slick:80}})),shot(80,c,{y:c.floor-235,angle:Math.PI/2,count:5,spread:1.5,kind:'droplet'})]),
 ],
 conductor:[
  move('conductor-lightning-rapier','Lightning Rapier','sky-sword','behind','The rapier tracks during its lift, then commits to a low crossing thrust.',36,108,35,c=>[arm(c,'rapier','Lightning Rapier'),ward('STORMGLASS WINGS'),dash(6,c,c.tx+c.face*190,60),blade(34,c,c.tx+c.face*160,260,{delay:18}),shot(72,c,{angle:c.face>0?0:Math.PI,count:3,spread:.6,kind:'needle'})]),
  move('conductor-silent-cadenza','The Silent Cadenza','dive-thunderfall','dodge','A silent high flight precedes three thunderfalls. Leave each violet mark.',42,138,39,c=>[arm(c,'baton','Silent Cadenza'),dash(0,c,c.tx-c.face*130,260),...[0,1,2].map(i=>pillar(30+i*28,c,c.tx+(i-1)*145,64,{delay:24,damage:2,label:'THUNDERFALL'}))]),
 ],
 hourglass:[
  move('hourglass-minute-scythe','Minute Scythe','clock-scythe','jump','The clock assembles a scythe. Jump the low outward sweep, then land.',48,122,40,c=>[arm(c,'scythe','Minute Scythe'),ward('FROZEN INSTANT'),floor(4,c,c.center,c.right-c.left-100,{delay:36,damage:2,status:{slow:90}}),zone(63,'beam',c.center,c.floor-170,c.right-c.left,40,{delay:24,label:'HIGH RETURN · LAND'})]),
  move('hourglass-three-futures','Three Futures','rewind-phantom','dodge','Three past positions burst in order. The stag returns to its starting point.',43,125,42,c=>[arm(c,'clock','Three Futures'),...[0,1,2].map(i=>pillar(i*27,c,c.tx+(i-1)*160,75,{delay:26,status:{slow:80}})),dash(12,c,c.tx+c.face*200,100),{at:99,type:'warp',x:c.x,y:c.floor}]),
 ],
 crown:[
  move('crown-seven-oathblades','Seven Oathblades','summoned-sword-rain','dodge','Seven oathblades fall outside a shifting safe lane. Read each seal.',56,150,44,c=>[arm(c,'greatsword','Seven Oathblades',150),ward('THE LAST CROWN'),...[-3,-2,-1,0,1,2,3].map((s,i)=>pillar(i%3*24,c,c.center+s*115,42,{delay:32,damage:2,label:'OATHBLADE'}))]),
  move('crown-uncrowned-march','The Uncrowned March','throne-sword-charge','behind','The ruler brings its sword through two marching cleaves. Cross behind.',45,125,43,c=>[arm(c,'greatsword','Uncrowned March'),dash(0,c,c.tx-c.face*80,20),blade(26,c,c.tx+c.face*140,300,{delay:24,damage:2.8,knockback:3}),dash(75,c,c.x,45),blade(95,c,c.x-c.face*120,220,{delay:20})]),
 ],
 belltwin:[
  move('belltwin-solar-scissors','Solar Scissors','paired-sunblades','jump','Two sun blades close across the floor, followed by a high crossing.',52,144,45,c=>[arm(c,'twins','Solar Scissors'),ward('TWO DAWNS'),floor(0,c,c.tx-140,260,{delay:30}),floor(33,c,c.tx+140,260,{delay:30}),zone(85,'beam',c.center,c.floor-180,660,44,{delay:28,label:'DAWN CROSSING · LAND'})]),
  move('belltwin-evening-garden','Evening Garden','sunseed-garden','dodge','Four sunseeds open from outside inward. The final seed remembers you.',49,140,48,c=>[arm(c,'seed','Evening Garden'),...[-2,2,-1,1].map((s,i)=>zone(i*24,'mine',c.center+s*130,c.floor-25,80,50,{delay:30,status:{burn:60}})),pillar(104,c,c.tx,60,{delay:24})]),
 ],
 palimpsest:[
  move('palimpsest-quill-of-names','Quill of Lost Names','quill-spear','behind','A giant quill writes three cuts in front of the spine. Cross its binding.',49,130,45,c=>[arm(c,'quill','Quill of Lost Names'),ward('UNBROKEN BINDING'),...[0,1,2].map(i=>blade(i*32,c,c.x+c.face*(105+i*55),190,{delay:24,label:'NAME RESTORED'}))]),
  move('palimpsest-paper-causeway','Paper Causeway','paper-terrain-rain','platform','Read the paper shelves while ink floods the floor and commas fall above.',60,155,46,c=>[arm(c,'book','Paper Causeway'),ledge(c,c.tx-130,'memory'),ledge(c,c.tx+150,'memory'),floor(20,c,c.center,c.right-c.left,{delay:55,life:28,damage:2.3,unblockable:true}),shot(95,c,{y:c.floor-260,angle:Math.PI/2,count:5,spread:1.5})]),
 ],
 nullheart:[
  move('nullheart-unwritten-saber','The Unwritten Saber','cradle-sword','behind','The cradle forges a blade from an unwritten future. Cross behind its vow.',48,138,43,c=>[arm(c,'greatsword','The Unwritten Saber'),ward('UNWRITTEN FUTURE'),dash(0,c,c.tx-c.face*70,130),blade(29,c,c.tx+c.face*145,320,{delay:26,damage:2.7}),shot(82,c,{count:7,spread:2.7})]),
  move('nullheart-permission-to-begin','Permission to Begin','cradle-starfall','dodge','The empty cradles fall in staggered columns. Their final orbit leaves a safe core.',58,160,50,c=>[arm(c,'cradle','Permission to Begin'),...[-2,-1,0,1,2].map((s,i)=>pillar(i*23,c,c.tx+s*120,54,{delay:32,damage:2})),zone(119,'ring',c.center,c.floor-60,600,120,{inner:95,delay:30,damage:2.5})]),
 ],
 'moss-warden':[
  move('rootwarden-hook-and-bloom','Hook and Bloom','root-hook-axe','behind','The root hook catches the near lane, then blooms behind it.',44,107,42,c=>[arm(c,'axe','Root Hook'),ward('BARK WARRANT'),blade(6,c,c.x+c.face*125,230,{status:{root:12}}),pillar(55,c,c.tx-c.face*130,72,{delay:28})]),
  move('rootwarden-timber-corridor','Timber Corridor','falling-tree-pillars','dodge','The corridor closes from both ends; move through the middle before it sprouts.',48,120,44,c=>[arm(c,'thorn','Timber Corridor'),pillar(0,c,c.left+75,110,{delay:30}),pillar(0,c,c.right-75,110,{delay:30}),floor(60,c,c.tx,180,{delay:28,status:{root:10}})]),
 ],
 'forge-warden':[
  move('bailiff-forge-press','The Forge Press','anvil-hammer-press','dodge','The molten press falls at your old position. Leave its stamped seal.',46,115,42,c=>[arm(c,'hammer','Forge Press'),ward('IRON DEBT'),pillar(0,c,c.tx,130,{delay:36,damage:2.4}),...[0,1].map(i=>floor(52+i*24,c,c.tx+(i?140:-140),120,{delay:24,status:{burn:65}}))]),
  move('bailiff-chain-of-debt','Chain of Debt','chain-pull-slam','retreat','The bailiff reels in the chain before stamping the close floor.',50,120,45,c=>[arm(c,'chain','Chain of Debt'),{at:0,type:'force',x:c.x,y:c.floor-50,radius:390,pull:.55,duration:50},zone(45,'blast',c.x,c.floor-75,270,150,{delay:30,damage:2.5,unblockable:true})]),
 ],
 'reef-warden':[
  move('gaoler-coral-pike','Coral Pike','coral-spear','behind','The coral pike extends in two locked lengths. Cross behind the gaoler.',42,104,42,c=>[arm(c,'trident','Coral Pike'),ward('CORAL CELL'),blade(0,c,c.x+c.face*110,205,{h:70,y:c.floor-70}),blade(52,c,c.x+c.face*230,220,{h:70,y:c.floor-70})]),
  move('gaoler-drowned-cells','Drowned Cells','bubble-cell-mines','dodge','Three drowned cells close around remembered positions. Leave each bubble.',47,122,43,c=>[arm(c,'tide','Drowned Cells'),...[-1,0,1].map((s,i)=>zone(i*32,'mine',c.tx+s*135,c.floor-55,100,110,{delay:30,status:{slick:90}})),shot(92,c,{count:3,spread:1,kind:'droplet'})]),
 ],
 'storm-warden':[
  move('magistrate-sky-writ','Writ of the Sky','verdict-spear','behind','A lightning writ becomes a long spear. Dash behind the final signature.',40,116,39,c=>[arm(c,'spear','Sky Writ'),ward('STORM WARRANT'),blade(0,c,c.x+c.face*145,260,{delay:24}),pillar(62,c,c.tx,60,{delay:26,damage:2})]),
  move('magistrate-three-verdicts','Three Verdicts','triple-lightning-dive','dodge','Three verdict seals strike in a line. Jump across the approaching lane.',42,132,41,c=>[arm(c,'baton','Three Verdicts'),dash(0,c,c.tx-c.face*150,160),...[-1,0,1].map((s,i)=>pillar(20+i*31,c,c.tx+s*170,70,{delay:24}))]),
 ],
 'frost-warden':[
  move('headsman-meridian-edge','Meridian Edge','ice-scythe','jump','The meridian scythe sweeps low, then high. Jump and land to its clock.',45,122,42,c=>[arm(c,'scythe','Meridian Edge'),ward('FROZEN SENTENCE'),floor(0,c,c.center,650,{delay:30,status:{slow:100}}),zone(65,'beam',c.center,c.floor-170,660,40,{delay:26})]),
  move('headsman-pale-procession','Pale Procession','ice-platform-lances','platform','Ice lances claim the floor beyond the new shelf. Take the raised route.',53,143,46,c=>[arm(c,'spear','Pale Procession'),ledge(c,c.tx-80,'ice'),floor(20,c,c.tx,530,{delay:50,damage:2.2}),shot(95,c,{y:c.floor-230,angle:Math.PI/2,count:4,spread:.8,kind:'needle'})]),
 ],
 'rift-warden':[
  move('witness-mirror-saber','Mirror Saber','mirror-sword','behind','The witness unfolds a mirror saber. Cross the body, not its reflection.',43,125,43,c=>[arm(c,'rapier','Mirror Saber'),ward('WITNESS GLASS'),blade(0,c,c.x+c.face*120,240,{delay:26}),{at:57,type:'warp',x:c.clampX(c.tx-c.face*160),y:c.floor},blade(82,c,c.tx,180,{delay:24})]),
  move('witness-unseen-stair','The Unseen Stair','memory-terrain-rupture','platform','A memory stair rises before the lower horizon breaks into three beats.',61,158,48,c=>[arm(c,'clock','Unseen Stair'),ledge(c,c.tx-70,'memory'),...[0,1,2].map(i=>floor(20+i*30,c,c.tx+(i-1)*175,155,{delay:42,damage:2,unblockable:true}))]),
 ],
 'moss-reaver':[
  move('gardener-carrion-scythe','Carrion Scythe','garden-scythe','behind','The gardener grows a scythe from its spine. Cross behind the long harvest.',46,117,43,c=>[arm(c,'scythe','Carrion Harvest'),ward('CARRION SHELL'),blade(5,c,c.x+c.face*180,300,{delay:26,damage:2.3}),floor(67,c,c.tx-c.face*120,130,{status:{root:10}})]),
  move('gardener-bone-orchard','Bone Orchard','bone-spike-garden','dodge','Four bone saplings rise outside inward. Keep the last marked gap clear.',47,132,45,c=>[arm(c,'seed','Bone Orchard'),...[-2,2,-1,1].map((s,i)=>pillar(i*25,c,c.tx+s*125,64,{delay:30,status:{root:8}}))]),
 ],
 'forge-reaver':[
  move('confessor-absolution-flail','Absolution Flail','burning-chain-flail','retreat','The burning flail circles the confessor. Leave the inner confession ring.',50,125,44,c=>[arm(c,'chain','Absolution Flail'),ward('ASHEN VOW'),zone(0,'blast',c.x,c.floor-70,310,140,{delay:36,status:{burn:70}}),shot(65,c,{count:6,spread:2.6,kind:'orb'})]),
  move('confessor-fire-walk','Fire Walk','cinder-leap','dodge','The confessor leaps between three fire stations. Leave the final pyre.',42,128,44,c=>[arm(c,'censer','Fire Walk'),dash(0,c,c.tx-c.face*160,120),floor(33,c,c.tx-c.face*160,180,{life:30,status:{burn:80}}),dash(76,c,c.tx+c.face*160,130),pillar(95,c,c.tx+c.face*160,85,{delay:24})]),
 ],
 'reef-reaver':[
  move('pageeater-rib-trident','Rib Trident','archive-bone-spear','behind','The archive skeleton becomes a trident. Cross behind its long rib thrust.',45,118,42,c=>[arm(c,'trident','Rib Trident'),ward('ARCHIVE RIBS'),blade(0,c,c.x+c.face*170,310,{h:90,y:c.floor-95}),shot(62,c,{count:5,spread:1.8,kind:'droplet'})]),
  move('pageeater-stolen-endings','Stolen Endings','paper-rain-tide','jump','Discarded endings flood the floor while the high pages leave a low gap.',54,145,46,c=>[arm(c,'book','Stolen Endings'),floor(0,c,c.center,c.right-c.left-120,{delay:44,status:{slick:80}}),zone(70,'beam',c.center,c.floor-185,700,46,{delay:26}),shot(109,c,{count:3,spread:.8,kind:'droplet'})]),
 ],
 'storm-reaver':[
  move('bellbreaker-sunder-mace','Sunder Mace','storm-hammer','behind','The broken bell becomes a mace. Its first crush commits to one side.',46,120,42,c=>[arm(c,'hammer','Sunder Mace'),ward('BROKEN PEAL'),blade(0,c,c.x+c.face*135,270,{damage:2.5,knockback:3}),pillar(61,c,c.tx-c.face*160,72,{delay:28})]),
  move('bellbreaker-struck-sky','The Struck Sky','forked-leap-beam','dodge','Two crossing leaps leave narrow sky scars. Leave each landing seal.',41,138,42,c=>[arm(c,'baton','Struck Sky'),dash(0,c,c.tx+c.face*150,230),pillar(34,c,c.tx+c.face*150,66,{delay:24}),dash(79,c,c.x,210),pillar(111,c,c.x,66,{delay:24})]),
 ],
 'frost-reaver':[
  move('mourner-widows-needle','Widow’s Needle','mourning-ice-rapier','behind','A needle forms from the mourner’s tears. Cross behind its narrow grief.',44,120,43,c=>[arm(c,'rapier','Widow’s Needle'),ward('PALE VEIL'),blade(0,c,c.x+c.face*140,260,{h:80,y:c.floor-80,status:{slow:100}}),blade(59,c,c.x+c.face*230,185,{h:75,y:c.floor-55,delay:24})]),
  move('mourner-last-winter','The Last Winter','snow-ring-rain','get-close','Stand beside the mourner inside the frozen wreath, then leave the late tear.',53,140,45,c=>[arm(c,'clock','Last Winter'),zone(0,'ring',c.x,c.floor-55,620,120,{inner:100,delay:42,status:{slow:120}}),pillar(85,c,c.tx,60,{delay:28})]),
 ],
 'rift-reaver':[
  move('butcher-unmade-edge','The Unmade Edge','void-cleaver','behind','A cleaver assembles from erased roads. Cross behind its committed chop.',49,128,44,c=>[arm(c,'greatsword','Unmade Edge'),ward('ERASED ARMOR'),blade(0,c,c.x+c.face*170,340,{delay:28,damage:2.7,knockback:3}),blade(74,c,c.x-c.face*100,190,{delay:24})]),
  move('butcher-roads-not-taken','Roads Not Taken','void-mirror-charge','dodge','The butcher crosses two discarded futures. Escape the remembered endpoints.',47,145,47,c=>[arm(c,'cradle','Roads Not Taken'),dash(0,c,c.tx+c.face*210,80),pillar(33,c,c.tx+c.face*210,68,{delay:26}),{at:73,type:'warp',x:c.clampX(c.tx-c.face*210),y:c.floor},dash(90,c,c.tx,100),floor(119,c,c.tx,220,{delay:24,damage:2.3})]),
 ],
};

export function extendBossProfiles(profiles){
 return Object.fromEntries(Object.entries(profiles).map(([id,profile])=>{
  const additions=OVERDRIVE_MOVES[id];if(!additions)return [id,profile];
  return [id,{...profile,identity:profile.identity+' Its broken oath forges a physical armament and a last-stand assault.',moves:[...profile.moves,...additions],sequences:[
   [...profile.sequences[0],4],
   [4,...profile.sequences[1],5],
   [5,4,...profile.sequences[2]],
   [4,0,5,1,4,2,5,3],
  ]}];
 }));
}
