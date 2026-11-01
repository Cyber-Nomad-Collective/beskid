## Why

The S8b Corelib work found four defects in inline `mod Name { ... }` blocks:

- A file-level `const` is not visible inside an inline module (E1101), although file-level functions, types and `use` imports are.
- A module with the name of an imported type hides that type in type positions of the whole file, with no diagnostic (E1201). `use Http2.HpackEncoder;` imports the type `Encoder`; `mod Encoder { }` in the same file makes `Encoder e` unknown everywhere.
- The duplicate-name rule for functions, `use` and module declarations compares names over the whole file. The name-resolution capability says "in the same scope".
- Two tests of one name in one module report E1006 and E1102. The `v067-test-namespace` change specifies E1102 only.
- A duplicate type, enum or contract name in one scope reports E1001 from the staged rule and E1102 from the resolver.

The probes also showed that a `use` inside an inline module has no effect in the semantic query layer, and that `mod Random { pub i64 New() }` next to `use Core.Random;` makes `Random.New()` silently call the imported function.

## What Changes

- An inline module is a lexical scope. Constants, `use` bindings, functions and types of a scope are visible in the inline modules nested in it. An inner binding shadows an outer binding of the same name in the inner scope only.
- A `use` inside an inline module binds in that module and its nested modules only.
- Duplicate names are compared per scope: the file scope or one inline module. Every duplicate of a function, type, enum, contract, `use` alias, module declaration, constant or test in one scope is one diagnostic, E1102. E1001 and E1006 are retired.
- A type position sees only types, enums, contracts and generic parameters. A module or function of the same name does not hide an imported type.
- A qualified path whose first segment names an inline module and a `use` alias, where each one reaches a different item, is E1104 "ambiguous module". The compiler does not select one of the two items.

## Capabilities

### Modified Capabilities
- `language-meta--program-structure--name-resolution`
- `compiler--semantic-pipeline--diagnostic-code-registry`
- `language-meta--type-system--types`

## Impact

Resolver collection and lookup (`beskid_analysis::resolve`), the staged duplicate rule, the semantic query layer (constants, import registration with scopes, qualified call and type resolution). No new diagnostic code: the ambiguity uses E1104 with its own message. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Code that relied on the import winning over a same-named inline module that declares the same member now fails with E1104. Corelib uses neither form. There is no compatibility path.
