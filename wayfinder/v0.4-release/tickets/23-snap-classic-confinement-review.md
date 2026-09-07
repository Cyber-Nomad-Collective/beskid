## Status

Blocked on publisher forum submission

## Type

Task (HITL)

## Question

Can the `beskid` Snap Store submission obtain classic-confinement approval without misrepresenting its compiler and host-composition requirements?

## Resolution

**Repository work completed 2026-09-07.** The snap correctly declares `confinement: classic`; Store review therefore requires a publisher request in the Snapcraft Forum Store requests category. Compiler and programming-language tools are an explicitly supported classic-confinement category. The distribution repository now contains a forum-ready request at `docs/Snap_Classic_Confinement_Request.md`, corrects `docs/Snap_Guide.md`, and has a static regression test preventing the unverified strict-confinement fallback guidance from returning.

## Required human action

Post the prepared request from the Ubuntu One account that owns the `beskid` snap, then attach the forum URL to the rejected revision review. The current environment has no authenticated Snapcraft Forum publishing session.
