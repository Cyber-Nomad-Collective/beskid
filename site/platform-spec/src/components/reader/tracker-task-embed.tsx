import { useEffect, useState } from "react";

interface TrackerTask {
	id?: string;
	title?: string;
	status?: string;
}

interface TrackerTaskEmbedProps {
	standardId: string;
	catalogRevision: string;
}

export function TrackerTaskEmbed({
	standardId,
	catalogRevision,
}: TrackerTaskEmbedProps) {
	const [tasks, setTasks] = useState<TrackerTask[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		const query = new URLSearchParams({ standardId, catalogRevision });
		setError(null);
		fetch(`/api/v1/tracker/tasks?${query}`, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error("Tracker tasks are unavailable");
				return response.json() as Promise<TrackerTask[]>;
			})
			.then(setTasks)
			.catch((reason: unknown) => {
				if (reason instanceof Error && reason.name === "AbortError") return;
				setError(
					reason instanceof Error ? reason.message : "Tracker tasks are unavailable",
				);
			});

		return () => controller.abort();
	}, [catalogRevision, standardId]);

	return (
		<aside
			className="mt-6 rounded-lg border border-border p-4"
			data-standard-id={standardId}
		>
			<h2 className="text-sm font-semibold">Tracker tasks</h2>
			{error ? (
				<p className="mt-2 text-sm text-muted-foreground">{error}</p>
			) : null}
			{tasks.length ? (
				<ul className="mt-2 space-y-1 text-sm">
					{tasks.map((task) => (
						<li key={task.id ?? task.title}>
							{task.title ?? task.id} {task.status ? `(${task.status})` : ""}
						</li>
					))}
				</ul>
			) : !error ? (
				<p className="mt-2 text-sm text-muted-foreground">No linked tasks.</p>
			) : null}
		</aside>
	);
}
