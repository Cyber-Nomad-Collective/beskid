import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const gate = new URL("../windows-installer-smoke-gate.mjs", import.meta.url);
const scenarios = ["runtime", "developer", "community", "preexisting", "offline", "hash-failure", "cancel", "repair-deselect", "upgrade", "uninstall"];
const hash = "a".repeat(64);

function evidence(dir, scenario, overrides = {}) {
  writeFileSync(join(dir, `${scenario}.log`), `Burn log: ${scenario} ${scenario === "hash-failure" ? "hash mismatch" : scenario === "offline" ? "download failed" : scenario === "cancel" ? "cancelled" : "completed"}\n`);
  for (const image of ["welcome-100", "welcome-150", "options-100", "options-150", "progress-100", "progress-150", "success-100", "success-150", "failure-100", "failure-150", "msi-directory-100", "msi-directory-150"]) {
    writeFileSync(join(dir, `${image}.png`), "screenshot fixture");
  }
  writeFileSync(join(dir, `${scenario}.json`), JSON.stringify({
    schema_version: 1, scenario, real_windows_vm: true, passed: true,
    machine_name: "DISPOSABLE-VM", recorded_utc: "2026-09-26T12:00:00Z",
    setup_sha256: hash, msi_sha256: hash, setup_log: `${scenario}.log`,
    observed_setup_sha256: scenario === "hash-failure" ? "b".repeat(64) : hash,
    setup_exit_code: scenario === "offline" || scenario === "hash-failure" || scenario === "cancel" ? 1 : 0,
    beskid_installed: !["offline", "hash-failure", "cancel", "uninstall"].includes(scenario),
    vendor_retained: true,
    community_unchanged: true,
    vendor: ["VcRedistX64", "VsBuildTools2022", "LlvmX64"].map(id => ({ id, sha512: "c".repeat(128), size: 100 })),
    vc_version: "14.44.35211.0", msvc_version: scenario === "runtime" ? "" : "14.44.35207", sdk_version: scenario === "runtime" ? "" : "10.0.26100.0", llvm_version: scenario === "runtime" ? "" : "22.1.8",
    prior_version: scenario === "upgrade" ? "0.4.743" : "", installed_version: scenario === "upgrade" ? "beskid 0.4.744" : "",
    lld_link_executed: true, fresh_environment: true, cli: { test: true, build: true, run: true },
    screenshots: ["welcome-100", "welcome-150", "options-100", "options-150", "progress-100", "progress-150", "success-100", "success-150", "failure-100", "failure-150", "msi-directory-100", "msi-directory-150"],
    ...overrides,
  }));
}

function run(dir) { return spawnSync(process.execPath, [gate.pathname, dir, hash, hash], { encoding: "utf8" }); }
function rejects(dir, pattern) { const result = run(dir); assert.notEqual(result.status, 0); assert.match(result.stderr, pattern); }

test("installer release gate requires every real Windows scenario", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "beskid-installer-smoke-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const scenario of scenarios) evidence(dir, scenario);
  assert.equal(run(dir).status, 0, run(dir).stderr);
  rmSync(join(dir, "hash-failure.json"));
  rejects(dir, /missing scenario: hash-failure/);
  evidence(dir, "hash-failure", { passed: false });
  rejects(dir, /hash-failure.*failed/);
});

test("installer release gate rejects missing developer tools, CLI smoke, and synthetic evidence", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "beskid-installer-smoke-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const scenario of scenarios) evidence(dir, scenario);
  evidence(dir, "developer", { msvc_version: "" });
  rejects(dir, /msvc_version/);
  evidence(dir, "developer", { cli: { test: true, build: false, run: true } });
  rejects(dir, /build/);
  evidence(dir, "developer", { real_windows_vm: false });
  rejects(dir, /real Windows VM/);
  evidence(dir, "developer", { fresh_environment: false });
  rejects(dir, /fresh environment/);
  evidence(dir, "developer", { vendor: [] });
  rejects(dir, /vendor hash/);
  evidence(dir, "developer");
  evidence(dir, "community", { community_unchanged: false });
  rejects(dir, /Community changed/);
  evidence(dir, "community");
  evidence(dir, "developer");
  evidence(dir, "runtime", { msvc_version: "14.44.35207" });
  rejects(dir, /runtime-only/);
  evidence(dir, "runtime", { vc_version: "14.30.0.0" });
  rejects(dir, /VC\+\+ floor/);
  evidence(dir, "runtime");
  evidence(dir, "upgrade", { installed_version: "beskid 0.4.743" });
  rejects(dir, /upgrade version/);
});

test("installer release gate rejects hash mismatch and missing screenshots", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "beskid-installer-smoke-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const scenario of scenarios) evidence(dir, scenario);
  evidence(dir, "runtime", { setup_sha256: "b".repeat(64) });
  rejects(dir, /setup SHA-256/);
  evidence(dir, "runtime");
  evidence(dir, "hash-failure", { observed_setup_sha256: hash });
  rejects(dir, /hash-failure.*fixture/);
  evidence(dir, "hash-failure");
  evidence(dir, "runtime");
  rmSync(join(dir, "welcome-150.png"));
  rejects(dir, /missing evidence file: welcome-150.png/);
});
