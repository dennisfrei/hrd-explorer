// ═══════════════════════════════════
// INTERACTION — canvas hover / tap handling
// ═══════════════════════════════════
// State mutation and redraws are delegated to callbacks supplied by main.js,
// so this module never owns state. nearStar() is pure.

import { tx, ly, xteff, ylogl } from './coords.js';
import { stype, calcR } from './physics.js';
import { fmtR } from './format.js';

// Closest star to a canvas point, or null. Pure: stars + R passed in.
export function nearStar(mx, my, stars, R) {
  let best = null, bd = 22;
  stars.forEach(s => { const d = Math.hypot(mx - tx(s.teff), my - ly(s.logL)); if (d < bd) { bd = d; best = s; } });
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
      const ns = nearStar(mx, my, stars, R);
      const teff = xteff(mx), logL = ylogl(my);
      tip.textContent = ns ? `${ns.name} · ${ns.spec}` : `${stype(teff)} · ${Math.round(teff / 100) * 100} K · ${fmtR(calcR(logL, teff))}`;
      tip.style.opacity = '1'; tip.style.left = (e.clientX + 13) + 'px'; tip.style.top = (e.clientY - 22) + 'px';
    } else tip.style.opacity = '0';
    onUpdate();
  });

  hc.addEventListener('mouseleave', () => { state.hover = null; tip.style.opacity = '0'; onUpdate(); });

  function handleTap(mx, my) {
    if (mx < R.x || mx > R.x + R.w || my < R.y || my > R.y + R.h) return;
    const ns = nearStar(mx, my, stars, R);
    if (ns) { onPick(ns); return; }
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
