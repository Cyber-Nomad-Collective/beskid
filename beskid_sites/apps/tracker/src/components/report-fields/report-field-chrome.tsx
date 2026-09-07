import type { ReactNode } from "react";

import { MarkdownContent } from "#/components/markdown-content";
import { cn } from "#/lib/utils";

interface ReportFieldChromeProps {
	id?: string;
	label: string;
	required?: boolean;
	hint?: string;
	/** Large summary input (Jira-style). */
	variant?: "default" | "summary";
	children: ReactNode;
	className?: string;
}

export function ReportFieldChrome({
	id,
	label,
	required,
	hint,
	variant = "default",
	children,
	className,
}: ReportFieldChromeProps) {
	if (variant === "summary") {
		return (
			<div className={cn("work-item-field work-item-field--summary", className)}>
				<label
					htmlFor={id}
					className="text-muted-foreground mb-1 block text-xs font-medium tracking-wide uppercase"
				>
					{label}
					{required ? <span className="text-destructive ml-0.5">*</span> : null}
				</label>
				{children}
				{hint ? (
					<p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
						{hint}
					</p>
				) : null}
			</div>
		);
	}

	return (
		<div className={cn("work-item-field", className)}>
			<label
				htmlFor={id}
				className="text-foreground/90 mb-1.5 block text-sm font-medium"
			>
				{label}
				{required ? <span className="text-destructive ml-0.5">*</span> : null}
			</label>
			{children}
			{hint ? (
				<p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
					{hint}
				</p>
			) : null}
		</div>
	);
}

export function ReportFormSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="work-item-section">
			<header className="work-item-section__header">
				<h3 className="work-item-section__title">{title}</h3>
				<MarkdownContent
					optional
					className="work-item-section__description max-w-2xl"
				>
					{description ?? ""}
				</MarkdownContent>
			</header>
			<div className="work-item-section__body">{children}</div>
		</section>
	);
}
