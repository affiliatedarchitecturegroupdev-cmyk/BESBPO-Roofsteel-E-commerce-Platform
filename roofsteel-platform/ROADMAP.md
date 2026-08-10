# ROADMAP

Live checklist. Check a box when the work is real and merged — not when it's started. Expands
`Roofsteel-Ecommerce-Platform-Specification.docx` Section 6.3 into concrete, checkable tasks.
Update this file as part of every PR that completes a task (see `AGENTS.md` Section 3).

**LoC estimates** per task are from `docs/LOC-BUDGET.md`. **Full task detail, dependencies, and
acceptance criteria** are in `docs/DEVELOPMENT-PLAN.md` — read that document before starting any
task below. The `LoC act` column is filled with the actual lines added when a task completes
(from `npm run loc:check`).

Status legend: `[x]` done and merged, `[~]` in progress, `[ ]` not started

---

## Phase 1 — Foundation (COMPLETE — 2,575 LoC, 60 files)

- [x] Monorepo structure (apps/web, apps/api, apps/ai-service, packages/shared-types)
- [x] Prisma schema — full data model (catalogue, pricing, accounts, orders, quotes, wishlists, compliance docs)
- [x] Seed script + real catalogue/pricing data export (171 products, 15 pricing bands)
- [x] Pricing engine service — real tier-resolution logic
- [x] Products listing/filtering — real logic
- [x] CI pipeline, .env.example, LoC-check script and history log
- [x] AGENTS.md, CLAUDE.md, ROADMAP.md, docs/DEVELOPMENT-LOG.md, docs/DECISIONS.md
- [ ] npm install verified working with real network access (first Claude Code / OpenHands session)
- [ ] Real Postgres + Redis provisioned (Render), first successful prisma migrate + prisma db seed against a live database

## Phase 2 — Product, Catalogue & Pricing (est. 3,350 LoC → cumulative 5,925)

| Task | Description | LoC est | LoC act | Status |
|------|-------------|---------|---------|--------|
| 2.1 | Session/JWT issuance (auth module expansion) | 250 | 120 | [x] |
| 2.2 | Auth guard + @CurrentAccount decorator | 150 | 46 | [x] |
| 2.3 | Wire account-type into ProductsService/PricingService | 50 | 8 | [x] |
| 2.4 | Real Postgres full-text search (tsvector/pg_trgm) | 200 | 12 | [x] |
| 2.5 | Address module (CRUD endpoints) | 250 | 135 | [x] |
| 2.6 | Quote/RFQ module (Project/Tender tier) | 300 | 160 | [x] |
| 2.7 | Wishlist module (multi-list, project-based) | 250 | 135 | [x] |
| 2.8 | ComplianceDocument module (upload + list) | 200 | 95 | [x] |
| 2.9 | Review model + module (text/star, schema change) | 300 | 145 | [x] |
| 2.10 | API client data layer (frontend) | 300 | 312 | [x] |
| 2.11 | Home page (real fetch, trending, new arrivals) | 200 | 75 | [x] |
| 2.12 | Category/[slug] PLP (filters, sort, grid, pagination) | 350 | 93 | [x] |
| 2.13 | Search page (built out, reuses PLP components) | 150 | 68 | [x] |
| 2.14 | PDP (real fetch, gallery, specs, compliance tab, FBT) | 400 | 85 | [x] |
| 2.15 | Login/Register pages (built out) | 300 | 210 | [x] |
| 2.16 | Cut/bend service selector (SANS 282 shape codes) | 200 | — | [ ] |
| | **Phase 2 subtotal** | **3,350** | — | |

**Already done in Phase 1/2 overlap:** Categories endpoint, Made-to-Length Configurator, all 21
storefront routes scaffolded, category/[slug] + search + PDP route files scaffolded (not built
out — tasks 2.12–2.14).

## Phase 3 — Transactional Layer (est. 3,550 LoC → cumulative 9,225)

| Task | Description | LoC est | LoC act | Status |
|------|-------------|---------|---------|--------|
| 3.1 | Cart page (full, real state) | 250 | 117 | [x] |
| 3.2 | CartDrawer wiring (CartContext, real state) | 200 | 0 | [x] |
| 3.3 | Checkout page (one-page, collapsible steps) | 600 | 233 | [x] |
| 3.4 | Checkout success/cancelled pages | 150 | 64 | [x] |
| 3.5 | PayFast real HTTP integration + ITN webhook | 300 | — | [ ] |
| 3.6 | Lulapay real Partner API integration | 250 | — | [ ] |
| 3.7 | PayJustNow real integration (Retail only) | 200 | — | [ ] |
| 3.8 | Payment webhook idempotency + order transitions | 200 | — | [ ] |
| 3.9 | Orders list-by-account endpoint | 100 | — | [ ] |
| 3.10 | Account dashboard page | 200 | — | [ ] |
| 3.11 | Account/orders (list + detail + tracking) | 400 | — | [ ] |
| 3.12 | Account/addresses page | 250 | — | [ ] |
| 3.13 | Account/trade-account page (4 states) | 200 | — | [ ] |
| 3.14 | Trade/apply page (built out) | 200 | — | [ ] |
| 3.15 | Quote/request page | 250 | — | [ ] |
| | **Phase 3 subtotal** | **3,550** | — | |

