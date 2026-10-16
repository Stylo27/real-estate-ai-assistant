# 05: Hardening and delivery docs

**What to build:** A reviewer can clone the repo, follow the README, run the app with one command and understand what is real, what is mocked, and how each OWASP Top 10:2025 category is handled. Baseline security controls are in place and the prompting log is up to date.

**Blocked by:** 02, 03, 04

**Status:** ready-for-agent

Spec: `.scratch/listing-assistant/spec.md`

- [x] Basic security headers on the UI responses; interactive API docs disabled unless dev mode is on
- [x] Verified at phone and desktop widths; touch targets and keyboard use are reasonable
- [x] README: how to run (one command, plus a manual fallback without Docker), which feature is the real AI one and why (two sentences), what is mocked, the mock fallback when no key is set
- [x] README: OWASP Top 10:2025, one line per category, with at least A01 and A06 tied to `docs/architecture.md`
- [x] README: "With more time", top three next steps in priority order with reasons (PII redaction first)
- [x] `docs/prompting-log.md` has 3–4 representative prompts, including at least one rejection or correction with the reason
- [x] Clean-checkout run verified: clone, copy the example env, one command, the app works (verified on the mock provider; the `.env` copy was blocked by the local Claude deny rule, so the run used no `.env`, which is equivalent since every example value is empty or a default)
