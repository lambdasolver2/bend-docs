#!/usr/bin/env python3
"""Check the runnable blocks in the tutorial pages.

Bend blocks are compiled and run with `bend`. Interaction Calculus blocks are
run with the reference `ic` binary named by the IC_BIN environment variable,
and are reported as skipped when IC_BIN is unset.

Conventions read from the Markdown fences:

- ```bend           a complete program (single file, main.bend). A group with no
                    expectation block must pass `bend FILE --check-only`.
- ```bend file=X    part of a multi-file group (imports). Groups close at the
                    first expectation block.
- ```bend ... run   marks the file that is the entry of its group.
- ```output         exact non-blank stdout+stderr of `bend ENTRY` (exit status 0).
- ```error          `bend ENTRY` exits non-zero and prints each listed line.
- ```contains       the program prints each listed line; the exit status is not
                    checked. Required for ic blocks, whose timing lines vary.
- ```ic             an Interaction Calculus program, run as `ic run FILE`.
- ```ic-collapse    the same program, run as `ic run FILE -C`.

Any other fence (text, sh, bend-syntax) is documentation and is not run.

Usage: IC_BIN=/path/to/ic python3 scripts/check-tutorial.py [TUTORIAL_DIR]
"""

import os
import pathlib
import re
import shutil
import subprocess
import sys

DEFAULT_DIR = pathlib.Path(__file__).resolve().parent.parent / "src" / "content" / "tutorial"
WORK = pathlib.Path("/tmp/opencode/bend-verify/docs-run")
EXPECTATIONS = {"output", "error", "contains"}
PROGRAMS = {"bend", "ic", "ic-collapse"}
HEADING = re.compile(r"^#{1,6} ")
IC_BIN = os.path.abspath(os.environ["IC_BIN"]) if os.environ.get("IC_BIN") else ""


def parse_events(path: pathlib.Path):
    lines = path.read_text().splitlines()
    events = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            tokens = line[3:].strip().split()
            lang = tokens[0] if tokens else ""
            attrs, flags = {}, set()
            for token in tokens[1:]:
                if "=" in token:
                    key, value = token.split("=", 1)
                    attrs[key] = value
                else:
                    flags.add(token)
            j = i + 1
            body = []
            while j < len(lines) and not lines[j].startswith("```"):
                body.append(lines[j])
                j += 1
            events.append(("block", lang, attrs, flags, body, i + 1))
            i = j + 1
            continue
        if HEADING.match(line):
            events.append(("heading", None, None, None, None, i + 1))
        i += 1
    return events


def build_groups(path: pathlib.Path):
    groups = []
    current = None
    for kind, lang, attrs, flags, body, lineno in parse_events(path):
        if kind == "heading":
            if current is not None:
                groups.append(current)
                current = None
            continue
        if lang in PROGRAMS:
            if current is not None and ("file" not in attrs or current["lang"] != lang):
                groups.append(current)
                current = None
            if current is None:
                current = {"lang": lang, "files": {}, "entry": None, "expect": None, "line": lineno}
            default = "main.bend" if lang == "bend" else "main.ic"
            name = attrs.get("file", default)
            current["files"][name] = "\n".join(body) + "\n"
            if "run" in flags:
                current["entry"] = name
        elif lang in EXPECTATIONS and current is not None:
            current["expect"] = (lang, [line.strip() for line in body if line.strip()], lineno)
            groups.append(current)
            current = None
    if current is not None:
        groups.append(current)
    return groups


def resolve_entry(group) -> str:
    if group["entry"]:
        return group["entry"]
    for candidate in ("main.bend", "main.ic", "PROOF.bend"):
        if candidate in group["files"]:
            return candidate
    return list(group["files"])[-1]


def run_bend_group(label, group, entry, directory) -> str:
    expect = group["expect"]
    args = ["bend", entry] if expect else ["bend", entry, "--check-only"]
    try:
        proc = subprocess.run(args, cwd=directory, capture_output=True, text=True, timeout=240)
    except subprocess.TimeoutExpired:
        print(f"FAIL {label}:{group['line']} {entry}: timed out after 240s")
        return "fail"
    out = proc.stdout + proc.stderr
    if expect is None:
        ok = proc.returncode == 0 and "Error" not in out and "rely on unsafe" not in out
        reason = f"rc={proc.returncode}"
    else:
        kind, lines, _ = expect
        if kind == "output":
            got = [line.strip() for line in out.splitlines() if line.strip()]
            ok = proc.returncode == 0 and got == lines
            reason = f"rc={proc.returncode}"
        elif kind == "error":
            ok = proc.returncode != 0 and all(line in out for line in lines)
            reason = f"rc={proc.returncode}, need error lines"
        else:
            ok = all(line in out for line in lines)
            reason = f"rc={proc.returncode}, need lines"
    print(f"{'PASS' if ok else 'FAIL'} {label}:{group['line']} {entry} ({reason})")
    if not ok:
        shown = [line.strip() for line in out.splitlines() if line.strip()][:8]
        print("   got:", " | ".join(shown) if shown else "<no output>")
    return "pass" if ok else "fail"


def run_ic_group(label, group, entry, directory) -> str:
    expect = group["expect"]
    if not IC_BIN:
        print(f"SKIP {label}:{group['line']} {entry} (set IC_BIN to run Interaction Calculus blocks)")
        return "skip"
    if expect is None or expect[0] != "contains":
        print(f"FAIL {label}:{group['line']} {entry}: ic blocks need a contains block")
        return "fail"
    flags = ["-C"] if group["lang"] == "ic-collapse" else []
    try:
        proc = subprocess.run(
            [IC_BIN, "run", entry, *flags], cwd=directory, capture_output=True, text=True, timeout=120
        )
    except subprocess.TimeoutExpired:
        print(f"FAIL {label}:{group['line']} {entry}: timed out after 120s")
        return "fail"
    out = proc.stdout + proc.stderr
    lines = expect[1]
    ok = all(line in out for line in lines)
    print(f"{'PASS' if ok else 'FAIL'} {label}:{group['line']} {entry} ({group['lang']}, {len(lines)} lines)")
    if not ok:
        shown = [line.strip() for line in out.splitlines() if line.strip()][:8]
        print("   got:", " | ".join(shown) if shown else "<no output>")
    return "pass" if ok else "fail"


def run_group(label, index, group) -> str:
    directory = WORK / f"{label}-{index}"
    shutil.rmtree(directory, ignore_errors=True)
    directory.mkdir(parents=True)
    for name, content in group["files"].items():
        (directory / name).write_text(content)
    entry = resolve_entry(group)
    if group["lang"] == "bend":
        return run_bend_group(label, group, entry, directory)
    return run_ic_group(label, group, entry, directory)


def main() -> int:
    target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DIR
    files = sorted(target.glob("*.md"))
    counts = {"pass": 0, "fail": 0, "skip": 0}
    for path in files:
        for index, group in enumerate(build_groups(path)):
            counts[run_group(path.stem, index, group)] += 1
    print(f"{counts['pass']} passed, {counts['fail']} failed, {counts['skip']} skipped in {len(files)} files")
    return 1 if counts["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
