#!/usr/bin/env node
// Aggregate one independently recorded disposable-VM run per installer case.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const scenarios = ["runtime", "developer", "community", "preexisting", "offline", "hash-failure", "cancel", "repair-deselect", "upgrade", "uninstall"];
const failures = new Set(["offline", "hash-failure", "cancel"]);
const screenshots = ["welcome", "options", "progress", "success", "failure", "msi-directory"]
  .flatMap(page => [`${page}-100`, `${page}-150`]);
const hashPattern = /^[0-9a-f]{64}$/;
const vendorIds = ["VcRedistX64", "VsBuildTools2022", "LlvmX64"];

function requireValue(condition, message) { if (!condition) throw new Error(message); }
function file(dir, name) {
  const path = join(dir, name);
  requireValue(existsSync(path) && statSync(path).isFile() && statSync(path).size > 0, `missing evidence file: ${name}`);
}
function version(value) { return typeof value === "string" && /^\d+(?:\.\d+)+$/.test(value); }

try {
  requireValue(process.argv.length === 6, "usage: windows-installer-smoke-gate.mjs <evidence-dir> <setup-sha256> <msi-sha256> <checked-in-prerequisites.lock.json>");
  const dir = resolve(process.argv[2]);
  const expectedSetup = process.argv[3], expectedMsi = process.argv[4];
  requireValue(hashPattern.test(expectedSetup) && hashPattern.test(expectedMsi), "expected SHA-256 values must be lowercase hex");
  const lock = JSON.parse(readFileSync(resolve(process.argv[5]), "utf8"));
  requireValue(lock.schemaVersion === 1 && Array.isArray(lock.packages) && lock.packages.length === 3, "invalid prerequisite lock");
  for (const [index, item] of lock.packages.entries()) {
    requireValue(item.id === vendorIds[index] && version(item.version) && /^[0-9a-f]{128}$/.test(item.sha512) && Number.isSafeInteger(item.size) && item.size > 0, "invalid locked vendor metadata");
  }
  const reports = [];
  let vendorHashes;
  for (const scenario of scenarios) {
    const name = `${scenario}.json`;
    requireValue(existsSync(join(dir, name)), `missing scenario: ${scenario}`);
    const report = JSON.parse(readFileSync(join(dir, name), "utf8"));
    requireValue(report.schema_version === 1 && report.scenario === scenario, `${scenario}: invalid report identity`);
    requireValue(report.real_windows_vm === true, `${scenario}: evidence must come from a real Windows VM`);
    requireValue(typeof report.machine_name === "string" && report.machine_name.length > 0 && !Number.isNaN(Date.parse(report.recorded_utc)), `${scenario}: missing VM identity/time`);
    requireValue(report.passed === true, `${scenario}: scenario failed`);
    requireValue(report.setup_sha256 === expectedSetup, `${scenario}: setup SHA-256 mismatch`);
    requireValue(report.msi_sha256 === expectedMsi, `${scenario}: MSI SHA-256 mismatch`);
    requireValue(hashPattern.test(report.observed_setup_sha256), `${scenario}: missing observed setup hash`);
    if (scenario === "hash-failure") requireValue(report.observed_setup_sha256 !== expectedSetup, "hash-failure: missing deliberately altered fixture bundle");
    else requireValue(report.observed_setup_sha256 === expectedSetup, `${scenario}: observed setup differs from release setup`);
    requireValue(typeof report.setup_log === "string" && report.setup_log === `${scenario}.log`, `${scenario}: missing setup log`);
    file(dir, report.setup_log);
    const log = readFileSync(join(dir, report.setup_log), "utf8");
    const marker = scenario === "offline" ? /download|network|internet/i : scenario === "hash-failure" ? /hash|checksum|digest/i : scenario === "cancel" ? /cancel|user exit/i : null;
    if (marker) requireValue(marker.test(log), `${scenario}: failure log lacks expected marker`);
    requireValue(Number.isInteger(report.setup_exit_code), `${scenario}: missing setup exit code`);
    if (failures.has(scenario)) requireValue(report.setup_exit_code !== 0 && report.setup_exit_code !== 3010, `${scenario}: unexpected setup exit code`);
    else {
      requireValue(report.setup_exit_code === 0 || report.setup_exit_code === 3010, `${scenario}: unexpected setup exit code`);
      if (report.setup_exit_code === 3010) requireValue(report.reboot_verified === true, `${scenario}: missing reboot verification`);
    }
    requireValue(report.beskid_installed === (!failures.has(scenario) && scenario !== "uninstall"), `${scenario}: wrong Beskid installation state`);
    requireValue(report.vendor_retained === true, `${scenario}: shared vendor prerequisite was removed`);
    if (scenario === "community") requireValue(report.community_unchanged === true, "community: VS Community changed during Build Tools setup");
    requireValue(Array.isArray(report.vendor) && report.vendor.length === 3, `${scenario}: missing vendor hash evidence`);
    for (const [index, vendor] of report.vendor.entries()) {
      requireValue(vendor.id === vendorIds[index] && /^[0-9a-f]{128}$/.test(vendor.sha512) && Number.isSafeInteger(vendor.size) && vendor.size > 0, `${scenario}: invalid vendor hash evidence`);
      const expected = lock.packages[index];
      requireValue(vendor.version === expected.version && vendor.sha512 === expected.sha512 && vendor.size === expected.size, `${scenario}: locked vendor metadata mismatch for ${vendor.id}`);
    }
    const currentVendorHashes = report.vendor.map(item => `${item.id}:${item.sha512}:${item.size}`).join("|");
    requireValue(vendorHashes === undefined || vendorHashes === currentVendorHashes, `${scenario}: vendor hash evidence changed across scenarios`);
    vendorHashes = currentVendorHashes;
    if (!failures.has(scenario)) {
      requireValue(version(report.vc_version), `${scenario}: missing vc_version`);
      const [major, minor] = report.vc_version.split(".").map(Number);
      requireValue(major > 14 || (major === 14 && minor >= 40), `${scenario}: VC++ floor is below 14.40`);
    }
    if (report.beskid_installed) requireValue(report.fresh_environment === true, `${scenario}: CLI was not run in a fresh environment`);
    if (["developer", "community", "preexisting", "repair-deselect", "upgrade"].includes(scenario)) {
      for (const key of ["msvc_version", "sdk_version", "llvm_version"]) requireValue(version(report[key]), `${scenario}: missing ${key}`);
      requireValue(report.lld_link_executed === true, `${scenario}: lld-link was not executed`);
      for (const command of ["test", "build", "run"]) requireValue(report.cli?.[command] === true, `${scenario}: ${command} smoke failed`);
    } else if (scenario === "runtime") {
      requireValue(!report.msvc_version && !report.sdk_version && !report.llvm_version, "runtime: runtime-only setup installed developer tools");
      requireValue(report.cli?.test === true, "runtime: test smoke failed");
    }
    if (scenario === "upgrade") {
      requireValue(typeof report.prior_version === "string" && report.prior_version.length > 0 &&
        typeof report.installed_version === "string" && !report.installed_version.includes(report.prior_version), "upgrade: upgrade version did not change");
    }
    reports.push({ scenario, setup_exit_code: report.setup_exit_code });
  }
  for (const shot of screenshots) {
    file(dir, `${shot}.png`);
  }
  process.stdout.write(`${JSON.stringify({ schema_version: 1, status: "structurally-valid-unattested", scenarios: reports })}\n`);
} catch (error) {
  process.stderr.write(`Windows installer smoke: ${error.message}\n`);
  process.exit(1);
}
