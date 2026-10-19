# Contributing and change workflow

[Documentation index](README.md) · [Project README](../README.md)

## Working on the project

Install with npm ci and run npm run dev from the repository root. Keep source changes in src/ and rebuild bundle/game.js through npm run build; do not hand-edit the generated bundle. HTML and CSS are served directly. No secrets or account setup are needed.

The project currently has a working campaign prototype rather than a published long-term feature roadmap. Treat the [changelog](changelog.md) as implemented history, the [creature reference](creature-designs.md) as supplied design context, and runtime data/behavior as the source of truth for mechanics.

## Change workflow

1. Identify the system owner in the architecture guide and read the current behavior before editing.
2. Keep a change focused on the requested feature or fix. Separate simulation rules from animation and menu presentation.
3. Update content definitions, implementation, visible descriptions, and relevant documentation together.
4. For JavaScript changes, build the bundle and run check plus appropriate tests. Add meaningful regression coverage for timing, progression, or persistence changes.
5. Inspect desktop and mobile visuals when changing art, camera, HUD, menus, or touch controls.
6. Review the diff, check local documentation links, and keep node_modules/ and test-results/ out of commits.

```sh
npm run build
npm run check
npm test
git diff --check
```

Run relevant browser suites as described in [testing](testing.md). Documentation-only changes require link/command review and whitespace checks, not a new game build.

## Contracts to preserve

| Area | Contract |
| --- | --- |
| Distribution | Local relative HTML/CSS/font/script paths; direct-file classic bundle and nested-path hosting |
| Input | Menus/blur clear held movement, jump, heal, special, and shield input; UI focus returns to the Canvas |
| Combat | Fixed-frame windows; once-per-swing contact; no queued attacks under a new shield; normal boss stun resistance |
| Party | Independent hearts/Focus; swaps preserve motion and spent aerial resources; no free swap invulnerability |
| Progression | Main fragment gates distinct from optional boss victories; unlocks must be earned |
| Rewards | Unique caches, kills, drops, shops, quests, and events cannot duplicate rewards on reload/revisit |
| Saves | Stable identifiers and kinetic-worldheart-v2 key; v2/v3 journeys migrate; injured reloads do not heal for free |
| Presentation | Rendering cannot apply damage; Canvas context state must be restored; bounded particles and reduced motion |

## Documentation maintenance

The root README should stay a quick overview with commands and links. Detailed guides belong in docs/ and must be linked from docs/README.md. Put story spoilers behind a clearly labeled collapsed section. Preserve supplied reference text and distinguish concepts from supported mechanics. Use relative repository links so documentation works in GitHub and local viewers.

When reporting a change, explain its resulting behavior and the checks actually performed. Note concrete limitations, such as managed-browser file navigation restrictions, rather than claiming verification that did not run. No deployment or publishing automation is implied by a build.
