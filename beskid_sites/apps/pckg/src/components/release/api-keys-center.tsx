import {
	Badge,
	Button,
	Input,
	Label,
} from "@cyber-nomad-collective/beskid-ui-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/alert-dialog";
import { Checkbox } from "@cyber-nomad-collective/beskid-ui-react/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@cyber-nomad-collective/beskid-ui-react/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@cyber-nomad-collective/beskid-ui-react/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ReleaseTableSkeleton } from "#/components/loading-skeletons";
import { pckgApi } from "#/lib/api";
import { formatDate, formatDateTime } from "#/lib/format";
import type { ApiKey, CreatedApiKey } from "#/lib/pckg-api";
import { CopyButton } from "./copy-button";
import {
	CodeBlock,
	type ReleaseCenterApi,
	ReleaseErrorState,
	ReleasePage,
	ReleasePageHeader,
} from "./release-page";

export const API_KEYS_QUERY_KEY = ["api-keys"] as const;

/**
 * Scopes the registry accepts (`normalized_scopes` in
 * `beskid_pckg_server/src/api_key_routes.rs`): `read` and `publish`.
 */
const SCOPES = [
	{
		id: "publish",
		label: "Publish",
		description: "Upload versions and yank or unyank releases of your packages.",
	},
	{
		id: "read",
		label: "Read",
		description: "List and download packages, including your private ones.",
	},
] as const;

type ScopeId = (typeof SCOPES)[number]["id"];

/** Active keys first, newest first within each group. */
function orderKeys(keys: ApiKey[]): ApiKey[] {
	return [...keys].sort((a, b) => {
		const aRevoked = a.revokedAtUtc ? 1 : 0;
		const bRevoked = b.revokedAtUtc ? 1 : 0;
		if (aRevoked !== bRevoked) return aRevoked - bRevoked;
		return b.createdAtUtc.localeCompare(a.createdAtUtc);
	});
}

/**
 * API keys section of the release center: the key table, the create dialog
 * (which reveals the secret exactly once) and the revoke confirmation.
 */
export function ApiKeysCenter({ api = pckgApi }: { api?: ReleaseCenterApi }) {
	const queryClient = useQueryClient();
	const keys = useQuery({
		queryKey: API_KEYS_QUERY_KEY,
		queryFn: () => api.listApiKeys(),
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
	const invalidate = () =>
		void queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });

	return (
		<ReleasePage>
			<ReleasePageHeader
				title="API keys"
				description="Credentials for the beskid CLI and CI. A key authenticates as you with only the scopes you grant; the registry stores a hash, so the secret is shown once at creation."
				actions={
					<Button onClick={() => setCreateOpen(true)}>
						<Plus data-icon="inline-start" />
						Create key
					</Button>
				}
			/>
			{keys.isPending ? (
				<ReleaseTableSkeleton label="Loading API keys" />
			) : keys.isError ? (
				<ReleaseErrorState
					title="Could not load your API keys"
					error={keys.error}
					onRetry={() => void keys.refetch()}
				/>
			) : keys.data.length === 0 ? (
				<Empty className="border border-dashed border-border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<KeyRound />
						</EmptyMedia>
						<EmptyTitle>No API keys yet</EmptyTitle>
						<EmptyDescription>
							Create a publish-scoped key to upload releases from the CLI or CI.
						</EmptyDescription>
					</EmptyHeader>
					<Button variant="outline" onClick={() => setCreateOpen(true)}>
						<Plus data-icon="inline-start" />
						Create your first key
					</Button>
				</Empty>
			) : (
				<ApiKeyTable keys={orderKeys(keys.data)} onRevoke={setRevokeTarget} />
			)}
			<CreateApiKeyDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreate={async (input) => {
					const created = await api.createApiKey(input);
					invalidate();
					return created;
				}}
			/>
			<RevokeApiKeyDialog
				target={revokeTarget}
				onClose={() => setRevokeTarget(null)}
				onRevoke={async (id) => {
					await api.revokeApiKey(id);
					invalidate();
				}}
			/>
		</ReleasePage>
	);
}

