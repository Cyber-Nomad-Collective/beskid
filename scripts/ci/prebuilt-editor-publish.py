#!/usr/bin/env python3
"""Verify frozen editor/native archives and publish only prebuilt Open VSX files.

No archive is extracted and no extension or native payload is executed. The only
production approval records are the bounded tracked JSONs beside this script.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
APPROVAL = ROOT / "scripts/ci/editor-marketplace-approvals/0.5.1.json"
SOURCE_HISTORY = ROOT / "scripts/ci/woodpecker-source-history.sh"
SOURCE_ELIGIBILITY = ROOT / "scripts/ci/release-publication-eligibility.mjs"
TARGETS = {
    "linux-x64": ("x86_64-unknown-linux-gnu", "beskid_lsp"),
    "darwin-arm64": ("aarch64-apple-darwin", "beskid_lsp"),
    "win32-x64": ("x86_64-pc-windows-msvc", "beskid_lsp.exe"),
}
NATIVE_ASSETS = {
    "linux-x64": "beskid_lsp-linux-amd64",
    "darwin-arm64": "beskid_lsp-darwin-arm64",
    "win32-x64": "beskid_lsp-windows-amd64.exe",
}
MAX_VSIX = 64 * 1024 * 1024
MAX_ENTRY = 128 * 1024 * 1024
MAX_INVENTORY = 256 * 1024 * 1024
MAX_JSON = 4 * 1024 * 1024
REGISTRY = "https://open-vsx.org"


def Require(condition, message):
    if not condition:
        raise ValueError(message)


def UniqueObject(pairs):
    result = {}
    for key, value in pairs:
        Require(key not in result, "duplicate JSON field")
        result[key] = value
    return result


def ReadJson(data):
    Require(len(data) <= MAX_JSON, "JSON exceeds size bound")
    return json.loads(data, object_pairs_hook=UniqueObject)


def CheckSource(version, compiler_commit):
    environment = {key: os.environ[key] for key in ("PATH", "HOME", "SYSTEMROOT") if key in os.environ}
    result = subprocess.run(["node", str(SOURCE_ELIGIBILITY), "check-source", version, compiler_commit],
                            env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    message = result.stderr.strip()
    Require(result.returncode == 0, message if message.startswith("publication hold") else
            "publication source eligibility check failed")


def StreamDigest(file, limit):
    digest, size = hashlib.sha256(), 0
    while True:
        block = file.read(1024 * 1024)
        if not block:
            break
        size += len(block)
        Require(size <= limit, "content exceeds size bound")
        digest.update(block)
    return digest.hexdigest()


def FileDigest(path, limit):
    Require(path.is_file() and not path.is_symlink(), "expected regular file: " + path.name)
    Require(path.stat().st_size <= limit, "file exceeds size bound: " + path.name)
    with path.open("rb") as file:
        return StreamDigest(file, limit)


def SelectApproval(version):
    Require(version in ("0.5.1", "0.5.2"), "unsupported editor publication version")
    return ReadJson((APPROVAL.parent / (version + ".json")).read_bytes())


def RequireQualification(approval):
    if approval["version"] == "0.5.2":
        Require(approval.get("publication_enabled") is True,
                approval.get("publication_hold") or "0.5.2 publication qualifications are pending")


def VerifyApproval(approval):
    version = approval.get("version")
    Require(approval.get("schema_version") == 1 and version in ("0.5.1", "0.5.2") and
            approval.get("publisher") == "beskid" and approval.get("name") == "beskid-vscode",
            "unsupported approval identity")
    source = approval["source"]
    for field in ("superrepo_commit", "compiler_commit", "editor_commit", "publisher_base_commit"):
        Require(re.fullmatch(r"[0-9a-f]{40}", source.get(field, "")), "invalid approved source")
    if version == "0.5.2":
        Require(re.fullmatch(r"[0-9a-f]{40}", source.get("native_superrepo_commit", "")),
                "invalid approved native source")
    entries = approval["targets"]
    Require(len(entries) == 3 and {x["target"] for x in entries} == set(TARGETS), "incomplete approved target set")
    for entry in entries:
        target = entry["target"]
        Require(entry["native_target"] == TARGETS[target][0], "approved native target mismatch")
        Require(entry["asset"] == "beskid-vscode-" + version + "-" + target + ".vsix", "approved asset name mismatch")
        Require(entry["native_asset"] == NATIVE_ASSETS[target], "approved native LSP name mismatch")
        for field in ("sha256", "lsp_sha256"):
            Require(re.fullmatch(r"[0-9a-f]{64}", entry.get(field, "")), "invalid approved digest")
    Require(approval["editor_release"] == {"repository": "Cyber-Nomad-Collective/beskid", "tag": "editor-v" + version},
            "unapproved editor release origin")
    Require(approval["native_release"] == {"repository": "Cyber-Nomad-Collective/beskid_compiler", "tag": "lsp-v" + version},
            "unapproved native release origin")


def VerifySource(approval, root):
    source = approval["source"]
    def Git(*args):
        env = {k: os.environ[k] for k in ("PATH", "HOME", "SYSTEMROOT") if k in os.environ}
        result = subprocess.run(["git", "-C", str(root), *args], env=env, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, text=True)
        Require(result.returncode == 0, "approved source is unavailable or not an ancestor")
        return result.stdout.strip()
    history = subprocess.run(["bash", str(SOURCE_HISTORY), str(root)],
                             env={k: os.environ[k] for k in ("PATH", "HOME", "SYSTEMROOT") if k in os.environ},
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    Require(history.returncode == 0, "approved source history could not be hydrated")
    if approval["version"] == "0.5.2":
        for field in ("native_superrepo_commit", "superrepo_commit", "publisher_base_commit"):
            Require(Git("cat-file", "-t", source[field]) == "commit", "approved source pin is not a commit object")
    Git("merge-base", "--is-ancestor", source["superrepo_commit"], "HEAD")
    Git("merge-base", "--is-ancestor", source["publisher_base_commit"], "HEAD")
    if approval["version"] == "0.5.2":
        native = source["native_superrepo_commit"]
        Git("merge-base", "--is-ancestor", native, source["superrepo_commit"])
        Require(Git("ls-tree", native, "--", "compiler") ==
                "160000 commit " + source["compiler_commit"] + "\tcompiler",
                "approved native source gitlink mismatch: compiler")
    for path, field in (("compiler", "compiler_commit"), ("beskid_vscode", "editor_commit")):
        tree = Git("ls-tree", source["superrepo_commit"], "--", path)
        Require(tree == "160000 commit " + source[field] + "\t" + path, "approved source gitlink mismatch: " + path)


def VerifyVsix(file, entry, approval):
    Require(FileDigest(file, MAX_VSIX) == entry["sha256"], "VSIX digest mismatch: " + entry["target"])
    return InspectVsix(file, entry, approval)


def InspectVsix(file, entry, approval):
    expected_server = "extension/server/" + entry["target"] + "/" + TARGETS[entry["target"]][1]
    with zipfile.ZipFile(file) as archive:
        inventory = archive.infolist()
        Require(0 < len(inventory) <= 10000, "invalid ZIP inventory size")
        names, total, servers = set(), 0, []
        for item in inventory:
            name = item.filename
            parts = name.rstrip("/").split("/")
            Require(item.orig_filename == name and len(name) <= 512 and name and not name.startswith("/") and "\\" not in name and
                    all(x not in ("", ".", "..") and ":" not in x and
                        not any(ord(c) < 32 for c in x) for x in parts), "unsafe ZIP path")
            Require(name.casefold() not in names, "duplicate ZIP path")
            names.add(name.casefold())
            mode = item.external_attr >> 16
            Require(stat.S_IFMT(mode) in (0, stat.S_IFREG, stat.S_IFDIR), "ZIP link or special file")
            Require(not (item.flag_bits & 1), "encrypted ZIP entry")
            Require(item.file_size <= MAX_ENTRY, "ZIP entry exceeds size bound")
            total += item.file_size
            Require(total <= MAX_INVENTORY, "ZIP inventory exceeds size bound")
            if name.startswith("extension/server/"):
                Require(name in ("extension/server/", "extension/server/" + entry["target"] + "/", expected_server),
                        "ZIP contains an unapproved server target or entry")
            if not item.is_dir():
                # Read every entry to validate ZIP structure, decompression bounds and CRC.
                with archive.open(item) as content:
                    digest = StreamDigest(content, MAX_ENTRY)
                if name.startswith("extension/server/"):
                    servers.append(name)
                    Require(name == expected_server and digest == entry["lsp_sha256"], "ZIP LSP identity/digest mismatch")
        Require(servers == [expected_server], "ZIP must contain exactly the approved LSP payload")
        Require("extension/package.json" in archive.namelist() and "extension.vsixmanifest" in archive.namelist(),
                "ZIP identity documents missing")
        Require(archive.getinfo("extension/package.json").file_size <= MAX_JSON, "package identity exceeds size bound")
        Require(archive.getinfo("extension.vsixmanifest").file_size <= 1024 * 1024, "VSIX XML exceeds size bound")
        package = ReadJson(archive.read("extension/package.json"))
        Require(all(package.get(k) == approval[k] for k in ("publisher", "name", "version")), "package identity mismatch")
        xml = archive.read("extension.vsixmanifest")
        Require(len(xml) <= 1024 * 1024 and b"<!DOCTYPE" not in xml.upper() and b"<!ENTITY" not in xml.upper(),
                "unsafe VSIX XML")
        document = ET.fromstring(xml)
        identities = [element for element in document.iter() if element.tag.split("}")[-1] == "Identity"]
        Require(len(identities) == 1, "VSIX identity is not unique")
        identity = identities[0].attrib
        Require(all(identity.get(k) == value for k, value in {
            "Publisher": approval["publisher"], "Id": approval["name"], "Version": approval["version"],
            "TargetPlatform": entry["target"],
        }.items()), "VSIX XML identity/target mismatch")
    return str(file)


def VerifyNative(approval, directory):
    FileDigest(directory / "release-state.json", MAX_JSON)
    state = ReadJson((directory / "release-state.json").read_bytes())
    source = approval["source"]
    Require(state.get("schema_version") == 1 and state.get("version") == approval["version"] and
            state.get("channel") == "stable" and state.get("publishable") is True,
            "native release is not qualified")
    FileDigest(directory / "lsp-version.txt", 32)
    version = approval["version"].encode()
    Require((directory / "lsp-version.txt").read_bytes() in (version, version + b"\n"), "native LSP stream version mismatch")
    native_root = source["native_superrepo_commit"] if approval["version"] == "0.5.2" else source["superrepo_commit"]
    Require(state.get("provenance", {}).get("superrepo_commit") == native_root and
            state.get("provenance", {}).get("compiler_commit") == source["compiler_commit"], "native source mismatch")
    Require(state.get("tests", {}).get("gate_result") == "success" and state["tests"].get("failed") == [] and
            state.get("failed_platform_builds") == [], "native gates failed")
    expected_targets = {x[0] for x in TARGETS.values()}
    Require(len(state.get("complete_platforms", [])) == 3 and set(state["complete_platforms"]) == expected_targets,
            "native release target set incomplete")
    platforms = state.get("platforms", [])
    Require(len(platforms) == 3 and {x["target"] for x in platforms} == expected_targets, "native platform set mismatch")
    for entry in approval["targets"]:
        platform = next(x for x in platforms if x["target"] == entry["native_target"])
        Require(platform.get("builds", {}).get("lsp", {}).get("status") == "success" and
                platform["builds"]["lsp"].get("asset") == entry["native_asset"], "native LSP build identity mismatch")
        VerifyNativeLsp(directory / entry["native_asset"], entry)


def VerifyNativeLsp(file, entry):
    Require(FileDigest(file, MAX_ENTRY) == entry["lsp_sha256"], "standalone native LSP digest mismatch")
    return str(file)


def VerifyRelease(approval, editors, native, root):
    VerifyApproval(approval)
    VerifySource(approval, root)
    for directory in (editors, native):
        Require(directory.is_dir() and not directory.is_symlink(), "expected owned archive directory")
    Require({x.name for x in editors.iterdir()} == {x["asset"] for x in approval["targets"]},
            "VSIX target set is incomplete or contains extra files")
    VerifyNative(approval, native)
    return [VerifyVsix(editors / x["asset"], x, approval) for x in approval["targets"]]


def VerifyContext(context, root):
    Require(context.get("CI_PIPELINE_EVENT") == "manual" and context.get("CI_COMMIT_BRANCH") == "main" and
            context.get("CI_REPO") == "Cyber-Nomad-Collective/beskid" and
            context.get("BESKID_TASK") == "editor-publish", "publication requires the trusted Woodpecker editor-publish task")
    expected = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], check=True,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True).stdout.strip()
    Require(re.fullmatch(r"[0-9a-f]{40}", context.get("CI_COMMIT_SHA", "")) and
            context.get("CI_COMMIT_SHA") == expected, "publication commit does not match the checked-out root HEAD")


def Request(url, limit, missing=False):
    Require(url.startswith("https://"), "HTTPS is required")
    request = urllib.request.Request(url, headers={"User-Agent": "beskid-frozen-editor-publisher",
                                                  "Accept": "application/vnd.github+json" if url.startswith("https://api.github.com/") else "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read(limit + 1)
            Require(len(data) <= limit, "remote content exceeds size bound")
            return data
    except urllib.error.HTTPError as error:
        if missing and error.code == 404:
            return None
        raise ValueError("remote read failed with HTTP " + str(error.code)) from None


def RegistryPackage(entry, approval):
    url = REGISTRY + "/api/beskid/beskid-vscode/" + entry["target"] + "/" + approval["version"]
    data = Request(url, MAX_JSON, missing=True)
    if data is None:
        return None
    metadata = ReadJson(data)
    Require(metadata.get("namespace") == approval["publisher"] and metadata.get("name") == approval["name"] and
            metadata.get("version") == approval["version"] and metadata.get("targetPlatform") == entry["target"],
            "registry version/target metadata mismatch")
    url = metadata.get("files", {}).get("download", "")
    Require(urllib.parse.urlparse(url).scheme == "https" and urllib.parse.urlparse(url).netloc == "open-vsx.org",
            "unapproved registry download origin")
    return Request(url, MAX_VSIX)


def VerifyRegistryPackage(data, entry, approval):
    Require(data is not None, "published registry target is missing")
    Require(hashlib.sha256(data).hexdigest() == entry["sha256"],
            "registry package bytes differ; investigate signing or existing publication before resuming")
    InspectVsix(io.BytesIO(data), entry, approval)


def Upload(argv, env):
    result = subprocess.run(argv, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300)
    # Do not echo CLI output: a transport error may include sensitive request data.
    if result.returncode != 0:
        raise RuntimeError("Open VSX upload failed; inspect the public target before resuming")


def Publish(approval, editors, native, root, context, ovsx, results_file, read_registry=None, upload=Upload):
    VerifyApproval(approval)
    CheckSource(approval["version"], approval["source"]["compiler_commit"])
    RequireQualification(approval)
    VerifyContext(context, root)
    VerifyRelease(approval, editors, native, root)
    Require(bool(context.get("OVSX_PAT", "").strip()), "OVSX_PAT is missing")
    read_registry = read_registry or (lambda entry: RegistryPackage(entry, approval))
    existing = {}
    # Preflight the entire public target set before the first mutation.
    for entry in approval["targets"]:
        data = read_registry(entry)
        if data is not None:
            VerifyRegistryPackage(data, entry, approval)
        existing[entry["target"]] = data is not None
    results = []
    env = {k: os.environ[k] for k in ("PATH", "HOME", "SYSTEMROOT") if k in os.environ}
    env.update({"OVSX_PAT": context["OVSX_PAT"], "OVSX_REGISTRY_URL": REGISTRY, "CI": "true"})
    for entry in approval["targets"]:
        record = {"target": entry["target"], "sha256": entry["sha256"], "status": "failed"}
        try:
            if existing[entry["target"]]:
                record["status"] = "existing-verified"
            else:
                # Recheck immediately before upload; never invoke packaging/source commands.
                file = editors / entry["asset"]
                VerifyVsix(file, entry, approval)
                upload([str(ovsx), "publish", str(file)], env)
                VerifyRegistryPackage(read_registry(entry), entry, approval)
                record["status"] = "published"
        finally:
            results.append(record)
            results_file.write_text(json.dumps(results, indent=2) + "\n")
    return results


def ReleaseMetadata(record, expected_commit):
    base = "https://api.github.com/repos/" + record["repository"]
    metadata = ReadJson(Request(base + "/releases/tags/" + record["tag"], MAX_JSON))
    Require(metadata.get("tag_name") == record["tag"] and not metadata.get("draft") and not metadata.get("prerelease"),
            "release is not the approved stable tag")
    ref = ReadJson(Request(base + "/git/ref/tags/" + record["tag"], MAX_JSON))["object"]
    for _ in range(8):
        if ref.get("type") == "commit":
            break
        Require(ref.get("type") == "tag" and re.fullmatch(r"[0-9a-f]{40}", ref.get("sha", "")), "invalid tag object")
        ref = ReadJson(Request(base + "/git/tags/" + ref["sha"], MAX_JSON))["object"]
    Require(ref.get("type") == "commit" and ref.get("sha") == expected_commit, "immutable release source mismatch")
    assets = metadata.get("assets", [])
    Require(len({x["name"] for x in assets}) == len(assets), "duplicate release assets")
    return {x["name"]: x for x in assets}


def DownloadAsset(record, assets, name, path, limit, expected_digest=None):
    Require(name in assets, "required immutable release asset missing: " + name)
    asset = assets[name]
    Require(asset.get("state") == "uploaded" and 0 < asset.get("size", 0) <= limit, "invalid release asset metadata")
    digest = asset.get("digest", "")
    Require(isinstance(digest, str) and re.fullmatch(r"sha256:[0-9a-f]{64}", digest), "release asset SHA-256 missing")
    if expected_digest:
        Require(digest == "sha256:" + expected_digest, "release asset digest differs from reviewed approval")
    url = "https://github.com/" + record["repository"] + "/releases/download/" + record["tag"] + "/" + name
    # Stream to an exclusive file inside the newly created owned snapshot.
    with urllib.request.urlopen(url, timeout=60) as response, path.open("xb") as file:
        total = 0
        while True:
            block = response.read(1024 * 1024)
            if not block:
                break
            total += len(block)
            Require(total <= limit, "release asset exceeds size bound")
            file.write(block)
    Require(total == asset["size"] and FileDigest(path, limit) == digest[7:], "downloaded release asset digest/size mismatch")


def Prepare(approval, snapshot, root, context):
    VerifyApproval(approval)
    CheckSource(approval["version"], approval["source"]["compiler_commit"])
    RequireQualification(approval)
    VerifyContext(context, root)
    VerifySource(approval, root)
    Require(not context.get("OVSX_PAT") and not context.get("OVSX_TOKEN"), "preparation must not receive publisher credentials")
    snapshot.mkdir(mode=0o700)
    editors, native = snapshot / "editors", snapshot / "native"
    editors.mkdir(mode=0o700)
    native.mkdir(mode=0o700)
    editor_record, native_record = approval["editor_release"], approval["native_release"]
    editor_assets = ReleaseMetadata(editor_record, approval["source"]["superrepo_commit"])
    native_assets = ReleaseMetadata(native_record, approval["source"]["compiler_commit"])
    Require(set(editor_assets) == {x["asset"] for x in approval["targets"]}, "editor release contains an unapproved asset set")
    DownloadAsset(native_record, native_assets, "release-state.json", native / "release-state.json", MAX_JSON)
    DownloadAsset(native_record, native_assets, "lsp-version.txt", native / "lsp-version.txt", 32)
    for entry in approval["targets"]:
        DownloadAsset(editor_record, editor_assets, entry["asset"], editors / entry["asset"], MAX_VSIX, entry["sha256"])
        DownloadAsset(native_record, native_assets, entry["native_asset"], native / entry["native_asset"], MAX_ENTRY, entry["lsp_sha256"])
    VerifyRelease(approval, editors, native, root)


def Main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "verify", "publish"))
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--ovsx", type=Path)
    parser.add_argument("--version", choices=("0.5.1", "0.5.2"), default="0.5.1")
    args = parser.parse_args()
    approval = SelectApproval(args.version)
    RequireQualification(approval)
    snapshot = args.snapshot.resolve()
    if args.mode == "prepare":
        Prepare(approval, snapshot, ROOT, os.environ)
    elif args.mode == "verify":
        VerifyRelease(approval, snapshot / "editors", snapshot / "native", ROOT)
    else:
        Require(args.ovsx is not None and args.ovsx.is_absolute(), "absolute pinned ovsx executable is required")
        Publish(approval, snapshot / "editors", snapshot / "native", ROOT, os.environ,
                args.ovsx, snapshot / "publish-results.json")
    print("prebuilt editor " + args.mode + ": verified " + args.version + " complete target set")


if __name__ == "__main__":
    try:
        Main()
    except Exception as error:
        # Validation messages contain public names only; never emit transport/CLI exceptions.
        print("prebuilt editor publisher: " + (str(error) if isinstance(error, (ValueError, RuntimeError)) else
              "invalid archive, source, or transport; publication stopped"), file=sys.stderr)
        sys.exit(1)
