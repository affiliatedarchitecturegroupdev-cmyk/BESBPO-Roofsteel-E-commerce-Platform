# Development Plan — Roofsteel E-Commerce Platform

The master development plan. Expands `ROADMAP.md` into a task-by-task build sequence with LoC
estimates (from `docs/LOC-BUDGET.md`), dependencies, acceptance criteria, and the spec/guideline
each task implements. This is the document to work from — `ROADMAP.md` stays the live checklist,
this file is the detail behind it.

## How to use this document

1. Work tasks in order within each phase — the dependency column exists for a reason. A task
   with a dependency on "2.1" cannot start until task 2.1 is done.
2. Each task has a **LoC estimate** (from `docs/LOC-BUDGET.md`) and a **LoC actual** column
   that gets filled when the task completes. The actual comes from `npm run loc:check` before
   and after, recorded in `docs/loc-history.log`.
3. Acceptance criteria are concrete — a task isn't done because the code was written, it's
   done because the criteria are met.
4. Update `ROADMAP.md` (check the box) and `docs/DEVELOPMENT-LOG.md` (add entry) when a task
   completes, per `AGENTS.md` Section 3.

## Legend

- **Status:** `[x]` done, `[~]` in progress, `[ ]` not started
- **LoC est:** estimated lines of loc-countable code from `docs/LOC-BUDGET.md`
- **LoC act:** actual lines added (filled on completion)

---

## Phase 1 — Foundation (COMPLETE — 2,575 LoC, 60 files)

All Phase 1 tasks are done. See `docs/loc-history.log` for the progression from 393 LoC
(15 files) through 2,575 LoC (60 files). Nothing in this phase remains open except:
- `[ ]` npm install verified with real network access
- `[ ]` Real Postgres + Redis provisioned, first successful migrate + seed

These two are infrastructure prerequisites, not code tasks — they happen once when the
environment has network access, and they unblock everything below.

---

## Phase 2 — Product, Catalogue & Pricing (est. 3,350 LoC)

### Task 2.1 — Session/JWT issuance
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 4.3 (auth), guidelines/08-security-and-compliance.md
- **Dependencies:** None — this is the single highest-priority open item
- **What:** Expand the auth module to issue signed JWT tokens on successful login/registration.
  Add a `JwtStrategy` (passport-jwt), token expiry, refresh-token mechanism, and an auth
  controller exposing POST /v1/auth/login, POST /v1/auth/register, POST /v1/auth/refresh.
- **Acceptance:** A registered user can log in and receive a JWT; subsequent authenticated
  requests carry the token; tokens expire and can be refreshed.
- **Files:** auth.service.ts (expand), auth.controller.ts (new), jwt.strategy.ts (new),
  auth.dto.ts (expand), auth.module.ts (expand)

### Task 2.2 — Auth guard + current-account decorator
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/08, guidelines/01-api-design.md
- **Dependencies:** 2.1
- **What:** A NestJS guard that validates the JWT on protected routes, and a
  `@CurrentAccount()` param decorator that injects the authenticated Account (including type)
  into any controller method. This is the mechanism every tier-aware endpoint needs.
- **Acceptance:** Protected routes return 401 without a valid token; `@CurrentAccount()` gives
  controllers access to the real account type for pricing resolution.
- **Files:** auth.guard.ts (new), current-account.decorator.ts (new), auth.module.ts (expand)

### Task 2.3 — Wire account-type resolution into services
- **Status:** [ ]
- **LoC est:** 50 | **LoC act:** —
- **Spec:** guidelines/01-api-design.md ("Auth context in services")
- **Dependencies:** 2.2
- **What:** Replace the `AccountType.RETAIL` default in ProductsService, PricingService, and
  CartService with the real account type from the authenticated session. This is a small but
  critical change — without it, every Trade/Contractor/Project customer is silently mis-priced.
- **Acceptance:** A logged-in Trade customer sees trade pricing on product listings and PDP;
  a Retail customer sees retail pricing. No RETAIL default remains in any pricing-sensitive path.
- **Files:** products.module.ts, pricing.service.ts, cart.service.ts, orders.service.ts

### Task 2.4 — Real Postgres full-text search
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** Section 3.5, ADR-002, guidelines/02-database.md
- **Dependencies:** 2.3
- **What:** Replace the `contains` placeholder in ProductsService.list() with real Postgres
  tsvector/pg_trgm full-text search. Add a migration creating a tsvector column + GIN index,
  and use `Prisma.sql` tagged templates for the raw query (never string interpolation).
- **Acceptance:** Searching "IBR" returns IBR roofing sheets; typo-tolerant search works
  (pg_trgm); the search is parameterised and injection-safe.
- **Files:** products.service.ts, migration (new), prisma/schema.prisma (tsvector column)

### Task 2.5 — Address module
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 3.6 (checkout delivery address), guidelines/01-api-design.md
- **Dependencies:** 2.2
- **What:** CRUD endpoints for Address: GET /v1/addresses, POST /v1/addresses, PUT
  /v1/addresses/:id, DELETE /v1/addresses/:id. One address can be default. Province is an enum.
