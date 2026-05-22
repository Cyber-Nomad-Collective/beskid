#!/usr/bin/env bun
/**
 * Remove Mission Control seed/demo data; keep beskid venture + synced tasks/skills.
 *
 *   bun ci/cleanup-mission-control-demo.mjs
 *   MISSION_CONTROL_ROOT=~/mcp/mc/mission-control bun ci/cleanup-mission-control-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const MC_ROOT = process.env.MISSION_CONTROL_ROOT ?? path.join(process.env.HOME, 'mcp/mc/mission-control');
const DATA = path.join(MC_ROOT, 'data');
const BESKID_PROJECT = 'proj_gCvYQ2EyYBwK';

const isDemoId = (id) =>
	typeof id === 'string' &&
	(/(^|_)demo($|_)/i.test(id) || id.includes('_demo_') || /^proj_demo/.test(id));

const isBeskidTask = (t) =>
	t.projectId === BESKID_PROJECT ||
	(t.tags ?? []).some((tag) => tag.startsWith('sync:')) ||
	['task_6Rar5Io2s1uj', 'task_bf7mktAEnAl6', 'task_AeqzHM8f9Oyo', 'task_f8xA4INvRJxq', 'task_3EnUkIRbnvmf', 'task_41qSa8cKOIVv', 'task_kBoH-GVaBXLR'].includes(t.id);

function readJson(name) {
	return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}

function writeJson(name, data) {
	fs.writeFileSync(path.join(DATA, name), `${JSON.stringify(data, null, 2)}\n`);
}

function readJsonSub(subpath) {
	const p = path.join(DATA, subpath);
	if (!fs.existsSync(p)) return null;
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJsonSub(subpath, data) {
	const p = path.join(DATA, subpath);
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

const removed = { projects: 0, tasks: 0, goals: 0, inbox: 0, decisions: 0, skills: 0, activity: 0, fieldMissions: 0, fieldTasks: 0 };

// Projects
const projectsFile = readJson('projects.json');
const beforeP = projectsFile.projects.length;
projectsFile.projects = projectsFile.projects.filter((p) => p.id === BESKID_PROJECT);
removed.projects = beforeP - projectsFile.projects.length;
writeJson('projects.json', projectsFile);

// Tasks
const tasksFile = readJson('tasks.json');
const beforeT = tasksFile.tasks.length;
tasksFile.tasks = tasksFile.tasks.filter((t) => !isDemoId(t.id) && !isDemoId(t.projectId) && !isDemoId(t.milestoneId) && (isBeskidTask(t) || t.projectId === BESKID_PROJECT));
removed.tasks = beforeT - tasksFile.tasks.length;
writeJson('tasks.json', tasksFile);

const keptTaskIds = new Set(tasksFile.tasks.map((t) => t.id));

// Goals
const goalsFile = readJson('goals.json');
const beforeG = goalsFile.goals.length;
goalsFile.goals = goalsFile.goals.filter((g) => !isDemoId(g.id) && g.projectId !== 'proj_demo_1' && g.projectId !== 'proj_demo_2');
for (const g of goalsFile.goals) {
	g.tasks = (g.tasks ?? []).filter((id) => keptTaskIds.has(id));
	g.milestones = (g.milestones ?? []).filter((id) => goalsFile.goals.some((x) => x.id === id));
}
removed.goals = beforeG - goalsFile.goals.length;
writeJson('goals.json', goalsFile);

// Inbox
const inboxFile = readJson('inbox.json');
const beforeI = inboxFile.messages.length;
inboxFile.messages = inboxFile.messages.filter(
	(m) => !isDemoId(m.id) && (!m.taskId || keptTaskIds.has(m.taskId)),
);
removed.inbox = beforeI - inboxFile.messages.length;
writeJson('inbox.json', inboxFile);

// Decisions
const decisionsFile = readJson('decisions.json');
const beforeD = decisionsFile.decisions.length;
decisionsFile.decisions = decisionsFile.decisions.filter(
	(d) => !isDemoId(d.id) && (!d.taskId || keptTaskIds.has(d.taskId)),
);
removed.decisions = beforeD - decisionsFile.decisions.length;
writeJson('decisions.json', decisionsFile);

// Skills + agent links
const skillsFile = readJson('skills-library.json');
const beforeS = skillsFile.skills.length;
skillsFile.skills = skillsFile.skills.filter((s) => !isDemoId(s.id));
removed.skills = beforeS - skillsFile.skills.length;
writeJson('skills-library.json', skillsFile);

const keptSkillIds = new Set(skillsFile.skills.map((s) => s.id));
const agentsFile = readJson('agents.json');
for (const a of agentsFile.agents) {
	a.skillIds = (a.skillIds ?? []).filter((id) => keptSkillIds.has(id));
	if (a.id === 'developer') {
		const add = ['skill_beskid_platform_spec', 'skill_beskid_workspace'].filter((id) => keptSkillIds.has(id));
		a.skillIds = [...new Set([...a.skillIds, ...add])];
	}
	if (a.id === 'researcher' && keptSkillIds.has('skill_beskid_platform_spec')) {
		a.skillIds = [...new Set([...a.skillIds, 'skill_beskid_platform_spec'])];
	}
	if (a.id === 'business-analyst' && keptSkillIds.has('skill_beskid_platform_spec')) {
		a.skillIds = [...new Set([...a.skillIds, 'skill_beskid_platform_spec'])];
	}
	if (a.id === 'me' && keptSkillIds.has('skill_beskid_book')) {
		a.skillIds = [...new Set([...a.skillIds, 'skill_beskid_book'])];
	}
}
writeJson('agents.json', agentsFile);

// Activity log
const activityFile = readJson('activity-log.json');
const beforeA = activityFile.events.length;
activityFile.events = activityFile.events.filter(
	(e) => !isDemoId(e.id) && (!e.taskId || keptTaskIds.has(e.taskId)),
);
removed.activity = beforeA - activityFile.events.length;
writeJson('activity-log.json', activityFile);

// Field ops demo
const foMissions = readJsonSub('field-ops/missions.json');
if (foMissions?.missions) {
	const b = foMissions.missions.length;
	foMissions.missions = foMissions.missions.filter((m) => !isDemoId(m.id));
	removed.fieldMissions = b - foMissions.missions.length;
	writeJsonSub('field-ops/missions.json', foMissions);
}
const foTasks = readJsonSub('field-ops/tasks.json');
if (foTasks?.tasks) {
	const b = foTasks.tasks.length;
	foTasks.tasks = foTasks.tasks.filter((t) => !isDemoId(t.id) && !isDemoId(t.missionId));
	removed.fieldTasks = b - foTasks.tasks.length;
	writeJsonSub('field-ops/tasks.json', foTasks);
}
const foActivity = readJsonSub('field-ops/activity-log.json');
if (foActivity?.events) {
	foActivity.events = foActivity.events.filter((e) => !isDemoId(e.id) && !/demo/i.test(e.summary ?? ''));
	writeJsonSub('field-ops/activity-log.json', foActivity);
}

// Checkpoints containing demo snapshots
const cpDir = path.join(DATA, 'checkpoints');
if (fs.existsSync(cpDir)) {
	for (const name of fs.readdirSync(cpDir)) {
		if (/demo/i.test(name)) {
			fs.unlinkSync(path.join(cpDir, name));
		}
	}
}

// Regenerate ai-context + agent command files
const proc = Bun.spawn(['bun', 'run', 'gen:context'], {
	cwd: MC_ROOT,
	stdout: 'inherit',
	stderr: 'inherit',
});
await proc.exited;

try {
	const res = await fetch('http://127.0.0.1:3000/api/sync', { method: 'POST' });
	if (!res.ok) console.warn('POST /api/sync:', res.status, await res.text());
} catch {
	console.warn('Mission Control not running — start dev server and run: curl -X POST http://127.0.0.1:3000/api/sync');
}

console.log('Removed demo data:', removed);
console.log(`Kept: 1 project, ${tasksFile.tasks.length} tasks, ${goalsFile.goals.length} goals, ${skillsFile.skills.length} skills`);
console.log(`Open http://127.0.0.1:3000/ventures/${BESKID_PROJECT}`);
