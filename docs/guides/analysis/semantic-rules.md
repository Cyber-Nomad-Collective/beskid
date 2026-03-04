---
description: Beskid Semantic Rules Catalog
---

# Semantic Rules Catalog

This document enumerates semantic rules derived from the language spec. Rules are grouped by stage to enable incremental implementation. Each rule includes a code, severity, and intent. Adjust codes as needed.

## Stage 0: Definition & Signature Collection
### E1001 DuplicateTypeName (Error)
- Trigger: two `type`/`enum`/`contract` items share the same name in a module.
- Source: 02-types, 09-contracts, 10-name-resolution.

### E1002 DuplicateEnumVariant (Error)
- Trigger: enum defines the same variant name twice.
- Source: 04-enums-and-match.

### E1003 DuplicateContractMethod (Error)
- Trigger: contract defines duplicate method signatures.
- Source: 09-contracts.

### E1004 ConflictingEmbeddedContract (Error)
- Trigger: embedded contracts introduce conflicting methods (same name, incompatible signature).
- Source: 09-contracts (conflict example).

### E1005 UnknownTypeInDefinition (Error)
- Trigger: field/parameter types reference unknown type names.
- Source: 02-types, 10-name-resolution.

### E1006 DuplicateItemName (Error)
- Trigger: duplicate function/module/use item name in the same module scope.
- Source: 10-name-resolution.

## Stage 1: Name Resolution & Scopes
### E1101 UndefinedVariable (Error)
- Trigger: identifier used in expression has no binding in scope.
- Source: 10-name-resolution.

### E1102 DuplicateBinding (Error)
- Trigger: `let`/parameter binding duplicates a name in the same scope.
- Source: 10-name-resolution.

### W1103 ShadowingBinding (Warning)
- Trigger: binding shadows a name from an outer scope.
- Source: 10-name-resolution.

### E1104 AmbiguousImport (Error)
- Trigger: two `use` imports bring the same name without aliasing.
- Source: 10-name-resolution (ambiguous import error).

### E1105 UnknownImportPath (Error)
- Trigger: `use` path does not resolve to a module/item.
- Source: 06-modules-and-visibility, 10-name-resolution.

### E1106 UseBeforeDeclaration (Error)
- Trigger: use of local binding before its declaration (if enforced).
- Source: 10-name-resolution (lexical scopes).

## Stage 2: Types & Expressions
### E1201 UnknownTypeName (Error)
- Trigger: type annotation refers to non-existent type.
- Source: 02-types.

### E1202 TypeInferenceFailure (Error)
- Trigger: cannot infer local/private function return type (multiple incompatible returns).
- Source: 11-type-inference.

### E1203 PublicReturnTypeMissing (Error)
- Trigger: public function missing explicit return type.
- Source: 11-type-inference.

### E1204 CallArgumentCountMismatch (Error)
- Trigger: call has wrong number of arguments.
- Source: 01-lexical-and-syntax, 02-types.

### E1205 CallArgumentTypeMismatch (Error)
- Trigger: argument type not assignable to parameter type.
- Source: 02-types.

### E1206 AssignmentTypeMismatch (Error)
- Trigger: RHS not assignable to LHS type.
- Source: 02-types.

### E1207 ReturnTypeMismatch (Error)
- Trigger: return expression type does not match function return type.
- Source: 02-types.

### E1208 NonBooleanCondition (Error)
- Trigger: `if`/`while` condition is not `bool`.
- Source: 05-control-flow.

### E1209 BinaryOperatorTypeMismatch (Error)
- Trigger: binary operator operands are incompatible.
- Source: 02-types.

### E1210 UnaryOperatorTypeMismatch (Error)
- Trigger: unary operator applied to invalid type.
- Source: 02-types.

### E1211 StructLiteralUnknownField (Error)
- Trigger: struct literal includes unknown field.
- Source: 02-types.

### E1212 StructLiteralMissingField (Error)
- Trigger: struct literal omits required fields.
- Source: 02-types.

### E1213 FieldAccessOnNonStruct (Error)
- Trigger: member access on non-struct value.
- Source: 02-types.

### E1214 ImmutableAssignment (Error)
- Trigger: assignment to immutable binding (missing `mut`).
- Source: 02-types (mutability rules).

### E1215 UseAfterMove (Error)
- Trigger: value used after move (non-copy type).
- Source: 02-types (move semantics).

### E1216 EqualityTypeMismatch (Error)
- Trigger: `==` operands are not comparable or have incompatible types.
- Source: 02-types (equality semantics).

### E1217 IdentityOnNonReference (Error)
- Trigger: `===` used on non-reference operands.
- Source: 02-types (reference identity).

### E1218 OutArgumentNotMutable (Error)
- Trigger: `out` argument is not a mutable binding.
- Source: 03-memory-and-references.

### E1219 RefOutArgumentNotLValue (Error)
- Trigger: `ref`/`out` arguments are not assignable lvalues.
- Source: 03-memory-and-references.

## Stage 3: Enums, Match, Patterns
### E1301 UnknownEnumPath (Error)
- Trigger: enum constructor references unknown enum/variant.
- Source: 04-enums-and-match.

### E1302 EnumConstructorArityMismatch (Error)
- Trigger: enum constructor called with wrong number of arguments.
- Source: 04-enums-and-match.

