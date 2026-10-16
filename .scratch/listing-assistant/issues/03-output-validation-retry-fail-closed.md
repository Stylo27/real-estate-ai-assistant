# 03: Output validation with retry, failing closed

**What to build:** A Draft that breaks the schema or the Brand Voice Guide never reaches the Agent. The system retries once, telling the model what was wrong; if the second attempt also fails the Agent sees a clear, non-technical error with a request id and can try again. No internals ever leak in an error.

**Blocked by:** 01

**Status:** ready-for-agent

Spec: `.scratch/listing-assistant/spec.md`

- [ ] Validator checks the schema (fields, types, highlight count) and Brand Voice Guide rules (banned phrases case-insensitive, headline and description length limits), returning human-readable violations
- [ ] On violation the Draft Service calls the model once more with the violations included; a second failure raises a domain error and returns no Draft
- [ ] Global error handling: domain error → generic "could not generate a draft" with an upstream-failure status; validation → 422; anything else → generic 500; every response carries a request id; no stack traces or vendor messages
- [ ] Validation outcome and attempt number appear in the per-call log line
- [ ] UI shows the generic error message and keeps the Agent's entered facts
- [ ] pytest via the Draft Service with the mock provider: violation → retry includes violations → valid Draft; two violations → domain error
- [ ] pytest via the HTTP test client with the provider overridden by Mock: two failures → generic error with request id, no internal details
