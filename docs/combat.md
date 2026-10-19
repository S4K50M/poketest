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

Power rushes share the finite aerial dash budget. Companion signature skills remain separate, Focus-funded mobility choices. Switching never refreshes jumps, aerial dashes, Guard, or art cooldowns. The new controller also owns input buffering, cancel windows, juggle gravity, hit confirmation, shield regeneration and posture. It leaves room progression and RPG rewards independent.

All eleven playable rigs now articulate anticipation, contact, recovery, running, airborne movement, shielding, casting and recoil. Every boss and minion receives state-based action/death animation; bosses add phase energy, ground runes and posture cues. Travelers breathe, look toward the player and animate books or accessories. Layered biome particles, elemental impact sparks, dash trails, camera impulses and animated interface feedback complete the presentation. **Reduced motion**, in the Arsenal, removes camera shake and softens flashes; the browser’s preference is used for a new journey.

Version-4 saves retain the existing `kinetic-worldheart-v2` key and migrate both v2 and v3 progress. They add equipped arts, selected slot, motion preference and combat statistics. Midfight poses, fields, Flow and cooldowns are transient; loading returns to the saved room checkpoint as before.

## Art resource costs

These are the unmodified base costs and cooldowns from POWERS. Signature L cooldowns are separate. Current behavior, unlock validation, and field lifetimes remain in the combat modules.

| Art ID | Name | Focus | Cooldown (seconds at 60 Hz) |
| --- | --- | --- | --- |
| `arcbolt` | Kinetic Bolt | 16 | 0.53 |
| `aegis` | Aegis Pulse | 24 | 3.5 |
| `comet` | Comet Rush | 28 | 1.5 |
| `cyclone` | Thread Cyclone | 30 | 2.5 |
| `frostnova` | Tideglass Nova | 32 | 3.17 |
| `thunderstep` | Thunderstep | 22 | 0.97 |
| `riftcut` | Rift Sever | 30 | 1.53 |
| `bloodmoon` | Worldheart Eclipse | 40 | 4.67 |
| `timefracture` | Stolen Second | 34 | 6 |
| `gravitywell` | Paper Moon | 34 | 4 |
| `choir` | Kindred Choir | 38 | 3 |
| `phoenix` | First Sunrise | 45 | 7 |

## Implemented frame data

All values below are simulation frames at 60 Hz. Startup, active, and recovery form a move’s duration; `cancelAt` is the absolute frame at which its next cancel can become eligible. Each swing keeps a hit set so one target cannot take damage on every active frame. Base damage is modified by creature attack, party progression, gear, mastery, talents, and Flow.

| Move ID | Input / route | Startup | Active | Recovery | Cancel at | Base damage |
| --- | --- | --- | --- | --- | --- | --- |
| `light1` | First grounded J | 2 | 3 | 4 | 5 | 10 |
| `light2` | Second J | 2 | 4 | 4 | 6 | 12 |
| `light3` | Third J | 3 | 4 | 7 | 7 | 18 |
| `heavy` | K | 5 | 5 | 9 | 10 | 28 |
| `launcher` | W + K or J J K | 4 | 5 | 7 | 9 | 22 |
| `plunge` | Air S + K, with Root Claw | 3 | 6 | 8 | 9 | 25 |
| `airlight` | Air J | 2 | 4 | 4 | 6 | 11 |
| `dashstrike` | J shortly after a dash | 2 | 4 | 6 | 6 | 16 |
| `riposte` | J/K after a perfect deflect | 1 | 5 | 8 | 6 | 36 |

See [combat-data.js](../src/combat-data.js) for current values and [combat.js](../src/combat.js) for route selection, contact rules, and cancel behavior. Holding up/down can change the attack direction. The live H field manual exposes routes and progression requirements.

## Defensive and resource rules

- Guard starts at 100, drains while held, and spends more on frontal blocks. Release it to recover after its regeneration delay. Rear attacks bypass it.
- The opening deflect window is seven frames; repeated taps cannot bypass its 24-frame lock. A successful deflect opens a 45-frame riposte opportunity.
- Guard break disables the shield for 52 frames and initially staggers the actor. After stagger, movement and attacks allow an escape while Guard reforms.
- Boss posture gains from hits and breaks at 100. A break grants a longer stun; ordinary boss hit-stun is capped to prevent endless light-attack locking. Parry and posture recovery openings remain punishable.
- The normal air-dash allowance is one; Zephyrix has two. Ground contact, pogo, wall-jump, and grapple rules can refresh resources. Party swaps cannot.
- Most offense cancels Focus healing and lowers Guard. Raising Guard clears a queued attack so a buffered strike cannot attack under a fresh shield.
- Focus healing requires still, grounded commitment. Damage and movement interrupt it; it does not provide invulnerability.

## Elemental interactions

Fire can leave damaging floor zones. Electric hits add stun in the shared strike system, while ordinary boss hit-stun remains capped. Ice slows enemies; Tideglass Nova also freezes them briefly. Heavy attacks grant startup armor to selected bulky companions. Signature techniques add their own traps, pushes, charges, counter shells, and status effects.

These are implemented action-RPG effects, not the original arena type-chart proposal. The [supplied design reference](creature-designs.md) includes concepts whose exact behavior may differ from the prototype.

## Tuning ownership

`COMBAT`, `MOVES`, and `POWERS` in combat-data.js define tuning and unlock metadata. CombatDirector applies the attack, defensive, and art behavior; AdventureSystems supplies signature skills and shared hit/status handling. Rendering in combat-fx.js, creatures.js, and entity-animation.js must not award hits or change a cancel window. Some historical ability descriptions in world.js predate Momentum; use the live director and this table for current timing.
