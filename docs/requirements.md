# Part A — Requirements Discovery

**What is actually being asked:** cut the time Agents spend writing Listing Descriptions, on a phone, in the brand voice, without sending data Compliance hasn't approved. The "same questions from prospects" pain is real but riskier (external users, hallucination, prospect PII), so it is phase 2.

## Clarifying questions (★ = would most change the design)

| Stakeholder | Question |
|---|---|
| Leasing | **L1.** Who approves a description before it goes live (the Agent alone or a manager), and to which portals, in what format and length limits? |
| Leasing | **L2.** Which markets, languages and offices are in the pilot? |
| Marketing | **M1.** Is there a written brand guide per language, and who owns changes to it? |
| Marketing | **M2.** How do you judge "sounds like our brand" today, and who reviews? |
| Compliance | **C1 ★** Which data may leave our perimeter or the EU, and which AI vendors are approved (DPA in place)? *Decides where inference runs: vendor API, EU-region cloud, or self-hosted.* |
| Compliance | **C2.** What legal limits apply to listing text (anti-discrimination wording, mandatory fields such as the DE energy certificate)? |
| IT | **I1 ★** Where do Listings live today (PMS/CRM), is there an API, and must approved text be written back? *Decides whether we build an integration module or stay copy-paste.* |
| IT | **I2.** Which SSO/IdP, which devices do Agents carry, any hosting or region constraints? |

## Assumptions (until answered)
- Pilot: one country, one office, 15–20 Agents.
- Text only: no photos, no translation of existing descriptions.
- Agents publish by copy-paste; no PMS/CRM integration in the pilot.
- The Agent is the only user; prospects never talk to the AI directly.
- Only Unit/Listing facts go to the model; no prospect or owner personal data.

## Users and jobs-to-be-done
- **Agent** (on the road, often on a phone): "Turn the facts of a Unit into a publishable, on-brand description in a couple of minutes."
- **Marketing**: "Every Listing sounds like us, in every language, without me reviewing each one."
- **Compliance**: "Know exactly what data leaves the company, and to whom."
- **Head of Leasing & Sales**: "Agents spend their time on prospects, not on writing."

## Success metrics
1. **Time-to-publish**: median time from "New listing" to approved description, −50% vs a week-1 baseline measured without AI.
2. **Draft edit rate**: normalized edit distance between Draft and approved text, below 30% (also our proxy for AI quality).
3. **Adoption**: over 70% of new Listings in the pilot office created through the assistant by week 6.

## Scope
- **In:** Smart Listing Generator for Agents: enter facts, get a Draft in the Brand Voice Guide, edit or regenerate, approve. Mobile-first web app, SSO, EU-hosted, output validation, usage and quality logging.
- **Out (and why):** prospect-facing Q&A (external users, injection and hallucination risk, prospect PII; phase 2). PMS/CRM write-back (depends on I1). Photos and image analysis (separate product). Rollout beyond one office (prove the metrics first).

**6-week plan:** W1 answers to C1/I1, brand guide from Marketing, baseline measurement · W2–3 generator, SSO, validation, logging, eval set · W4 internal test with Marketing, prompt tuning · W5–6 pilot with 15–20 Agents, metrics, go/no-go for phase 2.

## Top 3 risks
1. **Compliance blocks the vendor** → provider behind an adapter, EU-region inference as fallback; resolve C1 in week 1.
2. **AI invents facts** (a balcony that doesn't exist) → generate only from supplied facts, mandatory human approval, eval set of known hallucination traps.
3. **Agents don't adopt it** → a few-tap mobile flow, champion Agents in the pilot office, weekly feedback loop.
