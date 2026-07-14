import { Link } from "@tanstack/react-router";

import type { OpenSpecNavNode as NavTreeNode } from "#/server/openspec/reader";

interface SpecNavRailProps {
	tree: NavTreeNode;
	activeSlug?: string;
}

function NavNode({
	node,
	activeSlug,
	depth = 0,
}: {
	node: NavTreeNode;
	activeSlug?: string;
	depth?: number;
}) {
	const isActive = activeSlug === node.slug;
	const paddingLeft = `${0.75 + depth * 0.75}rem`;

	return (
		<li>
			<Link
				to={node.href}
				className={[
					"block rounded-md px-2 py-1.5 text-sm transition-colors",
					isActive
						? "bg-primary/15 font-medium text-primary"
						: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
				].join(" ")}
				style={{ paddingLeft }}
			>
				{node.title}
			</Link>
			{node.children && node.children.length > 0 ? (
				<ul className="mt-0.5 space-y-0.5">
					{node.children.map((child) => (
						<NavNode
							key={child.slug}
							node={child}
							activeSlug={activeSlug}
							depth={depth + 1}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}

export function SpecNavRail({ tree, activeSlug }: SpecNavRailProps) {
	return (
		<nav
			aria-label="Platform specification"
			className="spec-nav-rail flex h-full flex-col border-r border-border/80"
		>
			<div className="flex-1 overflow-y-auto px-3 py-4">
				<p className="mb-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Specification
				</p>
				<ul className="space-y-0.5">
					{tree.children?.map((child) => (
						<NavNode key={child.slug} node={child} activeSlug={activeSlug} />
					))}
				</ul>
			</div>
			<div className="border-t border-border/80 p-3">
				<Link
					to="/settings/auth/login"
					className="flex w-full items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60"
				>
					Login
				</Link>
			</div>
		</nav>
	);
}
