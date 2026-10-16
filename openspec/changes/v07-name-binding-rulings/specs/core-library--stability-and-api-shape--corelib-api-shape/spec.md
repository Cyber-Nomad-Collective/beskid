## REMOVED Requirements

### Requirement: Design model: Prelude exposure rules [core-library/stability-and-api-shape/corelib-api-shape/articles/design-model]
**Reason**: D-TOOL-MAN-0006 ("explicit use, no prelude") superseded the prelude on 2026-06-07. There is no aggregate prelude, so a rule about what it re-exports has nothing to govern. Neither resolver implements a prelude.

**Migration**: None. Modules are reached through explicit `use` declarations or fully qualified paths; tier policy applies to the modules an author imports.
