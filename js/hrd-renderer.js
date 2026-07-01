// ═══════════════════════════════════
// HRD RENDERER — main diagram canvas
// ═══════════════════════════════════
// All functions receive the 2D context `hx` and plot-rect `R` explicitly,
// so their dependencies are visible at the call site and they stay testable.
// UI colours come from THEME (light/dark aware); blackbody star colours are
// physical and theme-independent.

import { SIGMA, LSUN, RSUN, ZAMS, tRGB, tc, appMagBol } from './physics.js';
import { TMIN, TMAX, LMIN, LMAX, MAGTOP, MAGBOT, tx, ly, magY, xteff } from './coords.js';
import { STARS } from './stars.js';
import { THEME } from './theme.js';

const ink = (a) => `rgba(${THEME.ink},${a})`;

// y pixel for a point given the active y-axis mode. Returns null when the
// quantity is undefined — apparent magnitude needs a catalogue distance.
function starY(state, logL, dist) {
  if (state.yMode === 'appmag') return dist ? magY(appMagBol(logL, dist)) : null;
  return ly(logL);
}

// Draw a label with subscript segments, centred on cx at baseline y.
// parts: [{ s }, { s, sub:true }, …]. Lets canvas axes use real math
// typography (T with a lowered "eff", L with a lowered ⊙) that MathML gives
// the DOM but the 2D context cannot.
function mathLabel(hx, cx, y, parts, baseFont, subFont) {
  let w = 0;
  parts.forEach(p => { hx.font = p.sub ? subFont : baseFont; w += hx.measureText(p.s).width; });
  const prevAlign = hx.textAlign;
  hx.textAlign = 'left';
  let x = cx - w / 2;
  parts.forEach(p => {
    hx.font = p.sub ? subFont : baseFont;
    hx.fillText(p.s, x, p.sub ? y + 2 : y);
    x += hx.measureText(p.s).width;
  });
  hx.textAlign = prevAlign;
}

export function drawHRD(hx, R, state) {
  // Logical (CSS-pixel) size: the backing store may be scaled for HiDPI or
  // PNG export, so divide the raw canvas size by the context transform.
  const t = hx.getTransform();
  const W = hx.canvas.width / (t.a || 1), H = hx.canvas.height / (t.d || 1);
  const appmag = state.yMode === 'appmag';
  hx.clearRect(0, 0, W, H);
  hx.fillStyle = THEME.hrdBg; hx.fillRect(0, 0, W, H);
  if (state.layers.color) drawColorBG(hx, R);
  drawGrid(hx, R, appmag);
  // ZAMS, R-isolines and region labels are loci of (Teff, L) with no fixed
  // apparent-magnitude position, so they only appear on the luminosity axis.
  if (!appmag && state.layers.radius) drawRiso(hx, R);
  if (!appmag && state.layers.zams) drawZAMSline(hx);
  if (!appmag && state.layers.regions) drawRegions(hx, R);
  drawAxes(hx, R, appmag);
  // While a quiz question is unanswered the known-star dots are hidden so the
  // answer isn't given away; they reappear once the guess is revealed.
  const quizHiding = state.quiz && state.quiz.active && !state.quiz.revealed;
  if (state.layers.stars && !quizHiding) drawDots(hx, R, state);
  if (state.hover) drawCross(hx, R, state.hover);
  if (state.selStar) {
    const sy = starY(state, state.selStar.logL, state.selStar.dist);
    if (sy !== null) drawHL(hx, R, tx(state.selStar.teff), sy, `rgba(${THEME.sel},0.6)`);
  }
  if (state.cmpStar) {
    const cy = starY(state, state.cmpStar.logL, state.cmpStar.dist);
    if (cy !== null) drawHL(hx, R, tx(state.cmpStar.teff), cy, `rgba(${THEME.cmp},0.55)`);
  }
  if (state.quiz && state.quiz.active) drawQuiz(hx, R, state.quiz);
}

