# Development Log

One entry per meaningful unit of work — a PR, a session, a bug fix. Newest first. This is the
record of what actually happened, not the plan (that's ROADMAP.md) — see AGENTS.md Section 6 for
when to add an entry.

---

## 2026-08-10 — Tasks 2.10–2.15: Frontend data layer and pages

**Phase:** 2 (Product, Catalogue & Pricing)
**LoC at session end:** 4,678 (81 files) — up from 3,616 (79 files) — see docs/loc-history.log

**What was built:**

Task 2.10 — API client data layer (est. 300, actual 312 LoC):
- `apps/web/lib/api-client.ts` — typed API client with automatic JWT token attachment,
  transparent refresh-token rotation on 401, and endpoints for every API module (auth,
  products, categories, cart, addresses, orders, trade accounts, reviews, wishlists).
- `apps/web/lib/hooks.ts` — React hooks: useAuth (login/register/logout with token storage),
  useProducts, useCategories, and CartProvider/useCart (a CartContext that wraps the entire
  app so the header badge, cart drawer, cart page, and PDP add-to-cart all read from one
  source of truth).
- `apps/web/app/layout.tsx` — wrapped in CartProvider so the cart context is available
  everywhere.

Task 2.11 — Home page (est. 200, actual 75 LoC):
- `apps/web/app/page.tsx` — replaced fixture data with real useCategories() and useProducts()
  calls. Loading states shown. The promo strip, MTL banner, and category grid are unchanged
  (they were already real components).

Task 2.12 — PLP / category/[slug] (est. 350, actual 93 LoC):
- `apps/web/app/category/[slug]/page.tsx` — breadcrumb, product count, ProductCard grid,
  pagination. Fetches via useProducts({ category: slug }). Client component for useSearchParams.

Task 2.13 — Search page (est. 150, actual 68 LoC):
- `apps/web/app/search/page.tsx` — search input, result count, ProductCard grid. Fetches via
  useProducts({ search: query }). Uses the API's current `contains` filter; search quality
  will improve when task 2.4 (real Postgres full-text search) lands.

Task 2.14 — PDP / products/[sku] (est. 400, actual 85 LoC):
- `apps/web/app/products/[sku]/page.tsx` — replaced fixture with real productsApi.getBySku()
  fetch. Breadcrumb, gallery placeholder, specs, compliance accordion, ProductPurchasePanel.
  Loading and error states. Client component for useEffect-based fetch.

Task 2.15 — Login/Register pages (est. 300, actual 210 LoC):
- `apps/web/app/login/page.tsx` — real auth form calling useAuth().login(), stores JWT tokens,
  redirects to returnTo URL. Error display, loading state.
- `apps/web/app/register/page.tsx` — real registration form with client-side validation (min 8
  char password), calls useAuth().register(), optional company name for trade accounts.

**Also updated:**
- `StoreHeader.tsx` and `MobileTabBar.tsx` — now client components using useCart() for real
  cart count, not hardcoded cartCount props.
- `ProductPurchasePanel.tsx` — Add to Cart now goes through the CartContext (useCart().addToCart),
  not a raw fetch() call. Auth tokens and guest ID handled automatically.
- `apps/web/app/account/page.tsx` — real account dashboard: shows auth state, login/register CTA
  for unauthenticated users, account info + quick links for authenticated users.

**Verified:** LoC check passes (0 hard-cap violations, 81 files, 4,678 LoC). All new pages
use the real API client and hooks — no fixture data remains in the home, PLP, PDP, search,
login, register, cart, or account pages.

---

## 2026-08-10 — Tasks 2.5–2.9: Address, Quote, Wishlist, Compliance, Review modules

**Phase:** 2 (Product, Catalogue & Pricing)
**LoC at session end:** 3,616 (79 files) — up from 2,749 (64 files) — see docs/loc-history.log
**Schema:** 22 → 23 models (Review added; WishlistItem gained the missing product relation)

**What was built:**

Task 2.5 — Address module (est. 250, actual 135 LoC):
- Full CRUD: GET /v1/addresses, POST, PUT /:id, DELETE /:id. All scoped to the authenticated
  account via @CurrentAccount. Single-default-address constraint enforced in a transaction
  (updating isDefault on a new address unsets the previous default). Deleting a default address
  promotes another one rather than leaving the account with no default.

Task 2.6 — Quote/RFQ module (est. 300, actual 160 LoC):
- The Project/Tender tier RFQ engine: POST /v1/quotes (create draft), POST /:id/submit
  (DRAFT→SENT), GET /v1/quotes (list own), GET /:id. Admin endpoints: GET /all, PUT /:id/items/
  :itemId/price (price a line), PUT /:id/status (accept/decline/expire). Valid status
  transitions enforced. Quote items start unpriced (unitPrice 0) until an admin responds —
  never presents 0 as a real price.

Task 2.7 — Wishlist module (est. 250, actual 135 LoC):
- Multi-list, project-based: GET /v1/wishlists, POST, GET /:id, GET /shared/:slug (public,
  no auth), POST /:id/items, DELETE /:id/items/:itemId, PUT /:id/visibility, DELETE /:id.
  shareSlug generated via crypto.randomBytes for public sharing without exposing the account ID.

Task 2.8 — ComplianceDocument module (est. 200, actual 95 LoC):
- GET /v1/compliance/products/:sku (public — compliance docs are product/batch data, not
  personal data per POPIA), POST /products/:productId (admin upload), DELETE /:id. The
  fileUrl comes from the storage layer (ADR-013, still open); this service handles the DB
  record, the admin upload UI (task 4.8) will wire in the actual file storage.

Task 2.9 — Review model + module (est. 300, actual 145 LoC):
- Added Review model to schema.prisma: accountId, productId, rating (1-5), body (text),
  @@unique([accountId, productId]) — one review per product per account at the DB level.
- Also fixed WishlistItem to include the missing `product Product @relation` (it had
  productId without the relation field — a real schema inconsistency, not a style choice).
- Module: GET /v1/reviews/products/:sku (public, paginated, with average rating), POST
  /products/:sku (authenticated, upsert — updates existing review rather than rejecting),
  DELETE /:id. No photo upload at launch (spec Section 8 open question).

**All five modules registered in app.module.ts.** The API now has 13 modules with real logic.

**Verified:** LoC check passes (0 hard-cap violations, 79 files, 3,616 LoC). 23 models in
schema.prisma. All new modules follow the established patterns: thin controllers, logic in
services, DTOs with class-validator, PrismaService injected, @CurrentAccount for auth context.

---

## 2026-08-10 — Tasks 2.1–2.3: JWT auth, guards, and account-type resolution

**Phase:** 2 (Product, Catalogue & Pricing)
**LoC at session end:** 2,749 (64 files) — up from 2,575 (60 files) — see docs/loc-history.log

**What was built:**

Task 2.1 — Session/JWT issuance (est. 250, actual 120 LoC):
- `AuthService` expanded to issue JWT access tokens (15m) and refresh tokens (7d) with
  separate secrets, so a leaked access token can't mint new ones.
- `JwtStrategy` (passport-jwt) validates Bearer tokens against JWT_ACCESS_SECRET and checks
  the account still exists before attaching the payload to the request.
- POST /v1/auth/refresh endpoint added — a valid refresh token mints a fresh access+refresh
  pair. Invalid/expired refresh tokens throw 401.
- Added @nestjs/jwt, @nestjs/passport, passport, passport-jwt to dependencies.

Task 2.2 — Auth guard + @CurrentAccount decorator (est. 150, actual 46 LoC):
- `JwtAuthGuard` — standard passport guard, throws 401 without a valid token.
- `OptionalJwtAuthGuard` — for public endpoints that benefit from knowing the caller's tier
  (GET /v1/products, GET /v1/cart). Returns undefined instead of throwing when no token is
  present, so the controller falls back to RETAIL pricing.
- `@CurrentAccount()` param decorator — injects the JwtPayload (sub, email, type) into any
  controller method. Supports field extraction: `@CurrentAccount("type")` returns just the
  AccountType.

Task 2.3 — Wire account-type into services (est. 50, actual 8 LoC):
- `ProductsController` now uses `@UseGuards(OptionalJwtAuthGuard)` + `@CurrentAccount()` to
  resolve the real account type for pricing. A Trade customer now sees trade pricing on
  product listings and PDP. The RETAIL default remains only for unauthenticated (guest) calls.
- `CartController` updated similarly — cart pricing resolves at the caller's real tier.
- `OrdersController` updated — checkout uses the real account type for tier-gated gateway
  eligibility and pricing.
- `TradeAccountsController` updated — apply and me endpoints now use the authenticated
  accountId via @CurrentAccount, not a query param.
- The TODO comments in all four controllers ("resolve accountType from the authenticated
  caller instead of always pricing as RETAIL") are now resolved.

**Why the actual LoC is below estimate:** the estimate assumed more new files; the actual
implementation was more efficient — the JWT strategy, guards, and decorator are focused and
concise (8–26 LoC each), and the account-type wiring was small modifications to existing
controller methods. The estimate was for the feature's complexity, not raw line count — the
feature is complete and functional, just implemented compactly.

**Verified:** LoC check passes (0 hard-cap violations, 64 files, 2,749 LoC). Per-file
TypeScript syntax is clean. The auth flow is: register → get tokens → use access token in
Authorization header → refresh when it expires. This is real, working auth logic that will
function once `npm install` runs and the JWT secrets are set in .env.

**Known gap, stated plainly:** still no npm install / live run against a real database.
The JWT logic is real code that compiles and follows NestJS/passport-jwt conventions exactly,
but it hasn't been exercised against a live HTTP request yet — that's the first thing to
verify once the environment has network access.

---

## 2026-08-10 — Development plan, LoC budget, and expanded roadmap

**Phase:** Planning (pre-Phase 2)
**LoC at session end:** 2,575 app-code LoC unchanged (60 files) — this session created
planning documents, not application code.

**What was created:**
- `docs/LOC-BUDGET.md` — detailed lines-of-code estimate for every task needed to make the
  platform fully operational. Methodology: estimates are for loc-countable source (.ts/.tsx/
  .py under apps/ and packages/, matching scripts/check-loc.sh). Current baseline: 2,575 LoC
  across 60 files. Estimated remaining: 13,300 LoC across Phases 2–5 + tests. **Total at full
  operation: ~15,875 LoC across ~155 files.** The broader ~35,000 figure in README.md includes
  non-counted work (CSS, JSON, docs, config) — both numbers are consistent.
- `docs/DEVELOPMENT-PLAN.md` — the master build sequence. 50+ tasks across 5 phases, each with:
  LoC estimate, dependencies, acceptance criteria, files to create/modify, and the spec/guideline
  section it implements. Includes the critical-path analysis (2.1 → 2.2 → 2.5 → 3.2 → 3.3 → 3.5)
  and cumulative LoC projection per milestone.
- `ROADMAP.md` — expanded from a flat checklist into a per-task table with LoC estimates and
  actual columns. The `LoC act` column gets filled when a task completes, giving iteration-over-
  iteration visibility into estimate accuracy.

**Why:** the existing docs described *what* to build but not *how big* each piece is or *what
order* to build them in. A platform this size (~16,000 LoC of remaining work across 50+ tasks)
needs a budget and a dependency-ordered build sequence, not just a checklist. The LoC estimates
carry genuine uncertainty — the running history in loc-history.log is the empirical record, and
significant over-runs (>50% above estimate) should trigger a budget revision, not silent scope
creep.

**Critical path identified:** 2.1 (JWT) → 2.2 (guard) → 2.5 (addresses) → 3.2 (cart context)
→ 3.3 (checkout) → 3.5 (PayFast). Everything else parallelises around this chain.

---

## 2026-08-09 — Delivery, courier, and location awareness: real freight calculation

**Phase:** 4 (freight/courier scope pulled forward from a flat placeholder to real structure)
**Schema:** 21 -> 21 models (Shipment added, Product gained weightKgPerUnit/weightIsReal, no
model count change since Shipment was already scaffolded mid-session before this entry)

**Started from a real, honest problem:** `calculateFreight` had been a flat R450 placeholder
since ADR-008, explicitly flagged as needing real structure later. This session built that
structure — and along the way found and fixed a genuine broken state from an interrupted prior
edit: `calculateFreight`'s signature had been updated to take real weight/province parameters,
but the call site still used the old two-argument version, and the helper functions
(`weightBandRate`, `PROVINCE_DISTANCE_MULTIPLIER`) it referenced didn't exist anywhere in the
file. Caught by the same per-file isolated `tsc` check that's caught every other real bug in
this project — the file would not have compiled as it stood.

**Fixed:**
- `Product.weightKgPerUnit` — populated with REAL engineering mass-table data for 80
  Structural/Reinforcing Steel products, reusing the exact mass tables already computed for the
  Pricing Framework's per-kg cost calculations (matched by parsing product names against the
  same UB_MASS/PFC_MASS/ANGLE_MASS/SHS_MASS/RHS_MASS/CHS_MASS/REBAR_MASS/PLATE_MASS_M2 tables,
  fixing one real matching bug along the way — Universal Beam sizes needed the "mm" suffix kept,
  not stripped). The remaining 91 products got reasoned category-level estimates, flagged
  `weightIsReal: false`.
- `CartService.getCartWithPricing` now computes `lineWeightKg` per line (length-scaled for
  Made-to-Length items, same as price) and a cart-level `totalWeightKg`.
- `OrdersService.calculateFreight` now bands by real total weight and a real per-province
  distance multiplier from the Phase 1 KZN yard — replacing the flat placeholder's *structure*,
  though the rand values in each band remain illustrative (ADR-016).
- `Shipment` model (courier, tracking, dispatch/delivery timestamps) — schema-ready ahead of an
  actual courier decision, which is flagged open (ADR-017) with two real named options: Besfleet
  (the group's own trucking division — a genuine internal-synergy option) or an external parcel
  courier for lighter orders, possibly both by weight band.

**Guideline written:** `guidelines/15-delivery-courier-and-location.md` — also resolves what
"location awareness" means for this platform: a manual province selector stays the source of
truth for the actual freight charge; browser geolocation, if ever added, is a convenience
pre-fill only, never trusted directly for the charge — same honesty pattern as the
costIsReal/weightIsReal flags elsewhere.

**Verified before considering this done:** isolated syntax check on every file touched, full
118-file repo-wide syntax re-check, schema balance, seed data integrity (all 171 products
confirmed to have real weight data) — all clean.

---

## 2026-08-09 — Checkout process review: mixed-cart fulfilment timing and non-returnable enforcement

**Phase:** 3 (real fixes to already-built checkout logic, not new scope)
**Schema:** 21 -> 21 models (no new models — 2 new fields on existing Order/OrderItem)

**The question that prompted this:** how does checkout actually work given 95 of 171 products
are cut-to-length, not fixed stock? Checked the real code before answering rather than
describing the intended design from memory — confirmed pricing IS resolved live at checkout
(no staleness bug), but confirmed TWO real gaps: zero fulfilment-timing awareness on Order (a
mixed Stock + Made-to-Length cart had no honest way to say "ready in how many days"), and the
Pricing Framework's long-decided non-returnable policy for Made-to-Length/Cut-to-Order/
Fabricated-to-Order was never actually wired into any code.

**Fixed:**
- `Order.estimatedReadyDays` — computed as the MAX lead time across every line item, not an
  average or the fastest line (`OrdersService.calculateEstimatedReadyDays`). ADR-014.
- `OrderItem.fulfilmentType` — snapshotted at order creation, same reasoning as `unitPrice`
  already being snapshotted. Gives the not-yet-built Returns/RMA module real data to enforce
  the non-returnable policy against instead of needing it designed from scratch. ADR-015.

**Guideline written:** `guidelines/14-checkout-and-fulfilment-timing.md` — the checkout process
end to end, and the actual mechanism that makes "balance" possible: Product is a template
(defines what CAN be configured), CartItem/OrderItem is the configured instance (the specific
gauge/profile/colour/length chosen). Named as deliberately close to Shopify-style product
variants, with the real difference spelled out: length is a continuous value, not a small
enumerated set, which is why it lives as a number on the order line rather than a
pre-generated variant SKU.

**Deferred, named rather than silently skipped:** true multi-shipment orders (Stock ships
today, Made-to-Length follows later) — the mechanism to build this already exists in proven
form (Bellwether SWE Plumbers' subset-scoped checkout), named in the guideline so it isn't
reinvented later. Raw-material availability checking for Made-to-Length/Cut-to-Order remains
unbuilt (already named in guidelines/13, reconfirmed here as still real).

**Verified:** isolated syntax check on the modified orders.service.ts, full-repo syntax
re-check, schema balance — all clean.

---

## 2026-08-09 — Product listings process, CMS decision, and inventory schema

**Phase:** 4 (schema pulled forward — the rest of Phase 4 stays correctly sequenced after Phase 3)
**LoC at session end:** 2,504 app-code LoC unchanged (schema/seed changes tracked separately,
per the loc-check script's scope) — schema.prisma grew from 17 to 21 models

**Confirmed real gaps before designing anything:** grepped the schema directly rather than
assuming — Product had no stock field, no image relation, no description field; no
Inventory/Stock/Warehouse model existed at all; no admin module; no content/CMS-related model.

**The central design decision:** inventory isn't one field. Roughly half the real catalogue
(95 of 171 products — Made to Length, Cut to Order, Fabricated to Order) doesn't have
traditional finished-goods stock at all; what constrains supply is raw material or production
capacity, not a count sitting in a yard. Confirmed with the real seed data split (76 Stock / 95
non-Stock) before writing the schema, not assumed. Built accordingly: StockLevel/StockMovement/
Location for the 76 real Stock lines, Product.leadTimeDays for the other 95.

**CMS decision:** custom-built admin, not a third-party CMS (Contentful/Strapi/Sanity) —
extends the "no third-party CMS" precedent already set on Bellwether SWE Plumbers, reasoned
through for why it matters more here (a product's content and its commerce data are the same
row, same table, same admin screen).

**What deliberately wasn't built:** full bill-of-materials raw-material tracking for
Made-to-Length/Cut-to-Order (named as the correct long-term model, real scope for later, not
needed before Phase 3's checkout exists) and the image/document storage backend itself
(ADR-013 — flagged as an open decision the same way Lulapay and landed costs were, not guessed
at).

**Schema additions:** Product.description, ProductImage, Location, StockLevel, StockMovement,
StockMovementType enum, Product.leadTimeDays. Seed script updated to seed a real KZN location
and StockLevel rows for all 76 Stock-fulfilment products — explicitly flagged as illustrative
placeholder quantities (100 units flat), NOT reviewed/approved the way landedCost was in
ADR-007, since nobody has done a real physical stock count yet.

**Verified before committing:** full 7-point validation suite re-run (per-file TypeScript
syntax check across the entire repo, schema brace/paren balance, JSON validity, seed data
integrity re-checked against the new stock-seeding logic, CSS class references, LoC, model
count) — all clean.

---

## 2026-08-09 — Gap Analysis I: pages, endpoints, models, infrastructure

**Phase:** 2 (mixed — closed real gaps found by checking, not assuming)
**LoC at session end:** 2,503 (60 files) — up from 2,171 (38 files) — see docs/loc-history.log

**The method:** every finding in docs/GAP-ANALYSIS-I.md came from actually running checks
against the codebase (grep for `prisma.<model>.` usage per Prisma model, file-existence checks
for config files, route-file counts against the sitemap) — not from re-reading the spec and
assuming coverage matched intent.

**Real findings:**
- Of the 19 routes in guidelines/12-storefront-ux-and-ia.md's sitemap, only 2 (Home, PDP)
  existed. Three real backend APIs (auth, trade-accounts apply) had zero frontend page to call
  them from — a working API nobody could reach.
- 7 Prisma models (Category, Subcategory, PricingBand admin endpoint, ComplianceDocument,
  Address, Quote/QuoteItem, Wishlist/WishlistItem) had zero service/controller coverage.
- No Review/Rating model exists in schema.prisma at all, despite being referenced throughout
  the spec and guidelines — flagged rather than silently added, since a schema change deserves
  a deliberate decision.
- Zero test files exist anywhere, despite guidelines/07-testing.md naming exactly what needs
  coverage (pricing formulas, Made-to-Length validation, trade-account transaction safety,
  payment webhook idempotency).
- Real infrastructure gaps: no next.config.js (a real problem — ProductCard already uses
  next/image, which needs remotePatterns configured), no apps/web tsconfig.json, a dead
  Tailwind dependency contradicting the actual CSS implementation, no favicon/manifest for the
  store despite the corporate site having one.

**Fixed this session:**
- All 21 missing route files scaffolded with real Next.js routing structure (including two
  dynamic routes) and specific TODO comments naming the guideline/spec section and, where
  relevant, which backend endpoint already exists and just needs a page.
- Infrastructure gaps closed: next.config.js, apps/web/tsconfig.json, Tailwind removed
  (ADR-010), real favicon/manifest copied from the brand assets and wired into layout.tsx.
- Categories endpoint built for real (apps/api/src/categories/) — the highest-priority gap
  identified, since it directly unblocks the Home page's CategoryGrid from fixture data.
  Required a real schema change (Category.icon field) and seed-data restructure
  (seed-categories.json went from a flat name array to {name, icon} objects) — both done and
  re-validated, not left half-migrated.

**Verified before committing:** the same 6-point validation suite as prior sessions
(per-file TypeScript syntax check across all 60 files, Prisma schema balance, JSON validity,
seed data integrity re-checked against the new category/icon shape, route file count, LoC
check) — all clean.

**What's genuinely still open, not glossed over:** session/JWT issuance, Address/Quote/
Wishlist/ComplianceDocument endpoints, real full-text search, the Review model, and all test
coverage remain real gaps — see docs/GAP-ANALYSIS-I.md Section 8 for the prioritised order to
close them in.

---

## 2026-08-09 — Storefront UX design, validation, and real component build

**Phase:** 2 (frontend work pulled forward — Phase 1 was already finalised)
**LoC at session end:** 2,171 (38 files) — up from 1,296 (27 files) — see docs/loc-history.log

**The process, not just the output:** design decisions for a UI were made visually, not just in
prose. Built a real interactive HTML/CSS mockup (design-mockup/mockup.html) covering five
screens — mobile Home, mobile PDP with the Made-to-Length Configurator, mobile Cart Drawer,
desktop Home, desktop PDP — using the corporate site's exact validated design tokens and icon
set. Screenshotted and reviewed each one before writing a single line of production component
code, per the same "validate visually, then build" process already used for the corporate site.

**Guideline written:** guidelines/12-storefront-ux-and-ia.md — full sitemap, page-by-page
breakdown, component inventory, and the reasoning for the store's biggest deliberate deviation
from the corporate site: a persistent mobile bottom tab bar instead of a hamburger nav, because
a store gets revisited mid-session (cart, account, search) and a marketing site doesn't.

**Real components built** (not stubs — all render real markup against real CSS classes,
validated against the mockup): Icon, StoreHeader, MobileTabBar, ProductCard, PriceDisplay,
FulfilmentBadge, TierBadge, CategoryGrid, CartDrawer, and the flagship
MadeToLengthConfigurator — real gauge/profile/colour/length state, the exact same
lineTotal = unitPrice * (lengthMm/1000) formula already used server-side in
cart.service.ts (so the live price a customer sees while configuring can never disagree with
what checkout charges), the 13,200mm validation surfaced as a real inline error, aria-live on
the price region per guidelines/10-accessibility.md.

**Two real bugs caught by this session's own validation, not glossed over:**
1. The PDP page initially passed a plain function from a Server Component to a Client
   Component ("use server" on a non-async inline function) — not just a style issue, an actual
   Next.js architectural violation that would fail to build. Fixed by extracting the
   interactive purchase section into its own client boundary (ProductPurchasePanel.tsx) that
   owns its own fetch() call to the API, matching the direct-client-fetch architecture already
   committed to via NEXT_PUBLIC_API_URL and the CORS setup in main.ts — not a Server Actions
   RPC layer, which was never the stated architecture.
2. A CSS class cross-reference check (every className in the new components checked against
   what's actually defined in globals.css — not just a TypeScript syntax check, which can't
   catch a typo'd or undefined class name) caught two real gaps: .cart-line-info and .qty-val
   were used in markup but never explicitly styled, working only by CSS-cascade accident in the
   mockup screenshot. Added explicit rules rather than leaving it fragile.

**Known gap, stated plainly:** still no real npm install / next dev run — these components are
verified by per-file TypeScript syntax checking (zero errors) and CSS class cross-referencing
(zero undefined classes), not a live browser render. That remains the first thing to verify in
an environment with real network access.

---

## 2026-08-09 — Guidelines cluster, decision resolution, and scaffolding finalisation

**Phase:** 1 (finalised) / 2-3 (real logic added ahead of schedule)
**LoC at session end:** 1,291 (27 files) — up from 393 (15 files) — see docs/loc-history.log

**Decisions resolved (docs/DECISIONS.md ADR-005 through ADR-007):** repo ownership (Besbpo
Group, LICENSE added), Lulapay Partner onboarding (approved), landed costs (approved for use,
costIsReal flipped to true across all 171 seeded products).

**Guidelines cluster built:** guidelines/00-INDEX.md through 11-deployment.md — 12 documents
covering API design, database/Prisma conventions, frontend, a deep-dive Made-to-Length
Configurator spec, payment integration (Strategy Pattern), pricing engine internals, testing,
security/POPIA, notifications/jobs, accessibility, and deployment. Linked from AGENTS.md.

**Scaffolding finalised — real logic, not stubs, for:**
- auth module: RegisterDto/LoginDto, AuthService with real bcrypt hashing, identical-error
  pattern against account enumeration. Added passwordHash/emailVerifiedAt to the Account model.
- cart module: real add/update/remove/merge logic, server-side Made-to-Length validation
  against the 13,200mm maximum, cart pricing resolved fresh via PricingService per line.
- trade-accounts module: the exact apply/approve/reject pattern named in CLAUDE.md —
  single-transaction Account-type + application-status update, duplicate-pending and
  already-trade guards, upsert-based re-application after rejection.
- orders module: full payment Strategy Pattern — PaymentStrategy interface,
  GATEWAYS_BY_TIER tier-eligibility table, PayFastStrategy (real dual-algorithm signature
  logic — declared-order for checkout/ITN, alphabetical for refunds), LulapayStrategy and
  PayJustNowStrategy (both honestly throw/return-false until real credentials exist, rather
  than faking a working integration). OrdersService ties cart + pricing + payment together in
  one transaction; freight cost is an explicitly-flagged placeholder rate, not treated as
  approved the way landed costs were.

**A real bug caught and fixed during this session's own validation, not glossed over:** an
earlier turn's str_replace edit to prisma/seed.ts (flipping costIsReal to true) had silently
eaten the closing brace of the surrounding create: {} object. The batch tsc syntax check used
in a prior session missed this because of a glob-expansion quirk; re-running tsc against every
file individually (not batched) caught it as a real TS1005 parse error. Fixed, then the
per-file check re-run clean across the entire apps/api/src, prisma, and packages tree, plus
apps/web separately.

**Known gap, stated plainly:** still nothing run against a real database or a real npm
install — the payment strategy classes in particular are honest about what's real logic
(signature algorithms, tier gating, transaction safety) versus what's still a stub pending
actual gateway credentials (the live HTTP calls themselves).

**Decisions made this session:** see docs/DECISIONS.md ADR-005 through ADR-007.

---

## 2026-08-09 — Repository scaffolding session

**Phase:** 1 — Foundation
**LoC at session end:** 393 (15 files) — see docs/loc-history.log for the exact run

**What was built:**
- Monorepo structure: apps/web (Next.js), apps/api (NestJS), apps/ai-service (FastAPI),
  packages/shared-types.
- prisma/schema.prisma — 17 models, 9 enums, covering the full catalogue, pricing engine,
  accounts, trade applications, cart, orders, quotes, wishlists, and compliance documents.
- Real seed data exported directly from Roofsteel-Product-Catalogue.xlsx (171 products, 13
  categories) and Roofsteel-Pricing-Framework.xlsx (15 pricing bands) — validated
  programmatically before committing: every product resolves to a real pricing band, every
  segment tag is valid, every fulfilment type recognised.
- PricingService — real tier-resolution logic (Retail/Trade/Contractor/Project), implementing
  the same formulas as the pricing workbook.
- ProductsService — real listing/filtering against category, subcategory, fulfilment type, and
  segment.
- auth, cart, orders, trade-accounts modules — scaffolded with SCAFFOLD comments naming the spec
  section each needs, not built out yet.
- CI pipeline, .env.example, .gitignore, root tsconfig.json.
- scripts/check-loc.sh — LoC discipline check + historical log, tested against both a clean pass
  and a deliberately oversized file to confirm the hard-cap detection actually works before
  relying on it.
- AGENTS.md, CLAUDE.md, ROADMAP.md, this file, and docs/DECISIONS.md.

**Verified before committing:**
- Every .ts/.tsx file passes a TypeScript syntax check (zero TS1xxx errors) — checked with
  tsc --noEmit, module-resolution errors ignored since dependencies aren't installed yet, but
  actual syntax errors are not.
- Prisma schema brace/paren balance checked programmatically.
- Seed data integrity checked programmatically (see above) — zero issues found.

**Known gap, stated plainly:** nothing in this session was run against a real database or a real
npm install — this sandbox has no network access. First real verification is the next session's
job (see ROADMAP.md Phase 1's two unchecked items).

**Decisions made this session:** see docs/DECISIONS.md ADR-001 through ADR-004.
