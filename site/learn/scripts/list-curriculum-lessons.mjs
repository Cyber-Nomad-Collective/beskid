#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCurriculum } from "./validate-curriculum.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const { lessons } = validateCurriculum({ curriculumRoot: path.resolve(scriptDirectory, "..", "curriculum") });
console.log(lessons.filter(({ check }) => check.mode === "interactive").map(({ id }) => id).join("\n"));
