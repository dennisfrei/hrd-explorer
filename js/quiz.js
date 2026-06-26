// ═══════════════════════════════════
// QUIZ — "place the star" guessing logic
// ═══════════════════════════════════
// Pure helpers; the quiz state and banner DOM live in main.js. Scoring is done
// in screen space (pixel distance via the shared transforms) so it matches what
// the player actually sees, independent of axis scaling.

import { tx, ly } from './coords.js';
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

// Score a guess against the target. Returns pixel distance, awarded points
// (0–100, falling off with distance) and a short verdict.
export function scoreGuess(target, guessTeff, guessLogL) {
  const dx = tx(guessTeff) - tx(target.teff);
  const dy = ly(guessLogL) - ly(target.logL);
  const dist = Math.hypot(dx, dy);
  const points = Math.max(0, Math.round(100 * (1 - dist / 160)));
  let verdict;
  if (dist < 14) verdict = 'Bullseye!';
  else if (dist < 35) verdict = 'Great';
  else if (dist < 70) verdict = 'Close';
  else if (dist < 120) verdict = 'Not quite';
  else verdict = 'Way off';
  return { dist, points, verdict };
}
