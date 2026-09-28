---
title: "74 Diagrams, 7 Renders, 0 Explanations"
description: "20 Mermaid diagrams broke on a reserved keyword and misplaced accessibility titles, MDX pages silently stopped rendering tables and diagrams at all, and an accuracy review then found several of the diagrams that did render were describing an auth hub and a crate that do not exist in production."
date: 2026-09-26
blogStatus: released
release: Documentation
cover:
  src: "/blog-covers/design-08-mermaid-diagram-carnage.jpg"
  alt: "A door in Funchal, Madeira, painted with a mermaid, decoration standing in for an opening that is not actually there."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Painted_door_(Mermaid)._Funchal,_Madeira.jpg"
  sourceLabel: "Vvlasenko, CC BY-SA 3.0"
---

The Book has seventy-something pages of diagrams. Sequence diagrams, state machines, architecture graphs, the works. For a while, most of them did not render. They rendered as code blocks. Grey boxes full of Mermaid syntax, on a documentation site, presented to a reader as if that were the intended visual. It was not.

Three separate things were wrong at once, which is the fun part, because each one hid the other two.

## Bug one: two ways to make Mermaid refuse a diagram

Mermaid's syntax wants the diagram type declared first, and anything else, including accessibility metadata, has to come after it. Twenty of our diagrams had `accTitle` or `accDescr` sitting *before* the `sequenceDiagram` or `stateDiagram` line. Mermaid's parser sees a directive it doesn't recognize in that position and gives up on the whole diagram: no warning, no partial render, just a hard parse error, silently swallowed by whatever renders the fallback.

Two more diagrams used `graph` as a node identifier, inside a flowchart, where `graph` is also the reserved word that starts a flowchart declaration. You can probably guess how well a parser handles a token that is simultaneously "the thing that means this is a flowchart" and "the name of a box in the flowchart." It does not handle it. It errors.

Both mistakes are the same species: syntax that looks entirely reasonable to a human skimming it and is structurally broken to a parser reading it strictly. Twenty-two diagrams, two ways to trip the same wire.

## Bug two: the one that ate tables too

This one was worse, because it wasn't even a Mermaid bug: it was the build pipeline dropping GFM tables and Mermaid fences across every `.mdx` page in the Book. `@astrojs/mdx` version 5 reads its Markdown configuration from the legacy `markdown.*` Astro options. Astro 6.4 and `astro-mermaid` configure through `markdown.processor` instead. Two different config surfaces, one silently ignored, and nothing in the build output says so: the page just renders without the table it was supposed to have, and with the Mermaid fence shown as a plain code block instead of a diagram.

That's nastier than a parse error, because a parse error at least looks like an error. A markdown table quietly not becoming an HTML table looks like nothing, like someone forgot to add a table, right up until you count the pipe characters sitting unrendered in production and realize seventeen pages have the same problem.

The fix configures the MDX integration explicitly, after `starlight()`, with `gfm` turned on and a small remark plugin (`src/lib/remark-mermaid-mdx.mjs`) that gives Mermaid fences in MDX the same treatment they get in plain Markdown. A small diff for a bug that made every table and every code-fenced diagram on the site cosmetically wrong.

## What "fixed" actually meant here

The PR (#277) picked the right diagram type per diagram (sequence, state, class, ER, git, timeline, architecture) instead of leaving everything as a generic flowchart because that's what was there first. It bumped `mermaid` to 11.17.2 and pinned `astro-mermaid` to 2.1.0, deliberately *not* going to Mermaid 12, because `astro-mermaid` only supports 10 and 11. Newer is not automatically correct; newer-than-what-your-renderer-supports is just a different failure waiting to happen.

It also added static tests for the two mistakes that shipped, which is the part I actually care about, because catching a bug once and not building a test for it is just scheduling the same bug for later.

The verification numbers are the kind I like, because they're counts, not vibes: zero pages left with raw table pipes, down from seventeen. Seventy-four of seventy-four diagrams rendered to SVG across seventy-two pages in a real browser, up from seven pages rendering correctly and twenty throwing parse errors. That's not "looks better." That's a before/after with the failure mode named and counted.

## Bug three, which is a different kind of bug entirely

Here's where it gets uncomfortable. Once seventy-four diagrams actually render, someone has to look at what they're claiming, because a diagram that renders beautifully and describes something false is strictly worse than a diagram that fails to render at all. The broken one at least doesn't lie to anyone.

PR #278 was that skim, and it found several diagrams asserting things that are not true of the running system:

- A services diagram implying an authentication hub sits in the request path, when in production every authenticated app goes through the shared edge straight to Authentik. There is no hub. There never was, in the version that ships.
- A corelib-layout diagram naming a namespace and a runtime crate that do not exist in the actual package graph.
- A mod-pipeline diagram with phases out of order, and a corelib-packages diagram missing a package that does exist.

None of this is a rendering bug. The diagrams that were wrong here rendered *perfectly*, confidently wrong, in exactly the medium (a nice clean architecture diagram) that readers trust the most precisely because it looks authoritative. A wall of prose gets scrutinized more than a box-and-arrow diagram does.

The root cause, honestly, is that the diagrams were authored to look plausible for "what would a services diagram for a project like this look like," rather than checked line by line against what's actually deployed. Plausible is not the same thing as true, and a diagram doesn't announce which one it is.

## Where that leaves the doc set

Fixing the render pipeline and fixing the facts are different jobs, done by different passes, and both had to happen before "the diagram renders" meant anything. A diagram nobody can see is merely useless. A diagram everyone can see, describing infrastructure that isn't there, is actively misleading, and worse, it's misleading in the one part of the docs people are least likely to fact-check, because pictures read as more trustworthy than prose whether or not they've earned it.

The accuracy pass explicitly notes what it did *not* fix: prose elsewhere on the site still names the nonexistent runtime crate and the nonexistent auth hub, independent of any diagram. That gap got closed separately, in a follow-up commit dropping those references from the remaining prose. The first fix didn't cover the second problem, and the second fix didn't claim to either.

A diagram on this site now clears two rounds of scrutiny before it ships: one mechanical, checking that it renders, one manual, checking that it's true.
