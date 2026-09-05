---
title: "Effects and targets"
description: "IO and files on the CPU, arguments, and compiling Bend2 to C, JavaScript, and Python."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /learn/effects-targets/
sources:
  - https://bend2.dev/learn/
---

# Effects and targets

Effects stay on the CPU in typed `do` blocks; pure code may fly to the
GPU or compile to C, JavaScript, and Python.

## IO

Effects run on the CPU in typed `do` blocks ([hello](./hello.md)) —
`input`, `print`, sequenced with `<-`.

## Files

Files extend the same `IO` surface *(planned)*.

## Command-line arguments

Command-line arguments extend the same `IO` surface *(planned)*.

## Compiling to C

HVM4's ahead-of-time compiler targets native C *(current runtime tooling)*.

## Compiling to JavaScript

Bend2's JavaScript target is planned.

## Compiling to Python

Bend2's Python target is planned. Flags, outputs, and the GPU story per
target arrive with the toolchain — the one hard rule is already known:
pure code may fly to the GPU, effects stay on the host.
