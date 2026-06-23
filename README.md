# HR Diagram Explorer

An interactive Hertzsprung-Russell Diagram. Developed using the **SAIL** (Scientist-AI-Loop) methodology described in [arXiv:2603.18145](https://arxiv.org/abs/2603.18145).

## What it does

- Click or drag anywhere in the HRD to read off T_eff, L, R, spectral class, and λ_max
- Select from 25 curated real stars (SIMBAD / Hipparcos / Gaia DR3)
- **Compare mode**: size-compare any two stars side by side with three radius scales (log, real, normalized)
- Toggle diagram layers: R isolines, ZAMS, region labels, known-star dots, colour background
- Fully responsive — desktop + mobile (three-tab layout on small screens)

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
