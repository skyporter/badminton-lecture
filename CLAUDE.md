# CLAUDE.md

Static TypeScript web quiz (Vite, Vitest) to learn reading badminton singles play. No server, no backend, no external API, no AI. UI text is in French, with a non-breaking space (U+00A0) before `?`, `!`, `:` and `;`. Code, names and commits are in English. No explanatory comments in code, full explicit names.

## Commands

- `npm test`: run all tests (`vitest run`).
- `npx tsc --noEmit`: type check.
- `npm run build`: `tsc` then `vite build` into `dist/`.
- `npm run dev`: dev server.

## Architecture

- `src/engine/`: pure, deterministic logic. Same situation and same level give the same result, bit for bit. `rules.ts` holds every rule, weight, threshold and colour of the heat map: all values live in `rules.ts` and nowhere else, except the shot catalogue in `shots.ts` (flight times, landing depths, playable zones), which is also part of the rules and must be reviewed together with `rules.ts` when tuning. Other files: `court.ts` (geometry), `shots.ts` (shot catalogue), `generator.ts` (seeded situations), `evaluate.ts` and `analysis.ts` (value map, best return, alternative, score), `recovery.ts`, `status.ts`, `explain.ts` (French explanations), `rng.ts`, `types.ts`.
- `src/ui/`: rendering and input only. `app.ts` (state, `nextState` reducer, wiring), `panel.ts` (top bar controls, shot banner, shot popover, reveal drawer), `legend.ts` (legend and its visibility in `localStorage`), `courtView.ts` (SVG court and players, shared `svgElement` and `SVG_NAMESPACE`), `trajectory.ts` (trajectory code and shared colours), `situationUrl.ts` (`?seed=&level=` read and write), `heatmap.ts` (canvas map), `input.ts` (pointer to court coordinates), `styles.css`.
- `tests/engine/`, `tests/ui/`, `tests/calibration/` (reference situations with expected results; re-run after any change in `rules.ts`).

## Coordinates and players

Court coordinates are in metres: origin top left, x from 0 to 6.10, y from 0 to 13.40. B is at the top (y < 6.70), A at the bottom (y > 6.70), net at y = 6.70. Singles tramlines are at x = 0.46 and x = 5.64. The UI never stores pixels: the cross, the preview and the map are in court coordinates, so they stay aligned after a resize or rotation.

Both players are right-handed (`handedness: 'droitier'` is a parameter, only that value is implemented). A faces -y, so her forehand is at +x. B faces +y, so his forehand is at -x.

## Colours and trajectory code

A `#3b82f6`, B `#e05252`, B's shot `#ff8a65`, the student's return `#ffd54a`, best return `#ffffff` dashed. Map: bright green `#00e676`, light green `#b2ff59`, red `#ff5252` (constants in `rules.ts`).

Trajectories (top view, `trajectory.ts`): the dash pattern says the speed (solid = very fast, long tight dashes = fast, medium dashes = medium, spaced dots = slow), the curvature says the height (straight = flat, slight curve = low arc, strong curve = high arc). The same code is used for B's shot and the student's return. The legend reuses these constants and `trajectoryPath` for its swatches.

Stroke widths and dash lengths are constant in screen pixels, whatever the zoom or court size: every stroke in the court SVG carries `vector-effect="non-scaling-stroke"` through `constantStroke(...)` and its width comes from `STROKE_PIXELS` (`trajectory.ts`, also used by the legend swatches). Only shapes (discs, landing dot, cross size, racket head) scale with the court. Each situation writes `?seed=<integer>&level=<level>` with `history.replaceState`, and the same URL on load restores it.

## Layout

Everything happens on the court, on mobile and desktop alike: no side panel. Top to bottom: a thin top bar (`.controls`: level select and « Nouvelle situation »), then the court frame (`.court-frame`, sized from the viewport only) with its overlays. `.shot-banner` (top of the frame) shows `describeShotB` in both phases, plus a dimmer hint line « Clique sur le terrain de B pour choisir ton retour. » in the question phase. It never covers the court: the SVG viewBox top margin is `BANNER_RESERVED_METRES` (`courtView.ts`) plus the usual 0.6 m, the banner height is that reservation as a percentage of the viewBox height, and its font is in `cqw` (the frame is a size container), so it keeps the same size in metres at any width; B's back line and 0.6 m of out zone stay visible and clickable. The frame width uses `--court-aspect` (viewBox width / height). A click or tap on the court places the cross and opens `.shot-popover` next to it: the three shot groups, « Valider » (disabled until a shot is chosen) and a close « ✕ ». The popover is positioned in percentages from court coordinates (`--anchor-x`, `--anchor-y`), flips left on the right half (`.to-left`) and up on the lower half (`.upward`), and is clamped inside the frame. Escape (one `document` keydown listener, replaced on each `startApp`) or « ✕ » closes it (the cross stays); clicking the court again moves the cross and reopens it. On touch, dragging moves the preview and the popover opens on release. After validation `.reveal-drawer` overlays the bottom of the frame: collapsed, one line « Score : NN / 100 — Meilleur : <shot> » and a chevron; expanded, the full reveal content, scrollable, at most 60 % of the court height. It starts collapsed. Popover and drawer state live in `QuizState` (`popoverOpen`, `drawerExpanded`, actions `close-popover` and `toggle-drawer`), so `nextState` stays pure; a level change after the reveal keeps the drawer state.

The small « Légende » button (24 px tall) and the legend box (`.legend-overlay`) sit in `.bottom-stack` with the drawer, so the legend is always above the drawer and never overlaps it. Overlays are siblings of the court SVG, so pointer events on the banner, popover, legend or drawer never reach the court input. The legend is visible by default on desktop and hidden on mobile, the choice is remembered in `localStorage` (`badminton-lecture:legend-visible`, every access in `try/catch`).
