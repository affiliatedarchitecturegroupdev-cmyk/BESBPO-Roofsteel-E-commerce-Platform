// Seed script — loads the REAL Roofsteel catalogue (171 products / 13 categories)
// and pricing engine (15 category-markup bands) into the database.
//
// Data source: prisma/data/seed-products.json, seed-pricing-bands.json,
// seed-categories.json — exported directly from Roofsteel-Product-Catalogue.xlsx
// and Roofsteel-Pricing-Framework.xlsx. Nothing here is placeholder content
// except the landedCost figures — approved for use 2026-08-09 per ADR-007, though a
// cost-refinement pass against real supplier quotes is still planned. See docs/DECISIONS.md.
//
// Run with: npx prisma db seed

import { PrismaClient, FulfilmentType, Segment } from "@prisma/client";
import products from "./data/seed-products.json";
import pricingBands from "./data/seed-pricing-bands.json";
import categoriesData from "./data/seed-categories.json";

const prisma = new PrismaClient();

const FULFILMENT_MAP: Record<string, FulfilmentType> = {
  "Stock": "STOCK",
  "Made to Length": "MADE_TO_LENGTH",
  "Cut to Order": "CUT_TO_ORDER",
  "Fabricated to Order": "FABRICATED_TO_ORDER",
};

// See guidelines/15-delivery-courier-and-location.md — these two categories
// carry real engineering mass-table weight data (structural steel sections,
// SANS 920 rebar masses); every other category is a reasoned estimate.
const STRUCTURAL_REINFORCING_CATEGORIES = new Set(["Structural Steel", "Reinforcing Steel"]);

