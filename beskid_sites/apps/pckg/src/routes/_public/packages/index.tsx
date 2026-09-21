import { Button, Input } from "@cyber-nomad-collective/beskid-ui-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { PackageGrid } from "#/components/package-grid";
import { pckgApi } from "#/lib/api";

export const Route = createFileRoute("/_public/packages/")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
	}),
	component: PackagesPage,
});

function PackagesPage() {
	const { q } = useSearch({ from: "/_public/packages/" });
	const packages = useQuery({
		queryKey: ["packages", q],
		queryFn: () => pckgApi.listPackages({ query: q || undefined }),
	});

	if (packages.isPending)
		return <p className="text-muted-foreground">Loading packages…</p>;
	if (packages.isError) throw packages.error;

	return (
		<section className="mx-auto max-w-6xl px-5 py-10">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold">Packages</h1>
					<p className="mt-2 text-muted-foreground">
						Find public packages for your Beskid projects.
					</p>
				</div>
				<form className="flex gap-2" action="/packages">
					<Input
						name="q"
						defaultValue={q}
						placeholder="Search packages"
						aria-label="Search packages"
					/>
					<Button type="submit" variant="outline">
						Search
					</Button>
				</form>
			</div>
			<div className="mt-6">
				<PackageGrid items={packages.data} />
			</div>
		</section>
	);
}
