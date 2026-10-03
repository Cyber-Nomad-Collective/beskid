#!/usr/bin/env node
// Secret-free verifier for a finite Linux DEB correction intent. It never
// rebuilds a package, publishes an asset, or changes native release evidence.
import { constants as fsConstants } from "node:fs";
import { chmodSync, copyFileSync, lstatSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { dirname, join, resolve } from "node:path";
import { ValidateReleaseEvidence } from "./woodpecker-release-evidence.mjs";
import {
  AssertInventory, CorrectionRecord, Digest, ReadCorrectionIntent, ReadJson, RequireContainedRegularFile,
  RequireDirectory, ValidateCorrectionOutput, ValidateQualificationLogs,
} from "./linux-package-derivative.mjs";

function Fail(message) { throw new Error(message); }
function Run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) Fail(result.stderr.trim() || result.error?.message || `${command} failed`);
  return result.stdout.trim();
}
function CopyPrivate(source, destination) {
  copyFileSync(source, destination, fsConstants.COPYFILE_EXCL);
  chmodSync(destination, 0o600);
}

function ValidateNativeAggregate(root, definition) {
  AssertInventory(root, ["assets", "evidence", "gate-reports", "release-state.json", "validated-evidence.json"], "native aggregate");
  RequireDirectory(join(root, "assets"), "native aggregate assets");
  RequireDirectory(join(root, "evidence"), "native aggregate evidence");
  RequireDirectory(join(root, "gate-reports"), "native aggregate gate reports");
  const statePath = RequireContainedRegularFile(root, "release-state.json", "native release-state");
  const evidencePath = RequireContainedRegularFile(root, "validated-evidence.json", "native validated evidence");
  if (Digest(statePath, "native release-state") !== definition.native.release_state_sha256) Fail("native release-state aggregate digest does not match intent");
  if (Digest(evidencePath, "native validated evidence") !== definition.native.validated_evidence_sha256) Fail("native validated-evidence aggregate digest does not match intent");
  const state = ReadJson(statePath, "native release-state");
  if (state.version !== definition.version || state.publishable !== true) Fail("native release-state is not the intended publishable version");
  if (state.provenance?.superrepo_commit !== definition.native.superrepo_commit || state.provenance?.compiler_commit !== definition.native.compiler_commit) {
    Fail("native release-state source does not match intent");
  }
  const recordedEvidence = ReadJson(evidencePath, "native validated evidence");
  const validatedEvidence = ValidateReleaseEvidence(join(root, "evidence"));
  if (!isDeepStrictEqual(recordedEvidence, validatedEvidence)) Fail("native validated evidence does not match the established release-evidence reader");
  if (validatedEvidence.version !== definition.version || validatedEvidence.source?.superrepo_commit !== definition.native.superrepo_commit || validatedEvidence.source?.compiler_commit !== definition.native.compiler_commit) {
    Fail("native validated evidence source does not match intent");
  }
  const linux = validatedEvidence.platforms.find(platform => platform.platform === "linux" && platform.target === definition.target);
  const bundle = linux?.artifacts.find(artifact => artifact.name === definition.native.bundle.name && artifact.sha256 === definition.native.bundle.sha256);
  if (!bundle) Fail("native validated evidence does not bind the intended Linux bundle");
  const publicAssets = validatedEvidence.platforms.flatMap(platform => platform.artifacts.filter(artifact => !artifact.name.endsWith(".json")));
  AssertInventory(join(root, "assets"), [...publicAssets.map(artifact => artifact.name), "beskid-release.json"], "native aggregate assets");
  for (const artifact of publicAssets) {
    const path = RequireContainedRegularFile(join(root, "assets"), artifact.name, `native aggregate asset ${artifact.name}`);
    if (Digest(path, `native aggregate asset ${artifact.name}`) !== artifact.sha256) Fail(`native aggregate asset digest does not match evidence: ${artifact.name}`);
  }
  RequireContainedRegularFile(join(root, "assets"), "beskid-release.json", "native aggregate release manifest");
  const bundlePath = RequireContainedRegularFile(join(root, "assets"), definition.native.bundle.name, "native Linux bundle");
  if (Digest(bundlePath, "native Linux bundle") !== definition.native.bundle.sha256) Fail("native Linux bundle digest does not match intent");
}

