# Frontend & Next.js Conventions

## Design tokens — port from the corporate site, don't reinvent

The corporate site (separate repo, already live on GitHub Pages) already has a complete, tested
Foundry design system: Deep Slate #1A1F24, Molten Orange #E8631C, Cool Steel #7C8892, Off-White
#F2F1ED, plus the Space Grotesk/Inter/IBM Plex Mono type system. Port these as CSS custom
properties into apps/web/app/globals.css exactly as they exist on the corporate site — don't
introduce a second palette or reinterpret the brand for the store. A customer clicking "Launch
Store" from the corporate site should land somewhere that visually continues, not restarts.

## App Router structure

apps/web/app/ uses Next.js App Router (already scaffolded: app/layout.tsx, app/page.tsx,
app/products/[sku]/page.tsx). Server Components by default — only mark a component
"use client" when it genuinely needs interactivity (the Made-to-Length Configurator, cart
drawer, gallery carousel). Fetch data in Server Components directly against the API rather than
client-side fetching-then-rendering where it can be avoided; it's faster and matches the
mobile-first, low-data-cost priority already established for South African users on the
corporate site.

## Component organisation

- app/ — routes only (page.tsx, layout.tsx, loading.tsx, error.tsx per route).
- components/ — shared, reusable UI (ProductCard, PriceDisplay, CategoryGrid).
- components/configurator/ — the Made-to-Length Configurator gets its own directory given its
  real complexity (see guidelines/04-made-to-length-configurator.md) — don't bury it as one
  giant component file; it should be several focused files under the 250-850 LoC guidance.

## Mobile-first, always

Every component built mobile-first, scaling up — not desktop-first with mobile overrides bolted
on. This is the same standard the corporate site is already built to (its own CSS is written
mobile-first with min-width media queries scaling up, never max-width overrides scaling down).
Touch targets minimum 48x48px on anything interactive.

## Pricing display

Never hardcode a price format or compute a price client-side beyond formatting a number the API
already returned. The API's PricingService is the single source of truth for what a customer
pays — the frontend's job is to display pricing.applicablePrice (and, where useful,
pricing.retailPrice struck through for a Trade/Volume customer to see their discount), not to
re-derive it from landedCost and a markup percentage in JavaScript.

## Made-to-Length and other configurable line items

Structured state, not free text — mirrors the API contract (MadeToLengthConfig in
packages/shared-types). The configurator's length input needs live client-side validation
against the 13,200mm maximum before the "Add to Cart" action is even enabled, not just a
server-side rejection after the fact — a customer should never submit an invalid configuration
and only find out from an error response.

## Image handling

next/image for everything — it's the mechanism ADR-002 relies on instead of a dedicated Rust
image-optimisation service. Real product photography is a known gap (see spec Section 3.5) —
build every product image slot to gracefully handle a missing photo (a clean placeholder, not a
broken-image icon) since photography for 171 lines won't all exist on day one.

## Accessibility

See guidelines/10-accessibility.md — WCAG 2.1 AA is not optional polish, it's the standard the
corporate site already meets (skip link, visible focus states, reduced-motion support). Match
it, don't regress from it just because the store is a separate codebase.
