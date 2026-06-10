import { Link } from "@tanstack/react-router";

import type { NavTreeNode } from "@cyber-nomad-collective/trudoc/platform-spec/nav-tree";

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
			className="spec-nav-rail h-full overflow-y-auto border-r border-border/80 px-3 py-4"
		>
			<p className="mb-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				Specification
			</p>
			<ul className="space-y-0.5">
				{tree.children?.map((child) => (
					<NavNode key={child.slug} node={child} activeSlug={activeSlug} />
				))}
			</ul>
		</nav>
	);
}
