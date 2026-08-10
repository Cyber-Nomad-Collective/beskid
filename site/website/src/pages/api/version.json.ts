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

function assetName(os: string, arch: string, suffix: string): string {
	if (os === "windows") return `beskid-${os}-${arch}${suffix}`;
	return `beskid-${os}-${arch}`;
}

export async function GET({ url: requestUrl }: { url: URL }) {
	const _base = requestUrl.origin;
	const ghReleaseBase = `https://github.com/${COMPILER_REPO}/releases/download/${LATEST_TAG}`;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
	};

	try {
		const versionUrl = `${ghReleaseBase}/cli-version.txt`;
		const resp = await fetch(versionUrl, {
			headers: { "User-Agent": "beskid-website/1.0" },
		});
		if (!resp.ok) {
			return new Response(
				JSON.stringify({ error: `GitHub release fetch failed (${resp.status})` }),
				{ status: 502, headers },
			);
		}
		const version = (await resp.text()).trim();
		if (!/^\d+\.\d+\.\d+/.test(version)) {
			return new Response(
				JSON.stringify({ error: `Invalid version from release: ${version}` }),
				{ status: 502, headers },
			);
		}

		const platforms: { os: string; arch: string; suffix: string }[] = [
			{ os: "linux", arch: "amd64", suffix: "" },
			{ os: "darwin", arch: "arm64", suffix: "" },
			{ os: "windows", arch: "amd64", suffix: ".exe" },
		];

		const assets: AssetInfo[] = platforms.map((p) => {
			const fn = assetName(p.os, p.arch, p.suffix);
			return {
				platform: p.os,
				arch: p.arch,
				kind: "binary" as const,
				url: `${ghReleaseBase}/${fn}`,
				filename: fn,
			};
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
		];

		const payload: VersionPayload = {
			version,
			source: "github",
			assets,
			packages,
			installScript: {
				sh: `curl -fsSL https://beskid-lang.org/install.sh | BESKID_RELEASE_TAG=${LATEST_TAG} bash`,
				ps: `$env:BESKID_RELEASE_TAG='${LATEST_TAG}'; iwr https://beskid-lang.org/install.ps1 -useb | iex`,
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
