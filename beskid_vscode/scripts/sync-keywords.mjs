#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const extensionRoot = resolve(import.meta.dir, "..");
const repoRoot = resolve(extensionRoot, "..");
const grammarPath = resolve(repoRoot, "crates/beskid_analysis/src/beskid.pest");
const textmatePath = resolve(extensionRoot, "syntaxes/beskid.tmLanguage.json");

const pest = readFileSync(grammarPath, "utf8");
const textmate = JSON.parse(readFileSync(textmatePath, "utf8"));

const keywordRule = /^\s*([A-Za-z]+Keyword)\s*=\s*\{\s*"([^"]+)"\s*\}\s*$/gm;
const keywords = [];
const seen = new Set();

for (const match of pest.matchAll(keywordRule)) {
  const keyword = match[2];
  if (!seen.has(keyword)) {
    seen.add(keyword);
    keywords.push(keyword);
  }
}

if (keywords.length === 0) {
  throw new Error("No keyword rules were extracted from beskid.pest");
}

const escapedKeywords = keywords.map((keyword) =>
  keyword.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
);
const keywordPattern = `\\b(?:${escapedKeywords.join("|")})\\b`;

if (!textmate.repository?.keywords) {
  throw new Error("TextMate grammar is missing repository.keywords");
}

textmate.repository.keywords.match = keywordPattern;
writeFileSync(textmatePath, `${JSON.stringify(textmate, null, 2)}\n`, "utf8");

console.log(`Updated ${textmatePath}`);
console.log(`Extracted ${keywords.length} keywords from ${grammarPath}`);