- **Acceptance:** An authenticated user can create, list, update, and delete addresses; one
  default-address constraint is enforced.
- **Files:** addresses.module.ts, addresses.service.ts, addresses.controller.ts,
  dto/addresses.dto.ts

### Task 2.6 — Quote/RFQ module
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** Section 4.3, guidelines/01-api-design.md
- **Dependencies:** 2.2
- **What:** The Project/Tender tier RFQ engine: POST /v1/quotes (create draft), POST
  /v1/quotes/:id/submit (send), GET /v1/quotes (list), GET /v1/quotes/:id. QuoteItem holds
  description/quantity/unitPrice. Admin can respond with a priced quote.
- **Acceptance:** A Project-tier customer can submit an RFQ with line items; admin can view and
  respond; the quote lifecycle (DRAFT→SENT→ACCEPTED/EXPIRED/DECLINED) transitions correctly.
- **Files:** quotes.module.ts, quotes.service.ts, quotes.controller.ts, dto/quotes.dto.ts

### Task 2.7 — Wishlist module
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 3.7, guidelines/01-api-design.md
- **Dependencies:** 2.2
- **What:** Multi-list, project-based wishlists: GET /v1/wishlists, POST /v1/wishlists, POST
  /v1/wishlists/:id/items, DELETE /v1/wishlists/:id/items/:itemId. A wishlist has a name
  ("Warehouse Roof Project"), an isPublic flag, and a shareSlug for sharing.
- **Acceptance:** A user can create multiple named wishlists, add/remove products, and generate
  a shareable link for a public wishlist.
- **Files:** wishlists.module.ts, wishlists.service.ts, wishlists.controller.ts,
  dto/wishlists.dto.ts

### Task 2.8 — ComplianceDocument module
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** Section 4.5, guidelines/01-api-design.md
- **Dependencies:** 2.2, ADR-013 (storage decision needed for file upload)
- **What:** GET /v1/products/:sku/compliance-docs (list), POST /v1/admin/products/:id/
  compliance-docs (admin upload). ComplianceDocType enum (MILL_TEST_CERTIFICATE, NRCS_LETTER_OF
  _AUTHORITY, SABS_MARK_CERTIFICATE). File storage via the ADR-013-decided mechanism.
- **Acceptance:** Compliance documents can be uploaded (admin) and listed (public); the PDP
  compliance tab has real data to display.
- **Files:** compliance.module.ts, compliance.service.ts, compliance.controller.ts,
  dto/compliance.dto.ts

### Task 2.9 — Review model + module
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** Section 8 (open question on photo upload — text/star at launch)
- **Dependencies:** 2.2
- **What:** Add a Review model to schema.prisma (accountId, productId, rating 1-5, body text,
  createdAt). Migration. Module with POST /v1/products/:sku/reviews (authenticated, one review
  per product per account), GET /v1/products/:sku/reviews (public, paginated). No photo upload
  at launch (open decision — check with Fortune).
- **Acceptance:** A logged-in customer can leave one text+star review per product; reviews are
  listed on the PDP; duplicate-review-per-product is prevented.
- **Files:** prisma/schema.prisma, migration, reviews.module.ts, reviews.service.ts,
  reviews.controller.ts, dto/reviews.dto.ts

### Task 2.10 — API client data layer (frontend)
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** ADR-009 (direct client-side fetch), guidelines/03-frontend.md
- **Dependencies:** 2.1
- **What:** A typed API client (`lib/api-client.ts`) wrapping fetch calls to the NestJS API with
  auth-token injection, and React hooks (`lib/hooks.ts`) for common data needs (useCart,
  useAccount, useProducts). This is the frontend data foundation every built-out page uses.
- **Acceptance:** Client-side components can fetch API data through a single typed client with
  automatic auth-token attachment; no raw fetch() calls scattered across components.
- **Files:** apps/web/lib/api-client.ts, apps/web/lib/hooks.ts

### Task 2.11 — Home page (real data)
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/12-storefront-ux-and-ia.md (Home breakdown)
- **Dependencies:** 2.10, 2.4
- **What:** Replace fixture data in app/page.tsx with real fetches: categories from
  GET /v1/categories, Trending Now from a real 7-day order-velocity query, New Arrivals from
  createdAt window. Keep the compact promo strip and Made-to-Length banner.
- **Acceptance:** The home page shows real categories with real line counts, real trending
  products, and real new arrivals — no fixture data remains.
- **Files:** apps/web/app/page.tsx

### Task 2.12 — Category/[slug] PLP (built out)
- **Status:** [ ]
- **LoC est:** 350 | **LoC act:** —
- **Spec:** guidelines/12 (PLP section), guidelines/03-frontend.md
- **Dependencies:** 2.10
- **What:** Full category listing page: breadcrumb, filter sidebar/drawer (subcategory,
  fulfilment type, segment), sort dropdown (relevance, price, name), ProductCard grid
  (2-col mobile, 4-col desktop), pagination. Fetch from GET /v1/products?category=:slug.
