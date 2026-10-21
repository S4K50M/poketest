// Presentation state only: voices never pause combat, edit a quest or enter saves.
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;

export function paginateDialogue(lines,maxChars=210){
  const limit=Math.max(80,Math.floor(finite(maxChars,210))),pages=[];
  for(const line of Array.isArray(lines)?lines:[]){
    if(!Array.isArray(line)||typeof line[1]!=='string')continue;
    const speaker=String(line[0]||'A distant voice');let rest=line[1].replace(/\s+/g,' ').trim();
    while(rest){
      if(rest.length<=limit){pages.push([speaker,rest]);break;}
      const head=rest.slice(0,limit+1),sentences=[...head.matchAll(/[.!?…][”"’']?(?=\s)/g)];
      const sentence=sentences.at(-1),end=sentence&&sentence.index>=limit*.4?sentence.index+sentence[0].length:head.lastIndexOf(' ');
      const cut=end>0?end:limit;pages.push([speaker,rest.slice(0,cut).trim()]);rest=rest.slice(cut).trim();
    }
  }
  return pages;
}

export function resolveDialogueAnchor(source,g){
  if(!source||!g)return null;
  const entity=source.boss?g.enemies?.find(e=>e.boss===source.boss):g.room?.objects?.find(o=>o.id===source.id);
  return {x:finite(entity?.x,finite(source.x)),y:finite(entity?.y,finite(source.y,520))};
}

export class WorldDialogueState{
  constructor({voices={}}={}){this.voices=voices;this.reset();}
  get current(){return this.active;}
  reset(){this.active=null;this.seen=new Set();this.quiet=1200;this.revision=(this.revision||0)+1;}
  begin(lines,source,{manual=true,kind='conversation',duration=null}={}){
    const pages=paginateDialogue(lines);if(!pages.length||!source||typeof source.room!=='string')return false;
    // A passing environmental voice must never replace someone you chose to hear.
    if(!manual&&this.active?.manual)return false;
    const safeSource={...source,x:finite(source.x),y:finite(source.y,520)};
    this.active={lines:pages,index:0,source:safeSource,room:source.room,manual,kind,elapsed:0,duration:duration??Math.max(6000,Math.min(14000,pages[0][1].length*55))};
    this.revision++;return true;
  }
  advance(){
    if(!this.active?.manual)return false;
    if(this.active.index+1<this.active.lines.length){this.active.index++;this.active.elapsed=0;this.revision++;}
    else this.dismiss();return true;
  }
  dismiss({cooldown=3500}={}){this.active=null;this.quiet=cooldown;this.revision++;}
  update(g,deltaMs,{suspended=false}={}){
    if(!g||g.phase!=='playing'){if(this.active)this.dismiss();return;}
    if(this.active&&this.active.room!==g.roomId)this.dismiss({cooldown:900});
    if(suspended||g.paused||g.hitstop||g.player?.respawning)return;
    const elapsed=Math.max(0,Math.min(100,finite(deltaMs)));
    this.quiet=Math.max(0,this.quiet-elapsed);
    if(this.active){
      const a=this.active,anchor=resolveDialogueAnchor(a.source,g),range=a.kind==='boss'?1400:a.manual?350:(a.source.range||190)+140;
      if(!anchor||Math.abs(g.player.x-anchor.x)>range||Math.abs(g.player.y-anchor.y)>(a.kind==='boss'?1000:260)){this.dismiss();return;}
      a.elapsed+=elapsed;
      if(!a.manual&&a.elapsed>=a.duration){
        if(a.index+1<a.lines.length){a.index++;a.elapsed=0;a.duration=Math.max(6000,Math.min(14000,a.lines[a.index][1].length*55));this.revision++;}
        else this.dismiss();
      }
      return;
    }
    if(this.quiet||g.player.hp<=0||g.enemies?.some(e=>e.hp>0&&Math.abs(e.x-g.player.x)<280&&Math.abs(e.y-g.player.y)<180))return;
    const candidates=(this.voices[g.roomId]||[]).filter(v=>!this.seen.has(g.roomId+':'+v.id)&&Math.abs(v.x-g.player.x)<(v.range||190)&&Math.abs((v.y??520)-g.player.y)<150).sort((a,b)=>Math.abs(a.x-g.player.x)-Math.abs(b.x-g.player.x));
    const voice=candidates[0];if(!voice)return;
    if(this.begin([[voice.speaker,voice.text]],{...voice,room:g.roomId,id:voice.anchorId||voice.id,kind:'landmark'},{manual:false,kind:'whisper'}))this.seen.add(g.roomId+':'+voice.id);
  }
  snapshot(){
    const a=this.active;
    return a?{active:true,kind:a.kind,manual:a.manual,speaker:a.lines[a.index][0],text:a.lines[a.index][1],index:a.index,total:a.lines.length,source:{...a.source},room:a.room,elapsed:a.elapsed}:{active:false,kind:null,manual:false,speaker:'',text:'',index:0,total:0,source:null,room:null,elapsed:0};
  }
}
