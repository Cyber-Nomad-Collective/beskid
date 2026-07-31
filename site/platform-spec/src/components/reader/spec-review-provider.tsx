"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

export type ReviewDecision = "approved" | "changes-requested" | "commented";

export interface ReviewComment {
	id: string;
	selectedText: string;
	body: string;
	pageSlug: string;
	createdAt: number;
}

export interface PendingReview {
	decision: ReviewDecision;
	body: string;
	comments: ReviewComment[];
}

interface SpecReviewContextValue {
	reviewMode: boolean;
	setReviewMode: (value: boolean) => void;
	pendingReview: PendingReview | null;
	startReview: () => void;
	cancelReview: () => void;
	setDecision: (decision: ReviewDecision) => void;
	setBody: (body: string) => void;
	addComment: (comment: ReviewComment) => void;
	updateComment: (id: string, body: string) => void;
	removeComment: (id: string) => void;
	editingCommentId: string | null;
	setEditingCommentId: (id: string | null) => void;
}

const SpecReviewContext = createContext<SpecReviewContextValue | null>(null);

let commentCounter = 0;

export function nextCommentId(): string {
	commentCounter += 1;
	return `review-comment-${commentCounter}`;
}

export function SpecReviewProvider({ children }: { children: ReactNode }) {
	const [reviewMode, setReviewMode] = useState(false);
	const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);

	const startReview = useCallback(() => {
		setReviewMode(true);
		setPendingReview({ decision: "commented", body: "", comments: [] });
	}, []);

	const cancelReview = useCallback(() => {
		setReviewMode(false);
		setPendingReview(null);
	}, []);

	const setDecision = useCallback((decision: ReviewDecision) => {
		setPendingReview((prev) => (prev ? { ...prev, decision } : null));
	}, []);

	const setBody = useCallback((body: string) => {
		setPendingReview((prev) => (prev ? { ...prev, body } : null));
	}, []);

	const addComment = useCallback((comment: ReviewComment) => {
		setPendingReview((prev) =>
			prev ? { ...prev, comments: [...prev.comments, comment] } : null,
		);
	}, []);

	const updateComment = useCallback((id: string, body: string) => {
		setPendingReview((prev) =>
			prev
				? {
						...prev,
						comments: prev.comments.map((c) =>
							c.id === id ? { ...c, body } : c,
						),
					}
				: null,
		);
	}, []);

	const removeComment = useCallback((id: string) => {
		setPendingReview((prev) =>
			prev
				? { ...prev, comments: prev.comments.filter((c) => c.id !== id) }
				: null,
		);
	}, []);

	const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

	return (
		<SpecReviewContext.Provider
			value={{
				reviewMode,
				setReviewMode,
				pendingReview,
				startReview,
				cancelReview,
				setDecision,
				setBody,
				addComment,
				updateComment,
				removeComment,
				editingCommentId,
				setEditingCommentId,
			}}
		>
			{children}
		</SpecReviewContext.Provider>
	);
}

export function useSpecReview(): SpecReviewContextValue {
	const value = useContext(SpecReviewContext);
	if (!value) {
		throw new Error("useSpecReview must be used within SpecReviewProvider");
	}
	return value;
}
