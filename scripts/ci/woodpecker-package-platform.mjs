#!/usr/bin/env node
// Package an already qualified release. No downloads, registry writes or marker
// publication. Run on the matching native host with beskid_distrib initialized.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { AssertCleanDistrib, AssertNoPrerequisitesLockOverride } from "./package-source-authority.mjs";
import { PruneBundleCaches } from "./lib/bundle-caches.mjs";
import { ValidatePacketEvidence } from "./lib/packet-evidence.mjs";
const scripts = dirname(fileURLToPath(import.meta.url));
const distrib = resolve(scripts, "../../beskid_distrib");
function run(command, args, cwd, label) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) throw new Error(`${label}: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout;
}
function bashPath(path) {
  if (process.platform !== "win32") return path;
  return run("cygpath", ["-u", path], undefined, "Windows Bash path conversion failed").trim();
}
function digest(path) { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
try {
  const usage = "usage: woodpecker-package-platform.mjs <linux|macos|windows> <evidence-dir> <new-output-dir> [--repackage <build-pipeline> <repackage-pipeline> [--supersedes <pipeline>]]";
  const args = process.argv.slice(2);
  if (args.length !== 3 && !(args.length === 6 && args[3] === "--repackage") && !(args.length === 8 && args[3] === "--repackage" && args[6] === "--supersedes")) throw new Error(usage);
  const [platform, inputArg, outputArg] = args;
  if (!["linux", "macos", "windows"].includes(platform)) throw new Error("unsupported platform");
  // Repackaging packages the qualified outputs of an earlier build pipeline from this newer root
  // commit, which may differ from the build source only in packaging inputs (ValidatePackagingRoot).
  const repackage = args.length >= 6 ? { build: args[4], pipeline: args[5] } : null;
  if (repackage && (!/^[1-9][0-9]*$/.test(repackage.build) || !/^[1-9][0-9]*$/.test(repackage.pipeline) || repackage.build === repackage.pipeline)) throw new Error(usage);
  // A superseding repackage (lib/repackage.mjs --supersedes) names the packaging it replaces.
  const supersedes = args.length === 8 ? args[7] : null;
  if (supersedes !== null && (!/^[1-9][0-9]*$/.test(supersedes) || Number(supersedes) < Number(repackage.build) || Number(supersedes) >= Number(repackage.pipeline))) throw new Error(usage);
  const input = resolve(inputArg), output = resolve(outputArg);
  // Validate exactly the build's checksummed packet (lib/packet-evidence.mjs).
  const evidence = ValidatePacketEvidence(input, platform);
  const root = resolve(scripts, "../..");
  const rootCommit = run("git", ["rev-parse", "HEAD"], root, "source lookup failed").trim();
  if (repackage) {
    run(process.execPath, [join(scripts, "release-user-observation.mjs"), "--packaging-root", root, evidence.source.superrepo_commit, rootCommit, rootCommit], undefined, "repackaging root is not a packaging-only descendant of the build source");
  } else if (rootCommit !== evidence.source.superrepo_commit) {
    throw new Error("checkout does not match release evidence");
  }
  const expectedDistrib = run("git", ["rev-parse", "HEAD:beskid_distrib"], root, "distribution gitlink lookup failed").trim();
  const actualDistrib = run("git", ["rev-parse", "HEAD"], distrib, "distribution checkout lookup failed").trim();
  if (actualDistrib !== expectedDistrib) throw new Error("distribution checkout does not match source gitlink");
  AssertCleanDistrib(distrib);
  if (platform === "windows") AssertNoPrerequisitesLockOverride(process.env);
  const target = evidence.platforms.find(item => item.platform === platform);
  const archive = target.artifacts.find(item => item.name.endsWith(".tar.gz"));
  mkdirSync(output, { mode: 0o700 });
  const snapshot = join(output, archive.name);
  copyFileSync(join(input, platform, archive.name), snapshot);
  if (digest(snapshot) !== archive.sha256) throw new Error("bundle changed while snapshotting");
  const bundle = join(output, "bundle");
  run("bash", [bashPath(join(distrib, "scripts/extract-release-bundle.sh")), bashPath(snapshot), evidence.version, target.target, bashPath(bundle)], output, "bundle extraction failed");
  // Installers ship the toolchain, not the build caches that prebuilding the Corelib Mods left in the
  // bundle; the release tarball itself stays byte-identical to the qualified build.
  const pruned = PruneBundleCaches(bundle);
  process.stderr.write(`distribution: removed ${pruned.length} build-cache path(s) from the installer bundle\n`);
  const version = evidence.version;
  let files;
  if (platform === "linux") {
    run("bash", [join(distrib, "deb/build-deb.sh"), version, bundle], output, "Debian packaging failed");
    files = [`beskid-${version}-amd64.deb`];
  } else if (platform === "macos") {
    run("bash", [join(distrib, "macos/build-dmg.sh"), version, bundle, join(distrib, "assets")], output, "DMG packaging failed");
    const template = readFileSync(join(distrib, "macos/Formula/beskid.rb.tpl"), "utf8");
    const formula = template.replaceAll("__VERSION__", version).replaceAll("__SHA256__", archive.sha256)
      .replace("beskid-aarch64-apple-darwin.tar.gz", archive.name);
    writeFileSync(join(output, "beskid.rb"), formula, { flag: "wx" });
    files = [`beskid-${version}-macos-arm64.dmg`, "beskid.rb"];
  } else {
    const assets = join(output, "installer-assets");
    mkdirSync(assets); mkdirSync(join(assets, "icons"));
    const bootstrapperLogo = join(distrib, "assets/icons/beskid-512.png");
    copyFileSync(bootstrapperLogo, join(assets, "icons/beskid-512.png"));
    run("bash", [bashPath(join(distrib, "windows/generate-brand-assets.sh")), bashPath(join(distrib, "assets")), bashPath(assets)], output, "installer artwork generation failed");
    run("bash", [bashPath(join(distrib, "windows/build-msi.sh")), version, bashPath(bundle), bashPath(assets)], output, "MSI packaging failed");
    run("bash", [bashPath(join(distrib, "windows/build-exe.sh")), version, bashPath(join(output, `beskid-${version}-windows-amd64.msi`)), bashPath(assets)], output, "EXE packaging failed");
    files = [`beskid-${version}-windows-amd64.msi`, `beskid-${version}-windows-amd64.exe`];
  }
  const artifacts = files.map(name => {
    if (!statSync(join(output, name)).isFile() || statSync(join(output, name)).size === 0) throw new Error(`missing installer: ${name}`);
    return { name, sha256: digest(join(output, name)) };
  });
  const packagedBy = repackage ? { packaged_by: { pipeline: Number(repackage.pipeline), superrepo_commit: rootCommit, build_pipeline: Number(repackage.build), ...(supersedes !== null ? { supersedes: Number(supersedes) } : {}) } } : {};
  const result = { schema_version: 1, platform, target: target.target, version, source: evidence.source, distrib_commit: actualDistrib, bundle_sha256: archive.sha256, status: "success", published: false, artifacts, ...packagedBy };
  writeFileSync(join(output, "package-result.json"), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`distribution: ${error.message}\n`);
  process.exit(1);
}
