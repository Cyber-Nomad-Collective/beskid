## MODIFIED Requirements

### Requirement: Project kind and attribute rules
App/Lib/Test projects MAY declare `macro` items and consume mods. Mod projects MUST NOT declare app `host` graphs. Attribute declarations `attribute Name(targets) { … }` are module items; misuse of targets MUST error (**E1508–E1510**). Metaprogramming effects are compile-time only; expanded/generated AST becomes input to later phases.

An attribute declaration SHALL list its targets from the closed target catalogue of the requirement "Attribute target catalogue". A target name outside the catalogue SHALL be reported as **E1509** at the target identifier, naming the allowed targets. A target listed twice SHALL be reported as **E1508**. An attribute declaration without a target list SHALL accept no site: every use of it SHALL be reported as **E1510**.

#### Scenario: Invalid attribute targets
- **GIVEN** an `attribute` declaration applied to a target kind not listed in its targets
- **WHEN** attribute checking runs
- **THEN** the compiler emits **E1508**, **E1509**, or **E1510**

#### Scenario: Unknown target name in a declaration
- **GIVEN** `pub attribute Tag(Widget) { }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1509** at `Widget` and SHALL list the catalogue names in the help

#### Scenario: Declaration without targets accepts nothing
- **GIVEN** `pub attribute Sealed { }` and `[Sealed] pub type Door { i64 width }`
- **WHEN** the use is checked
- **THEN** the compiler SHALL report **E1510** at `[Sealed]`

## ADDED Requirements

### Requirement: Attribute target catalogue
The attribute target names SHALL be exactly: `ModuleDeclaration`, `TypeDefinition`, `EnumDefinition`, `EnumVariant`, `ContractDefinition`, `ContractMethodSignature`, `ContractAssociatedType`, `ContractEmbedding`, `ImplBlock`, `FunctionDefinition`, `MethodDefinition`, `ReceiverParameter`, `Parameter`, `LambdaExpression`, `LambdaParameter`, `TypeParameter`, `Field`, `LetStatement`, `ConstantDefinition`, `TestDefinition`, `AttributeDeclaration`. Each name SHALL denote the grammar production of the same name in `beskid.pest`, with `MethodDefinition` denoting `ImplMethodDefinition` (in `impl`, `extend type` and inline type bodies) and `ModuleDeclaration` denoting both `ModuleDeclaration` and `InlineModule`. The compiler SHALL expose the catalogue as one ordered list in `beskid_analysis` and the LSP completion inside an `AttributeTargetList` SHALL offer exactly that list.

#### Scenario: Catalogue is the help text of E1509
- **GIVEN** `pub attribute Tag(method) { }`
- **WHEN** the declaration is checked
- **THEN** the compiler SHALL report **E1509** whose help lists `MethodDefinition` among the allowed names

#### Scenario: Serialization Mod targets use catalogue names
- **GIVEN** the serialization Mod declares `Serialize` and `SerializeField`
- **WHEN** the Mod's attribute declarations are loaded
- **THEN** their targets SHALL be `TypeDefinition`, `EnumDefinition` and `Field`, and no **E1509** SHALL be reported

### Requirement: Attributes on every declaration site
The grammar SHALL accept an `AttributeList` immediately before each of these productions: `AttributeDeclaration`, `ImplBlock`, `ConstantDefinition`, `Parameter`, `ReceiverParameter`, `LambdaExpression`, `LambdaParameter`, each identifier of `GenericParameters` (a type parameter), `EnumVariant`, `ContractAssociatedType`, `ContractEmbedding`, `TypedLetStatement` and `InferredLetStatement`, in addition to the sites that accept one today (`ModuleDeclaration`, `InlineModule`, `FunctionDefinition`, `ImplMethodDefinition`, `Field`, `TypeDefinition`, `EnumDefinition`, `ContractDefinition`, `ContractMethodSignature`, `TestDefinition`). A `ReceiverParameter` SHALL be the production `AttributeList? ~ (MutKeyword | MoveKeyword)? ~ "this"` accepted as the optional first entry of a method `ParameterList`; a method without one SHALL keep its implicit receiver. On a lambda the list SHALL precede `LambdaParameters` (`[A] (x) => x + 1`); on a type parameter it SHALL precede the identifier (`<[A] T>`); on a `let` it SHALL precede `mut`, the type or `let`. The syntax model SHALL record the attributes of every site in a field named `attributes`, the formatter SHALL round-trip them at every site in the position stated here, and semantic tokens SHALL tag each attribute name with the attribute token type at every site.

#### Scenario: Attribute on a parameter
- **GIVEN** `pub attribute Trace(Parameter) { }` and `i64 Add([Trace] i64 left, i64 right) { return left + right; }`
- **WHEN** the unit is parsed and formatted
- **THEN** `Add` parses, the first `Parameter` node carries `Trace` in `attributes`, and the formatter emits `[Trace] i64 left` unchanged

#### Scenario: Attribute on a lambda and its parameter
- **GIVEN** `pub attribute Pure(LambdaExpression) { }`, `pub attribute Hot(LambdaParameter) { }` and `let square = [Pure] ([Hot] i64 x) => x * x;`
- **WHEN** the statement is parsed
- **THEN** the `LambdaExpression` node carries `Pure` and its `LambdaParameter` node carries `Hot`

#### Scenario: Attribute on a let binding, a type parameter and an enum variant
- **GIVEN** `pub attribute Pinned(LetStatement) { }`, `pub attribute Any(TypeParameter) { }`, `pub attribute Legacy(EnumVariant) { }`, the statement `[Pinned] mut i64 total = 0;`, the function `unit Keep<[Any] T>(T value) { }` and `pub enum Mode { Fast, [Legacy] Slow }`
- **WHEN** the unit is parsed
- **THEN** every attribute attaches to its node and the formatter round-trips each one

#### Scenario: Attribute on an explicit receiver
- **GIVEN** `pub attribute Receiver(ReceiverParameter) { }` and `pub type Counter { i64 count, pub i64 Read([Receiver] this) { return this.count; } }`
- **WHEN** the type is parsed
- **THEN** the method's `ReceiverParameter` node carries `Receiver` and `this` resolves to the receiver as it does for a method without an explicit receiver

### Requirement: Attribute use target enforcement
Every attribute use SHALL be checked against the target list of the attribute's declaration, and a use on a site whose target name is not listed SHALL be reported as **E1510** at the attribute, naming the attribute, the site's target name and the allowed targets. A use whose name resolves to no attribute declaration and to no compiler-recognized attribute SHALL be reported as **E1510** with the note that no declaration exists. The check SHALL run in the query layer as a legality fact of the unit (the same gate as **E1233**), once per use, and the diagnostic SHALL be reported in `beskid check`, `beskid build` and the LSP.

#### Scenario: Field attribute on a type
- **GIVEN** `pub attribute FluentInner(Field) { }` and `[FluentInner] pub type Wrapper { i64 inner }`
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1510** at `[FluentInner]`, naming the site `TypeDefinition` and the allowed target `Field`

#### Scenario: Correct site is silent
- **GIVEN** the same declaration and `pub type Wrapper { [FluentInner] i64 inner }`
- **WHEN** the legality gate judges the unit
- **THEN** no diagnostic SHALL be reported for the attribute

#### Scenario: Undeclared attribute
- **GIVEN** `[Frozen] pub type Ice { i64 temperature }` with no declaration of `Frozen` in scope
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1510** at `[Frozen]` noting that no declaration exists

### Requirement: Compiler-recognized attributes declare their targets in corelib
Each attribute the compiler recognizes by name SHALL have a corelib declaration with a target list, and the compiler SHALL enforce that list like any user declaration: `Export(FunctionDefinition, MethodDefinition)`, `Extern(ContractDefinition)`, `Runtime(FunctionDefinition)`, `CompilerDerived(ContractDefinition)`, `Immutable(TypeDefinition)`, `Isolated(TypeDefinition)`, `Copyable(TypeDefinition)`, `NeverTransferable(TypeDefinition)`, `ImmutableStorage(Field)`, `Captures(Parameter)`. Recognition SHALL be by the attribute's simple name resolved to its corelib declaration; a user declaration of the same simple name in another module SHALL NOT be recognized and SHALL be an ordinary attribute.

#### Scenario: Extern on a function keeps E1510
- **GIVEN** `[Extern(Abi:"C", Library:"libc")] pub i64 Getpid() { return 0; }`
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1510** at the attribute, naming the allowed target `ContractDefinition`

#### Scenario: Immutable on a field is rejected
- **GIVEN** `pub type Point { [Immutable] i64 x, i64 y }`
- **WHEN** the legality gate judges the unit
- **THEN** the compiler SHALL report **E1510** naming the allowed target `TypeDefinition`

#### Scenario: Shadowing declaration is not recognized
- **GIVEN** a user module declaring `pub attribute Immutable(Field) { }` and `pub type Point { [Immutable] i64 x }` under that module's `use`
- **WHEN** the unit is checked
- **THEN** no **E1510** SHALL be reported and the type SHALL NOT be classified Shared by the user attribute
