# CLAUDE.md

Static TypeScript web quiz (Vite, Vitest) to learn reading badminton singles play. No server, no backend, no external API, no AI. UI text is in French, with a non-breaking space (U+00A0) before `?`, `!`, `:` and `;`. Code, names and commits are in English. No explanatory comments in code, full explicit names.

## Commands

- `npm test`: run all tests (`vitest run`).
- `npx tsc --noEmit`: type check.
- `npm run build`: `tsc` then `vite build` into `dist/`.
- `npm run dev`: dev server.

## Architecture

- `src/engine/`: pure, deterministic logic. Same situation and same level give the same result, bit for bit. `rules.ts` holds every rule, weight, threshold and colour of the heat map: all values live in `rules.ts` and nowhere else. Other files: `court.ts` (geometry), `shots.ts` (shot catalogue), `generator.ts` (seeded situations), `evaluate.ts` and `analysis.ts` (value map, best return, alternative, score), `recovery.ts`, `status.ts`, `explain.ts` (French explanations), `rng.ts`, `types.ts`.
- `src/ui/`: rendering and input only. `app.ts` (state, `nextState` reducer, wiring), `panel.ts` (controls and question/reveal panel), `legend.ts` (legend and its visibility in `localStorage`), `courtView.ts` (SVG court and players), `trajectory.ts` (trajectory code and shared colours), `situationUrl.ts` (`?seed=&level=` read and write), `heatmap.ts` (canvas map), `input.ts` (pointer to court coordinates), `styles.css`.
- `tests/engine/`, `tests/ui/`, `tests/calibration/` (reference situations with expected results; re-run after any change in `rules.ts`).

## Coordinates and players

Court coordinates are in metres: origin top left, x from 0 to 6.10, y from 0 to 13.40. B is at the top (y < 6.70), A at the bottom (y > 6.70), net at y = 6.70. Singles tramlines are at x = 0.46 and x = 5.64. The UI never stores pixels: the cross, the preview and the map are in court coordinates, so they stay aligned after a resize or rotation.

Both players are right-handed (`handedness: 'droitier'` is a parameter, only that value is implemented). A faces -y, so her forehand is at +x. B faces +y, so his forehand is at -x.

## Colours and trajectory code

A `#3b82f6`, B `#e05252`, B's shot `#ff8a65`, the student's return `#ffd54a`, best return `#ffffff` dashed. Map: bright green `#00e676`, light green `#b2ff59`, red `#ff5252` (constants in `rules.ts`).

Trajectories (top view, `trajectory.ts`): the dash pattern says the speed (solid = very fast, long tight dashes = fast, medium dashes = medium, spaced dots = slow), the curvature says the height (straight = flat, slight curve = low arc, strong curve = high arc). The same code is used for B's shot and the student's return. The legend reuses these constants and `trajectoryPath` for its swatches.

Stroke widths and dash lengths are constant in screen pixels, whatever the zoom or court size: every stroke in the court SVG carries `vector-effect="non-scaling-stroke"` through `constantStroke(...)` and its width comes from `STROKE_PIXELS` (`trajectory.ts`, also used by the legend swatches). Only shapes (discs, landing dot, cross size, racket head) scale with the court. Each situation writes `?seed=<integer>&level=<level>` with `history.replaceState`, and the same URL on load restores it.

## Layout

Below 768 px the layout is one column (court full width, panel below). The small « Légende » button (24 px tall) and the legend box float over the bottom of the court frame (`.legend-overlay`, absolutely positioned, semi-opaque, scrollable); the court frame's size depends only on the viewport, never on legend visibility. Pointer events on the overlay do not reach the court input. The legend is visible by default on desktop and hidden on mobile, the choice is remembered in `localStorage` (`badminton-lecture:legend-visible`, every access in `try/catch`).
