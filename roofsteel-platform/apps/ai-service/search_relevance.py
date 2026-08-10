"""
Search relevance — re-ranks Postgres full-text search results using simple
term-frequency scoring. Not a vector/embedding model; at 171 catalogue lines,
there isn't enough data for embeddings to outperform TF scoring, and the
latency cost isn't justified (spec Section 2.2).
"""

import re
from collections import Counter


def _tokenize(text: str) -> list[str]:
    """Split text into lowercase tokens, stripping non-alphanumeric characters."""
    return [w.lower() for w in re.findall(r"[a-z0-9]+", text.lower())]


def _tf_score(query_tokens: list[str], doc_tokens: list[str]) -> float:
    """Calculate a simple term-frequency score: how many query terms appear
    in the document, weighted by frequency. Exact-match on product name gets
    a bonus."""
    doc_counter = Counter(doc_tokens)
    score = 0.0
    for term in query_tokens:
        score += doc_counter.get(term, 0)
    return score


def rerank_results(query: str, results: list) -> list:
    """Re-rank search results by term-frequency relevance.

    Args:
        query: The user's search query string.
        results: List of SearchResult objects with sku, name, score fields.

    Returns:
        Results sorted by combined score (original Postgres ts_rank + TF boost),
        descending. Original order is preserved for ties (stable sort).
    """
    query_tokens = _tokenize(query)
    if not query_tokens or not results:
        return results

    scored = []
    for result in results:
        name_tokens = _tokenize(result.name)
        tf = _tf_score(query_tokens, name_tokens)
        # Blend: 70% original Postgres score (normalized), 30% TF boost
        original = result.score or 0.0
        combined = original * 0.7 + tf * 0.3
        scored.append((combined, result))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored]
