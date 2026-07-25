export const prerender = false;

const COMPILER_REPO = "Cyber-Nomad-Collective/beskid_compiler";
const TRACKER_BASE =
	"https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data";
const SPEC_BASE = "https://spec.beskid-lang.org/platform-spec";
const BOOK_BASE = "/book";

interface ReleaseInfo {
	version: string;
	date: string;
	title: string;
	changelog: string;
	links: { label: string; url: string }[];
}

const KNOWN_RELEASES: ReleaseInfo[] = [
	{
		version: "0.4.0",
		date: "2026-06-07",
		title: "Platform infrastructure",
		changelog:
			"Auth hub, tracker SQLite SOT, Nexus graph explorer, Coolify staging, OpenBao, CI observability, and shared component library.",
		links: [
			{ label: "Tracker", url: `${TRACKER_BASE}/v0.4/version.json` },
			{ label: "Spec", url: `${SPEC_BASE}/` },
			{ label: "Book", url: `${BOOK_BASE}/00-why-beskid-exists/` },
		],
	},
	{
		version: "0.3.0",
		date: "2026-05-12",
		title: "Codegen and lowering",
		changelog:
			"ISLE codegen, TypedProgram lowering, composition DI containers, native AOT pipeline, and runtime bridge architecture.",
		links: [
			{ label: "Tracker", url: `${TRACKER_BASE}/v0.3/version.json` },
			{ label: "Spec", url: `${SPEC_BASE}/` },
		],
	},
	{
		version: "0.2.0",
		date: "2026-04-20",
		title: "Spec cutover and trudoc",
		changelog:
			"OpenSpec catalog, trudoc API JSON, runtime surfaces, trust-to-verify CI discipline, and platform-spec hosting.",
		links: [
			{ label: "Tracker", url: `${TRACKER_BASE}/v0.2/version.json` },
			{ label: "Spec", url: `${SPEC_BASE}/` },
		],
	},
	{
		version: "0.1.0",
		date: "2026-03-28",
		title: "File-scoped modules and corelib",
		changelog:
			"BSOL manifest, file-scoped modules, AOT beskid pack, corelib single-source tree, and green-gate discipline.",
		links: [
			{ label: "Tracker", url: `${TRACKER_BASE}/v0.1/version.json` },
			{ label: "Spec", url: `${SPEC_BASE}/` },
		],
	},
	{
		version: "0.0.0",
		date: "2026-02-01",
		title: "Foundation",
		changelog:
			"Blazor-to-Rust pivot, seventeen-day bootstrap, compiler submodule extraction, project naming, and initial tooling.",
		links: [{ label: "Tracker", url: `${TRACKER_BASE}/v0.0/version.json` }],
	},
];

export async function GET({ url: requestUrl }: { url: URL }) {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
	};

	try {
		const ghApiUrl = `https://api.github.com/repos/${COMPILER_REPO}/releases?per_page=10`;
		const resp = await fetch(ghApiUrl, {
			headers: {
				"User-Agent": "beskid-website/1.0",
				Accept: "application/vnd.github+json",
			},
		});

		if (!resp.ok) {
			return new Response(JSON.stringify(KNOWN_RELEASES), {
				status: 200,
				headers,
			});
		}

		const ghReleases = (await resp.json()) as {
			tag_name: string;
			published_at: string;
			name: string;
			body: string;
		}[];
		const dynamic: ReleaseInfo[] = ghReleases
			.filter((r) => r.tag_name.startsWith("cli-v"))
			.map((r) => ({
				version: r.tag_name.replace("cli-v", ""),
				date: r.published_at.slice(0, 10),
				title: r.name || r.tag_name,
				changelog: (r.body || "").split("\n")[0]?.slice(0, 120) || "",
				links: [
					{
						label: "Release",
						url: `https://github.com/${COMPILER_REPO}/releases/${r.tag_name}`,
					},
				],
			}));

		const merged = dynamic.length > 0 ? dynamic : KNOWN_RELEASES;
		return new Response(JSON.stringify(merged), { status: 200, headers });
	} catch {
		return new Response(JSON.stringify(KNOWN_RELEASES), { status: 200, headers });
	}
}
