import type { ShellUser } from "@cyber-nomad-collective/beskid-shell-core/client";
import type { PipelineProgress } from "gitnexus-shared";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GraphCanvasHandle } from "./components/GraphCanvas";
import {
	GraphExplorerLayout,
	SymbolSearch,
} from "./components/graph-explorer-layout";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { NexusServiceUnavailable } from "./components/NexusServiceUnavailable";
import { NexusAppShell } from "./components/nexus-app-shell";
import { OAuthSetupWizard } from "./components/OAuthSetupWizard";
import { RepoSelector } from "./components/repo-selector";
import { ERROR_RESET_DELAY_MS } from "./config/ui-constants";
import { createKnowledgeGraph } from "./core/graph/graph";
import { AppStateProvider, useAppState } from "./hooks/useAppState";
import { useCatalogBootstrap } from "./hooks/useCatalogBootstrap";
import {
	type ConnectResult,
	connectHeartbeat,
	connectToServer,
	ensureBackendUrlFromPage,
	fetchRepos,
	normalizeServerUrl,
	probeBackend,
} from "./services/backend-client";
import {
	type AuthUser,
	fetchAuthMe,
	fetchPublicCatalog,
	fetchSetupStatus,
	githubLoginUrl,
} from "./services/nexus-api";
import {
	authUserToShellUser,
	isShellAuthMock,
	mockAuthUser,
	mockShellUser,
} from "./shell/shell-user";

type ShellPhase = "boot" | "setup" | "server-down" | "explorer";

