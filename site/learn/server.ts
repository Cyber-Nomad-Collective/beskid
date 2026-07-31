// @ts-nocheck — Bun runtime (spawn types conflict with Node child_process types)

import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { learnExercises } from "./src/data/learningCatalog";

type CheckRequest = {
	exerciseId: string;
	code: string;
	command: string;
};

type ExerciseSummary = {
	id: string;
	title: string;
	objective: string;
	command: string;
	expectedOutput?: string;
	difficulty: string;
	lessonPath: string;
};

type CheckResult = {
	exerciseId: string;
	command: string;
	exitCode: number;
	success: boolean;
	stdout: string;
	stderr: string;
	timedOut: boolean;
	durationMs: number;
	diagnosticsSummary: string;
	expectedOutput?: string;
	expectedOutputMatched?: boolean;
	error?: string;
};

const PORT = Number(process.env.PORT ?? "4173");
const HOST = "0.0.0.0";
const DIST = join(process.cwd(), "dist");
const BESKID_BINARY = process.env.BESKID_BINARY;
const BESKID_CARGO_PKG = process.env.BESKID_CARGO_PKG ?? "beskid_cli";
const BESKID_COMMAND_TIMEOUT_MS = Number(
	process.env.BESKID_COMMAND_TIMEOUT_MS ?? "25000",
);
const REPO_ROOT = process.env.BESKID_REPO_ROOT ?? resolveRepoRoot();
const BESKID_RUNTIME_PREFIX =
	process.env.BESKID_RUNTIME_PREFIX ??
	resolve(REPO_ROOT, "compiler", "target", "native-runtime-kit");
const BESKID_RUNTIME_KIT_PROFILE =
	process.env.BESKID_RUNTIME_KIT_PROFILE ?? "debug";
let runtimeKitBootstrapPromise: Promise<void> | null = null;
let COMPILER_AVAILABLE = false;

async function verifyBeskidBinary(): Promise<void> {
	const envBinary = process.env.BESKID_BINARY;

	if (envBinary && existsSync(envBinary)) {
		try {
			const proc = spawn(envBinary, ["--version"]);
			const exitCode = await new Promise<number>((resolve) => {
				proc.once("close", (code) => resolve(code ?? 1));
				proc.once("error", () => resolve(1));
			});
			if (exitCode === 0) {
				COMPILER_AVAILABLE = true;
				console.log(`beskid compiler verified: ${envBinary}`);
				return;
			}
		} catch {
			// Fall through to PATH lookup
		}
	}

	try {
		const pathBinary = Bun.which("beskid");
		if (pathBinary) {
			const proc = spawn(pathBinary, ["--version"]);
			const exitCode = await new Promise<number>((resolve) => {
				proc.once("close", (code) => resolve(code ?? 1));
				proc.once("error", () => resolve(1));
			});
			if (exitCode === 0) {
				COMPILER_AVAILABLE = true;
				console.log(`beskid compiler found in PATH: ${pathBinary}`);
				return;
			}
		}
	} catch {
		// PATH lookup failed
	}

	console.warn(
		"Beskid compiler binary not found. " +
		"Compiler checks (analyze, build, run, test) will be unavailable. " +
		"Set BESKID_BINARY env to the beskid CLI binary path, " +
		"or ensure beskid is in PATH.",
	);
	COMPILER_AVAILABLE = false;
}

function resolveRepoRoot(): string {
	const candidates = [
		process.cwd(),
		resolve(process.cwd(), ".."),
		resolve(process.cwd(), "..", ".."),
	];

	for (const candidate of candidates) {
		const absolute = resolve(candidate);
		if (
			existsSync(join(absolute, "compiler", "Cargo.toml")) &&
			existsSync(join(absolute, "site", "learn", "package.json"))
		) {
			return absolute;
		}
	}

	return resolve(process.cwd(), "..");
}

