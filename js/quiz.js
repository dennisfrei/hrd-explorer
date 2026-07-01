// ═══════════════════════════════════
// QUIZ — "place the star" guessing logic
// ═══════════════════════════════════
// Pure helpers; the quiz state and banner DOM live in main.js. Scoring is done
// in screen space (via the shared transforms) so it matches what the player
// actually sees — but normalised by the plot diagonal, so the same relative
// miss scores the same on a phone as on a large monitor.

import { R, tx, ly } from './coords.js';
import { STARS } from './stars.js';

// Stars with a proper name make fair quiz targets (skip bare catalogue points).
const POOL = STARS.filter(s => s.name && s.name !== 'Sun');

// Random target, optionally excluding the previous one so it never repeats back
// to back.
export function pickTarget(exclude) {
  let s;
  do { s = POOL[Math.floor(Math.random() * POOL.length)]; }
  while (POOL.length > 1 && exclude && s.name === exclude.name);
  return s;
}

// Score a guess against the target. Returns the miss as a fraction of the
// plot diagonal, awarded points (0–100, falling off with distance) and a
// short verdict. Thresholds were tuned on a ~1160 px diagonal.
export function scoreGuess(target, guessTeff, guessLogL) {
  const dx = tx(guessTeff) - tx(target.teff);
  const dy = ly(guessLogL) - ly(target.logL);
  const dist = Math.hypot(dx, dy) / Math.max(1, Math.hypot(R.w, R.h));
  const points = Math.max(0, Math.round(100 * (1 - dist / 0.14)));
  let verdict;
  if (dist < 0.012) verdict = 'Bullseye!';
  else if (dist < 0.03) verdict = 'Great';
  else if (dist < 0.06) verdict = 'Close';
  else if (dist < 0.105) verdict = 'Not quite';
  else verdict = 'Way off';
  return { dist, points, verdict };
}
