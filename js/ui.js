// ═══════════════════════════════════
// UI — data panel, star list, tab switching
// ═══════════════════════════════════
// DOM-facing only. Renderers are not imported here; state is never read
// directly — callers pass in values and callbacks.

import { calcR, calcLmax, stype, lumClass, onZAMS, massOnZAMS, msLife, tc } from './physics.js';
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
  } else {
    document.getElementById('v-mass').textContent = 'n/a · not on ZAMS';
    document.getElementById('v-life').textContent = 'n/a';
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

// Mobile tab visibility. `onShown(tab)` lets main.js re-run layout/redraw
// for the pane that just became visible.
export function switchTab(tab, isMobile, onShown) {
  if (!isMobile) return;
  document.getElementById('hrd-wrap').classList.toggle('tab-active', tab === 'diagram');
  document.getElementById('rpanel').classList.toggle('tab-active', tab === 'info');
  document.getElementById('slist-wrap').classList.toggle('tab-active', tab === 'stars');
  document.getElementById('tab-diagram').classList.toggle('on', tab === 'diagram');
  document.getElementById('tab-info').classList.toggle('on', tab === 'info');
  document.getElementById('tab-stars').classList.toggle('on', tab === 'stars');
  if (onShown) onShown(tab);
}