function hostRuntimeTriple(): string | null {
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

function runtimeKitMetadataPath(prefix: string): string | null {
	const triple = hostRuntimeTriple();
	if (triple) {
		return resolve(
			prefix,
			"lib",
			"beskid-runtime",
			"abi-5",
			triple,
			"debug",
			"abi.json",
		);
	}
	return null;
}

function hasRuntimeKit(prefix: string): boolean {
	const metadataPath = runtimeKitMetadataPath(prefix);
	return metadataPath !== null && existsSync(metadataPath);
}

function ensureRuntimeKitForRunCommand(): Promise<void> {
	if (runtimeKitBootstrapPromise) {
		return runtimeKitBootstrapPromise;
	}

	if (hasRuntimeKit(BESKID_RUNTIME_PREFIX)) {
		return Promise.resolve();
	}

	runtimeKitBootstrapPromise = (async () => {
		await new Promise<void>((resolve, reject) => {
			const script = resolve(
				REPO_ROOT,
				"compiler",
				"scripts",
				"stage-native-runtime-kit.sh",
			);
			const proc: ChildProcess = spawn("bash", [script], {
				cwd: REPO_ROOT,
				env: {
					...process.env,
					BESKID_RUNTIME_PREFIX,
					BESKID_RUNTIME_KIT_PROFILE,
					BESKID_CLI_BIN:
						BESKID_BINARY ??
						resolve(REPO_ROOT, "compiler", "target", "release", "beskid"),
				},
			});

			proc.once("error", (error) => reject(error));
			proc.once("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`failed to stage runtime kit (exit ${code})`));
				}
			});
		});
	})();

	return runtimeKitBootstrapPromise;
}

const exerciseById = new Map(
	learnExercises.map((exercise) => [exercise.id, exercise]),
);

function jsonResponse(statusCode: number, body: unknown) {
	return new Response(JSON.stringify(body), {
		status: statusCode,
		headers: { "Content-Type": "application/json" },
	});
}

function resolveBeskidCommand(
	command: string,
	tempFile: string,
): { cmd: string; args: string[] } {
	const commandName = command.trim() || "analyze";
	const rawArgs = commandName.split(/\s+/).filter(Boolean);
	const normalized = rawArgs.length > 0 ? rawArgs : ["analyze"];
	const commandSupportsPlain = ["analyze", "build", "test"].includes(
		normalized[0] ?? "",
	);
	const includePlain = commandSupportsPlain && !normalized.includes("--plain");

	if (BESKID_BINARY && existsSync(BESKID_BINARY)) {
		const includeFileArg = [
			"analyze",
			"parse",
			"tree",
			"run",
			"build",
			"test",
		].includes(normalized[0])
			? [tempFile]
			: [];

		return {
			cmd: BESKID_BINARY,
			args: [
				...normalized,
				...(includePlain ? ["--plain"] : []),
				...includeFileArg,
			],
		};
	}

	if (BESKID_BINARY) {
		console.warn(
			`BESKID_BINARY (${BESKID_BINARY}) not found, falling back to beskid in PATH`,
		);
	}

	try {
		const pathBinary = Bun.which("beskid");
		if (pathBinary) {
			const includeFileArg = [
				"analyze",
				"parse",
				"tree",
				"run",
				"build",
				"test",
			].includes(normalized[0])
				? [tempFile]
				: [];

			return {
				cmd: pathBinary,
				args: [
					...normalized,
					...(includePlain ? ["--plain"] : []),
					...includeFileArg,
				],
			};
		}
	} catch {
		// Bun.which not available
	}

	return {
		cmd: "cargo",
		args: [
			"run",
			"-p",
			BESKID_CARGO_PKG,
			"--",
			...normalized,
			...(includePlain ? ["--plain"] : []),
			tempFile,
		],
	};
}

type CommandResult = {
	exitCode: number;
	stdout: string;
	stderr: string;
	timedOut: boolean;
};

