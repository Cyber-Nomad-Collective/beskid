import process from "node:process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
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
const BESKID_COMMAND_TIMEOUT_MS = Number(process.env.BESKID_COMMAND_TIMEOUT_MS ?? "25000");
const REPO_ROOT = process.env.BESKID_REPO_ROOT ?? resolveRepoRoot();
const BESKID_RUNTIME_PREFIX =
  process.env.BESKID_RUNTIME_PREFIX ?? resolve(REPO_ROOT, "compiler", "target", "native-runtime-kit");
const BESKID_RUNTIME_KIT_PROFILE = process.env.BESKID_RUNTIME_KIT_PROFILE ?? "debug";
let runtimeKitBootstrapPromise: Promise<void> | null = null;

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
    return resolve(prefix, "lib", "beskid-runtime", "abi-5", triple, "debug", "abi.json");
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
      const script = resolve(REPO_ROOT, "compiler", "scripts", "stage-native-runtime-kit.sh");
      const proc = spawn(
        "bash",
        [script],
        {
          cwd: REPO_ROOT,
          env: {
            ...process.env,
            BESKID_RUNTIME_PREFIX,
            BESKID_RUNTIME_KIT_PROFILE,
            BESKID_CLI_BIN:
              BESKID_BINARY ?? resolve(REPO_ROOT, "compiler", "target", "release", "beskid"),
          },
        },
      );

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

const exerciseById = new Map(learnExercises.map((exercise) => [exercise.id, exercise]));

function jsonResponse(statusCode: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

function resolveBeskidCommand(command: string, tempFile: string): { cmd: string; args: string[] } {
  const commandName = command.trim() || "analyze";
  const rawArgs = commandName.split(/\s+/).filter(Boolean);
  const normalized = rawArgs.length > 0 ? rawArgs : ["analyze"];
  const commandSupportsPlain = ["analyze", "build", "test"].includes(normalized[0] ?? "");
  const includePlain = commandSupportsPlain && !normalized.includes("--plain");

  if (BESKID_BINARY) {
    const includeFileArg = ["analyze", "parse", "tree", "run", "build", "test"].includes(normalized[0])
      ? [tempFile]
      : [];

    return {
      cmd: BESKID_BINARY,
      args: [...normalized, ...(includePlain ? ["--plain"] : []), ...includeFileArg],
    };
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

function runCommand(cmd: string, args: string[], cwd: string, timeoutMs: number): Promise<CommandResult> {
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
  return rawOutput
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/g, "")
    .trimStart();
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
    const execResult = await runCommand(cmd, args, REPO_ROOT, BESKID_COMMAND_TIMEOUT_MS);
    const durationMs = Date.now() - commandStart;
    const diagnosticsOutput = `${execResult.stdout}\n${execResult.stderr}`;

    const successCore = execResult.exitCode === 0;
    const expectedOutput = exercise.expectedOutput ? normalizeExpectedOutput(exercise.expectedOutput) : undefined;

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
      diagnosticsSummary: extractDiagnosticSummary(diagnosticsOutput, execResult.exitCode),
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

    if (requestUrl.pathname.startsWith("/api/exercise/") && req.method === "GET") {
      const exerciseId = decodeURIComponent(requestUrl.pathname.substring("/api/exercise/".length));
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

        if (typeof payload.exerciseId !== "string" || payload.exerciseId.length === 0) {
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

        if (typeof payload.command !== "string" || payload.command.trim() !== exercise.command) {
          return jsonResponse(400, {
            error: `Unsupported command for exercise ${payload.exerciseId}: expected ${exercise.command}`,
          });
        }

        const result = await runBeskidCheck(payload);
        return jsonResponse(result.success ? 200 : 422, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Check request failed";
        return jsonResponse(500, { error: message });
      }
    }

    if (requestUrl.pathname === "/healthz" || requestUrl.pathname === "/api/health") {
      return new Response("ok");
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      return jsonResponse(404, { error: "unknown api route" });
    }

    const asset = await serveAsset(requestUrl.pathname);
    if (asset) {
      return asset;
    }

    return (await serveAsset("/index.html")) ?? jsonResponse(404, { error: "asset not found" });
  },
});

console.log(`learn server listening on http://${HOST}:${PORT}`);
