# Party combinations and dungeon identities

[Documentation index](README.md) · [Project README](../README.md)

## Eight starter roles

Choose three active companions and switch with **1 / 2 / 3** or **Q**. Injuries, Focus, and signature reuse remain on their owner; switching cannot reset shared attack cooldowns or aerial resources. All starters retain enough jump height for required passages; faster specialists trade survivability and strike damage for mobility.

Run and damage percentages compare the unmodified baseline, before equipment or progression. Jump is a multiplier on the base takeoff velocity.

| Companion | Role | Hearts | Run | Strike | Jump | L Focus / reuse |
| --- | --- | --- | --- | --- | --- | --- |
| Pyrojaw | Area denial / armored breaker | 8 | 97% | 114% | 1.000× | 27 / 2.2s |
| Voltantis | Pursuit / fragile assassin | 4 | 130% | 75% | 1.080× | 24 / 1.8s |
| Glaciolith | Grappler / crowd control | 10 | 80% | 130% | 1.000× | 30 / 2.5s |
| Zephyrix | Air mobility / displacement | 5 | 118% | 80% | 1.130× | 23 / 1.9s |
| Terrakhan | Slow fortress / ground control | 11 | 76% | 125% | 1.000× | 28 / 2.5s |
| Noxshade | Traps / cross-up setups | 5 | 116% | 90% | 1.045× | 25 / 2.3s |
| Aqualance | Long reach / elemental setup | 6 | 105% | 102% | 1.020× | 24 / 2.0s |
| Ferrodrake | Counter duelist / charged artillery | 8 | 99% | 107% | 1.010× | 29 / 2.4s |

## Forty signature choices

Use **L**, **W + L**, **S + L**, or a horizontal direction with **L**. Toward the nearest threat selects advance; away selects retreat. In an empty corridor, D advances and A retreats. The caster faces the threat before executing the selected move. This makes retreat techniques usable after moving away, rather than requiring a one-frame input. Hold/release Terrakhan’s neutral L to store and return pressure. Its shell automatically releases after two seconds and restarts reuse; it cannot become a permanent shield.

| Companion | L | Advance + L | Retreat + L | W + L | S + L |
| --- | --- | --- | --- | --- | --- |
| Pyrojaw | Caldera Mortar | Obsidian Ram | Cinder Tail | Magma God Fist | Burning Sanctuary |
| Voltantis | Chain Circuit | Plasma Cross | Afterimage Retreat | Storm Needle | Static Snare |
| Glaciolith | Glacier Toss | Permafrost Grab | Avalanche Suplex | Glacier Pillar | Whiteout Prison |
| Zephyrix | Wandering Vortex | Gale Dive | Wing Buffet | Updraft Choir | Vacuum Mine |
| Terrakhan | Fortress Reprisal | Horn Bastion | Rolling Menhir | Fault Spire | Quake Stance |
| Noxshade | Shadow Marionette | Prowler Mark | False Escape | Nightfall Rake | Grave Lantern |
| Aqualance | Pressure Lance | Spiral Piercer | Undertow Reversal | Rising Geyser | Tidal Basin |
| Ferrodrake | Railwing Beam | Wing Guillotine | Aegis Wing | Anti-Air Batteries | Dragon Foundry |

Pyrojaw controls the floor with magma and armored charges. Voltantis chains lightning through a crowd but has only four base hearts. Glaciolith controls space with throws and ice; Zephyrix redirects enemies with vortices and aerial movement. Terrakhan stores incoming pressure in its shell and releases traveling faults. Noxshade leaves a clone that mirrors the next strike. Aqualance sets up soak and controls long lanes. Ferrodrake combines a sustained beam, an Aegis counter, and steel pressure.

Useful combinations:

- **Aqualance → Voltantis:** soak a group, then conduct electricity to create a longer opening.
- **Aqualance → Glaciolith:** wet enemies become more vulnerable to frost control; bosses retain their resistance to extended stun.
- **Noxshade → a duelist:** establish a shadow mark or clone, then exploit the extra angle with another companion.
- **Terrakhan → a heavy:** fracture a target, then spend the opening on one deliberate heavy hit. K now deals 21 base damage and has a 54-frame shared cooldown.

The H Arsenal shows your actual three kits, Focus costs, reuse timers, and directional move names. Cast fields retain their original owner after switching; their damage follows the normal reward and attribution path.

## Twelve new wild species

Each dimension adds two species with different commitments rather than palette variants. The journal contains their counterplay after discovery.

| Species | Dimension | Role | Counterplay |
| --- | --- | --- | --- |
| Bloomspitter | moss | Seed artillery | Its flower follows you until the petals close. Move after the seed arc locks; the rooted stalk cannot chase you. |
| Sporekeeper | moss | Enemy medic | The lantern cap glows while it nurses wounded creatures. Strike during the channel to interrupt the heal; bosses cannot receive its spores. |
| Cinderdrill | forge | Burrowing ambusher | A glowing drill mark shows where it will emerge. Leave the mark and punish the drill while it cools. |
| Chainshield | forge | Shield infantry | Its furnace shield blocks frontal jabs. Use a heavy, an elemental skill, or cross behind it; the chain whip leaves a long opening. |
| Siphon Ray | reef | Tether controller | A pale tether warns of the inward current. Shield or dash against the pull, then escape the close pulse. |
| Ink Mortar | reef | Long-range siege | Three ink shells arc toward the recorded landing marks. Keep moving after it locks its aim; its loading mouth is defenseless. |
| Magnet Moth | storm | Magnetic controller | The bright rings pull toward its fixed magnetic field. Shield or dash away, and watch for the three descending needles. |
| Galeswarm | storm | Three-beat striker | Three linked beaks flash in order. The flock commits to three short rushes along the same line; jump or dash across its flank. |
| Bell Spider | frost | Ceiling ambusher | A thread and landing ring reveal its descent. Move out before the bell drops; it needs time to climb back to its web. |
| Crystal Fencer | frost | Parry duelist | The raised rapier deflects repeated frontal jabs. Break its stance with a heavy or elemental skill, then punish the two-step lunge. |
| Phasehound | rift | Flanking hunter | Its echo marks the flank before it blinks. It becomes solid for twenty-four frames before charging; turn and meet it or dash through. |
| Void Lantern | rift | Area denial | Three floor marks count down before the lantern closes them. Jump the outer marks or move away; the lantern remains exposed while casting. |

