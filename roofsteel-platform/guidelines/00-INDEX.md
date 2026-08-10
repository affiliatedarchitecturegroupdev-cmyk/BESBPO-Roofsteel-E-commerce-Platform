# Guidelines Index

This directory is the detailed development guideline cluster for building out the remaining
~35,000 LoC of the Roofsteel platform (Phases 2-5). AGENTS.md at the repo root is the short
version — process rules that apply everywhere. These documents are the long version — domain by
domain, detailed enough that an agentic session shouldn't need to guess a convention twice.

Read AGENTS.md first, always. Then come here for the specific domain you're working in.

| Document | Read this when you're working on... |
|---|---|
| 01-api-design.md | Any NestJS controller, service, module, or endpoint |
| 02-database.md | Prisma schema changes, migrations, queries |
| 03-frontend.md | Any Next.js page, component, or styling |
| 04-made-to-length-configurator.md | The Made-to-Length feature specifically — spec Section 4.1 |
| 05-payments.md | PayFast, Lulapay, PayJustNow — the Strategy Pattern integration |
| 06-pricing-engine.md | Extending or modifying tier/markup pricing logic |
| 07-testing.md | Writing or deciding whether to write tests |
| 08-security-and-compliance.md | Auth, secrets, POPIA, input validation |
| 09-notifications-and-jobs.md | BullMQ jobs, email/SMS notifications |
| 10-accessibility.md | Any user-facing UI |
| 11-deployment.md | Render config, environment variables, CI |
| 12-storefront-ux-and-ia.md | Any storefront page, layout, or navigation — the sitemap and page-by-page UX spec |
| 13-listings-cms-inventory-sales.md | Product listing process, content management, inventory tracking, sales reporting |
| 14-checkout-and-fulfilment-timing.md | Checkout flow, mixed-cart timing, non-returnable policy — the fixed-SKU vs. cut-to-length tension |
| 15-delivery-courier-and-location.md | Freight calculation, courier selection, location detection/awareness |

## How these fit with everything else already in the repo

- Roofsteel-Ecommerce-Platform-Specification.docx — the why. Product and architecture reasoning,
  feature-by-feature adoption decisions. Read this if a guideline here references a spec section
  and the reasoning isn't obvious.
- CLAUDE.md — project brief, what's built, what's next, settled facts.
- AGENTS.md — process rules: LoC discipline, PR workflow, when to escalate to a human.
- ROADMAP.md — the live task checklist.
- docs/DEVELOPMENT-LOG.md / docs/DECISIONS.md — what happened and why, chronologically.

These guideline documents don't repeat product reasoning from the spec — they assume you've read
CLAUDE.md and focus purely on how to build it well in this specific codebase.