function runCommand(
	cmd: string,
	args: string[],
	cwd: string,
	timeoutMs: number,
): Promise<CommandResult> {
	return new Promise((resolve) => {
		const result = {
			stdout: "",
			stderr: "",
			exitCode: 1,
			timedOut: false,
		};

		let settled = false;
		const complete = (value: CommandResult) => {
			if (settled) {
				return;
			}
			settled = true;
			resolve(value);
		};

		const proc: ChildProcess = spawn(cmd, args, {
			cwd,
			env: {
				...process.env,
				BESKID_RUNTIME_PREFIX,
				BESKID_RUNTIME_KIT_PROFILE,
			},
		});

		proc.stdout?.setEncoding("utf8");
		proc.stderr?.setEncoding("utf8");

		proc.stdout?.on("data", (chunk) => {
			result.stdout += String(chunk);
		});

		proc.stderr?.on("data", (chunk) => {
			result.stderr += String(chunk);
		});

		const timeout = setTimeout(() => {
			result.timedOut = true;
			proc.kill("SIGKILL");
		}, timeoutMs);

		proc.once("close", (code) => {
			clearTimeout(timeout);
			complete({
				exitCode: code ?? 1,
				stdout: result.stdout,
				stderr: result.stderr,
				timedOut: result.timedOut,
			});
		});

		proc.once("error", (error) => {
			clearTimeout(timeout);
			complete({
				exitCode: 1,
				stdout: result.stdout,
				stderr: `${error instanceof Error ? error.message : String(error)}`,
				timedOut: result.timedOut,
			});
		});
	});
}

function extractDiagnosticSummary(output: string, exitCode: number): string {
	const lines = output
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0)
		.slice(0, 8);

	if (lines.length === 0 && exitCode === 0) {
		return "No diagnostics.";
	}

	if (lines.length === 0) {
		return "No compiler output, failed with non-zero exit code.";
	}

	return lines.join("\n");
}

function normalizeExpectedOutput(rawOutput: string): string {
	return rawOutput.replace(/\r\n/g, "\n").replace(/\s+$/g, "").trimStart();
}

