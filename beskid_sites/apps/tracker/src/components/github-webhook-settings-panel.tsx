"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { cn } from "#/lib/utils";
import {
	getGithubWebhookSettingsFn,
	provisionGithubWebhookFn,
	updateGithubWebhookSettingsFn,
} from "#/server/github-sync-settings";

function generateWebhookSecret(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

export function GithubWebhookSettingsPanel() {
	const queryClient = useQueryClient();
	const [publicOrigin, setPublicOrigin] = useState("");
	const [webhookSecret, setWebhookSecret] = useState("");
	const [copied, setCopied] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [statusIsError, setStatusIsError] = useState(false);

	const settingsQuery = useQuery({
		queryKey: ["github-webhook-settings"],
		queryFn: () => getGithubWebhookSettingsFn(),
	});

	useEffect(() => {
		if (settingsQuery.data) {
			setPublicOrigin(settingsQuery.data.publicOrigin);
		}
	}, [settingsQuery.data]);

	const provisionMutation = useMutation({
		mutationFn: () => provisionGithubWebhookFn(),
		onSuccess: (result) => {
			setStatusIsError(false);
			setStatusMessage(
				`Webhook ${result.action} on GitHub (hook #${result.hookId}). ` +
					`Verify deliveries on GitHub or wait for the next issue event.`,
			);
			void queryClient.invalidateQueries({
				queryKey: ["github-webhook-settings"],
			});
			void queryClient.invalidateQueries({ queryKey: ["bug-sync-status"] });
		},
		onError: (error) => {
			setStatusIsError(true);
			setStatusMessage(
				error instanceof Error
					? error.message
					: "Failed to create webhook on GitHub",
			);
		},
	});

	const saveMutation = useMutation({
		mutationFn: () => {
			const trimmedSecret = webhookSecret.trim();
			return updateGithubWebhookSettingsFn({
				data: {
					publicOrigin: publicOrigin.trim() || undefined,
					...(trimmedSecret.length > 0 ? { webhookSecret: trimmedSecret } : {}),
				},
			});
		},
		onSuccess: () => {
			setWebhookSecret("");
			setStatusIsError(false);
			setStatusMessage("Settings saved.");
			void queryClient.invalidateQueries({
				queryKey: ["github-webhook-settings"],
			});
			void queryClient.invalidateQueries({ queryKey: ["bug-sync-status"] });
		},
		onError: (error) => {
			setStatusIsError(true);
			setStatusMessage(
				error instanceof Error ? error.message : "Failed to save settings",
			);
		},
	});

	const settings = settingsQuery.data;
	const secretLocked = settings?.secretLockedByEnv ?? false;

	const copyWebhookUrl = async () => {
		if (!settings?.webhookUrl) return;
		await navigator.clipboard.writeText(settings.webhookUrl);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	if (settingsQuery.isLoading) {
		return (
			<p className="text-muted-foreground flex items-center gap-2 text-sm">
				<Loader2 className="size-4 animate-spin" />
				Loading settings…
			</p>
		);
	}

	if (settingsQuery.isError || !settings) {
		return (
			<p className="text-destructive text-sm" role="alert">
				{settingsQuery.error instanceof Error
					? settingsQuery.error.message
					: "Could not load settings"}
			</p>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				{settings.syncDisabled ? (
					<Badge variant="outline">Sync disabled</Badge>
				) : settings.secretConfigured ? (
					<Badge variant="secondary">Webhook active</Badge>
				) : (
					<Badge variant="destructive">Webhook not configured</Badge>
				)}
				{settings.secretSource !== "none" ? (
					<Badge variant="outline" className="font-normal">
						Secret: {settings.secretSource === "env" ? "environment" : "database"}
					</Badge>
				) : null}
			</div>

			<p className="text-muted-foreground text-xs leading-relaxed">
				Issue updates sync via GitHub webhooks only. Use{" "}
				<strong className="font-medium text-foreground">Sync now</strong> on the
				Sync tab for a one-time full pull when bootstrapping an empty cache.
			</p>

			<div className="space-y-2">
				<Label htmlFor="webhook-url">Webhook payload URL</Label>
				<div className="flex gap-2">
					<Input
						id="webhook-url"
						readOnly
						value={settings.webhookUrl}
						className="font-mono text-xs"
					/>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={() => void copyWebhookUrl()}
						title="Copy webhook URL"
					>
						{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
					</Button>
				</div>
				<p className="text-muted-foreground text-[11px]">
					Repository{" "}
					<a
						href={`https://github.com/${settings.repoFullName}`}
						className="text-foreground underline-offset-2 hover:underline"
						target="_blank"
						rel="noreferrer"
					>
						{settings.repoFullName}
					</a>
					· JSON payload · <strong>Issues</strong> events only
				</p>
			</div>

			<div className="space-y-2 rounded-md border border-border/50 bg-muted/20 p-3">
				<p className="text-sm font-medium">Create on GitHub</p>
				<p className="text-muted-foreground text-[11px] leading-relaxed">
					Save a webhook secret below, then use API create (recommended) or open
					GitHub’s form and paste the payload URL and secret.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						size="sm"
						disabled={
							!settings.secretConfigured ||
							provisionMutation.isPending ||
							settings.syncDisabled
						}
						onClick={() => provisionMutation.mutate()}
					>
						{provisionMutation.isPending ? (
							<Loader2 className="size-3.5 animate-spin" />
						) : (
							<Sparkles className="size-3.5" />
						)}
						Create webhook via API
					</Button>
					<Button type="button" size="sm" variant="outline" asChild>
						<a href={settings.githubNewWebhookUrl} target="_blank" rel="noreferrer">
							<ExternalLink className="size-3.5" />
							Open GitHub webhook form
						</a>
					</Button>
					<Button type="button" size="sm" variant="ghost" asChild>
						<a href={settings.githubWebhooksUrl} target="_blank" rel="noreferrer">
							Manage hooks
						</a>
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="public-origin">Public tracker URL</Label>
				<Input
					id="public-origin"
					type="url"
					placeholder="https://tracker.beskid-lang.org"
					value={publicOrigin}
					onChange={(e) => setPublicOrigin(e.target.value)}
				/>
				<p className="text-muted-foreground text-[11px]">
					Used to build the webhook URL shown above. Override when the app sits
					behind a proxy, or set <code className="text-xs">TRACKER_PUBLIC_URL</code>{" "}
					in the environment.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="webhook-secret">Webhook secret</Label>
				<Input
					id="webhook-secret"
					type="password"
					autoComplete="new-password"
					placeholder={
						settings.secretConfigured
							? "••••••••  (leave blank to keep)"
							: "At least 8 characters"
					}
					value={webhookSecret}
					disabled={secretLocked}
					onChange={(e) => setWebhookSecret(e.target.value)}
				/>
				{secretLocked ? (
					<p className="text-muted-foreground text-[11px]">
						<code className="text-xs">GITHUB_WEBHOOK_SECRET</code> is set in the
						environment and overrides this field.
					</p>
				) : (
					<p className="text-muted-foreground text-[11px]">
						Must match the secret on the GitHub webhook. Saved locally until you clear
						the field and save.
					</p>
				)}
				{!secretLocked ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8"
						onClick={() => setWebhookSecret(generateWebhookSecret())}
					>
						Generate secret
					</Button>
				) : null}
			</div>

			{settings.lastWebhookAt ? (
				<p className="text-muted-foreground text-xs">
					Last webhook{" "}
					<time dateTime={settings.lastWebhookAt}>
						{new Date(settings.lastWebhookAt).toLocaleString()}
					</time>
					{settings.lastWebhookAction ? ` · ${settings.lastWebhookAction}` : null}
				</p>
			) : (
				<p className="text-muted-foreground text-xs">
					No webhook deliveries recorded yet.
				</p>
			)}

			{statusMessage ? (
				<output className={cn("text-sm", statusIsError && "text-destructive")}>
					{statusMessage}
				</output>
			) : null}

			<Button
				type="button"
				size="sm"
				disabled={saveMutation.isPending || secretLocked}
				onClick={() => saveMutation.mutate()}
			>
				{saveMutation.isPending ? (
					<>
						<Loader2 className="size-3.5 animate-spin" />
						Saving…
					</>
				) : (
					"Save settings"
				)}
			</Button>
		</div>
	);
}
