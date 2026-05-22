---
title: "Test items in source"
description: Declare Beskid tests beside the code they lock down—meta, skip, and project kinds.
tableOfContents: true
---

Beskid tests are **first-class source items**, not comments you forgot to delete and not a separate DSL file that drifts every sprint.

## Shape

Normative syntax is in [Testing](/platform-spec/language-meta/contracts-and-effects/testing/):

```beskid
test ParseFast {
    meta {
        tags = "fast,parser";
        group = "analysis.parser";
        timeout = 30;
    }
    skip {
        condition = false;
        reason = "flip to true when the parser is on fire again";
    }
    return;
}
```

- **`test Name { body }`** — test entry point; the name is followed directly by the body block (statements plus allowed `meta` / `skip` sections).
- **`meta`** — tags, hierarchical `group`, timeouts, and future fixture hooks.
- **`skip`** — when `condition` is true, the runner records **skipped** (not failed) and does not execute the body.

## Where tests live

- **Test** project kinds are the natural home; placing tests in App/Lib projects may warn per manifest policy (see [project manifest](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)).
- Discovery walks parsed compilation units—top-level and inline modules—so keep tests near the behavior they pin.

## Tags and groups (practical)

| Field | Use |
| --- | --- |
| `tags` | Execution intent: `fast`, `slow`, `integration`, `flaky` (honesty badge) |
| `group` | Ownership prefix: `analysis.parser`, `cli.test` — powers `--group` filtering |

Stable names beat cute ones: `ResolverDuplicateNames` survives code search; `Test1` does not.

## Deep spec

- [Testing (language-meta)](/platform-spec/language-meta/contracts-and-effects/testing/)
- [Testing framework reference](/book/reference/testing/)

## Next

[The `beskid test` CLI](/book/08-green-tests-red-production/beskid-test-cli/)
