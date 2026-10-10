#!/usr/bin/env python3
"""Structural contract for Woodpecker repository secrets.

Every step that binds a repository secret must run a pinned image and only in
a manual pipeline on main. The GitHub release credential is bound in exactly
two reviewed steps, and the release-publish lane hands it only to its final
step.
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
WORKFLOWS = ROOT / ".woodpecker"
PINNED_IMAGE = re.compile(
    r"^[a-z0-9][a-z0-9._/-]*(:[0-9][A-Za-z0-9._-]*)?(@sha256:[0-9a-f]{64})?$"
)
RELEASE_TOKEN_STEPS = {
    ("release.yml", "publish-release"),
    ("pckg.yml", "publish-corelib-and-templates"),
}
failures = []


def Fail(message):
    failures.append(message)


def Conditions(when):
    if when is None:
        return None
    return when if isinstance(when, list) else [when]


def Events(condition):
    event = condition.get("event")
    return event if isinstance(event, list) else [event]


def AllManual(conditions):
    return bool(conditions) and all(Events(c) == ["manual"] for c in conditions)


def AllMain(conditions):
    return bool(conditions) and all(
        c.get("branch") == "main" or c.get("ref") == "refs/heads/main" for c in conditions
    )


def SecretNames(step):
    environment = step.get("environment") or {}
    return [
        value["from_secret"]
        for value in environment.values()
        if isinstance(value, dict) and "from_secret" in value
    ]


def PinnedImage(image):
    if not isinstance(image, str) or not PINNED_IMAGE.match(image):
        return False
    has_tag = re.search(r":[0-9]", image.split("@")[0]) is not None
    return has_tag or "@sha256:" in image


documents = {}
for path in sorted(WORKFLOWS.glob("*.yml")):
    documents[path.name] = yaml.safe_load(path.read_text())

token_steps = set()
for name, document in documents.items():
    workflow_when = Conditions(document.get("when"))
    for step in document.get("steps") or []:
        secrets = SecretNames(step)
        if not secrets:
            continue
        label = f"{name}:{step.get('name')}"
        step_when = Conditions(step.get("when"))
        if not PinnedImage(step.get("image")):
            Fail(f"{label} binds a secret without a pinned image: {step.get('image')}")
        if not (AllManual(step_when) or AllManual(workflow_when)):
            Fail(f"{label} binds a secret outside manual-only pipelines")
        if not (AllMain(step_when) or AllMain(workflow_when)):
            Fail(f"{label} binds a secret outside main-only pipelines")
        if "compiler_release_token" in secrets:
            token_steps.add((name, step.get("name")))
        for command in step.get("commands") or []:
            if re.search(r"\$\$\{?(GH_TOKEN|GITHUB_TOKEN|OVSX_PAT|VSCE_PAT|NODE_AUTH_TOKEN|REGISTRY_PASSWORD|BESKID_PCKG_API_KEY)\b", command):
                Fail(f"{label} expands a credential in its command text")
            if re.search(r"(^|[;&|]\s*)(printenv|env|set|declare\s+-p|export\s+-p)\s*($|[;&|>])", command):
                Fail(f"{label} dumps its environment")
            if "set -x" in command or "xtrace" in command:
                Fail(f"{label} enables shell tracing")

if token_steps != RELEASE_TOKEN_STEPS:
    Fail(f"compiler_release_token steps are {sorted(token_steps)}, expected {sorted(RELEASE_TOKEN_STEPS)}")
for name, document in documents.items():
    text = (WORKFLOWS / name).read_text()
    expected = sum(1 for workflow, _ in RELEASE_TOKEN_STEPS if workflow == name)
    if text.count("compiler_release_token") != expected:
        Fail(f"{name} mentions compiler_release_token outside its reviewed step")

release = documents["release.yml"]
steps = {step["name"]: step for step in release["steps"]}
if list(steps) != ["prepare-release", "verify-release", "publish-release"]:
    Fail(f"release.yml step order changed: {list(steps)}")
for name in ("prepare-release", "verify-release"):
    if SecretNames(steps[name]) or "GH_TOKEN" in yaml.safe_dump(steps[name]):
        Fail(f"release.yml:{name} must not receive a credential")
publish = steps["publish-release"]
if SecretNames(publish) != ["compiler_release_token"] or list((publish.get("environment") or {})).count("GH_TOKEN") != 1:
    Fail("release.yml:publish-release must bind only GH_TOKEN from compiler_release_token")
if publish.get("image") != "node:22.16.0-bookworm":
    Fail("release.yml:publish-release must use node:22.16.0-bookworm")
for name in ("verify-release", "publish-release"):
    conditions = Conditions(steps[name].get("when"))
    if not (AllManual(conditions) and AllMain(conditions) and all(
        c.get("evaluate") == 'BESKID_TASK == "release-publish"' for c in conditions
    )):
        Fail(f"release.yml:{name} must run only in the manual main release-publish lane")
prepare_conditions = Conditions(steps["prepare-release"].get("when"))
if not (AllManual(prepare_conditions) and all(
    c.get("evaluate") == 'BESKID_TASK == "release"' for c in prepare_conditions
)):
    Fail("release.yml:prepare-release must stay the manual release preparation task")
for condition in Conditions(release.get("when")):
    if Events(condition) != ["manual"]:
        Fail("release.yml must run only for manual pipelines")
    if "release-publish" in condition.get("evaluate", "") and condition.get("branch") != "main":
        Fail("release.yml release-publish lane must be main-only")
verify_commands = "\n".join(steps["verify-release"]["commands"])
publish_commands = "\n".join(publish["commands"])
if "BESKID_PUBLISH_RELEASE=0 bash scripts/ci/woodpecker-release.sh" not in verify_commands:
    Fail("release.yml:verify-release must run the release script without publication")
if "BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON" not in verify_commands:
    Fail("release.yml:verify-release must require the owner waiver variable")
for label, commands in (("verify-release", verify_commands), ("publish-release", publish_commands)):
    if "woodpecker-fetch-handoffs.sh" not in commands:
        Fail(f"release.yml:{label} must fetch the selected handoffs")
if "BESKID_PUBLISH_RELEASE=1 bash scripts/ci/woodpecker-release.sh" not in publish_commands:
    Fail("release.yml:publish-release must re-validate and publish through the release script")

if failures:
    print("\n".join(f"FAIL: {failure}" for failure in failures), file=sys.stderr)
    sys.exit(1)
print("Woodpecker secret scope contract OK")
