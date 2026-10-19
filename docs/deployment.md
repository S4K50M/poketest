# Build and deployment

[Documentation index](README.md) · [Project README](../README.md)

## Portable build

From the repository root:

```sh
npm ci
npm run build
npm run check
```

Commit bundle/game.js with JavaScript source changes. The build is an ES2020-targeted classic IIFE loaded by a deferred script tag, not a runtime module entry. CSS is served directly; src/style.css imports src/combat-style.css. Fonts and icons stay local. There is no backend deployment or secret configuration.

## Files to publish

| Path | Needed for play |
| --- | --- |
| index.html | Page entry, HUD, menus and touch controls |
| bundle/game.js | Generated gameplay and UI bundle |
| src/style.css | Main stylesheet and local font declarations |
| src/combat-style.css | Arsenal and combat HUD styling |
| assets/ | Fonts and favicon referenced by the page/styles |

Keeping the complete src/, assets/, and bundle/ folders is the simplest portable distribution. node_modules/, tests/, and development scripts are not runtime requirements. docs/ can accompany a repository release; its Markdown is primarily intended for repository viewers and is not a generated documentation site.

## Static HTTP hosting

Any static host that preserves the directory structure can serve the game. For a local release check:

```sh
npm start
```

The included server listens on 0.0.0.0 using PORT or 3000, serves files without a cache, and supplies HTML/JavaScript/CSS/SVG/font MIME types. It is a development/review server rather than a full production hosting stack.

Verify the root HTML, bundle/game.js, src/style.css, imported combat stylesheet, fonts, and favicon all load successfully. Choose cache settings on an external host so index.html and its corresponding bundle are updated together; there is no service-worker update system.

## GitHub Pages

Publish the repository root on the chosen Pages branch, retaining the directories above. If using GitHub’s branch deployment, choose the root folder rather than /docs: the game entry is at the repository root. There is no Pages workflow supplied by the project and no deployment is performed by the build command.

All HTML assets use ./ paths, and CSS font/import URLs are relative to their stylesheet. Preserve that structure so the game works below /poketest/ as well as a domain root. Do not replace local paths with absolute /src or /bundle paths. The campaign Chromium suite verifies nested hosting under /poketest/.

## Direct-file distribution

Ship index.html together with its asset, source stylesheet, and bundle directories. Open the HTML, not the module source. A managed browser may forbid file:// navigation; this is separate from a missing asset. HTTP hosting remains the recommended route for reliable saves.

## Release checks

Run build/check, unit tests, and the three browser suites for a gameplay release. Inspect representative desktop and mobile screenshots, reduced motion, save migration, and a nested hosting path. A documentation-only release needs no regenerated bundle. See [testing](testing.md).

Saves remain local to the browser origin. Moving a deployment from one domain, protocol, or port to another does not automatically move saved progress. Consult [save format](save-format.md) before changing where returning players load the game.
