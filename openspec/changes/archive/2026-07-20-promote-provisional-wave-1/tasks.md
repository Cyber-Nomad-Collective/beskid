## 1. Tooling CLI lane

- [x] 1.1 Delta + promote `tooling--cli--hi-command`
- [x] 1.2 Delta + promote `tooling--cli--repl-command`
- [x] 1.3 Delta + promote `tooling--cli--command-surface`
- [x] 1.4 Delta + promote `tooling--manifests-and-lockfiles--bsol`

## 2. Language-meta lane

- [x] 2.1 Delta + promote `language-meta--surface-syntax--lexical-and-syntax`
- [x] 2.2 Delta + promote `language-meta--program-structure--name-resolution`
- [x] 2.3 Delta + promote `language-meta--program-structure--modules-and-visibility`
- [x] 2.4 Delta + promote `language-meta--type-system--enums-and-match`

## 3. Core-library + compiler lane

- [x] 3.1 Delta + promote `core-library--foundation-and-primitives--core-collections`
- [x] 3.2 Delta + promote `core-library--text-and-parsing--text-regex`
- [x] 3.3 Delta + promote `core-library--stability-and-api-shape--core-time`
- [x] 3.4 Delta + promote `compiler--semantic-pipeline--stage-ordering`

## 4. Verify

- [x] 4.1 `openspec validate promote-provisional-wave-1`
- [x] 4.2 Archive change; confirm none of the twelve retain `SHALL remain non-conformant`
- [x] 4.3 `bun run openspec:catalog` and `bun run openspec:validate`; provisional count drops by 12
