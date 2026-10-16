"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, type Listing } from "./api";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setListings)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <div className="toolbar">
        <h1>Listings</h1>
        <Link className="button" href="/listings/new">
          New listing
        </Link>
      </div>
      {failed && <p role="alert">Could not load Listings. Please refresh.</p>}
      {!listings && !failed && <p aria-live="polite">Loading…</p>}
      <ul className="listings">
        {listings?.map((l) => (
          <li key={l.id} className="card">
            <strong>
              {l.city} · {l.district}
            </strong>
            <span>
              {l.deal_type === "rent" ? "For rent" : "For sale"} · {formatPrice(l)}
            </span>
            <span className={l.listing_description ? "badge done" : "badge todo"}>
              {l.listing_description ? "Has description" : "Needs description"}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
