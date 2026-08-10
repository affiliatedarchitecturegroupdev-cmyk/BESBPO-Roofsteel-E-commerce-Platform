# Database & Prisma Conventions

## Migrations

npm run prisma:migrate for every schema change — never hand-edit the database, never ship a
schema change without a corresponding migration file committed. Name migrations for what they
do (add_wishlist_share_slug), not generically (update_schema).

## Schema conventions already established — follow them, don't reinvent

- cuid() for every primary key (see every model in schema.prisma) — stay consistent, don't
  switch to uuid() for a new model.
- Decimal @db.Decimal(x, y) for anything currency or measurement-precision (landedCost,
  retailMarkup, mtlGaugeMm) — never Float for money or a measurement that feeds a price
  calculation. Floating-point rounding error in a price is a real bug, not a theoretical one.
- Enums over free-text strings for anything with a closed set of values (FulfilmentType,
  Segment, Province, OrderStatus). If you need a new closed-set field, add an enum — don't
  reach for a string with an implied set of valid values enforced only in application code.
- @@index on any foreign key or field a list endpoint filters by. Product already has indexes
  on categoryId and fulfilmentType — match that pattern for new query patterns rather than
  discovering the need for an index after a slow endpoint ships.

## Pricing data stays derived, not duplicated

Product.landedCost and PricingBand are the source of truth for pricing. Never store a computed
retailPrice/tradePrice/volumePrice on Product itself — PricingService computes these at query
time specifically so an admin edit to a PricingBand propagates immediately everywhere, matching
the pricing workbook's own "edit the yellow cells, everything recalculates" design (see
guidelines/06-pricing-engine.md). The one place a price does get persisted is
OrderItem.unitPrice — locked in at order time, deliberately, because a price change after
checkout shouldn't retroactively change what was already ordered.

## Transactions

Any write that touches more than one table and needs to succeed or fail together goes in a
prisma.$transaction(...). The clearest example: approving a TradeAccountApplication must update
both the application's status AND the Account.type in one transaction — this was built as a
single-transaction operation deliberately on the sister platform this pattern comes from, not
two sequential writes that could partially fail.

## Seed data discipline

prisma/data/*.json is exported from the real catalogue and pricing workbooks — see CLAUDE.md.
Don't hand-edit these JSON files if a product or pricing band needs to change; update the source
workbook and re-export, or the seed data will silently drift from the spreadsheet that's the
actual source of truth. If a genuinely new product needs to exist only in the database (not yet
in the workbook), add it via a proper migration/seed addition with a clear comment explaining
it's not yet reflected upstream.

## Query patterns

Prefer Prisma's include/select over fetching a full record and filtering in application code —
see ProductsService.findBySku() for the pattern (includes category, subcategory, segments, and
compliance docs in one query rather than four). For anything beyond a simple filter/include,
check whether raw SQL via $queryRaw is genuinely needed before reaching for it — Postgres
full-text search (tsvector/pg_trgm, per ADR-002) is one of the few places it likely is.
