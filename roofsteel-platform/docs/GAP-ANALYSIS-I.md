# Gap Analysis I — Pages, Endpoints, Models & Infrastructure

Conducted 2026-08-09, immediately after the storefront UX/component session. Every finding below
comes from actually checking the codebase (grep, file existence checks) — not from re-reading
the spec and assuming. See the commands in docs/DEVELOPMENT-LOG.md's matching entry if a finding
needs re-verification.

## 1. Pages — sitemap vs. reality

guidelines/12-storefront-ux-and-ia.md defines 19 routes. Two are real.

| Route | Status |
|---|---|
| / (Home) | Real — fixture data, real components |
| /products/:sku (PDP) | Real — fixture data, real Made-to-Length Configurator |
| /category/:slug (PLP) | Scaffolded this session (see Section 5) |
| /search | Scaffolded this session |
| /cart | Scaffolded this session — CartDrawer component exists but isn't wired to any page or real state yet |
| /checkout, /checkout/success, /checkout/cancelled | Scaffolded this session |
| /account, /account/orders, /account/orders/:orderNumber, /account/addresses, /account/trade-account, /account/wishlists | Scaffolded this session |
| /trade/apply | Scaffolded this session — note: the backend API for this (trade-accounts module) is fully real; only the page was missing |
| /quote/request | Scaffolded this session |
| /login, /register | Scaffolded this session — note: the backend API (auth module) is fully real; only the pages were missing |
| /terms, /privacy, /returns, /shipping, /faq | Scaffolded this session |

The pattern worth noticing: in three cases (trade apply, login/register) the backend was already
real and complete, but no page existed to call it. Backend-first was the right build order (spec
Section 6.3), but it left a real, easy-to-miss gap — a working API nobody can reach.

## 2. Backend — models with zero service/endpoint coverage

Checked by grepping every Prisma model name against apps/api/src for a real prisma.<model>.
reference:

| Model | Endpoints exist? | Impact |
|---|---|---|
| Category, Subcategory | No | The real Home page's CategoryGrid has nothing to fetch from — it runs on a hardcoded fixture. This is the single highest-value gap to close next: it's small, and it unblocks the homepage from being real. |
| PricingBand | No dedicated endpoint | PricingService reads bands correctly, but there's no admin-facing way to edit a band yet — the "yellow cell, everything recalculates" admin UI from guidelines/06-pricing-engine.md has nothing to call. |
| ComplianceDocument | No | Spec Section 4.5's compliance tab has no data source. |
| Address | No | Checkout's delivery-address step (spec Section 3.6) has nowhere to save/fetch a saved address. |
| Quote, QuoteItem | No | The entire Project/Tender RFQ flow (spec Section 4.3) is schema-only. |
| Wishlist, WishlistItem | No | Spec Section 3.7's multi-list wishlist is schema-only. |
| OrderItem | Written, never read back | Orders can be created; nothing reads order items back out for the order-detail page. |

## 3. A data model that's missing entirely: Reviews

guidelines/03-08 and the spec both reference product reviews (text/star at launch, spec Section
8's open question on photo upload). There is no Review model in schema.prisma at all — this
isn't a "build the endpoint," it's "the schema doesn't have anywhere to put the data yet."
Flagged here rather than silently added, since a schema change is worth a deliberate decision,
not a drive-by addition during a gap analysis.

## 4. Infrastructure & config gaps — fixed this session

Found and closed immediately, since they were cheap and were actively going to cause confusion
or real build failures for the next session:

- No apps/web/next.config.js — ProductCard.tsx already uses next/image, which refuses to
  optimise an external image host without remotePatterns configured. Added, with an honest
  empty placeholder list pending a real photography CDN host.
- No apps/web/tsconfig.json — the web app was relying on the root tsconfig.json alone, missing
  Next.js-required settings (jsx: preserve, the next plugin, moduleResolution: bundler). Added,
  extending the root config rather than duplicating it.
- Dead Tailwind dependency — apps/web/package.json listed tailwindcss, postcss, autoprefixer,
  none of which are used anywhere; the real design system is the ported Foundry CSS custom
  properties in globals.css. Removed rather than left as misleading unused scaffolding (see
  docs/DECISIONS.md ADR-010).
- No favicon/manifest for the store — the corporate site has one; the store didn't. Copied the
  real brand assets (favicon.ico, icon-192.png, icon-512.png) and added a site.webmanifest,
  wired into layout.tsx's metadata.

## 5. Missing route files — scaffolded this session

Every route from Section 1 marked "Scaffolded" now has a real page.tsx file with correct routing
structure and an explicit comment pointing at the guideline/spec section defining what content
it needs — the same SCAFFOLD discipline AGENTS.md already requires for backend modules, applied
to frontend routes for the first time. See the file tree in docs/DEVELOPMENT-LOG.md's matching
entry.

## 6. Testing — zero coverage

guidelines/07-testing.md names exactly what needs unit tests: PricingService's tier formulas,
Made-to-Length validation, trade-account approval's transaction safety, payment webhook
idempotency. None of these have a test file yet. This is the most important gap in this whole
analysis in terms of risk — it's the business logic where a bug costs money, and it's currently
only protected by the manual validation this project has been doing turn by turn (real, but not
repeatable or automated).

## 7. Not started at all

- Admin panel — zero routes, zero UI. Phase 4 per ROADMAP.md, correctly not yet due, but worth
  naming here since so much of Phase 2-3 (pricing band edits, trade application review,
  compliance doc upload) assumes an admin surface that doesn't exist yet.
- BullMQ worker / background jobs — guidelines/09-notifications-and-jobs.md is written; zero job
  code exists. Order confirmation emails, trade-application notifications, and back-in-stock
  alerts all depend on this.
- Rate limiting / helmet — guidelines/08-security-and-compliance.md flags this as "genuinely
  needed before the store is publicly reachable," not Phase 2-3 urgent. Confirmed still absent
  from main.ts.
- Real session/JWT issuance — AuthService does real password verification; nothing issues a
  real session token yet, so nothing is actually "logged in" after a successful login call.

## 8. Prioritised next steps

In order of value-per-effort, not spec-section order:

1. Categories endpoint — small, unblocks the real Home page immediately.
2. Session/JWT issuance — without this, every other "authenticated" feature (cart tied to an
   account, trade pricing, order history) has nothing real to check against.
3. Address + Quote endpoints — checkout and the Project/Tender tier are both blocked on these.
4. First real test file — pricing.service.spec.ts, both to protect the most money-sensitive
   logic in the codebase and to establish the pattern for every service after it.
5. Wishlist, ComplianceDocument endpoints — real but lower urgency than the above.
6. BullMQ worker skeleton — needed before any order-confirmation flow is genuinely complete.
7. Admin panel — correctly a Phase 4 item; don't pull it forward ahead of a working checkout.
