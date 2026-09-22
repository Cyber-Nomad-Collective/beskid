---
id: fibers_capstone
slug: concurrent-quest-log-capstone
title: Build a quest log with explicit owners
context: fibers-and-channels
objective: Design a multi-fiber quest log with channels for payloads and coordination for invariants.
category: fibers-and-channels
difficulty: intermediate
prerequisites: ["fibers_channels","corelib_api_docs"]
command: reference
source: openspec/specs/core-library--concurrency--concurrency-package/spec.md
vocabulary: ["boundary","contract","fibers","and"]
hints: ["Payload transfer, state ownership, and completion each need an explicit boundary."]
questions: [{"id":"fibers_capstone_q1","text":"Predict the bug created when several fibers edit one quest record directly.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Design a multi-fiber quest log with channels for payloads and coordination for invariants. Payload transfer, state ownership, and completion each need an explicit boundary.

## Predict

Predict the bug created when several fibers edit one quest record directly.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending design: scouts send; one owner receives and mutates.
Channel<QuestUpdate> updates = Channel.Create<QuestUpdate>();
// logOwner receives updates; no scout order is promised.
```

## Investigate

Normative-pending capstone: review a design against the concurrency specification instead of claiming a scheduler demonstration. Mutex and WaitGroup coordinate invariants; Hub multiplexes homogeneous channels fairly.

## Modify

Draw scouts, Channel<QuestUpdate>, one log owner, and a completion observer.

## Make and retrieve

Make an ownership ledger and retrieve it before implementation.

## Failure clinic

```beskid
// Bad: a mutex is not the cross-fiber payload path.
Mutex<QuestUpdate> mailbox;
```

Do not use a mutex as a mailbox or assume one ready channel always wins.

## Recap and next link

Correct concurrent designs expose owners, messages, and outcomes. Next: navigate the practical core library.
