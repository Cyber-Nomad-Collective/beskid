import { Input, Skeleton } from "@cyber-nomad-collective/beskid-ui-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowUpRight,
	BookMarked,
	BookOpen,
	FileText,
	LayoutTemplate,
	Library,
	Scale,
	Search,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { pckgApi } from "#/lib/api";
import { isStandardLibrary, matchesQuery } from "#/lib/package-filters";
import type { PackageSummary } from "#/lib/pckg-api";

export const Route = createFileRoute("/_public/docs/")({
	component: DocsIndexPage,
});

const LANGUAGE_DOCS = [
	{
		href: "https://beskid-lang.org/docs/",
		title: "Beskid documentation",
		description: "Install the toolchain, build projects, and use the CLI.",
		Icon: BookOpen,
	},
	{
		href: "https://beskid-lang.org/book/",
		title: "The Beskid Book",
		description: "Learn the language from first program to host composition.",
		Icon: BookMarked,
	},
	{
		href: "https://beskid-lang.org/docs/standard/",
		title: "Language standard",
		description: "The normative specification of syntax, semantics and tooling.",
		Icon: Scale,
	},
];

function DocsIndexPage() {
	const [query, setQuery] = useState("");
	const packages = useQuery({
		queryKey: ["packages", "all"],
		queryFn: () => pckgApi.listPackages(),
	});
	if (packages.isError) throw packages.error;

	const groups = useMemo(() => {
		const matching = (packages.data ?? [])
			.filter((item) => matchesQuery(item, query))
			.sort((a, b) => a.name.localeCompare(b.name, "en"));
		const libraries = matching.filter((item) => item.packageKind === "library");
		return {
			standard: libraries
				.filter(isStandardLibrary)
				// The aggregate first: it is the entry point to the whole library.
				.sort(
					(a, b) => Number(b.name === "corelib") - Number(a.name === "corelib"),
				),
			libraries: libraries.filter((item) => !isStandardLibrary(item)),
			templates: matching.filter((item) => item.packageKind === "template"),
		};
	}, [packages.data, query]);
	const nothing =
		!packages.isPending &&
		groups.standard.length + groups.libraries.length + groups.templates.length ===
			0;

	return (
		<section className="mx-auto max-w-6xl px-5 py-10">
			<header className="max-w-3xl">
				<p className="text-sm font-medium text-primary">Documentation</p>
				<h1 className="mt-1 text-3xl font-bold">Beskid API reference</h1>
				<p className="mt-2 text-muted-foreground">
					Reference documentation for every published library, generated from the API
					model packed with each release, plus guides for the project templates.
				</p>
				<div className="relative mt-5">
					<Search
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Filter packages, for example http or console"
						aria-label="Filter documentation"
						className="h-10 pl-9"
					/>
				</div>
			</header>

			{packages.isPending ? (
				<div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2, 3, 4, 5].map((card) => (
						<Skeleton key={card} className="h-28" />
					))}
				</div>
			) : (
				<>
					{nothing && (
						<p className="mt-10 rounded-lg border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
							No documented packages match “{query.trim()}”.
						</p>
					)}
					<DocsSection
						title="Standard library"
						description="The corelib workspace: foundation types, runtime, console, concurrency, networking and interop."
						items={groups.standard}
						Icon={Library}
						target="api"
					/>
					<DocsSection
						title="Libraries"
						description="Community and first-party libraries outside the standard library."
						items={groups.libraries}
						Icon={Library}
						target="api"
					/>
					<DocsSection
						title="Project templates"
						description={
							<>
								Scaffolds for{" "}
								<code className="font-mono text-foreground">beskid new</code>; each
								guide explains what the template creates.
							</>
						}
						items={groups.templates}
						Icon={LayoutTemplate}
						target="package"
					/>
				</>
			)}

			<section className="mt-12 border-t border-border pt-8">
				<h2 className="text-lg font-semibold">Language documentation</h2>
				<div className="mt-4 grid gap-3 md:grid-cols-3">
					{LANGUAGE_DOCS.map(({ href, title, description, Icon }) => (
						<a
							key={href}
							href={href}
							className="group flex gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
						>
							<Icon
								aria-hidden="true"
								className="mt-0.5 size-5 shrink-0 text-primary"
							/>
							<span>
								<span className="flex items-center gap-1 font-medium group-hover:text-primary">
									{title}
									<ArrowUpRight aria-hidden="true" className="size-3.5" />
								</span>
								<span className="mt-1 block text-sm text-muted-foreground">
									{description}
								</span>
							</span>
						</a>
					))}
				</div>
			</section>
		</section>
	);
}

function DocsSection({
	title,
	description,
	items,
	Icon,
	target,
}: {
	title: string;
	description: ReactNode;
	items: PackageSummary[];
	Icon: typeof Library;
	/**
	 * Libraries open on the API reference. Templates have no API model, so they
	 * open on their package page: README plus the `beskid new` commands.
	 */
	target: "api" | "package";
}) {
	if (items.length === 0) return null;
	return (
		<section className="mt-10">
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="text-xl font-semibold">{title}</h2>
				<span className="text-sm text-muted-foreground">
					{items.length === 1 ? "1 package" : `${items.length} packages`}
				</span>
			</div>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<DocsCardLink key={item.id} item={item} target={target}>
						<span className="flex items-center gap-2">
							<Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
							<span className="truncate font-mono text-sm font-semibold group-hover:text-primary">
								{item.name}
							</span>
						</span>
						<span className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
							{item.description}
						</span>
						<span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
							<FileText aria-hidden="true" className="size-3.5" />
							{target === "api" ? "API reference" : "README and install"}
						</span>
					</DocsCardLink>
				))}
			</div>
		</section>
	);
}

const CARD =
	"group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary";

function DocsCardLink({
	item,
	target,
	children,
}: {
	item: PackageSummary;
	target: "api" | "package";
	children: ReactNode;
}) {
	return target === "api" ? (
		<Link
			to="/docs/$package"
			params={{ package: item.name }}
			search={{ version: "", tab: "api", item: "", doc: "" }}
			className={CARD}
		>
			{children}
		</Link>
	) : (
		<Link to="/packages/$name" params={{ name: item.name }} className={CARD}>
			{children}
		</Link>
	);
}
