# API Design & NestJS Conventions

## Module structure

One module per domain (products, pricing, cart, orders, trade-accounts, auth, compliance,
quotes, wishlists). Each module owns its controller(s), service(s), and DTOs. Follow the pattern
already in apps/api/src/pricing/ and apps/api/src/products/: controller stays thin (route +
validation only), service holds the real logic. Don't put business logic in a controller because
it's convenient — the pattern established in the real code so far is deliberate, not accidental.

## Route conventions

- Global prefix v1 (already set in main.ts) — every route is /v1/...
- Resource-plural nouns: /v1/products, /v1/orders, not /v1/getProducts.
- Nested resources for genuine ownership: /v1/orders/:id/items, not a flat
  /v1/order-items?orderId=... unless there's a real reason to query items independently of an
  order (there usually isn't).
- Admin routes get an explicit /v1/admin/... prefix and their own guard — never reuse a
  customer-facing route with a hidden admin-only branch inside it.

## DTOs and validation

Every request body gets a DTO class with class-validator decorators (already a dependency).
Controllers use @Body() dto: CreateOrderDto, not @Body() body: any. ValidationPipe with
whitelist: true is already global (main.ts) — it strips unknown fields rather than erroring, so
a DTO that's missing a field silently drops data instead of failing loudly. Double-check DTOs
match the Prisma schema fields you actually need; a mismatch here fails silently, not loudly.

Listing/query endpoints: cap pageSize at 100 (@Max(100)), the same ceiling used on every listing
endpoint across the group's prior builds — see ProductsService.list() for the existing pattern
to copy.

## Error handling

Use NestJS's built-in exceptions (NotFoundException, BadRequestException,
UnprocessableEntityException) — don't build a custom error class hierarchy from scratch. They
already produce a consistent JSON error shape. For domain-specific failures (Made-to-Length
length validation, pricing-key resolution failure), throw the most specific built-in exception
that fits rather than a generic 400/500.

## Pagination & response shape

List endpoints return { items, total, page, pageSize } — see ProductsService.list(), copy this
shape rather than inventing a new one per endpoint. Single-resource endpoints return the resource
directly, no wrapper envelope.

## Before adding an endpoint, check what already exists

This caught real gaps on Bellwether SWE Plumbers before they became bugs: no admin-wide accounts
endpoint existed until someone checked and built it deliberately; no endpoint existed to fetch a
single product by ID (only by slug) — caught three times before it shipped wrong. Grep the
codebase for the resource you're about to add an endpoint for before assuming nothing's there.

## Endpoint ordering in controllers

Literal-segment routes before parameterised ones: /v1/admin/products/export must be declared
before /v1/admin/products/:id, or the :id route swallows export as an ID. This is a real,
easy-to-miss bug class — check route order whenever adding a new admin-wide or literal-segment
endpoint alongside an existing :id/:sku route.

## Auth context in services

ProductsService and PricingService currently default to AccountType.RETAIL with a TODO comment
(see products.module.ts). Once the auth module exists, thread the authenticated account's real
type through every pricing-sensitive call — don't leave the RETAIL default in place "because it
still works," since it silently mis-prices every Trade/Contractor/Project customer.
