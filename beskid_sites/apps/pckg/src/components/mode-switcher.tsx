import { cn } from "@cyber-nomad-collective/beskid-ui-react/lib/utils";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export type PckgMode = "docs" | "registry";

/**
 * Animated docs/registry mode switcher for the pckg topbar.
 *
 * pckg has two modes with an animated shifting index between them:
 *  - Docs     → `/docs`
 *  - Registry → `/packages`
 *
 * The active segment is derived from the current route pathname (so it stays
 * correct on deep links and reloads), and the sliding indicator animates via
 * a CSS transform transition (see `styles.css`). Clicking a segment navigates
 * to the mode's landing route.
 */
export function ModeSwitcher() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();

	const mode: PckgMode = pathname.startsWith("/docs") ? "docs" : "registry";

	const go = (next: PckgMode) => {
		if (next === mode) return;
		void navigate({ to: next === "docs" ? "/docs" : "/packages" });
	};

	return (
		<div
			className="pckg-mode-switcher"
			role="tablist"
			aria-label="pckg mode"
			data-mode={mode}
		>
			<span
				className={cn(
					"pckg-mode-switcher__indicator",
					mode === "registry" && "pckg-mode-switcher__indicator--right",
				)}
				aria-hidden="true"
			/>
			<button
				type="button"
				role="tab"
				aria-selected={mode === "docs"}
				className={cn(
					"pckg-mode-switcher__btn",
					mode === "docs" && "pckg-mode-switcher__btn--active",
				)}
				onClick={() => go("docs")}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						go("docs");
					}
				}}
			>
				Docs
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={mode === "registry"}
				className={cn(
					"pckg-mode-switcher__btn",
					mode === "registry" && "pckg-mode-switcher__btn--active",
				)}
				onClick={() => go("registry")}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						go("registry");
					}
				}}
			>
				Registry
			</button>
		</div>
	);
}
