import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />



This article collects **examples** for **Analysis, query, and diagnostics facades** (informative sketches aligned with contracts).

## Example A — Descendants and parent (informative)

```beskid
// Find first function under program; walk to enclosing module item.
let query = Beskid.Compiler.Query.AtProgram(program);
let funcRef = Beskid.Compiler.Query.FindFirst(query, Beskid.Syntax.Nodes.NodeKind.FunctionDefinition);
if funcRef is some(ref) {
    let parent = Beskid.Compiler.Query.Parent(ref);
    // parent is NodeRef of enclosing item, not a variant match on enum Node
}
```

## Example B — Minimal diagnostic query
A compile-time module reads a syntax attribute using `OfKind` + `AsAttributeDeclaration`, then emits a diagnostic without mutating syntax.

## Example C — Emitter sketch
A contributor constructs a new method declaration through `Beskid.Compiler.Emit`, attaches trivia, and registers it with the incremental graph.

> Executable snippets will track the reference implementation as mod host execution lands in the compiler; until then, treat these as specification fixtures.
