import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	return {
		queryClient: new QueryClient(),
	};
}
