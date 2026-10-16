from fastapi.testclient import TestClient

from app.llm import MockProvider
from app.main import app, get_llm

FACTS = {
    "deal_type": "rent", "bedrooms": 2, "bathrooms": 1, "size_m2": 64, "city": "Berlin",
    "district": "Prenzlauer Berg", "price": 1850, "currency": "EUR", "features": ["balcony"], "language": "en",
}


def post_draft(llm_factory):
    app.dependency_overrides[get_llm] = llm_factory
    try:
        return TestClient(app).post("/api/drafts", json=FACTS)
    finally:
        app.dependency_overrides.clear()


def test_draft_that_fails_validation_twice_returns_a_generic_error_with_request_id():
    response = post_draft(lambda: MockProvider([{"headline": "Act fast: dream home"}]))

    assert response.status_code == 502
    body = response.json()
    assert body == {"detail": "Could not generate a draft. Please try again.", "request_id": body["request_id"]}
    assert body["request_id"] and body["request_id"] == response.headers["X-Request-ID"]


def test_provider_failure_returns_the_generic_error_without_the_vendor_message():
    response = post_draft(lambda: MockProvider([RuntimeError("vendor says: invalid x-api-key sk-secret")]))

    assert response.status_code == 502
    assert "sk-secret" not in response.text


def test_unexpected_error_returns_a_generic_500_without_internals():
    def broken():
        raise RuntimeError("internal detail: /srv/app/secrets.py")

    response = post_draft(broken)

    assert response.status_code == 500
    assert "internal detail" not in response.text and "Traceback" not in response.text
    assert response.json()["request_id"] == response.headers["X-Request-ID"]


DESCRIPTION = {
    "headline": "Two-bedroom flat with balcony in Prenzlauer Berg",
    "description": "A 64 m² flat with a balcony.",
    "highlights": ["Balcony", "Lift", "64 m²"],
}
LISTING = {k: v for k, v in FACTS.items() if k != "language"} | {"listing_description": DESCRIPTION}


def test_approving_a_new_listing_creates_it_with_its_listing_description():
    client = TestClient(app)

    created = client.post("/api/listings", json=LISTING)

    assert created.status_code == 201
    listing = created.json()
    assert listing["listing_description"] == DESCRIPTION and listing["city"] == "Berlin"
    assert client.get(f"/api/listings/{listing['id']}").json() == listing
    assert listing in client.get("/api/listings").json()


def test_approving_an_existing_listing_replaces_its_facts_and_listing_description():
    client = TestClient(app)
    listing_id = client.post("/api/listings", json=LISTING).json()["id"]
    new_description = DESCRIPTION | {"headline": "Bright two-bedroom flat in Prenzlauer Berg"}

    updated = client.put(f"/api/listings/{listing_id}", json=LISTING | {"price": 1900, "listing_description": new_description})

    assert updated.status_code == 200
    listing = client.get(f"/api/listings/{listing_id}").json()
    assert listing["id"] == listing_id and listing["price"] == 1900
    assert listing["listing_description"] == new_description


def test_unknown_listing_returns_404_and_approving_it_creates_nothing():
    client = TestClient(app)

    assert client.get("/api/listings/no-such-listing").status_code == 404
    assert client.put("/api/listings/no-such-listing", json=LISTING).status_code == 404
    assert client.get("/api/listings/no-such-listing").status_code == 404


def test_blank_or_too_long_listing_description_is_rejected_field_by_field():
    client = TestClient(app)
    description = DESCRIPTION | {"headline": "   ", "description": "x" * 5000}

    response = client.post("/api/listings", json=LISTING | {"listing_description": description})

    assert response.status_code == 422
    assert {tuple(e["loc"]) for e in response.json()["detail"]} == {
        ("body", "listing_description", "headline"), ("body", "listing_description", "description"),
    }
