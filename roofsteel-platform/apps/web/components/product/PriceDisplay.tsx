import type { ResolvedPrice, AccountType } from "@roofsteel/shared-types";
import { TierBadge } from "./FulfilmentBadge";

export interface PriceDisplayProps {
  pricing: ResolvedPrice;
  tier: AccountType;
  unit?: string;
  size?: "sm" | "lg";
}

// The ONE place price formatting happens — see guidelines/03-frontend.md:
// "the frontend's job is to display pricing.applicablePrice ... not to
// re-derive it from landedCost and a markup percentage in JavaScript."
// Every component that shows a price (ProductCard, PDP, cart line) renders
// through this, not its own formatting logic.
export function PriceDisplay({ pricing, tier, unit, size = "sm" }: PriceDisplayProps) {
  const showStrikethrough = tier !== "RETAIL" && pricing.applicablePrice < pricing.retailPrice;

  if (size === "lg") {
    return (
      <div>
        <div className="pdp-price-row">
          <span className="pdp-price">{formatZAR(pricing.applicablePrice)}</span>
          {unit && <span className="pdp-price-unit">/ {unit}</span>}
          <TierBadge tier={tier} />
        </div>
        {showStrikethrough && (
          <div style={{ fontSize: 12, color: "var(--steel)", textDecoration: "line-through" }}>
            {formatZAR(pricing.retailPrice)} retail
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pcard-price">
      {formatZAR(pricing.applicablePrice)}
      {unit && <span className="pcard-unit"> {unit}</span>}
      {showStrikethrough && (
        <span style={{ marginLeft: 6, fontSize: 10.5, color: "var(--steel)", textDecoration: "line-through" }}>
          {formatZAR(pricing.retailPrice)}
        </span>
      )}
    </div>
  );
}

// Not Intl.NumberFormat's default (its "ZAR" style already gives "R" in
// en-ZA, but pinning the format here means it can't silently drift
// per-browser locale) — a price is exactly the kind of string that
// shouldn't vary by accident, see guidelines/06-pricing-engine.md on price
// confidence.
export function formatZAR(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
