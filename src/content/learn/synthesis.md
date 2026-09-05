---
title: "Synthesis with SupGen"
description: "Holes, types as specifications, and the synthesizer that proposes what the checker disposes."
updated: 2026-09-05
verified: 2026-09-05
status: docs-only
canonical: /learn/synthesis/
sources:
  - https://bend2.dev/learn/
---

# Synthesis with SupGen

Items 37–39 of the curriculum. **Documentation-only**: SupGen is
private; everything below is the public shape of the idea, not its
interface.

<div class="box box-key">
<b>The one idea.</b> Precise types give synthesis a search target and the
checker an acceptance condition. SupGen proposes implementations;
the type checker disposes. See
<a href="/notes/search-by-superposition/">search by superposition</a>
for the machinery that makes each guess cheap.
</div>

## Holes

A hole marks an unfinished program the synthesizer should fill — the
`?name` of Kind's grammar, expected in Bend2's surface *(planned)*.

## Types as specifications

"Sorted list", "parser round-tripping with its printer": types precise
enough to pin behavior down. Writing them is already proving half the
program; the rest is search.

## SupGen

Named on the March 2026 launch-blocker list, demonstrated nowhere
public. Interface, examples, and limits arrive with the release — this
page will be rewritten from the compiler.
