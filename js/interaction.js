// ═══════════════════════════════════
// INTERACTION — canvas hover / tap handling
// ═══════════════════════════════════
// State mutation and redraws are delegated to callbacks supplied by main.js,
// so this module never owns state. nearStar() is pure.

import { tx, ly, magY, yMag, xteff, ylogl } from './coords.js';
import { stype, calcR, appMagBol } from './physics.js';
import { fmtR } from './format.js';

// Closest star to a canvas point, or null. Pure: stars + R passed in. The y
// position depends on the active axis, so the same point a star is drawn at is
// the point that selects it; on the apparent-mag axis, stars without a distance
// aren't drawn and can't be picked.
export function nearStar(mx, my, stars, R, state) {
  let best = null, bd = 22;
  const appmag = state && state.yMode === 'appmag';
  stars.forEach(s => {
    let y;
    if (appmag) { if (!s.dist) return; y = magY(appMagBol(s.logL, s.dist)); }
    else y = ly(s.logL);
    const d = Math.hypot(mx - tx(s.teff), my - y);
    if (d < bd) { bd = d; best = s; }
  });
  return best;
}

// hc: HRD canvas element. state: shared state object (read for bounds/hover).
// cbs: { onUpdate, onPick, isMobile, stars, R }
export function attachHandlers(hc, state, cbs) {
  const { onUpdate, onPick, isMobile, stars, R } = cbs;
  const tip = document.getElementById('tooltip');

  hc.addEventListener('mousemove', e => {
    if (isMobile()) return;
    const rc = hc.getBoundingClientRect();
    const mx = e.clientX - rc.left, my = e.clientY - rc.top;
    state.hover = { x: mx, y: my };
    if (mx >= R.x && mx <= R.x + R.w && my >= R.y && my <= R.y + R.h) {
      const ns = nearStar(mx, my, stars, R, state);
      const teff = xteff(mx);
      // Don't reveal a star's identity on hover while a quiz question is open.
      const quizHide = state.quiz && state.quiz.active && !state.quiz.revealed;
      if (ns && !quizHide) tip.textContent = `${ns.name} · ${ns.spec}`;
      else if (state.yMode === 'appmag') tip.textContent = `${stype(teff)} · ${Math.round(teff / 100) * 100} K · m≈${yMag(my).toFixed(1)}`;
      else tip.textContent = `${stype(teff)} · ${Math.round(teff / 100) * 100} K · ${fmtR(calcR(ylogl(my), teff))}`;
      tip.style.opacity = '1'; tip.style.left = (e.clientX + 13) + 'px'; tip.style.top = (e.clientY - 22) + 'px';
    } else tip.style.opacity = '0';
    onUpdate();
  });

  hc.addEventListener('mouseleave', () => { state.hover = null; tip.style.opacity = '0'; onUpdate(); });

  function handleTap(mx, my) {
    if (mx < R.x || mx > R.x + R.w || my < R.y || my > R.y + R.h) return;
    const ns = nearStar(mx, my, stars, R, state);
    if (ns) { onPick(ns); return; }
    // On the apparent-mag axis an empty point has no luminosity, so free points
    // aren't created — only catalogued stars can be selected. (Quiz always runs
    // on the luminosity axis, so its guesses still land here.)
    if (state.yMode === 'appmag') return;
    const teff = xteff(mx), logL = ylogl(my);
    onPick({ teff, logL, name: null, spec: stype(teff) });
  }

  hc.addEventListener('click', e => {
    const rc = hc.getBoundingClientRect();
    handleTap(e.clientX - rc.left, e.clientY - rc.top);
  });

  hc.addEventListener('touchend', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const rc = hc.getBoundingClientRect();
    handleTap(touch.clientX - rc.left, touch.clientY - rc.top);
  }, { passive: false });
}
