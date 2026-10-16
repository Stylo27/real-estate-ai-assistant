# 0003: Compliance boundary: one outbound path, allow-listed data

**Context:** Compliance worries about what reaches external AI vendors. GDPR applies, and EU data residency is likely but unconfirmed (C1).

**Options:** (a) send full Listing records and filter by convention; (b) one outbound path that builds prompts only from an allow-listed DTO, with redaction; (c) self-host a model, so no vendor at all.

**Decision:** (b), with (c) kept ready as an adapter. All model calls go through `ai_gateway`. Prompts are built from a request DTO containing only Unit facts, Deal Type, price, language and the Brand Voice Guide, never from database records, so new fields can't leak by accident. Free-text notes pass PII redaction. Inference runs in an EU region under a DPA with zero retention. If C1 forbids data leaving our cloud, the self-hosted adapter becomes a config change plus an eval run.

**Trade-offs:** the model has less context (no prospect personalisation), redaction will have false positives, and EU regions may get new models later. In return, Compliance gets a single place to audit, and "no customer data leaves the EU" is already true of the design.
