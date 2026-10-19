import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatEngine, createFighter } from '../src/engine.js';
import { ROSTER, getMove } from '../src/roster.js';

function battle(a='pyrojaw',b='voltantis',opts={}){const g=new CombatEngine(a,b,{ai:false,random:()=>.3,...opts});g.phase='fighting';g.fighters[0].x=-.55;g.fighters[1].x=.55;return g;}
function frames(g,n){for(let i=0;i<n;i++)g.step();}
function activate(g,side,key,dir='neutral'){assert.equal(g.input(side,key,dir),true);}

test('all eight fighters have complete stats, hurtboxes, five specials, and legal frame data',()=>{
  assert.equal(ROSTER.length,8);assert.equal(new Set(ROSTER.map(f=>f.id)).size,8);
  for(const d of ROSTER){
    assert(d.hp>100&&d.speed>0&&d.dash>d.speed&&d.hurt.radius>0&&d.hurt.height>0&&d.ai);
    assert.equal(Object.keys(d.specials).length,5);
    for(const m of [getMove(d,'jab'),getMove(d,'heavy'),getMove(d,'grab'),...Object.values(d.specials)]){
      for(const key of ['startup','active','recovery','range','damage'])assert(Number.isFinite(m[key]),`${d.id}: ${key}`);
    }
  }
});