// Quiz overlay: once revealed, ring the true position (gold), mark the guess
// (red ✕) and connect them.
function drawQuiz(hx, R, q) {
  if (!q.revealed || !q.target) return;
  const tX = tx(q.target.teff), tY = ly(q.target.logL);
  if (q.guess) {
    const gX = tx(q.guess.teff), gY = ly(q.guess.logL);
    hx.strokeStyle = ink(0.55); hx.lineWidth = 1; hx.setLineDash([3, 4]);
    hx.beginPath(); hx.moveTo(gX, gY); hx.lineTo(tX, tY); hx.stroke(); hx.setLineDash([]);
    hx.strokeStyle = 'rgba(255,105,105,0.95)'; hx.lineWidth = 2;
    hx.beginPath();
    hx.moveTo(gX - 5, gY - 5); hx.lineTo(gX + 5, gY + 5);
    hx.moveTo(gX + 5, gY - 5); hx.lineTo(gX - 5, gY + 5); hx.stroke();
  }
  hx.strokeStyle = 'rgba(255,205,80,0.95)'; hx.lineWidth = 2;
  hx.beginPath(); hx.arc(tX, tY, 9, 0, Math.PI * 2); hx.stroke();
  hx.fillStyle = 'rgba(255,205,80,0.95)'; hx.font = '10px Space Grotesk,sans-serif';
  hx.textAlign = tX > R.x + R.w * 0.7 ? 'right' : 'left';
  hx.fillText(q.target.name, tX + (hx.textAlign === 'right' ? -12 : 12), tY + 3);
}

// The blackbody wash is ~400 gradient columns — too costly to recompute on
// every repaint (hover redraws included), so render it once per plot-rect ×
// theme into an offscreen canvas and blit it.
let bgCache = null; // { key, canvas }
function drawColorBG(hx, R) {
  if (R.w <= 0 || R.h <= 0) return;
  const key = `${R.x}|${R.y}|${R.w}|${R.h}|${THEME.isLight}`;
  if (!bgCache || bgCache.key !== key) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(R.w); c.height = Math.ceil(R.h);
    const cx = c.getContext('2d');
    const a = THEME.isLight ? 0.14 : 0.06;
    for (let px = 0; px < R.w; px += 3) {
      const [r2, g, b] = tRGB(xteff(R.x + px));
      cx.fillStyle = `rgba(${r2},${g},${b},${a})`;
      cx.fillRect(px, 0, 3, R.h);
    }
    bgCache = { key, canvas: c };
  }
  hx.drawImage(bgCache.canvas, R.x, R.y);
}

function drawGrid(hx, R, appmag) {
  hx.strokeStyle = ink(THEME.isLight ? 0.12 : 0.055); hx.lineWidth = 1;
  if (appmag) {
    for (let m = Math.ceil(MAGTOP / 2) * 2; m <= MAGBOT; m += 2) {
      const y = magY(m); hx.beginPath(); hx.moveTo(R.x, y); hx.lineTo(R.x + R.w, y); hx.stroke();
    }
  } else {
    for (let l = Math.ceil(LMIN); l <= Math.floor(LMAX); l++) {
      const y = ly(l); hx.beginPath(); hx.moveTo(R.x, y); hx.lineTo(R.x + R.w, y); hx.stroke();
    }
  }
  [50000, 30000, 20000, 10000, 7500, 6000, 5000, 4000, 3000, 2500].forEach(t => {
    const x = tx(t); hx.beginPath(); hx.moveTo(x, R.y); hx.lineTo(x, R.y + R.h); hx.stroke();
  });
}

