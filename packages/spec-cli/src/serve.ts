import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface ServeOptions {
	workspaceDir: string;
	port?: number;
	platformSpecDir?: string;
}

function resolvePlatformSpecDir(explicit?: string): string {
	if (explicit) return path.resolve(explicit);
	const candidates = [
		path.resolve(process.cwd(), "site/platform-spec"),
		path.resolve(process.cwd(), "../site/platform-spec"),
		path.resolve(process.cwd(), "../../site/platform-spec"),
	];
	for (const candidate of candidates) {
		if (fs.existsSync(path.join(candidate, "package.json"))) {
			return candidate;
		}
	}
	throw new Error(
		"Could not locate site/platform-spec. Pass --app <path> to spec serve.",
	);
}

export function servePlatformSpec(options: ServeOptions): Promise<number> {
	const appDir = resolvePlatformSpecDir(options.platformSpecDir);
	const port = options.port ?? 8460;

	return new Promise((resolve, reject) => {
		const child = spawn(
			"bun",
			["--bun", "vite", "dev", "--port", String(port)],
			{
				cwd: appDir,
				stdio: "inherit",
				env: {
					...process.env,
					SKIP_ENV_VALIDATION: "1",
					SPEC_LOCAL_WORKSPACE: path.resolve(options.workspaceDir),
					SPEC_SYNC_MODE: "json",
					PLATFORM_SPEC_DATA_DIR: path.join(
						options.workspaceDir,
						".spec",
						"runtime",
					),
				},
			},
		);

		child.on("error", reject);
		child.on("exit", (code) => resolve(code ?? 1));
	});
}
