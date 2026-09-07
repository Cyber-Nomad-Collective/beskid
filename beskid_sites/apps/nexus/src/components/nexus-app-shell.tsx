import {
	type ShellUser,
	TopbarAppShell,
} from "@cyber-nomad-collective/beskid-shell-core/client";
import { BeskidHub } from "@cyber-nomad-collective/beskid-ui-react";
import { Button } from "@cyber-nomad-collective/beskid-ui-react/ui/button";
import { type ReactNode, useState } from "react";
import type { AuthUser } from "../services/nexus-api";
import { ConnectMcpDialog } from "./connect-mcp-dialog";
import {
	NexusSettingsDialog,
	NexusSettingsHeaderButton,
} from "./nexus-settings-dialog";

export interface NexusAppShellProps {
	repoSelector?: ReactNode;
	search?: ReactNode;
	actions?: ReactNode;
	authUser?: AuthUser | null;
	shellUser?: ShellUser | null;
	onCatalogChanged?: () => void;
	children: ReactNode;
}

/**
 * Nexus app shell — composes the shared `AppShell` (topbar-only) with the
 * nexus services wired into the topbar slots:
 *
 *   - left slot: `Beskid / Nexus` kicker + repo selector
 *   - right slot: symbol search, settings (admin), Connect MCP, `BeskidHub`
 *
 * The bespoke 89-line header from `beskid_nexus/gitnexus-web` is replaced by
 * the shared `TopbarAppShell`/`Topbar` from `@cyber-nomad-collective/beskid-shell-core`.
 * `ThemeToggle` is rendered by `Topbar` itself.
 */
export function NexusAppShell({
	repoSelector,
	search,
	actions,
	authUser,
	shellUser,
	onCatalogChanged,
	children,
}: NexusAppShellProps) {
	const [mcpOpen, setMcpOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const mcpUrl = `${window.location.origin}/api/mcp`;

	const leftSlot = (
		<>
			<p className="nexus-kicker hidden shrink-0 sm:block">Beskid</p>
			<span className="text-muted-foreground hidden sm:inline">/</span>
			<span className="hidden truncate font-semibold md:inline">Nexus</span>
			{repoSelector ? (
				<>
					<span className="text-muted-foreground hidden md:inline">/</span>
					{repoSelector}
				</>
			) : null}
		</>
	);

	const rightSlot = (
		<>
			{search}
			{actions}
			{authUser?.isAdmin ? (
				<NexusSettingsHeaderButton
					open={settingsOpen}
					onOpenChange={setSettingsOpen}
				/>
			) : null}
			{authUser ? (
				<>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setMcpOpen(true)}
					>
						Connect MCP
					</Button>
					<ConnectMcpDialog
						open={mcpOpen}
						onOpenChange={setMcpOpen}
						mcpUrl={mcpUrl}
					/>
				</>
			) : null}
			<BeskidHub />
		</>
	);

	return (
		<TopbarAppShell user={shellUser} leftSlot={leftSlot} rightSlot={rightSlot}>
			<NexusSettingsDialog
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
				authUser={authUser ?? null}
				onCatalogChanged={onCatalogChanged}
			/>
			{children}
		</TopbarAppShell>
	);
}
