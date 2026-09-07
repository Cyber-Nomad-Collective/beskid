"use client";

import { useId } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";

const LAYOUT_PRESETS = [
	{ value: "domain-default", label: "domain-default" },
	{ value: "area-default", label: "area-default" },
	{ value: "feature-hub-default", label: "feature-hub-default" },
	{ value: "feature-contract-default", label: "feature-contract-default" },
	{ value: "feature-area-hub-default", label: "feature-area-hub-default" },
	{ value: "article-default", label: "article-default" },
	{ value: "root-default", label: "root-default" },
];

interface LayoutPresetFieldProps {
	label: string;
	value: string;
	hint?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}

export function LayoutPresetField({
	label,
	value,
	hint,
	disabled,
	onChange,
}: LayoutPresetFieldProps) {
	const selectId = useId();

	return (
		<div className="work-item-field min-w-0">
			<label
				htmlFor={selectId}
				className="text-foreground/90 mb-1.5 block text-sm font-medium"
			>
				{label}
			</label>
			<Select
				value={value || undefined}
				onValueChange={onChange}
				disabled={disabled}
			>
				<SelectTrigger id={selectId}>
					<SelectValue placeholder="Choose layout preset…" />
				</SelectTrigger>
				<SelectContent>
					{LAYOUT_PRESETS.map((preset) => (
						<SelectItem key={preset.value} value={preset.value}>
							{preset.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{hint ? (
				<p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>
			) : null}
		</div>
	);
}
