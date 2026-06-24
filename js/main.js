// ═══════════════════════════════════
// MAIN — entry point, state owner, wiring
// ═══════════════════════════════════

import { calcR } from './physics.js';
import { STARS } from './stars.js';
import { R, setR } from './coords.js';
import { drawHRD } from './hrd-renderer.js';
import { drawPreview } from './preview-renderer.js';
import { updatePanel, buildListIn, updateListSel } from './ui.js';
import { attachHandlers } from './interaction.js';
import { initTheme, applyTheme, getPref } from './theme.js';
import { initUnderstand } from './understand.js';

// ── Canvas refs ──
const hc = document.getElementById('hrd-canvas'), hx = hc.getContext('2d');
const sc = document.getElementById('star-canvas'), sx = sc.getContext('2d');

// ── State ──
const state = {
  layers: { radius: true, zams: true, regions: true, stars: true, color: false },
  scaleMode: 'log',
  selStar: null,
  cmpStar: null,
  compareMode: false,
  hover: null,
  activeTab: 'diagram', // mobile only: 'diagram' | 'stars'
  panelOpen: false,
};

const isMobile = () => window.innerWidth < 640;
const isTablet = () => window.innerWidth >= 640 && window.innerWidth < 1024;

// ── Drawing ──
function drawDiagram() { drawHRD(hx, R, state); }

function drawSelection() {
  if (!state.selStar) return;
  const B = state.cmpStar ? { teff: state.cmpStar.teff, R: calcR(state.cmpStar.logL, state.cmpStar.teff) } : null;
  drawPreview(sx, state.selStar.teff, state.selStar.logL, B, state.scaleMode);
  updatePanel(state.selStar.teff, state.selStar.logL, state.selStar.name);
}

// ── Panel open / close ──
function openPanel() {
  if (state.panelOpen) return;
  state.panelOpen = true;
  const p = document.getElementById('rpanel');
  // Start from the default CSS height each time it opens (a prior sheet-drag
  // may have left an inline height on it).
  p.style.height = '';
  p.style.transform = '';
  p.classList.add('is-open');
  // Drag handle only visible on desktop
  if (!isMobile() && !isTablet()) {
    document.getElementById('drag-handle').classList.add('is-open');
    resize();
  }
  requestAnimationFrame(drawSelection);
}

function closePanel() {
  if (!state.panelOpen) return;
  state.panelOpen = false;
  const p = document.getElementById('rpanel');
  p.classList.remove('is-open');
  // Drop any inline sizing left by a mobile sheet-drag so the CSS state wins.
  p.style.height = '';
  p.style.transform = '';
  document.getElementById('drag-handle').classList.remove('is-open');
  if (!isMobile() && !isTablet()) resize();
}

// ── Selection ──
function pick(obj) {
  const isSecond = state.compareMode && state.selStar && !(obj.name && obj.name === state.selStar.name);
  if (isSecond) {
    state.cmpStar = obj;
  } else {
    state.cmpStar = null;
    state.selStar = obj;
  }
  openPanel();
  // On mobile Stars tab, switch back to Diagram so the HRD is visible
  if (isMobile() && state.activeTab === 'stars') goTab('diagram');
  drawSelection();
  updateListSel(state.selStar && state.selStar.name, state.cmpStar && state.cmpStar.name);
  drawDiagram();
}

// ── Mobile tab switching (Diagram | Stars only) ──
function goTab(tab) {
  if (!isMobile()) return;
  state.activeTab = tab;
  const diagActive = tab === 'diagram';
  // Show/hide content-area (HRD) vs stars pane
  document.getElementById('content-area').classList.toggle('tab-hidden', !diagActive);
  document.getElementById('slist-wrap').classList.toggle('is-active', !diagActive);
  document.getElementById('tab-diagram').classList.toggle('on', diagActive);
  document.getElementById('tab-stars').classList.toggle('on', !diagActive);
  if (diagActive) requestAnimationFrame(resize);
}