function drawRiso(hx, R) {
  const radii = [0.01, 0.1, 1, 10, 100, 1000];
  const labels = ['0.01 R☉', '0.1 R☉', '1 R☉', '10 R☉', '100 R☉', '1000 R☉'];
  radii.forEach((Rv, i) => {
    const logC = Math.log10(4 * Math.PI * SIGMA * Math.pow(Rv * RSUN, 2) / LSUN);
    hx.strokeStyle = ink(THEME.isLight ? 0.28 : 0.16); hx.lineWidth = 0.8; hx.setLineDash([3, 5]);
    hx.beginPath(); let first = true;
    for (let logT = Math.log10(TMIN); logT <= Math.log10(TMAX); logT += 0.015) {
      const teff = Math.pow(10, logT), logL = logC + 4 * logT;
      if (logL < LMIN || logL > LMAX) continue;
      const x = tx(teff), y = ly(logL);
      first ? (hx.moveTo(x, y), first = false) : hx.lineTo(x, y);
    }
    hx.stroke(); hx.setLineDash([]);
    const lT = 14000, lL = logC + 4 * Math.log10(lT);
    if (lL >= LMIN && lL <= LMAX) {
      const lx = tx(lT), ly2 = ly(lL);
      if (lx > R.x + 5 && lx < R.x + R.w - 10) {
        const slope = 4 * R.h / ((Math.log10(TMAX) - Math.log10(TMIN)) * R.w);
        hx.save(); hx.translate(lx, ly2); hx.rotate(-Math.atan(slope));
        hx.fillStyle = ink(THEME.isLight ? 0.5 : 0.36); hx.font = '9px JetBrains Mono,monospace';
        hx.textAlign = 'left'; hx.fillText(labels[i], 4, -3); hx.restore();
      }
    }
  });
}

function drawZAMSline(hx) {
  hx.strokeStyle = `rgba(${THEME.zams},${THEME.isLight ? 0.55 : 0.28})`; hx.lineWidth = 1.8; hx.setLineDash([]);
  hx.beginPath(); let first = true;
  ZAMS.forEach(([teff, logL]) => {
    if (logL < LMIN || logL > LMAX) return;
    first ? (hx.moveTo(tx(teff), ly(logL)), first = false) : hx.lineTo(tx(teff), ly(logL));
  });
  hx.stroke();
  const [mt, ml] = ZAMS[7];
  hx.fillStyle = `rgba(${THEME.zams},${THEME.isLight ? 0.7 : 0.32})`; hx.font = '9px Space Grotesk,sans-serif';
  hx.textAlign = 'left'; hx.fillText('ZAMS (Ekström+2012)', tx(mt) + 5, ly(ml) - 4);
}

function drawRegions(hx, R) {
  const regs = [
    { l: 'Main Sequence', t: 9000, L: 2.2 },
    { l: 'Red Giants', t: 4200, L: 2.0 },
    { l: 'Red Supergiants', t: 3900, L: 4.9 },
    { l: 'Blue Supergiants', t: 22000, L: 5.3 },
    { l: 'White Dwarfs', t: 20000, L: -2.3 },
  ];
  hx.font = '9px Space Grotesk,sans-serif'; hx.fillStyle = ink(THEME.isLight ? 0.38 : 0.22);
  regs.forEach(({ l, t, L }) => {
    const x = tx(t), y = ly(L);
    if (x > R.x + 5 && x < R.x + R.w - 5 && y > R.y + 5 && y < R.y + R.h - 5) { hx.textAlign = 'left'; hx.fillText(l, x, y); }
  });
}

function drawAxes(hx, R, appmag) {
  hx.strokeStyle = ink(THEME.isLight ? 0.42 : 0.28); hx.lineWidth = 1; hx.strokeRect(R.x, R.y, R.w, R.h);
  hx.font = '10px JetBrains Mono,monospace'; hx.fillStyle = ink(THEME.isLight ? 0.72 : 0.52);
  hx.textAlign = 'right';
  if (appmag) {
    for (let m = Math.ceil(MAGTOP / 2) * 2; m <= MAGBOT; m += 2) {
      const y = magY(m); if (y < R.y - 2 || y > R.y + R.h + 2) continue;
      hx.fillText(m.toString(), R.x - 7, y + 3.5);
    }
  } else {
    for (let l = Math.ceil(LMIN); l <= Math.floor(LMAX); l += 1) {
      const y = ly(l); if (y < R.y - 2 || y > R.y + R.h + 2) continue;
      hx.fillText(l.toString(), R.x - 7, y + 3.5);
    }
  }
  hx.textAlign = 'center';
  [50000, 30000, 20000, 10000, 7500, 6000, 5000, 4000, 3000].forEach(t => {
    hx.fillText(t >= 1000 ? (t / 1000).toFixed(0) + 'k' : t, tx(t), R.y + R.h + 15);
  });
  hx.save(); hx.translate(16, R.y + R.h / 2); hx.rotate(-Math.PI / 2);
  hx.fillStyle = ink(THEME.isLight ? 0.6 : 0.42);
  if (appmag) {
    mathLabel(hx, 0, 0, [{ s: 'm' }, { s: 'bol', sub: true }, { s: '  —  brighter ↑' }],
      '10px Space Grotesk,sans-serif', '8px Space Grotesk,sans-serif');
  } else {
    mathLabel(hx, 0, 0, [{ s: 'log (L/L' }, { s: '⊙', sub: true }, { s: ')' }],
      '10px Space Grotesk,sans-serif', '8px Space Grotesk,sans-serif');
  }
  hx.restore();
  hx.fillStyle = ink(THEME.isLight ? 0.55 : 0.35);
  mathLabel(hx, R.x + R.w / 2, R.y + R.h + 30,
    [{ s: 'T' }, { s: 'eff', sub: true }, { s: ' [K]  —  hotter ←' }],
    '9px Space Grotesk,sans-serif', '7px Space Grotesk,sans-serif');
}

