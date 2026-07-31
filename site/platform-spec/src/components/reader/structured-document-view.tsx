"use client";

import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { TrackerTaskEmbed } from "#/components/reader/tracker-task-embed";
import { renderMarkdownToHtml } from "#/lib/markdown";
import type { LayoutValidation, SpecLayout } from "#/lib/spec/layouts-pure";

export interface StructuredDocumentViewProps {
	title: string;
	specLevel?: string | null;
	status?: string | null;
	description?: string | null;
	bodyMd: string;
	/** Informative Book guides; they never alter this standard's authority. */
	bookLinks?: string[];
	adrs?: {
		href: string;
		title: string;
		status?: string | null;
		decision?: string | null;
	}[];
	relatedTopics?: { href: string; title: string }[];
	architectureGraph?: { graphKey: string; entryNode?: string } | null;
	/** Enforceable layout resolved for this document's spec level. */
	layout?: SpecLayout | null;
	/** Result of validating the body against its enforceable layout. */
	layoutValidation?: LayoutValidation | null;
	showEditLink?: boolean;
	/** Prefill for Propose change → draft context wizard. */
	proposeSearch?: {
		capability: string | undefined;
		domain: string | undefined;
		area: string | undefined;
		feature: string | undefined;
	};
	/** Catalog revision for Tracker embed. */
	catalogRevision?: string | null;
	standardId?: string | null;
}

function bookGuideTitle(href: string): string {
	const slug =
		href
			.replace(/^\/+|\/+$/g, "")
			.split("/")
			.at(-1) ?? href;
	return slug
		.replace(/^\d+-/, "")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bookGuideHref(href: string): string {
	return new URL(href, "https://beskid-lang.org").href;
}

/** Inline SVG: checkmark icon */
function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/** Inline SVG: cross mark icon */
function CrossIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/** Inline SVG: warning triangle icon */
function WarnIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M8.4449 0.608765C8.0183 -0.107015 6.9817 -0.107015 6.5551 0.608765L0.161178 11.4458C-0.275824 12.1833 0.252503 13.1125 1.10608 13.1125H13.8939C14.7475 13.1125 15.2758 12.1833 14.8388 11.4458L8.4449 0.608765ZM7.4141 1.12007C7.45288 1.05468 7.54712 1.05468 7.5859 1.12007L13.9798 11.9572C14.0186 12.0225 13.9715 12.1013 13.8939 12.1013H1.10608C1.02849 12.1013 0.981417 12.0225 1.02018 11.9572L7.4141 1.12007ZM6.8269 4.48605C6.81221 4.10399 7.11783 3.78712 7.5 3.78712C7.88217 3.78712 8.18779 4.10399 8.1731 4.48605L8.01921 8.48606C7.99155 9.20293 7.00845 9.20293 6.98079 8.48606L6.8269 4.48605ZM8.24989 10.476C8.24989 10.8902 7.9141 11.226 7.49989 11.226C7.08568 11.226 6.74989 10.8902 6.74989 10.476C6.74989 10.0617 7.08568 9.72598 7.49989 9.72598C7.9141 9.72598 8.24989 10.0617 8.24989 10.476Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/** Inline SVG: graph/book/chart icon for section headers */
function BookIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M2.5 1C2.22386 1 2 1.22386 2 1.5V13.5C2 13.7761 2.22386 14 2.5 14H12.5C12.7761 14 13 13.7761 13 13.5V1.5C13 1.22386 12.7761 1 12.5 1H2.5ZM3 2H12V13H3V2ZM5 5H10V6H5V5ZM5 8H8V9H5V8Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	);
}

function DecisionIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M7.5 0.5L9.5 5.5H14.5L10.5 9L11.5 14L7.5 11L3.5 14L4.5 9L0.5 5.5H5.5L7.5 0.5Z"
				fill="currentColor"
				stroke="none"
			/>
		</svg>
	);
}

function PuzzleIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M1 1.5C1 1.22386 1.22386 1 1.5 1H5.5C5.77614 1 6 1.22386 6 1.5V3H8V1.5C8 1.22386 8.22386 1 8.5 1H13.5C13.7761 1 14 1.22386 14 1.5V13.5C14 13.7761 13.7761 14 13.5 14H8.5C8.22386 14 8 13.7761 8 13.5V12H6V13.5C6 13.7761 5.77614 14 5.5 14H1.5C1.22386 14 1 13.7761 1 13.5V1.5ZM2 2V13H5V11H9V13H13V2H9V4H5V2H2Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	);
}

