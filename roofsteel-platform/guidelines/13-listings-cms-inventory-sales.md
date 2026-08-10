# Product Listings, Content Management & Inventory/Sales Management

This is the operational design the platform was missing before this document — how a product
actually gets onto the site, who manages what content, and how stock and sales get tracked.
Written after confirming (not assuming) that none of this existed yet: Product had no stock
field, no image relation, no description field; there was no admin module, no CMS, and no
inventory model of any kind. See docs/DECISIONS.md ADR-011 through ADR-013 for the decisions
this document represents.

## 1. The Product Listing Process

### Two paths onto the site, not one

**Bulk path** — the one already proven: a product lives first in the real Product Catalogue
workbook (Roofsteel-Product-Catalogue.xlsx), gets exported to prisma/data/seed-products.json,
and enters the database via prisma/seed.ts. This is how all 171 launch products got there and
should stay the mechanism for bulk catalogue changes (a new category, a pricing-workbook
revision) — the workbook remains the source of truth, not a database editing session.

**Admin path** — for day-to-day, one-off changes (a single new product, a price correction,
marking something out of stock) once the admin module exists (Phase 4). This never bypasses the
same validation the seed script enforces — a product created in the admin panel still needs a
real pricingBandId that resolves correctly, per guidelines/06-pricing-engine.md.

### What a listing actually needs — expanded from the original schema

The original Product model covered pricing and fulfilment correctly but had nothing for content
or stock. Both gaps are closed in Section 4's schema additions below. A complete listing now
needs:

| Data | Status before this document | Status now |
|---|---|---|
| Name, specs, unit, fulfilment type | Real | Real |
| Category, subcategory, segments | Real | Real |
| Pricing (landed cost, pricing band) | Real | Real |
| Long-form description | Missing | Added — Product.description |
| Images | Missing | Added — ProductImage model |
| Stock / lead time | Missing | Added — see Section 3 |
| Compliance documents | Schema existed, zero endpoints | Still needs endpoints (Gap Analysis I) |

### Publish state

Product.active already existed and is enough for v1 — false hides a listing without deleting
it (a paused or discontinued line). A fuller DRAFT -> REVIEW -> PUBLISHED workflow is a real
thing worth having once multiple admin users are editing the catalogue concurrently, but
building it now for a single-operator launch would be process for its own sake. Revisit when
there's a second admin user who needs a review step.

## 2. Content Management — decision: no third-party CMS

### The decision

A custom-built admin surface, not Contentful/Strapi/Sanity/WordPress. This matches the
precedent already set on Bellwether SWE Plumbers ("no third-party CMS," tech-stack topic). The
reasoning holds here too, more strongly: a product's content (description, images) and its
commerce data (price, stock, fulfilment type) are the same row in the same table, edited by the
same admin user in the same screen. Splitting them across a commerce database and a separate CMS
would mean two systems that can silently disagree about the same product — the exact kind of
two-source-of-truth problem this project has avoided everywhere else (the pricing engine reads
live from PricingBand, not a cached copy, for the same reason).

### What actually needs managing, and how

| Content | Where it lives | Who edits it, how |
|---|---|---|
| Product name/specs/description | Product table | Admin panel (Phase 4) or bulk workbook re-import |
| Product images | ProductImage table | Admin panel upload — needs a real object storage decision, see Section 5 |
| Category name/icon | Category table | Rare change — workbook/seed, not worth an admin screen yet |
| Trending Now / New Arrivals | Computed, not edited | Real order-velocity query and createdAt window respectively (spec Section 3.3) — deliberately no manual "feature this product" flag, the same discipline already applied to Clearance (never manufactured urgency) |
| Homepage promo strip | Hardcoded in app/page.tsx for v1 | Low change frequency; a real CMS-editable version is a legitimate Phase 5 nice-to-have, not a launch requirement |
| Legal/info pages (Terms, Privacy, Returns, Shipping, FAQ) | Hardcoded in their route files | Same reasoning — these change rarely enough that git-editing by whoever maintains the codebase is more honest than building a rich-text editor for five pages that might change twice a year |
| Compliance documents (mill certs, NRCS LoAs) | ComplianceDocument table + real file storage | Admin upload once Section 5's storage decision is made |

The pattern across this table: build a database-editable field only where the actual edit
frequency justifies it. A homepage banner that changes twice a year doesn't need a CMS; a
product catalogue with 171+ lines and growing does.

## 3. Inventory Management — the fulfilment type changes what "stock" even means

This is the most important design decision in this document, and it comes directly from how
Roofsteel actually operates, not from a generic e-commerce inventory pattern:

