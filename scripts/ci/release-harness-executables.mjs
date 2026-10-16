#!/usr/bin/env node
// Select the release harness and fixture executables from `cargo --message-format=json` output and
// copy them into a flat directory under their packet names.
//
// Usage: release-harness-executables.mjs <target> <output-dir> <manifest> <test-messages.json> <fixture-messages.json>
//
// `test-messages.json` is the output of `cargo test --no-run --message-format=json` for the harness
// crates; `fixture-messages.json` the output of `cargo build --message-format=json` for the fixture
// binaries. Every harness and fixture declared by the manifest must resolve to exactly one
// executable, or the build fails closed.
import { copyFileSync, chmodSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ParseCanonicalManifest, fail, fixturePacketName, harnessPacketName } from "./release-case-common.mjs";

function artifacts(path) {
  return readFileSync(path, "utf8").split("\n").filter(line => line.startsWith("{")).map(line => JSON.parse(line))
    .filter(message => message.reason === "compiler-artifact" && typeof message.executable === "string" && message.executable.length > 0);
}

export function SelectExecutables(manifest, testMessages, fixtureMessages) {
  const selected = [];
  for (const [name, harness] of Object.entries(manifest.harness_executables ?? {})) {
    const matches = testMessages.filter(message => message.target?.name === harness.target_name && message.profile?.test === true
      && Array.isArray(message.target.kind) && message.target.kind.includes(harness.target_kind) && message.package_id?.includes(harness.crate));
    if (matches.length !== 1) fail(`harness ${name} resolved to ${matches.length} test executables (expected 1)`);
    selected.push({ name, kind: "harness", executable: matches[0].executable });
  }
  for (const [name, fixture] of Object.entries(manifest.fixture_executables ?? {})) {
    const matches = fixtureMessages.filter(message => message.target?.name === fixture.bin && message.profile?.test === false
      && Array.isArray(message.target.kind) && message.target.kind.includes("bin") && message.package_id?.includes(fixture.crate));
    if (matches.length !== 1) fail(`fixture ${name} resolved to ${matches.length} executables (expected 1)`);
    selected.push({ name, kind: "fixture", executable: matches[0].executable });
  }
  return selected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 7) fail("usage: release-harness-executables.mjs <target> <output-dir> <manifest> <test-messages.json> <fixture-messages.json>");
    const [target, outputArg, manifestPath, testPath, fixturePath] = process.argv.slice(2);
    const manifest = ParseCanonicalManifest(readFileSync(manifestPath));
    const output = resolve(outputArg);
    mkdirSync(output, { recursive: true });
    for (const item of SelectExecutables(manifest, artifacts(testPath), artifacts(fixturePath))) {
      const destination = join(output, item.kind === "harness" ? harnessPacketName(item.name, target) : fixturePacketName(item.name, target));
      copyFileSync(item.executable, destination);
      chmodSync(destination, 0o755);
      process.stdout.write(`${item.kind} ${item.name} -> ${destination}\n`);
    }
  } catch (error) {
    process.stderr.write(`release harness executables: ${error.message}\n`);
    process.exit(1);
  }
}
