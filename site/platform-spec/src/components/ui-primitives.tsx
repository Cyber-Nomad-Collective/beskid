import type { ComponentProps, ReactNode } from "react";

function classes(...values: Array<string | undefined>): string {
	return values.filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & {
	variant?: "default" | "ghost";
	size?: "default" | "icon-sm";
};

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<button
			className={classes(
				"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
				variant === "ghost"
					? "hover:bg-accent hover:text-accent-foreground"
					: "bg-primary px-4 py-2 text-primary-foreground hover:opacity-90",
				size === "icon-sm" ? "size-8 p-0" : undefined,
				className,
			)}
			{...props}
		/>
	);
}

export function Badge({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<span
			className={classes(
				"inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
				className,
			)}
		>
			{children}
		</span>
	);
}

export function Card({ className, ...props }: ComponentProps<"section">) {
	return (
		<section
			className={classes(
				"rounded-xl border bg-card text-card-foreground shadow-sm",
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: ComponentProps<"header">) {
	return <header className={classes("space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
	return (
		<h2
			className={classes("font-semibold tracking-tight", className)}
			{...props}
		/>
	);
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			className={classes("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
	return <div className={classes("p-6 pt-0", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
	return (
		<input
			className={classes(
				"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
			{...props}
		/>
	);
}

export function Label({ className, ...props }: ComponentProps<"label">) {
	return (
		<label className={classes("text-sm font-medium", className)} {...props} />
	);
}