function ValidateRecipe(root, definition) {
  RequireDirectory(root, "distribution checkout");
  if (Run("git", ["-C", root, "status", "--porcelain"]) !== "") Fail("distribution checkout must be clean");
  if (Run("git", ["-C", root, "rev-parse", "HEAD"]) !== definition.recipe.distribution_commit) Fail("distribution checkout does not match the focused recipe commit");
  const parents = Run("git", ["-C", root, "rev-list", "--parents", "-n", "1", "HEAD"]).split(" ");
  if (parents.length !== 2 || parents[1] !== definition.recipe.base_distribution_commit) Fail("distribution checkout parent does not match the base recipe intent");
  RequireContainedRegularFile(root, definition.recipe.entrypoint, "distribution recipe entrypoint");
  for (const [label, binding] of [
    ["qualification harness", definition.qualification.harness],
    ["qualification project fixture", definition.qualification.fixture.project],
    ["qualification source fixture", definition.qualification.fixture.source],
    ["qualification C probe fixture", definition.qualification.fixture.c_probe],
  ]) {
    const path = RequireContainedRegularFile(root, binding.path, label);
    if (Digest(path, label) !== binding.sha256) Fail(`${label} digest does not match intent`);
  }
  return definition.recipe.distribution_commit;
}

function ValidateQualifiedInputs(root, definition) {
  AssertInventory(root, [definition.artifact.name, definition.qualification.red.log, definition.qualification.green.log], "qualified DEB input");
  const artifact = RequireContainedRegularFile(root, definition.artifact.name, "corrected DEB");
  const red = RequireContainedRegularFile(root, definition.qualification.red.log, "RED qualification evidence");
  const green = RequireContainedRegularFile(root, definition.qualification.green.log, "GREEN qualification evidence");
  if (Digest(artifact, "corrected DEB") !== definition.artifact.sha256) Fail("corrected DEB artifact digest does not match intent");
  ValidateQualificationLogs(definition, red, green);
  return { artifact, red, green };
}

try {
  if (process.argv.length !== 7) Fail("usage: verify-linux-package-derivative.mjs <intent.json> <native-aggregate-dir> <recipe-checkout> <qualified-deb-dir> <new-output-dir>");
  const [intentArg, nativeArg, recipeArg, qualifiedArg, outputArg] = process.argv.slice(2);
  const intentPath = resolve(intentArg), native = resolve(nativeArg), recipe = resolve(recipeArg), qualified = resolve(qualifiedArg), output = resolve(outputArg);
  const definition = ReadCorrectionIntent(intentPath);
  RequireDirectory(dirname(intentPath), "correction intent parent");
  RequireDirectory(dirname(output), "correction output parent");
  try { lstatSync(output); Fail("correction output already exists; exclusive creation is required"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  ValidateNativeAggregate(native, definition);
  ValidateRecipe(recipe, definition);
  const inputs = ValidateQualifiedInputs(qualified, definition);

  mkdirSync(output, { mode: 0o700 });
  chmodSync(output, 0o700);
  mkdirSync(join(output, "qualification"), { mode: 0o700 });
  chmodSync(join(output, "qualification"), 0o700);
  CopyPrivate(inputs.artifact, join(output, definition.artifact.name));
  CopyPrivate(inputs.red, join(output, "qualification", definition.qualification.red.log));
  CopyPrivate(inputs.green, join(output, "qualification", definition.qualification.green.log));
  writeFileSync(join(output, "correction-intent.json"), `${JSON.stringify(definition, null, 2)}\n`, { flag: "wx", mode: 0o600 });

  // Re-check sources after the private copy, then validate only the snapshot.
  // A concurrent input mutation therefore cannot be silently promoted.
  ValidateNativeAggregate(native, definition);
  ValidateRecipe(recipe, definition);
  if (Digest(join(output, definition.artifact.name), "snapshotted corrected DEB") !== definition.artifact.sha256) Fail("corrected DEB changed while snapshotting");
  ValidateQualificationLogs(definition, join(output, "qualification", definition.qualification.red.log), join(output, "qualification", definition.qualification.green.log));
  writeFileSync(join(output, definition.record.name), `${JSON.stringify(CorrectionRecord(definition), null, 2)}\n`, { flag: "wx", mode: 0o600 });
  ValidateCorrectionOutput(intentPath, output);
  process.stdout.write(`${JSON.stringify({ output, record: definition.record.name, artifact: definition.artifact.name })}\n`);
} catch (error) {
  process.stderr.write(`linux package derivative: ${error.message}\n`);
  process.exit(1);
}
