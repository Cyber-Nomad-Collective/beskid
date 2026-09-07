import { buttonVariants } from "@cyber-nomad-collective/beskid-ui-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageGrid } from "#/components/package-grid";
import { pckgApi } from "#/lib/api";

export const Route = createFileRoute("/dashboard/my-packages")({
	component: MyPackagesPage,
});

function MyPackagesPage() {
	const packages = useQuery({
		queryKey: ["packages", "owner", "me"],
		queryFn: () => pckgApi.listPackages({ owner: "me" }),
	});

	if (packages.isPending)
		return <p className="text-muted-foreground">Loading your packages…</p>;
	if (packages.isError) throw packages.error;

	return (
		<section className="mx-auto max-w-6xl space-y-6 px-5 py-10">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold">My packages</h1>
					<p className="mt-2 text-muted-foreground">
						Packages owned by your GitHub-backed Auth Hub subject.
					</p>
				</div>
				<Link to="/dashboard/profile" className={buttonVariants()}>
					Upload package
				</Link>
			</header>
			<PackageGrid
				items={packages.data}
				emptyMessage="You do not own any packages yet."
			/>
		</section>
	);
}
