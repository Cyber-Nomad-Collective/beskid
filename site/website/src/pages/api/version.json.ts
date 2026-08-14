export const prerender = true;

const COMPILER_REPO = "Cyber-Nomad-Collective/beskid_compiler";
const LATEST_TAG = (() => {
	const channel = (process.env.BESKID_RELEASE_CHANNEL ?? "stable")
		.trim()
		.toLowerCase();
	switch (channel) {
		case "unstable":
			return "cli-unstable";
		default:
			return "cli-stable";
	}
})();
const FALLBACK_TAG = LATEST_TAG === "cli-stable" ? "cli-unstable" : null;

interface AssetInfo {
	platform: string;
	arch: string;
	kind: "binary";
	url: string;
	filename: string;
}

interface PackageInfo {
	platform: string;
	label: string;
	command: string;
	url: string;
}

interface VersionPayload {
	version: string;
	source: string;
	assets: AssetInfo[];
	packages: PackageInfo[];
	installScript: { sh: string; ps: string };
	containerImages: { base: string; runner: string };
}

interface ReleaseState {
	channel: "stable" | "unstable";
	version: string;
	available_artifacts: string[];
}

function isReleaseState(value: unknown): value is ReleaseState {
	if (!value || typeof value !== "object") return false;
	const state = value as Partial<ReleaseState>;
	return (
		(state.channel === "stable" || state.channel === "unstable") &&
		typeof state.version === "string" &&
		/^\d+\.\d+\.\d+(?:-unstable)?$/.test(state.version) &&
		Array.isArray(state.available_artifacts) &&
		state.available_artifacts.every((asset) => typeof asset === "string")
	);
}

async function fetchReleaseState(tag: string): Promise<ReleaseState | null> {
	const response = await fetch(
		`https://github.com/${COMPILER_REPO}/releases/download/${tag}/release-state.json`,
		{ headers: { "User-Agent": "beskid-website/1.0" } },
	);
	if (!response.ok) return null;
	const state: unknown = await response.json();
	return isReleaseState(state) ? state : null;
}

function assetName(os: string, arch: string, suffix: string): string {
	if (os === "windows") return `beskid-${os}-${arch}${suffix}`;
	return `beskid-${os}-${arch}`;
}

export async function GET({ url: requestUrl }: { url: URL }) {
	void requestUrl;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
	};

	try {
		let selectedTag = LATEST_TAG;
		let state = await fetchReleaseState(selectedTag);
		if (!state && FALLBACK_TAG) {
			selectedTag = FALLBACK_TAG;
			state = await fetchReleaseState(selectedTag);
		}
		if (!state) {
			return new Response(
				JSON.stringify({ error: "No published compiler release state is available" }),
				{ status: 502, headers },
			);
		}
		const version = state.version;
		const ghReleaseBase = `https://github.com/${COMPILER_REPO}/releases/download/${selectedTag}`;

		const platforms: { os: string; arch: string; suffix: string }[] = [
			{ os: "linux", arch: "amd64", suffix: "" },
			{ os: "darwin", arch: "arm64", suffix: "" },
			{ os: "windows", arch: "amd64", suffix: ".exe" },
		];

		const available = new Set(state.available_artifacts);
		const assets: AssetInfo[] = platforms.flatMap((p) => {
			const fn = assetName(p.os, p.arch, p.suffix);
			if (!available.has(fn)) return [];
			return [{
				platform: p.os,
				arch: p.arch,
				kind: "binary" as const,
				url: `${ghReleaseBase}/${fn}`,
				filename: fn,
			}];
		});

		const packages: PackageInfo[] = [
			{
				platform: "linux",
				label: "Ubuntu / Debian (.deb)",
				command: `sudo apt install ./beskid-${version}-amd64.deb`,
				url: `${ghReleaseBase}/beskid-${version}-amd64.deb`,
			},
			{
				platform: "windows",
				label: "Windows (.msi)",
				command: `msiexec /i beskid-${version}-windows-amd64.msi`,
				url: `${ghReleaseBase}/beskid-${version}-windows-amd64.msi`,
			},
			{
				platform: "windows",
				label: "Windows (.exe bootstrapper)",
				command: `.\\beskid-${version}-windows-amd64.exe`,
				url: `${ghReleaseBase}/beskid-${version}-windows-amd64.exe`,
			},
			{
				platform: "macos",
				label: "macOS (.dmg)",
				command: "Open Beskid.app and drag to /Applications",
				url: `${ghReleaseBase}/beskid-${version}-macos-arm64.dmg`,
			},
			{
				platform: "macos",
				label: "Homebrew",
				command: "brew tap cyber-nomad-collective/beskid && brew install beskid",
				url: "",
			},
			{
				platform: "linux",
				label: "Snap",
				command: "sudo snap install beskid --classic",
				url: "",
			},
		].filter((pkg) => pkg.url === "" || available.has(pkg.url.slice(pkg.url.lastIndexOf("/") + 1)));

		const payload: VersionPayload = {
			version,
			source: `github:${state.channel}`,
			assets,
			packages,
			installScript: {
				sh: `curl -fsSL https://beskid-lang.org/install.sh | BESKID_RELEASE_TAG=${selectedTag} bash`,
				ps: `$env:BESKID_RELEASE_TAG='${selectedTag}'; iwr https://beskid-lang.org/install.ps1 -useb | iex`,
			},
			containerImages: {
				base: `ghcr.io/cyber-nomad-collective/beskid:${version}`,
				runner: `ghcr.io/cyber-nomad-collective/beskid-runner:${version}`,
			},
		};

		return new Response(JSON.stringify(payload), { status: 200, headers });
	} catch (err) {
		return new Response(
			JSON.stringify({ error: `Failed to resolve version: ${String(err)}` }),
			{ status: 502, headers },
		);
	}
}
