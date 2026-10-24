---
title: "Composition errors"
description: The E17xx diagnostics for hosts, registries, scopes and launch, with the message each one prints and the change that fixes it.
tableOfContents: true
---

Composition errors are reported **at compile time**, in the `composition.resolve` phase, and they block the build. That is the point of the feature: a missing service is a diagnostic with a position, not a failure that depends on which request arrives first. The messages below are the 0.6.7 text, with the inner backticks of a few messages left out so that they fit a table cell. The codes are stable.

## The registry of codes

| Code | Message | Read it as | Fix |
| --- | --- | --- | --- |
| E1701 | `composition requires exactly one launch host entry point` | The target declares hosts but nothing launches one | Add `launch AppHost();` to `Main` |
| E1702 | `composition allows only one launch host entry point` | Two `launch` statements | Keep one `launch` |
| E1703 | `composition dependency cycle between registrations A and B` | Service A needs B and B needs A | Extract the shared part into a third service |
| E1704 | `no registration provides inject type T` | A field or hook parameter asks for something that nobody registers | Register `T`, or an implementation `for T` |
| E1705 | `multiple registrations provide inject type T` | Several registrations match a singular `inject` | Ask for `T[]`, or keep one registration |
| E1706 | `with scope is required for scoped service resolution` | A scoped service is requested outside an activation | Use `single`, or move the use into the scope |
| E1707 | `scope S has no parent in the host scope tree` | A scope cannot attach to a parent | Declare it inside its parent scope or at host level |
| E1708 | `with S(...) argument list does not match the scope definition` | `with` names an unknown scope or passes the wrong arguments | Match the scope's parameter list |
| E1709 | `launch target T is not a host definition` | `launch` names something that is not a host | Launch a `host` |
| E1710 | `host definitions are not allowed in compiler mod projects` | A Mod declared a host | Move the host into an application or library |
| E1711 | `launch is not allowed in library projects` | `launch` in a `Lib` target | Launch from the `App` that uses the library |
| E1712 | `inject fields are not allowed on constructors` | `inject` on a constructor parameter | Inject into fields instead |
| E1713 | `registration lifetime override mismatch for B` | An override changed `single` into `transient` or back | Keep one lifetime per key across the chain |
| E1714 | `invalid scope inject qualifier Q` | `global::` or `parent::` where it cannot apply | Remove the qualifier or fix the target |
| E1715 | `host inheritance cycle detected at H` | A host extends itself through a chain | Break the chain |
| E1716 | `duplicate scope name S in merged host scope tree` | Two scopes with one name after merging a host chain | Rename one |

## Three you will actually meet

### E1704, the missing service

```beskid
type Clock
{
}

type Report
{
    inject Clock clock
}

host AppHost()
{
    registry
    {
        single Report;
    }
}

i32 Main()
{
    launch AppHost();
    return 0;
}
```

`Report` needs a `Clock`, and the registry does not offer one:

```text
no registration provides inject type `Clock`
```

Add `single Clock;` to the registry, or a registration `for Clock` if `Clock` is a contract.

### E1705, the ambiguous service

```text
registry
{
    single FileStorage for Storage;
    single MemoryStorage for Storage;
}
```

A field `inject Storage storage` now has two candidates:

```text
multiple registrations provide inject type `Storage`
```

If both should exist, ask for `inject Storage[] storages`. If one should win, remove the other or put it behind a different contract.

### E1701, the host nobody started

```beskid
type Logger
{
}

host AppHost()
{
    registry
    {
        single Logger;
    }
}

i32 Main()
{
    return 0;
}
```

```text
composition requires exactly one `launch` host entry point
```

An application that declares a host has to launch one. This is the host version of forgetting to call `main`, and the compiler catches it for you.

## Parse errors on the way

A few mistakes never reach the composition phase because the grammar rejects them first:

| Mistake | Code | What to write |
| --- | --- | --- |
| `host AppHost { ... }` without parentheses | E0104 | `host AppHost() { ... }` |
| A registry entry without a semicolon | E0102 | End each entry with `;` |

## Where to go next

- The contract and every decision behind these rules: [Native dependency injection](/docs/standard/capabilities/language-meta--composition--dependency-injection/).
- How the phase runs, in the compiler: [From source to something that runs](/book/14-from-source-to-runs/pipeline-overview/).
- How the container and the scope stack work at run time: [Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/abi-and-host/).
- The general method for reading a report: [Read a diagnostic](/book/07-compiler-is-not-your-therapist/read-a-diagnostic/).

## Next chapter

[12. The normative bible (and why we bothered)](/book/12-the-normative-bible/)
