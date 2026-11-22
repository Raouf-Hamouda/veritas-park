/* VERITAS, the floor plans of building 13 as layers (Rent page). Needs lib/three.min.js. Fourth version (23 Nov 2026).
   His words: "a better design of the sheets themselves, 99% faithful to them, the 3D idea of layers, and make sure they are all visible".
   So nothing is built from the drawings any more. Each plan of the live site is shown as it is, untouched, on its own white sheet.
   The nine sheets stand one above the other like the floors of the building, the roof on top, each with its floor mark.
   Point at a sheet (or at its name in the list): it slides out of the stack like a drawer, whole. Click it: it comes flat and large, to be read;
   the wheel zooms into the drawing and a drag moves over it. "All floors" or Escape brings the stack back.
   In the stack: drag turns it, the wheel zooms, shift + drag moves, a double click puts it back as it was. */
(() => {
  const T = window.THREE, view = document.querySelector('.stack .view'); if (!T || !view) return;
  const files = view.dataset.floors.split(','), list = view.parentNode.querySelector('.floors'), btns = [...list.querySelectorAll('button')], canvas = view.querySelector('canvas'), N = files.length;
  const mark = i => btns.forEach((b, k) => b.setAttribute('aria-selected', k === i));
  let renderer; try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }) }
  catch (e) { const im = document.createElement('img'); im.className = 'flat'; view.append(im); canvas.remove(); const pick = i => { im.src = files[i]; mark(i) }; btns.forEach((b, i) => b.addEventListener('click', () => pick(i))); pick(7); return }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new T.Scene(), cam = new T.OrthographicCamera(-1, 1, 1, -1, -5000, 9000), V = new T.Vector3();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, out = t => 1 - Math.pow(1 - t, 3), calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const bright = getComputedStyle(document.body).getPropertyValue('--h-bright').trim() || '#FF80FF';
  const WIDE = 320, DMAX = 178, GAP = 72, SLIDE = WIDE * .42, HOME = { az: .36, el: .5 };   // a sheet is at most 320 wide and 178 deep; 72 between two floors

  // the soft shadow a sheet lays on the one under it
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128; { const x = sc.getContext('2d'); x.shadowColor = '#000'; x.shadowBlur = 26; x.fillStyle = '#000'; x.fillRect(40, 34, 176, 60) }
  const shadowTex = new T.CanvasTexture(sc), quad = new T.PlaneGeometry(1, 1), rim = new T.EdgesGeometry(quad), loader = new T.TextureLoader();
  let dirty = true;
  // one sheet: its soft shadow, the plan itself (the picture of the live site, its own colours, nothing redrawn), a thin edge. Sheets are painted from the lowest floor up.
  const layers = files.map((src, i) => {
    const k = N - 1 - i, g = new T.Group(); scene.add(g);
    const shadow = new T.Mesh(quad, new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: .2 }));
    const sheet = new T.Mesh(quad, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false }));
    const edge = new T.LineSegments(rim, new T.LineBasicMaterial({ color: '#1B1A17', transparent: true, depthWrite: false }));
    [shadow, sheet, edge].forEach((m, o) => { m.rotation.x = -Math.PI / 2; m.renderOrder = k * 3 + o; g.add(m) });
    shadow.position.set(3, -.6, 5); sheet.userData.i = i;
    const L = { i, k, g, sheet, edge, shadow, w: WIDE, d: WIDE * .54, y: 0, slide: 0, op: 1 };
    const size = () => { sheet.scale.set(L.w, L.d, 1); edge.scale.set(L.w, L.d, 1); shadow.scale.set(L.w * 256 / 176, L.d * 128 / 60, 1) }; size();
    loader.load(src, tex => { tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); const im = tex.image, s = Math.min(WIDE / im.width, DMAX / im.height); L.w = im.width * s; L.d = im.height * s; size(); L.tex = tex; L.img = im; sheet.material.map = tex; sheet.material.needsUpdate = true; dirty = true });
    return L;
  });

  // on the model: the mark of each floor at the corner of its sheet, and the way back to the stack
  const ui = document.createElement('div'); ui.className = 'fl-ui';
  ui.innerHTML = `<div class="fl-tags">${btns.map(b => `<span>${b.querySelector('i').textContent}</span>`).join('')}</div><div class="fl-sheet" hidden><img alt="" draggable="false"></div><button type="button" class="sbtn s fl-back" hidden><span></span><svg class="curve" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M100 96.4A96.4 96.4 0 0 1 3.6 0"/></svg></button>`;
  view.append(ui); const tags = [...ui.querySelectorAll('.fl-tags span')], back = ui.querySelector('.fl-back');
  const word = () => { back.firstChild.textContent = document.documentElement.lang === 'de' ? 'Alle Etagen' : 'All floors' }; word(); addEventListener('veritas-lang', word);
  // an opened floor is shown as the drawing itself (lines, not points): it stays sharp however close you come.
  // With a mouse: the wheel zooms on the pointer, a drag moves. With fingers: the sheet fills the screen; one finger moves it, two fingers zoom, a double tap comes close or steps back.
  const sheet = ui.querySelector('.fl-sheet'), pic = sheet.firstChild, touch = matchMedia('(pointer:coarse)').matches, ZMAX = touch ? 7 : 14; pic.src = files[7];
  let sz = 1, drawn = 1, sxo = 0, syo = 0, sheetTimer = 0, sharpT = 0, baseW = 0, grab = null, two = null; const pts = new Map();
  // while the hand moves, the drawing is only stretched; as soon as it rests it is drawn again at its true size, so its lines are fine
  const sharp = () => { if (!baseW) baseW = pic.offsetWidth / drawn; if (!baseW) return; drawn = sz; pic.style.maxWidth = pic.style.maxHeight = 'none'; pic.style.width = (baseW * sz).toFixed(1) + 'px'; pic.style.transform = `translate(${sxo.toFixed(1)}px,${syo.toFixed(1)}px)` };
  const setPic = () => { pic.style.transform = `translate(${sxo.toFixed(1)}px,${syo.toFixed(1)}px) scale(${(sz / drawn).toFixed(4)})`; clearTimeout(sharpT); sharpT = setTimeout(sharp, 140) };
  const resetPic = () => { clearTimeout(sharpT); sz = drawn = 1; sxo = syo = 0; baseW = 0; pic.style.width = pic.style.maxWidth = pic.style.maxHeight = ''; pic.style.transform = '' };
  const fromMid = (x, y) => { const r = sheet.getBoundingClientRect(); return [x - r.left - r.width / 2, y - r.top - r.height / 2] };
  const zoomAt = (z1, mx, my) => { z1 = clamp(z1, 1, ZMAX); const k = z1 / sz; sxo = mx - (mx - sxo) * k; syo = my - (my - syo) * k; sz = z1; if (sz === 1) sxo = syo = 0; setPic() };   // the point under the hand stays under it
  sheet.addEventListener('wheel', e => { const pinchy = e.ctrlKey || e.metaKey; if (!pinchy && (performance.now() - lastScroll < 420 || (e.deltaY > 0 && sz <= 1.001))) return; e.preventDefault(); zoomAt(sz * Math.exp(-e.deltaY * (pinchy ? .012 : .0026)), ...fromMid(e.clientX, e.clientY)) }, { passive: false });
  sheet.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; pts.set(e.pointerId, e); sheet.setPointerCapture(e.pointerId);
    if (pts.size === 2) { const [p, q] = [...pts.values()]; two = { d: Math.hypot(p.clientX - q.clientX, p.clientY - q.clientY) || 1, sz, sxo, syo, m: fromMid((p.clientX + q.clientX) / 2, (p.clientY + q.clientY) / 2) }; grab = null } else grab = { x: e.clientX, y: e.clientY, ox: sxo, oy: syo } });
  sheet.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
    if (two && pts.size === 2) { const [p, q] = [...pts.values()], m = fromMid((p.clientX + q.clientX) / 2, (p.clientY + q.clientY) / 2), z1 = clamp(two.sz * Math.hypot(p.clientX - q.clientX, p.clientY - q.clientY) / two.d, 1, ZMAX), k = z1 / two.sz;
      sxo = m[0] - (two.m[0] - two.sxo) * k; syo = m[1] - (two.m[1] - two.syo) * k; sz = z1; setPic(); return }
    if (grab) { sxo = grab.ox + e.clientX - grab.x; syo = grab.oy + e.clientY - grab.y; setPic() } });
  const lift = e => { pts.delete(e.pointerId); two = grab = null; if (pts.size === 1) { const p = [...pts.values()][0]; grab = { x: p.clientX, y: p.clientY, ox: sxo, oy: syo } } };
  sheet.addEventListener('pointerup', lift); sheet.addEventListener('pointercancel', lift);
  sheet.addEventListener('dblclick', e => { if (e.target.closest('button')) return; if (sz > 1.05) { sz = 1; sxo = syo = 0; setPic() } else zoomAt(touch ? 3 : 2.5, ...fromMid(e.clientX, e.clientY)) });
  sheet.addEventListener('touchmove', e => e.preventDefault(), { passive: false }); sheet.addEventListener('gesturestart', e => e.preventDefault()); addEventListener('resize', () => { if (!sheet.hidden && sz === 1) resetPic() });
  // on a phone the opened sheet fills the screen, under the name of its floor and a tile to close it
  if (touch) { sheet.classList.add('full'); const bar = document.createElement('div'); bar.className = 'fl-bar'; bar.innerHTML = '<b></b><button type="button" class="round" aria-label="Close"><svg class="ico" viewBox="0 0 100 100" aria-hidden="true"><path d="M15 15L85 85"/><path d="M85 15L15 85"/></svg></button>'; sheet.append(bar); document.body.append(sheet); bar.querySelector('button').addEventListener('click', () => show(-1)) }

  let open = -1, hot = -1, visible = false, W = 1, H = 1, drag = null, born = 0, zoom = 1, zoomTo = 1, pr = 0, pu = 0, half = 300;
  const goal = { ...HOME }, cur = { az: HOME.az, el: HOME.el, hw: 420, tx: 0, ty: 0, tz: 0 };
  // the two directions of the screen, said in the space of the model: to the right, and up
  const axes = (az, el) => [[Math.cos(az), 0, -Math.sin(az)], [-Math.sin(az) * Math.sin(el), Math.cos(el), -Math.cos(az) * Math.sin(el)]];
  // where to look and how wide, so that the whole stack, with room for a sheet pulled out, fills the view
  const fitStack = (az, el) => { const [r, u] = axes(az, el); let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const x of [-WIDE / 2, WIDE / 2 + SLIDE]) for (const y of [0, (N - 1) * GAP]) for (const z of [-DMAX / 2, DMAX / 2]) { const p = x * r[0] + z * r[2], q = x * u[0] + y * u[1] + z * u[2]; a = Math.min(a, p); b = Math.max(b, p); c = Math.min(c, q); d = Math.max(d, q) }
    const cr = (a + b) / 2, cu = (c + d) / 2; return { hw: Math.max((b - a) / 2, (d - c) / 2 * W / H) * 1.1, tx: cr * r[0] + cu * u[0], ty: cu * u[1], tz: cr * r[2] + cu * u[2] } };
  const show = i => { clearTimeout(sheetTimer); sheet.classList.remove('on'); if (i >= 0) { pic.src = files[i]; resetPic(); sheet.hidden = false; if (touch) sheet.querySelector('.fl-bar b').textContent = [...btns[i].childNodes].filter(n => n.nodeName !== 'I').map(n => n.textContent).join(' ').trim(); sheetTimer = setTimeout(() => sheet.classList.add('on'), calm || touch ? 0 : 950) } else sheetTimer = setTimeout(() => { sheet.hidden = true }, 320);
    open = i; hot = -1; zoomTo = 1; pr = pu = 0; back.hidden = i < 0; if (i >= 0) { goal.az = 0; goal.el = 1.5 } else Object.assign(goal, HOME); mark(i); canvas.style.cursor = ''; dirty = true };
  const hover = i => { if (open >= 0 || i === hot) return; hot = i; mark(i); canvas.style.cursor = i >= 0 ? 'pointer' : ''; dirty = true };
  btns.forEach((b, i) => { b.addEventListener('mouseenter', () => hover(i)); b.addEventListener('mouseleave', () => hover(-1)); b.addEventListener('click', () => show(open === i ? -1 : i)) });
  back.addEventListener('click', () => show(-1)); addEventListener('keydown', e => { if (e.key === 'Escape' && open >= 0) show(-1) });

  // the hand
  const ray = new T.Raycaster(), mouse = new T.Vector2();
  const under = e => { const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, cam); const hit = ray.intersectObjects(layers.filter(L => L.op > .5).map(L => L.sheet))[0]; return hit ? hit.object.userData.i : -1 };
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az: goal.az, el: goal.el, pr, pu, moved: 0, pan: open >= 0 || e.shiftKey || e.button === 2 }; canvas.setPointerCapture(e.pointerId) });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  let pinch = null; const gap = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1;
  canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = { d: gap(e.touches), z: zoomTo }; drag = null } }, { passive: true });
  canvas.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch) { e.preventDefault(); zoomTo = clamp(pinch.z * gap(e.touches) / pinch.d, .8, 12); dirty = true } }, { passive: false });
  canvas.addEventListener('touchend', () => { pinch = null }); canvas.addEventListener('gesturestart', e => e.preventDefault());
  canvas.addEventListener('pointermove', e => { if (!drag) { if (e.pointerType === 'mouse') hover(under(e)); return }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); if (drag.moved <= 4) return;
    if (drag.pan) { pr = drag.pr - dx * 2 * half / W; pu = drag.pu + dy * 2 * half / W } else { goal.az = drag.az - dx * .006; if (e.pointerType === 'mouse') goal.el = clamp(drag.el + dy * .004, .2, 1.3) } dirty = true });
  canvas.addEventListener('pointerup', e => { const d = drag; drag = null; if (d && d.moved <= (e.pointerType === 'mouse' ? 4 : 10) && open < 0) { const i = under(e); if (i >= 0) show(i) } });
  canvas.addEventListener('pointercancel', () => drag = null); canvas.addEventListener('pointerleave', () => { if (!drag) hover(-1) });
  let lastScroll = 0; addEventListener('scroll', () => lastScroll = performance.now(), { passive: true });   // a wheel that was already scrolling the page goes on scrolling it
  canvas.addEventListener('wheel', e => { const pinchy = e.ctrlKey || e.metaKey; if (!pinchy && (performance.now() - lastScroll < 420 || (e.deltaY > 0 && zoomTo <= .81))) return; e.preventDefault(); zoomTo = clamp(zoomTo * Math.exp(-e.deltaY * (pinchy ? .012 : .0026)), .8, 12); dirty = true }, { passive: false });
  canvas.addEventListener('dblclick', () => { zoomTo = 1; pr = pu = 0; if (open < 0) Object.assign(goal, HOME); dirty = true });

  // close to the stack, a sheet in view is drawn again twice as large from its lines, so they stay fine; it is let go when you step back
  const fine = L => { const c = document.createElement('canvas'); c.width = 4096; c.height = Math.round(4096 * L.d / L.w); c.getContext('2d').drawImage(L.img, 0, 0, c.width, c.height);
    L.fine = new T.CanvasTexture(c); L.fine.anisotropy = renderer.capabilities.getMaxAnisotropy(); L.sheet.material.map = L.fine; dirty = true };
  const coarse = L => { if (!L.fine) return; L.sheet.material.map = L.tex; L.fine.dispose(); L.fine = null; dirty = true };
  const inView = L => { let a = 9, b = -9, c = 9, d = -9; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { V.set(L.slide + sx * L.w / 2, L.y, sz * L.d / 2).project(cam); a = Math.min(a, V.x); b = Math.max(b, V.x); c = Math.min(c, V.y); d = Math.max(d, V.y) } return a < 1 && b > -1 && c < 1 && d > -1 };
  function size() { W = view.clientWidth; H = view.clientHeight; if (!W || !H) return; renderer.setSize(W, H, false); dirty = true }
  function frame(now) {
    if (!visible) return; requestAnimationFrame(frame); if (!born) born = now;
    const age = (now - born) / 1000, k = calm ? 1 : .12; let moving = age < 1.9;
    const g = open >= 0 ? { hw: Math.max(layers[open].w / 2, layers[open].d / 2 * W / H) * 1.1, tx: 0, ty: layers[open].k * GAP, tz: 0 } : fitStack(goal.az, goal.el);
    for (const [key, to] of [['az', goal.az], ['el', goal.el], ['hw', g.hw], ['tx', g.tx], ['ty', g.ty], ['tz', g.tz]]) if (Math.abs(cur[key] - to) > 1e-3) { cur[key] = lerp(cur[key], to, k); moving = true }
    if (Math.abs(zoom - zoomTo) > 1e-3) { zoom = lerp(zoom, zoomTo, calm ? 1 : .16); moving = true }
    for (const L of layers) {   // on arrival the floors rise one after the other from the ground
      const y = L.k * GAP * (calm ? 1 : out(clamp((age - L.k * .07) / .9, 0, 1))), s = open < 0 && hot === L.i ? SLIDE : 0, o = open < 0 || open === L.i ? 1 : 0;
      if (Math.abs(L.slide - s) > .05 || Math.abs(L.op - o) > .004) moving = true;
      L.slide = lerp(L.slide, s, calm ? 1 : .14); L.op = lerp(L.op, o, calm ? 1 : .14); L.y = y; L.g.position.set(L.slide, y, 0); L.g.visible = L.op > .01;
      L.sheet.material.opacity = L.op; L.edge.material.opacity = L.op * (hot === L.i ? 1 : .5); L.edge.material.color.set(hot === L.i ? bright : '#1B1A17'); L.shadow.material.opacity = open < 0 ? .2 * L.op : 0;
    }
    if (open < 0 && zoomTo > 1.45 && !moving && !drag) { const L = layers.find(L => !L.fine && L.img && inView(L)); if (L) fine(L) } else if (zoomTo < 1.25 || open >= 0) layers.forEach(coarse);
    if (!moving && !dirty) return; dirty = false;
    const [r, u] = axes(cur.az, cur.el); half = cur.hw / zoom; cam.left = -half; cam.right = half; cam.top = half * H / W; cam.bottom = -cam.top; cam.updateProjectionMatrix();
    const tx = cur.tx + pr * r[0] + pu * u[0], ty = cur.ty + pu * u[1], tz = cur.tz + pr * r[2] + pu * u[2];
    cam.position.set(tx + Math.sin(cur.az) * Math.cos(cur.el) * 3000, ty + Math.sin(cur.el) * 3000, tz + Math.cos(cur.az) * Math.cos(cur.el) * 3000); cam.lookAt(tx, ty, tz); cam.updateMatrixWorld(); renderer.render(scene, cam);
    layers.forEach((L, n) => { V.set(L.slide - L.w / 2, L.y, L.d / 2).project(cam); tags[n].style.transform = `translate(${((V.x + 1) / 2 * W).toFixed(1)}px,${((1 - V.y) / 2 * H).toFixed(1)}px) translate(-150%,-50%)`; tags[n].style.opacity = open < 0 ? L.op : 0 });
  }
  new ResizeObserver(size).observe(view); size(); mark(-1);
  new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was) { dirty = true; requestAnimationFrame(frame) } }).observe(view);
  // a floor chosen on the 3D model of the site arrives here by its link (rent.html#floor-3)
  const fromLink = () => { const m = /^#floor-(\d)$/.exec(location.hash); if (m) { show(+m[1]); setTimeout(() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' }), 400) } }; fromLink(); addEventListener('hashchange', fromLink);
})();
