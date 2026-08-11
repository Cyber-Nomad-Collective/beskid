# Learn Guided Lessons Design

## Goal

Turn Learn from a generic tiled workspace into a guided, lesson-specific flow where each step explains one idea, focuses the relevant editor range, and validates the learner's current source before advancing.

## Design

`LearnExercise` gains ordered `steps` and optional `layout` metadata. A step contains stable identity, title, body copy, optional Monaco source range, and a check definition. The workspace owns the active step and exposes a single check action. Source checks validate the current editor text locally; command checks continue to use `/api/check` and optionally show a terminal.

The right rail becomes the canonical lesson navigator: progress, step list, active explanation, contextual hint, check status, and previous/next controls. Required workspace surfaces are selected by lesson configuration. Tabs remain for surface switching but required tabs cannot be closed.

The editor uses Monaco decorations and `revealLineInCenter` to focus a step. Motion for React handles rail/step transitions and active indicators; CSS and Monaco handle the short code pulse and reduced-motion fallback.

## Lesson layouts

- Introductory language lessons use guide + editor and keep terminal hidden.
- CLI lessons use guide + editor + terminal and teach a real command surface.
- Runtime lessons use guide + editor + terminal because output and exit status are part of the learning goal.

Existing lessons are migrated to steps. New CLI lessons cover help/navigation, project creation, formatting, and build workflow using commands present in `compiler/crates/beskid_cli/src/cli.rs`.

## Acceptance criteria

- Selecting a step scrolls and highlights its configured source range.
- A source step cannot advance until its expected source condition passes.
- Command steps retain readable terminal output and advance only after a successful check.
- The rail clearly communicates current, passed, and blocked steps.
- Required tabs remain available; optional surfaces are not forced into every lesson.
- Reduced-motion users receive instant state changes without loss of focus or status.
