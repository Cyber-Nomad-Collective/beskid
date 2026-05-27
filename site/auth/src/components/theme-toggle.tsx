"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@beskid/ui-react";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<Button variant="ghost" size="icon-sm" aria-label="Theme" disabled>
				<Sun className="size-4" />
			</Button>
		);
	}

	const isDark = resolvedTheme === "dark";

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
			onClick={() => setTheme(isDark ? "light" : "dark")}
		>
			{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</Button>
	);
}
