## Why

The Beskid normative standard lives in `openspec/specs`. The descriptive prose
across these specs uses a mix of styles: long sentences, passive voice, and
synonyms for the same concept. This style makes the specs harder to read,
harder to translate, and harder to check for consistency. The Beskid Normative
Manifest already uses a controlled language. The rest of the platform spec
does not have a defined controlled language.

ASD-STE100 Simplified Technical English (Issue 9, January 2025) is a
controlled natural language standard for technical documentation. It defines
a fixed set of writing rules and a controlled dictionary. Each approved word
has one meaning and one part of speech. The standard permits technical nouns
and verbs for subject-specific terms.

## What Changes

- Add a new `standard-ste-compliance` capability that adopts ASD-STE100
  Simplified Technical English as the controlled language for all normative
  and informative prose in OpenSpec specs.
- Require all descriptive prose in specs to conform to the ASD-STE100 writing
  rules.
- Require requirement statements to keep the `SHALL`/`MUST` form with a simple
  sentence structure.
- Require scenario statements to keep the `GIVEN`/`WHEN`/`THEN` form.
- Permit Beskid technical nouns and verbs as subject-specific terms (fiber,
  spawn, lowering, codegen, corelib, runtime, ABI, CLIF, ISLE, pest, salsa,
  abfall, Cranelift, and others).
- Exempt code examples and source provenance sections from the STE rules.
- Require a validation step to check the STE compliance of the descriptive prose
  before a spec change is accepted.
- Reference the STE standard as ASD-STE100, Issue 9, January 2025.
- Convert the `## Purpose` sections of all `language-meta--*` specs to
  STE-compliant prose as the first application of the policy.

## Capabilities

### New Capabilities

- `standard-ste-compliance`: Defines the ASD-STE100 Simplified Technical
  English compliance policy for OpenSpec prose, the exempt sections, the
  permitted technical vocabulary, and the conformance checks.

### Modified Capabilities

None.

## Impact

- Spec authors must write descriptive prose in STE style: short sentences,
  active voice, simple vocabulary, present tense, and proper articles.
- The `## Purpose` sections of the `language-meta--*` specs are converted in
  this change as the first application of the policy.
- Requirement text (`SHALL`/`MUST` statements), scenario text
  (`GIVEN`/`WHEN`/`THEN`), code examples, source provenance, and
  auto-generated sections (`## Decisions`, `## Articles`) are not changed.
- `openspec/catalog.json` will require regeneration once the new capability
  is accepted and the `language-meta--*` Purpose sections are converted.
- A validation step checks the STE compliance of the descriptive prose before a
  spec change is accepted. The step runs as part of the OpenSpec change
  validation and reports the specs that do not conform.
- Future spec edits must keep the descriptive prose in STE style.
