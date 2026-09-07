/**
 * One-off enricher for data/v0.2 tasks and deliverables (reference: v0.1 open-vsx task).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "data", "v0.2");
const VERSION_LABEL = "v0.2 (Analysis, packages, and platform spec)";
const ORG = "Cyber-Nomad-Collective";
const END_COMMIT = "f57377a";
const END_COMMIT_URL = `https://github.com/${ORG}/beskid/commit/${END_COMMIT}`;

/** GitHub repo slug per seed `source.repo` (corelib → beskid_standard). */
const REPO_SLUG = {
	beskid: "beskid",
	compiler: "compiler",
	pckg: "pckg",
	beskid_vscode: "beskid_vscode",
	corelib: "beskid_standard",
};

function sourceUrl(repo, commit) {
	const slug = REPO_SLUG[repo] ?? repo;
	return `https://github.com/${ORG}/${slug}/commit/${commit}`;
}

function section(body, name) {
	const re = new RegExp(`## ${name}\\s*\\n+([\\s\\S]*?)(?=\\n## |$)`);
	const m = body.match(re);
	return m ? m[1].trim() : "";
}

function firstLine(text) {
	const line = text.split("\n").find((l) => l.trim());
	return line?.replace(/^[-*]\s+/, "").trim() ?? "";
}

function deliverableTitleFromContext(context) {
	const m = context.match(
		/Contributes to deliverable \*\*([^*]+)\*\* \(`([^`]+)`\)/,
	);
	return m ? { title: m[1], id: m[2] } : null;
}

function isTaskEnriched(task) {
	return (
		task.source?.url &&
		task.body?.includes("## Catalog scope") &&
		task.body?.includes("## Relation")
	);
}

function enrichTask(task, deliverableTitles) {
	if (isTaskEnriched(task)) return { task, updated: false };

	const outcome = section(task.body ?? "", "Outcome");
	const context = section(task.body ?? "", "Context");
	const platformSpec = section(task.body ?? "", "Platform specification");

	const summary =
		firstLine(outcome)?.replace(/^\*\*|\*\*$/g, "").trim() || task.title;

	const contrib = deliverableTitleFromContext(context);
	const milestoneId = task.milestoneId ?? task.deliverableId;
	const deliverableTitle =
		(contrib?.title ??
			(milestoneId ? deliverableTitles.get(milestoneId) : undefined)) ||
		milestoneId;

	let relation =
		context
			.split("\n")
			.find((l) => l.includes("Contributes to deliverable"))
			?.replace(/^[-*]\s+/, "") ?? "";
	if (!relation && deliverableTitle && milestoneId) {
		relation = `Contributes to deliverable **${deliverableTitle}** (\`${milestoneId}\`).`;
	}
	if (!relation) {
		relation = `Supports **${VERSION_LABEL}** on workstream \`${task.workstream ?? "—"}\`.`;
	}

	const repo = task.source.repo;
	const commit = task.source.commit;
	const url = sourceUrl(repo, commit);

	const provenanceLines = [
		`- **Repository:** \`${repo}\``,
		`- **Commit:** [\`${commit.slice(0, 7)}\`](${url})`,
		`- **Subject:** ${task.source.subject}`,
	];
	if (task.completedAt) {
		provenanceLines.push(`- **Completed:** ${task.completedAt}`);
	}

	const catalogLines = [
		`- **Delivery version:** ${VERSION_LABEL}`,
		`- **Workstream:** \`${task.workstream ?? "—"}\``,
	];
	if (milestoneId) {
		catalogLines.push(`- **Deliverable:** \`${milestoneId}\``);
	}
	if (task.domain) catalogLines.push(`- **Domain:** \`${task.domain}\``);
	if (task.area) catalogLines.push(`- **Area:** \`${task.area}\``);

	const parts = [summary];
	if (platformSpec) {
		parts.push(`## Platform specification\n${platformSpec}`);
	}
	parts.push(`## Provenance\n${provenanceLines.join("\n")}`);
	parts.push(`## Catalog scope\n${catalogLines.join("\n")}`);
	parts.push(`## Relation\n${relation}`);

	const enriched = {
		...task,
		source: { ...task.source, url },
		body: `${parts.join("\n\n")}\n`,
	};
	if (!enriched.priority) enriched.priority = "medium";
	return { task: enriched, updated: true };
}

