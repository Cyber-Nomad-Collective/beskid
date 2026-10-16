#!/usr/bin/env python3
"""Every release step that resolves a candidate or collects handoffs walks full history first.

Woodpecker's git plugin clones shallow even with depth: 0, so code that runs
release-user-observation.mjs or woodpecker-fetch-handoffs.sh must first run
scripts/ci/woodpecker-full-history.sh. This holds for inline step commands, for
the release lane script the steps call, and for the release publisher
dispatcher, which reaches the walkers only through that lane script.
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
WORKFLOWS = ROOT / ".woodpecker"
WALKERS = re.compile(r"release-user-observation\.mjs|woodpecker-fetch-handoffs\.sh")
HISTORY = "woodpecker-full-history.sh"
LANE = "scripts/ci/woodpecker-release-lane.sh"
DISPATCHER = "ci/plugins/release-publisher/dispatch.sh"
failures = []


def FirstIndex(lines, pattern):
    for index, line in enumerate(lines):
        if re.search(pattern, line):
            return index
    return None


def CheckOrder(label, lines):
    walker = FirstIndex(lines, WALKERS.pattern)
    if walker is None:
        return False
    history = FirstIndex(lines, re.escape(HISTORY))
    if history is None or history >= walker:
        failures.append(f"{label} resolves the candidate before {HISTORY}")
    return True


def CodeLines(path):
    return [l for l in (ROOT / path).read_text().splitlines() if not l.lstrip().startswith("#")]


if not CheckOrder(LANE, CodeLines(LANE)):
    failures.append(f"{LANE} no longer resolves the candidate; the contract matched nothing")
dispatcher = CodeLines(DISPATCHER)
CheckOrder(DISPATCHER, dispatcher)
if not any("woodpecker-release-lane.sh publish" in l for l in dispatcher):
    failures.append(f"{DISPATCHER} must publish through {LANE}")

lane_steps = 0
for path in sorted(WORKFLOWS.glob("*.yml")):
    document = yaml.safe_load(path.read_text())
    for step in document.get("steps") or []:
        commands = [str(c) for c in step.get("commands") or []]
        CheckOrder(f"{path.name}:{step.get('name')}", commands)
        lane_steps += sum(1 for c in commands if "woodpecker-release-lane.sh" in c)
if lane_steps != 2:
    failures.append(f"expected prepare-release and verify-release to run {LANE}, found {lane_steps} calls")

if failures:
    print("\n".join(f"FAIL: {f}" for f in failures), file=sys.stderr)
    sys.exit(1)
print("Woodpecker full-history contract OK")
