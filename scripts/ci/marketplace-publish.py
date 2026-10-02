#!/usr/bin/env python3
"""Fail-closed publication of bounded tracked Marketplace derivatives."""
import argparse
import copy
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[2]
TOOL_ROOT = ROOT / "scripts/ci/marketplace-publisher"
PACKAGER_PATH = ROOT / "scripts/ci/package-marketplace-editor.py"
PACKAGER_SPEC = importlib.util.spec_from_file_location("package_marketplace_editor", PACKAGER_PATH)
PACKAGER = importlib.util.module_from_spec(PACKAGER_SPEC)
PACKAGER_SPEC.loader.exec_module(PACKAGER)
SOURCE_ELIGIBILITY = ROOT / "scripts/ci/release-publication-eligibility.mjs"

VERSION = "0.5.1"
PUBLISHER = "beskid-lang"
NAME = "beskid-vscode"
REPOSITORY = "Cyber-Nomad-Collective/beskid"
RELEASE_TAG = "editor-marketplace-v0.5.1"
APPROVED_SOURCE = copy.deepcopy(PACKAGER.APPROVED_SOURCE)
TARGETS = {
    "linux-x64": "beskid_lsp",
    "darwin-arm64": "beskid_lsp",
    "win32-x64": "beskid_lsp.exe",
}
DERIVATIVE_SHA256 = {
    "linux-x64": "62e1d1848f2f1b2f24e8e27941574bdb02a3fb5cd5bda68de99fc5a4d6121e08",
    "darwin-arm64": "d3f75acfb9fcf02ed25ea6dd28aaf8233ed982f34fc52be7f1e65276dd1b30c3",
    "win32-x64": "dad6f3102444f2a54280e403d297fd5fd1249b2e82c9e4d23de1af13d363b1d1",
}
APPROVAL_SHA256 = "c3b36a67ca1b46f44eac76c820e00a7d07f8da4b29e6521430868bdd4d0db031"
ORIGINAL_HOST_RECEIPT_SHA256 = "939d18476922eab366012e9eaaf835253ead8ac0831079cb5aeb8c82a4267ff4"
HOST_LSP_SHA256 = "ecfc68d921d4b9539f090eb2de221f4cc616177e52e1f166198ba45c9ed143d7"
FORMATTER_INPUT_SHA256 = "d1243e0f78b816cca2c583114321323e9dcaa80123b4a7ba4de803512ac716e7"
FORMATTER_OUTPUT_SHA256 = "d6e18e2695ad1261254d86d8f35a204c02dd3566fcc8fcc537e7efd2896f24b4"
HOST_QUALIFICATION_NAME = "marketplace-host-qualification.json"
ATTEMPT_RECEIPT_NAME = "marketplace-publication-attempt.json"
PUBLICATION_HOLD = ("0.5.1 is not publication-eligible: the qualified compiler/LSP does not preserve "
                    "Corelib intrinsic authority after relocation; require a new immutable version and approval")
HOST_CONTRACTS = {
    "0.5.1": {"target": "darwin-arm64", "lsp_sha256": HOST_LSP_SHA256,
              "input_sha256": FORMATTER_INPUT_SHA256, "output_sha256": FORMATTER_OUTPUT_SHA256},
    "0.5.2": {"target": "linux-x64",
              "lsp_sha256": "750443a35fb4623623230ff147f2610f52c826d0f17c2ded98a91370ec03ea9f",
              "input_sha256": "7fe52aa5d9a9f32c7eb046142f348ef55ab91afdb93e8aed7fb3851269ea282b",
              "output_sha256": "208a141dc9119b749d77c81c931bead1bc9a7168c95271397737867fb9f99b80",
              "host": {"platform": "linux", "arch": "x64", "vscode_version": "1.96.0"}},
}


def HostContract():
    # Version selection is the only selector; callers cannot override host provenance.
    return HOST_CONTRACTS[VERSION]


def AssetName(target):
    return f"beskid-vscode-{VERSION}-{target}-marketplace.vsix"


