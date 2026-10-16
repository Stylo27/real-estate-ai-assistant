"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FEATURES, fieldErrors, type Draft, type Feature, type Listing } from "../api";

const NUMBERS = ["bedrooms", "bathrooms", "size_m2", "price"] as const;

const INITIAL = {
  deal_type: "rent",
  bedrooms: "",
  bathrooms: "",
  size_m2: "",
  city: "",
  district: "",
  price: "",
  currency: "EUR",
  notes: "",
  language: "en",
};
type Field = keyof typeof INITIAL;

function toForm(l: Listing): typeof INITIAL {
  return {
    ...INITIAL,
    deal_type: l.deal_type,
    bedrooms: String(l.bedrooms),
    bathrooms: String(l.bathrooms),
    size_m2: String(l.size_m2),
    city: l.city,
    district: l.district,
    price: String(l.price),
    currency: l.currency,
    notes: l.notes,
  };
}

// What lands on the clipboard: plain text, ready to paste into a portal.
const asText = (d: Draft) => [d.headline, d.description, d.highlights.map((h) => `• ${h}`).join("\n")].join("\n\n");

/** One form for new and existing Listings: Unit facts → Draft → edit → Approve into the Listing Description. */
export default function ListingForm({ listing }: { listing?: Listing }) {
  const router = useRouter();
  const [facts, setFacts] = useState(listing ? toForm(listing) : INITIAL);
  const [features, setFeatures] = useState<Feature[]>(listing?.features ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [approved, setApproved] = useState(listing?.listing_description ?? null);
  const [busy, setBusy] = useState<"generate" | "approve" | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  // Marks an input invalid and wires it to its error message for screen readers.
  const a11y = (name: string) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  const bind = (name: Field) => ({
    id: name,
    name,
    value: facts[name],
    onChange: (e: { target: { value: string } }) => setFacts({ ...facts, [name]: e.target.value }),
    ...a11y(name),
  });
  const error = (name: string) =>
    errors[name] && (
      <p id={`${name}-error`} className="error">
        {errors[name]}
      </p>
    );

  function factsBody() {
    const body: Record<string, unknown> = { ...facts, features };
    // Empty number fields are left out so the backend reports "Field required".
    for (const n of NUMBERS) body[n] = facts[n] === "" ? undefined : Number(facts[n]);
    return body;
  }

  // Returns the response body, or undefined after showing the error. Failure messages go under `errorKey`.
  async function send(action: "generate" | "approve", url: string, method: string, body: object, errorKey: string) {
    setBusy(action);
    setErrors({});
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) return await res.json();
      if (res.status === 422) setErrors(fieldErrors(await res.json()));
      else {
        // The entered facts and Draft stay on screen so the Agent can simply retry.
        const ref = res.headers.get("X-Request-ID");
        const what = action === "generate" ? "generate a draft" : "approve the draft";
        setErrors({ [errorKey]: `Could not ${what}. Please try again.${ref ? ` (Reference: ${ref})` : ""}` });
      }
    } catch {
      setErrors({ [errorKey]: "Could not reach the server. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function generate(e?: FormEvent) {
    e?.preventDefault();
    const result = await send("generate", "/api/drafts", "POST", factsBody(), "form");
    if (result) setDraft(result);
  }

  async function approve() {
    if (!draft) return;
    const body = factsBody();
    delete body.language; // Not a Listing fact; it only steers the Draft.
    body.listing_description = { ...draft, highlights: draft.highlights.map((h) => h.trim()).filter(Boolean) };
    const saved: Listing | undefined = listing
      ? await send("approve", `/api/listings/${encodeURIComponent(listing.id)}`, "PUT", body, "approve")
      : await send("approve", "/api/listings", "POST", body, "approve");
    if (!saved) return;
    setDraft(null);
    setApproved(saved.listing_description);
    setCopyStatus("");
    if (!listing) router.replace(`/listings/${encodeURIComponent(saved.id)}`);
  }

  async function copy() {
    if (!approved) return;
    try {
      await navigator.clipboard.writeText(asText(approved));
      setCopyStatus("Copied.");
    } catch {
      setCopyStatus("Could not copy. Select the text and copy it manually.");
    }
  }

  return (
    <>
      <h1>{listing ? `${listing.city} · ${listing.district}` : "New listing"}</h1>

      {approved && (
        <section className="card approved" aria-labelledby="approved-title">
          <p id="approved-title" className="label">
            Listing Description
          </p>
          <h2>{approved.headline}</h2>
          <p className="description">{approved.description}</p>
          <ul>
            {approved.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
          <div className="actions">
            <button type="button" onClick={copy}>
              Copy
            </button>
            <span aria-live="polite">{copyStatus}</span>
          </div>
        </section>
      )}

      <form onSubmit={generate} noValidate className="form">
        <div className="field">
          <label htmlFor="deal_type">Deal Type</label>
          <select {...bind("deal_type")}>
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
          {error("deal_type")}
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input type="number" inputMode="numeric" {...bind("bedrooms")} />
            {error("bedrooms")}
          </div>
          <div className="field">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input type="number" inputMode="numeric" {...bind("bathrooms")} />
            {error("bathrooms")}
          </div>
          <div className="field">
            <label htmlFor="size_m2">Size (m²)</label>
            <input type="number" inputMode="decimal" {...bind("size_m2")} />
            {error("size_m2")}
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="city">City</label>
            <input {...bind("city")} />
            {error("city")}
          </div>
          <div className="field">
            <label htmlFor="district">District</label>
            <input {...bind("district")} />
            {error("district")}
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="price">Price</label>
            <input type="number" inputMode="numeric" {...bind("price")} />
            {error("price")}
          </div>
          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select {...bind("currency")}>
              <option>EUR</option>
              <option>PLN</option>
              <option>GBP</option>
            </select>
            {error("currency")}
          </div>
        </div>
        <fieldset className="field">
          <legend>Features</legend>
          <div className="chips">
            {(Object.keys(FEATURES) as Feature[]).map((f) => (
              <label key={f} className="chip">
                <input
                  type="checkbox"
                  checked={features.includes(f)}
                  onChange={(e) => setFeatures(e.target.checked ? [...features, f] : features.filter((x) => x !== f))}
                />
                {FEATURES[f]}
              </label>
            ))}
          </div>
          {error("features")}
        </fieldset>
        <div className="field">
          <label htmlFor="notes">Notes ({facts.notes.length}/300)</label>
          <textarea rows={3} maxLength={300} {...bind("notes")} />
          {error("notes")}
        </div>
        <div className="field">
          <label htmlFor="language">Language</label>
          <select {...bind("language")}>
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="pl">Polish</option>
          </select>
          {error("language")}
        </div>
        {error("form")}
        <button type="submit" disabled={!!busy}>
          {busy === "generate" ? "Generating…" : "Generate draft"}
        </button>
      </form>

      <section aria-live="polite" aria-busy={!!busy}>
        {draft && (
          <div className="card draft form">
            <h2>Draft</h2>
            <div className="field">
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                value={draft.headline}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                {...a11y("listing_description.headline")}
              />
              {error("listing_description.headline")}
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={8}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                {...a11y("listing_description.description")}
              />
              {error("listing_description.description")}
            </div>
            <div className="field">
              <label htmlFor="highlights">Highlights (one per line)</label>
              <textarea
                id="highlights"
                rows={5}
                value={draft.highlights.join("\n")}
                onChange={(e) => setDraft({ ...draft, highlights: e.target.value.split("\n") })}
                {...a11y("listing_description.highlights")}
              />
              {error("listing_description.highlights")}
            </div>
            {error("approve")}
            <div className="actions">
              <button type="button" onClick={approve} disabled={!!busy}>
                {busy === "approve" ? "Approving…" : "Approve"}
              </button>
              <button type="button" className="secondary" onClick={() => generate()} disabled={!!busy}>
                {busy === "generate" ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
