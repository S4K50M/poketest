# Content authoring

For branching traversal, use the first gate’s [landing networks](../src/moss-layout.js) as a reference. Author distinct routes with shared destinations and recovery galleries underneath them. Verify deliberate misses at several heights, including a route back up from each landing, with the abilities available on first arrival. Adding a safe floor alone does not make a climb a branching network.

[Documentation index](README.md) · [Project README](../README.md)

## Before changing content

Use stable string IDs. Room objects, enemy spawn keys, unique relics, quests, and bosses become save identifiers, so reordering or renaming them can affect existing journeys. Review [save compatibility](save-format.md) first. Use [architecture](architecture.md) to locate the engine versus presentation layer.

world.js contains base geography and main guardians. chronicle.js contains pure optional story data; rpg-world.js merges that data into the live registries. Definitions describe content, while collision, rewards, and rendering require explicit behavior in their owning modules. A new field in a data record does not implement a mechanic by itself.

## Add a room

A room supplies an ID, name, biome, width, platforms, enemies, anchors, relics, and interactable objects. World positions use feet coordinates and positive Y downward; the common floor is Y = 520. Provide safe entry and return routes and reachable interaction heights.

This is a minimal room example to add after the ROOMS declaration in world.js; it is an authoring example, not an existing room:

```js
ROOMS['echo-garden'] = {
  id: 'echo-garden',
  name: 'The Echo Garden',
  biome: 'moss',
  width: 1800,
  platforms: [{x: 0, y: 520, w: 1800, h: 260}],
  thorns: [],
  enemies: [],
  anchors: [],
  relics: [],
  objects: [
    {id: 'camp', kind: 'camp', x: 200, name: 'Garden Camp'},
    {id: 'return', kind: 'door', x: 95, to: 'sanctuary', name: 'Return'},
  ],
};
ROOMS.sanctuary.objects.push({
  id: 'garden-road', kind: 'door', x: 2100,
  to: 'echo-garden', name: 'Enter the Echo Garden',
});
```

Ordinary platforms are landed on from above; solid blocks also collide laterally and overhead. Moving-platform fields and veil behavior have specialized support in CampaignEngine. Reuse a biome for the first playable version. A new biome also needs its palette, backdrop behavior, ambient effects, and menu/map support.

Door gates can reference fragment counts, abilities, or bosses. Main fragment gates and optional defeated-boss gates have different engine handling. Add optional doors through CHRONICLE_LINKS when extending the chronicle. Test entering, leaving, revisiting, saving, dying, and fast travel, including the exact Y coordinate needed to interact.

## Add a creature or enemy

Playable identity and anatomy live in designs.js and roster.js. Supply stats, body height, colors, rig selection, and signature metadata. Implement a distinct companion rig in [creature-art.js](../src/creature-art.js), reached through the compatible drawCreature entry point in creatures.js. Preserve the anatomy and identity in [creature designs](creature-designs.md) when refining existing characters. Implement actual neutral/directional signature behavior in AdventureSystems or CampaignEngine; a skill name alone does not add behavior.

Add rescue/unlock rewards, party-selection handling, and any required save validation. The starter selection currently uses the original eight, with three rescues unlocked by guardians. Do not accidentally make every added creature a starter or accept an unearned rescued party from a save.

Minions need a MINIONS record, encounter spawns, AI in the appropriate update method, and a species renderer in [enemy-art.js](../src/enemy-art.js). All nineteen current wild species use this route; older art modules remain fallback paths for unhandled content. Check contact radius/body height, projectile/status behavior, stun and knockback, and once-only rewards. [Gameplay](gameplay.md) describes their implemented context.

## Add a boss

Supply identity, health, biome/color, lore, and rewards, then add a boss spawn using its stable ID. Register its combat profile in the appropriate major, warden, or reaver move module; [boss-encounters.js](../src/boss-encounters.js) aggregates them. Every current profile has four distinct named moves and three phase sequences. Choose movement preference, startup, active duration, recovery, an avoidance hint, and an event builder for each move. Patrol, windup, charge/leap, recovery, enrage, and sealed states remain simulation-owned.

Implement matching art in [boss-art.js](../src/boss-art.js) and confirm entity-animation wrappers remain balanced with Canvas save/restore. Give the boss a distinct silhouette and meaningful windup, attack, recovery, stagger, and phase details; a palette change alone does not create a new boss identity. Resolve its complete definition, including any faction variant, before drawing. If the boss is optional, use the optional registry/reward path and defeatedBosses; do not insert it into the main six-fragment progression. Set sensible arena bounds and introduction distance for rooms wider than the original guardian chambers. Connect victory to its art/ability/equipment/quest rewards and return door.

### Boss move and event contracts

A profile supplies `title`, `identity`, `movement`, optional `speed`/`preferredRange`, `sequences`, and four `moves`. Each move has a globally unique `id`, `name`, `kind`, `counter`, `hint`, `tell`, `active`, `recover`, and `build(context)`. The context provides boss feet `x/y`, floor, locked target `tx/ty`, bounds `left/right`, arena center, phase, facing, resolved faction mechanic, and `clampX`. Use simulation frames at 60 Hz.

