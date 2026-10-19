# Save format and compatibility

[Documentation index](README.md) · [Project README](../README.md)

## Storage contract

The live RPG writes **version 4** JSON to the browser localStorage key **kinetic-worldheart-v2**. The key remains unchanged to retain older journeys; its suffix does not describe the current schema version. main.js owns the storage callback, RPGCampaign builds the save object, and the engine loads validated state during construction.

Progress belongs to a browser origin and profile. Changing protocol, domain, port, or browser can show an empty save even when another origin still has it. Direct-file storage is browser-dependent. There is no account-backed synchronization, save-file import/export menu, or server database.

## Persistent state

| Group | Saved fields / meaning |
| --- | --- |
| Identity and checkpoint | version, room, checkpoint, playtime, storyStage, finished, ending |
| Party and shared progression | party IDs/hearts/maximum hearts/Focus, activeSlot, level, xp, lumens, upgrades |
| World progress | abilities, unlocked companions, main fragments, visited/opened/defeated IDs, memories, shrines, discovered species, stats |
| Inventory | Materials, flasks, tools, crafted charms and equipped charms |
| RPG story | quests and objective progress, trackedQuest, faction, reputation, questFlags, revealed history, trueEnding, keepsakes |
| Builds and rewards | talents, talentPoints, gear, loadout, lootSerial, companionXP, surge, dropArchive, eventCleared, shopStock |
| Momentum | combat.powerSlots, combat.selectedPower, combat.settings.reducedMotion, combat.stats |

A quest record stores its state (`active`, `ready`, or `complete`) and an objective-progress array. Equipment instances have an instance ID and a template ID; loadout slots refer to instance IDs. Ground drops are archived by room so leaving and returning does not duplicate them. Optional guardians use defeatedBosses separately from the six main fragments.

Combat statistics include parries, guard breaks, perfect evades, launches, and powers cast. Power access is derived from validated abilities, fragments, optional victories, and mastery; an equipped locked/unknown power is replaced with a starter fallback on load.

## What a reload does

Saving records the room and its checkpoint, not an exact mid-combo simulation snapshot. Reloading returns to the room checkpoint, reconstructs its geometry/enemies, and preserves completed progression and claimed rewards. A surviving guardian’s partial health, velocity, attack phase, projectiles, temporary fields, animation pose, Guard expenditure, Flow, and art cooldowns are not restored. Signature cooldowns are also rebuilt. An enemy saved as defeated remains defeated.

Room changes clear local projectiles, hazards, attacks, grapple state, and combat fields. Party health/Focus and progression remain governed by their normal room/rest rules. A party wipe revives the party, returns to the checkpoint, resets living guardians, and removes 10% of Lumens. Injured saves must not heal merely because faction maximum-health bonuses are reapplied.

The UI saves during progression transactions, at room/rest/reward actions, when leaving, and periodically during play. Browser close events are best-effort; do not treat the exact last action before a crash as guaranteed durable.

## Migration

| Loaded version | Behavior |
| --- | --- |
| 2 | Retain original campaign progress; initialize RPG systems and Momentum defaults |
| 3 | Retain campaign and Ninth Memory state; initialize Momentum defaults |
| 4 | Restore validated RPG state plus equipped arts, selected art, motion setting, and combat counters |
| Other versions | Not accepted as current campaign saves |

CampaignEngine still produces its base v2 representation for the isolated campaign layer. The live entry uses RPGCampaign, whose save method augments it and emits v4. Do not change the live storage key or mistake a base-layer fixture for the full application format.

Validation constrains supported room/creature/content IDs, rejects invalid or duplicate parties, clamps numeric resources, and filters malformed optional collections. This is compatibility and corruption handling, not a secure anti-cheat boundary: the player controls local browser data.

## Manual backup

The game has no backup UI. For a developer-assisted backup, inspect the correct origin in browser developer tools and copy the **complete** value of kinetic-worldheart-v2 from localStorage to a text file. You can also read it in the Console:

```js
localStorage.getItem('kinetic-worldheart-v2');
```

Keep that original JSON before experimenting. To restore a valid supported backup, open the game’s home screen without starting an expedition, use developer tools to replace that storage value, and reload before continuing. Close other game tabs first so they cannot overwrite the restored data. Never clear storage as a first troubleshooting step.

## Compatibility checklist for code changes

- Preserve room IDs, enemy spawn keys, relic/object IDs, quest IDs, ability IDs, equipment templates, and companion IDs.
- Add migrations before renaming or removing persistent identifiers.
- Keep optional guardians out of the main fragment count.
- Validate power loadouts after progression/mastery has loaded.
- Round-trip injured parties, gear references, objective counts, claimed drops, finite shop stock, and permanent covenants.
- Ensure reload, revisits, and quest turn-ins cannot award a unique reward twice.

See [rpg.js](../src/rpg.js), [campaign.js](../src/campaign.js), [combat.js](../src/combat.js), and the migration/route tests described in [testing](testing.md).
