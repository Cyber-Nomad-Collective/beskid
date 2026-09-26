---
title: "Terminal and console"
description: "Core.Output is bytes to a file descriptor. The console package is styling, capabilities, and the tick loop, and it is a separate package on purpose."
tableOfContents: true
---

Two layers, deliberately separate.

## `Core.Output`, `Core.Input`, `Core.Error`

```beskid
use Std.Core.Output;

Output.WriteLine("plain text");
Output.Write("no newline");
```

Syscall-backed writes to standard output, input, and error. `WriteLine` appends the platform newline and panics only if the write itself fails, since there is nowhere left to report that. This is the layer `Main` uses for a hello world, and it knows nothing about colors, terminals, or whether stdout is a pipe.

## `Console`

The import below is the module path as the package spells it. Whether your project reaches the `Console` package under the `Std` root depends on the toolchain, so confirm it before copying.

```beskid
use Console;

Console.FormatLine("[bold]Build[/bold] finished in [green]2.1s[/green]");
if Console.ShouldStyle() {
    // ANSI is going to a terminal that understands it
}
ConsoleSize size = Console.QuerySize();
```

The `corelib_console` package owns everything that makes output for a human: markup formatting, ANSI SGR sequences and cursor control, terminal capability detection per platform, a resize event hub, and a tick loop for live-updating output such as progress bars. `ShouldStyle` answers whether ANSI should be emitted at all, which is the check every CLI in every language gets wrong once by coloring the output of a cron job.

The ANSI builders live under `Ansi.*` and are fluent, returning `This` so `Escape.Csi` chains stay typed. Controls such as panels, frames, and progress bars are under `Console.Controls`. `Platform.Linux`, `Platform.MacOS`, and `Platform.Windows` hold the per-OS capability probes, and the rest of the package does not branch on the operating system.

## Why not one `IO`

Because `System.Console` in .NET is where `Console.WriteLine`, `Console.ForegroundColor`, `Console.ReadKey`, `Console.SetCursorPosition`, and `Console.Beep` all live, and every one of them has different behavior when stdout is redirected. Beskid keeps the byte layer in foundation, where it has one job, and the terminal layer in a package a server binary does not need to pull in. The CLI, the dashboard, and the test runner build on `Console`; a service that logs JSON lines uses `Core.Output` and nothing else.

Contracts: [terminal and console](/platform-spec/core-library/terminal-and-console/), [runtime-backed corelib surfaces](/platform-spec/core-library/stability-and-api-shape/runtime-backed-corelib-surfaces/).
