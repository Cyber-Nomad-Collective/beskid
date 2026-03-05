---
title: "Metaprogramming Semantic Rules (Draft)"
---


This draft tracks semantic diagnostics for metaprogramming features that are outside the v0.1 specification scope.

## Stage 8: Metaprogramming (Attributes + Generators)

### E1801 UnknownAttribute (Error)
- Trigger: attribute application references no declared attribute.
- Source: 08-metaprogramming.

### E1802 AttributeUnknownArgument (Error)
- Trigger: attribute application passes an argument not present in attribute declaration.
- Source: 08-metaprogramming.

### E1803 AttributeMissingRequiredArgument (Error)
- Trigger: required attribute parameter (without default) is not provided.
- Source: 08-metaprogramming.

### E1804 AttributeDuplicateArgument (Error)
- Trigger: same named argument provided more than once in attribute application.
- Source: 08-metaprogramming.

### E1805 AttributeArgumentTypeMismatch (Error)
- Trigger: argument expression type does not match declared parameter type.
- Source: 08-metaprogramming.

### E1806 GeneratorExecutionFailure (Error, planned)
- Trigger: generator evaluation fails or exceeds execution budget.
- Source: 08-metaprogramming.

### E1807 GeneratorSideEffectForbidden (Error, planned)
- Trigger: generator performs forbidden side effects (I/O, network, nondeterministic behavior).
- Source: 08-metaprogramming.

### E1808 GeneratorEmitsForbiddenMutation (Error, planned)
- Trigger: generator attempts in-place mutation of existing source instead of append-only emission.
- Source: 08-metaprogramming.
