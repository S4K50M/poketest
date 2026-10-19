// The Unwritten Chronicle: optional RPG arcs woven through the six-fragment campaign.
// This module is deliberately pure data. It can be imported by world, engine and UI
// without importing them back or mutating an already loaded save.

export const FACTIONS = {
  wardens: {
    id: 'wardens', name: 'The Lantern Compact', short: 'COMPACT', color: '#efc68b', icon: '⌂',
    motto: 'No life is expendable. No memory is lost.', leader: 'Captain Cairn',
    description: 'Keepers of the Waylights. They shelter the lost inside the Worldheart, even if shelter becomes a beautiful prison.',
    belief: 'A remembered person is still a person. Breaking the cycle may erase the only homes they have.',
    benefit: 'Shelter oath: +1 maximum heart for each active companion.',
    boon: { hearts: 1 },
    cost: 'The Worldheart must remain a refuge. Vell can survive, but the doors can never close.',
  },
  chorus: {
    id: 'chorus', name: 'The Drowned Choir', short: 'CHOIR', color: '#9ae6e4', icon: '≈',
    motto: 'A voice is not a thing to keep.', leader: 'Morrow Nine',
    description: 'Creatures who can hear the lives inside memory pearls. They want every captive voice released, even if freedom means becoming something new.',
    belief: 'The Worldheart has carried a century of unfinished goodbyes. It deserves a chance to sing for itself.',
    benefit: 'Resonance oath: +20% Focus restored by attacking.',
    boon: { focus: 1.2 },
    cost: 'The lost may return as rain, roots, or strangers. No one can promise they will remember you.',
  },
  unwritten: {
    id: 'unwritten', name: 'The Unwritten', short: 'UNWRITTEN', color: '#d7b7ff', icon: '✧',
    motto: 'The next page belongs to the living.', leader: 'Pip of the Blank Page',
    description: 'Runaways, new creatures, and broken echoes the old world never recorded. They intend to make a future the Worldheart cannot predict.',
    belief: 'Love cannot require a perfect copy of yesterday. Let the world grow beyond its memories.',
    benefit: 'Freedom oath: dash cooldown reduced by 3 frames.',
    boon: { dashCooldown: -3 },
    cost: 'Some roads will vanish forever. Vell must decide who she is without a promise to repeat.',
  },
};

