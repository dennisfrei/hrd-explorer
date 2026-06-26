// ═══════════════════════════════════
// MAIN — entry point, state owner, wiring
// ═══════════════════════════════════

import { calcR, stype } from './physics.js';
import { STARS } from './stars.js';
import { R, setR, TMIN, TMAX, LMIN, LMAX } from './coords.js';
import { drawHRD } from './hrd-renderer.js';
import { drawPreview } from './preview-renderer.js';
import { updatePanel, buildListIn, updateListSel, filterList, sortList } from './ui.js';
import { attachHandlers } from './interaction.js';
import { initTheme, applyTheme, getPref } from './theme.js';
import { initUnderstand } from './understand.js';
import { exportPNG, parseHash, writeHash } from './share.js';
import { pickTarget, scoreGuess } from './quiz.js';
import { initTour } from './tour.js';

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
  quiz: null, // { active, target, guess, revealed, score, round }
  yMode: 'lum', // y-axis quantity: 'lum' (log L/L☉) | 'appmag' (apparent m_bol)
};

const isMobile = () => window.innerWidth < 640;
const isTablet = () => window.innerWidth >= 640 && window.innerWidth < 1024;

// ── Drawing ──
function drawDiagram() { drawHRD(hx, R, state); }

function drawSelection() {
  if (!state.selStar) return;
  const B = state.cmpStar ? { teff: state.cmpStar.teff, R: calcR(state.cmpStar.logL, state.cmpStar.teff) } : null;
  drawPreview(sx, state.selStar.teff, state.selStar.logL, B, state.scaleMode);
  updatePanel(state.selStar.teff, state.selStar.logL, state.selStar.name, state.selStar.dist);
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
  updateTabBar();
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
  updateTabBar();
}

// ── Selection ──
function pick(obj) {
  // In quiz mode a click is a guess, not a selection.
  if (state.quiz && state.quiz.active) { handleGuess(obj.teff, obj.logL); return; }
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
  writeHash(state);
}

