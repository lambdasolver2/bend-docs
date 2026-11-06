#!/usr/bin/env python3
"""Builds bend-hvm-inet-compendium-claude.md from:
   - the v1 compendium's verbatim Parts A–I and K (unchanged bytes),
   - a new Part L: HVM4 at HEAD (clone in /tmp/opencode/rewrite-v2/hvm4, commit 6defdfc), verbatim,
   - a new introduction, Appendix R (audit ledger), a regenerated LINK INDEX and PROVENANCE."""
import re, hashlib, pathlib, subprocess, collections, datetime
ROOT = pathlib.Path("/workspaces/typescript-node/bend-docs/src/content/compendium")
V1 = (ROOT / "bend-hvm-inet-compendium.md").read_text()
OUT = ROOT / "bend-hvm-inet-compendium-claude.md"
HVM4 = pathlib.Path("/tmp/opencode/rewrite-v2/hvm4")
HERE = pathlib.Path(__file__).parent
TODAY = "2026-11-06"

lines = V1.splitlines(keepends=True)
start = next(i for i, l in enumerate(lines) if l.startswith("## PART A "))
end = next(i for i, l in enumerate(lines) if l.startswith("## LINK INDEX"))
body = "".join(lines[start:end]).rstrip("\n") + "\n"
# Parts J (project configuration / tooling skills) and M (paper texts) are not part of this
# edition; J is cut here, M is never assembled.
_j0 = body.index("## PART J ·"); _j1 = body.index("## PART K ·")
body = body[:_j0] + body[_j1:]
v1prov = V1[V1.index("## PROVENANCE"):]

commit = subprocess.run(["git", "-C", str(HVM4), "log", "-1", "--format=%H %cd"], capture_output=True, text=True).stdout.strip()
files = ["README.md", "AGENTS.md", "docs/primer.md", "docs/theory/interaction_calculus.md", "docs/hvm/core.md",
         "docs/hvm/memory.md", "docs/hvm/syntax.md", "docs/hvm/collapser.md"]
files += sorted("docs/hvm/interactions/" + p.name for p in (HVM4 / "docs/hvm/interactions").glob("*.md"))
partL = ["\n## PART L · HVM4 at HEAD `6defdfc` (2026-05-29), verbatim\n\n",
         "> The current upstream HVM4 documentation. Part I holds the March 2026 snapshot (`2d7f28e`, multi-file `clang/` tree with AOT/FFI/threads); "
         "since commit `4bc2336` the runtime is one sequential C file, `src/hvm.c`, and these docs describe it. "
         "Read Part L for the present machine, Part I for history. Copied byte for byte; only the banner is added.\n\n",
         f"**Source:** `https://github.com/HigherOrderCO/HVM4` · commit `{commit}` · retrieved {TODAY} · **{len(files)} files**\n\n",
         "<details>\n<summary>In this part (file list)</summary>\n\n"]
partL += [f"- **L.{i}** · `HVM4/{f}`\n" for i, f in enumerate(files, 1)]
partL.append("\n</details>\n\n")
sha = {}
for i, f in enumerate(files, 1):
    txt = (HVM4 / f).read_text()
    sha[f] = hashlib.sha256(txt.encode()).hexdigest()
    partL.append(f"<!-- ===== BEGIN FILE · L.{i} ===== -->\n<!-- source: https://github.com/HigherOrderCO/HVM4/blob/6defdfc/{f} -->\n<!-- path: HVM4/{f} -->\n\n"
                 f"### L.{i} · `HVM4/{f}`\n\n{txt.rstrip()}\n\n<!-- ===== END FILE · L.{i} ===== -->\n\n")
tests = sorted(p.name for p in (HVM4 / "devs/test").glob("*.hvm"))
n = len(files) + 1
partL.append(f"<!-- ===== BEGIN FILE · L.{n} ===== -->\n<!-- generated: listing of devs/test at {commit[:7]} -->\n\n"
             f"### L.{n} · `HVM4/devs/test/` (generated listing, {len(tests)} programs)\n\n"
             "The test programs themselves are code (each is `@main = …` followed by `//expected` lines); the March versions are in Part I. "
             "Run `./devs/test/_all_.sh` (217 tests; all pass at HEAD with `HVM_TEST_TIMEOUT_SECS=20`).\n\n"
             + ", ".join(f"`{t[:-4]}`" for t in tests) + "\n\n" + f"<!-- ===== END FILE · L.{n} ===== -->\n")