function ApiKeyTable({
	keys,
	onRevoke,
}: {
	keys: ApiKey[];
	onRevoke: (key: ApiKey) => void;
}) {
	return (
		<div className="rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Prefix</TableHead>
						<TableHead>Scopes</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{keys.map((key) => (
						<TableRow key={key.id} data-revoked={key.revokedAtUtc ? "true" : "false"}>
							<TableCell className="font-medium">{key.name}</TableCell>
							<TableCell>
								<code className="font-mono text-xs">{key.prefix}…</code>
							</TableCell>
							<TableCell>
								<ScopeBadges scopes={key.scopes} />
							</TableCell>
							<TableCell className="whitespace-nowrap text-muted-foreground">
								<time dateTime={key.createdAtUtc}>
									{formatDateTime(key.createdAtUtc)}
								</time>
							</TableCell>
							<TableCell>
								{key.revokedAtUtc ? (
									<Badge variant="secondary">
										Revoked {formatDate(key.revokedAtUtc)}
									</Badge>
								) : (
									<Badge>Active</Badge>
								)}
							</TableCell>
							<TableCell className="text-right">
								{!key.revokedAtUtc && (
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => onRevoke(key)}
										aria-label={`Revoke ${key.name}`}
									>
										Revoke
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function ScopeBadges({ scopes }: { scopes: string[] }) {
	return (
		<div className="flex flex-wrap gap-1">
			{scopes.map((scope) => (
				<Badge key={scope} variant="outline">
					{scope}
				</Badge>
			))}
		</div>
	);
}

/**
 * Two-step dialog: the form, then a one-time reveal of the secret. While the
 * secret is on screen the dialog cannot be dismissed by accident; "Done, I
 * saved it" is the only way out and it drops the secret from memory.
 */
export function CreateApiKeyDialog({
	open,
	onOpenChange,
	onCreate,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate: (input: {
		name: string;
		scopes: string[];
	}) => Promise<CreatedApiKey>;
}) {
	const [name, setName] = useState("");
	const [scopes, setScopes] = useState<Record<ScopeId, boolean>>({
		publish: true,
		read: true,
	});
	const [created, setCreated] = useState<CreatedApiKey | null>(null);
	const create = useMutation({
		mutationFn: onCreate,
		onSuccess: (result) => setCreated(result),
	});
	const selectedScopes = SCOPES.filter((scope) => scopes[scope.id]).map(
		(scope) => scope.id,
	);
	const trimmedName = name.trim();
	const canSubmit =
		trimmedName.length > 0 && selectedScopes.length > 0 && !create.isPending;

	const reset = () => {
		setName("");
		setScopes({ publish: true, read: true });
		setCreated(null);
		create.reset();
	};
	const close = () => {
		reset();
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				// The secret step only closes through "Done, I saved it".
				if (!next && created) return;
				if (!next) reset();
				onOpenChange(next);
			}}
		>
			{created ? (
				<DialogContent
					showCloseButton={false}
					onInteractOutside={(event) => event.preventDefault()}
					onEscapeKeyDown={(event) => event.preventDefault()}
					className="sm:max-w-lg"
				>
					<DialogHeader>
						<DialogTitle>Key created</DialogTitle>
						<DialogDescription>
							<span className="font-medium text-foreground">{created.key.name}</span>{" "}
							is ready to use with the scopes below.
						</DialogDescription>
					</DialogHeader>
					<Alert role="alert">
						<TriangleAlert />
						<AlertTitle>This key is shown only once</AlertTitle>
						<AlertDescription>
							Store it in a secret manager now. The registry keeps a hash, so it cannot
							show the key again; if you lose it, revoke it and create a new one.
						</AlertDescription>
					</Alert>
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">Secret</p>
						<CodeBlock className="whitespace-pre-wrap break-all select-all">
							<span data-testid="created-api-key">{created.plainTextKey}</span>
						</CodeBlock>
						<CopyButton value={created.plainTextKey} label="Copy key" />
					</div>
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">Scopes</p>
						<ScopeBadges scopes={created.key.scopes} />
					</div>
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground">Use it</p>
						<p className="text-muted-foreground">
							Save it for the CLI with{" "}
							<code className="font-mono text-xs">
								beskid pckg configure --api-key …
							</code>{" "}
							or export it as{" "}
							<code className="font-mono text-xs">BESKID_PCKG_API_KEY</code> in CI.
						</p>
					</div>
					<DialogFooter>
						<Button onClick={close}>Done, I saved it</Button>
					</DialogFooter>
				</DialogContent>
			) : (
				<DialogContent>
					<form
						className="contents"
						onSubmit={(event) => {
							event.preventDefault();
							if (!canSubmit) return;
							create.mutate({ name: trimmedName, scopes: selectedScopes });
						}}
					>
						<DialogHeader>
							<DialogTitle>Create API key</DialogTitle>
							<DialogDescription>
								Name the key after where it lives, and grant only the scopes that place
								needs.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor="api-key-name">Name</Label>
								<Input
									id="api-key-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									placeholder="CI release key"
									autoComplete="off"
									required
								/>
							</div>
							<fieldset className="space-y-3">
								<legend className="text-sm font-medium">Scopes</legend>
								{SCOPES.map((scope) => (
									<div key={scope.id} className="flex items-start gap-3">
										<Checkbox
											id={`api-key-scope-${scope.id}`}
											checked={scopes[scope.id]}
											onCheckedChange={(checked) =>
												setScopes((current) => ({
													...current,
													[scope.id]: checked === true,
												}))
											}
											className="mt-0.5"
										/>
										<div className="grid gap-0.5">
											<Label htmlFor={`api-key-scope-${scope.id}`}>{scope.label}</Label>
											<p className="text-xs text-muted-foreground">{scope.description}</p>
										</div>
									</div>
								))}
								{selectedScopes.length === 0 ? (
									<p className="text-xs text-destructive">Select at least one scope.</p>
								) : null}
							</fieldset>
							{create.isError ? (
								<p role="alert" className="text-sm text-destructive">
									Could not create the key. Check the name and scopes, then try again.
								</p>
							) : null}
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={close}>
								Cancel
							</Button>
							<Button type="submit" disabled={!canSubmit}>
								{create.isPending ? "Creating…" : "Create key"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			)}
		</Dialog>
	);
}

/** Confirmation before a key stops authenticating. */
export function RevokeApiKeyDialog({
	target,
	onClose,
	onRevoke,
}: {
	target: ApiKey | null;
	onClose: () => void;
	onRevoke: (id: string) => Promise<void>;
}) {
	const revoke = useMutation({
		mutationFn: onRevoke,
		onSuccess: () => onClose(),
	});
	return (
		<AlertDialog
			open={target !== null}
			onOpenChange={(next) => {
				if (!next) {
					revoke.reset();
					onClose();
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Revoke {target?.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						Every tool that authenticates with this key stops working immediately.
						Revocation cannot be undone; create a new key instead if you still need
						access.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{revoke.isError ? (
					<p role="alert" className="text-sm text-destructive">
						Could not revoke the key. Try again.
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={revoke.isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={revoke.isPending}
						onClick={(event) => {
							event.preventDefault();
							if (target) revoke.mutate(target.id);
						}}
					>
						{revoke.isPending ? "Revoking…" : "Revoke key"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
