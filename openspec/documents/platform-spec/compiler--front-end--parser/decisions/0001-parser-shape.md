# Parser shape

## Context

The parser feature needs a decision record that is discoverable from the
canonical Platform Spec document hierarchy.

## Decision

Store parser decision records under the parser feature's `decisions` directory
and treat them as informative context for canonical feature requirements.

## Consequences

The catalog can identify this record as a decision and preserve its parser
feature parent without granting it normative authority.