ASSETS = {AssetName(target): target for target in TARGETS}
EXPECTED_STAGE_NAMES = set(ASSETS) | {"marketplace-approval.json", HOST_QUALIFICATION_NAME}
PRODUCTION_CONTRACT = {
    "approval_sha256": APPROVAL_SHA256,
    "derivative_sha256": DERIVATIVE_SHA256,
    "assets": ASSETS,
    "original_host_receipt_sha256": ORIGINAL_HOST_RECEIPT_SHA256,
    "publication_enabled": False,
    "publication_hold": PUBLICATION_HOLD,
}


def SelectProductionVersion(version):
    # CLI selection is a finite tracked contract selector, never a path override.
    global VERSION, RELEASE_TAG, APPROVED_SOURCE, ASSETS, EXPECTED_STAGE_NAMES, PRODUCTION_CONTRACT, HOST_LSP_SHA256
    Require(version in ("0.5.1", "0.5.2"), "unsupported Marketplace publication version")
    if version == "0.5.1":
        Require(VERSION == version, "Marketplace version already selected")
        return
    original = PACKAGER.VERIFIER.SelectApproval(version)
    PACKAGER.VERIFIER.VerifyApproval(original)
    VERSION = version
    RELEASE_TAG = "editor-marketplace-v" + version
    APPROVED_SOURCE = copy.deepcopy(original["source"])
    ASSETS = {AssetName(target): target for target in TARGETS}
    EXPECTED_STAGE_NAMES = set(ASSETS) | {"marketplace-approval.json", HOST_QUALIFICATION_NAME}
    HOST_LSP_SHA256 = HostContract()["lsp_sha256"]
    Require(next(x["lsp_sha256"] for x in original["targets"]
                 if x["target"] == HostContract()["target"]) == HOST_LSP_SHA256,
            "approved host LSP differs from tracked host contract")
    PRODUCTION_CONTRACT = {
        "approval_sha256": "af4802cef95dde8ccbf5ac053ea7bed4eadde78e4929cd4962769c571fdc6b49",
        "derivative_sha256": {
            "linux-x64": "32919b50ad2655374029b3605c2c8ca8e5a0dab285273595536c522f0a28e658",
            "darwin-arm64": "737690292718278064802639154963cd0eb25dc34ed4ecc4ced244e6bab8cf0a",
            "win32-x64": "95a2d8feace8000a55b4ed394edb541c72506b1b70ca7dbec7656ba3cef55f0c",
        }, "assets": ASSETS,
        "original_host_receipt_sha256": "20f303b7df6bf20a6d714a2f4d2abd54894089a10b36b05629eebece9a29b142",
        "originals": copy.deepcopy(original["targets"]),
        "publication_enabled": False, "publication_hold": original["publication_hold"],
    }


def RequireQualification(contract):
    if VERSION == "0.5.2":
        Require(contract.get("publication_enabled") is True,
                contract.get("publication_hold") or "0.5.2 Marketplace qualifications pending")


def Require(condition, message):
    if not condition:
        raise ValueError(message)


