"use client";

import { CategoryGrid } from "../components/category/CategoryGrid";
import { ProductCard } from "../components/product/ProductCard";
import { Icon } from "../components/Icon";
import { JsonLd, storeJsonLd } from "../components/JsonLd";
import { useCategories, useProducts } from "../lib/hooks";
import type { CategorySummary, ProductSummary } from "@roofsteel/shared-types";

// Home — category-led, not a marketing hero (guidelines/12-storefront-ux-and-ia.md
// Section "Home (/)"). Deliberately NOT the corporate site's 8-slide cinematic
// hero; the promo strip here is compact, sized to get out of the way fast for
// a returning trade buyer who already knows what they want.
//
// Data is fetched client-side via the hooks in lib/hooks.ts, which call the real
// API through lib/api-client.ts. The API client attaches auth tokens automatically,
// so an authenticated trade buyer sees trade pricing in the Trending Now products
// immediately, without a separate "trade home" page.
export default function HomePage() {
  const { categories, loading: catsLoading } = useCategories();
  const { data: trending, loading: productsLoading } = useProducts({ pageSize: 8 });

  return (
    <>
      <JsonLd data={storeJsonLd()} />
      <section className="promo-strip promo-strip--desktop">
        <div>
          <div className="promo-eyebrow">STEEL ROOFING SHEETS</div>
          <h1 className="promo-headline promo-headline--desktop">Rolled to your exact length</h1>
          <p className="promo-sub">Every gauge, every profile, cut to spec.</p>
          <a className="btn btn-primary" href="/category/steel-roofing-sheets">Shop Now</a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <a className="see-all" href="/categories">See all</a>
        </div>
        {catsLoading ? (
          <div className="loading-placeholder">Loading categories…</div>
        ) : (
          <CategoryGrid categories={categories} variant="desktop" />
        )}
      </section>

      <section className="section mtl-banner mtl-banner--desktop">
        <div>
          <div className="mtl-banner-eyebrow">
            <Icon name="scissors" size={14} color="#E8631C" /> THE DIFFERENTIATOR
          </div>
          <h2 className="mtl-banner-title">Made to Length</h2>
          <p className="mtl-banner-sub">
            Roll-formed to your exact spec, not off the shelf — 0.30–0.80mm gauge, up to 13.2m.
          </p>
        </div>
        <a className="btn btn-outline-dark" href="/category/steel-roofing-sheets">See how it works</a>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Trending Now</h2>
        </div>
        {productsLoading ? (
          <div className="loading-placeholder">Loading products…</div>
        ) : (
          <div className="pcard-grid-desktop">
            {trending?.items.map((p: ProductSummary) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
