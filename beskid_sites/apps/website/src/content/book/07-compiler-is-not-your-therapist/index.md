---
title: "The compiler is not your therapist"
description: The language itself. Enough syntax, types, and diagnostics to read real Beskid and know why the analyzer is mad.
tableOfContents: true
---

You have a manifest, modules, and imports. Now the compiler wants to talk about types. This is the relationship where one side sets boundaries and the other side learns to live with them, and unlike the workplace version, this one comes with line numbers.

Here is a program that uses most of what the chapter covers.

```beskid
use Core.Output;
use Core.Optional;

enum Shape {
    Circle(f64 radius),
    Rect(f64 width, f64 height),
}

f64 Area(Shape shape) {
    return match shape {
        Shape::Circle(r) => 3.14159 * r * r,
        Shape::Rect(w, h) => w * h,
    };
}

Option<Shape> Parse(string kind, f64 a, f64 b) {
    return match kind {
        "circle" => Option::Some(Shape::Circle(a)),
        "rect"   => Option::Some(Shape::Rect(a, b)),
        _        => Option::None,
    };
}

unit Main() {
    Option<Shape> parsed = Parse("rect", 2.0, 3.5);
    string report = match parsed {
        Option::Some(shape) => "area = ${Area(shape)}",
        Option::None        => "unknown shape",
    };
    Output.WriteLine(report);
}
```

Nothing in there is exotic. Enums carry data. `match` is an expression and has to cover every case. Absence is `Option<T>`, not `null`, and the compiler will not let you call `Area` on a value that might not be there. Strings interpolate with `${}`. Functions are written return-type-first, C style, because the return type is the thing a reader wants to know before the name.

The rest of the chapter takes those pieces one at a time: the lexical rules and literals, types and generics, `Option`, functions and methods on types, control flow, and finally how to read the diagnostic when you get one wrong. The exact grammar is the standard's [surface syntax](/platform-spec/language-meta/surface-syntax/) and [type system](/platform-spec/language-meta/type-system/) areas. This chapter is the version with opinions.