### E1303 UnqualifiedEnumConstructor (Error)
- Trigger: enum constructor invoked without `Enum::` qualifier.
- Source: 04-enums-and-match.

### E1304 MatchNonExhaustive (Error)
- Trigger: match does not cover all variants (and no `_`).
- Source: 04-enums-and-match.

### E1305 MatchArmTypeMismatch (Error)
- Trigger: match arm expression types differ.
- Source: 04-enums-and-match.

### E1306 DuplicatePatternBinding (Error)
- Trigger: pattern binds same name multiple times.
- Source: 04-enums-and-match.

### E1307 PatternArityMismatch (Error)
- Trigger: enum pattern has wrong number of subpatterns.
- Source: 04-enums-and-match.

### E1308 GuardTypeMismatch (Error)
- Trigger: `when` guard is not `bool`.
- Source: 04-enums-and-match.

## Stage 4: Control Flow
### E1401 BreakOutsideLoop (Error)
- Trigger: `break` used outside loop.
- Source: 05-control-flow.

### E1402 ContinueOutsideLoop (Error)
- Trigger: `continue` used outside loop.
- Source: 05-control-flow.

### W1403 UnreachableCode (Warning)
- Trigger: statement after `return`/`break`/`continue` in same block.
- Source: 05-control-flow.

## Stage 5: Modules & Visibility
### E1501 VisibilityViolation (Error)
- Trigger: access to non-`pub` item from another module.
- Source: 06-modules-and-visibility.

### E1502 ModuleNotFound (Error)
- Trigger: `mod` declaration refers to a missing module file.
- Source: 06-modules-and-visibility.

### W1503 UnusedImport (Warning)
- Trigger: `use` path never referenced.
- Source: 06-modules-and-visibility.

### W1504 UnusedPrivateItem (Warning)
- Trigger: private item declared but never used in module.
- Source: 06-modules-and-visibility.

## Stage 6: Contracts & Methods
### E1601 ContractMethodMissingImpl (Error)
- Trigger: an explicitly declared `type Type : Contract` conformance is missing one or more required contract methods in `impl Type` blocks.
- Source: 09-contracts.

### E1602 ContractImplSignatureMismatch (Error)
- Trigger: method implementation in `impl Type` for a declared `type Type : Contract` conformance does not match contract signature.
- Source: 09-contracts.

### E1603 MethodDispatchAmbiguous (Error)
- Trigger: overloaded methods resolve ambiguously.
- Source: 12-method-dispatch.

### E1604 InvalidContractReceiver (Error)
- Trigger: `ref` receiver does not satisfy contract method set.
- Source: 12-method-dispatch.

### E1605 MethodLookupWithAliasFailure (Error)
- Trigger: method resolution fails due to alias target mismatch.
- Source: 12-method-dispatch, 10-name-resolution.

### E1606 MethodNotFound (Error)
- Trigger: method call cannot be resolved for receiver type.
- Source: 12-method-dispatch.

### E1607 ContractNotSatisfied (Error)
- Trigger: value typed as contract has no explicit conformance declaration (`type Type : Contract`) for the required contract.
- Source: 09-contracts, 12-method-dispatch.

## Stage 7: Error Handling
### E1701 QuestionOnNonResult (Error)
- Trigger: `?` used on non-`Result` type.
- Source: 07-error-handling.

### E1702 QuestionTypeMismatch (Error)
- Trigger: `?` used where error type is incompatible with function return type.
- Source: 07-error-handling.

### E1703 QuestionOutsideFunction (Error)
- Trigger: `?` used outside a function body.
- Source: 07-error-handling.

## Stage 8: Attributes
### E1801 UnknownAttribute (Error)
- Trigger: attribute application references no declared attribute.
- Source: 01-lexical-and-syntax.

### E1802 AttributeUnknownArgument (Error)
- Trigger: attribute application passes an argument not present in attribute declaration.
- Source: 01-lexical-and-syntax.

### E1803 AttributeMissingRequiredArgument (Error)
- Trigger: required attribute parameter (without default) is not provided.
- Source: 01-lexical-and-syntax.

### E1804 AttributeDuplicateArgument (Error)
- Trigger: same named argument provided more than once in attribute application.
- Source: 01-lexical-and-syntax.

### E1805 AttributeArgumentTypeMismatch (Error)
- Trigger: argument expression type does not match declared parameter type.
- Source: 01-lexical-and-syntax.

### E1806 DuplicateAttributeDeclarationTarget (Error)
- Trigger: attribute declaration target list repeats the same target kind more than once.
- Source: 01-lexical-and-syntax.

### E1807 UnknownAttributeDeclarationTarget (Error)
- Trigger: attribute declaration target list uses an unsupported target kind.
- Source: 01-lexical-and-syntax.

### E1809 AttributeTargetNotAllowed (Error)
- Trigger: attribute application site node kind is not included in attribute declaration target list.
- Source: 01-lexical-and-syntax.

## Drafted stage (out of v0.1 scope)
- Generator-specific metaprogramming diagnostics are tracked in:
  `docs/guides/drafts/metaprogramming/semantic-rules.md`.

## Notes
- Rules marked Warning can be toggled via `AnalysisOptions`.
- Some rules (question operator) may be deferred if v0.1 parser/AST doesn’t yet support them.
