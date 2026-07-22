#!/usr/bin/env node
import process from "node:process";
import fs from "node:fs";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

const LESSONS_ROOT = resolve(process.cwd(), "curriculum");
const ARG_ID = process.argv[2] ?? "01-hello-beskid";
const LESSON_COMMANDS = new Map([
  ["01-hello-beskid", "analyze"],
  ["02-values-and-names", "analyze"],
  ["03-functions-and-returns", "analyze"],
  ["04-branches", "analyze"],
  ["05-simple-program-run", "analyze"],
  ["06-parser-basics", "parse"],
  ["07-tree-view", "tree"],
  ["08-run-program", "run"],
]);
const REPO_ROOT = resolve(process.cwd(), "..", "..");
const RUNTIME_PREFIX = process.env.BESKID_RUNTIME_PREFIX ?? resolve(REPO_ROOT, "compiler", "target", "native-runtime-kit");

const knownLessons = fs
  .readdirSync(LESSONS_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const lessonCodePath = join(LESSONS_ROOT, ARG_ID, "start.bd");
const lessonPath = existsSync(lessonCodePath) ? lessonCodePath : null;

if (!lessonPath) {
  console.error(`Unknown lesson slug: ${ARG_ID}`);
  console.error(`Known lessons: ${knownLessons.join(", ")}`);
  process.exit(1);
}

const cargoPkg = process.env.BESKID_CARGO_PKG ?? "beskid_cli";
const command = LESSON_COMMANDS.get(ARG_ID) ?? "analyze";
const commandSupportsPlain = command === "analyze" || command === "build" || command === "test";

function hostRuntimeTriple() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "linux" && arch === "x64") {
    return "x86_64-unknown-linux-gnu";
  }
  if (platform === "darwin" && arch === "arm64") {
    return "aarch64-apple-darwin";
  }
  if (platform === "win32" && arch === "x64") {
    return "x86_64-pc-windows-msvc";
  }

  return null;
}

function runtimeKitMetadataPath(prefix) {
  const triple = hostRuntimeTriple();
  if (triple) {
    return resolve(prefix, "lib", "beskid-runtime", "abi-5", triple, "debug", "abi.json");
  }

  const bases = resolve(prefix, "lib", "beskid-runtime", "abi-5");
  try {
    const entries = fs.readdirSync(bases, { withFileTypes: true });
    const debugTarget = entries
      .find((entry) => entry.isDirectory())
      ?.name;
    if (!debugTarget) {
      return null;
    }

    return resolve(bases, debugTarget, "debug", "abi.json");
  } catch {
    return null;
  }
}

function hasRuntimeMetadata(prefix) {
  const metadataPath = runtimeKitMetadataPath(prefix);
  return typeof metadataPath === "string" && existsSync(metadataPath);
}

async function ensureRuntimeKit() {
  if (command !== "run") {
    return;
  }

  if (hasRuntimeMetadata(RUNTIME_PREFIX)) {
    return;
  }

  const stageScript = resolve(REPO_ROOT, "compiler", "scripts", "stage-native-runtime-kit.sh");
  if (!existsSync(stageScript)) {
    return;
  }

  console.log("Staging ABI-v5 runtime kit for run lesson checks...");
  fs.mkdirSync(RUNTIME_PREFIX, { recursive: true });

  await new Promise((resolve, reject) => {
    const proc = spawn("bash", [stageScript], {
      cwd: REPO_ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        BESKID_RUNTIME_PREFIX: RUNTIME_PREFIX,
        BESKID_RUNTIME_KIT_PROFILE: "debug",
        BESKID_CLI_BIN: process.env.BESKID_BINARY ?? resolve(REPO_ROOT, "compiler", "target", "release", "beskid"),
      },
    });

    proc.once("error", (error) => reject(error));
    proc.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`runtime-kit stage failed with exit code ${code}`));
      }
    });
  });
}

const cli = process.env.BESKID_BINARY ? process.env.BESKID_BINARY : "cargo";
const cliArgs = [command];
if (commandSupportsPlain) {
  cliArgs.push("--plain");
}
cliArgs.push(lessonPath);

const args = process.env.BESKID_BINARY
  ? cliArgs
  : [
      "run",
      "--manifest-path",
      join(REPO_ROOT, "compiler", "Cargo.toml"),
      "-p",
      cargoPkg,
      "--",
      ...cliArgs,
    ];

await ensureRuntimeKit();

const proc = spawn(cli, args, {
  cwd: REPO_ROOT,
  stdio: "pipe",
  env: {
    ...process.env,
    BESKID_RUNTIME_PREFIX: RUNTIME_PREFIX,
    BESKID_RUNTIME_KIT_PROFILE: "debug",
  },
});

let output = "";

for (const stream of ["stdout", "stderr"]) {
  const source = proc[stream];
  source?.setEncoding("utf8");
  source?.on("data", (chunk) => {
    const text = String(chunk);
    output += text;
    process[stream === "stderr" ? "stderr" : "stdout"].write(text);
  });
}

proc.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

proc.on("close", (code) => {
  const summaryMatch = output.match(/\b(?:Analysis|Syntax):\s*(\d+)\s+error\(s\)/i);
  const summaryErrors = summaryMatch ? Number(summaryMatch[1] ?? "0") : null;
  const errorLines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("x ") && line.includes("error"));

  const hasDiagnostics = summaryErrors === null ? errorLines.length > 0 : summaryErrors > 0;
  const failed = code !== 0 || hasDiagnostics;

  if (!failed) {
    console.log(`${ARG_ID}: ${command} pass`);
  } else {
    console.error(`${ARG_ID}: ${command} failed (exit ${code})`);
    if (command === "run" && !hasRuntimeMetadata(RUNTIME_PREFIX)) {
      console.error("Run checks require a staged ABI-v5 runtime kit.");
      console.error(
        `${REPO_ROOT} && BESKID_RUNTIME_PREFIX=${RUNTIME_PREFIX} BESKID_RUNTIME_KIT_PROFILE=debug BESKID_CLI_BIN=${process.env.BESKID_BINARY ?? resolve(REPO_ROOT, "compiler", "target", "release", "beskid")} ./compiler/scripts/stage-native-runtime-kit.sh`,
      );
    }
  }

  process.exit(failed ? code ?? 1 : 0);
});
