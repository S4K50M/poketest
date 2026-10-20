import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignEngine} from '../src/campaign.js';
import {ROOMS} from '../src/world.js';
import {climbTo} from './helpers/campaign-route.js';

// A narrow traversal fixture removes enemies, but every climb, mistake and
// recovery uses ordinary input()/step() calls. No position, velocity, jump
// capacity or health is changed after the room's normal entrance spawn.
const parties=[['pyrojaw','voltantis','zephyrix'],['terrakhan','glaciolith','ferrodrake']];
function fixture(party=parties[0],room='moss-descent'){
  const g=new CampaignEngine(party,{worldSeed:1});g.storyStage=1;
  g.loadRoom(room,150,false);g.enemies=[];
  return g;
}
const routeTo=(g,points)=>{
  for(const point of points)assert(climbTo(g,point.x,point.y,1600),`cannot reach ${point.x},${point.y} from ${g.player.x},${g.player.y}`);
};
const healthy=g=>{
  assert.equal(g.stats.falls,0);assert.equal(g.stats.wipes,0);
  assert.equal(g.stats.doubleJumps,0,'the first gate must not borrow unearned wings');
  assert(g.party.every(m=>m.hp===m.maxHp),'a missed jump must not remove health');
};

test('the first gate offers a landing network with distinct routes and intermediate rescue galleries',()=>{
  const room=ROOMS['moss-descent'];
  assert(room.climbNetwork?.routes?.length>=2);
  assert(room.climbNetwork.routes.every(route=>route.waypoints.length>5));
  assert(room.climbNetwork.drops?.length>=3,'several heights need intentional fall/recovery routes');
  const west=room.climbNetwork.routes.find(route=>route.id==='west').waypoints,east=room.climbNetwork.routes.find(route=>route.id==='east').waypoints;
  assert(west.some(p=>!east.some(q=>p.x===q.x&&p.y===q.y)));
  const directions=west.slice(1).map((p,i)=>Math.sign(p.x-west[i].x)).filter(Boolean);
  assert(directions.some((direction,i)=>i>0&&direction!==directions[i-1]),'the alternate branch must do more than repeat a diagonal stair');
  assert(room.platforms.some(p=>p.y===520&&p.x===0&&p.w===room.width),'the connected lower tunnel remains playable');
});

for(const branch of ['west','east'])for(const party of parties)test(`${party[0]} reaches the common first-gate balcony through the ${branch} branch without wings`,()=>{
  const g=fixture(party),points=g.room.climbNetwork.routes.find(route=>route.id===branch).waypoints;
  routeTo(g,points);
  const exit=g.room.objects.find(o=>o.id==='high-loop');
  assert(climbTo(g,exit.x,exit.y,1600));assert.equal(g.player.y,exit.y);
  assert(g.stats.jumps>5);healthy(g);
  assert(g.input('interact'),'the route ends at an actual usable dungeon passage');
  assert.equal(g.roomId,'moss-ascent');
});

for(const [index,drop] of (ROOMS['moss-descent'].climbNetwork?.drops||[]).entries())for(const party of parties)test(`${party[0]} misses landing ${index+1}, is caught above the floor, and climbs back into the network`,()=>{
  const g=fixture(party),route=g.room.climbNetwork.routes.find(route=>route.id==='west').waypoints;
  const matches=route.map((p,i)=>({p,i})).filter(({p})=>p.y>=drop.from.y&&(p.y!==drop.from.y||p.x<=drop.from.x));
  const approach=drop.approach||route.slice(0,matches.at(-1).i+1),direction=drop.direction==='left'?-1:1;
  routeTo(g,approach);assert(climbTo(g,drop.from.x,drop.from.y));
  const startedAt=g.player.y,initialJumps=g.stats.jumps;
  g.releaseJump();g.setInputs({right:direction>0,left:direction<0});
  let movedOff=false;
  for(let frame=0;frame<90;frame++){
    g.step();
    if(direction>0?g.player.x>=drop.untilX:g.player.x<=drop.untilX){g.setInputs({});movedOff=true;break;}
  }
  assert(movedOff,'the mistake must actually cross the upper landing edge');
  let airborne=false;
  for(let frame=0;frame<120;frame++){
    g.step();if(!g.player.grounded)airborne=true;
    if(airborne&&g.player.grounded&&g.player.y>startedAt+5)break;
  }
  assert(airborne,'the test must drop through real gravity');
  assert(g.player.grounded);assert(g.player.y>startedAt+5);
  assert(g.player.y<420,'the player stays on a middle gallery instead of falling to the room floor');
  if(Number.isFinite(drop.catchY))assert.equal(g.player.y,drop.catchY);
  assert(g.platforms.some(p=>p.y===g.player.y&&g.player.x+13>p.x&&g.player.x-13<p.x+p.w&&p.y<520),'a real intermediate collision surface catches the player');
  assert.equal(g.stats.jumps,initialJumps,'the catch requires no emergency air jump');healthy(g);
  routeTo(g,drop.return);
  assert(g.player.y<=startedAt,'the caught player can immediately rejoin the climb');
  healthy(g);
});

// The same choices must work in the adjoining first-gate rooms, not only in
// the showcase cistern. Both routes use first-arrival movement and real jumps.
for(const room of ['moss-path','moss-nexus','moss-ascent'])for(const branch of ['west','east'])for(const party of parties)test(`${party[0]} follows the ${branch} landing route in ${room} without wings`,()=>{
  const g=fixture(party,room),points=g.room.climbNetwork.routes.find(route=>route.id===branch).waypoints;
  routeTo(g,points);assert.equal(g.player.y,points.at(-1).y);healthy(g);
});
