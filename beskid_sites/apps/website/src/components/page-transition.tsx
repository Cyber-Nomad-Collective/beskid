/**
 * Route transition wrapper — applies a fade/slide-in animation on every
 * route change by keying the subtree on the current pathname.
 *
 * Respects `prefers-reduced-motion` (the CSS disables the animation).
 */

import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface PageTransitionProps {
	children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return (
		<div key={pathname} className="beskid-page-transition">
			{children}
		</div>
	);
}
