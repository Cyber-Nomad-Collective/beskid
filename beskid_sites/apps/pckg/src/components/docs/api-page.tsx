import { Badge } from "@cyber-nomad-collective/beskid-ui-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@cyber-nomad-collective/beskid-ui-react/ui/table";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { CodeView } from "#/components/code-view";
import { Markdown } from "#/components/markdown";
import {
	type ApiIndex,
	breadcrumbs,
	displayName,
	exampleOf,
	isOwn,
	itemSelector,
	kindLabel,
	memberGroups,
	remarksOf,
	summaryOf,
} from "#/lib/api-docs";
import type { ApiDocItem, ApiTypeAnnotation } from "#/lib/pckg-api";

/**
 * One reference page: declaration block, summary, parameter / returns
 * sections for callables, remarks, examples, member tables, and the source
 * location. Section ids match {@link outlineFor} so the right-hand outline
 * can anchor to them.
 */
export function ApiPage({
	index,
	item,
	packageName,
	version,
	onSelect,
	sourceHref,
}: {
	index: ApiIndex;
	item: ApiDocItem;
	packageName: string;
	version: string;
	onSelect: (item: ApiDocItem) => void;
	/** Builds the file-browser link for a location. */
	sourceHref: (file: string) => string;
}) {
	const trail = breadcrumbs(index, item);
	const summary = summaryOf(item);
	const remarks = remarksOf(item);
	const example = exampleOf(item);
	const groups = memberGroups(index, item);
	const typeParameters =
		item.doc?.typeParameters ??
		item.genericParameters?.map((p) => ({ name: p.name, markdown: "" })) ??
		[];

	const TypeRef = ({ type }: { type: ApiTypeAnnotation }) => {
		const target =
			typeof type.refItemId === "number"
				? index.byId.get(type.refItemId)
				: undefined;
		if (target && !isOwn(target) && target.declaringPackage) {
			// Declared by a dependency: open it in that package's reference.
			return (
				<Link
					to="/docs/$package"
					params={{ package: target.declaringPackage }}
					search={{ version: "", tab: "api", item: itemSelector(target), doc: "" }}
					className="font-mono text-primary hover:underline"
					title={`${target.qualifiedName} in ${target.declaringPackage}`}
				>
					{type.display}
				</Link>
			);
		}
		return target ? (
			<button
				type="button"
				className="font-mono text-primary hover:underline"
				onClick={() => onSelect(target)}
			>
				{type.display}
			</button>
		) : (
			<code className="font-mono">{type.display}</code>
		);
	};

	return (
		<article className="min-w-0">
			<nav
				aria-label="Breadcrumb"
				className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
			>
				<span>{packageName}</span>
				{trail.slice(0, -1).map((ancestor) => (
					<span key={ancestor.id} className="flex items-center gap-1">
						<ChevronRight className="size-3" />
						<button
							type="button"
							className="hover:text-foreground hover:underline"
							onClick={() => onSelect(ancestor)}
						>
							{displayName(ancestor)}
						</button>
					</span>
				))}
			</nav>
			<header className="mt-2 flex flex-wrap items-center gap-3">
				<h1 className="font-mono text-2xl font-bold">{displayName(item)}</h1>
				<Badge variant="secondary">{kindLabel(item.kind)}</Badge>
				{item.tier && <Badge variant="outline">tier: {item.tier}</Badge>}
				{item.visibility && item.visibility !== "public" && (
					<Badge variant="outline">{item.visibility}</Badge>
				)}
			</header>
			<p className="mt-1 text-sm text-muted-foreground">
				{item.qualifiedName} · {packageName} {version}
			</p>
			{summary && <Markdown source={summary} className="mt-4" />}

			{item.signature && (
				<Section id="definition" title="Definition">
					<CodeView source={item.signature} language="beskid" />
				</Section>
			)}
			{item.fieldType && !item.signature && (
				<Section id="definition" title="Definition">
					<p className="text-sm">
						Type: <TypeRef type={item.fieldType} />
					</p>
				</Section>
			)}

			{item.kind === "function" && typeParameters.length > 0 && (
				<Section id="type-parameters" title="Type parameters">
					<NameDescriptionTable
						rows={typeParameters.map((p) => ({
							name: p.name,
							description: p.markdown,
						}))}
					/>
				</Section>
			)}
			{item.kind !== "function" && typeParameters.length > 0 && (
				<Section id="type-parameters" title="Type parameters">
					<NameDescriptionTable
						rows={typeParameters.map((p) => ({
							name: p.name,
							description: p.markdown,
						}))}
					/>
				</Section>
			)}

			{item.kind === "function" && (item.parameters?.length ?? 0) > 0 && (
				<Section id="parameters" title="Parameters">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-40">Name</TableHead>
								<TableHead className="w-48">Type</TableHead>
								<TableHead>Description</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{item.parameters?.map((parameter) => (
								<TableRow key={parameter.name}>
									<TableCell className="font-mono">
										{parameter.modifier ? `${parameter.modifier} ` : ""}
										{parameter.name}
									</TableCell>
									<TableCell className="whitespace-normal">
										<TypeRef type={parameter.type} />
									</TableCell>
									<TableCell className="whitespace-normal">
										{parameterDoc(item, parameter.name) ? (
											<Markdown source={parameterDoc(item, parameter.name)} compact />
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Section>
			)}

			{item.kind === "function" && item.returnType && (
				<Section id="returns" title="Returns">
					<p className="text-sm">
						<TypeRef type={item.returnType} />
					</p>
					{item.doc?.returnsMarkdown && (
						<Markdown source={item.doc.returnsMarkdown} className="mt-2" />
					)}
				</Section>
			)}

			{remarks && (
				<Section id="remarks" title="Remarks">
					<Markdown source={remarks} />
				</Section>
			)}
			{example && (
				<Section id="examples" title="Examples">
					<CodeView source={example} language="beskid" />
				</Section>
			)}

			{groups.map((group) => (
				<Section key={group.id} id={group.id} title={group.title}>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-64">Name</TableHead>
								<TableHead>Description</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{group.items.map((member) => (
								<TableRow key={member.id}>
									<TableCell className="whitespace-normal">
										<button
											type="button"
											className="font-mono text-primary hover:underline"
											onClick={() => onSelect(member)}
										>
											{member.signature && member.kind === "function"
												? displayName(member)
												: displayName(member)}
										</button>
										{member.fieldType && (
											<span className="ml-2 text-xs text-muted-foreground">
												{member.fieldType.display}
											</span>
										)}
										{member.kind === "function" && member.returnType && (
											<span className="ml-2 text-xs text-muted-foreground">
												→ {member.returnType.display}
											</span>
										)}
									</TableCell>
									<TableCell className="whitespace-normal">
										{summaryOf(member) ? (
											<Markdown source={summaryOf(member)} compact />
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Section>
			))}

			<Section id="source" title="Source">
				<p className="text-sm">
					<a
						className="font-mono text-primary hover:underline"
						href={sourceHref(item.location.file)}
					>
						{item.location.file}
					</a>
					<span className="text-muted-foreground">
						{" "}
						lines {item.location.startLine}–{item.location.endLine}
					</span>
					{item.declaringPackage && (
						<span className="text-muted-foreground">
							{" "}
							· declared in {item.declaringPackage}
						</span>
					)}
				</p>
			</Section>
		</article>
	);
}

function parameterDoc(item: ApiDocItem, name: string): string {
	return (
		item.doc?.arguments?.find((argument) => argument.name === name)?.markdown ??
		item.parameters?.find((parameter) => parameter.name === name)?.docMarkdown ??
		""
	);
}

function Section({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section id={id} className="mt-8 scroll-mt-20">
			<h2 className="mb-3 border-b border-border pb-1 text-lg font-semibold">
				{title}
			</h2>
			{children}
		</section>
	);
}

function NameDescriptionTable({
	rows,
}: {
	rows: Array<{ name: string; description: string }>;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-40">Name</TableHead>
					<TableHead>Description</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row) => (
					<TableRow key={row.name}>
						<TableCell className="font-mono">{row.name}</TableCell>
						<TableCell className="whitespace-normal">
							{row.description ? (
								<Markdown source={row.description} compact />
							) : (
								<span className="text-muted-foreground">—</span>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
