# LoC Budget — Lines of Code Required for Full Operation

How many lines of code the Roofsteel platform needs to be fully operational, broken down
task by task. This is the budget the roadmap works against — every completed task's LoC is
tracked cumulatively in `docs/loc-history.log` and compared to the estimates here.

## Methodology

- Estimates are for **loc-countable source** — `.ts`, `.tsx`, `.py` files under `apps/` and
  `packages/`, the same scope `scripts/check-loc.sh` measures. CSS, JSON seed data, config
  files, and documentation are excluded (they're real work but not counted by the LoC
  discipline).
- Each estimate is a range (low–high) reflecting genuine uncertainty about UI complexity
  and integration detail. The mid-point is used for cumulative planning.
- The project currently has **2,575 LoC across 60 files** (see `docs/loc-history.log`).
- The 250–850 average / 1,800 hard-cap discipline (ADR-004) applies throughout — no single
  file exceeds 1,800 LoC. Large features are split into multiple files.

## Current baseline

| Metric | Value |
|--------|-------|
| Files (loc-countable) | 60 |
| Total LoC | 2,575 |
| Average LoC/file | 42 |
| Hard-cap violations | 0 |

## Summary by phase

| Phase | Description | Est. LoC (mid) | Cumulative |
|-------|-------------|----------------|------------|
| Already built | Phase 1 foundation + Phase 2-4 real logic | 2,575 | 2,575 |
| Phase 2 | Product, Catalogue & Pricing | 3,350 | 5,925 |
| Phase 3 | Transactional Layer | 3,300 | 9,225 |
| Phase 4 | Operational Layer | 3,550 | 12,775 |
| Phase 5 | Launch Polish | 1,900 | 14,675 |
| Cross-cutting | Tests, admin auth, API client, infra | 1,200 | 15,875 |

**Estimated total at full operation: ~15,900 LoC across ~150 files.**

This is the loc-countable source. The broader "~35,000 LoC" figure in `README.md` includes
non-counted work: ~6,000 LoC of CSS, ~3,000 LoC of seed JSON, ~2,000 LoC of documentation
and guidelines, ~3,000 LoC of config/scaffold files, and a buffer for iteration. Both
figures are consistent — the 15,900 is the loc-check-script number; the 35,000 is the
total-repository footprint including everything the script doesn't measure.

## Detailed breakdown

### Phase 2 — Product, Catalogue & Pricing (est. 3,350 LoC)

| # | Task | Files | Est. LoC | Dependencies |
|---|------|-------|----------|--------------|
| 2.1 | Session/JWT issuance (auth module expansion) | auth.service, jwt.strategy, auth.controller, dto | 250 | None — highest priority |
| 2.2 | Auth guard + current-account decorator | auth.guard, current-account.decorator, auth.module | 150 | 2.1 |
| 2.3 | Wire account-type resolution into ProductsService/PricingService | products.module, pricing.service | 50 | 2.2 |
| 2.4 | Real Postgres full-text search (tsvector/pg_trgm) | products.service, search.sql, migration | 200 | 2.3 |
| 2.5 | Address module (controller/service/dto) | addresses.module, service, controller, dto | 250 | 2.2 |
| 2.6 | Quote/RFQ module | quotes.module, service, controller, dto | 300 | 2.2 |
| 2.7 | Wishlist module | wishlists.module, service, controller, dto | 250 | 2.2 |
| 2.8 | ComplianceDocument module | compliance.module, service, controller, dto | 200 | 2.2 |
| 2.9 | Review model + module (schema change) | schema.prisma, reviews.module, service, controller, dto | 300 | 2.2 |
| 2.10 | API client data layer (frontend) | lib/api-client.ts, lib/hooks.ts | 300 | 2.1 |
| 2.11 | Home page (real fetch, trending, new arrivals) | app/page.tsx, components | 200 | 2.10, 2.4 |
| 2.12 | Category/[slug] PLP (filters, sort, grid, pagination) | page.tsx, FilterDrawer, Breadcrumb | 350 | 2.10 |
| 2.13 | Search page (built out) | app/search/page.tsx | 150 | 2.4, 2.10 |
| 2.14 | PDP (real fetch, gallery, specs, compliance tab) | page.tsx, Gallery, AccordionSpecs, ComplianceTab | 400 | 2.10, 2.8 |
| 2.15 | Login/Register pages (built out) | login/page.tsx, register/page.tsx, AuthForm | 300 | 2.1, 2.10 |
| 2.16 | Cut/bend service selector (SANS 282) | CutBendSelector component, dto | 200 | 2.6 |
| | **Phase 2 subtotal** | | **3,350** | |

