---
title: "Channels"
description: "Channel<T> moves values between fibers. Mutex, WaitGroup, and Hub coordinate them. None of them is a mailbox in disguise."
tableOfContents: true
---

If two fibers need to exchange data, they use a channel. Not a shared array with a `Mutex` around it, not a flag one of them polls. A channel.

```beskid
use Concurrency.Channel;

Channel<Request> queue = Channel<Request>.Create();

Channel<Request>.Send(queue, request);          // Result<SendOk, ChannelError>
Channel<Request>.Receive(queue);                // Result<Request, ChannelError>
Channel<Request>.TrySend(queue, request);       // TryResult<SendOk, ChannelError>
Channel<Request>.TryReceive(queue);             // TryResult<Request, ChannelError>
Channel<Request>.Close(queue);
```

`Send` and `Receive` block the calling fiber until they can proceed; the scheduler runs something else meanwhile. `TrySend` and `TryReceive` never block and return `WouldBlock` instead. `Close` ends the channel: receivers drain what is queued and then get `ChannelError`, senders get an error immediately.

Channels carry any value the collector can trace, including records, arrays, and other handles. An unbounded channel grows as linked cells; `CreateWithOptions` bounds it. Cancelling a fiber that is blocked in `Send` returns the value it was trying to send, so nothing is lost into a queue nobody will read.

## Mutex

```beskid
Mutex lock = Mutex.Create();
Result<MutexGuard, MutexError> held = Mutex.Lock(lock);
// ...
Mutex.Unlock(guard);
```

A `Mutex` guards an invariant across fibers. `Lock` blocks and returns a guard; `TryLock` returns a `TryResult`. It is for the case where several fibers update one structure and the update must be atomic. It is not for handing data from one fiber to another. If you have a `Mutex` around a queue, you have reimplemented a channel with more bugs.

## WaitGroup

```beskid
WaitGroup pending = WaitGroup.Create();
WaitGroup.Add(pending, 3_i64);
// each worker calls WaitGroup.Done(pending) when finished
WaitGroup.Wait(pending);
```

Count up, count down, wait for zero. It coordinates "these N things are all finished" without collecting N handles, and it is the right tool when the workers were detached.

## Hub

```beskid
Hub<Message> hub = Hub<Message>.Create();
Result<SendOk, HubError> registered = Hub<Message>.Register(hub, memberChannel, index);
Result<HubReceiveResult<Message>, HubError> next = Hub<Message>.WaitReceive(hub);
```

A `Hub` waits on several channels at once and tells you which one delivered, through the `index` you registered it with. It is the multiplexer for "serve whichever client speaks next", and it exists so that nobody writes a busy loop of `TryReceive` over an array of channels. There is no general `select` statement; `Hub` covers the case that needed one.

## Memory

Values sent through a channel stay subject to the memory model in chapter 10. The channel transfers a reference the collector tracks; it does not copy the object. Two fibers can therefore both reach a record that went through a channel, which is why the rule is "the sender stops using it". The compiler does not enforce that rule today. The channel is how you avoid the race; the discipline is still yours.

Every type on this page is in `corelib_concurrency` and written in Beskid over runtime builtins. The runtime contract is [channels and synchronization](/platform-spec/execution/runtime/channels-and-synchronization/); the design choice is recorded in [cross-fiber events use channels](/platform-spec/language-meta/evaluation/fibers-and-spawn/adr/0004-cross-fiber-events-use-channels/).
