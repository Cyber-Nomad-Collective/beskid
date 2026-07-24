---
title: "I Tried to Build a Form Renderer and Ended Up Writing a Compiler"
description: "The Blazor form renderer that broke me. Sixteen years of .NET. An architect who thought WinForms devs would jump to web. And the moment I stopped negotiating with frameworks and started writing my own rules."
date: 2026-02-22
blogStatus: released
release: v0.0
---

I did not set out to build a programming language. I set out to build a **form renderer** in Blazor.

That sentence sits at the boundary between a job description and an origin story. It is also the sentence I repeated to myself at 02:00 on a Tuesday, staring at a call stack that went eighteen frames deep into Microsoft.AspNetCore.Components.Forms before it reached anything I had written.

If you have read [My Story](/book/00-why-beskid-exists/my-story/) in the Book, you know the broad strokes. Sixteen years in the .NET ecosystem. A legacy WinForms application — hundreds of forms, thousands of controls, a codebase that had outlived three corporate reorgs and the meaning of its own existence. An architect who selected Blazor because, in his words, "the WinForms developers will find the component model familiar." And me, the principal engineer who drew the short straw: just auto-generate the forms.

## The architecture of wishful thinking

The theory was seductive. WinForms has controls with properties, events, and data binding. Blazor has components with parameters, event callbacks, and data binding. Map one to the other, generate some Razor files, and the migration drives itself. The architect had a PowerPoint slide with two columns and a double-headed arrow. The slide did not survive first contact with the codebase.

The WinForms application did not use data binding the way the documentation described. It used a homegrown reflection-based form builder written in 2007 by a developer who had since retired to a vineyard in Mendoza. Forms were assembled at runtime from XML descriptors that referenced control factories registered via attributes. There were no design-time bindings to inspect. There was no static shape to generate against. The form *was* the side effect of a runtime composition engine.

I was asked to make the new system work the same way. In Blazor. With source generators.

## The dead ends

**Reflection-based rendering.** The first prototype walked the runtime form descriptors and emitted Blazor RenderTreeBuilder calls dynamically. It worked — for one form, with three text boxes, on my machine. RenderTreeBuilder is not designed for runtime composition at scale. The diffs were catastrophic. Every keystroke rebuilt the entire tree. The form flickered like a fluorescent tube in a horror film.

**Incremental source generators.** The second approach was ambitious: a source generator that read the XML form descriptors at build time and emitted static Blazor components. But incremental generators operate on *syntax trees*, and my inputs were XML files in the project directory. The generator had to register additional files, parse XML, resolve control factories, and produce Razor-compatible C# — all inside the analyzer sandbox. Every Roslyn release shifted the sandbox floor. Every shift broke the XML parsing. I was debugging a source generator that was debugging an XML parser that was debugging a control factory that had been written for .NET Framework 3.5.

**Forking the Razor code generator.** This was the optimal technical path, and it was the one that broke me. The Razor code generator lives in the ASP.NET Core repository. It is several thousand lines of tightly coupled C# that assumes a specific project model, a specific MSBuild integration, and a specific set of tag helpers. Forking it would mean maintaining a parallel Razor pipeline — tracking upstream changes, backporting bug fixes, and explaining to the architect why the fork existed. I estimated the maintenance burden at one full-time engineer, minimum. I was already the only engineer on the form renderer.

## The mediation that walked out

I proposed a different approach: accept that the legacy forms could not be auto-generated, design a new form model, and migrate incrementally. The architect rejected it. The WinForms developers, he argued, would not accept a different paradigm. I pointed out that they were already being asked to accept the browser. He did not find this persuasive.

Management scheduled a mediation. I brought diagrams. The architect brought the PowerPoint slide. Twenty minutes in, the director of engineering stood up, said "I don't think this is a technology problem," and walked out. She was right. It was not a technology problem. It was a tribe that had built its identity around a framework, and a migration that threatened that identity, and a tooling ecosystem that offered no clean path between the two.

## The feeling

There is a specific feeling that engineers know and management vocabulary lacks. It is not frustration. Frustration implies that the thing *should* work and occasionally doesn't. This was different. This was the realization that the thing was *not designed* to work — that the entire stack, from the Razor compiler to the MSBuild integration to the component model, had been optimized for a workflow that my problem did not fit. I was not pushing against a bug. I was pushing against the shape of the platform.

The phrase I kept returning to was: **it should not be that hard.** A form is a tree of controls bound to a data model. Every UI framework since Xerox PARC has known how to do this. And yet, in the modern .NET web stack, generating forms at build time from an external descriptor required forking a code generator, maintaining a parallel pipeline, and fighting the Roslyn sandbox.

That is not a gap. That is a category error.

## The decision

I did not quit the job in a dramatic fashion. I finished the mediation, wrote a three-page document explaining why the auto-generation approach was technically non-viable, submitted it, and resigned two weeks later. The form renderer never shipped.

But the idea did not leave. The idea was: what if a language had form generation as a *language concern* — not a framework concern, not a code generator bolted to the build system, but something the compiler understood and verified? What if the compiler could read a schema, check it against the types, and produce a form — with diagnostics, with spans, with the same rigor it applies to type checking?

That idea had no home in C#. So I started drafting a language where it could.

The first commit landed three weeks later. The working name was Pecan — small, dense, slightly unhinged. The ambition was not small. But for the first time in months, the tooling was not fighting me. I was writing rules instead of negotiating with someone else's.

Read [Trauma — by developers, for developers](/book/00-why-beskid-exists/trauma-by-developers-for-developers/) for the full accounting of what the industry does to the people who build its software. The Beskid project starts here: not with a language specification, but with a form renderer that should not have been that hard, and an engineer who decided to stop asking permission.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/version.json) &mdash; [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/article.md)
