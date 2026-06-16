---
title: Events - Examples
description: Code examples showing event declaration and usage in Beskid.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

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
