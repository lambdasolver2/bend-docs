import json, subprocess

GISTS = {
    "hoc-optimal-computer": "46936b9fdfc3f982f07963c11756e36b",
    "hoc-history": "77fd5a2a8a4a07e1da6157ebca3c7cf1",
    "hvm-10min": "311f6a58a7756945196c15733e61d0c6",
    "hvm-mystery": "85b94b5ba5b8b5440ded64bba8c89ac2",
    "kind-conv-checker": "3f748a46e95071e29462b1ac93c294c5",
    "hvm-sat": "9061306220929f04e7e6980f23ade615",
    "hvm-search1": "d5c318348aaee7033eb3d18b0b0ace34",
    "hvm-search3": "7c4c69a1f07b5c668be613f1032e7d4e",
    "hvm-unordered-sup": "93c327e5b4e752b744d7798687977f8a",
    "hvm-collapse-monad": "60d3bc72fb4edefecd42095e44138b41",
    "hvm-linker": "2aba162f2b04478dc53e5615f482db7b",
    "hvm-sieve": "a5571afaf5ee565689d2b9a981bd9df8",
    "term-checker": "676241eb4e290a006e5618f97b8a1c25",
}

for key, gid in GISTS.items():
    try:
        out = subprocess.run(
            ["curl", "-sSL", "--max-time", "25",
             f"https://api.github.com/gists/{gid}"],
            capture_output=True, text=True, timeout=40)
        d = json.loads(out.stdout)
        files = d.get("files", {})
        parts = [f"# {d.get('description', '')}\n\nURL: {d.get('html_url', '')}\n"]
        for name, f in files.items():
            parts.append(f"\n## File: {name}\n\n" + (f.get("content") or ""))
        text = "\n".join(parts)
        with open(f"openspec/changes/bend-docs-site/research/victor/{key}.md",
                  "w") as fh:
            fh.write(text)
        print(f"{key}: {len(text)} chars")
    except Exception as e:  # noqa: BLE001
        print(f"{key} FAILED: {e}")
