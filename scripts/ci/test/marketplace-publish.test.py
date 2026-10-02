#!/usr/bin/env python3
"""Contract tests for the bounded Microsoft Marketplace publisher."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock
import zipfile


SCRIPT = Path(__file__).resolve().parents[1] / "marketplace-publish.py"
SPEC = importlib.util.spec_from_file_location("marketplace_publish", SCRIPT)
API = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(API)


class MarketplacePublishTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="beskid-marketplace-publish-")
        self.root = Path(self.tmp.name)
        self.stage = self.root / "stage"
        self.stage.mkdir(mode=0o700)
        self.context = {
            "CI_PIPELINE_EVENT": "manual",
            "CI_COMMIT_BRANCH": "main",
            "CI_REPO": "Cyber-Nomad-Collective/beskid",
            "CI_COMMIT_SHA": "a" * 40,
        }
        self.contract = copy.deepcopy(API.PRODUCTION_CONTRACT)
        self.contract["publication_enabled"] = True
        targets = []
        for target, executable in API.TARGETS.items():
            asset = f"beskid-vscode-0.5.1-{target}-marketplace.vsix"
            lsp = f"lsp-{target}".encode()
            path = self.stage / asset
            self._write_vsix(path, target, executable, lsp)
            records = self._inventory(path)
            targets.append({
                "target": target,
                "version": "0.5.1",
                "target_platform": target,
                "original_asset": asset.replace("-marketplace", ""),
                "original_sha256": "1" * 64,
                "derivative_asset": asset,
                "derivative_sha256": self._sha(path),
                "lsp_sha256": hashlib.sha256(lsp).hexdigest(),
                "original_inventory_sha256": "2" * 64,
                "derivative_inventory_sha256": hashlib.sha256(
                    json.dumps(records, sort_keys=True).encode()).hexdigest(),
                "non_metadata_inventory_equal": True,
                "identity": "beskid-lang.beskid-vscode",
                "native_target": "fixture-native-" + target,
                "native_asset": "fixture-lsp-" + target,
            })
        approval = {
            "schema_version": 1,
            "channel": "marketplace",
            "publisher": "beskid-lang",
            "name": "beskid-vscode",
            "version": "0.5.1",
            "formatter_self_id": "beskid-lang.beskid-vscode",
            "source": API.APPROVED_SOURCE,
            "original_approval": "scripts/ci/editor-marketplace-approvals/0.5.1.json",
            "targets": targets,
        }
        approval_path = self.stage / "marketplace-approval.json"
        approval_path.write_text(json.dumps(approval, indent=2) + "\n")
        self.contract["approval_sha256"] = self._sha(approval_path)
        self.contract["derivative_sha256"] = {x["target"]: x["derivative_sha256"] for x in targets}
        qualification = {
            "schema_version": 1,
            "kind": "beskid-marketplace-local-host-qualification",
            "status": "success",
            "original_receipt_sha256": API.ORIGINAL_HOST_RECEIPT_SHA256,
            "marketplace_approval_sha256": self.contract["approval_sha256"],
            "release": {"repository": API.REPOSITORY, "tag": API.RELEASE_TAG,
                        "source_commit": API.APPROVED_SOURCE["superrepo_commit"]},
            "source": API.APPROVED_SOURCE,
            "extension": {
                "id": "beskid-lang.beskid-vscode",
                "publisher": "beskid-lang",
                "name": "beskid-vscode",
                "version": "0.5.1",
                "qualified_target": "darwin-arm64",
                "qualified_derivative_sha256": self.contract["derivative_sha256"]["darwin-arm64"],
                "target_set": list(API.TARGETS),
                "lsp_sha256": targets[1]["lsp_sha256"],
            },
            "checks": {
                "extension_active": True,
                "workspace_count": 0,
                "language_id": "beskid",
                "formatter_self_id": "beskid-lang.beskid-vscode",
                "formatter_edit_count": 4,
                "formatter_input_sha256": API.FORMATTER_INPUT_SHA256,
                "formatter_output_sha256": API.FORMATTER_OUTPUT_SHA256,
                "formatter_applied": True,
            },
        }
        (self.stage / API.HOST_QUALIFICATION_NAME).write_text(json.dumps(qualification, indent=2) + "\n")

    def tearDown(self):
        self.tmp.cleanup()

    @staticmethod
    def _sha(path):
        return hashlib.sha256(path.read_bytes()).hexdigest()

    @staticmethod
    def _write_vsix(path, target, executable, lsp, publisher="beskid-lang"):
        package = {
            "name": "beskid-vscode", "publisher": publisher, "version": "0.5.1",
            "contributes": {"configurationDefaults": {
                "[beskid]": {"editor.defaultFormatter": "beskid-lang.beskid-vscode"}}},
        }
        manifest = (f'<PackageManifest><Metadata><Identity Publisher="{publisher}" Id="beskid-vscode" '
                    f'Version="0.5.1" TargetPlatform="{target}"/></Metadata></PackageManifest>').encode()
        with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("extension/package.json", json.dumps(package))
            archive.writestr("extension.vsixmanifest", manifest)
            archive.writestr(f"extension/server/{target}/{executable}", lsp)
            archive.writestr("extension/readme.md", b"fixture")

    @staticmethod
    def _inventory(path):
        result = []
        with zipfile.ZipFile(path) as archive:
            for item in archive.infolist():
                data = b"" if item.is_dir() else archive.read(item)
                result.append({"name": item.filename, "size": len(data),
                               "sha256": hashlib.sha256(data).hexdigest()})
        return result

    def _preflight(self, context=None, name="attempt"):
        attempt = self.root / name
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            API.Preflight(self.stage, attempt, context or self.context, self.contract)
        return attempt

    def test_preflight_snapshots_exact_verified_inputs_without_credentials(self):
        context = dict(self.context, VSCE_PAT="must-not-reach-preflight")
        with self.assertRaises(ValueError):
            self._preflight(context)
        context.pop("VSCE_PAT")
        attempt = self._preflight(context, "qualified-attempt")
        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual(result["status"], "preflight-passed")
        self.assertEqual(set(x.name for x in (attempt / "snapshot").iterdir()), API.EXPECTED_STAGE_NAMES)

    def test_preflight_rejects_wrong_context_pins_hash_target_identity_and_extra_asset(self):
        mutations = []
        mutations.append(lambda: self.context.update(CI_COMMIT_BRANCH="feature"))
        mutations.append(lambda: self._mutate_json("marketplace-approval.json", lambda x: x["source"].update(superrepo_commit="b" * 40)))
        mutations.append(lambda: (self.stage / next(iter(self.contract["assets"]))).write_bytes(b"tampered"))
        mutations.append(lambda: self._mutate_zip(next(iter(self.contract["assets"])), "target"))
        mutations.append(lambda: self._mutate_zip(next(iter(self.contract["assets"])), "identity"))
        mutations.append(lambda: (self.stage / "extra.txt").write_text("extra"))
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                self.tearDown()
                self.setUp()
                mutate()
                with self.assertRaises(ValueError):
                    attempt = self._preflight()
                self.assertTrue((self.root / "attempt" / API.ATTEMPT_RECEIPT_NAME).is_file())

    def test_preflight_rejects_symlinks_traversal_and_tampered_host_receipt(self):
        asset = next(iter(self.contract["assets"]))
        real = self.stage / asset
        moved = self.root / "moved.vsix"
        real.rename(moved)
        real.symlink_to(moved)
        with self.assertRaises(ValueError):
            self._preflight()
        self.tearDown()
        self.setUp()
        self._add_zip_entry(asset, "../escape", b"bad")
        self.contract["derivative_sha256"][self.contract["assets"][asset]] = self._sha(self.stage / asset)
        with self.assertRaises(ValueError):
            self._preflight()
        self.tearDown()
        self.setUp()
        self._mutate_json(API.HOST_QUALIFICATION_NAME, lambda x: x["checks"].update(formatter_applied=False))
        with self.assertRaises(ValueError):
            self._preflight()

    def test_publish_requires_pat_and_uses_only_package_paths_without_logging_secret(self):
        attempt = self._preflight(name="missing-pat-attempt")
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(ValueError):
                API.Publish(attempt, self.context, self.contract, runner=lambda *_: None)
        attempt = self._preflight(name="publish-attempt")
        seen = {}
        def runner(argv, env):
            seen.update(argv=argv, env=env)
            return 0
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            API.Publish(attempt, dict(self.context, VSCE_PAT="test-only-secret"), self.contract, runner=runner)
        self.assertEqual(seen["argv"], ["npx", "--no-install", "@vscode/vsce", "publish", "--packagePath",
                         *[str(attempt / "snapshot" / API.AssetName(target)) for target in API.TARGETS]])
        self.assertNotIn("--target", seen["argv"])
        self.assertNotIn("--skip-duplicate", seen["argv"])
        receipt = (attempt / API.ATTEMPT_RECEIPT_NAME).read_text()
        self.assertNotIn("test-only-secret", receipt)
        self.assertEqual(json.loads(receipt)["status"], "published")

    def test_publisher_failure_is_durable_and_fail_closed(self):
        attempt = self._preflight()
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(RuntimeError):
                API.Publish(attempt, dict(self.context, VSCE_PAT="test-only-secret"), self.contract,
                            runner=lambda *_: 23)
        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual(result["status"], "publisher-failed-possible-partial")
        self.assertEqual({x["status"] for x in result["targets"]}, {"unconfirmed"})
        self.assertNotIn("test-only-secret", json.dumps(result))

    def test_release_hold_blocks_transport_before_secret_use(self):
        held = copy.deepcopy(self.contract)
        held["publication_enabled"] = False
        attempt = self.root / "held-attempt"
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            API.Preflight(self.stage, attempt, self.context, held)
        called = False
        def runner(*_):
            nonlocal called
            called = True
            return 0
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(ValueError):
                API.Publish(attempt, dict(self.context, VSCE_PAT="must-not-be-used"), held, runner=runner)
        self.assertFalse(called)
        self.assertEqual(json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())["status"], "publish-blocked")

    def test_host_receipt_sanitizer_binds_proof_without_private_paths(self):
        raw = self.root / "raw-host-receipt.json"
        raw.write_text(json.dumps({
            "schema_version": 1, "status": "success",
            "source_commit": API.APPROVED_SOURCE["superrepo_commit"],
            "compiler_commit": API.APPROVED_SOURCE["compiler_commit"],
            "extension_id": "beskid-lang.beskid-vscode", "publisher": "beskid-lang",
            "extension_version": "0.5.1", "formatter_self_id": "beskid-lang.beskid-vscode",
            "server_sha256": API.HOST_LSP_SHA256, "extension_active": True,
            "workspace_count": 0, "language_id": "beskid", "formatter_edit_count": 4,
            "source_document": "/private/tmp/do-not-copy/fixture/Main.bd",
            "before": "pub i32 Main() { return 42; }\n",
            "after": "pub i32 Main()\n{\n    return 42;\n}\n",
        }, indent=2) + "\n")
        contract = copy.deepcopy(self.contract)
        contract["original_host_receipt_sha256"] = self._sha(raw)
        output = self.root / "sanitized.json"
        API.SanitizeHostReceipt(raw, self.stage / "marketplace-approval.json",
                                self.stage / API.AssetName("darwin-arm64"), output, contract)
        result = output.read_text()
        self.assertNotIn("/private/", result)
        self.assertEqual(json.loads(result)["original_receipt_sha256"], contract["original_host_receipt_sha256"])

    def _mutate_json(self, name, mutate):
        path = self.stage / name
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value, indent=2) + "\n")

    def _add_zip_entry(self, name, entry, data):
        with zipfile.ZipFile(self.stage / name, "a") as archive:
            archive.writestr(entry, data)

    def _mutate_zip(self, name, kind):
        path = self.stage / name
        target = self.contract["assets"][name]
        executable = API.TARGETS[target]
        lsp = f"lsp-{target}".encode()
        if kind == "target":
            self._write_vsix(path, "wrong-target", executable, lsp)
        else:
            self._write_vsix(path, target, executable, lsp, publisher="beskid")


if __name__ == "__main__":
    unittest.main()
