import {
	defineSettingsRegistry,
	SettingsDialog,
} from "@cyber-nomad-collective/beskid-ui-react/settings";
import { Button } from "@cyber-nomad-collective/beskid-ui-react/ui/button";
import { Input } from "@cyber-nomad-collective/beskid-ui-react/ui/input";
import { Textarea } from "@cyber-nomad-collective/beskid-ui-react/ui/textarea";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	FolderGit2,
	Loader2,
	RefreshCw,
	Settings2,
	Sparkles,
	Trash2,
} from "@/lib/lucide-icons";
import {
	type AuthUser,
	analyzeCatalogEntry,
	type CatalogEntry,
	createCatalogEntry,
	deleteCatalogEntry,
	fetchAdminCatalog,
	fetchOpenRouterSettings,
	updateOpenRouterSettings,
} from "../services/nexus-api";

type NexusSettingsValues = {
	apiKey: string;
	model: string;
	configured: string;
	apiKeyMasked: string;
	repoPlaceholder: string;
};

function RepositoriesPanel({
	authUser,
	onCatalogChanged,
}: {
	authUser: AuthUser;
	onCatalogChanged?: () => void;
}) {
	const [entries, setEntries] = useState<CatalogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState("");
	const [description, setDescription] = useState("");
	const [gitUrl, setGitUrl] = useState("");
	const [analyzingId, setAnalyzingId] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const ownedIds = useMemo(
		() => new Set(authUser.ownedRepoIds ?? []),
		[authUser.ownedRepoIds],
	);

	const loadCatalog = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await fetchAdminCatalog();
			setEntries(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load catalog");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadCatalog();
	}, [loadCatalog]);

	const resetForm = () => {
		setDisplayName("");
		setDescription("");
		setGitUrl("");
	};

	const handleAdd = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const entry = await createCatalogEntry({ displayName, description, gitUrl });
			resetForm();
			setAnalyzingId(entry.id);
			await analyzeCatalogEntry(entry.id);
			await loadCatalog();
			onCatalogChanged?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add repository");
		} finally {
			setAnalyzingId(null);
			setSubmitting(false);
		}
	};

	const handleAnalyze = async (id: string) => {
		setAnalyzingId(id);
		setError(null);
		try {
			await analyzeCatalogEntry(id, { force: true });
			await loadCatalog();
			onCatalogChanged?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Re-index failed");
		} finally {
			setAnalyzingId(null);
		}
	};

	const handleDelete = async (id: string, name: string) => {
		if (!confirm(`Remove "${name}" from the catalog?`)) return;
		setError(null);
		try {
			await deleteCatalogEntry(id);
			await loadCatalog();
			onCatalogChanged?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		}
	};

	const canDelete = (entryId: string) =>
		authUser.isAdmin || ownedIds.has(entryId);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<p className="text-muted-foreground text-sm">
					Register repositories and trigger re-index jobs. Add requires GitHub
					ownership.
				</p>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={loading}
					onClick={() => void loadCatalog()}
				>
					<RefreshCw className="mr-1.5 size-3.5" />
					Refresh
				</Button>
			</div>

			{error ? <p className="text-destructive text-sm">{error}</p> : null}

			<form
				onSubmit={(e) => void handleAdd(e)}
				className="space-y-3 rounded-xl bg-muted/20 p-4"
			>
				<h3 className="text-sm font-medium">Add repository</h3>
				<Input
					required
					placeholder="Display name"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
				/>
				<Textarea
					placeholder="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={2}
				/>
				<Input
					required
					placeholder="https://github.com/org/repo"
					value={gitUrl}
					onChange={(e) => setGitUrl(e.target.value)}
					className="font-mono text-xs"
				/>
				<Button type="submit" className="w-full" disabled={submitting}>
					<Sparkles className="mr-2 size-4" />
					{submitting ? "Adding…" : "Add and index"}
				</Button>
			</form>

			{loading ? (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Loader2 className="size-4 animate-spin" />
					Loading catalog…
				</div>
			) : entries.length > 0 ? (
				<ul className="space-y-2">
					{entries.map((entry) => (
						<li
							key={entry.id}
							className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"
						>
							<div className="min-w-0">
								<p className="font-medium">{entry.displayName}</p>
								<p className="truncate font-mono text-[10px] text-muted-foreground">
									{entry.gitUrl}
								</p>
								<p className="text-[10px] text-muted-foreground">
									{entry.lastIndexedCommit ? "Indexed" : "Pending index"}
									{entry.lastIndexedCommit
										? ` · ${entry.lastIndexedCommit.slice(0, 7)}`
										: ""}
								</p>
							</div>
							<div className="flex shrink-0 gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={analyzingId === entry.id}
									onClick={() => void handleAnalyze(entry.id)}
								>
									{analyzingId === entry.id ? "…" : "Re-index"}
								</Button>
								{canDelete(entry.id) ? (
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="text-destructive"
										aria-label={`Delete ${entry.displayName}`}
										onClick={() => void handleDelete(entry.id, entry.displayName)}
									>
										<Trash2 className="size-4" />
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			) : (
				<p className="text-muted-foreground text-sm">
					No repositories in the catalog yet.
				</p>
			)}

			{analyzingId ? (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Loader2 className="size-4 animate-spin" />
					Indexing in progress…
				</div>
			) : null}
		</div>
	);
}

function buildRegistry(authUser: AuthUser, onCatalogChanged?: () => void) {
	return defineSettingsRegistry<NexusSettingsValues>({
		groups: [
			{
				id: "repositories",
				label: "Repositories",
				icon: FolderGit2,
				sections: [
					{
						id: "catalog",
						title: "Catalog",
						description: "Manage indexed repositories for this Nexus instance.",
						fields: [
							{
								id: "repoPlaceholder",
								kind: "custom",
								label: "Repositories",
								render: () => (
									<RepositoriesPanel
										authUser={authUser}
										onCatalogChanged={onCatalogChanged}
									/>
								),
							},
						],
					},
				],
			},
			{
				id: "openrouter",
				label: "OpenRouter",
				icon: Sparkles,
				sections: [
					{
						id: "inference",
						title: "Code documentation",
						description:
							"Server-side code-doc pipeline uses OpenRouter free model only (no cost to users).",
						keywords: ["openrouter", "api", "model", "inference"],
						fields: [
							{
								id: "configured",
								kind: "readonly",
								label: "Status",
							},
							{
								id: "model",
								kind: "readonly",
								label: "Model",
								description: "Locked to the free OpenRouter router model.",
							},
							{
								id: "apiKeyMasked",
								kind: "readonly",
								label: "Current API key",
							},
							{
								id: "apiKey",
								kind: "password",
								label: "API key",
								placeholder: "Leave blank to keep current key",
							},
						],
					},
				],
			},
		],
	});
}

export interface NexusSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	authUser: AuthUser | null;
	onCatalogChanged?: () => void;
}

export function NexusSettingsHeaderButton({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Button
			type="button"
			variant={open ? "secondary" : "ghost"}
			size="icon-sm"
			className="relative shrink-0"
			onClick={() => onOpenChange(!open)}
			title="Nexus settings"
		>
			<Settings2 className="size-4" aria-hidden />
			<span className="sr-only">Nexus settings</span>
		</Button>
	);
}

export function NexusSettingsDialog({
	open,
	onOpenChange,
	authUser,
	onCatalogChanged,
}: NexusSettingsDialogProps) {
	const [openRouterSettings, setOpenRouterSettings] = useState<{
		configured: boolean;
		model: string;
		apiKeyMasked: string | null;
	} | null>(null);

	useEffect(() => {
		if (!open || !authUser?.isAdmin) return;
		void fetchOpenRouterSettings()
			.then(setOpenRouterSettings)
			.catch(() => setOpenRouterSettings(null));
	}, [open, authUser?.isAdmin]);

	const registry = useMemo(
		() => (authUser ? buildRegistry(authUser, onCatalogChanged) : null),
		[authUser, onCatalogChanged],
	);

	const values = useMemo((): NexusSettingsValues => {
		return {
			apiKey: "",
			model: openRouterSettings?.model ?? "openrouter/free",
			configured: openRouterSettings?.configured ? "Configured" : "Not configured",
			apiKeyMasked: openRouterSettings?.apiKeyMasked ?? "—",
			repoPlaceholder: "",
		};
	}, [openRouterSettings]);

	const handleSave = async (draft: NexusSettingsValues) => {
		const result = await updateOpenRouterSettings({
			...(draft.apiKey.trim() ? { apiKey: draft.apiKey.trim() } : {}),
		});
		setOpenRouterSettings(result);
	};

	if (!authUser?.isAdmin || !registry) return null;

	return (
		<SettingsDialog
			open={open}
			onOpenChange={onOpenChange}
			registry={registry}
			values={values}
			onSave={handleSave}
			defaultSectionId="catalog"
			title="Nexus settings"
			description="Repository catalog and OpenRouter configuration for code documentation."
		/>
	);
}
