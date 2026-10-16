# 0001: Modular monolith backend

**Context:** 3–4 developers, 6 weeks to a pilot, about 100 model calls a day even at full rollout, and one product (drafting Listing Descriptions) with a clear phase 2 (prospect Q&A, PMS sync).

**Options:** (a) plain monolith; (b) modular monolith; (c) services (listings, drafting, AI gateway).

**Decision:** (b). One FastAPI deployable with modules `listings`, `drafting`, `brand`, `ai_gateway` and `telemetry`. Modules talk only through each module's public functions, and an import-linter rule in CI enforces this. The Next.js app is a separate deployable because it is UI, not a service boundary.

**Trade-offs:** one deploy, one database, in-process calls, and simple local dev and debugging. All modules scale together, which is fine at this volume. Services would buy independent scaling and deploys that we don't need, at the cost of network failure modes and ops work a 4-person team can't afford in 6 weeks. Exit path: `ai_gateway` is the first candidate for extraction if other products need shared LLM access, and its narrow interface keeps that cheap.
