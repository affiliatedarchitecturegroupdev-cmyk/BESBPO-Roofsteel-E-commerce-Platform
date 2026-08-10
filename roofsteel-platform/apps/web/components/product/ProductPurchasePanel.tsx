"use client";

import { useState } from "react";
import { MadeToLengthConfigurator } from "../configurator/MadeToLengthConfigurator";
import { PriceDisplay } from "./PriceDisplay";
import { FulfilmentBadge } from "./FulfilmentBadge";
import type { ProductDetail, MadeToLengthConfig, AccountType } from "@roofsteel/shared-types";

export interface ProductPurchasePanelProps {
  product: ProductDetail;
  tier?: AccountType;
}

// Server Components can't pass plain functions to Client Components — only
// Server Actions ("use server") can cross that boundary, and this project's
// committed architecture (guidelines/11-deployment.md, .env.example's
// NEXT_PUBLIC_API_URL, and the CORS setup already in apps/api/src/main.ts)
// is direct client-side fetch to the separate NestJS API, not Server
// Actions as an RPC proxy layer. So the interactive purchase section lives
// in its own client boundary here, and the PDP route itself
// (app/products/[sku]/page.tsx) stays a Server Component that only passes
// serializable product data down — see guidelines/03-frontend.md's
// Server-vs-Client rule.
export function ProductPurchasePanel({ product, tier = "RETAIL" }: ProductPurchasePanelProps) {
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");

  async function handleAddToCart(config: MadeToLengthConfig) {
    setStatus("adding");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
      const res = await fetch(`${apiUrl}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.sku, quantity: 1, mtl: config }),
      });
      if (!res.ok) throw new Error(`Add to cart failed: ${res.status}`);
      setStatus("added");
    } catch {
      // TODO(Phase 3): real error surface (toast/banner) — see
      // guidelines/12-storefront-ux-and-ia.md's EmptyState component note
      // for the pattern this should follow (one honest component, not an
      // ad hoc error message per call site).
      setStatus("error");
    }
  }

  return (
    <>
      <FulfilmentBadge type={product.fulfilmentType} />
      <h1 className="pdp-title pdp-title--desktop">{product.name}</h1>
      <p className="pdp-sku">
        SKU: {product.sku} &middot; {product.specs}
      </p>

      <PriceDisplay pricing={product.pricing} tier={tier} unit={product.unit} size="lg" />

      <MadeToLengthConfigurator product={product} onAddToCart={handleAddToCart} />

      {status === "added" && (
        <p role="status" style={{ color: "var(--success)", fontSize: 13, marginTop: 10 }}>
          Added to cart.
        </p>
      )}
      {status === "error" && (
        <p role="alert" style={{ color: "var(--orange-dark)", fontSize: 13, marginTop: 10 }}>
          Couldn't add this to your cart — try again.
        </p>
      )}
    </>
  );
}
