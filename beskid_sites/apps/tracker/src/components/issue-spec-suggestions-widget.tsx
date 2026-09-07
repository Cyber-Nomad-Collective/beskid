"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { SpecRelation } from "#/lib/platform-spec/relations";
import { suggestPlatformSpecNavForIssue } from "#/server/platform-spec";

interface IssueSpecSuggestionsWidgetProps {
	versionId: string;
	taskId: string;
	relations: SpecRelation[];
	onQuickAdd: (next: SpecRelation) => void;
}

export function IssueSpecSuggestionsWidget({
	versionId,
	taskId,
	relations,
	onQuickAdd,
}: IssueSpecSuggestionsWidgetProps) {
	const { data: suggestions = [], isLoading } = useQuery({
		queryKey: ["platform-spec-suggestions", versionId, taskId],
		queryFn: () =>
			suggestPlatformSpecNavForIssue({
				data: { versionId, taskId, limit: 6 },
			}),
		staleTime: 60_000,
	});

	const hasRelation = (href: string) => {
		const normalized = href.replace(/\/+$/, "");
		return relations.some(
			(relation) => relation.path.replace(/\/+$/, "") === normalized,
		);
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm">Suggested platform spec nodes</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				{isLoading ? (
					<p className="text-muted-foreground text-xs">Scoring suggestions…</p>
				) : null}
				{!isLoading && suggestions.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						No suggestions yet. Add nodes manually below.
					</p>
				) : null}
				{suggestions.map((suggestion) => {
					const linked = suggestion.alreadyLinked || hasRelation(suggestion.href);
					return (
						<div
							key={suggestion.href}
							className="border-border flex items-center justify-between gap-2 rounded-md border p-2"
						>
							<div className="min-w-0">
								<p className="truncate font-medium">{suggestion.title}</p>
								<p className="text-muted-foreground truncate font-mono text-xs">
									{suggestion.href}
								</p>
								<div className="mt-1 flex flex-wrap items-center gap-1">
									<Badge variant="outline" className="capitalize">
										{suggestion.level}
									</Badge>
									{suggestion.matchedTerms.slice(0, 3).map((term) => (
										<Badge key={`${suggestion.href}-${term}`} variant="secondary">
											{term}
										</Badge>
									))}
								</div>
							</div>
							<Button
								type="button"
								size="sm"
								variant={linked ? "secondary" : "outline"}
								disabled={linked}
								onClick={() =>
									onQuickAdd({
										standardId: suggestion.standardId,
										path: suggestion.href.replace(/\/+$/, ""),
										href: suggestion.href,
										title: suggestion.title,
										level: suggestion.level,
										relation: "tracks",
										required: false,
									})
								}
							>
								{linked ? "Added" : "Quick add"}
							</Button>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
