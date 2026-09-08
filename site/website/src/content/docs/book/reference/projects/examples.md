---
title: "Project Examples"
description: Beskid project examples in BSOL.
---


## Example 1: Single-project app
```
MyApp/
├── App.bproj
└── Src/
    └── Main.bd
```

**App.bproj**
```text
project {
  name    = "MyApp"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = App
  entry = "Main.bd"
}
```

## Example 2: App with local dependency
```
Workspace/
├── App/
│   ├── App.bproj
│   └── Src/
│       └── Main.bd
└── Std/
    ├── App.bproj
    └── Src/
        └── IO.bd
```

**App/App.bproj**
```text
project {
  name    = "App"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = App
  entry = "Main.bd"
}

dependency "Std" {
  source = path
  path   = "../Std"
}
```

**Std/App.bproj**
```text
project {
  name    = "Std"
  version = "0.1.0"
  root    = "Src"
}

target "Library" {
  kind  = Lib
  entry = "IO.bd"
}
```

## Example 3: Nested module layout
```
NetLib/
├── App.bproj
└── Src/
    ├── Net.bd
    └── Net/
        └── Http.bd
```

**App.bproj**
```text
project {
  name    = "NetLib"
  version = "0.1.0"
  root    = "Src"
}

target "Library" {
  kind  = Lib
  entry = "Net.bd"
}
```

**Src/Net.bd**
```beskid
pub mod Http;
```

**Src/Net/Http.bd**
```beskid
pub type Client { ... }
```

## Example 4: Multiple targets
```
Project/
├── App.bproj
└── Src/
    ├── Main.bd
    └── Tests.bd
```

```text
project {
  name    = "Project"
  version = "0.2.0"
  root    = "Src"
}

target "App" {
  kind  = App
  entry = "Main.bd"
}

target "Tests" {
  kind  = Test
  entry = "Tests.bd"
}
```
