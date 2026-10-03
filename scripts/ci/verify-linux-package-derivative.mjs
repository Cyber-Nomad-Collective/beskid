#!/usr/bin/env node
// Secret-free verifier for a finite Linux DEB correction intent. It never
// rebuilds a package or changes native release evidence.
import { createHash } from "node:crypto";
import { copyFileSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
function fail(message) { throw new Error(message); }
function regular(path, label) { let stat; try { stat = lstatSync(path); } catch { fail(`${label} is missing`); } if (stat.isSymbolicLink() || !stat.isFile()) fail(`${label} must be a regular file`); return path; }
function digest(path, label) { regular(path, label); return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function json(path, label) { try { const value = JSON.parse(readFileSync(regular(path, label), "utf8")); if (!value || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`); return value; } catch (error) { fail(`${label} is invalid JSON: ${error.message}`); } }
function exact(value, keys, label) { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i])) fail(`${label} must contain exactly ${expected.join(", ")}`); }
function string(value, label, pattern) { if (typeof value !== "string" || !value || (pattern && !pattern.test(value))) fail(`${label} is invalid`); return value; }
function run(command, args) { const result = spawnSync(command, args, { encoding: "utf8" }); if (result.error || result.status !== 0) fail(result.stderr.trim() || result.error?.message || `${command} failed`); return result.stdout.trim(); }
function intent(path) {
  const value = json(path, "correction intent"); exact(value, ["schema_version", "kind", "version", "platform", "target", "native", "recipe", "artifact", "record", "qualification"], "correction intent");
  if (value.schema_version !== 1 || value.kind !== "linux-package-derivative-correction" || value.platform !== "linux") fail("correction intent has unsupported identity");
  string(value.version, "intent version", /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/); if (value.target !== "x86_64-unknown-linux-gnu") fail("intent target is unsupported");
  exact(value.native, ["superrepo_commit", "compiler_commit", "bundle", "release_state_sha256", "validated_evidence_sha256"], "intent native");
  for (const key of ["superrepo_commit", "compiler_commit"]) string(value.native[key], `intent native ${key}`, COMMIT);
  exact(value.native.bundle, ["name", "sha256"], "intent native bundle"); string(value.native.bundle.name, "intent bundle name", /^[A-Za-z0-9][A-Za-z0-9._-]*$/); string(value.native.bundle.sha256, "intent bundle SHA-256", SHA256);
  for (const key of ["release_state_sha256", "validated_evidence_sha256"]) string(value.native[key], `intent ${key}`, SHA256);
  exact(value.recipe, ["distribution_commit", "base_distribution_commit", "entrypoint"], "intent recipe"); for (const key of ["distribution_commit", "base_distribution_commit"]) string(value.recipe[key], `intent recipe ${key}`, COMMIT); string(value.recipe.entrypoint, "intent recipe entrypoint", /^[A-Za-z0-9][A-Za-z0-9._/-]*$/); if (value.recipe.entrypoint.includes("..")) fail("intent recipe entrypoint escapes checkout");
  exact(value.artifact, ["name", "sha256"], "intent artifact"); string(value.artifact.name, "intent artifact name", /^[A-Za-z0-9][A-Za-z0-9._-]*\.deb$/); string(value.artifact.sha256, "intent artifact SHA-256", SHA256);
  exact(value.record, ["name"], "intent record"); string(value.record.name, "intent record name", /^[A-Za-z0-9][A-Za-z0-9._-]*\.correction-v[1-9][0-9]*\.json$/);
  exact(value.qualification, ["environment", "red", "green"], "intent qualification"); exact(value.qualification.environment, ["os", "version", "architecture", "install_mode", "image_digests"], "intent qualification environment"); const env = value.qualification.environment; if (env.os !== "ubuntu" || env.version !== "24.04" || env.architecture !== "amd64" || env.install_mode !== "apt-get --no-install-recommends" || !Array.isArray(env.image_digests) || env.image_digests.length === 0 || env.image_digests.some(item => typeof item !== "string" || !/^docker\.io\/library\/ubuntu@sha256:[a-f0-9]{64}$/.test(item))) fail("intent qualification environment is invalid");
  exact(value.qualification.red, ["log", "sha256", "expected_failure"], "intent RED"); exact(value.qualification.green, ["log", "sha256", "required_checks"], "intent GREEN");
  for (const part of [value.qualification.red, value.qualification.green]) { string(part.log, "qualification log", /^[A-Za-z0-9][A-Za-z0-9._-]*$/); string(part.sha256, "qualification log SHA-256", SHA256); }
  const required = ["clang", "cc", "ar", "ranlib", "libc-header-c-probe", "analyze", "locked-build", "locked-run", "lockfile-unchanged"]; if (!Array.isArray(value.qualification.green.required_checks) || value.qualification.green.required_checks.length !== required.length || new Set(value.qualification.green.required_checks).size !== required.length || required.some(item => !value.qualification.green.required_checks.includes(item))) fail("GREEN required checks are incomplete");
  return value;
}
function sourceMatches(actual, expected, label) { if (!actual || actual.superrepo_commit !== expected.superrepo_commit || actual.compiler_commit !== expected.compiler_commit) fail(`${label} source does not match intent`); }
function checkNative(root, definition) {
  const statePath = join(root, "release-state.json"); const evidencePath = join(root, "validated-evidence.json");
  if (digest(statePath, "native release-state") !== definition.native.release_state_sha256 || digest(evidencePath, "native validated evidence") !== definition.native.validated_evidence_sha256) fail("native aggregate digest does not match intent");
  const state = json(statePath, "native release-state"); const evidence = json(evidencePath, "native validated evidence");
  if (state.version !== definition.version || state.publishable !== true) fail("native release-state is not the intended publishable version"); sourceMatches(state.provenance, definition.native, "native release-state"); if (evidence.version !== definition.version) fail("native evidence version does not match intent"); sourceMatches(evidence.source, definition.native, "native evidence");
  const platform = evidence.platforms?.find(item => item.platform === "linux" && item.target === definition.target); const bundle = platform?.artifacts?.find(item => item.name === definition.native.bundle.name && item.sha256 === definition.native.bundle.sha256); if (!bundle) fail("native evidence does not bind the intended Linux bundle");
  const bundlePath = join(root, definition.native.bundle.name); if (digest(bundlePath, "native bundle") !== definition.native.bundle.sha256) fail("native bundle digest does not match intent");
}
function checkRecipe(root, definition) { if (run("git", ["-C", root, "status", "--porcelain"]) !== "") fail("distribution checkout must be clean"); if (run("git", ["-C", root, "rev-parse", "HEAD"]) !== definition.recipe.distribution_commit) fail("distribution checkout does not match the focused recipe commit"); if (run("git", ["-C", root, "rev-parse", "HEAD^"]) !== definition.recipe.base_distribution_commit) fail("distribution checkout parent does not match intent"); regular(join(root, definition.recipe.entrypoint), "distribution recipe entrypoint"); }
function checkEvidence(root, definition) { const red = join(root, definition.qualification.red.log); const green = join(root, definition.qualification.green.log); if (digest(red, "RED evidence") !== definition.qualification.red.sha256 || digest(green, "GREEN evidence") !== definition.qualification.green.sha256) fail("qualification evidence digest does not match intent"); const redText = readFileSync(red, "utf8"); const greenText = readFileSync(green, "utf8"); if (!redText.includes(definition.qualification.red.expected_failure)) fail("RED evidence lacks expected failure"); const markers = { clang: /^\/usr\/bin\/clang$/m, cc: /^\/usr\/bin\/cc$/m, ar: /^\/usr\/bin\/ar$/m, ranlib: /^\/usr\/bin\/ranlib$/m, "libc-header-c-probe": /Clean DEB toolchain install and AOT build\/run: PASS/, analyze: /Analysis complete in/, "locked-build": /Build complete in/, "locked-run": /Run complete in[\s\S]*exit:\s*0/, "lockfile-unchanged": /Project\.lock: OK/ }; for (const check of definition.qualification.green.required_checks) { const marker = markers[check]; if (!marker || !marker.test(greenText)) fail(`GREEN evidence lacks required assertion: ${check}`); } }
try {
  if (process.argv.length !== 7) fail("usage: verify-linux-package-derivative.mjs <intent.json> <native-aggregate-dir> <recipe-checkout> <qualified-deb-dir> <new-output-dir>");
  const [intentArg, nativeArg, recipeArg, debArg, outputArg] = process.argv.slice(2); const definition = intent(resolve(intentArg)); const native = resolve(nativeArg); const recipe = resolve(recipeArg); const deb = resolve(debArg); const output = resolve(outputArg);
  checkNative(native, definition); checkRecipe(recipe, definition); const artifact = join(deb, definition.artifact.name); if (digest(artifact, "corrected DEB") !== definition.artifact.sha256) fail("corrected DEB digest does not match intent"); checkEvidence(deb, definition);
  mkdirSync(output, { mode: 0o700 }); const record = { schema_version: 1, kind: definition.kind, version: definition.version, platform: definition.platform, native: definition.native, recipe: definition.recipe, artifact: definition.artifact, qualification: definition.qualification };
  writeFileSync(join(output, definition.record.name), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx", mode: 0o600 }); copyFileSync(artifact, join(output, definition.artifact.name)); writeFileSync(join(output, "correction-intent.json"), `${JSON.stringify(definition, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ output, record: definition.record.name, artifact: definition.artifact.name })}\n`);
} catch (error) { process.stderr.write(`linux package derivative: ${error.message}\n`); process.exit(1); }
