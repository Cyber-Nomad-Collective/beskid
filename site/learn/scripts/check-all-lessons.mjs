#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateCurriculum } from "./validate-curriculum.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const curriculumRoot = path.resolve(scriptDirectory, "..", "curriculum");
let lessons;
try {
	({ lessons } = validateCurriculum({ curriculumRoot }));
} catch (error) {
	console.error(`Cannot check curriculum: ${error.message}`);
	process.exit(1);
}

for (const lesson of lessons.filter(({ check }) => check.mode === "interactive")) {
	const result = spawnSync(process.execPath, [path.join(scriptDirectory, "check-lesson.mjs"), lesson.id], {
		cwd: path.resolve(scriptDirectory, ".."),
		stdio: "inherit",
		env: process.env,
	});
	if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Checked ${lessons.filter(({ check }) => check.mode === "interactive").length} interactive manifest lessons.`);
