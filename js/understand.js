// ═══════════════════════════════════
// UNDERSTAND — interactive parameter playground
// ═══════════════════════════════════
// A slider-driven widget for the Understand overlay. Two inputs — the HRD's own
// axes, T_eff and log(L/L☉) — drive every derived quantity live, so students
// can see how the physical parameters are connected. The canvas shows the
// resulting star disk (colour from the blackbody table, size from the
// Stefan–Boltzmann radius) and its Planck spectrum with λ_max marked.
// All physics comes from physics.js; nothing here is domain logic.

import {
  calcR, calcLmax, stype, lumClass, onZAMS, massOnZAMS, msLife, estAge, tRGB,
} from './physics.js';
import { fmtR, fmtLife } from './format.js';
import { THEME } from './theme.js';

const HCK = 1.438777e7; // hc/k_B in nm·K — for the Planck function
const SPEC_MAX_NM = 1800; // spectrum x-range

let teffEl, loglEl, canvas, ctx;
let out = {};

// Planck spectral radiance B_λ(T) in arbitrary units (shape only).
function planck(lambdaNm, T) {
  const x = HCK / (lambdaNm * T);
  return 1 / (Math.pow(lambdaNm, 5) * (Math.exp(x) - 1));
}

function readState() {
  const teff = Math.round(Math.pow(10, parseFloat(teffEl.value)));
  const logL = parseFloat(loglEl.value);
  return { teff, logL };
}

function update() {
  const { teff, logL } = readState();
  const Rv = calcR(logL, teff);

  out.teffVal.textContent = teff.toLocaleString() + ' K';
  out.loglVal.textContent = logL.toFixed(2);
  out.r.textContent = fmtR(Rv);
  out.lmax.textContent = Math.round(calcLmax(teff)) + ' nm';
  out.spec.textContent = stype(teff);
  out.lum.textContent = lumClass(logL, teff);

  if (onZAMS(logL, teff)) {
    const m = massOnZAMS(teff);
    out.mass.textContent = m ? m.toFixed(2) + ' M☉' : '—';
    const age = estAge(logL, teff);
    out.age.textContent = age === null ? '—'
      : age < 5e7 ? '≲ 0 (near ZAMS)' : '≈ ' + fmtLife(age);
  } else {
    out.mass.textContent = 'n/a (off MS)';
    out.age.textContent = 'n/a (off MS)';
  }
  render(teff, logL, Rv);
}

function sizeCanvas() {
  if (!canvas) return;
  const w = canvas.parentElement.clientWidth;
  if (!w) return; // overlay still hidden — refresh() re-runs when it opens
  const h = window.innerWidth < 640 ? 170 : 210;
  canvas.width = w;
  canvas.height = h;
  canvas.style.height = h + 'px';
}

function render(teff, logL, Rv) {
  if (!ctx || !canvas.width) return;
  const W = canvas.width, H = canvas.height;
  // Star colours read best on a dark sky, so the viz stays dark in both themes
  // (matching the main star-preview panel).
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#04050b';
  ctx.fillRect(0, 0, W, H);

  drawStar(teff, Rv, 0, 0, W * 0.40, H);
  drawSpectrum(teff, W * 0.44, 0, W * 0.56, H);
}

function drawStar(teff, Rv, ox, oy, w, h) {
  const cx = ox + w / 2, cy = oy + h / 2;
  const [r, g, b] = tRGB(teff);
  // Radius spans ~6 orders of magnitude (white dwarf → supergiant); compress
  // with log10 so every star is visible. -3 dex → tiny, +3 dex → fills the box.
  const maxPx = Math.min(w * 0.42, h * 0.42);
  const t = Math.max(0, Math.min(1, (Math.log10(Math.max(1e-3, Rv)) + 3) / 6));
  const rpx = 5 + t * (maxPx - 5);

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rpx * 1.9);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, rpx * 1.9, 0, Math.PI * 2); ctx.fill();

  const disk = ctx.createRadialGradient(cx - rpx * 0.3, cy - rpx * 0.3, rpx * 0.1, cx, cy, rpx);
  disk.addColorStop(0, `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)},1)`);
  disk.addColorStop(1, `rgba(${r},${g},${b},1)`);
  ctx.fillStyle = disk;
  ctx.beginPath(); ctx.arc(cx, cy, rpx, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(200,210,235,0.6)';
  ctx.font = '9px JetBrains Mono,monospace';
  ctx.textAlign = 'center';
  ctx.fillText(fmtR(Rv), cx, oy + h - 9);
}

