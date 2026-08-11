import { Badge, Button } from "@beskid/ui-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Circle, Lightbulb, Lock } from "lucide-react";
import type { LessonStep, LessonStepStatus } from "./steps";

type GuidedLessonRailProps = {
	title: string;
	steps: readonly LessonStep[];
	activeStep: number;
	statuses: readonly LessonStepStatus[];
	message: string | null;
	onSelectStep: (index: number) => void;
	onCheck: () => void;
	onPrevious: () => void;
};

export function GuidedLessonRail({ title, steps, activeStep, statuses, message, onSelectStep, onCheck, onPrevious }: GuidedLessonRailProps) {
	const step = steps[activeStep];
	if (!step) return null;
	const passed = statuses.filter((status) => status === "passed").length;
	return (
		<aside className="guided-lesson-rail" aria-label="Guided lesson">
			<div className="guided-lesson-summary"><div className="guided-lesson-kicker">Beskid Learn</div><div className="flex items-center justify-between gap-3"><h2>{title}</h2><Badge variant="outline">{passed}/{steps.length}</Badge></div><div className="guided-progress-track"><motion.div className="guided-progress-fill" animate={{ width: `${(passed / steps.length) * 100}%` }} /></div></div>
			<LayoutGroup id="learn-steps"><nav className="guided-step-list" aria-label="Lesson steps">{steps.map((item, index) => { const status = statuses[index] ?? "locked"; const isActive = index === activeStep; return <motion.button key={item.id} type="button" className={`guided-step ${isActive ? "guided-step--active" : ""} guided-step--${status}`} disabled={status === "locked"} onClick={() => onSelectStep(index)} layout aria-current={isActive ? "step" : undefined}><span className="guided-step-icon">{status === "passed" ? <Check /> : status === "locked" ? <Lock /> : <Circle />}</span><span className="guided-step-copy"><span className="guided-step-number">Step {index + 1}</span><span className="guided-step-title">{item.title}</span></span>{isActive && <motion.span layoutId="guided-step-indicator" className="guided-step-indicator" />}</motion.button>; })}</nav></LayoutGroup>
			<div className="guided-step-detail"><div className="guided-step-detail-label">Current step</div><AnimatePresence mode="wait"><motion.div key={step.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}><h3>{step.title}</h3><p>{step.body}</p>{step.hint && <p className="guided-hint"><Lightbulb /> {step.hint}</p>}</motion.div></AnimatePresence>{message && <p className="guided-check-message" role="status">{message}</p>}<div className="guided-step-actions"><Button variant="ghost" size="sm" onClick={onPrevious} disabled={activeStep === 0}><ChevronLeft /> Back</Button><Button size="sm" onClick={onCheck}>{step.check ? "Check step" : activeStep === steps.length - 1 ? "Finish lesson" : "Continue"}<ChevronRight /></Button></div></div>
		</aside>
	);
}
