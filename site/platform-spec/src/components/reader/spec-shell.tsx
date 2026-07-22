"use client";

import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SpecNavRail } from "#/components/reader/spec-nav-rail";
import type { OpenSpecNavNode as NavTreeNode } from "#/server/openspec/reader";

interface SpecShellProps {
	navTree: NavTreeNode;
	activeSlug?: string;
	children: ReactNode;
}

export function SpecShell({ navTree, activeSlug, children }: SpecShellProps) {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (mobileNavOpen) closeButtonRef.current?.focus();
	}, [mobileNavOpen]);

	return (
		<div className="spec-shell flex min-h-0 flex-1 overflow-hidden">
			<button type="button" className="fixed top-2 right-36 z-30 inline-flex size-8 items-center justify-center rounded-md border border-border bg-background lg:hidden" aria-label="Open specification navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={18} aria-hidden /></button>
			<aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden lg:block">
				<SpecNavRail tree={navTree} activeSlug={activeSlug} />
			</aside>
			<main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
			{mobileNavOpen ? (
				<div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Specification navigation" onKeyDown={(event) => { if (event.key === "Escape") setMobileNavOpen(false); }}>
					<button type="button" className="absolute inset-0 bg-black/40" aria-label="Close specification navigation" onClick={() => setMobileNavOpen(false)} />
					<div className="relative h-full w-[min(22rem,calc(100vw-2rem))] bg-background shadow-xl">
						<button ref={closeButtonRef} type="button" className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-md hover:bg-muted" aria-label="Close specification navigation" onClick={() => setMobileNavOpen(false)}><X size={18} aria-hidden /></button>
						<SpecNavRail tree={navTree} activeSlug={activeSlug} onNavigate={() => setMobileNavOpen(false)} />
					</div>
				</div>
			) : null}
		</div>
	);
}
