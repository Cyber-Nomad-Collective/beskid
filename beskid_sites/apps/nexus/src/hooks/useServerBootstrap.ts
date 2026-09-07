import type { PipelineProgress } from "gitnexus-shared";
import { useCallback, useEffect, useRef } from "react";
import { BESKID_NEXUS } from "../config/beskid-nexus";
import { ERROR_RESET_DELAY_MS } from "../config/ui-constants";
import { createKnowledgeGraph } from "../core/graph/graph";
import {
	type ConnectResult,
	connectToServer,
	fetchRepos,
	normalizeServerUrl,
} from "../services/backend-client";

import { useAppState } from "./useAppState";

function connectProgress(
	setProgress: (progress: PipelineProgress | null) => void,
	phase: string,
	downloaded?: number,
	total?: number,
) {
	if (phase === "validating") {
		setProgress({
			phase: "extracting",
			percent: 5,
			message: "Connecting to server…",
			detail: "Validating backend",
		});
		return;
	}
	if (phase === "downloading") {
		const pct = total ? Math.round((downloaded! / total) * 90) + 5 : 50;
		const mb = ((downloaded ?? 0) / (1024 * 1024)).toFixed(1);
		setProgress({
			phase: "extracting",
			percent: pct,
			message: "Loading compiler graph…",
			detail: `${mb} MB downloaded`,
		});
		return;
	}
	if (phase === "extracting") {
		setProgress({
			phase: "extracting",
			percent: 97,
			message: "Processing…",
			detail: "Preparing visualization",
		});
	}
}

/** Auto-connect to the baked compiler index on same-origin `/api`. */
export function useServerBootstrap() {
	const {
		setViewMode,
		setGraph,
		setProgress,
		setProjectName,
		setCurrentRepo,
		setServerBaseUrl,
		setAvailableRepos,
	} = useAppState();

	const bootstrapped = useRef(false);

	const applyConnectResult = useCallback(
		async (result: ConnectResult) => {
			const repoName = result.repoInfo.name;
			const repoPath = result.repoInfo.repoPath ?? result.repoInfo.path;
			const projectName =
				repoName ||
				(repoPath || "").replace(/\\/g, "/").split("/").filter(Boolean).pop() ||
				BESKID_NEXUS.defaultRepo;

			setProjectName(projectName);
			setCurrentRepo(projectName);

			const graph = createKnowledgeGraph();
			for (const node of result.nodes) graph.addNode(node);
			for (const rel of result.relationships) graph.addRelationship(rel);
			setGraph(graph);

			const url = new URL(window.location.href);
			url.searchParams.set("project", projectName);
			window.history.replaceState(null, "", url.toString());
			setViewMode("exploring");
		},
		[setCurrentRepo, setGraph, setProjectName, setViewMode],
	);

	useEffect(() => {
		if (bootstrapped.current) return;
		bootstrapped.current = true;

		const params = new URLSearchParams(window.location.search);
		const project = params.get("project") || BESKID_NEXUS.defaultRepo;
		const serverUrl = params.get("server") || window.location.origin;

		setProgress({
			phase: "extracting",
			percent: 0,
			message: "Connecting to server…",
			detail: "Compiler knowledge graph",
		});
		setViewMode("loading");

		connectToServer(
			serverUrl,
			(phase, downloaded, total) =>
				connectProgress(
					setProgress,
					phase,
					downloaded ?? undefined,
					total ?? undefined,
				),
			undefined,
			project,
			{ awaitAnalysis: true },
		)
			.then(async (result) => {
				await applyConnectResult(result);
				setProgress(null);
				setServerBaseUrl(normalizeServerUrl(serverUrl));
				fetchRepos()
					.then(setAvailableRepos)
					.catch((err) => console.warn("Failed to fetch repo list:", err));
			})
			.catch((err) => {
				console.error("Server bootstrap failed:", err);
				setProgress({
					phase: "error",
					percent: 0,
					message: "Failed to connect",
					detail: err instanceof Error ? err.message : "Unknown error",
				});
				setTimeout(() => {
					setViewMode("loading");
					setProgress(null);
					bootstrapped.current = false;
				}, ERROR_RESET_DELAY_MS);
			});
	}, [
		applyConnectResult,
		setAvailableRepos,
		setProgress,
		setServerBaseUrl,
		setViewMode,
	]);

	return { applyConnectResult };
}
