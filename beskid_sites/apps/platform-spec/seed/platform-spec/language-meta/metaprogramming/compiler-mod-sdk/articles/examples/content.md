import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Collector contract

```beskid
contract Collector {
    unit Collect(Beskid.Syntax.Nodes.Node root);
}
```

## Generator contract

```beskid
contract Generator {
    Beskid.Syntax.Nodes.Node[] Generate(Beskid.Syntax.Nodes.Node target);
}
```

## Analyzer contract

```beskid
contract Analyzer {
    Beskid.Compiler.Diagnostic[] Analyze(Beskid.Syntax.Nodes.Node target);
}
```

## Rewriter contract

```beskid
contract Rewriter<TSource, TTarget> {
    Core.Results.Result<TTarget, FixError> Rewrite(TSource sourceNode);
}
```

## AttributeGenerator contract

```beskid
contract AttributeGenerator {
    string[] SupportedTargets();
    unit GenerateAttribute(string target, Beskid.Syntax.Nodes.Node node);
}
```
