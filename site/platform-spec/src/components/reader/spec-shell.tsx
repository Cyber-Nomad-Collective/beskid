"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SpecNavRail } from "#/components/reader/spec-nav-rail";
import { resolveTrappedFocusIndex } from "#/components/reader/spec-nav-tree";
import type { OpenSpecNavNode as NavTreeNode } from "#/server/openspec/reader";

interface SpecShellProps {
	navTree: NavTreeNode;
	activeSlug?: string;
	children: ReactNode;
}

export function SpecShell({ navTree, activeSlug, children }: SpecShellProps) {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const launcherRef = useRef<HTMLButtonElement>(null);
	const dialogPanelRef = useRef<HTMLDivElement>(null);
	const wasMobileNavOpen = useRef(false);

	useEffect(() => {
		if (wasMobileNavOpen.current && !mobileNavOpen) launcherRef.current?.focus();
		wasMobileNavOpen.current = mobileNavOpen;
	}, [mobileNavOpen]);

	const closeMobileNav = () => setMobileNavOpen(false);
	const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			closeMobileNav();
			return;
		}
		if (event.key !== "Tab") return;
		const focusable = [
			...(dialogPanelRef.current?.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
			) ?? []),
		];
		const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
		const nextIndex = resolveTrappedFocusIndex(currentIndex, focusable.length, event.shiftKey);
		if (nextIndex === null) return;
		event.preventDefault();
		focusable[nextIndex]?.focus();
	};

	return (
		<div className="spec-shell flex min-h-0 flex-1 overflow-hidden">
			<button ref={launcherRef} type="button" className="fixed top-2 right-36 z-30 inline-flex size-8 items-center justify-center rounded-md border border-border bg-background lg:hidden" aria-label="Open specification navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={18} aria-hidden /></button>
			<aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden lg:block">
				<SpecNavRail tree={navTree} activeSlug={activeSlug} />
			</aside>
			<main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
			{mobileNavOpen ? (
				<div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Specification navigation" onKeyDown={handleDialogKeyDown}>
					<button type="button" tabIndex={-1} className="absolute inset-0 bg-black/40" aria-label="Close specification navigation" onClick={closeMobileNav} />
					<div ref={dialogPanelRef} className="relative h-full w-[min(22rem,calc(100vw-2rem))] bg-background shadow-xl">
						<button type="button" className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-md hover:bg-muted" aria-label="Close specification navigation" onClick={closeMobileNav}><X size={18} aria-hidden /></button>
						<SpecNavRail tree={navTree} activeSlug={activeSlug} onNavigate={closeMobileNav} autoFocusSearch />
					</div>
				</div>
			) : null}
		</div>
	);
}
