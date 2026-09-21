import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ReleaseCenter } from "#/components/release-center";
import { pckgApi } from "#/lib/api";

export const Route = createFileRoute("/dashboard/release")({
	component: ReleasePage,
});

function ReleasePage() {
	const queryClient = useQueryClient();
	const keys = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => pckgApi.listApiKeys(),
	});
	const createKey = useMutation({
		mutationFn: (name: string) =>
			pckgApi.createApiKey({ name, scopes: ["publish"] }),
		onSuccess: (created) => {
			window.alert(
				`Copy this key now; it will not be shown again:\n\n${created.plainTextKey}`,
			);
			void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
	});
	const revokeKey = useMutation({
		mutationFn: (id: string) => pckgApi.revokeApiKey(id),
		onSuccess: () =>
			void queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
	});
	if (keys.isPending)
		return <p className="text-muted-foreground">Loading release center…</p>;
	if (keys.isError) throw keys.error;
	return (
		<ReleaseCenter
			keys={keys.data}
			onCreateKey={(name) => createKey.mutate(name)}
			onRevokeKey={(id) => revokeKey.mutate(id)}
		/>
	);
}
