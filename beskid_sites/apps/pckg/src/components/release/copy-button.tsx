import { Button } from "@cyber-nomad-collective/beskid-ui-react";
import { Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

/**
 * Copies `value` to the clipboard and reports the outcome in place for a
 * moment ("Copied" / "Copy failed"), so a user never wonders whether the
 * click did anything.
 */
export function CopyButton({
	value,
	label = "Copy",
	size = "sm",
	variant = "outline",
	className,
}: {
	value: string;
	/** Accessible name of the idle button (for example "Copy key"). */
	label?: string;
	size?: "sm" | "default" | "xs";
	variant?: "outline" | "default" | "ghost" | "secondary";
	className?: string;
}) {
	const [state, setState] = useState<CopyState>("idle");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	const settle = (next: CopyState) => {
		setState(next);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setState("idle"), 2000);
	};

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			settle("copied");
		} catch {
			settle("failed");
		}
	};

	const Icon = state === "copied" ? Check : state === "failed" ? X : Copy;
	const text =
		state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label;
	return (
		<Button
			type="button"
			size={size}
			variant={variant}
			className={className}
			onClick={() => void copy()}
			aria-live="polite"
		>
			<Icon data-icon="inline-start" />
			{text}
		</Button>
	);
}
