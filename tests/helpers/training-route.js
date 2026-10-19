// Input-only route: no teleports, health overrides, gate overrides, or enemy damage mocks.
// This plays every authored obstacle and fights the encounter through public inputs.
export function driveTrainingRoute(g,maxFrames=6500){
  const done=new Set();
  for(let t=0;t<maxFrames&&g.phase!=='complete';t++){
    const p=g.player;g.setInputs({right:true});
    const once=(key,condition,action)=>{if(condition&&!done.has(key)){done.add(key);g.input(action);}};
    once('bridge',p.x>1390,'jump');
    once('span-jump',p.x>2590,'jump');once('span-dash',p.x>2750&&p.y<500,'dash');
    once('bell-jump',p.x>3880,'jump');
    if(p.x>4050&&p.x<4180&&!g.stats.pogos){g.setInputs({right:true,down:true});g.input('light');}
    once('bell-dash',p.x>4210&&g.stats.pogos>0,'dash');
    once('wall-start',p.x>5100,'jump');
    once('wall-kick',p.wall===1&&p.y<430&&p.x<5300,'jump');
    once('wall-air',g.stats.wallJumps>0&&p.wallLock===0,'jump');
    once('pillar-jump',p.x>5200&&p.grounded&&p.y<=260,'jump');
    once('pillar-air',p.x>5320&&p.jumpCount===1,'jump');
    if(g.lesson===5){
      const enemy=g.enemies.find(e=>e.hp>0);
      if(enemy){
        g.setInputs({right:p.x<enemy.x,left:p.x>enemy.x});
        if(t%19===0)g.input('light');if(t%80===0)g.input('special');
        if(enemy.state==='windup'&&enemy.timer<15&&p.grounded)g.input('jump');
      }
    }
    g.step();
  }
  return g.snapshot();
}