export function StructuredDocumentView({
	title,
	specLevel,
	status,
	description,
	bodyMd,
	bookLinks = [],
	adrs = [],
	relatedTopics = [],
	architectureGraph = null,
	layout = null,
	layoutValidation = null,
	showEditLink = true,
	proposeSearch,
	catalogRevision = null,
	standardId = null,
}: StructuredDocumentViewProps) {
	const bodyHtml = renderMarkdownToHtml(bodyMd);
	const [graph, setGraph] = useState<unknown | null>(null);
	const [graphError, setGraphError] = useState<string | null>(null);
	const [graphLoading, setGraphLoading] = useState(false);

	const loadGraph = useCallback(() => {
		if (!architectureGraph?.graphKey) return;
		setGraph(null);
		setGraphError(null);
		setGraphLoading(true);
		fetch(
			`/api/v1/architecture/${encodeURIComponent(architectureGraph.graphKey)}`,
		)
			.then(async (res) => {
				if (!res.ok) {
					const payload = await res.json().catch(() => ({}));
					throw new Error(
						payload?.error ?? `failed to load architecture graph (${res.status})`,
					);
				}
				return res.json();
			})
			.then((data) => {
				setGraph(data);
				setGraphLoading(false);
			})
			.catch((err) => {
				setGraphError(err instanceof Error ? err.message : String(err));
				setGraphLoading(false);
			});
	}, [architectureGraph?.graphKey]);

	useEffect(() => {
		loadGraph();
	}, [loadGraph]);

	const architectureSlot = architectureGraph ? (
		graph ? (
			<details className="spec-collapse">
				<summary className="spec-collapse__summary">
					<span className="spec-collapse__title">Derived architecture graph</span>
				</summary>
				<div className="spec-collapse__body">
					{architectureGraph.entryNode ? (
						<p className="spec-arch-entry">
							Entry node: <code>{architectureGraph.entryNode}</code>
						</p>
					) : null}
					<pre className="spec-arch-code">
						{JSON.stringify(graph, null, 2)}
					</pre>
				</div>
			</details>
		) : graphLoading ? (
			<div className="spec-arch-loading">
				<div className="spec-arch-spinner" aria-hidden="true" />
				Loading architecture graph…
			</div>
		) : graphError ? (
			<div className="spec-arch-error">
				<span className="spec-arch-error__icon">
					<WarnIcon className="text-[var(--destructive)]" />
				</span>
				<div className="spec-arch-error__body">
					<span className="spec-arch-error__msg">
						Failed to load architecture graph: {graphError}
					</span>
					<br />
					<button
						type="button"
						className="spec-arch-error__retry"
						onClick={loadGraph}
					>
						Retry
					</button>
				</div>
			</div>
		) : (
			<div className="spec-arch-absent" />
		)
	) : null;

	const missingHeadings = new Set(
		(layoutValidation?.violations ?? [])
			.filter(
				(violation) => violation.code === "missing-section" && violation.heading,
			)
			.map((violation) => violation.heading as string),
	);

	const layoutSlot = layout ? (
		<details
			className="spec-collapse"
			open={layoutValidation ? !layoutValidation.ok : false}
		>
			<summary className="spec-collapse__summary">
				<span className="spec-collapse__title">
					Document layout: {layout.title}
				</span>
				{layoutValidation ? (
					<span
						className={`spec-layout-conformance ${
							layoutValidation.ok
								? "spec-layout-conformance--pass"
								: "spec-layout-conformance--fail"
						}`}
					>
						{layoutValidation.ok ? "Conforming" : "Non-conforming"}
					</span>
				) : null}
			</summary>
			<div className="spec-collapse__body">
				<ul className="spec-layout-checklist">
					{layout.sections.map((section) => {
						const missing =
							section.required !== false && missingHeadings.has(section.heading);
						return (
							<li key={section.heading} className="spec-layout-checklist__item">
								<span
									className={`spec-layout-checklist__icon ${
										missing
											? "spec-layout-checklist__icon--fail"
											: "spec-layout-checklist__icon--pass"
									}`}
									aria-hidden="true"
								>
									{missing ? <CrossIcon /> : <CheckIcon />}
								</span>
								<code className="spec-layout-checklist__heading">
									{"#".repeat(section.level)} {section.heading}
								</code>
								{section.required === false ? (
									<span className="spec-layout-checklist__tag">Optional</span>
								) : null}
							</li>
						);
					})}
				</ul>
				{layoutValidation && !layoutValidation.ok ? (
					<div className="spec-layout-violations">
						<ul className="spec-layout-violations__list">
							{layoutValidation.violations.map((violation) => (
								<li key={`${violation.code}-${violation.heading ?? ""}`}>
									{violation.message}
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</details>
	) : null;

	return (
		<article className="spec-document-view mx-auto w-full min-w-0 max-w-5xl px-6 py-8">
			<div className="mb-4 flex justify-end">
				{showEditLink ? (
					<Link
						to="/edit/drafts/$id"
						params={{ id: "new" }}
						search={(proposeSearch ?? {}) as never}
						className="text-sm text-primary underline"
					>
						Propose change
					</Link>
				) : null}
			</div>
			<header className="mb-8 space-y-3 border-b border-border pb-6">
				<div className="flex flex-wrap items-center gap-2">
					{specLevel ? (
						<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
							{specLevel}
						</span>
					) : null}
					{status ? (
						<span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
							{status}
						</span>
					) : null}
				</div>
				<h1 className="text-4xl font-bold tracking-tight">{title}</h1>
				{description ? (
					<p className="text-lg text-muted-foreground">{description}</p>
				) : null}
			</header>
			{architectureSlot ? (
				<section className="spec-document-section">{architectureSlot}</section>
			) : null}
			{layoutSlot ? (
				<section className="spec-document-section">{layoutSlot}</section>
			) : null}
			<div
				className="spec-prose prose prose-invert max-w-none"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
				dangerouslySetInnerHTML={{ __html: bodyHtml }}
			/>
			{relatedTopics.length > 0 || adrs.length > 0 || bookLinks.length > 0 ? (
				<aside className="spec-document-section mt-8">
					<div className="spec-related-grid">
						{bookLinks.length > 0 ? (
							<section className="spec-related-card">
								<div className="spec-related-card__header">
									<span className="spec-related-card__icon" aria-hidden="true">
										<BookIcon />
									</span>
									<h2 className="spec-related-card__title">
										Informative Book guides
									</h2>
								</div>
								<p className="spec-related-card__desc">
									These guides explain and contextualize this standard; OpenSpec
									remains the normative source.
								</p>
								<ul className="spec-related-card__list">
									{bookLinks.map((href) => (
										<li key={href}>
											<a href={bookGuideHref(href)}>{bookGuideTitle(href)}</a>
										</li>
									))}
								</ul>
							</section>
						) : null}
						{relatedTopics.length > 0 ? (
							<section className="spec-related-card">
								<div className="spec-related-card__header">
									<span className="spec-related-card__icon" aria-hidden="true">
										<PuzzleIcon />
									</span>
									<h2 className="spec-related-card__title">
										Related capabilities
									</h2>
								</div>
								<ul className="spec-related-card__list">
									{relatedTopics.map((item) => (
										<li key={item.href}>
											<a href={item.href}>{item.title}</a>
										</li>
									))}
								</ul>
							</section>
						) : null}
						{adrs.length > 0 ? (
					<section className="spec-related-card">
						<div className="spec-related-card__header">
							<span className="spec-related-card__icon" aria-hidden="true">
								<DecisionIcon />
							</span>
							<h2 className="spec-related-card__title">Decisions</h2>
						</div>
						<ul className="spec-related-card__list">
							{adrs.map((item) => (
								<li key={item.href}>
									<a
										href={item.href}
										className="flex flex-col rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-accent/25"
									>
										<span className="text-sm font-medium text-foreground">
											{item.title}
										</span>
										<span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
											{item.decision ? (
												<span className="rounded-full border border-primary/40 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
													{item.decision}
												</span>
											) : null}
											{item.status ? (
												<span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem]">
													{item.status}
												</span>
											) : null}
									</span>
								</a>
								</li>
							))}
						</ul>
					</section>
				) : null}
					</div>
				</aside>
			) : null}
			{standardId && catalogRevision ? (
				<TrackerTaskEmbed
					standardId={standardId}
					catalogRevision={catalogRevision}
				/>
			) : null}
		</article>
	);
}
