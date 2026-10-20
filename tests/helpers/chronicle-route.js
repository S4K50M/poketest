import {playCampaign,walkTo,fightGuardian} from './campaign-route.js';
// A complete optional-story controller. All travel, fights, notes and turn-ins
// use player actions; no inventory, boss health or progression flags are injected.
export function playChronicle(g,{onOptional=()=>{},faction='unwritten'}={}){
 const walk=x=>{if(!walkTo(g,x))throw Error(`Cannot walk to ${x} in ${g.roomId}`);};
 const interact=x=>{walk(x);if(!g.input('interact'))throw Error(`Cannot interact at ${x} in ${g.roomId}: ${g.message}`);};
 const fight=()=>{onOptional(g);if(!fightGuardian(g))throw Error('Guardian not defeated in '+g.roomId);};
 const slay=e=>{for(let t=0;t<2400&&e.hp>0;t++){const p=g.player,dx=e.x-p.x;g.setInputs({left:dx< -35,right:dx>35,up:e.kind==='candlewraith'&&Math.abs(dx)<65});if(t%10===0)g.input('heavy');if(t%70===0){g.setInputs({});g.input('special');g.releaseSpecial();}if(p.hp<2)g.input('potion');g.step();}if(e.hp>0)throw Error('Cannot defeat '+e.kind);};
 interact(900);interact(1050);interact(440);interact(95);interact(900);
 playCampaign(g);g.finishEnding('restore');g.buyTalent('ferocity');g.buyTalent('execution');g.chooseFaction(faction);
 interact(200);interact(1230);interact(2070);interact(385);interact(565);walk(1900);fight();interact(385);interact(95);interact(95);
 interact(200);interact(1410);interact(2090);interact(380);interact(580);g.enemies.filter(e=>e.kind==='candlewraith').forEach(slay);interact(380);walk(1950);fight();walk(2610);g.cycleTool();g.input('tool');interact(380);interact(95);interact(95);
 interact(200);interact(1770);interact(2070);interact(385);interact(565);g.enemies.filter(e=>e.kind==='clockscarab').forEach(slay);interact(385);walk(1990);fight();walk(2640);g.input('tool');interact(385);interact(95);interact(95);
 interact(470);interact(900);interact(470);return g.snapshot();
}
