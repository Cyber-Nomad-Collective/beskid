#!/usr/bin/env node
// Package the already-verified native release LSP without rebuilding compiler sources.
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveEditorAuthoringVersion } from "./editor-version.mjs";

const platforms = {
  "linux-x64": { lane: "linux", target: "x86_64-unknown-linux-gnu", asset: "beskid_lsp-linux-amd64" },
  "darwin-arm64": { lane: "macos", target: "aarch64-apple-darwin", asset: "beskid_lsp-darwin-arm64" },
  "win32-x64": { lane: "windows", target: "x86_64-pc-windows-msvc", asset: "beskid_lsp-windows-amd64.exe" },
};

export function attestEditorSource(root) {
  const extensionRoot = join(root, "beskid_vscode");
  const git = (checkout, ...args) => execFileSync("git", ["-C", checkout, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    git(root, "diff", "--quiet", "--ignore-submodules=dirty", "HEAD");
    git(root, "diff", "--cached", "--quiet");
  } catch { throw new Error("editor release requires clean tracked root source"); }
  if (realpathSync(git(extensionRoot, "rev-parse", "--show-toplevel")) !== realpathSync(extensionRoot)) {
    throw new Error("editor release requires an initialized VS Code checkout");
  }
  if (git(extensionRoot, "rev-parse", "HEAD") !== git(root, "rev-parse", "HEAD:beskid_vscode")) {
    throw new Error("VS Code checkout does not match the root gitlink");
  }
  try {
    git(extensionRoot, "diff", "--quiet", "HEAD");
    git(extensionRoot, "diff", "--cached", "--quiet");
  } catch { throw new Error("editor release requires clean tracked VS Code source"); }
}

export function resolveVerifiedEditorLsp({ evidence, evidenceRoot, platformKey, version, sourceCommit, compilerCommit }) {
  const platform = platforms[platformKey];
  if (!platform) throw new Error("unsupported editor release platform");
  if (!/^[a-f0-9]{40}$/.test(sourceCommit ?? "") || !/^[a-f0-9]{40}$/.test(compilerCommit ?? "")) {
    throw new Error("editor release requires exact native source commits");
  }
  if (evidence.schema_version !== 1 || evidence.version !== version) throw new Error("editor/native release version mismatch");
  if (evidence.source?.superrepo_commit !== sourceCommit || evidence.source?.compiler_commit !== compilerCommit) {
    throw new Error("editor/native release source mismatch");
  }
  if (evidence.platforms?.length !== 1) throw new Error("editor packaging requires one verified native platform");
  const lane = evidence.platforms[0];
  if (lane.platform !== platform.lane || lane.target !== platform.target) throw new Error("editor/native release target mismatch");
  const artifacts = lane.artifacts.filter(item => item.name === platform.asset);
  if (artifacts.length !== 1 || !/^[a-f0-9]{64}$/.test(artifacts[0].sha256 ?? "")) throw new Error("verified native LSP digest missing");
  return { artifactPath: join(resolve(evidenceRoot), platform.lane, platform.asset), sha256: artifacts[0].sha256 };
}

export function VerifyEditorNativeRoots(root, nativeRoot, editorRoot) {
  if (![nativeRoot, editorRoot].every(pin => /^[a-f0-9]{40}$/.test(pin ?? ""))) {
    throw new Error("editor release requires exact native and editor root commits");
  }
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  if ([nativeRoot, editorRoot].some(pin => git("cat-file", "-t", pin) !== "commit")) {
    throw new Error("editor release source pin is not a commit object");
  }
  git("merge-base", "--is-ancestor", nativeRoot, editorRoot);
  git("merge-base", "--is-ancestor", editorRoot, "HEAD");
  const nativeCompiler = git("ls-tree", nativeRoot, "--", "compiler");
  if (!/^160000 commit [a-f0-9]{40}\tcompiler$/.test(nativeCompiler) ||
      git("ls-tree", editorRoot, "--", "compiler") !== nativeCompiler) {
    throw new Error("editor root compiler pin differs from native evidence source");
  }
  return nativeCompiler.slice("160000 commit ".length, "160000 commit ".length + 40);
}

function main() {
  const [platformKey, evidenceDirectory, nativeSourceCommit] = process.argv.slice(2);
  if (!platformKey || !evidenceDirectory || !nativeSourceCommit || process.argv.length !== 5) {
    throw new Error("usage: package-editor-release.mjs <linux-x64|darwin-arm64|win32-x64> <native-evidence-root> <native-root-commit>");
  }
  const platform = platforms[platformKey];
  if (!platform) throw new Error("unsupported editor release platform");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const extensionRoot = join(root, "beskid_vscode");
  attestEditorSource(root);
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
  const version = resolveEditorAuthoringVersion(join(root, "editors/zed"), extensionRoot);
  const sourceCommit = nativeSourceCommit;
  const approved = version === "0.5.2" ? JSON.parse(readFileSync(
    join(root, "scripts/ci/editor-marketplace-approvals/0.5.2.json"), "utf8")).source : null;
  const editorRoot = approved?.superrepo_commit ?? git("rev-parse", "HEAD");
  const compilerCommit = VerifyEditorNativeRoots(root, sourceCommit, editorRoot);
  if (version === "0.5.2") {
    git("merge-base", "--is-ancestor", approved.publisher_base_commit, "HEAD");
    if (sourceCommit !== approved.native_superrepo_commit || compilerCommit !== approved.compiler_commit ||
        git("ls-tree", "HEAD", "--", "compiler") !== `160000 commit ${approved.compiler_commit}\tcompiler` ||
        git("ls-tree", editorRoot, "--", "beskid_vscode") !== `160000 commit ${approved.editor_commit}\tbeskid_vscode` ||
        git("rev-parse", "HEAD:beskid_vscode") !== approved.editor_commit) {
      throw new Error("0.5.2 packaging source differs from the tracked exact two-root contract");
    }
  }
  const evidenceRoot = resolve(evidenceDirectory);
  const evidence = JSON.parse(execFileSync(process.execPath,
    [join(root, "scripts/ci/woodpecker-release-evidence.mjs"), evidenceRoot, platform.lane], { encoding: "utf8" }));
  const artifact = resolveVerifiedEditorLsp({ evidence, evidenceRoot, platformKey, version, sourceCommit, compilerCommit });
  execFileSync(process.execPath, [join(extensionRoot, "scripts/package-vsix.mjs")], {
    cwd: extensionRoot, stdio: "inherit", env: {
      ...process.env, BESKID_EDITOR_PLATFORM: platformKey,
      BESKID_EDITOR_RELEASE_VERSION: version,
      BESKID_EDITOR_LSP_ARTIFACT: artifact.artifactPath,
      BESKID_EDITOR_LSP_SHA256: artifact.sha256,
    },
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
