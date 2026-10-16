# Spec: Smart Listing Generator (Part C slice)

Status: ready-for-agent

Vocabulary: `GLOSSARY.md`. Target architecture: `docs/architecture.md`, ADRs `docs/adr/0001–0003`. Business context: `docs/requirements.md`.

## Problem Statement

Agents spend a lot of time writing Listing Descriptions, often from a phone while on the road. The text they produce is inconsistent with the brand, and Marketing has no reliable way to make every Listing sound like Northstar Living. Compliance needs confidence that only non-personal Listing facts reach an external AI vendor.

## Solution

A mobile-friendly web app where an Agent creates a Listing (or opens an existing one), enters the Unit facts, and gets an AI-generated Draft written to the Brand Voice Guide in the chosen language. The Agent edits, regenerates or approves the Draft. Approving turns it into the Listing's Listing Description. A Draft that breaks the Brand Voice Guide never reaches the Agent: the system retries once with the reasons, then reports a clear, safe error.

## User Stories

1. As an Agent, I want to see a list of Listings, so that I can find the one I am working on.
2. As an Agent, I want each Listing in the list to show its city, Deal Type, price and whether it has a Listing Description, so that I can see at a glance what still needs writing.
3. As an Agent, I want a "New listing" action, so that I can prepare a description when a Unit comes onto the market.
4. As an Agent, I want to enter Unit facts (Deal Type, bedrooms, bathrooms, size in m², city, district, price, features, notes), so that the Draft is based on the real Unit.
5. As an Agent, I want to pick features from a predefined set of tags (balcony, parking, elevator, pets allowed, furnished, and so on), so that I enter them in a few taps on a phone.
6. As an Agent, I want a short free-text notes field, so that I can add details the tags don't cover.
7. As an Agent, I want to choose the output language (English, German, Polish), so that the Draft fits the market of the Listing.
8. As an Agent, I want the form to tell me clearly when a fact is missing or out of range, so that I can fix it before generating.
9. As an Agent, I want to press "Generate draft" and see a loading state, so that I know the system is working.
10. As an Agent, I want the Draft to have a headline, a description and a short list of highlights, so that it matches how Listings are published.
11. As an Agent, I want the Draft to mention only facts I supplied, so that I never publish something untrue about the Unit.
12. As an Agent, I want to edit the Draft's text before approving it, so that I stay in control of what is published.
13. As an Agent, I want to regenerate the Draft, so that I can get a different version if I don't like the first one.
14. As an Agent, I want to approve the Draft, so that it becomes the Listing Description.
15. As an Agent, I want a newly approved Listing to appear in the Listings list, so that I can see my work saved.
16. As an Agent, I want to open an existing Listing and see its facts prefilled in the same form, so that I can refresh its Listing Description without retyping.
17. As an Agent, I want to read the approved Listing Description on the Listing, so that I can copy it to the portals.
18. As an Agent, I want a "Copy" action for the approved Listing Description, so that publishing by copy-paste is quick on a phone.
19. As an Agent, I want a clear, non-technical message when generation fails, so that I know to retry or write the text myself.
20. As an Agent, I want the app to work at phone and desktop widths, so that I can use it on the road and at the office.
21. As an Agent, I want the form and Draft to be usable with large touch targets and a keyboard, so that the app is accessible.
22. As Marketing, I want every Draft written according to the Brand Voice Guide (tone, do's and don'ts), so that every Listing sounds like Northstar Living.
23. As Marketing, I want banned phrases in the Brand Voice Guide to be rejected automatically, so that clichés and risky claims never reach an Agent.
24. As Marketing, I want headline and description length limits enforced, so that text fits the portals.
25. As Marketing, I want the Brand Voice Guide kept in one editable file, so that tone can change without code changes.
26. As Compliance, I want only Unit facts, Deal Type, price, language and the Brand Voice Guide sent to the AI vendor, so that no personal data leaves the company.
27. As Compliance, I want the AI vendor's key to stay on the server, so that it can never be extracted from the browser.
28. As an operator, I want each model call logged with latency, token usage, model, validation outcome and retry count, but without prompt text, so that I can monitor cost and quality without storing content.
29. As an operator, I want every error response to carry a request id and no internal details, so that I can trace issues without leaking internals.
30. As an operator, I want the model chosen through configuration, so that I can switch between a cheaper and a stronger model without code changes.
31. As a developer, I want the AI provider behind an interface with a mock implementation, so that the core logic is testable without network or cost.
32. As a reviewer, I want to start the whole app with one documented command, so that I can run it from a clean checkout.
33. As a reviewer, I want the app to run with the mock provider when no API key is configured, so that I can still click through the flow. (The README states clearly that the real feature needs a key.)

## Implementation Decisions