// Objective kinds are event-oriented. A target is an NPC talk id, enemy/boss id,
// room id, fully qualified memory/shrine id, crafted item id, or faction id.
// Prerequisites refer only to other quest ids; optional objectives never gate the
// six main guardian rewards. Rewards are claimed once and are saved by quest id.
export const QUESTS = {
  firstMargin: {
    id: 'firstMargin', name: 'A Map With Your Name Missing', giver: 'Iona Hundredfold', giverId: 'iona', turnIn: 'iona', requires: [], prerequisites: [],
    description: 'Iona has charted every traveler who ever reached the Last Lantern. Your name is the first one her living map refuses to remember.',
    objectives: [
      { kind: 'talk', target: 'iona', count: 1, label: 'Speak to Iona at the Last Lantern' },
      { kind: 'visit', target: 'moss-path', count: 1, label: 'Carry her blank map into the Mourningwild' },
      { kind: 'memory', target: 'moss-path:lore', count: 1, label: 'Read Vell’s first field note' },
    ],
    reward: { xp: 45, lumens: 20, materials: { heartwood: 2 } },
    autoStart: true, chapter: 0, faction: null,
    completion: 'The map draws a new road while you watch. Iona is laughing and crying. For a hundred years it has only copied old ones.',
  },
  borrowedSun: {
    id: 'borrowedSun', name: 'The Sun Beneath the Ash', giver: 'Captain Cairn', giverId: 'cairn', turnIn: 'cairn', requires: [], prerequisites: [],
    description: 'A folded dawn is trapped in the Clockwork Ossuary. Cairn asks you to bring back its light, not destroy the creatures protecting it.',
    objectives: [
      { kind: 'talk', target: 'cairn', count: 1, label: 'Hear the Captain’s request' },
      { kind: 'visit', target: 'clockwork-ossuary', count: 1, label: 'Enter the Clockwork Ossuary' },
      { kind: 'kill', target: 'belltwin', count: 1, label: 'Free the dawn from the Saint of Two Dawns' },
    ],
    reward: { xp: 100, lumens: 55, materials: { ember: 4 }, item: 'sunseed' },
    autoStart: false, chapter: 1, faction: 'wardens',
    completion: 'Inside the Widow’s brass cocoon is a single warm seed. Cairn finally lifts his visor: there is a garden growing where a face should be.',
  },
  deadLetters: {
    id: 'deadLetters', name: 'Dead Letters, Living Teeth', giver: 'Morrow Nine', giverId: 'morrow', turnIn: 'morrow', requires: [], prerequisites: [],
    description: 'The Archive’s forgotten correspondence has grown hungry. Recover three voices before the Paper Moon eats their names.',
    objectives: [
      { kind: 'talk', target: 'morrow', count: 1, label: 'Listen to Morrow Nine' },
      { kind: 'kill', target: 'candlewraith', count: 3, label: 'Unfold three hungry lanterns' },
      { kind: 'memory', target: 'paper-moon:last-letter', count: 1, label: 'Read the letter that was never delivered' },
    ],
    reward: { xp: 90, lumens: 45, materials: { pearl: 4 } },
    autoStart: false, chapter: 2, faction: 'chorus',
    completion: 'The last letter is addressed to the Worldheart: “You do not have to be useful for us to love you.” Its sender was Vell.',
  },
  ninthName: {
    id: 'ninthName', name: 'The Ninth Name', giver: 'Morrow Nine', giverId: 'morrow', turnIn: 'morrow', requires: ['deadLetters'],
    description: 'Morrow remembers eight of the names in its shell. The ninth is being sung by a creature that mistakes silence for death.',
    objectives: [
      { kind: 'kill', target: 'palimpsest', count: 1, label: 'End the Palimpsest’s unfinished song' },
      { kind: 'tool', target: 'paper-moon:choir-echo', count: 1, label: 'Raise the Echo Lantern at the empty music stand' },
    ],
    prerequisites: ['deadLetters'],
    reward: { xp: 130, lumens: 65, materials: { pearl: 3 }, item: 'choirbell' },
    autoStart: true, chapter: 2, faction: 'chorus',
    completion: 'The ninth name is Morrow’s own. It was never nine dead creatures in a shell. It was one creature learning to live with grief.',
  },
  tomorrowSmuggler: {
    id: 'tomorrowSmuggler', name: 'A Smuggler of Tomorrows', giver: 'Pip of the Blank Page', giverId: 'pip', turnIn: 'pip', requires: [], prerequisites: [],
    description: 'Pip has stolen something impossible from the frozen vault: an egg with no memory inside it. Help carry its future through the old world.',
    objectives: [
      { kind: 'talk', target: 'pip', count: 1, label: 'Meet the courier beneath Pale Meridian' },
      { kind: 'visit', target: 'cradle-zero', count: 1, label: 'Reach the cradle the maps forgot' },
      { kind: 'kill', target: 'clockscarab', count: 3, label: 'Drive away three searching clockscarabs' },
    ],
    reward: { xp: 110, lumens: 55, materials: { frostcore: 4 }, item: 'blankegg' },
    autoStart: false, chapter: 4, faction: 'unwritten',
    completion: 'The egg moves when you speak to it. Pip has no idea what will hatch. That is precisely why it matters.',
  },
  vellLastDay: {
    id: 'vellLastDay', name: 'The Professor’s Last Day', giver: 'Iona Hundredfold', giverId: 'iona', turnIn: 'iona', requires: ['firstMargin'],
    description: 'Three witnesses remember three different endings for Vell. Find what they all left out.',
    objectives: [
      { kind: 'memory', target: 'clockwork-ossuary:death-certificate', count: 1, label: 'Find the death certificate beneath the cathedral' },
      { kind: 'memory', target: 'paper-moon:last-letter', count: 1, label: 'Read the undelivered farewell' },
      { kind: 'memory', target: 'cradle-zero:first-promise', count: 1, label: 'Hear the promise recorded before your birth' },
      { kind: 'talk', target: 'vell-truth', count: 1, label: 'Ask Vell who lights the Waylights' },
    ],
    prerequisites: ['firstMargin'],
    reward: { xp: 180, lumens: 80, materials: { riftglass: 3 }, item: 'vellletter' },
    autoStart: true, chapter: 2, reveal: 'vell-echo',
    completion: 'The real Vell died opening the cage. This Vell is the Worldheart keeping her final promise. Every Waylight is lit with one of her memories. She never told you because she was afraid you would stop coming home.',
  },
  firstFuture: {
    id: 'firstFuture', name: 'The First Future', giver: 'Pip of the Blank Page', giverId: 'pip', turnIn: 'pip', requires: ['tomorrowSmuggler'],
    description: 'The cradle’s first guardian was ordered to keep tomorrow safe. It has decided the safest tomorrow is one that never arrives.',
    objectives: [
      { kind: 'kill', target: 'nullheart', count: 1, label: 'Return after the Sovereign and face the Nullheart' },
      { kind: 'tool', target: 'cradle-zero:unwritten-echo', count: 1, label: 'Light the lantern beside the unrecorded cradle' },
    ],
    prerequisites: ['tomorrowSmuggler'],
    reward: { xp: 150, lumens: 75, materials: { frostcore: 3, riftglass: 2 }, item: 'futurekey' },
    autoStart: true, chapter: 4, faction: 'unwritten',
    completion: 'The cradle is your size. You were not restored from a dead life. You are the first new heartbeat the Worldheart has made in a century. Tomorrow has already begun.',
  },
  heartOath: {
    id: 'heartOath', name: 'A Heart Is Not a Kingdom', giver: 'Professor Vell', giverId: 'vell', turnIn: 'vell', requires: ['firstMargin'],
    description: 'The Compact offers a refuge. The Choir offers release. The Unwritten offer a future. A living world will need more than a repaired crown. Choose the promise you will carry below.',
    objectives: [
      { kind: 'kill', target: 'hourglass', count: 1, label: 'Recover the frozen moment from the Hourglass Stag' },
      { kind: 'faction', target: 'any', count: 1, label: 'Swear an oath at the Last Lantern' },
      { kind: 'kill', target: 'crown', count: 1, label: 'Awaken the Hollow Sovereign' },
    ],
    prerequisites: ['firstMargin'],
    reward: { xp: 200, lumens: 100, materials: { riftglass: 5 } },
    autoStart: true, chapter: 4, reveal: 'last-confrontation',
    completion: 'The Sovereign was never the last enemy. Something inside the heart has been listening to the promise you chose. Now it asks you to prove it.',
  },
};

