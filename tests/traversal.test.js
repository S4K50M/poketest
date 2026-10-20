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
      const shelves=g.platforms.filter(p=>p.y<520&&!p.solid);
      const route=kind==='descent'?shelves.sort((a,b)=>b.y-a.y):shelves.slice(0,10);
      for(const shelf of route){
        // The final switchback opens onto a wide balcony. Land on its near
        // side first, then walk to its door rather than aiming through it.
        const x=kind==='ascent'&&shelf.y===-750?780:shelf.x+Math.min(65,shelf.w/2);
        assert(climbTo(g,x,shelf.y,1600),`${g.data.id}: unreachable shelf ${shelf.x},${shelf.y}`);
        assert.equal(g.player.grounded,true);
        assert.equal(g.player.y,shelf.y);
      }
      const door=g.room.objects.find(o=>o.id===(kind==='descent'?'exit':'gate-loop'));
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

test('walking off the first root shelf fails and costs a heart',()=>{
  const g=geometryFixture(0,'descent'),hp=g.player.hp;
  g.setInputs({right:true});
  for(let frame=0;frame<180&&!g.stats.falls;frame++)g.step();
  assert.equal(g.stats.falls,1);
  assert.equal(g.player.hp,hp-1);
  assert.equal(g.player.x,g.checkpoint.x);
  assert.equal(g.player.y,g.checkpoint.y);
});

test('releasing the first jump too early cannot clear the root descent',()=>{
  const g=geometryFixture(0,'descent');
  // Fixture starts on the lip of its real entry floor. The only mistake is
  // shortening the jump; the positive route above holds it to reach the shelf.
  g.loadRoom('moss-descent',400);g.enemies=[];
  const hp=g.player.hp;
  g.setInputs({right:true});g.input('jump');g.step();g.releaseJump();
  for(let frame=0;frame<180&&!g.stats.falls;frame++)g.step();
  assert.equal(g.stats.falls,1);
  assert.equal(g.player.hp,hp-1);
  assert.equal(g.stats.doubleJumps,0);
});

for(const chapter of [4,5])test(`${DIMENSIONS[chapter].id}: basic jumps cannot replace Storm Wings on the late ascent`,()=>{
  const g=geometryFixture(chapter,'descent');
  g.abilities.delete('wings');
  const first=g.platforms.find(p=>p.y<520);
  assert.equal(climbTo(g,first.x+65,first.y,400),false);
  assert.equal(g.stats.doubleJumps,0);
  assert(g.stats.falls>0,'repeated single-jump attempts must fail over the pit');
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
