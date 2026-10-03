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
        self.synthetic_source = copy.deepcopy(API.APPROVED_SOURCE)
        self.synthetic_source["compiler_commit"] = "b" * 40
        source_patch = mock.patch.object(API, "APPROVED_SOURCE", self.synthetic_source)
        source_patch.start()
        self.addCleanup(source_patch.stop)
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
                API.Publish(attempt, self.context, self.contract, runner=lambda *_: None,
                            read_published=lambda _: None)
        attempt = self._preflight(name="publish-attempt")
        seen = {}
        def runner(argv, env):
            seen.update(argv=argv, env=env)
            return 0
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            API.Publish(attempt, dict(self.context, VSCE_PAT="test-only-secret"), self.contract, runner=runner,
                        read_published=lambda _: None)
        self.assertEqual(seen["argv"], ["npx", "--no-install", "@vscode/vsce", "publish", "--packagePath",
                         *[str(attempt / "snapshot" / API.AssetName(target)) for target in API.TARGETS]])
        self.assertNotIn("--target", seen["argv"])
        self.assertNotIn("--skip-duplicate", seen["argv"])
        receipt = (attempt / API.ATTEMPT_RECEIPT_NAME).read_text()
        self.assertNotIn("test-only-secret", receipt)
        self.assertEqual(json.loads(receipt)["status"], "published")

    def test_publish_skips_a_verified_existing_target_and_only_sends_missing_targets(self):
        attempt = self._preflight(name="resume-attempt")
        existing = {
            "darwin-arm64": (attempt / "snapshot" / API.AssetName("darwin-arm64")).read_bytes(),
        }
        reads, seen = [], {}

        def read_published(target):
            reads.append(target)
            return existing.get(target)

        def runner(argv, env):
            seen.update(argv=argv, env=env)
            return 0

        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            API.Publish(attempt, dict(self.context, VSCE_PAT="test-only-secret"), self.contract,
                        runner=runner, read_published=read_published)

        self.assertEqual(reads, list(API.TARGETS))
        self.assertEqual(seen["argv"], ["npx", "--no-install", "@vscode/vsce", "publish", "--packagePath",
                                        str(attempt / "snapshot" / API.AssetName("linux-x64")),
                                        str(attempt / "snapshot" / API.AssetName("win32-x64"))])
        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual([item["status"] for item in result["targets"]],
                         ["publisher-reported-success", "existing-verified", "publisher-reported-success"])
        self.assertTrue(result["hosted_bytes_sha256_verified"])

    def test_publish_is_a_secret_free_no_op_when_every_target_already_matches(self):
        attempt = self._preflight(name="all-existing-attempt")
        existing = {target: (attempt / "snapshot" / API.AssetName(target)).read_bytes()
                    for target in API.TARGETS}

        def forbidden(*_):
            self.fail("publisher must not run when every approved target is already present")

        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            API.Publish(attempt, self.context, self.contract, runner=forbidden,
                        read_published=lambda target: existing[target])

        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual(result["status"], "published")
        self.assertEqual({item["status"] for item in result["targets"]}, {"existing-verified"})
        self.assertTrue(result["hosted_bytes_sha256_verified"])

    def test_mismatched_existing_target_blocks_before_pat_or_publisher_invocation(self):
        attempt = self._preflight(name="mismatched-existing-attempt")
        calls = []

        def read_published(target):
            calls.append(target)
            return b"not the approved VSIX" if target == "darwin-arm64" else None

        def forbidden(*_):
            self.fail("publisher must not run after a hosted-byte mismatch")

        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(ValueError):
                API.Publish(attempt, self.context, self.contract, runner=forbidden,
                            read_published=read_published)

        self.assertEqual(calls, ["linux-x64", "darwin-arm64"])
        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual(result["status"], "publish-blocked")
        self.assertFalse(result["hosted_bytes_sha256_verified"])

    def test_uncertain_existing_target_read_blocks_before_any_publisher_invocation(self):
        attempt = self._preflight(name="uncertain-existing-attempt")

        def read_published(target):
            if target == "darwin-arm64":
                raise ValueError("Marketplace hosted target could not be determined")
            return None

        def forbidden(*_):
            self.fail("publisher must not run after an uncertain hosted-byte read")

        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaisesRegex(ValueError, "could not be determined"):
                API.Publish(attempt, self.context, self.contract, runner=forbidden,
                            read_published=read_published)

        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual(result["status"], "publish-blocked")
        self.assertFalse(result["hosted_bytes_sha256_verified"])

    def test_partial_retry_preserves_verified_targets_when_missing_target_publish_fails(self):
        attempt = self._preflight(name="partial-retry-attempt")
        existing = {
            "darwin-arm64": (attempt / "snapshot" / API.AssetName("darwin-arm64")).read_bytes(),
        }
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(RuntimeError):
                API.Publish(attempt, dict(self.context, VSCE_PAT="test-only-secret"), self.contract,
                            runner=lambda *_: 23, read_published=lambda target: existing.get(target))

        result = json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())
        self.assertEqual(result["status"], "publisher-failed-possible-partial")
        self.assertEqual([item["status"] for item in result["targets"]],
                         ["unconfirmed", "existing-verified", "unconfirmed"])

    def test_publisher_failure_is_durable_and_fail_closed(self):
        attempt = self._preflight()
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(RuntimeError):
                API.Publish(attempt, dict(self.context, VSCE_PAT="test-only-secret"), self.contract,
                            runner=lambda *_: 23, read_published=lambda _: None)
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
        def forbidden_read(*_):
            self.fail("held publication must not read hosted packages")
        with mock.patch.object(API, "VerifyCheckout", return_value=None):
            with self.assertRaises(ValueError):
                API.Publish(attempt, dict(self.context, VSCE_PAT="must-not-be-used"), held, runner=runner,
                            read_published=forbidden_read)
        self.assertFalse(called)
        self.assertEqual(json.loads((attempt / API.ATTEMPT_RECEIPT_NAME).read_text())["status"], "publish-blocked")

    def test_exact_source_hold_precedes_boolean_secret_and_runner(self):
        held_source = copy.deepcopy(self.synthetic_source)
        held_source["compiler_commit"] = "1bd7bdee81d59ef14339e6a6c2ce18eb36585238"
        self._mutate_json("marketplace-approval.json", lambda value: value.update(source=held_source))
        self._mutate_json(API.HOST_QUALIFICATION_NAME, lambda value: value.update(source=held_source))
        self.contract["approval_sha256"] = self._sha(self.stage / "marketplace-approval.json")
        self._mutate_json(API.HOST_QUALIFICATION_NAME,
                          lambda value: value.update(marketplace_approval_sha256=self.contract["approval_sha256"]))
        called = False
        def runner(*_):
            nonlocal called
            called = True
            return 0
        with mock.patch.object(API, "APPROVED_SOURCE", held_source):
            attempt = self._preflight(name="exact-source-held-attempt")
            with self.assertRaises(ValueError) as failure:
                API.Publish(attempt, dict(self.context, VSCE_PAT="must-not-be-used"),
                            self.contract, runner=runner)
        self.assertIn("publication hold", str(failure.exception).lower())
        self.assertFalse(called)
        self.assertTrue(self.contract["publication_enabled"])

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


