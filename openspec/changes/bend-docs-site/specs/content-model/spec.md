## Purpose

Defines what the documentation covers, how claims are verified, and how content stays maintainable so readers can trust every page and contributors can update it without guesswork.

## ADDED Requirements

### Requirement: Concept-first page structure

Every concept page SHALL open with a plain-language explanation of the main idea before going deep, following the Learn-You-a-Haskell style requested.

#### Scenario: Reader opens an HVM page with no background

- **WHEN** a reader with no interaction-net background opens the HVM/runtime page
- **THEN** the first section explains the idea in 1–3 short paragraphs without jargon, and deeper sections follow after it

### Requirement: Verification labels on Bend2 code

Every Bend2 code sample SHALL carry a visible verification label stating whether it is taken from a runnable public sample, documentation-only, or unverified pre-release material, and SHALL never claim unverified code compiles.

#### Scenario: Pre-release syntax sample

- **WHEN** a page shows Bend2 syntax that cannot be compiled against a public release
- **THEN** the sample is labeled documentation-only with its source commit or page date, and no build/run instruction is given for it

### Requirement: Citations with last-updated dates

Every factual claim about Bend/Bend2/HVM SHALL cite its canonical source URL and the source's last-updated date, mirroring the `bend2.dev` practice.

#### Scenario: Release-status claim

- **WHEN** a page states whether Bend2 is released
- **THEN** the page shows the source URL, the `Last updated` date of that source, and its own verification date

### Requirement: Research source coverage

The research notes SHALL cover all 14 `bend2.dev` pages and the key source repos (VictorTaelin/Bend2, Interaction-Calculus, hvm4-formal; HigherOrderCO Bend, HVM, Kind) before content drafting begins.

#### Scenario: Coverage check before drafting

- **WHEN** content drafting is about to start
- **THEN** research notes exist for each of the 14 sitemap URLs and each key repo README, each with its canonical URL and retrieval date, or an explicit gap note explains what was inaccessible

### Requirement: Markdown and LLM mirrors

Every content page SHALL be available as Markdown at a stable `index.md` mirror and the site SHALL publish `llms.txt`, `robots.txt`, and `sitemap.xml`.

#### Scenario: LLM fetches a page as Markdown

- **WHEN** a client requests a page with `Accept: text/markdown` or fetches its `index.md` mirror
- **THEN** it receives the same content as Markdown with the canonical URL printed inside, and `llms.txt` lists the mirror
