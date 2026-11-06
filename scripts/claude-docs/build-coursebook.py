#!/usr/bin/env python3
"""Assembles bend-hvm-inet-coursebook-claude.md from cb/*.md and inserts a generated table of contents."""
import re, pathlib
HERE = pathlib.Path(__file__).parent
ORDER = ["00-front.md", "03-rules.md", "05-ic.md", "07-algo.md", "08b-design.md", "09-theory.md", "12-capstone.md", "13-appB.md", "14-appCDE.md"]
doc = "".join((HERE / "cb" / f).read_text() for f in ORDER)
def slug(h):  # github-slugger style, as used by the site's markdown pipeline
    import unicodedata
    h = re.sub(r"[`*_]", "", h.strip().lower())
    h = "".join(c for c in h if unicodedata.category(c) != "No")  # github-slugger drops ², ³, ⁵ …
    return re.sub(r"[^\w\- ]", "", h, flags=re.U).replace(" ", "-")
toc = ["## Contents\n\n"]
infence = False
for line in doc.splitlines():
    if line.startswith("```"): infence = not infence; continue
    if infence: continue
    m = re.match(r"^(##|###) (.+)$", line)
    if not m or m.group(2) == "Contents": continue
    t = m.group(2)
    if m.group(1) == "##": toc.append(f"- [{t}](#{slug(t)})\n")
    elif not t.startswith(("What to remember", "Exercises")) and re.match(r"^\d|^[0-9A-Z]+\.\d", t): toc.append(f"  - [{t}](#{slug(t)})\n")
toc = "".join(toc) + "\n"
anchor = "## 0 · How to use this book"
doc = doc.replace(anchor, toc + anchor, 1)
out = pathlib.Path("/workspaces/typescript-node/bend-docs/src/content/coursebook/bend-hvm-inet-coursebook-claude.md")
out.write_text(doc)
print(out, len(doc), "bytes")
