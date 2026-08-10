# Storefront UX, Information Architecture & Page Breakdown

This is the counterpart to the corporate site for the transactional side. Read this before
building any page or component in apps/web. It answers: what pages exist, what's on each one,
how it stays visually continuous with the corporate site while functioning completely
differently, and how each piece maps to the API that's already real.

## The core relationship: same brand, different job

The corporate site's job is to be believed — it explains what Roofsteel is, why it's credible,
and hands off to the store with a Launch Store button. The store's job is to be used — find a
product, configure it correctly, price it correctly for the right tier, and check out with as
little friction as possible. Same Foundry brand system throughout (guidelines/03-frontend.md
already says this — this document is the detail behind it), completely different layout
priorities: the corporate site can afford a full-viewport cinematic hero slider; the store
can't, because every pixel between landing and "add to cart" is friction for a returning trade
buyer who already knows what they want.

## Sitemap

    /                              Home — category-led, not a marketing hero
    /category/:slug                Category listing (PLP) — filters, sort, grid
    /products/:sku                 Product detail (PDP) — the most complex page
    /search?q=                     Search results — same grid/filter UI as category
    /cart                          Full cart page (drawer covers the quick case)
    /checkout                      One-page, collapsible-step checkout
    /checkout/success              Order confirmation
    /checkout/cancelled            Payment cancelled/failed
    /account                       Dashboard
    /account/orders                Order history
    /account/orders/:orderNumber   Order detail + tracking
    /account/addresses             Saved addresses
    /account/trade-account         Application status / apply
    /account/wishlists             Multi-list wishlist (spec Section 3.7)
    /trade/apply                   Public trade application entry (same URL pattern as
                                    Bellwether SWE Plumbers' own /trade/apply — proven, reuse it)
    /quote/request                 RFQ entry point — Project/Tender tier (spec Section 4.3)
    /login  /register
    /terms /privacy /returns /shipping /faq   (transactional legal pages — NOT a duplicate of
                                                the corporate site's brand/company pages, which
                                                stay on the corporate site and get linked to,
                                                not copied)

## Navigation — deliberately different from the corporate site's

The corporate site uses a top hamburger nav because browsing there is a linear, occasional
activity. The store is revisited constantly mid-session (check cart, check account, search
again) — so mobile navigation is a persistent bottom tab bar: Home, Categories, Search, Cart
(with item-count badge), Account. This is a deliberate deviation from the corporate site's
pattern, not an inconsistency — see guidelines/03-frontend.md's mobile-first principle applied
to what a commerce app actually needs versus what a marketing site needs. Desktop keeps a
conventional top header (logo, category mega-menu, search bar, account, cart icon) since the
thumb-reachability problem the bottom bar solves doesn't exist on desktop.

The header on both breakpoints includes a small, deliberately understated link back to the
corporate site (roofsteel.besbpo.co.za) — for a customer who wants sourcing/compliance/company
information the store doesn't carry. Small, not a competing CTA — the store's job is to keep
someone shopping, not send them away, but the door back should exist.

## Page-by-page breakdown

### Home (/)
1. Compact promo strip (not a full-viewport slider) — 3 rotating slides max, category- or
   promotion-led, sized to get out of the way fast. The corporate site's 8-slide cinematic hero
   is right for a first-impression marketing moment; it's wrong here, where most visitors have
   already decided to shop.
2. Category grid — same 13 categories, same icons, as the corporate site's category section.
   Literally reuse the icon set (guidelines/03-frontend.md already says port tokens, not
   reinvent — this extends to iconography).
3. Trending Now — real 7-day order-velocity query (spec Section 3.3), horizontal scroll on
   mobile, grid on desktop.
4. Made-to-Length feature banner — a dedicated, visually distinct callout (not just another
   product card) explaining the configurator exists, linking into a relevant category. This is
   the platform's actual differentiator; the homepage should say so once, clearly, not bury it
   in a product grid.
5. New Arrivals.
6. Footer (store variant — see below).

### Category / PLP (/category/:slug, /search)
- Breadcrumb (Home / Category / Subcategory).
- Filters: subcategory, fulfilment type (Stock/Made to Length/Cut to Order/Fabricated to
  Order), segment (Industrial/Commercial/Civil/Institutional/Residential) — desktop sidebar,
  mobile bottom-sheet filter drawer (not a full-page navigation-away filter screen).
- Sort: relevance (default), price low-high, price high-low, name.
- Product grid — ProductCard component, 2-column mobile, up to 4-column desktop.
- Pagination, capped at 100/page server-side (guidelines/01-api-design.md) with a sane default
  around 24.

### Product Detail (/products/:sku) — the most complex page, build last within Phase 2
1. Gallery — main image + thumbnails, hover-zoom desktop, swipe mobile. Graceful missing-photo
   placeholder (guidelines/03-frontend.md — photography for 171 lines won't all exist day one).
2. Product info block — name, SKU, fulfilment-type badge, PriceDisplay component showing the
   tier-resolved price (retail struck through for Trade/Volume accounts, per
   guidelines/03-frontend.md).
3. Made-to-Length Configurator — only rendered when fulfilmentType === "MADE_TO_LENGTH". This
   is its own component tree per guidelines/04-made-to-length-configurator.md — gauge, profile,
   colour, length inputs, live price, the 13,200mm validation surfaced clearly, not as a
   generic error.
4. Add to Cart / Request Quote — the CTA itself branches: standard Add to Cart for
   Stock/Made-to-Length/Cut-to-Order; for Fabricated-to-Order lines with a non-standard
   cut/bend shape, or for a Project-tier account, it becomes Request Quote, routing into the
   Quote/RFQ flow instead of the cart (spec Section 4.3).
5. Accordion specs — the catalogue's Key Specs/Sizes field, plus a Compliance tab listing SANS
   standards and any attached mill certificates/NRCS LoAs (spec Section 4.5).
6. Frequently Bought Together — real complementary-product logic (spec Section 3.4), priced
   through the same tiered engine as everything else, never a flat consumer discount.
7. Reviews — text/star at launch (spec Section 8 decision pending on photo upload).

### Cart (drawer + /cart)
Slide-out drawer accessible from anywhere (cart icon in header / bottom tab). Line items show
their Made-to-Length configuration inline where relevant (gauge/profile/colour/length — not
hidden behind a details click, since this is exactly the kind of detail a trade buyer double-
checks before paying). Free-delivery threshold progress bar. The full /cart page is the same
content with more room — not a different design.

### Checkout (/checkout)
One page, collapsible steps (Delivery Address -> Delivery/Freight -> Payment -> Review),
matching the blueprint's adaptation in spec Section 3.6. Payment method list is tier-filtered
server-side truth, client-rendered from GATEWAYS_BY_TIER (already real in
orders/payments/payment-strategy.interface.ts) — a Retail checkout never even shows Lulapay as
an option, not shown-then-disabled.

### Account (/account/*)
Sidebar nav desktop, horizontal scroll tabs mobile: Dashboard, Orders, Addresses, Trade Account,
Wishlists, Settings. Trade Account tab shows one of four real states (not yet applied / pending
/ approved / rejected with reason) — matches the TradeAccountApplication model and the
/trade/apply page's own state handling.

## Component inventory (build these once, reuse everywhere)

StoreHeader, MobileTabBar, StoreFooter, CategoryGrid, ProductCard, PriceDisplay, FilterDrawer,
Breadcrumb, MadeToLengthConfigurator (its own directory, per guidelines/03-frontend.md),
CartDrawer, CartLineItem, ComplianceTab, AccordionSpecs, TierBadge (shows Retail/Trade/
Contractor/Project visually where relevant), EmptyState (empty cart, no search results, no
orders yet — one honest component, not four ad hoc ones).

## Mobile-first breakpoints — match the corporate site exactly

Don't invent new breakpoints. The corporate site's CSS uses 640px / 768px / 900px / 1020px /
1080px / 1280px min-width steps depending on component — port the same scale for consistency
across both codebases rather than a fresh set of store-specific breakpoints.

## Scalability notes

- Product images and category icons: next/image, real srcset generation — not the corporate
  site's raw <img> tags (fine for a static hero, wrong for a product grid that needs to stay
  fast as photography gets added for all 171+ lines).
- Server Components by default for anything that's just displaying fetched data (PLP, PDP info
  block); Client Components only where genuinely interactive (configurator, cart, filter
  drawer) — guidelines/03-frontend.md's rule restated in context.
- The category/product taxonomy is already real data (171 lines, 13 categories) — the UI needs
  to handle a category growing well past its current line count without a layout that assumes a
  fixed small number of products (Structural Steel already has 63 lines; design the PLP grid
  and pagination for that scale now, not as a later fix).
