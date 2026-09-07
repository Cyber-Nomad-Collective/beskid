"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

/**
 * Tracker-specific delivery-version context.
 *
 * This is SEPARATE from the shell-template's generic `ShellUiProvider`
 * (`#/components/shell-context`, which only owns `sidebarOpen`). The tracker
 * layers this version context on top so routes can push the active delivery
 * version id into the sidebar's `RoadmapNavTree` via `<ShellVersionsSync>`.
 *
 * The shell-template's `AppShell` wraps children in its own `ShellUiProvider`;
 * this provider nests inside it without conflict (different context objects).
 */
interface TrackerShellVersionContextValue {
	version: string | undefined;
	setVersion: (version: string | undefined) => void;
}

const TrackerShellVersionContext =
	createContext<TrackerShellVersionContextValue | null>(null);

export function TrackerShellVersionProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [version, setVersion] = useState<string | undefined>();
	const value = useMemo(() => ({ version, setVersion }), [version]);
	return (
		<TrackerShellVersionContext.Provider value={value}>
			{children}
		</TrackerShellVersionContext.Provider>
	);
}

export function useShellVersion(): TrackerShellVersionContextValue {
	const ctx = useContext(TrackerShellVersionContext);
	if (!ctx) {
		throw new Error(
			"useShellVersion must be used within TrackerShellVersionProvider",
		);
	}
	return ctx;
}

/** Push route-specific delivery version id into the app sidebar. */
export function ShellVersionsSync({ version }: { version?: string }) {
	const { setVersion } = useShellVersion();

	useEffect(() => {
		setVersion(version);
		return () => {
			setVersion(undefined);
		};
	}, [version, setVersion]);

	return null;
}
