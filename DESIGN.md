# SQUEEK GOD design system

## Overview

An intimate pixel village under a dramatic sky, made for players who tend a civilization while a real hamster controls its environment. The game scene is the dominant surface. A compact resource strip and action dock serve play; the sidebar pairs the god’s real telemetry with prayer and village management. The opening is an overlay inside the living world, with a single Enter world action.

The art is original procedural drawing in `src/game/renderer.ts`, with square pixel details, a warm miniature civilization and cool layered mountains. Interface text stays clear and restrained around the illustration. The required uppercase title/tagline remain in the header; ordinary controls and explanatory copy use natural casing.

## Colors

The canonical tokens are in `src/styles.css:19`. Values use hex notation. Primitives feed semantic roles; use semantic tokens in interface components.

| Role | Token | Implemented value |
| --- | --- | --- |
| Page | `--color-bg` → `--ink-950` | `#101218` |
| Panel | `--color-surface` → `--ink-900` | `#161920` |
| Raised region | `--color-raised` → `--ink-850` | `#1c2028` |
| Neutral control | `--color-control` → `--ink-800` | `#242932` |
| Structure | `--color-border` → `--ink-700` | `#353c46` |
| Primary text | `--color-text` → `--cream-100` | `#f1eee4` |
| Secondary text | `--color-text-secondary` → `--cream-300` | `#b6b9bd` |
| Muted labels | `--color-text-muted` → `--cream-400` | `#9a9fa8` |
| Primary action/focus | `--color-accent`, `--color-focus` → `--amber-200` | `#f5cd70` |
| Primary hover | `--color-accent-hover` → `--amber-300` | `#e6b95c` |
| Growth/success | `--color-success` → `--green-200` | `#a3c6a1` |
| Faith/omens | `--color-magic` → `--violet-200` | `#c5b4e9` |
| Field error | `--color-danger` → `--red-200` | `#efa2a4` |

The primary button uses dark `#25221c` text on amber. Effect strips use a distinct pair for sunrise (`#edcf85` / `#353224`), night/eclipse (`#d2c7f1` / `#2b293e`), storm (`#d7bbef` / `#312a3d`) and festival (`#c1d4a3` / `#283a2d`). These are deliberate game-state colors, with an icon and name as redundant cues. Status dots always accompany written Live, Demo mode, Active or Idle labels.

Measured solid-pair ratios: primary text/panel 15.15:1; secondary/panel 8.93:1; muted/panel 6.62:1; primary button 10.46:1; storm strip 8.01:1; night strip 8.85:1. Scene focus amber against its dark backing measures 12.35:1. These calculations do not establish contrast over every animated art pixel; see the validation limits.

## Typography

Two local variable WOFF2 families, both available from weight 400 to 700:

- `--font-pixel`: **Pixelify Sans**, Arial, sans-serif. Used for the brand, opening display, village name, god name, scene caption and main game/prayer actions.
- `--font-body`: **DM Sans**, Arial, sans-serif. Used for readable control labels, numeric data, instructions and the event log.

The files are `public/fonts/pixelify-latin.woff2` and `public/fonts/dm-sans-latin.woff2`, with local OFL notices. Both fonts are preloaded from relative URLs. The rendered fonts were confirmed loaded in Chromium.

| Token | Size | Use |
| --- | --- | --- |
| `--text-xs` | 0.75rem / 12px | Dense HUD labels, chronicle, secondary hints |
| `--text-sm` | 0.875rem / 14px | Controls, paragraphs, section headings |
| `--text-base` | 1rem / 16px | Mobile fields and main prayer action |
| `--text-lg` | 1.25rem / 20px | Resource values, compact god/title roles |
| `--text-xl` | 1.75rem / 28px | God name and mobile brand/opening title |
| `--text-display` | 3rem / 48px | Desktop brand and opening title |

Only weights 400, 600 and 700 are used. Body/help text runs at 1.5–1.6 line-height; compact control text at 1.35–1.4. Short pixel display text uses 0.9–1.1. The brand uses −0.04em tracking on desktop and −0.03em on mobile; display copy uses −0.025em. Normal prose has no added tracking. Headings balance; prose uses pretty wrapping; changing numeric data uses tabular figures. Text remains selectable. Mobile inputs and selects are 16px to avoid iOS input zoom.

## Layout

`--space-1` through `--space-8` define the working sequence 4, 8, 12, 16, 20, 24 and 32px. The shell is capped at 1520px with 40px desktop gutters. The header, resource strip, game and footer share alignment edges. Panels group with space before extra dividing lines.

The desktop grid is `minmax(0,1fr) 320px`, with a 24px gap. At 1550px and above the sidebar becomes 340px. At 1200px and below it is 290px, the gap is 20px and shell gutters are 28px. From 761–1000px the sidebar is 270px, the gap 16px and gutters 20px. The build action leaves the narrow dock but remains in the cottage controls.

At 760px and below, the resource strip wraps into a compact full-width row. The main order becomes world, action dock, feedback, active omen response, sidebar and chronicle. The sidebar initially has two columns; at 580px and below it stacks. The god panel becomes a compact two-column composition within its own surface. Mobile gutters are 16px, reducing to 12px at 370px. Decorative header motion controls move into the field guide on phones.

