/* ESP32 Coder — adaptive slide navigation (landing pages only).
 * Desktop wheel/keyboard: exactly one stage per gesture.
 * Fit: CSS zoom changes real layout dimensions; no hidden text or image clipping.
 * Mobile, inaccessible/tall content and unsupported viewports: native scrolling.
 */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('feed-page')) return;
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const stages = [...document.querySelectorAll('main > .feed-stage')];
  if (!header || !stages.length) return;
  const finePointer = matchMedia('(pointer:fine) and (hover:hover)');
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const probes = '.hero-copy,.hero-art,.section-head,.benefits-grid,.libraries-layout,.flash-panel,.stance,.step-grid,.docs-teaser-card,.download-shell,.faq-grid';
  let enabled = false;
  let active = 0;
  let wheelSum = 0;
  let wheelDirection = 0;
  let lockedUntil = 0;
  let resizeTask = 0;
  let inFit = false;
  const timestamp = () => performance.now();
  const headerHeight = () => header.getBoundingClientRect().height;
  const availableHeight = () => Math.max(1, innerHeight - headerHeight());
  const stageTarget = stage => Math.max(0, stage.getBoundingClientRect().top + scrollY - headerHeight());
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const nearestStage = () => {
    const position = scrollY + headerHeight() + Math.max(20, availableHeight() * .30);
    let result = 0, distance = Infinity;
    stages.forEach((stage, index) => {
      const r = stage.getBoundingClientRect();
      const top = scrollY + r.top;
      const bottom = top + r.height;
      const diff = position < top ? top - position : position > bottom ? position - bottom : 0;
      if (diff < distance) { result = index; distance = diff; }
    });
    return result;
  };
  const resetSizing = stage => {
    stage.style.removeProperty('zoom');
    stage.style.removeProperty('height');
    stage.style.removeProperty('min-height');
    stage.style.removeProperty('width');
    stage.style.removeProperty('max-width');
    stage.style.removeProperty('margin-inline');
    stage.removeAttribute('data-fit-scale');
  };
  const fitProbes = (stage, space) => {
    const outer = stage.getBoundingClientRect();
    if (outer.height > space + 2 || stage.scrollHeight > stage.clientHeight + 3) return false;
    // Check content rather than decorative, absolutely-positioned glows.
    for (const item of stage.querySelectorAll(probes)) {
      if (!item.getClientRects().length) continue;
      const rect = item.getBoundingClientRect();
      if (rect.bottom > outer.bottom - 8 || rect.top < outer.top + 7) return false;
    }
    // A few short stages (especially FAQ) can overflow inside a flex card.
    for (const item of stage.querySelectorAll('h1,h2,h3,p,summary,details,article')) {
      if (!item.getClientRects().length) continue;
      const rect = item.getBoundingClientRect();
      if (rect.bottom > outer.bottom - 7 || rect.top < outer.top + 7) return false;
    }
    return true;
  };
  const setSize = (stage, width, height, scale) => {
    // zoom is supported by current Chrome, Edge and Firefox. It participates
    // in layout, unlike transform:scale (which can leave hidden overflow).
    stage.style.zoom = String(scale);
    stage.style.width = `${width / scale}px`;
    stage.style.maxWidth = 'none';
    stage.style.height = `${height / scale}px`;
    stage.style.minHeight = `${height / scale}px`;
    stage.style.marginInline = 'auto';
    stage.dataset.fitScale = scale.toFixed(2);
  };
  const fitAll = () => {
    if (inFit) return;
    inFit = true;
    const previousEnabled = enabled;
    enabled = false;
    root.classList.remove('feed-wheel-mode');
    root.classList.add('feed-native-scroll');
    stages.forEach(resetSizing);
    const desktop = finePointer.matches && innerWidth >= 1020 && innerHeight >= 590 && CSS.supports('zoom', '0.9');
    root.style.setProperty('--header-h', `${Math.ceil(headerHeight())}px`);
    if (!desktop) {
      inFit = false;
      return;
    }
    const height = availableHeight();
    let canSnap = true;
    stages.forEach(stage => {
      const width = stage.getBoundingClientRect().width;
      let fits = false;
      for (let i = 0; i <= 15; i++) {
        const scale = Math.max(.70, 1 - i * .02);
        setSize(stage, width, height, scale);
        if (fitProbes(stage, height)) { fits = true; break; }
      }
      if (!fits) {
        // Never truncate content merely to force one-slide navigation.
        resetSizing(stage);
        canSnap = false;
      }
    });
    enabled = canSnap;
    root.classList.toggle('feed-wheel-mode', enabled);
    root.classList.toggle('feed-native-scroll', !enabled);
    wheelSum = 0;
    wheelDirection = 0;
    lockedUntil = 0;
    if (previousEnabled && !enabled) root.classList.remove('feed-wheel-mode');
    inFit = false;
  };
  const goTo = (index, instant = false) => {
    if (!enabled) return;
    active = clamp(index, 0, stages.length);
    const target = active === stages.length
      ? document.documentElement.scrollHeight - innerHeight
      : stageTarget(stages[active]);
    lockedUntil = timestamp() + (instant || reducedMotion.matches ? 130 : 850);
    wheelSum = 0;
    wheelDirection = 0;
    window.scrollTo({ top: Math.max(0, target), behavior: instant || reducedMotion.matches ? 'instant' : 'smooth' });
  };
  const isTypingOrModal = () => {
    const e = document.activeElement;
    return !!(document.querySelector('.screenshot-lightbox.is-open') ||
      (e && (e.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName))));
  };
  const hasOwnScroller = (target, direction) => {
    for (let node = target; node && node !== document.body; node = node.parentElement) {
      if (!(node instanceof Element)) continue;
      const css = getComputedStyle(node);
      if (!/(auto|scroll)/.test(css.overflowY)) continue;
      if (node.scrollHeight <= node.clientHeight + 2) continue;
      if (direction > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 2) return true;
      if (direction < 0 && node.scrollTop > 2) return true;
    }
    return false;
  };
  addEventListener('wheel', e => {
    if (!enabled || isTypingOrModal() || e.ctrlKey || e.metaKey) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.3) return;
    const delta = e.deltaY * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? innerHeight : 1);
    if (!delta || hasOwnScroller(e.target, Math.sign(delta))) return;
    e.preventDefault();
    if (timestamp() < lockedUntil) return;
    if (Math.sign(delta) !== wheelDirection) { wheelSum = 0; wheelDirection = Math.sign(delta); }
    wheelSum += delta;
    if (Math.abs(wheelSum) < 42) return;
    const nearFooter = scrollY > stageTarget(stages[stages.length - 1]) + availableHeight() * .65;
    active = nearFooter ? stages.length : nearestStage();
    goTo(active + Math.sign(delta));
  }, { passive: false });
  addEventListener('keydown', e => {
    if (!enabled || isTypingOrModal() || e.altKey || e.ctrlKey || e.metaKey || timestamp() < lockedUntil) return;
    if (!['ArrowDown','ArrowUp','PageDown','PageUp',' ','Home','End'].includes(e.key)) return;
    // Do not hijack native keyboard controls in focused FAQ buttons/cards.
    if (e.target?.closest?.('summary,button,[role="button"]') && e.key === ' ') return;
    e.preventDefault();
    if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(stages.length);
    else {
      const direction = ['ArrowUp','PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey) ? -1 : 1;
      const nearFooter = scrollY > stageTarget(stages[stages.length - 1]) + availableHeight() * .65;
      goTo((nearFooter ? stages.length : nearestStage()) + direction);
    }
  });
  document.addEventListener('click', e => {
    if (!enabled) return;
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    const index = stages.findIndex(stage => `#${stage.id}` === hash);
    if (index < 0) return;
    e.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    goTo(index);
  });
  const resize = () => {
    if (resizeTask) clearTimeout(resizeTask);
    const current = enabled ? nearestStage() : null;
    resizeTask = setTimeout(() => {
      resizeTask = 0;
      fitAll();
      if (enabled && current !== null) goTo(current, true);
    }, 110);
  };
  addEventListener('resize', resize, { passive: true });
  if (window.visualViewport) visualViewport.addEventListener('resize', resize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (!inFit) resize();
    }).observe(header);
  }
  // Dynamic FAQ cards and delayed font/image loading can affect slide height.
  stages.forEach(stage => stage.addEventListener('toggle', e => {
    if (e.target.tagName === 'DETAILS') resize();
  }, true));
  addEventListener('load', resize, { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(resize).catch(() => {});
  // The release version and verification badges arrive asynchronously.
  const overview = stages[0];
  if (overview && typeof MutationObserver !== 'undefined') {
    new MutationObserver(resize).observe(overview, { childList: true, subtree: true, characterData: true });
  }
  fitAll();
  // If landing on #features etc., keep the heading below the sticky header.
  if (enabled && location.hash) {
    const index = stages.findIndex(stage => `#${stage.id}` === location.hash);
    if (index >= 0) requestAnimationFrame(() => goTo(index, true));
  }
  window.ESP32Slides = { getState: () => ({ enabled, active: nearestStage(), scales: stages.map(s => Number(s.dataset.fitScale || 1)) }), reflow: resize };
})();