- **Two deployables, per ADR 0001.** A Next.js app that renders UI only and has no API routes of its own, and a FastAPI backend that holds the API, domain and integration layers. The Next.js app proxies the browser's `/api/*` calls to the backend through rewrites, so the browser uses a single origin, CORS is not needed, and the key stays server-side.
- **Backend layers:**
  - API layer: routers and request/response DTOs with strict validation (enums, numeric ranges, string lengths, a fixed feature tag set, notes up to 300 characters).
  - Domain layer: the Draft Service, the Brand Voice Guide loader, the output validator and the prompt builder.
  - Integration layer: the LLM provider port with Anthropic and Mock adapters.
- **LLM provider port (ADR 0002).** A single operation: given a system prompt, a user prompt and an output JSON schema, it returns the parsed structured object plus usage (input tokens, output tokens, latency). The Anthropic adapter forces structured output through a single tool. The model comes from configuration, with a small, fast Claude model as the default. The Mock adapter returns a scripted sequence of responses. Choosing the adapter: Anthropic if a key is configured, otherwise Mock, with a warning logged at startup.
- **Draft Service.** Input: Unit facts plus language. Output: a Draft (headline, description, highlights). It builds the prompt from an allow-listed request object, never from stored Listing records (ADR 0003). Notes are inserted as delimited data, and the system prompt tells the model to treat them as facts, not instructions, and to use only the supplied facts. The service validates the output. If validation fails, it calls the model once more and includes the validation errors. If the second attempt also fails, it raises a domain error. It never returns text that failed validation (fail closed).
- **Output validation (the senior-level concern).** Two levels: schema validation (field presence, types, highlight count) and Brand Voice Guide rules (banned phrases matched case-insensitively, headline and description length limits). The validator produces a list of human-readable violations, and that list is what gets sent back to the model on retry.
- **Brand Voice Guide** is a single YAML document: brand name, tone, do's, don'ts, banned phrases, length limits. It is loaded once and used both by the prompt builder and the validator. There is one guide for all languages in the slice.
- **Listings store:** a static JSON seed of about 6 Listings across several countries, loaded into an in-memory store. Creating or updating a Listing changes memory only and is lost on restart. Deliberately no Repository interface (see `docs/architecture.md`).
- **API contract:**
  - list Listings;
  - get one Listing;
  - generate a Draft from facts + language (it persists nothing);
  - create a Listing from facts + approved Listing Description;
  - update a Listing's facts + approved Listing Description;
  - health check.
  
  Approve in the UI calls create for a new Listing and update for an existing one.
- **Error handling (A10):** a global handler maps the domain error to a generic "could not generate a draft, please try again" message with an upstream-failure status, maps validation errors to 422 with field-level messages, and maps everything else to a generic 500. Every response carries a request id. No stack traces or vendor messages reach the client.
- **Logging (A09):** one structured log line per model call with request id, model, attempt number, tokens, latency and validation outcome. Prompt and output text are not logged.
- **Config (A02):** all settings come from environment variables, with a committed example env file and the real one git-ignored. Interactive API docs are disabled unless dev mode is on.
- **Frontend:** a single fluid, mobile-first layout with a Listings list page, a Listing form page shared between new and existing Listings, and a Draft panel with editable fields, Regenerate, Approve and Copy. All AI output is rendered as plain text; raw HTML is never rendered.
- **Run:** `docker compose up --build` starts both services. Dependencies are locked: `uv.lock` for Python, `package-lock.json` for Node, and pinned base image tags.

## Testing Decisions

- A good test drives behaviour through a public entry point and asserts on observable results (the Draft returned, the error raised, the response sent), never on internal calls or prompt wording.
- There is one seam: the LLM provider port. Tests inject the Mock adapter with scripted responses.
- Draft Service tests (pytest):
  1. A valid model response produces a Draft.
  2. A Brand Voice Guide violation triggers a retry whose prompt includes the violations, and the second valid response produces a Draft.
  3. Two invalid responses raise the domain error, and no Draft is returned.
- One HTTP-level test (FastAPI test client, with the provider overridden by Mock): a generation that fails twice returns the generic error with a request id and no internal details.
- There are no frontend tests. Prior art: none yet, since this is a greenfield repo.

## Out of Scope

- Prospect-facing Property Q&A and Listing Summarizer.
- Authentication and RBAC. There is a single hardcoded Agent, and the README explains the SSO target.
- PII redaction, rate limiting, caching, fallback provider and the eval harness. All of them are described in `docs/architecture.md`, and PII redaction is first in "With more time".
- Persistence beyond process memory, and PMS/CRM integration.
- Photos, translation of existing descriptions, and a separate Brand Voice Guide per language.
- Editing the Brand Voice Guide through the UI.

## Further Notes

- Deliverables that sit next to the code: a README with how to run, which feature is real and why (two sentences), what is mocked, the OWASP Top 10:2025 table (with A01 and A06 tied to `docs/architecture.md`) and "With more time"; plus `docs/prompting-log.md`, kept up to date during the build.
- Draft edit rate is the pilot's quality metric. The slice keeps the Draft text and the approved Listing Description separate, so the metric could be computed later, but the slice does not compute it.
