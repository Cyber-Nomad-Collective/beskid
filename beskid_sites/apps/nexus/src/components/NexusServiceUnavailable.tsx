import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "@/lib/lucide-icons";
import { probeBackend } from "../services/backend-client";

interface NexusServiceUnavailableProps {
	onRecovered: () => void;
}

export function NexusServiceUnavailable({
	onRecovered,
}: NexusServiceUnavailableProps) {
	const [retrying, setRetrying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleRetry = async () => {
		setRetrying(true);
		setError(null);
		try {
			const ok = await probeBackend();
			if (ok) {
				onRecovered();
			} else {
				setError("The Nexus API is not responding yet. Try again in a moment.");
			}
		} catch {
			setError("Could not reach the Nexus API.");
		} finally {
			setRetrying(false);
		}
	};

	return (
		<div className="relative mx-auto max-w-md animate-fade-in overflow-hidden rounded-3xl border border-border bg-card p-7 text-center">
			<div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
			<div className="relative">
				<Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
				<h1 className="text-lg font-semibold text-foreground">
					Nexus is starting up
				</h1>
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
					This site is a hosted Beskid Nexus instance. The API on this domain is not
					reachable right now — it may still be deploying or misconfigured.
				</p>
				{error && <p className="mt-3 text-sm text-red-400">{error}</p>}
				<button
					type="button"
					disabled={retrying}
					onClick={() => void handleRetry()}
					className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
				>
					{retrying ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<RefreshCw className="h-4 w-4" />
					)}
					Retry connection
				</button>
			</div>
		</div>
	);
}
