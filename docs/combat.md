# Combat reference

[Documentation index](README.md) · [Project README](../README.md)

## Rhythm and movement

The campaign now uses a dedicated frame-driven combat director. Movement accelerates to 10.3 pixels/frame, ground dashes travel at 24 pixels/frame, and attacks can cancel after contact. Light chains are **J → J → J**; branch **J → J → K** into a launcher, or use **W + K**. Jump to chase a launched minion, strike in the air, and pogo with **S + J**. Root Claw unlocks an aerial **S + K** plunge and grounded **S + Shift** slide; Storm Wings unlocks aimed vertical/diagonal air dashes. Jump buffering, variable height, wall jumps, and finite aerial dash resources remain.

Hold **G** to raise a directional shield. Its first seven simulation frames deflect an incoming hit, restore Focus/Guard, and open a **J/K riposte**. Holding drains Guard; blocked hits drain more. A shattered shield briefly staggers you, then leaves Guard unavailable until it reforms. Release to regenerate it. Repeated taps cannot bypass the 24-frame parry lock. Attacks and companion signatures lower the shield. Taking damage interrupts offense, shakes the scene, reduces Flow, and produces visible recoil. Land hits, parry, and eventually perform precise Rift evades to build **Flow**, granting up to 15% additional damage; it decays out of combat. Bosses resist ordinary hit-stun and launches. Fill their posture meter to earn a longer punish window.

**H** opens the Kinetic Arsenal. Equip two of twelve arts, **Z** cycles them, and **X** casts the selected art. They share the active companion’s Focus with healing and signature skills; each also has an independent cooldown. Unlocks are derived from actual journey progress, including older saves.

| Combat art | Unlock | Role |
| --- | --- | --- |
| Kinetic Bolt / Aegis Pulse | Starting arts | Piercing ranged opener / Guard-restoring shell |
| Comet Rush | Briar Matron | Burning dash launcher |
| Thread Cyclone | Saint Bellows | Pulling vortex with repeated hits |
| Tideglass Nova | Ink Leviathan | Freeze and slow a crowd |
| Thunderstep | Storm Conductor | Protected electric rush |
| Rift Sever | Hourglass Stag | Long directional punish |
| Worldheart Eclipse | Hollow Sovereign | Area burst and life recovery |
| Stolen Second | Belltwin | Local time-slow field |
| Paper Moon | Palimpsest | Persistent gravity singularity |
| Kindred Choir | 200 mastery on a companion | Homing attacks from all living party members |
| First Sunrise | Nullheart | Launching explosion and recovery |

Power rushes share the finite aerial dash budget. Companion signatures are separate Focus-funded choices: the eight starter kits have five distinct techniques each, individual movement/strength tradeoffs, and personal reuse of 1.8–2.5 seconds in addition to the shared L timer. Compare them in the [party guide](party-and-dungeons.md) and the H Arsenal. Terrakhan’s shield automatically releases after two seconds; Noxshade’s clone preserves normal boss stun resistance. Switching never refreshes jumps, aerial dashes, Guard, or art cooldowns. The new controller also owns input buffering, cancel windows, juggle gravity, hit confirmation, shield regeneration and posture. It leaves room progression and RPG rewards independent.

All eleven playable rigs now articulate anticipation, contact, recovery, running, airborne movement, shielding, casting and recoil. Every boss and minion receives state-based action/death animation; bosses add phase energy, ground runes and posture cues. Travelers breathe, look toward the player and animate books or accessories. Layered biome particles, elemental impact sparks, dash trails, camera impulses and animated interface feedback complete the presentation. **Reduced motion**, in the Arsenal, removes camera shake and softens flashes; the browser’s preference is used for a new journey.

Version-4 saves retain the existing `kinetic-worldheart-v2` key and migrate both v2 and v3 progress. They add equipped arts, selected slot, motion preference and combat statistics. Action/art cooldowns and shared recovery now persist; midfight poses, fields and Flow are transient; normal loading returns to the saved room checkpoint. A pending death instead reopens Game Over until Retry; the [save guide](save-format.md) describes seeded recovery and gate resurrection.

