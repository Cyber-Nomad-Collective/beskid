# Beskid Learn beginner workspace design

## Goal

Make the Learn lesson navigator visually stable and approachable for first-time
programmers, replace parser/AST material with practical language lessons, and
run submitted code through a server-side isolated compiler container.

## Scope

The existing eight-lesson beginner path remains eight lessons. `Parser Basics`
and `Inspect Syntax Tree` are removed from the catalog, lesson files, progress
migration, and navigation. They are not presented as an advanced track in this
change. Their replacements are `Loops` and `Collections`, placed after
`Branches` and before the first executable program lesson.

The lesson sidebar is a navigator, not a stack of content cards. Each lesson
uses one fixed-height row with a three-column grid: fixed leading icon slot,
truncating title slot, and fixed trailing status slot. Active state must not
translate or otherwise change the row's position; border, background, and
inset ring communicate selection. The same component is used in desktop and
the compact-sheet navigator.

## Server-side compiler sandbox

The browser submits source and the selected lesson identifier to a Learn API.
The API accepts source only after matching the selected catalog exercise and
places it into an ephemeral, isolated container with a mounted read-only
compiler/runtime kit. The container has no network, no host mounts, a
non-root user, a bounded read-only root filesystem plus a size-limited
temporary working directory, CPU/memory/process/output limits, and a hard
wall-clock timeout. It is deleted after each request.

The API returns a typed result containing compiler stdout, stderr, exit code,
and an execution-status category. It never returns container paths or host
error detail. The browser does not download or execute a native compiler. A
request that cannot find a validated compiler kit fails closed with an
actionable unavailable status; it does not emulate compilation in JavaScript.

The sandbox image and installed compiler kit are versioned by digest. CI must
build the image, run an allowed program, prove network and filesystem escape
attempts fail, and prove timeout/output limits are enforced. Production uses
the existing Coolify site lane only after an explicit service/container
definition and required secrets/configuration are present; no service UUID or
secret is invented.

## Data and migration

`LearnExerciseCategory` removes `parsing` and adds beginner-oriented `loops`
and `collections`. Existing persisted completion records for removed exercise
ids are ignored when calculating progress; they are retained in storage so a
future migration can explicitly map them. The visible denominator is the eight
current lessons.

## Tests

Component tests assert that active and inactive lesson rows have the same
semantic structure and no positional active-state class, with accessible
selection/status labels. Catalog tests assert the beginner path has neither
parser nor AST lesson and contains loops and collections in order. API and
container integration tests cover valid compilation, invalid source, timeout,
output cap, no-network, no-host-filesystem access, and unavailable-kit denial.

## Non-goals

This design does not create an advanced AST curriculum, ship a WebAssembly
compiler, expose arbitrary command execution, or change the language/compiler
semantics.
