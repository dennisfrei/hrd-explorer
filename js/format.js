// ═══════════════════════════════════
// FORMAT — pure display-string helpers
// ═══════════════════════════════════
// Presentation only; no physics. Kept separate from physics.js so the
// SAIL-protected domain module stays free of formatting concerns.

export function fmtR(Rv) {
  if (Rv < 0.05) return Rv.toExponential(1) + ' R☉';
  if (Rv < 10) return Rv.toFixed(2) + ' R☉';
  if (Rv < 1000) return Math.round(Rv) + ' R☉';
  return Rv.toExponential(2) + ' R☉';
}

export function fmtLife(yr) {
  if (yr > 1e9) return (yr / 1e9).toFixed(1) + ' Gyr';
  if (yr > 1e6) return (yr / 1e6).toFixed(0) + ' Myr';
  return (yr / 1e3).toFixed(0) + ' kyr';
}

// Distance: parsecs with a light-year companion, kpc for the far ones.
export function fmtDist(pc) {
  const ly = pc * 3.2616;
  if (pc >= 1000) return (pc / 1000).toFixed(1) + ' kpc';
  if (pc >= 10) return pc.toFixed(0) + ' pc · ' + Math.round(ly) + ' ly';
  return pc.toFixed(2) + ' pc · ' + ly.toFixed(1) + ' ly';
}

export function fmtMag(m) { return (m >= 0 ? '+' : '') + m.toFixed(2); }

// Parallax in mas, with µas for the tiny ones.
export function fmtPlx(mas) {
  if (mas < 1) return (mas * 1000).toFixed(0) + ' µas';
  return mas.toFixed(2) + ' mas';
}
