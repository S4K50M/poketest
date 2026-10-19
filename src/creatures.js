const TAU=Math.PI*2;
function poly(c,p,fill,stroke='#111b1d',width=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke()}}
function oval(c,x,y,rx,ry,fill,stroke=null){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function line(c,p,color,width=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
function gradient(c,d){const g=c.createLinearGradient(-70,-230,65,-20);g.addColorStop(0,d.accent);g.addColorStop(.35,d.color);g.addColorStop(1,d.dark);return g}
function halo(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g)}
function eye(c,x,y,color){poly(c,[[x-10,y-5],[x+12,y-8],[x+5,y+3],[x-7,y+3]],'#111a23');line(c,[[x-5,y-1],[x+7,y-3]],color,3)}
function claw(c,x,y,color){for(let i=0;i<3;i++)poly(c,[[x+i*8,y],[x+i*8+2,y+8],[x+i*8+9,y+6]],color,null)}
function cloud(c,x,y,s,color){for(let i=0;i<5;i++)oval(c,x+(i-2)*s*.48,y+Math.sin(i*2)*s*.3,s*.7,s*.6,color)}

// Anatomical rigs follow the supplied design sheet, not a shared humanoid skeleton.
export function drawCreature(c,d,x,y,s=1,face=1,pose={},time=0,options={}){
  c.save();c.translate(x,y);c.scale(s*face,s);
  const a=pose.attack||0,w=pose.walk||0,step=Math.sin(w)*12,bob=Math.sin(time*2.3)*1.5,base=gradient(c,d);
  if(options.shadow!==false)oval(c,0,2,['gator','beetle','griffin','jackal'].includes(d.rig)?100:60,11,'#040c0b99');
  if(options.aura)halo(c,0,-95,130,d.color+'30');
  c.translate(pose.hit?-8:0,bob);if(pose.hit)c.rotate(-.08);
  const stretch=pose.air?1.05:1+Math.sin(w*2)*.025, squash=pose.land||0;
  c.scale((1+squash*.15)/stretch,stretch*(1-squash*.12));
  if(['deer','moth','owl'].includes(d.rig)){
    if(d.rig==='deer'){
      for(const side of [-1,1])for(const back of [0,1]){const xx=side*49+back*14,delta=Math.sin(w+back*3)*14;line(c,[[xx,-92],[xx+delta,-42],[xx+delta-8,-2]],back?d.dark:d.color,12);oval(c,xx+delta-5,-5,12,5,'#e7d9a8');}
      oval(c,-8,-105,77,38,base);poly(c,[[-70,-120],[-15,-150],[65,-121],[38,-83],[-45,-78]],d.dark);
      for(let i=0;i<9;i++){const xx=-68+i*14;poly(c,[[xx,-127],[xx+20,-153],[xx+29,-110],[xx+15,-83]],i%2?'#7eaf83':'#a5ca9a');}
      poly(c,[[37,-127],[49,-201],[81,-216],[111,-187],[101,-147],[75,-117]],base);
      for(const side of [-1,1]){const xx=side<0?52:88;line(c,[[xx,-204],[xx+side*10,-250],[xx+side*38,-275]],'#cfbd91',7);line(c,[[xx+side*12,-251],[xx+side*7,-277]],'#cfbd91',5);oval(c,xx+side*39,-278,18,7,'#efd4a1');halo(c,xx+side*39,-278,23,'#ffe6a733');}
      for(let i=0;i<3;i++)oval(c,78+i*9,-177+i*5,3,4,'#fce8a9');poly(c,[[44,-187],[17,-211],[20,-180],[46,-165]],'#bdd6a7');
    }else{
      const owl=d.rig==='owl';
      for(const side of [-1,1])for(let layer=0;layer<(owl?3:2);layer++){
        c.save();c.translate(side*15,-135);c.rotate(side*(Math.sin(time*7+layer)*.16+layer*.25));
        const xx=side*(120-layer*20),yy=-110+layer*75;
        poly(c,[[0,0],[xx*.45,yy-75],[xx,yy-35],[xx*1.22,yy+30],[xx*.7,yy+110],[0,30]],layer%2?d.dark:base);
        if(owl)for(let j=0;j<5;j++)line(c,[[side*20,-5],[xx*(.6+j*.1),yy+40+j*12]],'#e4e7ed66',3);
        else{oval(c,xx*.7,yy+5,25,35,'#fce3b780','#fce9c8');oval(c,xx*.7,yy+5,10,17,d.dark);}
        c.restore();
      }
      oval(c,0,-110,owl?43:25,70,base);for(let i=0;i<5;i++)line(c,[[-24,-134+i*20],[0,-122+i*20],[24,-134+i*20]],d.dark,4);
      oval(c,0,-189,owl?53:29,owl?49:34,base);for(const side of [-1,1]){oval(c,side*22,-192,20,25,d.dark);oval(c,side*22,-191,8,12,d.accent);line(c,[[side*18,-220],[side*43,-251]],d.color,5);}
      poly(c,[[-10,-180],[0,-162],[11,-180]],'#e8c99a');
      if(owl){poly(c,[[-18,-241],[-13,-266],[13,-266],[18,-241],[8,-230],[-8,-230]],'#f4dda8');line(c,[[-10,-260],[9,-240],[-9,-240],[10,-260]],d.dark,2);}
      else{halo(c,0,-119,40,'#ffe3a649');oval(c,0,-119,12,21,'#fff0bf');}
      for(const side of [-1,1])line(c,[[side*15,-47],[side*24,-10],[side*40,-7]],d.dark,7);
    }
  }else if(d.rig==='gator'){
    // Long, low body; four weight-bearing legs; natural obsidian back plates.
    c.save();if(pose.heavy)c.rotate(-a*.7);
    poly(c,[[-66,-91],[-125,-70],[-170,-80],[-181,-111],[-176,-49],[-145,-40],[-77,-51]],d.dark);
    halo(c,-167,-79,36,'#fb933139');poly(c,[[-177,-102],[-197,-92],[-197,-64],[-171,-49],[-149,-66],[-152,-91]],'#343937');
    line(c,[[-189,-89],[-176,-77],[-182,-65],[-165,-58]],'#ffab43',4);c.restore();
    for(const back of [true,false])for(const side of [-1,1]){
      const xx=side*55+(back?-12:12),delta=step*side*(back?-1:1);
      poly(c,[[xx-21,-72],[xx+13,-67],[xx+27+delta,-33],[xx+23+delta,-7],[xx-15+delta,-5],[xx-28,-31]],back?d.dark:base);
      poly(c,[[xx-17+delta,-22],[xx+22+delta,-21],[xx+38+delta,-3],[xx-21+delta,-2]],'#293934');claw(c,xx+10+delta,-7,'#cfcbad');
    }
    oval(c,-8,-91,89,50,base,'#162326');poly(c,[[-90,-100],[-62,-142],[26,-148],[76,-117],[52,-78],[-59,-66]],'#303b39');
    for(let i=0;i<6;i++){const xx=-76+i*24;poly(c,[[xx,-117],[xx+9,-163-(i%2)*14],[xx+30,-130],[xx+24,-106]],i%2?'#3b4844':'#222e30');line(c,[[xx+6,-122],[xx+14,-111],[xx+22,-120]],'#f18b3c',2)}
    for(let i=0;i<4;i++)line(c,[[-55+i*31,-98],[-43+i*28,-87],[-49+i*28,-68]],'#ffae47',3);
    c.save();c.translate(a*19,-a*8);
    poly(c,[[42,-125],[75,-153],[111,-143],[125,-127],[165,-119],[174,-100],[154,-83],[97,-80],[64,-71],[43,-91]],base);
    poly(c,[[99,-110],[166,-111],[168,-98],[151,-88],[103,-89]],'#c6ac74');line(c,[[104,-102],[162,-101]],'#3f392b',3);
    for(let i=0;i<6;i++)poly(c,[[109+i*8,-102],[112+i*8,-94],[117+i*8,-102]],'#fff1c5',null);
    poly(c,[[64,-137],[67,-165],[83,-146],[102,-158],[112,-140]],'#283333');eye(c,94,-128,'#ffeb86');oval(c,160,-117,3,2,'#142528');
    halo(c,165,-110,29,'#ff90372a');line(c,[[65,-130],[73,-116],[63,-105]],'#ff9a42',3);c.restore();
  }else if(d.rig==='jackal'||d.rig==='griffin'){
    const bird=d.rig==='griffin';
    if(!bird){halo(c,-123,-116,70,'#ba70e831');c.beginPath();c.moveTo(-56,-89);c.bezierCurveTo(-190,-30,-108,-198,-210,-151);c.bezierCurveTo(-169,-195,-116,-183,-107,-130);c.bezierCurveTo(-98,-102,-81,-104,-60,-115);c.fillStyle='#734988';c.fill();poly(c,[[-142,-116],[-179,-135],[-166,-172],[-195,-168],[-160,-202],[-129,-160]],'#ba7bde80',null);}
    else{
      for(const side of [-1,1]){c.save();c.translate(side<0?-25:20,-108);c.rotate((side<0?-.2:.05)+Math.sin(time*4)*.045);for(let i=0;i<7;i++){const xx=-65-i*16;poly(c,[[0,0],[xx,-130+i*6],[xx-30,-79+i*10],[-41,25]],i%2?'#b7e8da':'#ddf4eb');}cloud(c,-55,-65,18,'#edf9f1');c.restore();}
      poly(c,[[-67,-89],[-127,-67],[-146,-84],[-135,-48],[-83,-48]],d.dark);cloud(c,-138,-67,14,'#dff8eb');
    }
    for(const back of [true,false])for(const side of [-1,1]){const xx=side*49+(back?-9:7),delta=step*side*(back?-1:1);poly(c,[[xx-13,-89],[xx+14,-82],[xx+16+delta,-44],[xx+delta,-18],[xx+23+delta,-6],[xx-9+delta,-2],[xx-20,-37]],back?d.dark:base);claw(c,xx+3+delta,-8,bird?'#d7d6b0':'#ddc9ec');}
    oval(c,-2,-109,76,37,base,'#15242c');poly(c,[[-63,-119],[-30,-144],[35,-135],[57,-101],[20,-85],[-47,-87]],bird?'#ccece5':d.dark);
    if(bird){cloud(c,51,-137,24,'#e9faf1');poly(c,[[48,-152],[57,-184],[82,-199],[105,-178],[103,-143],[80,-124]],'#e8f4eb');poly(c,[[98,-165],[141,-152],[104,-139],[88,-147]],'#ccbd8b');eye(c,96,-174,'#88d2c3');cloud(c,66,-194,16,'#caeae2');}
    else{poly(c,[[42,-135],[51,-183],[69,-163],[91,-173],[111,-199],[109,-143],[147,-128],[110,-107],[72,-112]],base);poly(c,[[56,-174],[61,-149],[70,-159]],'#d6a5ef');poly(c,[[101,-181],[94,-156],[105,-153]],'#c291e0');eye(c,94,-144,'#f0b9ff');poly(c,[[114,-137],[147,-128],[115,-119],[97,-126]],d.dark);line(c,[[54,-135],[67,-124],[58,-114]],'#d9abe7',2);}
    if(a>0){line(c,[[105,-113],[135+a*30,-119]],d.accent,3);}
  }else if(d.rig==='beetle'){
    for(const back of [true,false])for(let i=0;i<3;i++){const xx=-62+i*54,delta=step*(i%2?1:-1)*(back?-1:1);line(c,[[xx,-75],[xx-27+delta,-34],[xx+delta,-5]],back?'#344235':'#73835b',16);poly(c,[[xx-16+delta,-15],[xx+12+delta,-15],[xx+27+delta,-1],[xx-21+delta,-1]],d.dark);}
    oval(c,-12,-91,109,60,d.dark,'#142321');poly(c,[[-120,-99],[-95,-151],[-40,-174],[-9,-154],[-12,-83],[-77,-64]],base);poly(c,[[-7,-155],[45,-151],[82,-111],[65,-72],[-8,-84]],'#506344');line(c,[[-9,-157],[-9,-85]],'#203b2b',5);
    for(let i=0;i<4;i++)poly(c,[[-100+i*33,-124],[-116+i*34,-168],[ -82+i*33,-144]],'#7c9062');
    poly(c,[[60,-115],[98,-133],[128,-116],[135,-81],[110,-59],[68,-67]],base);eye(c,119,-103,'#ecffb4');
    poly(c,[[109,-129],[123,-178],[145,-204],[165,-200],[153,-180],[141,-170],[139,-126]],'#9aab79');
    for(let i=0;i<4;i++)line(c,[[120+i*7,-143-i*13],[137+i*5,-137-i*13]],'#4a5f40',3);
    poly(c,[[-47,-124],[-26,-142],[-5,-125],[-19,-101]],'#9ed791');line(c,[[-39,-124],[-24,-112],[-15,-128]],'#e3ffc0',2);
  }else if(d.rig==='mantis'){
    c.translate(0,-17-Math.sin(time*7)*4);
    for(const side of [-1,1]){c.save();c.translate(-17,-161);c.rotate(side*.25+Math.sin(time*32)*.10);oval(c,-50,-30,66,25,'#dbf5ba33','#c9efab55');line(c,[[-3,0],[-98,-47]],'#d4e8ae66',1);line(c,[[-3,0],[-106,-19]],'#c9efab55',1);c.restore();}
    poly(c,[[-17,-137],[-35,-92],[-22,-58],[8,-39],[25,-69],[16,-123]],'#d5da60');for(let i=0;i<3;i++)poly(c,[[-27+i*5,-112+i*19],[20-i*2,-103+i*18],[20-i*2,-93+i*18],[-31+i*8,-99+i*18]],'#303733');
    for(const side of [-1,1]){line(c,[[side*12,-66],[side*32,-31],[side*21,-9]],'#b2c260',7);line(c,[[side*24,-131],[side*49,-99],[side*65,-129]],'#9faf56',10);const xx=side*51+a*40;poly(c,[[xx,-133],[xx+21,-147],[xx+60,-207],[xx+56,-163],[xx+17,-113]],'#f4ffb1cc','#d1f26d');halo(c,xx+35,-154,25,'#e4ff7739');}
    poly(c,[[-31,-181],[-20,-214],[9,-224],[35,-199],[27,-173],[0,-159]],base);poly(c,[[-28,-190],[-7,-195],[-10,-178],[-28,-181]],'#26342b');poly(c,[[11,-198],[32,-197],[26,-179],[12,-181]],'#28372c');eye(c,21,-188,'#ffffbe');line(c,[[-14,-213],[-35,-244],[-28,-260]],'#e9f6a5',3);line(c,[[11,-218],[30,-246],[48,-254]],'#e9f6a5',3);halo(c,47,-255,12,'#e8ff7b66');
  }else{
    // Bipedal yeti, natural nose-lance shark, and chrome/crimson dragon.
    const yeti=d.rig==='yeti',shark=d.rig==='shark',wide=yeti?51:33;
    if(!yeti&&!shark){for(const side of [-1,1]){c.save();c.scale(side,1);poly(c,[[side<0?-5:15,-158],[-103,-251],[-92,-164],[-125,-128],[-70,-138],[-33,-96]],'#646e7a');poly(c,[[-20,-164],[-85,-228],[-67,-164],[-96,-140],[-46,-134]],'#a84653');line(c,[[-19,-164],[-85,-228],[-67,-164],[-97,-140]],'#c6d6d8',3);c.restore();}poly(c,[[-24,-86],[-85,-42],[-122,-61],[-93,-23],[-20,-50]],d.dark);for(let i=0;i<4;i++)poly(c,[[-48-i*17,-60-i*1],[-60-i*17,-85],[-65-i*17,-56]],'#a84f59');}
    if(shark)poly(c,[[-32,-171],[-80,-205],[-65,-150],[-88,-124],[-38,-120]],d.dark);
    if(yeti){for(let i=0;i<6;i++)poly(c,[[-76+i*29,-162],[-77+i*29,-217-(i%2)*19],[-46+i*29,-187]],i%2?'#a7e7ef':'#d1f7f6');}
    for(const side of [-1,1]){const xx=side*wide,delta=side*step;poly(c,[[xx-22,-93],[xx+23,-87],[xx+28+delta,-49],[xx+22+delta,-7],[xx-23+delta,-6],[xx-26,-45]],base);poly(c,[[xx-24+delta,-25],[xx+17+delta,-24],[xx+38+delta,-5],[xx-28+delta,0]],d.dark);claw(c,xx+6+delta,-9,yeti?'#eaf3e4':'#cddcdb');}
    poly(c,[[-wide-21,-179],[-17,-201],[wide+17,-179],[wide+12,-125],[28,-80],[-34,-81],[-wide-22,-128]],base);
    if(yeti){poly(c,[[-56,-175],[-40,-157],[-23,-179],[0,-156],[22,-177],[40,-160],[57,-177],[31,-123],[13,-132],[-5,-113],[-23,-132],[-40,-126]],'#e7f1e8');}
    else if(shark){for(let i=0;i<4;i++)poly(c,[[-37,-166+i*18],[0,-152+i*15],[38,-166+i*18],[26,-145+i*15],[0,-132+i*15],[-26,-144+i*15]],i%2?'#6495b2':'#b9d8df');}
    else{poly(c,[[-39,-175],[0,-193],[38,-174],[26,-139],[0,-123],[-27,-143]],'#973d4e');poly(c,[[0,-172],[13,-155],[0,-138],[-13,-155]],'#f2a99b');for(let i=0;i<3;i++)line(c,[[-29,-121+i*11],[0,-114+i*11],[27,-121+i*11]],'#c2ccca',3);}
    for(const back of [true,false]){
      const xx=back?-wide-21:wide+16,extension=back?0:a*55;
      poly(c,[[xx-14,-177],[xx+17,-172],[xx+29+extension,-128],[xx+17+extension,-94],[xx-9+extension,-104],[xx-20,-137]],back?d.dark:base);
      if(yeti){poly(c,[[xx-19,-150],[xx-11,-188],[xx+23,-166],[xx+40+extension,-128],[xx+21+extension,-89],[xx-13+extension,-99]],back?'#5a8d9c':'#b7ecf0');for(let i=0;i<3;i++)poly(c,[[xx-6+i*15,-143],[xx+2+i*15,-174],[xx+14+i*15,-141]],'#ddffff');}
      else if(shark){poly(c,[[xx+4,-144],[xx+44+extension,-163],[xx+24+extension,-122],[xx+12+extension,-103]],'#86b9ce');}
      else{oval(c,xx,-171,23,25,'#8c4b57','#c0ccd1');for(let i=0;i<3;i++)line(c,[[xx-9+i*8,-179],[xx-12+i*8,-163]],'#26323b',3);claw(c,xx+11+extension,-114,'#dee5df');}
    }
    if(yeti){poly(c,[[-35,-222],[-18,-251],[19,-250],[40,-222],[26,-192],[-20,-194]],'#e5f5ed');poly(c,[[-29,-223],[-10,-233],[16,-231],[33,-218],[17,-201],[-16,-203]],'#486976');eye(c,15,-219,'#b5ffff');line(c,[[-20,-248],[-41,-258],[-51,-242],[-41,-231],[-32,-235]],'#76bfd5',11);line(c,[[21,-248],[41,-259],[53,-243],[44,-231],[34,-235]],'#76bfd5',11);}
    else if(shark){poly(c,[[-29,-225],[-5,-251],[26,-238],[37,-208],[21,-188],[-15,-196]],base);poly(c,[[-61,-241],[-42,-256],[-16,-241],[19,-242],[49,-256],[71,-242],[60,-223],[27,-228],[-4,-218],[-44,-224]],base);line(c,[[-47,-238],[-33,-239]],'#e5fffb',3);line(c,[[49,-238],[62,-239]],'#e5fffb',3);poly(c,[[21,-218],[144,-240],[31,-204]],'#d0e6e8','#42657b');for(let i=0;i<6;i++)line(c,[[38+i*14,-217-i*2],[43+i*14,-211-i*3]],'#668f9e',2);poly(c,[[-5,-245],[-18,-278],[20,-248]],'#397297');}
    else{poly(c,[[-30,-222],[-21,-253],[11,-263],[36,-240],[40,-211],[19,-191],[-14,-197]],base);poly(c,[[-25,-245],[-44,-274],[-38,-229]],'#bc5660');poly(c,[[19,-252],[40,-274],[38,-234]],'#a84452');poly(c,[[-25,-228],[0,-236],[31,-225],[47,-212],[34,-198],[4,-198],[-19,-207]],d.dark);eye(c,22,-221,'#ffb5a0');poly(c,[[-7,-257],[-13,-281],[8,-267],[15,-282],[25,-255]],'#b34d58');}
  }
  if(pose.hit)halo(c,15,-100,85,'#fff7bf33');
  c.restore();
}

export function drawMinion(c,e,time=0){
  c.save();c.translate(e.x,e.y);c.scale(e.face||1,1);if(e.flash)c.globalAlpha=.6;
  const walk=Math.sin(time*10+e.id)*3;
  if(e.kind==='sinder'){
    line(c,[[-8,-11],[-28,-5],[-34,-20]],'#d57843',7);halo(c,-34,-25,16,'#f8ac4c55');poly(c,[[-41,-17],[-35,-38],[-25,-21]],'#ffbc5b',null);
    oval(c,0,-17,13,16,'#dd8a4a','#563e30');for(const side of [-1,1])line(c,[[side*5,-8],[side*11+walk,0]],'#c27644',5);
    poly(c,[[-5,-27],[-2,-41],[13,-43],[24,-31],[17,-20],[3,-21]],'#edac64');eye(c,14,-34,'#fff2ba');
  }else if(e.kind==='voltlet'){
    for(let i=0;i<4;i++)oval(c,-20+i*11,-10-Math.sin(i+time*7)*2,9,12,i%2?'#5c6042':'#d6d66f','#444d35');
    line(c,[[15,-20],[19,-33],[27,-36]],'#e6ee9b',2);line(c,[[9,-20],[3,-34]],'#e7ed95',2);halo(c,25,-34,12,'#f6ff9a44');eye(c,19,-16,'#ffffd5');
  }else if(e.kind==='pebbleback'){
    for(const side of [-1,1])for(let i=0;i<2;i++)oval(c,side*14+(i?5:-5),e.flipped?-26:0,6,5,'#9a9e78');
    c.save();if(e.flipped){c.translate(0,-22);c.rotate(Math.PI)}poly(c,[[-26,-7],[-22,-24],[-7,-38],[13,-34],[26,-18],[25,-5]],'#727e63','#b4bea0');poly(c,[[-20,-22],[-3,-34],[6,-18],[-7,-9]],'#8f9a76');poly(c,[[8,-30],[19,-20],[23,-8],[8,-13]],'#536552');c.restore();oval(c,29,-10,10,8,'#acb38d');oval(c,33,-13,2,2,'#182c25');
  }else if(e.kind==='dewdrop'){
    c.globalAlpha*=.85;halo(c,0,-15,36,'#8ad9ef22');poly(c,[[-7,-9],[-37,-19],[-27,-4],[-12,3]],'#8bcdd499','#cbfaff');oval(c,4,-18,21,19,'#72bdd080','#bcf5ed');oval(c,9,-24,6,7,'#e2ffff');oval(c,11,-23,3,4,'#25566a');oval(c,-3,-27,4,5,'#eaffff');oval(c,-2,-26,2,3,'#25566a');poly(c,[[8,-37],[14,-47],[21,-31]],'#b5edec99',null);
  }else if(e.kind==='sproutlet'){
    if(e.state==='burrow'){oval(c,0,0,24,5,'#6b7150');for(let i=0;i<3;i++)pathLeaf(c,-15+i*14,-3,'#56714a');}
    else{for(const side of [-1,1])line(c,[[side*5,-5],[side*15,2]],'#68794b',3);oval(c,0,-16,17,19,'#93ac64','#3c573a');for(const side of [-1,1])poly(c,[[side*9,-21],[side*34,-35],[side*28,-13],[side*13,-8]],'#739d58','#b1c482');pathLeaf(c,-3,-34,'#b1cf80');pathLeaf(c,9,-32,'#7fa360');eye(c,4,-21,'#d8aeea');}
  }
  c.restore();
}
function pathLeaf(c,x,y,color){poly(c,[[x,y],[x-12,y-19],[x+3,y-15],[x+12,y-25],[x+14,y-8]],color,'#4b6741',1)}