## Attack cadence and anti-spam rules

| Action | Repeat cooldown |
| --- | --- |
| J light, aerial light, or dash strike | 12 frames / 0.2s |
| K heavy, launcher, or plunge | 54 frames / 0.9s |
| L signature, including neutral/directional variants | 90 frames / 1.5s |
| X arts, shared across equipped choices | 60 frames / 1s, plus each art’s individual cooldown |
| R Threefold Resonance | 900 frames / 15s, plus its full-gauge requirement |
| Overdrive swap damage pulse | 120 frames / 2s |

Successful offensive actions also apply an 8-frame shared recovery window. Alternating J/K/L/X/R cannot bypass that window. Movement and the existing dash/Guard rules remain available for defense.

Only one J/K follow-up can be buffered, and only within the 12-frame input window. Repeated presses cannot refresh or overwrite that queue. The queued action must wait for both its cooldown and a valid cancel state; an input during a longer cooldown is rejected. Cooldowns start when the action actually executes, not when an input is rejected or queued. Terrakhan’s charged release restarts L’s cooldown so holding the stance cannot bank an immediate second attack.

Cooldowns are shared across the active party and survive swapping, art cycling/equipping, room changes, and save/reload. Pauses and hitstop freeze their simulation frames. Existing saves without the new optional cooldown fields start with ready actions. The J/K/L HUD and touch buttons show remaining time, and the selected art display includes shared casting recovery. Surge shows its cooldown separately from its gauge.

## Art resource costs

These are the unmodified base costs and cooldowns from POWERS. Signature L cooldowns are separate. Current behavior, unlock validation, and field lifetimes remain in the combat modules.

| Art ID | Name | Focus | Cooldown (seconds at 60 Hz) |
| --- | --- | --- | --- |
| `arcbolt` | Kinetic Bolt | 16 | 1.5 |
| `aegis` | Aegis Pulse | 24 | 4 |
| `comet` | Comet Rush | 28 | 2.5 |
| `cyclone` | Thread Cyclone | 30 | 4 |
| `frostnova` | Tideglass Nova | 32 | 5 |
| `thunderstep` | Thunderstep | 22 | 2.5 |
| `riftcut` | Rift Sever | 30 | 3.5 |
| `bloodmoon` | Worldheart Eclipse | 40 | 7 |
| `timefracture` | Stolen Second | 34 | 8 |
| `gravitywell` | Paper Moon | 34 | 6 |
| `choir` | Kindred Choir | 38 | 6 |
| `phoenix` | First Sunrise | 45 | 10 |

## Implemented frame data

All values below are simulation frames at 60 Hz. Startup, active, and recovery form a move’s duration; `cancelAt` is the absolute frame at which its next cancel can become eligible. Each swing keeps a hit set so one target cannot take damage on every active frame. Base damage is modified by creature attack, party progression, gear, mastery, talents, and Flow.

| Move ID | Input / route | Startup | Active | Recovery | Cancel at | Base damage |
| --- | --- | --- | --- | --- | --- | --- |
| `light1` | First grounded J | 2 | 3 | 4 | 5 | 10 |
| `light2` | Second J | 2 | 4 | 4 | 6 | 12 |
| `light3` | Third J | 3 | 4 | 7 | 7 | 18 |
| `heavy` | K | 5 | 5 | 9 | 10 | 21 |
| `launcher` | W + K or J J K | 4 | 5 | 7 | 9 | 18 |
| `plunge` | Air S + K, with Root Claw | 3 | 6 | 8 | 9 | 20 |
| `airlight` | Air J | 2 | 4 | 4 | 6 | 11 |
| `dashstrike` | J shortly after a dash | 2 | 4 | 6 | 6 | 16 |
| `riposte` | J/K after a perfect deflect | 1 | 5 | 8 | 6 | 36 |

See [combat-data.js](../src/combat-data.js) for current values and [combat.js](../src/combat.js) for route selection, contact rules, and cancel behavior. Holding up/down can change the attack direction. The live H field manual exposes routes and progression requirements.

## Defensive and resource rules