partL = "".join(partL)

intro = (HERE / "compendium-intro.md").read_text()
appR = (HERE / "compendium-appendix-r.md").read_text()
core = body + partL
# numbered table of contents over every part and file
toc = ["\n## Table of contents\n\nNumbered by part (1–13) and by file id. Every id is a heading in this document.\n\n"]
pnum = 0
for l in core.splitlines():
    m = re.match(r"^## PART ([A-M]) · (.+)$", l)
    if m:
        pnum += 1; toc.append(f"\n**{pnum} · Part {m.group(1)} — {m.group(2)}**\n\n"); continue
    m = re.match(r"^### ([A-M]\.\d+) · (.+)$", l)
    if m: toc.append(f"- {m.group(1)} · {m.group(2)}\n")
toc.append(f"\n**{pnum+1} · Appendix R — audit ledger** · **{pnum+2} · Link index** · **{pnum+3} · Provenance**\n\n")
doc = intro + "".join(toc) + "\n" + core + "\n" + appR

# LINK INDEX (regenerated over the whole document)
cur = "front"; seen = collections.OrderedDict()
for l in doc.splitlines():
    m = re.match(r"^<!-- ===== BEGIN FILE · ([A-M]\.\d+) ", l) or re.match(r"^## PART ([A-M]) ", l) or re.match(r"^## (APPENDIX R)", l)
    if m: cur = m.group(1)
    for u in re.findall(r"https?://[^\s<>()\[\]`\"'|]+", l):
        u = u.rstrip(".,;:!?*_)}>")
        if u not in seen: seen[u] = [cur, 0]
        seen[u][1] += 1
dom = collections.defaultdict(list)
for u, (s, c) in seen.items(): dom[re.sub(r"^https?://([^/]+).*", r"\1", u)].append((u, s, c))
li = [f"\n## LINK INDEX (regenerated {TODAY})\n\n{len(seen)} distinct URLs, grouped by domain; each with the section where it first appears and its number of occurrences. "
      "Core links were spot-checked with `curl -sIL` on " + TODAY + " (Appendix R, R-18); the rest are listed as found, not verified.\n"]
for d in sorted(dom, key=lambda d: (-len(dom[d]), d)):
    li.append(f"\n### {d} ({len(dom[d])})\n\n")
    li += [f"- <{u}> · first in {s} · ×{c}\n" for u, s, c in dom[d]]
prov = (f"\n## PROVENANCE\n\n### Claude edition ({TODAY})\n\n"
        "- Parts **A–I** and **K**: copied byte for byte from `bend-hvm-inet-compendium.md` (v1, assembled 2026-11-06 from the workspace; its own provenance follows below, unchanged).\n"
        f"- Part **L**: HVM4 `{commit}`, cloned {TODAY}; sha256 of every file:\n\n"
        + "".join(f"  - `{f}` `{h}`\n" for f, h in sha.items() if not (f.endswith(".pdf") or f.startswith("HN-")))
        + "- Interaction-Calculus reference: `VictorTaelin/Interaction-Calculus` `e9f0185` (2025-11-13); its README is H.33.\n"
        "- Licences: Bend is Apache-2.0. The HVM4 and Interaction-Calculus repositories ship no licence text: their files are reproduced here for study, which is not a grant of rights.\n\n"
        "### v1 provenance (unchanged)\n\n" + v1prov.split("\n", 1)[1])
# The v1 provenance table carried rows for Parts J and M, which this edition drops.
def _drop_parts(text: str) -> str:
    rows = [l for l in text.splitlines() if not re.match(r"^\| \*\*[JM]\*\* \|", l)]
    items = sum(int(m.group(2)) for l in rows if (m := re.match(r"^\| \*\*[A-Z]\*\* \|.*\| (\d+) \| ([\d.]+) KB \|", l)))
    kb = sum(float(m.group(2)) for l in rows if (m := re.match(r"^\| \*\*[A-Z]\*\* \|.*\| (\d+) \| ([\d.]+) KB \|", l)))
    out = "\n".join(rows)
    out = re.sub(r"Parts A–K hold \*\*\d+ files / [\d.]+ MB\*\*",
                 f"Parts A–I and K hold **{items} files / {kb / 1024:.2f} MB**", out)
    return out

doc += "".join(li) + _drop_parts(prov)
OUT.write_text(doc)
print(OUT, len(doc), "bytes;", doc.count("BEGIN FILE ·"), "files;", len(seen), "urls")
