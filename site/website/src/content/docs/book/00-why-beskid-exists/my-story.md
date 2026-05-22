---
title: "My story"
description: Personal context for starting Beskid.
tableOfContents: true
---

I was a C# fanboy from my early years. I started coding in C# at thirteen and closed myself inside the .NET ecosystem.
![](https://media1.tenor.com/m/q5hgAH0lFacAAAAd/c-sharp.gif)
It had the best docs, nice support, and great tooling. That got me so hooked it took almost **sixteen years** before I seriously looked at alternatives.

## The .NET years

I started my career as a desktop developer. From **2019** onward there was a sudden shift that shook enterprise software like really shitty, heavy ammunition.

I caught a few desktop jobs, then some backend—but I really liked working in UI. When **Blazor** came along I was hooked immediately. The problem was a lack of projects in that stack. I still managed to find one in my area.

The interview was full of red flags. I did not care. This was my only chance to become full-stack, and I was desperate for any job involving more than slowly loosing the sense of self at the Corp. 


![Red flags reaction](https://media1.tenor.com/m/uScmyrBrE2YAAAAC/empresa-company.gif)

I was not asked any coding questions. There was no technical interview. The "software house" was truly an IT department, with all the usual flaws: tribalism, harassment-as-process, and zero accountability. The only somewhat factual, 

![Suspicious side-eye](https://media.giphy.com/media/K0nfRxt3s9SZDB3tmN/giphy.gif)

## The "new" team

I was part of the **new** team, dedicated to eventually migrating a legacy WinForms app that had lost the meaning of its existence years earlier. It was no longer an ERP — it was at some point used to **order meals**, or had modules created for one specific person which no longer works here. Yeah, if you are a .NET/Java Dev you know this codebase, even tho you did not see it. 
This is a hardcore case, but I had many similar experiences in my desktop days. 
The DOD shifts from "Let's make the world a better place" to "I want to sell my fridge and move to Pitcairn - which is a real country at the actual edge of the world where [they give land away for free](https://www.freedomsurfer.com/articles/pitcairn). 
Yeah, I considered it some time ago... 


The architect was an interesting persona: master of the **"wait till retirement"** philosophy. Knowledgeable in WinForms and Oracle databases—for some reason put in charge of "consulting" our tech stack. He chose Blazor because he thought his WinForms devs would jump straight into web development.

That is a common failure mode: legacy teams shifting to the web without the required mental shift.

## A fight we were never going to win

It quickly became a real battle between teams. We lost.

![This is fine](https://media1.tenor.com/m/SjObhZ7tBOYAAAAC/fine-this-is-fine.gif)

How do you win against a shitty-but-works desktop app backed by **five times** more developers? It turned into a weird, twisted tribal dick-measuring contest. Our side was not winning.

This was a lost fight from the start, because:

- We stood for **clean code**, which slowed visible progress.
- We were chained to the **old Oracle DB**—the architect forced it. Every change meant the DB team, overworked and undervalued. Schema work was a queue, not a conversation.
- The architect held a grudge against the director of the so-called software house. The director **resigned halfway through a mediation meeting** between our team and the architect. (Yeah—I am not making that up. That was **2025**.)

## So… what about Beskid?

### Blazor WASM downloads the runtime

Do you know Blazor WASM downloads the **entire .NET virtual machine**? Who thought that was a good idea?

![Mind blown](https://media.giphy.com/media/8c9j3F8a7l2e9d3Y0e/giphy.gif)

Some browsers blocked Blazor early on because `.dll` downloads were a hard no. Microsoft had to practically refactor Roslyn/RyuJIT to accommodate gzip-for-wasm. Pure comedy.

### The form renderer that broke me

I wanted a **simple automatic form renderer** in Blazor. Every similar solution was messy, unfinished, or a straight-up clusterfuck.

That should not be that hard. Right? **Right?**

While building my own solution—jumping from reflection through existential crisis to incremental source generators—I kept repeating:

> It should not be that hard. There are like a million JS libs for similar stuff.

![Angry typing at keyboard](https://media.giphy.com/media/3oEduLvxnhDsh83j3O/giphy.gif)

I worked nights, days, and weekends. I am genuinely traumatized by that experience.

But what was the alternative? Hand-write every form in a rewrite of a shitty WinForms app with **over 300 views**?

![Red flag — nope](https://media.giphy.com/media/lncnb6oadKnZQoE9a6/giphy.gif)

I hit a wall. The entire Blazor framework was fighting me. The most optimal path would have been to **fork the Razor code generator**. I dropped the idea. I had no good explanation for why it was *this* hard.

### Manual views and the grind

We started manually writing all views. That backfired fast.

Management asked why changing a field took **a week**. We were a two-person team in an ocean of WinForms developers maintaining the legacy app and making smug comments.

![Computer rage](https://media.giphy.com/media/ZKZiW6GSx8eSA/giphy.gif)

Adding a feature in the legacy app was: add another button to a shitty view, implement `onclick`, ship. We had to dive into septic tanks, fight tribal politics, and prove our worth to developers approaching retirement—why we cared about DRY while implementing an entire WMS.

Our projects got cancelled one after another, because the management was spending money they didn't have on project which had no sense. The WinForms team won. Not because of better code, or smarter architecture. Because the management doesn't care about the same parameters as devs, but that's the knowledge you gain on your day one as a developer. 

## Where Beskid starts

That is when I started drafting my own programming language, because I could not find the answer in .NET.


Next: [1.2 Current state of languages](/book/00-why-beskid-exists/current-state-of-languages/).
