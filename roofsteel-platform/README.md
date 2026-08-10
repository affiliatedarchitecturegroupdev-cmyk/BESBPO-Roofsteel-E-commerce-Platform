# Roofsteel E-Commerce Platform

Steel, roofing, and structural materials — 171 catalogue lines across 13 categories, priced
through a real 15-band tiered pricing engine. This repo is the **Phase 1 foundation** described
in `Roofsteel-Ecommerce-Platform-Specification.docx` — scaffolded so a Claude Code session or
OpenHands agentic run can continue directly against it without re-deriving the data model or
re-reading the spec from scratch.

## What's real here vs. what's scaffolded

**Built and working, pending `npm install` + a real database:**
- `prisma/schema.prisma` — the full data model (22 models: catalogue, pricing bands, accounts,
  trade applications, cart, orders, quotes, wishlists, compliance docs, inventory/stock,
  shipments)
- `prisma/seed.ts` + `prisma/data/*.json` — the **real** 171-product catalogue, 15 pricing
  bands, and 13 categories, exported directly from `Roofsteel-Product-Catalogue.xlsx` and
  `Roofsteel-Pricing-Framework.xlsx`. Every product carries real or reasoned-estimate weight
  data (`weightKgPerUnit`/`weightIsReal`) and stock/lead-time info. Validated: every product
  resolves to a real pricing band, every segment tag is valid, landed costs are approved
  (ADR-007) — freight rand values are the one remaining honest placeholder (ADR-016).
- `apps/api/src/pricing/` — real tier-resolution logic (Retail/Trade/Contractor/Project).
- `apps/api/src/products/`, `apps/api/src/categories/` — real listing/filtering logic.
- `apps/api/src/auth/` — real registration/login with bcrypt password hashing. Session/JWT
  issuance is the one piece still a TODO (see the controller).
- `apps/api/src/cart/` — real add/update/remove/merge logic, with server-side Made-to-Length
  length validation against the 13,200mm maximum.
- `apps/api/src/trade-accounts/` — the real apply/approve/reject flow, single-transaction
  Account-type update, duplicate-application guards.
- `apps/api/src/orders/` — real checkout orchestration and the full payment Strategy Pattern:
  `PayFastStrategy` (real dual-algorithm signature logic), `LulapayStrategy`,
  `PayJustNowStrategy`. All three throw/return-false honestly where a real gateway API call is
  still pending real credentials — none of them fake a successful payment. Freight is real
  weight- and province-distance-banded calculation (rand values still illustrative, ADR-016);
  `Order.estimatedReadyDays` honestly reflects mixed Stock/Made-to-Length carts.

**Scaffolded only:** 21 storefront routes (cart, checkout, account, trade/apply, login/register,
legal pages — see `docs/GAP-ANALYSIS-I.md`), the admin panel, courier/tracking integration
(schema-ready, no courier chosen yet — ADR-017), and the ai-service's quote-assist endpoint.

## Development guidelines

`guidelines/` — 16 detailed documents (API design, database, frontend, the Made-to-Length
Configurator's exact spec, payments, pricing engine internals, testing, security/POPIA,
notifications, accessibility, deployment, storefront UX/IA, listings/CMS/inventory, checkout
timing, delivery/courier). Start at `guidelines/00-INDEX.md`.

## Development plan and LoC budget

- `docs/DEVELOPMENT-PLAN.md` — the master build sequence: 50+ tasks across 5 phases, each with
  LoC estimate, dependencies, acceptance criteria, and the spec section it implements.
- `docs/LOC-BUDGET.md` — detailed lines-of-code estimate per task. Current baseline: 2,575 LoC.
  Estimated total at full operation: ~15,875 LoC across ~155 files.
- `ROADMAP.md` — live checklist with per-task LoC estimates and actuals.

## Before this runs for real

1. `npm install` (this sandbox has no network access — that's the one thing that couldn't
   happen here; everything else is real, written code)
2. Provision Postgres + Redis (Render-native, matching the Bellwether SWE Plumbers pattern —
   spec Section 2.1) and set `DATABASE_URL` / `REDIS_URL` in `.env`
3. `npm run prisma:migrate` then `npm run prisma:seed` — loads the real catalogue
4. Landed costs are approved for use (ADR-007) — a cost-refinement pass against real supplier
   quotes is a planned Phase 4/5 task, not a launch blocker. Freight rand values are the
   remaining real placeholder (ADR-016) — the weight/distance structure is real, the prices
   in each band aren't rate-card-reviewed yet.
5. `npm run dev:api` and `npm run dev:web`

## Where to go next

Read `CLAUDE.md` first — it's the condensed brief for continuing this build. The full spec is
`Roofsteel-Ecommerce-Platform-Specification.docx`, particularly Section 6 (development roadmap)
and Section 8 (open decisions that need an answer from Fortune before Phase 3).