// ── Mobile tab switching (Diagram | Details | Stars | Understand) ──
function setTabOn(id, on) { const e = document.getElementById(id); if (e) e.classList.toggle('on', on); }
// Reflect the current view in the bottom tab bar. Details and Diagram share the
// same pane (the detail sheet overlays the diagram), so Details lights up
// whenever the panel is open; Understand wins while its overlay is up.
function updateTabBar() {
  if (!isMobile()) return;
  const understandOpen = understandEl.classList.contains('is-open');
  const onStars = state.activeTab === 'stars';
  const onDetails = !onStars && state.panelOpen;
  setTabOn('tab-diagram', !understandOpen && !onStars && !onDetails);
  setTabOn('tab-details', !understandOpen && onDetails);
  setTabOn('tab-stars', !understandOpen && onStars);
  setTabOn('tab-understand', understandOpen);
}
function goTab(tab) {
  if (!isMobile()) return;
  // Details isn't a separate pane — it reopens the detail sheet over the diagram.
  if (tab === 'details') {
    state.activeTab = 'diagram';
    document.getElementById('content-area').classList.remove('tab-hidden');
    document.getElementById('slist-wrap').classList.remove('is-active');
    openPanel();
    requestAnimationFrame(resize);
    updateTabBar();
    return;
  }
  state.activeTab = tab;
  const diagActive = tab === 'diagram';
  document.getElementById('content-area').classList.toggle('tab-hidden', !diagActive);
  document.getElementById('slist-wrap').classList.toggle('is-active', !diagActive);
  if (diagActive) requestAnimationFrame(resize);
  updateTabBar();
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
function setExplore() {
  state.compareMode = false; state.cmpStar = null;
  document.getElementById('btn-explore').classList.add('on');
  document.getElementById('btn-compare').classList.remove('on');
  document.getElementById('cmp-note').classList.remove('show');
}
function setCompare() {
  state.compareMode = true;
  document.getElementById('btn-compare').classList.add('on');
  document.getElementById('btn-explore').classList.remove('on');
  document.getElementById('cmp-note').classList.add('show');
}
document.getElementById('btn-explore').addEventListener('click', () => {
  if (state.quiz) stopQuiz();
  setExplore(); drawSelection(); drawDiagram(); writeHash(state);
});
document.getElementById('btn-compare').addEventListener('click', () => {
  if (state.quiz) stopQuiz();
  setCompare(); writeHash(state);
});

['radius', 'zams', 'regions', 'stars', 'color'].forEach(k => {
  document.getElementById(`l-${k}`).addEventListener('click', () => {
    state.layers[k] = !state.layers[k];
    document.getElementById(`l-${k}`).classList.toggle('on', state.layers[k]);
    drawDiagram();
    writeHash(state);
  });
});

// ── Quiz mode ──
const hrdWrap = document.getElementById('hrd-wrap');
const quizPrompt = document.getElementById('quiz-prompt');
const quizScore = document.getElementById('quiz-score');
const quizNext = document.getElementById('quiz-next');
const btnQuiz = document.getElementById('btn-quiz');

function startQuiz() {
  setExplore();
  if (state.yMode !== 'lum') setYMode('lum'); // quiz is a luminosity-plane exercise
  closePanel();
  state.quiz = { active: true, target: null, guess: null, revealed: false, score: 0, round: 0 };
  btnQuiz.classList.add('on');
  hrdWrap.classList.add('quiz');
  nextQuiz();
}
function stopQuiz() {
  state.quiz = null;
  btnQuiz.classList.remove('on');
  hrdWrap.classList.remove('quiz');
  drawDiagram();
}
function nextQuiz() {
  const q = state.quiz; if (!q) return;
  q.target = pickTarget(q.target);
  q.guess = null; q.revealed = false; q.round++;
  quizPrompt.innerHTML = `Find <b>${q.target.name}</b> · ${q.target.spec}`;
  quizScore.textContent = `Score ${q.score} · Round ${q.round}`;
  quizNext.hidden = true;
  drawDiagram();
}
function handleGuess(teff, logL) {
  const q = state.quiz; if (!q || q.revealed) return;
  q.guess = { teff, logL };
  q.revealed = true;
  const { points, verdict } = scoreGuess(q.target, teff, logL);
  q.score += points;
  quizPrompt.innerHTML = `<b>${verdict}</b> · +${points} — that was <b>${q.target.name}</b> (${q.target.spec})`;
  quizScore.textContent = `Score ${q.score} · Round ${q.round}`;
  quizNext.hidden = false;
  drawDiagram();
}
btnQuiz.addEventListener('click', () => { state.quiz ? stopQuiz() : startQuiz(); });
quizNext.addEventListener('click', nextQuiz);
document.getElementById('quiz-exit').addEventListener('click', stopQuiz);

// ── Y-axis mode (luminosity ↔ apparent magnitude) ──
const yaxisToggle = document.getElementById('yaxis-toggle');
const YMODE_LABEL = { lum: 'y · log L', appmag: 'y · m (app)' };
function setYMode(mode) {
  state.yMode = mode;
  yaxisToggle.textContent = YMODE_LABEL[mode];
  yaxisToggle.classList.toggle('on', mode === 'appmag');
  // The distance-dependent overlays have no place on the apparent-mag axis.
  ['radius', 'zams', 'regions'].forEach(k =>
    document.getElementById(`l-${k}`).classList.toggle('lbtn-na', mode === 'appmag'));
  drawDiagram();
  if (state.panelOpen) drawSelection();
}
yaxisToggle.addEventListener('click', () => {
  if (state.quiz) stopQuiz();
  setYMode(state.yMode === 'lum' ? 'appmag' : 'lum');
  writeHash(state);
});

// ── Star list filter & sort ──
document.getElementById('sfilter-desktop').addEventListener('input', e => filterList('slist-items-desktop', e.target.value));
document.getElementById('sfilter-mobile').addEventListener('input', e => filterList('slist-items-mobile', e.target.value));
document.getElementById('ssort-desktop').addEventListener('change', e => sortList('slist-items-desktop', e.target.value));
document.getElementById('ssort-mobile').addEventListener('change', e => sortList('slist-items-mobile', e.target.value));

// ── Share & export ──
document.getElementById('btn-export').addEventListener('click', () => {
  exportPNG(hc, ex => drawHRD(ex, R, state), 'HR Diagram Explorer');
});
const btnCopy = document.getElementById('btn-copylink');
btnCopy.addEventListener('click', async () => {
  writeHash(state);
  const restore = txt => { btnCopy.textContent = txt; setTimeout(() => (btnCopy.textContent = 'Copy link'), 1400); };
  try { await navigator.clipboard.writeText(location.href); restore('Copied!'); }
  catch { restore('Press ⌘/Ctrl C'); }
});

// ── Guided tour ──
const tour = initTour([
  { title: 'The HR diagram', sel: '#hrd-wrap',
    text: 'Every point is a star — hot blue stars to the left, cool red ones to the right; luminous at the top, faint at the bottom. Click anywhere to read off its properties.' },
  { title: 'Modes', sel: '.hgroup',
    text: 'Explore reads off any point, Compare sizes two stars side by side, and Understand opens the physics explainer with interactive sliders.' },
  { title: 'Quiz yourself', sel: '#btn-quiz',
    text: 'Quiz mode names a star and asks you to place it on the diagram, then scores how close your guess was.' },
  { title: 'Diagram layers', sel: '#l-radius',
    text: 'Toggle the radius isolines, the ZAMS line, region labels, the known-star dots and a colour background.' },
  { title: 'Find a star', sel: '.sfilter',
    text: 'Filter the 25 curated stars by name or spectral type, then click one to jump to it.' },
  { title: 'Share & export', sel: '#btn-export',
    text: 'Copy a link that restores this exact view, or save the diagram as a PNG for slides and handouts.' },
  { title: 'Theme', sel: '#theme-toggle',
    text: 'Switch between light, dark, and following your system setting.' },
]);
document.getElementById('btn-tour').addEventListener('click', () => tour.start());

const scaleBtn = document.getElementById('scale-toggle');
const SCALE_MODES = ['log', 'real', 'norm'];
const SCALE_LABELS = { log: 'log scale', real: 'real scale', norm: 'normalized' };
scaleBtn.addEventListener('click', () => {
  const idx = SCALE_MODES.indexOf(state.scaleMode);
  state.scaleMode = SCALE_MODES[(idx + 1) % 3];
  scaleBtn.textContent = SCALE_LABELS[state.scaleMode];
  scaleBtn.classList.toggle('on', state.scaleMode !== 'log');
  drawSelection();
  writeHash(state);
});

// ── Mobile tab bar ──
document.getElementById('tab-diagram').addEventListener('click', () => goTab('diagram'));
document.getElementById('tab-details').addEventListener('click', () => goTab('details'));
document.getElementById('tab-stars').addEventListener('click', () => goTab('stars'));
document.getElementById('tab-understand').addEventListener('click', () => setUnderstand(!understandEl.classList.contains('is-open')));

// ── Understand overlay ──
const understandEl = document.getElementById('understand');
const btnUnderstand = document.getElementById('btn-understand');
const refreshUnderstand = initUnderstand();
function setUnderstand(open) {
  understandEl.classList.toggle('is-open', open);
  btnUnderstand.classList.toggle('on', open);
  updateTabBar();
  // The widget canvas has zero width while the overlay is display:none, so its
  // first real sizing has to happen once the overlay is visible.
  if (open) requestAnimationFrame(refreshUnderstand);
}
btnUnderstand.addEventListener('click', () => setUnderstand(!understandEl.classList.contains('is-open')));
document.getElementById('close-understand').addEventListener('click', () => setUnderstand(false));

// ── Keyboard ──
// Escape steps back through the open layers; arrow keys nudge the selected
// point around the diagram (Shift = coarser steps).
const KEY_STEP_T = 0.02, KEY_STEP_L = 0.1; // dex per press
const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.body.classList.contains('tour-on')) return; // tour owns Esc
    if (understandEl.classList.contains('is-open')) setUnderstand(false);
    else if (state.quiz) stopQuiz();
    else if (state.panelOpen) closePanel();
    return;
  }
  if (!ARROWS.includes(e.key)) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (understandEl.classList.contains('is-open') || document.body.classList.contains('tour-on')) return;
  if (state.quiz && state.quiz.active) return;
  if (state.yMode === 'appmag') return; // free points have no luminosity to nudge
  if (!state.selStar) return;
  e.preventDefault();
  const mult = e.shiftKey ? 4 : 1;
  let logT = Math.log10(state.selStar.teff), logL = state.selStar.logL;
  if (e.key === 'ArrowLeft') logT += KEY_STEP_T * mult;   // hotter is to the left
  if (e.key === 'ArrowRight') logT -= KEY_STEP_T * mult;
  if (e.key === 'ArrowUp') logL += KEY_STEP_L * mult;
  if (e.key === 'ArrowDown') logL -= KEY_STEP_L * mult;
  logT = Math.max(Math.log10(TMIN), Math.min(Math.log10(TMAX), logT));
  logL = Math.max(LMIN, Math.min(LMAX, logL));
  const teff = Math.pow(10, logT);
  pick({ teff, logL, name: null, spec: stype(teff) });
});

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

