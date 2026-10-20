import {ROOMS,BIOMES,CHAPTERS} from './world.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const camp=room=>room.objects.some(o=>['camp','workbench'].includes(o.kind));
const springs=(g,room)=>g.recoveryForRoom?.(room.id)||[];
const exits=room=>room.objects.filter(o=>o.to&&ROOMS[o.to]);

// Atlas geography follows the same door data as traversal. Fog reveals only
// visited rooms and their immediate exits; it never points to an objective.
export function regionAtlas(g,region,selectedId,live=false){
  const biome=BIOMES[region]||BIOMES.moss,rooms=Object.values(ROOMS).filter(r=>r.biome===region);
  const visited=id=>g.visited.has(id),frontier=new Set();
  for(const room of Object.values(ROOMS))if(visited(room.id))for(const door of exits(room))frontier.add(door.to);
  const plotted=rooms.map((r,i)=>{
    const point=r.map||r.mapPosition||(['clockwork-ossuary','paper-moon','cradle-zero'].includes(r.id)?{x:0,y:3}:{});
    return {room:r,x:Number.isFinite(point.x)?point.x:Number.isFinite(r.mapX)?r.mapX:1+i%4,y:Number.isFinite(point.y)?point.y:Number.isFinite(r.mapY)?r.mapY:Math.floor(i/4)};
  });
  const xs=plotted.map(p=>p.x),ys=plotted.map(p=>p.y),minX=Math.min(...xs,0),maxX=Math.max(...xs,1),minY=Math.min(...ys,0),maxY=Math.max(...ys,1);
  const position=new Map(plotted.map(p=>[p.room.id,rooms.length===1?{x:50,y:50}:{x:10+(p.x-minX)/Math.max(1,maxX-minX)*80,y:16+(p.y-minY)/Math.max(1,maxY-minY)*68}]));
  const connections=[],seen=new Set();
  for(const room of rooms)for(const door of exits(room)){
    if(!position.has(door.to)||!visited(room.id)&&!visited(door.to))continue;
    const key=[room.id,door.to].sort().join(':');if(seen.has(key))continue;seen.add(key);
    const a=position.get(room.id),b=position.get(door.to),mx=(a.x+b.x)/2;
    connections.push(`<path class="${visited(room.id)&&visited(door.to)?'charted':'frontier'}" d="M ${a.x} ${a.y} H ${mx} V ${b.y} H ${b.x}"/>`);
  }
  const selected=rooms.find(r=>r.id===selectedId&&(visited(r.id)||frontier.has(r.id)))||rooms.find(r=>r.id===g.roomId)||rooms.find(r=>visited(r.id))||rooms.find(r=>frontier.has(r.id));
  const nodes=plotted.map(({room})=>{
    const known=visited(room.id),edge=frontier.has(room.id),here=g.roomId===room.id,pos=position.get(room.id),points=springs(g,room),safe=points.some(p=>!p.used),station=camp(room),boss=room.enemies.some(e=>e.boss),icon=here?'●':known?safe?'✦':station?'⬟':boss?'◈':'▪':edge?'◇':'·';
    return `<button class="atlas-room ${known?'charted':edge?'frontier':'uncharted'} ${here?'current':''} ${selected?.id===room.id?'selected':''}" data-inspect-room="${room.id}" style="left:${pos.x}%;top:${pos.y}%" ${!known&&!edge?'disabled':''} aria-label="${escape(here?'You are here: '+room.name:known?room.name:edge?'Uncharted passage':'Uncharted room')}" ${here?'aria-current="location"':''}><span aria-hidden="true">${icon}</span><strong>${known?escape(room.name):edge?'Uncharted passage':'???'}</strong><small>${here?'YOU ARE HERE':known?safe?'WELLSPRING':station?'CAMP · CRAFT & TRAVEL':boss?'GUARDIAN CHAMBER':escape(room.dungeon||'EXPLORED'):edge?'PASSAGE DISCOVERED':'UNKNOWN'}</small></button>`;
  }).join('');
  const gateNodes=region==='sanctuary'?CHAPTERS.map((chapter,i)=>{
    const angle=(i*60-90)*Math.PI/180,x=50+Math.cos(angle)*34,y=50+Math.sin(angle)*32,b=BIOMES[chapter.id],sealed=chapter.need>g.fragments.size;
    connections.push(`<path class="${sealed?'frontier':'charted'}" d="M 50 50 L ${x} ${y}"/>`);
    return `<button class="atlas-gate ${sealed?'sealed':''}" data-region="${chapter.id}" style="left:${x}%;top:${y}%;--gate:${b.color}"><span aria-hidden="true">${b.icon}</span><strong>${b.name}</strong><small>GATE ${String(i+1).padStart(2,'0')} · ${sealed?'SEALED':'OPEN'}</small></button>`;
  }).join(''):'';
  const tabs=[{id:'sanctuary',title:'The Last Lantern'},...CHAPTERS].map((chapter,i)=>{
    const b=BIOMES[chapter.id],count=Object.values(ROOMS).filter(r=>r.biome===chapter.id&&visited(r.id)).length;
    return `<button class="dimension-tab ${region===chapter.id?'active':''}" data-region="${chapter.id}" aria-pressed="${region===chapter.id}" style="--dimension:${b.color}"><span aria-hidden="true">${b.icon}</span><strong>${i?'GATE '+String(i).padStart(2,'0'):'THE NEXUS'}</strong><small>${b.name} · ${count} mapped</small></button>`;
  }).join('');
  const chapter=CHAPTERS.find(ch=>ch.id===region),known=selected&&visited(selected.id),points=selected?springs(g,selected):[],destination=selected&&(camp(selected)||points.some(p=>g.discoveredRecovery?.has(p.id))),canTravel=live&&known&&destination;
  const detail=selected?`<div class="atlas-room-detail"><div><p class="eyebrow">${known?camp(selected)?'CAMP · CRAFTING & TRAVEL':points.some(p=>!p.used)?'WELLSPRING · AUTOMATIC FULL RECOVERY':selected.id===g.roomId?'CURRENT LOCATION':'CHARTED ROOM':'BEYOND THE EDGE OF YOUR MAP'}</p><h3>${known?escape(selected.name):'An unopened passage'}</h3><p>${known?escape((selected.story?.replace?.('|',' — ')||selected.story)||selected.description||selected.subtitle||'Explore the platforms above and below. The doors connect this chamber to the surrounding dungeon.'):'Enter this room to record its name, history, and connecting passages.'}</p>${known?`<p class="atlas-room-meta">${escape(selected.dungeon||biome.name)}${selected.depth!==undefined?' · DEPTH '+escape(selected.depth):''} · ${exits(selected).length} passage${exits(selected).length===1?'':'s'}</p>`:''}</div>${known&&destination?`<button class="secondary" data-travel="${selected.id}" ${canTravel?'':'disabled'}>${camp(selected)?'TRAVEL TO CAMP':'TRAVEL TO WELLSPRING'}</button>`:''}</div>`:`<div class="atlas-room-detail"><p>This dimension has not been charted. Find its gate in the Last Lantern and step through.</p></div>`;
  return `<div class="dimension-tabs" aria-label="Choose a dimension">${tabs}</div><div class="atlas-heading"><div><p class="eyebrow">${region==='sanctuary'?'THE SIXFOLD NEXUS':escape(chapter?.title||'DIMENSIONAL DUNGEON')}</p><h3>${biome.name}</h3></div><span>${rooms.filter(r=>visited(r.id)).length} / ${rooms.length} ROOMS MAPPED</span></div><div class="dungeon-atlas" style="--dimension:${biome.color}" aria-label="${escape(biome.name)} room map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${connections.join('')}</svg>${nodes}${gateNodes}<span class="atlas-depth-label">HIGHER CHAMBERS<br>│<br>DEEPER CHAMBERS</span></div><div class="atlas-legend"><span><b>●</b> Your location</span><span><b>✦</b> Wellspring</span><span><b>⬟</b> Camp station</span><span><b>◈</b> Guardian</span><span><b>◇</b> Uncharted passage</span><span>Routes appear as you explore</span></div>${detail}${known&&points.length?`<p class="atlas-spring-note"><span>✦</span> ${points.filter(p=>!p.used).length} / ${points.length} wellsprings remain in this chamber. Walk through one for full-party recovery; it will become dormant until your next attempt.</p>`:''}${chapter?`<p class="atlas-story">${escape(chapter.story)}</p>`:''}`;
}
