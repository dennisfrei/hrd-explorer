// ═══════════════════════════════════
// TOUR — guided onboarding walkthrough
// ═══════════════════════════════════
// A lightweight stepped tour. Each step points at a DOM element (by selector)
// and shows a card with a title + text. A spotlight box dims everything else.
// Steps whose target is not currently visible (e.g. panel controls on a
// breakpoint where the panel is hidden) are skipped automatically.

export function initTour(steps, { onStep } = {}) {
  let backdrop, spot, card, cardTitle, cardText, cardCount, prevBtn, nextBtn;
  let idx = 0;
  let order = [];

  function build() {
    backdrop = el('div', 'tour-backdrop');
    spot = el('div', 'tour-spot');
    card = el('div', 'tour-card');
    cardTitle = el('div', 'tour-title');
    cardText = el('div', 'tour-text');
    cardCount = el('span', 'tour-count');
    const nav = el('div', 'tour-nav');
    const skip = el('button', 'tour-skip'); skip.textContent = 'Skip';
    prevBtn = el('button', 'tour-btn'); prevBtn.textContent = 'Back';
    nextBtn = el('button', 'tour-btn primary'); nextBtn.textContent = 'Next';
    nav.append(cardCount, skip, prevBtn, nextBtn);
    card.append(cardTitle, cardText, nav);
    document.body.append(backdrop, spot, card);

    backdrop.addEventListener('click', end);
    skip.addEventListener('click', end);
    prevBtn.addEventListener('click', () => go(idx - 1));
    nextBtn.addEventListener('click', () => idx >= order.length - 1 ? end() : go(idx + 1));
  }

  function el(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }

  function visible(sel) {
    const t = document.querySelector(sel);
    if (!t || t.offsetParent === null) return null;
    const r = t.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? t : null;
  }

  function place() {
    const step = order[idx];
    const t = visible(step.sel);
    document.body.classList.add('tour-on');
    if (onStep) onStep(step);
    if (!t) {
      // No anchor: centre the card with no spotlight.
      spot.style.opacity = '0';
      centreCard();
    } else {
      const r = t.getBoundingClientRect();
      const pad = 6;
      spot.style.opacity = '1';
      spot.style.left = (r.left - pad) + 'px';
      spot.style.top = (r.top - pad) + 'px';
      spot.style.width = (r.width + pad * 2) + 'px';
      spot.style.height = (r.height + pad * 2) + 'px';
      positionCardNear(r);
    }
    cardTitle.textContent = step.title;
    cardText.textContent = step.text;
    cardCount.textContent = `${idx + 1} / ${order.length}`;
    prevBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = idx >= order.length - 1 ? 'Done' : 'Next';
  }

  function centreCard() {
    card.style.left = '50%';
    card.style.top = '50%';
    card.style.transform = 'translate(-50%,-50%)';
  }

  function positionCardNear(r) {
    card.style.transform = 'none';
    const cw = Math.min(300, window.innerWidth - 24);
    card.style.width = cw + 'px';
    const ch = card.offsetHeight || 150;
    let top = r.bottom + 12;
    if (top + ch > window.innerHeight - 12) top = Math.max(12, r.top - ch - 12);
    let left = r.left + r.width / 2 - cw / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cw - 12));
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function go(i) {
    idx = Math.max(0, Math.min(i, order.length - 1));
    place();
  }

  function start() {
    if (!backdrop) build();
    // Keep only steps with a visible anchor, but always keep anchorless intro
    // steps (sel omitted).
    order = steps.filter(s => !s.sel || visible(s.sel));
    if (!order.length) return;
    idx = 0;
    backdrop.classList.add('on'); spot.classList.add('on'); card.classList.add('on');
    place();
  }

  function end() {
    backdrop.classList.remove('on'); spot.classList.remove('on'); card.classList.remove('on');
    document.body.classList.remove('tour-on');
  }

  document.addEventListener('keydown', e => {
    if (!card || !card.classList.contains('on')) return;
    if (e.key === 'Escape') end();
    else if (e.key === 'ArrowRight') go(idx + 1);
    else if (e.key === 'ArrowLeft') go(idx - 1);
  });
  window.addEventListener('resize', () => { if (card && card.classList.contains('on')) place(); });

  return { start, end };
}
