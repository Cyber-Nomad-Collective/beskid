// @ts-nocheck — Bun runtime (spawn types conflict with Node child_process types)

import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { learnExercises } from "./src/data/learningCatalog";
import { isStaticAssetRequest } from "./src/lib/server-routing";

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
const LEARN_SESSION_COOKIE = "beskid_learn_session";
const LEARN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type LearnSession = { login: string; name: string | null; avatarUrl: string };
type JwtPayload = Record<string, unknown> & { exp?: number; iat?: number; iss?: string };

function encodeBase64Url(value: string): string {
	return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string | null {
	try {
		return Buffer.from(value, "base64url").toString("utf8");
	} catch {
		return null;
	}
}

function signJwtPart(secret: string, value: string): string {
	return createHmac("sha256", secret).update(value).digest("base64url");
}

function parseSignedJwt(secret: string, token: string): JwtPayload | null {
	const [headerPart, payloadPart, signature] = token.split(".");
	if (!headerPart || !payloadPart || !signature) return null;
	const expectedSignature = signJwtPart(secret, `${headerPart}.${payloadPart}`);
	if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
	try {
		const header = JSON.parse(decodeBase64Url(headerPart) ?? "") as { alg?: string };
		const payload = JSON.parse(decodeBase64Url(payloadPart) ?? "") as JwtPayload;
		if (header.alg !== "HS256") return null;
		if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}

function createSignedJwt(secret: string, payload: JwtPayload): string {
	const headerPart = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payloadPart = encodeBase64Url(JSON.stringify(payload));
	const signed = `${headerPart}.${payloadPart}`;
	return `${signed}.${signJwtPart(secret, signed)}`;
}

function learnSessionSecret(): string | null {
	const secret = process.env.LEARN_SESSION_SECRET;
	return secret && secret.length >= 32 ? secret : null;
}

function readCookie(request: Request, name: string): string | null {
	for (const part of (request.headers.get("cookie") ?? "").split(";")) {
		const [key, ...value] = part.trim().split("=");
		if (key === name) return decodeURIComponent(value.join("="));
	}
	return null;
}

async function getLearnSession(request: Request): Promise<LearnSession | null> {
	const secret = learnSessionSecret();
	const token = readCookie(request, LEARN_SESSION_COOKIE);
	if (!secret || !token) return null;
	try {
		const payload = parseSignedJwt(secret, token);
		if (!payload) return null;
		if (typeof payload.login !== "string") return null;
		return {
			login: payload.login,
			name: typeof payload.name === "string" ? payload.name : null,
			avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : "",
		};
	} catch {
		return null;
	}
}

async function sealLearnSession(session: LearnSession): Promise<string> {
	const secret = learnSessionSecret();
	if (!secret) throw new Error("LEARN_SESSION_SECRET must be configured");
	const now = Math.floor(Date.now() / 1000);
	return createSignedJwt(secret, { ...session, iat: now, exp: now + LEARN_SESSION_MAX_AGE_SECONDS });
}

function verifyLearnHandoff(serviceToken: string, token: string): LearnSession | null {
	if (serviceToken.length < 32) return null;
	const payload = parseSignedJwt(serviceToken, token);
	if (!payload || payload.iss !== "beskid-auth-hub" || payload.app !== "learn") return null;
	if (typeof payload.sid !== "string" || typeof payload.login !== "string") return null;
	return {
		login: payload.login,
		name: typeof payload.name === "string" ? payload.name : null,
		avatarUrl: typeof payload.avatar_url === "string" ? payload.avatar_url : "",
	};
}

function learnSessionCookie(token: string): string {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	return `${LEARN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${LEARN_SESSION_MAX_AGE_SECONDS}${secure}`;
}

function clearLearnSessionCookie(): string {
	return `${LEARN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

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
	const file = Bun.file(filePath);
	// Bun.file() creates a lazy handle even when the path is absent. Returning
	// that handle turns client-side routes such as `/learn` into a 500 while the
	// response body is streamed. Check existence first so the SPA fallback below
	// can serve index.html for every non-asset route.
	if (!(await file.exists())) {
		return null;
	}

	return new Response(file);
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
			if (!(await getLearnSession(req))) return jsonResponse(401, { error: "Authentication required" });
			return jsonResponse(200, {
				exercises: resolvePublicExercises(),
			});
		}

		if (
			requestUrl.pathname.startsWith("/api/exercise/") &&
			req.method === "GET"
		) {
			if (!(await getLearnSession(req))) return jsonResponse(401, { error: "Authentication required" });
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
			if (!(await getLearnSession(req))) return jsonResponse(401, { error: "Authentication required" });
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
			return jsonResponse(200, { user: await getLearnSession(req) });
		}

		if (requestUrl.pathname === "/api/auth/hub-finish" && req.method === "GET") {
			try {
				const handoff = requestUrl.searchParams.get("handoff");
				const serviceToken = process.env.LEARN_AUTH_SERVICE_TOKEN;
				const session = handoff && serviceToken ? verifyLearnHandoff(serviceToken, handoff) : null;
				if (!session) throw new Error("Invalid Learn Auth Hub handoff");
				const token = await sealLearnSession(session);
				return new Response(null, {
					status: 302,
					headers: {
						"Set-Cookie": learnSessionCookie(token),
						Location: "/",
					},
				});
			} catch {
				return new Response(null, { status: 302, headers: { "Set-Cookie": clearLearnSessionCookie(), Location: "/?error=oauth_failed" } });
			}
		}

		if (requestUrl.pathname === "/api/auth/logout" && req.method === "POST") {
			return new Response(null, {
				status: 204,
				headers: {
					"Set-Cookie": clearLearnSessionCookie(),
				},
			});
		}

		// ── Progress persistence ──
		if (requestUrl.pathname === "/api/progress" && req.method === "GET") {
			if (!(await getLearnSession(req))) return jsonResponse(401, { error: "Authentication required" });
			return jsonResponse(200, loadProgress());
		}
		if (requestUrl.pathname === "/api/progress" && req.method === "POST") {
			if (!(await getLearnSession(req))) return jsonResponse(401, { error: "Authentication required" });
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
		if (isStaticAssetRequest(requestUrl.pathname)) {
			return jsonResponse(404, { error: "asset not found" });
		}

		return (
			(await serveAsset("/index.html")) ??
			jsonResponse(404, { error: "asset not found" })
		);
	},
});

console.log(`learn server listening on http://${HOST}:${PORT}`);