export const CHRONICLE_ENEMIES = {
  candlewraith:{name:'Candlewraith',types:'FIRE / MEMORY',hp:38,xp:28,coins:12,color:'#f2d2a8',speed:1.7,height:48,hint:'A hungry ghost lantern fires a three-flame fan. Jump or dash through its clearly marked windup.',lore:'The Archive lit candles for letters that would never be read. The candles learned the names.'},
  clockscarab:{name:'Clockscarab',types:'ICE / MACHINE',hp:46,xp:30,coins:13,color:'#c1d8ef',speed:2,height:36,hint:'Its clock face flashes before a fast rolling charge. Leap over it and punish the recovery.',lore:'A clockwork nursery beetle built to wind the future. Its key has been turning for a century.'},
  oathbound:{name:'Oathbound',types:'STEEL / MEMORY',hp:58,xp:35,coins:15,color:'#ddba8c',speed:1.2,height:60,hint:'A hollow sentinel raises its greatsword before charging. The broken armor hides a long recovery.',lore:'A promise can outlive the person who made it. Sometimes it should be allowed to rest.'},
  hushling:{name:'Hushling',types:'INK / VOID',hp:40,xp:30,coins:13,color:'#c9a8e5',speed:2.1,height:45,hint:'An ink child slips behind you and leaves a slowing sigil. Keep moving after it disappears.',lore:'Not every silence is empty. Some are waiting for someone to ask their name.'},
};

