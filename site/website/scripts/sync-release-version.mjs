import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = join(websiteRoot, "src", "data", "cli-version.json");
const repository = "Cyber-Nomad-Collective/beskid_compiler";
const REPO_API_BASE = `https://api.github.com/repos/${repository}`;

const CHANNEL = (process.env.BESKID_RELEASE_CHANNEL ?? "stable").trim().toLowerCase();
const SEMVER_PREFIX = /^\d+\.\d+\.\d+/;
const PREFERRED_MAJOR = "0.4.";

function resolveRollingTag(channel) {
	return channel === "unstable" ? "cli-unstable" : "cli-stable";
}

function parseVersion(version) {
	if (typeof version !== "string" || !SEMVER_PREFIX.test(version)) {
		return null;
	}

	const release = version.match(SEMVER_PREFIX);
	if (!release) {
		return null;
	}

	return release[0].split(".").map((segment) => Number.parseInt(segment, 10));
}

function compareVersions(left, right) {
	const maxLength = Math.max(left.length, right.length);
	for (let i = 0; i < maxLength; i += 1) {
		const lv = Number.isNaN(left[i] ?? 0) ? 0 : left[i];
		const rv = Number.isNaN(right[i] ?? 0) ? 0 : right[i];
		if (lv !== rv) {
			return lv > rv ? 1 : -1;
		}
	}
	return 0;
}

function pickLatest(entries) {
	if (entries.length === 0) {
		return undefined;
	}

	return [...entries].sort((a, b) => {
		const av = parseVersion(a.version);
		const bv = parseVersion(b.version);
		if (!av || !bv) {
			return 0;
		}
		const diff = compareVersions(bv, av);
		if (diff !== 0) {
			return diff;
		}
		const publishedLeft = Number.isNaN(a.published) ? 0 : a.published;
		const publishedRight = Number.isNaN(b.published) ? 0 : b.published;
		return publishedRight - publishedLeft;
	})[0];
}

const rollingTag = resolveRollingTag(CHANNEL);

async function resolveVersionFromRollingTag(tag) {
	const releaseResponse = await fetch(`${REPO_API_BASE}/releases/tags/${encodeURIComponent(tag)}`, {
		headers: { Accept: "application/vnd.github+json", "User-Agent": "beskid-website-build" },
	});
	if (!releaseResponse.ok) {
		return undefined;
	}

	const release = await releaseResponse.json();
	if (!release || !Array.isArray(release.assets)) {
		return undefined;
	}

	const payloadAsset = release.assets.find(
		(asset) => asset?.name === "cli-version.txt",
	);
	if (!payloadAsset?.browser_download_url) {
		return undefined;
	}

	const payloadResponse = await fetch(payloadAsset.browser_download_url, {
		headers: { "User-Agent": "beskid-website-build" },
	});
	if (!payloadResponse.ok) {
		return undefined;
	}

const raw = await payloadResponse.text();
	const version = parseVersion(raw.trim());
	return version
		? {
				tag,
				version: version.join("."),
			}
		: undefined;
}

let selected = await resolveVersionFromRollingTag(rollingTag);

if (!selected && CHANNEL === "unstable") {
	selected = await resolveVersionFromRollingTag("cli-stable");
}

if (!selected) {
	const releases = [];
	for (let page = 1; ; page += 1) {
		const response = await fetch(
			`${REPO_API_BASE}/releases?per_page=100&page=${page}`,
			{ headers: { Accept: "application/vnd.github+json", "User-Agent": "beskid-website-build" } },
		);
		if (!response.ok) {
			throw new Error(`GitHub release lookup failed (${response.status})`);
		}

		const pageReleases = await response.json();
		if (!Array.isArray(pageReleases) || pageReleases.length === 0) {
			break;
		}

		releases.push(
			...pageReleases
				.filter(
					(release) =>
						!release.draft &&
						!release.prerelease &&
						/^cli-v\d+\.\d+\.\d+/.test(release.tag_name),
				)
				.map((release) => ({
					tag: release.tag_name,
					version: release.tag_name.slice("cli-v".length),
					published: Date.parse(release.published_at ?? ""),
				})),
		);
	}

	const preferredMajor = releases.filter((entry) => entry.version.startsWith(PREFERRED_MAJOR));
	selected = pickLatest(preferredMajor.length > 0 ? preferredMajor : releases);
}

if (!selected) {
	throw new Error("No immutable CLI release was found");
}

const version = selected.version;
const payload = {
	version,
	source: "github",
	downloadTag: selected.tag,
	latestTag: rollingTag,
	releasePageUrl: `https://github.com/${repository}/releases/tag/${selected.tag}`,
	latestReleasePageUrl: `https://github.com/${repository}/releases/tag/${rollingTag}`,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`sync-release-version: wrote ${outputPath} (${version})`);
