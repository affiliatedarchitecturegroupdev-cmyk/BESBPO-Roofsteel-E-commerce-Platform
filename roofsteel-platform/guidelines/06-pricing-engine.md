# Pricing Engine Guide

How to extend or modify the tier/markup pricing logic without breaking the model it's built on.
Read this before touching anything in apps/api/src/pricing/ or the PricingBand data.

## The model, restated precisely

retail = landedCost * (1 + retailMarkup)
trade = retail * (1 - tradeDiscount)
volume = retail * (1 - volumeDiscount)

This is not approximate — it's the exact formula from the Pricing Framework workbook's Sample
Priced Catalogue sheet, and PricingService.resolveProductPrice() implements it exactly. If a
future change seems to require a different formula shape, that's a real product decision (does
trade discount apply to retail or to landed cost directly?) — raise it as a docs/DECISIONS.md
entry, don't quietly change the math in one place.

## Pricing keys — the 15-band system

Every product resolves to exactly one PricingBand via its pricingKey. 13 of the 15 keys are
plain category names. Two categories split into two keys each based on a product attribute:

- Steel Roofing Sheets: "Stock" vs "Made to Length" (by fulfilmentType)
- Roofing Timber & Trusses: "Stock" vs "Fabricated" (by fulfilmentType)

resolvePricingKey() in prisma/seed.ts is the reference implementation of this logic — if you add
a new category that needs this kind of split, mirror that function's pattern rather than
inventing a different resolution mechanism. Don't add a third split category without a real
product reason (a markup that genuinely differs by sub-type) — every extra split is one more
thing that has to be resolved correctly, everywhere pricing is calculated.

## Editing markup percentages

PricingBand rows are meant to be admin-editable — this mirrors the workbook's own "yellow cells,
everything recalculates" design (see the actual workbook's Read Me sheet). When building the
admin UI for this (Phase 4), the requirement is: editing a band's retailMarkup/tradeDiscount/
volumeDiscount takes effect on every product using that key immediately, with no caching layer
that could serve a stale price. If a cache is added anywhere in the pricing path for performance
reasons later, it needs an explicit invalidation on PricingBand update — don't let "it's just a
read cache" quietly reintroduce the same staleness problem the workbook's live-formula design
was built to avoid.

## Where Project/Tender pricing diverges from the formula

AccountType.PROJECT falls back to volume pricing as a floor in selectTierPrice() — that's
deliberate, not a placeholder to fix later. Real Project/Tender pricing is bespoke and negotiated
through the Quote/RFQ engine (spec Section 4.3), never computed automatically. Don't "complete"
this by inventing a Project-tier formula; the absence of one is the correct behaviour.

## costIsReal and pricing confidence

Every Product carries costIsReal (see docs/DECISIONS.md ADR-007 — currently true for all 171
seeded products, approved for use, with a cost-refinement pass planned later). Any UI or report
that surfaces margin/profitability should be able to filter or flag by this field — don't present
a margin calculation as equally confident across a product where the cost has been
supplier-verified versus one still running on the original workbook estimate.

## Testing pricing logic

This is exactly the kind of business logic guidelines/07-testing.md calls out as needing real
unit tests — a wrong number here costs someone money. Test the formula against known values (the
Y12 rebar reference point from the Pricing Framework's Competitive Benchmark sheet is a good
anchor: real landed cost should produce a retail price close to the researched ~R27/m market
reference), test the two special-case category splits, and test that PROJECT tier never silently
returns something other than the volume-price floor.
