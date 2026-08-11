import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = join(websiteRoot, "src", "data", "cli-version.json");
const repository = "Cyber-Nomad-Collective/beskid_compiler";

const response = await fetch(
	`https://api.github.com/repos/${repository}/releases?per_page=30`,
	{ headers: { Accept: "application/vnd.github+json", "User-Agent": "beskid-website-build" } },
);
if (!response.ok) {
	throw new Error(`GitHub release lookup failed (${response.status})`);
}

const releases = await response.json();
const release = releases.find(
	(candidate) =>
		!candidate.draft &&
		!candidate.prerelease &&
		/^cli-v\d+\.\d+\.\d+$/.test(candidate.tag_name),
);
if (!release) {
	throw new Error("No immutable CLI release was found");
}

const version = release.tag_name.slice("cli-v".length);
const payload = {
	version,
	source: "github",
	downloadTag: release.tag_name,
	latestTag: "cli-stable",
	releasePageUrl: `https://github.com/${repository}/releases/tag/${release.tag_name}`,
	latestReleasePageUrl: `https://github.com/${repository}/releases/tag/cli-stable`,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`sync-release-version: wrote ${outputPath} (${version})`);
