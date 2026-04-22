---
title: "The Beskid Book"
description: A practical language tutorial for Beskid, from first project to public API design.
---

This book is the practical introduction to Beskid. It is written as a tutorial track first, with links into the normative spec when you want exact rules.

## How to use this book

- Read chapters in order if you are new to Beskid.
- Treat each chapter as "learn, apply, verify": read the concept, try it in a small file, then cross-check with linked spec pages.
- Keep the spec open for details and edge cases:
  - [Language Spec](/spec/)
  - [Execution docs](/execution/)
  - [Standard Library docs](/standard-library/)

## Learning tracks

- Language user track: [02. Projects and Targets](/book/02-projects-and-targets/) -> [03. Modules and Files](/book/03-modules-and-files/) -> [04. Imports and Names](/book/04-imports-and-names/) -> [06. Public API Idioms](/book/06-public-api-idioms/)
- Monorepo/package author track: [02. Projects and Targets](/book/02-projects-and-targets/) -> [05. Workspaces and Monorepos](/book/05-workspaces-and-monorepos/) -> [06. Public API Idioms](/book/06-public-api-idioms/)
- Tooling contributor track: [01. Tooling and Editors](/book/01-tooling-and-editors/) -> [02. Projects and Targets](/book/02-projects-and-targets/) -> [03. Modules and Files](/book/03-modules-and-files/) -> [04. Imports and Names](/book/04-imports-and-names/) -> [Appendix: Spec Map](/book/appendix-spec-map/)

## What you should know after finishing

- How Beskid source layout maps to module and name-resolution behavior.
- How project/workspace manifests control build and dependency resolution.
- How to design stable public APIs with `pub` and `pub use`.
