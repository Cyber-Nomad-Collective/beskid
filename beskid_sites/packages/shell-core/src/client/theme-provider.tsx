"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

import type { ThemeProviderProps } from "../types";

/**
 * Uses `data-theme` like beskid-lang.org (not class-based `.dark` alone).
 * Apps that want a non-system default (e.g. the nexus SPA) pass
 * `defaultTheme="dark"`.
 */
export function ThemeProvider({
	children,
	defaultTheme = "system",
}: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="data-theme"
			defaultTheme={defaultTheme}
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</NextThemesProvider>
	);
}
