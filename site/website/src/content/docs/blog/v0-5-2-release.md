---
title: "beskid 0.5.2: From Download to a Running Project"
description: "Native releases for Linux, macOS and Windows, corrected templates, portable lockfiles, and a simpler CLI. Here is how to get started, and which distribution steps remain unfinished."
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

**beskid 0.5.2 is available for Linux, macOS and Windows.** The native toolchain downloads, Windows setup and MSI, Linux DEB, macOS ARM64 DMG, and Homebrew formula are published. This release closes an important gap between having a compiler that passes its tests and having an installation you can use to create, build and run a project.

The shortest route is the [download page](/downloads/). The [versioned release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.5.2) contains the installation packages and their qualification records; the [toolchain bundle release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/v0.5.2) contains the complete native prefixes.

## What the 0.5 release line brings

The 0.5 release line adds the foundations for programs that communicate: typed fibers and channels, a growable managed heap, scoped resource cleanup, portable TCP, UDP and DNS, and a bounded HTTP/1.1 package. These build on the same runtime and I/O contracts rather than separate platform-specific APIs in application code.

The HTTP package is deliberately small. TLS, HTTP/2, HTTP/3, WebSocket and connection pooling are not included. A working HTTP/1.1 transport is not a promise that every browser or service-client feature exists.

The focus of 0.5.2 is the path around those features: installing the toolchain, finding its runtime kit and Corelib, generating valid projects, and keeping their dependency identities stable.

## Templates that produce real beskid projects

The corrected templates use beskid syntax and include the project metadata needed to resolve Corelib. Generating a console project must not produce a Rust-shaped entry point, a lockfile copied from another project, or a project that only builds inside the compiler checkout.

The published templates are version 0.1.3; package versions and compiler versions are independent. Fresh installed-toolchain checks covered project generation, analysis, locked builds and locked runs on Linux, macOS and Windows. The generated lockfiles remained unchanged during those locked checks.

For a new console application, choose an unused output directory:

```sh
beskid --version
beskid new console -o HelloBeskid --name HelloBeskid --no-interactive
beskid analyze --project HelloBeskid/HelloBeskid.bproj --target app --locked --plain
beskid build --project HelloBeskid/HelloBeskid.bproj --target app --locked --plain
beskid run --project HelloBeskid/HelloBeskid.bproj --target app --locked --plain
```

The version command should report `0.5.2`. Native builds also need the platform's compiler and linker prerequisites; installing the beskid executable alone does not install every system development tool.

If an older generated project reports that its lockfile belongs to a different project, keep a backup and generate a fresh project in another directory. Do not copy the old template's lockfile into it. Move your application sources deliberately, preserving the new project's manifest and dependency identity.

## Portable dependencies and a straightforward CLI

The v2 lockfile format replaces machine-specific checkout paths with project-relative paths and a verified Corelib anchor. Moving a checkout between Linux, macOS and Windows should not require committing somebody else's home directory. Missing or mismatched runtime kits still fail closed: portability does not mean accepting whichever library happens to be on disk.

The CLI no longer opens `beskid hi` as a fullscreen application during ordinary project work. Commands remain commands, with prompts, progress indicators and tree output where they help. The `beskid graph` TUI is retained for exploring the graph interactively.

## Install or upgrade

On macOS, the recommended route is the published Homebrew formula:

```sh
brew tap cyber-nomad-collective/beskid https://github.com/Cyber-Nomad-Collective/beskid_homebrew.git
brew install cyber-nomad-collective/beskid/beskid
```

For an existing installation through that tap, update Homebrew and upgrade the same fully qualified formula.

Windows users can download the [0.5.2 setup executable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.5.2/beskid-0.5.2-windows-amd64.exe). Linux users can download the [AMD64 DEB](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-v0.5.2/beskid-0.5.2-amd64.deb). Its corrected dependency recipe was checked in a clean Ubuntu environment without relying on recommended packages to supply missing development tools.

The native bundles include the CLI, LSP, updater, runtime kit and Corelib in one prefix. Their runtime discovery is relative to that installed prefix, not the machine that built the release.

## What is published—and what is not yet finished

There are two qualifications worth spelling out. The remaining Windows installer scenario-test matrix was explicitly waived by the release owner for the exact published setup bytes; those scenarios are not reported as passing tests. The macOS DMG is unsigned and not notarized. Its package contents and native conformance were checked, but normal Gatekeeper acceptance and compatibility with older physical macOS hosts are not claimed. Homebrew remains the recommended macOS route.

The [original VSIX packages](https://github.com/Cyber-Nomad-Collective/beskid/releases/tag/editor-v0.5.2) and the separately verified [Visual Studio Marketplace packages](https://github.com/Cyber-Nomad-Collective/beskid/releases/tag/editor-marketplace-v0.5.2) are available as downloads. Download availability is not the same as completion of every editor registry rollout: Open VSX publication has not passed its public readback check, the Linux and Windows Marketplace rollout remains unfinished, and the initial Zed registry listing remains pending.

Package documentation is available through [pckg](https://pckg.beskid-lang.org/), and the language's normative requirements remain in the [standard](/docs/standard/). Release notes should describe the binaries you can actually download, not the channels we hope to finish next.