// ── Resize ──
function resize() {
  const wrap = document.getElementById('hrd-wrap');
  hc.width = wrap.clientWidth; hc.height = wrap.clientHeight;
  // Preview canvas: full width on mobile, panel width otherwise
  const panelEl = document.getElementById('rpanel');
  const pw = isMobile() ? window.innerWidth : panelEl.offsetWidth || parseInt(getComputedStyle(panelEl).width) || 320;
  const ph = isMobile() ? 160 : isTablet() ? 180 : 210;
  sc.width = pw; sc.height = ph;
  const pad = { t: 28, r: 18, b: 48, l: isMobile() ? 52 : 64 };
  setR(pad.l, pad.t, hc.width - pad.l - pad.r, hc.height - pad.t - pad.b);
  drawDiagram();
  if (state.panelOpen) drawSelection();
}

// ── Drag-to-resize (desktop only) ──
const dragHandle = document.getElementById('drag-handle');
let dragResizing = false, dragStartX = 0, panelStartW = 0;

dragHandle.addEventListener('mousedown', e => {
  dragResizing = true;
  dragStartX = e.clientX;
  panelStartW = document.getElementById('rpanel').offsetWidth;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  dragHandle.classList.add('dragging');
});
window.addEventListener('mousemove', e => {
  if (!dragResizing) return;
  const delta = dragStartX - e.clientX; // drag left = panel wider
  const newW = Math.max(240, Math.min(600, panelStartW + delta));
  document.getElementById('rpanel').style.width = newW + 'px';
  resize();
});
window.addEventListener('mouseup', () => {
  if (!dragResizing) return;
  dragResizing = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  dragHandle.classList.remove('dragging');
});

// ── Mobile bottom-sheet drag (resize up, fling down to dismiss) ──
const sheetGrip = document.getElementById('sheet-grip');
let sheetDrag = null;
sheetGrip.addEventListener('touchstart', e => {
  if (!isMobile()) return;
  const rpanelEl = document.getElementById('rpanel');
  sheetDrag = { startY: e.touches[0].clientY, startH: rpanelEl.getBoundingClientRect().height, dismiss: 0 };
  rpanelEl.classList.add('sheet-dragging');
}, { passive: true });
sheetGrip.addEventListener('touchmove', e => {
  if (!sheetDrag) return;
  e.preventDefault();
  const rpanelEl = document.getElementById('rpanel');
  const dy = e.touches[0].clientY - sheetDrag.startY; // down = positive
  // Cap so the sheet never overruns the tab bar (52px) + header headroom.
  const minH = 120, maxH = window.innerHeight - 100;
  let h = Math.min(maxH, sheetDrag.startH - dy);
  if (h < minH) {
    // Past the minimum height: translate the whole sheet down toward dismissal.
    sheetDrag.dismiss = minH - h;
    rpanelEl.style.height = minH + 'px';
    rpanelEl.style.transform = `translateY(${sheetDrag.dismiss}px)`;
  } else {
    sheetDrag.dismiss = 0;
    rpanelEl.style.height = h + 'px';
    rpanelEl.style.transform = 'translateY(0)';
  }
  resize();
}, { passive: false });
function endSheetDrag() {
  if (!sheetDrag) return;
  const rpanelEl = document.getElementById('rpanel');
  rpanelEl.classList.remove('sheet-dragging');
  const dismiss = sheetDrag.dismiss;
  sheetDrag = null;
  if (dismiss > 70) { closePanel(); return; }
  rpanelEl.style.transform = 'translateY(0)';
  if (state.panelOpen) requestAnimationFrame(drawSelection);
}
sheetGrip.addEventListener('touchend', endSheetDrag);
sheetGrip.addEventListener('touchcancel', endSheetDrag);

// ── Close button ──
document.getElementById('close-panel').addEventListener('click', closePanel);

// ── Mode controls ──
document.getElementById('btn-explore').addEventListener('click', () => {
  state.compareMode = false; state.cmpStar = null;
  document.getElementById('btn-explore').classList.add('on');
  document.getElementById('btn-compare').classList.remove('on');
  document.getElementById('cmp-note').classList.remove('show');
  drawSelection(); drawDiagram();
});
document.getElementById('btn-compare').addEventListener('click', () => {
  state.compareMode = true;
  document.getElementById('btn-compare').classList.add('on');
  document.getElementById('btn-explore').classList.remove('on');
  document.getElementById('cmp-note').classList.add('show');
});

