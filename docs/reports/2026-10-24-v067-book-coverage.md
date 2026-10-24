# Book coverage of the Beskid grammar, 0.6.7

Date: 2026-10-24. Slice: docs (v0.6.7 program).

## Method

- Grammar: `beskid.pest` of the parse worktree (`~/.codex/worktrees/v067-parse`, branch `v067/parse`, commit `ac14b891`: string escapes and `*=`, `/=`, `%=` are in; the conditional expression `cond ? a : b` is not in the grammar yet). Every user-visible rule is listed below. Silent helper rules (`Kw*Word`, `*Scan`, `*Body`, `DocGap`, `WHITESPACE`) carry no feature and are not listed.
- Book: `site/website/src/content/docs/book/` after this slice (chapters 00 to 22, plus the new 07a and 11a). The scan covered prose, `beskid` code blocks and headings of every page, not only chapter titles.
- Rank: how often a learner meets the feature. A: in nearly every program. B: in most programs of a few hundred lines. C: when a program grows (library code, tests, concurrency). D: rare, specialised or compiler-facing. Ranks were set by judgement and checked against how often the feature appears in Corelib and in `crates/beskid_e2e_tests/fixtures`.
- Depth: **Full** (explained, with a compilable example), **Partial** (shown or described, but incomplete or only in passing), **Mention** (named, or linked out to the Standard, with no teaching), **None** (not in the Book).

## Result in one paragraph

The Book teaches the toolchain, the project model and the surrounding platform in depth, and the language very little. Of 53 feature rows below, 12 are Full, 11 Partial, 11 Mention and 19 None. Of the 22 rank A rows (the features of nearly every program), 13 are Mention or None: the Book has no page that explains operators, literals, loops, assignment or the primitive types, and chapter 07 (`control-flow`, `lexical-basics`) defers to the Standard. The two chapters added in this slice close generics (07a) and hosts (11a). The largest remaining gap is a language tour between chapter 06 and chapter 07 that takes a reader from `i32 Main()` to a program with a loop, a struct, an enum, a `match` and a test. See "Recommended next pages".

## Ranked inventory

