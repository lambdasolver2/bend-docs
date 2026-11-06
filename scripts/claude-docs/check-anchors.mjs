// Checks that every in-page link "(#id)" in the coursebook resolves to a heading id
// produced by github-slugger (the slugger Astro and the HTML book builder use).
import GithubSlugger from 'github-slugger';
import fs from 'fs';
const file = process.argv[2] ?? new URL('../../src/content/coursebook/bend-hvm-inet-coursebook-claude.md', import.meta.url).pathname;
const doc = fs.readFileSync(file, 'utf8');
const s = new GithubSlugger();
let inFence = false; const ids = new Set();
for (const l of doc.split('\n')) {
  if (l.startsWith('```')) { inFence = !inFence; continue; }
  if (inFence) continue;
  const m = l.match(/^#{1,6} (.+)$/);
  if (m) ids.add(s.slug(m[1].replace(/[`*_]/g, '')));
}
const links = [...doc.matchAll(/\]\(#([^)]+)\)/g)].map(m => m[1]);
const missing = links.filter(x => !ids.has(x));
console.log('links', links.length, 'missing', missing.length, missing.slice(0, 10));
process.exit(missing.length ? 1 : 0);
