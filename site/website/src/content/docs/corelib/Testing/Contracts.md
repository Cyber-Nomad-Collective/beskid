---
title: "Testing.Contracts"
description: "Assertion-related contracts for reusable testing behavior."
---

`Testing.Contracts` defines protocol-style contracts for assertion integrations.

## Contracts

```beskid
pub contract AssertionPredicate {
    bool Check();
}

pub contract AssertionMessageBuilder {
    string Build();
}
```

These contracts provide a minimal declarative surface for future composition:
- predicate-style checks (`Check`)
- message construction (`Build`)
