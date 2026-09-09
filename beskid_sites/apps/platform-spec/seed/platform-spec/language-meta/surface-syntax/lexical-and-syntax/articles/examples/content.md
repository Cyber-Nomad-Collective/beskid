import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Identifiers

```beskid
unit ValidIdentifiers() {
    let foo = 1;
    let _bar = 2;
    let baz123 = 3;
}
```

## Literals

```beskid
unit Literals() {
    let n = 42;
    let f = 3.14;
    let s = "hello";
    let c = 'a';
    let interpolated = "value = ${n}";
}
```

## Comments

```beskid
// This is an ordinary comment

/// This is a documentation comment
unit Documented() { }

//// This is NOT a documentation comment
```

## Generic syntax

```beskid
type Box<T> {
    T value;
}

unit UseGeneric() {
    let b = Box<i32> { value = 42 };
}
```

## Type precedence

```beskid
unit TypePrecedence() {
    // ref (T[]) — ref applies to array
    let arr = ref i32[] {};
}
```
