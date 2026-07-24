"use client";

import { MessageSquareText } from "lucide-react";

import {
	type SpecViewMode,
	useSpecViewMode,
} from "#/components/reader/spec-view-mode";
import { ThemeToggle } from "#/components/theme-toggle";

const MODES: Array<{ id: SpecViewMode; label: string }> = [
	{ id: "browse", label: "Browse" },
	{ id: "map", label: "Map" },
];

export function SpecModeToggle() {
	const { mode, setMode } = useSpecViewMode();

	return (
		<div
			className="spec-mode-toggle inline-flex rounded-lg border border-border/80 bg-muted/40 p-0.5"
			role="group"
			aria-label="Specification view mode"
		>
			{MODES.map((item) => (
				<button
					key={item.id}
					type="button"
					className={[
						"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
						mode === item.id
							? "bg-primary text-primary-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					].join(" ")}
					aria-pressed={mode === item.id}
					onClick={() => setMode(item.id)}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}

export interface ReaderTopBarActionsProps {
	onStartReview?: () => void;
	isReviewing?: boolean;
}

export function ReaderTopBarActions({
	onStartReview,
	isReviewing = false,
}: ReaderTopBarActionsProps) {
	return (
		<div className="ml-auto flex items-center gap-2">
			<SpecModeToggle />
			{onStartReview && !isReviewing ? (
				<button
					type="button"
					className="flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
					onClick={onStartReview}
				>
					<MessageSquareText size={15} />
					Review
				</button>
			) : null}
			<ThemeToggle />
		</div>
	);
}
