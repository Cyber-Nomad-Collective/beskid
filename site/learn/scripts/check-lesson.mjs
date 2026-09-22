#!/usr/bin/env node
import process from "node:process";
import fs from "node:fs";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCurriculum } from "./validate-curriculum.mjs";

const SCRIPT_DIRECTORY = resolve(fileURLToPath(import.meta.url), "..");
const LEARN_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const CURRICULUM_ROOT = resolve(LEARN_ROOT, "curriculum");
const ARG_ID = process.argv[2];
const REPO_ROOT = process.env.BESKID_REPO_ROOT ?? resolve(LEARN_ROOT, "..", "..");
const RUNTIME_PREFIX = process.env.BESKID_RUNTIME_PREFIX ?? resolve(REPO_ROOT, "compiler", "target", "native-runtime-kit");
if (!ARG_ID) { console.error("Usage: pnpm run lesson:check <manifest-lesson-id>"); process.exit(1); }

let lesson;
try {
	const { lessons } = validateCurriculum({ curriculumRoot: CURRICULUM_ROOT });
	lesson = lessons.find(({ id }) => id === ARG_ID);
	if (!lesson) throw new Error(`unknown manifest lesson id '${ARG_ID}'`);
} catch (error) { console.error(`Cannot select lesson: ${error.message}`); process.exit(1); }
if (lesson.check.mode === "reference-only") { console.log(`${ARG_ID}: reference-only lesson; no interactive CLI check is declared.`); process.exit(0); }

const command = lesson.metadata.command;
const lessonDirectory = join(CURRICULUM_ROOT, lesson.path);
const cargoPkg = process.env.BESKID_CARGO_PKG ?? "beskid_cli";
const commandSupportsPlain = command === "analyze" || command === "build" || command === "test";
function hostRuntimeTriple() {
	if (process.platform === "linux" && process.arch === "x64") return "x86_64-unknown-linux-gnu";
	if (process.platform === "darwin" && process.arch === "arm64") return "aarch64-apple-darwin";
	if (process.platform === "win32" && process.arch === "x64") return "x86_64-pc-windows-msvc";
	return null;
}
function runtimeKitMetadataPath(prefix) {
	const triple = hostRuntimeTriple();
	if (triple) return resolve(prefix, "lib", "beskid-runtime", "abi-5", triple, "debug", "abi.json");
	try { const target = fs.readdirSync(resolve(prefix, "lib", "beskid-runtime", "abi-5"), { withFileTypes: true }).find((entry) => entry.isDirectory())?.name; return target ? resolve(prefix, "lib", "beskid-runtime", "abi-5", target, "debug", "abi.json") : null; } catch { return null; }
}
function hasRuntimeMetadata(prefix) { const metadataPath = runtimeKitMetadataPath(prefix); return typeof metadataPath === "string" && existsSync(metadataPath); }
async function ensureRuntimeKit() {
	if (command !== "run" || hasRuntimeMetadata(RUNTIME_PREFIX)) return;
	const stageScript = resolve(REPO_ROOT, "compiler", "scripts", "stage-native-runtime-kit.sh");
	if (!existsSync(stageScript)) return;
	console.log("Staging ABI-v5 runtime kit for run lesson checks..."); fs.mkdirSync(RUNTIME_PREFIX, { recursive: true });
	await new Promise((resolvePromise, reject) => {
		const proc = spawn("bash", [stageScript], { cwd: REPO_ROOT, stdio: "inherit", env: { ...process.env, BESKID_RUNTIME_PREFIX: RUNTIME_PREFIX, BESKID_RUNTIME_KIT_PROFILE: "debug", BESKID_CLI_BIN: process.env.BESKID_BINARY ?? resolve(REPO_ROOT, "compiler", "target", "release", "beskid") } });
		proc.once("error", reject); proc.once("close", (code) => code === 0 ? resolvePromise() : reject(new Error(`runtime-kit stage failed with exit code ${code}`)));
	});
}
function runSource(filename) {
	return new Promise((resolvePromise) => {
		const sourcePath = join(lessonDirectory, filename); const cli = process.env.BESKID_BINARY ?? "cargo";
		const cliArgs = [command, ...(commandSupportsPlain ? ["--plain"] : []), sourcePath];
		const args = process.env.BESKID_BINARY ? cliArgs : ["run", "--manifest-path", join(REPO_ROOT, "compiler", "Cargo.toml"), "-p", cargoPkg, "--", ...cliArgs];
		const proc = spawn(cli, args, { cwd: REPO_ROOT, stdio: "pipe", env: { ...process.env, BESKID_RUNTIME_PREFIX: RUNTIME_PREFIX, BESKID_RUNTIME_KIT_PROFILE: "debug" } }); let output = "";
		for (const stream of ["stdout", "stderr"]) { proc[stream]?.setEncoding("utf8"); proc[stream]?.on("data", (chunk) => { const text = String(chunk); output += text; process[stream === "stderr" ? "stderr" : "stdout"].write(text); }); }
		proc.once("error", (error) => resolvePromise({ filename, failed: true, code: null, output: error.message }));
		proc.once("close", (code) => { const summaryMatch = output.match(/\b(?:Analysis|Syntax):\s*(\d+)\s+error\(s\)/i); const summaryErrors = summaryMatch ? Number(summaryMatch[1] ?? "0") : null; const errorLines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith("x ") && line.includes("error")); resolvePromise({ filename, failed: code !== 0 || (summaryErrors === null ? errorLines.length > 0 : summaryErrors > 0), code, output }); });
	});
}
await ensureRuntimeKit();
const results = await Promise.all([runSource("start.bd"), runSource("solution.bd")]);
const failures = results.filter(({ failed }) => failed);
if (failures.length === 0) console.log(`${ARG_ID}: ${command} pass (start.bd and solution.bd)`);
else { for (const failure of failures) console.error(`${ARG_ID}: ${command} failed for ${failure.filename} (exit ${failure.code})`); process.exitCode = 1; }