def UtcNow():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def FileDigest(path, limit=PACKAGER.MAX_VSIX):
    Require(path.is_file() and not path.is_symlink(), "expected regular staged file: " + path.name)
    Require(path.stat().st_size <= limit, "staged file exceeds size bound: " + path.name)
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while block := source.read(1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def ReadJsonFile(path):
    FileDigest(path, PACKAGER.MAX_JSON)
    return PACKAGER.ReadJson(path.read_bytes())


def CheckSource(version, compiler_commit):
    environment = {key: os.environ[key] for key in ("PATH", "HOME", "SYSTEMROOT") if key in os.environ}
    result = subprocess.run(["node", str(SOURCE_ELIGIBILITY), "check-source", version, compiler_commit],
                            env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    message = result.stderr.strip()
    Require(result.returncode == 0, message if message.startswith("publication hold") else
            "publication source eligibility check failed")


def VerifyContext(context, allow_secret=False):
    Require(context.get("CI_PIPELINE_EVENT") == "manual", "Marketplace publication requires a manual pipeline")
    Require(context.get("CI_COMMIT_BRANCH") == "main", "Marketplace publication requires main")
    Require(context.get("CI_REPO") == REPOSITORY, "Marketplace publication requires the trusted root repository")
    Require(len(context.get("CI_COMMIT_SHA", "")) == 40 and
            all(c in "0123456789abcdef" for c in context["CI_COMMIT_SHA"]), "invalid checkout SHA")
    if not allow_secret:
        Require(not context.get("VSCE_PAT"), "preflight must not receive VSCE_PAT")


def Git(*args):
    environment = {key: os.environ[key] for key in ("PATH", "HOME", "SYSTEMROOT") if key in os.environ}
    result = subprocess.run(["git", "-C", str(ROOT), *args], env=environment, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True)
    Require(result.returncode == 0, "trusted source checkout verification failed")
    return result.stdout.strip()


def VerifyCheckout(context):
    VerifyContext(context, allow_secret=True)
    Require(Git("rev-parse", "--is-shallow-repository") == "false",
            "full trusted history is required; hydrate the verified origin before preflight")
    Require(Git("rev-parse", "HEAD") == context["CI_COMMIT_SHA"], "pipeline checkout SHA mismatch")
    Git("merge-base", "--is-ancestor", APPROVED_SOURCE["superrepo_commit"], "HEAD")
    Git("merge-base", "--is-ancestor", APPROVED_SOURCE["publisher_base_commit"], "HEAD")
    if VERSION == "0.5.2":
        native = APPROVED_SOURCE.get("native_superrepo_commit", "")
        Require(isinstance(native, str) and len(native) == 40 and all(c in "0123456789abcdef" for c in native),
                "invalid approved native source")
        for field in ("native_superrepo_commit", "superrepo_commit", "publisher_base_commit"):
            Require(Git("cat-file", "-t", APPROVED_SOURCE[field]) == "commit", "approved source pin is not a commit object")
        Git("merge-base", "--is-ancestor", native, APPROVED_SOURCE["superrepo_commit"])
        Require(Git("ls-tree", native, "--", "compiler") ==
                f"160000 commit {APPROVED_SOURCE['compiler_commit']}\tcompiler", "native compiler gitlink differs")
    for path, field in (("compiler", "compiler_commit"), ("beskid_vscode", "editor_commit")):
        tree = Git("ls-tree", APPROVED_SOURCE["superrepo_commit"], "--", path)
        Require(tree == f"160000 commit {APPROVED_SOURCE[field]}\t{path}",
                "approved source gitlink mismatch: " + path)


def VerifyApproval(approval, contract):
    Require(approval.get("schema_version") == 1 and approval.get("channel") == "marketplace" and
            approval.get("publisher") == PUBLISHER and approval.get("name") == NAME and
            approval.get("version") == VERSION and
            approval.get("formatter_self_id") == "beskid-lang.beskid-vscode",
            "unsupported Marketplace approval identity")
    Require(approval.get("source") == APPROVED_SOURCE, "Marketplace approval source pins differ")
    Require(approval.get("original_approval") == f"scripts/ci/editor-marketplace-approvals/{VERSION}.json",
            "Marketplace approval origin differs")
    entries = approval.get("targets", [])
    Require(len(entries) == len(TARGETS) and [entry.get("target") for entry in entries] == list(TARGETS),
            "Marketplace approval target set/order differs")
    for entry in entries:
        target = entry["target"]
        if VERSION == "0.5.2":
            original = next(x for x in contract["originals"] if x["target"] == target)
            Require(all(entry.get(field) == original[original_field] for field, original_field in (
                ("original_asset", "asset"), ("original_sha256", "sha256"), ("lsp_sha256", "lsp_sha256"),
                ("native_target", "native_target"), ("native_asset", "native_asset"))),
                "Marketplace original/native approval chain differs: " + target)
        Require(entry.get("version") == VERSION and entry.get("target_platform") == target and
                entry.get("derivative_asset") == AssetName(target) and
                entry.get("derivative_sha256") == contract["derivative_sha256"][target] and
                entry.get("identity") == "beskid-lang.beskid-vscode" and
                entry.get("non_metadata_inventory_equal") is True,
                "Marketplace target approval differs: " + target)
        for field in ("original_sha256", "lsp_sha256", "original_inventory_sha256",
                      "derivative_inventory_sha256"):
            Require(isinstance(entry.get(field), str) and len(entry[field]) == 64 and
                    all(c in "0123456789abcdef" for c in entry[field]),
                    "invalid Marketplace approval digest: " + target)
    return entries


def VerifyVsix(path, entry, contract):
    target = entry["target"]
    Require(FileDigest(path) == contract["derivative_sha256"][target],
            "Marketplace derivative digest mismatch: " + target)
    with zipfile.ZipFile(path) as archive:
        records = PACKAGER.Inventory(archive, target)
        Require(hashlib.sha256(json.dumps(records, sort_keys=True).encode()).hexdigest() ==
                entry["derivative_inventory_sha256"], "Marketplace derivative inventory differs: " + target)
        names = {item["name"] for item in records}
        Require({"extension/package.json", "extension.vsixmanifest"} <= names,
                "Marketplace derivative identity documents missing")
        package = PACKAGER.ReadJson(archive.read("extension/package.json"))
        Require(package.get("publisher") == PUBLISHER and package.get("name") == NAME and
                package.get("version") == VERSION, "Marketplace package identity differs: " + target)
        formatter = package.get("contributes", {}).get("configurationDefaults", {}).get("[beskid]", {}).get("editor.defaultFormatter")
        Require(formatter == "beskid-lang.beskid-vscode", "Marketplace formatter self-ID differs: " + target)
        PACKAGER.ParseManifest(archive.read("extension.vsixmanifest"), target, PUBLISHER, VERSION)
        server = f"extension/server/{target}/{TARGETS[target]}"
        Require(hashlib.sha256(archive.read(server)).hexdigest() == entry["lsp_sha256"],
                "Marketplace embedded LSP differs: " + target)


def VerifyHostQualification(qualification, approval, contract):
    host = HostContract()
    fields = {"schema_version", "kind", "status", "original_receipt_sha256",
              "marketplace_approval_sha256", "release", "source", "extension", "checks"}
    if VERSION == "0.5.2":
        fields.add("host")
        Require(qualification.get("host") == host["host"], "host qualification platform/version differs")
    Require(set(qualification) == fields,
            "host qualification fields differ")
    Require(qualification.get("schema_version") == 1 and
            qualification.get("kind") == "beskid-marketplace-local-host-qualification" and
            qualification.get("status") == "success", "host qualification did not succeed")
    Require(qualification.get("original_receipt_sha256") == (contract["original_host_receipt_sha256"]
            if VERSION == "0.5.2" else ORIGINAL_HOST_RECEIPT_SHA256),
            "host qualification original proof differs")
    Require(qualification.get("marketplace_approval_sha256") == contract["approval_sha256"] and
            qualification.get("source") == APPROVED_SOURCE, "host qualification source differs")
    Require(qualification.get("release") == {"repository": REPOSITORY, "tag": RELEASE_TAG,
                                               "source_commit": APPROVED_SOURCE["superrepo_commit"]},
            "host qualification release origin differs")
    extension = qualification.get("extension", {})
    entry = next(entry for entry in approval["targets"] if entry["target"] == host["target"])
    if VERSION == "0.5.2":
        Require(entry["lsp_sha256"] == host["lsp_sha256"], "host qualification LSP differs")
    Require(extension == {
        "id": "beskid-lang.beskid-vscode", "publisher": PUBLISHER, "name": NAME, "version": VERSION,
        "qualified_target": host["target"],
        "qualified_derivative_sha256": contract["derivative_sha256"][host["target"]],
        "target_set": list(TARGETS), "lsp_sha256": entry["lsp_sha256"],
    }, "host qualification extension evidence differs")
    checks = {
        "extension_active": True, "workspace_count": 0, "language_id": "beskid",
        "formatter_self_id": "beskid-lang.beskid-vscode", "formatter_edit_count": 4,
        "formatter_input_sha256": host["input_sha256"],
        "formatter_output_sha256": host["output_sha256"], "formatter_applied": True,
    }
    if VERSION == "0.5.2":
        checks["formatter_saved"] = True
    Require(qualification.get("checks") == checks, "strict formatter qualification differs")


def VerifyStage(stage, contract=None):
    contract = PRODUCTION_CONTRACT if contract is None else contract
    VerifyStageLayout(stage)
    approval_path = stage / "marketplace-approval.json"
    Require(FileDigest(approval_path, PACKAGER.MAX_JSON) == contract["approval_sha256"],
            "Marketplace approval receipt digest mismatch")
    approval = ReadJsonFile(approval_path)
    entries = VerifyApproval(approval, contract)
    for entry in entries:
        VerifyVsix(stage / entry["derivative_asset"], entry, contract)
    qualification = ReadJsonFile(stage / HOST_QUALIFICATION_NAME)
    VerifyHostQualification(qualification, approval, contract)
    return approval


def VerifyStageLayout(stage):
    PACKAGER.RejectSymlinkComponents(stage, "Marketplace stage")
    Require(stage.is_dir() and not stage.is_symlink(), "Marketplace stage is not a regular directory")
    Require(stat.S_IMODE(stage.stat().st_mode) & 0o077 == 0, "Marketplace stage must be private")
    Require({item.name for item in stage.iterdir()} == EXPECTED_STAGE_NAMES,
            "Marketplace stage contains missing or extra assets")
    for name in EXPECTED_STAGE_NAMES:
        FileDigest(stage / name)


def InitialAttempt(context, contract):
    return {
        "schema_version": 1, "task": "marketplace-publish", "release_tag": RELEASE_TAG,
        "version": VERSION, "publisher": PUBLISHER, "name": NAME,
        "checkout_sha": context.get("CI_COMMIT_SHA"), "source": APPROVED_SOURCE,
        "status": "preflight-running", "created_utc": UtcNow(),
        "publication_enabled": contract.get("publication_enabled") is True,
        "publication_hold": contract.get("publication_hold"),
        "targets": [{"target": target, "asset": AssetName(target),
                     "staged_sha256": contract["derivative_sha256"][target], "status": "not-attempted"}
                    for target in TARGETS],
        "hosted_bytes_sha256_verified": False,
    }


def WriteAttempt(attempt, record):
    path = attempt / ATTEMPT_RECEIPT_NAME
    temporary = attempt / (ATTEMPT_RECEIPT_NAME + ".tmp")
    temporary.write_text(json.dumps(record, indent=2) + "\n")
    temporary.replace(path)


def Preflight(stage, attempt, context, contract=None):
    contract = PRODUCTION_CONTRACT if contract is None else contract
    RequireQualification(contract)
    Require(not attempt.exists() and not attempt.is_symlink(), "publication attempt directory already exists")
    attempt.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    attempt.mkdir(mode=0o700)
    record = InitialAttempt(context, contract)
    WriteAttempt(attempt, record)
    try:
        VerifyContext(context)
        VerifyCheckout(context)
        VerifyStageLayout(stage)
        snapshot = attempt / "snapshot"
        snapshot.mkdir(mode=0o700)
        for name in sorted(EXPECTED_STAGE_NAMES):
            source = stage / name
            FileDigest(source)
            with source.open("rb") as reader, (snapshot / name).open("xb") as writer:
                shutil.copyfileobj(reader, writer, 1024 * 1024)
        VerifyStage(snapshot, contract)
        record["marketplace_approval_sha256"] = contract["approval_sha256"]
        record["original_host_receipt_sha256"] = (contract["original_host_receipt_sha256"]
            if VERSION == "0.5.2" else ORIGINAL_HOST_RECEIPT_SHA256)
        record["status"] = "preflight-passed"
        record["preflight_completed_utc"] = UtcNow()
        WriteAttempt(attempt, record)
        return record
    except Exception as error:
        record["status"] = "preflight-failed"
        record["failure"] = str(error) if isinstance(error, ValueError) else "invalid staged input"
        record["completed_utc"] = UtcNow()
        WriteAttempt(attempt, record)
        raise


def RunPublisher(argv, environment):
    result = subprocess.run(argv, cwd=TOOL_ROOT, env=environment, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, timeout=600)
    return result.returncode


def Publish(attempt, context, contract=None, runner=RunPublisher):
    contract = PRODUCTION_CONTRACT if contract is None else contract
    RequireQualification(contract)
    record = ReadJsonFile(attempt / ATTEMPT_RECEIPT_NAME)
    Require(record.get("status") == "preflight-passed", "publication attempt is not preflight-qualified")
    try:
        CheckSource(VERSION, APPROVED_SOURCE["compiler_commit"])
        VerifyContext(context, allow_secret=True)
        VerifyCheckout(context)
        Require(record.get("checkout_sha") == context["CI_COMMIT_SHA"], "publication checkout differs from preflight")
        if VERSION == "0.5.2":
            Require(record.get("source") == APPROVED_SOURCE, "publication attempt source differs from preflight")
        VerifyStage(attempt / "snapshot", contract)
        Require(contract.get("publication_enabled") is True,
                contract.get("publication_hold") or "Marketplace publication is not enabled")
        Require(bool(context.get("VSCE_PAT", "").strip()), "VSCE_PAT is missing")
        paths = [str(attempt / "snapshot" / AssetName(target)) for target in TARGETS]
        argv = ["npx", "--no-install", "@vscode/vsce", "publish", "--packagePath", *paths]
        environment = {key: os.environ[key] for key in ("PATH", "HOME", "SYSTEMROOT") if key in os.environ}
        environment.update({"VSCE_PAT": context["VSCE_PAT"], "CI": "true"})
        record["status"] = "publisher-running"
        record["publish_started_utc"] = UtcNow()
        WriteAttempt(attempt, record)
        code = runner(argv, environment)
        if code != 0:
            raise RuntimeError("Marketplace publisher failed; one or more targets may have been accepted")
        record["status"] = "published"
        record["targets"] = [dict(item, status="publisher-reported-success",
                                  marketplace_url="https://marketplace.visualstudio.com/items?itemName=beskid-lang.beskid-vscode")
                             for item in record["targets"]]
        record["completed_utc"] = UtcNow()
        WriteAttempt(attempt, record)
        return record
    except Exception as error:
        if record.get("status") == "publisher-running":
            record["status"] = "publisher-failed-possible-partial"
            record["targets"] = [dict(item, status="unconfirmed") for item in record["targets"]]
        else:
            record["status"] = "publish-blocked"
        record["failure"] = str(error) if isinstance(error, (ValueError, RuntimeError)) else "publication stopped"
        record["completed_utc"] = UtcNow()
        WriteAttempt(attempt, record)
        raise


def SanitizeHostReceipt(raw_path, approval_path, derivative_path, output, contract=None):
    contract = PRODUCTION_CONTRACT if contract is None else contract
    RequireQualification(contract)
    Require(not output.exists() and not output.is_symlink(), "sanitized host receipt output already exists")
    Require(FileDigest(raw_path, PACKAGER.MAX_JSON) == contract["original_host_receipt_sha256"],
            "original host receipt digest mismatch")
    raw = ReadJsonFile(raw_path)
    approval = ReadJsonFile(approval_path)
    Require(FileDigest(approval_path, PACKAGER.MAX_JSON) == contract["approval_sha256"],
            "Marketplace approval receipt digest mismatch")
    entries = VerifyApproval(approval, contract)
    host = HostContract()
    entry = next(entry for entry in entries if entry["target"] == host["target"])
    if VERSION == "0.5.2":
        Require(raw.get("source") == APPROVED_SOURCE and
                raw.get("derivative_sha256") == contract["derivative_sha256"][host["target"]],
                "original host proof does not bind the complete two-root source and derivative")
        Require(raw.get("qualified_target") == host["target"] and
                all(raw.get(field) == value for field, value in host["host"].items()) and
                raw.get("formatter_applied") is True and raw.get("formatter_saved") is True,
                "actual derivative host platform/version or applied/saved evidence differs")
        Require(entry["lsp_sha256"] == host["lsp_sha256"], "host qualification LSP differs")
        VerifyVsix(derivative_path, entry, contract)
    Require(FileDigest(derivative_path) == contract["derivative_sha256"][host["target"]],
            "host-qualified derivative digest mismatch")
    Require(raw.get("schema_version") == 1 and raw.get("status") == "success" and
            raw.get("source_commit") == APPROVED_SOURCE["superrepo_commit"] and
            raw.get("compiler_commit") == APPROVED_SOURCE["compiler_commit"] and
            raw.get("extension_id") == "beskid-lang.beskid-vscode" and raw.get("publisher") == PUBLISHER and
            raw.get("extension_version") == VERSION and raw.get("formatter_self_id") == "beskid-lang.beskid-vscode" and
            raw.get("server_sha256") == host["lsp_sha256"] and raw.get("extension_active") is True and
            raw.get("workspace_count") == 0 and raw.get("language_id") == "beskid" and
            raw.get("formatter_edit_count") == 4 and
            hashlib.sha256(raw.get("before", "").encode()).hexdigest() == host["input_sha256"] and
            hashlib.sha256(raw.get("after", "").encode()).hexdigest() == host["output_sha256"],
            "original strict formatter proof differs")
    result = {
        "schema_version": 1, "kind": "beskid-marketplace-local-host-qualification", "status": "success",
        "original_receipt_sha256": contract["original_host_receipt_sha256"],
        "marketplace_approval_sha256": contract["approval_sha256"],
        "release": {"repository": REPOSITORY, "tag": RELEASE_TAG,
                    "source_commit": APPROVED_SOURCE["superrepo_commit"]},
        "source": APPROVED_SOURCE,
        "extension": {"id": "beskid-lang.beskid-vscode", "publisher": PUBLISHER, "name": NAME,
                      "version": VERSION, "qualified_target": host["target"],
                      "qualified_derivative_sha256": contract["derivative_sha256"][host["target"]],
                      "target_set": list(TARGETS), "lsp_sha256": entry["lsp_sha256"]},
        "checks": {"extension_active": True, "workspace_count": 0, "language_id": "beskid",
                   "formatter_self_id": "beskid-lang.beskid-vscode", "formatter_edit_count": 4,
                   "formatter_input_sha256": host["input_sha256"],
                   "formatter_output_sha256": host["output_sha256"], "formatter_applied": True},
    }
    if VERSION == "0.5.2":
        result["host"] = copy.deepcopy(host["host"])
        result["checks"]["formatter_saved"] = True
    with output.open("x") as destination:
        destination.write(json.dumps(result, indent=2) + "\n")
    return result


def Main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", choices=("0.5.1", "0.5.2"), default="0.5.1")
    commands = parser.add_subparsers(dest="mode", required=True)
    preflight = commands.add_parser("preflight")
    preflight.add_argument("stage", type=Path)
    preflight.add_argument("attempt", type=Path)
    publish = commands.add_parser("publish")
    publish.add_argument("attempt", type=Path)
    sanitize = commands.add_parser("sanitize-host-receipt")
    sanitize.add_argument("raw", type=Path)
    sanitize.add_argument("approval", type=Path)
    sanitize.add_argument("derivative", type=Path)
    sanitize.add_argument("output", type=Path)
    args = parser.parse_args()
    SelectProductionVersion(args.version)
    RequireQualification(PRODUCTION_CONTRACT)
    if args.mode == "preflight":
        Preflight(args.stage, args.attempt, os.environ, PRODUCTION_CONTRACT)
    elif args.mode == "publish":
        Publish(args.attempt, os.environ, PRODUCTION_CONTRACT)
    else:
        SanitizeHostReceipt(args.raw, args.approval, args.derivative, args.output, PRODUCTION_CONTRACT)
    print("Marketplace " + args.mode + ": verified bounded " + VERSION + " publication route")


if __name__ == "__main__":
    try:
        Main()
    except Exception as error:
        print("Marketplace publisher: " + (str(error) if isinstance(error, (ValueError, RuntimeError)) else
              "invalid input or publisher failure; publication stopped"), file=sys.stderr)
        sys.exit(1)
