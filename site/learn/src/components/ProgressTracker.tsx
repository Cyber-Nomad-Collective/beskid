import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@beskid/ui-react";
import { CheckCircle, Flame, Trophy } from "lucide-react";
import { useMemo } from "react";

interface CategoryInfo {
	label: string;
	count: number;
	completed: number;
}

interface ProgressTrackerProps {
	passedLessons: Record<string, boolean>;
	exerciseCount: number;
	categories: Record<string, CategoryInfo>;
	streak?: number;
}

function ProgressTracker({
	passedLessons,
	exerciseCount,
	categories,
	streak = 0,
}: ProgressTrackerProps) {
	const completedCount = useMemo(
		() => Object.values(passedLessons).filter(Boolean).length,
		[passedLessons],
	);

	const pct =
		exerciseCount > 0 ? Math.round((completedCount / exerciseCount) * 100) : 0;

	const achievements = useMemo(() => {
		const result: Array<{
			id: string;
			label: string;
			description: string;
			earned: boolean;
		}> = [];

		result.push({
			id: "first-steps",
			label: "First Steps",
			description: "Complete your first lesson",
			earned: completedCount >= 1,
		});

		result.push({
			id: "halfway",
			label: "Halfway There",
			description: "Complete 50% of all lessons",
			earned: pct >= 50,
		});

		result.push({
			id: "completionist",
			label: "Completionist",
			description: "Complete all lessons",
			earned: completedCount === exerciseCount && exerciseCount > 0,
		});

		for (const [key, cat] of Object.entries(categories)) {
			result.push({
				id: `category-${key}`,
				label: `${cat.label} Master`,
				description: `Complete all ${cat.label} lessons`,
				earned: cat.completed === cat.count && cat.count > 0,
			});
		}

		if (streak >= 3) {
			result.push({
				id: "streak-3",
				label: "Hot Streak",
				description: "3-day learning streak",
				earned: true,
			});
		}

		if (streak >= 7) {
			result.push({
				id: "streak-7",
				label: "On Fire",
				description: "7-day learning streak",
				earned: true,
			});
		}

		return result;
	}, [completedCount, pct, categories, streak, exerciseCount]);

	const earnedCount = achievements.filter((a) => a.earned).length;

	return (
		<div className="space-y-4">
			{/* Total Progress */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<CheckCircle className="size-5 text-emerald-500" />
						Overall Progress
					</CardTitle>
					<CardDescription>
						{completedCount} of {exerciseCount} lessons completed ({pct}%)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
						<div
							className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-in-out"
							style={{ width: `${pct}%` }}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Streak */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Flame className="size-5 text-orange-500" />
						Current Streak
					</CardTitle>
					<CardDescription>
						{streak > 0
							? `${streak} day${streak === 1 ? "" : "s"} and counting!`
							: "Start learning to build your streak"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
							<span className="text-2xl font-bold text-orange-500">{streak}</span>
						</div>
						<div
							className="h-12 w-12"
							data-lottie="flame-animation"
							data-lottie-src="/animations/flame.json"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Per-Category Progress */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-lg">Categories</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{Object.entries(categories).map(([key, cat]) => {
						const catPct =
							cat.count > 0 ? Math.round((cat.completed / cat.count) * 100) : 0;
						return (
							<div key={key}>
								<div className="mb-1 flex items-center justify-between text-sm">
									<span className="font-medium">{cat.label}</span>
									<span className="text-muted-foreground">
										{cat.completed}/{cat.count}
									</span>
								</div>
								<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
									<div
										className="h-full rounded-full bg-sky-500 transition-[width] duration-700 ease-in-out"
										style={{ width: `${catPct}%` }}
									/>
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>

			{/* Achievements */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Trophy className="size-5 text-amber-500" />
						Achievements
					</CardTitle>
					<CardDescription>
						{earnedCount} of {achievements.length} earned
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{achievements.map((ach) => (
							<Badge
								key={ach.id}
								className={
									ach.earned
										? "border-amber-500/50 bg-amber-500/10 text-amber-700"
										: "opacity-40"
								}
								title={ach.description}
							>
								<Trophy
									className={`mr-1 size-3 ${ach.earned ? "text-amber-500" : ""}`}
								/>
								{ach.label}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default ProgressTracker;