The world’s internal art stays 640×380 pixels. Its displayed ratio changes from 640/380 to 640/440 and 640/540 at intermediate desktop widths, then to 1.1 on mobile with a 312px minimum height. `object-fit: cover` crops rather than distorts the world; pointer mapping compensates for the crop. Farm, shrine and cottage markers remain native buttons, and Explore village provides equivalent crop/building/villager controls.

The action dock stays in normal flow. Eclipse response sits immediately after feedback, with a visible countdown and Shelter action. It is reachable on the first 390px phone screen. Dialogs have a maximum height of `100dvh - 48px` (32px on small phones) and scroll internally. The 320px farm uses a three-column plot grid; villagers collapse to one column on phones.

Observed without horizontal overflow at 320, 390, 760, 1024 and 1440px. At 390px, Enter world ends about 477px from the top. Native 200% browser zoom and RTL mirroring were not performed.

## Elevation & Depth

Panels use a single structural border, a tonal background and no drop shadow. The opening Enter button has a 4px brown underside to feel like a game key. The mascot uses a small drop shadow, and its wheel/halo belongs to the illustration. Header background gradients are subtle environmental color, never gradient text.

The world is an isolated stack: canvas, framing/topline, caption/markers and opening or pause overlay. The native dialog is in the browser top layer with a dark translucent blurred backdrop. It prevents background interaction and contains overscroll.

## Shapes

Panels use 6px corners; buttons/fields generally use 3px; icon controls use 4px; the dialog uses 7px. The scene’s 1px outer border and inset frame are its game viewport. Circles are reserved for the god’s wheel, status dots and mascot halo. Game art keeps pixel edges through `image-rendering: pixelated` and low-resolution canvas drawing.

## Components

| Component / pattern | Location | Behavior and states |
| --- | --- | --- |
| `World` and `EFFECTS` | `src/components/World.tsx` | Accepts state/dispatch, explore/prayer callbacks and a reduced-motion flag. Renders scene, opening, pause, named native scene markers and effect captions. Crossfades changed world states over 1800ms; immediate under reduced motion. |
| `drawWorld`, `Hotspot` | `src/game/renderer.ts` | Local pixel scenery and animated villagers, windmill, crops, smoke, water, rain and lightning. Pointer hit regions expose plots, villagers, homes and shrine. No remote image dependencies. |
| `Dialog` | `src/components/Dialog.tsx` | Native `showModal()`, labelled title, initial close-button focus, Tab/Shift+Tab boundary loop, Escape/backdrop close and native trigger focus return. Farm/cottages/villagers are ordinary pressed-state buttons, not incomplete custom tabs. |
| `Icon`, `Hamster` | `src/components/Icons.tsx` | One currentColor line-icon set; decorative SVGs are hidden from assistive tech. Pixel hamster supports sleeping and crown variants. |
| `.button` | `src/styles.css` | Primary amber, secondary neutral, waiting/disabled states. Main actions are ≥44px. Controls name costs next to the action. Hover is gated by pointer capability. |
| `.world-actions` | `src/App.tsx`, `src/styles.css` | Plant, Water, Harvest, Build and Pause, with costs, harvest count and watering cooldown. Disabled before entry or while paused. |
| Prayer pattern | `src/App.tsx` | Visible textarea label, 120-character limit, distance select, inline submit error and focus, active distance progress, explicit pending/claimable states and one-time claim. Locality and source are stated. |
| Source/effect pattern | `src/App.tsx` | Connecting, Live and Demo mode; hardware timestamp or recovery detail; source switch, retry, optional demo-omen control. Never labels simulated readings Live. |
| Chronicle/feedback | `src/App.tsx` | Polite persistent status region, bounded event log, explicit reward/cost outcomes and next-harvest progress. Expanding the log is deliberate. |

Focus uses a 2px amber outline with 4px offset. Scene markers add a 6px dark backing and a 2px offset to keep the outline visible over bright scenery. Forced-colors mode uses system Highlight. Crop/experience/prayer bars are native progress elements with labels.

Motion is opt-in through `prefers-reduced-motion: no-preference`; there is no `transition: all`. The global reduce-motion class stops CSS animation and transitions, and the renderer freezes decorative time. Village pause also freezes the simulation and decoration. Button press scales to 0.96 for 120ms; reduced motion removes it. Lightning is one short stroke per six seconds, with no full-screen flash. Audio is an optional short synthesized chime after a user enables sound.

## Do’s and Don’ts

- Start another game panel with `.panel`, `.section-heading`, existing text tokens and `.button`. Preserve the shared shell edges and existing gutter breakpoints.
- Use amber for the current primary action; use neutral secondary controls for management. Use named effect colors with text/icons for divine states.
- Keep the pixel font for personality and DM Sans for reading and data. Reuse the six sizes and three weights.
- Keep world art in the local renderer. Every direct scene interaction must retain an equivalent native control in village management.
- Keep simulation and real telemetry explicitly distinct. Source changes must not manufacture distance progress or pretend a local prayer reaches the hamster.
- Do not add marketing sections, wallet connection, token balances, a font CDN or cosmetic telemetry. The main experience is the world and the player’s next action.

The design/review approach applies Better Interface (Jakub Krehel, MIT) and the documentation method from Impeccable (Paul Bakaus, Apache-2.0). Attribution and full notices are included in `artifacts/design-guidance-LICENSE.txt` and the README.
