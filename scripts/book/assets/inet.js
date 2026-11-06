/* inet.js — the book's interaction-net engine.
   Shared by the build (static SVG figures, run under Bun) and the page (animated players).
   Classic script: defines a global `Inet`; no imports, no DOM access.

   Notation (Lafont / HVM2 style):
     γ(a, b)   constructor      λ(x, b) and @(a, r) are γ cells drawn as λ and @
     δ(a, b)   duplicator       δA(a, b) carries label A (δ–δ annihilate only with equal labels)
     ε         eraser
     t ~ u     an active pair (two principal ports joined)
     x = t     free port x wired to the principal of t
     a name used once is a free port; a name used twice is a wire
     γ#u(…)    optional tag "u" drawn beside the cell                                          */
var Inet = (function () {
  "use strict";

  /* ================================================================ parse */
  const AGENT = { "γ": "g", "λ": "g", "@": "g", "δ": "d", "ε": "e" };
  const DELIM = /[\s(),;~=]/;

  function tokenize(src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if ("(),;~=".includes(c)) { out.push({ t: c }); i++; continue; }
      if (AGENT[c]) {
        let j = i + 1, label = "", tag = "";
        if (c === "δ") while (j < src.length && /[A-Z]/.test(src[j])) label += src[j++];
        if (src[j] === "#") { j++; while (j < src.length && !DELIM.test(src[j])) tag += src[j++]; }
        out.push({ t: "agent", show: c, kind: AGENT[c], label, tag });
        i = j;
        continue;
      }
      let j = i;
      while (j < src.length && !DELIM.test(src[j])) j++;
      out.push({ t: "name", name: src.slice(i, j) });
      i = j;
    }
    return out;
  }

  function parse(src) {
    const toks = tokenize(src);
    let k = 0;
    const fail = (msg) => { throw new Error(`inet: ${msg} in "${src}"`); };
    const take = (t) => {
      const x = toks[k];
      if (!x) fail(`unexpected end, wanted ${t || "a term"}`);
      if (t && x.t !== t) fail(`expected '${t}' but found '${x.name || x.t}'`);
      k++;
      return x;
    };
    const tree = () => {
      const x = take();
      if (x.t === "name") return { name: x.name };
      if (x.t !== "agent") fail(`unexpected '${x.t}'`);
      const node = { show: x.show, kind: x.kind, label: x.label, tag: x.tag, kids: [] };
      if (x.kind !== "e") {
        take("("); node.kids.push(tree()); take(","); node.kids.push(tree()); take(")");
      }
      return node;
    };
    const eqs = [];
    while (k < toks.length) {
      if (toks[k].t === ";") { k++; continue; }
      const a = tree();
      const op = take();
      if (op.t !== "~" && op.t !== "=") fail(`expected '~' or '=' but found '${op.name || op.t}'`);
      eqs.push([a, tree()]);
    }
    return eqs;
  }

  /* ============================================================== the net */
  // Ports: "<id>.<slot>" (slot 0 = principal, 1/2 = aux) and ":<name>" for free ports.
  const arity = (c) => (c.kind === "e" ? 0 : 2);
  const cellPort = (p) => {
    const m = /^(\d+)\.(\d)$/.exec(p);
    return m ? { id: Number(m[1]), slot: Number(m[2]) } : null;
  };

  /** Joins edges through virtual nodes; every component must end in exactly two real ports. */
  /**
   * Joins edges (each optionally tagged with the old wire it came from) through the welded
   * ports, and returns both the wires and — for every wire — the chain of old wires it
   * continues, which is what the animation morphs along (see `frames`).
   */
  function contract(edges, isReal, what) {
    const adj = new Map();
    const add = (p, q, src) => {
      if (!adj.has(p)) adj.set(p, []);
      if (!adj.has(q)) adj.set(q, []);
      adj.get(p).push({ to: q, src, rev: false });
      adj.get(q).push({ to: p, src, rev: true });
    };
    for (const e of edges) add(e[0], e[1], e[2]);
    const wires = new Map();
    const chains = new Map();
    const seen = new Set();
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const stack = [start], comp = [], real = [];
      seen.add(start);
      while (stack.length) {
        const p = stack.pop();
        comp.push(p);
        if (isReal(p)) real.push(p);
        for (const e of adj.get(p)) if (!seen.has(e.to)) { seen.add(e.to); stack.push(e.to); }
      }
      if (!real.length) continue;
      if (real.length !== 2) throw new Error(`inet: ${what}: a wire with ${real.length} ends (${real.join(" ")})`);
      // the component is a path: walk it from one real end to the other, noting
      // which old wire each step came from
      const keys = [];
      let at = real[0], prev = null;
      for (let guard = 0; guard <= comp.length + 2; guard++) {
        if (at === real[1] && prev !== null) break;
        const next = adj.get(at).find((e) => e.to !== prev);
        if (!next) break;
        if (next.src) keys.push({ key: next.src, rev: next.rev });
        prev = at; at = next.to;
      }
      wires.set(real[0], real[1]); wires.set(real[1], real[0]);
      const key = real[0] < real[1] ? real[0] + "|" + real[1] : real[1] + "|" + real[0];
      chains.set(key, { from: real[0], to: real[1], keys });
    }
    return { wires, chains };
  }

  function build(src) {
    const eqs = parse(src);
    const cells = new Map();
    let nextId = 1, virt = 0;
    const edges = [];
    const occ = new Map(), order = [];
    const occur = (name, port) => {
      if (!occ.has(name)) { occ.set(name, []); order.push(name); }
      occ.get(name).push(port);
    };
    const mk = (t) => {
      const id = nextId++;
      cells.set(id, { id, kind: t.kind, show: t.show, label: t.label || "", tag: t.tag || "" });
      t.kids.forEach((kid, i) => {
        const port = `${id}.${i + 1}`;
        if (kid.name != null) occur(kid.name, port);
        else edges.push([port, mk(kid)]);
      });
      return `${id}.0`;
    };
    for (const [a, b] of eqs) {
      if (a.name != null && b.name != null) {
        const v = `v:${virt++}`;
        occur(a.name, v); occur(b.name, v);
        continue;
      }
      const pa = a.name == null ? mk(a) : null;
      const pb = b.name == null ? mk(b) : null;
      if (pa && pb) edges.push([pa, pb]);
      else if (pa) occur(b.name, pa);
      else occur(a.name, pb);
    }
    const free = [];
    for (const name of order) {
      const ps = occ.get(name);
      if (ps.length > 2) throw new Error(`inet: name "${name}" is used ${ps.length} times in "${src}"`);
      for (const p of ps) edges.push([p, `n:${name}`]);
      if (ps.length === 1) { edges.push([`n:${name}`, `:${name}`]); free.push(name); }
    }
    const { wires } = contract(edges, (p) => !/^[nv]:/.test(p), src);
    // remember the source's own names for internal wires, so the readback can reuse them
    const names = new Map();
    for (const name of order) {
      if (occ.get(name).length !== 2) continue;
      const ends = wires;
      const q = occ.get(name).find((x) => !/^v:/.test(x));
      if (q && ends.has(q)) names.set(wireKey(q, ends.get(q)), name);
    }
    for (const c of cells.values()) {
      for (let s = 0; s <= arity(c); s++) {
        if (!wires.has(`${c.id}.${s}`)) throw new Error(`inet: port ${c.show}.${s} is not wired in "${src}"`);
      }
    }
    return { cells, wires, nextId, free, names };
  }
  const wireKey = (p, q) => (p < q ? p + "|" + q : q + "|" + p);

  function activePairs(net) {
    const out = [];
    for (const [p, q] of net.wires) {
      const a = cellPort(p), b = cellPort(q);
      if (a && b && a.slot === 0 && b.slot === 0 && a.id < b.id) out.push([a.id, b.id]);
    }
    return out.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  }

  const sym = (c) => c.show + (c.kind === "d" ? c.label : "");
  const annihilates = (u, v) => u.kind === v.kind && (u.kind !== "d" || u.label === v.label);

  function ruleOf(u, v) {
    if (u.kind === "e" && v.kind === "e") return { kind: "annihilation", name: "ε–ε annihilation", short: "εε" };
    if (u.kind === "e" || v.kind === "e") {
      const o = u.kind === "e" ? v : u;
      return { kind: "erasure", name: `${sym(o)}–ε erasure`, short: `${o.show}ε` };
    }
    if (annihilates(u, v)) {
      const shows = [u.show, v.show].sort().join("");
      if (shows === "@λ") return { kind: "annihilation", name: "λ–@ annihilation = β", short: "β" };
      return { kind: "annihilation", name: `${sym(u)}–${sym(v)} annihilation`, short: `${u.show}${v.show}` };
    }
    const [a, b] = u.kind === "g" || (u.kind === v.kind && u.label < v.label) ? [u, v] : [v, u];
    return { kind: "commutation", name: `${sym(a)}–${sym(b)} commutation (copying)`, short: `${a.show}${b.show}` };
  }

  function cloneNet(net) {
    return {
      cells: new Map([...net.cells].map(([id, c]) => [id, { ...c }])),
      wires: new Map(net.wires),
      nextId: net.nextId,
      free: net.free.slice(),
      names: new Map(net.names || []),
    };
  }

  /** One interaction on the lowest active pair. Returns { net, event } or null in normal form. */
  function step(net0) {
    const pairs = activePairs(net0);
    if (!pairs.length) return null;
    const net = cloneNet(net0);
    const [uid, vid] = pairs[0];
    const u = net.cells.get(uid), v = net.cells.get(vid);
    const edges = [];
    for (const [p, q] of net.wires) if (p < q) edges.push([p, q, p + "|" + q]);
    const born = [];
    const mk = (like, from) => {
      const id = net.nextId++;
      net.cells.set(id, { id, kind: like.kind, show: like.show, label: like.label, tag: "" });
      born.push({ id, from });
      return id;
    };
    const P = (id, s) => `${id}.${s}`;
    if (u.kind === "e" && v.kind === "e") {
      /* both vanish */
    } else if (u.kind === "e" || v.kind === "e") {
      const [o, e] = u.kind === "e" ? [v, u] : [u, v];
      for (const s of [1, 2]) edges.push([P(o.id, s), P(mk(e, e.id), 0)]);
    } else if (annihilates(u, v)) {
      edges.push([P(uid, 1), P(vid, 1)], [P(uid, 2), P(vid, 2)]);
    } else {
      // copies of v move onto u's aux wires, copies of u onto v's; cross-wire δᵢ.auxⱼ – γⱼ.auxᵢ
      const vs = [1, 2].map(() => mk(v, vid));
      const us = [1, 2].map(() => mk(u, uid));
      vs.forEach((c, i) => edges.push([P(uid, i + 1), P(c, 0)]));
      us.forEach((c, j) => edges.push([P(vid, j + 1), P(c, 0)]));
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) edges.push([P(vs[i], j + 1), P(us[j], i + 1)]);
    }
    net.cells.delete(uid); net.cells.delete(vid);
    const alive = (p) => { const d = cellPort(p); return !d || net.cells.has(d.id); };
    const out = contract(edges, alive, "after " + ruleOf(u, v).name);
    net.wires = out.wires;
    return { net, event: { u: uid, v: vid, rule: ruleOf(u, v), born, chains: out.chains } };
  }

  /** All states from the start to normal form (or `limit` interactions). */
  function reduce(src, limit) {
    const states = [build(src)];
    const events = [];
    const max = limit == null ? 64 : limit;
    while (events.length < max) {
      const r = step(states[states.length - 1]);
      if (!r) break;
      states.push(r.net); events.push(r.event);
    }
    return { states, events };
  }

  /* ============================================================= readback */
  /** Reads a net back into equations of trees (the notation above). */
  function readback(net) {
    const known = net.names || new Map();
    const used = new Set([...net.free, ...known.values()]);
    const pool = "pqstuvwabcdfghjkmnz".split("").filter((c) => !used.has(c));
    let pi = 0;
    const fresh = () => (pi < pool.length ? pool[pi++] : `w${pi++}`);
    const named = new Map();
    const nameFor = (p) => {
      if (named.has(p)) return named.get(p);
      const n = known.get(wireKey(p, net.wires.get(p))) || fresh();
      named.set(p, n); named.set(net.wires.get(p), n);
      return n;
    };
    const visited = new Set();
    const tree = (id) => {
      visited.add(id);
      const c = net.cells.get(id);
      const node = { id, show: c.show, kind: c.kind, label: c.label, tag: c.tag, kids: [] };
      for (let s = 1; s <= arity(c); s++) {
        const p = `${id}.${s}`, q = net.wires.get(p);
        if (q[0] === ":") { node.kids.push({ name: q.slice(1), port: p, target: q }); continue; }
        const d = cellPort(q);
        if (d.slot === 0 && !visited.has(d.id) && !named.has(q)) node.kids.push(tree(d.id));
        else node.kids.push({ name: nameFor(p), port: p, target: q });
      }
      return node;
    };
    const eqs = [];
    for (const name of net.free) {
      const q = net.wires.get(`:${name}`);
      if (q[0] === ":") {
        if (net.free.indexOf(q.slice(1)) > net.free.indexOf(name)) eqs.push({ type: "wire", a: name, b: q.slice(1) });
        continue;
      }
      const d = cellPort(q);
      if (d.slot === 0) eqs.push({ type: "root", name, tree: tree(d.id) });
    }
    const pairs = activePairs(net);
    pairs.forEach(([u, v], i) => {
      const eps = (id) => net.cells.get(id).kind === "e";
      const [x, y] = eps(u) && !eps(v) ? [v, u] : [u, v];
      eqs.push({ type: "pair", a: tree(x), b: tree(y), ids: [u, v], next: i === 0 });
    });
    for (const id of [...net.cells.keys()].sort((a, b) => a - b)) {
      if (visited.has(id)) continue;
      const n = nameFor(`${id}.0`);
      eqs.push({ type: "cycle", name: n, tree: tree(id) });
    }
    return eqs;
  }

  function treeText(t) {
    if (t.name != null) return t.name;
    const head = sym(t);
    return t.kind === "e" ? head : `${head}(${treeText(t.kids[0])}, ${treeText(t.kids[1])})`;
  }
  function eqText(e) {
    if (e.type === "wire") return `${e.a} = ${e.b}`;
    if (e.type === "pair") return `${treeText(e.a)} ~ ${treeText(e.b)}`;
    return `${e.name} = ${treeText(e.tree)}`;
  }
  const notation = (net) => {
    const eqs = readback(net);
    return eqs.length ? eqs.map((e) => ({ text: eqText(e), next: !!e.next, active: e.type === "pair" })) : [{ text: "∅ (the empty net)" }];
  };

  /* =============================================================== layout */
  // Drawing units. Proportions follow Lafont's figures as netties draws them: every
  // triangle 48 wide and 30 tall, tip on the principal port, aux ports 16 apart on the base.
  const G = {
    apex: 15, base: 15, half: 24, aux: 8, eps: 8,
    leaf: 32, gap: 26, drop: 30, freeGap: 30, bandGap: 38, minFree: 64, margin: 18, compGap: 26,
    radius: 9, ink: 1.4, halo: 6,
  };
  const reach = (c) => (c.kind === "e" ? G.eps : G.apex);

  /** Tree with principal up; root cell centre at (0, 0). Returns local placements and extent. */
  function layoutTree(t) {
    const cells = [];
    let maxY = 0;
    const width = (n) => {
      if (n.name != null || n.kind === "e") return G.leaf;
      return Math.max(2 * G.leaf, width(n.kids[0]) + width(n.kids[1]));
    };
    const place = (n, left, y) => {
      const w = width(n);
      if (n.name != null) { maxY = Math.max(maxY, y - G.drop + 12); return left + w / 2; }
      if (n.kind === "e") {
        cells.push({ id: n.id, x: left + w / 2, y });
        maxY = Math.max(maxY, y + G.eps);
        return left + w / 2;
      }
      const w0 = width(n.kids[0]), w1 = width(n.kids[1]);
      const slack = (w - w0 - w1) / 2;
      const ky = (k) => y + G.base + G.drop + (k.name != null ? 0 : reach(k));
      const x0 = place(n.kids[0], left + slack, ky(n.kids[0]));
      const x1 = place(n.kids[1], left + slack + w0, ky(n.kids[1]));
      const x = (x0 + x1) / 2;
      cells.push({ id: n.id, x, y });
      maxY = Math.max(maxY, y + G.base + 10);
      return x;
    };
    const w = width(t);
    const rx = place(t, 0, 0);
    for (const c of cells) c.x -= rx;
    return { cells, left: -rx, right: w - rx, top: -reach(t), bottom: maxY };
  }

  /** A component's cells in local coordinates; flip = 1 principal up, -1 principal down. */
  function component(eq, orient) {
    const out = { eq, cells: [], left: 0, right: 0, top: 0, bottom: 0 };
    const put = (lt, dy, flip) => {
      for (const c of lt.cells) out.cells.push({ id: c.id, x: c.x, y: dy + flip * c.y, flip });
      const ys = [dy + flip * lt.top, dy + flip * lt.bottom];
      out.left = Math.min(out.left, lt.left); out.right = Math.max(out.right, lt.right);
      out.top = Math.min(out.top, ...ys); out.bottom = Math.max(out.bottom, ...ys);
    };
    if (eq.type === "pair") {
      const [up, down] = orient === "swap" ? [eq.b, eq.a] : [eq.a, eq.b];
      put(layoutTree(up), -(G.gap / 2 + reach(up)), -1);
      put(layoutTree(down), G.gap / 2 + reach(down), 1);
    } else if (eq.type === "cycle") {
      const ids = idsOf(eq.tree);
      ids.forEach((id, i) => out.cells.push({ id, x: (i - (ids.length - 1) / 2) * 96, y: 0, flip: 1 }));
      out.left = -((ids.length - 1) / 2) * 96 - G.half - 24; out.right = -out.left;
      out.top = -G.apex - 26; out.bottom = G.base + 26;
    } else if (eq.type === "root") {
      const flip = orient === "bottom" ? -1 : 1;
      put(layoutTree(eq.tree), 0, flip);
    }
    return out;
  }

  const leavesOf = (t, acc) => {
    acc = acc || [];
    if (t.name != null) acc.push(t);
    else for (const k of t.kids) leavesOf(k, acc);
    return acc;
  };
  const idsOf = (t, acc) => {
    acc = acc || [];
    if (t.name == null) { acc.push(t.id); for (const k of t.kids) idsOf(k, acc); }
    return acc;
  };

  /** Port position and outward direction (+1 down, -1 up) of a placed cell. */
  function portAt(c, slot) {
    const f = c.flip == null ? 1 : c.flip;
    const s = c.scale == null ? 1 : c.scale;
    const up = f >= 0 ? -1 : 1;
    if (c.kind === "e") return { x: c.x, y: c.y - f * G.eps * s, dx: 0, dy: up };
    if (slot === 0) return { x: c.x, y: c.y - f * G.apex * s, dx: 0, dy: up };
    const sx = slot === 1 ? -1 : 1;
    return { x: c.x + sx * G.aux * s, y: c.y + f * G.base * s, dx: 0, dy: -up };
  }

  function pack(items, gap) {
    // items: { want, half } → sets .x, keeps order of `want`, no overlaps, minimal mean shift
    const xs = items.slice().sort((a, b) => a.want - b.want);
    for (let i = 0; i < xs.length; i++) {
      xs[i].x = i === 0 ? xs[i].want : Math.max(xs[i].want, xs[i - 1].x + xs[i - 1].right - xs[i].left + gap);
    }
    if (xs.length) {
      const shift = xs.reduce((s, it) => s + (it.want - it.x), 0) / xs.length;
      for (const it of xs) it.x += shift;
    }
  }

  /**
   * Places one state. `pins` maps free names to { x, side } (null on the first pass);
   * `height` fixes the distance between the top and bottom free-port rows.
   */
  function arrange(net, pins, height, prev) {
    const eqs = readback(net);
    const bands = { top: [], mid: [], bottom: [] };
    const side = (name) => (pins && pins.has(name) ? pins.get(name).side : "top");
    const topIds = new Set(), botIds = new Set();
    for (const eq of eqs) {
      if (eq.type === "root") {
        const s = side(eq.name);
        const comp = component(eq, s);
        comp.root = eq.name;
        bands[s === "bottom" ? "bottom" : "top"].push(comp);
        for (const id of idsOf(eq.tree)) (s === "bottom" ? botIds : topIds).add(id);
      }
    }
    const prevY = (id) => (prev && prev.byId.has(id) ? prev.byId.get(id).y / Math.max(1, prev.height) : null);
    const score = (t) => {
      const vals = [];
      for (const l of leavesOf(t)) {
        if (l.target[0] === ":") { if (pins && pins.has(l.target.slice(1))) vals.push(pins.get(l.target.slice(1)).side === "top" ? 0 : 1); continue; }
        const d = cellPort(l.target);
        if (topIds.has(d.id)) vals.push(0);
        else if (botIds.has(d.id)) vals.push(1);
        else if (prevY(d.id) != null) vals.push(prevY(d.id));
      }
      if (!vals.length && prevY(t.id) != null) vals.push(prevY(t.id));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    for (const eq of eqs) {
      if (eq.type === "pair") {
        const sa = score(eq.a), sb = score(eq.b);
        const orient = pins && sa != null && sb != null && sa > sb + 1e-6 ? "swap" : "keep";
        bands.mid.push(component(eq, orient));
      } else if (eq.type === "cycle") bands.mid.push(component(eq, "top"));
    }

    // ---- vertical
    const bandH = (b) => (b.length ? Math.max(...b.map((c) => c.bottom - c.top)) : 0);
    const topH = bandH(bands.top), botH = bandH(bands.bottom), midH = bandH(bands.mid);
    const hasFreeTop = !pins || [...pins.values()].some((p) => p.side === "top");
    const hasFreeBot = pins && [...pins.values()].some((p) => p.side === "bottom");
    const lead = (has) => (has ? G.freeGap : 8);
    let need = lead(hasFreeTop) + topH + (topH && midH ? G.bandGap : 0) + midH +
      (botH && (midH || topH) ? G.bandGap : 0) + botH + lead(hasFreeBot);
    if (topH && botH && !midH) need += 34;
    const H = Math.max(height || 0, need);
    const freeTop = 0, freeBot = H;
    const topY0 = freeTop + lead(hasFreeTop);
    for (const c of bands.top) c.y = topY0 - c.top;
    const botY1 = freeBot - lead(hasFreeBot);
    for (const c of bands.bottom) c.y = botY1 - c.bottom;
    const midLo = topH ? topY0 + topH + G.bandGap : topY0;
    const midHi = botH ? botY1 - botH - G.bandGap : botY1;
    for (const c of bands.mid) c.y = (midLo + midHi) / 2 - (c.top + c.bottom) / 2;

    // ---- horizontal
    let cursor = 0;
    const seq = () => { const x = cursor; cursor += 160; return x; };
    for (const c of [...bands.top, ...bands.bottom]) c.want = pins && pins.has(c.root) ? pins.get(c.root).x : seq() - c.left;
    pack(bands.top, G.compGap); pack(bands.bottom, G.compGap);
    const placed = new Map();
    for (const c of [...bands.top, ...bands.bottom]) for (const cell of c.cells) placed.set(cell.id, { x: c.x + cell.x });
    for (const c of bands.mid) {
      const xs = [];
      const trees = c.eq.type === "pair" ? [c.eq.a, c.eq.b] : [c.eq.tree];
      for (const t of trees) for (const l of leavesOf(t)) {
        if (l.target[0] === ":") { if (pins && pins.has(l.target.slice(1))) xs.push(pins.get(l.target.slice(1)).x); continue; }
        const d = cellPort(l.target);
        if (placed.has(d.id)) xs.push(placed.get(d.id).x + (d.slot === 1 ? -G.aux : d.slot === 2 ? G.aux : 0));
      }
      const root = trees[0].id;
      if (xs.length) c.want = xs.reduce((a, b) => a + b, 0) / xs.length;
      else if (prev && prev.byId.has(root)) c.want = prev.byId.get(root).x;
      else c.want = (bands.top.length || bands.bottom.length) && !pins ? cursor : seq() - c.left;
    }
    pack(bands.mid, G.compGap);

    const cells = [];
    const labels = [];
    for (const b of ["top", "mid", "bottom"]) for (const c of bands[b]) {
      for (const cell of c.cells) {
        const src = net.cells.get(cell.id);
        cells.push({ id: cell.id, kind: src.kind, show: src.show, label: src.label, tag: src.tag,
          x: c.x + cell.x, y: c.y + cell.y, flip: cell.flip });
      }
      labels.push({ eq: c.eq, x: c.x + (c.left + c.right) / 2, y: c.y + c.bottom });
    }
    const byId = new Map(cells.map((c) => [c.id, c]));

    // ---- free ports: pinned, or derived from where their wire ends (first pass)
    const free = [];
    for (const name of net.free) {
      if (pins && pins.has(name)) {
        const p = pins.get(name);
        free.push({ name, x: p.x, y: p.side === "top" ? freeTop : freeBot, side: p.side });
        continue;
      }
      const q = net.wires.get(`:${name}`);
      const d = cellPort(q);
      if (d) {
        const pt = portAt(byId.get(d.id), d.slot);
        free.push({ name, x: pt.x, y: pt.dy < 0 ? freeTop : freeBot, side: pt.dy < 0 ? "top" : "bottom" });
      } else {
        free.push({ name, x: cursor, y: freeTop, side: "top" });
        cursor += 60;
      }
    }

    const wires = [];
    const first = activePairs(net)[0];
    for (const [p, q] of net.wires) {
      if (p > q) continue;
      const a = cellPort(p), b = cellPort(q);
      const act = a && b && a.slot === 0 && b.slot === 0;
      const next = act && first && ((first[0] === a.id && first[1] === b.id) || (first[0] === b.id && first[1] === a.id));
      wires.push({ p, q, cls: next ? "next" : act ? "act" : "" });
    }
    const activeIds = new Set(activePairs(net).flat());
    for (const c of cells) c.active = activeIds.has(c.id);
    return { cells, byId, free, wires, labels, height: H, need, eqs };
  }

  function spreadPins(free, gap) {
    const pins = new Map();
    for (const s of ["top", "bottom"]) {
      const half = (f) => Math.max(gap / 2, f.name.length * 3.1 + 5);
      const row = free.filter((f) => f.side === s).map((f) => ({ name: f.name, want: f.x, left: -half(f), right: half(f) }));
      pack(row, 0);
      for (const r of row) pins.set(r.name, { x: r.x, side: s });
    }
    return pins;
  }

  /**
   * Lays out every state of a reduction on one shared canvas: free ports stay pinned,
   * every frame has the same size, and cell ids are stable from frame to frame.
   */
  function frames(src, opts) {
    opts = opts || {};
    const { states, events } = reduce(src, opts.limit);
    const first = arrange(states[0], null, 0, null);
    const pins = spreadPins(first.free, opts.minFree || G.minFree);
    let prev = null;
    let height = 0;
    const pass1 = states.map((s) => { const f = arrange(s, pins, 0, prev); prev = f; return f; });
    height = Math.max(...pass1.map((f) => f.need), opts.minHeight || 0);
    prev = null;
    const out = states.map((s, i) => {
      const f = arrange(s, pins, height, prev);
      prev = f;
      f.notation = notation(s);
      f.counts = { cells: s.cells.size, free: s.free.length, active: activePairs(s).length };
      f.event = i > 0 ? events[i - 1] : null;
      return f;
    });
    // one horizontal extent for all frames
    let lo = Infinity, hi = -Infinity;
    for (const f of out) {
      for (const c of f.cells) { lo = Math.min(lo, c.x - G.half - 4); hi = Math.max(hi, c.x + G.half + (c.tag ? 18 : 4)); }
      for (const p of f.free) { lo = Math.min(lo, p.x - 14); hi = Math.max(hi, p.x + 14); }
      for (const w of f.wires) for (const k of [w.p, w.q]) {
        const d = cellPort(k);
        if (d && d.slot > 0) { const c = f.cells.find((x) => x.id === d.id); if (c) { lo = Math.min(lo, c.x - G.half - 30); hi = Math.max(hi, c.x + G.half + 30); } }
      }
    }
    if (!isFinite(lo)) { lo = -150; hi = 150; }
    const minW = opts.minWidth || 150;
    if (hi - lo < minW) { const m = (lo + hi) / 2; lo = m - minW / 2; hi = m + minW / 2; }
    const dx = G.margin - lo, dy = G.margin + 10;
    for (const f of out) {
      for (const c of f.cells) { c.x += dx; c.y += dy; }
      for (const p of f.free) { p.x += dx; p.y += dy; }
      for (const l of f.labels) { l.x += dx; l.y += dy; }
    }
    const W = hi - lo + 2 * G.margin;
    const H = height + 2 * G.margin + 22;
    for (const f of out) { f.width = W; f.height = H; }
    // geometry per wire, and the old wires each one continues (for the morph)
    out.forEach((f, i) => {
      f.byId = new Map(f.cells.map((c) => [c.id, c]));
      f.freeBy = new Map(f.free.map((p) => [p.name, p]));
      const xs2 = f.cells.map((c) => c.x);
      f.geo = { lo: Math.min(...xs2), hi: Math.max(...xs2) };
      f.geo.mid = (f.geo.lo + f.geo.hi) / 2;
      const lanes = { l: 0, r: 0 };
      for (const w of f.wires) {
        w.pts = wirePoints(f, w, lanes);
      }
      f.pathByKey = new Map(f.wires.map((w) => [w.p + "|" + w.q, w.pts]));
      f.cont = i === 0 ? null : f.wires.map((w) => {
        const ch = events[i - 1].chains?.get(w.p + "|" + w.q);
        return ch ? { keys: ch.keys, flip: ch.from !== w.p } : null;
      });
    });
    return { frames: out, events, width: W, height: H };
  }


  /** Endpoint of a port key in a placed frame. */
  function endOf(f, key) {
    if (key[0] === ":") {
      const p = f.freeBy.get(key.slice(1));
      return p ? { x: p.x, y: p.y + (p.side === "top" ? 3 : -3), dy: p.side === "top" ? 1 : -1 } : null;
    }
    const d = cellPort(key);
    const c = f.byId.get(d.id);
    return c ? portAt(c, d.slot) : null;
  }

  /** The drawn route of one wire of a frame, as points. */
  function wirePoints(f, w, lanes) {
    const a = endOf(f, w.p), b = endOf(f, w.q);
    if (!a || !b) return [a || b || { x: 0, y: 0 }, b || a || { x: 0, y: 0 }];
    if (w.cls) return [a, b];
    const right = (a.x + b.x) / 2 >= f.geo.mid;
    const away = a.dy !== b.dy && ((a.y <= b.y ? a : b).dy < 0);
    const k = away ? lanes[right ? "r" : "l"]++ : 0;
    const lane = right ? Math.max(a.x, b.x, f.geo.hi) + G.half + 12 + 10 * k : Math.min(a.x, b.x, f.geo.lo) - G.half - 12 - 10 * k;
    return routePoints(a, b, lane);
  }

  /* =============================================================== render */
  const escapeXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const n1 = (v) => (Math.round(v * 10) / 10).toString();

  /** Agent: a triangle with its tip on the principal port, or a circle for ε. */
  function cellSVG(c, extra) {
    const f = c.flip == null ? 1 : c.flip;
    const s = c.scale == null ? 1 : c.scale;
    const op = c.opacity == null ? 1 : c.opacity;
    const cls = `cell k-${c.kind}${c.show === "λ" ? " k-lam" : c.show === "@" ? " k-app" : ""}${c.active ? " active" : ""}${extra || ""}`;
    const tag = (dx) => (c.tag ? `<text class="tag" x="${n1(c.x + dx)}" y="${n1(c.y + 3)}">${escapeXml(c.tag)}</text>` : "");
    if (c.kind === "e") {
      return `<g class="${cls}" opacity="${n1(op)}"><circle class="body" cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n1(G.eps * s)}"/>` +
        `<text x="${n1(c.x)}" y="${n1(c.y + 0.5)}" font-size="${n1(9 * s)}">ε</text>${tag(G.eps + 4)}</g>`;
    }
    const pt = (lx, ly) => `${n1(c.x + lx * s)},${n1(c.y + f * ly * s)}`;
    const poly = `<polygon class="body" points="${pt(0, -G.apex)} ${pt(-G.half, G.base)} ${pt(G.half, G.base)}"/>`;
    const cy = c.y + f * (G.base / 3) * s;
    const label = c.kind === "d" && c.label ? `${c.show}<tspan class="sub" dy="2.5">${escapeXml(c.label)}</tspan>` : escapeXml(c.show);
    return `<g class="${cls}" opacity="${n1(op)}">${poly}<text x="${n1(c.x)}" y="${n1(cy)}" font-size="${n1(11 * s)}">${label}</text>${tag(G.half + 3)}</g>`;
  }

  /** A polyline with rounded corners (radius r, never more than half a segment). */
  function rounded(pts, r) {
    let d = `M${n1(pts[0].x)},${n1(pts[0].y)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1];
      const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
      const k = Math.min(r, l1 / 2, l2 / 2);
      if (k < 0.5) { d += ` L${n1(b.x)},${n1(b.y)}`; continue; }
      const p = { x: b.x + ((a.x - b.x) / l1) * k, y: b.y + ((a.y - b.y) / l1) * k };
      const q = { x: b.x + ((c.x - b.x) / l2) * k, y: b.y + ((c.y - b.y) / l2) * k };
      d += ` L${n1(p.x)},${n1(p.y)} Q${n1(b.x)},${n1(b.y)} ${n1(q.x)},${n1(q.y)}`;
    }
    const z = pts[pts.length - 1];
    return d + ` L${n1(z.x)},${n1(z.y)}`;
  }

  /**
   * Lafont-style route between two port ends ({x, y, dy: -1 up | +1 down}):
   * facing ports get an S-curve (two crossing make the X), ports that point the same
   * way get a cup ∪ or a cap ∩, ports that point away from each other go round a side lane.
   */
  /** The route between two port ends, as points (the drawing rounds the corners). */
  function routePoints(a, b, lane) {
    if (Math.abs(a.x - b.x) < 0.6 && a.dy !== b.dy && (b.y - a.y) * a.dy > 0) return [a, b];
    if (a.dy !== b.dy) {
      const [u, v] = a.y <= b.y ? [a, b] : [b, a];
      if (u.dy > 0 && v.dy < 0) {
        // facing ports: a smooth S
        const m = (u.y + v.y) / 2;
        const out = [];
        for (let i = 0; i <= 16; i++) {
          const t = i / 16;
          const y = (1 - t) * (1 - t) * (1 - t) * u.y + 3 * (1 - t) * (1 - t) * t * m + 3 * (1 - t) * t * t * m + t * t * t * v.y;
          const x = (1 - t) * (1 - t) * (1 - t) * u.x + 3 * (1 - t) * (1 - t) * t * u.x + 3 * (1 - t) * t * t * v.x + t * t * t * v.x;
          out.push({ x, y });
        }
        return out;
      }
      const out = 12;
      const ua = { x: u.x, y: u.y - out }, vb = { x: v.x, y: v.y + out };
      return [u, ua, { x: lane, y: ua.y }, { x: lane, y: vb.y }, vb, v];
    }
    const depth = 14 + Math.min(26, Math.abs(a.x - b.x) * 0.12);
    const y = a.dy > 0 ? Math.max(a.y, b.y) + depth : Math.min(a.y, b.y) - depth;
    return [a, { x: a.x, y }, { x: b.x, y }, b];
  }

  const pathD = (pts) => (pts.length === 2 ? `M${n1(pts[0].x)},${n1(pts[0].y)} L${n1(pts[1].x)},${n1(pts[1].y)}` : rounded(pts, G.radius));

  /** Resamples a polyline to n points evenly spaced by arc length. */
  function resample(pts, n) {
    if (!pts.length) return [];
    if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }));
    const seg = [0];
    for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = seg[seg.length - 1];
    if (total < 1e-6) return Array.from({ length: n }, () => ({ ...pts[0] }));
    const out = [];
    let j = 0;
    for (let i = 0; i < n; i++) {
      const want = (total * i) / (n - 1);
      while (j < seg.length - 2 && seg[j + 1] < want) j++;
      const t = (want - seg[j]) / Math.max(1e-6, seg[j + 1] - seg[j]);
      out.push({ x: pts[j].x + (pts[j + 1].x - pts[j].x) * t, y: pts[j].y + (pts[j + 1].y - pts[j].y) * t });
    }
    return out;
  }

  function freeSVG(p) {
    const ly = p.side === "top" ? p.y - 7 : p.y + 13;
    return `<g class="free"><circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="3"/><text x="${n1(p.x)}" y="${n1(ly)}">${escapeXml(p.name)}</text></g>`;
  }

  /**
   * Draws a scene: { width, height, cells, free, wires (port keys), ghosts?, caption? }.
   * Cells may carry scale / opacity / fractional flip (the player interpolates them).
   */
  function renderScene(sc, opts) {
    opts = opts || {};
    const byId = new Map(sc.cells.map((c) => [c.id, c]));
    const freeBy = new Map(sc.free.map((p) => [p.name, p]));
    const end = (key) => {
      if (key[0] === ":") {
        const p = freeBy.get(key.slice(1));
        return p ? { x: p.x, y: p.y + (p.side === "top" ? 3 : -3), dy: p.side === "top" ? 1 : -1 } : null;
      }
      const d = cellPort(key);
      const c = byId.get(d.id);
      return c ? portAt(c, d.slot) : null;
    };
    const xs = sc.cells.map((c) => c.x);
    const lo = xs.length ? Math.min(...xs) : sc.width / 2, hi = xs.length ? Math.max(...xs) : sc.width / 2;
    const mid = (lo + hi) / 2;
    const parts = [];
    const lanes = { l: 0, r: 0 };
    for (const w of sc.wires) {
      let d;
      if (w.pts) d = pathD(w.pts);
      else {
        const a = end(w.p), b = end(w.q);
        if (!a || !b) continue;
        const right = (a.x + b.x) / 2 >= mid;
        const away = a.dy !== b.dy && ((a.y <= b.y ? a : b).dy < 0);
        const k = away ? lanes[right ? "r" : "l"]++ : 0;
        const lane = right ? Math.max(a.x, b.x, hi) + G.half + 12 + 10 * k : Math.min(a.x, b.x, lo) - G.half - 12 - 10 * k;
        // an active pair is two tips joined head to head: always a straight segment
        d = w.cls ? `M${n1(a.x)},${n1(a.y)} L${n1(b.x)},${n1(b.y)}` : pathD(routePoints(a, b, lane));
      }
      // a paper-coloured halo under each wire makes crossings read as bridges
      const op = w.fade == null || w.fade >= 0.999 ? "" : ` opacity="${n1(Math.max(0, w.fade))}"`;
      const bandOp = w.fade == null || w.fade >= 0.999 ? "" : ` opacity="${n1(Math.max(0, w.fade))}"`;
      parts.push(`<path class="halo" d="${d}"${op}/>`);
      if (w.cls) parts.push(`<path class="band ${w.cls}" d="${d}"${bandOp}/>`);
      parts.push(`<path class="wire" d="${d}"${op}/>`);
    }
    for (const g of sc.ghosts || []) parts.push(cellSVG(g, " ghost"));
    for (const c of sc.cells) parts.push(cellSVG(c));
    for (const p of sc.free) parts.push(freeSVG(p));
    for (const l of opts.under || []) parts.push(`<text class="under" x="${n1(l.x)}" y="${n1(l.y)}">${escapeXml(l.text)}</text>`);
    if (!sc.cells.length && !(sc.ghosts || []).length && !sc.wires.length) {
      parts.push(`<text class="empty" x="${n1(sc.width / 2)}" y="${n1(sc.height / 2)}">∅ · the empty net</text>`);
    }
    if (sc.caption) parts.push(`<text class="stage-cap" x="8" y="${n1(sc.height - 6)}">${escapeXml(sc.caption)}</text>`);
    const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : "";
    const cap = opts.fluid ? "" : ` style="max-width:${Math.round(sc.width * 1.75)}px"`;
    return `<svg class="inet-svg" viewBox="0 0 ${n1(sc.width)} ${n1(sc.height)}"${cap} role="img" xmlns="http://www.w3.org/2000/svg">${title}${parts.join("")}</svg>`;
  }

  /* ========================================================== block specs */
  /** Parses the body of an ```inet fence into a spec. */
  function spec(body) {
    const s = { net: [], show: "net", title: "", caption: "", terms: [], under: [], animate: false, expect: null, limit: null };
    for (const raw of body.split("\n")) {
      const line = raw.replace(/\s+#\s.*$/, "").trim();
      if (!line) continue;
      const m = /^([a-z]+)\s*:\s*(.*)$/.exec(line);
      if (line === "animate") { s.animate = true; continue; }
      if (!m) { s.net.push(line); continue; }
      const [, k, v] = m;
      if (k === "net") s.net.push(v);
      else if (k === "show") s.show = v;
      else if (k === "title") s.title = v;
      else if (k === "caption") s.caption = v;
      else if (k === "term") s.terms = v.split("|").map((x) => x.trim());
      else if (k === "under") s.under = v.split("|").map((x) => x.trim());
      else if (k === "animate") s.animate = v !== "no";
      else if (k === "expect") s.expect = Number(v);
      else if (k === "steps") s.limit = Number(v);
      else throw new Error(`inet: unknown key "${k}"`);
    }
    s.src = s.net.join("; ");
    return s;
  }



  /* ================================================= archive box diagrams */
  // The compendium reproduces documents that draw nets as labelled boxes joined by
  // vertical wires: ┌─┴─┐ │ DUP L │ └──┬──┘. Those pictures are vectorised as they
  // stand — same geometry, clean lines, netties' wire and label treatment — so the
  // archive keeps its exact shape instead of being redrawn in a different notation.

  const GRID_CHARS = /^[┌┐└┘─│┬┴ ]*$/;

  /**
   * Parses a box-diagram fence. Returns null for anything that is not one (tables,
   * proof trees, term output), so the caller can leave that fence alone.
   */
  function boxNetFigure(src) {
    const rows = src.replace(/\t/g, "  ").split("\n").map((r) => r.replace(/\s+$/, ""));
    const at = (r, c) => (rows[r] && rows[r][c]) || " ";
    const boxes = [];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (at(r, c) !== "┌") continue;
        let c2 = c + 1;
        while (c2 < rows[r].length && at(r, c2) !== "┐") {
          if (!/[─┬┴]/.test(at(r, c2))) { c2 = -1; break; }
          c2++;
        }
        if (c2 < 0) continue;
        let r2 = r + 1;
        while (r2 < rows.length && at(r2, c) !== "└") {
          if (!/^ *│/.test(rows[r2].slice(c) || "") && at(r2, c) !== "│") { r2 = -1; break; }
          r2++;
        }
        if (r2 < 0 || at(r2, c2) !== "┘") continue;
        const label = rows.slice(r + 1, r2)
          .map((row) => row.slice(c + 1, c2).replace(/│/g, "").trim())
          .join(" ").replace(/\s+/g, " ").trim();
        const top = [], bottom = [];
        for (let k = c; k <= c2; k++) {
          if (at(r, k) === "┴") top.push(k);
          if (at(r2, k) === "┬") bottom.push(k);
          if (at(r, k) === "│" || at(r2, k) === "│") return null; // a wire crossing an edge: not this dialect
        }
        boxes.push({ r, r2, c, c2, label, top, bottom });
      }
    }
    if (!boxes.length) return null;
    // a net diagram has ports; nested value boxes (effect pictures) have none, and are left as ASCII
    if (!boxes.some((b) => b.top.length || b.bottom.length)) return null;
    // only box drawings: no tree/table glyphs, no nesting
    for (let r = 0; r < rows.length; r++) {
      if (boxes.some((b) => r >= b.r && r <= b.r2)) continue;
      if (!GRID_CHARS.test(rows[r].replace(/[^\x00-\x7f]/g, (ch) => (/[┌┐└┘─│┬┴]/.test(ch) ? ch : "")).replace(/[^┌┐└┘─│┬┴ ]/g, " "))) return null;
      if (/[├┤┬]/.test(rows[r].replace(/[┌┐└┘]/g, "")) && /[┌┐└┘─]/.test(rows[r])) return null;
    }
    const names = new Set();
    const tokenAt = (r, c) => {
      const row = rows[r] || "";
      let a = c, b = c;
      while (a > 0 && /[^\s─│┌┐└┘]/.test(row[a - 1])) a--;
      while (b + 1 < row.length && /[^\s─│┌┐└┘]/.test(row[b + 1])) b++;
      const t = row.slice(a, b + 1);
      return /^[\x21-\x7e]+$/.test(t) ? { text: t, a, b } : null;
    };
    // walk from every port; a wire meets either another port or a printed name
    const ends = [];
    const wires = [];
    const seen = new Set();
    const walk = (port, dir) => {
      let r = port.r + dir, c = port.c;
      while (r >= 0 && r < rows.length) {
        const ch = at(r, c);
        if (ch === "│") { r += dir; continue; }
        // moving up you reach the bottom edge of the box above; moving down, its top edge
        const other = boxes.find((b) => b !== port.box && ((dir < 0 && b.r2 === r) || (dir > 0 && b.r === r)));
        if (other && (dir < 0 ? other.bottom : other.top).includes(c)) return { box: other, r, c };
        const tok = tokenAt(r, c);
        if (tok) { names.add(tok.text); return { name: tok.text, r, c: tok.a + (tok.b - tok.a) / 2 }; }
        return null;
      }
      return null;
    };
    for (const b of boxes) {
      for (const [list, dir] of [[b.top, -1], [b.bottom, 1]]) {
        for (const c of list) {
          const from = { box: b, r: dir < 0 ? b.r : b.r2, c };
          const to = walk({ box: b, r: from.r, c }, dir);
          if (!to) return null;
          const key = `${from.r},${c}|${to.r},${to.c}`;
          ends.push({ from, to });
          if (!seen.has(key)) { wires.push({ from, to }); seen.add(key); }
          seen.add(`${to.r},${to.c}|${from.r},${c}`);
        }
      }
    }
    return { rows, boxes, wires, names: [...names] };
  }

  /** Vector form of a box net, at the diagram's own coordinates. */
  function boxNetSVG(g, opts) {
    opts = opts || {};
    // cw is the mono advance at the .note font size, so a printed line stays on the grid
    const cw = opts.cw || 6.45, ch = opts.ch || 17;
    const W = Math.max(...g.rows.map((r) => r.length)) * cw + 2;
    const H = g.rows.length * ch + 2;
    const parts = [];
    const inBox = (r) => g.boxes.find((b) => r >= b.r && r <= b.r2);
    // wires first, so boxes sit on top
    for (const w of g.wires) {
      const x1 = w.from.c * cw + cw / 2, y1 = w.from.r * ch + ch / 2;
      const x2 = w.to.c * cw + cw / 2;
      // a printed name sits in the wire's own cell: stop the wire short of it and dot the tip
      const y2 = w.to.name == null ? w.to.r * ch + ch / 2 : w.to.r * ch + ch / 2 + (w.to.r < w.from.r ? 0.46 : -0.46) * ch;
      const d = `M${n1(x1)},${n1(y1)} L${n1(x2)},${n1(y2)}`;
      parts.push(`<path class="halo" d="${d}"/><path class="wire" d="${d}"/>`);
      if (w.to.name != null) parts.push(`<circle class="free" cx="${n1(x2)}" cy="${n1(y2)}" r="2.6"/>`);
    }
    for (const b of g.boxes) {
      const x = b.c * cw + cw / 2, y = b.r * ch + ch / 2;
      const w2 = (b.c2 - b.c) * cw, h2 = (b.r2 - b.r) * ch;
      // an agent box is the archive's DUP/SUP/CON/… drawn black, like netties' constructor
      const m = /^([A-Z][A-Z0-9]*)(?:\s+(.*))?$/.exec(b.label);
      parts.push(`<rect class="box ${m ? "agent" : "value"}" x="${n1(x)}" y="${n1(y)}" width="${n1(w2)}" height="${n1(h2)}" rx="2.5"/>`);
      if (b.label) {
        const cx = x + w2 / 2, cy = y + h2 / 2;
        const text = m && m[2] ? `${m[1]}<tspan class="lbl" dx="5">${escapeXml(m[2])}</tspan>` : escapeXml(b.label);
        parts.push(`<text class="${m ? "agent-label" : "value-label"}" x="${n1(cx)}" y="${n1(cy)}">${text}</text>`);
      }
    }
    // printed text: names, captions and the diagram's own annotations
    g.rows.forEach((row, r) => {
      if (inBox(r)) return;
      const re = /\S+/g;
      let m;
      while ((m = re.exec(row))) {
        const tok = m[0];
        if (/^[┌┐└┘─│┬┴]+$/.test(tok)) continue;
        const clean = tok.replace(/[┌┐└┘─│┬┴]/g, "");
        if (!clean) continue;
        const x = m.index * cw + cw / 2;
        const isName = g.wires.some((w) => w.to.r === r && Math.abs(w.to.c * cw + cw / 2 - x) < cw * 1.2);
        parts.push(`<text class="${isName ? "free-name" : "note"}" x="${n1(isName ? x : m.index * cw + 1)}" y="${n1(r * ch + ch / 2)}"${isName ? ' text-anchor="middle"' : ""}>${escapeXml(clean)}</text>`);
      }
    });
    const cap = opts.fluid ? "" : ` style="max-width:${Math.round(W * 1.6)}px"`;
    return `<svg class="inet-svg inet-grid-svg" viewBox="0 0 ${n1(W)} ${n1(H)}"${cap} role="img" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
  }


  /* ---- every other diagram in the archive: glyph connectivity as clean lines ---- */
  const CONN = { "│": "ud", "─": "lr", "┌": "dr", "┐": "dl", "└": "ur", "┘": "ul",
    "├": "udr", "┤": "udl", "┬": "dlr", "┴": "ulr", "┼": "udlr" };
  const ARROW = { "▶": [1, 0], "◀": [-1, 0], "▼": [0, 1], "▲": [0, -1] };

  /**
   * Parses a diagram whose lines are box-drawing glyphs: corners and tees for boxes and
   * trees, arrows for flows. Returns null for plain text, tables of `|`, and term output.
   */
  function connFigure(src) {
    const rows = src.split("\n").map((r) => r.replace(/\s+$/, ""));
    const at = (r, c) => (rows[r] && rows[r][c]) || " ";
    let corner = false, arrow = false, drawn = 0;
    for (const row of rows) {
      let any = false;
      for (const ch of row) {
        if (CONN[ch]) any = true;
        if ("┌┐└┘├┤┬┴┼".includes(ch)) corner = true;
        if (ARROW[ch]) arrow = true;
      }
      if (any) drawn++;
    }
    if (drawn < 2 || !(corner || arrow)) return null;
    const hs = [], vs = [];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < (rows[r] || "").length; c++) {
        const k = CONN[at(r, c)] || "";
        if (k.includes("r") && (CONN[at(r, c + 1)] || "").includes("l")) hs.push([r, c, c + 1]);
        if (k.includes("d") && (CONN[at(r + 1, c)] || "").includes("u")) vs.push([c, r, r + 1]);
      }
    }
    const merge = (list, key) => {
      const out = [];
      for (const seg of list.sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
        const last = out[out.length - 1];
        if (last && last[0] === seg[0] && last[2] === seg[1]) last[2] = seg[2];
        else out.push([...seg]);
      }
      return out;
    };
    return {
      rows,
      h: merge(hs, 0),
      v: merge(vs, 1),
      width: Math.max(...rows.map((r) => r.length), 1),
      height: rows.length,
    };
  }

  /** Lines from a connector diagram, with its text kept at its own grid position. */
  function connSVG(g, opts) {
    opts = opts || {};
    const cw = opts.cw || 6.02, ch = opts.ch || 15;
    const W = g.width * cw + 4, H = g.height * ch + 4;
    const x = (c) => c * cw + cw / 2 + 2, y = (r) => r * ch + ch / 2 + 2;
    const parts = [];
    const line = (d) => parts.push(`<path class="halo" d="${d}"/><path class="wire" d="${d}"/>`);
    for (const [r, c0, c1] of g.h) line(`M${n1(x(c0))},${n1(y(r))} L${n1(x(c1))},${n1(y(r))}`);
    for (const [c, r0, r1] of g.v) line(`M${n1(x(c))},${n1(y(r0))} L${n1(x(c))},${n1(y(r1))}`);
    g.rows.forEach((row, r) => {
      // text runs: everything that is not a line glyph or an arrow
      let c = 0;
      while (c < row.length) {
        const ar = ARROW[row[c]];
        if (ar) {
          const t = 4.6;
          const cx = x(c), cy = y(r);
          parts.push(`<polygon class="head" points="${n1(cx + ar[0] * t)},${n1(cy + ar[1] * t)} ${n1(cx - ar[0] * t - ar[1] * 3.4)},${n1(cy - ar[1] * t + ar[0] * 3.4)} ${n1(cx - ar[0] * t + ar[1] * 3.4)},${n1(cy - ar[1] * t - ar[0] * 3.4)}"/>`);
          c++;
          continue;
        }
        if (CONN[row[c]]) { c++; continue; }
        let e = c;
        while (e < row.length && !CONN[row[e]] && !ARROW[row[e]]) e++;
        const text = row.slice(c, e);
        if (text.trim()) {
          const lead = text.length - text.replace(/^\s+/, "").length;
          parts.push(`<text class="dtext" x="${n1(x(c + lead) - cw * 0.35)}" y="${n1(y(r))}">${escapeXml(text.trim())}</text>`);
        }
        c = e;
      }
    });
    const cap = opts.fluid ? "" : ` style="max-width:${Math.round(W * 1.9)}px"`;
    return `<svg class="inet-svg inet-grid-svg" viewBox="0 0 ${n1(W)} ${n1(H)}"${cap} role="img" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
  }

  /** Picks the right renderer for an archived diagram; null when the fence is not one. */
  function gridBody(code) {
    const net = boxNetFigure(code);
    if (net) return boxNetSVG(net);
    const g = connFigure(code);
    return g ? connSVG(g) : null;
  }

  /** Figure HTML for an archived diagram, or null when the fence is not one. */
  function gridHTML(code) {
    let svg;
    try { svg = gridBody(code); } catch (e) { return null; }
    if (!svg) return null;
    const esc = escapeXml(code);
    return `<figure class="inet inet-static inet-arch"><div class="inet-row"><div class="pane">${svg}</div></div>` +
      `<details class="src"><summary>ASCII source, as archived</summary><pre class="ascii"><code>${esc}</code></pre></details></figure>`;
  }

  /* ============================================================ figures */
  const LEGEND_CAP = '<span class="key">γ</span> constructor · <span class="key">δ</span> duplicator · ' +
    '<span class="key">ε</span> eraser · ' +
    '<span class="key">○</span> free port · <span class="key">amber band</span> = active pair';

  function notationHTML(f, term) {
    const eqs = f.notation.map((e) => `<span class="eq${e.next ? " next" : ""}">${escapeXml(e.text)}</span>`).join("");
    return `<div class="inet-notation">${term ? `<span class="term">${escapeXml(term)}</span>` : ""}${eqs}</div>`;
  }

  /** A labelled catalogue of cells (the legend and §3.1). */
  function catalogueSVG(which) {
    const items = which === "legend"
      ? [["g", "γ", "", "γ · constructor"], ["d", "δ", "", "δ · duplicator"], ["d", "δ", "A", "δA · labelled duplicator"], ["e", "ε", "", "ε · eraser"]]
      : [["g", "γ", "", "constructor · 2 aux ports"], ["d", "δ", "", "duplicator · 2 aux ports"], ["e", "ε", "", "eraser · 0 aux ports"]];
    const colW = 112, cy = 44, parts = [];
    const stub = (pt, len) => `<path class="wire" d="M${n1(pt.x)},${n1(pt.y)} L${n1(pt.x)},${n1(pt.y + pt.dy * len)}"/>`;
    items.forEach(([kind, show, label, text], i) => {
      const x = 56 + i * colW;
      const c = { id: i, kind, show, label, x, y: cy, flip: 1 };
      const pp = portAt(c, 0);
      parts.push(stub(pp, 12), cellSVG(c),
        `<text class="port-name" x="${n1(pp.x + 5)}" y="${n1(pp.y - 6)}">principal</text>`);
      if (kind !== "e") {
        for (const sl of [1, 2]) {
          const ap = portAt(c, sl);
          parts.push(stub(ap, 12), `<text class="port-name" x="${n1(ap.x + (sl === 1 ? -3 : 3))}" y="${n1(ap.y + 21)}" text-anchor="${sl === 1 ? "end" : "start"}">aux${sl === 1 ? "₁" : "₂"}</text>`);
        }
      }
      parts.push(`<text class="under" x="${n1(x)}" y="${n1(cy + 50)}">${escapeXml(text)}</text>`);
    });
    let width = 12 + items.length * colW;
    if (which === "legend") {
      const x = width + 20;
      const a = { id: 90, kind: "g", show: "γ", label: "", x, y: cy - 21, flip: -1 };
      const b = { id: 91, kind: "d", show: "δ", label: "", x, y: cy + 21, flip: 1 };
      const pa = portAt(a, 0), pb = portAt(b, 0);
      const d = `M${n1(pa.x)},${n1(pa.y)} L${n1(pb.x)},${n1(pb.y)}`;
      parts.push(`<path class="band next" d="${d}"/>`, `<path class="wire" d="${d}"/>`, cellSVG(a), cellSVG(b));
      parts.push(`<text class="under" x="${n1(x)}" y="${n1(cy + 50)}">active pair</text>`);
      const fx = x + 78;
      const w = `M${fx},${cy - 25} C${fx},${cy} ${fx + 22},${cy} ${fx + 22},${cy + 25}`;
      parts.push(`<path class="halo" d="${w}"/><path class="wire" d="${w}"/>`, freeSVG({ name: "x", x: fx, y: cy - 28, side: "top" }),
        `<text class="under" x="${fx + 11}" y="${cy + 50}">wire · free port x</text>`);
      width = fx + 66;
    }
    const H = 104;
    return `<svg class="inet-svg" viewBox="0 0 ${width} ${H}" style="max-width:${Math.round(width * 1.9)}px" role="img" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
  }

  /** Static figure for an ```inet block (screen and print; no script needed). */
  function staticFigure(sp) {
    const head = (title) => `<div class="widget-head"><span class="widget-kicker">INTERACTION NET</span><span class="inet-title">${escapeXml(title)}</span></div>`;
    const cap = `<figcaption>${sp.caption ? escapeXml(sp.caption) + " · " : ""}${LEGEND_CAP}</figcaption>`;
    if (sp.show === "legend" || sp.show === "cells") {
      return `<figure class="inet inet-static">${head(sp.title || (sp.show === "legend" ? "Legend" : "The three cells"))}<div class="inet-row"><div class="pane">${catalogueSVG(sp.show)}</div></div>${sp.caption ? `<figcaption>${escapeXml(sp.caption)}</figcaption>` : ""}</figure>`;
    }
    const F = frames(sp.src, { limit: sp.show === "net" ? 0 : sp.limit, minFree: sp.show === "net" ? 40 : G.minFree });
    if (sp.expect != null && F.events.length !== sp.expect) {
      throw new Error(`inet: "${sp.src}" reduces in ${F.events.length} interactions, the text says ${sp.expect}`);
    }
    const fs = F.frames;
    const term = (i) => sp.terms[Math.min(i, sp.terms.length - 1)] || "";
    const svg = (f, under) => renderScene(f, { under });
    if (sp.show === "net") {
      const low = Math.max(...fs[0].free.map((p) => p.y + 14), ...fs[0].labels.map((l) => l.y));
      const under = sp.under.length ? fs[0].labels.map((l, i) => ({ x: l.x, y: low + 14, text: sp.under[i] || "" })) : [];
      if (under.length) fs[0].height = Math.max(fs[0].height, low + 22);
      return `<figure class="inet inet-static">${head(sp.title || "A net")}<div class="inet-row"><div class="pane">${svg(fs[0], under)}</div></div>${notationHTML(fs[0], term(0))}${cap}</figure>`;
    }
    if (sp.show === "rule") {
      const last = fs[fs.length - 1];
      const rule = F.events.length ? F.events[0].rule : null;
      const title = sp.title || (rule ? rule.name : "normal form");
      const arrow = `<div class="arrow"><b>⟶</b>${rule ? escapeXml(rule.short) : ""}</div>`;
      const nt = `<div class="inet-notation"><span class="eq">${fs[0].notation.map((e) => escapeXml(e.text)).join(" ; ")}` +
        `<span class="arrow">⟶</span>${last.notation.map((e) => escapeXml(e.text)).join(" ; ")}</span>` +
        `<span class="eq counts">cells ${fs[0].counts.cells} → ${last.counts.cells} · free ports ${fs[0].counts.free} → ${last.counts.free}</span></div>`;
      return `<figure class="inet inet-static">${head(title)}<div class="inet-row"><div class="pane">${svg(fs[0])}</div>${arrow}<div class="pane">${svg(last)}</div></div>${nt}${cap}</figure>`;
    }
    const panes = fs.map((f, i) => {
      const label = i === 0 ? "step 0 · start" : `step ${i} · ${f.event.rule.name}`;
      const tail = i === fs.length - 1 && F.events.length && !activePairs(reduce(sp.src, i).states[i]).length ? " · normal form" : "";
      return `<div class="pane"><div class="pane-cap">${escapeXml(label + tail)}</div>${svg(f)}${notationHTML(f, term(i))}</div>`;
    }).join("");
    const cols = Math.min(fs.length, 4);
    return `<figure class="inet inet-static">${head(sp.title || "Reduction")}<div class="inet-grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${panes}</div>` +
      `<div class="inet-notation"><span class="eq counts">${F.events.length} interaction${F.events.length === 1 ? "" : "s"} · free ports ${fs[0].free.map((p) => p.name).join(", ") || "none"} unchanged at every step</span></div>${cap}</figure>`;
  }

  /** Markup for the animated player; book.js mounts it from data-inet. */
  function playerFigure(sp) {
    const attr = (v) => escapeXml(v).replace(/\n/g, "&#10;");
    return `<figure class="inet inet-player widget" data-inet="${attr(sp.src)}" data-terms="${attr(sp.terms.join("|"))}" data-limit="${sp.limit == null ? "" : sp.limit}">` +
      `<div class="widget-head"><span class="widget-kicker">ANIMATED</span><span class="inet-title">${escapeXml(sp.title || "Reduction")}</span><span class="rule-now"></span></div>` +
      `<div class="inet-stage" tabindex="0" aria-label="animated interaction net; arrow keys step"></div>` +
      `<div class="inet-notation"></div>` +
      `<div class="widget-controls" data-controls></div>` +
      `<figcaption><span class="counts"></span> · ←/→ step, space plays. ${LEGEND_CAP}</figcaption></figure>`;
  }

  return {
    boxNetFigure, boxNetSVG, connFigure, connSVG, gridBody, gridHTML, staticFigure, playerFigure, notationHTML, G, parse, build, step, reduce, readback, notation, activePairs, frames, renderScene, portAt,
    cellSVG, spec, escapeXml, ruleOf, endOf, wirePoints, resample, pathD,
  };
})();
if (typeof window !== "undefined") window.Inet = Inet;
