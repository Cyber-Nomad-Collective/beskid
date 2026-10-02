import test from "node:test";
import assert from "node:assert/strict";
import { resolveVerifiedEditorLsp } from "../package-editor-release.mjs";

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