export const CHRONICLE_BOSSES = {
  belltwin: {
    id: 'belltwin', name: 'The Saint of Two Dawns', epithet: 'MOTHER OF TOMORROW’S SUN',
    biome: 'forge', hp: 380, color: '#f0bc72', reward: null, material: 'ember',
    optional: true, guardian: false, faction: 'wardens', mechanic: 'bellweb',
    phases: ['Threads of the dawn', 'A thousand borrowed suns'],
    lore: 'Two bronze saints share one body: one rings for yesterday, one for tomorrow. Between their bells they have kept a small dawn alive. Neither dares be the first to fall silent.',
    defeat: 'Her brass shell opens into a greenhouse. The light was not stolen. She had been growing a new sun.',
    arena: 'clockwork-ossuary', rewardItem: 'sunseed',
  },
  palimpsest: {
    id: 'palimpsest', name: 'The Palimpsest', epithet: 'EATER OF THE LAST WORD',
    biome: 'reef', hp: 440, color: '#a7e0d8', reward: null, material: 'pearl',
    optional: true, guardian: false, faction: 'chorus', mechanic: 'inkscript',
    phases: ['Read between the teeth', 'The unsent goodbye'],
    lore: 'An immense living book, carried by hands made of crossed-out names. It eats the ends of letters so nobody has to say goodbye. Its first meal was its own name.',
    defeat: 'The shell unfolds into a thousand paper boats. For the first time, they are sailing somewhere.',
    arena: 'paper-moon', rewardItem: 'choirbell',
  },
  nullheart: {
    id: 'nullheart', name: 'The Nullheart', epithet: 'THE FUTURE THAT FEARS ITSELF',
    biome: 'frost', hp: 720, color: '#dfb7ff', reward: null, material: 'riftglass',
    optional: true, guardian: false, finale: true, mechanic: 'oathmirror',
    requires: { bosses: ['belltwin', 'palimpsest', 'crown'], faction: true },
    phases: ['Nothing can hurt you here', 'Nothing can become you here'],
    lore: 'A celestial mechanical heart with empty cradles orbiting inside a crown of pale metal. It was built to protect tomorrow. It has decided the safest tomorrow is one that never arrives. When the Worldheart wakes, the window fills with the perfect version of the promise you chose.',
    defeat: 'The lullaby stops. A tiny, entirely unfamiliar sound answers from the cradle. Tomorrow has permission to arrive.',
    arena: 'cradle-zero', rewardItem: 'futurekey',
    lockedMessage: 'THE CRADLE IS SLEEPING · FREE THE SAINT OF TWO DAWNS AND PALIMPSEST, AWAKEN THE SOVEREIGN, AND CHOOSE AN OATH',
    variants: {
      wardens: { name: 'Vell, the Perfect Memory', color: '#f5cf94', mechanic: 'memorycascade', phases: ['I can bring everyone back', 'Please do not make me forget'], story: 'The cradle fills with a perfect Vell assembled from the memories she spent protecting you. She can preserve every lost life, but only by filing the living beside them. Defeat her certainty without destroying her kindness.' },
      chorus: { name: 'The First Chorus', color: '#a1eee5', mechanic: 'tidechoir', phases: ['We remember everything', 'Will you remember us?'], story: 'Every stored voice tries to leave the heart at once. Their joy becomes a storm that can erase the living world. Fight inside the song until freedom learns to be gentle.' },
      unwritten: { name: 'The Unwritten Heir', color: '#dfb7ff', mechanic: 'mirrorfuture', phases: ['Every road you could have taken', 'A future no one can promise'], story: 'The cradle shows you the perfect child the heart planned you to become. Your possible future fights with borrowed shapes, terrified that your freedom means it will never exist. Offer it a hand, never a throne.' },
    },
  },
};

export const CHRONICLE_NPCS = {
  iona: {
    id: 'iona', name: 'Iona Hundredfold', title: 'Cartographer of impossible roads',
    room: 'sanctuary', x: 900, kind: 'npc', talk: 'iona', color: '#f2d6a7',
    appearance: 'A tiny six-winged map moth in a surveyor’s coat. Her wings are a living atlas; an extra eye opens whenever she discovers a road.',
    service: 'chronicle', quests: ['firstMargin', 'vellLastDay'],
    history: 'Iona has drawn the same expedition ninety-nine times. She kept every failed map because Vell always asked for one more.',
  },
  cairn: {
    id: 'cairn', name: 'Captain Cairn', title: 'The garden inside the armor',
    room: 'clockwork-ossuary', x: 385, kind: 'npc', talk: 'cairn', color: '#f0bc72',
    appearance: 'An empty bronze stag-knight’s armor full of flowers, seedlings, and two anxious fireflies where the eyes should be.',
    service: 'faction', faction: 'wardens', quests: ['borrowedSun'],
    history: 'The last Compact captain died carrying a greenhouse out of the cathedral. The plants kept his armor walking.',
  },
  morrow: {
    id: 'morrow', name: 'Morrow Nine', title: 'The listener with nine voices',
    room: 'paper-moon', x: 380, kind: 'npc', talk: 'morrow', color: '#a7e0d8',
    appearance: 'A glass-shell snail carrying a miniature paper cathedral. Colored voices drift beneath its shell like koi.',
    service: 'faction', faction: 'chorus', quests: ['deadLetters', 'ninthName'],
    history: 'A keeper of farewells who mistook its own loneliness for a duty to remember everyone alone.',
  },
  pip: {
    id: 'pip', name: 'Pip of the Blank Page', title: 'Courier of things that do not exist yet',
    room: 'cradle-zero', x: 385, kind: 'npc', talk: 'pip', color: '#d6befe',
    appearance: 'A long-eared origami ferret in a patched courier cape. Its ink tail redraws its own tracks when no one is watching.',
    service: 'faction', faction: 'unwritten', quests: ['tomorrowSmuggler', 'firstFuture'],
    history: 'Nobody remembers making Pip. It considers this the nicest thing anyone has ever said about it.',
  },
};

