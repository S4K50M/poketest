import { ROSTER, findFighter } from './roster.js';
import { MINIONS } from './designs.js';

export const HEAL={frames:48,cost:33,amount:1};
export const MINION_SPAWNS=[
  ['sinder',1880],['sinder',1990],['sinder',2100],['pebbleback',2450],
  ['voltlet',3160],['voltlet',3370],['dewdrop',3640],['sproutlet',4500],['pebbleback',4770],
  ['sproutlet',5700],['dewdrop',5920],['sinder',6400],['sinder',6500],['sinder',6610],
  ['voltlet',6820],['pebbleback',6960],['dewdrop',7470],['sproutlet',7580],
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Party and RPG systems shared by every chamber of the platformer. */
export class AdventureSystems{
  initAdventure(id,options={}){
    const requested=Array.isArray(id)?id:options.party||[id];
    if(requested.length>3||new Set(requested).size!==requested.length||requested.some(key=>!ROSTER.some(d=>d.id===key)))throw new Error('Choose up to three distinct creatures from the roster.');
    const ids=[...requested];for(const d of ROSTER)if(ids.length<3&&!ids.includes(d.id))ids.push(d.id);
    this.party=ids.map(key=>{const data=findFighter(key);return {data,hp:data.maxHp,maxHp:data.maxHp,spirit:100,skillCooldown:0}});
    this.activeSlot=0;this.switchCooldown=0;this.xp=0;this.level=1;this.lumens=0;this.upgrades=0;this.discovered=new Set();
    const p=this.player;
    Object.defineProperties(p,{hp:{enumerable:true,get:()=>this.party[this.activeSlot].hp,set:v=>{this.party[this.activeSlot].hp=v}},maxHp:{enumerable:true,get:()=>this.party[this.activeSlot].maxHp},spirit:{enumerable:true,get:()=>this.party[this.activeSlot].spirit,set:v=>{this.party[this.activeSlot].spirit=v}}});
    Object.defineProperty(this,'data',{get:()=>this.party[this.activeSlot].data});
    Object.assign(p,{healHeld:false,healProgress:0,healing:false,slow:0,root:0,slick:0,burn:0,guard:0,armor:0,specialHeld:false,specialCharge:0,fortress:false,stored:0,airDashes:0});
    Object.assign(this.stats,{switches:0,heals:0,minions:0,wipes:0});
    this.enemyShots=[];this.hazards=[];this.zones=[];this.decoy=null;this.skillStrike=null;
  }
  spawnMinions(){
    for(const [kind,x] of MINION_SPAWNS){
      const d=MINIONS[kind];const bank=x<2620?[1620,2620]:x<3930?[2940,3930]:[4320,7750];
      this.enemies.push({id:this.enemies.length,kind,x,y:520,baseY:520,home:x,hp:d.hp,maxHp:d.hp,face:-1,state:'patrol',timer:50+x%43,flash:0,stun:0,vx:0,slow:0,flipped:0,left:Math.max(bank[0]+30,x-140),right:Math.min(bank[1]-30,x+140)});
    }
  }
  partyInput(action){
    if(/^slot[123]$/.test(action))return this.switchTo(Number(action.slice(4))-1);
    if(action==='switch'){for(let i=1;i<4;i++){const n=(this.activeSlot+i)%3;if(this.party[n].hp>0&&n!==this.activeSlot)return this.switchTo(n);}return false;}
    if(action==='heal'){Object.assign(this.player,{healHeld:true,guard:0,specialHeld:false,fortress:false});return this.player.hp<this.player.maxHp&&this.player.spirit>=HEAL.cost;}
    if(action==='upgrade')return this.buyUpgrade();
    return null;
  }
  cancelHeal(){this.player.healHeld=false;this.player.healProgress=0;this.player.healing=false;}
  releaseHeal(){this.cancelHeal();}
  switchTo(slot,forced=false){
    if(slot<0||slot>=this.party.length||slot===this.activeSlot||this.party[slot].hp<=0||!forced&&this.switchCooldown>0)return false;
    const old=this.activeSlot;this.activeSlot=slot;this.switchCooldown=18;this.cancelHeal();
    this.player.attack=null;this.player.guard=0;this.player.specialHeld=false;this.player.specialCharge=0;this.player.fortress=false;this.player.armor=0;this.skillStrike=null;
    this.stats.switches++;this.effects.push({type:'swap',x:this.player.x,y:this.player.y-30,life:25});this.say(this.data.name.toUpperCase()+' · '+this.data.passive.toUpperCase());this.emit('switch',{from:old,to:slot});return true;
  }
  restoreParty(){for(const m of this.party){m.hp=m.maxHp;m.spirit=100;m.skillCooldown=0;}this.cancelHeal();}
  loseHeart(wipe=false){
    if(!wipe)this.player.hp=Math.max(0,this.player.hp-1);
    if(this.player.hp<=0){const alive=this.party.findIndex(m=>m.hp>0);if(alive>=0)this.switchTo(alive,true);else wipe=true;}
    if(wipe){this.stats.wipes++;this.lumens=Math.floor(this.lumens*.9);this.restoreParty();}
  }
  damagePlayer(direction=0,amount=1,status={}){
    const p=this.player;if(p.invul||p.respawning)return false;
    if((p.guard>0||p.fortress)&&direction===-p.face){
      p.stored=Math.min(4,p.stored+1);this.emit('block');this.effects.push({type:'spark',x:p.x+p.face*28,y:p.y-25,life:15});
      if(p.guard>0){p.guard=0;p.invul=15;for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-p.x)<160)this.strike(e,24,p.face,{heavy:true});this.say('AEGIS REVERSAL');}
      return false;
    }
    const armored=p.armor>0;if(armored)p.armor--;
    p.hp=Math.max(0,p.hp-amount*(armored?.5:1));p.invul=amount<1?42:72;p.flash=10;this.cancelHeal();
    if(!armored){p.vx=direction*6;p.vy=-5;p.attack=null;}
    for(const key of ['slow','root','slick','burn'])if(status[key])p[key]=Math.max(p[key],status[key]);
    this.emit('hurt');
    if(p.hp<=0){const alive=this.party.findIndex(m=>m.hp>0);if(alive>=0){this.switchTo(alive,true);this.say('PARTNER DOWN · '+this.data.name.toUpperCase()+' TAKES OVER');}else this.respawn(true);}
    return true;
  }
  updateAdventure(){
    const p=this.player;
    if(this.switchCooldown>0)this.switchCooldown--;
    for(const m of this.party)if(m.skillCooldown>0)m.skillCooldown--;
    for(const key of ['slow','root','slick','burn','guard'])if(p[key]>0)p[key]--;
    if(p.burn===1)this.hurt(0,.5);
    const stopped=!this.inputs.left&&!this.inputs.right&&Math.abs(p.vx)<.5;
    p.healing=!!(p.healHeld&&stopped&&p.grounded&&!p.attack&&!p.dash&&!p.respawning&&p.hp<p.maxHp&&p.spirit>=HEAL.cost);
    if(p.healing){
      // Recovery is a commitment, even immediately after taking a hit.
      p.invul=0;
      p.healProgress++;
      if(p.healProgress>=HEAL.frames){p.spirit-=HEAL.cost;p.hp=Math.min(p.maxHp,p.hp+HEAL.amount);p.healProgress=0;this.stats.heals++;this.emit('heal');this.effects.push({type:'heal',x:p.x,y:p.y-25,life:30});}
    }else p.healProgress=0;
    if(p.specialHeld&&this.data.id==='terrakhan'){p.specialCharge++;p.fortress=p.specialCharge>=15;}
    else p.fortress=false;
    if(this.decoy&&--this.decoy.life<=0)this.decoy=null;
    if(this.skillStrike){
      const s=this.skillStrike;s.life--;
      for(const e of this.enemies)if(e.hp>0&&!s.hit.has(e.id)&&Math.abs(e.x-p.x)<95&&Math.abs(e.y-p.y)<100){s.hit.add(e.id);this.strike(e,s.damage,p.face,{heavy:true,element:s.element,source:s.owner});if(s.element==='Ice'){e.slow=180;this.effects.push({type:'ice',x:e.x,y:e.y,life:35});}}
      if(s.life<=0){this.skillStrike=null;p.armor=0;}
    }
    for(const zone of this.zones){
      zone.life--;
      for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-zone.x)<zone.radius&&Math.abs(e.y-zone.y)<100){
        if(zone.type==='wind'&&e.kind!=='warden'){e.x+=(zone.x-e.x)*.04;e.stun=Math.max(e.stun,2);}
        if(this.tick%24===0)this.strike(e,zone.type==='fire'?4:3,Math.sign(e.x-zone.x),{source:zone.owner,dot:true,element:zone.type});
      }
    }
    this.zones=this.zones.filter(z=>z.life>0);
    for(const hazard of this.hazards){hazard.life--;if(hazard.type==='bubble'&&p.grounded&&Math.abs(p.x-hazard.x)<28){p.slick=150;hazard.life=0;this.say('BUBBLE SLICK · JUMP CLEAR');}}
    this.hazards=this.hazards.filter(h=>h.life>0);
    for(const shot of this.enemyShots){
      shot.x+=shot.vx;shot.y+=shot.vy;shot.life--;
      if(this.decoy&&Math.hypot(shot.x-this.decoy.x,shot.y-(this.decoy.y-20))<40){shot.life=0;this.burstDecoy();}
      else if(Math.abs(shot.x-p.x)<20&&Math.abs(shot.y-(p.y-this.data.bodyHeight*.5))<25){shot.life=0;this.hurt(Math.sign(shot.vx),.5,shot.status||{burn:65});}
    }
    this.enemyShots=this.enemyShots.filter(b=>b.life>0);
  }
  buyUpgrade(){
    const cost=24+this.upgrades*20;
    if(!this.player.grounded||Math.abs(this.player.x-this.checkpoint.x)>95){this.say('RETURN TO A WAYLIGHT TO FORGE A CHARM');return false;}
    if(this.upgrades>=3){this.say('HEARTWOOD CHARM AT MAXIMUM');return false;}
    if(this.lumens<cost){this.say(`HEARTWOOD CHARM NEEDS ${cost} LUMENS`);return false;}
    this.lumens-=cost;this.upgrades++;for(const m of this.party){m.maxHp++;if(m.hp>0)m.hp=Math.min(m.maxHp,m.hp+1);}this.say('HEARTWOOD CHARM +'+this.upgrades+' · HEALTH & DAMAGE UP');this.emit('upgrade');return true;
  }
  awardEnemy(e){
    if(e.rewarded)return;e.rewarded=true;const d=MINIONS[e.kind];this.gainXP(d?.xp||(e.kind==='warden'?85:20));this.lumens+=d?.coins||(e.kind==='warden'?35:8);
    if(d){this.stats.minions++;this.discovered.add(e.kind);}
    this.emit('kill');
  }
  gainXP(amount){
    this.xp+=amount;
    while(this.level<5&&this.xp>=this.level*60){this.xp-=this.level*60;this.level++;for(const m of this.party){m.maxHp++;if(m.hp>0)m.hp=Math.min(m.maxHp,m.hp+1);}this.say('BOND LEVEL '+this.level+' · PARTY HEALTH & DAMAGE UP');this.emit('levelup');}
  }
  skillPower(){return 1+(this.level-1)*.12+this.upgrades*.08;}
  castSkill(){
    const p=this.player,m=this.party[this.activeSlot],id=this.data.id,cost=25;
    if(m.skillCooldown||p.spirit<cost||p.attack||p.respawning)return false;
    const directed=this.inputs.left||this.inputs.right||this.inputs.up||this.inputs.down;
    if(id==='terrakhan'){if(p.specialHeld)return false;p.specialHeld=true;p.specialCharge=0;p.stored=0;return true;}
    p.spirit-=cost;m.skillCooldown=40;this.cancelHeal();
    const base={owner:this.activeSlot,color:this.data.color,element:this.data.element,hit:new Set(),life:65};
    const bolt=(extra={})=>this.projectiles.push({...base,x:p.x+p.face*24,y:p.y-this.data.bodyHeight*.55,vx:p.face*10,vy:0,damage:20,...extra,hit:new Set()});
    if(directed&&['pyrojaw','voltantis','glaciolith','zephyrix','noxshade','aqualance'].includes(id)){
      p.face=this.inputs.left?-1:this.inputs.right?1:p.face;p.dash=13;p.dashUsed=true;p.dashCooldown=32;
      p.skillVector=id==='voltantis'?{x:this.inputs.up||this.inputs.down?0:p.face,y:this.inputs.up?-1:this.inputs.down?1:0}:null;
      if(id==='noxshade'||id==='voltantis')p.invul=Math.max(p.invul,12);
      if(['pyrojaw','glaciolith','aqualance','zephyrix'].includes(id))p.armor=1;
      this.skillStrike={life:18,damage:id==='glaciolith'?30:24,element:this.data.element,owner:this.activeSlot,hit:new Set()};
      this.effects.push({type:'swap',x:p.x,y:p.y-25,life:20});
      if(id==='voltantis')this.zones.push({type:'electric',x:p.x,y:p.y,radius:95,life:90,owner:this.activeSlot});
      this.say(this.data.directional.toUpperCase());this.emit('cast');return true;
    }
    if(id==='pyrojaw')bolt({vx:p.face*7.5,vy:-3,gravity:.14,kind:'magma',damage:21});
    if(id==='voltantis')for(let i=0;i<3;i++)bolt({x:p.x+p.face*(22-i*18),y:p.y-35+i*8,homing:true,kind:'needle',damage:8});
    if(id==='glaciolith')bolt({vx:p.face*8,vy:-2,gravity:.10,kind:'ice',damage:27,heavy:true});
    if(id==='zephyrix')this.zones.push({type:'wind',x:p.x+p.face*130,y:p.y,radius:190,life:160,owner:this.activeSlot});
    if(id==='noxshade')this.decoy={x:p.x+p.face*100,y:p.y,life:360,owner:this.activeSlot};
    if(id==='aqualance')bolt({vx:p.face*15,kind:'water',piercing:true,damage:22,heavy:true});
    if(id==='ferrodrake'){
      if(directed){p.guard=90;this.say('AEGIS WING · FRONTAL COUNTER READY');}
      else for(const spread of [-.75,0,.75])bolt({vx:p.face*9,vy:spread,life:25,kind:'ember',damage:11});
    }
    this.emit('cast');return true;
  }
  releaseSpecial(){
    const p=this.player;
    if(this.data.id==='terrakhan'&&p.specialHeld){
      if(p.spirit>=25){p.spirit-=25;this.party[this.activeSlot].skillCooldown=35;
        this.projectiles.push({x:p.x+p.face*25,y:p.y-10,vx:p.face*10,vy:0,life:65,owner:this.activeSlot,color:'#c6d69a',element:'Earth',kind:'rockwave',damage:p.specialCharge>=15?25+p.stored*8:25,heavy:true,piercing:true,hit:new Set()});this.emit('cast');}
      p.specialHeld=false;p.fortress=false;p.specialCharge=0;
    }
  }
  burstDecoy(){
    const decoy=this.decoy;if(!decoy)return;this.decoy=null;
    for(const e of this.enemies)if(e.hp>0&&Math.abs(e.x-decoy.x)<170){this.strike(e,22,Math.sign(e.x-decoy.x),{source:decoy.owner});e.stun=75;}
    this.effects.push({type:'mist',x:decoy.x,y:decoy.y-25,life:45});this.emit('cast');
  }
  explodeVoltlet(e){
    if(e.hp<=0)return;e.hp=0;this.awardEnemy(e);this.effects.push({type:'static',x:e.x,y:e.y-10,life:30});
    if(Math.abs(e.x-this.player.x)<75&&Math.abs(e.y-this.player.y)<85){this.hurt(Math.sign(this.player.x-e.x),.5,{slow:60});this.say('STATIC SHOCK · SLOWED FOR 1 SECOND');}
  }
  updateMinion(e){
    const d=MINIONS[e.kind];if(!d)return false;
    const p=this.player;if(Math.abs(e.x-p.x)>900)return true;
    this.discovered.add(e.kind);if(e.flash>0)e.flash--;if(e.slow>0)e.slow--;if(e.flipped>0)e.flipped--;
    if(e.stun>0){e.stun--;e.x=clamp(e.x+e.vx,e.left,e.right);e.vx*=.75;return true;}
    const target=this.decoy&&Math.abs(this.decoy.x-e.x)<Math.abs(p.x-e.x)+100?this.decoy:p,dx=target.x-e.x,dist=Math.abs(dx),speed=d.speed*(e.slow>0?.55:1);
    e.face=dx>=0?1:-1;e.timer--;
    if(e.kind==='dewdrop')e.y=e.baseY-15-Math.sin(this.tick*.06+e.id)*15;
    else if(e.kind==='voltlet')e.y=e.baseY-Math.abs(Math.sin(this.tick*.08+e.id))*10;
    if(e.kind==='sproutlet'){
      if(e.state==='patrol'&&e.timer<=0){e.state='burrow';e.timer=65;}
      else if(e.state==='burrow'&&e.timer<=0){e.state='windup';e.timer=22;this.emit('warning');}
      else if(e.state==='windup'&&e.timer<=0){e.state='patrol';e.timer=95;if(dist<100&&Math.abs(target.y-e.y)<55){if(target===p)this.hurt(Math.sign(p.x-e.x),.5,{root:20});else this.burstDecoy();}this.effects.push({type:'vine',x:e.x,y:e.y,life:25});}
    }
    if(e.state==='patrol'&&dist<500){e.x=clamp(e.x+e.face*speed,e.left,e.right);}
    if(e.kind==='pebbleback'&&!e.flipped){
      if(dist<150&&!e.introduced){e.introduced=true;this.say('PEBBLEBACK · HEAVY K FLIPS THE SHELL');}
      if(target===p&&dist<34&&p.grounded){p.x=e.x+e.face*35;p.vx=0;}
    }
    if(e.kind==='sinder'){
      if(e.state==='patrol'&&e.timer<=0&&dist<320){e.state='windup';e.timer=24;}
      else if(e.state==='windup'&&e.timer<=0){if(dist<120){e.state='pounce';e.timer=20;}else{const dy=target.y-25-(e.y-20),r=Math.hypot(dx,dy)||1;this.enemyShots.push({x:e.x,y:e.y-20,vx:dx/r*4.4,vy:dy/r*4.4,life:110,kind:'spark'});e.state='patrol';e.timer=95;}}
      else if(e.state==='pounce'){e.x=clamp(e.x+e.face*4,e.left,e.right);e.y=e.baseY-Math.sin(Math.max(0,e.timer)/20*Math.PI)*26;if(e.timer<=0){e.state='patrol';e.timer=95;e.y=e.baseY;}}
    }
    if(e.kind==='dewdrop'&&e.timer<=0&&dist<420){this.hazards.push({type:'bubble',x:clamp(e.x+e.face*65,e.left,e.right),y:520,life:350});e.timer=110;}
    if(e.kind==='voltlet'&&dist<30&&Math.abs(target.y-e.y)<55){if(target===p)this.explodeVoltlet(e);else{this.burstDecoy();if(e.hp>0)this.explodeVoltlet(e);}}
    if(e.state!=='burrow'&&e.kind!=='voltlet'&&dist<30&&Math.abs(target.y-e.y)<48){if(target===p)this.hurt(Math.sign(p.x-e.x),e.kind==='sinder'?.5:1);else this.burstDecoy();}
    return true;
  }
}
