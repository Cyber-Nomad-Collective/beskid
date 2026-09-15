#!/usr/bin/env node
// Local, non-publishing fan-in. Evidence must come from trusted workers.
// Integrity checking is not authentication; never accept arbitrary uploaded evidence.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scripts = dirname(fileURLToPath(import.meta.url));
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { encoding: "utf8", env });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} failed`);
  return result.stdout;
}
function json(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}
function validate(path) {
  return JSON.parse(run(process.execPath, [join(scripts, "woodpecker-release-evidence.mjs"), path]));
}

try {
  if (process.argv.length !== 7) throw new Error("usage: woodpecker-aggregate-release.mjs <evidence-dir> <new-output-dir> <version> <superrepo-sha> <compiler-sha>");
  const [inputArg, outputArg, version, superrepo, compiler] = process.argv.slice(2);
  const input = resolve(inputArg);
  const output = resolve(outputArg);
  const evidence = validate(input);
  if (evidence.version !== version || evidence.source.superrepo_commit !== superrepo || evidence.source.compiler_commit !== compiler) {
    throw new Error("evidence does not match the requested release source/version");
  }
  // Exclusive creation is the transaction lock. Interrupted transactions remain
  // inspectable and are never silently reused or overwritten.
  mkdirSync(output, { mode: 0o700 });
  const snapshot = join(output, "evidence");
  mkdirSync(snapshot);
  for (const platform of evidence.platforms) {
    mkdirSync(join(snapshot, platform.platform));
    for (const name of [...platform.artifacts.map(asset => asset.name), "SHA256SUMS"]) {
      copyFileSync(join(input, platform.platform, name), join(snapshot, platform.platform, name));
    }
  }
  // Recheck the private snapshot so concurrent input changes cannot be promoted.
  const checked = validate(snapshot);
  if (JSON.stringify(checked) !== JSON.stringify(evidence)) throw new Error("evidence changed while snapshotting");
  json(join(output, "validated-evidence.json"), checked);
  const assets = join(output, "assets");
  mkdirSync(assets);
  const reports = join(output, "gate-reports");
  mkdirSync(reports);
  mkdirSync(join(reports, "stages"));
  for (const [index, platform] of checked.platforms.entries()) {
    json(join(reports, "stages", `${index}.json`), {
      component: platform.platform, stage: "native-build", platform: platform.target, status: "success",
      command: null, raw_log: `evidence/${platform.platform}/platform-result-${platform.target}.json`,
    });
  }
  const results = [];
  const bundles = [];
  for (const platform of checked.platforms) {
    results.push(join(snapshot, platform.platform, `platform-result-${platform.target}.json`));
    for (const artifact of platform.artifacts.filter(asset => !asset.name.endsWith(".json"))) {
      copyFileSync(join(snapshot, platform.platform, artifact.name), join(assets, artifact.name));
      if (artifact.name.endsWith(".tar.gz")) bundles.push(`${platform.target}|https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/v${version}/${artifact.name}|${artifact.sha256}`);
    }
  }
  run("bash", [join(scripts, "build-beskid-release-manifest.sh"), version, compiler, join(assets, "beskid-release.json"), ...bundles]);
  // Canonical state builder consumes the three verified native build results. State is emitted only after snapshot validation.
  run("bash", [join(scripts, "build-release-state.sh"), "stable", version, compiler, superrepo, "success", join(output, "release-state.json"), ...results],
    { ...process.env, GATE_REPORT_DIR: reports, HANDOFF_RELEASE_URL: "" });
  const state = JSON.parse(readFileSync(join(output, "release-state.json"), "utf8"));
  if (!state.publishable) throw new Error("aggregate is not publishable");
  process.stdout.write(`${JSON.stringify({ output, version, source: checked.source, published: false })}\n`);
} catch (error) {
  process.stderr.write(`release aggregation: ${error.message}\n`);
  process.exit(1);
}