class ProductionContractSelectionTests(unittest.TestCase):
    @staticmethod
    def load_api():
        spec = importlib.util.spec_from_file_location("contract_marketplace_publish", SCRIPT)
        api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(api)
        return api

    def test_052_selection_freezes_genuine_qualification_digests_without_enabling_publication(self):
        api = self.load_api()
        api.SelectProductionVersion("0.5.2")

        self.assertEqual(api.PRODUCTION_CONTRACT["approval_sha256"],
                         "af4802cef95dde8ccbf5ac053ea7bed4eadde78e4929cd4962769c571fdc6b49")
        self.assertEqual(api.PRODUCTION_CONTRACT["derivative_sha256"], {
            "linux-x64": "32919b50ad2655374029b3605c2c8ca8e5a0dab285273595536c522f0a28e658",
            "darwin-arm64": "737690292718278064802639154963cd0eb25dc34ed4ecc4ced244e6bab8cf0a",
            "win32-x64": "95a2d8feace8000a55b4ed394edb541c72506b1b70ca7dbec7656ba3cef55f0c",
        })
        self.assertEqual(api.PRODUCTION_CONTRACT["original_host_receipt_sha256"],
                         "20f303b7df6bf20a6d714a2f4d2abd54894089a10b36b05629eebece9a29b142")
        self.assertFalse(api.PRODUCTION_CONTRACT["publication_enabled"])

    def test_selector_preserves_held_051_contract_and_rejects_untracked_versions(self):
        api = self.load_api()
        legacy = copy.deepcopy(api.PRODUCTION_CONTRACT)

        api.SelectProductionVersion("0.5.1")

        self.assertEqual(api.PRODUCTION_CONTRACT, legacy)
        with self.assertRaisesRegex(ValueError, "unsupported Marketplace publication version"):
            api.SelectProductionVersion("0.5.3")


