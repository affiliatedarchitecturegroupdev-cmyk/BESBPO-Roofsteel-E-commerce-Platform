import type { FulfilmentType, AccountType } from "@roofsteel/shared-types";

const FULFILMENT_LABELS: Record<FulfilmentType, string> = {
  STOCK: "STOCK",
  MADE_TO_LENGTH: "MADE TO LENGTH",
  CUT_TO_ORDER: "CUT TO ORDER",
  FABRICATED_TO_ORDER: "FABRICATED TO ORDER",
};

// Matches the .fulfilment-badge / .fulfilment-badge--stock rules already in
// globals.css, validated against design-mockup/mockup.html — Stock renders
// muted (it's the default, unremarkable case), the three made-to-order
// types render in the brand accent (they're the differentiator, spec
// Section 4.1/4.4).
export function FulfilmentBadge({ type }: { type: FulfilmentType }) {
  const isStock = type === "STOCK";
  return (
    <span className={`fulfilment-badge${isStock ? " fulfilment-badge--stock" : ""}`}>
      {FULFILMENT_LABELS[type]}
    </span>
  );
}

const TIER_LABELS: Record<AccountType, string> = {
  RETAIL: "Retail Price",
  TRADE: "Trade Price Applied",
  CONTRACTOR: "Volume Price Applied",
  PROJECT: "Project Pricing",
};

export function TierBadge({ tier }: { tier: AccountType }) {
  if (tier === "RETAIL") return null; // no badge needed for the default case
  return (
    <span className={`tier-badge tier-badge--${tier.toLowerCase()}`}>
      {TIER_LABELS[tier].toUpperCase()}
    </span>
  );
}
