"""API layer: HTTP routes. Request bodies are validated by the domain models (strict, extra fields forbidden)."""

from fastapi import Depends, FastAPI

from app.drafting import Draft, DraftRequest, generate_draft
from app.listings import LISTINGS, Listing
from app.llm import LLMProvider, MockProvider

app = FastAPI(title="Listing Assistant", docs_url=None, redoc_url=None, openapi_url=None)

_llm = MockProvider()


def get_llm() -> LLMProvider:
    return _llm


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/listings")
def list_listings() -> list[Listing]:
    return list(LISTINGS.values())


@app.post("/api/drafts")
def create_draft(request: DraftRequest, llm: LLMProvider = Depends(get_llm)) -> Draft:
    return generate_draft(llm, request)
