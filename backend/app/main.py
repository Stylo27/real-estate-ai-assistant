"""API layer: HTTP routes. Request bodies are validated by the domain models (strict, extra fields forbidden)."""

import logging
import uuid

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.drafting import Draft, DraftGenerationError, DraftRequest, generate_draft
from app.listings import LISTINGS, ApprovedListing, Listing, save_listing
from app.llm import LLMProvider, make_llm

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="Listing Assistant", docs_url=None, redoc_url=None, openapi_url=None)

_llm = make_llm()


def error_response(request: Request, status: int, detail: str) -> JSONResponse:
    """Error bodies carry only a fixed message and the request id: no stack traces or vendor messages."""
    return JSONResponse({"detail": detail, "request_id": request.state.request_id}, status_code=status)


@app.middleware("http")
async def assign_request_id(request: Request, call_next):
    request.state.request_id = uuid.uuid4().hex
    try:
        response = await call_next(request)
    except Exception:  # Caught here, not in an exception handler, so the 500 also gets the X-Request-ID header.
        log.exception("unhandled error, request_id=%s", request.state.request_id)
        response = error_response(request, 500, "Something went wrong. Please try again.")
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.exception_handler(DraftGenerationError)
def draft_generation_failed(request: Request, exc: DraftGenerationError) -> JSONResponse:
    log.warning("could not generate a draft, request_id=%s", request.state.request_id, exc_info=exc.__cause__)
    return error_response(request, 502, "Could not generate a draft. Please try again.")


def get_llm() -> LLMProvider:
    return _llm


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/listings")
def list_listings() -> list[Listing]:
    return list(LISTINGS.values())


@app.get("/api/listings/{listing_id}")
def get_listing(listing_id: str) -> Listing:
    if listing_id not in LISTINGS:
        raise HTTPException(404, "Listing not found.")
    return LISTINGS[listing_id]


@app.post("/api/listings", status_code=201)
def create_listing(body: ApprovedListing) -> Listing:
    return save_listing(body)


@app.put("/api/listings/{listing_id}")
def update_listing(body: ApprovedListing, listing: Listing = Depends(get_listing)) -> Listing:
    return save_listing(body, listing.id)


@app.post("/api/drafts")
def create_draft(body: DraftRequest, request: Request, llm: LLMProvider = Depends(get_llm)) -> Draft:
    return generate_draft(llm, body, request_id=request.state.request_id)