const AppContent = () => {
	const [shellPhase, setShellPhase] = useState<ShellPhase>("boot");
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [shellUser, setShellUser] = useState<ShellUser | null>(null);
	const [serverDisconnected, setServerDisconnected] = useState(false);
	const bootstrapped = useRef(false);

	const {
		viewMode,
		progress,
		setViewMode,
		setGraph,
		setProgress,
		setProjectName,
		setCurrentRepo,
		setServerBaseUrl,
		setAvailableRepos,
	} = useAppState();

	const graphCanvasRef = useRef<GraphCanvasHandle>(null);

	const applyConnectResult = useCallback(
		async (result: ConnectResult, serverUrl: string) => {
			const repoName = result.repoInfo.name;
			const repoPath = result.repoInfo.repoPath ?? result.repoInfo.path;
			const projectName =
				repoName ||
				(repoPath || "").replace(/\\/g, "/").split("/").filter(Boolean).pop() ||
				"";

			setProjectName(projectName);
			setCurrentRepo(projectName);

			const graph = createKnowledgeGraph();
			for (const node of result.nodes) graph.addNode(node);
			for (const rel of result.relationships) graph.addRelationship(rel);
			setGraph(graph);

			setServerBaseUrl(normalizeServerUrl(serverUrl));
			setViewMode("exploring");
			setProgress(null);
			fetchRepos()
				.then(setAvailableRepos)
				.catch((err) => console.warn("Failed to fetch repo list:", err));
		},
		[
			setAvailableRepos,
			setCurrentRepo,
			setGraph,
			setProgress,
			setProjectName,
			setServerBaseUrl,
			setViewMode,
		],
	);

	const connectProject = useCallback(
		(project: string, serverUrl = window.location.origin) => {
			setViewMode("loading");
			setProgress({
				phase: "extracting",
				percent: 0,
				message: "Connecting to server…",
				detail: project,
			});

			connectToServer(
				serverUrl,
				(phase, downloaded, total) => {
					if (phase === "validating") {
						setProgress({
							phase: "extracting",
							percent: 5,
							message: "Connecting to server…",
							detail: "Validating backend",
						});
					} else if (phase === "downloading") {
						const pct = total ? Math.round((downloaded! / total) * 90) + 5 : 50;
						setProgress({
							phase: "extracting",
							percent: pct,
							message: "Loading graph…",
							detail: `${((downloaded ?? 0) / (1024 * 1024)).toFixed(1)} MB`,
						});
					}
				},
				undefined,
				project,
				{ awaitAnalysis: true },
			)
				.then((result) => applyConnectResult(result, serverUrl))
				.catch((err) => {
					console.error("Connect failed:", err);
					setProgress({
						phase: "error",
						percent: 0,
						message: "Failed to connect",
						detail: err instanceof Error ? err.message : "Unknown error",
					});
					setTimeout(() => {
						setViewMode("exploring");
						setProgress(null);
					}, ERROR_RESET_DELAY_MS);
				});
		},
		[applyConnectResult, setProgress, setViewMode],
	);

	const runBoot = useCallback(async () => {
		ensureBackendUrlFromPage();

		// Mock auth mode: bypass the backend auth flow entirely (dev without a
		// running gitnexus server). Full Authelia integration is a future task
		// — see MIGRATION-NOTES.md.
		if (isShellAuthMock()) {
			setAuthUser(mockAuthUser());
			setShellUser(mockShellUser());
			setShellPhase("explorer");
			return;
		}

		const serverUp = await probeBackend().catch(() => false);
		if (!serverUp) {
			setShellPhase("server-down");
			return;
		}

		const setup = await fetchSetupStatus().catch(() => ({
			oauthConfigured: true,
			authHubConfigured: true,
			authHubUrl: null,
			adminConfigured: true,
			oauthSource: "hub" as const,
			hasSessionSecret: false,
			hasSetupToken: false,
		}));

		if (!setup.oauthConfigured) {
			setShellPhase("setup");
			return;
		}

		const me = await fetchAuthMe().catch(() => null);
		setAuthUser(me);
		setShellUser(authUserToShellUser(me));
		setShellPhase("explorer");
	}, []);

	useEffect(() => {
		if (bootstrapped.current) return;
		bootstrapped.current = true;
		void runBoot();
	}, [runBoot]);

	const handleSelectRepo = useCallback(
		(registryName: string) => {
			connectProject(registryName);
		},
		[connectProject],
	);

	const {
		catalog,
		activeEntry,
		loading: catalogLoading,
		error: catalogError,
		selectRepo,
	} = useCatalogBootstrap({
		enabled: shellPhase === "explorer",
		onSelectRepo: (registryName) => handleSelectRepo(registryName),
	});

	const refreshCatalog = useCallback(async () => {
		if (!isShellAuthMock()) {
			const me = await fetchAuthMe().catch(() => null);
			setAuthUser(me);
			setShellUser(authUserToShellUser(me));
		}
		try {
			const entries = await fetchPublicCatalog();
			const params = new URLSearchParams(window.location.search);
			const repoParam = params.get("repo") ?? params.get("project");
			const match = entries.find(
				(entry) =>
					entry.id === repoParam ||
					entry.registryName === repoParam ||
					entry.id === activeEntry?.id,
			);
			if (match?.indexed) {
				selectRepo(match);
			}
		} catch (err) {
			console.warn("Failed to refresh catalog:", err);
		}
	}, [activeEntry?.id, selectRepo]);

	useEffect(() => {
		if (viewMode !== "exploring") return;
		return connectHeartbeat(
			() => setServerDisconnected(false),
			() => setServerDisconnected(true),
		);
	}, [viewMode]);

	const handleFocusNode = useCallback((nodeId: string) => {
		graphCanvasRef.current?.focusNode(nodeId);
	}, []);

	const indexedEntries = catalog.filter((entry) => entry.indexed);
	const showEmptyCatalog =
		shellPhase === "explorer" && !catalogLoading && indexedEntries.length === 0;

	const repoSelector = (
		<RepoSelector
			entries={catalog}
			activeEntryId={activeEntry?.id}
			onSelect={selectRepo}
			disabled={catalogLoading || (viewMode === "loading" && !!progress)}
		/>
	);

	if (shellPhase === "boot") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<LoadingOverlay
					progress={
						{
							phase: "extracting",
							percent: 0,
							message: "Starting Beskid Nexus…",
						} as PipelineProgress
					}
				/>
			</div>
		);
	}

	if (shellPhase === "setup") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<OAuthSetupWizard
					onComplete={() => {
						bootstrapped.current = false;
						void runBoot();
					}}
				/>
			</div>
		);
	}

	if (shellPhase === "server-down") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<NexusServiceUnavailable
					onRecovered={() => {
						bootstrapped.current = false;
						void runBoot();
					}}
				/>
			</div>
		);
	}

	if (viewMode === "loading" && progress) {
		return (
			<NexusAppShell
				authUser={authUser}
				shellUser={shellUser}
				repoSelector={repoSelector}
				search={<SymbolSearch onFocusNode={handleFocusNode} />}
				onCatalogChanged={() => void refreshCatalog()}
			>
				<LoadingOverlay progress={progress} />
			</NexusAppShell>
		);
	}

	return (
		<NexusAppShell
			authUser={authUser}
			shellUser={shellUser}
			repoSelector={repoSelector}
			search={<SymbolSearch onFocusNode={handleFocusNode} />}
			onCatalogChanged={() => void refreshCatalog()}
		>
			{catalogLoading ? (
				<div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
					Loading catalog…
				</div>
			) : showEmptyCatalog ? (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
					<h1 className="text-2xl font-semibold">No indexed repositories yet</h1>
					<p className="max-w-md text-muted-foreground">
						Beskid Nexus publishes knowledge graphs for registered repositories. When
						indexing completes, the first repo opens here automatically.
					</p>
					{catalogError ? (
						<p className="text-sm text-destructive">{catalogError}</p>
					) : null}
					{!authUser ? (
						<a
							href={githubLoginUrl()}
							className="inline-flex h-9 items-center rounded-4xl bg-primary px-4 text-sm font-medium text-primary-foreground"
						>
							Sign in with GitHub
						</a>
					) : authUser.isAdmin ? (
						<p className="text-sm text-muted-foreground">
							Open settings to add and index a repository.
						</p>
					) : (
						<p className="text-sm text-muted-foreground">
							Ask a Nexus administrator to register and index a repository.
						</p>
					)}
				</div>
			) : (
				<GraphExplorerLayout
					graphCanvasRef={graphCanvasRef}
					onFocusNode={handleFocusNode}
					serverDisconnected={serverDisconnected}
				/>
			)}
		</NexusAppShell>
	);
};

export default function App() {
	return (
		<AppStateProvider>
			<AppContent />
		</AppStateProvider>
	);
}
