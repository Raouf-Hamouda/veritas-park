/* VERITAS, the 3D model: the trees. Fourth version of them, at his fourth ask: no more balls on sticks.
   A crown is made of several masses of leaves, each one an uneven lump (its surface is pushed in and out by a noise), darker underneath
   and lighter on top, as leaves are in daylight. Three kinds grow here, as on the banks of the Elbe: broad crowns on a forked trunk,
   tall narrow poplars, dark conifers in drooping tiers; and bushes where the map says scrub. Each kind exists in a few shapes, every tree
   is turned, stretched and tinted a little differently, and its height is a real one (9 to 22 m beside buildings of 22 to 26 m).
   Where: the single trees and the rows of the map where they really stand (a row is one kind, evenly planted, like an avenue);
   more in the green of the map, thick in the wood, sparse on the lawns; none on a building, a street, a track or the water.
   Always the same trees: the dice are loaded with a fixed number. */
(window.VERITAS_DETAIL = window.VERITAS_DETAIL || []).push(api => {
  const { T, MAP, pairs, inside, area, HUE, mix, zones, R } = api;
  let seed = 1903; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(rnd() * a.length)];
  // a noise in space, to push the surface of a lump in and out
  const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s) }, L = (a, b, t) => a + (b - a) * t, f = t => t * t * (3 - 2 * t);
  const noise = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = f(x - xi), v = f(y - yi), w = f(z - zi);
    return L(L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v), L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w) };
  const at = (x, y, z, sx, sy, sz, ry = 0, rz = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, rz, 'YZX')), new T.Vector3(sx, sy, sz));
  // several parts become one shape
  const merge = parts => { const pos = [], nor = [], col = [];
    for (const { geo, m, shade = 1 } of parts) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
      for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); const c = C ? C.getX(i) : 1; col.push(c * shade, c * shade, c * shade) } }
    const out = new T.BufferGeometry(); out.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new T.Float32BufferAttribute(col, 3)); return out };
  // a mass of leaves: an uneven lump, dark underneath, light on top
  const lump = (detail, off, rough = .26) => { const g = new T.IcosahedronGeometry(1, detail), P = g.attributes.position, c = [], n = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), r = 1 + rough * (noise(x * 1.9 + off, y * 1.9, z * 1.9) - .5) * 2 + rough * .5 * (noise(x * 4.7, y * 4.7 + off, z * 4.7) - .5) * 2;
      P.setXYZ(i, x * r, y * r * .9, z * r); n.push(x, y * 1.1, z); const sh = .5 + .56 * (y * .5 + .5) + .16 * (noise(x * 6 + off, y * 6, z * 6) - .5); c.push(sh, sh, sh) }
    g.setAttribute('normal', new T.Float32BufferAttribute(n, 3)); g.setAttribute('color', new T.Float32BufferAttribute(c, 3)); return g };
  // a tier of a conifer: a cone whose rim droops and is uneven, dark near the trunk, lighter at the tips
  const tier = off => { const g = new T.ConeGeometry(1, 1, 16, 3), P = g.attributes.position, c = [];
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), rad = Math.hypot(x, z), r = 1 + .34 * (noise(x * 3 + off, y * 3, z * 3) - .5) * 2 * rad; P.setXYZ(i, x * r, y - rad * rad * .2, z * r); const sh = .52 + .5 * rad + .1 * (noise(x * 7, y * 7 + off, z * 7) - .5); c.push(sh, sh, sh) }
    g.computeVertexNormals(); g.setAttribute('color', new T.Float32BufferAttribute(c, 3)); return g };
  const stick = (r0, r1, h, seg = 7) => new T.CylinderGeometry(r0, r1, h, seg).translate(0, h / 2, 0);

  // the shapes. Every one stands in a space where the tree is 1 high; a tree of the model is that shape made as tall as the tree.
  const big = [lump(api.lite ? 1 : 2, 1), lump(api.lite ? 1 : 2, 5), lump(api.lite ? 1 : 2, 9)], small = [lump(1, 2), lump(1, 6), lump(1, 11), lump(1, 15)];
  const broadCrown = v => { const parts = [{ geo: big[v % 3], m: at(0, .68, 0, .3, .28, .3, v) }, { geo: small[v % 4], m: at(.02, .86, .01, .19, .16, .19, v * 2), shade: 1.06 }];
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + v * .7, d = .19 + rnd() * .06, r = .15 + rnd() * .07; parts.push({ geo: small[(i + v) % 4], m: at(Math.cos(a) * d, .56 + rnd() * .2, Math.sin(a) * d, r, r * .92, r, a), shade: .88 + rnd() * .16 }) } return merge(parts) };
  const broadTrunk = v => merge([{ geo: stick(.02, .042, .56), m: at(0, 0, 0, 1, 1, 1) }, { geo: stick(.011, .02, .26, 5), m: at(0, .36, 0, 1, 1, 1, v * 1.3, .62) }, { geo: stick(.01, .018, .24, 5), m: at(0, .42, 0, 1, 1, 1, v * 1.3 + 2.4, .55) }, { geo: stick(.009, .016, .2, 5), m: at(0, .46, 0, 1, 1, 1, v * 1.3 + 4.3, .7) }]);
  const columnCrown = v => merge([0, 1, 2, 3, 4].map(i => ({ geo: i ? small[(i + v) % 4] : big[v % 3], m: at((rnd() - .5) * .03, .3 + i * .15, (rnd() - .5) * .03, .125 - i * .017, .14, .125 - i * .017, i + v), shade: .9 + i * .04 })));
  const columnTrunk = () => merge([{ geo: stick(.016, .03, .34), m: at(0, 0, 0, 1, 1, 1) }]);
  const firCrown = v => merge([0, 1, 2, 3, 4, 5].map(i => ({ geo: tier(v * 3 + i), m: at(0, .27 + i * .125, 0, .2 * (1 - i * .14), .24, .2 * (1 - i * .14), i * 1.1 + v), shade: .86 + i * .04 })));
  const firTrunk = () => merge([{ geo: stick(.012, .028, .5), m: at(0, 0, 0, 1, 1, 1) }]);
  const bushCrown = v => merge([{ geo: small[v % 4], m: at(0, .46, 0, .52, .44, .52, v) }, { geo: small[v % 4], m: at(.34, .36, .1, .34, .3, .34, 1), shade: .92 }, { geo: small[(v + 1) % 4], m: at(-.3, .34, -.16, .3, .28, .32, 2), shade: .96 }, { geo: small[(v + 2) % 4], m: at(.05, .4, .34, .3, .3, .28, 3), shade: 1.04 }]);
  const KINDS = { broad: { crowns: [0, 1, 2].map(broadCrown), trunk: broadTrunk(1), h: [9, 16] }, column: { crowns: [0, 1].map(columnCrown), trunk: columnTrunk(), h: [15, 22] }, fir: { crowns: [0, 1].map(firCrown), trunk: firTrunk(), h: [10, 16] }, bush: { crowns: [0, 1].map(bushCrown), trunk: null, h: [2.2, 4.2] } };
  // the greens of leaves, mixed from the two greens of the book; the conifers are the darkest
  const LEAF = [mix(HUE.green[1], HUE.green[2], .3), mix(HUE.green[0], HUE.green[2], .42), mix(HUE.soft[1], HUE.soft[2], .25), mix(HUE.green[1], HUE.soft[1], .5), mix(HUE.green[0], HUE.soft[2], .5)], DARK = [mix(HUE.green[2], HUE.green[1], .32), mix(HUE.green[2], HUE.turquoise[2], .3)];

  // where no tree can stand
  const builds = api.boxed(MAP.buildings.map(b => pairs(b.p))), waters = api.boxed(api.waters), lines = [...MAP.roads.map(r => ({ l: pairs(r.p), w: (api.WIDTH[r.k] || 3) / 2 + 2.5 })), ...MAP.rails.map(r => ({ l: pairs(r), w: 4.5 }))].map(o => { const xs = o.l.map(q => q[0]), ys = o.l.map(q => q[1]); return { ...o, x0: Math.min(...xs) - o.w, x1: Math.max(...xs) + o.w, y0: Math.min(...ys) - o.w, y1: Math.max(...ys) + o.w } });
  const planted = [], free = (x, y, gap) => Math.hypot(x, y) < R - 14 && Math.hypot(x, y) > 16 && !api.hit(builds, x, y, 3) && !api.hit(waters, x, y, 2.5) && !lines.some(o => x > o.x0 && x < o.x1 && y > o.y0 && y < o.y1 && api.away(o.l, x, y) < o.w) && !planted.some(q => Math.abs(q[0] - x) < gap && Math.abs(q[1] - y) < gap && Math.hypot(q[0] - x, q[1] - y) < gap);
  const bags = {};   // kind and shape -> the trees of that shape
  const plant = (kind, x, y, tall = 1, shape) => { const K = KINDS[kind], v = shape ?? Math.floor(rnd() * K.crowns.length), H = (K.h[0] + rnd() * (K.h[1] - K.h[0])) * tall, wide = H * (.88 + rnd() * .3);
    const tint = pick(kind === 'fir' ? DARK : LEAF).clone().multiplyScalar(.9 + rnd() * .22); (bags[kind + v] = bags[kind + v] || { K, v, items: [] }).items.push({ x, y: 0, z: -y, sx: wide, sy: H, sz: wide * (.9 + rnd() * .2), ry: rnd() * 6.28, color: tint }); planted.push([x, y]) };
  const any = () => { const k = rnd(); return k < .13 ? 'fir' : k < .3 ? 'column' : 'broad' };
  for (const [x, y] of pairs(MAP.trees)) if (free(x, y, 3)) plant('broad', x, y, 1.1);
  for (const row of MAP.rows) { const shape = Math.floor(rnd() * 3); for (const line of api.clip(pairs(row))) api.along(line, 9.5, (x, y) => { if (free(x, y, 4)) plant('broad', x, y, .82 + rnd() * .1, shape) }, 2) }
  const scatter = (p, per1000, kind, tall = 1, gap = 6.5) => { const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), want = Math.min(220, Math.abs(area(p)) / 1000 * per1000) * (api.lite ? .5 : 1); let made = 0, tries = 0;
    while (made < want && tries++ < want * 28) { const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); if (!inside(x, y, p) || !free(x, y, gap)) continue; plant(kind || any(), x, y, tall); made++ } };
  for (const g of api.greens) { if (g.k === 'scrub') { scatter(g.p, 2.4, 'bush', 1, 5); scatter(g.p, 1, null, .8) } else if (g.k === 'allotments') scatter(g.p, 1.2, 'bush', .8, 5); else scatter(g.p, { wood: 5.2, park: 1.8, meadow: .25, grass: .5 }[g.k] || 0, null, g.k === 'wood' ? 1.1 : 1, g.k === 'wood' ? 5.5 : 7.5) }
  for (const [id, n] of [['park', 2.1], ['harbour', 1.2], ['creative', .55], ['industrial', .22], ['culture', .32], ['factory', .2]]) scatter(zones[id].poly, n, null, 1, 8);
  for (const [id, n] of [['park', .6], ['harbour', .45], ['creative', .25]]) scatter(zones[id].poly, n, 'bush', 1, 5.5);

  const leaf = new T.MeshLambertMaterial({ vertexColors: true }), bark = new T.MeshLambertMaterial({ color: mix(HUE.brown[2], HUE.ocher[2], .5) });
  for (const key in bags) { const { K, v, items } = bags[key]; api.instances(K.crowns[v], leaf, items, api.wood, K.trunk !== null && !api.lite); if (K.trunk) api.instances(K.trunk, bark, items.map(it => ({ ...it, color: null })), api.wood) }
});
