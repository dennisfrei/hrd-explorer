// ═══════════════════════════════════
// THEME — light / dark / system
// ═══════════════════════════════════
// CSS variables drive the DOM, but <canvas> cannot read them, so the diagram
// renderers read colours from the mutable THEME object below. Keep the two in
// sync: applyTheme() updates THEME and the document's data-theme attribute
// together. `ink` is the base UI colour ("r,g,b") that grid/axis/label use at
// varying alpha; physical blackbody star colours are theme-independent.

export const THEME = {
  hrdBg: '#050508',
  ink: '140,160,220',
  zams: '180,200,255',
  sel: '255,255,255',
  cmp: '120,200,255',
  metaColor: '#050508',
  isLight: false,
};

const DARK = {
  hrdBg: '#050508', ink: '140,160,220', zams: '180,200,255',
  sel: '255,255,255', cmp: '120,200,255', metaColor: '#0b0b14', isLight: false,
};
const LIGHT = {
  hrdBg: '#eef1f8', ink: '64,84,134', zams: '40,78,170',
  sel: '20,24,38', cmp: '24,108,196', metaColor: '#e9edf6', isLight: true,
};

const STORE_KEY = 'hrd-theme'; // 'system' | 'light' | 'dark'
const mq = window.matchMedia('(prefers-color-scheme: light)');

export function getPref() {
  return localStorage.getItem(STORE_KEY) || 'system';
}

// Resolve a preference to the concrete theme actually shown.
export function effectiveTheme(pref = getPref()) {
  if (pref === 'light' || pref === 'dark') return pref;
  return mq.matches ? 'light' : 'dark';
}

// Apply a preference: persist it, set <html data-theme>, update THEME + the
// browser theme-color meta. Returns the effective theme ('light'|'dark').
export function applyTheme(pref) {
  localStorage.setItem(STORE_KEY, pref);
  const eff = effectiveTheme(pref);
  if (pref === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', pref);
  Object.assign(THEME, eff === 'light' ? LIGHT : DARK);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME.metaColor);
  return eff;
}

// Wire up: apply the stored preference now, and re-apply on OS theme changes
// while in 'system' mode. `onChange()` lets the caller redraw the canvases.
export function initTheme(onChange) {
  applyTheme(getPref());
  mq.addEventListener('change', () => {
    if (getPref() === 'system') { applyTheme('system'); onChange && onChange(); }
  });
}
