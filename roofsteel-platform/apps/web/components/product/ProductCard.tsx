import Image from "next/image";
import Link from "next/link";
import type { ProductSummary, AccountType } from "@roofsteel/shared-types";
import { FulfilmentBadge } from "./FulfilmentBadge";
import { PriceDisplay } from "./PriceDisplay";

export interface ProductCardProps {
  product: ProductSummary;
  tier?: AccountType;
  variant?: "default" | "compact";
}

// The one product tile, reused on Home (Trending/New Arrivals), the PLP grid,
// search results, and Frequently Bought Together — see
// guidelines/12-storefront-ux-and-ia.md's component inventory. Don't build a
// second product-tile component for a "slightly different" list; extend
// this one with a variant prop instead, the way `compact` already does for
// the horizontal-scroll Trending row.
export function ProductCard({ product, tier = "RETAIL", variant = "default" }: ProductCardProps) {
  return (
    <Link href={`/products/${product.sku}`} className={`pcard${variant === "compact" ? "" : " pcard--desktop"}`}>
      <div className="pcard-img">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={280}
            height={200}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          // Graceful missing-photo placeholder — see guidelines/03-frontend.md.
          // Photography for all 171+ lines won't exist on day one; this
          // renders as the same neutral block the design mockup used, never
          // a broken-image icon.
          <div aria-hidden="true" style={{ width: "100%", height: "100%", background: "var(--line)" }} />
        )}
      </div>
      <FulfilmentBadge type={product.fulfilmentType} />
      <div className="pcard-name">{product.name}</div>
      <PriceDisplay pricing={product.pricing} tier={tier} unit={product.unit} size="sm" />
    </Link>
  );
}