Event `at` is relative to the move’s active timeline, after startup. Supported events include damaging `zone`, interpolated `dash`/leap, `warp`, projectile `shots`, `summon`, temporary `platform`, pulling `force`, and limited `heal`. Zones use centered `x/y/w/h`; `delay` is a rendered warning before their active `life`. Ring zones can supply an `inner` safe center. Add avoidance space instead of filling the complete chamber with unavoidable damage. Do not re-aim a committed dash or beam without another tell.

Use `bossOwner` to let the runtime expire summons, hazards, and platforms together. Never overwrite an authored floor or persist an arena mutation in the room registry. Temporary ledges must be reachable with abilities available on first arrival, especially before double jump. Defeating a summoned creature must not award repeatable materials, XP, story counts, or equipment.

Distinct encounter acceptance requires different executable patterns, not only names or colors. Vary movement, target geometry, timing, arena manipulation, and openings. Every phase needs a punish/recovery window. Execution attacks belong to late optional/final phases, require an explicit long warning and escape route, and must communicate shield bypass. Use [boss encounter reference](boss-encounters.md) for the current identities and run [boss verification](testing.md#boss-encounter-regressions) after a change.

## Add a quest or history record

QUESTS records in chronicle.js use stable IDs, giver IDs, prerequisites, optional fragment requirements, objectives, and reward records. Objective kinds include talk, visit, kill, memory, tool, craft, event, and faction. Fully qualified object targets use roomID:objectID. Giver IDs must match NPC talk IDs so interaction can accept and turn in the quest.

Known unique milestones can satisfy objectives retroactively; repeated minion-kill counts generally need future events. Rewards are claimed through quest state rather than merely showing dialogue. History records must reveal only after their intended prerequisites. Add world objects, dialogue, map connections, and UI text alongside a new story arc. Keep main progression completable without optional stories.

## Add scene dialogue or a landmark voice

NPC dialogue remains an array of `[speaker, text]` pairs in the base or chronicle data. Call `showDialogue(lines, nearObject)` with the actual NPC object so the event carries a stable source ID, room, feet position, name, and kind. Keep dialogue display separate from quest acceptance and reward claims. The UI divides long lines at sentence or word boundaries; prefer short utterances that read naturally beside the speaker. Space is a movement input, not a conversation advance key.

Add a room’s short environmental line to [world-voices.js](../src/world-voices.js), using an existing object ID as its anchor. Copy real object coordinates, including negative or zero Y, and do not invent a decorative platform or collision surface to support the text. Keep whispers concise, local to the landmark, and free of unearned plot revelations. Boss introduction and defeat lines belong in `BOSS_VOICES` under the stable boss ID. These transient voices cannot grant progression or substitute for a collected memory’s persistent history entry.

[WorldDialogueState](../src/world-dialogue-state.js) controls pages, range, and ambient timing; [world-dialogue.js](../src/world-dialogue.js) owns DOM presentation. Rendering must only project and place the voice, never pause the simulation or move the source. Use the [scene dialogue checks](testing.md#scene-dialogue-regressions) to verify input, readable mobile text, rotation, and unchanged progression after an addition.

## Add or tune a combat art

1. Add a stable POWERS record in combat-data.js: name, icon, color, description, Focus cost, cooldown frames, mechanic parameters, and supported unlock metadata.
2. Extend CombatDirector.castPower and any field update behavior for the real mechanic. Its implementation currently dispatches by power ID; adding data alone will not create an attack.
3. Integrate hits through the host strike path, specifying source party slot where needed. Preserve mastery, gear, talents, quest attribution, and once-only kill rewards.
4. Add event-driven particles/feedback. Keep damage and collision outside rendering. Update the Arsenal description and any new unlock route.
5. Verify locked access, Focus spending, cooldowns, finite aerial resources, distinct behavior, pause safety, and save-load fallback for unknown powers.

Move frames and contact data live in MOVES, with selection/contact logic in CombatDirector. Keep the input buffer, per-swing hit sets, cancel eligibility, and boss stun resistance intact when extending routes.

## Animation and accessibility

The public drawing contracts are:

```js
drawCreature(context, creature, x, y, scale, facing, pose, timeSeconds, options);
creatureBounds(creature); // {left, top, right, bottom, width, height}
drawEnemyMinion(context, enemy, timeSeconds, minionDefinition);
drawArenaBoss(context, enemy, resolvedBossDefinition, timeSeconds);
```

Companion `x, y` and enemy `x, y` are world-space feet anchors, with positive Y downward. Author local rig geometry with feet at Y = 0. `drawCreature` owns its scale and facing transform; `facing = -1` mirrors local X. Minion and boss entry points own their transforms too. Do not pre-mirror a renderer twice. `creatureBounds`, re-exported alongside `drawCreature` from creatures.js, returns conservative local art bounds. Include horns, tails, wings, weapons, and attack extensions so portraits stay complete. These are presentation measurements and must not change body height, collision radius, hitboxes, or attack reach.

The creature renderer accepts legacy pose flags and `pose.state`, including `idle`, `walk`, `air`, `launch`, `dash`, `land`, `shield`, `parry`, `attack`, `heavy`, `cast`, `hit`, and `death`. `pose.walk` supplies gait phase; `pose.land` is a 0–1 landing amount. Options include `attackProgress`, `deathProgress`, `combo`, `speed`, `shieldRatio`, `charged`, `elementColor`, `shadow`, `aura`, and `reducedMotion`. Progress values and speed use 0–1 ranges. Pass simulation attack progress for readable anticipation, contact, and recovery. Use the actor presentation clock in seconds for breathing, joint motion, and follow-through; do not advance an attack using wall-clock time. Keep feet planted during grounded poses while articulated limbs, tails, feathers, vents, and material details supply secondary motion.

Enemy renderers return `true` for a handled identity and `false` for an unknown one so fallback paths remain available. Read enemy state, phase, timers, recoil, and reduced-motion flags from the supplied presentation copy. Do not mutate it or its definition. Shared entity wrappers handle action/recoil/death, boss cues, and NPC response; their callback draws using absolute world coordinates. Use balanced Canvas `save()`/`restore()` calls, restore alpha/compositing/transforms, and keep every coordinate finite. Death visuals are renderer-local and must never retain a live simulation enemy or delay a reward.

NPC wrappers use the ambient clock for breathing, player-facing attention, book/page details, and conversation gestures. They also honor reduced motion. CombatFX events are presentation-only. Respect bounded particle pools, avoid obscuring projectiles/platforms, and honor reduced motion in every rig as well as the shared wrappers. Keep the complete idle silhouette and useful attack tells when decorative oscillation, flashes, and afterimages are reduced. Camera zoom is an absolute multiplier of 1 at rest. Check mobile controls against both HUD placement and the standing actor silhouette. Run the [art checks](testing.md#art-and-animation-regressions) and inspect actual gameplay, not only isolated contact sheets.

## Acceptance checklist

A content addition should be reachable through real inputs, have a safe way back, preserve reload/revisit rewards, appear correctly in its menus, and remain legible on desktop/mobile. Add focused behavior coverage plus the relevant input-driven route and browser checks from [testing](testing.md). Update the appropriate docs and rebuild the committed bundle when JavaScript changes.

## Vertical dungeons and miniboss seals

Use `map: {x, y}`, `depth`, and `dungeon` on a room to place it in the dimensional atlas. Upper rooms may use negative Y; retain a safe arrival shelf at every door’s destination `spawn: {x,y}`. Use `??` rather than `||` for Y defaults: zero is a valid platform height. Spawns accept `y`, `left`, `right`, and `introX`.

A `requiresBoss` field seals a door or hoard until `bossDefeated(id)` succeeds. Dimensional miniboss definitions use `miniboss: true`; their current victory state uses defeated spawn keys and their first payout is tracked in claimedEnemyRewards; they must never add a main fragment. A gate death can resurrect them without paying that reward again. Do not add healing benches to new deep rooms. Verify both directions of each connection with real movement and the abilities actually available on first arrival.

## Recovery points and tunnel art

[recovery.js](../src/recovery.js) derives two or three Wellsprings per dimension gate from the saved worldSeed. Positions must land on actual reachable ground and remain away from door arrivals. Keep the first spring on the mandatory lower tunnel floor; reserve elevated spring candidates for optional branches. Add candidates to this layout rather than placing healing camps in every room. Activation is automatic on grounded entry, once per attempt; camp objects provide services only. Nearby springs also support crafting and companion changes even after their healing charge is spent. Verify seed variation, stable reload positions, spent-state persistence, and gate-specific rearming on death.

[tunnel-render.js](../src/tunnel-render.js) builds cave ceilings, backwalls, strata, stone shelves, and recovery basins around existing geometry. Keep decorative rock outside traversable space and collision edges legible. Tunnels must not invent a blocking surface that the simulation lets the player cross. Review climbs, projectile telegraphs, the actor silhouette, and mobile views after changing foreground rock or lighting.

## Grounded tunnel routes

Main roads, lower dungeon passages, courts, and high-passage rooms have continuous lower ground at Y = 520. `traversal: 'tunnel'` and `tunnelCeiling: 200` describe the lower passage’s receding rear-wall vault; this roof is presentation metadata, not a collision surface. Keep actors and upper galleries readable in front of it. Keep mandatory exits on that lower route instead of requiring a sequence of jumps over a room-wide death zone. Upper story, loot, and shortcut routes may still demand earned movement abilities. Preserve old upper ledge coordinates and object IDs for saved journeys when revising geometry.

Use wider upper landing shelves and lower catch ledges so a missed jump usually loses height instead of costing a heart. Mark added recovery shelves with `catch: true` so traversal controllers can distinguish them from the intended climbing sequence. Validate that every spring, door arrival, enemy patrol, and mandatory passage still rests on real geometry. Test walking the lower route without jumping, short jumps, and missed upper landings using actual inputs.
