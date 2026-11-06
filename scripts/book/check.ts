// Acceptance checks for the built book (headless Chromium).
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

const EXE = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const ROOT = path.resolve(import.meta.dir, "../..");
const BOOK = path.join(ROOT, "book");
const browser = await chromium.launch({ executablePath: EXE });
let failures = 0;
const ok = (name: string, pass: boolean, detail: string) => {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${detail}`);
  if (!pass) failures++;
};

// ---------------------------------------------------------------- C1 anchors
for (const doc of ["coursebook", "compendium"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("file://" + path.join(BOOK, `${doc}.html`), { waitUntil: "load", timeout: 180000 });
  await page.waitForFunction("window.bookReady === true", null, { timeout: 180000 });
  const res = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a[href^='#']")];
    const missing = links
      .map((a) => {
        const raw = a.getAttribute("href")!.slice(1);
        try { return decodeURIComponent(raw); } catch { return raw; }
      })
      .filter((id) => !document.getElementById(id));
    return { links: links.length, missing: [...new Set(missing)] };
  });
  ok(`C1 ${doc} in-page anchors`, res.missing.length === 0, `${res.links} links, ${res.missing.length} missing ${res.missing.slice(0, 3).join(",")}`);

  const counts = await page.evaluate(() => ({
    files: document.querySelectorAll(".file").length,
    solutions: document.querySelectorAll("details.solution").length,
    h2: document.querySelectorAll("main h2").length,
    h3: document.querySelectorAll("main h3").length,
    pre: document.querySelectorAll("main pre").length,
    widgets: document.querySelectorAll("figure.widget").length,
    charts: document.querySelectorAll("figure.chart").length,
    inetStatic: document.querySelectorAll("figure.inet-static svg").length,
    inetPlayers: document.querySelectorAll("figure.inet-player").length,
    inetMounted: document.querySelectorAll("figure.inet-player .inet-stage svg").length,
    asciiNets: [...document.querySelectorAll("pre.ascii")].filter((x) => /[╱╲]/.test(x.textContent || "")).length,
    archNets: document.querySelectorAll("figure.inet-arch").length,
    boxAscii: [...document.querySelectorAll("pre.ascii")].filter((x) => /[┌┐└┘]/.test(x.textContent || "") && !x.closest("details.src")).length,
  }));
  if (doc === "compendium") {
    const cpFiles = [...fs.readFileSync(path.join(ROOT, "src/content/compendium/bend-hvm-inet-compendium-claude.md"), "utf8").matchAll(/^### [A-M]\.\d+ · /gm)].length;
    ok("C3 compendium file sections", counts.files === cpFiles, `${counts.files} (expect ${cpFiles})`);
    ok("C3 compendium parts", counts.h2 >= 13, `${counts.h2} h2`);
    ok("C6 compendium box nets rendered", counts.archNets >= 35 && counts.boxAscii === 0, `${counts.archNets} vectorised archive diagrams, ${counts.boxAscii} box-drawing ASCII left`);
  } else {
    ok("C3 coursebook solutions", counts.solutions === 114, `${counts.solutions} (expect 114)`);
    ok("C3 coursebook widgets", counts.widgets === 12 && counts.charts === 3, `${counts.widgets} widgets, ${counts.charts} charts`);
    ok("C3 coursebook code blocks", counts.pre > 120, `${counts.pre} pre`);
    ok("C6 coursebook nets rendered", counts.inetStatic >= 14 && counts.asciiNets === 0, `${counts.inetStatic} static net figures, ${counts.asciiNets} ASCII nets left`);
    ok("C6 coursebook net players", counts.inetPlayers === 9 && counts.inetMounted === counts.inetPlayers, `${counts.inetMounted}/${counts.inetPlayers} players mounted`);
    ok("C6 coursebook box diagrams rendered", counts.archNets >= 1 && counts.boxAscii === 0, `${counts.archNets} vectorised box diagrams, ${counts.boxAscii} box-drawing ASCII left`);
  }
  ok(`C2 ${doc} console`, errors.length === 0, `${errors.length} errors ${errors.slice(0, 2).join(" | ")}`);

  // C5 cross-document links (coursebook only)
  if (doc === "coursebook") {
    const xrefs = await page.evaluate(() => {
      const as = [...document.querySelectorAll("a.xref")];
      return { n: as.length, bad: as.filter((a) => !/compendium\.html#file-[A-M]-\d+/.test(a.getAttribute("href") || "")).length };
    });
    ok("C5 coursebook → compendium xrefs", xrefs.n > 80 && xrefs.bad === 0, `${xrefs.n} links, ${xrefs.bad} malformed`);
  }
  await page.close();
}

// ------------------------------------------------------------ C4 text fidelity
function stripMd(s: string): string {
  return s
    .replace(/^---\n[\s\S]*?\n---\n/, " ")
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/<details[\s\S]*?<\/details>/g, "\n")
    .replace(/^\s*\|.*\|\s*$/gm, "\n")
    .replace(/^\s*[-:]{3,}.*$/gm, "\n")
    .split("\n")
    .filter((line) => !/^\s*(#|>|<!--|[-*+] |\d+\. )/.test(line))
    .join("\n");
}
const norm = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();

for (const [doc, md] of [["coursebook", "bend-hvm-inet-coursebook-claude.md"], ["compendium", "bend-hvm-inet-compendium-claude.md"]] as const) {
  const folder = doc === "coursebook" ? "coursebook" : "compendium";
  const src = stripMd(fs.readFileSync(path.join(ROOT, "src/content", folder, md), "utf8"));
  const paras = src.split(/\n{2,}/).map(norm).filter((p) => p.split(" ").length >= 14);
  const step = Math.max(1, Math.floor(paras.length / 150));
  const sample = paras.filter((_, i) => i % step === 0).slice(0, 150);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("file://" + path.join(BOOK, `${doc}.html`), { waitUntil: "load", timeout: 180000 });
  await page.waitForFunction("window.bookReady === true", null, { timeout: 180000 });
  const text = norm(await page.evaluate(() => document.querySelector("main")!.innerText));
  const miss = sample.filter((p) => {
    const w = p.split(" ");
    const probe = w.slice(Math.floor(w.length / 3), Math.floor(w.length / 3) + 9).join(" ");
    return probe.length > 20 && !text.includes(probe);
  });
  ok(`C4 ${doc} text fidelity`, miss.length <= sample.length * 0.05, `${sample.length - miss.length}/${sample.length} sampled paragraphs found`);
  if (miss.length) console.log("   first miss:", miss[0].slice(0, 140));
  await page.close();
}

// ------------------------------------------------------------ C7 mobile layout
{
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors: string[] = [];
  mobile.on("pageerror", (e) => errors.push(String(e)));
  for (const doc of ["index", "coursebook", "compendium"]) {
    await mobile.goto("file://" + path.join(BOOK, `${doc}.html`), { waitUntil: "load", timeout: 180000 });
    await mobile.waitForTimeout(400);
    const m = await mobile.evaluate(() => ({
      over: document.documentElement.scrollWidth - window.innerWidth,
      font: parseFloat(getComputedStyle(document.body).fontSize),
      wide: [...document.querySelectorAll("body *")].filter((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width <= window.innerWidth + 1 || r.height <= 0) return false;
        for (let n = el.parentElement; n; n = n.parentElement) if (getComputedStyle(n).overflowX !== "visible") return false;
        return true;
      }).length,
    }));
    ok(`C7 ${doc} fits a 390 px phone`, m.over <= 1 && m.wide === 0, `overflow ${m.over} px, ${m.wide} wide elements, body ${m.font} px`);
  }
  // the drawer: opens, filters, closes with Escape, and its links are big enough to tap
  await mobile.goto("file://" + path.join(BOOK, "coursebook.html"), { waitUntil: "load", timeout: 180000 });
  await mobile.waitForFunction("window.bookReady === true", null, { timeout: 180000 });
  await mobile.locator(".toc-toggle").click();
  await mobile.waitForTimeout(300);
  const drawer = await mobile.evaluate(() => {
    const nav = document.querySelector(".sidebar")!;
    const link = document.querySelector(".toc-list a") as HTMLElement;
    return { open: nav.classList.contains("open"), backdrop: !document.querySelector(".backdrop")!.hasAttribute("hidden"), tap: Math.round(link.getBoundingClientRect().height) };
  });
  await mobile.locator("#toc-filter").fill("3.5");
  await mobile.waitForTimeout(200);
  const shown = await mobile.locator(".toc-list > li:not(.hidden)").count();
  await mobile.keyboard.press("Escape");
  await mobile.waitForTimeout(300);
  const shut = await mobile.evaluate(() => !document.querySelector(".sidebar")!.classList.contains("open"));
  ok("C7 phone drawer", drawer.open && drawer.backdrop && drawer.tap >= 36 && shown >= 1 && shut,
    `open ${drawer.open}, backdrop ${drawer.backdrop}, tap ${drawer.tap} px, ${shown} match after filter, closed by Escape ${shut}`);
  // a wide table scrolls inside its own box instead of squeezing columns
  await mobile.goto("file://" + path.join(BOOK, "coursebook.html"), { waitUntil: "load", timeout: 180000 });
  await mobile.waitForFunction("window.bookReady === true", null, { timeout: 180000 });
  const t = await mobile.evaluate(() => {
    const w = document.querySelector(".table-wrap") as HTMLElement;
    return { scrolls: w.scrollWidth > w.clientWidth, cols: getComputedStyle(w.querySelector("table")!).width };
  });
  ok("C7 phone tables scroll", t.scrolls, `table ${t.cols}, wrapper scrolls ${t.scrolls}`);
  ok("C7 mobile console", errors.length === 0, `${errors.length} errors ${errors.slice(0, 2).join(" | ")}`);
  await mobile.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
