import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Block wrapper

```beskid
macro logged (block body) {
    Console.WriteLine("enter");
    $body
    Console.WriteLine("leave");
}

unit Main() {
    logged! {
        Console.WriteLine("work");
    }
}
```

## Expression passthrough

```beskid
macro identity (expression value) {
    $value
}

unit UseIdentity() {
    let x = identity!(1 + 2);
}
```

## Item macro

```beskid
macro defineType (identifier name, block body) {
    type $name {
        $body
    }
}

defineType!(Point, {
    f32 x;
    f32 y;
})
```

## Multiple parameters

```beskid
macro repeat (expression value, literal count) {
    for i in 0..$count {
        $value;
    }
}

unit UseRepeat() {
    repeat!(Console.WriteLine("hello"), 3);
}
```
