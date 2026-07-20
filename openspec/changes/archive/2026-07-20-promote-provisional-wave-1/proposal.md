## Why

Ninety-two capabilities remain provisional stubs after the OpenSpec migration.
Feature-level capabilities with rich migrated source text can become real
normative requirements without inventing behavior. Leaving them provisional
blocks Book and Tracker from citing implemented guarantees.

## What Changes

- Promote twelve feature-level provisional capabilities to explicit SHALL
  requirements extracted from each capability's Migrated source text.
- Remove each capability's single "SHALL remain non-conformant" requirement.
- Keep Informative Source Provenance blocks as historical provenance.
- Defer all `taxonomy--*` hubs and other provisional capabilities to later waves.

## Capabilities

### B1 tooling

- `tooling--cli--hi-command`
- `tooling--cli--repl-command`
- `tooling--cli--command-surface`
- `tooling--manifests-and-lockfiles--bsol`

### B2 language-meta

- `language-meta--surface-syntax--lexical-and-syntax`
- `language-meta--program-structure--name-resolution`
- `language-meta--program-structure--modules-and-visibility`
- `language-meta--type-system--enums-and-match`

### B3 core-library + compiler

- `core-library--foundation-and-primitives--core-collections`
- `core-library--text-and-parsing--text-regex`
- `core-library--stability-and-api-shape--core-time`
- `compiler--semantic-pipeline--stage-ordering`

## Impact

- Catalog `provisionalCapabilities` decreases by twelve.
- Book and Tracker may cite the promoted requirements once archived.
- No implementation code changes are required in this wave; requirements
  reflect already-migrated descriptive obligations.
