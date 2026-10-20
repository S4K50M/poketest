import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/rpg-world.js';
import { CampaignEngine } from '../src/campaign.js';
import { CHAPTERS, BOSSES, ROOMS } from '../src/world.js';
import { DIMENSIONS } from '../src/dimensions.js';
import { climbTo } from './helpers/campaign-route.js';

// These are isolated geometry fixtures, not campaign completion tests. Remove
// combatants and assign exactly the movement rewards earned before this gate;
// then use ordinary input()/step() physics without changing position, velocity,
// health, jump limits, invulnerability, or platform geometry during the route.
function geometryFixture(chapter,kind,party){
  const g=new CampaignEngine(party);
  g.abilities=new Set(['dash',...CHAPTERS.slice(0,chapter).map(ch=>BOSSES[ch.boss].reward).filter(Boolean)]);
  g.storyStage=1;
  g.loadRoom(DIMENSIONS[chapter].id+'-'+kind);
  g.enemies=[];
  return g;
}

const parties=[undefined,['terrakhan','glaciolith','ferrodrake']];
for(const [chapter,dimension]of DIMENSIONS.entries())for(const kind of ['descent','ascent']){
  test(`${dimension.id} ${kind}: chapter-earned movement reaches every upper shelf without falling`,()=>{
    // Also exercise the slowest starter, whose run-speed multiplier is lower
    // than the default Pyrojaw; a route must not require a fast companion.
    for(const party of parties){
      const g=geometryFixture(chapter,kind,party),hp=g.player.hp;
      const shelves=g.platforms.filter(p=>p.y<520&&!p.solid&&!p.catch);
      const route=g.room.climbNetwork?.routes.find(route=>route.id==='east')?.waypoints||
        (kind==='descent'?shelves.sort((a,b)=>b.y-a.y):shelves.slice(0,10));
      for(const shelf of route){
        // The final switchback opens onto a wide balcony. Land on its near
        // side first, then walk to its door rather than aiming through it.
        const x=shelf.w===undefined?shelf.x:kind==='ascent'&&shelf.y===-750?780:shelf.x+Math.min(65,shelf.w/2);
        assert(climbTo(g,x,shelf.y,1600),`${g.data.id}: unreachable shelf ${shelf.x},${shelf.y}`);
        assert.equal(g.player.grounded,true);
        assert.equal(g.player.y,shelf.y);
      }
      const door=g.room.objects.find(o=>o.id===(kind==='descent'?'high-loop':'gate-loop'));
      assert(climbTo(g,door.x,door.y,800),'the actual exit must be reachable from the last shelf');
      assert.equal(g.stats.falls,0);
      assert.equal(g.stats.wipes,0);
      assert.equal(g.player.hp,hp);
      assert(g.stats.jumps>=7,'the tower must require multiple actual jumps');
      if(kind==='descent'&&chapter>=4)assert(g.stats.doubleJumps>=7,'late descents must use earned double jumps');
      if(chapter<4)assert.equal(g.stats.doubleJumps,0,'an early route must not silently use unearned wings');
    }
  });
}

// Main passages are now forgiving floor routes. These simulations deliberately
// omit jump, dash, grapple and combat inputs; an accidental missed ledge must
// not be the default route to a death screen.
for(const [chapter,dimension]of DIMENSIONS.entries())test(`${dimension.id}: the main descent can be walked without any jump or fall penalty`,()=>{
  for(const party of parties){
    const g=geometryFixture(chapter,'descent',party),hp=g.player.hp;
    const door=g.room.objects.find(o=>o.id==='exit');
    assert.equal(door.y,520,'the required exit belongs to the tunnel floor');
    for(let frame=0;frame<900&&g.player.x<door.x-20;frame++){g.setInputs({right:true});g.step();}
    assert(g.player.x>=door.x-30,'basic movement reaches the next room');
    assert.equal(g.player.grounded,true);assert.equal(g.player.y,520);
    assert.equal(g.stats.jumps,0);assert.equal(g.stats.doubleJumps,0);assert.equal(g.stats.falls,0);
    assert.equal(g.stats.wipes,0);assert.equal(g.player.hp,hp);
  }
});

test('all forty-two campaign chambers have continuous ground beneath their passageways',()=>{
  assert.equal(Object.keys(ROOMS).length,42);
  for(const room of Object.values(ROOMS)){
    const ground=room.platforms.filter(p=>p.y===520&&!p.veil).sort((a,b)=>a.x-b.x);
    let reach=0;
    for(const p of ground){if(p.x>reach+.01)break;reach=Math.max(reach,p.x+p.w);}
    assert(reach>=room.width,room.id+' must not hide a bottomless gap in its floor');
    assert.equal((room.thorns||[]).length,0,room.id+' must not keep a kill zone under the new ground');
  }
});

test('a shortened rootway jump lands safely instead of consuming a heart',()=>{
  const g=geometryFixture(0,'descent');g.loadRoom('moss-descent',400);g.enemies=[];
  const hp=g.player.hp;
  g.setInputs({right:true});g.input('jump');g.step();g.releaseJump();
  for(let frame=0;frame<150;frame++)g.step();
  assert.equal(g.stats.falls,0);assert.equal(g.stats.wipes,0);
  assert.equal(g.player.hp,hp);assert(g.player.grounded);assert.equal(g.player.y,520);
});

for(const [chapter,dimension]of DIMENSIONS.entries())test(`${dimension.id}: walking off an upper ledge catches the player on real ground`,()=>{
  const g=geometryFixture(chapter,'descent'),hp=g.player.hp;
  const shelf=g.platforms.find(p=>p.y<520&&!p.catch&&!p.solid);
  assert(climbTo(g,shelf.x+60,shelf.y),'the optional shelf is still reachable');
  const initialFalls=g.stats.falls;
  g.releaseJump();g.setInputs({left:true});
  // Let the player make a genuine input mistake. No position, velocity,
  // invulnerability or collision flags are altered during the drop.
  for(let frame=0;frame<100;frame++)g.step();
  g.setInputs({});for(let frame=0;frame<60&&!g.player.grounded;frame++)g.step();
  assert(g.player.grounded);assert(g.player.y<=520);
  assert.equal(g.stats.falls,initialFalls);assert.equal(g.stats.wipes,0);assert.equal(g.player.hp,hp);
});

test('every connected room arrival rests on an authored platform',()=>{
  let arrivals=0;
  for(const room of Object.values(ROOMS))for(const door of room.objects.filter(o=>o.to)){
    const target=ROOMS[door.to];assert(target,`${room.id}:${door.id} has no destination`);
    const point=door.spawn??{x:150,y:520};
    assert(target.platforms.some(p=>Math.abs(p.y-point.y)<.01&&point.x>=p.x&&point.x<=p.x+p.w),
      `${room.id}:${door.id} arrives in empty space at ${door.to}:${point.x},${point.y}`);
    arrivals++;
  }
  assert(arrivals>=120,'validate the full RPG registry, including chronicle branches');
});
