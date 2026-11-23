/* VERITAS, the opening of the home page.
   Twelve full pictures of the place, one per vocation. Each fades in over the one before; the name of the place rises into its line.
   It runs alone and never waits on a pointer or a focus (round 14: a tap inside the opening used to hold it for good).
   It rests only while the opening is off the screen or the tab is hidden. A swipe and the arrow keys choose a picture too.
   The next picture is shown only once it is loaded, so the opening never changes to an empty screen. */
(() => {
  const hero = document.querySelector('.hero'); if (!hero) return;
  const figs = [...hero.querySelectorAll('.hero-pics figure')], n = figs.length, place = hero.querySelector('.place'), name = place.querySelector('.txt b u'), line = place.querySelector('.txt span u');
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches, HOLD = 6500;
  let cur = 0, timer = 0, ask = 0, inView = true;

  function label(i, first) {
    const f = figs[i]; if (!first) place.classList.add('swap'); name.textContent = f.dataset.name; line.textContent = f.dataset.line;
    requestAnimationFrame(() => requestAnimationFrame(() => place.classList.remove('swap')));
  }
  const loaded = img => { if (img.dataset.src) { if (img.dataset.srcset) img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src }   // a picture is only asked for when its turn comes
    if (img.complete && img.naturalWidth) return Promise.resolve(); return Promise.race([img.decode().catch(() => {}), new Promise(r => setTimeout(r, 4000))]) };
  const arm = () => { clearTimeout(timer); if (!calm) timer = setTimeout(() => inView && !document.hidden ? go(cur + 1) : arm(), HOLD) };
  function go(i) {
    i = (i % n + n) % n; if (i === cur) return; const mine = ++ask; clearTimeout(timer);
    loaded(figs[i].querySelector('img')).then(() => { if (mine !== ask) return; figs[cur].classList.remove('on'); figs[i].classList.add('on'); cur = i; label(i); arm(); loaded(figs[(i + 1) % n].querySelector('img')) });
  }
  addEventListener('keydown', e => { if (!inView || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.documentElement.classList.contains('nav-open') || scrollY > innerHeight * .5) return; if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1) });
  let sx = null, sy = 0;
  hero.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; sx = e.clientX; sy = e.clientY });
  hero.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur + (dx < 0 ? 1 : -1)) });
  hero.addEventListener('pointercancel', () => sx = null);
  new IntersectionObserver(es => inView = es[0].isIntersecting, { threshold: .25 }).observe(hero);
  addEventListener('veritas-lang', () => label(cur, true));
  label(0, true); arm();
  const second = () => setTimeout(() => loaded(figs[1 % n].querySelector('img')), 600); document.readyState === 'complete' ? second() : addEventListener('load', second);   // the second picture comes once the page itself has arrived
})();