| Rank | Feature | Grammar rules | Teaches it (depth) | Gap or note |
| --- | --- | --- | --- | --- |
| A | Function definition: return type first, parameters, `return` | `FunctionDefinition`, `Parameter`, `ParameterList`, `ReturnStatement`, `Block` | 07 functions-and-methods (Partial), 07a type-parameters (Partial) | No page explains the declaration form on its own; the sketch is labelled "illustrative". `Main` and its return code are in 01 first-smoke-test only as `unit Main()`. |
| A | Local bindings: `let x = e;`, `T x = e;`, `mut`, default immutability | `LetStatement`, `TypedLetStatement`, `InferredLetStatement`, `LetKeyword`, `MutKeyword` | 07 types-and-generics (Mention, one bullet), 07a (Partial, used) | No explanation of immutable by default or of E1214. The 07 bullet lists `let mut x`; the grammar writes `let mut x = e;` and `mut T x = e;`. |
| A | Primitive types `i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 bool char string unit never pointer word` | `PrimitiveType` | None as a list; 10 and 21 mention `pointer` and `word` | No page gives the list or the integer widths. |
| A | Integer and float literals, hex, `_` separators, width suffixes (`7_i64`, `1.5_f32`) | `IntegerLiteral`, `FloatLiteral`, `DecimalIntegerBody`, `HexIntegerBody` | 07 lexical-basics (Mention, links out) | None teaches the suffixes, which 07a now relies on. |
| A | String literals and interpolation `"${expr}"` | `StringLiteral`, `StringInterpolation`, `StringText` | 07a and 11a (used, one sentence in 07a) | No page explains interpolation. Add to the language tour. |
| A | String escapes `\n \t \r \0 \u{...}` (new in 0.6.7), `\"`, `\\`, `\${` | `StringEscape` | None | New feature; E0109 and E0110 for bad escapes. |
| A | Boolean literals and unit `()` | `Literal` | None | |
| A | Arithmetic, comparison, logical operators | `AdditionExpression`, `MultiplicationExpression`, `ShiftExpression`, `ComparisonExpression`, `LogicalAndExpression`, `LogicalOrExpression`, `PrefixUnary` | None | No operator table. |
| A | Equality `==`, `!=` and identity `===`, `!==` | `EqualityExpression` | None (the reference page `semantic-rules` mentions `===`) | List.Contains and Map keys depend on the `==` rule (value for primitives and strings, identity otherwise); 07a states it. |
| A | Assignment `=` and compound `+=`, `-=`, `*=`, `/=`, `%=` (the last three new in 0.6.7) | `AssignmentExpression`, `AssignmentOperator` | None | |
| A | `if` and `else if` | `IfStatement`, `ElsePart` | 07 control-flow (Mention, no example) | 0.6.7 style: parenthesised condition, brace on the next line. |
| A | `while` | `WhileStatement` | None | |
| A | `for x in iterable` | `ForStatement` | None | Iterates arrays (see the `nested_array_types` fixture). |
| A | `break`, `continue` | `BreakStatement`, `ContinueStatement` | None | |
| A | Calls, member access, subscripts | `CallOperator`, `MemberAccess`, `SubscriptOperator`, `PostfixExpression` | 07 functions-and-methods (Partial) | |
| A | Comments: `//`, `/* */`, `////` | `OrdinaryLineComment`, `BlockComment`, `FourSlashLineComment` | 07 lexical-basics (Mention) | |
| A | `use` and `mod`, file-scoped and inline modules | `UseDeclaration`, `ModuleDeclaration`, `InlineModule`, `Path` | 04 module-layout, 05 import-syntax (Full) | |
| A | `pub` visibility | `Visibility` | 04 visibility-basics, 19 pub-boundaries (Full) | |
| A | Arrays `T[]` and array literals `[a, b]` | `ArrayType`, `ArraySuffix`, `ArrayLiteralExpression` | 07a generic-collections (Partial) | No page for arrays proper. |
| A | `type` declarations: fields, methods, `this` | `TypeDefinition`, `TypeBody`, `FieldList`, `Field`, `ValueField`, `ImplMethodDefinition`, `ReceiverParameter` | 07 types-and-generics (Mention), 07a type-parameters (Partial) | Fields are comma-separated, not semicolon-separated. No page teaches a plain `type`. |
| A | Struct literals `T { a: x }` | `StructLiteralExpression`, `FieldValueList`, `FieldValue` | 07a type-parameters (Partial) | The rule that a literal is not allowed in a condition position is not taught (parenthesise it). |
| A | `enum` and `match` with patterns | `EnumDefinition`, `EnumVariant`, `EnumConstructorExpression`, `MatchExpression`, `MatchArm`, `Pattern`, `EnumPattern` | 07 control-flow (Mention), 07 option-and-nullability (Partial), 07a type-parameters (Partial) | |
| B | `Option<T>` and `Result<T, E>` | library, `EnumPath` | 07 option-and-nullability (Full), 09 errors-and-results (Full) | |
| B | Postfix `?` | `TryOperator` | 09 errors-and-results (Partial) | |
| B | Generics: type parameters, explicit arguments, inference | `GenericParameters`, `GenericArguments`, `TypeParameter` | **07a (Full, new)**, 07 types-and-generics (Mention) | Closed by this slice. |
| B | `where` bounds | `WhereClause`, `TypeBound` | **07a where-bounds (Full, new)** | Closed. |
| B | Contracts: declaration, embedding, `type X : C` conformance | `ContractDefinition`, `ContractMethodSignature`, `ContractEmbedding`, `TypeConformanceList`, `ImplConformanceList` | 09 contracts-in-source (Partial) | **Stale example**: the page writes `contract ReadWrite : Readable`; the grammar has no conformance list on a contract (embedding is a line `Readable;` inside the body). The page also uses `ref u8`, which is not in the grammar. |
| B | Lambdas and function types | `LambdaExpression`, `LambdaParameters`, `ArrowFunctionType`, `FunctionType` | 07 functions-and-methods (Full) | |
| B | Constants `const NAME = 1;` | `ConstantDefinition` | None | Integer literals only. |
| B | `test` items, `meta`, `skip` | `TestDefinition`, `TestMetaSection`, `TestSkipSection` | 08 test-items-in-source (Full) | |
| B | Doc comments `///` and `@arg` | `DocLineContent`, `DocRun` | 20 (Full), 07 lexical-basics (Mention) | |
| B | Attributes on items `[Name(arg: value)]` | `AttributeList`, `Attribute`, `AttributeArgumentList` | 15 mod-sdk, 16 (Mention) | No page teaches using an attribute such as `[Serialize]` or `[Isolated]` from the reader's side. |
| B | `mut` parameters and `mut this` receivers | `Parameter`, `ReceiverParameter`, `MutKeyword` | 07a generic-collections (Partial) | Collections change in place in 0.6.7; the Book has no page on `mut` parameters. |
| B | `bulk T[]` parameters | `BulkKeyword` | 07a inference-at-call-sites (Partial) | |
| B | `extend type` and `impl` blocks | `ExtendTypeDefinition`, `ImplBlock` | 07a where-bounds (Mention), 04 visibility-basics (Mention) | |
| B | `host`, `registry`, `scope`, `inject`, `launch`, `with`, `startup`, `init`, `dispose` | `HostDefinition`, `RegistryBlock`, `RegistryEntry`, `ScopeDefinition`, `ScopeHook`, `InjectField`, `InjectQualifier`, `LaunchStatement`, `WithStatement`, `RegistrationLifetime`, `RegistrationTarget`, `HostBodyItem` | **11a (Full, new)** | Closed. Hook execution and `ConsoleHost` need integration checks (see the progress file). |
| C | `spawn` | `SpawnUnary` | 11 fibers-and-spawn (Full) | One paragraph on `spawn F(x)` versus `spawn (() => F(x))` added in this slice. |
| C | `move x` (isolate crossings only after the 0.6.7 ruling) | `MoveKeyword`, `MoveExpression` | None (07a mentions `move` once, as absent) | Needs a page after the memory chapter is rewritten for the ruling; the `v067-move-at-isolate-boundary` change is the source. |
| C | Associated types in contracts, `This` | `ContractAssociatedType`, `AssociatedTypeBinding`, `AssociatedTypeRef`, `ThisType` | None | Used by `Iterator<T>` in Corelib. |
| C | Scoped `use` bindings (`use T x = e;`, `use (T x = e) { ... }`) and `Disposable` | `ScopedUseStatement`, `ScopedUseBinding` | 09 mentions `Disposable`; 11a hooks contrasts it | No page teaches scoped cleanup. |
| C | Block expressions and grouped expressions | `BlockExpression`, `GroupedExpression` | None | |
| D | `event` fields and `+=` / `-=` subscription | `EventField`, `EventCapacity` | None | `event` does not appear anywhere in the Book. |
| D | `try { } catch (e) { }` block | `TryBlockExpression` | None (09 panic-vs-contract discusses panic) | |
| D | Macro definitions and invocations `name!(...)` | `MacroDefinition`, `MacroInvocation`, `MacroParameter`, `MacroMetavariable` | 15 (Mention) | |
| D | `code` fenced literals with `@{ }` holes | `CodeExpression`, `CodeFence`, `CodeHole` | reference only (Mention) | Mod authors only. |
| D | `clif { }` blocks | `ClifBlockExpression` | reference only (Mention) | Compiler contributors only. |
| D | `attribute` declarations | `AttributeDeclaration`, `AttributeTargetList`, `AttributeParameter` | 15 mod-sdk (Mention) | |
| D | `async` and `await` reserved words | `AsyncKeyword`, `AwaitKeyword` | 11 index (Full: compile errors) | |
| D | `extern` and FFI declarations | parsed through attributes and `extern` items of 21 | 21 (Full) | Not a separate pest rule. |
| D | `range(a, b)` | `RangeExpression` | None | **Open question**: no other rule references `RangeExpression`; see "Observations". |
| D | Character literals `'a'`, `'\n'` | `CharLiteral` | 21 (Mention) | `'\n'` does not parse yet (parse slice). |
| D | Conditional expression `cond ? a : b` (0.6.7, slices parse and sem) | not in the grammar at this commit | None | Add to the operators page once the grammar lands. |
| D | `pointer`, `word`, `never` types | `PrimitiveType` | 10, 21 (Mention) | |

