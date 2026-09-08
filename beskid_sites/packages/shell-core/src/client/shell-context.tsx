"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";

import type { ShellUiContextValue } from "../types";

/**
 * Generic shell-ui context.
 *
 * The context shape is minimal — `sidebarOpen` is the only shell-level UI
 * state owned here. Consuming apps that need per-route shell state (e.g. the
 * tracker's delivery-version sync) layer their own provider on top.
 */
const ShellUiContext = createContext<ShellUiContextValue | null>(null);

export function ShellUiProvider({ children }: { children: ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const value = useMemo(() => ({ sidebarOpen, setSidebarOpen }), [sidebarOpen]);
	return (
		<ShellUiContext.Provider value={value}>{children}</ShellUiContext.Provider>
	);
}

export function useShellUi(): ShellUiContextValue {
	const ctx = useContext(ShellUiContext);
	if (!ctx) {
		throw new Error("useShellUi must be used within ShellUiProvider");
	}
	return ctx;
}