const SEGMENT_MAP: Record<string, Segment> = {
  industrial: "INDUSTRIAL",
  commercial: "COMMERCIAL",
  civil: "CIVIL",
  institutional: "INSTITUTIONAL",
  residential: "RESIDENTIAL",
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Mirrors the special-case pricing-key resolution from the Pricing Framework
// workbook's Sample Priced Catalogue sheet formula (Section 4.2 of the spec).
function resolvePricingKey(category: string, product: any): string {
  if (category === "Steel Roofing Sheets") {
    return product.fulfilmentType === "Made to Length"
      ? "Steel Roofing Sheets — Made to Length"
      : "Steel Roofing Sheets — Stock";
  }
  if (category === "Roofing Timber & Trusses") {
    return product.fulfilmentType === "Fabricated to Order"
      ? "Roofing Timber & Trusses — Fabricated"
      : "Roofing Timber & Trusses — Stock";
  }
  return category;
}

// See guidelines/13-listings-cms-inventory-sales.md Section 3.2 — illustrative
// defaults by fulfilment type, not yet confirmed against real production
// capacity. STOCK returns null since those lines use StockLevel instead.
function leadTimeFor(fulfilmentType: string): number | null {
  switch (fulfilmentType) {
    case "MADE_TO_LENGTH":
      return 4;
    case "CUT_TO_ORDER":
      return 3;
    case "FABRICATED_TO_ORDER":
      return 7;
    default:
      return null;
  }
}

async function main() {
  console.log(`Seeding ${categoriesData.length} categories, ${pricingBands.length} pricing bands, ${products.length} products...`);

  // 1. Pricing bands (must exist before products reference them)
  const bandByKey = new Map<string, string>(); // pricingKey -> id
  for (const b of pricingBands as any[]) {
    const band = await prisma.pricingBand.upsert({
      where: { pricingKey: b.pricingKey },
      update: {
        retailMarkup: b.retailMarkup,
        tradeDiscount: b.tradeDiscount,
        volumeDiscount: b.volumeDiscount,
        rationale: b.rationale,
      },
      create: {
        pricingKey: b.pricingKey,
        retailMarkup: b.retailMarkup,
        tradeDiscount: b.tradeDiscount,
        volumeDiscount: b.volumeDiscount,
        rationale: b.rationale,
      },
    });
    bandByKey.set(b.pricingKey, band.id);
  }

  // 2. Categories
  const categoryByName = new Map<string, string>();
  for (const c of categoriesData as { name: string; icon: string }[]) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon },
      create: { name: c.name, slug: slugify(c.name), icon: c.icon },
    });
    categoryByName.set(c.name, cat.id);
  }

  // 3. Subcategories (derive unique set per category from products)
  const subcatKey = (cat: string, sub: string) => `${cat}::${sub}`;
  const subcatByKey = new Map<string, string>();
  const seenSubcats = new Set<string>();
  for (const p of products as any[]) {
    const key = subcatKey(p.category, p.subcategory);
    if (seenSubcats.has(key)) continue;
    seenSubcats.add(key);
    const sub = await prisma.subcategory.upsert({
      where: { categoryId_name: { categoryId: categoryByName.get(p.category)!, name: p.subcategory } },
      update: {},
      create: { name: p.subcategory, categoryId: categoryByName.get(p.category)! },
    });
    subcatByKey.set(key, sub.id);
  }

  // 4b. Locations — see guidelines/13-listings-cms-inventory-sales.md Section 3.3.
  // Only the KZN flagship yard seeded at launch, matching the capacity deck's
  // Phase 1 footprint — Gauteng added here (not a migration) once that yard
  // is real.
  const kznLocation = await prisma.location.upsert({
    where: { name: "KZN Flagship Yard" },
    update: {},
    create: { name: "KZN Flagship Yard", province: "KWAZULU_NATAL" },
  });

  // 4. Products (+ segments + stock)
  let skuCounter = 1000;
  let stockLevelsSeeded = 0;
  for (const p of products as any[]) {
    const pricingKey = resolvePricingKey(p.category, p);
    const bandId = bandByKey.get(pricingKey);
    if (!bandId) {
      throw new Error(`No pricing band found for key "${pricingKey}" (product: ${p.name})`);
    }
    const sku = `RS-${skuCounter++}`;
    const fulfilmentType = FULFILMENT_MAP[p.fulfilmentType];

    const product = await prisma.product.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        name: p.name,
        specs: p.specs,
        unit: p.unit,
        fulfilmentType,
        categoryId: categoryByName.get(p.category)!,
        subcategoryId: subcatByKey.get(subcatKey(p.category, p.subcategory))!,
        pricingBandId: bandId,
        landedCost: p.landedCost,
        // Approved for use 2026-08-09 (ADR-007) — no longer a raw placeholder.
        // Still not supplier-verified per line; a cost-refinement pass is
        // planned for Phase 4/5. See docs/DECISIONS.md ADR-007 before
        // treating `false` on any product added AFTER this seed run as
        // meaning something different from "not yet reviewed at all."
        costIsReal: true,
        // NOT approved the way landedCost is — real lead times need
        // confirming against the actual roll-forming queue/fabrication
        // capacity. See guidelines/13-listings-cms-inventory-sales.md
        // Section 3.2.
        leadTimeDays: leadTimeFor(fulfilmentType),
        weightKgPerUnit: p.weightKgPerUnit,
        // See guidelines/15-delivery-courier-and-location.md — true for the
        // 80 Structural/Reinforcing Steel lines with real engineering
        // mass-table data, false for the 91 category-level estimates.
        weightIsReal: STRUCTURAL_REINFORCING_CATEGORIES.has(p.category),
      },
    });

    for (const seg of p.segments as string[]) {
      await prisma.productSegment.upsert({
        where: { productId_segment: { productId: product.id, segment: SEGMENT_MAP[seg] } },
        update: {},
        create: { productId: product.id, segment: SEGMENT_MAP[seg] },
      });
    }

    // STOCK lines get a real StockLevel row — quantities are ILLUSTRATIVE
    // seed data (100 units flat), NOT reviewed/approved the way landedCost
    // was in ADR-007. A real physical stock count must replace this before
    // go-live; see guidelines/13-listings-cms-inventory-sales.md Section 3.1.
    if (fulfilmentType === "STOCK") {
      await prisma.stockLevel.upsert({
        where: { productId_locationId: { productId: product.id, locationId: kznLocation.id } },
        update: {},
        create: { productId: product.id, locationId: kznLocation.id, qtyOnHand: 100, qtyReserved: 0 },
      });
      stockLevelsSeeded++;
    }
  }

  console.log("Seed complete.");
  console.log(`  Categories: ${categoryByName.size}`);
  console.log(`  Subcategories: ${subcatByKey.size}`);
  console.log(`  Pricing bands: ${bandByKey.size}`);
  console.log(`  Products: ${(products as any[]).length}`);
  console.log(`  Stock levels seeded (STOCK fulfilment only): ${stockLevelsSeeded}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
