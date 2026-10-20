# Save format and compatibility

[Documentation index](README.md) · [Project README](../README.md)

## Storage contract

The live RPG writes **version 4** JSON to the browser localStorage key **kinetic-worldheart-v2**. The key remains unchanged to retain older journeys; its suffix does not describe the current schema version. main.js owns the storage callback, RPGCampaign builds the save object, and the engine loads validated state during construction.

Progress belongs to a browser origin and profile. Changing protocol, domain, port, or browser can show an empty save even when another origin still has it. Direct-file storage is browser-dependent. There is no account-backed synchronization, save-file import/export menu, or server database.

## Persistent state

| Group | Saved fields / meaning |
| --- | --- |
| Identity and checkpoint | version, room, checkpoint, safeRest, worldSeed, death, playtime, storyStage, finished, ending |
| Recovery and enemy attempts | spentRecovery, discoveredRecovery, claimedEnemyRewards, respawnedEnemies |
| Party and shared progression | party IDs/hearts/maximum hearts/Focus, activeSlot, level, xp, lumens, upgrades |
| World progress | abilities, unlocked companions, main fragments, visited/opened/defeated IDs, memories, shrines, discovered species, stats |
| Inventory | Materials, flasks, tools, crafted charms and equipped charms |
| RPG story | quests and objective progress, trackedQuest, faction, reputation, questFlags, revealed history, trueEnding, keepsakes |
| Builds and rewards | talents, talentPoints, gear, loadout, lootSerial, companionXP, surge, dropArchive, eventCleared, shopStock |
| Momentum | combat.powerSlots, combat.selectedPower, combat.settings.reducedMotion, combat.stats, validated combat.cooldowns and combat.recovery |

A quest record stores its state (`active`, `ready`, or `complete`) and an objective-progress array. Equipment instances have an instance ID and a template ID; loadout slots refer to instance IDs. Ground drops are archived by room so leaving and returning does not duplicate them. Optional guardians use defeatedBosses separately from the six main fragments.

Combat statistics include parries, guard breaks, perfect evades, launches, and powers cast. Power access is derived from validated abilities, fragments, optional victories, and mastery; an equipped locked/unknown power is replaced with a starter fallback on load.

## What a reload does

Saving records the room and its checkpoint, not an exact mid-combo simulation snapshot. Reloading returns to the room checkpoint, reconstructs its geometry/enemies, and preserves completed progression and claimed rewards. A surviving guardian’s partial health, velocity, attack phase, projectiles, temporary fields, animation pose, Guard expenditure, and Flow are not restored. Shared J/K/L, art, Surge, and assist cooldowns plus offensive recovery are restored; rejected, unknown, or out-of-range timer values are filtered or clamped. The shared L timer still applies when per-companion signature state is rebuilt. An enemy saved as defeated remains defeated until a party wipe reawakens that gate. Current defeated spawn keys and lifetime claimedEnemyRewards are separate, so a resurrected enemy cannot duplicate its first-victory payout. respawnedEnemies records enemies reawakened by a gate death, including guardians whose story fragment was already recovered. Dimensional minibosses never inflate the six-fragment count.

Room changes clear local projectiles, hazards, attacks, grapple state, and combat fields. They preserve party resources and do not heal. The local checkpoint is the arrival position or a Wellspring activated in that room, including its vertical coordinate. `safeRest: {id, room, x, y}` stores the last activated spring and is validated against the layout generated from worldSeed. Old bench checkpoints migrate to the sanctuary hearth rather than becoming free-heal camps. Ordinary nonlethal falls cost a heart and return to the local checkpoint. Injured saves must not heal merely because faction maximum-health bonuses are reapplied.

A new expedition generates worldSeed once. The seed selects two or three spring positions per gate; reloads keep those positions. spentRecovery records springs used in the current attempt and discoveredRecovery retains activated destinations. Entering a spring restores party health and Focus and updates safeRest; camping on it or reloading inside it does not activate another heal. A gate death rearms that gate’s springs.

A party wipe removes 10% of Lumens, reawakens enemies in the current gate, and persists `death: {gate, room, returnTo, lostLumens, restoredEnemies}`. The phase is rebuilt as gameover while death is pending. The simulation stays stopped until Retry revives the party and loads the validated return point. Save & Title and browser reload preserve this pending choice; they cannot silently revive the party or charge the penalty twice.

The UI saves during progression transactions, at room/recovery/reward/death actions, when leaving, and periodically during play. Browser close events are best-effort; do not treat the exact last action before a crash as guaranteed durable.

## Migration

| Loaded version | Behavior |
| --- | --- |
| 2 | Retain original campaign progress; initialize RPG systems and Momentum defaults |
| 3 | Retain campaign and Ninth Memory state; initialize Momentum defaults |
| 4 | Restore validated RPG state, combat loadout/counters/cooldowns, seeded recovery state, and a pending Game Over when present |
| Other versions | Not accepted as current campaign saves |

CampaignEngine still produces its base v2 representation for the isolated campaign layer. The live entry uses RPGCampaign, whose save method augments it and emits v4. Do not change the live storage key or mistake a base-layer fixture for the full application format.

Older v2/v3/v4 saves without recovery fields receive a world seed, unused springs, and the sanctuary hearth as their fallback respawn point. Existing defeated spawn IDs initialize lifetime reward tracking.

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
- Preserve worldSeed, spring usage/discovery, lifetime enemy rewards, gate resurrection state, and pending Game Over.
- Verify the death penalty applies once, affects only the current gate, and cannot duplicate boss rewards after Retry.
- Ensure reload, revisits, and quest turn-ins cannot award a unique reward twice.

See [rpg.js](../src/rpg.js), [campaign.js](../src/campaign.js), [combat.js](../src/combat.js), and the migration/route tests described in [testing](testing.md).
