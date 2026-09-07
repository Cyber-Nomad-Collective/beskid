import { Input } from "@cyber-nomad-collective/beskid-ui-react";
import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * Global package searchbar for the pckg topbar. Submits to `/packages?q=…`
 * via TanStack Router search navigation. Mirrors the original `pckg/web`
 * single-box `q` search (no filters/sort/pagination — the backend has none).
 */
export function GlobalSearch() {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { q?: string };
	const q = typeof search?.q === "string" ? search.q : "";

	return (
		<form
			className="w-full max-w-sm"
			onSubmit={(event) => {
				event.preventDefault();
				const form = new FormData(event.currentTarget);
				const value = String(form.get("q") ?? "").trim();
				void navigate({ to: "/packages", search: { q: value } });
			}}
		>
			<Input
				name="q"
				defaultValue={q}
				placeholder="Search packages"
				aria-label="Search packages"
			/>
		</form>
	);
}
