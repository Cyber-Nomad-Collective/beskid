"use client";

import { Textarea } from "#/components/ui/textarea";

interface RelatedTopicsFieldProps {
	id: string;
	label: string;
	value: string;
	hint?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}

export function RelatedTopicsField({
	id,
	label,
	value,
	hint,
	disabled,
	onChange,
}: RelatedTopicsFieldProps) {
	return (
		<div className="work-item-field min-w-0">
			<label
				htmlFor={id}
				className="text-foreground/90 mb-1.5 block text-sm font-medium"
			>
				{label}
			</label>
			<Textarea
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				rows={6}
				disabled={disabled}
				className="font-mono text-xs"
				placeholder={'[{"type":"Feature","title":"…","href":"/platform-spec/…/"}]'}
			/>
			{hint ? (
				<p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>
			) : (
				<p className="text-muted-foreground mt-1.5 text-xs">
					JSON array; `type` must be Domain, Area, or Feature.
				</p>
			)}
		</div>
	);
}