const floor = width => ({ x: 0, y: 520, w: width, h: 260 });

export const CHRONICLE_ROOMS = {
  'clockwork-ossuary': {
    id: 'clockwork-ossuary', name: 'The Clockwork Ossuary', biome: 'forge', width: 2800,
    subtitle: 'The dead city was planting something', optional: true, mapX: 7, mapY: 23,
    platforms: [floor(2800), { x: 665, y: 405, w: 170, h: 25 }, { x: 940, y: 295, w: 175, h: 25 }, { x: 1270, y: 390, w: 180, h: 25 }, { x: 1620, y: 280, w: 180, h: 25 }, { x: 2250, y: 390, w: 160, h: 25 }],
    anchors: [{ x: 1025, y: 165 }, { x: 1720, y: 150 }, { x: 2260, y: 180 }],
    enemies: [{ kind: 'oathbound', x: 760 }, { kind: 'oathbound', x: 1260 }, { kind: 'hushling', x: 1510 }, { kind: 'warden', boss: 'belltwin', x: 2170 }],
    relics: [{ id: 'ossuary-dawn', x: 1700, y: 220 }],
    structures: ['greenhouse-bell', 'brass-cocoons', 'seedling-pipes'],
    objects: [
      { id: 'return', kind: 'door', x: 95, to: 'forge-path', name: 'Return to Pilgrim’s Furnace' },
      { id: 'bench', kind: 'bench', x: 245, name: 'The Gardener’s Waylight' },
      { ...CHRONICLE_NPCS.cairn },
      { id: 'death-certificate', kind: 'memory', x: 565, name: 'The Professor’s Death Certificate', text: 'CINDER INFIRMARY · YEAR OF THE FRACTURE|VELL, PROFESSOR. Cause: deliberate entry into an active containment breach. Last words: “If the heart remembers me, ask it to be kind.” No body was recovered. A small lantern continued burning.' },
      { id: 'seed-cache', kind: 'cache', x: 1345, y: 390, name: 'The Last Gardener’s Satchel', material: 'ember', rare: true },
      { id: 'ore', kind: 'ore', x: 1845, name: 'A Vein of Captive Sunrise', material: 'ember' },
      { id: 'sun-echo', kind: 'shrine', x: 2550, name: 'A Sun Small Enough to Carry' },
      { id: 'home', kind: 'door', x: 2690, to: 'sanctuary', name: 'Bring the Dawn Home', defeatedBoss: 'belltwin' },
    ],
  },
  'paper-moon': {
    id: 'paper-moon', name: 'The Paper Moon', biome: 'reef', width: 2850,
    subtitle: 'Every goodbye has somewhere to go', optional: true, mapX: 33, mapY: 92,
    platforms: [floor(2850), { x: 680, y: 405, w: 180, h: 25 }, { x: 1010, y: 300, w: 175, h: 25 }, { x: 1350, y: 385, w: 170, h: 25 }, { x: 1710, y: 280, w: 170, h: 25 }, { x: 2260, y: 385, w: 170, h: 25 }],
    anchors: [{ x: 1070, y: 150 }, { x: 1770, y: 145 }, { x: 2320, y: 180 }],
    enemies: [{ kind: 'candlewraith', x: 745 }, { kind: 'candlewraith', x: 1115 }, { kind: 'candlewraith', x: 1480 }, { kind: 'hushling', x: 1765 }, { kind: 'warden', boss: 'palimpsest', x: 2250 }],
    relics: [{ id: 'paper-moon-song', x: 1100, y: 240 }, { id: 'paper-moon-name', x: 1785, y: 220 }],
    structures: ['paper-moon', 'bottle-stars', 'folded-boats'],
    objects: [
      { id: 'return', kind: 'door', x: 95, to: 'reef-path', name: 'Return to the Sunken Stacks' },
      { id: 'bench', kind: 'bench', x: 245, name: 'The Unsent Waylight' },
      { ...CHRONICLE_NPCS.morrow },
      { id: 'last-letter', kind: 'memory', x: 580, name: 'The Letter Vell Never Sent', text: 'DEAR WORLDHEART|They will call what I did treason. They will call what you are a machine. Neither word will be true. You do not have to be useful for us to love you. When I open the cage, please do not spend forever trying to bring me back. — Vell' },
      { id: 'letter-cache', kind: 'cache', x: 1435, y: 385, name: 'A Hundred Unsent Wishes', material: 'pearl', rare: true },
      { id: 'ore', kind: 'ore', x: 1885, name: 'Pearl of an Unsaid Name', material: 'pearl' },
      { id: 'choir-echo', kind: 'shrine', x: 2610, name: 'The Empty Music Stand', quest: 'ninthName' },
      { id: 'home', kind: 'door', x: 2740, to: 'sanctuary', name: 'Carry the Last Song Home', defeatedBoss: 'palimpsest' },
    ],
  },
  'cradle-zero': {
    id: 'cradle-zero', name: 'Cradle Zero', biome: 'frost', width: 2900,
    subtitle: 'A future without a memory', optional: true, mapX: 93, mapY: 65,
    platforms: [floor(2900), { x: 640, y: 405, w: 170, h: 25 }, { x: 945, y: 295, w: 170, h: 25 }, { x: 1260, y: 390, w: 175, h: 25 }, { x: 1600, y: 270, w: 180, h: 25 }, { x: 2310, y: 385, w: 170, h: 25 }],
    anchors: [{ x: 1030, y: 145 }, { x: 1705, y: 130 }, { x: 2350, y: 165 }],
    enemies: [{ kind: 'clockscarab', x: 750 }, { kind: 'clockscarab', x: 1170 }, { kind: 'clockscarab', x: 1580 }, { kind: 'hushling', x: 1830 }, { kind: 'warden', boss: 'nullheart', x: 2280 }],
    relics: [{ id: 'cradle-zero-tomorrow', x: 1680, y: 210 }],
    structures: ['empty-cradles', 'frozen-stars', 'white-tree'],
    objects: [
      { id: 'return', kind: 'door', x: 95, to: 'frost-path', name: 'Return to the Stillwood' },
      { id: 'bench', kind: 'bench', x: 245, name: 'The First Waylight' },
      { ...CHRONICLE_NPCS.pip },
      { id: 'first-promise', kind: 'memory', x: 565, name: 'The First Promise', text: 'WORLDHEART · UNDATED RECORDING|I can remember every life that was. But I want to meet someone who never was. Vell, if I make a new heartbeat, will it have to be alone? / VELL’S ECHO: No. I will keep a light for it. For as long as it takes.' },
      { id: 'egg-cache', kind: 'cache', x: 1350, y: 390, name: 'The Unopened Tomorrow', material: 'frostcore', rare: true },
      { id: 'ore', kind: 'ore', x: 1930, name: 'A Second That Has Not Happened', material: 'frostcore' },
      { id: 'unwritten-echo', kind: 'shrine', x: 2640, name: 'The Cradle With No Name', quest: 'firstFuture' },
      { id: 'home', kind: 'door', x: 2790, to: 'sanctuary', name: 'Bring Tomorrow Home', defeatedBoss: 'nullheart' },
    ],
  },
};

