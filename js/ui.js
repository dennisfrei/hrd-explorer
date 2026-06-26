// ═══════════════════════════════════
// UI — data panel, star list, tab switching
// ═══════════════════════════════════
// DOM-facing only. Renderers are not imported here; state is never read
// directly — callers pass in values and callbacks.

import { calcR, calcLmax, stype, lumClass, onZAMS, massOnZAMS, msLife, estAge,
  absMagBol, appMagBol, parallaxMas, tc } from './physics.js';
import { fmtR, fmtLife, fmtDist, fmtMag, fmtPlx } from './format.js';
import { STARS } from './stars.js';

export function updatePanel(teff, logL, name, dist) {
  const Rv = calcR(logL, teff);
  document.getElementById('v-teff').textContent = Math.round(teff).toLocaleString() + ' K';
  document.getElementById('v-logl').textContent = logL.toFixed(2);
  document.getElementById('v-rad').textContent = fmtR(Rv);
  document.getElementById('v-lmax').textContent = Math.round(calcLmax(teff)) + ' nm';
  document.getElementById('v-spec').textContent = stype(teff);
  document.getElementById('v-lum').textContent = lumClass(logL, teff);

  // Observed — absolute bolometric magnitude always; the distance-dependent
  // quantities only for curated stars that carry a catalogue distance.
  document.getElementById('v-absmag').textContent = fmtMag(absMagBol(logL));
  if (dist) {
    document.getElementById('v-dist').textContent = fmtDist(dist);
    document.getElementById('v-plx').textContent = fmtPlx(parallaxMas(dist));
    document.getElementById('v-appmag').textContent = fmtMag(appMagBol(logL, dist));
  } else {
    document.getElementById('v-dist').textContent = '—';
    document.getElementById('v-plx').textContent = '—';
    document.getElementById('v-appmag').textContent = '—';
  }
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
    const div = document.createElement('div'); div.className = 'si'; div.dataset.name = s.name; div.dataset.spec = s.spec;
    const dot = document.createElement('div'); dot.className = 'sdot';
    dot.style.background = tc(s.teff); dot.style.boxShadow = `0 0 4px ${tc(s.teff, .55)}`;
    const nm = document.createElement('span'); nm.className = 'sn'; nm.textContent = s.name;
    const sp = document.createElement('span'); sp.className = 'ss'; sp.textContent = s.spec;
    div.append(dot, nm, sp);
    div.addEventListener('click', () => onPick(s));
    c.appendChild(div);
  });
}

// Filter the rendered star rows in a container by a free-text query matched
// against the star name and spectral type. Empty query shows all.
export function filterList(containerId, query) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const q = query.trim().toLowerCase();
  c.querySelectorAll('.si').forEach(el => {
    const name = (el.dataset.name || '').toLowerCase();
    const spec = (el.dataset.spec || '').toLowerCase();
    el.style.display = !q || name.includes(q) || spec.includes(q) ? '' : 'none';
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

