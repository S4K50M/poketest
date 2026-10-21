const REALMS={
 moss:{number:'01',name:'Mourningwild',icon:'❧',color:'#b9dfae',story:'Beneath the old forest, something is learning to remember.'},
 forge:{number:'02',name:'Cinder Cathedral',icon:'♜',color:'#ffbc8c',story:'The city still burns. Its bells are breathing in the dark.'},
 reef:{number:'03',name:'The Drowned Archive',icon:'≈',color:'#9be8e5',story:'A thousand untold stories sleep beneath the turning tide.'},
 storm:{number:'04',name:'Thundersong Spires',icon:'ϟ',color:'#d5c4ff',story:'Listen between the thunder. Every lost voice leaves a song.'},
 frost:{number:'05',name:'Pale Meridian',icon:'❄',color:'#d0f1ff',story:'Beyond the white horizon, a single moment refuses to end.'},
 rift:{number:'06',name:'The Hollow Crown',icon:'◈',color:'#f5b4d6',story:'At the end of every road, the Worldheart waits for its family.'},
};

/** The title screen has no simulation or save ownership. */
export function initLanding({onBiome=()=>{},onReplay=()=>{}}={}){
 const root=document.getElementById('home-screen');if(!root)return {update(){},destroy(){}};
 const tabs=[...root.querySelectorAll('[data-landing-tab]')],listeners=[];
 const listen=(node,event,fn)=>{node.addEventListener(event,fn);listeners.push(()=>node.removeEventListener(event,fn));};
 let activeBiome='moss';
 function selectTab(name,{focus=false}={}){
  for(const tab of tabs){const selected=tab.dataset.landingTab===name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;const panel=document.getElementById(tab.getAttribute('aria-controls'));if(panel)panel.hidden=!selected;if(selected&&focus)tab.focus({preventScroll:true});}
  root.dataset.journal=name;
 }
 function previewBiome(id){
  const realm=REALMS[id];if(!realm||root.dataset.biome===id)return;activeBiome=id;root.dataset.biome=id;root.style.setProperty('--landing-color',realm.color);
  document.getElementById('landing-realm-name').textContent=realm.name;document.getElementById('landing-realm-number').textContent='GATE '+realm.number+' / 06';document.getElementById('landing-realm-icon').textContent=realm.icon;document.getElementById('landing-realm-story').textContent=realm.story;
  root.querySelectorAll('.biome-card').forEach(card=>card.classList.toggle('previewed',card.dataset.mapRegion===id));onBiome(id);
 }
 for(const tab of tabs){listen(tab,'click',()=>selectTab(tab.dataset.landingTab));listen(tab,'keydown',event=>{
  let index=tabs.indexOf(tab);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();selectTab(tabs[index].dataset.landingTab,{focus:true});
 });}
 const realms=document.getElementById('biome-cards');for(const event of ['pointerover','focusin'])listen(realms,event,e=>{const card=e.target.closest('[data-map-region]');if(card&&realms.contains(card))previewBiome(card.dataset.mapRegion);});
 listen(document.getElementById('replay-intro'),'click',()=>onReplay());
 selectTab('kindred');previewBiome('moss');
 return {
  update({saved=null,party=[],reducedMotion=false}={}){
   root.classList.toggle('motion-paused',!!reducedMotion);
   const count=Math.min(6,Array.isArray(saved?.fragments)?saved.fragments.length:0);document.getElementById('landing-fragments').textContent=String(count).padStart(2,'0')+' / 06';document.getElementById('landing-status').textContent=saved?'JOURNEY IN PROGRESS':'UNWRITTEN JOURNEY';
   root.dataset.partyCount=String(party.length||3);root.querySelectorAll('.biome-card').forEach(card=>card.classList.toggle('previewed',card.dataset.mapRegion===activeBiome));
  },
  destroy(){listeners.forEach(off=>off());},
 };
}
