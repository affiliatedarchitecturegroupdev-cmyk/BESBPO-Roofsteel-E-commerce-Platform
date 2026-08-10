import { CategoryGrid } from "../components/category/CategoryGrid";
import { ProductCard } from "../components/product/ProductCard";
import { Icon } from "../components/Icon";
import type { CategorySummary, ProductSummary } from "@roofsteel/shared-types";

// TODO(Phase 2): replace these two fixtures with real data from
// GET /v1/categories (now real — apps/api/src/categories/categories.module.ts,
// built in the Gap Analysis I session) and a Trending Now products query —
// see guidelines/12-storefront-ux-and-ia.md's Home breakdown for the exact
// sections and guidelines/01-api-design.md for endpoint conventions. The
// component tree below (CategoryGrid, ProductCard) is real; only the data
// source here is still a placeholder.
const CATEGORIES: CategorySummary[] = [
  { slug: "steel-roofing-sheets", name: "Steel Roofing Sheets", icon: "layers", lineCount: 10 },
  { slug: "structural-steel", name: "Structural Steel", icon: "beam", lineCount: 63 },
  { slug: "reinforcing-steel", name: "Reinforcing Steel", icon: "hash", lineCount: 17 },
  { slug: "roofing-timber-trusses", name: "Roofing Timber & Trusses", icon: "tree", lineCount: 13 },
  { slug: "roof-tiles", name: "Roof Tiles", icon: "grid", lineCount: 9 },
  { slug: "roofing-accessories", name: "Roofing Accessories", icon: "tool", lineCount: 25 },
];

const TRENDING: ProductSummary[] = [
  {
    sku: "RS-1000",
    name: "IBR 686 Roofing Sheet",
    fulfilmentType: "MADE_TO_LENGTH",
    unit: "per m²",
    pricing: { landedCost: 145, retailPrice: 210.25, tradePrice: 193.43, volumePrice: 185.02, applicablePrice: 210.25, pricingKey: "Steel Roofing Sheets — Made to Length", costIsReal: true },
  },
];

// Home — category-led, not a marketing hero (guidelines/12-storefront-ux-and-ia.md
// Section "Home (/)"). Deliberately NOT the corporate site's 8-slide cinematic
// hero; the promo strip here is compact, sized to get out of the way fast for
// a returning trade buyer who already knows what they want.
export default function HomePage() {
  return (
    <>
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
          <a className="see-all" href="/categories">See all 13</a>
        </div>
        <CategoryGrid categories={CATEGORIES} variant="desktop" />
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
        <div className="pcard-grid-desktop">
          {TRENDING.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
