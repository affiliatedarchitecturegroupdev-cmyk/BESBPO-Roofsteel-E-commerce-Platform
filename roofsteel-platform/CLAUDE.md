# CLAUDE.md — Roofsteel E-Commerce Platform

Read this before touching code. It's the condensed version of
`Roofsteel-Ecommerce-Platform-Specification.docx` — read that document in full for reasoning;
read this file for what to actually do next.

## What this project is

Single-vendor B2B/B2C e-commerce platform for Roofsteel, a steel/roofing/structural materials
supplier and Besbpo Group division. NOT a multi-vendor marketplace. NOT a Takealot/Sixty60 clone
— it started from a generic Besbpo Group blueprint built for that kind of platform, and this repo
is what's left after adapting every feature to a business that sells structural steel and
roll-formed roofing sheet, not groceries and electronics.

## Stack (decided, don't relitigate — spec Section 2)

- `apps/api` — NestJS. `apps/web` — Next.js. `apps/ai-service` — FastAPI, kept deliberately small.
- Postgres (full-text search via tsvector/pg_trgm — no Algolia) + Redis, both Render-native.
- BullMQ for background jobs.
- Explicitly NOT using Go, Rust, or Elixir — the blueprint proposed them, the spec's Section 2.2
  explains why they're deferred. Don't introduce a new language without re-reading that section.

## Code standard (carried over from Bellwether SWE Plumbers, adjusted per Fortune's call)

- **250-850 LoC average per logic-bearing file. 1,800 LoC hard cap.** Run `npm run loc:check`
  before opening a PR — see `scripts/check-loc.sh`. Full agentic workflow rules (branching,
  PR requirements, testing, security, when to escalate to a human): `AGENTS.md`.
- Every new module: real logic or an explicit `// SCAFFOLD` comment pointing at the spec section
  that defines it. Never a module that looks finished but silently does nothing.
- Before building a feature, check whether the underlying mechanism already exists — this
  caught real gaps on Bellwether SWE Plumbers (no admin-wide accounts endpoint existed before it
  was built; no bundle-price checkout existed, so analytics were framed honestly around a count,
  not fabricated sales data). Same discipline here.

## The data is real — don't regenerate it

`prisma/data/seed-products.json` (171 products) and `seed-pricing-bands.json` (15 bands) are
exported directly from the actual Roofsteel Product Catalogue and Pricing Framework workbooks.
Validated: zero unresolvable pricing keys, zero invalid segments, zero missing fulfilment types.
If a product or category needs to change, change it in the source workbook and re-export — don't
hand-edit the JSON, it'll drift from the workbook that's the actual source of truth.

`landedCost` on every seeded product is a placeholder from the pricing workbook's own illustrative
figures. `costIsReal: false` on every row flags this. Don't remove that flag or treat the number
as real without it being explicitly set to `true` against a real supplier quote.

## What's actually built vs. what you're building next

See `README.md`'s "What's real here" section for the current state. Short version: pricing engine
and product listing have real logic. Auth, cart, orders, trade-accounts, and the whole web app are
scaffolded with TODO comments — that's Phase 2 onward (spec Section 6.3).

## Phase sequence (spec Section 6.3) — work in this order

1. **Foundation** (this commit) — done.
2. **Product, Catalogue & Pricing** — search (real Postgres full-text, replacing the
   `contains`-filter placeholder in `products.module.ts`), the Made-to-Length Configurator
   (spec 4.1 — UI + length validation against the 13,200mm max), PDP.
3. **Transactional Layer** — cart, checkout, PayFast + Lulapay (spec Section 5 — Strategy
   Pattern, one class per gateway), trade account application flow.
4. **Operational Layer** — admin panel, order lifecycle notifications, quote/RFQ engine, cut/bend
   selector (SANS 282 shape codes), compliance document attachment, freight banding by province.
5. **Launch Polish** — legal pages, accessibility pass, ai-service quote-assist, wishlist,
   reviews, first gap-analysis review (the same iterative-review pattern Bellwether SWE Plumbers
   ran five rounds of after its own initial launch).

## Resolved (2026-08-09) — don't re-ask these

- Repository ownership: **Besbpo Group**. GitHub org assumed as `besbpo-group` — see
  `docs/DECISIONS.md` ADR-005 and update if the real org name differs.
- Lulapay Partner onboarding: **approved, proceeding**. ADR-006. Build the real integration,
  not a permanently-stubbed one — the only thing still missing is the actual issued API key.
- Landed costs: **approved for use now**. ADR-007. `costIsReal: true` on all 171 seeded
  products. A cost-refinement pass is a planned Phase 4/5 task, not a launch blocker.

## Still open — check with Fortune, don't guess

- Click-and-collect: build now or defer until a physical yard exists.
- Reviews: text/star only at launch, or does photo upload need to move into v1 scope.

## Provinces, payment, and other facts that are settled — don't re-derive

- 7 provinces served: Gauteng, KwaZulu-Natal, Western Cape, Limpopo, Mpumalanga, Eastern Cape,
  North West. This is an online-delivery service area, not a claim about physical yard locations.
- Store domain: roofsteel.shop (Render deployment target once Phase 3 has working checkout).
- Corporate site (separate repo/deploy): GitHub Pages, already live, Launch Store buttons
  already point at roofsteel.shop.
