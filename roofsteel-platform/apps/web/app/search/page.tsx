"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "../../lib/hooks";
import { ProductCard } from "../../components/product/ProductCard";
import type { ProductSummary } from "@roofsteel/shared-types";

// Search page — reuses the same ProductCard grid as the PLP, but fetches with a `search`
// query param instead of `category`. The API's products.service.ts currently does a
// Prisma `contains` filter (not real Postgres full-text search — task 2.4 will upgrade
// this to tsvector/pg_trgm). The UI works now; the search quality improves when 2.4 lands.
export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const { data, loading, error } = useProducts(query ? { search: query, pageSize: 24 } : undefined);

  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <h1>Search</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // The useProducts hook re-fetches when the search param changes — the query state
          // update triggers this. No URL push needed for the initial version.
        }}
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for steel, roofing, timber…"
          className="form-input"
          style={{ width: "100%", maxWidth: 600 }}
          autoFocus
        />
      </form>

      {!query ? (
        <p style={{ color: "var(--steel)", fontSize: 14 }}>
          Start typing to search the catalogue.
        </p>
      ) : loading ? (
        <p style={{ color: "var(--steel)", fontSize: 14 }}>Searching…</p>
      ) : error ? (
        <p style={{ color: "var(--orange)", fontSize: 14 }}>{error}</p>
      ) : data && data.items.length > 0 ? (
        <>
          <p style={{ fontSize: 14, color: "var(--steel)", marginBottom: 24 }}>
            {data.total} {data.total === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
          </p>
          <div className="pcard-grid-desktop">
            {data.items.map((product: ProductSummary) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: "var(--steel)", fontSize: 14 }}>
          No results for &ldquo;{query}&rdquo;. Try a different search term.
        </p>
      )}
    </div>
  );
}
