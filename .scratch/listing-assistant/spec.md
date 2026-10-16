# Spec: Property Listing Assistant (take-home slice)

Decisions from the grilling session (2026-10-16). Vocabulary: see `GLOSSARY.md`.

## Product
- AI feature: **Smart Listing Generator**. Sole user: **Agent**. Prospect-facing Q&A is out (phase 2).
- Flow: Listings list + "New listing" → facts form (Deal Type, beds, baths, m², city/district, price, features tags, notes ≤300 chars, output language en/de/pl) → "Generate draft" → Draft (edit / regenerate / Approve) → Approve stores Listing Description in memory, Listing appears in list. Existing Listing opens the same form prefilled.
- Unit facts are typed manually (mock for missing PMS integration).
- Fictional brand "Northstar Living"; one `brand_voice.yaml` Brand Voice Guide feeds both the system prompt and the validator.

## Stack & layout
- Next.js (UI only, no API routes) + FastAPI (api → domain → integrations/llm).
- Next `rewrites` proxy `/api/*` to FastAPI: same-origin, key server-side only.
- `LlmProvider` Protocol; `AnthropicProvider` (default `claude-haiku-5-5`, `LLM_MODEL` env) + `MockProvider`.
- Run: `docker compose up --build`; manual fallback in README. Locks: `uv.lock`, `package-lock.json`.
- Data: static JSON Listings, in-memory approved descriptions, one hardcoded Agent, no auth.

## Senior concern
- Structured output validation: tool-use schema `{headline, description, highlights[]}` → Pydantic + brand rules (banned phrases, length). On failure, one retry with validation errors fed back; then fail closed.

## Test
- pytest on `DraftService` with `MockProvider`: valid → Draft; violation → retry → OK; two failures → domain error.

## Security (OWASP 2025)
- Implemented: A05 input validation + no raw HTML, A08 LLM output validation, A10 generic errors + request id + fail closed, A02 env config / docs off / headers, A09 per-call log (latency, tokens, validation result, no prompt text). Rest described. Tie A01 + A06 to architecture.

## Docs (English)
- `docs/requirements.md` (Part A, ≤1 page), `docs/architecture.md` (Part B, ≤2 pages, Mermaid), `docs/adr/0001` modular monolith, `0002` swappable provider, `0003` compliance boundary / data minimisation, `docs/prompting-log.md` (kept as we go), `README.md`.
- Order: A → B → C → wrap-up, one commit per phase.

## Part A content
- Questions (★ = most design-changing): L1 approval & portals/format; L2 pilot markets/languages/offices; M1 written brand guide per language & owner; M2 how brand fit is judged today; C1★ data leaving perimeter/EU & approved vendors (DPA); C2 legal limits on ad text (anti-discrimination, mandatory fields e.g. DE energy certificate); I1★ where Listings live (PMS/CRM), API, write-back; I2 SSO/IdP, devices, hosting/region.
- Assumptions: 1 country, 1 office, 15–20 Agents; text only, no photos; publish via copy-paste; Agent is the only user.
- Metrics: time-to-publish −50% vs week-1 baseline; Draft edit rate <30% (normalized edit distance); adoption >70% of new Listings by week 6.
- Risks: compliance blocks vendor → adapter + EU-region fallback, C1 in week 1; hallucinated facts → facts-only prompt, human approve, eval set; low adoption → few-tap mobile flow, champions, weekly feedback.
- Plan: W1 answers C1/I1, brand guide, baseline; W2–3 generator, SSO, validation, logging, eval set; W4 internal test with Marketing, prompt tuning; W5–6 pilot 15–20 Agents, metrics, go/no-go for phase 2.

## Part B content
- Patterns: Ports & Adapters (LLM), service layer, DTO + schema validation at every boundary, config-as-data for Brand Voice Guide. Deliberately not: Repository for Listings (one impl), Strategy for languages (it's a prompt param).
- Team: Dev1 backend core; Dev2 frontend/mobile; Dev3 platform (SSO, EU hosting, observability, CI); Dev4 prompt/eval with Marketing. First: thin end-to-end path against the real model.
