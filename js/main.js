// ═══════════════════════════════════
// MAIN — entry point, state owner, wiring
// ═══════════════════════════════════
// Owns all mutable state and the canvas contexts. Every other module is
// pure or receives what it needs as arguments.

import { calcR } from './physics.js';
import { STARS } from './stars.js';
import { R, setR } from './coords.js';
import { drawHRD } from './hrd-renderer.js';
import { drawPreview } from './preview-renderer.js';
import { updatePanel, buildListIn, updateListSel, switchTab } from './ui.js';
import { attachHandlers } from './interaction.js';

// ── Canvas refs ──
const hc = document.getElementById('hrd-canvas'), hx = hc.getContext('2d');
const sc = document.getElementById('star-canvas'), sx = sc.getContext('2d');

// ── State (single owner) ──
const state = {
  layers: { radius: true, zams: true, regions: true, stars: true, color: false },
  scaleMode: 'log',
  selStar: null,
  cmpStar: null,
  compareMode: false,
  hover: null,
  activeTab: 'diagram', // 'diagram' | 'info' | 'stars'
};

const isMobile = () => window.innerWidth < 768;

// ── Drawing ──
function drawDiagram() { drawHRD(hx, R, state); }

function drawSelection() {
  if (!state.selStar) return;
  const B = state.cmpStar ? { teff: state.cmpStar.teff, R: calcR(state.cmpStar.logL, state.cmpStar.teff) } : null;
  drawPreview(sx, state.selStar.teff, state.selStar.logL, B, state.scaleMode);
  updatePanel(state.selStar.teff, state.selStar.logL, state.selStar.name);
}

// ── Selection ──
// Accepts a named STAR or a synthetic {teff, logL, name:null, spec} point.
function pick(obj) {
  const isSecond = state.compareMode && state.selStar && !(obj.name && obj.name === state.selStar.name);
  if (isSecond) {
    state.cmpStar = obj;
  } else {
    state.cmpStar = null;
    state.selStar = obj;
  }
  drawSelection();
  updateListSel(state.selStar && state.selStar.name, state.cmpStar && state.cmpStar.name);
  drawDiagram();
  if (isMobile()) goTab('info');
}

// ── Mobile tabs ──
function goTab(tab) {
  state.activeTab = tab;
  switchTab(tab, isMobile(), onTabShown);
}
function onTabShown(tab) {
  if (tab === 'diagram') requestAnimationFrame(resize);
  if (tab === 'info' && state.selStar) requestAnimationFrame(drawSelection);
}

// ── Resize ──
function resize() {
  const wrap = document.getElementById('hrd-wrap');
  hc.width = wrap.clientWidth; hc.height = wrap.clientHeight;
  const pw = isMobile() ? window.innerWidth : 310;
  const ph = isMobile() ? 180 : 210;
  sc.width = pw; sc.height = ph;
  const pad = { t: 28, r: 18, b: 48, l: isMobile() ? 52 : 64 };
  setR(pad.l, pad.t, hc.width - pad.l - pad.r, hc.height - pad.t - pad.b);
  drawDiagram();
  drawSelection();
}

// ── Controls ──
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

document.getElementById('tab-diagram').addEventListener('click', () => goTab('diagram'));
document.getElementById('tab-info').addEventListener('click', () => goTab('info'));
document.getElementById('tab-stars').addEventListener('click', () => goTab('stars'));

// ── Canvas interaction ──
attachHandlers(hc, state, { onUpdate: drawDiagram, onPick: pick, isMobile, stars: STARS, R });

// ── Init ──
buildListIn('slist-items-desktop', pick);
buildListIn('slist-items-mobile', pick);

window.addEventListener('resize', () => {
  if (isMobile()) goTab(state.activeTab);
  resize();
});

resize();
setTimeout(() => pick(STARS.find(s => s.name === 'Sun')), 80);