## Forty-two chambers

Each room has its own authored gallery route and visible architecture. Main tunnels retain connected floors and catch landings; optional height routes use the abilities earned before that gate. Forward doors move to the enlarged passage’s actual end. Later dimensions grow both length and enemy density; old room and object IDs remain stable.

| Room ID | Architectural identity | Width (world pixels) | Authored enemies |
| --- | --- | --- | --- |
| `sanctuary` | A Village Inside the Lantern | 2200 | 0 |
| `moss-path` | Living Root Nave | 2800 | 6 |
| `moss-heart` | The First Seed’s Root Cage | 2100 | 1 |
| `forge-path` | The Ember Waterwheel | 3350 | 7 |
| `forge-heart` | The Saint’s Open Furnace | 2380 | 1 |
| `reef-path` | The Broken Flood Lock | 3900 | 8 |
| `reef-heart` | The Mouth of the Archive | 2660 | 1 |
| `storm-path` | The Fallen Wind Organ | 4450 | 9 |
| `storm-heart` | The Unchained Constellation | 2940 | 1 |
| `frost-path` | A River Frozen Into Seconds | 5000 | 10 |
| `frost-heart` | The Face of the Last Second | 3220 | 1 |
| `rift-path` | The Spine of the First Cage | 5550 | 11 |
| `rift-heart` | The Cage Turned Inside Out | 3500 | 1 |
| `hidden-grove` | The Sleeping Seed’s Hollow | 2050 | 4 |
| `star-observatory` | The Broken Planetarium | 2950 | 8 |
| `moss-descent` | Waterfall Woven Through Roots | 3500 | 5 |
| `moss-nexus` | The Garden Court | 3700 | 6 |
| `moss-ascent` | The Three Canopy Rings | 3300 | 5 |
| `moss-vault` | The Widow’s Egg Chambers | 3400 | 6 |
| `forge-descent` | The Counterweight Works | 4100 | 6 |
| `forge-nexus` | The Crucible’s Four Mouths | 4300 | 7 |
| `forge-ascent` | The Unrung Bell’s Spiral | 3900 | 6 |
| `forge-vault` | The Three Miniature Suns | 4000 | 7 |
| `reef-descent` | The Helical Flooded Index | 4700 | 7 |
| `reef-nexus` | Three Drowned Reading Halls | 4900 | 8 |
| `reef-ascent` | The Book That Became a Bridge | 4500 | 7 |
| `reef-vault` | The Siphon’s Three Reservoirs | 4600 | 8 |
| `storm-descent` | The Suspended Inverted Bells | 5300 | 8 |
| `storm-nexus` | The Four Broken Choir Lofts | 5500 | 9 |
| `storm-ascent` | The Wind’s Corkscrew Stair | 5100 | 8 |
| `storm-vault` | The Ninth Voice’s Tuning Fork | 5200 | 9 |
| `frost-descent` | The Clock’s Escapement Teeth | 5900 | 9 |
| `frost-nexus` | The Winter Astrolabe | 6100 | 10 |
| `frost-ascent` | The Stair Walking Backward | 5700 | 9 |
| `frost-vault` | The Vault’s Frozen Pendulum | 5800 | 10 |
| `rift-descent` | The Wound’s Unequal Teeth | 6500 | 10 |
| `rift-nexus` | A Throne Seen From Inside | 6700 | 11 |
| `rift-ascent` | The Stair Unwriting Itself | 6300 | 10 |
| `rift-vault` | Six Locks Around One Heart | 6400 | 11 |
| `clockwork-ossuary` | A Garden Growing Inside Two Bells | 4050 | 4 |
| `paper-moon` | The Bridge of Unsent Letters | 4650 | 5 |
| `cradle-zero` | The Future’s Unfinished Orrery | 5850 | 5 |

There is **one seeded full-party Wellspring per gate**, on a mandatory lower-floor route, plus the sanctuary hearth. Camps provide crafting and roster changes without free healing. Focus healing and flasks become deliberate expedition resources. A wipe revives the current gate and rearms its spring; unique rewards stay claimed.

## Guardian pressure and destruction

All 21 encounters contain six named techniques and four phase sequences. Phase thresholds are 70%, 40%, and 18%. Every boss enters frenzy below 40%; the final 18% adds a faster last stand. Summoned weapons assemble visibly before their attacks. Three-charge wards resist frontal ground combos; aerial, rear, elemental, and riposte routes provide answers. Use the live attack hints and the [boss guide](boss-encounters.md).

Defeat does not open a victory dialog. Nine essential guardians transform over 4.8 seconds into lasting world scenery; twelve lesser champions visibly shatter their weapons over 2.6 seconds. The Matron grows into a readable tree, Bellows burns to a censer, the Conductor flies away promising to return, and the Stag becomes a stopped clock. Press **E** at the major remains for lore. The Worldheart and the final cradle wait for E before beginning ending choices. Animation clocks pause with gameplay; reloading a defeated room shows settled remains without replaying the death.
