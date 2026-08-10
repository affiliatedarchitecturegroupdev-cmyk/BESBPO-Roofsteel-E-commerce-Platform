# Delivery, Courier & Location Awareness

Covers three related but distinct questions: how freight actually gets costed, how a courier
gets chosen and tracked, and what "location awareness" means for this platform specifically —
deliberately not the suburb-level hyper-local model the group blueprint originally proposed.

## 1. Location awareness — province-level, not suburb-level, and why

guidelines/12-storefront-ux-and-ia.md already made this call: the blueprint's Sixty60-style
suburb-level location detection doesn't fit a business shipping structural steel and roofing
sheet, where the delivery vehicle and load planning matter more than a 60-minute promise. That
decision stands. What "location awareness" means here:

- A manual province selector is the source of truth for freight. The customer confirms their
  delivery province at checkout — this is what Order.province and the freight calculation
  actually use. Never silently computed and charged without the customer seeing it.
- Browser geolocation, if used, is a convenience pre-fill only. Real value: a customer doesn't
  have to manually find their province in a dropdown. Real constraint: it never feeds the
  freight calculation directly — reverse-geocode a coordinate to a suggested province, pre-select
  it in the UI, and let the customer confirm or override before it becomes Order.province.
  Getting this distinction wrong (trusting geolocation for the actual charge) is exactly the
  kind of silent-precision-that-isn't-real this project has avoided elsewhere — the same
  reasoning as why costIsReal/weightIsReal flags exist instead of presenting every number with
  equal confidence.
- Not built yet on the frontend — this is a real, named gap. The checkout page itself is still
  scaffolded (Gap Analysis I), so a location-detection component has nothing to attach to yet.
  Build it alongside the real checkout page, not before.

## 2. Freight — real weight and distance banding, replacing the flat placeholder

ADR-008 flagged the original flat R450 rate as an explicit placeholder needing real structure.
That structure exists now:

- Weight comes from Product.weightKgPerUnit — real engineering mass-table data for the 80
  Structural and Reinforcing Steel products (the exact mass tables already computed for the
  Pricing Framework's per-kg cost calculations, reused rather than re-derived), reasoned
  category-level estimates for the other 91 (weightIsReal: false on those, same honesty pattern
  as costIsReal). A Made-to-Length line's weight scales by its actual configured length, the
  same way its price does (CartService.getCartWithPricing's lineWeightKg) — a 6.2m sheet weighs
  6.2x the per-metre figure, not a flat per-unit weight.
- Distance comes from a real per-province multiplier, reasoned from actual approximate road
  distance from the Phase 1 KZN flagship yard (Durban area) — Western Cape (~1,650km) costs
  meaningfully more to reach than KZN itself (local) or Gauteng (~570km, a well-served freight
  corridor). Revisit once the Gauteng depot (capacity deck Phase 2) opens — freight should
  originate from whichever yard is actually closer to the delivery province.
- What's still illustrative: the rand values themselves (weightBandRate's band pricing).
  ADR-008's caveat still applies — no real freight-fleet rate-card review has happened. The
  structure (weight bands, distance multipliers) is real reasoning; the prices aren't approved
  the way landed costs were (ADR-007).
- Free delivery has a weight ceiling, not just a rand threshold — waiving freight on a R15,000
  order of light accessories is reasonable; waiving it on a R15,001 order that happens to
  include two tonnes of structural steel would mean giving away the actual cost of a real truck
  run. FREE_DELIVERY_MAX_WEIGHT_KG exists specifically to prevent that.

## 3. Courier — schema-ready, decision genuinely open

No courier has been chosen. Shipment (carrier, trackingNumber, dispatchedAt, deliveredAt) is
schema-ready — deliberately a free-text carrier field, not an enum, since locking in a fixed
set of carrier options before the decision is made would need a migration to change later.

Two real options worth naming, not just "pick a courier":

1. Besfleet — the Besbpo Group's own long-haul trucking/logistics division. Routing heavy
   freight (structural steel, bulk roofing sheet, reinforcing bar) through an existing group
   division rather than an external freight broker is a genuine option worth evaluating first —
   the same kind of internal-group synergy already used for Cement/Aggregate cross-selling to
   Precast Direct.
2. External parcel/freight courier — for the lighter end of the catalogue (PPE, fasteners,
   accessories under the 50kg free-delivery weight ceiling), a standard South African parcel
   courier (The Courier Guy, RAM, Fastway) fits better than a freight truck. It's plausible the
   real answer is both: Besfleet (or a dedicated freight partner) for heavy/bulk orders,
   standard parcel courier for light ones, selected by which weight band an order falls into.

This is flagged as an open decision the same way Lulapay onboarding was (spec Section 8) —
needs a real answer from Fortune before Shipment.carrier and any tracking-webhook integration
can be built for real, not guessed at.

## 4. What's still deferred, named plainly

- Real-time geospatial tracking (a live map, "your driver is 2.3km away") — already deferred
  with the Elixir real-time service (ADR-001/Section 2.2). SMS/email milestone updates
  (guidelines/09-notifications-and-jobs.md) cover this at launch.
- Multi-shipment orders (Stock ships today, Made-to-Length follows) —
  guidelines/14-checkout-and-fulfilment-timing.md Section 4 already named the mechanism
  (subset-scoped checkout) without building it yet. Shipment is one-per-order for v1
  accordingly.
- Courier webhook integration — no real courier chosen yet (Section 3), so no real webhook
  contract exists to build against. Order.estimatedReadyDays and manual status updates cover
  communicating timing honestly until a real courier integration exists.
