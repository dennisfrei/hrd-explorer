// ═══════════════════════════════════
// SHARE — PNG export & shareable-URL state
// ═══════════════════════════════════
// PNG export composes the live HRD onto a higher-resolution offscreen canvas
// with a caption strip. URL helpers (de)serialise the explorable state into
// the location hash so a view can be linked and restored.

import { THEME } from './theme.js';

// Render the diagram to a 2× PNG and trigger a download.
// drawFn(ctx) must paint the full diagram into the given context using the
// same logical geometry as the on-screen canvas.
export function exportPNG(hc, drawFn, caption) {
  const scale = 2;
  const capH = 30;
  // Logical (CSS-pixel) size — hc.width is the HiDPI backing store.
  const W = hc.clientWidth, H = hc.clientHeight;
  const ec = document.createElement('canvas');
  ec.width = W * scale;
  ec.height = (H + capH) * scale;
  const ex = ec.getContext('2d');
  ex.scale(scale, scale);
  // Background across the whole sheet (diagram + caption strip).
  ex.fillStyle = THEME.hrdBg || '#050508';
  ex.fillRect(0, 0, W, H + capH);
  // Diagram, drawn in its normal logical coordinates.
  drawFn(ex);
  // Caption strip.
  ex.fillStyle = THEME.isLight ? 'rgba(20,30,60,0.06)' : 'rgba(140,160,220,0.06)';
  ex.fillRect(0, H, W, capH);
  ex.fillStyle = THEME.isLight ? 'rgba(20,30,60,0.75)' : 'rgba(180,195,235,0.8)';
  ex.font = '11px Space Grotesk, sans-serif';
  ex.textAlign = 'left';
  ex.fillText(caption || 'HR Diagram Explorer', 10, H + 19);
  ex.textAlign = 'right';
  ex.fillStyle = THEME.isLight ? 'rgba(20,30,60,0.45)' : 'rgba(140,160,220,0.5)';
  ex.font = '10px JetBrains Mono, monospace';
  ex.fillText('SAIL · arXiv:2603.18145', W - 10, H + 19);

  ec.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hr-diagram.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

// ── URL state ──
// Layer keys kept short and stable; 'color' → 'o' to avoid clashing with the
// compare-star key 'c'.
const LAYER_KEY = { radius: 'r', zams: 'z', regions: 'g', stars: 's', color: 'o' };

export function serializeState(state) {
  const p = new URLSearchParams();
  if (state.compareMode) p.set('m', 'c');
  if (state.selStar) {
    if (state.selStar.name) p.set('s', state.selStar.name);
    else p.set('p', `${Math.round(state.selStar.teff)},${state.selStar.logL.toFixed(2)}`);
  }
  if (state.cmpStar) {
    if (state.cmpStar.name) p.set('c', state.cmpStar.name);
    else p.set('cp', `${Math.round(state.cmpStar.teff)},${state.cmpStar.logL.toFixed(2)}`);
  }
  const ls = Object.keys(LAYER_KEY).filter(k => state.layers[k]).map(k => LAYER_KEY[k]).join('');
  p.set('l', ls);
  if (state.scaleMode !== 'log') p.set('sc', state.scaleMode);
  if (state.yMode === 'appmag') p.set('y', 'm');
  return p.toString();
}

// Parse the current location hash into a plain descriptor, or null if empty.
// The caller resolves star names / builds free points (it owns STARS + stype).
export function parseHash() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return null;
  const p = new URLSearchParams(h);
  const out = { layers: null, compareMode: p.get('m') === 'c', scaleMode: p.get('sc') || 'log',
    yMode: p.get('y') === 'm' ? 'appmag' : 'lum' };
  if (p.has('l')) {
    out.layers = {};
    for (const [k, key] of Object.entries(LAYER_KEY)) out.layers[k] = p.get('l').includes(key);
  }
  if (p.has('s')) out.selName = p.get('s');
  else if (p.has('p')) out.selPoint = p.get('p').split(',').map(Number);
  if (p.has('c')) out.cmpName = p.get('c');
  else if (p.has('cp')) out.cmpPoint = p.get('cp').split(',').map(Number);
  return out;
}

export function writeHash(state) {
  const str = serializeState(state);
  history.replaceState(null, '', str ? '#' + str : location.pathname + location.search);
}
