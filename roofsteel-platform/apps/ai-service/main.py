"""
Roofsteel AI Service — FastAPI.

Scoped per spec Section 2.2: Made-to-Length quote assistance and search
relevance, NOT a full ML recommendation/personalisation engine (that was the
group blueprint's proposal, deferred at this platform's scale — see spec
Section 3.8). Sized to land around the ~890 LoC this service ran at on
Bellwether SWE Plumbers, not a large standalone ML platform.
"""
from fastapi import FastAPI

app = FastAPI(title="Roofsteel AI Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


# SCAFFOLD — Phase 5 (spec Section 6.3).
# Needs: a /quote-assist endpoint that takes a Made-to-Length configuration
# (gauge, profile, length) and returns a plain-language cut-list summary for
# the order confirmation email/PDF, and a /search-relevance endpoint that
# re-ranks Postgres full-text search results using simple term-frequency
# scoring — not a vector/embedding model at this catalogue size (171 lines).