function isDeliverableEnriched(d) {
	return (
		d.description?.includes("## Provenance") &&
		d.description?.includes("## Catalog scope")
	);
}

function enrichDeliverable(d, tasksByMilestone) {
	if (isDeliverableEnriched(d)) return { deliverable: d, updated: false };

	const tasks = tasksByMilestone.get(d.id) ?? [];
	const workstreams = [
		...new Set(tasks.map((t) => t.workstream).filter(Boolean)),
	];

	const closedLine = d.closedOn
		? `Closed **${d.closedOn}** on superrepo [\`${END_COMMIT}\`](${END_COMMIT_URL}) (v0.2 delivery tip).`
		: "";

	const intro = (d.description ?? "")
		.replace(/\n\n\*\*Closed:\*\*[^\n]+\n?/g, "")
		.replace(/\*\*Closed:\*\*[^\n]+\n?/g, "")
		.trim();

	const provenanceBullets = tasks
		.slice(0, 8)
		.map((t) => {
			const url = sourceUrl(t.source.repo, t.source.commit);
			const sha = t.source.commit.slice(0, 7);
			return `- [\`${sha}\`](${url}) (\`${t.source.repo}\`) — ${t.source.subject}`;
		});

	if (tasks.length > 8) {
		provenanceBullets.push(
			`- *…and ${tasks.length - 8} more seed tasks with provenance commits.*`,
		);
	}

	const wsLine =
		workstreams.length > 0
			? `Workstreams: ${workstreams.map((w) => `\`${w}\``).join(", ")}.`
			: "";

	const description = `${closedLine}

${intro}

${wsLine} **${tasks.length}** catalog tasks anchor this deliverable (\`milestoneId: ${d.id}\`).

## Provenance
${provenanceBullets.length > 0 ? provenanceBullets.join("\n") : `- Delivery band ends at [\`${END_COMMIT}\`](${END_COMMIT_URL}).`}

## Catalog scope
- **Delivery version:** ${VERSION_LABEL}
- **Deliverable:** \`${d.id}\` — ${d.title}

## Relation
Groups the v0.2 seed tasks linked via \`milestoneId\` for **${d.title}**.`;

	return {
		deliverable: { ...d, description: description.trim() },
		updated: true,
	};
}

async function loadJsonDir(dir) {
	const out = [];
	for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json"))) {
		out.push(JSON.parse(await readFile(path.join(dir, file), "utf8")));
	}
	return out;
}

const deliverables = await loadJsonDir(path.join(ROOT, "deliverables"));
const deliverableTitles = new Map(deliverables.map((d) => [d.id, d.title]));

const allTasks = await loadJsonDir(path.join(ROOT, "tasks"));
const tasksByMilestone = new Map();
for (const task of allTasks) {
	const mid = task.milestoneId ?? task.deliverableId;
	if (!mid) continue;
	if (!tasksByMilestone.has(mid)) tasksByMilestone.set(mid, []);
	tasksByMilestone.get(mid).push(task);
}

let taskUpdates = 0;
let deliverableUpdates = 0;

const tasksDir = path.join(ROOT, "tasks");
for (const file of (await readdir(tasksDir)).filter((f) => f.endsWith(".json"))) {
	const raw = await readFile(path.join(tasksDir, file), "utf8");
	const task = JSON.parse(raw);
	const { task: enriched, updated } = enrichTask(task, deliverableTitles);
	if (updated) {
		await writeFile(
			path.join(tasksDir, file),
			`${JSON.stringify(enriched, null, 2)}\n`,
		);
		taskUpdates++;
	}
}

const delivDir = path.join(ROOT, "deliverables");
for (const file of (await readdir(delivDir)).filter((f) => f.endsWith(".json"))) {
	const raw = await readFile(path.join(delivDir, file), "utf8");
	const d = JSON.parse(raw);
	const { deliverable, updated } = enrichDeliverable(d, tasksByMilestone);
	if (updated) {
		await writeFile(
			path.join(delivDir, file),
			`${JSON.stringify(deliverable, null, 2)}\n`,
		);
		deliverableUpdates++;
	}
}

console.log(`Updated ${taskUpdates} tasks, ${deliverableUpdates} deliverables`);
