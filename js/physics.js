// ═══════════════════════════════════
// PHYSICS — SAIL-protected domain logic
// ═══════════════════════════════════
// Per the domain-logic spec (§7), the equations in this module are
// scientifically fixed. Do NOT simplify or refactor the governing
// relations for the sake of efficiency.

export const TSUN = 5778, LSUN = 3.828e26, RSUN = 6.957e8, SIGMA = 5.67e-8;

// Stefan-Boltzmann → radius (spec §2.2): R/R☉ = sqrt(L/L☉)·(T☉/Teff)²
export function calcR(logL, teff) {
  return Math.sqrt(Math.pow(10, logL) * LSUN / (4 * Math.PI * SIGMA * Math.pow(teff, 4))) / RSUN;
}

// Wien's displacement law (spec §2.4): λ_max [nm] = 2.898e6 / Teff[K]
export function calcLmax(teff) { return 2.898e6 / teff; }

// MK spectral class from Teff (spec §2.5)
export function stype(t) {
  if (t > 30000) return 'O'; if (t > 10000) return 'B'; if (t > 7500) return 'A';
  if (t > 6000) return 'F'; if (t > 5200) return 'G'; if (t > 3700) return 'K'; return 'M';
}

// ZAMS reference points: [Teff, log(L/L☉), M/M☉] (Ekström+2012)
export const ZAMS = [
  [4960, -0.61, 0.8], [5570, -0.22, 1.0], [6370, 0.18, 1.25], [6990, 0.50, 1.5],
  [8720, 1.08, 2.0], [11600, 1.74, 3.0], [14100, 2.21, 4.0], [16200, 2.57, 5.0],
  [19600, 3.12, 7.0], [22400, 3.57, 9.0], [26600, 4.02, 12.0], [29700, 4.32, 15.0],
  [35000, 4.75, 20.0], [38700, 5.03, 25.0], [42800, 5.35, 32.0], [45200, 5.58, 40.0],
  [48400, 5.95, 60.0], [49700, 6.18, 85.0], [51200, 6.44, 120.0]
];

export function zamsL(teff) {
  if (teff <= ZAMS[0][0]) return ZAMS[0][1];
  if (teff >= ZAMS[ZAMS.length - 1][0]) return ZAMS[ZAMS.length - 1][1];
  for (let i = 0; i < ZAMS.length - 1; i++) {
    const [t1, l1] = ZAMS[i], [t2, l2] = ZAMS[i + 1];
    if (teff >= t1 && teff <= t2) { const f = (teff - t1) / (t2 - t1); return l1 + f * (l2 - l1); }
  }
  return 0;
}

// Spec §5.2 / §7: mass is only well-defined on the ZAMS band.
export function onZAMS(logL, teff) { return Math.abs(logL - zamsL(teff)) < 0.55 && logL > -2.5; }

export function massOnZAMS(teff) {
  if (teff <= ZAMS[0][0]) return ZAMS[0][2];
  if (teff >= ZAMS[ZAMS.length - 1][0]) return ZAMS[ZAMS.length - 1][2];
  for (let i = 0; i < ZAMS.length - 1; i++) {
    const [t1, l1, m1] = ZAMS[i], [t2, l2, m2] = ZAMS[i + 1];
    if (teff >= t1 && teff <= t2) { const f = (teff - t1) / (t2 - t1); return m1 + f * (m2 - m1); }
  }
  return null;
}

// Main-sequence lifetime (spec §2.3): t_MS ≈ 10^10 · (M/M☉)^(−2.5)
export function msLife(m) { return 1e10 * Math.pow(m, -2.5); }

// Estimated age — simplified educational model.
// A star found on the main sequence has an age somewhere between 0 (when it
// reached the ZAMS) and t_MS (when it leaves at the TAMS). As it burns core
// hydrogen it brightens, drifting upward from the ZAMS line. We map that
// vertical offset above the ZAMS onto the consumed fraction of the MS lifetime:
//   f = clamp((logL − logL_ZAMS) / 0.55, 0, 1),  age ≈ f · t_MS
// Returns null off the main sequence, where age is not constrained by (Teff, L)
// alone. This is a teaching approximation, not an isochrone fit.
export function estAge(logL, teff) {
  if (!onZAMS(logL, teff)) return null;
  const m = massOnZAMS(teff);
  if (!m) return null;
  const offset = logL - zamsL(teff);
  const f = Math.max(0, Math.min(1, offset / 0.55));
  return f * msLife(m);
}

// Luminosity class label (spec §2.5)
export function lumClass(logL, teff) {
  const d = logL - zamsL(teff);
  if (logL < -1.5 && teff > 6000) return 'VII · White Dwarf';
  if (logL < -1.8) return 'VII · White Dwarf';
  if (d > -0.55 && d < 0.55) return 'V · Main Sequence';
  if (d < 1.2) return 'IV · Subgiant';
  if (logL < 2.8) return 'III · Giant';
  if (logL < 4.3) return 'II · Bright Giant';
  if (logL < 5.2) return 'Ib · Supergiant';
  return 'Ia · Luminous Supergiant';
}

// Blackbody color table: [Teff, [R,G,B]] (spec §2.4 — monotonic red→blue)
export const CTAB = [
  [1700, [255, 38, 0]], [2200, [255, 68, 0]], [2800, [255, 103, 14]],
  [3200, [255, 128, 28]], [3600, [255, 152, 55]], [4000, [255, 172, 88]],
  [4500, [255, 194, 118]], [5000, [255, 213, 150]], [5500, [255, 227, 183]],
  [5778, [255, 235, 208]], [6200, [255, 241, 226]], [7000, [255, 247, 244]],
  [8000, [241, 245, 255]], [10000, [221, 235, 255]], [14000, [204, 223, 255]],
  [20000, [187, 213, 255]], [30000, [169, 203, 255]], [50000, [149, 192, 255]]
];

export function tRGB(teff) {
  const t = Math.max(1700, Math.min(50000, teff));
  for (let i = 0; i < CTAB.length - 1; i++) {
    const [t1, c1] = CTAB[i], [t2, c2] = CTAB[i + 1];
    if (t >= t1 && t <= t2) { const f = (t - t1) / (t2 - t1); return c1.map((v, j) => Math.round(v + f * (c2[j] - v))); }
  }
  return t < 1700 ? CTAB[0][1] : CTAB[CTAB.length - 1][1];
}

export function tc(teff, a = 1) { const [r, g, b] = tRGB(teff); return `rgba(${r},${g},${b},${a})`; }