function drawSpectrum(teff, ox, oy, w, h) {
  const padL = 10, padR = 14, padT = 16, padB = 24;
  const x0 = ox + padL, x1 = ox + w - padR;
  const yBase = oy + h - padB, yTop = oy + padT;
  const lx = nm => x0 + (nm / SPEC_MAX_NM) * (x1 - x0);

  // Normalise the curve to its own peak so the shape is always visible.
  let peak = 0;
  for (let nm = 10; nm <= SPEC_MAX_NM; nm += 10) peak = Math.max(peak, planck(nm, teff));

  // Visible-band reference shading (380–750 nm)
  ctx.fillStyle = 'rgba(150,165,210,0.06)';
  ctx.fillRect(lx(380), yTop, lx(750) - lx(380), yBase - yTop);

  // baseline
  ctx.strokeStyle = 'rgba(150,165,210,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, yBase); ctx.lineTo(x1, yBase); ctx.stroke();

  const [r, g, b] = tRGB(teff);
  ctx.beginPath();
  ctx.moveTo(x0, yBase);
  for (let nm = 5; nm <= SPEC_MAX_NM; nm += 5) {
    const v = planck(nm, teff) / peak;
    ctx.lineTo(lx(nm), yBase - v * (yBase - yTop));
  }
  ctx.lineTo(x1, yBase);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r},${g},${b},0.22)`; ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`; ctx.lineWidth = 1.6;
  ctx.stroke();

  // λ_max marker
  const peakNm = calcLmax(teff);
  if (peakNm <= SPEC_MAX_NM) {
    const px = lx(peakNm);
    ctx.strokeStyle = 'rgba(220,228,250,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(px, yBase); ctx.lineTo(px, yTop); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(220,228,250,0.8)'; ctx.font = '9px JetBrains Mono,monospace';
    ctx.textAlign = px > x1 - 60 ? 'right' : 'left';
    ctx.fillText('λmax ' + Math.round(peakNm) + ' nm', px + (ctx.textAlign === 'right' ? -4 : 4), yTop + 8);
  }

  // wavelength ticks
  ctx.fillStyle = 'rgba(150,165,210,0.5)'; ctx.font = '8px JetBrains Mono,monospace';
  ctx.textAlign = 'center';
  [400, 800, 1200, 1600].forEach(nm => ctx.fillText(nm, lx(nm), yBase + 12));
  ctx.fillText('wavelength (nm)', (x0 + x1) / 2, yBase + 22);
}

// Wire the widget. Returns refresh(): call it whenever the overlay becomes
// visible (canvas has zero width while display:none) or the theme changes.
export function initUnderstand() {
  teffEl = document.getElementById('u-teff');
  loglEl = document.getElementById('u-logl');
  canvas = document.getElementById('u-canvas');
  if (!teffEl || !canvas) return () => {};
  ctx = canvas.getContext('2d');
  out = {
    teffVal: document.getElementById('u-teff-val'),
    loglVal: document.getElementById('u-logl-val'),
    r: document.getElementById('u-r'),
    lmax: document.getElementById('u-lmax'),
    spec: document.getElementById('u-spec'),
    lum: document.getElementById('u-lum'),
    mass: document.getElementById('u-mass'),
    age: document.getElementById('u-age'),
  };
  teffEl.addEventListener('input', update);
  loglEl.addEventListener('input', update);
  window.addEventListener('resize', () => { sizeCanvas(); update(); });
  return () => { sizeCanvas(); update(); };
}
