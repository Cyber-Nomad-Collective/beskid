import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Event declaration

```beskid
type Button {
    event Clicked(i32 x, i32 y);
}
```

## Subscription and raising

```beskid
unit UseButton() {
    let btn = Button {};
    btn.Clicked += (x, y) => {
        Console.WriteLine("clicked at " + x + ", " + y);
    };
    btn.Clicked(10, 20);
}
```

## Capacity hint

```beskid
type LimitedButton {
    event {5} Clicked(i32 x, i32 y);
}
```

## Event in type with other fields

```beskid
type DataSource {
    string name;
    event Changed();

    pub unit Update() {
        Changed();
    }
}
```
