# HR Diagram Explorer

An interactive Hertzsprung-Russell Diagram. Developed using the **SAIL** (Scientist-AI-Loop) methodology described in [arXiv:2603.18145](https://arxiv.org/abs/2603.18145).

## What it does

- Click or drag anywhere in the HRD to read off T_eff, L, R, spectral class, λ_max, and (on the main sequence) mass, MS lifetime, and an estimated age
- **Observed quantities**: absolute bolometric magnitude for any point, plus distance, parallax and apparent magnitude for the curated stars that carry a catalogue distance
- **Y-axis toggle** (chip, top-left of the diagram): switch between `log(L/L☉)` and **apparent bolometric magnitude**. The apparent-magnitude view is an *observed* diagram — the axis inverts (bright at top) and only stars with a catalogue distance appear; because apparent magnitude depends on distance, the ZAMS, R-isolines, region labels and free-click readout (all functions of `(T_eff, L)` only) switch off. The temperature axis, colour background and star selection keep working
- Select from 25 curated real stars (SIMBAD / Hipparcos / Gaia DR3), with a type-to-filter search by name or spectral class and sorting by catalogue order, name, temperature, luminosity or distance
- **Compare mode**: size-compare any two stars side by side with three radius scales (log, real, normalized)
- **Quiz mode**: a star is named and you place it on the diagram (dots hidden); each guess is scored by how close it lands
- **Understand mode**: an in-app explainer of the governing physics, with formulas typeset in MathML and an interactive slider widget — drag T_eff and L and watch the radius, λ_max, colour, spectral class, mass and age update on a live star disk and Planck spectrum
- **Guided tour**: a stepped walkthrough (the `?` button) introducing each part of the UI
- **Keyboard navigation**: arrow keys nudge the selected point around the diagram (Shift = coarser); Esc steps back out of overlays
- **Shareable links & PNG export**: copy a URL that restores the exact view (selection, compare, layers, scale), or save the diagram as a 2× PNG for slides
- Toggle diagram layers: R isolines, ZAMS, region labels, known-star dots, colour background
- **Light / dark / system** themes (persisted), applied to both the DOM and the diagram canvas
- **Installable PWA** — works fully offline once loaded (service worker + manifest)
- Fully responsive — desktop sidebar, tablet overlay card, mobile bottom sheet with a four-tab bar (Diagram · Details · Stars · Understand; Details reopens the info sheet after it's closed)

### Estimated age — a teaching approximation

Age is reported only on the main sequence. It maps the vertical offset above the
ZAMS onto the consumed fraction of the MS lifetime:
`age ≈ f · τ_MS`, with `f = clamp((logL − logL_ZAMS) / 0.55, 0, 1)`.
This is a deliberately simple positional estimate (a star on the ZAMS reads as
age ≈ 0, one near the top of the band as ≈ τ_MS) — **not** an isochrone fit, so
e.g. the Sun reads ~1.8 Gyr rather than its true 4.6 Gyr. See `estAge()` in
`js/physics.js` to refine the model.

### Distances & magnitudes

The absolute bolometric magnitude `M_bol = 4.74 − 2.5·log(L/L☉)` follows directly
from the plotted luminosity. Distance, parallax and apparent magnitude are shown
only for curated stars carrying a catalogue `dist` (parsecs) in `js/stars.js` —
additive observational metadata (approximate Hipparcos / Gaia DR3) that does
**not** alter the fixed plotted position `(T_eff, L)`.

## Run locally

ES modules require HTTP — open via a local server, not `file://`:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```



## Scientific constraints (spec §7)

These rules are hard — the code must never violate them:

| Rule | Reason |
|------|--------|
| T_eff axis **inverted** (hot left) | Universal astronomy convention |
| Mass shown **only on ZAMS** (±0.5 dex) | Not derivable from (T_eff, L) elsewhere |
| No animated evolution paths by default | Tool shows *states*, not time development |
| Colour sequence monotonically red → blue | Physical blackbody constraint |
| R isolines have slope **+4** in log-log | Follows from L ∝ T_eff⁴ |
| Real star coordinates **fixed** | SIMBAD / Hipparcos / Gaia DR3 — not overwritable |

## Spec §10 validation checks

| Check | Expected | Tolerance |
|-------|----------|-----------|
| Sun R/R☉ | 1.00 | ±1 % |
| Sun spectral type | G2 V | exact |
| Sirius A λ_max | 291 nm | ±5 nm |
| Betelgeuse R/R☉ | ~900 | factor 2 |
| R=1 R☉ isoline slope | 4.0 | ±0.05 |
| T_eff axis direction | hot left | non-negotiable |
| Sirius B mass | n/a | exact |

## Development

```bash
npm install       # installs ESLint (dev only)
npm run lint      # lint js/
```
