import { Input } from "@cyber-nomad-collective/beskid-ui-react";
import { useMemo, useState } from "react";
import {
	type ApiIndex,
	buildApiIndex,
	defaultPage,
	outlineFor,
	resolveItem,
} from "#/lib/api-docs";
import type { ApiDocItem, ApiDocRoot } from "#/lib/pckg-api";
import { ApiNav } from "./api-nav";
import { ApiPage } from "./api-page";

/**
 * Three-column API reference: namespace tree, the selected page, and an
 * "In this article" outline. Modelled on learn.microsoft.com .NET API
 * reference and docs.rs. Presentational: the route owns `?item=`.
 */
export function ApiReference({
	api,
	packageName,
	version,
	selector,
	onSelect,
	sourceHref,
}: {
	api: ApiDocRoot;
	packageName: string;
	version: string;
	/** `?item=` value: numeric id, symbolKey or qualifiedName. */
	selector: string;
	onSelect: (item: ApiDocItem) => void;
	sourceHref: (file: string) => string;
}) {
	const index: ApiIndex = useMemo(() => buildApiIndex(api), [api]);
	const selected = useMemo(
		() => resolveItem(index, selector) ?? defaultPage(index),
		[index, selector],
	);
	const outline = useMemo(
		() => (selected ? outlineFor(index, selected) : []),
		[index, selected],
	);
	const [filter, setFilter] = useState("");

	return (
		<div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_200px]">
			<aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
				<Input
					aria-label="Filter API items"
					placeholder="Filter"
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
					className="mb-3"
				/>
				<ApiNav
					index={index}
					selected={selected}
					onSelect={onSelect}
					filter={filter}
				/>
			</aside>
			<div className="min-w-0">
				{selected ? (
					<ApiPage
						index={index}
						item={selected}
						packageName={packageName}
						version={version}
						onSelect={onSelect}
						sourceHref={sourceHref}
					/>
				) : (
					<p className="text-sm text-muted-foreground">
						This release documents no public items.
					</p>
				)}
			</div>
			<aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
				{outline.length > 0 && (
					<nav
						aria-label="In this article"
						className="border-l border-border pl-3 text-sm"
					>
						<p className="mb-2 font-semibold">In this article</p>
						<ul className="space-y-1">
							{outline.map((entry) => (
								<li key={entry.id}>
									<a
										href={`#${entry.id}`}
										className="text-muted-foreground hover:text-foreground"
									>
										{entry.title}
									</a>
								</li>
							))}
						</ul>
					</nav>
				)}
			</aside>
		</div>
	);
}
