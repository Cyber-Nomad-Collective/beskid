# Design: diagnostic model (0.6.7)

## Structure

A diagnostic has: code, severity, message, primary span, labelled related locations, notes, fixes, tags. A fix has a title, edits, and an applicability: `machine-applicable`, `maybe-incorrect` or `has-placeholders`. Only one `machine-applicable` fix at the cause is marked preferred.

## Editor shape (ticket 03)

The compiler emits one diagnostic per cause, anchored where the fix goes. For repeated assignments to an immutable binding, the anchor is the declaration. Other places are related locations with short labels. The editor never receives ASCII snippets, arrows, grammar rule names, repeated paths or `Help:` lines. Help is the preferred quick fix. Parse errors anchor on the token found, with the start of the construct as a related location, and say what was being parsed.

## Documentation link

No per-code pages exist. All codes link to `https://beskid-lang.org/docs/standard/capabilities/compiler--semantic-pipeline--diagnostic-code-registry/` without a fragment.

## Parse recovery

A successful recovery shows the original mistake as an error and the repair as a quick fix. The word "recovery" does not reach the user. A repair that can change meaning is `maybe-incorrect` and is not preferred.

## Deduplication and mapping

The compiler maps spans in materialized sources (for example generated Corelib or Mod output) back to the authored source before it reports. Project preparation does not report an error that a file-level diagnostic with the same code, file and span covers.

## JSON

`--error-format=json` writes one JSON object per diagnostic per line to standard output (JSON Lines). The schema is stable inside the 0.6 line; fields are only added.
