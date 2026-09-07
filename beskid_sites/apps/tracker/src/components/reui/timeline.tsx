import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "#/lib/utils";

export function Timeline({
	className,
	...props
}: ComponentPropsWithoutRef<"ol">) {
	return (
		<ol
			className={cn(
				"relative ml-1 space-y-6 border-s border-border ps-6",
				className,
			)}
			{...props}
		/>
	);
}

export function TimelineItem({
	className,
	...props
}: ComponentPropsWithoutRef<"li">) {
	return <li className={cn("relative", className)} {...props} />;
}

export function TimelineDot({
	className,
	children,
	...props
}: ComponentPropsWithoutRef<"span"> & { children?: ReactNode }) {
	return (
		<span
			className={cn(
				"bg-background absolute -start-[1.6rem] mt-1.5 flex size-5 items-center justify-center rounded-full border border-border",
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
