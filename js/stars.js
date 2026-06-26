// ═══════════════════════════════════
// STAR DATA — curated anchor points
// ═══════════════════════════════════
// Per spec §6, these coordinates are FIXED (SIMBAD / Hipparcos / Gaia DR3,
// rounded to 3 sig. figs). They must not be overwritten by computed values.
//
// `dist` (parsecs) is additive observational metadata used only for the
// distance / parallax / apparent-magnitude readout. It is approximate
// (Hipparcos / Gaia DR3, the brightest/most distant ones uncertain) and does
// NOT influence the plotted position, which stays fixed by (teff, logL).
// The Sun has no meaningful catalogue distance, so it is left undefined.

export const STARS = [
  { name: 'Sun',          teff: 5778,  logL: 0.00,  spec: 'G2 V' },
  { name: 'Sirius A',     teff: 9940,  logL: 1.36,  spec: 'A1 V',     dist: 2.64 },
  { name: 'Proxima Cen',  teff: 3042,  logL: -2.66, spec: 'M5 Ve',    dist: 1.30 },
  { name: 'Vega',         teff: 9602,  logL: 1.58,  spec: 'A0 Va',    dist: 7.68 },
  { name: 'Arcturus',     teff: 4286,  logL: 1.97,  spec: 'K1.5 III', dist: 11.26 },
  { name: 'Betelgeuse',   teff: 3500,  logL: 4.90,  spec: 'M1 Ia',    dist: 168 },
  { name: 'Rigel',        teff: 12100, logL: 5.08,  spec: 'B8 Ia',    dist: 264 },
  { name: 'Deneb',        teff: 8525,  logL: 5.23,  spec: 'A2 Ia',    dist: 802 },
  { name: 'Spica',        teff: 25400, logL: 4.08,  spec: 'B1 III',   dist: 77 },
  { name: 'Antares',      teff: 3660,  logL: 4.65,  spec: 'M1.5 Iab', dist: 170 },
  { name: 'Canopus',      teff: 7400,  logL: 4.52,  spec: 'F0 Ib',    dist: 95 },
  { name: 'Aldebaran',    teff: 3910,  logL: 2.08,  spec: 'K5 III',   dist: 20.4 },
  { name: 'Pollux',       teff: 4858,  logL: 1.73,  spec: 'K0 III',   dist: 10.36 },
  { name: 'Fomalhaut',    teff: 8590,  logL: 1.27,  spec: 'A3 Va',    dist: 7.70 },
  { name: 'ε Eri',        teff: 5084,  logL: -0.15, spec: 'K2 V',     dist: 3.20 },
  { name: 'τ Ceti',       teff: 5344,  logL: -0.39, spec: 'G8.5 V',   dist: 3.65 },
  { name: "Barnard's",    teff: 3134,  logL: -2.85, spec: 'M4 Ve',    dist: 1.83 },
  { name: 'Sirius B',     teff: 25200, logL: -1.85, spec: 'DA2',      dist: 2.64 },
  { name: 'η Car A',      teff: 35000, logL: 6.70,  spec: 'LBV',      dist: 2300 },
  { name: 'ζ Puppis',     teff: 42000, logL: 5.74,  spec: 'O4 If',    dist: 330 },
  { name: 'R136a1',       teff: 46000, logL: 7.00,  spec: 'WN5h',     dist: 49970 },
  { name: '40 Eri B',     teff: 16500, logL: -2.10, spec: 'DA4',      dist: 5.04 },
  { name: "Kapteyn's",    teff: 3570,  logL: -2.56, spec: 'M1 VI',    dist: 3.93 },
  { name: '61 Cyg A',     teff: 4374,  logL: -0.68, spec: 'K5 V',     dist: 3.50 },
  { name: "Van Maanen's", teff: 6220,  logL: -4.16, spec: 'DZ7',      dist: 4.31 },
];
