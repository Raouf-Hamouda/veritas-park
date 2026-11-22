/* VERITAS, the wheel of pictures (ticket R02). The book draws its website as pictures fanned on an arc (p37); here the arc is a whole dial:
   twelve pictures stand on a circle like the hours, and only the top of the circle shows.
   You turn it by hand, and it has weight: let go and it keeps turning, slows down, and settles on an hour, never between two.
   The picture at 12 o'clock is the chosen one. Click another and the wheel brings it to 12. Click the chosen one and it opens to the full screen.
   Trackpad sideways, the arrow keys and the two round buttons turn it too. Only moves a graphics card does alone: turn, slide, scale. */
(() => {
  const wheel = document.querySelector('.wheel'); if (!wheel) return;
  const sec = wheel.closest('section'), ring = wheel.querySelector('.ring'), cards = [...wheel.querySelectorAll('.card')], N = cards.length, STEP = 360 / N;
  const imgs = cards.map(c => c.querySelector('img')), who = sec.querySelector('.who'), whoName = who.querySelector('b'), whoLine = who.querySelector('span:last-child'), cnt = who.querySelector('.cnt');
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches, norm = a => ((a + 180) % 360 + 360) % 360 - 180;
  // the long ticks of the logo stand between the pictures
  const marks = cards.map(() => { const m = document.createElement('i'); m.className = 'mark'; ring.append(m); return m });

  let R = 800, cw = 360, ch = 470, rot = calm ? 0 : 42, vel = 0, target = 0, mode = 'spring', active = -1, running = false, visible = false, last = 0;
  function measure() {
    const W = wheel.clientWidth, phone = W < 820, row = parseFloat(getComputedStyle(document.querySelector('body>i')).width) || 100;
    R = phone ? W * 1.78 : Math.min(1180, Math.max(560, W * .6)); cw = 2 * R * Math.sin(Math.PI / N) * .88; ch = cw * 1.3;
    const room = wheel.clientHeight || 480; if (ch > room * .9) { ch = room * .9; cw = ch / 1.3; R = cw / (2 * Math.sin(Math.PI / N) * .88) }   // the whole wheel fits in its screen
    const pad = Math.max(6, (room - ch) * .3), h = room;
    wheel.style.setProperty('--cw', cw.toFixed(1) + 'px'); wheel.style.setProperty('--chh', ch.toFixed(1) + 'px'); wheel.style.setProperty('--cy0', (pad + ch / 2 + R).toFixed(1) + 'px'); 
    for (const m of marks) { m.style.height = (ch * .3).toFixed(1) + 'px'; m.style.marginTop = (-ch * .15).toFixed(1) + 'px' }
    draw();
  }
  function draw() {
    for (let i = 0; i < N; i++) {
      const a = norm(i * STEP + rot), far = Math.abs(a) > 78, c = cards[i], k = Math.min(1, Math.abs(a) / STEP);
      c.style.visibility = far ? 'hidden' : 'visible';
      if (!far) { c.style.transform = `rotate(${a.toFixed(3)}deg) translateY(${(-R).toFixed(1)}px) scale(${(1 - .13 * k).toFixed(4)})`; c.style.filter = `brightness(${(1 - .42 * k).toFixed(3)})`; c.style.zIndex = 100 - Math.round(Math.abs(a));
        imgs[i].style.transform = `translateX(${(a / STEP * 5.5).toFixed(2)}%)` }   // the picture slides a little inside its frame: depth
      const b = norm((i + .5) * STEP + rot), m = marks[i]; m.style.visibility = Math.abs(b) > 78 ? 'hidden' : 'visible'; m.style.transform = `rotate(${b.toFixed(3)}deg) translateY(${(-R).toFixed(1)}px)`;
    }
    const now = ((Math.round(-rot / STEP) % N) + N) % N;
    if (now !== active) { active = now; const c = cards[now]; who.classList.add('swap'); cnt.textContent = String(now + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0'); whoName.textContent = c.dataset.name; whoLine.textContent = c.dataset.line;
      requestAnimationFrame(() => requestAnimationFrame(() => who.classList.remove('swap'))); cards.forEach((x, i) => x.setAttribute('aria-current', i === now)) }
  }
  // weight: a spring pulls the wheel to the hour it is heading for
  function frame(t) {
    if (!running) return; const dt = Math.min(.034, (t - last) / 1000 || .016); last = t;
    if (mode === 'spring') { const K = 62, C = 13.2; vel += (-K * (rot - target) - C * vel) * dt; rot += vel * dt; if (Math.abs(rot - target) < .015 && Math.abs(vel) < .4) { rot = target; vel = 0; mode = 'rest' } }
    draw(); if (mode === 'rest' || !visible) { running = false; return } requestAnimationFrame(frame);
  }
  const run = () => { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame) } };
  const settle = (extra = 0) => { target = Math.round((rot + extra) / STEP) * STEP; mode = 'spring'; run() };
  const turn = steps => { target = Math.round(target / STEP) * STEP - steps * STEP; mode = 'spring'; run() };

  // the hand on the wheel
  let drag = null;
  wheel.addEventListener('pointerdown', e => { if (e.button) return; drag = { x: e.clientX, rot, moved: 0, trail: [[e.timeStamp, e.clientX]], card: e.target.closest('.card') }; mode = 'drag'; vel = 0 });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx)); if (drag.moved > 5) { wheel.classList.add('drag'); wheel.setPointerCapture?.(e.pointerId) }
    rot = drag.rot + dx / R * 180 / Math.PI; drag.trail.push([e.timeStamp, e.clientX]); if (drag.trail.length > 6) drag.trail.shift(); running ? 0 : draw() });
  const drop = e => { if (!drag) return; const d = drag; drag = null; wheel.classList.remove('drag');
    if (d.moved <= 5) { mode = 'spring'; if (d.card) { const i = cards.indexOf(d.card), a = norm(i * STEP + rot); if (Math.abs(a) < 1 && i === active) open(i); else { target = rot - a; run() } } else settle(); return }
    const [t0, x0] = d.trail[0], [t1, x1] = d.trail[d.trail.length - 1], v = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;   // pixels per millisecond
    vel = v * 1000 / R * 180 / Math.PI; settle(vel * .23) };
  addEventListener('pointerup', drop); addEventListener('pointercancel', drop);
  // two fingers sideways on a trackpad
  let idle = 0;
  wheel.addEventListener('wheel', e => { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault(); mode = 'drag'; rot -= e.deltaX * .055; draw(); clearTimeout(idle); idle = setTimeout(() => settle(), 110) }, { passive: false });
  wheel.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); turn(1) } if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1) } if ((e.key === 'Enter' || e.key === ' ') && active >= 0) { e.preventDefault(); open(active) } });
  sec.querySelectorAll('[data-turn]').forEach(b => b.addEventListener('click', () => turn(+b.dataset.turn)));
  function open(i) { const c = cards[i]; window.veritasOpen && window.veritasOpen(imgs[i], c.dataset.name, c.dataset.line) }

  new ResizeObserver(measure).observe(wheel);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) run() }, { rootMargin: '0px 0px -12% 0px' }).observe(wheel);
  addEventListener('veritas-lang', () => { active = -1; draw() });
  measure();
})();
