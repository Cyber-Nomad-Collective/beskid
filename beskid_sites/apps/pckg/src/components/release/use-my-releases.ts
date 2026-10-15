import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PackageSummary, PackageVersionSummary } from "#/lib/pckg-api";
import type { ReleaseCenterApi } from "./release-page";

export const MY_PACKAGES_QUERY_KEY = ["packages", "owner", "me"] as const;
export const releaseVersionsQueryKey = (packageName: string) =>
	["release-versions", packageName] as const;

/**
 * Every version the signed-in publisher has released, newest first, joined
 * from the owner's package list and one versions query per package.
 */
export function useMyReleases(api: ReleaseCenterApi) {
	const queryClient = useQueryClient();
	const packages = useQuery({
		queryKey: MY_PACKAGES_QUERY_KEY,
		queryFn: () => api.listPackages({ owner: "me" }),
	});
	const owned: PackageSummary[] = packages.data ?? [];
	const versions = useQueries({
		queries: owned.map((item) => ({
			queryKey: releaseVersionsQueryKey(item.name),
			queryFn: () => api.listPackageVersions(item.name),
		})),
		combine: (results) => ({
			releases: results
				.flatMap((result) => result.data ?? [])
				.sort((a, b) => b.publishedAtUtc.localeCompare(a.publishedAtUtc)),
			isPending: results.some((result) => result.isPending),
			error: results.find((result) => result.error)?.error ?? null,
		}),
	});

	const refetch = () => {
		void queryClient.invalidateQueries({ queryKey: MY_PACKAGES_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: ["release-versions"] });
	};

	return {
		packages: owned,
		releases: versions.releases as PackageVersionSummary[],
		isPending: packages.isPending || (owned.length > 0 && versions.isPending),
		error: packages.error ?? versions.error,
		refetch,
	};
}
