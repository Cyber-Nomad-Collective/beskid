"""Real archive and process-boundary tests; only external transports are fake."""
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import subprocess
import tarfile
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / "prebuilt-editor-publish.py"
TARGETS = [
    ("linux-x64", "x86_64-unknown-linux-gnu", "beskid_lsp"),
    ("darwin-arm64", "aarch64-apple-darwin", "beskid_lsp"),
    ("win32-x64", "x86_64-pc-windows-msvc", "beskid_lsp.exe"),
]
NATIVE_ASSETS = {"linux-x64": "beskid_lsp-linux-amd64", "darwin-arm64": "beskid_lsp-darwin-arm64",
                 "win32-x64": "beskid_lsp-windows-amd64.exe"}


class PublisherTests(unittest.TestCase):
    def setUp(self):
        # Missing implementation is the initial RED behavior, rather than an import error.
        self.assertTrue(SCRIPT.is_file(), "prebuilt verification and publication are not implemented")
        spec = importlib.util.spec_from_file_location("publisher", SCRIPT)
        self.api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.api)
        self.tmp = tempfile.TemporaryDirectory(prefix="beskid-prebuilt-test-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.editors = self.root / "editors"
        self.native = self.root / "native"
        self.editors.mkdir()
        self.native.mkdir()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        self.git("config", "user.name", "fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.compiler = "b" * 40
        self.editor = "c" * 40
        for name, sha in [("compiler", self.compiler), ("beskid_vscode", self.editor)]:
            self.git("update-index", "--add", "--cacheinfo", "160000," + sha + "," + name)
        self.git("commit", "-qm", "frozen source")
        self.git("remote", "add", "origin", "https://github.com/Cyber-Nomad-Collective/beskid.git")
        self.source = self.git("rev-parse", "HEAD").strip()
        self.approval = {
            "schema_version": 1, "version": "0.5.1", "publisher": "beskid", "name": "beskid-vscode",
            "source": {"superrepo_commit": self.source, "compiler_commit": self.compiler,
                       "editor_commit": self.editor, "publisher_base_commit": self.source},
            "editor_release": {"repository": "Cyber-Nomad-Collective/beskid", "tag": "editor-v0.5.1"},
            "native_release": {"repository": "Cyber-Nomad-Collective/beskid_compiler", "tag": "lsp-v0.5.1"},
            "targets": [],
        }
        for target, triple, binary in TARGETS:
            payload = ("native LSP " + target).encode()
            entry = {"target": target, "native_target": triple,
                     "asset": "beskid-vscode-0.5.1-" + target + ".vsix",
                     "native_asset": NATIVE_ASSETS[target],
                     "lsp_sha256": hashlib.sha256(payload).hexdigest()}
            self.approval["targets"].append(entry)
            self.zip(entry, payload=payload)
            (self.native / entry["native_asset"]).write_bytes(payload)
        (self.native / "lsp-version.txt").write_bytes(b"0.5.1\n")
        self.state = {
            "schema_version": 1, "version": "0.5.1", "channel": "stable", "publishable": True,
            "provenance": {"superrepo_commit": self.source, "compiler_commit": self.compiler},
            "tests": {"gate_result": "success", "failed": []},
            "complete_platforms": [x[1] for x in TARGETS], "failed_platform_builds": [],
            "platforms": [{"target": triple, "builds": {"lsp": {"status": "success", "asset": NATIVE_ASSETS[target]},
                "bundle": {"status": "success", "asset": "beskid-0.5.1-" + triple + ".tar.gz"}}}
                for target, triple, _ in TARGETS],
        }
        self.save_state()
        self.context = {"CI_PIPELINE_EVENT": "manual", "CI_COMMIT_BRANCH": "main",
                        "CI_REPO": "Cyber-Nomad-Collective/beskid", "CI_COMMIT_SHA": self.source,
                        "BESKID_TASK": "editor-publish", "OVSX_PAT": "test-only-token"}
        self.uploads = []
        self.remote = {}

    def git(self, *args):
        return subprocess.check_output(["git", "-C", str(self.root), *args], text=True)

    def digest(self, path):
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def save_state(self):
        (self.native / "release-state.json").write_text(json.dumps(self.state))

    def zip(self, entry, payload=None, identity=None, extras=()):
        target = entry["target"]
        payload = payload or ("native LSP " + target).encode()
        version = self.approval["version"]
        package = {"publisher": "beskid", "name": "beskid-vscode", "version": version,
                   "contributes": {"configurationDefaults": {"[beskid]": {
                       "editor.defaultFormatter": "beskid.beskid-vscode"}}}}
        package.update(identity or {})
        manifest = '<PackageManifest><Metadata><Identity Publisher="beskid" Id="beskid-vscode" Version="' + version + '" TargetPlatform="' + target + '"/></Metadata></PackageManifest>'
        binary = "beskid_lsp.exe" if target == "win32-x64" else "beskid_lsp"
        with warnings.catch_warnings(), zipfile.ZipFile(self.editors / entry["asset"], "w", zipfile.ZIP_DEFLATED) as archive:
            warnings.simplefilter("ignore", UserWarning)
            archive.writestr("extension/package.json", json.dumps(package))
            archive.writestr("extension.vsixmanifest", manifest)
            archive.writestr("extension/server/" + target + "/" + binary, payload)
            for name, value in extras:
                archive.writestr(name, value)
        entry["sha256"] = self.digest(self.editors / entry["asset"])

    def verify(self):
        return self.api.VerifyRelease(self.approval, self.editors, self.native, self.root)

    def read_registry(self, entry):
        return self.remote.get(entry["target"])

    def upload(self, argv, env):
        # Publication side effect observes the real verifier's completed target set.
        self.assertEqual(len(self.verify()), 3)
        self.assertEqual(argv[1], "publish")
        self.assertEqual(len(argv), 3)
        self.assertTrue(argv[2].endswith(".vsix"))
        self.assertNotIn("test-only-token", " ".join(argv))
        self.assertEqual(env["OVSX_PAT"], "test-only-token")
        self.assertNotIn("GH_TOKEN", env)
        self.uploads.append(argv)
        entry = next(x for x in self.approval["targets"] if str(self.editors / x["asset"]) == argv[2])
        self.remote[entry["target"]] = (self.editors / entry["asset"]).read_bytes()

    def publish(self):
        return self.api.Publish(self.approval, self.editors, self.native, self.root,
            self.context, "/pinned/ovsx", self.root / "results.json",
            read_registry=self.read_registry, upload=self.upload)

    def hold_source(self):
        held = "1bd7bdee81d59ef14339e6a6c2ce18eb36585238"
        self.git("update-index", "--cacheinfo", "160000," + held + ",compiler")
        self.git("commit", "-qm", "held source")
        source = self.git("rev-parse", "HEAD").strip()
        self.approval["source"].update(superrepo_commit=source, compiler_commit=held,
                                       publisher_base_commit=source)
        self.state["version"] = "0.5.1"
        self.state["provenance"].update(superrepo_commit=source, compiler_commit=held)
        self.context["CI_COMMIT_SHA"] = source
        self.save_state()

    def test_verifies_complete_real_zip_and_standalone_lsp_set(self):
        self.assertEqual(len(self.verify()), 3)

    def two_roots(self):
        native_root = self.source
        self.git("update-index", "--cacheinfo", "160000," + "d" * 40 + ",beskid_vscode")
        self.git("commit", "-qm", "final editor")
        editor_root = self.git("rev-parse", "HEAD").strip()
        self.git("commit", "--allow-empty", "-qm", "later publisher")
        self.approval["source"].update(superrepo_commit=editor_root,
            native_superrepo_commit=native_root, editor_commit="d" * 40)
        self.approval.update(version="0.5.2", publication_enabled=True)
        self.approval["editor_release"]["tag"] = "editor-v0.5.2"
        self.approval["native_release"]["tag"] = "lsp-v0.5.2"
        for entry in self.approval["targets"]:
            old = self.editors / entry["asset"]
            entry["asset"] = entry["asset"].replace("0.5.1", "0.5.2")
            old.rename(self.editors / entry["asset"])
            self.zip(entry)
        self.state["version"] = "0.5.2"
        self.save_state()
        (self.native / "lsp-version.txt").write_bytes(b"0.5.2\n")
        self.context["CI_COMMIT_SHA"] = self.git("rev-parse", "HEAD").strip()
        return native_root, editor_root

    def test_real_two_root_history_preserves_original_native_provenance(self):
        self.two_roots()
        self.assertEqual(len(self.verify()), 3)

    def test_two_root_missing_malformed_unknown_and_reversed_pins_reject(self):
        native, editor = self.two_roots()
        for value in (None, "bad", "F" * 40, "e" * 40, self.context["CI_COMMIT_SHA"]):
            with self.subTest(pin=value):
                if value is None:
                    self.approval["source"].pop("native_superrepo_commit", None)
                else:
                    self.approval["source"]["native_superrepo_commit"] = value
                with self.assertRaises(ValueError):
                    self.verify()
        self.approval["source"].update(native_superrepo_commit=editor, superrepo_commit=native)
        with self.assertRaises(ValueError):
            self.verify()

    def test_sibling_roots_reachable_from_merged_publisher_reject(self):
        native, editor = self.two_roots()
        publisher = self.context["CI_COMMIT_SHA"]
        self.git("checkout", "-qb", "sibling", native)
        self.git("commit", "--allow-empty", "-qm", "sibling native")
        sibling = self.git("rev-parse", "HEAD").strip()
        self.git("checkout", "-q", publisher)
        self.git("merge", "--no-ff", "-qm", "merged publisher", "sibling")
        self.approval["source"]["native_superrepo_commit"] = sibling
        with self.assertRaises(ValueError):
            self.verify()

    def test_two_root_annotated_tag_objects_are_not_exact_commit_pins(self):
        native, editor = self.two_roots()
        original = copy.deepcopy(self.approval["source"])
        for field, commit in (("native_superrepo_commit", native), ("superrepo_commit", editor),
                              ("publisher_base_commit", native)):
            with self.subTest(field=field):
                self.git("tag", "-a", field, commit, "-m", "tag is not a source commit")
                self.approval["source"][field] = self.git("rev-parse", field).strip()
                with self.assertRaises(ValueError):
                    self.verify()
                self.approval["source"] = copy.deepcopy(original)

    def test_two_root_wrong_gitlinks_at_either_root_reject(self):
        native, editor = self.two_roots()
        for source_root, path in ((native, "compiler"), (editor, "compiler"), (editor, "beskid_vscode")):
            with self.subTest(root=source_root, path=path):
                tree = self.git("ls-tree", source_root).splitlines()
                changed = "\n".join(line if not line.endswith("\t" + path) else
                                    "160000 commit " + "f" * 40 + "\t" + path for line in tree)
                tree_sha = subprocess.check_output(["git", "-C", str(self.root), "mktree"],
                                                  input=changed + "\n", text=True).strip()
                commit = subprocess.check_output(["git", "-C", str(self.root), "commit-tree", tree_sha,
                                                  "-p", source_root, "-m", "bad gitlink"], text=True).strip()
                source = copy.deepcopy(self.approval["source"])
                if source_root == native:
                    self.approval["source"]["native_superrepo_commit"] = commit
                    # Keep the bad native root genuinely upstream of the editor;
                    # ancestry must pass so this tests the native compiler gitlink.
                    editor_tree = self.git("rev-parse", editor + "^{tree}").strip()
                    descendant = subprocess.check_output(["git", "-C", str(self.root), "commit-tree", editor_tree,
                        "-p", commit, "-m", "editor after bad native"], text=True).strip()
                    self.approval["source"]["superrepo_commit"] = descendant
                else:
                    self.approval["source"]["superrepo_commit"] = commit
                self.git("checkout", "-q", self.approval["source"]["superrepo_commit"])
                with self.assertRaisesRegex(ValueError, "gitlink mismatch"):
                    self.verify()
                self.approval["source"] = source
                self.git("checkout", "-q", self.context["CI_COMMIT_SHA"])

    def test_restamped_native_source_and_changed_bytes_reject(self):
        self.two_roots()
        self.state["provenance"]["superrepo_commit"] = self.approval["source"]["superrepo_commit"]
        self.save_state()
        with self.assertRaisesRegex(ValueError, "native source mismatch"):
            self.verify()
        self.state["provenance"]["superrepo_commit"] = self.approval["source"]["native_superrepo_commit"]
        self.save_state()
        entry = self.approval["targets"][-1]
        (self.native / entry["native_asset"]).write_bytes(b"changed native")
        with self.assertRaisesRegex(ValueError, "standalone native LSP"):
            self.publish()
        self.assertEqual(self.uploads, [])

    def test_two_root_changed_final_vsix_blocks_registry_and_upload(self):
        self.two_roots()
        (self.editors / self.approval["targets"][-1]["asset"]).write_bytes(b"changed VSIX")
        with patch.object(self, "read_registry", side_effect=AssertionError("remote read")):
            with self.assertRaises(ValueError):
                self.publish()
        self.assertEqual(self.uploads, [])

    def test_bounded_pending_contract_blocks_before_transport(self):
        approval = self.api.SelectApproval("0.5.2")
        approval.update(publication_enabled=False, publication_hold="qualifications pending")
        with patch.object(self.api, "ReleaseMetadata", side_effect=AssertionError("transport")):
            with self.assertRaisesRegex(ValueError, "pending"):
                self.api.Prepare(approval, self.root / "snapshot", self.root, self.context)
        with self.assertRaises(ValueError):
            self.api.SelectApproval("../../other")

    def test_two_root_native_state_compiler_version_target_and_embedded_lsp_reject(self):
        self.two_roots()
        saved = copy.deepcopy(self.state)
        for mutate in (lambda: self.state["provenance"].update(compiler_commit="f" * 40),
                       lambda: self.state.update(version="0.5.1"),
                       lambda: self.state["platforms"][-1].update(target="wrong-target"),
                       lambda: self.state.update(publishable=False),
                       lambda: self.state["tests"].update(gate_result="failed")):
            mutate()
            self.save_state()
            with self.assertRaises(ValueError):
                self.verify()
            self.state = copy.deepcopy(saved)
        self.save_state()
        self.zip(self.approval["targets"][-1], payload=b"different embedded server")
        with self.assertRaisesRegex(ValueError, "ZIP LSP"):
            self.publish()
        self.assertEqual(self.uploads, [])

    def test_two_root_immutable_editor_and_native_tag_domains(self):
        self.two_roots()
        requests = []
        def metadata(record, commit):
            requests.append((record["tag"], commit))
            return {x["asset"]: {} for x in self.approval["targets"]}
        with patch.object(self.api, "ReleaseMetadata", side_effect=metadata), \
             patch.object(self.api, "DownloadAsset", side_effect=ValueError("fixture transport stop")):
            context = {k: v for k, v in self.context.items() if k != "OVSX_PAT"}
            with self.assertRaisesRegex(ValueError, "fixture transport stop"):
                self.api.Prepare(self.approval, self.root / "tag-domain-snapshot", self.root, context)
        self.assertEqual(requests, [("editor-v0.5.2", self.approval["source"]["superrepo_commit"]),
                                    ("lsp-v0.5.2", self.compiler)])

    def test_production_cli_untracked_version_before_files_or_secrets(self):
        environment = {k: os.environ[k] for k in ("PATH", "HOME", "SYSTEMROOT") if k in os.environ}
        environment.update(OVSX_PAT="must-not-be-used", VSCE_PAT="must-not-be-used")
        for command in (["python3", str(SCRIPT), "prepare", str(self.root / "absent"), "--version", "0.5.3"],
                        ["python3", str(SCRIPT.parent / "marketplace-publish.py"), "--version", "0.5.3",
                         "preflight", str(self.root / "absent"), str(self.root / "attempt")]):
            result = subprocess.run(command, env=environment, capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertIn("invalid choice", result.stderr)
            self.assertNotIn("must-not-be-used", result.stderr + result.stdout)
        self.assertFalse((self.root / "attempt").exists())

    def test_production_052_admits_verified_owner_accepted_release(self):
        approval = self.api.SelectApproval("0.5.2")
        self.api.VerifyApproval(approval)
        self.api.RequireQualification(approval)

    def test_two_root_derivative_preserves_native_source_and_qualifies_originals(self):
        self.two_roots()
        spec = importlib.util.spec_from_file_location("derivative", SCRIPT.parent / "package-marketplace-editor.py")
        derivative = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(derivative)
        approved = self.root / "approved.json"
        approved.write_text(json.dumps(self.approval))
        with patch.object(derivative.VERIFIER, "SelectApproval", return_value=self.approval):
            receipt = derivative.Package(self.editors, approved, self.root / "derivative", self.native, self.root)
            self.assertEqual(receipt["source"], self.approval["source"])
            self.assertEqual(receipt["version"], "0.5.2")
            self.assertTrue(all(x["non_metadata_inventory_equal"] for x in receipt["targets"]))
            self.state["provenance"]["superrepo_commit"] = self.approval["source"]["superrepo_commit"]
            self.save_state()
            with self.assertRaisesRegex(ValueError, "native source mismatch"):
                derivative.Package(self.editors, approved, self.root / "bad-derivative", self.native, self.root)
            self.assertFalse((self.root / "bad-derivative").exists())

    def test_two_root_derivative_marketplace_and_host_chain_rejects_mutations(self):
        self.two_roots()
        spec = importlib.util.spec_from_file_location("marketplace_chain", SCRIPT.parent / "marketplace-publish.py")
        marketplace = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(marketplace)
        packager = marketplace.PACKAGER
        approved = self.root / "approved.json"
        approved.write_text(json.dumps(self.approval))
        stage = self.root / "stage"
        with patch.object(packager.VERIFIER, "SelectApproval", return_value=self.approval):
            receipt = packager.Package(self.editors, approved, stage, self.native, self.root)
        contract = {"publication_enabled": True, "originals": self.approval["targets"],
                    "original_host_receipt_sha256": "a" * 64,
                    "approval_sha256": self.digest(stage / "marketplace-approval.json"),
                    "derivative_sha256": {x["target"]: x["derivative_sha256"] for x in receipt["targets"]}}
        host = {"schema_version": 1, "kind": "beskid-marketplace-local-host-qualification", "status": "success",
                "original_receipt_sha256": "a" * 64, "marketplace_approval_sha256": contract["approval_sha256"],
                "source": copy.deepcopy(receipt["source"]), "release": {
                    "repository": marketplace.REPOSITORY, "tag": "editor-marketplace-v0.5.2",
                    "source_commit": self.approval["source"]["superrepo_commit"]},
                "extension": {"id": "beskid-lang.beskid-vscode", "publisher": "beskid-lang", "name": "beskid-vscode",
                    "version": "0.5.2", "qualified_target": "linux-x64", "target_set": list(marketplace.TARGETS),
                    "qualified_derivative_sha256": contract["derivative_sha256"]["linux-x64"],
                    "lsp_sha256": self.approval["targets"][0]["lsp_sha256"]},
                "host": {"platform": "linux", "arch": "x64", "vscode_version": "1.96.0"},
                "checks": {"extension_active": True, "workspace_count": 0, "language_id": "beskid",
                    "formatter_self_id": "beskid-lang.beskid-vscode", "formatter_edit_count": 4,
                    "formatter_input_sha256": "7fe52aa5d9a9f32c7eb046142f348ef55ab91afdb93e8aed7fb3851269ea282b",
                    "formatter_output_sha256": "208a141dc9119b749d77c81c931bead1bc9a7168c95271397737867fb9f99b80",
                    "formatter_applied": True, "formatter_saved": True}}
        (stage / marketplace.HOST_QUALIFICATION_NAME).write_text(json.dumps(host))
        # Synthetic fixture bytes cannot have the immutable production binary digest.
        marketplace.HOST_CONTRACTS["0.5.2"]["lsp_sha256"] = self.approval["targets"][0]["lsp_sha256"]
        with patch.object(marketplace, "VERSION", "0.5.2"), \
             patch.object(marketplace, "RELEASE_TAG", "editor-marketplace-v0.5.2"), \
             patch.object(marketplace, "APPROVED_SOURCE", self.approval["source"]), \
             patch.object(marketplace, "ROOT", self.root), \
             patch.object(marketplace, "EXPECTED_STAGE_NAMES", {x["derivative_asset"] for x in receipt["targets"]} |
                {"marketplace-approval.json", marketplace.HOST_QUALIFICATION_NAME}):
            self.assertEqual(marketplace.VerifyStage(stage, contract)["source"], self.approval["source"])
            record = marketplace.Preflight(stage, self.root / "qualified-attempt", self.context, contract)
            self.assertEqual(record["original_host_receipt_sha256"], "a" * 64)
            attempt_receipt = self.root / "qualified-attempt" / marketplace.ATTEMPT_RECEIPT_NAME
            record["source"] = copy.deepcopy(record["source"])
            record["source"].pop("native_superrepo_commit")
            attempt_receipt.write_text(json.dumps(record))
            with patch.object(marketplace, "RunPublisher", side_effect=AssertionError("publisher runner")) as runner:
                with self.assertRaisesRegex(ValueError, "source"):
                    marketplace.Publish(self.root / "qualified-attempt", dict(self.context, VSCE_PAT="test-only"),
                                        contract, runner=runner)
                runner.assert_not_called()
            for document, check in ((receipt, lambda d: marketplace.VerifyApproval(d, contract)),
                                    (host, lambda d: marketplace.VerifyHostQualification(d, receipt, contract))):
                for pin in (None, self.context["CI_COMMIT_SHA"]):
                    changed = copy.deepcopy(document)
                    if pin is None:
                        changed["source"].pop("native_superrepo_commit")
                    else:
                        changed["source"]["native_superrepo_commit"] = pin
                    with self.assertRaisesRegex(ValueError, "source"):
                        check(changed)
            changed = copy.deepcopy(receipt)
            changed["targets"][-1]["original_sha256"] = "f" * 64
            with self.assertRaisesRegex(ValueError, "approval chain"):
                marketplace.VerifyApproval(changed, contract)
            changed = copy.deepcopy(host)
            changed["original_receipt_sha256"] = marketplace.ORIGINAL_HOST_RECEIPT_SHA256
            with self.assertRaisesRegex(ValueError, "original proof"):
                marketplace.VerifyHostQualification(changed, receipt, contract)
            changed = copy.deepcopy(host)
            changed["extension"]["version"] = "0.5.1"
            with self.assertRaises(ValueError):
                marketplace.VerifyHostQualification(changed, receipt, contract)
            raw = {"schema_version": 1, "status": "success", "source": copy.deepcopy(receipt["source"]),
                "source_commit": receipt["source"]["superrepo_commit"], "compiler_commit": self.compiler,
                "derivative_sha256": contract["derivative_sha256"]["linux-x64"],
                "extension_id": "beskid-lang.beskid-vscode", "publisher": "beskid-lang",
                "extension_version": "0.5.2", "formatter_self_id": "beskid-lang.beskid-vscode",
                "server_sha256": self.approval["targets"][0]["lsp_sha256"], "extension_active": True,
                "workspace_count": 0, "language_id": "beskid", "formatter_edit_count": 4,
                "qualified_target": "linux-x64", "platform": "linux", "arch": "x64",
                "vscode_version": "1.96.0", "formatter_applied": True, "formatter_saved": True,
                "before": "pub i32 Formatter() { return 42; }\n",
                "after": "pub i32 Formatter()\n{\n    return 42;\n}\n"}
            raw_path = self.root / "synthetic-raw-host.json"
            with patch.dict(marketplace.HOST_CONTRACTS["0.5.2"], lsp_sha256=raw["server_sha256"]):
                raw_path.write_text(json.dumps(raw))
                raw_contract = dict(contract, original_host_receipt_sha256=self.digest(raw_path))
                result = marketplace.SanitizeHostReceipt(raw_path, stage / "marketplace-approval.json",
                    stage / receipt["targets"][0]["derivative_asset"], self.root / "synthetic-host-proof.json", raw_contract)
                self.assertEqual(result["source"], self.approval["source"])
                for mutate in (lambda d: d["source"].pop("native_superrepo_commit"),
                               lambda d: d["source"].update(native_superrepo_commit=self.context["CI_COMMIT_SHA"]),
                               lambda d: d.update(derivative_sha256="f" * 64),
                               lambda d: d.update(extension_version="0.5.1")):
                    changed = copy.deepcopy(raw)
                    mutate(changed)
                    raw_path.write_text(json.dumps(changed))
                    raw_contract["original_host_receipt_sha256"] = self.digest(raw_path)
                    with self.assertRaises(ValueError):
                        marketplace.SanitizeHostReceipt(raw_path, stage / "marketplace-approval.json",
                            stage / receipt["targets"][0]["derivative_asset"], self.root / "rejected-host-proof.json", raw_contract)
                    self.assertFalse((self.root / "rejected-host-proof.json").exists())
            (stage / receipt["targets"][-1]["derivative_asset"]).write_bytes(b"changed last derivative")
            with self.assertRaises(ValueError):
                marketplace.Preflight(stage, self.root / "attempt", self.context, contract)
            self.assertEqual(json.loads((self.root / "attempt" / marketplace.ATTEMPT_RECEIPT_NAME).read_text())["status"],
                             "preflight-failed")

    def test_two_root_marketplace_real_checkout_and_receipt_chain(self):
        self.two_roots()
        spec = importlib.util.spec_from_file_location("marketplace", SCRIPT.parent / "marketplace-publish.py")
        marketplace = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(marketplace)
        with patch.object(marketplace, "ROOT", self.root), patch.object(marketplace, "VERSION", "0.5.2"), \
             patch.object(marketplace, "APPROVED_SOURCE", self.approval["source"]):
            marketplace.VerifyCheckout(self.context)
            bad = copy.deepcopy(self.approval["source"])
            bad["native_superrepo_commit"] = self.context["CI_COMMIT_SHA"]
            with patch.object(marketplace, "APPROVED_SOURCE", bad):
                with self.assertRaises(ValueError):
                    marketplace.VerifyCheckout(self.context)

    def test_uploads_positional_packages_with_environment_only_token(self):
        self.publish()
        self.assertEqual(len(self.uploads), 3)
        self.assertEqual([x["status"] for x in json.loads((self.root / "results.json").read_text())],
                         ["published", "published", "published"])

    def test_invalid_last_target_blocks_first_upload(self):
        (self.editors / self.approval["targets"][-1]["asset"]).write_bytes(b"tampered")
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.uploads, [])

    def test_held_source_blocks_prepare_before_any_github_read(self):
        self.hold_source()
        requested = []
        with patch.object(self.api, "Request", lambda *args, **kwargs: requested.append(args)):
            with self.assertRaises(ValueError) as failure:
                self.api.Prepare(self.approval, self.root / "held-snapshot", self.root, self.context)
        self.assertIn("publication hold", str(failure.exception).lower())
        self.assertEqual(requested, [])
        self.assertFalse((self.root / "held-snapshot").exists())

    def test_held_source_rechecks_before_registry_or_upload(self):
        self.hold_source()
        registry_reads = []
        uploads = []
        with self.assertRaises(ValueError) as failure:
            self.api.Publish(self.approval, self.editors, self.native, self.root, self.context,
                "/pinned/ovsx", self.root / "held-results.json",
                read_registry=lambda entry: registry_reads.append(entry),
                upload=lambda argv, env: uploads.append((argv, env)))
        self.assertIn("publication hold", str(failure.exception).lower())
        self.assertEqual(registry_reads, [])
        self.assertEqual(uploads, [])

    def test_rejects_unapproved_vsix_digest(self):
        with (self.editors / self.approval["targets"][0]["asset"]).open("ab") as file:
            file.write(b"tampered")
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_lsp_even_when_zip_digest_is_approved(self):
        self.zip(self.approval["targets"][0], payload=b"other binary")
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_wrong_package_identity(self):
        self.zip(self.approval["targets"][0], identity={"publisher": "other"})
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_wrong_xml_target(self):
        entry = self.approval["targets"][0]
        with zipfile.ZipFile(self.editors / entry["asset"]) as archive:
            contents = [(x.filename, archive.read(x)) for x in archive.infolist()]
        with zipfile.ZipFile(self.editors / entry["asset"], "w") as archive:
            for name, data in contents:
                archive.writestr(name, data.replace(b'linux-x64"', b'darwin-arm64"') if name.endswith("vsixmanifest") else data)
        entry["sha256"] = self.digest(self.editors / entry["asset"])
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_extra_server_payload(self):
        self.zip(self.approval["targets"][0], extras=[("extension/server/darwin-arm64/beskid_lsp", b"extra")])
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_extra_target_directory(self):
        self.zip(self.approval["targets"][0], extras=[("extension/server/darwin-arm64/", b"")])
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_nul_in_original_zip_filename(self):
        entry = self.approval["targets"][0]
        self.zip(entry, extras=[("extension/evil", b"bad")])
        path = self.editors / entry["asset"]
        path.write_bytes(path.read_bytes().replace(b"extension/evil", b"extension/e\x00il"))
        entry["sha256"] = self.digest(path)
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_zip_links(self):
        link = zipfile.ZipInfo("extension/link")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        self.zip(self.approval["targets"][0], extras=[(link, "package.json")])
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_incomplete_target_set(self):
        (self.editors / self.approval["targets"][2]["asset"]).unlink()
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.uploads, [])

    def test_rejects_extra_vsix_file(self):
        (self.editors / "unknown.vsix").write_bytes(b"extra")
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_non_regular_vsix(self):
        entry = self.approval["targets"][0]
        path = self.editors / entry["asset"]
        other = self.root / "linked.vsix"
        path.rename(other)
        path.symlink_to(other)
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_unqualified_native_release(self):
        self.state["publishable"] = False
        self.save_state()
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_native_source_drift(self):
        self.state["provenance"]["superrepo_commit"] = "d" * 40
        self.save_state()
        with self.assertRaises(ValueError):
            self.verify()

    def test_rejects_editor_gitlink_drift(self):
        self.approval["source"]["editor_commit"] = "d" * 40
        with self.assertRaises(ValueError):
            self.verify()

    def shallow_source_fixture(self):
        source_tmp = tempfile.TemporaryDirectory(prefix="beskid-source-")
        bare_tmp = tempfile.TemporaryDirectory(prefix="beskid-origin-")
        self.addCleanup(source_tmp.cleanup)
        self.addCleanup(bare_tmp.cleanup)
        source_repo = Path(source_tmp.name)
        bare_repo = Path(bare_tmp.name) / "origin.git"
        subprocess.run(["git", "init", "-q", str(source_repo)], check=True)
        def source_git(*args):
            return subprocess.check_output(["git", "-C", str(source_repo), *args], text=True)
        source_git("config", "user.name", "fixture")
        source_git("config", "user.email", "fixture@example.invalid")
        for name, sha in [("compiler", self.compiler), ("beskid_vscode", self.editor)]:
            source_git("update-index", "--add", "--cacheinfo", "160000," + sha + "," + name)
        source_git("commit", "-qm", "approved source")
        approved = source_git("rev-parse", "HEAD").strip()
        (source_repo / "history-marker").write_text("newer commit\n")
        source_git("add", "history-marker")
        source_git("commit", "-qm", "current checkout")
        subprocess.run(["git", "init", "--bare", "-q", str(bare_repo)], check=True)
        source_git("remote", "add", "origin", "https://github.com/Cyber-Nomad-Collective/beskid.git")
        source_git("config", "url.file://" + str(bare_repo) + ".insteadOf", "https://github.com/Cyber-Nomad-Collective/beskid.git")
        source_git("push", "-q", "origin", "HEAD")
        shallow_tmp = tempfile.TemporaryDirectory(prefix="beskid-shallow-")
        self.addCleanup(shallow_tmp.cleanup)
        shallow = Path(shallow_tmp.name)
        subprocess.run(["git", "clone", "-q", "--depth=1", "file://" + str(bare_repo), str(shallow)], check=True)
        subprocess.run(["git", "-C", str(shallow), "remote", "set-url", "origin", "https://github.com/Cyber-Nomad-Collective/beskid.git"], check=True)
        self.git_at(shallow, "config", "url.file://" + str(bare_repo) + ".insteadOf", "https://github.com/Cyber-Nomad-Collective/beskid.git")
        return shallow, approved

    def test_hydrates_shallow_history_from_trusted_origin_before_ancestry(self):
        shallow, approved = self.shallow_source_fixture()
        self.assertEqual(self.git_at(shallow, "config", "--get", "remote.origin.url").strip(), "https://github.com/Cyber-Nomad-Collective/beskid.git")
        approval = copy.deepcopy(self.approval)
        approval["source"]["superrepo_commit"] = approved
        approval["source"]["publisher_base_commit"] = approved
        self.api.VerifySource(approval, shallow)
        self.assertEqual(self.git_at(shallow, "rev-parse", "--is-shallow-repository"), "false\n")

    def test_rejects_shallow_history_with_untrusted_origin(self):
        shallow, approved = self.shallow_source_fixture()
        subprocess.run(["git", "-C", str(shallow), "remote", "set-url", "origin", "https://example.invalid/not-beskid.git"], check=True)
        approval = copy.deepcopy(self.approval)
        approval["source"]["superrepo_commit"] = approved
        approval["source"]["publisher_base_commit"] = approved
        with self.assertRaises(ValueError):
            self.api.VerifySource(approval, shallow)

    def git_at(self, root, *args):
        return subprocess.check_output(["git", "-C", str(root), *args], text=True)

    def test_rejects_standalone_native_lsp_digest_drift(self):
        (self.native / self.approval["targets"][0]["native_asset"]).write_bytes(b"tampered")
        with self.assertRaises(ValueError):
            self.verify()

    def test_accepts_standalone_lsp_without_equating_separately_built_bundle(self):
        entry = self.approval["targets"][0]
        with tarfile.open(self.native / "separately-built-bundle.tar.gz", "w:gz") as archive:
            info = tarfile.TarInfo("beskid-0.5.1-x86_64-unknown-linux-gnu/bin/beskid_lsp")
            different = b"separate build from same frozen source"
            info.size = len(different)
            archive.addfile(info, io.BytesIO(different))
        try:
            self.verify()
        except ValueError as error:
            self.fail("standalone LSP must be the authority, not separately built bundle bytes: " + str(error))

    def test_rejects_missing_standalone_native_lsp(self):
        entry = self.approval["targets"][0]
        (self.native / entry["native_asset"]).unlink()
        with self.assertRaises(ValueError):
            self.verify()

    def test_accepts_optional_qualified_state_enrichment(self):
        self.state["provenance"]["additional_acceptance"] = {"status": "approved"}
        self.state["installer_owner_acceptance"] = {"scope": "windows"}
        self.save_state()
        try:
            self.verify()
        except ValueError as error:
            self.fail("optional qualification enrichment must preserve required field validation: " + str(error))

    def test_source_verification_child_never_receives_publisher_secret(self):
        calls = []
        run = subprocess.run
        def observe(argv, **kwargs):
            calls.append(dict(kwargs.get("env", os.environ)))
            return run(argv, **kwargs)
        with patch.dict(os.environ, {"OVSX_PAT": "must-not-reach-git"}), patch.object(self.api.subprocess, "run", observe):
            self.verify()
        self.assertTrue(calls)
        self.assertTrue(all("OVSX_PAT" not in env for env in calls))

    def test_prepare_rejects_secret_before_transport_or_snapshot_creation(self):
        with self.assertRaises(ValueError):
            self.api.Prepare(self.approval, self.root / "snapshot", self.root, self.context)
        self.assertFalse((self.root / "snapshot").exists())

    def test_rejects_wrong_immutable_tag_commit(self):
        release = {"tag_name": "editor-v0.5.1", "draft": False, "prerelease": False, "assets": []}
        def request(url, limit):
            return json.dumps(release if "/releases/" in url else {"object": {"type": "commit", "sha": "d" * 40}}).encode()
        with patch.object(self.api, "Request", request), self.assertRaises(ValueError):
            self.api.ReleaseMetadata(self.approval["editor_release"], self.source)

    def test_asset_metadata_digest_must_match_reviewed_hash_before_download(self):
        entry = self.approval["targets"][0]
        assets = {entry["asset"]: {"state": "uploaded", "size": 20, "digest": "sha256:" + "d" * 64}}
        with self.assertRaises(ValueError):
            self.api.DownloadAsset(self.approval["editor_release"], assets, entry["asset"],
                self.root / "must-not-download.vsix", 100, entry["sha256"])
        self.assertFalse((self.root / "must-not-download.vsix").exists())

    def test_registry_metadata_wrong_target_is_rejected_before_download(self):
        metadata = {"namespace": "beskid", "name": "beskid-vscode", "version": "0.5.1",
                    "targetPlatform": "darwin-arm64", "files": {"download": "https://open-vsx.org/package"}}
        with patch.object(self.api, "Request", lambda *args, **kwargs: json.dumps(metadata).encode()), self.assertRaises(ValueError):
            self.api.RegistryPackage(self.approval["targets"][0], self.approval)

    def test_registry_request_uses_selected_immutable_version_and_target(self):
        for version, expected_url in (
            ("0.5.1", "https://open-vsx.org/api/beskid/beskid-vscode/linux-x64/0.5.1"),
            ("0.5.2", "https://open-vsx.org/api/beskid/beskid-vscode/linux-x64/0.5.2"),
        ):
            with self.subTest(version=version):
                if version == "0.5.2":
                    self.two_roots()
                entry = self.approval["targets"][0]
                download = "https://open-vsx.org/package/" + entry["asset"]
                content = (self.editors / entry["asset"]).read_bytes()
                calls = []
                def request(url, limit, missing=False):
                    calls.append((url, limit, missing))
                    if len(calls) == 1:
                        return json.dumps({"namespace": "beskid", "name": "beskid-vscode", "version": version,
                            "targetPlatform": "linux-x64", "files": {"download": download}}).encode()
                    self.assertEqual(url, download)
                    return content
                with patch.object(self.api, "Request", side_effect=request):
                    self.assertEqual(self.api.RegistryPackage(entry, self.approval), content)
                self.assertEqual(calls, [(expected_url, self.api.MAX_JSON, True),
                                         (download, self.api.MAX_VSIX, False)])

    def test_selected_registry_last_metadata_or_read_failure_precedes_first_upload(self):
        self.two_roots()
        entries = self.approval["targets"]
        for failure in ("metadata", "read"):
            with self.subTest(failure=failure):
                inspected = []
                def request(url, limit, missing=False):
                    if "/api/" in url:
                        self.assertTrue(url.endswith("/0.5.2"))
                        target = url.split("/")[-2]
                        inspected.append(target)
                        entry = next(x for x in entries if x["target"] == target)
                        if target == entries[-1]["target"] and failure == "read":
                            raise ValueError("fixture registry read rejected")
                        version = "0.5.1" if target == entries[-1]["target"] else "0.5.2"
                        return json.dumps({"namespace": "beskid", "name": "beskid-vscode", "version": version,
                            "targetPlatform": target, "files": {"download": "https://open-vsx.org/" + entry["asset"]}}).encode()
                    return (self.editors / url.rsplit("/", 1)[1]).read_bytes()
                with patch.object(self.api, "Request", side_effect=request):
                    with self.assertRaisesRegex(ValueError, "metadata mismatch|fixture registry read rejected"):
                        self.api.Publish(self.approval, self.editors, self.native, self.root, self.context,
                            "/pinned/ovsx", self.root / "registry-results.json", upload=self.upload)
                self.assertEqual(inspected, [x["target"] for x in entries])
                self.assertEqual(self.uploads, [])

    def test_prepare_requires_static_native_compiler_repository(self):
        self.approval["native_release"]["repository"] = "Cyber-Nomad-Collective/beskid"
        with self.assertRaises(ValueError):
            self.verify()

    def test_prepare_verifies_frozen_downloads_without_any_publisher_process(self):
        self.context.pop("OVSX_PAT")
        def request(url, limit):
            editor = "/beskid/" in url
            commit = self.source if editor else self.compiler
            if "/git/ref/" in url:
                return json.dumps({"object": {"type": "commit", "sha": commit}}).encode()
            record = self.approval["editor_release" if editor else "native_release"]
            directory = self.editors if editor else self.native
            assets = [{"name": path.name, "state": "uploaded", "size": path.stat().st_size,
                       "digest": "sha256:" + self.digest(path)} for path in directory.iterdir()]
            return json.dumps({"tag_name": record["tag"], "draft": False, "prerelease": False, "assets": assets}).encode()
        def response(url, timeout):
            name = url.rsplit("/", 1)[1]
            return io.BytesIO(((self.editors if name.endswith(".vsix") else self.native) / name).read_bytes())
        with patch.object(self.api, "Request", request), patch.object(self.api.urllib.request, "urlopen", response):
            self.api.Prepare(self.approval, self.root / "snapshot", self.root, self.context)
        self.assertEqual(len(self.api.VerifyRelease(self.approval, self.root / "snapshot/editors",
                                                  self.root / "snapshot/native", self.root)), 3)
        self.assertEqual(self.uploads, [])

    def test_real_upload_executes_only_pinned_cli_positional_file(self):
        # The executable replaces the external marketplace boundary, not validation.
        executable = self.root / "ovsx"
        record = self.root / "command.json"
        executable.write_text("#!/usr/bin/env python3\nimport json,os,sys\nfrom pathlib import Path\n"
            "Path(" + repr(str(record)) + ").write_text(json.dumps({'argv':sys.argv[1:],'token':os.environ.get('OVSX_PAT'),"
            "'has_gh': 'GH_TOKEN' in os.environ}))\n")
        executable.chmod(0o700)
        def read(entry):
            return (self.editors / entry["asset"]).read_bytes() if record.exists() else None
        self.api.Publish(self.approval, self.editors, self.native, self.root, self.context, str(executable),
                         self.root / "results.json", read_registry=read)
        result = json.loads(record.read_text())
        self.assertEqual(result["argv"], ["publish", str(self.editors / self.approval["targets"][2]["asset"])])
        self.assertEqual(result["token"], "test-only-token")
        self.assertFalse(result["has_gh"])

    @unittest.skipUnless(os.environ.get("BESKID_EDITOR_REAL_STATE"), "frozen release files are optional local verification inputs")
    def test_full_real_qualified_release_with_fake_external_transports(self):
        # Use the complete canonical receipt and all actual files, never a reduced state fixture.
        approval = json.loads(self.api.APPROVAL.read_bytes())
        state = Path(os.environ["BESKID_EDITOR_REAL_STATE"])
        editors = Path(os.environ["BESKID_EDITOR_REAL_VSIX"])
        evidence = Path(os.environ["BESKID_EDITOR_REAL_NATIVE"])
        lanes = {"linux-x64": "linux", "darwin-arm64": "macos", "win32-x64": "windows"}
        files = {"release-state.json": state.read_bytes(), "lsp-version.txt": b"0.5.1\n"}
        for entry in approval["targets"]:
            files[entry["asset"]] = (editors / entry["asset"]).read_bytes()
            files[entry["native_asset"]] = (evidence / lanes[entry["target"]] / entry["native_asset"]).read_bytes()
            self.api.VerifyNativeLsp(evidence / lanes[entry["target"]] / entry["native_asset"], entry)
        def request(url, limit):
            editor = "/beskid/" in url
            record = approval["editor_release" if editor else "native_release"]
            commit = approval["source"]["superrepo_commit" if editor else "compiler_commit"]
            if "/git/ref/" in url:
                return json.dumps({"object": {"type": "commit", "sha": commit}}).encode()
            assets = [{"name": name, "state": "uploaded", "size": len(data),
                       "digest": "sha256:" + hashlib.sha256(data).hexdigest()}
                      for name, data in files.items() if name.endswith(".vsix") == editor]
            return json.dumps({"tag_name": record["tag"], "draft": False, "prerelease": False, "assets": assets}).encode()
        def response(url, timeout):
            return io.BytesIO(files[url.rsplit("/", 1)[1]])
        snapshot = self.root / "real-snapshot"
        context = {k: v for k, v in self.context.items() if k != "OVSX_PAT"}
        with patch.object(self.api, "Request", request), patch.object(self.api.urllib.request, "urlopen", response):
            self.api.Prepare(approval, snapshot, self.api.ROOT, context)
        published, commands = {}, []
        def upload(argv, env):
            self.assertEqual(len(self.api.VerifyRelease(approval, snapshot / "editors", snapshot / "native", self.api.ROOT)), 3)
            self.assertEqual(argv[1], "publish")
            self.assertEqual(len(argv), 3)
            self.assertEqual(env["OVSX_PAT"], "test-only-token")
            self.assertNotIn("test-only-token", " ".join(argv))
            entry = next(x for x in approval["targets"] if Path(argv[2]).name == x["asset"])
            published[entry["target"]] = Path(argv[2]).read_bytes()
            commands.append(argv)
        self.api.Publish(approval, snapshot / "editors", snapshot / "native", self.api.ROOT, self.context,
                         "/pinned/ovsx", snapshot / "results.json", read_registry=lambda entry: published.get(entry["target"]),
                         upload=upload)
        self.assertEqual(len(commands), 3)
        self.assertEqual([x["status"] for x in json.loads((snapshot / "results.json").read_text())], ["published"] * 3)

    def test_existing_matching_target_is_verified_and_skipped(self):
        entry = self.approval["targets"][0]
        self.remote[entry["target"]] = (self.editors / entry["asset"]).read_bytes()
        self.publish()
        self.assertEqual(len(self.uploads), 2)

    def test_existing_mismatching_target_blocks_all_uploads(self):
        self.remote["win32-x64"] = b"different existing version"
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.uploads, [])

    def test_partial_failure_stops_and_records_without_undo(self):
        def fail_second(argv, env):
            if len(self.uploads) == 1:
                raise RuntimeError("external upload failed")
            self.upload(argv, env)
        with self.assertRaises(RuntimeError):
            self.api.Publish(self.approval, self.editors, self.native, self.root, self.context,
                "/pinned/ovsx", self.root / "results.json", read_registry=self.read_registry, upload=fail_second)
        self.assertEqual(len(self.uploads), 1)
        results = json.loads((self.root / "results.json").read_text())
        self.assertEqual([x["status"] for x in results], ["published", "failed"])

    def test_changed_registry_package_after_upload_stops(self):
        def changed(argv, env):
            self.upload(argv, env)
            self.remote["linux-x64"] = b"signed or different bytes"
        with self.assertRaises(ValueError):
            self.api.Publish(self.approval, self.editors, self.native, self.root, self.context,
                "/pinned/ovsx", self.root / "results.json", read_registry=self.read_registry, upload=changed)
        self.assertEqual(len(self.uploads), 1)


def ZipCase(name):
    def case(self):
        self.zip(self.approval["targets"][0], extras=[(name, b"unsafe")])
        with self.assertRaises(ValueError):
            self.verify()
    return case


for i, name in enumerate(["../outside", "/absolute", "extension/../escape", "extension\\escape",
                          "C:/drive", "extension//alias", "extension/package.json", "extension/Package.json"]):
    setattr(PublisherTests, "test_rejects_unsafe_or_duplicate_zip_" + str(i), ZipCase(name))


def ContextCase(key, value):
    def case(self):
        self.context[key] = value
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.uploads, [])
    return case


for key, value in [("CI_PIPELINE_EVENT", "push"), ("CI_COMMIT_BRANCH", "feature"),
                   ("CI_REPO", "other/repo"), ("CI_COMMIT_SHA", "0" * 40),
                   ("BESKID_TASK", "build"), ("OVSX_PAT", "")]:
    setattr(PublisherTests, "test_rejects_invalid_context_" + key.lower(), ContextCase(key, value))

if __name__ == "__main__":
    unittest.main()
