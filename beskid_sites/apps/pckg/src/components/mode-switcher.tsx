import { cn } from "@cyber-nomad-collective/beskid-ui-react/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";

export type PckgMode = "docs" | "registry";

const MODES: { mode: PckgMode; label: string; to: "/docs" | "/packages" }[] = [
	{ mode: "docs", label: "Docs", to: "/docs" },
	{ mode: "registry", label: "Registry", to: "/packages" },
];

/**
 * pckg topbar identity: the Beskid ridge mark, then a segmented Docs /
 * Registry switch. The active segment follows the route (so deep links and
 * reloads stay correct) and an indicator slides between the two segments.
 * Styling is plain Tailwind on purpose: the switch must not depend on a
 * separate stylesheet.
 */
export function ModeSwitcher() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const mode: PckgMode = pathname.startsWith("/docs") ? "docs" : "registry";

	return (
		<div className="flex items-center gap-2 sm:gap-3">
			<Link
				to="/"
				aria-label="Beskid pckg home"
				className="flex items-center gap-2 rounded-md pr-1 text-foreground"
			>
				<img src="/logo.svg" alt="" className="size-7 dark:hidden" />
				<img src="/logo-dark.svg" alt="" className="hidden size-7 dark:block" />
				<span className="hidden font-mono text-sm font-semibold tracking-tight sm:inline">
					pckg
				</span>
			</Link>
			<div
				role="tablist"
				aria-label="pckg mode"
				data-mode={mode}
				className="relative grid grid-cols-2 rounded-full border border-border bg-muted/60 p-0.5 text-sm"
			>
				<span
					aria-hidden="true"
					className={cn(
						"absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-primary shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
						mode === "registry" && "translate-x-full",
					)}
				/>
				{MODES.map((item) => {
					const active = item.mode === mode;
					return (
						<button
							key={item.mode}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => {
								if (!active) void navigate({ to: item.to });
							}}
							className={cn(
								"relative z-10 rounded-full px-2.5 py-1 font-medium sm:px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
								active
									? "text-primary-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{item.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