### Phase 3 — Transactional Layer (est. 3,300 LoC)

| # | Task | Files | Est. LoC | Dependencies |
|---|------|-------|----------|--------------|
| 3.1 | Cart page (full, real state) | cart/page.tsx, CartLineItem | 250 | 2.10 |
| 3.2 | CartDrawer wiring (real state, cart context) | CartContext, CartDrawer | 200 | 2.10 |
| 3.3 | Checkout page (one-page, collapsible steps) | checkout/page.tsx, CheckoutSteps, DeliveryStep, PaymentStep, ReviewStep | 600 | 2.5, 3.2 |
| 3.4 | Checkout success/cancelled pages | success/page.tsx, cancelled/page.tsx | 150 | 3.3 |
| 3.5 | PayFast real HTTP integration + ITN webhook handler | payfast.strategy, payfast.webhook.controller | 300 | 3.3 |
| 3.6 | Lulapay real Partner API integration | lulapay.strategy, lulapay.webhook | 250 | 3.3 |
| 3.7 | PayJustNow real integration | payjustnow.strategy, payjustnow.widget | 200 | 3.3 |
| 3.8 | Payment webhook idempotency + order status transitions | orders.service, payment.processor | 200 | 3.5, 3.6, 3.7 |
| 3.9 | Orders list-by-account endpoint | orders.controller, orders.service | 100 | 2.2 |
| 3.10 | Account dashboard page | account/page.tsx | 200 | 3.9, 2.10 |
| 3.11 | Account/orders (list + detail + tracking) | orders/page.tsx, [orderNumber]/page.tsx, OrderTimeline | 400 | 3.9, 2.10 |
| 3.12 | Account/addresses page | addresses/page.tsx, AddressForm | 250 | 2.5, 2.10 |
| 3.13 | Account/trade-account page (4 states) | trade-account/page.tsx | 200 | 2.10 |
| 3.14 | Trade/apply page (built out) | trade/apply/page.tsx, TradeApplicationForm | 200 | 2.10 |
| 3.15 | Quote/request page | quote/request/page.tsx, QuoteForm | 250 | 2.6, 2.10 |
| | **Phase 3 subtotal** | | **3,550** | |

### Phase 4 — Operational Layer (est. 3,550 LoC)

