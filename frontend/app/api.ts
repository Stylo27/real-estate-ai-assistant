// Mirrors backend/app/drafting.py and listings.py. The backend is the validator; these types only shape the UI.

export const FEATURES = {
  balcony: "Balcony",
  terrace: "Terrace",
  garden: "Garden",
  parking: "Parking",
  elevator: "Elevator",
  pets_allowed: "Pets allowed",
  furnished: "Furnished",
  air_conditioning: "Air conditioning",
  storage: "Storage",
  new_build: "New build",
} as const;
export type Feature = keyof typeof FEATURES;

export type Draft = { headline: string; description: string; highlights: string[] };

export type Listing = {
  id: string;
  deal_type: "rent" | "sale";
  city: string;
  district: string;
  price: number;
  currency: string;
  listing_description: Draft | null;
};

// FastAPI 422 body: {detail: [{loc: ["body", field, ...], msg}]} → {field: msg}
export function fieldErrors(body: { detail?: { loc: (string | number)[]; msg: string }[] }) {
  const errors: Record<string, string> = {};
  for (const { loc, msg } of body.detail ?? []) errors[String(loc[1] ?? "form")] ??= msg;
  return errors;
}

export function formatPrice({ price, currency, deal_type }: Pick<Listing, "price" | "currency" | "deal_type">) {
  const amount = new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
  return deal_type === "rent" ? `${amount} / month` : amount;
}