['radius', 'zams', 'regions', 'stars', 'color'].forEach(k => {
  document.getElementById(`l-${k}`).addEventListener('click', () => {
    state.layers[k] = !state.layers[k];
    document.getElementById(`l-${k}`).classList.toggle('on', state.layers[k]);
    drawDiagram();
  });
});

const scaleBtn = document.getElementById('scale-toggle');
const SCALE_MODES = ['log', 'real', 'norm'];
const SCALE_LABELS = { log: 'log scale', real: 'real scale', norm: 'normalized' };
scaleBtn.addEventListener('click', () => {
  const idx = SCALE_MODES.indexOf(state.scaleMode);
  state.scaleMode = SCALE_MODES[(idx + 1) % 3];
  scaleBtn.textContent = SCALE_LABELS[state.scaleMode];
  scaleBtn.classList.toggle('on', state.scaleMode !== 'log');
  drawSelection();
});

// ── Mobile tab bar ──
document.getElementById('tab-diagram').addEventListener('click', () => goTab('diagram'));
document.getElementById('tab-stars').addEventListener('click', () => goTab('stars'));

// ── Understand overlay ──
const understandEl = document.getElementById('understand');
const btnUnderstand = document.getElementById('btn-understand');
const refreshUnderstand = initUnderstand();
function setUnderstand(open) {
  understandEl.classList.toggle('is-open', open);
  btnUnderstand.classList.toggle('on', open);
  // The widget canvas has zero width while the overlay is display:none, so its
  // first real sizing has to happen once the overlay is visible.
  if (open) requestAnimationFrame(refreshUnderstand);
}
btnUnderstand.addEventListener('click', () => setUnderstand(!understandEl.classList.contains('is-open')));
document.getElementById('close-understand').addEventListener('click', () => setUnderstand(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setUnderstand(false); });

// Understand detail level: compact (default) | detailed (extra deep-dive sections)
const understandBody = document.getElementById('understand-body');
const umodeCompact = document.getElementById('umode-compact');
const umodeDetailed = document.getElementById('umode-detailed');
function setUMode(detailed) {
  understandBody.classList.toggle('detailed', detailed);
  umodeDetailed.classList.toggle('on', detailed);
  umodeCompact.classList.toggle('on', !detailed);
  localStorage.setItem('hrd-u-mode', detailed ? 'detailed' : 'compact');
}
umodeCompact.addEventListener('click', () => setUMode(false));
umodeDetailed.addEventListener('click', () => setUMode(true));
setUMode(localStorage.getItem('hrd-u-mode') === 'detailed');

// ── Theme (system / light / dark) ──
const THEME_CYCLE = ['system', 'light', 'dark'];
const THEME_ICON = { system: '◐', light: '☀', dark: '☾' };
function refreshThemeButton(pref) {
  document.getElementById('theme-icon').textContent = THEME_ICON[pref];
  document.getElementById('theme-label').textContent = pref.charAt(0).toUpperCase() + pref.slice(1);
}
function redrawAll() { drawDiagram(); if (state.panelOpen) drawSelection(); }
document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(getPref()) + 1) % THEME_CYCLE.length];
  applyTheme(next);
  refreshThemeButton(next);
  redrawAll();
});
initTheme(redrawAll);
refreshThemeButton(getPref());

// ── Canvas interaction ──
attachHandlers(hc, state, { onUpdate: drawDiagram, onPick: pick, isMobile, stars: STARS, R });

// ── Init ──
buildListIn('slist-items-desktop', pick);
buildListIn('slist-items-mobile', pick);

window.addEventListener('resize', () => {
  // Re-apply mobile tab state in case orientation changed
  if (isMobile()) goTab(state.activeTab);
  resize();
});

resize();
setTimeout(() => pick(STARS.find(s => s.name === 'Sun')), 80);

// ── PWA service worker (skip on file://, where SW is unavailable) ──
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}
