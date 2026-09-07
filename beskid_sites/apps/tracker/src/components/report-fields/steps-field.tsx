"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef } from "react";

import { ReportFieldChrome } from "#/components/report-fields/report-field-chrome";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	parseStepsValue,
	parseSubtasksValue,
	type StepRow,
	type SubtaskRow,
	serializeStepsValue,
	serializeSubtasksValue,
} from "#/lib/report-issue/field-values";
import { cn } from "#/lib/utils";

interface StepsFieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	hint?: string;
	disabled?: boolean;
	/** Numbered repro steps for bugs or tracker-native roadmap subtasks. */
	variant?: "numbered" | "checklist";
	addLabel?: string;
}

export function StepsField({
	id,
	label,
	value,
	onChange,
	placeholder = "Describe this step…",
	hint,
	disabled,
	variant = "numbered",
	addLabel,
}: StepsFieldProps) {
	const isChecklist = variant === "checklist";
	const rows = isChecklist ? parseSubtasksValue(value) : parseStepsValue(value);
	const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const commit = useCallback(
		(next: StepRow[] | SubtaskRow[]) => {
			onChange(
				isChecklist
					? serializeSubtasksValue(next as SubtaskRow[])
					: serializeStepsValue(next as StepRow[]),
			);
		},
		[isChecklist, onChange],
	);

	const newRow = (): StepRow | SubtaskRow =>
		isChecklist
			? { id: crypto.randomUUID(), text: "", done: false }
			: { id: crypto.randomUUID(), text: "" };

	const focusRow = (rowId: string) => {
		requestAnimationFrame(() => {
			inputRefs.current.get(rowId)?.focus();
		});
	};

	const updateRow = (rowId: string, text: string) => {
		commit(rows.map((row) => (row.id === rowId ? { ...row, text } : row)));
	};

	const addRowAfter = (index: number) => {
		const nextRow = newRow();
		const next = [...rows];
		next.splice(index + 1, 0, nextRow);
		commit(next);
		focusRow(nextRow.id);
	};

	const removeRow = (rowId: string) => {
		const next = rows.filter((row) => row.id !== rowId);
		commit(next.length > 0 ? next : [newRow()]);
	};

	const toggleDone = (rowId: string, done: boolean) => {
		if (!isChecklist) return;
		commit(
			rows.map((row) =>
				row.id === rowId ? { ...row, done } : row,
			) as SubtaskRow[],
		);
	};

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = rows.findIndex((row) => row.id === active.id);
		const newIndex = rows.findIndex((row) => row.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		commit(arrayMove(rows, oldIndex, newIndex));
	};

	return (
		<ReportFieldChrome
			id={id}
			label={label}
			hint={hint}
			className={isChecklist ? "work-item-subtasks" : "work-item-steps"}
		>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={onDragEnd}
			>
				<SortableContext
					items={rows.map((row) => row.id)}
					strategy={verticalListSortingStrategy}
				>
					<ul className="space-y-2">
						{rows.map((row, index) => (
							<SortableStepRow
								key={row.id}
								row={row}
								index={index}
								variant={variant}
								placeholder={placeholder}
								disabled={disabled}
								canRemove={rows.length > 1}
								setInputRef={(el) => {
									if (el) inputRefs.current.set(row.id, el);
									else inputRefs.current.delete(row.id);
								}}
								onTextChange={(text) => updateRow(row.id, text)}
								onToggleDone={(done) => toggleDone(row.id, done)}
								onEnter={() => addRowAfter(index)}
								onBackspaceEmpty={() => {
									if (row.text.trim() === "" && rows.length > 1) {
										removeRow(row.id);
										const prev = rows[index - 1];
										if (prev) focusRow(prev.id);
									}
								}}
								onRemove={() => removeRow(row.id)}
							/>
						))}
					</ul>
				</SortableContext>
			</DndContext>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="mt-2 h-8"
				disabled={disabled}
				onClick={() => addRowAfter(rows.length - 1)}
			>
				<Plus className="size-3.5" />
				{addLabel ?? (isChecklist ? "Add subtask" : "Add step")}
			</Button>
		</ReportFieldChrome>
	);
}

function SortableStepRow({
	row,
	index,
	variant = "numbered",
	placeholder,
	disabled,
	canRemove,
	setInputRef,
	onTextChange,
	onToggleDone,
	onEnter,
	onBackspaceEmpty,
	onRemove,
}: {
	row: StepRow | SubtaskRow;
	index: number;
	variant?: "numbered" | "checklist";
	placeholder: string;
	disabled?: boolean;
	canRemove: boolean;
	setInputRef: (el: HTMLInputElement | null) => void;
	onTextChange: (text: string) => void;
	onToggleDone?: (done: boolean) => void;
	onEnter: () => void;
	onBackspaceEmpty: () => void;
	onRemove: () => void;
}) {
	const isChecklist = variant === "checklist";
	const done = isChecklist && "done" in row ? row.done : false;
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: row.id, disabled });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<li
			ref={setNodeRef}
			style={style}
			className={cn(
				"bg-muted/20 flex items-start gap-2 rounded-lg border border-border/60 p-2",
				isDragging && "z-10 opacity-60 shadow-md",
			)}
		>
			<button
				type="button"
				ref={setActivatorNodeRef}
				className="text-muted-foreground mt-2 flex shrink-0 cursor-grab touch-none items-center gap-1 active:cursor-grabbing"
				disabled={disabled}
				aria-label={
					isChecklist ? `Drag subtask ${index + 1}` : `Drag step ${index + 1}`
				}
				{...attributes}
				{...listeners}
			>
				<GripVertical className="size-3.5" />
				{isChecklist ? (
					<input
						type="checkbox"
						checked={done}
						onChange={(e) => onToggleDone?.(e.target.checked)}
						disabled={disabled}
						className="border-input size-4 rounded border accent-[var(--primary)]"
						aria-label={`Mark subtask ${index + 1} done`}
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-semibold">
						{index + 1}
					</span>
				)}
			</button>
			<Input
				ref={setInputRef}
				value={row.text}
				onChange={(e) => onTextChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						onEnter();
					}
					if (e.key === "Backspace" && row.text === "") {
						e.preventDefault();
						onBackspaceEmpty();
					}
				}}
				placeholder={placeholder}
				disabled={disabled}
				className="border-0 bg-transparent shadow-none focus-visible:ring-0"
				aria-label={`Step ${index + 1}`}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="text-muted-foreground hover:text-destructive mt-0.5 shrink-0"
				disabled={disabled || !canRemove}
				aria-label={`Remove step ${index + 1}`}
				onClick={onRemove}
			>
				<Trash2 className="size-4" />
			</Button>
		</li>
	);
}
