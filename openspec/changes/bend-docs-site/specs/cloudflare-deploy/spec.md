## Purpose

Defines how the site reaches Cloudflare reproducibly through Alchemy so any contributor can redeploy from scratch without manual dashboard steps or local secret files.

## ADDED Requirements

### Requirement: One-command Alchemy deploy

The site SHALL deploy to the user's Cloudflare account via a single Alchemy command from a clean checkout plus login, producing an assets-only static Worker with no server bundle.

#### Scenario: Fresh checkout deploy

- **WHEN** a contributor with Cloudflare credentials runs the documented deploy command on a clean checkout
- **THEN** the build prerenders every page and uploads only static assets, and the command prints the live URL

### Requirement: Credential flow without checked-in secrets

Credentials SHALL come from the Alchemy profile (interactive OAuth or API token) or CI environment variables, and no secret SHALL be committed to the repo.

#### Scenario: Credential audit

- **WHEN** the repo is searched for API tokens, account IDs, or profile credential files
- **THEN** no secret material is found and the docs describe only `alchemy login` plus the CI variables

### Requirement: Custom 404 and trailing-slash behavior

Unknown routes SHALL serve the built custom 404 page and trailing-slash behavior SHALL be consistent across all content routes.

#### Scenario: Unknown URL

- **WHEN** a reader opens a URL that matches no page
- **THEN** the site returns the custom 404 page explaining the miss and linking home

### Requirement: Edge cache and prefetch expectations

The deploy SHALL document the expected cache behavior and Speed Brain prefetch toggle so instant navigations work in production.

#### Scenario: Production header check

- **WHEN** the deployed homepage is fetched with response headers shown
- **THEN** the docs state which cache status and speculation-rules header values to expect and where to toggle Speed Brain if absent
