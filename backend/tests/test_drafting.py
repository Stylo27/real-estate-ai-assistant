from app.drafting import Draft, DraftRequest, generate_draft
from app.llm import MockProvider

REQUEST = DraftRequest(
    deal_type="rent",
    bedrooms=2,
    bathrooms=1,
    size_m2=64,
    city="Berlin",
    district="Prenzlauer Berg",
    price=1850,
    currency="EUR",
    features=["balcony", "elevator"],
    notes="Quiet courtyard side, renovated kitchen.",
    language="en",
)


def test_valid_model_response_produces_a_draft():
    llm = MockProvider([
        {
            "headline": "Two-bedroom flat with balcony in Prenzlauer Berg",
            "description": "A 64 m² flat on the quiet courtyard side with a renovated kitchen.",
            "highlights": ["Balcony", "Elevator", "Renovated kitchen"],
        }
    ])

    draft = generate_draft(llm, REQUEST)

    assert draft == Draft(
        headline="Two-bedroom flat with balcony in Prenzlauer Berg",
        description="A 64 m² flat on the quiet courtyard side with a renovated kitchen.",
        highlights=["Balcony", "Elevator", "Renovated kitchen"],
    )
