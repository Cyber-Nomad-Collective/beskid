"use client";

import {
	BeskidHub,
	Separator,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@beskid/ui-react";

import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { HighlightToolbar } from "#/components/reader/highlight-toolbar";
import { ReaderTopBarActions } from "#/components/reader/reader-topbar-actions";
import { ReviewBanner } from "#/components/reader/review-banner";
import { ReviewSubmissionDialog } from "#/components/reader/review-submission-dialog";
import { SpecNavRailContent } from "#/components/reader/spec-nav-rail";
import {
	nextCommentId,
	SpecReviewProvider,
	useSpecReview,
} from "#/components/reader/spec-review-provider";
import { SpecViewModeProvider } from "#/components/reader/spec-view-mode";
import type { OpenSpecNavNode as NavTreeNode } from "#/server/openspec/reader";

interface ReaderChromeProps {
	navTree: NavTreeNode;
	activeSlug?: string;
	children: ReactNode;
}

export function ReaderChrome({
	navTree,
	activeSlug,
	children,
}: ReaderChromeProps) {
	return (
		<SpecViewModeProvider>
			<SpecReviewProvider>
				<SidebarProvider defaultOpen>
					<ReaderSidebar navTree={navTree} activeSlug={activeSlug} />
					<ReaderInset navTree={navTree} activeSlug={activeSlug}>
						{children}
					</ReaderInset>
				</SidebarProvider>
			</SpecReviewProvider>
		</SpecViewModeProvider>
	);
}

function ReaderSidebar({
	navTree,
	activeSlug,
}: {
	navTree: NavTreeNode;
	activeSlug?: string;
}) {
	return (
		<Sidebar collapsible="offcanvas" variant="sidebar">
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="flex items-center px-2 pt-4 pb-1">
					<SidebarMenu className="min-w-0 flex-1">
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild className="mb-1">
								<Link to="/platform-spec/$" params={{ _splat: "" }}>
									<img
										src="/favicon.svg"
										alt=""
										width={28}
										height={28}
										className="size-7 shrink-0 rounded-md"
									/>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">Beskid</span>
										<span className="truncate text-xs text-sidebar-foreground/70">
											Platform Spec
										</span>
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SpecNavRailContent tree={navTree} activeSlug={activeSlug} />
			</SidebarContent>
			<SidebarFooter className="border-t border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip="Sign in">
							<Link to="/settings/auth/login">Login</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

function ReaderInset({
	navTree,
	activeSlug,
	children,
}: {
	navTree: NavTreeNode;
	activeSlug?: string;
	children: ReactNode;
}) {
	const {
		reviewMode,
		pendingReview,
		startReview,
		cancelReview,
		setDecision,
		setBody,
		addComment,
		removeComment,
	} = useSpecReview();
	const [dialogOpen, setDialogOpen] = useState(false);
	const pageSlug = activeSlug ?? "";

	return (
		<SidebarInset>
			<header className="flex h-12 shrink-0 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-6" />
				<BeskidHub />
				<Link
					to="/platform-spec/$"
					params={{ _splat: "" }}
					className="text-sm font-semibold tracking-tight hover:underline"
				>
					Platform specification
				</Link>
				<div className="ml-auto">
					<ReaderTopBarActions
						onStartReview={startReview}
						isReviewing={reviewMode}
					/>
				</div>
			</header>

			<ReviewBanner
				reviewMode={reviewMode}
				commentCount={pendingReview?.comments.length ?? 0}
				pageSlug={pageSlug}
				onCancel={cancelReview}
				onOpenDialog={() => setDialogOpen(true)}
				comments={pendingReview?.comments ?? []}
				onRemoveComment={removeComment}
			/>

			<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

			<HighlightToolbar
				navTree={navTree}
				reviewMode={reviewMode}
				onQuote={(text) => {
					addComment({
						id: nextCommentId(),
						selectedText: text,
						body: "",
						pageSlug,
						createdAt: Date.now(),
					});
				}}
				onComment={(text) => {
					addComment({
						id: nextCommentId(),
						selectedText: text,
						body: "",
						pageSlug,
						createdAt: Date.now(),
					});
				}}
			/>

			<ReviewSubmissionDialog
				open={dialogOpen}
				navTree={navTree}
				decision={pendingReview?.decision ?? "commented"}
				body={pendingReview?.body ?? ""}
				comments={pendingReview?.comments ?? []}
				onDecisionChange={setDecision}
				onBodyChange={setBody}
				onSubmit={() => {
					setDialogOpen(false);
					cancelReview();
				}}
				onCancel={() => setDialogOpen(false)}
			/>
		</SidebarInset>
	);
}
