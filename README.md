# Northstar Living · Listing Assistant

An Agent enters a Unit's facts on a phone or desktop. The app returns an AI-written Draft (headline, description, highlights) in English, German or Polish, written to the Brand Voice Guide. The Agent edits it, regenerates it or approves it into the Listing's Listing Description.

Vocabulary: [GLOSSARY.md](GLOSSARY.md) · Part A: [docs/requirements.md](docs/requirements.md) · Part B: [docs/architecture.md](docs/architecture.md), [docs/adr/](docs/adr/) · How it was built: [docs/prompting-log.md](docs/prompting-log.md)

## Run it

```sh
cp .env.example .env       # leave ANTHROPIC_API_KEY empty to run on the mock provider
docker compose up --build  # → http://localhost:3000
```

Without a key, the app runs on the **mock provider**. Every Draft is then the same canned text that says it is a mock, and the backend logs a warning at startup. The whole flow still works: list, new Listing, generate, edit, approve, copy. **The real feature needs `ANTHROPIC_API_KEY`.** The default model is `claude-haiku-5-5`; set `ANTHROPIC_MODEL` to change it.

**Without Docker** (Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 22), in two terminals:

```sh
cd backend && uv sync && uv run --env-file ../.env uvicorn app.main:app --port 8000
cd frontend && npm ci && npm run dev   # → http://localhost:3000, proxies /api to :8000
```

Tests: `cd backend && uv run pytest`. To serve the API docs at `/api/docs`, set `DEV_MODE=true` in `.env`.

## What is real, what is mocked

**Real AI feature: the Smart Listing Generator.** It saves Agents the most time, because every Listing needs a description, often written on a phone, and it is the feature where brand consistency and the compliance boundary actually matter. It is also safe to ship first: a human approves every Draft before it is used, and the model gets only non-personal Unit facts.

| Part | In the slice |
|---|---|
| Draft generation | Real Anthropic call (structured output through one tool), validated against the [Brand Voice Guide](backend/app/brand_voice_guide.yaml) (schema, banned phrases, length limits). One retry with the reasons, then fail closed |
| LLM provider | Mock adapter when no key is set; tests always use it |
| Listings store | Mocked: 6 seed Listings in memory. Creates and approvals are lost on restart |
| Auth | None: a single implicit Agent. The target is corporate OIDC SSO with RBAC by country and office ([architecture](docs/architecture.md)) |
| PMS / CRM, publishing | Not integrated. Facts are typed in; the Agent pastes the Listing Description into the portals (Copy button) |
| PII redaction, rate limits, fallback model, evals | Designed in [docs/architecture.md](docs/architecture.md), not built |

## OWASP Top 10:2025

| | Category | How it is handled |
|---|---|---|
| A01 | Broken Access Control | No auth in the slice (out of scope). The backend is not published by compose: the browser reaches it only through the UI's same-origin `/api` proxy, and the vendor key never leaves the server. The target is SSO sessions plus RBAC by country and office at trust boundary 1 ([docs/architecture.md](docs/architecture.md)). |
| A02 | Security Misconfiguration | All config comes from env vars; `.env` is git-ignored and only `.env.example` is committed. API docs are off unless `DEV_MODE` is set. The UI sends CSP, `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`, and no `X-Powered-By`. Both containers run as non-root. |
| A03 | Software Supply Chain Failures | Locked dependencies (`uv.lock` with `uv sync --locked`, `package-lock.json` with `npm ci`), exact npm versions, pinned base image tags. Missing: SCA/Dependabot in CI and image digests. |
| A04 | Cryptographic Failures | No secrets or personal data stored, and the key stays server-side. The slice runs plain HTTP on localhost; the target terminates TLS (plus HSTS) at the EU platform edge. |
| A05 | Injection | Strict request DTOs: enums, numeric ranges, fixed feature tags, notes up to 300 chars, extra fields rejected. Notes are escaped and wrapped in `<notes>` as data, and the model gets no tools that act, only one tool that carries the output schema. React renders all AI text as plain text, never as HTML. |
| A06 | Insecure Design | Threat-led design in [docs/architecture.md](docs/architecture.md) and [ADR 0003](docs/adr/0003-compliance-boundary.md). Prompts are built from an allow-listed DTO, never from stored records, so no personal data reaches the vendor. Model output is untrusted and checked fail-closed. Nothing is used without a human Approve. |
| A07 | Authentication Failures | Not in the slice. The target uses corporate OIDC SSO, so the app keeps no passwords of its own ([docs/architecture.md](docs/architecture.md)). |
| A08 | Software or Data Integrity Failures | Model output is checked against the schema and the brand rules before any Agent sees it, and the Listing Description is checked against the length limits again on save. The Brand Voice Guide is versioned in git. |
| A09 | Security Logging and Alerting Failures | One structured log line per model call: request id, model, attempt, tokens, latency, outcome. Prompt and output text are never logged. Every response carries `X-Request-ID`. Alerting is part of the target ([docs/architecture.md](docs/architecture.md)). |
| A10 | Mishandling of Exceptional Conditions | Global handlers: a failed Draft becomes a generic 502, bad input a 422 with field messages, anything else a generic 500. Every response carries `X-Request-ID` (the 502 and 500 bodies repeat it), with no stack traces or vendor messages (covered by tests). Vendor calls time out after 60 s, and invalid output is never returned. |

## With more time

1. **PII redaction on notes.** Notes are the one free-text field that reaches the vendor, so today the compliance boundary (ADR 0003) depends on Agents not typing a tenant's name or phone number into them. Redaction belongs in the `ai_gateway` facade, so there is a single place to audit.
2. **Offline eval harness plus a numeric fact check.** The validator enforces brand rules but cannot tell when a Draft invents or changes a fact, such as the wrong m² or price. Golden fact sets with rule checks and an LLM-judge rubric would make prompt, guide and model changes safe to ship.
3. **SSO, RBAC and Postgres.** This closes the A01/A07 gap. Listing Descriptions would be stored with their approver and Brand Voice Guide version instead of being lost on restart, which also makes the Draft edit-rate metric measurable.
