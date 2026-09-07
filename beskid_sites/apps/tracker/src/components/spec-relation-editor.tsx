"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import {
	SPEC_RELATION_TYPES,
	type SpecRelation,
	type SpecRelationType,
} from "#/lib/platform-spec/relations";
import { searchPlatformSpecNav } from "#/server/platform-spec";

interface SpecRelationEditorProps {
	relations: SpecRelation[];
	onChange: (relations: SpecRelation[]) => void;
}

export function SpecRelationEditor({
	relations,
	onChange,
}: SpecRelationEditorProps) {
	const [query, setQuery] = useState("");

	const { data: entries = [], isFetching } = useQuery({
		queryKey: ["platform-spec-nav", query],
		queryFn: () => searchPlatformSpecNav({ data: { query, limit: 12 } }),
		staleTime: 60_000,
	});

	const addRelation = (entry: {
		standardId?: string;
		href: string;
		title: string;
		level: string;
	}) => {
		const path = entry.href.replace(/\/+$/, "") || entry.href;
		if (relations.some((r) => r.path === path)) return;
		onChange([
			...relations,
			{
				standardId: entry.standardId,
				path,
				href: entry.href,
				title: entry.title,
				level: entry.level,
				relation: "implements",
				required: relations.length === 0,
			},
		]);
		setQuery("");
	};

	const updateAt = (index: number, patch: Partial<SpecRelation>) => {
		onChange(relations.map((r, i) => (i === index ? { ...r, ...patch } : r)));
	};

	const removeAt = (index: number) => {
		onChange(relations.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-3">
			<Label>Platform spec relations</Label>
			<p className="text-muted-foreground text-xs">
				Link normative spec nodes. Mark at least one as required. Metadata follows
				platform-spec hierarchy (domain, area, feature).
			</p>

			{relations.map((relation, index) => (
				<div
					key={`${relation.path}-${relation.relation}-${relation.required ? "required" : "optional"}`}
					className="border-border grid gap-2 rounded-lg border p-3"
				>
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{relation.title}</p>
							<p className="text-muted-foreground truncate font-mono text-xs">
								{relation.standardId ?? relation.path}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={() => removeAt(index)}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<Select
							value={relation.relation}
							onValueChange={(v) =>
								updateAt(index, { relation: v as SpecRelationType })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SPEC_RELATION_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="flex items-center gap-2">
							<Switch
								id={`required-${index}`}
								checked={relation.required}
								onCheckedChange={(checked) => updateAt(index, { required: checked })}
							/>
							<Label htmlFor={`required-${index}`} className="text-xs">
								Required
							</Label>
						</div>
					</div>
				</div>
			))}

			<Command shouldFilter={false} className="border-border rounded-lg border">
				<CommandInput
					placeholder="Add spec node…"
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					<CommandEmpty>
						{isFetching ? "Searching…" : "No matching spec pages."}
					</CommandEmpty>
					<CommandGroup>
						{entries.map((entry) => (
							<CommandItem
								key={entry.slug}
								value={entry.slug}
								onSelect={() => addRelation(entry)}
							>
								<Plus className="size-3.5 shrink-0" />
								<span className="font-medium">{entry.title}</span>
								<span className="text-muted-foreground ml-2 text-xs capitalize">
									{entry.level}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				</CommandList>
			</Command>
		</div>
	);
}
