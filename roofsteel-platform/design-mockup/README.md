# Design Mockup — Storefront UX Validation

Not part of the application build — this is the visual reference the real components in
apps/web/components/ were validated against before being written. See
docs/DEVELOPMENT-LOG.md's 2026-08-09 entry and guidelines/12-storefront-ux-and-ia.md.

- `mockup.html` — open directly in a browser, or re-render with Playwright. Five screens:
  mobile Home, mobile PDP (Made-to-Length Configurator), mobile Cart Drawer, desktop Home,
  desktop PDP.
- `reference-mobile-screens.png` / `reference-desktop-pdp.png` — static screenshots for quick
  reference without re-rendering.
- `tokens.css` — a copy of the real apps/web/app/globals.css tokens at the time this was built.
  If the two drift, globals.css is the source of truth, not this copy.
- `screens_mobile.py` / `screens_desktop.py` — the generator scripts, kept for reference if the
  mockup needs to be regenerated or extended with a new screen (e.g. checkout, account).

If a new page or major component is designed before being built, the same process applies:
mock it here first, screenshot it, validate it, then write the real component against the
validated markup/CSS — don't skip straight to production code for a new UI pattern.
