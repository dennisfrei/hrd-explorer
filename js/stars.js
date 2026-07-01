// ═══════════════════════════════════
// STAR DATA — curated anchor points
// ═══════════════════════════════════
// Per spec §6, these coordinates are FIXED (SIMBAD / Hipparcos / Gaia DR3,
// rounded to 3 sig. figs). They must not be overwritten by computed values.
//
// logL values re-verified 2026-07-02 (SAIL review, approved by the domain
// scientist) against published BOLOMETRIC luminosities and interferometric
// radii — the previous values for ~⅔ of the catalogue were inconsistent with
// measured radii by 0.2–0.65 dex (some apparently mixed visual and bolometric
// luminosity). Cross-check: R = √(L/L☉)·(T☉/Teff)² must reproduce the
// interferometric radius. Key refs: Heiter+15 (Aldebaran), Domiciano de
// Souza+14 (Canopus), Rains+20 (ε Eri), Bond+17 (Sirius B, 40 Eri B),
// Soubiran+24 (61 Cyg A), Brands+22 (R136a1).
//
// `dist` (parsecs) is additive observational metadata used only for the
// distance / parallax / apparent-magnitude readout. It is approximate
// (Hipparcos / Gaia DR3, the brightest/most distant ones uncertain) and does
// NOT influence the plotted position, which stays fixed by (teff, logL).
// The Sun has no meaningful catalogue distance, so it is left undefined.

export const STARS = [
  { name: 'Sun',          teff: 5778,  logL: 0.00,  spec: 'G2 V' },
  { name: 'Sirius A',     teff: 9940,  logL: 1.39,  spec: 'A1 V',     dist: 2.64 },
  { name: 'Proxima Cen',  teff: 3042,  logL: -2.78, spec: 'M5 Ve',    dist: 1.30 },
  { name: 'Vega',         teff: 9602,  logL: 1.58,  spec: 'A0 Va',    dist: 7.68 },
  { name: 'Arcturus',     teff: 4286,  logL: 2.23,  spec: 'K1.5 III', dist: 11.26 },
  { name: 'Betelgeuse',   teff: 3500,  logL: 4.90,  spec: 'M1 Ia',    dist: 168 },
  { name: 'Rigel',        teff: 12100, logL: 5.08,  spec: 'B8 Ia',    dist: 264 },
  { name: 'Deneb',        teff: 8525,  logL: 5.23,  spec: 'A2 Ia',    dist: 802 },
  { name: 'Spica',        teff: 25400, logL: 4.31,  spec: 'B1 III',   dist: 77 },
  { name: 'Antares',      teff: 3660,  logL: 4.87,  spec: 'M1.5 Iab', dist: 170 },
  { name: 'Canopus',      teff: 7400,  logL: 4.22,  spec: 'F0 Ib',    dist: 95 },
  { name: 'Aldebaran',    teff: 3910,  logL: 2.64,  spec: 'K5 III',   dist: 20.4 },
  { name: 'Pollux',       teff: 4858,  logL: 1.58,  spec: 'K0 III',   dist: 10.36 },
  { name: 'Fomalhaut',    teff: 8590,  logL: 1.27,  spec: 'A3 Va',    dist: 7.70 },
  { name: 'ε Eri',        teff: 5084,  logL: -0.49, spec: 'K2 V',     dist: 3.20 },
  { name: 'τ Ceti',       teff: 5344,  logL: -0.33, spec: 'G8.5 V',   dist: 3.65 },
  { name: "Barnard's",    teff: 3134,  logL: -2.47, spec: 'M4 Ve',    dist: 1.83 },
  { name: 'Sirius B',     teff: 25200, logL: -1.61, spec: 'DA2',      dist: 2.64 },
  { name: 'η Car A',      teff: 35000, logL: 6.70,  spec: 'LBV',      dist: 2300 },
  { name: 'ζ Puppis',     teff: 42000, logL: 5.58,  spec: 'O4 If',    dist: 330 },
  { name: 'R136a1',       teff: 46000, logL: 6.86,  spec: 'WN5h',     dist: 49970 },
  { name: '40 Eri B',     teff: 16500, logL: -1.87, spec: 'DA4',      dist: 5.04 },
  { name: "Kapteyn's",    teff: 3570,  logL: -1.92, spec: 'M1 VI',    dist: 3.93 },
  { name: '61 Cyg A',     teff: 4374,  logL: -0.82, spec: 'K5 V',     dist: 3.50 },
  { name: "Van Maanen's", teff: 6220,  logL: -3.79, spec: 'DZ7',      dist: 4.31 },
];
