#!/usr/bin/env node
// Package an already qualified release. No downloads, registry writes or marker
// publication. Run on the matching native host with beskid_distrib initialized.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
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
  if (process.argv.length !== 5) throw new Error("usage: woodpecker-package-platform.mjs <linux|macos|windows> <evidence-dir> <new-output-dir>");
  const [platform, inputArg, outputArg] = process.argv.slice(2);
  if (!["linux", "macos", "windows"].includes(platform)) throw new Error("unsupported platform");
  const input = resolve(inputArg), output = resolve(outputArg);
  const evidence = JSON.parse(run(process.execPath, [join(scripts, "woodpecker-release-evidence.mjs"), input, platform], undefined, "invalid release evidence"));
  const root = resolve(scripts, "../..");
  const rootCommit = run("git", ["rev-parse", "HEAD"], root, "source lookup failed").trim();
  if (rootCommit !== evidence.source.superrepo_commit) throw new Error("checkout does not match release evidence");
  const expectedDistrib = run("git", ["rev-parse", "HEAD:beskid_distrib"], root, "distribution gitlink lookup failed").trim();
  const actualDistrib = run("git", ["rev-parse", "HEAD"], distrib, "distribution checkout lookup failed").trim();
  if (actualDistrib !== expectedDistrib) throw new Error("distribution checkout does not match source gitlink");
  const target = evidence.platforms.find(item => item.platform === platform);
  const archive = target.artifacts.find(item => item.name.endsWith(".tar.gz"));
  mkdirSync(output, { mode: 0o700 });
  const snapshot = join(output, archive.name);
  copyFileSync(join(input, platform, archive.name), snapshot);
  if (digest(snapshot) !== archive.sha256) throw new Error("bundle changed while snapshotting");
  const bundle = join(output, "bundle");
  run("bash", [bashPath(join(distrib, "scripts/extract-release-bundle.sh")), bashPath(snapshot), evidence.version, target.target, bashPath(bundle)], output, "bundle extraction failed");
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
    run("magick", [bootstrapperLogo, "-resize", "256x256", "-define", "icon:auto-resize=256,128,96,64,48,32,16", join(assets, "icons/beskid.ico")], output, "installer icon failed");
    run("bash", [bashPath(join(distrib, "windows/build-msi.sh")), version, bashPath(bundle), bashPath(assets)], output, "MSI packaging failed");
    run("bash", [bashPath(join(distrib, "windows/build-exe.sh")), version, bashPath(join(output, `beskid-${version}-windows-amd64.msi`)), bashPath(assets)], output, "EXE packaging failed");
    files = [`beskid-${version}-windows-amd64.msi`, `beskid-${version}-windows-amd64.exe`];
  }
  const artifacts = files.map(name => {
    if (!statSync(join(output, name)).isFile() || statSync(join(output, name)).size === 0) throw new Error(`missing installer: ${name}`);
    return { name, sha256: digest(join(output, name)) };
  });
  const result = { schema_version: 1, platform, target: target.target, version, source: evidence.source, distrib_commit: actualDistrib, bundle_sha256: archive.sha256, status: "success", published: false, artifacts };
  writeFileSync(join(output, "package-result.json"), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`distribution: ${error.message}\n`);
  process.exit(1);
}