// Restore an explorable view from the URL hash, or fall back to the Sun.
function restoreFromHash() {
  const h = parseHash();
  if (!h) return false;
  if (h.layers) {
    Object.keys(state.layers).forEach(k => {
      state.layers[k] = h.layers[k];
      document.getElementById(`l-${k}`).classList.toggle('on', state.layers[k]);
    });
  }
  if (h.compareMode) setCompare();
  if (h.yMode === 'appmag') setYMode('appmag');
  if (h.scaleMode && h.scaleMode !== 'log') {
    state.scaleMode = h.scaleMode;
    scaleBtn.textContent = SCALE_LABELS[state.scaleMode];
    scaleBtn.classList.add('on');
  }
  const resolve = (name, point) => {
    if (name) return STARS.find(s => s.name === name) || null;
    if (point) { const [t, y] = point; return { teff: t, logL: y, name: null, spec: stype(t) }; }
    return null;
  };
  const sel = resolve(h.selName, h.selPoint);
  if (!sel) return false;
  state.selStar = sel;
  state.cmpStar = state.compareMode ? resolve(h.cmpName, h.cmpPoint) : null;
  openPanel();
  drawSelection();
  updateListSel(sel.name, state.cmpStar && state.cmpStar.name);
  drawDiagram();
  return true;
}

resize();
setTimeout(() => { if (!restoreFromHash()) pick(STARS.find(s => s.name === 'Sun')); }, 80);

// ── PWA service worker (skip on file://, where SW is unavailable) ──
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}
