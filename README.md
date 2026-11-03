# SQUEEK GOD

A playable pixel village ruled by Squeektoshi’s real hamster wheel. Plant moon-carrots, harvest supplies, welcome villagers, build cottages and send a little hope skyward. The hamster decides when the sun rises.

![The village during a demo Squeek Storm](artifacts/screenshots/village-storm-1440.webp)

## Run it

Use Node **22.18 or newer** and npm.

```sh
npm ci
npm run dev
```

For the finished static site:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Open the URL Vite prints. `dist/index.html`, its assets, fonts, favicon and share image are included in this submission. Serve the **contents of `dist/`** with any static HTTP server; a backend is unnecessary. Vite uses `base: './'`, and the export was tested at both `/preview/` and `/preview/index.html`. Use HTTP rather than opening ES modules with `file://`.

`npm test` runs 22 pure engine/data-adapter checks using Node’s built-in TypeScript stripping. React, React DOM, TypeScript and Vite are pinned in the manifest and lockfile. The optional `SQUEEK_DEPENDENCY_ROOT` in `vite.config.mjs` supports building with dependencies installed outside the repository; an ordinary `npm ci` needs no setting.

## Play

1. **Enter world.** Two starting crops are already ripe. Harvest them to collect seeds, wood and faith.
2. **Plant and water.** Planting costs 2 seeds. A harvest returns 8 seeds, 3 wood, 2 faith and 8 experience per crop. Water all growing crops for +18% growth every 12 seconds, including at night.
3. **Grow a civilization.** Build a cottage for 30 wood and 15 seeds. Each cottage adds two villagers and 25 experience, up to six cottages. Greet a villager for 3 faith every 25 seconds. A feast costs 5 seeds and grants 8 faith and 10 experience, with a 35-second cooldown.
4. **Pray to Squeektoshi.** Write a prayer and choose 100, 250 or 500 metres of *new* wheel distance. It costs 5 faith. Once answered, claim 20 seeds, 10 wood, 10 faith and 25 experience. Prayers are local game goals and do not influence the real hamster.
5. **Read the sky.** Running brings sunlight and growth. At 90 RPM, electric rain doubles ordinary crop growth. A sudden stop causes a 12-second eclipse. Shelter for 5 wood to protect crops for 30 seconds; unprotected frost removes 15 percentage points of growth.
6. **Watch for blessings.** Each 500 metres of accumulated game distance grants 15 seeds, 10 wood, 30 experience and a Great Harvest. Newly observed public hamster milestones trigger their own festival. Every 100 experience raises the village level.

Select the cottages, shrine or farm in the scene, or use **Explore village** for keyboard-accessible crop, cottage and villager controls. Villagers can also be selected directly in the scene. Use the pause control to freeze village time. Sound starts muted. Decorative motion can be paused from the header or field guide; reduced-motion preferences are respected.

## Real hamster data and demo mode

