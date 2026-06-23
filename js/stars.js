// ═══════════════════════════════════
// STAR DATA — curated anchor points
// ═══════════════════════════════════
// Per spec §6, these coordinates are FIXED (SIMBAD / Hipparcos / Gaia DR3,
// rounded to 3 sig. figs). They must not be overwritten by computed values.

export const STARS = [
  { name: 'Sun',          teff: 5778,  logL: 0.00,  spec: 'G2 V' },
  { name: 'Sirius A',     teff: 9940,  logL: 1.36,  spec: 'A1 V' },
  { name: 'Proxima Cen',  teff: 3042,  logL: -2.66, spec: 'M5 Ve' },
  { name: 'Vega',         teff: 9602,  logL: 1.58,  spec: 'A0 Va' },
  { name: 'Arcturus',     teff: 4286,  logL: 1.97,  spec: 'K1.5 III' },
  { name: 'Betelgeuse',   teff: 3500,  logL: 4.90,  spec: 'M1 Ia' },
  { name: 'Rigel',        teff: 12100, logL: 5.08,  spec: 'B8 Ia' },
  { name: 'Deneb',        teff: 8525,  logL: 5.23,  spec: 'A2 Ia' },
  { name: 'Spica',        teff: 25400, logL: 4.08,  spec: 'B1 III' },
  { name: 'Antares',      teff: 3660,  logL: 4.65,  spec: 'M1.5 Iab' },
  { name: 'Canopus',      teff: 7400,  logL: 4.52,  spec: 'F0 Ib' },
  { name: 'Aldebaran',    teff: 3910,  logL: 2.08,  spec: 'K5 III' },
  { name: 'Pollux',       teff: 4858,  logL: 1.73,  spec: 'K0 III' },
  { name: 'Fomalhaut',    teff: 8590,  logL: 1.27,  spec: 'A3 Va' },
  { name: 'ε Eri',        teff: 5084,  logL: -0.15, spec: 'K2 V' },
  { name: 'τ Ceti',       teff: 5344,  logL: -0.39, spec: 'G8.5 V' },
  { name: "Barnard's",    teff: 3134,  logL: -2.85, spec: 'M4 Ve' },
  { name: 'Sirius B',     teff: 25200, logL: -1.85, spec: 'DA2' },
  { name: 'η Car A',      teff: 35000, logL: 6.70,  spec: 'LBV' },
  { name: 'ζ Puppis',     teff: 42000, logL: 5.74,  spec: 'O4 If' },
  { name: 'R136a1',       teff: 46000, logL: 7.00,  spec: 'WN5h' },
  { name: '40 Eri B',     teff: 16500, logL: -2.10, spec: 'DA4' },
  { name: "Kapteyn's",    teff: 3570,  logL: -2.56, spec: 'M1 VI' },
  { name: '61 Cyg A',     teff: 4374,  logL: -0.68, spec: 'K5 V' },
  { name: "Van Maanen's", teff: 6220,  logL: -4.16, spec: 'DZ7' },
];
