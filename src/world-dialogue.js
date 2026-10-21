const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

/** Presentation only: the host owns dialogue, progression, timing and inputs. */
export function initWorldDialogue({parent=document.getElementById('game-screen'),onAdvance=()=>{},onDismiss=()=>{}}={}){
 if(!parent)throw new Error('World dialogue requires a scene parent.');
 const doc=parent.ownerDocument,element=doc.createElement('section');
 element.id='world-dialogue';element.className='world-dialogue';element.hidden=true;element.setAttribute('aria-label','A voice in the world');
 element.innerHTML='<div class="world-dialogue-copy"><p class="world-dialogue-byline"><span class="world-dialogue-sigil" aria-hidden="true">✧</span><span id="world-dialogue-speaker"></span><small id="world-dialogue-count" aria-hidden="true"></small></p><p id="world-dialogue-text" aria-live="polite" aria-atomic="true"></p><div class="world-dialogue-actions"><button type="button" data-world-dialogue-next aria-label="Continue conversation"><span class="world-dialogue-key" aria-hidden="true">E</span><span class="world-dialogue-next-label">Continue</span><span aria-hidden="true">→</span></button><button type="button" data-world-dialogue-close aria-label="Leave conversation"><span aria-hidden="true">×</span><small>Leave</small></button></div></div><i class="world-dialogue-thread" aria-hidden="true"></i><i class="world-dialogue-mark" aria-hidden="true"></i>';
 parent.append(element);
 const speaker=element.querySelector('#world-dialogue-speaker'),text=element.querySelector('#world-dialogue-text'),count=element.querySelector('#world-dialogue-count'),actions=element.querySelector('.world-dialogue-actions'),next=element.querySelector('[data-world-dialogue-next]'),nextLabel=element.querySelector('.world-dialogue-next-label'),close=element.querySelector('[data-world-dialogue-close]'),thread=element.querySelector('.world-dialogue-thread'),mark=element.querySelector('.world-dialogue-mark');
 let shown=false,signature='',measureKey='',measuredHeight=0;
 const advance=e=>{e.stopPropagation();onAdvance();},dismiss=e=>{e.stopPropagation();onDismiss();};
 next.addEventListener('click',advance);close.addEventListener('click',dismiss);
 function show({speaker:voice='The Worldheart',text:words='',index=0,total=1,manual=false,color='#dce4ba',kind='voice',reducedMotion=false}={}){
  const current=JSON.stringify([voice,words,index,total,manual,color,kind,reducedMotion]);shown=true;element.hidden=false;
  if(current===signature)return;signature=current;measureKey='';
  speaker.textContent=String(voice);text.textContent=String(words);text.scrollTop=0;
  count.textContent=manual&&total>1?`${index+1} / ${total}`:'';actions.hidden=!manual;nextLabel.textContent=index>=total-1?'Finish':'Continue';
  next.setAttribute('aria-label',index>=total-1?'Finish conversation':'Continue conversation');element.dataset.manual=String(!!manual);element.dataset.kind=String(kind);element.classList.toggle('world-dialogue-still',!!reducedMotion);element.style.setProperty('--dialogue-color',color);
 }
 function place({x,y,width=parent.clientWidth,height=parent.clientHeight,mobile=false}={}){
  if(!shown||element.hidden)return;
  const w=Math.max(1,finite(width,1)),h=Math.max(1,finite(height,1)),ax=finite(x,w*.5),ay=finite(y,h*.55);
  const margin=w<600?18:24,copyWidth=Math.max(120,Math.min(mobile?(w<700?300:350):430,w-margin*2));
  const safeTop=mobile?(h<360?75:88):Math.min(106,h*.2),safeBottom=mobile?(h<360?94:110):74;
  const available=Math.max(110,h-safeTop-safeBottom),manual=element.dataset.manual==='true',textMax=Math.max(52,available-(manual?74:28));
  const key=[copyWidth,h,mobile,signature].join('|');
  if(key!==measureKey){
   element.style.width=copyWidth+'px';element.style.setProperty('--dialogue-text-max-height',textMax+'px');element.classList.toggle('world-dialogue-mobile',!!mobile);
   measuredHeight=element.offsetHeight;measureKey=key;
  }
  const boxHeight=measuredHeight||120;
  // Keep the speaker's body clear by placing the words beside their head.
  const preferredLeft=ax<w*.55?ax+25:ax-copyWidth-25;
  const left=clamp(preferredLeft,margin,Math.max(margin,w-copyWidth-margin));
  const top=clamp(ay-boxHeight*.78,safeTop,Math.max(safeTop,h-safeBottom-boxHeight));
  element.style.transform=`translate3d(${left.toFixed(2)}px,${top.toFixed(2)}px,0)`;
  // A light thread and seed mark locate the voice without a speech-card border.
  const targetX=clamp(ax-left,8-margin,copyWidth+margin-8),targetY=clamp(ay-top,0,Math.max(boxHeight+45,h-top-safeBottom));
  const startX=clamp(targetX,12,copyWidth-12),startY=boxHeight-9,dx=targetX-startX,dy=targetY-startY,length=Math.hypot(dx,dy);
  thread.style.left=startX+'px';thread.style.top=startY+'px';thread.style.width=Math.min(64,length)+'px';thread.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;thread.hidden=length<10;
  mark.style.left=targetX+'px';mark.style.top=targetY+'px';
 }
 return {element,show,place,setVisible(visible){element.hidden=!shown||!visible;},hide(){shown=false;element.hidden=true;},destroy(){next.removeEventListener('click',advance);close.removeEventListener('click',dismiss);element.remove();}};
}
