"""Listings: a static seed loaded into memory. Changes are lost on restart, by design (see docs/architecture.md)."""

import json
from pathlib import Path

from app.drafting import Draft, UnitFacts


class Listing(UnitFacts):
    id: str
    listing_description: Draft | None = None  # the approved Draft


_seed = json.loads((Path(__file__).parent / "seed_listings.json").read_text())
LISTINGS = {item["id"]: Listing.model_validate(item) for item in _seed}
