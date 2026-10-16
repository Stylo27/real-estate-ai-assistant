# Prompting Log

Representative prompts used to drive the build with Claude Code. Steering files: `CLAUDE.md`, `GLOSSARY.md`, `docs/adr/`, `.scratch/listing-assistant/spec.md`.

## 1. Discovery via structured grilling (Part A/B)

**Prompt:** `/grill-with-docs` — "I need to build an AI real-estate assistant app for a Senior Fullstack AI-native take-home. All details in the assignment docx."

**What happened:** the AI interviewed me in rounds (feature choice, stack, provider, senior concern, UX flow, OWASP, assumptions, metrics, risks, plan, patterns, team), proposing a recommended answer per question. Resolved terms went straight into `GLOSSARY.md` (Unit vs Listing vs Draft).

**Where I corrected it:**
- Rejected its proposed Next.js-only stack in favour of **FastAPI + Next.js**: Python/FastAPI is my primary stack, so I move fastest in it and can review the AI's output critically. It also keeps the domain and integration layers in a backend clearly separate from the UI.
- Challenged its UX flow, which had no "New listing" path. Writing a description happens when a Listing goes on the market, so "New listing" became the primary flow, and editing an existing Listing reuses the same form.
- Asked it to justify its Part A assumptions and the two "most design-changing" questions instead of accepting them; the justification (they change components and trust boundaries, not just config) is now in the requirements doc.
