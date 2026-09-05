## Purpose

Defines the observable behavior of the public documentation website so navigation, reading, and discovery work fast and accessibly on any device.

## ADDED Requirements

### Requirement: Stable routes and navigation

The site SHALL serve a home page, a contents index listing every page with canonical URLs, notes routes, and learn-by-example routes, with working internal navigation between all of them.

#### Scenario: Reader browses from contents

- **WHEN** a reader opens the contents index and follows any listed link
- **THEN** the target page loads with a canonical URL tag and a way back to the contents index

### Requirement: Readable low-JS pages

Pages SHALL render fully without client-side JavaScript for reading, with a readable serif layout, table of contents with last-updated dates, and a print-friendly stylesheet.

#### Scenario: JavaScript disabled

- **WHEN** a reader loads any content page with JavaScript disabled
- **THEN** all text, code samples, diagrams, and navigation remain fully readable

### Requirement: Theme choice with system fallback

The site SHALL offer light, dark, and high-contrast theme choices that persist across visits and fall back to the OS preference when unset.

#### Scenario: Returning reader with saved theme

- **WHEN** a reader who previously chose the dark theme returns
- **THEN** the dark theme applies before first paint without flashing the default theme

### Requirement: Fast navigations via edge prefetch

Same-site navigations SHALL feel instant via the edge prefetch mechanism, with no custom prefetch JavaScript shipped in page bundles.

#### Scenario: Reader follows an internal link

- **WHEN** a reader on a Chromium browser presses down on an internal link
- **THEN** the target document is already prefetched from edge cache so navigation completes near-instantly
