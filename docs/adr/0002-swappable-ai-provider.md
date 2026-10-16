# 0002: Swappable AI provider behind our own port

**Context:** The vendor is the part most likely to change: Compliance (C1) may require EU-region or self-hosted inference, and cost or quality may favour another model.

**Options:** (a) call a vendor SDK directly from the domain; (b) adopt a multi-vendor framework (LangChain, LiteLLM); (c) our own narrow port with one adapter per vendor.

**Decision:** (c). The port is a single operation: generate structured output from a system prompt, a user prompt and a JSON schema, returning the parsed object plus usage (tokens, latency). The domain owns prompts, schemas and validation. Adapters (Anthropic direct, Anthropic via an EU cloud region, a self-hosted model, Mock) are chosen by config, and the gateway chains a fallback adapter.

**Trade-offs:** we maintain small adapters ourselves, and vendor-specific features are only available if we add them to the port. A framework would save the adapters but add a large dependency and abstraction for one call shape. What makes a switch *safe* is not the code but the eval harness: a new vendor means one new adapter plus an eval run to re-tune prompts before go-live.
