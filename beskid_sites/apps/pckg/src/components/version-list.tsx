import { buttonVariants } from "@cyber-nomad-collective/beskid-ui-react";
import { pckgApi } from "#/lib/api";
import type { PackageVersion } from "#/lib/pckg-api";

/**
 * Bordered version list — `rounded-md border` rows in a `<ul>` (research doc
 * §8.4). Each row shows the version, size, published date, SHA-256, README
 * flag, and a per-version Download button (hidden when yanked).
 */
export function VersionList({
	packageName,
	versions,
}: {
	packageName: string;
	versions: PackageVersion[];
}) {
	return (
		<ul className="mt-3 space-y-2">
			{versions.length === 0 ? (
				<li className="rounded-md border border-border px-4 py-3 text-muted-foreground">
					No released versions yet.
				</li>
			) : (
				versions.map((version) => (
					<li
						key={version.version}
						className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
					>
						<div>
							<span className="font-medium">
								{version.version}
								{version.isYanked ? " (yanked)" : ""}
							</span>
							<p className="mt-1 text-xs text-muted-foreground">
								{(version.sizeBytes / 1024).toFixed(1)} KiB · published{" "}
								{new Date(version.publishedAtUtc).toLocaleDateString()} · SHA-256{" "}
								{version.checksumSha256}
								{version.hasReadme ? " · README" : ""}
							</p>
						</div>
						{!version.isYanked && (
							<a
								className={buttonVariants({ variant: "outline", size: "sm" })}
								href={pckgApi.packageDownloadUrl(packageName, version.version)}
							>
								Download
							</a>
						)}
					</li>
				))
			)}
		</ul>
	);
}