- **Acceptance:** Browsing a category shows real products with working filters, sort, and
  pagination; filters compose correctly; the grid is responsive.
- **Files:** apps/web/app/category/[slug]/page.tsx, apps/web/components/FilterDrawer.tsx,
  apps/web/components/Breadcrumb.tsx

### Task 2.13 — Search page (built out)
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/12 (search section)
- **Dependencies:** 2.4, 2.10
- **What:** Reuse the PLP's grid/filter UI for search results. Fetch from GET /v1/products?
  search=:q. Same component tree as the category page — don't duplicate, reuse.
- **Acceptance:** Searching returns real full-text search results with the same filter/sort/
  grid UI as the category page.
- **Files:** apps/web/app/search/page.tsx

### Task 2.14 — PDP (built out)
- **Status:** [ ]
- **LoC est:** 400 | **LoC act:** —
- **Spec:** guidelines/12 (PDP section), guidelines/04, guidelines/10
- **Dependencies:** 2.10, 2.8
- **What:** Replace fixture data with a real GET /v1/products/:sku fetch. Build the gallery
  (main image + thumbnails, graceful missing-photo), accordion specs, compliance tab (real
  compliance docs), and Frequently Bought Together. The Made-to-Length Configurator and
  ProductPurchasePanel are already real — wire them to real product data.
- **Acceptance:** A real product loads with its real specs, pricing, compliance docs, and
  configurator options; the gallery handles missing photos; FBT shows real complementary products.
- **Files:** apps/web/app/products/[sku]/page.tsx, apps/web/components/product/Gallery.tsx,
  apps/web/components/product/AccordionSpecs.tsx, apps/web/components/product/ComplianceTab.tsx

### Task 2.15 — Login/Register pages (built out)
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** guidelines/12, guidelines/08, guidelines/10
- **Dependencies:** 2.1, 2.10
- **What:** Real login and register forms with client-side validation, server-side error
  display, JWT storage, and post-login redirect. Shared AuthForm component. Accessible (labels,
  aria-describedby, focus management).
- **Acceptance:** A user can register and log in; errors display inline; the session persists
  across page navigations; the account-type badge reflects the real tier.
- **Files:** apps/web/app/login/page.tsx, apps/web/app/register/page.tsx,
  apps/web/components/auth/AuthForm.tsx

### Task 2.16 — Cut/bend service selector (SANS 282)
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** Section 4.4, guidelines/04
- **Dependencies:** 2.6
- **What:** A selector for FABRICATED_TO_ORDER reinforcing steel lines: SANS 282 shape codes
  (standard bend shapes). Renders on the PDP when fulfilmentType === FABRICATED_TO_ORDER.
  Non-standard shapes route to the Quote/RFQ flow instead of the cart.
- **Acceptance:** A fabricated-to-order rebar line shows the shape-code selector; selecting a
  standard code adds to cart; a non-standard shape routes to quote/request.
- **Files:** apps/web/components/configurator/CutBendSelector.tsx, dto

---

## Phase 3 — Transactional Layer (est. 3,550 LoC)

### Task 3.1 — Cart page (full, real state)
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** guidelines/12 (Cart section)
- **Dependencies:** 2.10
- **What:** Full /cart page: real cart fetch (GET /v1/cart), line items with MtL config inline,
  quantity steppers, remove buttons, free-delivery progress bar, subtotal. Same content as the
  drawer, full-page. CartLineItem component reused by both.
- **Acceptance:** The cart page shows real cart contents with working quantity/remove controls;
  the drawer and page show the same data.
- **Files:** apps/web/app/cart/page.tsx, apps/web/components/cart/CartLineItem.tsx

### Task 3.2 — CartDrawer wiring (real state)
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/12, ADR-009
- **Dependencies:** 2.10
- **What:** A CartContext provider that holds cart state (items, subtotal, count) and syncs
  with the API. Wire CartDrawer and the header cart badge to this context. Guest-to-account
  merge on login.
- **Acceptance:** Adding an item to cart updates the drawer and badge in real time; the cart
  persists across pages; login merges the guest cart.
- **Files:** apps/web/components/cart/CartContext.tsx, apps/web/components/cart/CartDrawer.tsx
  (update), apps/web/app/layout.tsx (update)

### Task 3.3 — Checkout page (one-page, collapsible steps)
- **Status:** [ ]
- **LoC est:** 600 | **LoC act:** —
- **Spec:** Section 3.6, guidelines/12 (Checkout section), guidelines/14, guidelines/15
- **Dependencies:** 2.5, 3.2
- **What:** One-page checkout with collapsible steps: Delivery Address (saved addresses or new),
  Delivery/Freight (province selector, freight cost display, geolocation pre-fill), Payment
  (tier-filtered gateway list from GATEWAYS_BY_TIER), Review (order summary with
  estimatedReadyDays). POST /v1/orders on submit.
- **Acceptance:** A customer can complete checkout end-to-end; the gateway list reflects their
  tier; freight is calculated for their province; estimatedReadyDays is shown; the order is
  created and the payment session is initialized.
