"""Listings: a static seed loaded into memory. Changes are lost on restart, by design (see docs/architecture.md)."""

import json
from pathlib import Path

from app.drafting import Draft, ListingFacts


class ListingDescription(Draft):
    """A Draft the Agent has approved."""


class Listing(ListingFacts):
    id: str
    listing_description: ListingDescription | None = None


_seed = json.loads((Path(__file__).parent / "seed_listings.json").read_text())
LISTINGS = {item["id"]: Listing.model_validate(item) for item in _seed}