| # | Task | Files | Est. LoC | Dependencies |
|---|------|-------|----------|--------------|
| 4.1 | Admin auth guard + role middleware | admin.guard, roles.decorator | 150 | 2.2 |
| 4.2 | Admin panel shell + layout | admin/layout.tsx, admin/page.tsx, AdminNav | 200 | 4.1 |
| 4.3 | Admin — products management (CRUD + content/image) | admin/products/page.tsx, ProductEditor | 500 | 4.2 |
| 4.4 | Admin — orders management + status transitions | admin/orders/page.tsx, OrderManager | 400 | 4.2 |
| 4.5 | Admin — trade accounts review (approve/reject) | admin/trade-accounts/page.tsx | 250 | 4.2 |
| 4.6 | Admin — pricing bands editor (yellow-cell convention) | admin/pricing-bands/page.tsx, BandEditor | 250 | 4.2 |
| 4.7 | Admin — stock levels/movements | admin/stock/page.tsx, StockManager | 350 | 4.2 |
| 4.8 | Admin — compliance document upload | admin/compliance/page.tsx | 200 | 4.2, ADR-013 |
| 4.9 | BullMQ worker skeleton + queue setup | jobs/queue.ts, jobs/worker.ts | 200 | None |
| 4.10 | Order lifecycle notification jobs | jobs/order-notifications.processor, templates | 400 | 4.9 |
| 4.11 | Trade application notification jobs | jobs/trade-notifications.processor | 150 | 4.9 |
| 4.12 | Back-in-stock / low-stock alert jobs | jobs/stock-alerts.processor | 200 | 4.9 |
| 4.13 | Stock reservation logic (qtyReserved on order) | orders.service, stock.service | 150 | 4.7 |
| 4.14 | Sales/revenue reporting dashboard | admin/reports/page.tsx, reporting.service | 350 | 4.2 |
| 4.15 | Location detection UI (geolocation pre-fill) | LocationDetector component | 150 | 3.3 |
| 4.16 | Courier/tracking integration | shipment.service, tracking.controller | 300 | ADR-017 |
| | **Phase 4 subtotal** | | **3,800** | |

### Phase 5 — Launch Polish (est. 1,900 LoC)

| # | Task | Files | Est. LoC | Dependencies |
|---|------|-------|----------|--------------|
| 5.1 | Legal pages (Terms, Privacy, Returns, Shipping, FAQ) | 5 page.tsx files | 400 | None |
| 5.2 | Accessibility pass (WCAG 2.1 AA) | components, globals.css updates | 150 | All UI done |
| 5.3 | AI service quote-assist endpoint | ai-service/main.py, quote_assist.py | 200 | 3.3 |
| 5.4 | AI service search-relevance endpoint | ai-service/main.py, search_relevance.py | 150 | 2.4 |
| 5.5 | Wishlist pages (multi-list, project-based) | wishlists/page.tsx, WishlistDetail | 300 | 2.7, 2.10 |
| 5.6 | Reviews (text/star display + submit) | reviews components, PDP integration | 250 | 2.9, 2.10 |
| 5.7 | SEO pass (metadata, sitemap, structured data) | layout.tsx, sitemap.ts, robots.ts | 200 | All pages |
| 5.8 | Rate limiting + helmet (security hardening) | main.ts, rate-limit.config | 100 | None |
| 5.9 | Account settings page | account/settings/page.tsx | 150 | 2.10 |
| | **Phase 5 subtotal** | | **1,900** | |

### Cross-cutting — Tests, Infrastructure (est. 1,200 LoC)

| # | Task | Files | Est. LoC | Dependencies |
|---|------|-------|----------|--------------|
| T.1 | PricingService unit tests | pricing.service.spec.ts | 150 | None |
| T.2 | Made-to-Length validation tests | cart.service.spec.ts | 100 | None |
| T.3 | Trade-account approval transaction tests | trade-accounts.service.spec.ts | 100 | None |
| T.4 | Payment webhook idempotency tests | payfast.strategy.spec.ts | 120 | 3.5 |
| T.5 | Checkout integration test (cart→payment→order) | checkout.e2e.spec.ts | 200 | 3.3 |
| T.6 | Freight calculation tests | orders.service.spec.ts | 100 | None |
| T.7 | Auth/JWT tests | auth.service.spec.ts | 100 | 2.1 |
| T.8 | Address/Quote/Wishlist endpoint tests | various spec.ts | 200 | 2.5–2.7 |
| T.9 | Admin endpoint tests | admin spec.ts files | 130 | Phase 4 |
| | **Cross-cutting subtotal** | | **1,200** | |

## Confidence and revision

These estimates carry genuine uncertainty. The LoC-check script's running history
(`docs/loc-history.log`) is the empirical record — each completed task's actual LoC gets
logged there, and significant over-runs (>50% above estimate) should trigger a revision of
this budget document, not a silent acceptance of scope creep. Under-runs are fine and don't
require revision.

Last revised: 2026-08-10