- **Files:** apps/web/app/checkout/page.tsx, apps/web/components/checkout/CheckoutSteps.tsx,
  apps/web/components/checkout/DeliveryStep.tsx,
  apps/web/components/checkout/PaymentStep.tsx,
  apps/web/components/checkout/ReviewStep.tsx,
  apps/web/components/checkout/LocationDetector.tsx

### Task 3.4 — Checkout success/cancelled pages
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/12
- **Dependencies:** 3.3
- **What:** Success page: fetch GET /v1/orders/:orderNumber, display order summary with line
  items and estimatedReadyDays. Cancelled page: clear retry path back to /checkout.
- **Acceptance:** After a successful payment redirect, the success page shows the real order;
  after a cancelled payment, the cancelled page offers a retry link.
- **Files:** apps/web/app/checkout/success/page.tsx,
  apps/web/app/checkout/cancelled/page.tsx

### Task 3.5 — PayFast real HTTP integration + ITN webhook
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** Section 5, guidelines/05-payments.md
- **Dependencies:** 3.3
- **What:** Replace the TODO in PayFastStrategy.initialize() with a real HTTP call to PayFast's
  process endpoint (sandbox/production from env). Add an ITN webhook controller (POST
  /v1/payments/payfast/itn) that verifies the signature, checks order status before
  transitioning (idempotency), and transitions PENDING_PAYMENT → PROCESSING.
- **Acceptance:** A real PayFast sandbox payment initializes; the ITN webhook verifies and
  processes correctly; a retried ITN does not double-fulfil.
- **Files:** apps/api/src/orders/payments/payfast.strategy.ts (expand),
  apps/api/src/orders/payments/payfast.webhook.controller.ts (new)

### Task 3.6 — Lulapay real Partner API integration
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 5, ADR-006, guidelines/05
- **Dependencies:** 3.3, real LULAPAY_API_KEY
- **What:** Build LulapayStrategy against the real Partner API contract (confirm the contract
  with Lulapay directly, not from marketing material). Webhook/callback handler for
  asynchronous confirmation.
- **Acceptance:** A Trade/Contractor/Project customer can pay via Lulapay; the webhook confirms
  and transitions order status.
- **Files:** apps/api/src/orders/payments/lulapay.strategy.ts (expand),
  apps/api/src/orders/payments/lulapay.webhook.controller.ts (new)

### Task 3.7 — PayJustNow real integration
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** Section 5, guidelines/05
- **Dependencies:** 3.3, real PAYJUSTNOW_MERCHANT_ID
- **What:** Real PayJustNow widget integration (PDP/cart "as low as RX/month" indicator) and
  API-based checkout flow for the instalment agreement. Retail tier only.
- **Acceptance:** A Retail customer sees the PayJustNow option at checkout; the instalment
  agreement is created and confirmed.
- **Files:** apps/api/src/orders/payments/payjustnow.strategy.ts (expand),
  apps/web/components/product/PayJustNowWidget.tsx (new)

### Task 3.8 — Payment webhook idempotency + order transitions
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/05, guidelines/09
- **Dependencies:** 3.5, 3.6, 3.7
- **What:** Centralise order-status transition logic in OrdersService (or a PaymentProcessor
  service). Every webhook path routes through one transition function that checks current
  status before applying. Prevents double-fulfilment across all three gateways.
- **Acceptance:** A retried webhook from any gateway does not double-process; status
  transitions follow the OrderStatus enum correctly.
- **Files:** apps/api/src/orders/orders.service.ts (expand),
  apps/api/src/orders/payments/payment.processor.ts (new)

