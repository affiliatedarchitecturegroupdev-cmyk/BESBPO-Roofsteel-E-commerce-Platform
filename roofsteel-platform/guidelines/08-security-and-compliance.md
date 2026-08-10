# Security & Compliance

## Auth

Session/JWT strategy is Phase 2 scope (auth module, currently scaffolded empty). Whatever
mechanism is chosen: passwords hashed (bcrypt or equivalent, never reversible encryption, never
plain text), session tokens never logged, password reset tokens single-use and time-limited.
Account-type (Retail/Trade/Contractor/Project) must be resolved server-side from the
authenticated session — never trust a client-supplied account type for pricing purposes, or a
customer could self-select Trade pricing without an approved application.

## Secrets

.env is gitignored — keep it that way. .env.example lists every variable name with no real
values. PAYFAST_MERCHANT_KEY, LULAPAY_API_KEY, and any future gateway credential are runtime
environment variables on Render, never committed, never hardcoded even temporarily "to test
something" — that temporary hardcoding is how credentials end up in git history permanently.

## Input validation

Every DTO validated via class-validator (guidelines/01-api-design.md) — this is the primary
defence against malformed or malicious input, not a nice-to-have. Particular attention on:

- Made-to-Length length/gauge inputs — numeric bounds checked server-side regardless of
  client-side validation (guidelines/04-made-to-length-configurator.md).
- Search query strings — parameterised queries only, Prisma's query builder already protects
  against SQL injection as long as raw $queryRaw isn't used carelessly with string interpolation.
  If a full-text search implementation needs $queryRaw, use Prisma.sql tagged templates, never
  string concatenation of user input into a raw query.

## POPIA (Protection of Personal Information Act)

South African data protection law applies to any customer personal information this platform
collects — names, addresses, order history, payment references. Practical implications for this
build:

- Customer data (Account, Address, Order) stays in the platform's own database — no
  unnecessary third-party data sharing beyond what a payment gateway genuinely requires to
  process a transaction.
- Account deletion/data export requests (a real POPIA right) should be buildable against the
  schema as designed — Account cascades sensibly to Address/Order/Wishlist, so a deletion
  request has a clear scope. This doesn't need to be built in Phase 1-3, but don't build
  anything that would make a future deletion request structurally impossible (e.g., don't
  denormalise personal data into places that would need separate cleanup).
- Compliance documents (mill certs, NRCS LoAs) are product/batch data, not personal data — no
  POPIA concern there specifically.

## Payment security

Webhook signature verification is not optional — see guidelines/05-payments.md for the specific
PayFast dual-algorithm detail. Never process a payment confirmation from an unverified source,
even in development/testing, since it's easy to accidentally ship that shortcut to production.

## Rate limiting

Not built yet, worth adding before public launch (Phase 5) on at minimum: login/auth endpoints
(brute-force protection), the search endpoint (abuse protection at low cost), and the checkout
initiation endpoint (prevent payment-gateway API abuse). Not urgent for Phase 2-3 internal
development, genuinely needed before the store is publicly reachable.

## Dependency hygiene

New dependency added: check it's actively maintained (recent commits, not abandoned) before
adding it, per AGENTS.md Section 5. Run npm audit periodically once dependencies are actually
installed (this sandbox couldn't — see README.md's known gap) and address anything above
moderate severity before it accumulates.
