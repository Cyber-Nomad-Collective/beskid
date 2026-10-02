#!/usr/bin/env python3
"""Create a deterministic Marketplace-only derivative of approved VSIX files.

This is a channel-stage metadata transform. It never rebuilds the editor or
LSP, never changes the Open VSX approval, and accepts only the fixed
``beskid-lang`` Marketplace identity.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import stat
import sys
import xml.etree.ElementTree as ET
import zipfile


MAX_VSIX = 64 * 1024 * 1024
MAX_ENTRY = 128 * 1024 * 1024
MAX_INVENTORY = 256 * 1024 * 1024
MAX_JSON = 4 * 1024 * 1024
TARGETS = {
    "linux-x64": ("x86_64-unknown-linux-gnu", "beskid_lsp"),
    "darwin-arm64": ("aarch64-apple-darwin", "beskid_lsp"),
    "win32-x64": ("x86_64-pc-windows-msvc", "beskid_lsp.exe"),
}
DERIVATIVE_PUBLISHER = "beskid-lang"
APPROVED_SOURCE = {
    "superrepo_commit": "f064de92777d36c249424a18f92c91abd6f3e248",
    "compiler_commit": "1bd7bdee81d59ef14339e6a6c2ce18eb36585238",
    "editor_commit": "270cc2b4caec843516fa5ad684a6e1eb1d1608e6",
    "publisher_base_commit": "3179295444affc9a646a272c0a1ec677ce00acf5",
}


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


def Digest(data):
    return hashlib.sha256(data).hexdigest()


def FileDigest(path):
    Require(path.is_file() and not path.is_symlink(), "expected approved regular VSIX: " + str(path))
    Require(path.stat().st_size <= MAX_VSIX, "VSIX exceeds size bound: " + path.name)
    return Digest(path.read_bytes())


def RejectSymlinkComponents(path, label):
    absolute = path if path.is_absolute() else Path.cwd() / path
    current = Path(absolute.anchor)
    for component in absolute.parts[1:]:
        current /= component
        # macOS exposes the temporary directory through this system symlink;
        # user-controlled components below it are still checked individually.
        if str(current) in ("/var", "/tmp"):
            continue
        Require(not current.is_symlink(), label + " contains a symlink: " + str(current))


def SafeEntry(item):
    name = item.filename
    parts = name.rstrip("/").split("/")
    Require(item.orig_filename == name and 0 < len(name) <= 512 and not name.startswith("/") and
            "\\" not in name and all(x not in ("", ".", "..") and ":" not in x and
            not any(ord(c) < 32 for c in x) for x in parts), "unsafe ZIP path")
    mode = item.external_attr >> 16
    Require(stat.S_IFMT(mode) in (0, stat.S_IFREG, stat.S_IFDIR), "ZIP link or special file")
    Require(not item.is_dir() or name.endswith("/"), "invalid ZIP directory entry")
    Require(not (item.flag_bits & 1), "encrypted ZIP entry")
    Require(item.file_size <= MAX_ENTRY, "ZIP entry exceeds size bound")
    lowered = name.casefold()
    signed_name = lowered.endswith((".p7s", ".sig")) or lowered in {
        "signature", "signature.p7s", "package.signature", "package.signature.p7s",
    } or "/signature.p7s" in lowered or "/package.signature" in lowered
    Require(not signed_name,
            "signed VSIX archives are not accepted")


def Inventory(archive, target):
    items = archive.infolist()
    Require(0 < len(items) <= 10000, "invalid ZIP inventory size")
    names, total, records, servers = set(), 0, [], []
    expected_server = "extension/server/" + target + "/" + TARGETS[target][1]
    for item in items:
        SafeEntry(item)
        key = item.filename.casefold()
        Require(key not in names, "duplicate ZIP path")
        names.add(key)
        total += item.file_size
        Require(total <= MAX_INVENTORY, "ZIP inventory exceeds size bound")
        data = b"" if item.is_dir() else archive.read(item)
        record = {"name": item.filename, "size": len(data), "sha256": Digest(data)}
        records.append(record)
        if item.filename.startswith("extension/server/") and not item.is_dir():
            servers.append(item.filename)
            Require(item.filename == expected_server, "ZIP contains an unapproved server target or entry")
    Require(servers == [expected_server], "ZIP must contain exactly the approved LSP payload")
    return records


def ParseManifest(xml_bytes, target, publisher):
    Require(len(xml_bytes) <= 1024 * 1024, "unsafe VSIX XML")
    try:
        xml_text = xml_bytes.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValueError("unsafe VSIX XML") from error
    Require("<!DOCTYPE" not in xml_text.upper() and "<!ENTITY" not in xml_text.upper(), "unsafe VSIX XML")
    try:
        document = ET.fromstring(xml_text)
    except ET.ParseError as error:
        raise ValueError("malformed VSIX XML") from error
    identities = [element for element in document.iter() if element.tag.split("}")[-1] == "Identity"]
    Require(len(identities) == 1, "VSIX identity is not unique")
    identity = identities[0].attrib
    Require(identity.get("Publisher") == publisher and identity.get("Id") == "beskid-vscode" and
            identity.get("Version") == "0.5.1" and identity.get("TargetPlatform") == target,
            "VSIX identity/version/target mismatch")
    return identity


def InspectOriginal(path, entry):
    Require(FileDigest(path) == entry["sha256"], "approved original VSIX digest mismatch: " + entry["target"])
    expected_lsp = "extension/server/" + entry["target"] + "/" + TARGETS[entry["target"]][1]
    with zipfile.ZipFile(path) as archive:
        records = Inventory(archive, entry["target"])
        names = {item["name"] for item in records}
        Require({"extension/package.json", "extension.vsixmanifest"} <= names, "VSIX identity documents missing")
        package_bytes = archive.read("extension/package.json")
        Require(len(package_bytes) <= MAX_JSON, "package identity exceeds size bound")
        package = ReadJson(package_bytes)
        Require(package.get("publisher") == "beskid" and package.get("name") == "beskid-vscode" and
                package.get("version") == "0.5.1", "package identity/version mismatch")
        formatter = package.get("contributes", {}).get("configurationDefaults", {}).get("[beskid]", {}).get("editor.defaultFormatter")
        Require(formatter == "beskid.beskid-vscode", "original formatter self-ID mismatch")
        ParseManifest(archive.read("extension.vsixmanifest"), entry["target"], "beskid")
        lsp = archive.read(expected_lsp)
        Require(Digest(lsp) == entry["lsp_sha256"], "ZIP LSP identity/digest mismatch")
    return records


def ValidateApproval(approval):
    Require(approval.get("schema_version") == 1 and approval.get("version") == "0.5.1" and
            approval.get("publisher") == "beskid" and approval.get("name") == "beskid-vscode",
            "unsupported Open VSX approval identity")
    for field in ("superrepo_commit", "compiler_commit", "editor_commit", "publisher_base_commit"):
        Require(re.fullmatch(r"[0-9a-f]{40}", approval.get("source", {}).get(field, "")), "invalid source pin")
    Require(approval["source"] == APPROVED_SOURCE, "approval source pins are not the approved 0.5.1 pins")
    entries = approval.get("targets", [])
    Require(len(entries) == 3 and {x.get("target") for x in entries} == set(TARGETS), "incomplete approved target set")
    for entry in entries:
        Require(entry.get("asset") == "beskid-vscode-0.5.1-" + entry["target"] + ".vsix", "approved asset name mismatch")
        Require(entry.get("native_target") == TARGETS[entry["target"]][0] and
                entry.get("native_asset") == "beskid_lsp-" + {
                    "linux-x64": "linux-amd64", "darwin-arm64": "darwin-arm64",
                    "win32-x64": "windows-amd64.exe",
                }[entry["target"]], "approved native target mismatch")
        for field in ("sha256", "lsp_sha256"):
            Require(re.fullmatch(r"[0-9a-f]{64}", entry.get(field, "")), "invalid approved digest")
    return entries


def DerivativePackage(package):
    result = json.loads(json.dumps(package))
    result["publisher"] = DERIVATIVE_PUBLISHER
    defaults = result.get("contributes", {}).get("configurationDefaults", {})
    formatter = defaults.get("[beskid]", {}).get("editor.defaultFormatter")
    Require(formatter == "beskid.beskid-vscode", "formatter self-ID is missing or already migrated")
    defaults["[beskid]"]["editor.defaultFormatter"] = DERIVATIVE_PUBLISHER + ".beskid-vscode"
    return result


def WriteDerivative(source, destination, target):
    with zipfile.ZipFile(source) as original, zipfile.ZipFile(destination, "w", allowZip64=False) as derivative:
        for item in original.infolist():
            info = zipfile.ZipInfo(item.filename, date_time=(1980, 1, 1, 0, 0, 0))
            info.comment, info.extra, info.internal_attr, info.external_attr = item.comment, item.extra, item.internal_attr, item.external_attr
            info.create_system, info.create_version, info.extract_version, info.flag_bits = item.create_system, item.create_version, item.extract_version, item.flag_bits
            info.compress_type = item.compress_type
            data = original.read(item)
            if item.filename == "extension/package.json":
                data = (json.dumps(DerivativePackage(ReadJson(data)), indent=2, ensure_ascii=False) + "\n").encode()
            elif item.filename == "extension.vsixmanifest":
                xml = original.read(item)
                xml, replacements = re.subn(
                    rb'(<(?:[A-Za-z_][\w.-]*:)?Identity\b[^>]*\bPublisher=")beskid(")',
                    rb'\1beskid-lang\2', xml, count=1)
                Require(replacements == 1, "VSIX identity publisher field is missing or ambiguous")
                ParseManifest(xml, target, DERIVATIVE_PUBLISHER)
                data = xml
            derivative.writestr(info, data)


def Package(originals, approval_path, output):
    RejectSymlinkComponents(originals, "originals path")
    RejectSymlinkComponents(approval_path, "approval path")
    RejectSymlinkComponents(output, "output path")
    Require(not output.exists() and not output.is_symlink(), "derivative output must not already exist")
    Require(originals.is_dir() and not originals.is_symlink(), "original VSIX directory is missing")
    approval = ReadJson(approval_path.read_bytes())
    entries = ValidateApproval(approval)
    output.mkdir(mode=0o700)
    result = {"schema_version": 1, "channel": "marketplace", "publisher": DERIVATIVE_PUBLISHER,
              "name": "beskid-vscode", "version": "0.5.1", "formatter_self_id": "beskid-lang.beskid-vscode",
              "source": approval["source"], "original_approval": str(approval_path), "targets": []}
    try:
        for entry in entries:
            source = originals / entry["asset"]
            original_inventory = InspectOriginal(source, entry)
            derivative_asset = entry["asset"].replace(".vsix", "-marketplace.vsix")
            destination = output / derivative_asset
            WriteDerivative(source, destination, entry["target"])
            with zipfile.ZipFile(destination) as archive:
                derivative_inventory = Inventory(archive, entry["target"])
                package = ReadJson(archive.read("extension/package.json"))
                Require(package["publisher"] == DERIVATIVE_PUBLISHER and package["version"] == "0.5.1",
                        "derivative package identity mismatch")
                ParseManifest(archive.read("extension.vsixmanifest"), entry["target"], DERIVATIVE_PUBLISHER)
                lsp = archive.read("extension/server/" + entry["target"] + "/" + TARGETS[entry["target"]][1])
                Require(Digest(lsp) == entry["lsp_sha256"], "derivative LSP digest mismatch")
            original_payloads = {item["name"]: item for item in original_inventory
                                 if item["name"] not in {"extension/package.json", "extension.vsixmanifest"}}
            derivative_payloads = {item["name"]: item for item in derivative_inventory
                                   if item["name"] not in {"extension/package.json", "extension.vsixmanifest"}}
            Require(original_payloads == derivative_payloads,
                    "non-metadata ZIP inventory differs between original and derivative")
            result["targets"].append({"target": entry["target"], "version": "0.5.1", "target_platform": entry["target"],
                "original_asset": entry["asset"], "original_sha256": entry["sha256"], "derivative_asset": derivative_asset,
                "derivative_sha256": FileDigest(destination), "lsp_sha256": entry["lsp_sha256"],
                "original_inventory_sha256": Digest(json.dumps(original_inventory, sort_keys=True).encode()),
                "derivative_inventory_sha256": Digest(json.dumps(derivative_inventory, sort_keys=True).encode()),
                "non_metadata_inventory_equal": True, "identity": "beskid-lang.beskid-vscode", "native_target": entry["native_target"],
                "native_asset": entry["native_asset"]})
    except Exception:
        for child in output.iterdir():
            child.unlink()
        output.rmdir()
        raise
    (output / "marketplace-approval.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


def Main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("originals", type=Path)
    parser.add_argument("approval", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    Package(args.originals, args.approval, args.output)
    print("Marketplace-only derivative package: verified 0.5.1 complete target set")


if __name__ == "__main__":
    try:
        Main()
    except Exception as error:
        print("Marketplace derivative packaging: " + (str(error) if isinstance(error, ValueError) else
              "invalid archive or approval; packaging stopped"), file=sys.stderr)
        sys.exit(1)
