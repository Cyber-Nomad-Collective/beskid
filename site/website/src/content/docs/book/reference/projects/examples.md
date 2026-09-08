---
title: "Project Examples"
description: Beskid project examples in BSOL.
---


## Example 1: Single-project app
```
MyApp/
├── MyApp.bproj
└── Src/
    └── Main.bd
```

**MyApp.bproj**
```text
MyApp {
  name    = "MyApp"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
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
    ├── Std.bproj
    └── Src/
        └── IO.bd
```

**App.bproj** (under `App/`)
```text
App {
  name    = "App"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
  entry = "Main.bd"
}

dependency "Std" {
  source = "path"
  path   = "../Std"
}
```

**Std.bproj** (under `Std/`)
```text
Std {
  name    = "Std"
  version = "0.1.0"
  root    = "Src"
}

target "Library" {
  kind  = "Lib"
  entry = "IO.bd"
}
```

## Example 3: Nested module layout
```
NetLib/
├── NetLib.bproj
└── Src/
    ├── Net.bd
    └── Net/
        └── Http.bd
```

**NetLib.bproj**
```text
NetLib {
  name    = "NetLib"
  version = "0.1.0"
  root    = "Src"
}

target "Library" {
  kind  = "Lib"
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
├── Project.bproj
└── Src/
    ├── Main.bd
    └── Tests.bd
```

**Project.bproj**
```text
Project {
  name    = "Project"
  version = "0.2.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
  entry = "Main.bd"
}

target "Tests" {
  kind  = "Test"
  entry = "Tests.bd"
}
```