**Already done:** Cart module (add/update/remove/merge, server-side MtL validation), orders
creation + payment Strategy Pattern, trade account application flow (PENDING/APPROVED/REJECTED),
estimatedReadyDays for mixed carts (ADR-014), OrderItem.fulfilmentType snapshot (ADR-015),
freight weight+distance banding (ADR-016).

## Phase 4 — Operational Layer (est. 3,800 LoC → cumulative 12,775)

| Task | Description | LoC est | LoC act | Status |
|------|-------------|---------|---------|--------|
| 4.1 | Admin auth guard + role middleware | 150 | — | [ ] |
| 4.2 | Admin panel shell + layout | 200 | — | [ ] |
| 4.3 | Admin — products management (CRUD + content/image) | 500 | — | [ ] |
| 4.4 | Admin — orders management + status transitions | 400 | — | [ ] |
| 4.5 | Admin — trade accounts review (approve/reject) | 250 | — | [ ] |
| 4.6 | Admin — pricing bands editor (yellow-cell convention) | 250 | — | [ ] |
| 4.7 | Admin — stock levels/movements | 350 | — | [ ] |
| 4.8 | Admin — compliance document upload | 200 | — | [ ] |
| 4.9 | BullMQ worker skeleton + queue setup | 200 | — | [ ] |
| 4.10 | Order lifecycle notification jobs | 400 | — | [ ] |
| 4.11 | Trade application notification jobs | 150 | — | [ ] |
| 4.12 | Back-in-stock / low-stock alert jobs | 200 | — | [ ] |
| 4.13 | Stock reservation logic (qtyReserved on order) | 150 | — | [ ] |
| 4.14 | Sales/revenue reporting dashboard | 350 | — | [ ] |
| 4.15 | Location detection UI (geolocation pre-fill) | 150 | — | [ ] |
| 4.16 | Courier/tracking integration | 300 | — | [ ] |
| | **Phase 4 subtotal** | **3,800** | — | |

**Already done:** Inventory schema (StockLevel, StockMovement, Location, leadTimeDays),
ProductImage, Product.description.

**Blocked on open decisions:** 4.8 (ADR-013 storage), 4.16 (ADR-017 courier).

## Phase 5 — Launch Polish (est. 1,900 LoC → cumulative 14,675)

| Task | Description | LoC est | LoC act | Status |
|------|-------------|---------|---------|--------|
| 5.1 | Legal/info pages (Terms, Privacy, Returns, Shipping, FAQ) | 400 | — | [ ] |
| 5.2 | Accessibility pass (WCAG 2.1 AA) | 150 | — | [ ] |
| 5.3 | AI service quote-assist endpoint | 200 | — | [ ] |
| 5.4 | AI service search-relevance endpoint | 150 | — | [ ] |
| 5.5 | Wishlist pages (multi-list, project-based) | 300 | — | [ ] |
| 5.6 | Reviews (text/star display + submit) | 250 | — | [ ] |
| 5.7 | SEO pass (metadata, sitemap, structured data) | 200 | — | [ ] |
| 5.8 | Rate limiting + helmet (security hardening) | 100 | — | [ ] |
| 5.9 | Account settings page | 150 | — | [ ] |
| | **Phase 5 subtotal** | **1,900** | — | |

## Cross-cutting — Tests (est. 1,200 LoC → cumulative 15,875)

| Task | Description | LoC est | LoC act | Status |
|------|-------------|---------|---------|--------|
| T.1 | PricingService unit tests | 150 | — | [ ] |
| T.2 | Made-to-Length validation tests | 100 | — | [ ] |
| T.3 | Trade-account approval transaction tests | 100 | — | [ ] |
| T.4 | PayFast webhook idempotency + signature tests | 120 | — | [ ] |
| T.5 | Checkout integration test (e2e) | 200 | — | [ ] |
| T.6 | Freight calculation tests | 100 | — | [ ] |
| T.7 | Auth/JWT tests | 100 | — | [ ] |
| T.8 | Address/Quote/Wishlist endpoint tests | 200 | — | [ ] |
| T.9 | Admin endpoint tests | 130 | — | [ ] |
| | **Tests subtotal** | **1,200** | — | |

## Total estimated LoC for full operation

| Component | LoC |
|-----------|-----|
| Already built (Phase 1 + overlap) | 2,575 |
| Remaining (Phases 2–5 + tests) | 13,300 |
| **Total at full operation** | **~15,875** |

See `docs/LOC-BUDGET.md` for the methodology and confidence behind these numbers.

---

## Resolved decisions

See docs/DECISIONS.md ADR-005, ADR-006, ADR-007 for full reasoning. As of 2026-08-09:

- ~~Repository ownership~~ — Besbpo Group (ADR-005)
- ~~Lulapay Partner onboarding~~ — approved, proceeding (ADR-006)
- ~~Real landed costs~~ — approved for use now, cost-refinement pass planned for Phase 4/5 (ADR-007)

## Still blocked / waiting on a decision

- Click-and-collect timing (build now vs. defer to real yard opening)
- Reviews: photo upload in v1 scope or not
