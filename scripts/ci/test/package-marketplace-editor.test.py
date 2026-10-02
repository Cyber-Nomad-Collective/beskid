#!/usr/bin/env python3
"""Tests for the bounded Marketplace-only VSIX derivative packager."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile


SCRIPT = Path(__file__).resolve().parents[1] / "package-marketplace-editor.py"
SPEC = importlib.util.spec_from_file_location("package_marketplace_editor", SCRIPT)
API = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(API)


class MarketplacePackagerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="beskid-marketplace-test-")
        self.root = Path(self.tmp.name)
        self.originals = self.root / "originals"
        self.originals.mkdir()
        self.approval = self.root / "0.5.1.json"
        self.targets = []
        for target, native in (
            ("linux-x64", "beskid_lsp"),
            ("darwin-arm64", "beskid_lsp"),
            ("win32-x64", "beskid_lsp.exe"),
        ):
            payload = f"native-{target}".encode()
            asset = f"beskid-vscode-0.5.1-{target}.vsix"
            self._write_vsix(self.originals / asset, target, native, payload)
            self.targets.append({
                "target": target,
                "native_target": {"linux-x64": "x86_64-unknown-linux-gnu", "darwin-arm64": "aarch64-apple-darwin",
                                  "win32-x64": "x86_64-pc-windows-msvc"}[target],
                "asset": asset,
                "sha256": self._digest(self.originals / asset),
                "lsp_sha256": hashlib.sha256(payload).hexdigest(),
                "native_asset": {"linux-x64": "beskid_lsp-linux-amd64", "darwin-arm64": "beskid_lsp-darwin-arm64",
                                 "win32-x64": "beskid_lsp-windows-amd64.exe"}[target],
            })
        self.approval.write_text(json.dumps({
            "schema_version": 1, "version": "0.5.1", "publisher": "beskid", "name": "beskid-vscode",
            "source": {field: "a" * 40 for field in (
                "superrepo_commit", "compiler_commit", "editor_commit", "publisher_base_commit")},
            "editor_release": {"repository": "fixture/editor", "tag": "editor-v0.5.1"},
            "native_release": {"repository": "fixture/native", "tag": "lsp-v0.5.1"},
            "targets": self.targets,
        }, indent=2) + "\n")

    def tearDown(self):
        self.tmp.cleanup()

    @staticmethod
    def _digest(path):
        return hashlib.sha256(path.read_bytes()).hexdigest()

    @staticmethod
    def _write_vsix(path, target, native, payload, extra=None, signature=False):
        package = {
            "name": "beskid-vscode", "publisher": "beskid", "version": "0.5.1",
            "description": "fixture", "contributes": {"configurationDefaults": {
                "[beskid]": {"editor.defaultFormatter": "beskid.beskid-vscode"}}},
        }
        manifest = (f'<PackageManifest><Metadata><Identity Publisher="beskid" Id="beskid-vscode" '
                    f'Version="0.5.1" TargetPlatform="{target}"/></Metadata></PackageManifest>').encode()
        with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("extension/package.json", json.dumps(package, indent=2).encode())
            archive.writestr("extension.vsixmanifest", manifest)
            archive.writestr(f"extension/server/{target}/{native}", payload)
            archive.writestr("extension/unchanged.bin", b"preserve-this-byte-stream")
            for name, data in extra or []:
                archive.writestr(name, data)
            if signature:
                archive.writestr("extension/signature.p7s", b"signature")

    def test_derivative_changes_only_marketplace_identity_and_emits_receipt(self):
        output = self.root / "derivatives"
        receipt = API.Package(self.originals, self.approval, output)
        self.assertEqual(receipt["channel"], "marketplace")
        self.assertEqual(receipt["publisher"], "beskid-lang")
        self.assertEqual(len(receipt["targets"]), 3)
        for item in receipt["targets"]:
            with zipfile.ZipFile(output / item["derivative_asset"]) as archive:
                package = json.loads(archive.read("extension/package.json"))
                self.assertEqual(package["publisher"], "beskid-lang")
                self.assertEqual(package["contributes"]["configurationDefaults"]["[beskid]"]["editor.defaultFormatter"],
                                 "beskid-lang.beskid-vscode")
                self.assertEqual(json.loads(archive.read("extension/package.json"))["version"], "0.5.1")
                self.assertTrue(any(name.startswith("extension/server/" + item["target"] + "/") for name in archive.namelist()))
                self.assertEqual(archive.read("extension/unchanged.bin"), b"preserve-this-byte-stream")
                self.assertNotIn(b'Publisher="beskid"', archive.read("extension.vsixmanifest"))
                self.assertIn(b'Publisher="beskid-lang"', archive.read("extension.vsixmanifest"))
        self.assertEqual(receipt["targets"][0]["lsp_sha256"], self.targets[0]["lsp_sha256"])
        self.assertNotEqual(receipt["targets"][0]["original_sha256"], receipt["targets"][0]["derivative_sha256"])

    def test_destination_must_not_exist(self):
        output = self.root / "derivatives"
        output.mkdir()
        with self.assertRaises(ValueError):
            API.Package(self.originals, self.approval, output)

    def test_rejects_tampered_original_and_wrong_formatter(self):
        path = self.originals / self.targets[0]["asset"]
        path.write_bytes(path.read_bytes() + b"tampered")
        with self.assertRaises(ValueError):
            API.Package(self.originals, self.approval, self.root / "one")
        self.tmp.cleanup()
        self.setUp()
        path = self.originals / self.targets[0]["asset"]
        with zipfile.ZipFile(path) as old:
            data = {item.filename: old.read(item) for item in old.infolist()}
        package = json.loads(data["extension/package.json"])
        package["contributes"]["configurationDefaults"]["[beskid]"]["editor.defaultFormatter"] = "other.id"
        with zipfile.ZipFile(path, "w") as archive:
            for name, value in data.items():
                archive.writestr(name, json.dumps(package).encode() if name == "extension/package.json" else value)
        with self.assertRaises(ValueError):
            API.Package(self.originals, self.approval, self.root / "two")

    def test_all_non_metadata_entry_payloads_are_byte_identical(self):
        output = self.root / "derivatives"
        API.Package(self.originals, self.approval, output)
        for item in self.targets:
            derivative = output / item["asset"].replace(".vsix", "-marketplace.vsix")
            with zipfile.ZipFile(self.originals / item["asset"]) as original, zipfile.ZipFile(derivative) as generated:
                names = set(original.namelist())
                self.assertEqual(names, set(generated.namelist()))
                for name in names - {"extension/package.json", "extension.vsixmanifest"}:
                    self.assertEqual(original.read(name), generated.read(name), name)

    def test_rejects_signature_and_traversal_entries(self):
        for index, (extra, signature) in enumerate(
            [([("../escape", b"bad")], False), ([], True)]):
            path = self.originals / self.targets[index]["asset"]
            self._write_vsix(path, self.targets[index]["target"], "beskid_lsp", b"native", extra, signature)
            with self.assertRaises(ValueError):
                API.Package(self.originals, self.approval, self.root / f"reject-{index}")


if __name__ == "__main__":
    unittest.main()
