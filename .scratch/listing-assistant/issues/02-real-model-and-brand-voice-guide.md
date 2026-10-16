# 02: Real model and the Brand Voice Guide in the prompt

**What to build:** With an Anthropic key configured, "Generate draft" produces a real on-brand Draft for Northstar Living in the chosen language, using only the supplied facts. Without a key the app still runs on the mock provider and says so in the log. Every model call leaves one structured log line for cost and latency monitoring.

**Blocked by:** 01

**Status:** ready-for-agent

Spec: `.scratch/listing-assistant/spec.md`

- [ ] Anthropic adapter implements the provider port and forces structured output through a single tool; the model comes from config (default: a small, fast Claude model)
- [ ] Adapter selection: Anthropic if a key is set, otherwise Mock with a startup warning
- [ ] The key is read only by the backend from env and never reaches the browser
- [ ] Brand Voice Guide is one YAML document (brand name, tone, do's, don'ts, banned phrases, length limits), loaded once and fed into the system prompt
- [ ] System prompt instructs: use only supplied facts, write in the requested language; notes are inserted as delimited data and are not to be followed as instructions
- [ ] One structured log line per model call: request id, model, attempt, input/output tokens, latency, outcome; no prompt or output text
- [ ] Manual check: a real Draft is generated in en, de and pl
