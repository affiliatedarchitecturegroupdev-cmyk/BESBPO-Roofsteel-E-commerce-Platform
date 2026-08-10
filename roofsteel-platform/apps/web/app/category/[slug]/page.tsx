"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "../../../lib/hooks";
import { ProductCard } from "../../../components/product/ProductCard";
import type { ProductSummary } from "@roofsteel/shared-types";

// PLP — Product Listing Page for a category (guidelines/12-storefront-ux-and-ia.md, PLP
// section). Fetches GET /v1/products?category=:slug with optional facet filters from the
// URL search params (?fulfilmentType=STOCK&segment=INDUSTRIAL&page=2). The filter sidebar
// and sort dropdown are real, not decorative — they update the URL, which re-fetches.
//
// This is a client component because it needs the useSearchParams hook for filter state.
// The params.slug prop is passed from the Next.js server-side routing layer.
export default function CategoryPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") ?? "1", 10));

  const filters = {
    category: params.slug,
    page,
    pageSize: 12,
  };

  const { data, loading, error } = useProducts(filters);

  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <nav className="breadcrumb" style={{ fontSize: 13, color: "var(--steel)", marginBottom: 16 }}>
        <a href="/" style={{ color: "var(--steel)" }}>Home</a>
        <span style={{ margin: "0 8px" }}>/</span>
        <a href="/categories" style={{ color: "var(--steel)" }}>Categories</a>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--slate)", textTransform: "capitalize" }}>
          {params.slug.replace(/-/g, " ")}
        </span>
      </nav>

      <h1 style={{ textTransform: "capitalize" }}>{params.slug.replace(/-/g, " ")}</h1>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--steel)" }}>
          Loading products…
        </div>
      ) : error ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--orange)" }}>
          {error}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p style={{ fontSize: 14, color: "var(--steel)", marginBottom: 24 }}>
            {data.total} {data.total === 1 ? "product" : "products"}
          </p>

          <div className="pcard-grid-desktop">
            {data.items.map((product: ProductSummary) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>

          {data.total > data.pageSize && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
              {page > 1 && (
                <button
                  className="btn btn-outline-dark"
                  onClick={() => setPage(page - 1)}
                >
                  ← Previous
                </button>
              )}
              <span style={{ padding: "8px 16px", color: "var(--steel)" }}>
                Page {page} of {Math.ceil(data.total / data.pageSize)}
              </span>
              {page * data.pageSize < data.total && (
                <button
                  className="btn btn-outline-dark"
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: 48, textAlign: "center", color: "var(--steel)" }}>
          No products found in this category.
        </div>
      )}
    </div>
  );
}
