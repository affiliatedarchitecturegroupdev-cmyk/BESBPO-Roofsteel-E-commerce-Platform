# AGENTS.md — Operating Rules for Agentic Contributors

This file is for OpenHands (and any other agentic tool working in this repo). If you're a human,
read `CONTRIBUTING.md` instead — it's shorter and assumes you don't need everything spelled out.
`CLAUDE.md` is the project brief (what this is, what's built, what's next). This file is the
*process* — how to work, not what to build.

## 1. Scope check before every task

Roofsteel is a single-vendor B2B/B2C materials platform, not a marketplace. Before building
anything, confirm it's in `ROADMAP.md` or traces to a section of
`Roofsteel-Ecommerce-Platform-Specification.docx`. If a task seems to need a feature the spec
marked DROP or DEFER (Section 3), stop and flag it in the PR description rather than building it
— don't silently re-introduce dropped scope because it seemed like a reasonable thing to add.

**For domain-specific detail beyond this file's process rules, read the relevant document in
`guidelines/`** — start at `guidelines/00-INDEX.md`. That directory is the detailed, per-domain
counterpart to this file: API conventions, database patterns, frontend structure, the
Made-to-Length Configurator's exact constraints, payment integration, pricing engine internals,
testing bar, security/POPIA, notifications, accessibility, and deployment.

## 2. Code discipline

- **250-850 LoC average per logic-bearing file. 1,800 LoC hard cap, no exceptions.**
  Run `npm run loc:check` before opening a PR. A file approaching the cap gets split, not
  compressed — don't strip comments or collapse logic to dodge the number.
- Every module is either real, working logic, or carries an explicit `// SCAFFOLD` comment
  naming the spec section it implements. Never leave a module that looks finished but silently
  does nothing — that's a worse state than an honest stub.
- Before building a feature, check whether the underlying mechanism already exists in the
  codebase. This is not optional politeness — it's caught real duplicate-effort bugs on sister
  platforms (Bellwether SWE Plumbers: confirmed no admin-wide accounts endpoint existed before
  building one; confirmed no bundle-price checkout existed before framing analytics honestly
  around a count instead of fabricating sales data).
- `landedCost` on any `Product` row is a placeholder until `costIsReal` is `true`. Never write
  code that treats a placeholder cost as a real price without that flag being checked.

## 3. Workflow

- **Branch naming:** `phase-<n>/<short-module-name>`, e.g. `phase-2/made-to-length-configurator`.
- **Commit messages:** imperative mood, scoped — `pricing: resolve trade tier from account type`,
  not `updated stuff`.
- **Every PR must:**
  1. Reference the spec section it implements (e.g. "Implements spec Section 4.1").
  2. Pass `npm run loc:check` (wired into CI — a hard-cap violation fails the build).
  3. Include or update tests for any real logic added (see Section 4 below).
  4. Update the relevant checkbox in `ROADMAP.md`.
  5. Add one entry to `docs/DEVELOPMENT-LOG.md` — see Section 6.

## 4. Testing expectations

Business logic (pricing resolution, Made-to-Length validation, freight calculation, order
lifecycle transitions) needs real unit tests — this is where a wrong number costs someone money.
UI scaffolding and simple CRUD endpoints don't need the same bar at this project stage. When in
doubt, test the thing where a bug would be expensive to discover in production, not the thing
that's easiest to test.

## 5. Security rules

- Never commit `.env`, API keys, or the Lulapay/PayFast credentials once they're real —
  `.gitignore` already excludes `.env*`, don't override that.
- Payment gateway integration code goes through the Strategy Pattern interface already specified
  (spec Section 5 / 7.1 of the original blueprint) — don't hardcode a gateway-specific call
  outside that boundary.
- Any new dependency: check it's actively maintained before adding it. This project runs on two
  languages deliberately (Section 2.2 of the spec) — don't pull in a new runtime or language to
  solve a problem the existing stack already handles.

## 6. Recording work — this is not optional

Two files exist specifically so nothing that happens gets lost between sessions:

- **`docs/DEVELOPMENT-LOG.md`** — one dated entry per meaningful unit of work (a PR, a session, a
  bug fix). What changed, why, and the LoC total at that point (from `npm run loc:check`). This
  is the running record of everything done — read it before assuming something hasn't been built
  yet.
- **`docs/DECISIONS.md`** — one entry per real decision that isn't already in the spec: a library
  choice, a schema change, a deviation from the original plan. If you had to think about *why*
  before choosing an approach, that reasoning goes here, not just in a commit message that'll get
  buried.

Both are append-only in practice — add an entry, don't rewrite history that's already there.

## 7. When to stop and ask a human, rather than proceed

- Anything touching real money: payment gateway credentials, actual landed costs replacing
  placeholders, refund logic.
- Anything in Section 8 of the spec ("Open Decisions") that hasn't been resolved yet — check
  `docs/DECISIONS.md` first in case it has been since the spec was written.
- A task that would require dropping the LoC discipline, adding a new language/runtime, or
  reversing a DROP/DEFER decision from spec Section 3 — these are the load-bearing decisions in
  this project, not implementation details.
- Anything where the spec and the actual codebase disagree — flag the conflict, don't silently
  pick one.

Everything else: use judgment, build it, log it, open the PR.
