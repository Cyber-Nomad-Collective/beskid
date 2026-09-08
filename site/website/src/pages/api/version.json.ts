import type {
	AssetInfo,
	PackageInfo,
	PlatformId,
	VersionPayload,
} from "@beskid/ui-react/downloads";

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

		const platforms: { id: PlatformId; filename: string }[] = [
			{ id: "linux-amd64", filename: "beskid-linux-amd64" },
			{ id: "darwin-arm64", filename: "beskid-darwin-arm64" },
			{ id: "windows-amd64", filename: "beskid-windows-amd64.exe" },
		];

		const available = new Set(state.available_artifacts);
		const assets: AssetInfo[] = platforms.flatMap((p) => {
			const fn = p.filename;
			if (!available.has(fn)) return [];
			return [{
				platform: p.id,
				kind: "binary" as const,
				url: `${ghReleaseBase}/${fn}`,
				filename: fn,
			}];
		});

		const packages: PackageInfo[] = [
			{
				platform: "linux-amd64",
				label: "Ubuntu / Debian (.deb)",
				command: `sudo apt install ./beskid-${version}-amd64.deb`,
				url: `${ghReleaseBase}/beskid-${version}-amd64.deb`,
			},
			{
				platform: "windows-amd64",
				label: "Windows (.msi)",
				command: `msiexec /i beskid-${version}-windows-amd64.msi`,
				url: `${ghReleaseBase}/beskid-${version}-windows-amd64.msi`,
			},
			{
				platform: "windows-amd64",
				label: "Windows (.exe bootstrapper)",
				command: `.\\beskid-${version}-windows-amd64.exe`,
				url: `${ghReleaseBase}/beskid-${version}-windows-amd64.exe`,
			},
			{
				platform: "darwin-arm64",
				label: "macOS (.dmg)",
				command: "Open Beskid.app and drag to /Applications",
				url: `${ghReleaseBase}/beskid-${version}-macos-arm64.dmg`,
			},
		].filter((pkg) => available.has(pkg.url.slice(pkg.url.lastIndexOf("/") + 1)));

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
