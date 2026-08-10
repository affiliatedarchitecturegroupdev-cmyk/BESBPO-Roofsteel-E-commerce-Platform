# Checkout Process & Fulfilment Timing — Balancing Fixed SKUs Against Cut-to-Length Products

Answers a real tension in this platform's product model: standard e-commerce assumes a SKU is a
fixed, resellable unit. 95 of Roofsteel's 171 products (Made to Length, Cut to Order, Fabricated
to Order) aren't that — every unit is configured per order. This document is how the platform
resolves that without either pretending the catalogue is simpler than it is, or building a
fully custom commerce model from scratch.

## 1. The checkout process, as it actually runs today

1. Browse -> Add to Cart — CartService.addItem validates Made-to-Length configuration
   server-side (the 13,200mm maximum) regardless of what the frontend already checked
   (guidelines/04-made-to-length-configurator.md).
2. Cart — CartService.getCartWithPricing resolves pricing live, every time it's called, via
   PricingService. This matters for the question of price staleness: there is no cached price
   sitting in the cart from when an item was added. A cart viewed a week after items were added
   shows current pricing, not stale pricing.
3. Checkout — OrdersService.createOrder calls getCartWithPricing again, meaning the price that
   actually gets charged is resolved at the moment of order creation, not copied from an
   earlier cart view. Confirmed by reading the code, not assumed.
4. Order creation — Order and every OrderItem are created in one write. Two things are
   snapshotted at this exact moment, deliberately, both for the same reason: unitPrice (so a
   later price change never retroactively alters a placed order) and, as of this session,
   fulfilmentType (so a later catalogue change never alters what a past order's return policy
   was — see Section 3).
5. Payment — the appropriate PaymentStrategy initializes a session; webhook confirmation
   transitions order status (guidelines/05-payments.md).

## 2. The actual design pattern — Product as template, OrderItem as instance

This is the mechanism that makes "balance" possible, not a metaphor:

- Product (the SKU) is a template. It defines what can be configured — the gauge range,
  available profiles and colours, the per-unit price — not a single fixed thing for sale.
- CartItem/OrderItem is the configured instance. mtlGaugeMm, mtlProfile, mtlColour,
  mtlLengthMm are real structured columns on the line item, not on the product.

This is deliberately close to how a variant-based e-commerce platform (Shopify-style
size/colour variants) works, with one real difference worth naming: variants are usually a
small, enumerated set (S/M/L, three colours) — Roofsteel's length is a continuous value (any
whole millimetre from 1 to 13,200). That's why length lives on the order line as a number, not
as a pre-generated set of "variant SKUs" — generating a SKU row for every possible length would
be both infinite and pointless. The template/instance split is what avoids that without losing
the structured data both pricing and manufacturing need.

## 3. Non-returnable, by policy — now actually enforced in the schema

The Pricing Framework workbook decided this a long time before this codebase existed
(Additional Charges sheet): "Made-to-Length, Cut to Order, and Fabricated to Order items are
non-returnable by nature — standard industry practice, not open to a restocking fee." That
policy was real but had never been wired into any code — nothing in the schema or API even
recorded a line's fulfilment type at the time of purchase. Fixed this session:

- OrderItem.fulfilmentType is now snapshotted at order time (Section 1, step 4).
- Not yet built: the actual Returns/RMA module (correctly Phase 4/5 — it doesn't exist for any
  fulfilment type yet). But when it is built, it has real data to check against instead of
  needing to be designed from scratch: if (orderItem.fulfilmentType !== "STOCK") reject.

## 4. The honest answer on mixed-cart fulfilment timing

The real tension the schema didn't handle before this session: an order can contain a Stock
item (ready today) and a Made-to-Length item (ready in 4 days). What does "your order" mean when
its parts are ready on different days?

Decision for v1: one order, one delivery, honestly timed to the slowest line.
Order.estimatedReadyDays is now computed as the maximum lead time across every line in the
order (OrdersService.calculateEstimatedReadyDays) — a Stock-only order shows 0 days, a mixed
order shows however long its slowest Made-to-Length or Fabricated-to-Order line takes. This is
deliberately not an average and not the fastest line: telling a customer "ready in 0 days" for
an order that also contains a 7-day Fabricated-to-Order gate would be honestly wrong about the
order as a whole.

What this defers, on purpose: splitting one order into multiple shipments (Stock ships today,
Made-to-Length follows later) is real, valuable, and not built yet. When it is, the mechanism to
build it already exists in a proven form: Bellwether SWE Plumbers' cart pricing already supports
scoping a checkout to a subset of cart item IDs (cartItemIds param, originally built for split
checkout and reused for recurring orders). The same pattern — checkout a subset of the cart, not
always the whole thing — is the right foundation for "ship Stock now, Made-to-Length separately"
once that's worth building. Not pulled forward into this session because Phase 3 doesn't have a
working single-shipment checkout yet; building the multi-shipment version first would be solving
a harder problem before the simpler one works.

## 5. What's still an honest, named gap

Raw-material availability for Made-to-Length/Cut-to-Order lines is not checked at order time —
guidelines/13-listings-cms-inventory-sales.md Section 3.2 already named full bill-of-materials
tracking as deferred, and this document doesn't change that. In practice, this means an order
can currently be accepted for a gauge/profile combination that's actually out of raw coil stock.
Until BOM-level tracking exists, this needs a manual operational check (admin visibility into
what's been ordered vs. what coil is on hand), not a system guarantee — worth knowing before
relying on the platform to self-manage supply for these lines.
