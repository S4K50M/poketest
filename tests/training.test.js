import test from 'node:test';
import assert from 'node:assert/strict';
import {TrainingEngine,MOTOR,LESSONS} from '../src/training.js';
import {ROSTER} from '../src/roster.js';
import {driveTrainingRoute} from './helpers/training-route.js';

const frames=(g,n)=>{for(let i=0;i<n;i++)g.step()};

test('movement reaches full speed in five frames and reverses immediately',()=>{
  const g=new TrainingEngine();g.setInputs({right:true});frames(g,5);assert(g.player.vx>6);const vx=g.player.vx;g.setInputs({left:true});g.step();assert(g.player.vx<vx);frames(g,9);assert(g.player.vx<-6);
});
test('holding jump rises higher than releasing early or tapping before a simulation tick',()=>{
  const high=new TrainingEngine(),low=new TrainingEngine(),tap=new TrainingEngine();
  for(const g of [high,low,tap])g.input('jump');tap.releaseJump();
  let hi=520,lo=520,ta=520;
  for(let i=0;i<30;i++){if(i===5)low.releaseJump();high.step();low.step();tap.step();hi=Math.min(hi,high.player.y);lo=Math.min(lo,low.player.y);ta=Math.min(ta,tap.player.y);}
  assert(hi<lo-50);assert(hi<ta-60);
});
test('double-jump works once until the player lands',()=>{
  const g=new TrainingEngine();g.input('jump');frames(g,8);g.input('jump');g.step();assert.equal(g.stats.doubleJumps,1);assert.equal(g.player.jumpCount,2);g.input('jump');frames(g,2);assert.equal(g.stats.doubleJumps,1);frames(g,70);assert(g.player.grounded);assert.equal(g.player.jumpCount,0);
});
test('coyote time accepts a jump after leaving an edge',()=>{
  const g=new TrainingEngine();Object.assign(g.player,{x:1490,y:521,grounded:false,coyote:5,jumpCount:2});g.input('jump');g.step();assert(g.player.vy<-12);assert.equal(g.stats.jumps,1);
});
test('buffered jump fires upon landing after both aerial jumps are spent',()=>{
  const g=new TrainingEngine();Object.assign(g.player,{y:505,vy:8,grounded:false,coyote:0,jumpCount:2});g.input('jump');frames(g,3);assert(g.player.vy<0);assert.equal(g.stats.jumps,1);
});
test('dash travels quickly, gives brief protection, and requires a landing or cooldown',()=>{
  const g=new TrainingEngine();g.input('jump');frames(g,4);const x=g.player.x;assert(g.input('dash'));assert(!g.input('dash'));assert(g.player.invul>0);frames(g,MOTOR.dashFrames);assert(g.player.x-x>=MOTOR.dash*MOTOR.dashFrames-1);assert(!g.input('dash'));frames(g,70);assert(g.player.grounded);assert(g.input('dash'));
});
test('solid wall blocks lateral motion, slides, and allows a kick away',()=>{
  const g=new TrainingEngine();Object.assign(g.player,{x:5164,y:405,vy:8,grounded:false,coyote:0,jumpCount:2});g.setInputs({right:true});frames(g,3);assert.equal(g.player.wall,1);assert(g.player.vy<=2);g.input('jump');g.step();assert.equal(g.stats.wallJumps,1);assert(g.player.vx<0);assert(g.player.vy<-12);assert.equal(g.player.dashUsed,false);
});
test('downstrike on the bell bounces, refreshes the dash, and counts only once per swing',()=>{
  const g=new TrainingEngine();Object.assign(g.player,{x:g.bell.x,y:g.bell.y-60,grounded:false,coyote:0,jumpCount:2,dashUsed:true,dashCooldown:25});g.setInputs({down:true});g.input('light');frames(g,5);assert.equal(g.stats.pogos,1);assert(g.player.vy<0);assert.equal(g.player.dashUsed,false);assert.equal(g.player.dashCooldown,0);frames(g,4);assert.equal(g.stats.pogos,1);
});
test('a lesson gate cannot be bypassed by walking or jumping',()=>{
  const g=new TrainingEngine();g.lesson=3;Object.assign(g.player,{x:4684,y:350,grounded:false});g.setInputs({right:true});frames(g,5);assert(g.player.x<=LESSONS[3].gate-15);assert(!g.completed[3]);g.stats.pogos=1;g.updateLesson();assert(g.completed[3]);frames(g,4);assert(g.player.x>LESSONS[3].gate-15);
});
test('pit failure returns to the waylight and preserves learned skills',()=>{
  const g=new TrainingEngine();g.lesson=2;g.completed[0]=g.completed[1]=true;g.checkpoint={x:2340,y:520};Object.assign(g.player,{x:2750,y:710,grounded:false,vy:16});g.step();assert.equal(g.player.x,2340);assert.equal(g.player.y,520);assert.equal(g.stats.falls,1);assert(g.player.invul>0);assert(g.completed[1]);assert.equal(g.lesson,2);
});
test('resting restores health and focus at any previously activated waylight',()=>{
  const g=new TrainingEngine();g.lesson=3;g.player.x=LESSONS[1].spawn;g.player.hp=2;g.player.spirit=5;assert(g.input('interact'));assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.player.spirit,100);assert.equal(g.checkpoint.x,LESSONS[1].spawn);
});
test('light attack respects startup and hits each enemy only once per swing',()=>{
  const g=new TrainingEngine();g.enemies=g.enemies.filter(e=>e.encounter);g.lesson=5;Object.assign(g.player,{x:6480,y:520,invul:90});g.input('light');frames(g,3);assert.equal(g.enemies[0].hp,28);frames(g,9);assert.equal(g.enemies[0].hp,14);assert.equal(g.stats.hits,1);
});
test('elemental casting costs focus and can hit a target once',()=>{
  const g=new TrainingEngine('aqualance');g.enemies=g.enemies.filter(e=>e.encounter);g.lesson=5;g.player.x=6400;g.input('special');assert.equal(g.player.spirit,75);frames(g,25);assert.equal(g.enemies[0].hp,5);g.player.spirit=0;assert(!g.input('special'));
});
test('warden telegraphs its charge and alternates into jumpable ground shockwaves',()=>{
  const g=new TrainingEngine();g.lesson=5;g.player.x=7100;const e=g.enemies[2];e.state='windup';e.timer=2;e.face=-1;const x=e.x;g.step();assert.equal(e.x,x);g.step();assert.equal(e.state,'charge');g.step();assert(e.x<x);
  e.state='windup';e.timer=1;e.pattern=1;g.step();assert.equal(e.state,'recover');assert.equal(g.waves.length,1);
  g.player.y=400;g.player.invul=0;g.waves[0].x=g.player.x+7;const hp=g.player.hp;g.step();assert.equal(g.player.hp,hp);
});
test('pause freezes the level, attacks, enemies and resource clocks',()=>{
  const g=new TrainingEngine();g.paused=true;g.input('jump');g.setInputs({right:true});frames(g,60);assert.equal(g.tick,0);assert.equal(g.player.x,150);assert.equal(g.enemies[0].x,6520);
});
for(const data of ROSTER)test(`${data.name} completes all six chambers through real movement and combat inputs`,()=>{
  const g=new TrainingEngine(data.id),result=driveTrainingRoute(g);
  assert.equal(result.phase,'complete',JSON.stringify(result));assert(result.completed.every(Boolean));assert(result.stats.airDashes>0&&result.stats.pogos>0&&result.stats.wallJumps>0&&result.stats.doubleJumps>0);assert(result.enemies.filter(e=>e.encounter).every(e=>e.hp===0));assert(result.player.hp>0);assert.equal(result.party.length,3);
});
