// ═══════════════════════════════════
// UI — data panel, star list, tab switching
// ═══════════════════════════════════
// DOM-facing only. Renderers are not imported here; state is never read
// directly — callers pass in values and callbacks.

import { calcR, calcLmax, stype, lumClass, onZAMS, massOnZAMS, msLife, estAge, tc } from './physics.js';
import { fmtR, fmtLife } from './format.js';
import { STARS } from './stars.js';

export function updatePanel(teff, logL, name) {
  const Rv = calcR(logL, teff);
  document.getElementById('v-teff').textContent = Math.round(teff).toLocaleString() + ' K';
  document.getElementById('v-logl').textContent = logL.toFixed(2);
  document.getElementById('v-rad').textContent = fmtR(Rv);
  document.getElementById('v-lmax').textContent = Math.round(calcLmax(teff)) + ' nm';
  document.getElementById('v-spec').textContent = stype(teff);
  document.getElementById('v-lum').textContent = lumClass(logL, teff);
  if (onZAMS(logL, teff)) {
    const m = massOnZAMS(teff);
    document.getElementById('v-mass').textContent = m ? m.toFixed(2) + ' M☉' : '—';
    document.getElementById('v-life').textContent = m ? fmtLife(msLife(m)) : '—';
    const age = estAge(logL, teff);
    document.getElementById('v-age').textContent =
      age === null ? '—' : age < 5e7 ? '≲ 0 · near ZAMS' : '≈ ' + fmtLife(age);
  } else {
    document.getElementById('v-mass').textContent = 'n/a · not on ZAMS';
    document.getElementById('v-life').textContent = 'n/a';
    document.getElementById('v-age').textContent = 'n/a · off main sequence';
  }
  document.getElementById('star-label').textContent = name
    ? `${name} · ${stype(teff)} · ${fmtR(Rv)}`
    : `${Math.round(teff).toLocaleString()} K · logL=${logL.toFixed(1)} · ${fmtR(Rv)}`;
}

export function buildListIn(containerId, onPick) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  STARS.forEach(s => {
    const div = document.createElement('div'); div.className = 'si'; div.dataset.name = s.name;
    const dot = document.createElement('div'); dot.className = 'sdot';
    dot.style.background = tc(s.teff); dot.style.boxShadow = `0 0 4px ${tc(s.teff, .55)}`;
    const nm = document.createElement('span'); nm.className = 'sn'; nm.textContent = s.name;
    const sp = document.createElement('span'); sp.className = 'ss'; sp.textContent = s.spec;
    div.append(dot, nm, sp);
    div.addEventListener('click', () => onPick(s));
    c.appendChild(div);
  });
}

export function updateListSel(selName, cmpName) {
  ['slist-items-desktop', 'slist-items-mobile'].forEach(id => {
    const c = document.getElementById(id); if (!c) return;
    c.querySelectorAll('.si').forEach(el => {
      el.classList.toggle('sel', el.dataset.name === selName || el.dataset.name === cmpName);
    });
  });
}

