# AGENTS.md — OpenHands Repository Memory

## Repository structure

The actual project lives in the `roofsteel-platform/` subdirectory (extracted from
`roofsteel-platform.zip` on the main branch). That directory is the source of truth — its own
`AGENTS.md`, `CLAUDE.md`, `guidelines/`, `ROADMAP.md`, and `docs/` are the authoritative
operating rules. Always `cd roofsteel-platform` before running build/test/git commands.

## What this project is

Roofsteel E-Commerce Platform — single-vendor B2B/B2C platform for steel, roofing, and
structural materials (Besbpo Group division). NOT a marketplace. 171 catalogue lines across 13
categories, priced through a 15-band tiered pricing engine. Deployed target: roofsteel.shop
on Render.

## Verified contents of roofsteel-platform/ (confirmed by counting)

- 22 Prisma models (schema.prisma)
- 23 Next.js routes (apps/web/app/**/page.tsx)
- 16 guideline documents (guidelines/00-INDEX.md through 15-delivery-courier-and-location.md)
- 123 files total

## Stack (decided — do not relitigate)

- apps/api — NestJS (TypeScript), port 4000, global prefix /v1
- apps/web — Next.js 14 App Router, port 3000
- apps/ai-service — FastAPI (Python), deliberately small (~890 LoC target)
- packages/shared-types — shared TS types mirroring Prisma enums
- Postgres (tsvector/pg_trgm full-text search, not Algolia) + Redis, Render-native
- BullMQ for background jobs
- Two languages only (TS + Python). No Go/Rust/Elixir (ADR-001).

## Code discipline (critical)

- 250-850 LoC average per logic-bearing file, 1,800 LoC hard cap (ADR-004). Run
  `npm run loc:check` before any PR — wired into CI as a hard failure.
- Every module is real logic OR carries an explicit `// SCAFFOLD` comment naming the spec
  section it implements. Never a module that looks finished but silently does nothing.
- Decimal @db.Decimal for all currency/measurement-precision — never Float for money.
- cuid() for every PK. Enums over free-text strings for closed value sets.

## What's real vs. what's scaffolded (as of 2026-08-10)

Real backend logic: pricing engine (PricingService), products listing/filtering, categories
endpoint, auth (register/login with bcrypt — but session/JWT issuance is still a TODO), cart
(add/update/remove/merge with server-side MtL validation), trade-accounts (apply/approve/reject
single-transaction), orders (checkout orchestration + payment Strategy Pattern with PayFast
dual-algorithm signatures, Lulapay, PayJustNow — all three honestly throw/return-false until
real gateway credentials exist).

Real frontend: Home, PDP, Made-to-Length Configurator (live pricing matching backend formula),
CartDrawer, StoreHeader, MobileTabBar, ProductCard, PriceDisplay, FulfilmentBadge, CategoryGrid.

Scaffolded: 21 storefront routes (login, register, cart, checkout ×3, account ×6, trade/apply,
quote/request, search, category/[slug], 5 legal pages) — each has a real page.tsx with a TODO
pointing at the relevant guideline/spec section. Admin panel, BullMQ worker, and ai-service
quote-assist are not started.

## Key architectural patterns

- Pricing is computed at query time from PricingBand, never stored on Product (except
  OrderItem.unitPrice, snapshotted at order time). Formula: retail = cost*(1+markup),
  trade = retail*(1-discount), volume = retail*(1-volumeDiscount).
- Payment Strategy Pattern: OrdersService depends on PaymentStrategy interface, never a
  gateway SDK directly. GATEWAYS_BY_TIER enforces tier eligibility in one place.
- Made-to-Length: Product is template, CartItem/OrderItem is the configured instance (gauge,
  profile, colour, lengthMm as structured columns, never free text). Max length 13,200mm.
- Mixed-cart timing: Order.estimatedReadyDays = MAX lead time across lines, not average.
- OrderItem.fulfilmentType snapshotted at order time — enforces non-returnable policy for
  Made-to-Length/Cut-to-Order/Fabricated-to-Order lines (ADR-015).
- Frontend uses direct client-side fetch to NestJS API (NEXT_PUBLIC_API_URL), not Server
  Actions (ADR-009). Interactive sections are their own "use client" components.
- Inventory varies by fulfilment type: StockLevel/StockMovement/Location for STOCK lines only;
  Product.leadTimeDays (estimate) for the other three types (ADR-012).

## Development workflow

- Branch naming: phase-<n>/<short-module-name>
- Commit messages: imperative, scoped (e.g., `pricing: resolve trade tier from account type`)
- Every PR: reference spec section, pass loc:check, include tests for business logic, update
  ROADMAP.md checkbox, add docs/DEVELOPMENT-LOG.md entry, add docs/DECISIONS.md entry if a
  real decision was made.
- Read guidelines/00-INDEX.md for domain-specific detail before working in any area.

## Setup commands (require network access — not yet run in this environment)

```
cd roofsteel-platform
npm install
cp .env.example .env        # fill DATABASE_URL / REDIS_URL at minimum
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed         # loads the real 171-product catalogue + 15 pricing bands
npm run dev:api             # localhost:4000
npm run dev:web             # localhost:3000
```

## Prioritised next steps (from docs/GAP-ANALYSIS-I.md Section 8)

1. Categories endpoint — DONE (built in Gap Analysis I session)
2. Session/JWT issuance — highest priority open item
3. Address + Quote endpoints — blocks checkout and Project/Tender tier
4. First real test file — pricing.service.spec.ts (zero test coverage currently)
5. Wishlist, ComplianceDocument endpoints
6. BullMQ worker skeleton
7. Admin panel (Phase 4, don't pull forward)

## Open decisions (check with Fortune, don't guess)

- Image/document storage: S3-compatible vs Render-native (ADR-013, proposed)
- Courier selection: Besfleet vs external parcel courier vs both by weight (ADR-017, proposed)
- Click-and-collect: build now or defer until a physical yard exists
- Reviews: text/star only at launch, or does photo upload need v1 scope

## Security notes

- Never commit .env or gateway credentials. .gitignore already excludes .env*.
- Account type resolved server-side from authenticated session — never trust client-supplied
  type for pricing.
- Payment webhook signatures must be verified — never process unverified payment confirmations.
- Freight rand values are illustrative (ADR-016) — structure is real, prices aren't approved.
