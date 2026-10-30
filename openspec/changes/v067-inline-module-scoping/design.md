# Design: inline module scoping (0.6.7)

## Scope chain

The resolver records each module that an inline `mod` declares. A lookup walks from the current module through the enclosing inline modules to the file scope, and stops there. The walk for constants stops at the file scope, so a constant of another unit's module is not a lexical binding. The query layer uses the same chain (`module_scope`, `outer_module_scope`).

## Imports

The resolver keys module-import aliases and import origins by the module scope of the `use`. The query layer registers every `use`, including one inside an inline module, with the inline-module path of its scope. `with_visible_imports` gives the import edges visible at a node: edges of the file scope and of each enclosing inline module, where the nearest scope wins for one binding name. A unit without a `use` inside an inline module sees its edges unchanged. Re-export routes of a unit use only file-scope `pub use` edges.

## Type positions

A local declaration shadows an import of the same name for values. When the local declaration is a module or a function and the import is a type, the resolver records the import beside the declaration. A type position skips bindings that are not types and finds the recorded import. The `use` that supplied the type counts as used.

## Ambiguous qualifier

For `Name.Rest`, the resolver computes the import-alias reading and the inline-module reading. Both reach an item and the items differ: E1104 with the message "ambiguous module `Name`: both the inline module `Name` and the import `Path` declare `Rest`". Only one reaches an item: the path names that item. The query layer returns no declaration for the ambiguous case, so no later stage selects one.

## Duplicates

The staged rule checks functions, out-of-line module declarations and `use` bindings per scope. Tests are left to the resolver, which keys them by module and name and reports E1102.

## Rejected alternative

Forbidding `use` inside inline modules was simpler, because the query layer ignored such a `use`. The capability already says that `use` imports into the current scope, and other languages with nested modules (Rust, C#) scope imports the same way, so the slice implements the scope.

## Relation to v07-name-binding-rulings

That 0.7 change makes the source unit the import and privacy boundary between units. This change scopes a `use` inside one unit to its inline module, which is narrower and does not cross a unit boundary. If the 0.7 work keeps "imports bind per source unit" for inline modules too, it must modify the requirement "Use declarations in inline modules" explicitly. Ruling A1 of that change (one namespace for uniqueness, lookup filtered by type or value position) agrees with "A module never hides a type".
