---
title: "beskid 0.5.2: From Download to a Running Project"
description: "Explore beskid's fibers, channels, TCP, UDP and HTTP/1.1, then create a native project with portable dependencies on Linux, macOS or Windows."
date: 2026-10-03
blogStatus: released
release: v0.5.2
draft: false
cover:
  src: "/blog-covers/v0-5-01-release.jpg"
  alt: "Operators connecting calls at a Bell System telephone switchboard in 1943."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Photograph_of_Women_Working_at_a_Bell_System_Telephone_Switchboard_-_NARA_-_1633445.jpg"
  sourceLabel: "US National Archives, Public domain"
---

**beskid 0.5.2 is available for Linux, macOS and Windows.** The 0.5 release line brings concurrency and networking into the language's native toolchain. Version 0.5.2 makes those capabilities easier to start using, with ready-to-use project templates, portable dependency lockfiles, and platform installation packages.

You can use it to build native command-line programs, organize concurrent work, and communicate through TCP, UDP or HTTP/1.1. Start with the [download page](/downloads/), or read on for an overview of the building blocks and a complete project-start workflow.

## Concurrent work with fibers and channels

Fibers let a program organize work into independently scheduled tasks. A fiber can wait for a message or I/O while other runnable fibers continue. Scheduling is cooperative: fibers are a way to structure concurrency, not a promise that every task runs on a dedicated operating-system thread.

Typed channels provide the communication path between fibers. Rather than arranging work around shared stack state, a producer sends values and a consumer receives them. This gives programs a natural shape for work queues, staged processing and message-driven coordination. Fiber results and channel errors make completion and shutdown part of the program's control flow.

The runtime also has a growable managed heap, while scoped resource cleanup ties a resource's lifetime to the scope that owns it. Together, these are foundations for programs that allocate data, coordinate tasks and manage I/O resources over time.

## Networking from sockets to HTTP

The networking package exposes TCP, UDP and DNS through portable Corelib APIs:

- TCP provides connected byte streams, with listener and stream operations for accepting connections, reading and writing.
- UDP provides datagram communication, preserving the message-oriented shape of the transport.
- DNS resolves host names into addresses that a program can use to establish communication.

These operations integrate with the fiber runtime. Application code can use the same networking API on Linux, macOS and Windows rather than selecting a different socket interface for each platform.

The HTTP package builds on TCP with request and response types, encoding and decoding, and client and server exchange support. Its HTTP/1.1 implementation is bounded: parsing and message handling have explicit limits. This is a useful layer when a program needs an HTTP exchange rather than direct access to a byte stream.

HTTP in this release does not include TLS, HTTP/2, HTTP/3, WebSocket or connection pooling. Choose the transport with those boundaries in mind; HTTPS is not provided by the HTTP/1.1 package itself.

## Create, check, build and run a project

The console template gives you a beskid entry point, a project manifest and the metadata needed to resolve Corelib. The published template packages are version 0.1.3; their version numbers are independent of the compiler's 0.5.2 version.

For a new console application, choose an unused output directory:

```sh
beskid --version
beskid new console -o HelloBeskid --name HelloBeskid --no-interactive
beskid analyze --project HelloBeskid/HelloBeskid.bproj --target app --locked --plain
beskid build --project HelloBeskid/HelloBeskid.bproj --target app --locked --plain
beskid run --project HelloBeskid/HelloBeskid.bproj --target app --locked --plain
```

The version command should report `0.5.2`. The generated `.bproj` file describes the project and its `app` target. `analyze` checks the program, `build` produces the native application, and `run` builds and executes it. `--plain` keeps the output straightforward, while `--no-interactive` makes project generation suitable for a script as well as a terminal.

The `--locked` option uses the recorded dependency graph without updating it. Fresh installed-toolchain checks covered this generation, analysis, locked-build and locked-run workflow on all three operating systems.

## Carry the project between machines

The v2 `Project.lock` format records project-relative paths and identifies Corelib through a verified installed kit. The lockfile can travel with a checkout between Linux, macOS and Windows, even when the toolchain is installed in a different location on each machine.

That separates two concerns: the project records which dependencies it uses, and each machine supplies a matching toolchain and runtime kit. Kit validation checks that the installed components belong together before compilation proceeds.

Ordinary CLI commands work directly in the terminal, with prompts, progress indicators and tree output where useful. For an interactive view, `beskid graph` retains its TUI. The native bundles also include the language server for editor integration, alongside the CLI, updater, runtime kit and Corelib.

## Install or upgrade

On macOS, the recommended route is the published Homebrew formula:

```sh
brew tap cyber-nomad-collective/beskid https://github.com/Cyber-Nomad-Collective/beskid_homebrew.git
brew install cyber-nomad-collective/beskid/beskid
```

For an existing installation through that tap, update Homebrew and upgrade the same fully qualified formula.

Windows users can download the [0.5.2 setup executable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.5.2/beskid-0.5.2-windows-amd64.exe), and Linux users can download the [AMD64 DEB](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.5.2/beskid-0.5.2-amd64.deb). The [versioned release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.5.2) also provides the Windows MSI and macOS ARM64 DMG. For a complete installed prefix, use the [native toolchain bundles](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.5.2).

Native builds need the platform's compiler and linker prerequisites as well as beskid. Follow the [installation guide](/docs/getting-started/install/) for the appropriate setup. When upgrading an existing application, preserve your sources and review its manifest and lockfile; generating a separate project is a useful way to compare the current template layout.

## Explore the APIs and editor support

The [first-program guide](/docs/getting-started/first-program/) is the next step after installation. [pckg](https://pckg.beskid-lang.org/) provides package documentation and source browsing, while the [language standard](/docs/standard/) describes the normative contracts behind the language and runtime.

For editor setup, see the [editor guide](/docs/getting-started/editor/). The [VSIX downloads](https://github.com/Cyber-Nomad-Collective/beskid/releases/tag/editor-v0.5.2) and separate [Visual Studio Marketplace packages](https://github.com/Cyber-Nomad-Collective/beskid/releases/tag/editor-marketplace-v0.5.2) are available now; editor-store listings are rolling out separately.

Packaging notes: the macOS DMG is unsigned and not notarized, so Homebrew remains the recommended macOS route. The Windows setup is published under an owner-approved installer-test waiver. Detailed qualification records accompany the versioned release.
