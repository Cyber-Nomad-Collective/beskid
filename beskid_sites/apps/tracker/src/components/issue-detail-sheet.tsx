"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { IssueSpecSuggestionsWidget } from "#/components/issue-spec-suggestions-widget";
import { RepoPathField } from "#/components/repo-path-field";
import { StepsField } from "#/components/report-fields/steps-field";
import { SpecRelationEditor } from "#/components/spec-relation-editor";
import { SpecRelationsList } from "#/components/spec-relations-list";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { Textarea } from "#/components/ui/textarea";
import type { RoadmapTask } from "#/lib/github/types";
import type { SpecRelation } from "#/lib/platform-spec/relations";
import {
	stripSubtasksFromBody,
	subtasksFromFormValue,
	subtasksToFormValue,
} from "#/lib/roadmap/subtasks";
import { updateIssue } from "#/server/issues";
import { approveSpec } from "#/server/roadmap";

const PRIORITY_LABEL = {
	high: "High",
	medium: "Medium",
	low: "Low",
} as const;

interface IssueDetailSheetProps {
	task: RoadmapTask | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	canManage?: boolean;
}

export function IssueDetailSheet({
	task,
	open,
	onOpenChange,
	canManage = false,
}: IssueDetailSheetProps) {
	const router = useRouter();
	const [body, setBody] = useState("");
	const [subtasksValue, setSubtasksValue] = useState("");
	const [specRelations, setSpecRelations] = useState<SpecRelation[]>([]);
	const [repoPaths, setRepoPaths] = useState<string[]>([]);
	const [workstream, setWorkstream] = useState<string | undefined>();

	useEffect(() => {
		if (task) {
			setBody(stripSubtasksFromBody(task.body));
			setSubtasksValue(subtasksToFormValue(task.subtasks));
			setSpecRelations(task.specRelations);
			setRepoPaths(task.repoPaths ?? []);
			setWorkstream(task.workstream);
		}
	}, [task]);

	const saveMutation = useMutation({
		mutationFn: () => {
			if (!task) throw new Error("No issue selected");
			return updateIssue({
				data: {
					versionId: task.version,
					taskId: task.id,
					body,
					specRelations,
					repoPaths,
					subtasks: subtasksFromFormValue(subtasksValue),
					workstream,
				},
			});
		},
		onSuccess: async () => {
			await router.invalidate();
		},
	});

	const approveMutation = useMutation({
		mutationFn: () => {
			if (!task) throw new Error("No issue selected");
			return approveSpec({
				data: { versionId: task.version, taskId: task.id },
			});
		},
		onSuccess: async () => {
			await router.invalidate();
		},
	});

	if (!task) return null;

	const handleQuickAddSuggestion = (next: SpecRelation) => {
		const normalizedPath = next.path.replace(/\/+$/, "");
		if (
			specRelations.some(
				(relation) => relation.path.replace(/\/+$/, "") === normalizedPath,
			)
		) {
			return;
		}
		setSpecRelations([...specRelations, next]);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="issue-sheet w-full overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						#{task.number} {task.title}
					</SheetTitle>
					<SheetDescription>
						{task.owner ? `Assigned to ${task.owner}` : "Unassigned"}
						{task.version ? ` · ${task.version}` : ""}
						{task.workstream ? ` · ${task.workstream}` : ""}
					</SheetDescription>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant={
								task.priority === "high"
									? "destructive"
									: task.priority === "medium"
										? "default"
										: "secondary"
							}
						>
							{PRIORITY_LABEL[task.priority]}
						</Badge>
						<Badge variant="outline">{task.statusColumn}</Badge>
						{task.domain ? (
							<Badge variant="secondary" className="font-normal">
								{task.domain}
							</Badge>
						) : null}
					</div>
					<SpecRelationsList
						relations={task.specRelations}
						approval={task.specApproval}
					/>
					<IssueSpecSuggestionsWidget
						versionId={task.version}
						taskId={task.id}
						relations={specRelations}
						onQuickAdd={handleQuickAddSuggestion}
					/>
					{canManage && task.specApproval === "pending" ? (
						<Button
							size="sm"
							variant="secondary"
							onClick={() => approveMutation.mutate()}
							disabled={approveMutation.isPending}
						>
							Approve spec linkage
						</Button>
					) : null}
					<div className="space-y-2">
						<Label>Priority</Label>
						<Select
							value={task.priority}
							onValueChange={(value) =>
								updateIssue({
									data: {
										versionId: task.version,
										taskId: task.id,
										priority: value as "high" | "medium" | "low",
									},
								}).then(() => router.invalidate())
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="low">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="issue-detail-body">Description</Label>
						<Textarea
							id="issue-detail-body"
							value={body}
							onChange={(event) => setBody(event.target.value)}
							rows={10}
						/>
					</div>
					<StepsField
						id="issue-detail-subtasks"
						label="Subtasks"
						value={subtasksValue}
						onChange={setSubtasksValue}
						placeholder="Describe this subtask…"
						hint="Checked items are stored as tracker-native subtasks."
						disabled={saveMutation.isPending}
						variant="checklist"
						addLabel="Add subtask"
					/>
					<SpecRelationEditor
						relations={specRelations}
						onChange={setSpecRelations}
					/>
					<RepoPathField
						paths={repoPaths}
						onChange={setRepoPaths}
						disabled={saveMutation.isPending}
					/>
				</div>
				<SheetFooter className="flex-row flex-wrap gap-2">
					<Button
						onClick={() => saveMutation.mutate()}
						disabled={saveMutation.isPending}
					>
						Save task
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