(Rows of the same family are merged where one page would teach them together, which is why the table has fewer rows than rules.)

## Counts

| Rank | Full | Partial | Mention | None |
| --- | --- | --- | --- | --- |
| A | 2 | 7 | 3 | 10 |
| B | 7 | 4 | 2 | 1 |
| C | 1 | 0 | 0 | 4 |
| D | 2 | 0 | 6 | 4 |
| All | 12 | 11 | 11 | 19 |

Rows were counted from the table by the strongest depth named in the "Teaches it" column; the Full rows that this slice added (generics, `where` bounds, hosts) are included.

## Observations from the walk

1. **Stale Book examples.** `09-contracts-effects-and-polite-threats/contracts-in-source` writes `contract ReadWrite : Readable { i32 Write(ref u8 buffer); }`. The grammar has no `: Base` after a contract name and no `ref` modifier on parameters. `10-memory-without-billion-dollar-mistake/ownership-preview` lists `ref` and `out` as Beskid expressions of aliasing. Neither keyword is in the grammar. These pages need a pass against the 0.6.7 grammar and the 0.6.7 ownership ruling.
2. **Brace style.** Chapters 07 to 11 and the Corelib examples use K&R braces. The 0.6.7 style is Allman with parenthesised conditions. The Book reformat (slice fmt, wave 3) will move them; the two new chapters already follow it.
3. **`RangeExpression`.** The rule is defined and mapped in `rule_words.rs`, but no production in `beskid.pest` references it, so `for i in range(0, n)` is not a `RangeExpression` today. Decide whether it is dead or intended before the Book teaches loops.
4. **`ConsoleHost`.** The Standard and its examples use `: ConsoleHost`, which Corelib 0.6.7 does not ship; the parse tests that use it only check `E1701` and `E1711`. Chapter 11a says so.
5. **Fixtures use the old `if cond {` style.** `crates/beskid_e2e_tests/fixtures/*` omit parentheses. They are valid, since the parentheses form a grouped expression, but the Book style is the parenthesised one.
6. **Hooks.** `startup`, `init` and `dispose` bodies are validated by composition analysis and the codegen plan; the e2e fixture for composition (`composition_app`) launches a host with an empty registry only. Run the 11a examples at integration before treating hook execution as verified.