- Guard starts at 100, drains while held, and spends more on frontal blocks. Release it to recover after its regeneration delay. Rear attacks bypass it.
- The opening deflect window is seven frames; repeated taps cannot bypass its 24-frame lock. A successful deflect opens a 45-frame riposte opportunity.
- Guard break disables the shield for 52 frames and initially staggers the actor. After stagger, movement and attacks allow an escape while Guard reforms.
- Boss posture gains from hits and breaks at 100. A break grants 24 frames of stun and a 36-frame recovery, with a 180-active-frame lock on rebuilding posture. Ordinary boss hit-stun is capped. Parry and posture recovery openings remain punishable.
- The normal air-dash allowance is one; Zephyrix has two. Ground contact, pogo, wall-jump, and grapple rules can refresh resources. Party swaps cannot.
- Most offense cancels Focus healing and lowers Guard. Raising Guard clears a queued attack so a buffered strike cannot attack under a fresh shield.
- Focus healing requires still, grounded commitment. Damage and movement interrupt it; it does not provide invulnerability.

## Elemental interactions

Fire can leave damaging floor zones. Electric hits add stun in the shared strike system, while ordinary boss hit-stun remains capped. Ice slows enemies; Tideglass Nova also freezes them briefly. Heavy attacks grant startup armor to selected bulky companions. Signature techniques add their own traps, pushes, charges, counter shells, and status effects.

These are implemented action-RPG effects, not the original arena type-chart proposal. The [supplied design reference](creature-designs.md) includes concepts whose exact behavior may differ from the prototype.

## Reading boss attacks

Every main guardian, gatekeeper, and vault boss has its own named attacks and phase patterns. Its next choice also responds to spacing, recent moves, and sustained pressure. Read the attack name and avoidance hint, then watch the marked area: its warning precedes the damaging shape. Some moves change the chamber with one-way landings, summon enemies, pull you toward a strike, or lock a dash onto your earlier position. Keep moving after a target is committed and use recovery to punish or heal.

Two identical grounded heavy hits at close range can provoke a warned repositioning response. After six frames of its 22–24-frame tell, a visible guard chips that recognized frontal heavy to 30% damage and three posture rather than the usual 17. Its counter can recur after 96 active frames. Light attacks, another heavy route, aerial attacks, rear hits, and ripostes retain full damage; Recovery and healing remain open. Phase changes can raise a three-charge ward; aerial attacks, rear hits, elemental signatures, and ripostes shatter those charges. Ordinary flinches do not cancel the response, while a parry or posture break does. Evade the response or wait for recovery, then commit to a punish. Strong boss knockback can cancel and displace a heavy through startup armor; the armor still halves HP damage.

Boss movement runs at a 2.25× baseline, separate from 1.8× attack tempo; rank adds another 1.8% per step to each multiplier. This accelerates real patrols, dashes, leaps, and breakaways as well as attack timing. Ordinary tells remain at least 22 frames and recoveries at least 18; execution tells retain at least 90 frames. Posture openings are short enough to require a chosen punish instead of another long heavy loop. Later bosses scale health and pressure with progression. Stronger encounters become faster and hit harder below 40% health, and their limited healing channels create another interruptible commitment. Read the channel and punish it instead of retreating indefinitely. See the [boss encounter guide](boss-encounters.md) for progression and counterplay.

A normal frontal hit can be shielded or deflected. Marked unblockable attacks require escape or dash timing; a late execution beam can defeat the active companion outright if it connects. Use its advertised safe lane or raised landing rather than standing behind Guard. First-gate encounters remain solvable with the starting jump, dash, and shield. Detailed move names and counters are in the [boss encounter guide](boss-encounters.md).

## Tuning ownership

`COMBAT`, `MOVES`, and `POWERS` in combat-data.js define tuning and unlock metadata. CombatDirector applies the attack, defensive, and art behavior; AdventureSystems supplies signature skills and shared hit/status handling. Rendering in combat-fx.js, creatures.js, and entity-animation.js must not award hits or change a cancel window. Some historical ability descriptions in world.js predate Momentum; use the live director and this table for current timing.