| Fulfilment type | What actually constrains supply | What gets tracked |
|---|---|---|
| STOCK | Finished-goods sitting in the yard | Real quantity-on-hand, decremented on order |
| MADE_TO_LENGTH | Raw coil stock (a gauge/profile combination), not a finished-sheet count — nothing is "in stock" until it's roll-formed to the order | A lead-time estimate at launch (Section 3.2); raw-material-level tracking is the correct long-term model but real scope for later |
| CUT_TO_ORDER | Raw plate/sheet stock | Same as above |
| FABRICATED_TO_ORDER | Production capacity/queue, not a stock count at all | Lead-time estimate only, no stock concept |

Treating every fulfilment type as if it needs the same "quantity available" field would have been
wrong for roughly half the catalogue (Made to Length, Cut to Order, and Fabricated to Order lines
combined are a large share of the 171 products) — this is exactly the kind of mismatch this
project has avoided elsewhere (the freight/pricing/payment sections all adapted to what Roofsteel
actually is rather than a generic template).

### 3.1 — Stock-type inventory (real, built this session — see Section 4)

StockLevel per product per location: quantity on hand, quantity reserved (allocated to a real
order, not just sitting in someone's cart — a cart reservation would let an abandoned cart lock
up real stock), available = onHand minus reserved. StockMovement is the audit trail — every
change to qtyOnHand (received a delivery, sold, damaged, adjusted, transferred between the KZN
and Gauteng yards once both exist) is a row here, not just a field that silently changes value.
This is the same discipline as docs/DECISIONS.md's general practice of recording why a number
changed, not just its new value.

### 3.2 — Made-to-Length / Cut-to-Order "inventory" — the pragmatic v1 answer

Full bill-of-materials tracking (this SKU consumes X kg of 0.53mm galvanised coil, check the
coil's real stock before confirming an order) is the correct long-term model and is flagged here
as a real Phase 4+ project, not forgotten. Building it now, before Phase 3's checkout even
exists, would be solving a problem the business doesn't have yet. The v1 answer: these lines
show a lead-time estimate ("Made to Length — typically ships in 3-5 business days") instead of a
stock count, and don't hard-block an order the way a STOCK line with zero available would.

### 3.3 — Locations

Location model added (Section 4) with the real KZN/Gauteng two-yard plan from the capacity deck
already in mind — even though only one location will be seeded at launch, StockLevel being
location-aware from the start avoids a real data migration later when the second yard opens.

## 4. Schema additions made this session

See prisma/schema.prisma directly for the full definitions. Summary:

- Product.description (Text, nullable) — long-form PDP content, separate from the short
  catalogue specs field.
- ProductImage (productId, url, altText, sortOrder) — a product has many images; sortOrder
  drives gallery order, matching guidelines/12-storefront-ux-and-ia.md's gallery spec.
- Location (name, province) — real KZN/Gauteng-ready from the start.
- StockLevel (productId, locationId, qtyOnHand, qtyReserved) — unique per product+location.
- StockMovement (stockLevelId, type, quantity, reference, note, createdAt) — the audit trail.
- leadTimeDays (Int, nullable) on Product — the Made-to-Length/Cut-to-Order/
  Fabricated-to-Order lead-time estimate from Section 3.2.

## 5. Open decision: image and document storage

Not resolved in this document — flagged the same way Lulapay onboarding and real landed costs
were flagged in the original spec's Section 8, rather than guessed at. Product images and
compliance documents both need real object storage (S3-compatible — AWS S3 in af-south-1 for
data-sovereignty consistency with the group's stated infrastructure preference, or a Render
disk/bucket if that's simpler operationally). This needs a decision before the admin panel's
upload feature (Phase 4) can be built for real — flagged here so it isn't discovered as a
surprise blocker mid-Phase-4.

## 6. Sales Management — reporting over data that already exists

This isn't a new core system — Order and OrderItem are already real (built in the
scaffolding-finalisation session). "Sales management" means the admin-facing views over that
data, which is Phase 4 scope:

- Order fulfilment — admin transitions OrderStatus (already a real enum: PENDING_PAYMENT ->
  PROCESSING -> PACKED -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED), each transition
  triggering the notification jobs guidelines/09-notifications-and-jobs.md already specifies.
- Revenue reporting — by period, by category, by customer tier (Retail/Trade/Contractor/
  Project) — the tier breakdown matters specifically because it's the direct measure of whether
  the pricing engine's "thin on commodity, healthy on service" strategy (spec Section 7,
  guidelines/06-pricing-engine.md) is actually working as intended.
- Stock-level visibility — low-stock and back-in-stock views, reusing the exact pattern already
  proven on Bellwether SWE Plumbers (findLowStock — real days-of-stock-remaining from velocity,
  not a flat threshold) rather than reinventing it.

None of this is built yet — it's correctly sequenced as Phase 4, after Section 4's schema exists
for it to report on.
