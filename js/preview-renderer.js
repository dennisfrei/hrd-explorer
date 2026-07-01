// ═══════════════════════════════════
// PREVIEW RENDERER — star size/color preview
// ═══════════════════════════════════
// Spec §5.1: limb-darkened disk, blackbody color, log-scaled radius.
// A glow/bloom is permitted but must not distort the color sequence.

import { calcR, tRGB } from './physics.js';
import { fmtR } from './format.js';

export function rToPx(Rv, scaleMode) {
  if (scaleMode === 'log') {
    const px = 30 + Math.log10(Math.max(0.005, Rv)) * 22; return Math.max(1.5, px);
  } else if (scaleMode === 'real') {
    return Math.max(1.5, Rv * 16);
  } else { return 0; } // 'norm' fill handled by caller
}

export function drawPreview(sx, teffA, logLA, dataB, scaleMode) {
  // Logical (CSS-pixel) size — the backing store is HiDPI-scaled via the
  // context transform set in main.js resize().
  const t = sx.getTransform();
  const W = sx.canvas.width / (t.a || 1), H = sx.canvas.height / (t.d || 1);
  sx.clearRect(0, 0, W, H); sx.fillStyle = '#020204'; sx.fillRect(0, 0, W, H);
  const RA = calcR(logLA, teffA);
  const capPx = H * 0.44;
  if (dataB) {
    const RB = dataB.R;
    let rPA = scaleMode === 'norm' ? H * 0.28 : rToPx(RA, scaleMode);
    let rPB = scaleMode === 'norm' ? H * 0.28 : rToPx(RB, scaleMode);
    if (scaleMode === 'real') {
      const maxR = Math.max(RA, RB); const pps = capPx / maxR;
      rPA = Math.max(1.5, RA * pps); rPB = Math.max(1.5, RB * pps);
    } else if (scaleMode === 'log') { rPA = Math.min(rPA, capPx); rPB = Math.min(rPB, capPx); }
    drawStar(sx, W * 0.27, H / 2, rPA, teffA, scaleMode !== 'norm' && rPA >= capPx * 0.99);
    drawStar(sx, W * 0.75, H / 2, rPB, dataB.teff, scaleMode !== 'norm' && rPB >= capPx * 0.99);
    sx.strokeStyle = 'rgba(140,160,220,0.12)'; sx.lineWidth = 1;
    sx.beginPath(); sx.moveTo(W * 0.52, 8); sx.lineTo(W * 0.52, H - 8); sx.stroke();
    sx.fillStyle = 'rgba(140,160,220,0.45)'; sx.font = '9px JetBrains Mono,monospace'; sx.textAlign = 'center';
    sx.fillText(fmtR(RA), W * 0.27, H - 7); sx.fillText(fmtR(RB), W * 0.75, H - 7);
  } else {
    const rPx = scaleMode === 'norm' ? H * 0.3 : rToPx(RA, scaleMode);
    const clipped = scaleMode !== 'norm' && rPx > capPx;
    drawStar(sx, W / 2, H / 2, Math.min(rPx, capPx), teffA, clipped);
    sx.fillStyle = 'rgba(140,160,220,0.4)'; sx.font = '9px JetBrains Mono,monospace'; sx.textAlign = 'right';
    sx.fillText(fmtR(RA), W - 10, H - 7);
  }
}

export function drawStar(ctx, cx, cy, rPx, teff, clipped) {
  rPx = Math.max(1.5, rPx);
  const [r2, g, b] = tRGB(teff);
  const coronaR = rPx * (teff > 20000 ? 2.5 : teff > 8000 ? 3.0 : 3.6);
  const g1 = ctx.createRadialGradient(cx, cy, rPx * 0.85, cx, cy, coronaR);
  g1.addColorStop(0, `rgba(${r2},${g},${b},${teff > 20000 ? 0.12 : 0.08})`);
  g1.addColorStop(0.55, `rgba(${r2},${g},${b},0.02)`);
  g1.addColorStop(1, `rgba(${r2},${g},${b},0)`);
  ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(cx, cy, coronaR, 0, Math.PI * 2); ctx.fill();
  const limbEdge = teff > 20000 ? 0.72 : teff > 8000 ? 0.78 : 0.84;
  const rc = Math.min(255, Math.round(r2 * 1.06)), gc2 = Math.min(255, Math.round(g * 1.06)), bc2 = Math.min(255, Math.round(b * 1.06));
  const gLimb = ctx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
  gLimb.addColorStop(0, `rgba(${rc},${gc2},${bc2},1)`);
  gLimb.addColorStop(0.40, `rgba(${r2},${g},${b},1)`);
  gLimb.addColorStop(limbEdge, `rgba(${Math.round(r2 * .62)},${Math.round(g * .62)},${Math.round(b * .62)},1)`);
  gLimb.addColorStop(0.95, `rgba(${Math.round(r2 * .28)},${Math.round(g * .28)},${Math.round(b * .28)},1)`);
  gLimb.addColorStop(1, `rgba(${Math.round(r2 * .10)},${Math.round(g * .10)},${Math.round(b * .10)},1)`);
  ctx.fillStyle = gLimb; ctx.beginPath(); ctx.arc(cx, cy, rPx, 0, Math.PI * 2); ctx.fill();
  if (clipped) {
    ctx.strokeStyle = `rgba(${r2},${g},${b},0.2)`; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, rPx, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
}
