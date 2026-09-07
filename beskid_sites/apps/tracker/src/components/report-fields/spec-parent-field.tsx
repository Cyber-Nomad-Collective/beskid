"use client";

import { Input } from "#/components/ui/input";

interface SpecParentFieldProps {
	id: string;
	label: string;
	value: string;
	hint?: string;
	required?: boolean;
	disabled?: boolean;
	onChange: (value: string) => void;
}

export function SpecParentField({
	id,
	label,
	value,
	hint,
	required,
	disabled,
	onChange,
}: SpecParentFieldProps) {
	return (
		<div className="work-item-field min-w-0">
			<label
				htmlFor={id}
				className="text-foreground/90 mb-1.5 block text-sm font-medium"
			>
				{label}
				{required ? <span className="text-destructive ml-0.5">*</span> : null}
			</label>
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="platform-spec/compiler/resolution-and-projects"
				required={required}
				disabled={disabled}
				className="font-mono text-xs"
			/>
			{hint ? (
				<p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>
			) : (
				<p className="text-muted-foreground mt-1.5 text-xs">
					Parent document slug under platform-spec (no leading slash).
				</p>
			)}
		</div>
	);
}
