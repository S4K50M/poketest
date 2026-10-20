# Content authoring

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
    {id: 'bench', kind: 'bench', x: 200, name: 'Garden Waylight'},
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

Playable identity and anatomy live in designs.js and roster.js. Supply stats, body height, colors, rig selection, and signature metadata. Implement a distinct rig or an intentional compatible rig in creatures.js. Implement actual neutral/directional signature behavior in AdventureSystems or CampaignEngine; a skill name alone does not add behavior.

Add rescue/unlock rewards, party-selection handling, and any required save validation. The starter selection currently uses the original eight, with three rescues unlocked by guardians. Do not accidentally make every added creature a starter or accept an unearned rescued party from a save.

Minions need a MINIONS record, encounter spawns, AI in the appropriate update method, and art in creatures.js, world-render.js, or chronicle-art.js. Check contact radius/body height, projectile/status behavior, stun and knockback, and once-only rewards. The creature design reference preserves supplied concepts; [gameplay](gameplay.md) describes their implemented context.

## Add a boss

Supply identity, health, biome/color, lore, and rewards. Add an encounter spec with a boss ID, then implement AI in CampaignEngine.updateBoss or RPGCampaign.updateBoss. Existing AI exposes patrol, windup, charge/cast, recovery, enrage, and optional sealed states. Telegraph the attack, provide an avoidance route, and leave a punish opening.

Implement matching art and confirm entity-animation wrappers remain balanced with Canvas save/restore. If the boss is optional, use the optional registry/reward path and defeatedBosses; do not insert it into the main six-fragment progression. Set sensible arena bounds and introduction distance for rooms wider than the original guardian chambers. Connect victory to its art/ability/equipment/quest rewards and return door.

## Add a quest or history record

QUESTS records in chronicle.js use stable IDs, giver IDs, prerequisites, optional fragment requirements, objectives, and reward records. Objective kinds include talk, visit, kill, memory, tool, craft, event, and faction. Fully qualified object targets use roomID:objectID. Giver IDs must match NPC talk IDs so interaction can accept and turn in the quest.

Known unique milestones can satisfy objectives retroactively; repeated minion-kill counts generally need future events. Rewards are claimed through quest state rather than merely showing dialogue. History records must reveal only after their intended prerequisites. Add world objects, dialogue, map connections, and UI text alongside a new story arc. Keep main progression completable without optional stories.

## Add or tune a combat art

1. Add a stable POWERS record in combat-data.js: name, icon, color, description, Focus cost, cooldown frames, mechanic parameters, and supported unlock metadata.
2. Extend CombatDirector.castPower and any field update behavior for the real mechanic. Its implementation currently dispatches by power ID; adding data alone will not create an attack.
3. Integrate hits through the host strike path, specifying source party slot where needed. Preserve mastery, gear, talents, quest attribution, and once-only kill rewards.
4. Add event-driven particles/feedback. Keep damage and collision outside rendering. Update the Arsenal description and any new unlock route.
5. Verify locked access, Focus spending, cooldowns, finite aerial resources, distinct behavior, pause safety, and save-load fallback for unknown powers.

Move frames and contact data live in MOVES, with selection/contact logic in CombatDirector. Keep the input buffer, per-swing hit sets, cancel eligibility, and boss stun resistance intact when extending routes.

## Animation and accessibility

The creature renderer accepts legacy pose flags and pose.state; options include attackProgress, combo, speed, shieldRatio, charged, and elementColor. Pass simulation attack progress for readable contact timing. Shared entity wrappers handle action/recoil/death, boss cues, and NPC response; preserve their absolute-world-coordinate callback contract.

CombatFX events are presentation-only. Respect bounded particle pools, avoid obscuring projectiles/platforms, and honor reduced motion. Camera zoom is an absolute multiplier of 1 at rest. Check mobile controls against both HUD placement and the standing actor silhouette.

## Acceptance checklist

A content addition should be reachable through real inputs, have a safe way back, preserve reload/revisit rewards, appear correctly in its menus, and remain legible on desktop/mobile. Add focused behavior coverage plus the relevant input-driven route and browser checks from [testing](testing.md). Update the appropriate docs and rebuild the committed bundle when JavaScript changes.

## Vertical dungeons and miniboss seals

Use `map: {x, y}`, `depth`, and `dungeon` on a room to place it in the dimensional atlas. Upper rooms may use negative Y; retain a safe arrival shelf at every door’s destination `spawn: {x,y}`. Use `??` rather than `||` for Y defaults: zero is a valid platform height. Spawns accept `y`, `left`, `right`, and `introX`.

A `requiresBoss` field seals a door or hoard until `bossDefeated(id)` succeeds. Dimensional miniboss definitions use `miniboss: true`; their rewards persist in defeated spawn keys and must never add a main fragment. New deep rooms have no benches. Verify both directions of each connection with real movement and the abilities actually available on first arrival.
