# 04: Approve a Draft into the Listing Description

**What to build:** The Agent edits the Draft or regenerates it, then approves it. A new Listing then appears in the Listings list with its Listing Description; an existing Listing gets its Listing Description replaced. Opening an existing Listing shows its facts prefilled in the same form, and the approved Listing Description can be copied in one tap for publishing to portals.

**Blocked by:** 01

**Status:** ready-for-agent

Spec: `.scratch/listing-assistant/spec.md`

- [ ] Draft headline, description and highlights are editable before approval
- [ ] Regenerate produces a new Draft from the current facts
- [ ] Approve on a new Listing creates it; approve on an existing Listing updates its facts and Listing Description (in memory only, lost on restart)
- [ ] Listings list reflects the change immediately, including "has Listing Description"
- [ ] Opening an existing Listing loads the same form with its facts prefilled and shows its current Listing Description
- [ ] Copy action copies the approved Listing Description to the clipboard
- [ ] All text rendered as plain text, never raw HTML
