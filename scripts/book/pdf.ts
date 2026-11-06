// Prints both documents to A4 PDFs with the local Chromium.
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

const EXE = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const ROOT = path.resolve(import.meta.dir, "../..");
const OUT = path.join(ROOT, "book/pdf");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE });
for (const [name, title] of [["coursebook", "Coursebook"], ["compendium", "Compendium"]] as const) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const t0 = performance.now();
  await page.goto("file://" + path.join(ROOT, "book", `${name}.html`), { waitUntil: "load", timeout: 180000 });
  await page.waitForFunction("window.bookReady === true", null, { timeout: 180000 });
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d as HTMLDetailsElement).open = true));
  await page.emulateMedia({ media: "print" });
  const file = path.join(OUT, `${name}.pdf`);
  await page.pdf({
    path: file,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    outline: true,
    tagged: true,
    timeout: 900000,
    margin: { top: "18mm", bottom: "18mm", left: "0mm", right: "0mm" },
    headerTemplate: `<div style="font:7pt 'DejaVu Sans';color:#666;width:100%;padding:0 15mm;display:flex;justify-content:space-between"><span>${title} · interaction nets, HVM4, HVM5</span><span>Claude edition · 2026-11-06</span></div>`,
    footerTemplate: `<div style="font:7pt 'DejaVu Sans';color:#666;width:100%;padding:0 15mm;text-align:right"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });
  const kb = fs.statSync(file).size / 1024;
  console.log(`${name}.pdf ${kb.toFixed(0)} KB in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  await page.close();
}
await browser.close();