The adapter is in [`src/game/telemetry.ts`](src/game/telemetry.ts). It uses the public, key-free [Squeekchain API](https://docs.squeekchain.com/developers/api/):

| Endpoint | Use | Poll interval |
| --- | --- | --- |
| `https://api.squeekchain.com/v1/status` | Hardware state, RPM, rim speed and device distance | 15 seconds |
| `https://api.squeekchain.com/v1/events?category=measurement&limit=20` | Newly observed hamster milestones | 30 seconds while playing live |

Only `hardware` provenance, `online` freshness, a healthy ACTIVE/IDLE state, valid units, and a reading no older than 120 seconds can receive the **Live** badge. Requests time out after 7 seconds. Stale, malformed, replayed, simulated, faulted or unreachable readings switch the game to visibly labelled **Demo mode**. Automatic fallback retries the live feed every 15 seconds; a manual retry is also available. **Try demo / Use live feed** makes the choice explicit.

RPM is converted from milli-RPM; speed from mm/s to m/s; device distance from mm to metres. The HUD displays device distance in km (the documented noon-to-noon day). Game goals accumulate only positive observed differences from the same counter epoch. Counter or day resets establish a new baseline. Duplicate readings do not count. An individual recovered distance increment is capped at 20 km.

The deterministic demo cycle runs for 80 seconds: sunrise, storm, sudden-stop eclipse and slumber. Demo distance advances at 12× simulated rim speed, clearly labelled in the HUD. **Explore next demo omen** advances the scenario, without awarding skipped distance. The game’s ordinary growth and resource rules still apply.

The milestone feed establishes a baseline on connection and ignores historical events. New measurement events after entering the world are deduplicated for that live session. Their rewards are local, fictional village resources. API milestones and the automatic 500 m game milestone are separate mechanics.

## Save behavior

Resources, crops, cottages, experience, day, game-distance progression and cooldowns are saved under `squeek-god-v1` in this browser’s local storage. No account, wallet, analytics, shared leaderboard or server is involved. Prayers, event history and live measurement baselines are session-bound. Reopening clears the prayer; an in-progress prayer resets its distance when changing source. A completed prayer remains claimable across a source switch. There is no offline catch-up calculation. If saving is denied, play continues and the footer reports that saving is unavailable.

To start over, remove the site’s `squeek-god-v1` local-storage entry using browser site settings or developer tools.

## Validation performed

Completed on 2026-11-03 against the finished production export:

| Check | Actual result |
| --- | --- |
| Clean `npm ci` | Passed with the delivered lockfile, in an isolated temporary copy |
| `npm run typecheck` | Passed, no TypeScript errors |
| `npm test` | 22 engine and adapter checks passed |
| `npm run build` | Passed; static export includes all runtime assets |
| Chromium interaction harness | 17 checks passed, including desktop/mobile play, prayer reward, eclipse protection, keyboard dialogs, persistence and fallback/retry |
| Chromium resilience checks | 3 passed: cropped-scene pointer selection, denied local storage, and recovery after a milestone-request timeout |
| Controlled live-feed integration | 4 checks passed: awakening, high-RPM storm/prayer, milestone festival, milestone deduplication |
| Automated accessibility | No axe violations in the tested playable desktop and 390px mobile states |
| Pinned design probe | 16/16 checks passed at 320, 390 and 1440px; reduced-motion check passed |
| Additional responsive inspection | No horizontal overflow at 320, 390, 760, 1024 or 1440px; actual screenshots inspected |
| Actual public API | Status and measurement-event endpoints returned 200 in the browser; fresh hardware IDLE/0 RPM observed |

At 390px wide, the opening action ends around 477px from the top. The game and **Enter world** are on the first screen. Eclipse protection is placed directly below the action bar, with a visible countdown.

The browser harnesses and probe ran from temporary `test/scratch/`; they are not runtime dependencies. Their consolidated results are in [`artifacts/check-results.json`](artifacts/check-results.json), with the detailed six-domain review and repaired findings in [`artifacts/validation.md`](artifacts/validation.md). Final screenshots are in [`artifacts/screenshots/`](artifacts/screenshots/).

**Limits:** WebKit was downloaded but could not launch because required system libraries are missing on this machine. Safari/iPhone hardware, a screen-reader session, native 200% zoom and audible sound output were not verified. Automated solid-color contrast passes do not measure every pixel behind text over the animated world. Real running and milestone transitions were exercised with clearly identified test fixtures and the demo; the real hamster was resting during direct inspection. Public API availability can change independently of the export. Demo mode remains playable without that service.

## Source map and delivery budget

- `src/App.tsx`: game composition, polling lifecycle, local saving, prayer UI and village controls.
- `src/game/engine.ts`: deterministic resource, crop, prayer, weather and progression rules.
- `src/game/renderer.ts`: original pixel scenery and sprites, drawn locally to a 640×380 canvas.
- `src/components/World.tsx`: scene interaction, responsive pointer mapping and weather crossfades.
- `src/components/Dialog.tsx`: native modal with keyboard focus loop and Escape handling.
- `src/styles.css`: tokens, components, motion and responsive rules. [`DESIGN.md`](DESIGN.md) documents the implemented system.
- `public/`: local fonts/licenses, favicon and 1200×630 PNG share image. No external art or font CDN is needed at runtime.

The explicit `.gitignore` path allocation is 384 KiB for `src/`, 768 KiB for `public/`, 2 MiB for `dist/`, 256 KiB for manifests/configuration, 256 KiB for documentation/artifacts and 32 KiB for `test/engine.test.ts` (3.657 MiB allocated, below the 8 MiB limit). Dependency/cache directories at every level, tool screenshots and scratch files have **zero submission budget**. `dist/` is deliberately included. There are no vendored registries, dependency archives or submodules.

## Credits

Pixelify Sans and DM Sans are distributed locally under the SIL Open Font License, with notices in `public/fonts/` and the export. React, React DOM and Scheduler notices are in [`artifacts/runtime-LICENSES.txt`](artifacts/runtime-LICENSES.txt).

The design workflow applies Jakub Krehel’s [Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface) (MIT); the design-documentation method is adapted from Paul Bakaus’s [Impeccable](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md) (Apache-2.0). Their license and copyright notices are retained in [`artifacts/design-guidance-LICENSE.txt`](artifacts/design-guidance-LICENSE.txt).
