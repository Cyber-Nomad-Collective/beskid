"use client";

import { useNavigate } from "@tanstack/react-router";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";

interface VersionSwitcherProps {
	versions: string[];
	current: string;
	className?: string;
	/** When set, version changes stay on this route pattern (e.g. workstreams). */
	to?: "/v/$version" | "/workstreams/v/$version";
}

export function VersionSwitcher({
	versions,
	current,
	className,
	to = "/v/$version",
}: VersionSwitcherProps) {
	const navigate = useNavigate();

	return (
		<Select
			value={current}
			onValueChange={(v) => navigate({ to, params: { version: v } })}
		>
			<SelectTrigger className={className ?? "w-[7.5rem] font-mono text-sm"}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{versions.map((v) => (
					<SelectItem key={v} value={v}>
						{v}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