// Merge these into existing rooms' object arrays. Each branch remains optional;
// it opens when the player has the corresponding main-route traversal tool.
export const CHRONICLE_LINKS = {
  sanctuary: [{ ...CHRONICLE_NPCS.iona }],
  'forge-path': [{ id: 'ossuary-road', kind: 'door', x: 2070, to: 'clockwork-ossuary', name: 'Descend to the Clockwork Ossuary', ability: 'claw' }],
  'reef-path': [{ id: 'paper-road', kind: 'door', x: 2090, to: 'paper-moon', name: 'Follow the Paper Boats', ability: 'grapple' }],
  'frost-path': [{ id: 'cradle-road', kind: 'door', x: 2070, to: 'cradle-zero', name: 'Enter Cradle Zero', ability: 'wings' }],
};

export const CHRONICLE_ITEMS = {
  sunseed: { name: 'The Smallest Sun', icon: '☀', type: 'quest', description: 'A warm seed grown inside the Saint of Two Dawns. Proof that shelter can become a garden instead of a cage.' },
  choirbell: { name: 'Morrow’s Ninth Bell', icon: '♧', type: 'quest', description: 'A glass bell that answers only to a voice speaking its own name.' },
  blankegg: { name: 'The Blank Egg', icon: '◉', type: 'quest', description: 'There is no remembered creature inside. Something entirely new is trying to hatch.' },
  vellletter: { name: 'Vell’s Unsent Letter', icon: '✉', type: 'quest', description: '“You do not have to be useful for us to love you.” The ink is a century old. The promise is still warm.' },
  futurekey: { name: 'Key to a First Morning', icon: '⚷', type: 'quest', description: 'The Nullheart’s order, rewritten: protect a child’s future, never keep it from arriving.' },
};

