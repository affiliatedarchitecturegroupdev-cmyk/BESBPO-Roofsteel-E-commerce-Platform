"use client";

import { useState, useEffect } from "react";
import { ProductPurchasePanel } from "../../../components/product/ProductPurchasePanel";
import { ProductReviews } from "../../../components/product/ProductReviews";
import { productsApi } from "../../../lib/api-client";
import type { ProductDetail } from "@roofsteel/shared-types";

// PDP — Product Detail Page. Fetches GET /v1/products/:sku via the API client. The API
// client attaches auth tokens automatically, so an authenticated trade buyer sees trade
// pricing in the ProductPurchasePanel, while a guest sees retail pricing.
//
// params.sku comes from the Next.js routing layer. The product's mtlOptions (if present)
// drive the MadeToLengthConfigurator — scoped to what that specific product offers, not
// the full catalogue-wide range (guidelines/04-made-to-length-configurator.md).
export default function ProductPage({ params }: { params: { sku: string } }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    productsApi
      .getBySku(params.sku)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load product"))
      .finally(() => setLoading(false));
  }, [params.sku]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 48, textAlign: "center", color: "var(--steel)" }}>
        Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: 48, textAlign: "center" }}>
        <h1>Product not found</h1>
        <p style={{ color: "var(--steel)", fontSize: 14, marginTop: 8 }}>
          {error ?? `We couldn't find a product with SKU "${params.sku}".`}
        </p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px" }}>
      <nav className="breadcrumb" style={{ fontSize: 13, color: "var(--steel)", marginBottom: 16 }}>
        <a href="/" style={{ color: "var(--steel)" }}>Home</a>
        <span style={{ margin: "0 8px" }}>/</span>
        <a href={`/category/${product.category.slug}`} style={{ color: "var(--steel)" }}>
          {product.category.name}
        </a>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--slate)" }}>{product.name}</span>
      </nav>

      <div className="pdp-desktop-grid">
        <div className="pdp-gallery pdp-gallery--desktop" aria-hidden="true" />

        <div className="pdp-desktop-right">
          <ProductPurchasePanel product={product} tier="TRADE" />

          <div className="section" style={{ marginTop: 24 }}>
            <div className="accordion-row">
              <span>Specifications</span>
            </div>
            <div style={{ padding: "12px 0", fontSize: 14, color: "var(--steel)" }}>
              {product.specs}
            </div>
            <div className="accordion-row">
              <span>Compliance &amp; Certificates</span>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews sku={product.sku} />
    </div>
  );
}
