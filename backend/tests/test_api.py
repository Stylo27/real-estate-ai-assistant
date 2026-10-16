from fastapi.testclient import TestClient

from app.llm import MockProvider
from app.main import app, get_llm

FACTS = {
    "deal_type": "rent", "bedrooms": 2, "bathrooms": 1, "size_m2": 64, "city": "Berlin",
    "district": "Prenzlauer Berg", "price": 1850, "currency": "EUR", "features": ["balcony"], "language": "en",
}


def test_draft_that_fails_validation_twice_returns_a_generic_error_with_request_id():
    app.dependency_overrides[get_llm] = lambda: MockProvider([{"headline": "Act fast: dream home"}])
    try:
        response = TestClient(app).post("/api/drafts", json=FACTS)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 502
    body = response.json()
    assert body == {"detail": "Could not generate a draft. Please try again.", "request_id": body["request_id"]}
    assert body["request_id"] and body["request_id"] == response.headers["X-Request-ID"]


class FailingProvider(MockProvider):
    def generate(self, system, user, schema):
        raise RuntimeError("vendor says: invalid x-api-key sk-secret")


def test_unexpected_error_returns_a_generic_500_without_internals():
    app.dependency_overrides[get_llm] = lambda: FailingProvider()
    try:
        response = TestClient(app).post("/api/drafts", json=FACTS)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert "sk-secret" not in response.text and "Traceback" not in response.text
    assert response.json()["request_id"] == response.headers["X-Request-ID"]