export const HISTORY = [
  { unlock:{fragments:0}, id: 'first-pulse', era: 'Before the kingdoms', title: 'The First Pulse', text: 'The Worldheart was a living creature beneath the earth. It learned names by listening to roots, tides, and sleeping children. Its gift was remembering what the world might otherwise lose.' },
  { unlock:{fragments:1}, id: 'golden-contract', era: '143 years before the fracture', title: 'The Golden Contract', text: 'The First Council built cities around the heart’s warmth. They offered protection and called the agreement a partnership. By the third generation, the promise had become a deed of ownership.' },
  { unlock:{fragments:2}, id: 'stillness-accord', era: 'One year before the fracture', title: 'The Stillness Accord', text: 'The Council discovered that a dying creature could be remembered whole. They ordered the Worldheart to preserve every citizen forever. It tried. The songs of the living began to drown beneath the weight of the dead.' },
  { unlock:{fragments:3}, id: 'vell-refusal', era: 'The last day of the old world', title: 'The Professor’s Refusal', text: 'Professor Vell found a heartbeat inside the machine the Council claimed to own. She opened its locks. Six fragments of its memory fled into six wounded guardians, and the kingdom’s roads cracked apart.' },
  { requires:'vellLastDay', id: 'last-promise', era: 'The night of the fracture', title: 'A Light Left Burning', text: 'Vell did not survive the breach. The Worldheart remembered her final promise: no creature would have to find its way home alone. The first Waylight took her shape.' },
  { unlock:{boss:'belltwin'}, id: 'compact-founded', era: 'The first winter', title: 'The Lantern Compact', text: 'Cairn led the lost to the Waylights. His armor outlived him. The seedlings he rescued filled it with roots and kept walking. The Compact has never agreed whether its captain is a person or a garden.' },
  { unlock:{boss:'palimpsest'}, id: 'choir-begins', era: 'The drowning years', title: 'The Drowned Choir', text: 'The Archive sank when its stored voices grew heavier than stone. Morrow listened from the seabed and heard that not every remembered life wanted to remain a memory.' },
  { requires:'firstMargin', id: 'ninety-nine', era: 'The long century', title: 'Ninety-Nine Maps', text: 'Vell’s echo sent remembered travelers to gather the fragments. Each expedition found the same roads and failed in a different place. Iona kept the maps. Vell spent another memory to light the way again.' },
  { unlock:{fragments:5}, id: 'cradle', era: 'The first unrecorded morning', title: 'Cradle Zero', text: 'The Worldheart asked a question it had never asked before: could it make something new instead of remembering something lost? A cradle appeared outside every map. The Nullheart began its endless lullaby.' },
  { unlock:{boss:'nullheart'}, id: 'blank-page', era: 'Today', title: 'The Unwritten Traveler', text: 'Three companions reached the Last Lantern beside a traveler Iona’s map could not name. For the first time in a century, a road changed before anyone could remember it.' },
];

