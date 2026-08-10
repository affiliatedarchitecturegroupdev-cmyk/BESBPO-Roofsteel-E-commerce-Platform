# Deployment & Environments

## Where this runs — decided, see ADR references

Render for apps/web, apps/api, apps/ai-service, the BullMQ worker, plus Render-native managed
PostgreSQL and Redis. Not the group's default AWS/Coolify stack — a deliberate deviation, same
as the sister platform this pattern is drawn from (spec Section 2.1). Don't "fix" this by moving
to AWS without a real reason and a new ADR explaining it.

## Environments

At minimum: development (local, .env), staging (Render, seeded with real catalogue data but no
real customer traffic), production (Render, roofsteel.shop once DNS is pointed at it per
CONTRIBUTING.md/README.md). Staging exists specifically so a Phase 3+ payment integration can be
tested against PayFast/Lulapay/PayJustNow sandbox credentials before anything touches a real
transaction.

## Environment variables

.env.example is the checklist — every variable there needs a real value in Render's environment
settings for staging and production, never committed to the repo. DATABASE_URL and REDIS_URL
come from Render's managed service provisioning directly, not hand-constructed.

## Domain

roofsteel.shop, registered via GoDaddy (see prior work) — point it at the Render web service
once Phase 3 has a working checkout, not before. The corporate site's "Launch Store" buttons
already reference this domain, so it needs to actually resolve to something real before that
button stops being aspirational.

## CI

.github/workflows/ci.yml already runs on every PR: install, Prisma generate, LoC check, lint,
test, build (both api and web). This is the minimum bar — a PR that doesn't pass CI doesn't
merge, full stop. If CI needs to grow (e.g., adding an e2e test stage once checkout exists),
extend this file rather than replacing it.

## Database migrations in deployment

Migrations run as part of the deploy step (Render's release phase), not manually against
production after the fact. prisma migrate deploy (not migrate dev) is the production-safe
command — migrate dev can prompt interactively and isn't meant for a deploy pipeline.

## Rollback

Not yet defined for this project — worth deciding before Phase 3 ships anything transactional
(a bad deploy touching checkout is a much bigger problem than a bad deploy touching the product
catalogue browse pages). At minimum, know how to revert a Render deploy to the previous build
before the first payment-gateway integration goes live anywhere real traffic can reach it.
