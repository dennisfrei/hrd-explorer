// ═══════════════════════════════════
// HRD COORDINATES
// ═══════════════════════════════════
// Spec §3 / §7: the Teff axis MUST be inverted (hot left, cool right).
// The transforms below encode this; do not flip them.

export const TMIN = 2000, TMAX = 58000, LMIN = -4.5, LMAX = 7.2;

// Canonical plot-rect geometry, recomputed on every resize.
// Owned here; mutated only via setR() (called from main.js).
export const R = { x: 62, y: 28, w: 0, h: 0 };
export function setR(x, y, w, h) { Object.assign(R, { x, y, w, h }); }

// Teff → canvas x (inverted: higher Teff → smaller x)
export function tx(teff) {
  return R.x + R.w * (Math.log10(TMAX) - Math.log10(teff)) / (Math.log10(TMAX) - Math.log10(TMIN));
}
// log(L/L☉) → canvas y
export function ly(logL) { return R.y + R.h * (1 - (logL - LMIN) / (LMAX - LMIN)); }
// canvas x → Teff
export function xteff(x) {
  return Math.pow(10, Math.log10(TMAX) - (x - R.x) / R.w * (Math.log10(TMAX) - Math.log10(TMIN)));
}
// canvas y → log(L/L☉)
export function ylogl(y) { return LMAX - (y - R.y) / R.h * (LMAX - LMIN); }

// ── Alternative y-axis: apparent bolometric magnitude ──
// An observational view. Inverted (bright = small magnitude at top, faint at
// bottom — the astronomers' convention). Bounds bracket the apparent bolometric
// magnitudes of the curated stars (≈ −1.6 … +13.3) with a margin.
export const MAGTOP = -3, MAGBOT = 16;
export function magY(mag) { return R.y + R.h * (mag - MAGTOP) / (MAGBOT - MAGTOP); }
export function yMag(y) { return MAGTOP + (y - R.y) / R.h * (MAGBOT - MAGTOP); }
