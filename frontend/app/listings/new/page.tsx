"use client";

import { useState, type FormEvent } from "react";
import { FEATURES, fieldErrors, type Draft, type Feature } from "../../api";

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

export default function NewListingPage() {
  const [facts, setFacts] = useState(INITIAL);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);

  // Common props for an input bound to `facts`, wired to its error message for screen readers.
  const bind = (name: Field) => ({
    id: name,
    name,
    value: facts[name],
    onChange: (e: { target: { value: string } }) => setFacts({ ...facts, [name]: e.target.value }),
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  const error = (name: string) =>
    errors[name] && (
      <p id={`${name}-error`} className="error">
        {errors[name]}
      </p>
    );

  async function generate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const body: Record<string, unknown> = { ...facts, features };
    // Empty number fields are left out so the backend reports "Field required".
    for (const n of NUMBERS) body[n] = facts[n] === "" ? undefined : Number(facts[n]);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 422) setErrors(fieldErrors(await res.json()));
      else if (!res.ok) setErrors({ form: "Could not generate a draft. Please try again." });
      else setDraft(await res.json());
    } catch {
      setErrors({ form: "Could not reach the server. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>New listing</h1>
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
          <textarea rows={3} {...bind("notes")} />
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
        <button type="submit" disabled={loading}>
          {loading ? "Generating…" : "Generate draft"}
        </button>
      </form>

      <section aria-live="polite" aria-busy={loading}>
        {draft && (
          <article className="card draft">
            <h2>{draft.headline}</h2>
            <p className="description">{draft.description}</p>
            <ul>
              {draft.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </article>
        )}
      </section>
    </>
  );
}
