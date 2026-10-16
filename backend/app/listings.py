"""Listings: a static seed loaded into memory. Changes are lost on restart, by design (see docs/architecture.md)."""

import json
import uuid
from pathlib import Path
from typing import Annotated

from pydantic import Field, StringConstraints

from app.drafting import GUIDE, MAX_HIGHLIGHTS, MIN_HIGHLIGHTS, Draft, ListingFacts, Text


class ListingDescription(Draft):
    """A Draft the Agent has approved, possibly after editing it. Held to the Brand Voice Guide's length limits."""

    headline: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=GUIDE.headline_max_chars)]
    description: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=GUIDE.description_max_chars)
    ]
    highlights: list[Text] = Field(min_length=MIN_HIGHLIGHTS, max_length=MAX_HIGHLIGHTS)


class ApprovedListing(ListingFacts):
    """What the Agent sends on Approve: the Unit facts plus the approved Listing Description."""

    listing_description: ListingDescription


class Listing(ListingFacts):
    id: str
    listing_description: ListingDescription | None = None


_seed = json.loads((Path(__file__).parent / "seed_listings.json").read_text())
LISTINGS = {item["id"]: Listing.model_validate(item) for item in _seed}


def save_listing(body: ApprovedListing, listing_id: str | None = None) -> Listing:
    """Creates a Listing, or replaces the facts and Listing Description of an existing one when given its id."""
    listing = Listing(id=listing_id or uuid.uuid4().hex, **body.model_dump())
    LISTINGS[listing.id] = listing
    return listing
