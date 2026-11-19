---
title: "Registry and lifetimes"
description: Register services with single and transient, bind implementations to contracts with for, and override them through host inheritance.
tableOfContents: true
---

The **registry** is the list of services a host knows how to provide. Each line is a **registration**: an implementation type, optionally bound to a contract, optionally with a lifetime.

```text
registry
{
    single ConsoleLogger for Logger;
    transient RequestId;
    Clock;
}
```

At the host level, registrations live inside a `registry { ... }` block. Inside a [scope](/book/11a-hosts-and-native-ioc/scopes-and-with/) you may write the same lines directly in the scope body, or in a nested `registry` block if you prefer one.

## The shape of a registration

```text
[single | transient] Implementation [for Contract] ;
```

| Piece | Meaning |
| --- | --- |
| `single` | One instance for the lifetime of the container. |
| `transient` | A new instance each time the service is resolved. |
| no keyword | `single` in the host registry, **scoped** inside a `scope` (one instance per activation). |
| `Implementation` | A type of your program. The container builds it. |
| `for Contract` | The key under which it is offered. Without it, the type is offered as itself. |

The **key** is what a consumer asks for. `single ConsoleLogger for Logger;` offers a `ConsoleLogger` to anyone who asks for a `Logger`. `single Clock;` offers a `Clock` to anyone who asks for a `Clock`.

## What can be registered

The container creates a service without a constructor and fills only its `inject` fields. So a registered type may have `inject` fields and methods, and no value fields (E1719), must not be generic or an enum (E1719), must not be a contract (E1718), and must conform to the contract of a `for` line (E1720). See [Composition errors](/book/11a-hosts-and-native-ioc/composition-errors/).

## Programming to the contract

Binding implementations to contracts is what makes a registry useful. Consumers name the contract, and the host chooses the implementation:

```beskid
use Core.Output;

contract Clock
{
    i64 Now();
}

type FixedClock : Clock
{
    pub i64 Now()
    {
        return 1700000000;
    }
}

type Report
{
    inject Clock clock;

    pub unit Print()
    {
        i64 now = this.clock.Now();
        Output.WriteLine("generated at ${now}");
        return;
    }
}

host AppHost()
{
    registry
    {
        single FixedClock for Clock;
        single Report;
    }

    startup(Report report)
    {
        report.Print();
    }
}

i32 Main()
{
    launch AppHost();
    return 0;
}
```

`Report` has an `inject` field (next page). `Report` is registered as itself, `FixedClock` is registered under `Clock`, and the compiler wires the first to the second. Swap `FixedClock` for another type that conforms to `Clock`, and `Report` does not change.

## Lifetimes in practice

| Lifetime | Use it for | Watch out for |
| --- | --- | --- |
| `single` | Loggers, configuration, connection pools, anything with identity | Every consumer shares it; make it safe to share |
| `transient` | Small stateless helpers, request ids, builders | Each resolve is a new object, so do not store state in it and expect to find it again |
| scoped (in a `scope`) | A database session, a unit of work, a request context | Only exists inside `with` (E1706 otherwise) |

When in doubt, start with `single` for services that have no state of their own, and put per-request state in a scope.

## Several implementations of one contract

Registering two implementations for the same contract is allowed. The consumer then has to say that it wants all of them, with an array:

```text
registry
{
    single FileStorage for Storage;
    single MemoryStorage for Storage;
}
```

A field `inject Storage[] storages` receives both, in registration order. A singular `inject Storage storage` would be ambiguous, and the compiler says so (E1705). See [Inject fields](/book/11a-hosts-and-native-ioc/inject-fields/).

## Overriding through inheritance

A host that extends a base starts from the base's registrations and applies its own on top. Each registration has a **key**: the contract for `for Contract` lines, and the implementation type for self-bound lines. A registration in the extending host with the same key **replaces** the base's.

```beskid
host BaseHost()
{
    registry
    {
        single ConsoleLogger for Logger;
    }
}

host AppHost() : BaseHost
{
    registry
    {
        single QuietLogger for Logger;
    }
}
```

Here `Logger` resolves to `QuietLogger`. An override may not change the lifetime: if the base says `single` and the extending host says `transient` for the same key, the compiler rejects it (E1713). Pick one lifetime per key across the chain.

## Ordering and cycles

You do not list registrations in dependency order. The compiler builds a graph, sorts it, and instantiates each service after the ones it depends on. If service A needs B and B needs A, there is no valid order, and you get E1703, which reports the two registrations involved. Break the cycle by extracting what they share into a third service.

## Next

[Inject fields](/book/11a-hosts-and-native-ioc/inject-fields/)
