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
