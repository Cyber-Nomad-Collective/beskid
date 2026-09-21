import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { PackageDetail } from "#/components/package-detail";
import { PckgApiError, pckgApi } from "#/lib/api";

export const Route = createFileRoute("/_public/packages/$name")({
	component: PackageDetailsPage,
});

function PackageDetailsPage() {
	const { name } = useParams({ from: "/_public/packages/$name" });
	const details = useQuery({
		queryKey: ["package", name],
		queryFn: () => pckgApi.getPackage(name),
	});

	if (details.isPending)
		return <p className="text-muted-foreground">Loading package…</p>;
	if (details.isError) {
		if (details.error instanceof PckgApiError && details.error.status === 404) {
			return (
				<section className="mx-auto max-w-6xl px-5 py-10">
					<h1 className="text-3xl font-bold">{name}</h1>
					<p className="mt-3 text-muted-foreground">
						No package with this name exists.
					</p>
				</section>
			);
		}
		throw details.error;
	}

	return <PackageDetail details={details.data} />;
}
