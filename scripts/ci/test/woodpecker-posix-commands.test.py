#!/usr/bin/env python3
"""Woodpecker runs step `commands` with /bin/sh (dash on Debian images), not bash.

Reject bash-only syntax in Linux container step commands: here-strings (<<<),
[[ ]] tests, $'...' quoting, arrays, `function` definitions, process
substitution, `source` and `set -o pipefail`. Bodies that need bash belong in a
checked-in `#!/usr/bin/env bash` script called as `bash scripts/ci/...`.
Native (local-backend) workflows choose their own shell and are not checked.
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
WORKFLOWS = ROOT / ".woodpecker"
BASHISMS = {
    "here-string <<<": re.compile(r"<<<"),
    "[[ test": re.compile(r"(^|[\s;&|(])\[\[\s"),
    "$'...' quoting": re.compile(r"(?<!\$)\$'"),
    "array assignment": re.compile(r"(^|[\s;])[A-Za-z_][A-Za-z0-9_]*=\("),
    "array expansion": re.compile(r"\$\$\{[A-Za-z_][A-Za-z0-9_]*\[[@*0-9]"),
    "function keyword": re.compile(r"(^|[\s;])function\s+[A-Za-z_]"),
    "process substitution": re.compile(r"[<>]\("),
    "source builtin": re.compile(r"(^|[\s;&|])source\s"),
    "pipefail": re.compile(r"pipefail"),
}
failures = []
checked = 0
for path in sorted(WORKFLOWS.glob("*.yml")):
    document = yaml.safe_load(path.read_text())
    if (document.get("labels") or {}).get("backend") != "docker":
        continue
    for step in document.get("steps") or []:
        for command in step.get("commands") or []:
            checked += 1
            code = "\n".join(l for l in str(command).splitlines() if not l.lstrip().startswith("#"))
            for name, pattern in BASHISMS.items():
                if pattern.search(code):
                    failures.append(f"{path.name}:{step.get('name')} uses bash-only {name} in /bin/sh commands: {str(command).splitlines()[0][:80]}")

if checked == 0:
    failures.append("no docker step commands were checked")
if failures:
    print("\n".join(f"FAIL: {f}" for f in failures), file=sys.stderr)
    sys.exit(1)
print(f"Woodpecker POSIX commands contract OK ({checked} commands)")
