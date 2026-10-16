"""API layer: HTTP routes. Request bodies are validated by the domain models (strict, extra fields forbidden)."""

import logging
import uuid

from fastapi import Depends, FastAPI, Request

from app.drafting import Draft, DraftRequest, generate_draft
from app.listings import LISTINGS, Listing
from app.llm import LLMProvider, make_llm

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

app = FastAPI(title="Listing Assistant", docs_url=None, redoc_url=None, openapi_url=None)

_llm = make_llm()


@app.middleware("http")
async def assign_request_id(request: Request, call_next):
    request.state.request_id = uuid.uuid4().hex
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response


def get_llm() -> LLMProvider:
    return _llm


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/listings")
def list_listings() -> list[Listing]:
    return list(LISTINGS.values())


@app.post("/api/drafts")
def create_draft(body: DraftRequest, request: Request, llm: LLMProvider = Depends(get_llm)) -> Draft:
    return generate_draft(llm, body, request_id=request.state.request_id)
