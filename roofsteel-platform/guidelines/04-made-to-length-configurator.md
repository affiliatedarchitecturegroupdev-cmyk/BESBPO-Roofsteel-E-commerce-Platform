# Made-to-Length Configurator — Detailed Feature Spec

The flagship interactive feature (spec Section 4.1). This document is the level of detail the
main spec doesn't go into — read it before touching any Made-to-Length code, front or back end.

## The real-world constraint this encodes

Roofsteel's in-house roll-forming line cuts steel roofing sheet to an exact customer-specified
length, rather than selling fixed-length stock only. That's a physical machine with real limits.
Every rule below exists because of that machine, not because it seemed like good UX.

## Hard constraints (reject, don't clamp)

- Gauge: 0.30mm-0.80mm. Only the gauges actually listed on the specific product's specs field
  are valid for that product — don't assume the full range applies to every Made-to-Length line
  uniformly, check the product's own spec string.
- Length: up to 13,200mm. A request for 13,500mm is a validation error, not a value silently
  capped to 13,200 — the customer needs to know their real requirement doesn't fit standard
  processing, not receive a shorter sheet than they asked for without being told.
- Profile: IBR, corrugated, mini/bullnose, concealed-fix, colour-coated — again, scoped to what
  that specific product actually offers, not the full catalogue-wide list.

## Data model (already in schema.prisma)

CartItem and OrderItem both carry mtlGaugeMm, mtlProfile, mtlColour, mtlLengthMm as real
structured columns — never serialise a Made-to-Length configuration into a free-text notes
field. This is required for three separate downstream needs, not just display:

1. Manufacturing — the roll-forming line needs a real, structured cut list generated from
   orders, not a human re-reading order notes.
2. Pricing — PricingService resolves the "Steel Roofing Sheets — Made to Length" band (45%
   retail markup) specifically for these lines; a free-text configuration can't be priced
   programmatically.
3. Compliance — the certificate trail (spec Section 4.5) references the exact product and
   batch; an ambiguous configuration breaks that trail.

## API contract

POST /v1/cart/items (once the cart module is built) with a body matching MadeToLengthConfig
from packages/shared-types:

    {
      "productId": "...",
      "quantity": 1,
      "mtl": { "gaugeMm": 0.53, "profile": "IBR", "colour": "Charcoal", "lengthMm": 6200 }
    }

Validate server-side even though the frontend also validates client-side (guideline
03-frontend.md) — never trust client-side validation alone for a field that feeds both pricing
and a real manufacturing process.

## Price calculation

Made-to-Length pricing is per-unit-area (most lines are priced "per m²"), not flat per sheet.
The configurator's live price display multiplies the resolved unit price
(PricingService.resolveProductPrice) by the actual area implied by the length the customer has
entered, not by a fixed assumed length. Get this wrong and every Made-to-Length quote is silently
incorrect regardless of how correct the underlying tier pricing is.

## UI states to build (frontend)

1. Default — profile/colour selected, length empty, Add to Cart disabled.
2. Valid configuration — live price shown, Add to Cart enabled.
3. Invalid length — clear inline error naming the actual maximum (13.2m), not a generic
   "invalid input" message. This is a real physical constraint a trade buyer will want to
   understand, not just comply with.
4. Gauge/profile combination not available — some combinations may not exist for a given
   product; disable rather than allow a selection that has no valid price to resolve against.

## What NOT to build here

Real-time inventory reservation against the roll-forming line's actual production queue is out
of scope for the configurator itself — that's an operational/scheduling concern, not a checkout
feature, and isn't in the spec's Phase 2-5 scope. Don't scope-creep this feature into a
production-scheduling system.