async function runBeskidCheck(payload: CheckRequest): Promise<CheckResult> {
	const exercise = exerciseById.get(payload.exerciseId);
	if (!exercise) {
		return {
			exerciseId: payload.exerciseId,
			command: payload.command,
			exitCode: 1,
			success: false,
			stdout: "",
			stderr: `unknown exerciseId: ${payload.exerciseId}`,
			timedOut: false,
			durationMs: 0,
			diagnosticsSummary: "No matching exercise metadata was found.",
			error: "unknown exercise",
		};
	}

	if (!COMPILER_AVAILABLE) {
		return {
			exerciseId: payload.exerciseId,
			command: payload.command,
			exitCode: -1,
			success: false,
			stdout: "",
			stderr: "",
			timedOut: false,
			durationMs: 0,
			diagnosticsSummary: "Compiler binary not available.",
			error: "Compiler binary not available. The Beskid compiler could not be found on this server.",
		};
	}

	const tempDir = await mkdtemp(join(tmpdir(), "beskid-learn-"));
	const tempFile = join(tempDir, `${randomUUID()}.bd`);
	const command = exercise.command;

	const commandStart = Date.now();
	try {
		await writeFile(tempFile, payload.code);

		if (command === "run") {
			await ensureRuntimeKitForRunCommand();
		}

		const { cmd, args } = resolveBeskidCommand(command, tempFile);
		const execResult = await runCommand(
			cmd,
			args,
			REPO_ROOT,
			BESKID_COMMAND_TIMEOUT_MS,
		);
		const durationMs = Date.now() - commandStart;
		const diagnosticsOutput = `${execResult.stdout}\n${execResult.stderr}`;

		const successCore = execResult.exitCode === 0;
		const expectedOutput = exercise.expectedOutput
			? normalizeExpectedOutput(exercise.expectedOutput)
			: undefined;

		let expectedOutputMatched: boolean | undefined;
		let success = successCore;

		if (successCore && expectedOutput && execResult.stdout !== "") {
			const actualOutput = normalizeExpectedOutput(execResult.stdout);
			expectedOutputMatched = actualOutput.includes(expectedOutput);
			if (!expectedOutputMatched) {
				success = false;
			}
		}

		return {
			exerciseId: payload.exerciseId,
			command: `${cmd} ${args.join(" ")}`,
			exitCode: execResult.exitCode,
			success,
			stdout: execResult.stdout,
			stderr: execResult.stderr,
			timedOut: execResult.timedOut,
			durationMs,
			diagnosticsSummary: extractDiagnosticSummary(
				diagnosticsOutput,
				execResult.exitCode,
			),
			expectedOutput,
			expectedOutputMatched,
		};
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
}

function resolvePublicExercises(): Array<ExerciseSummary> {
	return learnExercises.map((exercise) => ({
		id: exercise.id,
		title: exercise.title,
		objective: exercise.objective,
		command: exercise.command,
		expectedOutput: exercise.expectedOutput,
		difficulty: exercise.difficulty,
		lessonPath: exercise.lessonPath,
	}));
}

async function serveAsset(pathname: string) {
	const requestPath = pathname === "/" ? "/index.html" : pathname;
	const normalized = requestPath.replace(/^\/+/, "");

	if (!normalized.length || normalized.includes("..")) {
		return null;
	}

	const filePath = join(DIST, normalized);
	try {
		return new Response(Bun.file(filePath));
	} catch {
		return null;
	}
}

// ── Simple filesystem-based progress store ──
const PROGRESS_FILE = join(process.cwd(), ".beskid-learn-progress.json");
function loadProgress() {
	try {
		return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
	} catch {
		return {};
	}
}
function saveProgress(data: unknown) {
	try {
		writeFileSync(
			PROGRESS_FILE,
			JSON.stringify(data as Record<string, unknown>, null, 2),
		);
		return true;
	} catch {
		return false;
	}
}

await verifyBeskidBinary();

Bun.serve({
	port: PORT,
	hostname: HOST,
	async fetch(req: Request) {
		const requestUrl = new URL(req.url);

		if (requestUrl.pathname === "/api/exercises") {
			return jsonResponse(200, {
				exercises: resolvePublicExercises(),
			});
		}

		if (
			requestUrl.pathname.startsWith("/api/exercise/") &&
			req.method === "GET"
		) {
			const exerciseId = decodeURIComponent(
				requestUrl.pathname.substring("/api/exercise/".length),
			);
			const exercise = exerciseById.get(exerciseId);
			if (!exercise) {
				return jsonResponse(404, { error: "exercise not found" });
			}

			return jsonResponse(200, {
				exercise: {
					id: exercise.id,
					title: exercise.title,
					objective: exercise.objective,
					command: exercise.command,
					expectedOutput: exercise.expectedOutput,
					difficulty: exercise.difficulty,
					lessonPath: exercise.lessonPath,
					hints: exercise.hints,
					starterCode: exercise.starterCode,
				},
			});
		}

		if (requestUrl.pathname === "/api/check" && req.method === "POST") {
			try {
				const payload = (await req.json()) as CheckRequest;

				if (typeof payload.code !== "string" || payload.code.trim().length === 0) {
					return jsonResponse(400, {
						error: "Expected non-empty exercise code",
					});
				}

				if (
					typeof payload.exerciseId !== "string" ||
					payload.exerciseId.length === 0
				) {
					return jsonResponse(400, {
						error: "Missing exerciseId",
					});
				}

				const exercise = exerciseById.get(payload.exerciseId);
				if (!exercise) {
					return jsonResponse(404, {
						error: `Unknown exerciseId: ${payload.exerciseId}`,
					});
				}

				if (
					typeof payload.command !== "string" ||
					payload.command.trim() !== exercise.command
				) {
					return jsonResponse(400, {
						error: `Unsupported command for exercise ${payload.exerciseId}: expected ${exercise.command}`,
					});
				}

				const result = await runBeskidCheck(payload);
				return jsonResponse(result.success ? 200 : 422, result);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Check request failed";
				return jsonResponse(500, { error: message });
			}
		}

		// ── Auth endpoints (reuses Beskid auth-hub handoff) ──
		if (requestUrl.pathname === "/api/auth/me") {
			const cookie = req.headers.get("cookie") ?? "";
			const sessionMatch = /beskid_learn_session=([^;]+)/.exec(cookie);
			if (!sessionMatch) return jsonResponse(200, { user: null });
			try {
				const buf = Buffer.from(sessionMatch[1], "base64url").toString("utf8");
				const sessionData = JSON.parse(buf);
				return jsonResponse(200, {
					user: {
						login: sessionData.login,
						name: sessionData.name ?? null,
						avatarUrl: sessionData.avatarUrl,
					},
				});
			} catch {
				return jsonResponse(200, { user: null });
			}
		}

		if (requestUrl.pathname === "/api/auth/login" && req.method === "POST") {
			try {
				const body = await req.json();
				if (!body.handoffToken)
					return jsonResponse(400, { error: "Missing handoffToken" });
				const hubUrl = (
					process.env.BESKID_AUTH_HUB_URL ?? "https://auth.beskid-lang.org"
				).replace(/\/$/, "");
				const verifyRes = await fetch(`${hubUrl}/api/v1/handoff/verify`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token: body.handoffToken, app: "learn" }),
				});
				if (!verifyRes.ok)
					return jsonResponse(401, { error: "Invalid handoff token" });
				const payload = await verifyRes.json();
				const sessionValue = Buffer.from(
					JSON.stringify({
						login: payload.login,
						name: payload.name ?? null,
						avatarUrl: payload.avatarUrl ?? `https://github.com/${payload.login}.png`,
					}),
				).toString("base64url");
				const maxAge = 60 * 60 * 24 * 7;
				return new Response(null, {
					status: 204,
					headers: {
						"Set-Cookie":
							"beskid_learn_session=" +
							sessionValue +
							"; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
							maxAge,
					},
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : "Login failed";
				return jsonResponse(500, { error: message });
			}
		}

		if (requestUrl.pathname === "/api/auth/logout" && req.method === "POST") {
			return new Response(null, {
				status: 204,
				headers: {
					"Set-Cookie":
						"beskid_learn_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
				},
			});
		}

		// ── Progress persistence ──
		if (requestUrl.pathname === "/api/progress" && req.method === "GET") {
			return jsonResponse(200, loadProgress());
		}
		if (requestUrl.pathname === "/api/progress" && req.method === "POST") {
			const data = await req.json();
			const saved = saveProgress(data);
			return jsonResponse(200, { ok: saved });
		}

		// ── Lesson CRUD (requires auth session) ──
		if (
			requestUrl.pathname.startsWith("/api/lessons/") &&
			(req.method === "POST" || req.method === "PUT")
		) {
			const cookie = req.headers.get("cookie") ?? "";
			if (!/beskid_learn_session=/.test(cookie))
				return jsonResponse(401, { error: "Authentication required" });
			const lessonId = decodeURIComponent(
				requestUrl.pathname.substring("/api/lessons/".length),
			);
			const exercise = exerciseById.get(lessonId);
			if (!exercise) return jsonResponse(404, { error: "Lesson not found" });
			try {
				const body = await req.json();
				if (typeof body.title === "string") exercise.title = body.title;
				if (typeof body.objective === "string") exercise.objective = body.objective;
				if (typeof body.command === "string") exercise.command = body.command;
				if (typeof body.detailedContent === "string")
					exercise.detailedContent = body.detailedContent;
				if (Array.isArray(body.hints)) exercise.hints = body.hints;
				if (typeof body.difficulty === "string")
					exercise.difficulty = body.difficulty;
				return jsonResponse(200, exercise);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Update failed";
				return jsonResponse(500, { error: message });
			}
		}

		if (
			requestUrl.pathname === "/healthz" ||
			requestUrl.pathname === "/api/health"
		) {
			return new Response("ok");
		}

		if (requestUrl.pathname.startsWith("/api/")) {
			return jsonResponse(404, { error: "unknown api route" });
		}

		const asset = await serveAsset(requestUrl.pathname);
		if (asset) {
			return asset;
		}

		return (
			(await serveAsset("/index.html")) ??
			jsonResponse(404, { error: "asset not found" })
		);
	},
});

console.log(`learn server listening on http://${HOST}:${PORT}`);
