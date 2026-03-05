---
title: "Project Examples"
description: Beskid Project Examples (HCL)
---


## Example 1: Single-project app
```
MyApp/
├── Project.proj
└── Src/
    └── Main.bd
```

**Project.proj**
```hcl
project {
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
│   ├── Project.proj
│   └── Src/
│       └── Main.bd
└── Std/
    ├── Project.proj
    └── Src/
        └── IO.bd
```

**App/Project.proj**
```hcl
project {
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

**Std/Project.proj**
```hcl
project {
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
├── Project.proj
└── Src/
    ├── Net.bd
    └── Net/
        └── Http.bd
```

**Project.proj**
```hcl
project {
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
├── Project.proj
└── Src/
    ├── Main.bd
    └── Tests.bd
```

```hcl
project {
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
