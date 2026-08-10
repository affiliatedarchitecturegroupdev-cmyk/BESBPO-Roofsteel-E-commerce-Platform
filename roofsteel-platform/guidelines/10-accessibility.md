# Accessibility Guidelines

## The standard: WCAG 2.1 AA, already met on the corporate site — match it here

The corporate site (live on GitHub Pages) already implements every item below. The store is a
separate codebase but the same customer base, and shouldn't be a worse experience for someone
using a screen reader or keyboard-only navigation just because it's a different repo.

## Concrete requirements, not just the label "AA compliant"

- Skip-to-content link as the first focusable element on every page.
- Every interactive element has a visible focus state — never outline: none without a
  replacement that's actually visible against both light and dark backgrounds (Off-White and
  Deep Slate both appear in this platform's UI).
- Colour contrast: text against background meets 4.5:1 minimum. Molten Orange (#E8631C) on
  Off-White or Deep Slate passes; check any new colour combination before using it for text,
  don't assume the brand palette is automatically safe in every pairing (it isn't — Cool Steel
  on Off-White, for instance, is a supporting/secondary colour specifically because it's lower
  contrast, and shouldn't carry body text).
- prefers-reduced-motion respected — any animation (the Made-to-Length configurator's
  live-updating price, a gallery carousel if one gets built for the store) has a reduced-motion
  fallback, matching the corporate site's hero slider and gallery carousel.
- Touch targets minimum 48x48px (guidelines/03-frontend.md) — this is both an accessibility
  requirement and a genuine mobile-usability one for a South African, majority-mobile user base.
- Every meaningful image has real alt text — not alt="" on a product photo, only on genuinely
  decorative elements.

## Forms

Every input has an associated label, not just a placeholder (placeholders disappear on input and
aren't reliably read by screen readers as a label substitute). Error messages are associated
with their field (aria-describedby), not just colour-coded text nearby.

## The Made-to-Length Configurator specifically

This is the platform's most complex interactive component and the one most likely to be built
without accessibility in mind if it's rushed. Length/gauge/profile/colour inputs all need real
labels; the live price update needs an aria-live region so a screen reader user gets the price
change announced, not just a silently-updating number sighted users can see change.

## Testing

Keyboard-only pass (tab through every interactive flow — nav, product browse, add to cart,
checkout — without a mouse) and a screen reader spot-check (VoiceOver or NVDA) on the checkout
flow specifically, since that's the highest-cost place for an accessibility failure to block a
real purchase.
