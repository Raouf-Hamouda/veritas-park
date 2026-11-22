/* VERITAS, the opening of the home page (tickets R01, then round 3). Needs symbol.js.
   Twelve full pictures of the place, one per vocation, like the twelve hours.
   The dial at the bottom right IS the symbol of the brand, and it moves with the move chosen on 20 Nov:
   at each new picture, the tick of that picture comes out of the tick before it, turns one hour and grows to its length.
   The new picture is uncovered by a soft sweep that turns round the dial, the way a hand crosses a clock face,
   while the picture that leaves steps back and darkens. The name of the place rises into its line, it never fades.
   Hand, ticks, arrows, the arrow keys and a swipe all choose a picture. It also runs alone, and waits while you point at it. */
(() => {
  const hero = document.querySelector('.hero'); if (!hero || !window.veritasSymbol) return;
  const $ = (s, e = hero) => e.querySelector(s), $$ = (s, e = hero) => [...e.querySelectorAll(s)], NS = 'http://www.w3.org/2000/svg';
  const figs = $$('.hero-pics figure'), n = figs.length, place = $('.place'), dial = $('.dial'), svg = $('svg[data-dial]'), name = $('.txt b u', place), line = $('.txt span u', place);
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches, HOLD = 6500, SWEEP = 1250;

  // the dial: the symbol, a hand, and twelve invisible wedges to choose a picture by its hour
  const sym = window.veritasSymbol(svg), el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e };
  const hand = el('line', { class: 'hand', x1: 0, y1: 0, x2: 0, y2: -15 });
  const pt = a => `${(40 * Math.sin(a * Math.PI / 180)).toFixed(2)} ${(-40 * Math.cos(a * Math.PI / 180)).toFixed(2)}`;
  const hits = figs.map((f, i) => { const h = el('path', { class: 'hit', d: `M0 0L${pt(i * 30 - 15)}A40 40 0 0 1 ${pt(i * 30 + 15)}Z`, role: 'button', tabindex: 0, 'aria-label': f.dataset.name }); h.addEventListener('click', () => go(i)); h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i) } }); return h });

  let cur = 0, shown = 0, busy = false, held = false, inView = true, last = performance.now(), queue = null;
  const centre = () => { const d = dial.getBoundingClientRect(), h = hero.getBoundingClientRect(); if (!h.width) return;
    hero.style.setProperty('--cx', ((d.left + d.width / 2 - h.left) / h.width * 100).toFixed(2) + '%'); hero.style.setProperty('--cy', ((d.top + d.height / 2 - h.top) / h.height * 100).toFixed(2) + '%') };
  function label(i, first) {
    const f = figs[i]; if (!first) place.classList.add('swap'); name.textContent = f.dataset.name; line.textContent = f.dataset.line;
    requestAnimationFrame(() => requestAnimationFrame(() => place.classList.remove('swap')));
    sym.ticks.forEach((t, k) => { t.classList.toggle('now', k === i); t.classList.toggle('past', k < i) }); hits.forEach((h, k) => h.setAttribute('aria-current', k === i));
  }
  function go(i) {
    i = (i % n + n) % n; if (i === cur) return; if (busy) { queue = i; return }
    const next = figs[i], prev = figs[cur]; busy = true; centre(); cur = i; shown = 0; label(i);
    i === 0 ? sym.build(.045, .3, 0) : sym.step(i);   // the tick of the new picture comes out of the one before it; back at 12, the whole symbol is built again
    prev.classList.remove('on'); next.classList.add('on');   // the new picture fades in over the old one, which leaves only once it is covered
    setTimeout(() => { busy = false; if (queue !== null) { const q = queue; queue = null; go(q) } }, calm ? 0 : 900);
  }
  const step = d => go(cur + d);

  function frame(now) {
    const dt = Math.min(64, now - last); last = now;
    if (inView && !held && !busy && !document.hidden && !calm) { shown += dt; if (shown >= HOLD) step(1) }
    hand.setAttribute('transform', `rotate(${((cur + Math.min(1, shown / HOLD)) * 30).toFixed(2)})`);   // the hand walks from this tick to the next while the picture is shown
    requestAnimationFrame(frame);
  }
  $$('[data-step]').forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
  for (const e of [dial, ...$$('.hero-arrows,.sbtns,.pill')]) { e.addEventListener('pointerenter', () => held = true); e.addEventListener('pointerleave', () => held = false) }
  hero.addEventListener('focusin', () => held = true); hero.addEventListener('focusout', () => held = false);
  addEventListener('keydown', e => { if (!inView || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.documentElement.classList.contains('nav-open') || scrollY > innerHeight * .5) return; if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1) });
  let sx = null, sy = 0;
  hero.addEventListener('pointerdown', e => { if (e.target.closest('a,button,.dial')) return; sx = e.clientX; sy = e.clientY });
  hero.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1) });
  hero.addEventListener('pointercancel', () => sx = null);
  new IntersectionObserver(es => inView = es[0].isIntersecting, { threshold: .25 }).observe(hero);
  addEventListener('veritas-lang', () => label(cur, true));
  addEventListener('resize', centre); centre(); label(0, true); requestAnimationFrame(frame);
  // on arrival the dial builds itself once, after the arrival screen has left
  if (!calm) { sym.all(0); setTimeout(() => sym.build(.11, .42, 0), document.querySelector('.gate') ? 1500 : 250) }
})();
