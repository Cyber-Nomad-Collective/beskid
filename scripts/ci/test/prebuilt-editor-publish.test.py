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
        package = {"publisher": "beskid", "name": "beskid-vscode", "version": "0.5.1"}
        package.update(identity or {})
        manifest = '<PackageManifest><Metadata><Identity Publisher="beskid" Id="beskid-vscode" Version="0.5.1" TargetPlatform="' + target + '"/></Metadata></PackageManifest>'
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

    def test_verifies_complete_real_zip_and_standalone_lsp_set(self):
        self.assertEqual(len(self.verify()), 3)

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
