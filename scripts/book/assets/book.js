/* The book's client: table of contents, HVM4 trace players, and the interaction-net players (inet.js).
   Vanilla JS, classic script (works from file://). No dependencies. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ helpers */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) n.append(kid);
    return n;
  };
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------- table of contents */
  function initToc() {
    const toc = $("#toc");
    if (!toc) return;
    const links = $$("a[href^='#']", toc);
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));

    const filter = $("#toc-filter");
    if (filter) {
      const parts = $$(".toc-part", toc);
      const plain = $$(".toc-list > li", toc).filter((li) => !li.classList.contains("toc-part"));
      const fold = (p, open) => { const d = p.querySelector("details"); if (d) d.open = open; };
      filter.addEventListener("input", () => {
        const q = filter.value.trim().toLowerCase();
        for (const li of plain) {
          const a = $("a", li);
          li.classList.toggle("hidden", Boolean(q) && !(a && a.textContent.toLowerCase().includes(q)));
        }
        for (const p of parts) {
          const head = ($("summary a", p)?.textContent || "").toLowerCase();
          let any = false;
          for (const li of $$(".toc-files li", p)) {
            const a = $("a", li);
            const hit = !q || (a && a.textContent.toLowerCase().includes(q));
            li.classList.toggle("hidden", !hit);
            if (hit) any = true;
          }
          const show = !q || any || head.includes(q);
          p.classList.toggle("hidden", !show);
          fold(p, Boolean(q) && show);
        }
      });
    }

    const toggle = $(".toc-toggle");
    const sidebar = $(".sidebar");
    if (toggle && sidebar) {
      const backdrop = $(".backdrop");
      const close = $(".toc-close");
      const setOpen = (open) => {
        sidebar.classList.toggle("open", open);
        document.body.classList.toggle("toc-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        if (backdrop) backdrop.hidden = !open;
      };
      toggle.addEventListener("click", () => setOpen(!sidebar.classList.contains("open")));
      if (close) close.addEventListener("click", () => setOpen(false));
      if (backdrop) backdrop.addEventListener("click", () => setOpen(false));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("open")) setOpen(false);
      });
      // a focused <input type=search> consumes Escape in Chromium, so close from there too
      const filterEl = $("#toc-filter");
      if (filterEl) filterEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("open")) setOpen(false);
      });
      $$("a", sidebar).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    }

    const targets = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    if (!("IntersectionObserver" in window) || !targets.length) return;
    let current = null;
    let primed = false;
    const obs = new IntersectionObserver((entries) => {
      if (!primed) { primed = true; return; }
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const id = visible[0].target.id;
      const a = byId.get(id);
      if (!a || a === current) return;
      if (current) current.classList.remove("current");
      current = a;
      a.classList.add("current");
      const inner = a.closest(".sidebar-inner");
      if (!inner) return;
      const r = a.getBoundingClientRect(), ir = inner.getBoundingClientRect();
      if (r.top < ir.top + 8) inner.scrollTop += r.top - ir.top - 32;
      else if (r.bottom > ir.bottom - 8) inner.scrollTop += r.bottom - ir.bottom + 32;
    }, { rootMargin: "-8% 0px -78% 0px", threshold: 0 });
    targets.forEach((t) => obs.observe(t));
  }

  /* ------------------------------------------------------------------- print */
  function initPrint() {
    const btn = $("#print-btn");
    if (btn) btn.addEventListener("click", () => window.print());
    let reopened = [];
    window.addEventListener("beforeprint", () => {
      reopened = $$("details").filter((d) => !d.open);
      reopened.forEach((d) => { d.open = true; });
    });
    window.addEventListener("afterprint", () => {
      reopened.forEach((d) => { d.open = false; });
      reopened = [];
    });
  }

  /* ------------------------------------------------------------ trace players */
  function mountTrace(fig) {
    const name = fig.dataset.trace;
    const data = (window.BOOK_TRACES || {})[name];
    if (!data) return;
    const list = $(".trace-terms", fig);
    const controls = $("[data-controls]", fig);
    const status = $(".trace-rule", fig);
    const tally = $(".trace-tally", fig);

    const counts = {};
    data.steps.forEach((s) => { counts[s.rule] = (counts[s.rule] || 0) + 1; });
    tally.textContent = Object.entries(counts).map(([r, n]) => `${r} ×${n}`).join("  ");

    const common = (a, b) => {
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      return i;
    };
    const render = (term, prev) => {
      if (!prev) return escapeHtml(term);
      const p = common(prev, term);
      const s = common(prev.slice(p).split("").reverse().join(""), term.slice(p).split("").reverse().join(""));
      const midEnd = term.length - s;
      return escapeHtml(term.slice(0, p)) +
        '<mark>' + escapeHtml(term.slice(p, midEnd)) + "</mark>" +
        escapeHtml(term.slice(midEnd));
    };
    const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let i = 0;
    const items = [];
    const mkItem = (idx) => {
      const li = el("li");
      if (idx === 0) {
        li.append(el("span", { class: "tag", text: "start" }), el("pre", { class: "term", html: render(data.start) }));
      } else {
        const step = data.steps[idx - 1];
        const prev = idx === 1 ? data.start : data.steps[idx - 2].term;
        li.append(
          el("span", { class: "tag", text: `step ${idx} · ${step.rule}` }),
          el("pre", { class: "term before", html: render(prev) }),
          el("pre", { class: "term", html: render(step.term, prev) }),
        );
      }
      return li;
    };
    for (let k = 0; k <= data.steps.length; k++) { const li = mkItem(k); list.append(li); items.push(li); }

    const show = () => {
      items.forEach((li, k) => li.classList.toggle("on", k === i));
      status.textContent = i === 0 ? "start" : `step ${i} / ${data.steps.length} · ${data.steps[i - 1].rule}`;
      prev.disabled = i === 0;
      next.disabled = i === items.length - 1;
      first.disabled = prev.disabled;
      last.disabled = next.disabled;
    };

    const mkBtn = (label, title, fn) => {
      const b = el("button", { type: "button", title, text: label });
      b.addEventListener("click", fn);
      controls.append(b);
      return b;
    };
    let timer = null;
    const stop = () => { if (timer) clearInterval(timer); timer = null; play.textContent = "play"; };
    const play = mkBtn("play", "Play the trace", () => {
      if (timer) return stop();
      play.textContent = "pause";
      timer = setInterval(() => {
        if (i >= items.length - 1) return stop();
        i++; show();
      }, 1100);
    });
    const first = mkBtn("first", "First step", () => { stop(); i = 0; show(); });
    const prev = mkBtn("prev", "Previous step", () => { stop(); i = Math.max(0, i - 1); show(); });
    const next = mkBtn("next", "Next step", () => { stop(); i = Math.min(items.length - 1, i + 1); show(); });
    const last = mkBtn("last", "Last step", () => { stop(); i = items.length - 1; show(); });
    controls.append(el("span", { class: "step", text: `${data.steps.length} interactions` }));

    fig.tabIndex = 0;
    fig.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { stop(); i = Math.min(items.length - 1, i + 1); show(); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stop(); i = Math.max(0, i - 1); show(); e.preventDefault(); }
    });
    show();
  }

  /* ----------------------------------------------------- interaction-net players */
  // Every frame is computed up front by inet.js (the same engine that drew the static
  // figure at build time), so stepping, going back and the slider never drift.
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  function mountInet(fig) {
    const Inet = window.Inet;
    if (!Inet) return;
    const limit = fig.dataset.limit ? Number(fig.dataset.limit) : undefined;
    const terms = (fig.dataset.terms || "").split("|");
    let F;
    try { F = Inet.frames(fig.dataset.inet, { limit }); } catch (e) { console.error(e); return; }
    const stage = $(".inet-stage", fig);
    const notation = $(".inet-notation", fig);
    const controls = $("[data-controls]", fig);
    const ruleNow = $(".rule-now", fig);
    const counts = $("figcaption .counts", fig);
    const last = F.frames.length - 1;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const NPTS = 56;
    let k = 0, raf = 0, timer = 0, playing = false;

    const termAt = (i) => terms[Math.min(i, terms.length - 1)] || "";
    const scene = (cells, wires, caption) => ({ width: F.width, height: F.height, cells, free: F.frames[0].free, wires, caption });
    const captionOf = (i) => (i === 0 ? "step 0 · start" : `step ${i} · ${F.frames[i].event.rule.name}`) +
      (i === last ? (F.frames[i].counts.active ? " · step limit" : " · normal form") : "");

    /* ------------------------------------------------ one frame, no motion */
    const draw = (i) => {
      k = i;
      const f = F.frames[i];
      stage.innerHTML = Inet.renderScene(scene(f.cells, f.wires, captionOf(i)), { fluid: true });
      notation.innerHTML = Inet.notationHTML(f, termAt(i)).replace(/^<div class="inet-notation">|<\/div>$/g, "");
      ruleNow.textContent = i < last ? `next: ${F.frames[i + 1].event.rule.name}` : (f.counts.active ? "step limit reached" : "normal form");
      counts.textContent = `cells ${f.counts.cells} · free ports ${f.counts.free} · active pairs ${f.counts.active}`;
      stepLbl.textContent = `step ${i} / ${last}`;
      slider.value = String(i);
      bPrev.disabled = bReset.disabled = i === 0;
      bNext.disabled = i === last;
      bPlay.textContent = playing ? "❚❚ pause" : i === last ? "↺ replay" : "▶ play";
    };

    /* ------------------------------------- one interaction, as a rewiring */
    // Every wire in the next frame is morphed from the chain of old wires it continues
    // (the reducer records that chain), with its ends glued to the ports they leave and
    // arrive at; agents slide, copies grow out of the cell they copy, consumed agents
    // shrink into the point where the pair met.
    const animate = (i, done) => {
      const A = F.frames[i], B = F.frames[i + 1], ev = B.event;
      const ua = A.byId.get(ev.u), va = A.byId.get(ev.v);
      const pa = Inet.portAt(ua, 0), pb = Inet.portAt(va, 0);
      const meet = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };

      const tracks = [];
      for (const c of B.cells) {
        const was = A.byId.get(c.id);
        const born = !was && ev.born.find((x) => x.id === c.id);
        const anc = born ? A.byId.get(born.from) : null;
        const start = was ? { x: was.x, y: was.y, flip: was.flip, scale: 1, opacity: 1 }
          : anc ? { x: anc.x, y: anc.y, flip: anc.flip, scale: 0.18, opacity: 0 }
          : { x: meet.x, y: meet.y, flip: c.flip, scale: 0.18, opacity: 0 };
        tracks.push({ c, from: start, to: { x: c.x, y: c.y, flip: c.flip, scale: 1, opacity: 1 } });
      }
      for (const c of A.cells) {
        if (B.byId.has(c.id)) continue;
        tracks.push({ c, from: { x: c.x, y: c.y, flip: c.flip, scale: 1, opacity: 1 },
          to: { x: meet.x, y: meet.y, flip: c.flip, scale: 0.15, opacity: 0 } });
      }

      const wires = [];
      B.wires.forEach((w, ix) => {
        const ch = B.cont[ix];
        let chain = [];
        if (ch) {
          for (const { key, rev } of ch.keys) {
            const pts = A.pathByKey.get(key);
            if (!pts || pts.length < 2) continue;
            chain.push(...(rev ? [...pts].reverse() : pts));
          }
          if (ch.flip) chain.reverse();
        }
        if (chain.length < 2) chain = [{ x: meet.x, y: meet.y }, { x: meet.x, y: meet.y }];
        wires.push({ p: w.p, q: w.q, cls: w.cls, from: Inet.resample(chain, NPTS), to: Inet.resample(w.pts, NPTS) });
      });
      const kept = new Set();
      for (const ch of B.cont) if (ch) for (const { key } of ch.keys) kept.add(key);
      for (const w of A.wires) {
        if (kept.has(w.p + "|" + w.q)) continue;
        const pts = Inet.resample(w.pts, NPTS);
        wires.push({ p: w.p, q: w.q, cls: w.cls, from: pts, to: pts, fade: true });
      }

      const dur = still ? 0 : 760;
      const t0 = performance.now();
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      ruleNow.textContent = `step ${i + 1} · ${ev.rule.name}`;

      const frame = (now) => {
        const raw = dur === 0 ? 1 : Math.min(1, (now - t0) / dur);
        const t = ease(raw);
        const poseById = new Map();
        const cells = tracks.map((tr) => {
          const p = {
            x: tr.from.x + (tr.to.x - tr.from.x) * t,
            y: tr.from.y + (tr.to.y - tr.from.y) * t,
            flip: tr.from.flip + (tr.to.flip - tr.from.flip) * t,
            scale: tr.from.scale + (tr.to.scale - tr.from.scale) * t,
            opacity: tr.from.opacity + (tr.to.opacity - tr.from.opacity) * t,
          };
          poseById.set(tr.c.id, p);
          return { id: tr.c.id, kind: tr.c.kind, show: tr.c.show, label: tr.c.label, tag: tr.c.tag,
            active: tr.c.active, ...p };
        });
        const endNow = (key) => {
          if (key[0] === ":") {
            const p = B.freeBy.get(key.slice(1));
            return p ? { x: p.x, y: p.y + (p.side === "top" ? 3 : -3) } : null;
          }
          const d = key.match(/^(\d+)\.(\d)$/);
          if (!d) return null;
          const p = poseById.get(Number(d[1]));
          return p ? Inet.portAt(p, Number(d[2])) : null;
        };
        const drawn = wires.map((w) => {
          const n = w.from.length;
          const pts = w.from.map((p, ix) => ({ x: p.x + (w.to[ix].x - p.x) * t, y: p.y + (w.to[ix].y - p.y) * t }));
          const a = endNow(w.p), b = endNow(w.q);
          if (a) { const dx = a.x - pts[0].x, dy = a.y - pts[0].y; pts.forEach((p, ix) => { const k2 = Math.pow(1 - ix / (n - 1), 2); p.x += dx * k2; p.y += dy * k2; }); }
          if (b) { const dx = b.x - pts[n - 1].x, dy = b.y - pts[n - 1].y; pts.forEach((p, ix) => { const k2 = Math.pow(ix / (n - 1), 2); p.x += dx * k2; p.y += dy * k2; }); }
          return { p: w.p, q: w.q, cls: w.cls, pts, fade: w.fade ? 1 - t : 1 };
        });
        stage.innerHTML = Inet.renderScene({ width: F.width, height: F.height, cells, free: B.free, wires: drawn, caption: `step ${i + 1} · ${ev.rule.name}` }, { fluid: true });
        if (raw < 1) raf = requestAnimationFrame(frame);
        else { draw(i + 1); if (done) done(); }
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    /* ------------------------------------------------------------ controls */
    const btn = (label, title, fn) => {
      const b = el("button", { type: "button", title, "aria-label": title, text: label });
      b.addEventListener("click", fn);
      return b;
    };
    const next = (done) => { if (k < last) animate(k, done); };
    const stop = () => { playing = false; clearTimeout(timer); draw(k); };
    const play = () => {
      if (k === last) draw(0);
      playing = true;
      draw(k);
      const tick = () => {
        if (!playing) return;
        if (k >= last) { stop(); return; }
        next(() => { if (playing) timer = setTimeout(tick, 550); });
      };
      timer = setTimeout(tick, 320);
    };
    const bReset = btn("|◀", "Back to the start", () => { stop(); draw(0); });
    const bPrev = btn("◀", "Previous step", () => { stop(); if (k > 0) draw(k - 1); });
    const bPlay = btn("▶ play", "Play the whole reduction", () => (playing ? stop() : play()));
    const bNext = btn("▶|", "Next step", () => { stop(); next(); });
    const slider = el("input", { type: "range", min: "0", max: String(last), value: "0", "aria-label": "Step" });
    slider.addEventListener("input", () => { stop(); draw(Number(slider.value)); });
    const stepLbl = el("span", { class: "step" });
    controls.append(bReset, bPrev, bPlay, bNext, slider, stepLbl);
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); stop(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); if (k > 0) draw(k - 1); }
      else if (e.key === " ") { e.preventDefault(); playing ? stop() : play(); }
      else if (e.key === "Home") { e.preventDefault(); stop(); draw(0); }
      else if (e.key === "End") { e.preventDefault(); stop(); draw(last); }
    });
    draw(0);
  }

  /* --------------------------------------------------------------- mount all */
  function mount() {
    initToc();
    initPrint();
    $$("figure.trace[data-trace]").forEach(mountTrace);
    $$("figure.inet-player[data-inet]").forEach(mountInet);
    window.bookReady = true;
    document.documentElement.dataset.bookReady = "1";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
