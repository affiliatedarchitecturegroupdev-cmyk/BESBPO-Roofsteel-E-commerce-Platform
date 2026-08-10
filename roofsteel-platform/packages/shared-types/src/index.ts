// Types shared between apps/api and apps/web, mirroring the Prisma enums
// (prisma/schema.prisma) so the frontend doesn't drift from the database
// model. Regenerate/extend as Phase 2 builds out real API responses.

export type FulfilmentType = "STOCK" | "MADE_TO_LENGTH" | "CUT_TO_ORDER" | "FABRICATED_TO_ORDER";

export type Segment = "INDUSTRIAL" | "COMMERCIAL" | "CIVIL" | "INSTITUTIONAL" | "RESIDENTIAL";

export type AccountType = "RETAIL" | "TRADE" | "CONTRACTOR" | "PROJECT";

export type Province =
  | "GAUTENG"
  | "KWAZULU_NATAL"
  | "WESTERN_CAPE"
  | "LIMPOPO"
  | "MPUMALANGA"
  | "EASTERN_CAPE"
  | "NORTH_WEST";

export interface ResolvedPrice {
  landedCost: number;
  retailPrice: number;
  tradePrice: number;
  volumePrice: number;
  applicablePrice: number;
  pricingKey: string;
  costIsReal: boolean;
}

// Structured Made-to-Length configuration — spec Section 4.1. Never sent as
// free text; every field here is a real cart/order-line column.
export interface MadeToLengthConfig {
  gaugeMm: number; // 0.30–0.80
  profile: string;
  colour: string;
  lengthMm: number; // validated against 13,200 max at the API layer
}

// ----------------------------------------------------------------------
// Frontend-facing summary types — apps/web components consume these.
// Deliberately lighter than the full Prisma model (no internal IDs beyond
// what routing/linking needs) — see guidelines/03-frontend.md and
// guidelines/12-storefront-ux-and-ia.md for the components that use them.
// ----------------------------------------------------------------------

export interface CategorySummary {
  slug: string;
  name: string;
  icon: string; // matches an icon key already used on the corporate site —
  // see guidelines/03-frontend.md on reusing the same icon set, not a new one.
  lineCount: number;
}

export interface ProductSummary {
  sku: string;
  name: string;
  imageUrl?: string;
  fulfilmentType: FulfilmentType;
  unit: string;
  pricing: ResolvedPrice;
}

export interface ProductDetail extends ProductSummary {
  specs: string;
  category: { slug: string; name: string };
  subcategory: { name: string };
  segments: Segment[];
  // Only populated when fulfilmentType === "MADE_TO_LENGTH" — the PDP and
  // MadeToLengthConfigurator use this to build the real gauge/profile/colour
  // option lists per guidelines/04-made-to-length-configurator.md ("scoped
  // to what that specific product actually offers, not the full
  // catalogue-wide list").
  mtlOptions?: {
    gaugesMm: number[];
    profiles: string[];
    colours: string[];
    maxLengthMm: number;
  };
}
