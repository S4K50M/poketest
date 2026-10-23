import {ROOMS,CHAPTERS} from './world.js';

const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const point=(id,room,x,y=520)=>({id,room,x,y,name:'Wellspring of Remembrance'});
export const HUB_RECOVERY=Object.freeze(point('sanctuary:hearth','sanctuary',200));
export const validSeed=value=>Number.isInteger(value)&&value>0&&value<=4294967295;
export const newWorldSeed=()=>1+Math.floor(Math.random()*4294967294);

/** Seeded choices belong to a journey, not the shared room registry. */
export function recoveryLayout(seed){
  const points=[{...HUB_RECOVERY}];
  for(const [index,ch] of CHAPTERS.entries()){
    const pick=random((seed^Math.imul(index+1,2654435761))>>>0),id=ch.id;
    // One shared party refill for the entire gate. Keep the legacy IDs so
    // surviving checkpoints migrate safely, while seed picks the deep room.
    const inCourt=pick()<.45;
    const floorSites=[1120,1650,2180],x=floorSites[Math.floor(pick()*floorSites.length)];
    points.push(inCourt?point(id+':court',id+'-nexus',pick()<.5?1460:1550):point(id+':climb',id+'-descent',x));
  }
  return points;
}

export function recoverySavePoint(value,points){
  if(!value||!Object.hasOwn(ROOMS,value.room))return {...HUB_RECOVERY};
  const found=points.find(p=>p.room===value.room&&(value.id===p.id||Math.abs(value.x-p.x)<2&&Math.abs(value.y-p.y)<2));
  // Old bench checkpoints migrate to the sanctuary rather than a free-heal camp.
  return found?{id:found.id,room:found.room,x:found.x,y:found.y}:{...HUB_RECOVERY};
}
