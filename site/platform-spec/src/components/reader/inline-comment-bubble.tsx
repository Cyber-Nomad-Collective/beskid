"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ReviewComment } from "#/components/reader/spec-review-provider";

export interface InlineCommentBubbleProps {
	comment: ReviewComment;
	/** The DOM range the comment is anchored to (for positioning). */
	anchorRange?: Range | null;
	onUpdate: (id: string, body: string) => void;
	onRemove: (id: string) => void;
	onDismiss: () => void;
}

function positionFromRange(range: Range): { x: number; y: number } | null {
	try {
		const rect = range.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2,
			y: rect.top - 8,
		};
	} catch {
		return null;
	}
}

export function InlineCommentBubble({
	comment,
	anchorRange,
	onUpdate,
	onRemove,
	onDismiss,
}: InlineCommentBubbleProps) {
	const [draft, setDraft] = useState(comment.body);
	const [pos, setPos] = useState<{ x: number; y: number } | null>(() =>
		anchorRange ? positionFromRange(anchorRange) : null,
	);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const bubbleRef = useRef<HTMLDivElement>(null);
	const [isEditing, setIsEditing] = useState(!comment.body);

	// Auto-focus textarea when editing
	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [isEditing]);

	// Recalculate position on scroll/resize
	useEffect(() => {
		if (!anchorRange) return;
		const update = () => {
			const next = positionFromRange(anchorRange);
			if (next) setPos(next);
		};
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, [anchorRange]);

	const handleSave = useCallback(() => {
		if (draft.trim()) {
			onUpdate(comment.id, draft.trim());
			setIsEditing(false);
		}
	}, [comment.id, draft, onUpdate]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSave();
			}
			if (e.key === "Escape") {
				if (isEditing && draft !== comment.body) {
					setDraft(comment.body);
				}
				setIsEditing(false);
			}
		},
		[handleSave, isEditing, draft, comment.body],
	);

	// Clamp to viewport
	const clampedPos = pos
		? {
				left: Math.max(20, Math.min(pos.x, window.innerWidth - 340)),
				top: Math.max(8, Math.min(pos.y - 120, window.innerHeight - 220)),
			}
		: { left: "50%", top: "40%" } as const;

	return (
		<div
			ref={bubbleRef}
			className="fixed z-50 w-80 animate-fade-in rounded-xl border border-primary/30 bg-popover shadow-2xl"
			style={
				typeof clampedPos.left === "number"
					? {
							left: clampedPos.left,
							top: clampedPos.top,
							transform: "translateX(-50%)",
						}
					: {
							left: "50%",
							top: "40%",
							transform: "translate(-50%, -40%)",
						}
			}
			role="dialog"
			aria-label="Comment on selection"
		>
			{/* Quote preview */}
			<div className="border-b border-border/60 px-3 py-2">
				<blockquote className="line-clamp-2 text-xs italic text-muted-foreground">
					&ldquo;{comment.selectedText.slice(0, 200)}
					{comment.selectedText.length > 200 ? "\u2026" : ""}&rdquo;
				</blockquote>
			</div>

			{/* Edit / view body */}
			<div className="px-3 py-2">
				{isEditing ? (
					<textarea
						ref={textareaRef}
						className="min-h-20 w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Write your comment (Markdown supported)…"
					/>
				) : (
					<div
						className="min-h-[2rem] cursor-text whitespace-pre-wrap py-1 text-sm text-foreground"
						onClick={() => setIsEditing(true)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setIsEditing(true);
							}
						}}
						role="button"
						tabIndex={0}
						aria-label="Click to edit comment"
					>
						{comment.body || (
							<span className="text-muted-foreground italic">
								Add a comment…
							</span>
						)}
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="flex items-center justify-between border-t border-border/60 px-2 py-1.5">
				<div className="flex items-center gap-1">
					{isEditing ? (
						<>
							<button
								type="button"
								className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
								onClick={handleSave}
							>
								<Check size={13} />
								Save
							</button>
							<button
								type="button"
								className="rounded-md p-1 text-xs text-muted-foreground hover:bg-muted"
								onClick={() => {
									setDraft(comment.body);
									setIsEditing(false);
								}}
								aria-label="Cancel editing"
							>
								<X size={13} />
							</button>
						</>
					) : (
						<button
							type="button"
							className="flex items-center gap-1 rounded-md p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
							onClick={() => setIsEditing(true)}
							aria-label="Edit comment"
						>
							<Pencil size={13} />
							<span>Edit</span>
						</button>
					)}
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
						onClick={() => onRemove(comment.id)}
						aria-label="Delete comment"
					>
						<Trash2 size={13} />
					</button>
					<button
						type="button"
						className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						onClick={onDismiss}
						aria-label="Close bubble"
					>
						<X size={13} />
					</button>
				</div>
			</div>
		</div>
	);
}
