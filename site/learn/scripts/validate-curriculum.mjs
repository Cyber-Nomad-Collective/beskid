#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const LESSON_HEADINGS = [
	"Hook and goal",
	"Predict",
	"Run",
	"Investigate",
	"Modify",
	"Make and retrieve",
	"Failure clinic",
	"Recap and next link",
];

export const INTERACTIVE_COMMANDS = new Set(["analyze", "parse", "tree", "run", "build", "test"]);
const REQUIRED_METADATA = [
	"id",
	"context",
	"title",
	"objective",
	"prerequisites",
	"command",
	"difficulty",
	"category",
	"vocabulary",
	"source",
	"hints",
	"questions",
];

function readJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		throw new Error(`${filePath}: invalid JSON (${error.message})`);
	}
}

function ensureSafeRelativePath(relativePath, label) {
	if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath)) {
		throw new Error(`${label} must be a non-empty relative path`);
	}
	const segments = relativePath.split(/[\\/]/);
	if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
		throw new Error(`${label} must not contain empty, '.' or '..' segments`);
	}
}

function parseValue(value, filePath, lineNumber) {
	const trimmed = value.trim();
	if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
		try {
			return JSON.parse(trimmed);
		} catch (error) {
			throw new Error(`${filePath}:${lineNumber}: invalid JSON value (${error.message})`);
		}
	}
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
	return trimmed.replace(/^['"]|['"]$/g, "");
}

export function parseLessonMarkdown(markdown, filePath = "lesson.md") {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) throw new Error(`${filePath}: expected --- delimited front matter`);
	const metadata = {};
	for (const [index, line] of match[1].split(/\r?\n/).entries()) {
		if (!line.trim()) continue;
		const separator = line.indexOf(":");
		if (separator < 1) throw new Error(`${filePath}:${index + 2}: expected key: value`);
		const key = line.slice(0, separator).trim();
		if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new Error(`${filePath}:${index + 2}: invalid metadata key '${key}'`);
		if (Object.hasOwn(metadata, key)) throw new Error(`${filePath}:${index + 2}: duplicate metadata key '${key}'`);
		metadata[key] = parseValue(line.slice(separator + 1), filePath, index + 2);
	}
	return { metadata, body: match[2] };
}

function assertArrayOfStrings(value, label) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
		throw new Error(`${label} must be an array of non-empty strings`);
	}
}

function validateQuestions(questions, label) {
	if (!Array.isArray(questions)) throw new Error(`${label} must be an array`);
	const ids = new Set();
	for (const question of questions) {
		if (!question || typeof question !== "object") throw new Error(`${label} entries must be objects`);
		if (typeof question.id !== "string" || !question.id || ids.has(question.id)) throw new Error(`${label} ids must be unique non-empty strings`);
		if (typeof question.text !== "string" || !question.text) throw new Error(`${label}.${question.id}.text must be a non-empty string`);
		assertArrayOfStrings(question.options, `${label}.${question.id}.options`);
		if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
			throw new Error(`${label}.${question.id}.correctIndex must select an option`);
		}
		ids.add(question.id);
	}
}

function validateMetadata(metadata, lessonId, contextId, lessonFile) {
	for (const key of REQUIRED_METADATA) {
		if (!Object.hasOwn(metadata, key)) throw new Error(`${lessonFile}: missing front matter '${key}'`);
	}
	if (metadata.id !== lessonId) throw new Error(`${lessonFile}: id must be '${lessonId}'`);
	if (metadata.context !== contextId) throw new Error(`${lessonFile}: context must be '${contextId}'`);
	if (metadata.category !== contextId) throw new Error(`${lessonFile}: category must be '${contextId}'`);
	for (const key of ["title", "objective", "source", "category"]) {
		if (typeof metadata[key] !== "string" || !metadata[key]) throw new Error(`${lessonFile}: ${key} must be a non-empty string`);
	}
	if (!["beginner", "intermediate"].includes(metadata.difficulty)) throw new Error(`${lessonFile}: difficulty must be beginner or intermediate`);
	assertArrayOfStrings(metadata.prerequisites, `${lessonFile}: prerequisites`);
	assertArrayOfStrings(metadata.vocabulary, `${lessonFile}: vocabulary`);
	assertArrayOfStrings(metadata.hints, `${lessonFile}: hints`);
	validateQuestions(metadata.questions, `${lessonFile}: questions`);
}

function validateHeadings(body, lessonFile) {
	let lastIndex = -1;
	for (const heading of LESSON_HEADINGS) {
		const index = body.indexOf(`## ${heading}`);
		if (index < 0) throw new Error(`${lessonFile}: missing required heading '## ${heading}'`);
		if (index <= lastIndex) throw new Error(`${lessonFile}: headings must follow the template order`);
		lastIndex = index;
	}
}

function hasConcreteBeskidFence(markdown) {
	const fences = markdown.matchAll(/```beskid[^\r\n]*\r?\n([\s\S]*?)\r?\n```/g);
	return [...fences].some((fence) => fence[1].trim().length > 0);
}

