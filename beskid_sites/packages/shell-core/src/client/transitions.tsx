"use client";

import { cn } from "@cyber-nomad-collective/beskid-ui-react";
import type { Transition, Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Canonical shell transition timing (seconds — framer-motion takes numbers,
 * not CSS duration strings). These mirror the `--beskid-transition-*` tokens
 * in `beskid-ui-react/styles/tokens.css` so animated shell components stay in
 * lockstep with the CSS-transition design language.
 */
export const SHELL_TRANSITION = {
	/** 120ms — mirrors `--beskid-transition-fast`. */
	fast: 0.12,
	/** 160ms — mirrors `--beskid-transition-base`. */
	base: 0.16,
	/** 200ms — mirrors `--beskid-transition-slow`. */
	slow: 0.2,
	/** ease-out cubic — mirrors `--beskid-ease-out`. */
	easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
	/** ease-in-out cubic — mirrors `--beskid-ease-in-out`. */
	easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

const pageVariants: Variants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
};

const pageTransition: Transition = {
	duration: SHELL_TRANSITION.base,
	ease: SHELL_TRANSITION.easeOut,
};

export interface PageTransitionProps {
	/**
	 * Key that identifies the current route. When this changes, the wrapped
	 * content animates out then in. Pass the pathname (TanStack:
	 * `useRouterState().location.pathname`) or any stable route id.
	 */
	routeKey: string;
	children: ReactNode;
	className?: string;
	/** Disable the animation (e.g. for reduced-motion users). Defaults to false. */
	disabled?: boolean;
}

/**
 * Wraps route content with a fade/slide transition on route change.
 *
 * Opt-in: apps place this around their `<Outlet />` (or page content) and
 * pass the current pathname as `routeKey`. Uses framer-motion
 * `AnimatePresence` with `mode="wait"` so the outgoing page exits before the
 * incoming page enters — no overlap, no layout jank.
 */
export function PageTransition({
	routeKey,
	children,
	className,
	disabled = false,
}: PageTransitionProps) {
	if (disabled) {
		return <div className={className}>{children}</div>;
	}
	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={routeKey}
				className={className}
				variants={pageVariants}
				initial="initial"
				animate="animate"
				exit="exit"
				transition={pageTransition}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}

/**
 * Motion props for a custom page-transition wrapper. Spread onto a
 * `motion.div` keyed by route when you need finer control than
 * {@link PageTransition} (e.g. a staggered list entrance).
 */
export function usePageTransition(): {
	variants: Variants;
	transition: Transition;
} {
	return { variants: pageVariants, transition: pageTransition };
}

export interface AnimatedMode {
	id: string;
	label: string;
	icon?: ReactNode;
}

export interface AnimatedModeSwitcherProps {
	/** Currently active mode id. */
	mode: string;
	/** Ordered mode definitions. */
	modes: AnimatedMode[];
	/** Called when the user picks a mode. */
	onChange?: (id: string) => void;
	className?: string;
	/** Disable the sliding indicator animation. Defaults to false. */
	disabled?: boolean;
}

/**
 * Animated mode switcher (segmented control) with a sliding indicator.
 *
 * Built for pckg's "docs mode" / "pckg mode" toggle, but generic: pass any
 * ordered mode list. The active indicator uses framer-motion's shared
 * `layoutId` so it slides between buttons when the active mode changes.
 */
export function AnimatedModeSwitcher({
	mode,
	modes,
	onChange,
	className,
	disabled = false,
}: AnimatedModeSwitcherProps) {
	if (modes.length === 0) return null;

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1",
				className,
			)}
			role="tablist"
		>
			{modes.map((m) => {
				const active = m.id === mode;
				return (
					<button
						key={m.id}
						type="button"
						role="tab"
						aria-selected={active}
						data-active={active}
						onClick={() => onChange?.(m.id)}
						className={cn(
							"relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
							active
								? "text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{active && !disabled ? (
							<motion.span
								layoutId="beskid-shell-mode-indicator"
								className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border"
								transition={{
									duration: SHELL_TRANSITION.base,
									ease: SHELL_TRANSITION.easeOut,
								}}
							/>
						) : null}
						<span className="relative z-10 inline-flex items-center gap-1.5">
							{m.icon}
							{m.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}
