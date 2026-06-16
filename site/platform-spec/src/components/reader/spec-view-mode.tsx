"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SpecViewMode = "browse" | "map";

interface SpecViewModeContextValue {
	mode: SpecViewMode;
	setMode: (mode: SpecViewMode) => void;
}

const SpecViewModeContext = createContext<SpecViewModeContextValue | null>(null);

export function SpecViewModeProvider({ children }: { children: ReactNode }) {
	const [mode, setMode] = useState<SpecViewMode>("browse");
	return (
		<SpecViewModeContext.Provider value={{ mode, setMode }}>
			{children}
		</SpecViewModeContext.Provider>
	);
}

export function useSpecViewMode(): SpecViewModeContextValue {
	const value = useContext(SpecViewModeContext);
	if (!value) {
		throw new Error("useSpecViewMode must be used within SpecViewModeProvider");
	}
	return value;
}
