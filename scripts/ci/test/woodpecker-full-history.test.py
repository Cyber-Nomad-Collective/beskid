#!/usr/bin/env python3
"""Every Woodpecker step that resolves a release candidate or collects handoffs walks history.

Woodpecker's git plugin clones shallow even with depth: 0, so a step that runs
release-user-observation.mjs or woodpecker-fetch-handoffs.sh must first run
scripts/ci/woodpecker-full-history.sh. Plugin steps on the release publisher
image delegate this to the image dispatcher, which must do the same.
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
WORKFLOWS = ROOT / ".woodpecker"
HISTORY = "scripts/ci/woodpecker-full-history.sh"
WALKERS = re.compile(r"release-user-observation\.mjs|woodpecker-fetch-handoffs\.sh")
DISPATCHER = ROOT / "ci/plugins/release-publisher/dispatch.sh"
failures = []


def FirstIndex(lines, predicate):
    for index, line in enumerate(lines):
        if predicate(line):
            return index
    return None


checked = 0
for path in sorted(WORKFLOWS.glob("*.yml")):
    document = yaml.safe_load(path.read_text())
    for step in document.get("steps") or []:
        label = f"{path.name}:{step.get('name')}"
        commands = [str(c) for c in step.get("commands") or []]
        walker = FirstIndex(commands, lambda c: WALKERS.search(c) is not None)
        if walker is None:
            continue
        checked += 1
        history = FirstIndex(commands, lambda c: HISTORY in c)
        if history is None or history >= walker:
            failures.append(f"{label} resolves the candidate before {HISTORY}")

if DISPATCHER.exists():
    lines = [l for l in DISPATCHER.read_text().splitlines() if not l.lstrip().startswith("#")]
    walker = FirstIndex(lines, lambda l: WALKERS.search(l) is not None)
    history = FirstIndex(lines, lambda l: "woodpecker-full-history.sh" in l)
    if walker is not None and (history is None or history >= walker):
        failures.append(f"{DISPATCHER.relative_to(ROOT)} resolves the candidate before the full-history fetch")

if checked == 0:
    failures.append("no step resolves the release candidate; the contract matched nothing")
if failures:
    print("\n".join(f"FAIL: {f}" for f in failures), file=sys.stderr)
    sys.exit(1)
print(f"Woodpecker full-history contract OK ({checked} steps)")
