"use client";

import {
	defineSettingsRegistry,
	SettingsDialog,
} from "@cyber-nomad-collective/beskid-ui-react/settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bug, Download, Settings2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CatalogImportDialog } from "#/components/catalog-import-dialog";
import { Button } from "#/components/ui/button";
import {
	getImportPreviewFn,
	importCatalogBundleFn,
} from "#/server/catalog-import";
import {
	getGithubWebhookSettingsFn,
	updateGithubWebhookSettingsFn,
} from "#/server/github-sync-settings";
import {
	getSyncSettingsFn,
	triggerGithubExportFn,
	updateSyncSettingsFn,
} from "#/server/sync";

type TrackerSettingsValues = {
	syncEnabled: boolean;
	exportBugs: boolean;
	publicOrigin: string;
	webhookSecret: string;
	repoFullName: string;
	webhookUrl: string;
	outboxDepth: number;
};

function SyncActionsPanel({
	canManage,
	onImportOpen,
}: {
	canManage: boolean;
	onImportOpen: () => void;
}) {
	const queryClient = useQueryClient();
	const exportMutation = useMutation({
		mutationFn: () => triggerGithubExportFn(),
		onSuccess: (result) => {
			toast.success(
				`Exported ${result.succeeded} bug(s) to GitHub (${result.failed} failed)`,
			);
			void queryClient.invalidateQueries({ queryKey: ["tracker-settings"] });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "GitHub bug export failed",
			);
		},
	});

	return (
		<div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3">
			<p className="text-sm font-medium">Manual actions</p>
			<p className="text-muted-foreground text-xs leading-relaxed">
				Tracker is the source of truth for roadmap tasks. GitHub synchronization is
				limited to bugs.
			</p>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={!canManage || exportMutation.isPending}
					onClick={() => exportMutation.mutate()}
				>
					<Upload className="size-3.5" />
					Export bugs
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={!canManage}
					onClick={onImportOpen}
				>
					<Download className="size-3.5" />
					Import catalog
				</Button>
			</div>
		</div>
	);
}

function buildRegistry(canManage: boolean, onImportOpen: () => void) {
	return defineSettingsRegistry<TrackerSettingsValues>({
		groups: [
			{
				id: "github-bugs",
				label: "GitHub Bugs",
				icon: Bug,
				sections: [
					{
						id: "scope",
						title: "Bug synchronization",
						description:
							"Only tracker bugs are exported to and updated from GitHub Issues.",
						fields: [
							{
								id: "syncEnabled",
								kind: "switch",
								label: "Enable GitHub bug sync",
							},
							{
								id: "exportBugs",
								kind: "switch",
								label: "Export bugs",
							},
							{
								id: "outboxDepth",
								kind: "readonly",
								label: "Pending bug exports",
							},
						],
					},
					{
						id: "connection",
						title: "Repository webhook",
						description: "Inbound GitHub issue events are accepted only for bugs.",
						fields: [
							{ id: "repoFullName", kind: "readonly", label: "Repository" },
							{ id: "webhookUrl", kind: "readonly", label: "Webhook URL" },
							{
								id: "publicOrigin",
								kind: "url",
								label: "Public tracker URL",
							},
							{
								id: "webhookSecret",
								kind: "password",
								label: "Webhook secret",
								placeholder: "Leave blank to keep current secret",
							},
						],
					},
					{
						id: "actions",
						title: "Actions",
						fields: [
							{
								id: "syncEnabled",
								kind: "custom",
								label: "Actions",
								render: () => (
									<SyncActionsPanel canManage={canManage} onImportOpen={onImportOpen} />
								),
							},
						],
					},
				],
			},
		],
	});
}

interface TrackerSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	canManage: boolean;
}

export function TrackerSettingsHeaderButton({
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
			title="Tracker settings"
		>
			<Settings2 className="size-4" aria-hidden />
			<span className="sr-only">Tracker settings</span>
		</Button>
	);
}

export function TrackerSettingsDialog({
	open,
	onOpenChange,
	canManage,
}: TrackerSettingsDialogProps) {
	const queryClient = useQueryClient();
	const [importOpen, setImportOpen] = useState(false);
	const settingsQuery = useQuery({
		queryKey: ["tracker-settings"],
		queryFn: async () => {
			const [webhook, sync] = await Promise.all([
				getGithubWebhookSettingsFn(),
				getSyncSettingsFn(),
			]);
			return { webhook, sync };
		},
		enabled: open && canManage,
	});
	const registry = useMemo(
		() => buildRegistry(canManage, () => setImportOpen(true)),
		[canManage],
	);
	const values = useMemo((): TrackerSettingsValues => {
		const webhook = settingsQuery.data?.webhook;
		const sync = settingsQuery.data?.sync;
		return {
			syncEnabled: sync?.enabled ?? false,
			exportBugs: sync?.exportBugs ?? true,
			publicOrigin: webhook?.publicOrigin ?? "",
			webhookSecret: "",
			repoFullName: webhook?.repoFullName ?? "—",
			webhookUrl: webhook?.webhookUrl ?? "—",
			outboxDepth: sync?.outboxDepth ?? 0,
		};
	}, [settingsQuery.data]);

	const handleSave = async (draft: TrackerSettingsValues) => {
		await updateSyncSettingsFn({
			data: { enabled: draft.syncEnabled, exportBugs: draft.exportBugs },
		});
		await updateGithubWebhookSettingsFn({
			data: {
				publicOrigin: draft.publicOrigin.trim() || undefined,
				...(draft.webhookSecret.trim()
					? { webhookSecret: draft.webhookSecret.trim() }
					: {}),
			},
		});
		toast.success("Settings saved");
		void queryClient.invalidateQueries({ queryKey: ["tracker-settings"] });
		void queryClient.invalidateQueries({
			queryKey: ["github-webhook-settings"],
		});
	};

	if (!canManage) return null;
	return (
		<>
			<SettingsDialog<TrackerSettingsValues>
				open={open}
				onOpenChange={onOpenChange}
				registry={registry}
				values={values}
				onSave={handleSave}
				defaultSectionId="scope"
				title="Tracker settings"
				description="Catalog import and GitHub bug synchronization."
			>
				{null}
			</SettingsDialog>
			<CatalogImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				onImport={async (files) => importCatalogBundleFn({ data: { files } })}
				onPreview={async (files) => getImportPreviewFn({ data: { files } })}
				onComplete={() => void queryClient.invalidateQueries()}
			/>
		</>
	);
}
