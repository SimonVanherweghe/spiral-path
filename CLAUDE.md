# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (hot reload)
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview the production build locally
```

Deployment is automatic via GitHub Actions on push to `main` — the workflow builds and publishes to GitHub Pages at the `/spiral-path/` base path (configured in [vite.config.js](vite.config.js)).

## Architecture

Single-file p5.js sketch ([src/sketch.js](src/sketch.js)) with an SVG canvas (420×420, via p5.js-svg). No components, no state management — all logic lives in p5's `setup()` / `draw()` / event callbacks.

### Core data model

- `points[]` — user-placed Vector control points (added by mouse click)
- `rounds` — number of concentric spiral rings through each point (UP/DOWN arrows)
- `spacer` — distance between rings (LEFT/RIGHT arrows)
- `addMode` — boolean toggling whether clicks add points

### Rendering pipeline (inside `draw()`)

1. **Direction pass** — For each point, compute clockwise vs. counterclockwise by taking the cross product of adjacent point vectors at that control point.
2. **Arc generation** — For each (round × point) pair, emit a circular arc. The radius at each point grows by `spacer` per round so the path spirals outward.
3. **Tangent calculation** — At each arc junction the code computes the shared tangent angle. Two cases:
   - *External tangent*: adjacent arcs spin the same direction — uses arc sine of `(r1 ± r2) / dist`.
   - *Cross tangent*: adjacent arcs spin opposite directions — uses arc sine of `(r1 ± r2) / dist` with an opposite sign.
4. **Bezier approximation** — Each arc is broken into segments (max angle π/18) and each segment is drawn as a cubic Bezier. The `k` factor (`4/3 * tan(angle/4)`) gives a standard circle-to-Bezier approximation.

### Keyboard controls (documented in index.html)

| Key | Action |
|-----|--------|
| Click | Add bend point |
| ESC | Toggle add mode |
| UP / DOWN | Adjust rounds |
| LEFT / RIGHT | Adjust spacer |
| D | Toggle debug mode |
| C | Clear all points |
| R | Remove last point |
| S | Save as SVG |
