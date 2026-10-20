export { drawCreature, creatureBounds } from './creature-art.js';
const TAU=Math.PI*2;
function poly(c,p,fill,stroke='#111b1d',width=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke()}}
function oval(c,x,y,rx,ry,fill,stroke=null){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function line(c,p,color,width=2){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
function gradient(c,d){const g=c.createLinearGradient(-70,-230,65,-20);g.addColorStop(0,d.accent);g.addColorStop(.35,d.color);g.addColorStop(1,d.dark);return g}
function halo(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g)}
function eye(c,x,y,color){poly(c,[[x-10,y-5],[x+12,y-8],[x+5,y+3],[x-7,y+3]],'#111a23');line(c,[[x-5,y-1],[x+7,y-3]],color,3)}
function claw(c,x,y,color){for(let i=0;i<3;i++)poly(c,[[x+i*8,y],[x+i*8+2,y+8],[x+i*8+9,y+6]],color,null)}
function cloud(c,x,y,s,color){for(let i=0;i<5;i++)oval(c,x+(i-2)*s*.48,y+Math.sin(i*2)*s*.3,s*.7,s*.6,color)}
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
