// Each dimension has a gatekeeper on its main route and a stronger optional vault encounter.
const gates=[
  ['moss','heartwood','#b4dc91','The Rootbound Executioner','The Carrion Gardener','The roots chained their first protector to the gate. Its garden has learned to hunt.'],
  ['forge','ember','#ffae6f','The Furnace Bailiff','The Cinder Confessor','The cathedral still collects its debt. Its last confession was a scream in molten iron.'],
  ['reef','pearl','#91dfef','The Drowned Gaoler','The Page-Eater','These wardens drowned with the prisoners whose stories they were ordered to erase.'],
  ['storm','stormglass','#d5bcff','The Thunder Magistrate','The Bellbreaker','The sky is a court without mercy. The verdict arrives before the thunder.'],
  ['frost','frostcore','#bce8ff','The Meridian Headsman','The White Mourner','A frozen sentence can last forever. Some mourners now seek a second ending.'],
  ['rift','riftglass','#ffa7cd','The Hollow Witness','The Unwritten Butcher','They saw the first fracture from the other side. They have been rehearsing your arrival.'],
];
export const MINIBOSSES=Object.fromEntries(gates.flatMap(([biome,material,color,warden,reaver,lore],i)=>[
  [biome+'-warden',{name:warden,epithet:'DIMENSIONAL GATEKEEPER',biome,material,color,hp:420+i*90,miniboss:true,encounter:'warden',reward:null,lore}],
  [biome+'-reaver',{name:reaver,epithet:'WARDEN OF THE FORBIDDEN VAULT',biome,material,color,hp:500+i*100,miniboss:true,encounter:'reaver',reward:null,lore}],
]));