function validateCodeExamples(body, lessonFile) {
	if (!hasConcreteBeskidFence(body)) {
		throw new Error(`${lessonFile}: expected at least one non-empty fenced 'beskid' example`);
	}
	const failureClinic = body.match(/## Failure clinic\r?\n([\s\S]*?)(?=\r?\n## |$)/);
	if (!failureClinic || !hasConcreteBeskidFence(failureClinic[1])) {
		throw new Error(`${lessonFile}: Failure clinic must include a non-empty fenced 'beskid' example`);
	}
}

function validateCheck(check, metadata, lessonFile) {
	if (!check || typeof check !== "object" || Array.isArray(check)) throw new Error(`${lessonFile}: check.json must be an object`);
	if (!["interactive", "reference-only"].includes(check.mode)) throw new Error(`${lessonFile}: check.json mode must be interactive or reference-only`);
	if (check.command !== metadata.command) throw new Error(`${lessonFile}: check.json command must match lesson front matter`);
	if (!check.acceptance || typeof check.acceptance !== "object") throw new Error(`${lessonFile}: check.json requires an acceptance object`);
	if (check.mode === "interactive" && !INTERACTIVE_COMMANDS.has(check.command)) throw new Error(`${lessonFile}: unsupported interactive command '${check.command}'`);
	if (check.mode === "reference-only" && check.command !== "reference") throw new Error(`${lessonFile}: reference-only lessons must declare command 'reference'`);
}

function topologicallyValidatePrerequisites(lessonRecords) {
	const ids = new Set(lessonRecords.map(({ id }) => id));
	const state = new Map();
	const visit = (record, trail) => {
		const status = state.get(record.id);
		if (status === "done") return;
		if (status === "visiting") throw new Error(`prerequisite cycle: ${[...trail, record.id].join(" -> ")}`);
		state.set(record.id, "visiting");
		for (const prerequisite of record.metadata.prerequisites) {
			if (!ids.has(prerequisite)) throw new Error(`${record.id}: unknown prerequisite '${prerequisite}'`);
			visit(lessonRecords.find(({ id }) => id === prerequisite), [...trail, record.id]);
		}
		state.set(record.id, "done");
	};
	for (const record of lessonRecords) visit(record, []);
}

export function validateCurriculum({ curriculumRoot }) {
	const manifestPath = path.join(curriculumRoot, "manifest.json");
	const manifest = readJson(manifestPath);
	if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.contexts) || !manifest.lessons || typeof manifest.lessons !== "object") {
		throw new Error(`${manifestPath}: expected schemaVersion 1 with contexts and lessons`);
	}
	const seenContextIds = new Set();
	const seenContextPaths = new Set();
	const listedLessonIds = new Set();
	const records = [];
	for (const context of manifest.contexts) {
		if (!context || typeof context !== "object") throw new Error(`${manifestPath}: contexts entries must be objects`);
		if (typeof context.id !== "string" || !context.id || seenContextIds.has(context.id)) throw new Error(`${manifestPath}: context ids must be unique non-empty strings`);
		ensureSafeRelativePath(context.path, `${manifestPath}: context ${context.id} path`);
		if (seenContextPaths.has(context.path)) throw new Error(`${manifestPath}: duplicate context path '${context.path}'`);
		assertArrayOfStrings(context.capabilities, `${manifestPath}: context ${context.id} capabilities`);
		assertArrayOfStrings(context.lessons, `${manifestPath}: context ${context.id} lessons`);
		seenContextIds.add(context.id);
		seenContextPaths.add(context.path);
		for (const id of context.lessons) {
			if (listedLessonIds.has(id)) throw new Error(`${manifestPath}: lesson '${id}' appears in more than one context`);
			const definition = manifest.lessons[id];
			if (!definition || typeof definition !== "object") throw new Error(`${manifestPath}: context lesson '${id}' has no lesson definition`);
			ensureSafeRelativePath(definition.path, `${manifestPath}: lesson ${id} path`);
			if (!definition.path.startsWith(`${context.path}/`)) throw new Error(`${manifestPath}: lesson ${id} must live below ${context.path}`);
			const lessonDirectory = path.resolve(curriculumRoot, definition.path);
			if (!lessonDirectory.startsWith(`${path.resolve(curriculumRoot)}${path.sep}`)) throw new Error(`${manifestPath}: lesson ${id} escapes curriculum root`);
			const lessonFile = path.join(lessonDirectory, "lesson.md");
			const { metadata, body } = parseLessonMarkdown(fs.readFileSync(lessonFile, "utf8"), lessonFile);
			validateMetadata(metadata, id, context.id, lessonFile);
			validateHeadings(body, lessonFile);
			validateCodeExamples(body, lessonFile);
			const check = readJson(path.join(lessonDirectory, "check.json"));
			validateCheck(check, metadata, lessonFile);
			for (const filename of ["start.bd", "solution.bd"]) {
				const sourcePath = path.join(lessonDirectory, filename);
				if (!fs.existsSync(sourcePath) || !fs.readFileSync(sourcePath, "utf8").trim()) throw new Error(`${lessonFile}: missing or empty ${filename}`);
			}
			records.push({ id, context, path: definition.path, metadata, body, check });
			listedLessonIds.add(id);
		}
	}
	for (const id of Object.keys(manifest.lessons)) {
		if (!listedLessonIds.has(id)) throw new Error(`${manifestPath}: lesson '${id}' is not assigned to a context`);
	}
	topologicallyValidatePrerequisites(records);
	return { manifest, lessons: records };
}

function main() {
	const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
	const curriculumRoot = path.resolve(scriptDirectory, "..", "curriculum");
	try {
		const result = validateCurriculum({ curriculumRoot });
		console.log(`Curriculum valid: ${result.manifest.contexts.length} contexts, ${result.lessons.length} lessons.`);
	} catch (error) {
		console.error(`Curriculum invalid: ${error.message}`);
		process.exitCode = 1;
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