## Recommended next pages

In order of the rank A rows each closes:

1. **A language tour** (new chapter between 06 and 07, or a rewrite of 07 lexical-basics and control-flow): literals and suffixes, strings and interpolation, escapes, operators, assignment and compound assignment, the conditional expression, `if`, `while`, `for`, `break`, `continue`, arrays. Closes the rank A rows on literals, strings, operators, assignment, `if`, `while`, `for`, `break`, `continue` and comments.
2. **Types, structs and enums** (rewrite of 07 types-and-generics): primitives, `type` with fields and methods, struct literals, `enum`, `match` with guards, `const`. Closes the rank A rows on primitive types, `type`, struct literals, `enum`, `match`, and the rank B row on `const`.
3. **Contracts rewritten against the grammar** (09): fix the embedding and parameter syntax; add associated types and `This`.
4. **`mut`, `move` and copy on assignment** (10, after the move-at-isolate-boundary ruling lands): `mut` parameters and receivers, `List` copy on assignment, `move` at isolate crossings.
5. **Attributes from the reader's side** (new page in 16): `[Serialize]`, `[Isolated]`, `[CopyOnAssign]`.
6. **Events, `try`/`catch`, scoped `use`** (one page in 09 or 10).

## Changes made in this slice

- New chapters `07a-generics-write-it-once` and `11a-hosts-and-native-ioc`, with `nav.order.json`, the tutorial index, the spec map and the 07 and 11 pages updated.
- Chapter 11 fibers-and-spawn: paragraph on `spawn F(x)` versus the closure form (owner triage, 2026-10-24).
