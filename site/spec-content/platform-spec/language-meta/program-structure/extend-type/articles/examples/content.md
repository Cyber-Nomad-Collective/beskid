---
title: extend type - Examples
description: Code examples showing extend type usage in Beskid.
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

## Basic extension

```beskid
type Point {
    f32 x;
    f32 y;
}

extend type Point {
    pub f32 DistanceTo(Point other) {
        let dx = x - other.x;
        let dy = y - other.y;
        return dx * dx + dy * dy;
    }
}
```

## Multiple extensions

```beskid
extend type Point {
    pub unit Translate(f32 dx, f32 dy) {
        x += dx;
        y += dy;
    }
}

extend type Point {
    pub string ToString() {
        return "(" + x + ", " + y + ")";
    }
}
```

## Extension with access to public members

```beskid
type Counter {
    i32 value;

    pub i32 GetValue() {
        return value;
    }
}

extend type Counter {
    pub unit Reset() {
        value = 0;   // OK — value is public
    }
}
```
