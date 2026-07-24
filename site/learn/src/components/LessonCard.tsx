import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@beskid/ui-react";
import { clsx } from "clsx";
import { BookOpen, Check, ChevronDown, HelpCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LearnExercise } from "#/data/learningCatalog";

type LessonCardProps = {
	lesson: LearnExercise;
	isActive: boolean;
	isCompleted: boolean;
	onSelect: () => void;
};

const difficultyVariant: Record<LearnExercise["difficulty"], string> = {
	beginner:
		"bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
	intermediate:
		"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const categoryLabel: Record<string, string> = {
	basics: "Basics",
	functions: "Functions",
	"control-flow": "Control Flow",
	parsing: "Parsing",
	runtime: "Runtime",
};

export default function LessonCard({
	lesson,
	isActive,
	isCompleted,
	onSelect,
}: LessonCardProps) {
	const [expanded, setExpanded] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);

	useEffect(() => {
		if (contentRef.current) {
			setContentHeight(contentRef.current.scrollHeight);
		}
	}, [lesson]);

	useEffect(() => {
		if (!isActive) setExpanded(false);
	}, [isActive]);

	const toggleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded((prev) => !prev);
	};

	return (
		<Card
			className={clsx(
				"cursor-pointer transition-all duration-300 border-2",
				isActive
					? "border-primary shadow-lg shadow-primary/20 -translate-y-1"
					: "border-transparent hover:border-muted-foreground/20 hover:shadow-md",
				isCompleted && !isActive && "opacity-80",
			)}
			onClick={onSelect}
		>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-lg flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-primary shrink-0" />
							<span className="truncate">{lesson.title}</span>
						</CardTitle>
						<CardDescription className="mt-1 line-clamp-2">
							{lesson.objective}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{isCompleted ? (
							<Check className="w-5 h-5 text-emerald-500" aria-label="Completed" />
						) : isActive ? (
							<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
						) : (
							<X
								className="w-5 h-5 text-muted-foreground/40"
								aria-label="Not completed"
							/>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="pb-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge
						variant="secondary"
						className={difficultyVariant[lesson.difficulty]}
					>
						{lesson.difficulty}
					</Badge>
					<Badge variant="outline" className="text-xs">
						{categoryLabel[lesson.category] ?? lesson.category}
					</Badge>
					<span className="text-xs text-muted-foreground ml-auto">
						<HelpCircle className="w-3 h-3 inline-block mr-1" />
						{lesson.questions.length} question
						{lesson.questions.length !== 1 ? "s" : ""}
					</span>
				</div>
			</CardContent>

			<div
				ref={contentRef}
				className={clsx(
					"overflow-hidden transition-all duration-300 ease-in-out",
					expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
				)}
				style={{
					maxHeight: expanded ? `${contentHeight}px` : "0px",
				}}
				aria-hidden={!expanded}
			>
				<CardContent className="pt-0 pb-3 border-t border-border mx-6">
					{lesson.prerequisites.length > 0 && (
						<div className="mt-2 mb-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
								Prerequisites
							</span>
							<div className="flex flex-wrap gap-1 mt-1">
								{lesson.prerequisites.map((prereq) => (
									<Badge key={prereq} variant="secondary" className="text-xs font-mono">
										{prereq}
									</Badge>
								))}
							</div>
						</div>
					)}
					<div className="mt-2 text-sm text-muted-foreground leading-relaxed">
						{lesson.detailedContent.length > 250
							? `${lesson.detailedContent.slice(0, 250)}...`
							: lesson.detailedContent}
					</div>
				</CardContent>
			</div>

			<CardFooter className="pt-0 pb-4 flex justify-center">
				<button
					type="button"
					onClick={toggleExpand}
					className={clsx(
						"flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted",
						expanded && "text-foreground",
					)}
					aria-expanded={expanded}
					aria-label={expanded ? "Collapse details" : "Expand details"}
				>
					<ChevronDown
						className={clsx(
							"w-4 h-4 transition-transform duration-300",
							expanded && "rotate-180",
						)}
					/>
					{expanded ? "Less" : "More"}
				</button>
			</CardFooter>
		</Card>
	);
}
