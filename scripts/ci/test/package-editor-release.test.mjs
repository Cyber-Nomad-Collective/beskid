import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { attestEditorSource, resolveVerifiedEditorLsp } from "../package-editor-release.mjs";
import * as packager from "../package-editor-release.mjs";

const sourceCommit = "a".repeat(40), compilerCommit = "b".repeat(40), sha256 = "c".repeat(64);
function fixture() {
  return { evidenceRoot: "/tmp/native", platformKey: "linux-x64", version: "0.5.1", sourceCommit, compilerCommit,
    evidence: { schema_version: 1, version: "0.5.1", source: { superrepo_commit: sourceCommit, compiler_commit: compilerCommit },
      platforms: [{ platform: "linux", target: "x86_64-unknown-linux-gnu", artifacts: [{ name: "beskid_lsp-linux-amd64", sha256 }] }] } };
}
test("selects only the verified LSP for the declared target", () => {
  assert.deepEqual(resolveVerifiedEditorLsp(fixture()), { artifactPath: "/tmp/native/linux/beskid_lsp-linux-amd64", sha256 });
});
for (const [label, mutate] of [
  ["version", f => { f.evidence.version = "0.4.0"; }],
  ["root source", f => { f.evidence.source.superrepo_commit = "d".repeat(40); }],
  ["compiler source", f => { f.evidence.source.compiler_commit = "d".repeat(40); }],
  ["target", f => { f.evidence.platforms[0].target = "aarch64-apple-darwin"; }],
  ["digest", f => { f.evidence.platforms[0].artifacts[0].sha256 = ""; }],
  ["missing asset", f => { f.evidence.platforms[0].artifacts = []; }],
  ["unsupported platform", f => { f.platformKey = "darwin-x64"; }],
]) test(`rejects ${label} drift`, () => { const f = fixture(); mutate(f); assert.throws(() => resolveVerifiedEditorLsp(f)); });

function sourceFixture(t) {
  const root = mkdtempSync(join(tmpdir(), "beskid-editor-source-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const editor = join(root, "beskid_vscode");
  mkdirSync(editor);
  const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  for (const cwd of [root, editor]) {
    git(cwd, "init", "-q");
    git(cwd, "config", "user.name", "contract");
    git(cwd, "config", "user.email", "contract@example.invalid");
  }
  writeFileSync(join(editor, "source.ts"), "original source\n");
  git(editor, "add", "source.ts");
  git(editor, "commit", "-qm", "editor source");
  const editorCommit = git(editor, "rev-parse", "HEAD");
  writeFileSync(join(root, "source.txt"), "original root\n");
  git(root, "add", "source.txt");
  git(root, "update-index", "--add", "--cacheinfo", `160000,${editorCommit},beskid_vscode`);
  git(root, "commit", "-qm", "root source");
  return { root, editor, git };
}

test("verifies exact native ancestor/editor descendant roots with the same compiler", t => {
  const f = sourceFixture(t);
  f.git(f.root, "update-index", "--add", "--cacheinfo", `160000,${compilerCommit},compiler`);
  f.git(f.root, "commit", "-qm", "native compiler");
  const native = f.git(f.root, "rev-parse", "HEAD");
  f.git(f.editor, "commit", "--allow-empty", "-qm", "final editor");
  f.git(f.root, "update-index", "--cacheinfo", `160000,${f.git(f.editor, "rev-parse", "HEAD")},beskid_vscode`);
  f.git(f.root, "commit", "-qm", "editor root");
  const editor = f.git(f.root, "rev-parse", "HEAD");
  f.git(f.root, "commit", "--allow-empty", "-qm", "publisher");
  assert.equal(typeof packager.VerifyEditorNativeRoots, "function", "exact root authority is not implemented");
  assert.equal(packager.VerifyEditorNativeRoots(f.root, native, editor), compilerCommit);
  for (const pin of ["", native.slice(0, 8), "F".repeat(40), "e".repeat(40), f.git(f.root, "rev-parse", "HEAD")]) {
    assert.throws(() => packager.VerifyEditorNativeRoots(f.root, pin, editor));
  }
  f.git(f.root, "update-index", "--cacheinfo", `160000,${"f".repeat(40)},compiler`);
  f.git(f.root, "commit", "-qm", "changed compiler");
  assert.throws(() => packager.VerifyEditorNativeRoots(f.root, native, f.git(f.root, "rev-parse", "HEAD")), /compiler/);
});

test("attests the clean root and its pinned editor checkout", t => {
  const { root } = sourceFixture(t);
  assert.doesNotThrow(() => attestEditorSource(root));
});
for (const staged of [false, true]) {
  for (const scope of ["root", "editor"]) test(`rejects ${staged ? "staged" : "unstaged"} tracked ${scope} edits`, t => {
    const f = sourceFixture(t), cwd = f[scope];
    const filename = scope === "root" ? "source.txt" : "source.ts";
    writeFileSync(join(cwd, filename), "modified source\n");
    if (staged) f.git(cwd, "add", filename);
    assert.throws(() => attestEditorSource(f.root), /clean tracked/);
  });
}
test("rejects a different clean editor commit with matching metadata", t => {
  const f = sourceFixture(t);
  f.git(f.editor, "commit", "--allow-empty", "-qm", "different editor revision");
  assert.throws(() => attestEditorSource(f.root), /clean tracked root|root gitlink/);
});
test("rejects an editor checkout pinned only in the root index", t => {
  const f = sourceFixture(t);
  f.git(f.editor, "commit", "--allow-empty", "-qm", "different editor revision");
  f.git(f.root, "update-index", "--cacheinfo", `160000,${f.git(f.editor, "rev-parse", "HEAD")},beskid_vscode`);
  assert.throws(() => attestEditorSource(f.root), /clean tracked root/);
});
