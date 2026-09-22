---
id: fibers_channels
slug: channels-and-message-passing
title: Send facts through the mountain pass
context: fibers-and-channels
objective: Model cross-fiber payload transfer through Channel<T> outcomes.
category: fibers-and-channels
difficulty: intermediate
prerequisites: ["fibers_control","corelib_api_docs"]
command: reference
source: openspec/specs/execution--runtime--channels-and-synchronization/spec.md
vocabulary: ["boundary","contract","fibers","and"]
hints: ["Channels are the approved cross-fiber payload path."]
questions: [{"id":"fibers_channels_q1","text":"Predict what a receiver may infer after observing a value from a successful Send.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Model cross-fiber payload transfer through Channel<T> outcomes. Channels are the approved cross-fiber payload path.

## Predict

Predict what a receiver may infer after observing a value from a successful Send.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Normative-pending Channel<T> sketch: messages carry values across fibers.
Channel<QuestUpdate> updates = Channel.Create<QuestUpdate>();
// updates.Send(update); updates.Receive();
```

## Investigate

Normative-pending: channel parking and timing need runtime proof. Successful Send happens-before the Receive that observes its value; closed and cancelled results are data.

## Modify

Design a QuestUpdate payload, sender, receiver, and closed-result response.

## Make and retrieve

Make the cross-fiber payload law and retrieve it.

## Failure clinic

```beskid
// Bad boundary: a stack reference must not escape through a channel payload.
Channel<pointer> updates = Channel.Create<pointer>();
```

Do not use an ad-hoc flag or stack reference as a mailbox.

## Recap and next link

Channels carry typed facts. Next: coordinate a complete quest-log design.
