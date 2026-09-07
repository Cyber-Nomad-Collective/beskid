import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@cyber-nomad-collective/beskid-ui-react/ui/select";
import type { PublicCatalogEntry } from "../services/nexus-api";

export interface RepoSelectorProps {
	entries: PublicCatalogEntry[];
	activeEntryId?: string;
	onSelect: (entry: PublicCatalogEntry) => void;
	disabled?: boolean;
}

export function RepoSelector({
	entries,
	activeEntryId,
	onSelect,
	disabled,
}: RepoSelectorProps) {
	const indexed = [...entries]
		.filter((entry) => entry.indexed)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	if (indexed.length === 0) {
		return null;
	}

	return (
		<Select
			value={activeEntryId ?? indexed[0]?.id}
			onValueChange={(value) => {
				const entry = indexed.find((item) => item.id === value);
				if (entry) onSelect(entry);
			}}
			disabled={disabled}
		>
			<SelectTrigger
				size="sm"
				className="hidden h-8 max-w-[240px] border-0 bg-transparent px-1 font-semibold shadow-none hover:bg-muted/50 md:inline-flex"
				data-testid="repo-selector"
			>
				<SelectValue placeholder="Select repository" />
			</SelectTrigger>
			<SelectContent align="start">
				{indexed.map((entry) => (
					<SelectItem key={entry.id} value={entry.id}>
						{entry.displayName}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
