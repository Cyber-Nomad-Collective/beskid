import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = path.resolve(appDir, "../..");

async function importProductionSsrBundle(): Promise<void> {
	const child = spawn(
		process.execPath,
		["--input-type=module", "--eval", 'await import("./_ssr/ssr.mjs")'],
		{
			cwd: path.join(appDir, ".output/server"),
			env: {
				AUTH_HUB_PUBLIC_URL: "https://auth.example.test",
				MEMGRAPH_URI: "bolt://127.0.0.1:7687",
				NODE_ENV: "production",
				OPENSPEC_ROOT: path.join(workspaceDir, "openspec"),
				PORT: "0",
				SESSION_SECRET: "0123456789abcdef0123456789abcdef",
			},
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	let output = "";
	child.stdout.on("data", (chunk: Buffer) => {
		output += chunk.toString();
	});
	child.stderr.on("data", (chunk: Buffer) => {
		output += chunk.toString();
	});

	await new Promise<void>((resolve, reject) => {
		child.once("error", (error) => {
			reject(error);
		});
		child.once("exit", (code, signal) => {
			if (code === 0) return resolve();
			reject(
				new Error(
					`production SSR bundle import failed (${signal ?? `exit ${code}`}):\n${output}`,
				),
			);
		});
	});
}

await importProductionSsrBundle();