test('jab only damages inside active frames, once per move',()=>{
  const g=battle(),[p,e]=g.fighters;activate(g,0,'jab');frames(g,9);assert.equal(e.hp,e.data.hp);
  frames(g,1);assert(e.hp<e.data.hp);const hp=e.hp;frames(g,25);assert.equal(e.hp,hp);assert.equal(p.attack,null);
});
test('Voltantis has the specified 8-frame jab',()=>{const g=battle('voltantis','pyrojaw');activate(g,0,'jab');frames(g,7);assert.equal(g.fighters[1].hp,190);frames(g,1);assert(g.fighters[1].hp<190)});
test('holding back guards, depletes guard gauge, and can be thrown',()=>{
  const g=battle(),[p,e]=g.fighters;e.inputs.back=true;activate(g,0,'jab');frames(g,10);assert.equal(e.hp,e.data.hp);assert(e.guard<100);assert(e.blockstun>0);
  frames(g,30);p.x=-.5;e.x=.5;activate(g,0,'grab');frames(g,12);assert.equal(e.techWindow,12);frames(g,12);assert(e.hp<e.data.hp);
});
test('throw escape works on the twelfth frame; an expired window deals damage',()=>{
  const g=battle(),e=g.fighters[1];activate(g,0,'grab');frames(g,12);assert.equal(e.techWindow,12);frames(g,11);activate(g,1,'grab');frames(g,20);assert.equal(e.hp,e.data.hp);assert(g.events.some(e=>e.type==='tech'));
  const h=battle();activate(h,0,'grab');frames(h,24);assert(h.fighters[1].hp<h.fighters[1].data.hp);
});
test('blocking heavy strikes can shatter guard',()=>{
  const g=battle();const [p,e]=g.fighters;e.inputs.back=true;e.guard=20;activate(g,0,'heavy');frames(g,20);assert(e.stun>=60);assert(g.events.some(e=>e.type==='guardbreak'));
});
test('a sidestep outside attack depth causes a whiff',()=>{const g=battle();g.fighters[1].z=1.3;activate(g,0,'jab');frames(g,30);assert.equal(g.fighters[1].hp,g.fighters[1].data.hp)});
test('confirmed jabs cancel recovery into a multi-hit string',()=>{
  const g=battle();activate(g,0,'jab');frames(g,15);g.input(0,'jab');frames(g,20);assert(g.fighters[0].combo>=2);assert(g.fighters[0].comboDamage>9);
});
test('heavy launch produces air time and juggle hits apply scaling',()=>{
  const g=battle();activate(g,0,'heavy');frames(g,20);const e=g.fighters[1];assert(e.vy>0&&e.y>0);assert.equal(e.juggles,1);
  const hp=e.hp;g.damage(g.fighters[0],e,getMove(g.fighters[0].data,'jab'));assert(hp-e.hp<9);assert.equal(g.fighters[0].combo,2);
});
test('electric resonance adds exactly three hit-stun frames',()=>{
  const g=battle('voltantis','pyrojaw'),[p,e]=g.fighters;const m={...getMove(p.data,'special'),multi:0};g.damage(p,e,m);assert.equal(e.stun,m.stun+3);
});
test('fire chips blocking HP and creates damaging lingering zones',()=>{
  const g=battle(),[p,e]=g.fighters;e.blocking=true;g.damage(p,e,getMove(p.data,'special'));assert(e.hp<e.data.hp);e.blocking=false;g.damage(p,e,getMove(p.data,'special'));assert(g.zones.length>0);
  const hp=e.hp;e.x=g.zones[0].x;e.z=g.zones[0].z;e.y=0;for(let i=0;i<30;i++)g.updateZones();assert(e.hp<hp);
});
test('ice applies Frostbite and reduces dash displacement by 30%',()=>{
  const g=battle('glaciolith','pyrojaw'),[p,e]=g.fighters;g.damage(p,e,getMove(p.data,'special'));assert.equal(e.frost,300);
  const a=battle(),b=battle();a.fighters[0].frost=100;
  for(const match of [a,b]){match.fighters[0].dash=10;match.fighters[0].dashDir=-1;match.step()}
  const slow=-.55-a.fighters[0].x,normal=-.55-b.fighters[0].x;assert(Math.abs(slow/normal-.7)<.00001);
});
test('steel startup armor absorbs exactly one hit without interrupting',()=>{
  const g=battle('pyrojaw','ferrodrake'),[p,e]=g.fighters;activate(g,1,'heavy');g.damage(p,e,getMove(p.data,'jab'));assert(e.attack);assert.equal(e.armor,0);assert.equal(e.stun,0);g.damage(p,e,getMove(p.data,'jab'));assert.equal(e.attack,null);assert(e.stun>0);
});
test('Fortress parries light attacks, Quake waves are unblockable and jumpable',()=>{
  const g=battle('pyrojaw','terrakhan'),[p,e]=g.fighters;g.damage(p,e,getMove(p.data,'jab'));assert.equal(e.hp,e.data.hp);assert(p.stun>0);
  const h=battle('terrakhan','pyrojaw'),[tank,target]=h.fighters;tank.stance='quake';target.inputs.back=true;activate(h,0,'special','down');frames(h,30);assert(target.hp<target.data.hp);
  const jump=battle('terrakhan','pyrojaw');jump.fighters[0].stance='quake';activate(jump,0,'special','down');frames(jump,20);activate(jump,1,'jump');frames(jump,12);assert.equal(jump.fighters[1].hp,190);
});
test('Ferrodrake counter reverses heavy strikes',()=>{const g=battle('pyrojaw','ferrodrake'),[p,e]=g.fighters;activate(g,1,'heavy','back');g.damage(p,e,getMove(p.data,'heavy'));assert(p.hp<p.data.hp);assert.equal(e.hp,e.data.hp);assert(p.vy>0)});
test('Pyrojaw recognizes D, S, D+K motion',()=>{const g=battle();for(const key of ['forward','down','forward']){g.input(0,key);g.step()}activate(g,0,'heavy','forward');assert.equal(g.fighters[0].attack.move.name,'Magma God Fist')});
test('Zephyrix double-jumps while lightweights can air-dash',()=>{const g=battle('zephyrix','voltantis');activate(g,0,'jump');frames(g,4);activate(g,0,'jump');assert.equal(g.fighters[0].airJumps,2);activate(g,1,'jump');frames(g,3);activate(g,1,'jump');assert.equal(g.fighters[1].dash,9)});
test('shadow clone echoes the next attack through a frontal guard',()=>{
  const g=battle('noxshade','pyrojaw');activate(g,0,'special','down');frames(g,40);assert(g.fighters[0].clone);g.fighters[1].inputs.back=true;activate(g,0,'jab');frames(g,25);assert(g.fighters[1].hp<190);assert(g.events.some(e=>e.crossup));
});
test('special cooldown and stamina costs prevent repeated casts',()=>{
  const g=battle();activate(g,0,'special','back');assert.equal(g.fighters[0].stamina,80);frames(g,50);assert.equal(g.input(0,'special','back'),false);g.fighters[0].stamina=0;assert.equal(g.input(0,'special','up'),false);
});
test('burst requires low HP or full gauge, freezes cinematically, and is once per round',()=>{
  const g=battle(),p=g.fighters[0];assert.equal(g.input(0,'burst'),false);p.kinetic=100;activate(g,0,'burst');assert.equal(g.cinematic,48);const timer=g.time;frames(g,48);assert.equal(g.time,timer);frames(g,90);assert.equal(g.input(0,'burst'),false);assert(p.burstUsed);
});
test('walls splat, break into a lower tier, then allow ring-outs',()=>{
  const g=battle(),e=g.fighters[1];e.x=6;e.vx=.2;e.wallImpact={damage:30,break:true,attacker:0};g.boundary(e);assert(e.stun>=40);assert.equal(g.walls[2],35);e.wallLock=0;e.x=6;e.vx=.2;g.boundary(e);assert.equal(g.tier,1);assert(e.y>2);
  e.wallLock=0;e.x=6;e.z=0;e.vx=.2;g.walls[2]=30;g.boundary(e);assert.equal(e.hp,0);assert(g.events.some(e=>e.type==='ringout'));
});
test('wall-splat holds the airborne target for a guaranteed follow-up window',()=>{
  const g=battle(),[p,e]=g.fighters;e.x=6;e.vx=.2;e.juggles=1;e.wallImpact={damage:25,break:false,attacker:0};g.boundary(e);
  frames(g,25);assert.equal(e.y,.7);assert.equal(e.wallSplat,18);assert(e.stun>0);assert.equal(e.knockdown,0);
  p.x=e.x-1.2;p.z=e.z;activate(g,0,'jab');frames(g,10);assert(e.hp<e.data.hp);assert.equal(e.wallSplat,0);
});
test('best of three resets round state and ends after two wins',()=>{
  const g=battle();g.fighters[1].hp=0;g.step();assert.deepEqual(g.wins,[1,0]);assert.equal(g.phase,'roundover');frames(g,165);assert.equal(g.round,2);frames(g,125);assert.equal(g.phase,'fighting');assert.equal(g.fighters[1].hp,155);g.fighters[1].hp=0;g.step();assert.equal(g.phase,'matchover');assert.deepEqual(g.wins,[2,0]);
});
test('timeouts compare health percentages; ties replay without awarding a win',()=>{
  const g=battle('glaciolith','voltantis');g.time=1;g.fighters[0].hp=120;g.fighters[1].hp=100;g.step();assert.equal(g.roundWinner,1);
  const h=battle();h.time=1;h.step();assert.equal(h.roundWinner,null);assert.deepEqual(h.wins,[0,0]);
});
test('double-tap backdash supports down-cancel chaining',()=>{
  const g=battle();g.input(0,'back');frames(g,4);g.input(0,'back');assert.equal(g.fighters[0].dash,13);g.input(0,'down');assert.equal(g.fighters[0].dash,0);g.input(0,'back');assert.equal(g.fighters[0].dash,13);
});
test('pause freezes the simulation including the timer',()=>{const g=battle();g.paused=true;frames(g,60);assert.equal(g.time,3600);assert.equal(g.tick,0)});
test('all AI archetypes can act, land damage, and complete rounds',()=>{
  for(const d of ROSTER){const g=battle('pyrojaw',d.id,{ai:true,random:()=>.3});g.fighters[0].x=-1;g.fighters[1].x=1;
    frames(g,4100);assert(g.events.some(e=>e.type==='attack'&&e.side===1),`${d.id} never attacks`);
    assert(g.round>1||g.phase!=='fighting',`${d.id} round never ends`);
  }
});
test('AI sidesteps narrow startup and zones from long range',()=>{
  const g=battle('pyrojaw','aqualance',{random:()=>.2});g.fighters[0].attack={move:getMove(g.fighters[0].data,'heavy'),frame:2};g.think(g.fighters[1],g.fighters[0]);assert(g.fighters[1].inputs.up||g.fighters[1].inputs.down);
  const h=battle('pyrojaw','aqualance',{random:()=>.2});h.fighters[0].x=-3;h.fighters[1].x=3;h.think(h.fighters[1],h.fighters[0]);assert(h.fighters[1].attack.move.projectile);
});
