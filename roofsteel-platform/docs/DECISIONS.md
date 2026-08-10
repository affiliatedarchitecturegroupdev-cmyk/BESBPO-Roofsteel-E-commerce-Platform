# Decisions

One entry per real decision — a library choice, a schema change, a deviation from the original
plan. Numbered, never renumbered or deleted, even if a later decision reverses an earlier one
(add a new ADR that supersedes it; don't edit history). See AGENTS.md Section 6.

---

## ADR-001 — Two-language stack (TypeScript + Python), not the polyglot Go/Rust/Elixir blueprint

**Status:** Accepted
**Context:** The source Besbpo Group blueprint specified five languages — TypeScript, Go, Rust,
Python, and Elixir — for a Takealot-scale marketplace.
**Decision:** Next.js + NestJS (TypeScript) + a small FastAPI service (Python) only. No Go, Rust,
or Elixir at launch.
**Consequences:** Matches the stack already proven on Bellwether SWE Plumbers (35,521 LoC
shipped on exactly this combination). Revisit only if a specific, real bottleneck justifies one
of the deferred services — not preemptively.
**Reference:** Spec Section 2.2.

## ADR-002 — Postgres full-text search, not Algolia

**Status:** Accepted
**Context:** Blueprint proposed "Algolia-style instant search."
**Decision:** Postgres tsvector/pg_trgm, the same mechanism already proven on Bellwether SWE
Plumbers, including its typo-tolerance behaviour.
**Consequences:** No third-party search SaaS dependency or cost at this catalogue size (171
lines). Reassess if catalogue size grows by an order of magnitude.
**Reference:** Spec Section 3.5.

## ADR-003 — Payment gateways: PayFast + Lulapay primary, PayJustNow limited, Yoco deferred

**Status:** Accepted
**Context:** Blueprint proposed four gateways with no tier-specific reasoning.
**Decision:** PayFast (core rail), Lulapay (priority — solves the open "no registered credit
intermediary" gap noted on Bellwether SWE Plumbers), PayJustNow (Retail tier only), Yoco
(deferred — POS sync doesn't fit an online-first model).
**Consequences:** Lulapay integration is blocked on a real Partner-onboarding step, not just an
API key — see ROADMAP.md Phase 3.
**Reference:** Spec Section 5.

## ADR-004 — LoC discipline: 250-850 average / 1,800 hard cap

**Status:** Accepted (2026-08-09, supersedes the figure in the original spec document)
**Context:** The original specification (Section 6.1) proposed carrying forward Bellwether SWE
Plumbers' exact numbers — 280-800 LoC average, 1,500 LoC hard cap — as a starting assumption.
Fortune reviewed and set different numbers for this project specifically.
**Decision:** 250-850 LoC average per logic-bearing file, 1,800 LoC hard cap.
**Consequences:** scripts/check-loc.sh, AGENTS.md, and CLAUDE.md all reflect this number. The
original spec docx still shows 280-800/1,500 in its text — this ADR is the authoritative
correction; the docx itself was not regenerated for a single-number change.
**Reference:** AGENTS.md Section 2, CLAUDE.md "Code standard".

## ADR-005 — Repository ownership: Besbpo Group

**Status:** Accepted (2026-08-09)
**Context:** Spec Section 8 flagged repo ownership as an open question blocking nothing
technical, but needed before a real GitHub remote exists.
**Decision:** This repository belongs to Besbpo Group — organisation-level ownership, not a
personal account. GitHub org slug assumed as `besbpo-group` pending the actual org being
created; update every reference below if the real org name differs.
**Consequences:** `LICENSE` added (proprietary, © Besbpo Group). CI workflow, package.json
`repository` fields, and any deploy-hook documentation should reference the `besbpo-group` org.
**Reference:** Spec Section 8.

## ADR-006 — Lulapay: approved, no longer blocking Phase 3

**Status:** Accepted (2026-08-09)
**Context:** ADR-003 recommended Lulapay as the priority B2B payment gateway but flagged Partner
onboarding as a real business step blocking integration.
**Decision:** Lulapay Partner onboarding is approved and proceeding. Phase 3's Lulapay
integration task is unblocked.
**Consequences:** `ROADMAP.md` Phase 3 and the "Blocked" section updated. The `LulapayStrategy`
payment class (see `apps/api/src/orders/`) can be built as a real integration target, not a
stub behind a permanently-pending flag — though the actual API key still needs to be issued
before it goes live in any environment.
**Reference:** ADR-003, spec Section 5.

## ADR-007 — Landed costs: approved for use now, cost-refinement pass planned later

**Status:** Accepted (2026-08-09)
**Context:** The Pricing Framework workbook's landed costs were explicitly illustrative
placeholders (`costIsReal: false` on every seeded `Product`). Fortune reviewed them: broadly
accurate, running a bit high in some categories, not wrong enough to block launch on.
**Decision:** Approved for use now. `costIsReal` flips to `true` across the seed data. A
cost-refinement pass against real supplier quotes is planned for later (see `ROADMAP.md` —
added as a Phase 4/5 task) rather than blocking Phase 2/3 on it.
**Consequences:** Pricing shown to real customers from Phase 3 onward reflects these costs as
approved figures, not placeholders — the `costIsReal` flag's meaning shifts from "is this a
real number" to "has this been supplier-verified," and a `false` value going forward should be
read that way for any *new* product added after this ADR.
**Reference:** Spec Section 4.2, Section 8.

## ADR-008 — Freight cost: flat placeholder rate, explicitly NOT approved like landed costs

**Status:** Accepted (2026-08-09)
**Context:** `OrdersService.calculateFreight()` needed *some* value to compute an order total
against while the transactional layer was being built out. Unlike landed costs (ADR-007), no
review or approval of freight/delivery pricing has happened.
**Decision:** A flat R450 placeholder rate (free above R15,000 subtotal) ships in the code,
commented explicitly as unapproved, distinct from the landed-cost placeholders that ADR-007
approved. Real weight/distance-banded freight by province (spec Section 4.6) remains a Phase 4
task.
**Consequences:** Anyone reviewing pricing in the codebase needs to know these two placeholder
categories carry different confidence levels — don't assume "the pricing works" means freight
is real too.
**Reference:** Spec Section 4.6, `apps/api/src/orders/orders.service.ts`.

## ADR-009 — Frontend calls the API directly (client-side fetch), not via Next.js Server Actions

**Status:** Accepted (2026-08-09)
**Context:** Building the Made-to-Length Configurator's Add to Cart flow surfaced a real
architectural fork: Next.js Server Components cannot pass plain functions to Client
Components — only Server Actions can cross that boundary. Using Server Actions as an RPC proxy
to the separate NestJS API was one option; direct client-side fetch was the other.
**Decision:** Direct client-side fetch to the NestJS API via `NEXT_PUBLIC_API_URL`, using the
CORS configuration already set up in `apps/api/src/main.ts`. Interactive sections (anything
needing to call the API in response to a user action) live in their own `"use client"`
components — see `ProductPurchasePanel.tsx` — that own their own `fetch()` calls, rather than
routing through Server Actions.
**Consequences:** Simpler mental model for a genuinely separate frontend/backend (this isn't a
Next.js-only app with API routes) — matches what `.env.example` and the deployment guideline
already assumed. Every future interactive feature (cart, checkout, trade application forms)
should follow the same pattern: a small client component that owns its own fetch calls, not a
Server Action passed down from a route file.
**Reference:** `guidelines/03-frontend.md`, `guidelines/11-deployment.md`,
`apps/web/components/product/ProductPurchasePanel.tsx`.

## ADR-010 — Removed the unused Tailwind dependency from apps/web

**Status:** Accepted (2026-08-09)
**Context:** `apps/web/package.json` listed `tailwindcss`, `postcss`, and `autoprefixer` from
the original scaffold, but the real design system built out this session (`globals.css`,
ported Foundry CSS custom properties) never uses Tailwind utility classes — every component
uses plain className strings against real CSS rules.
**Decision:** Removed all three dependencies rather than leave unused, misleading scaffolding.
**Consequences:** If a future decision reintroduces Tailwind deliberately, that's a new ADR
with real reasoning, not a silent re-add. Found during Gap Analysis I's infrastructure check.
**Reference:** `docs/GAP-ANALYSIS-I.md` Section 4.

## ADR-011 — Custom-built admin/CMS, not a third-party CMS

**Status:** Accepted (2026-08-09)
**Context:** Product content (description, images) and commerce data (price, stock) needed a
management approach — a third-party CMS (Contentful/Strapi/Sanity) was one option.
**Decision:** Custom-built admin surface (Phase 4), matching the "no third-party CMS" precedent
already set on Bellwether SWE Plumbers. Content lives in the same database as commerce data,
edited by the same admin user in the same screen — not split across two systems that could
silently disagree about the same product.
**Consequences:** No CMS vendor dependency or cost. The admin panel (not yet built) is now
scoped to include content editing, not just commerce operations.
**Reference:** `guidelines/13-listings-cms-inventory-sales.md` Section 2.

## ADR-012 — Inventory model varies by fulfilment type, not one stock field for everything

**Status:** Accepted (2026-08-09)
**Context:** `Product` had no stock tracking of any kind. A generic "quantity available" field
would have been factually wrong for Made-to-Length, Cut-to-Order, and Fabricated-to-Order
lines, which aren't finished-goods stock — confirmed by the real seed data split (76 Stock vs.
95 non-Stock products, almost exactly half).
**Decision:** `StockLevel`/`StockMovement`/`Location` (real quantity tracking, audit trail,
multi-location-ready for the KZN/Gauteng plan) for `STOCK` lines only. `Product.leadTimeDays`
(an estimate, not a hard count) for the other three fulfilment types. Full bill-of-materials
raw-material tracking for Made-to-Length/Cut-to-Order is named as the correct long-term model
but explicitly deferred, not built now.
**Consequences:** Every future stock-related feature (low-stock alerts, back-in-stock
notifications) needs to branch on fulfilment type, not assume every product has a `StockLevel`.
**Reference:** `guidelines/13-listings-cms-inventory-sales.md` Section 3.

## ADR-013 — Image/document storage: open decision, not guessed at

**Status:** Proposed — not yet decided
**Context:** `ProductImage` and `ComplianceDocument` both need real file storage; no decision
has been made between S3-compatible object storage (AWS S3 in `af-south-1`, matching the
group's stated data-sovereignty preference) and a simpler Render-native option.
**Decision:** Deliberately left open rather than guessed at — flagged the same way Lulapay
onboarding and real landed costs were flagged in the original spec's Section 8.
**Consequences:** This blocks the admin panel's real upload feature (Phase 4) until resolved —
flagged now so it isn't discovered as a surprise mid-Phase-4.
**Reference:** `guidelines/13-listings-cms-inventory-sales.md` Section 5.

## ADR-014 — Mixed-cart fulfilment timing: one order, timed to the slowest line

**Status:** Accepted (2026-08-09)
**Context:** An order can contain both Stock (ready today) and Made-to-Length/Fabricated-to-
Order (real lead time) lines. Nothing in the schema or checkout flow acknowledged this before —
an order had no honest way to communicate "ready in how many days."
**Decision:** `Order.estimatedReadyDays` computed as the **maximum** lead time across every
line (`OrdersService.calculateEstimatedReadyDays`), not an average or the fastest line.
Multi-shipment splitting (Stock ships now, Made-to-Length follows) is real and deferred, not
forgotten — the proven mechanism to build it later (Bellwether SWE Plumbers' `cartItemIds`
subset-scoped checkout) is named so it isn't reinvented when the time comes.
**Consequences:** Every order now has an honest single readiness figure. Splitting into real
multi-shipment orders is future Phase 3+/4 work, not v1.
**Reference:** `guidelines/14-checkout-and-fulfilment-timing.md` Section 4.

## ADR-015 — OrderItem snapshots fulfilmentType, enforcing the non-returnable policy for real

**Status:** Accepted (2026-08-09)
**Context:** The Pricing Framework workbook decided months ago that Made-to-Length/Cut-to-
Order/Fabricated-to-Order items are non-returnable — a real, already-made business decision
that had never been wired into any code, because nothing recorded a line's fulfilment type at
purchase time.
**Decision:** `OrderItem.fulfilmentType` snapshotted at order creation, same reasoning as
`unitPrice` already being snapshotted — a later catalogue change must never retroactively alter
what a past order's return policy was.
**Consequences:** The not-yet-built Returns/RMA module (Phase 4/5) has real data to check
against (`fulfilmentType !== "STOCK"` -> reject) instead of needing to be designed from
scratch.
**Reference:** `guidelines/14-checkout-and-fulfilment-timing.md` Section 3.

## ADR-016 — Real weight-based, province-distance-banded freight, replacing the flat placeholder

**Status:** Accepted (2026-08-09)
**Context:** ADR-008 flagged the original flat R450 freight rate as an explicit placeholder.
`Product` had no weight data at all to build real banding from.
**Decision:** Added `Product.weightKgPerUnit` — real engineering mass-table data (reused from
the Pricing Framework's own per-kg cost calculations) for the 80 Structural/Reinforcing Steel
products, reasoned category-level estimates for the other 91 (`weightIsReal` flag distinguishes
them, same pattern as `costIsReal`). `calculateFreight` now bands by real total order weight
(length-scaled for Made-to-Length lines, matching how price already scales) and a real
per-province distance multiplier from the Phase 1 KZN yard.
**Consequences:** The *structure* is real; the *rand values* in each weight band are still
illustrative — ADR-008's caveat is not resolved by this ADR, only the placeholder's shape.
**Reference:** `guidelines/15-delivery-courier-and-location.md` Section 2.

## ADR-017 — Courier: schema-ready, decision deliberately left open

**Status:** Proposed — not yet decided
**Context:** No courier or freight partner has been chosen. Two real options exist: Besfleet
(the Besbpo Group's own long-haul trucking division) for heavy/bulk freight, or an external
parcel courier for light accessories, possibly both depending on order weight.
**Decision:** `Shipment` model built schema-ready (free-text `carrier` field, not an enum, so
the real decision doesn't require a migration later) — same pattern as Lulapay being
interface-ready before Partner credentials existed.
**Consequences:** Blocks real courier/tracking-webhook integration until Fortune decides.
Flagged now rather than discovered as a surprise blocker.
**Reference:** `guidelines/15-delivery-courier-and-location.md` Section 3.

---

Template for new entries:

## ADR-00N — short title

**Status:** Proposed / Accepted / Superseded by ADR-00X
**Context:** what prompted this decision
**Decision:** what was decided
**Consequences:** what this changes, what to watch for
**Reference:** spec section or prior ADR
