# Contributing

Short version, for a human working in this repo. If you're an agent (OpenHands or otherwise),
read AGENTS.md instead — it has the rules this file assumes you already know.

## Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL / REDIS_URL at minimum
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed         # loads the real 171-product catalogue
npm run dev:api             # localhost:4000
npm run dev:web             # localhost:3000
```

## Before you open a PR

```bash
npm run loc:check           # must pass — see AGENTS.md Section 2 for the numbers
```

Update `ROADMAP.md` (check the box) and add one entry to `docs/DEVELOPMENT-LOG.md`. If you made
a real decision along the way — chose a library, changed the schema, deviated from the spec —
add it to `docs/DECISIONS.md` too. The PR template (`.github/PULL_REQUEST_TEMPLATE.md`) walks
through all of this as a checklist.

## Where things are documented

| Question | Where |
|---|---|
| What is this project, what's built so far | `CLAUDE.md` |
| What's next, in what order | `ROADMAP.md` |
| What actually happened, session by session | `docs/DEVELOPMENT-LOG.md` |
| Why a particular choice was made | `docs/DECISIONS.md` |
| Full product/technical reasoning | `Roofsteel-Ecommerce-Platform-Specification.docx` |
| Agentic workflow rules | `AGENTS.md` |

## Code style

ESLint + Prettier configs are in `apps/api/` and `apps/web/` respectively (`.eslintrc.json`,
`.prettierrc`). Run `npm run lint` in either workspace before committing. `.editorconfig` at the
root handles indentation/line-ending consistency across editors.
