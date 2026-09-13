#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const EXPECTED_LANGUAGES = ["actions", "javascript-typescript", "rust"];

function fail(message) { throw new Error(message); }

function readJson(path, label) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (value === null || Array.isArray(value) || typeof value !== "object") fail(`${label} must be an object`);
    return value;
  } catch (error) {
    fail(`${label} is invalid: ${error.message}`);
  }
}

function countSarif(path) {
  const sarif = readJson(path, "SARIF");
  if (sarif.version !== "2.1.0") fail("SARIF version must be 2.1.0");
  if (!Array.isArray(sarif.runs)) fail("SARIF runs must be an array");
  if (sarif.runs.length === 0) fail("SARIF must contain at least one run");
  return sarif.runs.reduce((count, run, index) => {
    if (run === null || Array.isArray(run) || typeof run !== "object") fail(`SARIF run ${index} must be an object`);
    const driver = run.tool?.driver;
    if (driver === null || Array.isArray(driver) || typeof driver !== "object") fail(`SARIF run ${index} must identify a tool driver`);
    if (driver.name !== "CodeQL command-line toolchain" || driver.organization !== "GitHub" || typeof driver.version !== "string" || driver.version.length === 0 || !Array.isArray(driver.rules)) {
      fail(`SARIF run ${index} is not CodeQL CLI output`);
    }
    if (!Array.isArray(run.results)) fail(`SARIF run ${index} results must be an array`);
    if (run.invocations !== undefined) {
      if (!Array.isArray(run.invocations)) fail(`SARIF run ${index} invocations must be an array`);
      for (const [invocationIndex, invocation] of run.invocations.entries()) {
        if (invocation === null || Array.isArray(invocation) || typeof invocation !== "object") fail(`SARIF run ${index} invocation ${invocationIndex} must be an object`);
        if (invocation.executionSuccessful === false) fail(`SARIF run ${index} reports unsuccessful execution`);
        if (invocation.toolExecutionNotifications !== undefined) {
          if (!Array.isArray(invocation.toolExecutionNotifications)) fail(`SARIF run ${index} invocation ${invocationIndex} notifications must be an array`);
          if (invocation.toolExecutionNotifications.some((notification) => notification?.level === "error")) fail(`SARIF run ${index} reports a tool execution error`);
        }
      }
    }
    return count + run.results.length;
  }, 0);
}

function finalize(output, superrepoCommit, compilerCommit, bundleVersion) {
  const statusDirectory = join(output, "statuses");
  const files = readdirSync(statusDirectory).filter((name) => name.endsWith(".json")).sort();
  if (files.length !== EXPECTED_LANGUAGES.length) fail("security status records must contain exactly three languages");
  const languages = files.map((name) => readJson(join(statusDirectory, name), `security status ${name}`));
  const names = languages.map((entry) => entry.language).sort();
  if (names.join(",") !== [...EXPECTED_LANGUAGES].sort().join(",")) fail("security status records have unexpected languages");
  for (const entry of languages) {
    if (entry.category !== `woodpecker-security-${entry.language}`) fail(`security status ${entry.language} has an invalid SARIF category`);
    if (!["success", "findings", "scanner-failure"].includes(entry.status)) fail(`security status ${entry.language} has an invalid status`);
    if (!Number.isInteger(entry.findings) || entry.findings < 0) fail(`security status ${entry.language} has an invalid findings count`);
    if (typeof entry.sarif !== "string" || entry.sarif.length === 0 || relative(output, join(output, entry.sarif)).startsWith("..")) fail(`security status ${entry.language} has an unsafe SARIF path`);
  }
  const status = languages.some((entry) => entry.status === "scanner-failure")
    ? "scanner-failure"
    : languages.some((entry) => entry.status === "findings" || entry.findings > 0)
      ? "findings"
      : "success";
  const result = { schema_version: 1, status, bundle: { version: bundleVersion }, source: { superrepo_commit: superrepoCommit, compiler_commit: compilerCommit }, languages };
  writeFileSync(join(output, "security-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return status === "success" ? 0 : 1;
}

try {
  if (process.argv[2] === "--count-sarif" && process.argv.length === 4) {
    process.stdout.write(`${countSarif(process.argv[3])}\n`);
    process.exit(0);
  }
  if (process.argv[2] === "--finalize" && process.argv.length === 7) process.exit(finalize(process.argv[3], process.argv[4], process.argv[5], process.argv[6]));
  throw new Error("usage: woodpecker-security-summary.mjs --count-sarif <sarif> | --finalize <output> <superrepo-commit> <compiler-commit> <bundle-version>");
} catch (error) {
  process.stderr.write(`woodpecker security summary: ${error.message}\n`);
  process.exit(2);
}
