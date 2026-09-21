import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/docs/")({
	component: DocsIndexPage,
});

function DocsIndexPage() {
	return (
		<section className="mx-auto max-w-6xl px-5 py-10">
			<header>
				<h1 className="text-3xl font-bold">Docs</h1>
				<p className="mt-2 text-muted-foreground">
					Browse documentation for published Beskid packages.
				</p>
			</header>
			<p className="mt-6 text-muted-foreground">
				Search for a package in the topbar, then open its{" "}
				<Link to="/packages" search={{ q: "" }} className="text-primary underline">
					package page
				</Link>{" "}
				and choose Documentation.
			</p>
		</section>
	);
}