class LinuxMarketplaceHostTests(unittest.TestCase):
    """Exercise real staged bytes; only synthetic server hash substitutes for a native binary."""

    def setUp(self):
        spec = importlib.util.spec_from_file_location("linux_marketplace_publish", SCRIPT)
        self.api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.api)
        self.api.SelectProductionVersion("0.5.2")
        self.tmp = tempfile.TemporaryDirectory(prefix="beskid-linux-host-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.stage = self.root / "stage"
        self.stage.mkdir(mode=0o700)
        self.contract = copy.deepcopy(self.api.PRODUCTION_CONTRACT)
        self.contract["publication_enabled"] = True
        entries = []
        for original in self.contract["originals"]:
            target = original["target"]
            path = self.stage / self.api.AssetName(target)
            server = ("fixture-server-" + target).encode()
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("extension/package.json", json.dumps({
                    "name": "beskid-vscode", "publisher": "beskid-lang", "version": "0.5.2",
                    "contributes": {"configurationDefaults": {"[beskid]": {
                        "editor.defaultFormatter": "beskid-lang.beskid-vscode"}}}}))
                archive.writestr("extension.vsixmanifest", '<PackageManifest><Metadata><Identity '
                    'Publisher="beskid-lang" Id="beskid-vscode" Version="0.5.2" '
                    f'TargetPlatform="{target}"/></Metadata></PackageManifest>')
                archive.writestr(f"extension/server/{target}/{self.api.TARGETS[target]}", server)
            entry = dict(original, version="0.5.2", target_platform=target,
                         original_asset=original["asset"], original_sha256=original["sha256"],
                         derivative_asset=path.name, derivative_sha256=MarketplacePublishTests._sha(path),
                         original_inventory_sha256="2" * 64, non_metadata_inventory_equal=True,
                         identity="beskid-lang.beskid-vscode")
            entry["lsp_sha256"] = hashlib.sha256(server).hexdigest()
            original["lsp_sha256"] = entry["lsp_sha256"]
            entry["derivative_inventory_sha256"] = hashlib.sha256(json.dumps(
                MarketplacePublishTests._inventory(path), sort_keys=True).encode()).hexdigest()
            entries.append(entry)
        self.contract["derivative_sha256"] = {x["target"]: x["derivative_sha256"] for x in entries}
        self.approval = dict(schema_version=1, channel="marketplace", publisher="beskid-lang",
            name="beskid-vscode", version="0.5.2", formatter_self_id="beskid-lang.beskid-vscode",
            source=copy.deepcopy(self.api.APPROVED_SOURCE),
            original_approval="scripts/ci/editor-marketplace-approvals/0.5.2.json", targets=entries)
        self.approval_path = self.stage / "marketplace-approval.json"
        self.write_json(self.approval_path, self.approval)
        self.contract["approval_sha256"] = MarketplacePublishTests._sha(self.approval_path)
        self.raw = dict(schema_version=1, status="success", source=copy.deepcopy(self.api.APPROVED_SOURCE),
            source_commit="e06d6b4b1e7e06a602bcf0b575e9fc05d921106b",
            compiler_commit="95c203ff12639b25e2c67b08da531e3715fef4c2",
            derivative_sha256=self.contract["derivative_sha256"]["linux-x64"],
            extension_id="beskid-lang.beskid-vscode", publisher="beskid-lang", extension_version="0.5.2",
            formatter_self_id="beskid-lang.beskid-vscode", server_sha256=entries[0]["lsp_sha256"],
            extension_active=True, workspace_count=0, language_id="beskid", formatter_edit_count=4,
            qualified_target="linux-x64", platform="linux", arch="x64", vscode_version="1.96.0",
            formatter_applied=True, formatter_saved=True,
            before="pub i32 Formatter() { return 42; }\n",
            after="pub i32 Formatter()\n{\n    return 42;\n}\n")
        self.raw_path = self.root / "raw.json"
        self.output = self.stage / self.api.HOST_QUALIFICATION_NAME
        # The synthetic server is never promoted into the production contract.
        self.api.HOST_CONTRACTS["0.5.2"]["lsp_sha256"] = entries[0]["lsp_sha256"]

    @staticmethod
    def write_json(path, value):
        path.write_text(json.dumps(value, indent=2) + "\n")

    def sanitize(self, rebind_raw=True):
        self.write_json(self.raw_path, self.raw)
        if rebind_raw:
            self.contract["original_host_receipt_sha256"] = MarketplacePublishTests._sha(self.raw_path)
        return self.api.SanitizeHostReceipt(self.raw_path, self.approval_path,
            self.stage / self.api.AssetName("linux-x64"), self.output, self.contract)

    def test_linux_derivative_receipt_sanitizes_and_verifies_complete_stage(self):
        result = self.sanitize()
        self.assertEqual(result["extension"]["qualified_target"], "linux-x64")
        self.assertEqual(result["extension"]["lsp_sha256"], self.raw["server_sha256"])
        self.assertEqual(result["host"], {"platform": "linux", "arch": "x64", "vscode_version": "1.96.0"})
        self.assertTrue(result["checks"]["formatter_saved"])
        self.api.VerifyStage(self.stage, self.contract)

    def test_linux_raw_evidence_rejects_wrong_platform_source_server_and_formatter(self):
        changes = [("qualified_target", "darwin-arm64"), ("platform", "darwin"), ("arch", "arm64"),
            ("vscode_version", "1.95.0"), ("extension_version", "0.5.1"), ("server_sha256", "f" * 64),
            ("source", {k: v for k, v in self.raw["source"].items() if k != "native_superrepo_commit"}),
            ("derivative_sha256", "f" * 64), ("formatter_applied", False), ("formatter_saved", False),
            ("formatter_edit_count", 3), ("before", self.raw["before"] + " "),
            ("after", self.raw["after"] + " ")]
        for field, value in changes:
            with self.subTest(field=field):
                original = self.raw[field]
                self.raw[field] = value
                with self.assertRaises(ValueError):
                    self.sanitize()
                self.assertFalse(self.output.exists())
                self.raw[field] = original
        for field in ("source", "qualified_target", "formatter_applied", "formatter_saved"):
            with self.subTest(missing=field):
                original = self.raw.pop(field)
                with self.assertRaises(ValueError):
                    self.sanitize()
                self.raw[field] = original

    def test_linux_raw_and_derivative_digest_mutations_fail_closed(self):
        self.contract["original_host_receipt_sha256"] = "f" * 64
        with self.assertRaisesRegex(ValueError, "receipt digest"):
            self.sanitize(rebind_raw=False)
        derivative = self.stage / self.api.AssetName("linux-x64")
        derivative.write_bytes(derivative.read_bytes() + b"mutated")
        with self.assertRaisesRegex(ValueError, "derivative digest"):
            self.sanitize()

    def test_linux_sanitized_receipt_rejects_wrong_target_host_and_saved_evidence(self):
        result = self.sanitize()
        for section, field, value in (("extension", "qualified_target", "darwin-arm64"),
            ("host", "platform", "darwin"), ("checks", "formatter_saved", False)):
            with self.subTest(field=field):
                mutated = copy.deepcopy(result)
                mutated[section][field] = value
                with self.assertRaises(ValueError):
                    self.api.VerifyHostQualification(mutated, self.approval, self.contract)

    def test_linux_embedded_server_is_verified_even_with_rebound_archive_digests(self):
        path = self.stage / self.api.AssetName("linux-x64")
        with zipfile.ZipFile(path) as archive:
            content = {name: archive.read(name) for name in archive.namelist()}
        content["extension/server/linux-x64/beskid_lsp"] = b"wrong server"
        with zipfile.ZipFile(path, "w") as archive:
            for name, data in content.items():
                archive.writestr(name, data)
        entry = self.approval["targets"][0]
        entry["derivative_sha256"] = MarketplacePublishTests._sha(path)
        entry["derivative_inventory_sha256"] = hashlib.sha256(json.dumps(
            MarketplacePublishTests._inventory(path), sort_keys=True).encode()).hexdigest()
        self.contract["derivative_sha256"]["linux-x64"] = entry["derivative_sha256"]
        self.raw["derivative_sha256"] = entry["derivative_sha256"]
        self.write_json(self.approval_path, self.approval)
        self.contract["approval_sha256"] = MarketplacePublishTests._sha(self.approval_path)
        with self.assertRaisesRegex(ValueError, "embedded LSP"):
            self.sanitize()

    def test_qualified_linux_stage_keeps_complete_set_and_preflight_secret_guard(self):
        self.sanitize()
        context = dict(CI_PIPELINE_EVENT="manual", CI_COMMIT_BRANCH="main",
            CI_REPO="Cyber-Nomad-Collective/beskid", CI_COMMIT_SHA="a" * 40, VSCE_PAT="test-only")
        with self.assertRaisesRegex(ValueError, "preflight must not receive"):
            self.api.Preflight(self.stage, self.root / "attempt", context, self.contract)
        path = self.stage / self.api.AssetName("win32-x64")
        path.write_bytes(path.read_bytes() + b"changed last target")
        with self.assertRaisesRegex(ValueError, "derivative digest"):
            self.api.VerifyStage(self.stage, self.contract)

    def test_production_host_pin_rejects_synthetic_server_without_substitution(self):
        self.api.HOST_CONTRACTS["0.5.2"]["lsp_sha256"] = (
            "750443a35fb4623623230ff147f2610f52c826d0f17c2ded98a91370ec03ea9f")
        with self.assertRaisesRegex(ValueError, "host qualification LSP"):
            self.sanitize()

    def test_unqualified_production_stops_before_inputs_secrets_and_transport(self):
        api = self.api
        with self.assertRaisesRegex(ValueError, "qualifications pending"):
            api.SanitizeHostReceipt(self.raw_path, self.approval_path, self.root / "absent",
                                    self.output)
        with self.assertRaisesRegex(ValueError, "qualifications pending"):
            api.Preflight(self.stage, self.root / "attempt", {})
        def forbidden(*args):
            self.fail("publisher must not run")
        with self.assertRaisesRegex(ValueError, "qualifications pending"):
            api.Publish(self.root / "absent", {"VSCE_PAT": "test-only"}, runner=forbidden)
        self.assertFalse((self.root / "attempt").exists())


if __name__ == "__main__":
    unittest.main()
