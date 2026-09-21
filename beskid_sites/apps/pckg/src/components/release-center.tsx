import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
} from "@cyber-nomad-collective/beskid-ui-react";
import { useState } from "react";
import type { ApiKey } from "#/lib/pckg-api";

export function ReleaseCenter({
	keys,
	onCreateKey,
	onRevokeKey,
}: {
	keys: ApiKey[];
	onCreateKey: (name: string) => void;
	onRevokeKey: (id: string) => void;
}) {
	const [name, setName] = useState("");
	return (
		<section className="mx-auto max-w-4xl space-y-6 px-5 py-10">
			<header>
				<h1 className="text-3xl font-bold">Release center</h1>
				<p className="mt-2 text-muted-foreground">
					Publish through the canonical CLI. The browser manages keys and gives you a
					copyable recipe; it never uploads raw artifacts.
				</p>
			</header>
			<Card>
				<CardHeader>
					<CardTitle>Publish a release</CardTitle>
					<CardDescription>
						Build and verify your package, then run this from the project directory.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 text-sm">
						<code>beskid pckg publish --registry https://pckg.beskid-lang.org</code>
					</pre>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>API keys</CardTitle>
					<CardDescription>
						Keys are shown once when created. Revoke unused keys promptly.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<form
						className="flex gap-2"
						onSubmit={(event) => {
							event.preventDefault();
							const trimmed = name.trim();
							if (trimmed) {
								onCreateKey(trimmed);
								setName("");
							}
						}}
					>
						<Input
							aria-label="Key name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="CI release key"
						/>
						<Button type="submit">Create key</Button>
					</form>
					{keys.length === 0 ? (
						<p className="text-sm text-muted-foreground">No API keys yet.</p>
					) : (
						keys.map((key) => (
							<div
								key={key.id}
								className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
							>
								<span>
									<strong>{key.name}</strong> · {key.prefix} · {key.scopes.join(", ")}
								</span>
								{!key.revokedAtUtc && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => onRevokeKey(key.id)}
									>
										Revoke
									</Button>
								)}
							</div>
						))
					)}
				</CardContent>
			</Card>
		</section>
	);
}
