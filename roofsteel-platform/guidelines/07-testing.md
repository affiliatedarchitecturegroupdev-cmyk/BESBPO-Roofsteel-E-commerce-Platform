# Testing Guidelines

## The bar, stated plainly

Business logic where a bug costs someone money or ships wrong compliance data gets real unit
tests. UI scaffolding and simple CRUD wrappers don't need the same bar at this project stage.
When deciding whether something needs a test, ask: if this is wrong, does a customer get charged
incorrectly, does an order ship with the wrong Made-to-Length spec, or does a compliance
certificate attach to the wrong batch? If yes, test it before moving on.

## What definitely needs unit tests

- PricingService — every tier's formula, both pricing-key special cases (Steel Roofing Sheets,
  Roofing Timber & Trusses), the PROJECT-tier volume-floor behaviour.
- Made-to-Length validation — the 13,200mm maximum, gauge/profile scoped to what a specific
  product actually offers (guidelines/04-made-to-length-configurator.md).
- Trade account approval — the single-transaction Account.type + application status update, and
  that duplicate-pending or already-trade applications are rejected at creation.
- Payment webhook handlers — idempotency (a retried PayFast ITN must not double-fulfil an
  order), signature verification logic.
- Freight/delivery cost calculation once built (spec Section 4.6) — the province-banding logic.

## What needs integration tests, not just unit tests

Checkout end-to-end (cart -> payment initialization -> order creation) is the one flow where a
unit test on each piece isn't enough — the pieces need to be tested together at least once,
because this is where three previously-independent modules (cart, pricing, payments) have to
agree with each other correctly.

## What doesn't need heavy test investment right now

- Scaffolded modules still marked SCAFFOLD in AGENTS.md's sense — don't write tests against
  code that's about to be replaced.
- Simple pass-through admin CRUD (list/get/update a Product's non-pricing fields) — real, but
  low-risk if briefly wrong; a manual admin catches it fast.
- The ai-service's quote-assist endpoint at its current planned scope (Section 2.2 of the spec —
  deliberately small) — test once it exists and does something specific, not preemptively.

## Test file conventions

Colocate: pricing.service.spec.ts next to pricing.service.ts, following NestJS/Jest convention
already implied by the api package.json's "test": "jest" script. Don't create a parallel test/
directory structure that drifts from the source tree.

## Running tests

npm --workspace apps/api run test. Every PR that adds or changes business logic (see the list
above) runs this and includes the result — the PR template (.github/PULL_REQUEST_TEMPLATE.md)
checklist already asks for this explicitly.

## A real example of what "test the thing that would be expensive to get wrong" looks like

On the sister platform this project's patterns are drawn from, a real live bug was caught during
gap-analysis review: a pageSize cap mismatch broke pagination across 5 pages plus the sitemap.
That's exactly the class of bug a test on the listing endpoint's pagination boundary would have
caught before it shipped. Write the test that would have caught the last real bug you know
about, not just the test that's easiest to write.
