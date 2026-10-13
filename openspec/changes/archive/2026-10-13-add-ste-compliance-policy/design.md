## Context

OpenSpec is the sole normative authority for the Beskid language. The specs
live in `openspec/specs`. The descriptive prose across these specs uses a mix
of styles. There is no defined controlled language for the prose. The Beskid
Normative Manifest already uses a controlled language, but the rest of the
platform spec does not.

ASD-STE100 Simplified Technical English (STE), Issue 9, January 2025, is a
controlled natural language standard for technical documentation. It defines
53 writing rules in 9 sections and a controlled dictionary of approximately
900 approved words. Each approved word has one meaning and one part of speech.
The standard permits technical nouns and verbs for subject-specific terms.

This change adopts STE as the controlled language for the descriptive prose in
OpenSpec specs. The change does not move the normative authority. The
requirement text and the scenario text keep their existing controlled forms.

## Decisions

### Scope of STE application

STE applies to the descriptive prose in OpenSpec specs. The descriptive prose
includes the `## Purpose` section and any explanatory paragraphs that are not
part of a requirement or a scenario.

STE does not apply to:
- Requirement statements. These keep the `SHALL`/`MUST` form with a simple
  sentence structure.
- Scenario statements. These keep the `GIVEN`/`WHEN`/`THEN` form.
- Code examples. These keep their original form.
- Source provenance sections (`## Informative Source Provenance`). These are
  historical records.
- Migrated source text in `<details>` blocks. These are historical records.
- Auto-generated sections (`## Decisions`, `## Articles`). These are produced
  by tooling.

### STE writing rules applied

The descriptive prose follows these STE rules:
- Short sentences. Each sentence has one topic. A sentence has a maximum of
  approximately 20 words.
- Active voice. The subject does the action.
- Simple vocabulary. One word for one concept. No synonyms.
- Present tense.
- Proper articles (`the`, `a`, `an`).
- One meaning per word.

### Permitted technical vocabulary

STE permits technical nouns and verbs for subject-specific terms. The Beskid
technical vocabulary is permitted in the descriptive prose. The permitted
terms include: fiber, spawn, lowering, codegen, corelib, runtime, ABI, CLIF,
ISLE, pest, salsa, abfall, Cranelift, HIR, AST, LSP, JIT, AOT, GC, Mod, and
other Beskid-specific terms.

### STE standard reference

The STE standard is referenced as ASD-STE100, Issue 9, January 2025. The
standard is available at `https://asd-ste100.org/`.

### Validation step

A validation step checks the STE compliance of the descriptive prose before a
spec change is accepted. The step runs as part of the OpenSpec change
validation. The step reports the specs that do not conform to the ASD-STE100
writing rules. A change that contains non-conforming descriptive prose is not
accepted. The validation step checks only the descriptive prose. The
requirement statements and the scenario statements are exempt.

### First application

This change converts the `## Purpose` sections of all `language-meta--*`
specs to STE-compliant prose. The conversion rewrites the Purpose section in
STE style. The conversion does not change the requirement text, the scenario
text, the code examples, the source provenance, or the auto-generated
sections.

## Consequences

- Spec authors must write descriptive prose in STE style.
- The `## Purpose` sections of the `language-meta--*` specs are converted in
  this change.
- Future spec edits must keep the descriptive prose in STE style.
- A validation step checks the STE compliance of the descriptive prose before
  a spec change is accepted. The step runs as part of the OpenSpec change
  validation and reports the non-conforming specs.
- The normative authority does not move. The requirement text and the
  scenario text keep their existing controlled forms.
