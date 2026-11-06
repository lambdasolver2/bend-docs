// Development server: rebuilds the changed chunk and reloads the browser.
//   bun scripts/book/dev.ts [--port 4321]
import fs from "node:fs";
import path from "node:path";
import { build } from "./build";

process.env.BOOK_LIVE = "1";
const HERE = import.meta.dir;
const ROOT = path.resolve(HERE, "../..");
const BOOK = path.join(ROOT, "book");
const CB_DIR = path.join(ROOT, "scripts/claude-docs/cb");
const WATCH_MD = [
  path.join(ROOT, "src/content/coursebook/bend-hvm-inet-coursebook-claude.md"),
  path.join(ROOT, "src/content/compendium/bend-hvm-inet-compendium-claude.md"),
];

const portArg = process.argv.indexOf("--port");
const port = portArg > 0 ? Number(process.argv[portArg + 1]) : 4321;
const clients = new Set<(msg: string) => void>();
let building = false, pending = false;

async function rebuild(why: string) {
  if (building) { pending = true; return; }
  building = true;
  const t0 = performance.now();
  try {
    await build();
    console.log(`↻ ${why} · ${(performance.now() - t0).toFixed(0)} ms`);
    for (const send of clients) send("data: reload\n\n");
  } catch (e) {
    console.error("build failed:", e);
    for (const send of clients) send("data: error\n\n");
  } finally {
    building = false;
    if (pending) { pending = false; setTimeout(() => rebuild("queued change"), 50); }
  }
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/__events") {
      const enc = new TextEncoder();
      let send: (msg: string) => void = () => {};
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          send = (msg) => c.enqueue(enc.encode(msg));
          clients.add(send);
          send(": hello\n\n");
        },
        cancel() { clients.delete(send); },
      });
      return new Response(stream, {
        headers: { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" },
      });
    }
    if (url.pathname === "/assets/live.js") {
      return new Response(LIVE_JS, { headers: { "content-type": "text/javascript" } });
    }
    const rel = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(BOOK, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return new Response(Bun.file(file));
    }
    return new Response("not found", { status: 404 });
  },
});

const LIVE_JS = `
(() => {
  const es = new EventSource("/__events");
  es.onmessage = (e) => {
    if (e.data === "reload") location.reload();
    if (e.data === "error") console.error("book: build failed, see the terminal");
  };
})();`;

let timer: any = null;
const schedule = (why: string) => {
  clearTimeout(timer);
  timer = setTimeout(() => rebuild(why), 220);
};

fs.watch(CB_DIR, (_e, f) => {
  if (!f || !f.endsWith(".md")) return;
  const py = Bun.spawnSync(["python3", "scripts/claude-docs/build-coursebook.py"], { cwd: ROOT });
  if (py.exitCode !== 0) { console.error(py.stderr.toString()); return; }
  schedule(`cb/${f} → md → html`);
});
for (const f of WATCH_MD) fs.watch(f, () => schedule(path.basename(f)));

await rebuild("initial");
console.log(`book: http://localhost:${port}/  (watching ${CB_DIR} and the two .md files)`);