### Task 3.9 — Orders list-by-account endpoint
- **Status:** [ ]
- **LoC est:** 100 | **LoC act:** —
- **Spec:** guidelines/01-api-design.md
- **Dependencies:** 2.2
- **What:** GET /v1/orders (authenticated, returns the caller's orders, paginated). Currently
  only getByOrderNumber exists. Add the list endpoint.
- **Acceptance:** An authenticated user can list their own orders with pagination.
- **Files:** orders.controller.ts (new — currently in orders.module inline), orders.service.ts

### Task 3.10 — Account dashboard page
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/12 (Account section)
- **Dependencies:** 3.9, 2.10
- **What:** Account dashboard: recent orders, trade account status badge, quick links to
  sub-pages. Sidebar nav desktop, horizontal scroll tabs mobile.
- **Acceptance:** An authenticated user sees their account dashboard with real recent orders
  and trade account status.
- **Files:** apps/web/app/account/page.tsx

### Task 3.11 — Account/orders (list + detail + tracking)
- **Status:** [ ]
- **LoC est:** 400 | **LoC act:** —
- **Spec:** guidelines/12, guidelines/09 (order status milestones)
- **Dependencies:** 3.9, 2.10
- **What:** Order history list (paginated) and order detail page. Detail shows line items with
  MtL config, order status timeline (Processing → Packed → Dispatched → Delivered), tracking
  info if Shipment exists.
- **Acceptance:** A user can browse their order history and view any order's detail with
  line items and status timeline.
- **Files:** apps/web/app/account/orders/page.tsx,
  apps/web/app/account/orders/[orderNumber]/page.tsx,
  apps/web/components/account/OrderTimeline.tsx

### Task 3.12 — Account/addresses page
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** guidelines/12
- **Dependencies:** 2.5, 2.10
- **What:** Saved addresses list with add/edit/delete and set-default. AddressForm component.
- **Acceptance:** A user can manage their saved addresses; the default address is used at
  checkout pre-fill.
- **Files:** apps/web/app/account/addresses/page.tsx,
  apps/web/components/account/AddressForm.tsx

### Task 3.13 — Account/trade-account page (4 states)
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/12, spec Section 4.3
- **Dependencies:** 2.10
- **What:** Shows one of four states: not yet applied (CTA to /trade/apply), pending (waiting),
  approved (trade pricing active), rejected (reason + re-apply CTA). Fetches GET
  /v1/trade-accounts/me (already real).
- **Acceptance:** The page correctly shows each of the four states based on the real
  TradeAccountApplication data.
- **Files:** apps/web/app/account/trade-account/page.tsx

### Task 3.14 — Trade/apply page (built out)
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/12, spec Section 4.3
- **Dependencies:** 2.10
- **What:** Trade application form: companyName, registrationNo. POST /v1/trade-accounts/apply
  (already real). Success state, validation, error display.
- **Acceptance:** A user can submit a trade application; duplicate-pending is caught; success
  state redirects to account/trade-account.
- **Files:** apps/web/app/trade/apply/page.tsx,
  apps/web/components/trade/TradeApplicationForm.tsx

### Task 3.15 — Quote/request page
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 4.3, guidelines/12
- **Dependencies:** 2.6, 2.10
- **What:** RFQ entry form for Project/Tender tier: line items (description, quantity),
  project details. POST /v1/quotes. Also the entry point for non-standard cut/bend shapes
  routed from the PDP.
- **Acceptance:** A Project-tier customer can submit an RFQ with multiple line items.
- **Files:** apps/web/app/quote/request/page.tsx,
  apps/web/components/quote/QuoteRequestForm.tsx

---

## Phase 4 — Operational Layer (est. 3,800 LoC)

### Task 4.1 — Admin auth guard + role middleware
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/01 (admin routes), guidelines/08
- **Dependencies:** 2.2
- **What:** An AdminGuard that checks the account has an admin role (needs an `isAdmin` or
  `role` field on Account — schema change). All /v1/admin/* routes use this guard. Never reuse
  a customer-facing route with a hidden admin branch.
- **Acceptance:** Non-admin users get 403 on /v1/admin/* routes; admin users can access them.
- **Files:** admin.guard.ts (new), roles.decorator.ts (new), prisma/schema.prisma (role field),
  migration

### Task 4.2 — Admin panel shell + layout
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/13 (admin surface)
- **Dependencies:** 4.1
- **What:** Admin panel layout with sidebar nav (Products, Orders, Trade Accounts, Pricing
  Bands, Stock, Compliance, Reports). Admin home dashboard with counts.
- **Acceptance:** An admin can navigate the admin panel; each section is reachable.
- **Files:** apps/web/app/admin/layout.tsx, apps/web/app/admin/page.tsx,
  apps/web/components/admin/AdminNav.tsx

### Task 4.3 — Admin — products management
- **Status:** [ ]
- **LoC est:** 500 | **LoC act:** —
- **Spec:** guidelines/13
- **Dependencies:** 4.2, ADR-013 (image storage)
- **What:** Product CRUD: list with search/filter, edit (name, specs, description, unit,
  fulfilment type, category, pricing band, landed cost, active, lead time, weight). Image
  management (upload, reorder, alt text). Cannot bypass pricing-band validation.
- **Acceptance:** An admin can create, edit, and deactivate products; images can be uploaded
  and reordered; a product without a valid pricing band is rejected.
- **Files:** apps/api/src/products/admin-products.controller.ts,
  apps/api/src/products/admin-products.service.ts,
  apps/web/app/admin/products/page.tsx,
  apps/web/components/admin/ProductEditor.tsx

### Task 4.4 — Admin — orders management + status transitions
- **Status:** [ ]
- **LoC est:** 400 | **LoC act:** —
- **Spec:** guidelines/13 Section 6, guidelines/09
- **Dependencies:** 4.2
- **What:** Admin order list (all orders, filterable by status), order detail with status
  transition controls (PROCESSING → PACKED → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED).
  Each transition fires the relevant notification job (Phase 4.10).
- **Acceptance:** An admin can view all orders and transition their status; each transition
  enqueues a notification job.
- **Files:** apps/api/src/orders/admin-orders.controller.ts,
  apps/web/app/admin/orders/page.tsx,
  apps/web/components/admin/OrderManager.tsx

### Task 4.5 — Admin — trade accounts review
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 4.3
- **Dependencies:** 4.2
- **What:** Admin view of pending trade applications (listPending already exists), with
  approve/reject controls. Reject requires a reason. Approve triggers the single-transaction
  Account-type update.
- **Acceptance:** An admin can review, approve, and reject trade applications; approval grants
  trade pricing; rejection includes a reason the customer sees.
- **Files:** apps/web/app/admin/trade-accounts/page.tsx,
  apps/web/components/admin/TradeAccountReviewer.tsx

### Task 4.6 — Admin — pricing bands editor
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** guidelines/06 (yellow-cell convention)
- **Dependencies:** 4.2
- **What:** Editable pricing bands: retailMarkup, tradeDiscount, volumeDiscount per band.
  Mirrors the workbook's "edit the yellow cells, everything recalculates" — edits take effect
  immediately everywhere. No caching layer that serves stale prices.
- **Acceptance:** An admin edits a band's markup; all products using that key reflect the new
  price immediately.
- **Files:** apps/api/src/pricing/admin-pricing.controller.ts,
  apps/web/app/admin/pricing-bands/page.tsx,
  apps/web/components/admin/BandEditor.tsx

### Task 4.7 — Admin — stock levels/movements
- **Status:** [ ]
- **LoC est:** 350 | **LoC act:** —
- **Spec:** guidelines/13 Section 3.1
- **Dependencies:** 4.2
- **What:** Stock management for STOCK-fulfilment products: view qtyOnHand/qtyReserved/available
  per product per location, adjust quantities (creates a StockMovement audit row), transfer
  between locations. Low-stock view (days-of-stock-remaining from velocity).
- **Acceptance:** An admin can view and adjust stock; every change creates an audit trail
  row; low-stock products are visible.
- **Files:** apps/api/src/inventory/inventory.module.ts,
  apps/api/src/inventory/inventory.service.ts,
  apps/api/src/inventory/admin-inventory.controller.ts,
  apps/web/app/admin/stock/page.tsx,
  apps/web/components/admin/StockManager.tsx

### Task 4.8 — Admin — compliance document upload
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** Section 4.5, guidelines/13
- **Dependencies:** 4.2, ADR-013 (storage decision)
- **What:** Admin upload of mill certs, NRCS LoAs, SABS certificates. Attach to a product
  with a batch reference. File storage via the ADR-013-decided mechanism.
- **Acceptance:** An admin can upload a compliance document against a product; it appears in
  the PDP compliance tab.
- **Files:** apps/api/src/compliance/admin-compliance.controller.ts (expand 2.8),
  apps/web/app/admin/compliance/page.tsx

### Task 4.9 — BullMQ worker skeleton + queue setup
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/09
- **Dependencies:** None (Redis needed at runtime)
- **What:** BullMQ queue setup (connection from REDIS_URL), a worker process, and a base job
  interface. Separate job types per notification (not one generic "notification" job with a
  type field — guidelines/09).
- **Acceptance:** A job can be enqueued and processed; the worker connects to Redis; failed
  jobs retry.
- **Files:** apps/api/src/jobs/queue.ts, apps/api/src/jobs/worker.ts,
  apps/api/src/jobs/interfaces.ts

### Task 4.10 — Order lifecycle notification jobs
- **Status:** [ ]
- **LoC est:** 400 | **LoC act:** —
- **Spec:** guidelines/09, spec Section 3.6/11.1
- **Dependencies:** 4.9
- **What:** Email/SMS notifications for order status transitions: Processing, Packed,
  Dispatched, Out for Delivery, Delivered. Plus the Made-to-Length-specific "Roll-forming in
  progress" status. Templates decoupled from send channel. Idempotency checks.
- **Acceptance:** Each order status transition sends the correct notification; a retried job
  doesn't double-send; templates render correctly.
- **Files:** apps/api/src/jobs/order-notifications.processor.ts,
  apps/api/src/jobs/templates/order-templates.ts,
  apps/api/src/jobs/email.sender.ts,
  apps/api/src/jobs/sms.sender.ts

### Task 4.11 — Trade application notification jobs
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/09
- **Dependencies:** 4.9
- **What:** Notification on trade application approved/rejected. Wire into the approve/reject
  methods (where TODO comments already exist in trade-accounts.service.ts).
- **Acceptance:** An approved/rejected trade application triggers the correct notification.
- **Files:** apps/api/src/jobs/trade-notifications.processor.ts,
  apps/api/src/jobs/templates/trade-templates.ts

### Task 4.12 — Back-in-stock / low-stock alert jobs
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/09, guidelines/13
- **Dependencies:** 4.9, 4.7
- **What:** Back-in-stock notifications (when a StockMovement crosses from 0 to >0 on a
  product with waitlist subscribers) and low-stock admin alerts (days-of-stock-remaining
  from velocity). Wire into every place qtyOnHand can change, not just the restock method.
- **Acceptance:** A restocked product triggers a back-in-stock notification; a low-stock
  product triggers an admin alert; both are wired to every stock-change path.
- **Files:** apps/api/src/jobs/stock-alerts.processor.ts,
  apps/api/src/jobs/templates/stock-templates.ts

### Task 4.13 — Stock reservation logic
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/13 Section 3.1
- **Dependencies:** 4.7
- **What:** On real order placement (not cart add), increment qtyReserved on the relevant
  StockLevel rows. On order cancellation, decrement. A cart reservation is deliberately NOT
  built (abandoned carts would lock up stock).
- **Acceptance:** A placed order reserves stock; a cancelled order releases it; cart adds do
  not reserve.
- **Files:** apps/api/src/orders/orders.service.ts (expand),
  apps/api/src/inventory/inventory.service.ts (expand)

### Task 4.14 — Sales/revenue reporting dashboard
- **Status:** [ ]
- **LoC est:** 350 | **LoC act:** —
- **Spec:** guidelines/13 Section 6
- **Dependencies:** 4.2
- **What:** Admin revenue reporting: by period, by category, by customer tier. The tier
  breakdown matters — it measures whether the "thin on commodity, healthy on service" pricing
  strategy is working. Charts/tables.
- **Acceptance:** An admin can view revenue broken down by period, category, and tier.
- **Files:** apps/api/src/reporting/reporting.module.ts,
  apps/api/src/reporting/reporting.service.ts,
  apps/web/app/admin/reports/page.tsx,
  apps/web/components/admin/RevenueReport.tsx

### Task 4.15 — Location detection UI
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/15 Section 1
- **Dependencies:** 3.3
- **What:** Browser geolocation → reverse-geocode to province → pre-select in the checkout
  province dropdown → customer confirms or overrides. Geolocation is convenience pre-fill
  ONLY, never the direct freight charge source.
- **Acceptance:** A customer's province is pre-filled from geolocation; they can override it;
  the freight charge uses the confirmed province, not the geolocation result.
- **Files:** apps/web/components/checkout/LocationDetector.tsx (may be part of 3.3)

### Task 4.16 — Courier/tracking integration
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** guidelines/15 Section 3, ADR-017
- **Dependencies:** ADR-017 decision (courier selection)
- **What:** Once a courier is chosen (ADR-017): Shipment creation, tracking-number assignment,
  webhook integration for dispatch/delivery events. Updates Order status and Shipment timestamps.
- **Acceptance:** An order's shipment is created with a real tracking number; webhook events
  update the shipment and order status.
- **Files:** apps/api/src/shipments/shipments.module.ts,
  apps/api/src/shipments/shipments.service.ts,
  apps/api/src/shipments/tracking.controller.ts

---

## Phase 5 — Launch Polish (est. 1,900 LoC)

### Task 5.1 — Legal/info pages
- **Status:** [ ]
- **LoC est:** 400 | **LoC act:** —
- **Spec:** guidelines/12 (sitemap)
- **Dependencies:** None
- **What:** Terms of Purchase, Privacy (POPIA), Returns policy (including the non-returnable
  policy for Made-to-Length/Cut-to-Order/Fabricated-to-Order), Shipping (province bands,
  free-delivery threshold), FAQ. Transactional content, NOT a duplicate of the corporate
  site's brand pages — link to those, don't copy.
- **Acceptance:** All 5 legal pages have real content; the returns page correctly states the
  non-returnable policy per fulfilment type.
- **Files:** 5 page.tsx files (terms, privacy, returns, shipping, faq)

### Task 5.2 — Accessibility pass (WCAG 2.1 AA)
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/10-accessibility.md
- **Dependencies:** All UI tasks
- **What:** Keyboard-only pass on every flow; screen-reader spot-check on checkout; verify
  skip link, focus states, aria-live on configurator price, 48x48px touch targets, 4.5:1
  contrast on all text. Fix any regressions.
- **Acceptance:** Every interactive flow is navigable by keyboard; the checkout flow passes a
  screen-reader spot-check; no contrast or touch-target violations.
- **Files:** Various component and CSS fixes

### Task 5.3 — AI service quote-assist endpoint
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** Section 2.2, spec Section 6.3
- **Dependencies:** 3.3
- **What:** /quote-assist endpoint: takes a Made-to-Length configuration (gauge, profile,
  length) and returns a plain-language cut-list summary for the order confirmation email/PDF.
  Not a vector/embedding model — simple text generation at this catalogue size.
- **Acceptance:** A MtL configuration produces a readable, accurate cut-list summary.
- **Files:** apps/ai-service/main.py (expand), apps/ai-service/quote_assist.py

### Task 5.4 — AI service search-relevance endpoint
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** Section 2.2
- **Dependencies:** 2.4
- **What:** /search-relevance endpoint: re-ranks Postgres full-text search results using
  simple term-frequency scoring. Not a vector model (171 lines is too small for embeddings).
- **Acceptance:** Search results are re-ranked by relevance; the endpoint is fast.
- **Files:** apps/ai-service/main.py (expand), apps/ai-service/search_relevance.py

### Task 5.5 — Wishlist pages (multi-list, project-based)
- **Status:** [ ]
- **LoC est:** 300 | **LoC act:** —
- **Spec:** Section 3.7
- **Dependencies:** 2.7, 2.10
- **What:** Wishlist list page (all lists), wishlist detail (items in a list), create/delete
  list, add/remove items, share public wishlist via shareSlug.
- **Acceptance:** A user can manage multiple named wishlists and share a public one.
- **Files:** apps/web/app/account/wishlists/page.tsx,
  apps/web/components/wishlist/WishlistDetail.tsx

### Task 5.6 — Reviews (text/star display + submit)
- **Status:** [ ]
- **LoC est:** 250 | **LoC act:** —
- **Spec:** Section 8 (text/star at launch)
- **Dependencies:** 2.9, 2.10
- **What:** Reviews display on PDP (average rating, individual reviews with pagination),
  submit-review form (authenticated, one per product). No photo upload at launch (open decision).
- **Acceptance:** The PDP shows real reviews; an authenticated user can submit one review per
  product; the average rating is calculated correctly.
- **Files:** apps/web/components/product/ReviewList.tsx,
  apps/web/components/product/ReviewForm.tsx,
  apps/web/app/products/[sku]/page.tsx (expand)

### Task 5.7 — SEO pass
- **Status:** [ ]
- **LoC est:** 200 | **LoC act:** —
- **Spec:** guidelines/11
- **Dependencies:** All pages built
- **What:** Per-page metadata (title, description, OpenGraph), dynamic sitemap.xml, robots.txt,
  structured data (Product schema with price/availability on PDP).
- **Acceptance:** Every page has appropriate metadata; sitemap and robots are generated
  dynamically; PDPs have Product structured data.
- **Files:** apps/web/app/layout.tsx (expand), apps/web/app/sitemap.ts,
  apps/web/app/robots.ts, PDP metadata

### Task 5.8 — Rate limiting + helmet (security hardening)
- **Status:** [ ]
- **LoC est:** 100 | **LoC act:** —
- **Spec:** guidelines/08
- **Dependencies:** None
- **What:** Rate limiting on login/auth (brute-force), search (abuse), checkout initiation
  (gateway API abuse). Helmet for security headers. Needed before public launch.
- **Acceptance:** Rate-limited endpoints reject excessive requests; security headers are set.
- **Files:** apps/api/src/main.ts (expand), apps/api/src/common/rate-limit.config.ts

### Task 5.9 — Account settings page
- **Status:** [ ]
- **LoC est:** 150 | **LoC act:** —
- **Spec:** guidelines/12 (Account section)
- **Dependencies:** 2.10
- **What:** Account settings: change password, update name/companyName, email preferences
  (notification opt-in/opt-out).
- **Acceptance:** A user can change their password and update their profile.
- **Files:** apps/web/app/account/settings/page.tsx,
  apps/api/src/auth/auth.controller.ts (expand)

---

## Cross-cutting — Tests (est. 1,200 LoC)

Tests run alongside their corresponding feature tasks, not all at the end. Listed separately
because they don't map 1:1 to a single feature.

| # | Test | Est. LoC | Depends on |
|---|------|----------|------------|
| T.1 | PricingService unit tests (tier formulas, special-case splits, PROJECT floor) | 150 | Existing |
| T.2 | Made-to-Length validation tests (13,200mm max, gauge bounds) | 100 | Existing |
| T.3 | Trade-account approval transaction tests (single-transaction, duplicate guards) | 100 | Existing |
| T.4 | PayFast webhook idempotency + signature tests | 120 | 3.5 |
| T.5 | Checkout integration test (cart → payment → order, end-to-end) | 200 | 3.3 |
| T.6 | Freight calculation tests (weight bands, province multipliers, free-delivery ceiling) | 100 | Existing |
| T.7 | Auth/JWT tests (token issuance, validation, expiry) | 100 | 2.1 |
| T.8 | Address/Quote/Wishlist endpoint tests | 200 | 2.5–2.7 |
| T.9 | Admin endpoint tests | 130 | Phase 4 |

---

## Cumulative LoC projection

| Milestone | Est. cumulative LoC | Est. files |
|-----------|---------------------|------------|
| End Phase 1 (current) | 2,575 | 60 |
| End Phase 2 | 5,925 | ~95 |
| End Phase 3 | 9,225 | ~115 |
| End Phase 4 | 12,775 | ~140 |
| End Phase 5 + tests | 15,875 | ~155 |

This is the loc-countable source. Total repository footprint including CSS, JSON, docs, and
config will be approximately 35,000 lines, consistent with the README's estimate.

---

## Critical path

The longest dependency chain that determines the minimum calendar time to a working checkout:

```
2.1 (JWT) → 2.2 (guard) → 2.5 (addresses) → 3.2 (cart context) → 3.3 (checkout) → 3.5 (PayFast)
```

Everything else can be parallelised around this chain. Tasks 2.4 (search), 2.7–2.9 (wishlist/
compliance/reviews), 2.11–2.14 (frontend pages), and Phase 4 admin/jobs work can proceed
independently once their immediate dependencies are met.
