#!/usr/bin/env python3
"""Structural contract for Woodpecker repository secrets.

Every step that binds a repository secret must run a pinned image and only in
a manual pipeline on main. The GitHub release credential is bound in exactly
two reviewed steps, and the release-publish lane hands it only to its final
step.

Woodpecker gives an image-filtered secret only to a plugin step (no commands,
entrypoint or environment). The publication secrets are filtered to the release
publisher image, so every step binding one is such a plugin step on that image,
passes the secret through `settings:`, and names its dispatcher action.
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
PUBLISHER_DIR = ROOT / "ci/plugins/release-publisher"
PUBLISHER_VERSION = (PUBLISHER_DIR / "VERSION").read_text().strip()
PUBLISHER_IMAGE = re.compile(
    r"^cr\.beskid-lang\.org/beskid/release-publisher:" + re.escape(PUBLISHER_VERSION) + r"(@sha256:[0-9a-f]{64})?$"
)
# Secrets filtered to the publisher image, and the dispatcher action of each step that binds them.
PLUGIN_SECRETS = {"compiler_release_token", "pckg_release_publisher_key", "open_vsx_token"}
PLUGIN_STEPS = {
    ("release.yml", "publish-release"): ("release-publish", {"gh_token": "compiler_release_token"}),
    ("pckg.yml", "publish-corelib-and-templates"): (
        "pckg-publish", {"gh_token": "compiler_release_token", "pckg_api_key": "pckg_release_publisher_key"}),
    ("editor.yml", "publish-editor-release"): ("editor-publish", {"ovsx_pat": "open_vsx_token"}),
}
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


def SecretBindings(mapping):
    return {
        key: value["from_secret"]
        for key, value in (mapping or {}).items()
        if isinstance(value, dict) and "from_secret" in value
    }


def SecretNames(step):
    return list(SecretBindings(step.get("environment")).values()) + list(SecretBindings(step.get("settings")).values())


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

plugin_steps = set()
images = set()
for name, document in documents.items():
    for step in document.get("steps") or []:
        label = f"{name}:{step.get('name')}"
        secrets = set(SecretNames(step))
        if not secrets & PLUGIN_SECRETS:
            continue
        plugin_steps.add((name, step.get("name")))
        for key in ("commands", "entrypoint", "environment"):
            if key in step:
                Fail(f"{label} binds a publisher-filtered secret but is not a plugin step: it has {key}")
        if not PUBLISHER_IMAGE.match(str(step.get("image"))):
            Fail(f"{label} binds a publisher-filtered secret outside the release publisher image: {step.get('image')}")
        images.add(step.get("image"))
        if SecretBindings(step.get("environment")):
            Fail(f"{label} binds a secret through environment instead of settings")
        expected = PLUGIN_STEPS.get((name, step.get("name")))
        if expected is None:
            continue
        action, bindings = expected
        settings = step.get("settings") or {}
        if settings.get("action") != action:
            Fail(f"{label} must dispatch action {action}")
        if settings.get("task") != "${BESKID_TASK}":
            Fail(f"{label} must pass the pipeline task to the dispatcher")
        if SecretBindings(settings) != bindings:
            Fail(f"{label} binds {SecretBindings(settings)}, expected {bindings}")
        for key, value in settings.items():
            if isinstance(value, str) and "${" in value and not re.fullmatch(r"\$\{BESKID_[A-Z_]+\}", value):
                Fail(f"{label} setting {key} must substitute exactly one BESKID_ variable")
if plugin_steps != set(PLUGIN_STEPS):
    Fail(f"publisher-filtered secret steps are {sorted(plugin_steps)}, expected {sorted(PLUGIN_STEPS)}")
if len(images) > 1:
    Fail(f"publication steps disagree on the publisher image: {sorted(images)}")

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
if SecretNames(publish) != ["compiler_release_token"]:
    Fail("release.yml:publish-release must bind only compiler_release_token")
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
lane = (ROOT / "scripts/ci/woodpecker-release-lane.sh").read_text()
dispatcher = (PUBLISHER_DIR / "dispatch.sh").read_text()
# The publish step is a plugin step; its commands are the dispatcher's release-publish branch.
publish_commands = dispatcher[dispatcher.index("  release-publish)"):dispatcher.index("  pckg-publish)")]
if "bash scripts/ci/woodpecker-release-lane.sh verify" not in verify_commands:
    Fail("release.yml:verify-release must run the release lane without publication")
if 'GH_TOKEN="$gh_token" bash scripts/ci/woodpecker-release-lane.sh publish' not in publish_commands:
    Fail("release.yml:publish-release must re-validate and publish through the release lane")
for needle, message in (
    ('BESKID_PUBLISH_RELEASE=0 bash "$scripts/woodpecker-release.sh"', "the lane must verify without publication"),
    ('GH_TOKEN="$release_token" BESKID_PUBLISH_RELEASE=1 bash "$scripts/woodpecker-release.sh"', "the lane must publish through the release script"),
    ("BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON", "the lane must require the owner waiver variable for verification"),
    ("woodpecker-fetch-handoffs.sh", "the lane must fetch the selected handoffs"),
    ("unset GH_TOKEN", "the lane must remove GH_TOKEN from its exported environment"),
):
    if needle not in lane:
        Fail(message)
if lane.count('GH_TOKEN="$release_token"') != 1:
    Fail("the lane must hand GH_TOKEN only to the publishing woodpecker-release.sh call")
if dispatcher.count('GH_TOKEN="$gh_token"') != 2:
    Fail("the dispatcher must hand GH_TOKEN only to the release lane and the pckg toolchain fetch")
if "windows_installer_owner_waiver_json" not in (publish.get("settings") or {}):
    Fail("release.yml:publish-release must pass the owner waiver to the dispatcher")

if failures:
    print("\n".join(f"FAIL: {failure}" for failure in failures), file=sys.stderr)
    sys.exit(1)
print("Woodpecker secret scope contract OK")