export const NPC_DIALOGUES = {
  iona: [
    ['Iona Hundredfold', 'Stop. Turn around. Again. Oh, that is wonderful. You have a shadow I have never drawn before.'],
    ['Iona Hundredfold', 'I mapped ninety-nine expeditions for the Professor. Same roads. Same brave little creatures. Different graves. This map has a space where your name should be.'],
    ['Iona Hundredfold', 'Take it to the Mourningwild. Read the Professor’s first field note. If the ink changes, come home and tell me. I have been waiting a century to be wrong.'],
  ],
  cairn: [
    ['Captain Cairn', 'Mind the seedlings. They are the reason the armor is standing, not decoration.'],
    ['Captain Cairn', 'Something beneath the cathedral has caught a dawn in its web. My people need light. The creature needs mercy. I am asking you because you know those can be the same task.'],
    ['Captain Cairn', 'The Compact keeps every life it can. Call it a cage if you must. A freezing child calls it a door that opens. Remember that when someone offers you a glorious ending.'],
  ],
  morrow: [
    ['Morrow Nine', 'One voice in my shell says welcome. Another says beware. The third is asking if you brought bread. Forgive it. Grief makes a poor breakfast.'],
    ['Morrow Nine', 'The letters above us have grown hungry. Unfold three of them, then read the letter beside the old quay. It was written to someone we all mistook for a machine.'],
    ['Morrow Nine', 'We are not asking you to burn the archive. We are asking you to open a window. A voice should get to choose where it belongs.'],
  ],
  pip: [
    ['Pip of the Blank Page', 'Before you ask: no, I did not steal the egg. I liberated a tomorrow from a terribly overprotective cupboard.'],
    ['Pip of the Blank Page', 'There is nothing remembered inside it. No old name. No destiny. I have never carried anything so heavy. Help me get it past those keyhole-faced hounds.'],
    ['Pip of the Blank Page', 'Everyone offers to bring yesterday back. I want to meet someone the world has never met. Do not let anyone make that sound like a smaller dream.'],
  ],
  'vell-truth': [
    ['Professor Vell', 'You found the certificate. And the letter. I had hoped… No. That is not fair. I hoped you would never have to ask.'],
    ['Professor Vell', 'The woman who opened the cage died a hundred years ago. I am what the Worldheart remembered of her. A promise in a borrowed coat.'],
    ['Professor Vell', 'Each Waylight costs a memory. Small things, at first. A favorite tea. A face from the laboratory. Yesterday I forgot the sound of my own mother’s name.'],
    ['Professor Vell', 'But when you come home, I know you. Somehow, that part grows instead of fading. Perhaps I am allowed to be someone she never was.'],
    ['Professor Vell', 'You were never another attempt to repair the past. You are the first life the heart made because it was curious about tomorrow. I am so glad I got to meet you.'],
  ],
  'oath-introduction': [
    ['Professor Vell', 'The heart is waking. When it does, every old promise will ask to be obeyed at once. We need to give it something kinder than another order.'],
    ['Professor Vell', 'Cairn would keep a refuge. Morrow would release the voices. Pip would leave a blank page. None of them can promise a painless dawn. Neither can I.'],
    ['Professor Vell', 'Choose the promise you can carry with your companions. Then let the heart answer. I will walk with you as far as I can.'],
  ],
};

export const FACTION_CHOICE = {
  id: 'worldheart-oath', title: 'What does a living world deserve?',
  unlock: { boss: 'hourglass' },
  description: 'Choose a promise at the Last Lantern. Your oath grants a permanent boon, changes the final confrontation after the Sovereign, and decides the fate of the remembered world. The choice cannot be changed during this expedition.',
  options: [
    { id: 'wardens', label: 'Keep the door open', boss: 'nullheart', variant: 'wardens', ending: 'shelter', item: 'sunseed', quest: 'borrowedSun', consequence: 'The Waylights become free refuges. Vell remains their keeper by choice. The Compact must learn to let its guests leave.', finalLine: 'A home is a place you may leave, and still be welcomed back.' },
    { id: 'chorus', label: 'Let every voice go', boss: 'nullheart', variant: 'chorus', ending: 'chorus', item: 'choirbell', quest: 'ninthName', consequence: 'The stored voices become rain, roots, and new creatures. Morrow’s shell falls silent. For the first time, it hears the sea.', finalLine: 'The rain remembers us. It does not ask us to stay.' },
    { id: 'unwritten', label: 'Write a first tomorrow', boss: 'nullheart', variant: 'unwritten', ending: 'dawn', item: 'blankegg', quest: 'tomorrowSmuggler', consequence: 'The repeating roads disappear. Vell leaves the lantern lit and takes the first step onto a road she cannot remember.', finalLine: 'The map is blank. There are three heartbeats beside you. Begin.' },
  ],
  // Evidence affects the epilogue, not access to the three choices. Players can
  // always choose their own oath; completing a faction arc makes it a better one.
  evidenceEnding: {
    wardens: 'With the Smallest Sun planted, the refuge grows its own dawn. Vell no longer has to burn her memories to keep the lights alive.',
    chorus: 'Morrow rings the ninth bell and every departing voice gets to speak its own name. No one is lost in the song.',
    unwritten: 'The future key opens the cradles. Pip’s egg hatches into a creature no page has ever pictured. The first thing it sees is a friend.',
  },
  commonReveal: 'The Sovereign was the wound. The last guardian is the promise you chose to heal it with.',
};

for(const q of Object.values(QUESTS)){q.autostart=q.autoStart;q.needFragments=q.chapter||0;}
QUESTS.borrowedSun.reward.item='bellOath';QUESTS.ninthName.reward.item='palimpsestKey';QUESTS.vellLastDay.reward.item='vellPromise';QUESTS.firstFuture.reward.item='nullCrown';
QUESTS.borrowedSun.reward.keepsake='sunseed';QUESTS.ninthName.reward.keepsake='choirbell';QUESTS.vellLastDay.reward.keepsake='vellletter';QUESTS.firstFuture.reward.keepsake='futurekey';