function drawDots(hx, R, state) {
  const { selStar, cmpStar } = state;
  STARS.forEach(s => {
    const y = starY(state, s.logL, s.dist);
    if (y === null) return; // no distance → not plottable on the apparent-mag axis
    const x = tx(s.teff);
    if (x < R.x || x > R.x + R.w || y < R.y || y > R.y + R.h) return;
    const isSel = selStar && selStar.name === s.name;
    const isCmp = cmpStar && cmpStar.name === s.name;
    const gr = isSel ? 18 : 10;
    const g = hx.createRadialGradient(x, y, 0, x, y, gr);
    g.addColorStop(0, tc(s.teff, isSel ? 0.5 : 0.18));
    g.addColorStop(1, tc(s.teff, 0));
    hx.fillStyle = g; hx.beginPath(); hx.arc(x, y, gr, 0, Math.PI * 2); hx.fill();
    const dot = isSel ? 5 : Math.max(2, 2 + s.logL * 0.28);
    hx.fillStyle = tc(s.teff); hx.beginPath(); hx.arc(x, y, dot, 0, Math.PI * 2); hx.fill();
    // On a light background pale-blue/white stars need a thin ink outline.
    if (THEME.isLight && !isSel && !isCmp) {
      hx.strokeStyle = ink(0.5); hx.lineWidth = 0.8; hx.beginPath(); hx.arc(x, y, dot, 0, Math.PI * 2); hx.stroke();
    }
    if (isSel || isCmp) {
      hx.strokeStyle = isCmp ? `rgba(${THEME.cmp},0.85)` : `rgba(${THEME.sel},0.85)`;
      hx.lineWidth = 1.5; hx.beginPath(); hx.arc(x, y, dot + 2.5, 0, Math.PI * 2); hx.stroke();
      hx.fillStyle = `rgba(${THEME.sel},0.78)`; hx.font = '10px Space Grotesk,sans-serif';
      hx.textAlign = x > R.x + R.w * 0.68 ? 'right' : 'left';
      hx.fillText(s.name, x + (hx.textAlign === 'right' ? -9 : 9), y - 9);
    }
  });
}

function drawHL(hx, R, x, y, col) {
  hx.strokeStyle = col; hx.lineWidth = 0.8; hx.setLineDash([2, 4]);
  hx.beginPath(); hx.moveTo(R.x, y); hx.lineTo(R.x + R.w, y);
  hx.moveTo(x, R.y); hx.lineTo(x, R.y + R.h); hx.stroke(); hx.setLineDash([]);
}

function drawCross(hx, R, pos) {
  if (pos.x < R.x || pos.x > R.x + R.w || pos.y < R.y || pos.y > R.y + R.h) return;
  hx.strokeStyle = ink(THEME.isLight ? 0.3 : 0.16); hx.lineWidth = 1; hx.setLineDash([2, 4]);
  hx.beginPath(); hx.moveTo(pos.x, R.y); hx.lineTo(pos.x, R.y + R.h);
  hx.moveTo(R.x, pos.y); hx.lineTo(R.x + R.w, pos.y); hx.stroke(); hx.setLineDash([]);
}
