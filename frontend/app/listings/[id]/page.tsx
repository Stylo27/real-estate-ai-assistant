"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { type Listing } from "../../api";
import ListingForm from "../ListingForm";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setListing)
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) return <p role="alert">Could not load this Listing. Go back to the Listings and try again.</p>;
  if (!listing) return <p aria-live="polite">Loading…</p>;
  return <ListingForm listing={listing} />;
}
