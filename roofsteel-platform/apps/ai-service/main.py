"""
Roofsteel AI Service — FastAPI.

Scoped per spec Section 2.2: Made-to-Length quote assistance and search
relevance, NOT a full ML recommendation/personalisation engine (that was the
group blueprint's proposal, deferred at this platform's scale — see spec
Section 3.8).
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from quote_assist import generate_cut_list_summary
from search_relevance import rerank_results

app = FastAPI(title="Roofsteel AI Service", version="0.2.0")


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Quote Assist (Task 5.3) -----------------------------------------------

class MtLConfig(BaseModel):
    gauge: str = Field(..., description="Steel gauge, e.g. 0.47mm, 0.53mm, 0.58mm")
    profile: str = Field(..., description="Profile name, e.g. Corrugated, IBR, Inverted Box Rib")
    length_mm: int = Field(..., gt=0, description="Cut length in millimetres")
    quantity: int = Field(1, gt=0, description="Number of sheets")
    colour: Optional[str] = Field(None, description="Colour, e.g. Charcoal, Slate Grey")


class QuoteAssistResponse(BaseModel):
    summary: str
    line_item_label: str


@app.post("/quote-assist", response_model=QuoteAssistResponse)
def quote_assist(config: MtLConfig):
    """Generate a plain-language cut-list summary for a Made-to-Length configuration.
    Used in order confirmation emails and PDFs. Not a vector/embedding model —
    simple structured text generation at this catalogue size (spec Section 6.3)."""
    summary = generate_cut_list_summary(config)
    label = f"{config.profile} {config.gauge} — {config.length_mm}mm"
    if config.colour:
        label += f" ({config.colour})"
    label += f" × {config.quantity}"
    return {"summary": summary, "line_item_label": label}


# --- Search Relevance (Task 5.4) --------------------------------------------

class SearchResult(BaseModel):
    sku: str
    name: str
    score: float = 0.0


class SearchRelevanceRequest(BaseModel):
    query: str
    results: list[SearchResult]


@app.post("/search-relevance", response_model=list[SearchResult])
def search_relevance(req: SearchRelevanceRequest):
    """Re-rank Postgres full-text search results using simple term-frequency scoring.
    Not a vector model — at 171 catalogue lines, embeddings add latency without
    enough data to improve on TF scoring (spec Section 2.2)."""
    return rerank_results(req.query, req.results)
