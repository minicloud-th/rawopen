type Reveal = {
  target: HTMLElement;
  trigger: Element;
  key: string;
  finish: () => void;
};

/** One reveal per piece of content, including catalog results and React mounts. */
export function startScrollReveals() {
  if (!('IntersectionObserver' in window)) return () => {};

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const prepared = new WeakSet<HTMLElement>();
  const seen = new Set<string>();
  const records = new Map<Element, Reveal>();
  let frame = 0;
  let stopped = false;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const record = records.get(entry.target);
      if (!record || !entry.isIntersecting) continue;
      observer.unobserve(record.trigger);
      seen.add(record.key);
      if (media.matches) record.finish();
      else record.target.dataset.scrollReveal = 'revealing';
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: .08 });

  function prepare(target: HTMLElement | null, key: string, delay = 0, kind = 'text', trigger: Element | null = target) {
    if (!target || !trigger || prepared.has(target)) return;
    prepared.add(target);
    target.dataset.revealKind = kind;
    if (media.matches || seen.has(key)) {
      seen.add(key);
      target.dataset.scrollReveal = 'done';
      return;
    }

    target.style.setProperty('--reveal-delay', `${delay}ms`);
    target.dataset.scrollReveal = 'pending';
    const finish = () => {
      target.dataset.scrollReveal = 'done';
      target.style.removeProperty('--reveal-delay');
      target.removeEventListener('transitionend', onEnd);
      observer.unobserve(trigger);
      records.delete(trigger);
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === target && event.propertyName === 'filter') finish();
    };
    target.addEventListener('transitionend', onEnd);
    records.set(trigger, { target, trigger, key, finish });
    observer.observe(trigger);
  }

  function collect() {
    frame = 0;
    if (stopped) return;
    for (const record of records.values()) {
      if (!record.target.isConnected || !record.trigger.isConnected) record.finish();
    }

    prepare(document.querySelector('#categories-grid .category-links'), 'categories');
    prepare(document.querySelector('#discover .discover-heading'), 'catalog-heading');
    const grid = document.querySelector<HTMLElement>('#product-grid');
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 3;
    grid?.querySelectorAll<HTMLElement>(':scope > .product-card').forEach((card, index) => {
      const key = card.dataset.card;
      if (!key) return;
      const delay = (index % columns) * 70;
      prepare(card.querySelector('.product-image-wrap'), `product:${key}:image`, delay, 'image');
      prepare(card.querySelector('.product-caption'), `product:${key}:caption`, delay + 90);
    });

    prepare(document.querySelector('.load-more-wrap'), 'catalog-more');
    prepare(document.querySelector('.catalog-note'), 'catalog-note', 60);
    prepare(document.querySelector('.sc-canvas-wrap'), 'collection-canvas', 0, 'image');
    document.querySelectorAll<HTMLElement>('.sc-chapter').forEach((chapter, index) => {
      prepare(chapter.querySelector('.sc-title-group'), `collection:${index}:title`);
      prepare(chapter.querySelector('.sc-static-image'), `collection:${index}:image`, 0, 'image');
      prepare(chapter.querySelector('.sc-description'), `collection:${index}:copy`, 100);
    });
    prepare(document.querySelector('.seller-invite > div'), 'seller-copy');
    prepare(document.querySelector('.seller-invite > button'), 'seller-action', 100);
    prepare(document.querySelector('.hwf-brand'), 'footer-brand');
    document.querySelectorAll<HTMLElement>('.hwf-col').forEach((column, index) => {
      prepare(column, `footer-column:${index}`, (index + 1) * 60);
    });
    prepare(document.querySelector('.hwf-rule'), 'footer-top-link', 60);
    // The canvas covers the whole footer. Its logo mask is at the bottom;
    // observe that area so the logo reveals when the letters actually arrive.
    const canvas = document.querySelector<HTMLCanvasElement>('.hwf-root canvas');
    prepare(canvas, 'footer-wordmark', 0, 'image', document.querySelector('.hwf-fallback') || canvas);
  }

  function schedule() {
    if (!frame && !stopped) frame = requestAnimationFrame(collect);
  }

  // Only the rendered home-page islands are watched. Dialogs open immediately.
  const mutations = new MutationObserver(schedule);
  for (const id of ['categories-grid', 'product-grid', 'split-showcase-root', 'footer-root']) {
    const root = document.getElementById(id);
    if (root) mutations.observe(root, { childList: true, subtree: true });
  }
  const revealFocused = (event: FocusEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-scroll-reveal]') : null;
    if (!target) return;
    for (const record of records.values()) {
      if (record.target === target) { seen.add(record.key); record.finish(); break; }
    }
  };
  const onMotionPreference = () => {
    if (media.matches) {
      for (const record of records.values()) { seen.add(record.key); record.finish(); }
    }
  };
  document.addEventListener('focusin', revealFocused);
  media.addEventListener('change', onMotionPreference);
  collect();

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    mutations.disconnect();
    document.removeEventListener('focusin', revealFocused);
    media.removeEventListener('change', onMotionPreference);
    for (const record of records.values()) record.finish();
  };
}
