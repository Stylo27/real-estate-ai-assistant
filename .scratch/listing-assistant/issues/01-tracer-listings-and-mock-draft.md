# 01: Tracer bullet: Listings list and a Draft from the mock provider

**What to build:** A reviewer runs one command and both apps start. The Agent sees the seeded Listings, opens "New listing", enters Unit facts and a language, presses "Generate draft", and sees a Draft (headline, description, highlights) produced by the mock provider. Invalid facts are rejected with field-level messages. This ticket establishes the layers from the spec (UI → API → domain → integration) and the LLM provider port with its mock implementation.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

Spec: `.scratch/listing-assistant/spec.md`

- [ ] `docker compose up --build` starts the Next.js UI and the FastAPI backend; the browser talks only to the UI origin, and `/api/*` is proxied to the backend
- [ ] Python dependencies locked with uv, Node dependencies with a lockfile, base image tags pinned; a committed example env file, real env git-ignored
- [ ] Listings list shows about 6 seeded Listings across several countries, each with city, Deal Type, price and whether it has a Listing Description
- [ ] "New listing" form: Deal Type, bedrooms, bathrooms, m², city, district, price, feature tags from a fixed set, notes ≤300 chars, language (en/de/pl)
- [ ] Backend validates all input strictly; invalid input returns 422 and the form shows the message next to the field
- [ ] LLM provider port (structured output from system prompt + user prompt + schema, returns object + usage) with a Mock adapter that returns scripted responses
- [ ] Draft Service builds the prompt from an allow-listed request object (never from stored Listing records) and returns a Draft
- [ ] Draft shown as plain text (never raw HTML), with a loading state while generating
- [ ] Mobile-first fluid layout works at phone and desktop widths
- [ ] pytest: a valid mock response produces a Draft, driven through the Draft Service
